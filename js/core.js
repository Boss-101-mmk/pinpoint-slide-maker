/* Shared config, DOM helpers, deck state, and undo history. */
(function (root) {
  'use strict';
  var PP = root.PP || (root.PP = {});

  PP.CFG = {
    MAX_BYTES: 10 * 1024 * 1024,
    MAX_CHARS: 60000,
    MAX_SLIDES: 30,
    MAX_BULLETS: 5,
    MAX_LEN: 120,
    FREE_USES: 5,
    DEBUG: typeof location !== 'undefined' && new URLSearchParams(location.search).has('debug'),
    AI_ENDPOINT: '',
    API_BASE: ''
  };
  PP.HEX = /^#[0-9a-f]{6}$/i;
  PP.EMAIL_RE = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]{2,}$/;
  PP.DATA_IMG = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;
  PP.KINDS = ['title', 'bullets', 'stats', 'chart', 'quote', 'steps', 'section', 'closing'];
  PP.FONTS = ['Bricolage Grotesque', 'DM Sans', 'Fraunces'];
  PP.MOTIONS = ['slide', 'fade', 'zoom', 'cinematic', 'wipe', 'none'];
  PP.MAX_LIB = 24;
  PP.DECK_VERSION = 1;
  PP.MAX_DECK_FILE = 12 * 1024 * 1024;

  PP.log = function () {
    if (PP.CFG.DEBUG) console.log.apply(console, ['[PinPoint]'].concat([].slice.call(arguments)));
  };
  PP.$ = function (id) { return document.getElementById(id); };
  PP.el = function (tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };
  PP.toast = function (m, ok) {
    var t = PP.$('toast');
    if (!t) return;
    t.textContent = m || '';
    t.classList.toggle('ok', !!ok && !!m);
  };
  PP.cleanStr = function (v, n) {
    return PP.Sec.clean(typeof v === 'string' ? v : '').replace(/\s+/g, ' ').trim().slice(0, n);
  };
  PP.reducedMotion = function () {
    return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  };

  PP.state = { slides: [], theme: 'aurora', motion: 'slide', i: 0, lib: [], edit: false, trash: [], brand: null };
  PP.currentTemplateName = '';
  PP.mem = {};
  PP.LS = {
    get: function (k) {
      try {
        var v = localStorage.getItem(k);
        return v === null ? (PP.mem[k] ?? null) : v;
      } catch (e) { return PP.mem[k] ?? null; }
    },
    set: function (k, v) {
      PP.mem[k] = v;
      try { localStorage.setItem(k, v); return true; } catch (e) { return false; }
    }
  };

  PP.history = { past: [], future: [], lock: false };
  PP._scripts = {};
  PP.loadScript = function (src) {
    if (PP._scripts[src]) return PP._scripts[src];
    PP._scripts[src] = new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = function () { res(); };
      s.onerror = function () { rej(new Error('Could not load a required library. Check your connection.')); };
      document.head.appendChild(s);
    });
    return PP._scripts[src];
  };

  PP.capture = function () {
    return JSON.stringify({
      slides: PP.state.slides,
      i: PP.state.i,
      theme: PP.state.theme,
      motion: PP.state.motion,
      brand: PP.state.brand,
      trash: PP.state.trash,
      edit: PP.state.edit,
      txt: PP.$('txt') ? PP.$('txt').value : '',
      template: PP.currentTemplateName || ''
    });
  };

  PP.updateHistoryButtons = function () {
    var u = PP.$('undoBtn'), r = PP.$('redoBtn'), d = PP.$('sdUndo');
    if (u) u.disabled = !PP.history.past.length;
    if (r) r.disabled = !PP.history.future.length;
    if (d) d.hidden = !PP.state.trash.length;
  };

  PP.applySnapshot = function (raw) {
    var x = JSON.parse(raw);
    PP.history.lock = true;
    try {
      PP.state.slides = Array.isArray(x.slides) ? x.slides : [];
      PP.state.i = x.i || 0;
      PP.state.theme = PP.THEMES && PP.THEMES[x.theme] ? x.theme : 'aurora';
      PP.state.motion = PP.MOTIONS.indexOf(x.motion) >= 0 ? x.motion : 'slide';
      PP.state.brand = x.brand || null;
      PP.state.trash = Array.isArray(x.trash) ? x.trash : [];
      PP.state.edit = !!x.edit;
      PP.currentTemplateName = x.template || '';
      if (PP.$('txt') && typeof x.txt === 'string') PP.$('txt').value = x.txt;
      if (PP.$('motion')) PP.$('motion').value = PP.state.motion;
      if (PP.$('edit')) PP.$('edit').setAttribute('aria-pressed', String(PP.state.edit));
      if (PP.syncThemeChips) PP.syncThemeChips();
      if (PP.syncBrandFields) PP.syncBrandFields();
      if (PP.state.brand) PP.LS.set('pp.brandkit', JSON.stringify(PP.state.brand));
      if (PP.enableDeckControls) PP.enableDeckControls(!!PP.state.slides.length);
      if (PP.state.slides.length && PP.strip && PP.show) {
        PP.strip();
        PP.show(PP.state.i);
      } else if (PP.$('stage')) {
        PP.$('stage').replaceChildren();
        if (PP.$('strip')) PP.$('strip').replaceChildren();
        if (PP.$('slidePos')) PP.$('slidePos').textContent = '';
        if (PP.$('notes')) PP.$('notes').value = '';
        if (PP.$('prev')) PP.$('prev').disabled = true;
        if (PP.$('next')) PP.$('next').disabled = true;
      }
    } finally {
      PP.history.lock = false;
    }
    PP.updateHistoryButtons();
  };

  PP.snapshot = function () {
    if (PP.history.lock) return;
    var data;
    try { data = PP.capture(); } catch (e) { PP.log(e); return; }
    if (data.length > 6000000) {
      PP.toast('This edit is too large to undo. Save an editable deck to keep a copy.');
      return;
    }
    PP.history.past.push(data);
    var total = 0;
    PP.history.past.forEach(function (s) { total += s.length; });
    while ((PP.history.past.length > 25 || total > 16000000) && PP.history.past.length > 1) {
      total -= PP.history.past.shift().length;
    }
    PP.history.future = [];
    PP.updateHistoryButtons();
  };

  PP.undo = function () {
    if (!PP.history.past.length) return;
    var cur = PP.capture();
    var prev = PP.history.past.pop();
    PP.history.future.push(cur);
    PP.applySnapshot(prev);
    PP.toast('Undid the last change.', true);
  };
  PP.redo = function () {
    if (!PP.history.future.length) return;
    var cur = PP.capture();
    var next = PP.history.future.pop();
    PP.history.past.push(cur);
    PP.applySnapshot(next);
    PP.toast('Redid the change.', true);
  };

  PP.sel = function () { return PP.state.slides[PP.state.i]; };
  PP.deckButtons = ['present', 'export', 'exportPdf', 'pic', 'narrate', 'edit', 'saveDeck'];
})(typeof window !== 'undefined' ? window : globalThis);
