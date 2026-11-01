/* Design canvas: move, resize, and add objects on the slide. Positions are saved and exported. */
(function (root) {
  'use strict';
  var PP = root.PP || (root.PP = {});
  var KEYS = ['title', 'sub', 'body', 'quote', 'attr', 'steps', 'stats', 'chart', 'photo'];

  PP.clampBox = function (b) {
    if (!b) return null;
    var x = +b.x, y = +b.y, w = +b.w, h = +b.h;
    if (![x, y, w, h].every(function (n) { return Number.isFinite(n); })) return null;
    return {
      x: Math.max(-400, Math.min(1500, Math.round(x))),
      y: Math.max(-400, Math.min(1000, Math.round(y))),
      w: Math.max(36, Math.min(1500, Math.round(w))),
      h: Math.max(24, Math.min(1000, Math.round(h)))
    };
  };

  PP.sanitizeFrames = function (raw) {
    if (!raw || typeof raw !== 'object') return null;
    var out = {};
    KEYS.forEach(function (k) {
      var box = PP.clampBox(raw[k]);
      if (box) out[k] = box;
    });
    return Object.keys(out).length ? out : null;
  };

  PP.sanitizeExtras = function (raw) {
    if (!Array.isArray(raw)) return [];
    return raw.slice(0, 24).map(function (ex) {
      if (!ex || (ex.kind !== 'text' && ex.kind !== 'shape')) return null;
      var box = PP.clampBox(ex);
      if (!box) return null;
      var id = String(ex.id || '').replace(/[^\w-]/g, '').slice(0, 16);
      if (!id) return null;
      var o = { id: id, kind: ex.kind, x: box.x, y: box.y, w: box.w, h: box.h, z: Math.max(1, Math.min(30, Math.round(+ex.z || 4))) };
      if (ex.kind === 'shape') {
        o.shape = ['rect', 'ellipse', 'pill', 'round'].indexOf(ex.shape) >= 0 ? ex.shape : 'round';
        o.fill = PP.HEX.test(ex.fill || '') ? ex.fill : '#3ee0b0';
        o.opacity = Math.max(0.15, Math.min(1, +ex.opacity || 1));
      } else {
        o.text = PP.Sec ? PP.Sec.clean(ex.text || '').slice(0, 240) : String(ex.text || 'Text').slice(0, 240);
        if (!o.text) o.text = 'Text';
        o.color = PP.HEX.test(ex.color || '') ? ex.color : '#ffffff';
        o.size = Math.max(12, Math.min(120, Math.round(+ex.size || 36)));
        o.weight = +ex.weight === 400 ? 400 : 700;
        o.align = ['left', 'center', 'right'].indexOf(ex.align) >= 0 ? ex.align : 'left';
      }
      return o;
    }).filter(Boolean);
  };

  PP.defaultFrames = function (s, idx) {
    var flip = idx % 2 === 1 && s.kind === 'bullets';
    var wide = ['title', 'bullets'].indexOf(s.kind) < 0;
    var x = flip ? 500 : 80;
    var textW = wide ? 1120 : 680;
    var big = s.kind === 'title' || s.kind === 'section' || s.kind === 'closing';
    var frames = {};
    if (s.kind !== 'quote') {
      frames.title = big
        ? { x: wide ? 80 : x, y: s.kind === 'title' ? 118 : 200, w: wide ? 1120 : textW, h: s.kind === 'title' ? 360 : 200 }
        : { x: x, y: 64, w: textW, h: 120 };
    }
    if (s.sub && s.kind !== 'quote' && s.kind !== 'steps') {
      frames.sub = big
        ? { x: wide ? 120 : x, y: s.kind === 'title' ? 490 : 450, w: wide ? 1040 : textW, h: 130 }
        : { x: x, y: 188, w: textW, h: 72 };
    }
    if (s.kind === 'quote') {
      frames.quote = { x: 90, y: 110, w: 1080, h: 390 };
      if (s.title) frames.attr = { x: 90, y: 520, w: 860, h: 80 };
    }
    if (s.kind === 'bullets' && s.items) frames.body = { x: x, y: 210, w: textW, h: 450 };
    if (s.kind === 'steps' && s.items) frames.steps = { x: 64, y: 170, w: 1150, h: 480 };
    if (s.kind === 'stats' && s.stats) frames.stats = { x: 48, y: 200, w: 1184, h: 430 };
    if (s.kind === 'chart' && s.stats) frames.chart = { x: 64, y: 160, w: 1150, h: 490 };
    if (s.img && !wide) frames.photo = { x: flip ? 0 : 800, y: 0, w: 480, h: 720 };
    return frames;
  };

  PP.activeFrames = function (s, idx) {
    var base = PP.defaultFrames(s, idx);
    var saved = s.frames || {};
    var out = {};
    Object.keys(base).forEach(function (k) {
      out[k] = saved[k] ? (PP.clampBox(saved[k]) || base[k]) : base[k];
    });
    return out;
  };

  PP.hasCustomLayout = function (s) {
    return !!((s.frames && Object.keys(s.frames).length) || (s.extras && s.extras.length));
  };

  function slideScale(node) {
    var slide = node.closest ? node.closest('.slide') : null;
    if (!slide) return 1;
    var m = getComputedStyle(slide).transform;
    if (!m || m === 'none') return 1;
    var a = m.match(/matrix\(([-0-9.eE+]+)/);
    var sc = a ? parseFloat(a[1]) : 1;
    return sc || 1;
  }

  function applyBox(node, box) {
    node.style.left = box.x + 'px';
    node.style.top = box.y + 'px';
    node.style.width = box.w + 'px';
    node.style.height = box.h + 'px';
  }

  function readBox(node) {
    return {
      x: parseFloat(node.style.left) || 0,
      y: parseFloat(node.style.top) || 0,
      w: parseFloat(node.style.width) || 80,
      h: parseFloat(node.style.height) || 40
    };
  }

  function extraById(s, id) {
    return (s.extras || []).filter(function (ex) { return ex.id === id; })[0] || null;
  }

  function writeBox(s, frame, box) {
    box = PP.clampBox(box);
    if (!box || !s || !frame) return;
    if (frame.dataset.key) {
      if (!s.frames) s.frames = {};
      s.frames[frame.dataset.key] = box;
    } else {
      var ex = extraById(s, frame.dataset.extra);
      if (ex) { ex.x = box.x; ex.y = box.y; ex.w = box.w; ex.h = box.h; }
    }
    applyBox(frame, box);
  }

  function showGuides(slide, vx, vy) {
    var gx = slide.querySelector(':scope > .guide-y');
    var gy = slide.querySelector(':scope > .guide-x');
    if (!gx) {
      gx = PP.el('div', 'guide-y');
      gy = PP.el('div', 'guide-x');
      slide.append(gx, gy);
    }
    gx.hidden = vx == null;
    gy.hidden = vy == null;
    if (vx != null) gx.style.left = vx + 'px';
    if (vy != null) gy.style.top = vy + 'px';
  }

  function hideGuides(slide) {
    if (!slide) return;
    slide.querySelectorAll(':scope > .guide-x, :scope > .guide-y').forEach(function (n) { n.remove(); });
  }

  PP.snapBox = function (box, frame) {
    var slide = frame.closest('.slide');
    var xs = [80, 640, 1200];
    var ys = [64, 360, 640];
    slide.querySelectorAll('.frame').forEach(function (other) {
      if (other === frame) return;
      var b = readBox(other);
      xs.push(b.x, b.x + b.w / 2, b.x + b.w);
      ys.push(b.y, b.y + b.h / 2, b.y + b.h);
    });
    var x = box.x, y = box.y, gx = null, gy = null;
    function snapAxis(pos, size, targets) {
      var edges = [pos, pos + size / 2, pos + size];
      var best = null;
      targets.forEach(function (t) {
        edges.forEach(function (edge, i) {
          var d = Math.abs(edge - t);
          if (d <= 8 && (!best || d < best.d)) best = { d: d, i: i, t: t };
        });
      });
      if (!best) return { pos: pos, guide: null };
      var next = best.i === 0 ? best.t : best.i === 1 ? best.t - size / 2 : best.t - size;
      return { pos: Math.round(next), guide: best.t };
    }
    var sx = snapAxis(box.x, box.w, xs);
    var sy = snapAxis(box.y, box.h, ys);
    x = sx.pos; y = sy.pos; gx = sx.guide; gy = sy.guide;
    showGuides(slide, gx, gy);
    return { x: x, y: y, w: box.w, h: box.h };
  };

  function paintSelection(frame) {
    document.querySelectorAll('#stage .frame.selected').forEach(function (n) {
      n.classList.remove('selected');
      n.querySelectorAll(':scope > .handle').forEach(function (h) { h.remove(); });
    });
    if (!frame) {
      var bar = PP.$('formatBar');
      if (bar) bar.hidden = true;
      return;
    }
    frame.classList.add('selected');
    ['nw', 'ne', 'sw', 'se'].forEach(function (dir) {
      var h = PP.el('span', 'handle ' + dir);
      h.dataset.dir = dir;
      frame.append(h);
      h.addEventListener('pointerdown', function (e) {
        e.stopPropagation();
        e.preventDefault();
        startResize(e, frame);
      });
    });
    var bar = PP.$('formatBar');
    if (bar) bar.hidden = false;
    var s = PP.sel();
    var color = PP.$('fmtColor');
    if (s && color) {
      var ex = frame.dataset.extra ? extraById(s, frame.dataset.extra) : null;
      var T = PP.effTheme(s);
      color.value = ex ? (ex.kind === 'shape' ? ex.fill : ex.color) : (PP.HEX.test(s.tx || '') ? s.tx : T.tx);
    }
  }

  PP.clearCanvasSel = function () {
    PP.canvasSel = null;
    paintSelection(null);
  };

  function remember(frame) {
    PP.canvasSel = frame.dataset.extra ? { id: frame.dataset.extra } : { key: frame.dataset.key };
  }

  PP.decorateSelection = function () {
    var sel = PP.canvasSel;
    var stage = PP.$('stage');
    if (!sel || !stage || !PP.state.edit) { paintSelection(null); return; }
    var frame = sel.id
      ? stage.querySelector('.frame[data-extra="' + sel.id + '"]')
      : stage.querySelector('.frame[data-key="' + sel.key + '"]');
    paintSelection(frame || null);
    if (!frame) PP.canvasSel = null;
  };

  function targetStore(frame) {
    var s = PP.sel();
    return s;
  }

  PP.wireFrame = function (frame) {
    frame.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 || (e.target.closest && e.target.closest('.handle'))) return;
      var selected = frame.classList.contains('selected');
      var onText = e.target.closest && e.target.closest('[contenteditable]');
      if (!selected) {
        e.preventDefault();
        remember(frame);
        paintSelection(frame);
      }
      e.stopPropagation();
      var origin = readBox(frame);
      var sx = e.clientX, sy = e.clientY, moved = false, sc = slideScale(frame);
      function move(ev) {
        var dx = (ev.clientX - sx) / sc, dy = (ev.clientY - sy) / sc;
        if (!moved && Math.hypot(dx, dy) < 4) return;
        if (!moved) {
          moved = true;
          PP.snapshot();
          if (onText && document.activeElement && frame.contains(document.activeElement)) document.activeElement.blur();
        }
        ev.preventDefault();
        var box = PP.snapBox({ x: origin.x + dx, y: origin.y + dy, w: origin.w, h: origin.h }, frame);
        writeBox(PP.sel(), frame, box);
      }
      function up() {
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
        document.removeEventListener('pointercancel', up);
        hideGuides(frame.closest('.slide'));
        if (!moved) return;
        remember(frame);
        if (PP.scheduleAutosave) PP.scheduleAutosave();
        PP.strip();
      }
      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', up);
      document.addEventListener('pointercancel', up);
    });
  };

  function startResize(e, frame) {
    PP.snapshot();
    var origin = readBox(frame);
    var sx = e.clientX, sy = e.clientY, sc = slideScale(frame), dir = e.currentTarget.dataset.dir;
    var ratio = origin.w / origin.h;
    function move(ev) {
      var dx = (ev.clientX - sx) / sc, dy = (ev.clientY - sy) / sc;
      var box = { x: origin.x, y: origin.y, w: origin.w, h: origin.h };
      if (dir.indexOf('e') >= 0) box.w = origin.w + dx;
      if (dir.indexOf('s') >= 0) box.h = origin.h + dy;
      if (dir.indexOf('w') >= 0) { box.x = origin.x + dx; box.w = origin.w - dx; }
      if (dir.indexOf('n') >= 0) { box.y = origin.y + dy; box.h = origin.h - dy; }
      if (ev.shiftKey && ratio) {
        if (dir.indexOf('e') >= 0 || dir.indexOf('w') >= 0) box.h = box.w / ratio;
        else box.w = box.h * ratio;
      }
      writeBox(targetStore(frame), frame, box);
    }
    function up() {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      if (PP.scheduleAutosave) PP.scheduleAutosave();
      PP.strip();
    }
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
  }

  function currentFrame() {
    var sel = PP.canvasSel;
    var stage = PP.$('stage');
    if (!sel || !stage) return null;
    return sel.id
      ? stage.querySelector('.frame[data-extra="' + sel.id + '"]')
      : stage.querySelector('.frame[data-key="' + sel.key + '"]');
  }

  PP.nudgeSelection = function (dx, dy) {
    if (!PP.state.edit || !PP.canvasSel) return false;
    var frame = currentFrame();
    var s = PP.sel();
    if (!frame || !s) return false;
    if (!PP._nudgeSnap) { PP.snapshot(); PP._nudgeSnap = true; clearTimeout(PP._nudgeTimer); PP._nudgeTimer = setTimeout(function () { PP._nudgeSnap = false; if (PP.scheduleAutosave) PP.scheduleAutosave(); PP.strip(); }, 400); }
    var box = readBox(frame);
    writeBox(s, frame, { x: box.x + dx, y: box.y + dy, w: box.w, h: box.h });
    return true;
  };

  PP.deleteSelection = function () {
    var sel = PP.canvasSel;
    var s = PP.sel();
    if (!sel || !s) return;
    PP.snapshot();
    if (sel.id) s.extras = (s.extras || []).filter(function (ex) { return ex.id !== sel.id; });
    else if (s.frames) {
      delete s.frames[sel.key];
      if (!Object.keys(s.frames).length) delete s.frames;
    }
    PP.clearCanvasSel();
    PP.show(PP.state.i);
  };

  PP.duplicateSelection = function () {
    var sel = PP.canvasSel;
    var s = PP.sel();
    if (!sel || !sel.id || !s) return false;
    var ex = extraById(s, sel.id);
    if (!ex) { PP.toast('Select an added text box or shape to duplicate it.'); return false; }
    if ((s.extras || []).length >= 24) return false;
    PP.snapshot();
    var copy = JSON.parse(JSON.stringify(ex));
    copy.id = 'x' + Math.random().toString(36).slice(2, 8);
    copy.x += 28;
    copy.y += 28;
    s.extras.push(copy);
    PP.canvasSel = { id: copy.id };
    PP.show(PP.state.i);
    return true;
  };

  function newId() { return 'x' + Math.random().toString(36).slice(2, 8); }

  function freeSpot(s, w, h) {
    var boxes = [];
    var frames = PP.activeFrames(s, PP.state.i);
    Object.keys(frames).forEach(function (k) { boxes.push(frames[k]); });
    (s.extras || []).forEach(function (ex) { boxes.push(ex); });
    if (['title', 'bullets'].indexOf(s.kind) >= 0 && !s.img) {
      var flip = PP.state.i % 2 === 1 && s.kind === 'bullets';
      boxes.push(flip ? { x: 0, y: 0, w: 500, h: 720 } : { x: 780, y: 0, w: 500, h: 720 });
    }
    var best = { x: 80, y: 36, score: -1 };
    var y, x;
    for (y = 20; y <= 720 - h - 16; y += 16) {
      for (x = 20; x <= 1280 - w - 16; x += 16) {
        var overlap = 0;
        boxes.forEach(function (b) {
          var iw = Math.max(0, Math.min(x + w, b.x + b.w) - Math.max(x, b.x));
          var ih = Math.max(0, Math.min(y + h, b.y + b.h) - Math.max(y, b.y));
          overlap += iw * ih;
        });
        var score = (w * h - overlap) - y * 0.15;
        if (score > best.score) best = { x: x, y: y, score: score };
      }
    }
    return best;
  }

  PP.addCanvasObject = function (kind) {
    var s = PP.sel();
    if (!s) return PP.toast('Build a presentation first.');
    if ((s.extras || []).length >= 24) return PP.toast('This slide already has 24 added objects.');
    PP.snapshot();
    PP.enterDesign();
    var T = PP.effTheme(s);
    if (!s.extras) s.extras = [];
    var spot = kind === 'shape' ? freeSpot(s, 168, 56) : freeSpot(s, 420, 72);
    var ex = kind === 'shape'
      ? { id: newId(), kind: 'shape', shape: 'pill', x: spot.x, y: spot.y, w: 168, h: 56, fill: T.a1, opacity: 1, z: 2 }
      : { id: newId(), kind: 'text', x: spot.x, y: spot.y, w: 420, h: 72, text: 'Type anything', color: T.a1, size: 32, weight: 800, align: 'left', z: 6 };
    s.extras.push(ex);
    PP.canvasSel = { id: ex.id };
    PP.show(PP.state.i);
  };

  function selectedExtra() {
    var s = PP.sel();
    return PP.canvasSel && PP.canvasSel.id && s ? extraById(s, PP.canvasSel.id) : null;
  }

  function mutate(fn) {
    var s = PP.sel();
    if (!s || !PP.canvasSel) return;
    PP.snapshot();
    fn(s, selectedExtra());
    PP.show(PP.state.i);
  }

  PP.enterDesign = function () {
    PP.state.edit = true;
    var b = PP.$('edit');
    if (b) { b.disabled = false; b.setAttribute('aria-pressed', 'true'); }
    var hint = PP.$('designHint');
    if (hint) hint.hidden = false;
  };

  PP.initCanvas = function () {
    var bar = PP.$('formatBar');
    if (!bar) return;
    bar.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    PP.$('addText').addEventListener('click', function () { PP.addCanvasObject('text'); });
    PP.$('addShape').addEventListener('click', function () { PP.addCanvasObject('shape'); });
    bar.addEventListener('click', function (e) {
      var btn = e.target.closest('button');
      if (!btn || !PP.canvasSel) return;
      var act = btn.dataset.act;
      if (act === 'size-down' || act === 'size-up') {
        var dir = act === 'size-up' ? 1 : -1;
        mutate(function (s, ex) {
          if (ex && ex.kind === 'text') ex.size = Math.max(12, Math.min(120, (ex.size || 36) + dir * 4));
          else s.size = Math.max(70, Math.min(140, (+s.size || 100) + dir * 10));
        });
      } else if (act === 'bold') {
        mutate(function (s, ex) { if (ex && ex.kind === 'text') ex.weight = ex.weight === 400 ? 800 : 400; });
      } else if (act === 'align') {
        mutate(function (s, ex) {
          var order = ['left', 'center', 'right'];
          if (ex && ex.kind === 'text') ex.align = order[(order.indexOf(ex.align || 'left') + 1) % 3];
          else s.align = s.align === 'center' ? 'left' : 'center';
        });
      } else if (act === 'center') {
        mutate(function (s, ex) {
          var box = ex || (s.frames && s.frames[PP.canvasSel.key]);
          if (!box) {
            if (!s.frames) s.frames = {};
            box = Object.assign({}, PP.defaultFrames(s, PP.state.i)[PP.canvasSel.key]);
            s.frames[PP.canvasSel.key] = box;
          }
          box.x = Math.round((1280 - box.w) / 2);
          box.y = Math.round((720 - box.h) / 2);
        });
      } else if (act === 'dup') PP.duplicateSelection();
      else if (act === 'del') PP.deleteSelection();
    });
    PP.$('fmtColor').addEventListener('input', function (e) {
      var value = e.target.value;
      if (!PP.canvasSel || !PP._fmtSnap) { PP.snapshot(); PP._fmtSnap = true; }
      var s = PP.sel();
      var ex = selectedExtra();
      if (!s) return;
      if (ex) { if (ex.kind === 'shape') ex.fill = value; else ex.color = value; }
      else s.tx = value;
      var frame = currentFrame();
      if (frame && ex && ex.kind === 'shape') frame.style.background = value;
      else if (frame && ex) frame.style.color = value;
      else PP.show(PP.state.i);
    });
    PP.$('fmtColor').addEventListener('change', function () { PP._fmtSnap = false; if (PP.scheduleAutosave) PP.scheduleAutosave(); });
    PP.$('stage').addEventListener('pointerdown', function (e) {
      if (!PP.state.edit) return;
      if (e.target.closest('.frame') || e.target.closest('#formatBar')) return;
      PP.clearCanvasSel();
    });
  };
})(typeof window !== 'undefined' ? window : globalThis);
