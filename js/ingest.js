/* File checks, text extraction, and the notes-to-slides parser. */
(function (root) {
  'use strict';
  var PP = root.PP || (root.PP = {});

  PP.Sec = {
    clean: function (s) {
      return String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u200B-\u200F\u202A-\u202E]/g, '').slice(0, PP.CFG.MAX_CHARS);
    },
    check: async function (f) {
      var ext = (f.name.split('.').pop() || '').toLowerCase();
      if (['docx', 'pdf', 'txt', 'md'].indexOf(ext) < 0) throw new Error('Unsupported file type. Use .docx, .pdf, .txt or .md.');
      if (f.size > PP.CFG.MAX_BYTES) throw new Error('File is larger than 10 MB.');
      var h = new Uint8Array(await f.slice(0, 1024).arrayBuffer());
      var s = String.fromCharCode.apply(null, h.slice(0, 4));
      if (ext === 'docx' && s !== 'PK\x03\x04') throw new Error('This is not a real .docx file.');
      if (ext === 'pdf' && s !== '%PDF') throw new Error('This is not a real PDF file.');
      if ((ext === 'txt' || ext === 'md') && h.indexOf(0) >= 0) throw new Error('This is not a text file.');
      return ext;
    }
  };

  PP.Extract = {
    txt: function (f) { return f.text(); },
    md: function (f) { return f.text(); },
    docx: async function (f) {
      await PP.loadScript('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js');
      if (typeof mammoth === 'undefined') throw new Error('Word reader failed to load. Check your connection.');
      var r = await mammoth.convertToHtml({ arrayBuffer: await f.arrayBuffer() });
      var doc = new DOMParser().parseFromString(r.value, 'text/html');
      var out = [];
      for (var n of doc.body.children) {
        var t = n.textContent.trim();
        if (!t) continue;
        if (/^H[1-6]$/.test(n.tagName)) out.push('', '# ' + t);
        else if (/^[UO]L$/.test(n.tagName)) n.querySelectorAll('li').forEach(function (li) { out.push('- ' + li.textContent.trim()); });
        else out.push('', t);
      }
      return out.join('\n');
    },
    pdf: async function (f) {
      await PP.loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js');
      if (typeof pdfjsLib === 'undefined') throw new Error('PDF reader failed to load. Check your connection.');
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
      var pdf = await pdfjsLib.getDocument({ data: new Uint8Array(await f.arrayBuffer()), isEvalSupported: false }).promise;
      var out = [];
      for (var p = 1; p <= Math.min(pdf.numPages, 60); p++) {
        var c = await (await pdf.getPage(p)).getTextContent();
        var cur = '', y = null;
        for (var it of c.items) {
          var ty = it.transform[5];
          if (y !== null && Math.abs(ty - y) > 2) {
            out.push(cur);
            cur = '';
            if (Math.abs(ty - y) > 18) out.push('');
          }
          cur += it.str;
          y = ty;
        }
        out.push(cur, '');
      }
      return out.join('\n');
    }
  };

  /* A leading number is enough. A unit such as %, x, or k is optional. */
  PP.NUM = /^([$€£]?\s?\d[\d,.]*(?:\s?(?:%|[kKmMbB]\b|\+|x))?)\s+(.+)$/;

  PP.Parse = {
    run: function (raw) {
      var blocks = [], cur = [];
      PP.Sec.clean(raw).replace(/\r/g, '').split('\n').map(function (x) { return x.trim(); }).forEach(function (l) {
        if (l) cur.push(l);
        else if (cur.length) { blocks.push(cur); cur = []; }
      });
      if (cur.length) blocks.push(cur);
      var slides = [], s = null;
      var isHead = function (l) {
        return /^#{1,3}\s/.test(l) || (l.length <= 70 && !/[.:;,!?]$/.test(l) && !/^([-*•▪–>"]|\d+[.)])/.test(l));
      };
      blocks.forEach(function (b) {
        var lines = b;
        if (/^(>|"|“)/.test(b[0])) { s = { title: '', items: [] }; slides.push(s); }
        else if (isHead(b[0]) && (b.length > 1 || blocks.length > 1)) {
          s = { title: b[0].replace(/^#+\s*/, ''), items: [] };
          slides.push(s);
          lines = b.slice(1);
        } else if (!s) { s = { title: 'Overview', items: [] }; slides.push(s); }
        lines.forEach(function (l) { PP.Parse.add(s, l); });
      });
      return PP.Parse.finish(slides);
    },
    add: function (s, l) {
      var q = /^(>|"|“)/.test(l);
      var t = l.replace(/^([-*•▪–>]|\d+[.)])\s+/, '').replace(/^["“]|["”]$/g, '');
      var parts = t.length > PP.CFG.MAX_LEN + 10 ? t.split(/(?<=[.!?])\s+/) : [t];
      parts.forEach(function (p) {
        if (p.trim()) s.items.push({ text: p.length > PP.CFG.MAX_LEN ? p.slice(0, PP.CFG.MAX_LEN - 1) + '…' : p, quote: q });
      });
    },
    finish: function (slides) {
      var out = [];
      slides.forEach(function (s, i) {
        if (i === 0) {
          out.push({ kind: 'title', title: s.title, sub: s.items[0]?.text || '' });
          if (s.items.length > 1) s = { title: 'Overview', items: s.items.slice(1) };
          else return;
        }
        if (!s.items.length) return out.push({ kind: 'section', title: s.title });
        if (s.items.length === 1 && s.items[0].quote) return out.push({ kind: 'quote', title: s.title, sub: s.items[0].text });
        var st = s.items.slice(0, 4).map(function (x) { return x.text.match(PP.NUM); });
        if (s.items.length >= 2 && s.items.length <= 4 && st.every(Boolean)) {
          return out.push({ kind: 'stats', title: s.title, stats: st.map(function (m) { return { v: m[1], l: m[2] }; }) });
        }
        if (s.items.length >= 3 && s.items.length <= 5 && /timeline|roadmap|process|how it works|steps|journey|phase|agenda/i.test(s.title)) {
          return out.push({ kind: 'steps', title: s.title, items: s.items.map(function (x) { return x.text; }) });
        }
        for (var k = 0; k < s.items.length; k += PP.CFG.MAX_BULLETS) {
          out.push({
            kind: 'bullets',
            title: s.title + (k ? ' (cont.)' : ''),
            items: s.items.slice(k, k + PP.CFG.MAX_BULLETS).map(function (x) { return x.text; })
          });
        }
      });
      var last = out[out.length - 1];
      if (last && out.length > 1 && /thank|question|contact|next step|conclusion/i.test(last.title)) {
        last.kind = 'closing';
        last.sub = (last.items || []).join('  ·  ');
        delete last.items;
      }
      PP.log('parsed', out);
      return out.slice(0, PP.CFG.MAX_SLIDES);
    }
  };

  PP.onFile = async function (f) {
    try {
      PP.toast('Reading file…');
      var ext = await PP.Sec.check(f);
      PP.$('txt').value = PP.Sec.clean(await PP.Extract[ext](f));
      PP.generate();
      PP.toast();
    } catch (e) {
      PP.log(e);
      PP.toast(e.message || 'Could not read that file.');
    }
  };

  PP.initIngest = function () {
    var drop = PP.$('drop');
    drop.addEventListener('click', function () { PP.$('file').click(); });
    drop.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); PP.$('file').click(); }
    });
    PP.$('file').addEventListener('change', function (e) {
      if (e.target.files[0]) PP.onFile(e.target.files[0]);
    });
    ['dragover', 'dragleave', 'drop'].forEach(function (ev) {
      drop.addEventListener(ev, function (e) {
        e.preventDefault();
        drop.classList.toggle('over', ev === 'dragover');
        if (ev === 'drop' && e.dataTransfer.files[0]) PP.onFile(e.dataTransfer.files[0]);
      });
    });
  };
})(typeof window !== 'undefined' ? window : globalThis);
