/* Autosave, brand kit, free uses, feedback, admin inbox, and editable deck files. */
(function (root) {
  'use strict';
  var PP = root.PP || (root.PP = {});
  var autoTimer = 0;
  var brandLogoDraft = '';
  var stars = 0;
  var lastFb = 0;
  var adminToken = '';

  function historyList() {
    try {
      var x = JSON.parse(PP.LS.get('pp.versions') || '[]');
      return Array.isArray(x) ? x : [];
    } catch (e) { return []; }
  }
  PP.historyList = historyList;

  function drawHistory() {
    var s = PP.$('deckHistory');
    if (!s) return;
    var old = s.value;
    s.replaceChildren();
    var a = historyList();
    if (!a.length) {
      var empty = PP.el('option', null, 'No saved versions yet');
      empty.value = '';
      s.append(empty);
      PP.$('restoreVersion').disabled = true;
      return;
    }
    a.forEach(function (x, i) {
      var o = PP.el('option', null, new Date(x.at).toLocaleString() + ' · ' + (x.count || 0) + ' slides');
      o.value = String(i);
      s.append(o);
    });
    if (old && Number(old) < a.length) s.value = old;
    PP.$('restoreVersion').disabled = !a.length;
  }

  PP.updateEmptyHint = function () {
    var hint = PP.$('emptyHint');
    if (!hint || (PP.$('empty') && PP.$('empty').hidden)) return;
    var n = historyList().length;
    hint.textContent = n
      ? 'You have ' + n + ' saved version' + (n === 1 ? '' : 's') + ' in Version history, under the toolbar.'
      : 'Choose a template, drop a document, or paste notes, then press Build presentation.';
  };

  PP.scheduleAutosave = function () {
    if (!PP.state.slides.length) return;
    clearTimeout(autoTimer);
    autoTimer = setTimeout(function () {
      try {
        var saved = { theme: PP.state.theme, motion: PP.state.motion, brand: PP.state.brand, slides: PP.state.slides };
        var data = JSON.stringify(saved);
        var status = PP.$('autosaveStatus');
        if (data.length > 2800000) { status.textContent = 'Deck is too large for browser autosave. Use Save editable deck.'; return; }
        var a = historyList();
        if (a.length && a[a.length - 1].data === data) { status.textContent = 'Autosaved in this browser · ' + new Date().toLocaleTimeString(); return; }
        a.push({ at: Date.now(), count: PP.state.slides.length, data: data });
        while (a.length > 8 || JSON.stringify(a).length > 3900000) a.shift();
        if (!PP.LS.set('pp.versions', JSON.stringify(a))) { status.textContent = 'Browser storage is full. Use Save editable deck.'; return; }
        status.textContent = 'Autosaved in this browser · ' + new Date().toLocaleTimeString();
        drawHistory();
        PP.updateEmptyHint();
      } catch (e) {
        PP.$('autosaveStatus').textContent = 'Autosave storage is full. Use Save editable deck.';
      }
    }, 700);
  };

  function restoreVersion() {
    var a = historyList();
    var v = a[Number(PP.$('deckHistory').value)];
    if (!v) return;
    try {
      var x = JSON.parse(v.data);
      if (!Array.isArray(x.slides) || !x.slides.length) throw new Error('empty');
      PP.snapshot();
      PP.state.slides = x.slides;
      PP.state.theme = PP.THEMES[x.theme] ? x.theme : 'aurora';
      PP.state.motion = PP.MOTIONS.indexOf(x.motion) >= 0 ? x.motion : 'slide';
      PP.state.brand = x.brand || null;
      PP.syncBrandFields();
      if (PP.state.brand) PP.LS.set('pp.brandkit', JSON.stringify(PP.state.brand));
      PP.state.i = 0;
      PP.state.trash = [];
      PP.$('motion').value = PP.state.motion;
      PP.syncThemeChips();
      PP.updateHistoryButtons();
      PP.enableDeckControls(true);
      PP.strip();
      PP.show(0);
      PP.toast('Version restored.', true);
    } catch (e) { PP.toast('Could not restore that version.'); }
  }

  PP.syncBrandFields = function () {
    var b = PP.state.brand;
    PP.$('brandName').value = b && b.name || '';
    PP.$('brandPrimary').value = b && PP.HEX.test(b.primary || '') ? b.primary : '#5cf2c0';
    PP.$('brandSecondary').value = b && PP.HEX.test(b.secondary || '') ? b.secondary : '#8b7cff';
  };

  function loadBrand() {
    try {
      var b = JSON.parse(PP.LS.get('pp.brandkit') || 'null');
      if (b && PP.HEX.test(b.primary || '') && PP.HEX.test(b.secondary || '')) PP.state.brand = b;
    } catch (e) {}
    PP.syncBrandFields();
  }

  function brandApply() {
    PP.snapshot();
    var b = {
      name: PP.cleanStr(PP.$('brandName').value, 60),
      primary: PP.$('brandPrimary').value,
      secondary: PP.$('brandSecondary').value,
      logo: brandLogoDraft || (PP.state.brand && PP.state.brand.logo) || ''
    };
    PP.state.brand = b;
    PP.LS.set('pp.brandkit', JSON.stringify(b));
    PP.state.slides.forEach(function (s) { s.a1 = b.primary; s.a2 = b.secondary; });
    if (PP.state.slides.length) { PP.strip(); PP.show(PP.state.i); }
    PP.scheduleAutosave();
    PP.$('brandStatus').textContent = 'Brand saved and applied to this deck and future decks.';
  }

  PP.Usage = {
    count: function () {
      var n = parseInt(PP.LS.get('pp.uses'), 10);
      return Number.isInteger(n) && n > 0 ? Math.min(n, 9999) : 0;
    },
    member: function () {
      try {
        var m = JSON.parse(PP.LS.get('pp.member') || 'null');
        return m && typeof m.n === 'string' ? m : null;
      } catch (e) { return null; }
    },
    blocked: function () { return !PP.Usage.member() && PP.Usage.count() >= PP.CFG.FREE_USES; },
    bump: function () { PP.LS.set('pp.uses', String(PP.Usage.count() + 1)); PP.Usage.paint(); },
    paint: function () {
      var m = PP.Usage.member(), n = PP.Usage.count(), p = PP.$('uses');
      if (!p) return;
      p.textContent = m ? 'Member: ' + m.n.slice(0, 24) : 'Free decks: ' + Math.min(n, PP.CFG.FREE_USES) + ' of ' + PP.CFG.FREE_USES + ' used';
      p.dataset.low = (!m && n >= PP.CFG.FREE_USES - 1) ? '1' : '';
    }
  };

  PP.Store = {
    db: async function () { try { return window.claude ? await claude.use('db') : null; } catch (e) { return null; } },
    uid: async function () { try { var u = window.claude ? await claude.use('user') : null; return u ? await u.id() : null; } catch (e) { return null; } },
    save: async function (kind, data) {
      try {
        var db = await PP.Store.db(), uid = await PP.Store.uid();
        if (db && uid && /^[\w.~:@+-]{1,150}$/.test(uid)) {
          if (kind === 'signup') await db.doc('signups/' + uid).set(data);
          else {
            var ref = db.doc('feedback/' + uid);
            var snap = await ref.get();
            var old = snap.exists && snap.data() && Array.isArray(snap.data().items) ? snap.data().items : [];
            await ref.set({ items: old.concat([data]).slice(-20) });
          }
          return 'cloud';
        }
      } catch (e) { PP.log(e); }
      if (PP.CFG.API_BASE) {
        try {
          var r = await fetch(PP.CFG.API_BASE.replace(/\/+$/, '') + '/' + kind, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), referrerPolicy: 'no-referrer' });
          if (r.ok) return 'server';
        } catch (e) { PP.log(e); }
      }
      try {
        var k = 'pp.local.' + kind;
        var a = JSON.parse(PP.LS.get(k) || '[]');
        a.push(data);
        PP.LS.set(k, JSON.stringify(a.slice(-20)));
      } catch (e) {}
      return 'device';
    }
  };

  PP.Signup = {
    pending: null,
    open: function (next) {
      PP.Signup.pending = next || null;
      PP.$('suMsg').textContent = '';
      PP.$('suN').textContent = String(PP.CFG.FREE_USES);
      var d = PP.$('signup');
      if (d.open) return;
      if (typeof d.showModal === 'function') d.showModal();
      else d.setAttribute('open', '');
    },
    close: function () {
      var d = PP.$('signup');
      if (typeof d.close === 'function') d.close();
      else d.removeAttribute('open');
    }
  };

  function validImg(src) {
    return typeof src === 'string' && PP.DATA_IMG.test(src) && src.length <= 4 * 1024 * 1024 ? src : '';
  }
  function cleanText(v, n) { return typeof v === 'string' ? PP.Sec.clean(v).slice(0, n) : ''; }

  PP.normalizeDeck = function (j) {
    if (!j || j.format !== 'PinPointDeck' || j.version !== PP.DECK_VERSION || !Array.isArray(j.slides) || !j.slides.length || j.slides.length > PP.CFG.MAX_SLIDES) {
      throw new Error('This is not a supported PinPoint deck.');
    }
    var slides = j.slides.map(function (x) {
      if (!x || PP.KINDS.indexOf(x.kind) < 0) throw new Error('Deck contains an unsupported slide.');
      var z = { kind: x.kind, title: cleanText(x.title, 120) };
      if (x.sub != null) z.sub = cleanText(x.sub, 500);
      if (x.notes != null) z.notes = cleanText(x.notes, 2000);
      if (x.credit) z.credit = cleanText(x.credit, 300);
      if (Array.isArray(x.items)) z.items = x.items.slice(0, 6).map(function (t) { return cleanText(t, PP.CFG.MAX_LEN); });
      if (Array.isArray(x.stats)) z.stats = x.stats.slice(0, 4).map(function (q) { return { v: cleanText(q && q.v, 30), l: cleanText(q && q.l, 100) }; });
      var img = validImg(x.img);
      if (img) z.img = img;
      if (typeof x.bgpic === 'string' && Object.prototype.hasOwnProperty.call(PP.BG, x.bgpic)) z.bgpic = x.bgpic;
      if (Number.isInteger(x.bgseed)) z.bgseed = x.bgseed;
      if (Number.isFinite(+x.bgop) && +x.bgop >= 20 && +x.bgop <= 100) z.bgop = +x.bgop;
      ['bg1', 'bg2', 'a1', 'a2', 'tx'].forEach(function (k) { if (PP.HEX.test(x[k] || '')) z[k] = x[k]; });
      if (PP.THEMES[x.theme]) z.theme = x.theme;
      if (PP.FONTS.indexOf(x.font) >= 0) z.font = x.font;
      if (x.align === 'left' || x.align === 'center') z.align = x.align;
      if (['fade', 'zoom', 'blur', 'none'].indexOf(x.anim) >= 0) z.anim = x.anim;
      if (x.speed === 'fast' || x.speed === 'slow') z.speed = x.speed;
      if (PP.MOTIONS.indexOf(x.trans) >= 0) z.trans = x.trans;
      if (Number.isFinite(+x.size) && +x.size >= 70 && +x.size <= 140) z.size = +x.size;
      return z;
    });
    var brand = null;
    if (j.brand && PP.HEX.test(j.brand.primary || '') && PP.HEX.test(j.brand.secondary || '')) {
      brand = { name: cleanText(j.brand.name, 60), primary: j.brand.primary, secondary: j.brand.secondary, logo: validImg(j.brand.logo) };
    }
    return {
      slides: slides,
      theme: PP.THEMES[j.theme] ? j.theme : 'aurora',
      motion: PP.MOTIONS.indexOf(j.motion) >= 0 ? j.motion : 'slide',
      brand: brand
    };
  };

  function download(filename, blob) {
    var url = URL.createObjectURL(blob);
    var a = PP.el('a');
    a.href = url; a.download = filename;
    document.body.append(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  PP.saveDeckFile = function () {
    if (!PP.state.slides.length) return PP.toast('Build a presentation first.');
    var payload = { format: 'PinPointDeck', version: PP.DECK_VERSION, theme: PP.state.theme, motion: PP.state.motion, brand: PP.state.brand, slides: PP.state.slides };
    download('PinPoint-deck.json', new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    PP.toast('Editable deck saved.', true);
  };

  async function openDeckFile(f) {
    if (!f) return;
    try {
      if (f.size > PP.MAX_DECK_FILE) throw new Error('Deck file is larger than 12 MB.');
      var parsed = PP.normalizeDeck(JSON.parse(await f.text()));
      PP.snapshot();
      PP.state.slides = parsed.slides;
      PP.state.theme = parsed.theme;
      PP.state.motion = parsed.motion;
      PP.state.brand = parsed.brand;
      PP.currentTemplateName = '';
      if (PP.state.brand) PP.LS.set('pp.brandkit', JSON.stringify(PP.state.brand));
      PP.syncBrandFields();
      PP.state.trash = [];
      PP.state.i = 0;
      PP.$('txt').value = '';
      PP.$('motion').value = PP.state.motion;
      PP.syncThemeChips();
      PP.updateHistoryButtons();
      PP.enableDeckControls(true);
      PP.strip();
      PP.show(0);
      PP.Usage.bump();
      PP.toast('Editable deck opened.', true);
    } catch (err) { PP.toast(err.message || 'Could not open that deck.'); }
  }

  async function loadOwner() {
    try {
      var u = window.claude ? await claude.use('user') : null;
      if (!u || !(await u.isOwner())) return;
      var db = await PP.Store.db();
      if (!db) return;
      var both = await Promise.all([db.collection('feedback').get(), db.collection('signups').get()]);
      var items = [];
      both[0].docs.forEach(function (d) {
        var a = (d.data() || {}).items;
        if (Array.isArray(a)) a.forEach(function (x) { if (x && typeof x === 'object') items.push(x); });
      });
      items.sort(function (a, b) { return String(b.at).localeCompare(String(a.at)); });
      var sus = both[1].docs.map(function (d) { return d.data() || {}; }).sort(function (a, b) { return String(b.at).localeCompare(String(a.at)); });
      var avg = items.length ? (items.reduce(function (t, x) { return t + (+x.rating || 0); }, 0) / items.length).toFixed(1) : 'none yet';
      PP.$('owner').hidden = false;
      PP.$('ownSum').textContent = items.length + ' feedback note' + (items.length === 1 ? '' : 's') + ' · average rating ' + avg + ' · ' + sus.length + ' sign-up' + (sus.length === 1 ? '' : 's');
      var fl = PP.$('ownFb'); fl.replaceChildren();
      items.slice(0, 25).forEach(function (x) {
        var li = PP.el('li');
        li.textContent = '★'.repeat(Math.max(0, Math.min(5, +x.rating || 0))) + ' ' + String(x.msg || '').slice(0, 300) + (x.contact ? ' (' + String(x.contact).slice(0, 120) + ')' : '');
        fl.append(li);
      });
      var sl = PP.$('ownSu'); sl.replaceChildren();
      sus.slice(0, 25).forEach(function (x) {
        var li = PP.el('li');
        li.textContent = String(x.name || '').slice(0, 60) + ' · ' + String(x.email || '').slice(0, 120);
        sl.append(li);
      });
    } catch (e) { PP.log(e); }
  }

  async function refreshAdmin() {
    var base = String(PP.CFG.API_BASE || '').replace(/\/+$/, '');
    if (!base) { PP.$('adminStatus').textContent = 'Set API_BASE to the feedback proxy URL before signing in.'; return; }
    PP.$('adminStatus').textContent = 'Loading feedback…';
    try {
      var r = await fetch(base + '/admin', { headers: { Authorization: 'Bearer ' + adminToken }, referrerPolicy: 'no-referrer' });
      if (r.status === 401) throw new Error('That admin token was not accepted.');
      if (!r.ok) throw new Error('Admin server error (' + r.status + ').');
      var data = await r.json();
      var feedback = Array.isArray(data.feedback) ? data.feedback : [];
      var signups = Array.isArray(data.signups) ? data.signups : [];
      PP.$('adminData').hidden = false;
      PP.$('adminStatus').textContent = 'Inbox updated ' + new Date().toLocaleString() + '.';
      PP.$('adminRefresh').hidden = false;
      PP.$('adminLogout').hidden = false;
      PP.$('adminCount').textContent = String(feedback.length);
      PP.$('adminRating').textContent = feedback.length ? (feedback.reduce(function (n, x) { return n + (Number(x.rating) || 0); }, 0) / feedback.length).toFixed(1) : '—';
      PP.$('adminSignupCount').textContent = String(signups.length);
      var fl = PP.$('adminFeedback'); fl.replaceChildren();
      if (!feedback.length) fl.append(PP.el('p', 'admin-empty', 'No feedback yet. New submissions will appear here.'));
      feedback.slice(0, 100).forEach(function (x) {
        var box = PP.el('article', 'admin-item');
        box.append(
          PP.el('strong', null, '★'.repeat(Math.max(0, Math.min(5, Number(x.rating) || 0))) + ' · ' + String(x.name || 'Anonymous').slice(0, 60)),
          PP.el('p', null, String(x.msg || '').slice(0, 1000)),
          PP.el('small', null, [x.contact || 'No reply email', x.at ? new Date(x.at).toLocaleString() : ''].filter(Boolean).join(' · '))
        );
        fl.append(box);
      });
      var sl = PP.$('adminSignups'); sl.replaceChildren();
      if (!signups.length) sl.append(PP.el('p', 'admin-empty', 'No sign-ups yet.'));
      signups.slice(0, 100).forEach(function (x) {
        var box = PP.el('article', 'admin-item');
        box.append(PP.el('strong', null, String(x.name || '').slice(0, 60)), PP.el('p', null, String(x.email || '').slice(0, 120)), PP.el('small', null, x.at ? new Date(x.at).toLocaleString() : ''));
        sl.append(box);
      });
    } catch (e) {
      PP.$('adminStatus').textContent = e.message || 'Could not load feedback.';
      if (e.message && e.message.indexOf('token') >= 0) PP.$('adminData').hidden = true;
    }
  }

  function initFloat() {
    var panel = PP.$('inputPanel'), handle = PP.$('editorDragHandle'), toggle = PP.$('editorDock'), main = document.querySelector('main');
    var drag = null;
    function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
    function setFloating(on, rect) {
      if (on && !panel.classList.contains('is-floating')) {
        var r = rect || panel.getBoundingClientRect();
        panel.classList.add('is-floating');
        main.classList.add('editor-floating');
        panel.style.left = clamp(r.left, 8, Math.max(8, innerWidth - panel.offsetWidth - 8)) + 'px';
        panel.style.top = clamp(r.top, 8, Math.max(8, innerHeight - 120)) + 'px';
      } else if (!on && panel.classList.contains('is-floating')) {
        panel.classList.remove('is-floating');
        main.classList.remove('editor-floating');
        panel.style.left = '';
        panel.style.top = '';
      }
      toggle.textContent = on ? 'Dock panel' : 'Float panel';
      toggle.setAttribute('aria-pressed', String(on));
      PP.LS.set('pp.editorFloating', on ? '1' : '0');
      if (on) PP.LS.set('pp.editorPosition', JSON.stringify({ left: parseFloat(panel.style.left) || 8, top: parseFloat(panel.style.top) || 8 }));
    }
    try {
      if (PP.LS.get('pp.editorFloating') === '1') {
        var p = JSON.parse(PP.LS.get('pp.editorPosition') || '{}');
        setFloating(true, { left: Number(p.left) || 24, top: Number(p.top) || 80 });
      }
    } catch (e) {}
    toggle.addEventListener('click', function () { setFloating(!panel.classList.contains('is-floating')); });
    handle.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 || e.target.closest('button')) return;
      var r = panel.getBoundingClientRect();
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, left: r.left, top: r.top, started: false };
      handle.setPointerCapture(e.pointerId);
    });
    handle.addEventListener('pointermove', function (e) {
      if (!drag || drag.id !== e.pointerId) return;
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.started && Math.hypot(dx, dy) < 5) return;
      if (!drag.started) { drag.started = true; setFloating(true, { left: drag.left, top: drag.top }); }
      e.preventDefault();
      var left = clamp(drag.left + dx, 8, Math.max(8, innerWidth - panel.offsetWidth - 8));
      var top = clamp(drag.top + dy, 8, Math.max(8, innerHeight - 96));
      panel.style.left = left + 'px';
      panel.style.top = top + 'px';
      PP.LS.set('pp.editorPosition', JSON.stringify({ left: left, top: top }));
    });
    var finish = function (e) { if (drag && drag.id === e.pointerId) drag = null; };
    handle.addEventListener('pointerup', finish);
    handle.addEventListener('pointercancel', finish);
    handle.addEventListener('keydown', function (e) {
      if (!panel.classList.contains('is-floating') || ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].indexOf(e.key) < 0) return;
      e.preventDefault();
      e.stopPropagation();
      var step = e.shiftKey ? 5 : 20;
      var r = panel.getBoundingClientRect();
      var left = clamp(r.left + (e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0), 8, Math.max(8, innerWidth - panel.offsetWidth - 8));
      var top = clamp(r.top + (e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0), 8, Math.max(8, innerHeight - 96));
      panel.style.left = left + 'px';
      panel.style.top = top + 'px';
      PP.LS.set('pp.editorPosition', JSON.stringify({ left: left, top: top }));
    });
    addEventListener('resize', function () {
      if (!panel.classList.contains('is-floating')) return;
      var r = panel.getBoundingClientRect();
      panel.style.left = clamp(r.left, 8, Math.max(8, innerWidth - panel.offsetWidth - 8)) + 'px';
      panel.style.top = clamp(r.top, 8, Math.max(8, innerHeight - 96)) + 'px';
    });
  }

  PP.initStorage = function () {
    initFloat();
    drawHistory();
    PP.updateEmptyHint();
    PP.$('restoreVersion').addEventListener('click', restoreVersion);
    loadBrand();
    PP.$('brandLogoFile').addEventListener('change', async function (e) {
      var f = e.target.files && e.target.files[0];
      if (!f) return;
      try { brandLogoDraft = await PP.readPic(f); PP.$('brandStatus').textContent = 'Logo ready to apply.'; }
      catch (err) { e.target.value = ''; PP.$('brandStatus').textContent = err.message; }
    });
    PP.$('brandApply').addEventListener('click', brandApply);
    PP.$('brandClear').addEventListener('click', function () {
      PP.snapshot();
      PP.state.brand = null;
      brandLogoDraft = '';
      PP.LS.set('pp.brandkit', '');
      PP.state.slides.forEach(function (s) { delete s.a1; delete s.a2; });
      PP.$('brandName').value = '';
      PP.$('brandLogoFile').value = '';
      PP.syncBrandFields();
      if (PP.state.slides.length) { PP.strip(); PP.show(PP.state.i); }
      PP.$('brandStatus').textContent = 'Brand kit cleared.';
    });
    PP.$('signup').addEventListener('close', function () { PP.Signup.pending = null; });
    PP.$('suForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      var msg = PP.$('suMsg');
      var name = PP.cleanStr(PP.$('suName').value, 60);
      var email = PP.cleanStr(PP.$('suEmail').value, 120).toLowerCase();
      if (PP.$('suHp').value) { PP.Signup.pending = null; return PP.Signup.close(); }
      if (!name) { msg.textContent = 'Please enter your name.'; return; }
      if (!PP.EMAIL_RE.test(email)) { msg.textContent = 'Please enter a valid email address.'; return; }
      if (!PP.$('suOk').checked) { msg.textContent = 'Please tick the box to continue.'; return; }
      var btn = PP.$('suGo');
      btn.disabled = true; msg.textContent = 'Saving…';
      var where = await PP.Store.save('signup', { name: name, email: email, at: new Date().toISOString(), uses: PP.Usage.count() });
      PP.LS.set('pp.member', JSON.stringify({ n: name, email: email }));
      PP.Usage.paint();
      btn.disabled = false; msg.textContent = '';
      var next = PP.Signup.pending;
      PP.Signup.pending = null;
      PP.Signup.close();
      if (next) next();
      PP.toast(where === 'device' ? 'Welcome, ' + name + '. Your details are saved on this device only.' : 'Welcome, ' + name + '. You now have unlimited decks.', true);
    });
    PP.$('suLater').addEventListener('click', function () { PP.Signup.pending = null; PP.Signup.close(); });

    var starBox = PP.$('stars');
    for (var i = 1; i <= 5; i++) {
      (function (n) {
        var b = PP.el('button', null, '★');
        b.type = 'button';
        b.setAttribute('aria-label', n + (n > 1 ? ' stars' : ' star'));
        b.setAttribute('aria-pressed', 'false');
        b.addEventListener('click', function () {
          stars = n;
          Array.prototype.forEach.call(starBox.children, function (c, k) {
            c.setAttribute('aria-pressed', String(k < n));
            c.classList.toggle('on', k < n);
          });
        });
        starBox.append(b);
      })(i);
    }
    PP.$('fbForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      var out = PP.$('fbMsg');
      out.className = 'msg bad';
      if (PP.$('fbHp').value) return;
      if (!stars) { out.textContent = 'Tap a star rating first.'; return; }
      var name = PP.cleanStr(PP.$('fbName').value, 60);
      var msg = PP.cleanStr(PP.$('fbText').value, 1000);
      var contact = PP.cleanStr(PP.$('fbContact').value, 120);
      if (name.length < 2) { out.textContent = 'Please enter your name.'; return; }
      if (msg.length < 3) { out.textContent = 'Tell us a little about your experience.'; return; }
      if (contact && !PP.EMAIL_RE.test(contact)) { out.textContent = 'That email does not look right. Fix it or leave it empty.'; return; }
      if (Date.now() - lastFb < 20000) { out.textContent = 'Please wait a few seconds before sending again.'; return; }
      lastFb = Date.now();
      PP.$('fbGo').disabled = true;
      out.className = 'msg';
      out.textContent = 'Sending…';
      var where = await PP.Store.save('feedback', { rating: stars, name: name, msg: msg, contact: contact, uses: PP.Usage.count(), at: new Date().toISOString() });
      PP.$('fbGo').disabled = false;
      out.className = 'msg ok';
      out.textContent = where === 'device' ? 'Thank you. It could not be sent online, so your note is saved on this device only.' : 'Thank you. Your feedback was sent.';
      PP.$('fbName').value = '';
      PP.$('fbText').value = '';
      stars = 0;
      Array.prototype.forEach.call(starBox.children, function (c) { c.setAttribute('aria-pressed', 'false'); c.classList.remove('on'); });
      loadOwner();
    });

    PP.$('saveDeck').addEventListener('click', PP.saveDeckFile);
    PP.$('openDeck').addEventListener('click', function () { PP.$('deckFile').click(); });
    PP.$('deckFile').addEventListener('change', function (e) {
      var f = e.target.files[0];
      e.target.value = '';
      openDeckFile(f);
    });

    var adminMode = new URLSearchParams(location.search).get('admin') === '1';
    PP.$('adminPanel').hidden = !adminMode;
    PP.$('adminForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      var value = PP.cleanStr(PP.$('adminToken').value, 180).toLowerCase();
      if (PP.EMAIL_RE.test(value)) {
        var old = PP.Usage.member();
        PP.$('adminData').hidden = true;
        PP.$('adminRefresh').hidden = true;
        PP.$('adminLogout').hidden = true;
        adminToken = '';
        if (old && old.email === value) { PP.$('adminStatus').textContent = 'Welcome back, ' + old.n + '. You are remembered on this device.'; return; }
        var name = value.split('@')[0].slice(0, 60) || 'Member';
        PP.$('adminStatus').textContent = 'Registering member…';
        var where = await PP.Store.save('signup', { name: name, email: value, at: new Date().toISOString(), uses: PP.Usage.count() });
        PP.LS.set('pp.member', JSON.stringify({ n: name, email: value }));
        PP.Usage.paint();
        PP.$('adminStatus').textContent = where === 'device' ? 'Member saved on this device. Sign-in will be remembered here.' : 'Welcome, ' + name + '. You are now a member and will be remembered on this device.';
        return;
      }
      adminToken = PP.$('adminToken').value.trim();
      await refreshAdmin();
    });
    PP.$('adminRefresh').addEventListener('click', refreshAdmin);
    PP.$('adminLogout').addEventListener('click', function () {
      adminToken = '';
      PP.$('adminToken').value = '';
      PP.$('adminData').hidden = true;
      PP.$('adminRefresh').hidden = true;
      PP.$('adminLogout').hidden = true;
      PP.$('adminStatus').textContent = 'Signed out.';
    });

    PP.Usage.paint();
    loadOwner();
    PP.updateHistoryButtons();
  };
})(typeof window !== 'undefined' ? window : globalThis);
