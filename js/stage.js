/* Preview, filmstrip, presenter mode, and keyboard shortcuts. */
(function (root) {
  'use strict';
  var PP = root.PP || (root.PP = {});
  var tick = null;

  PP.enableDeckControls = function (on) {
    PP.deckButtons.forEach(function (id) { var n = PP.$(id); if (n) n.disabled = !on; });
    var dz = PP.$('dz');
    if (dz) dz.disabled = !on;
    var empty = PP.$('empty');
    if (empty) empty.hidden = !!on;
    if (PP.updateEmptyHint) PP.updateEmptyHint();
  };

  PP.strip = function () {
    var st = PP.$('strip');
    if (!st) return;
    st.replaceChildren();
    PP.state.slides.forEach(function (s, i) {
      var b = PP.el('button', 'thumb');
      b.type = 'button';
      b.dataset.index = String(i);
      b.setAttribute('aria-label', 'Slide ' + (i + 1) + (s.title ? ': ' + s.title : '') + '. Press to show. Drag the handle to reorder.');
      b.setAttribute('aria-current', i === PP.state.i ? 'true' : 'false');
      if (s.notes) b.classList.add('has-notes');
      var grip = PP.el('span', 'grip');
      grip.title = 'Drag to reorder';
      grip.setAttribute('aria-hidden', 'true');
      var h = PP.el('div', 'host');
      h.append(PP.el('div', 'wrap'));
      h.firstChild.append(PP.buildSlide(s, i, false));
      PP.ro.observe(h);
      var badge = PP.el('span', 'badge', String(i + 1));
      b.append(grip, h, badge);
      b.addEventListener('click', function () { PP.show(i); });
      bindDrag(b, grip, i);
      st.append(b);
    });
  };

  function bindDrag(b, grip, i) {
    function start(e) {
      if (e.button !== 0) return;
      var fromGrip = e.target.closest && e.target.closest('.grip');
      if (e.pointerType !== 'mouse' && !fromGrip) return;
      if (fromGrip) { e.preventDefault(); e.stopPropagation(); }
      var sx = e.clientX, sy = e.clientY, pid = e.pointerId, active = false;
      function move(ev) {
        if (ev.pointerId !== pid) return;
        if (!active && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 8) return;
        if (!active) {
          active = true;
          b.classList.add('dragging');
          try { b.setPointerCapture(pid); } catch (err) {}
        }
        ev.preventDefault();
        var under = document.elementFromPoint(ev.clientX, ev.clientY);
        var t = under && under.closest ? under.closest('.thumb') : null;
        document.querySelectorAll('.thumb.drag-over').forEach(function (n) { if (n !== t) n.classList.remove('drag-over'); });
        if (t && t !== b) t.classList.add('drag-over');
      }
      function up(ev) {
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
        document.removeEventListener('pointercancel', up);
        b.classList.remove('dragging');
        var target = document.querySelector('.thumb.drag-over');
        document.querySelectorAll('.thumb.drag-over').forEach(function (n) { n.classList.remove('drag-over'); });
        if (!active) return;
        ev.preventDefault();
        var to = target ? Number(target.dataset.index) : NaN;
        if (Number.isInteger(to) && to !== i) {
          PP.snapshot();
          var item = PP.state.slides.splice(i, 1)[0];
          PP.state.slides.splice(to, 0, item);
          PP.commit(to);
        }
      }
      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', up);
      document.addEventListener('pointercancel', up);
    }
    b.addEventListener('pointerdown', start);
  }

  PP.show = function (i) {
    if (!PP.state.slides.length) return;
    PP.state.i = Math.max(0, Math.min(PP.state.slides.length - 1, i));
    PP.put(PP.$('stage'), PP.state.i, !PP.state.edit, PP.state.edit);
    var notes = PP.$('notes');
    if (notes) notes.value = PP.state.slides[PP.state.i].notes || '';
    if (PP.stopSpeak) PP.stopSpeak();
    var dz = PP.$('dz');
    if (dz) dz.disabled = false;
    if (PP.syncDesigner) PP.syncDesigner();
    if (PP.finders) PP.finders();
    var pos = PP.$('slidePos');
    if (pos) pos.textContent = 'Slide ' + (PP.state.i + 1) + ' of ' + PP.state.slides.length;
    var prev = PP.$('prev'), next = PP.$('next');
    if (prev) prev.disabled = PP.state.i === 0;
    if (next) next.disabled = PP.state.i === PP.state.slides.length - 1;
    var st = PP.$('strip');
    if (st) {
      if (st.children.length !== PP.state.slides.length) PP.strip();
      Array.prototype.forEach.call(st.children, function (b, k) {
        b.setAttribute('aria-current', k === PP.state.i ? 'true' : 'false');
      });
      var cur = st.children[PP.state.i];
      if (cur && cur.getBoundingClientRect) {
        var delta = cur.getBoundingClientRect().left - st.getBoundingClientRect().left;
        var target = st.scrollLeft + delta - (st.clientWidth - cur.clientWidth) / 2;
        st.scrollTo({ left: Math.max(0, target), behavior: PP.reducedMotion() ? 'auto' : 'smooth' });
      }
    }
    if (PP.scheduleAutosave) PP.scheduleAutosave();
    var pres = PP.$('pres');
    if (pres && !pres.hidden) {
      PP.put(PP.$('phost'), PP.state.i, true);
      PP.studio();
      PP.$('pbar').style.width = ((PP.state.i + 1) / PP.state.slides.length * 100) + '%';
    }
  };

  PP.commit = function (i) {
    PP.state.i = Math.max(0, Math.min(PP.state.slides.length - 1, i));
    PP.strip();
    PP.show(PP.state.i);
  };

  PP.generate = function (opts) {
    PP.toast();
    if (PP.Usage && PP.Usage.blocked()) return void PP.Signup.open(function () { PP.generate(opts); });
    var s = PP.Parse.run(PP.$('txt').value);
    if (!s.length) return PP.toast('Add some notes or a file first.');
    PP.snapshot();
    PP.state.slides = s;
    if (PP.state.brand) PP.state.slides.forEach(function (x) { x.a1 = PP.state.brand.primary; x.a2 = PP.state.brand.secondary; });
    var bg = PP.TPL_BG[PP.currentTemplateName];
    if (bg) PP.state.slides.forEach(function (x, i) { x.bgpic = bg; x.bgseed = PP.hash(PP.currentTemplateName + i); x.bgop = 38; });
    PP.state.trash = [];
    PP.updateHistoryButtons();
    PP.enableDeckControls(true);
    if (PP.enterDesign) PP.enterDesign();
    PP.strip();
    PP.show(0);
    if (opts !== true && PP.Usage) PP.Usage.bump();
  };

  function slideText(s) {
    return s.notes || [s.title, s.sub].concat(s.items || []).concat((s.stats || []).map(function (x) { return x.v + ' ' + x.l; })).filter(Boolean).join('. ');
  }
  PP.stopSpeak = function () {
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    var b = PP.$('narrate');
    if (!b) return;
    b.setAttribute('aria-pressed', 'false');
    b.textContent = 'Narrate';
  };
  PP.narrate = function () {
    if (!PP.state.slides.length) return;
    if (!('speechSynthesis' in window)) return PP.toast('This browser has no built-in voice.');
    if (speechSynthesis.speaking) return PP.stopSpeak();
    var u = new SpeechSynthesisUtterance(slideText(PP.state.slides[PP.state.i]).slice(0, 1500));
    var b = PP.$('narrate');
    u.rate = .98;
    u.onend = u.onerror = function () { b.setAttribute('aria-pressed', 'false'); b.textContent = 'Narrate'; };
    speechSynthesis.speak(u);
    b.setAttribute('aria-pressed', 'true');
    b.textContent = 'Stop voice';
  };

  PP.studio = function () {
    var s = PP.state.slides[PP.state.i];
    if (!s) return;
    PP.$('pnum').textContent = 'Slide ' + (PP.state.i + 1) + ' of ' + PP.state.slides.length;
    PP.$('pnotes').textContent = s.notes || 'No notes for this slide. Press N to hear it read aloud.';
    var box = PP.$('pnext');
    if (!box) return;
    box.replaceChildren();
    if (PP.state.i >= PP.state.slides.length - 1) {
      box.append(PP.el('p', 'next-end', 'Last slide'));
      return;
    }
    var label = PP.el('p', 'next-label', 'Next');
    var h = PP.el('div', 'host');
    h.append(PP.el('div', 'wrap'));
    h.firstChild.append(PP.buildSlide(PP.state.slides[PP.state.i + 1], PP.state.i + 1, false));
    PP.ro.observe(h);
    box.append(label, h);
  };

  function startTimer() {
    var t0 = Date.now();
    var f = function () {
      var d = Math.floor((Date.now() - t0) / 1000);
      PP.$('ptime').textContent = String(Math.floor(d / 60)).padStart(2, '0') + ':' + String(d % 60).padStart(2, '0');
    };
    clearInterval(tick);
    f();
    tick = setInterval(f, 1000);
  }
  PP.fitPres = function () {
    var host = PP.$('phost');
    if (!host) return;
    host.style.width = Math.min(innerWidth * .96, (innerHeight - 28) * 16 / 9) + 'px';
  };
  PP.present = function (on) {
    var pres = PP.$('pres');
    pres.hidden = !on;
    if (on) {
      startTimer();
      PP.fitPres();
      PP.show(PP.state.i);
      pres.tabIndex = -1;
      pres.focus();
      pres.requestFullscreen?.().catch(function () {});
    } else {
      clearInterval(tick);
      PP.stopSpeak();
      if (document.fullscreenElement) document.exitFullscreen();
    }
  };

  function typingTarget(el) {
    return !!(el && (el.isContentEditable || /^(TEXTAREA|SELECT|INPUT)$/.test(el.tagName)));
  }
  function dialogOpen() {
    return !!document.querySelector('dialog[open]');
  }

  PP.openHelp = function () {
    var d = PP.$('helpDlg');
    if (!d) return;
    if (typeof d.showModal === 'function') { if (!d.open) d.showModal(); }
    else d.setAttribute('open', '');
  };
  PP.closeHelp = function () {
    var d = PP.$('helpDlg');
    if (!d) return;
    if (typeof d.close === 'function') d.close();
    else d.removeAttribute('open');
  };

  function swipe(node) {
    var x0 = null;
    node.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    node.addEventListener('touchend', function (e) {
      if (x0 === null || (PP.state.edit && node.id === 'stage') || !PP.state.slides.length) return;
      var dx = e.changedTouches[0].clientX - x0;
      x0 = null;
      if (Math.abs(dx) > 50) PP.show(PP.state.i + (dx < 0 ? 1 : -1));
    }, { passive: true });
  }

  PP.initStage = function () {
    PP.$('build').addEventListener('click', function () { PP.generate(); });
    PP.$('motion').addEventListener('change', function (e) {
      PP.snapshot();
      PP.state.motion = e.target.value;
      if (PP.state.slides.length) PP.show(PP.state.i);
    });
    PP.$('prev').addEventListener('click', function () { PP.show(PP.state.i - 1); });
    PP.$('next').addEventListener('click', function () { PP.show(PP.state.i + 1); });
    PP.$('present').addEventListener('click', function () { PP.present(true); });
    PP.$('edit').addEventListener('click', function () {
      PP.state.edit = !PP.state.edit;
      PP.$('edit').setAttribute('aria-pressed', String(PP.state.edit));
      var hint = PP.$('designHint');
      if (hint) hint.hidden = !PP.state.edit;
      if (!PP.state.edit && PP.clearCanvasSel) PP.clearCanvasSel();
      PP.show(PP.state.i);
    });
    PP.$('narrate').addEventListener('click', PP.narrate);
    PP.$('undoBtn').addEventListener('click', PP.undo);
    PP.$('redoBtn').addEventListener('click', PP.redo);
    PP.$('helpBtn').addEventListener('click', PP.openHelp);
    PP.$('helpClose').addEventListener('click', PP.closeHelp);
    PP.$('pexit').addEventListener('click', function () { PP.present(false); });
    PP.$('pstudio').addEventListener('click', function (e) { e.stopPropagation(); });
    PP.$('pres').addEventListener('click', function () { PP.show(PP.state.i + 1); });
    document.addEventListener('fullscreenchange', function () {
      if (!document.fullscreenElement && PP.$('pres') && !PP.$('pres').hidden) PP.present(false);
    });
    addEventListener('resize', PP.fitPres);
    addEventListener('orientationchange', PP.fitPres);
    PP.fitPres();
    swipe(PP.$('stage'));
    swipe(PP.$('pres'));
    PP.ro.observe(PP.$('stage'));
    PP.ro.observe(PP.$('phost'));

    document.addEventListener('keydown', function (e) {
      var meta = e.ctrlKey || e.metaKey;
      var key = e.key;
      var typing = typingTarget(e.target);
      if (meta && key === 'Enter') { e.preventDefault(); PP.generate(); return; }
      if (meta && key.toLowerCase() === 's') { e.preventDefault(); PP.saveDeckFile(); return; }
      if (e.target.closest && e.target.closest('#editorDragHandle')) return;
      if (typing || dialogOpen()) return;
      if (meta && key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) PP.redo(); else PP.undo(); return; }
      if (meta && key.toLowerCase() === 'y') { e.preventDefault(); PP.redo(); return; }
      if (meta && key.toLowerCase() === 'd') {
        e.preventDefault();
        if (PP.canvasSel && PP.state.edit && PP.duplicateSelection) PP.duplicateSelection();
        else PP.duplicateSlide();
        return;
      }
      if (key === '?' || (e.shiftKey && key === '/')) { e.preventDefault(); PP.openHelp(); return; }
      if (!PP.state.slides.length) {
        if (key === 'p' || key === 'P') return;
        return;
      }
      if (e.altKey && (key === 'ArrowLeft' || key === 'ArrowRight')) {
        e.preventDefault();
        PP.moveSlide(key === 'ArrowLeft' ? -1 : 1);
        return;
      }
      if (!meta && !e.altKey && PP.state.edit && PP.canvasSel && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].indexOf(key) >= 0) {
        e.preventDefault();
        var step = e.shiftKey ? 20 : 4;
        PP.nudgeSelection(key === 'ArrowLeft' ? -step : key === 'ArrowRight' ? step : 0, key === 'ArrowUp' ? -step : key === 'ArrowDown' ? step : 0);
        return;
      }
      if ((key === 'Delete' || key === 'Backspace') && PP.state.edit && PP.canvasSel && PP.$('pres').hidden) {
        e.preventDefault();
        PP.deleteSelection();
        return;
      }
      if (key === 'Escape' && PP.$('pres').hidden && PP.canvasSel) { PP.clearCanvasSel(); return; }
      if (meta || e.altKey) return;
      if (['ArrowRight', 'PageDown', ' '].indexOf(key) >= 0) { e.preventDefault(); PP.show(PP.state.i + 1); }
      else if (['ArrowLeft', 'PageUp'].indexOf(key) >= 0) { e.preventDefault(); PP.show(PP.state.i - 1); }
      else if (key === 'Home') PP.show(0);
      else if (key === 'End') PP.show(PP.state.slides.length - 1);
      else if (key === 'Escape' && !PP.$('pres').hidden) PP.present(false);
      else if (key === 'n' || key === 'N') PP.narrate();
      else if ((key === 's' || key === 'S') && !PP.$('pres').hidden) PP.$('pstudio').hidden = !PP.$('pstudio').hidden;
      else if ((key === 'p' || key === 'P') && PP.$('pres').hidden) PP.present(true);
    });
    PP.$('notes').addEventListener('beforeinput', function () {
      if (!PP.state.slides.length || PP._noteSnap) return;
      PP.snapshot();
      PP._noteSnap = true;
    });
    PP.$('notes').addEventListener('blur', function () { PP._noteSnap = false; });
    PP.$('notes').addEventListener('input', function () {
      if (!PP.state.slides.length) return;
      PP.state.slides[PP.state.i].notes = PP.Sec.clean(PP.$('notes').value).slice(0, 2000);
      PP.scheduleAutosave();
    });
  };
})(typeof window !== 'undefined' ? window : globalThis);
