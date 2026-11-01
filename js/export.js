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
    function inches(box) {
      return { x: box.x * 10 / 1280, y: box.y * 5.625 / 720, w: Math.max(0.3, box.w * 10 / 1280), h: Math.max(0.25, box.h * 5.625 / 720) };
    }
    PP.state.slides.forEach(function (s, si) {
      var T = PP.effTheme(s);
      var face = fontFace(T.ff);
      var sl = p.addSlide();
      sl.background = { color: hx(T.bg1) };
      if (bgs.get(s)) sl.addImage({ data: bgs.get(s), x: 0, y: 0, w: 10, h: 5.625 });
      if (s.notes) sl.addNotes(s.notes);
      sl.addShape(p.ShapeType.ellipse, { x: 7.4, y: -1.4, w: 4, h: 4, fill: { color: hx(T.a1), transparency: 82 }, line: { type: 'none' } });
      sl.addShape(p.ShapeType.ellipse, { x: -1, y: 4.2, w: 3, h: 3, fill: { color: hx(T.a2), transparency: 85 }, line: { type: 'none' } });
      (s.extras || []).forEach(function (ex) {
        if (ex.kind !== 'shape') return;
        var b = inches(ex);
        var shape = ex.shape === 'ellipse' ? p.ShapeType.ellipse : p.ShapeType.roundRect;
        sl.addShape(shape, { x: b.x, y: b.y, w: b.w, h: b.h, fill: { color: hx(ex.fill || T.a1), transparency: Math.round((1 - (ex.opacity == null ? 1 : ex.opacity)) * 100) }, line: { type: 'none' }, rectRadius: ex.shape === 'pill' ? 0.8 : 0.12 });
      });
      var boxes = PP.activeFrames ? PP.activeFrames(s, si) : null;
      var side = !!s.img && (s.kind === 'title' || s.kind === 'bullets');
      var tw = side ? 5.4 : 8.6;
      if (s.img) {
        var ph = boxes && boxes.photo ? inches(boxes.photo) : null;
        if (ph) sl.addImage({ data: s.img, x: ph.x, y: ph.y, w: ph.w, h: ph.h, sizing: { type: 'cover', w: ph.w, h: ph.h } });
        else sl.addImage({ data: s.img, x: side ? 6.3 : 0, y: 0, w: side ? 3.7 : 10, h: 5.625, sizing: { type: 'cover', w: side ? 3.7 : 10, h: 5.625 }, transparency: side ? 0 : 70 });
      }
      var txt = function (text, o) {
        sl.addText(text, Object.assign({ fontFace: face, color: hx(T.tx), fit: 'shrink' }, o));
      };
      var at = function (key, fallback) {
        return boxes && boxes[key] ? inches(boxes[key]) : fallback;
      };
      if (s.credit) txt(s.credit, { x: .3, y: 5.25, w: 9.4, h: .3, fontSize: 8, color: hx(T.mu) });
      var big = ['title', 'section', 'closing'].indexOf(s.kind) >= 0;
      if (s.kind !== 'quote') {
        var titleBox = at('title', { x: .7, y: big ? 1.6 : .5, w: tw, h: big ? 1.6 : 1 });
        txt(s.title || '', { x: titleBox.x, y: titleBox.y, w: titleBox.w, h: titleBox.h, fontSize: big ? 40 : 26, bold: true, align: s.align === 'center' || s.kind === 'section' || s.kind === 'closing' ? 'center' : 'left' });
      }
      if (s.sub && s.kind !== 'quote' && s.kind !== 'steps') {
        var subBox = at('sub', { x: .7, y: 3.3, w: tw, h: 1 });
        txt(s.sub, { x: subBox.x, y: subBox.y, w: subBox.w, h: subBox.h, fontSize: 18, color: hx(T.mu), align: s.align === 'center' || big ? 'center' : 'left' });
      }
      if (s.kind === 'quote') {
        var quoteBox = at('quote', { x: .9, y: 1.2, w: 8.2, h: 2.6 });
        txt('“' + (s.sub || '') + '”', { x: quoteBox.x, y: quoteBox.y, w: quoteBox.w, h: quoteBox.h, fontSize: 28, italic: true, bold: true });
        if (s.title) {
          var attr = at('attr', { x: .9, y: 4, w: 8, h: .6 });
          txt('— ' + s.title, { x: attr.x, y: attr.y, w: attr.w, h: attr.h, fontSize: 16, color: hx(T.mu) });
        }
      }
      if (s.kind === 'bullets' && s.items) {
        var body = at('body', { x: .7, y: 1.7, w: tw, h: 3.4 });
        txt(s.items.map(function (t) { return { text: t, options: { bullet: true, breakLine: true, paraSpaceAfter: 10 } }; }), { x: body.x, y: body.y, w: body.w, h: body.h, fontSize: 18, valign: 'top' });
      }
      if (s.kind === 'steps' && s.items) {
        var stepBox = at('steps', { x: .7, y: 1.55, w: tw, h: 3.5 });
        s.items.forEach(function (t, k) {
          var hh = stepBox.h / Math.max(s.items.length, 1);
          txt(String(k + 1), { x: stepBox.x, y: stepBox.y + k * hh, w: .45, h: Math.max(.3, hh), fontSize: 18, bold: true, color: hx(T.a1) });
          txt(t, { x: stepBox.x + .5, y: stepBox.y + k * hh, w: Math.max(.4, stepBox.w - .55), h: Math.max(.3, hh), fontSize: 16 });
        });
      }
      if (s.kind === 'chart' && s.stats) {
        var chartBox = at('chart', { x: .7, y: 1.55, w: 8.6, h: 3.6 });
        sl.addChart('bar', [{
          name: s.title || 'Chart',
          labels: s.stats.map(function (x) { return x.l; }),
          values: s.stats.map(function (x) { return Math.max(0, Number(String(x.v).replace(/[^0-9.-]/g, '')) || 0); })
        }], {
          x: chartBox.x, y: chartBox.y, w: chartBox.w, h: chartBox.h, showLegend: false, showValue: true,
          chartColors: [hx(T.a1)], catAxisLabelColor: hx(T.tx), valAxisLabelColor: hx(T.mu),
          showTitle: false, showCatName: false, showValAxisTitle: false, showCatAxisTitle: false
        });
      } else if (s.kind === 'stats' && s.stats) {
        var statBox = at('stats', { x: .7, y: 1.8, w: 8.6, h: 3 });
        var col = statBox.w / s.stats.length;
        s.stats.forEach(function (x, k) {
          txt(x.v, { x: statBox.x + k * col, y: statBox.y, w: Math.max(.3, col - .12), h: statBox.h * .55, fontSize: 32, bold: true, color: hx(T.a1) });
          txt(x.l, { x: statBox.x + k * col, y: statBox.y + statBox.h * .55, w: Math.max(.3, col - .12), h: statBox.h * .4, fontSize: 14, color: hx(T.mu), valign: 'top' });
        });
      }
      (s.extras || []).forEach(function (ex) {
        if (ex.kind !== 'text') return;
        var b = inches(ex);
        txt(ex.text || '', { x: b.x, y: b.y, w: b.w, h: b.h, fontSize: Math.max(10, Math.round((ex.size || 32) * .55)), bold: ex.weight !== 400, color: hx(ex.color || T.tx), align: ex.align || 'left', valign: 'middle' });
      });
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
