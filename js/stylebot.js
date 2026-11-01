/* Offline style bot: three premium looks from a short description. Nothing leaves the browser. */
(function (root) {
  'use strict';
  var PP = root.PP || (root.PP = {});

  PP.STYLES = [
    { id: 'style-brass', n: 'Ink and brass', why: 'Charcoal ground, one brass accent, serif titles. A private briefing.', keys: /invest|board|executive|private|bank|gold|premium|gala|dinner|luxury|wealth|fund/, bg1: '#14110e', bg2: '#2c241c', tx: '#f7f1e8', mu: '#d2c3b0', a1: '#d4a574', a2: '#8d5e3c', ff: 'Fraunces', motion: 'fade', bgpic: 'facets', bgop: 28, anim: 'fade' },
    { id: 'style-gallery', n: 'Gallery white', why: 'Warm paper, a museum red, and lots of quiet space.', keys: /gallery|museum|art|exhibit|editorial|magazine|culture|fashion|print/, bg1: '#f7f3ec', bg2: '#efe4d4', tx: '#1c1915', mu: '#6d645b', a1: '#9c3b2e', a2: '#c4a574', ff: 'Fraunces', motion: 'fade', bgpic: 'topo', bgop: 22, anim: 'fade' },
    { id: 'style-night', n: 'Night paper', why: 'Near-black with ivory type. Built for a dark room and a spotlight.', keys: /night|keynote|stage|conference|evening|talk|opera|cinema/, bg1: '#0e1214', bg2: '#1b2830', tx: '#f4f7f6', mu: '#c5d0cc', a1: '#efe6d2', a2: '#8aa0a6', ff: 'Fraunces', motion: 'cinematic', bgpic: 'mesh', bgop: 30, anim: 'blur' },
    { id: 'style-linen', n: 'Linen coast', why: 'Sand, deep teal, and a soft wave. Calm enough for a clinic or a hotel.', keys: /clinic|health|calm|wellness|coast|hotel|travel|spa|ocean|care/, bg1: '#f4f0e6', bg2: '#d5e3dc', tx: '#17211f', mu: '#4e655f', a1: '#1f6f6a', a2: '#c47b4a', ff: 'DM Sans', motion: 'fade', bgpic: 'waves', bgop: 26, anim: 'fade' },
    { id: 'style-reserve', n: 'Reserve', why: 'Deep green and cream, like an estate report.', keys: /forest|farm|harvest|nature|ngo|impact|environment|wine|estate|garden|leaf/, bg1: '#10211a', bg2: '#1d3a2c', tx: '#f4f7f2', mu: '#c9d6cc', a1: '#e6c98a', a2: '#8fbf9a', ff: 'Fraunces', motion: 'fade', bgpic: 'hex', bgop: 24, anim: 'fade' },
    { id: 'style-blueprint', n: 'Blueprint', why: 'Paper, ink blue, and a fine circuit. For a plan people have to trust.', keys: /engineer|technical|architecture|blueprint|system|software|data|product|report|quarter/, bg1: '#f6f3ec', bg2: '#e3ebf3', tx: '#172033', mu: '#4c5b73', a1: '#1d4e89', a2: '#c4522a', ff: 'DM Sans', motion: 'wipe', bgpic: 'circuit', bgop: 20, anim: 'none' },
    { id: 'style-clay', n: 'Clay studio', why: 'Dusty clay and ink. Warm, handmade, still sharp.', keys: /workshop|class|lesson|school|teach|creative|studio|brand|craft|design/, bg1: '#f6efe8', bg2: '#f0d9cc', tx: '#2a211c', mu: '#6e564c', a1: '#c4522a', a2: '#6b4a3a', ff: 'Fraunces', motion: 'slide', bgpic: 'dots', bgop: 24, anim: 'fade' },
    { id: 'style-signal', n: 'Signal', why: 'Black, ivory, and one gold mark. A pitch that does not shout.', keys: /startup|pitch|sales|bold|launch|marketing|campaign|app\b|founder/, bg1: '#111111', bg2: '#1c1c1c', tx: '#f6f6f2', mu: '#c8c8c0', a1: '#e2b657', a2: '#ffffff', ff: 'Bricolage Grotesque', motion: 'zoom', bgpic: 'rays', bgop: 22, anim: 'zoom' }
  ];

  PP.rankStyles = function (text) {
    var low = String(text || '').toLowerCase();
    var ranked = PP.STYLES.map(function (style) {
      var hits = low ? (low.match(new RegExp(style.keys.source, 'g')) || []).length : 0;
      return { style: style, hits: hits };
    }).sort(function (a, b) { return b.hits - a.hits; });
    return ranked.slice(0, 3).map(function (row) { return row.style; });
  };

  PP.paintStyle = function (id, silent) {
    var recipe = PP.STYLES.filter(function (s) { return s.id === id; })[0];
    if (!recipe || !PP.state.slides.length) return false;
    PP.THEMES[recipe.id] = { n: recipe.n, bg1: recipe.bg1, bg2: recipe.bg2, tx: recipe.tx, mu: recipe.mu, a1: recipe.a1, a2: recipe.a2, ff: recipe.ff };
    PP.state.theme = recipe.id;
    PP.state.motion = recipe.motion;
    if (PP.$('motion')) PP.$('motion').value = recipe.motion;
    PP.state.slides.forEach(function (s, i) {
      ['bg1', 'bg2', 'a1', 'a2', 'tx', 'font', 'theme'].forEach(function (k) { delete s[k]; });
      s.bgpic = recipe.bgpic;
      s.bgop = recipe.bgop;
      s.bgseed = PP.hash(recipe.id + ':' + i);
      s.anim = recipe.anim;
      delete s.trans;
    });
    PP.lockedStyle = recipe.id;
    if (PP.rebuildThemes) PP.rebuildThemes();
    if (!silent) {
      PP.strip();
      PP.show(PP.state.i);
    }
    return true;
  };

  function askText() {
    var typed = PP.$('styleAsk') ? PP.$('styleAsk').value.trim() : '';
    var idea = PP.$('idea') ? PP.$('idea').value.trim() : '';
    var title = PP.state.slides[0] && PP.state.slides[0].title || '';
    return typed || idea || title;
  }

  function renderPicks(list, matched) {
    var box = PP.$('stylePicks');
    box.replaceChildren();
    list.forEach(function (style) {
      var b = PP.el('button', 'style-card');
      b.type = 'button';
      var sw = PP.el('span', 'style-swatch');
      sw.style.background = 'linear-gradient(145deg,' + style.bg1 + ',' + style.bg2 + ' 60%,' + style.a1 + ')';
      var copy = PP.el('span');
      copy.append(PP.el('strong', null, style.n), PP.el('small', null, style.why));
      b.append(sw, copy);
      b.addEventListener('click', function () {
        if (!PP.state.slides.length) {
          PP.THEMES[style.id] = { n: style.n, bg1: style.bg1, bg2: style.bg2, tx: style.tx, mu: style.mu, a1: style.a1, a2: style.a2, ff: style.ff };
          PP.state.theme = style.id;
          PP.state.motion = style.motion;
          if (PP.$('motion')) PP.$('motion').value = style.motion;
          PP.lockedStyle = style.id;
          if (PP.rebuildThemes) PP.rebuildThemes();
          PP.$('styleNote').textContent = style.n + ' is ready. Build the deck and this look covers every slide.';
          return;
        }
        PP.snapshot();
        PP.paintStyle(style.id);
        PP.$('styleNote').textContent = style.n + ' is on every slide. Reset colours in Adjust this slide if you want the plain theme back.';
        PP.toast(style.n + ' applied.', true);
      });
      box.append(b);
    });
    PP.$('styleNote').textContent = matched
      ? 'Three looks, closest first. Click one to use it.'
      : 'Add a few words about the occasion for a closer match. These three are a safe start.';
  }

  PP.initStyleBot = function () {
    PP.$('styleGo').addEventListener('click', function () {
      var text = askText();
      if (PP.$('styleAsk') && !PP.$('styleAsk').value.trim() && text) PP.$('styleAsk').value = text.slice(0, 120);
      renderPicks(PP.rankStyles(text), text.length > 2);
    });
    PP.$('styleAsk').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); PP.$('styleGo').click(); }
    });
  };
})(typeof window !== 'undefined' ? window : globalThis);
