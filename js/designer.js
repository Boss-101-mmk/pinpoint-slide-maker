/* Per-slide layout, colour, motion, and background controls. */
(function (root) {
  'use strict';
  var PP = root.PP || (root.PP = {});
  var stripT = 0;

  function lum(h) {
    var c = [1, 3, 5].map(function (i) { return parseInt(h.slice(i, i + 2), 16) / 255; }).map(function (v) {
      return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4);
    });
    return .2126 * c[0] + .7152 * c[1] + .0722 * c[2];
  }
  function ratio(a, b) {
    var x = lum(a), y = lum(b);
    return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
  }
  function syncWarn() {
    var s = PP.sel();
    var warn = PP.$('sdWarn');
    if (!s || !warn) return;
    var T = PP.effTheme(s);
    warn.textContent = Math.min(ratio(T.tx, T.bg1), ratio(T.tx, T.bg2)) < 3.5 ? 'Low contrast: this text may be hard to read.' : '';
  }

  PP.syncDesigner = function () {
    var s = PP.sel();
    if (!s) return;
    var T = PP.effTheme(s);
    PP.$('sdKind').value = PP.KINDS.indexOf(s.kind) >= 0 ? s.kind : 'bullets';
    PP.$('sdTheme').value = s.theme || '';
    PP.$('sdFont').value = s.font || '';
    PP.$('sdAlign').value = s.align || '';
    PP.$('sdAnim').value = s.anim || '';
    PP.$('sdSpeed').value = s.speed || '';
    PP.$('sdTrans').value = s.trans || '';
    PP.$('sdSize').value = s.size || 100;
    PP.$('sdBg1').value = T.bg1;
    PP.$('sdBg2').value = T.bg2;
    PP.$('sdA1').value = T.a1;
    PP.$('sdTx').value = T.tx;
    PP.$('sdBgOp').value = s.bgop || 70;
    PP.bgGallery();
    syncWarn();
  };

  PP.refreshStage = function () {
    PP.put(PP.$('stage'), PP.state.i, false, PP.state.edit, true);
    clearTimeout(stripT);
    stripT = setTimeout(function () { PP.strip(); PP.bgGallery(); }, 250);
    syncWarn();
    PP.scheduleAutosave();
  };

  PP.setProp = function (k, v) {
    var s = PP.sel();
    if (!s) return;
    if (v === '' || v == null) delete s[k];
    else s[k] = v;
    PP.refreshStage();
  };

  PP.setKind = function (s, k) {
    var items = s.items && s.items.length ? s.items.slice() : (s.stats || []).map(function (x) { return x.v + ' ' + x.l; });
    var first = s.sub || items[0] || '';
    s.kind = k;
    if (k === 'bullets' || k === 'steps') {
      s.items = items.length ? items.slice(0, 6) : ['Click to edit this point'];
      delete s.stats;
    } else if (k === 'stats') {
      s.stats = (s.stats && s.stats.length >= 2) ? s.stats : (items.length >= 2 ? items.slice(0, 4).map(function (t) {
        var m = String(t).match(PP.NUM);
        return m ? { v: m[1], l: m[2] } : { v: '[0]', l: t };
      }) : [{ v: '[00%]', l: 'What it measures' }, { v: '[0]', l: 'Another figure' }]);
      delete s.items;
    } else if (k === 'chart') {
      s.stats = (s.stats && s.stats.length >= 2) ? s.stats : [{ v: '42', l: 'Current' }, { v: '68', l: 'Target' }, { v: '54', l: 'Previous' }];
      delete s.items;
    } else if (k === 'quote') {
      s.sub = first || 'Add a quote here';
      delete s.items;
      delete s.stats;
    } else {
      if (k !== 'section') s.sub = first;
      delete s.items;
      delete s.stats;
    }
  };

  function limit() { return PP.toast('The limit is ' + PP.CFG.MAX_SLIDES + ' slides.'); }

  PP.addSlide = function () {
    if (PP.state.slides.length >= PP.CFG.MAX_SLIDES) return limit();
    PP.snapshot();
    PP.state.slides.splice(PP.state.i + 1, 0, { kind: 'bullets', title: 'New slide', items: ['Click to edit this point'] });
    PP.commit(PP.state.i + 1);
  };
  PP.duplicateSlide = function () {
    if (!PP.state.slides.length) return PP.toast('Build a presentation first.');
    if (PP.state.slides.length >= PP.CFG.MAX_SLIDES) return limit();
    PP.snapshot();
    PP.state.slides.splice(PP.state.i + 1, 0, structuredClone(PP.sel()));
    PP.commit(PP.state.i + 1);
  };
  PP.deleteSlide = function () {
    if (PP.state.slides.length <= 1) return PP.toast('A deck needs at least one slide.');
    PP.snapshot();
    PP.state.trash.push({ x: PP.state.slides.splice(PP.state.i, 1)[0], at: PP.state.i });
    PP.updateHistoryButtons();
    PP.commit(Math.min(PP.state.i, PP.state.slides.length - 1));
  };
  PP.undoDelete = function () {
    if (!PP.state.trash.length) return;
    PP.snapshot();
    var t = PP.state.trash.pop();
    var at = Math.min(t.at, PP.state.slides.length);
    PP.state.slides.splice(at, 0, t.x);
    PP.updateHistoryButtons();
    PP.commit(at);
  };
  PP.moveSlide = function (d) {
    var j = PP.state.i + d;
    if (j < 0 || j >= PP.state.slides.length) return;
    PP.snapshot();
    var a = PP.state.slides;
    var tmp = a[PP.state.i];
    a[PP.state.i] = a[j];
    a[j] = tmp;
    PP.commit(j);
  };

  function copyBg(s) {
    PP.state.slides.forEach(function (o) {
      if (o === s) return;
      if (PP.bgOk(s)) { o.bgpic = s.bgpic; o.bgseed = PP.rnd(); }
      else { delete o.bgpic; delete o.bgseed; }
      if (s.bgop) o.bgop = s.bgop; else delete o.bgop;
    });
  }

  PP.bgGallery = function () {
    var s = PP.sel();
    if (!s) return;
    if (!Number.isInteger(s.bgseed)) s.bgseed = PP.rnd();
    var T = PP.effTheme(s), t = PP.$('bgTray');
    t.replaceChildren();
    [['', 'None']].concat(Object.entries(PP.BGNAMES)).forEach(function (pair) {
      var k = pair[0], n = pair[1];
      var b = PP.el('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Background: ' + n);
      b.setAttribute('aria-pressed', String((s.bgpic || '') === k));
      b.style.background = 'linear-gradient(135deg,' + T.bg1 + ',' + T.bg2 + ')';
      if (k) {
        var im = PP.el('img');
        im.alt = '';
        im.src = PP.bgUrl(k, T, s.bgseed);
        b.append(im);
      }
      b.append(PP.el('span', null, n));
      b.addEventListener('click', function () {
        PP.snapshot();
        if (k) s.bgpic = k; else delete s.bgpic;
        PP.refreshStage();
        PP.bgGallery();
      });
      t.append(b);
    });
  };

  function gesture(node, apply) {
    node.addEventListener('pointerdown', function () {
      if (!PP._gesture) { PP.snapshot(); PP._gesture = true; }
    });
    node.addEventListener('change', function () { PP._gesture = false; });
    node.addEventListener('input', function (e) {
      if (!PP._gesture) { PP.snapshot(); PP._gesture = true; }
      apply(e);
    });
  }

  function flash(btn, done, original) {
    btn.textContent = done;
    setTimeout(function () { btn.textContent = original; }, 1600);
  }

  PP.initDesigner = function () {
    var theme = PP.$('sdTheme');
    if (theme && ![].some.call(theme.options, function (o) { return o.value === ''; })) {
      var deck = PP.el('option', null, 'Deck theme');
      deck.value = '';
      theme.append(deck);
    }
    if (PP.rebuildThemes) PP.rebuildThemes();

    [['sdTheme', 'theme'], ['sdFont', 'font'], ['sdAlign', 'align'], ['sdAnim', 'anim'], ['sdSpeed', 'speed'], ['sdTrans', 'trans']].forEach(function (pair) {
      PP.$(pair[0]).addEventListener('change', function (e) {
        PP.snapshot();
        PP.setProp(pair[1], e.target.value);
      });
    });
    gesture(PP.$('sdSize'), function (e) { PP.setProp('size', +e.target.value === 100 ? '' : +e.target.value); });
    [['sdBg1', 'bg1'], ['sdBg2', 'bg2'], ['sdA1', 'a1'], ['sdTx', 'tx']].forEach(function (pair) {
      gesture(PP.$(pair[0]), function (e) { PP.setProp(pair[1], e.target.value); });
    });
    gesture(PP.$('sdBgOp'), function (e) { PP.setProp('bgop', +e.target.value === 70 ? '' : +e.target.value); });

    PP.$('sdReset').addEventListener('click', function () {
      PP.snapshot();
      ['bg1', 'bg2', 'a1', 'a2', 'tx'].forEach(function (k) { delete PP.sel()[k]; });
      PP.refreshStage();
      PP.syncDesigner();
    });
    PP.$('sdKind').addEventListener('change', function (e) {
      PP.snapshot();
      PP.setKind(PP.sel(), e.target.value);
      PP.refreshStage();
      PP.syncDesigner();
    });
    PP.$('sdAdd').addEventListener('click', PP.addSlide);
    PP.$('sdDup').addEventListener('click', PP.duplicateSlide);
    PP.$('sdDel').addEventListener('click', PP.deleteSlide);
    PP.$('sdUndo').addEventListener('click', PP.undoDelete);
    PP.$('sdLeft').addEventListener('click', function () { PP.moveSlide(-1); });
    PP.$('sdRight').addEventListener('click', function () { PP.moveSlide(1); });
    PP.$('sdPlus').addEventListener('click', function () {
      var s = PP.sel();
      if (!s) return;
      if (s.items && s.items.length < 6) { PP.snapshot(); s.items.push('New point'); }
      else if (s.stats && s.stats.length < 4) { PP.snapshot(); s.stats.push({ v: '[0]', l: 'New figure' }); }
      else return PP.toast(s.items || s.stats ? 'This layout is full.' : 'Change the layout to a list first.');
      PP.refreshStage();
    });
    PP.$('sdMinus').addEventListener('click', function () {
      var s = PP.sel();
      if (!s) return;
      if (s.items && s.items.length > 1) { PP.snapshot(); s.items.pop(); }
      else if (s.stats && s.stats.length > 2) { PP.snapshot(); s.stats.pop(); }
      else return PP.toast('Nothing more to remove.');
      PP.refreshStage();
    });
    PP.$('sdReplay').addEventListener('click', function () {
      var was = PP.state.edit;
      PP.state.edit = false;
      if (PP.clearCanvasSel) PP.clearCanvasSel();
      PP.show(PP.state.i);
      if (!was) return;
      setTimeout(function () {
        PP.state.edit = true;
        var b = PP.$('edit');
        if (b) b.setAttribute('aria-pressed', 'true');
        PP.show(PP.state.i);
      }, 1400);
    });
    PP.$('sdAll').addEventListener('click', function () {
      var s = PP.sel();
      if (!s) return;
      PP.snapshot();
      var K = ['theme', 'bg1', 'bg2', 'a1', 'a2', 'tx', 'font', 'anim', 'speed', 'trans'];
      PP.state.slides.forEach(function (o) {
        if (o === s) return;
        K.forEach(function (k) { if (s[k]) o[k] = s[k]; else delete o[k]; });
      });
      copyBg(s);
      PP.strip();
      flash(PP.$('sdAll'), 'Applied to all slides', 'Apply this look to all slides');
    });
    PP.$('bgShuffle').addEventListener('click', function () {
      if (!PP.sel()) return;
      PP.snapshot();
      PP.sel().bgseed = PP.rnd();
      PP.refreshStage();
      PP.bgGallery();
    });
    PP.$('bgAll').addEventListener('click', function () {
      if (!PP.sel()) return;
      PP.snapshot();
      copyBg(PP.sel());
      PP.strip();
      flash(PP.$('bgAll'), 'Applied to all slides', 'Use this background on every slide');
    });
  };
})(typeof window !== 'undefined' ? window : globalThis);
