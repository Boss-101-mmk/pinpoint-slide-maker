/* PowerPoint and print-to-PDF export. The PowerPoint library loads on first use. */
(function (root) {
  'use strict';
  var PP = root.PP || (root.PP = {});
  var pptxPromise = null;

  function loadPptx() {
    if (typeof PptxGenJS !== 'undefined') return Promise.resolve();
    if (!pptxPromise) {
      pptxPromise = PP.loadScript('pptxgen.bundle.js').then(function () {
        if (typeof PptxGenJS === 'undefined') throw new Error('Export library failed to load.');
      }).catch(function (e) { pptxPromise = null; throw e; });
    }
    return pptxPromise;
  }

  function fontFace(name) {
    if (name === 'Fraunces') return 'Georgia';
    if (name === 'DM Sans') return 'Calibri';
    return 'Arial';
  }

  PP.buildPptx = async function () {
    await loadPptx();
    var hx = function (c) { return String(c || '#000000').replace('#', ''); };
    var p = new PptxGenJS();
    p.layout = 'LAYOUT_16x9';
    p.title = 'PinPoint presentation';
    var bgs = new Map();
    for (var s0 of PP.state.slides) {
      if (PP.bgOk(s0)) {
        try { bgs.set(s0, await PP.rasterBg(s0, PP.effTheme(s0))); } catch (e) { PP.log(e); }
      }
    }
    PP.state.slides.forEach(function (s) {
      var T = PP.effTheme(s);
      var face = fontFace(T.ff);
      var sl = p.addSlide();
      sl.background = { color: hx(T.bg1) };
      if (bgs.get(s)) sl.addImage({ data: bgs.get(s), x: 0, y: 0, w: 10, h: 5.625 });
      if (s.notes) sl.addNotes(s.notes);
      sl.addShape(p.ShapeType.ellipse, { x: 7.4, y: -1.4, w: 4, h: 4, fill: { color: hx(T.a1), transparency: 82 }, line: { type: 'none' } });
      sl.addShape(p.ShapeType.ellipse, { x: -1, y: 4.2, w: 3, h: 3, fill: { color: hx(T.a2), transparency: 85 }, line: { type: 'none' } });
      var side = !!s.img && (s.kind === 'title' || s.kind === 'bullets');
      var tw = side ? 5.4 : 8.6;
      if (s.img) {
        sl.addImage({
          data: s.img,
          x: side ? 6.3 : 0, y: 0, w: side ? 3.7 : 10, h: 5.625,
          sizing: { type: 'cover', w: side ? 3.7 : 10, h: 5.625 },
          transparency: side ? 0 : 70
        });
      }
      var txt = function (text, o) {
        sl.addText(text, Object.assign({ fontFace: face, color: hx(T.tx), fit: 'shrink' }, o));
      };
      if (s.credit) txt(s.credit, { x: .3, y: 5.25, w: 9.4, h: .3, fontSize: 8, color: hx(T.mu) });
      var big = ['title', 'section', 'closing'].indexOf(s.kind) >= 0;
      if (s.kind !== 'quote') txt(s.title || '', { x: .7, y: big ? 1.6 : .5, w: tw, h: big ? 1.6 : 1, fontSize: big ? 44 : 30, bold: true });
      if (s.sub && s.kind !== 'quote' && s.kind !== 'steps') txt(s.sub, { x: .7, y: 3.3, w: tw, h: 1, fontSize: 20, color: hx(T.mu) });
      if (s.kind === 'quote') {
        txt('“' + (s.sub || '') + '”', { x: .9, y: 1.2, w: 8.2, h: 2.6, fontSize: 32, italic: true, bold: true });
        if (s.title) txt('— ' + s.title, { x: .9, y: 4, w: 8, h: .6, fontSize: 18, color: hx(T.mu) });
      }
      if (s.kind === 'bullets' && s.items) {
        txt(s.items.map(function (t) { return { text: t, options: { bullet: true, breakLine: true, paraSpaceAfter: 12 } }; }), { x: .7, y: 1.7, w: tw, h: 3.4, fontSize: 20, valign: 'top' });
      }
      if (s.kind === 'steps' && s.items) {
        s.items.forEach(function (t, k) {
          var y = 1.55 + k * (3.5 / Math.max(s.items.length, 1));
          txt(String(k + 1), { x: .7, y: y, w: .45, h: .4, fontSize: 18, bold: true, color: hx(T.a1) });
          txt(t, { x: 1.25, y: y, w: tw - .7, h: .45, fontSize: 16 });
        });
      }
      if (s.kind === 'chart' && s.stats) {
        sl.addChart('bar', [{
          name: s.title || 'Chart',
          labels: s.stats.map(function (x) { return x.l; }),
          values: s.stats.map(function (x) { return Math.max(0, Number(String(x.v).replace(/[^0-9.-]/g, '')) || 0); })
        }], {
          x: .7, y: 1.55, w: 8.6, h: 3.6, showLegend: false, showValue: true,
          chartColors: [hx(T.a1)], catAxisLabelColor: hx(T.tx), valAxisLabelColor: hx(T.mu),
          showTitle: false, showCatName: false, showValAxisTitle: false, showCatAxisTitle: false
        });
      } else if (s.kind === 'stats' && s.stats) {
        var w = 8.6 / s.stats.length;
        s.stats.forEach(function (x, k) {
          txt(x.v, { x: .7 + k * w, y: 2, w: w - .2, h: 1.2, fontSize: 36, bold: true, color: hx(T.a1) });
          txt(x.l, { x: .7 + k * w, y: 3.25, w: w - .2, h: 1, fontSize: 14, color: hx(T.mu), valign: 'top' });
        });
      }
      if (PP.state.brand && (PP.state.brand.logo || PP.state.brand.name)) {
        if (PP.state.brand.logo) sl.addImage({ data: PP.state.brand.logo, x: 8.75, y: .18, w: .9, h: .5, sizing: { type: 'contain', w: .9, h: .5 } });
        else txt(PP.state.brand.name, { x: 7.5, y: .22, w: 2.1, h: .35, fontSize: 12, bold: true, color: hx(T.a1), align: 'right' });
      }
    });
    return p.write('arraybuffer');
  };

  function fileTitle() {
    return (PP.state.slides[0]?.title || 'PinPoint presentation').normalize('NFKD').replace(/[^\w -]/g, '').trim().replace(/\s+/g, ' ').slice(0, 70) || 'PinPoint presentation';
  }

  PP.exportPptx = async function () {
    var btn = PP.$('export');
    var label = btn ? btn.textContent : '';
    try {
      if (!PP.state.slides.length) return PP.toast('Build a presentation first.');
      if (btn) { btn.disabled = true; btn.textContent = 'Preparing…'; }
      var title = fileTitle();
      var filename = title.toLowerCase().endsWith('.pptx') ? title : title + '.pptx';
      var saveHandle = null;
      if (!window.claude && typeof window.showSaveFilePicker === 'function') {
        try {
          saveHandle = await window.showSaveFilePicker({
            suggestedName: filename,
            types: [{ description: 'PowerPoint presentation', accept: { 'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'] } }]
          });
        } catch (e) {
          if (e.name === 'AbortError') { PP.toast('Download cancelled.'); return; }
          PP.log(e);
        }
      }
      if (btn) btn.textContent = 'Building…';
      var data = await PP.buildPptx();
      var blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
      var dl = window.claude && typeof window.claude.use === 'function' ? await window.claude.use('downloads') : null;
      if (dl) await dl.save({ filename: filename, data: data });
      else if (saveHandle) {
        var stream = await saveHandle.createWritable();
        await stream.write(blob);
        await stream.close();
      } else {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url; a.download = filename; a.style.display = 'none';
        document.body.append(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
      }
      PP.toast('Saved ' + filename + ' to this device.', true);
    } catch (e) {
      PP.log(e);
      if (!e || e.code !== 'declined') PP.toast(e && e.message ? e.message : 'Could not build the PowerPoint file.');
    } finally {
      if (btn) { btn.disabled = !PP.state.slides.length; btn.textContent = label || 'Download .pptx'; }
    }
  };

  function escAttr(s) {
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  PP.exportPdf = async function () {
    if (!PP.state.slides.length) return PP.toast('Build a presentation first.');
    var w = window.open('', '_blank');
    if (!w) return PP.toast('Allow the print window to open, then save as PDF.');
    var css = '';
    try {
      var r = await fetch(new URL('css/app.css', location.href));
      if (r.ok) css = await r.text();
    } catch (e) { PP.log(e); }
    var pages = PP.state.slides.map(function (s, i) {
      return '<section class="pdf-page">' + PP.buildSlide(s, i, false, false).outerHTML + '</section>';
    }).join('');
    var base = escAttr(location.href.replace(/[^/]*$/, ''));
    var printCss = 'html,body{margin:0;padding:0;background:#fff}.pdf-page{width:13.333in;height:7.5in;overflow:hidden;page-break-after:always;break-after:page;position:relative}.pdf-page .slide{position:absolute;left:0;top:0;width:1280px;height:720px;transform:scale(.96);transform-origin:top left}.pdf-page .foot{display:block}@page{size:13.333in 7.5in;margin:0}@media print{*{ -webkit-print-color-adjust:exact;print-color-adjust:exact}}';
    w.document.open();
    w.document.write('<!doctype html><html><head><meta charset="utf-8"><base href="' + base + '"><title>PinPoint presentation</title><link rel="stylesheet" href="css/app.css"><style>' + css.replace(/<\/style/gi, '<\\/style') + '</style><style>' + printCss + '</style></head><body>' + pages + '</body></html>');
    w.document.close();
    w.focus();
    setTimeout(function () { w.print(); PP.toast('Use Save as PDF in the print dialog.', true); }, 700);
  };

  PP.initExport = function () {
    PP.$('export').addEventListener('click', function () { PP.exportPptx(); });
    PP.$('exportPdf').addEventListener('click', function () { PP.exportPdf(); });
  };
})(typeof window !== 'undefined' ? window : globalThis);
