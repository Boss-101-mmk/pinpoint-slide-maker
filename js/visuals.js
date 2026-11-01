/* Themes, generated artwork, background patterns, and the 1280×720 slide renderer. */
(function (root) {
  'use strict';
  var PP = root.PP || (root.PP = {});

  PP.THEMES = {
    aurora: { n: 'Aurora', bg1: '#1b1446', bg2: '#0f3d6e', tx: '#ffffff', mu: '#c3cdf0', a1: '#7cf5d4', a2: '#b794ff', ff: 'Bricolage Grotesque' },
    studio: { n: 'Studio', bg1: '#f7f8fc', bg2: '#e6ebf8', tx: '#111827', mu: '#4b5878', a1: '#2f5bff', a2: '#ff7a59', ff: 'DM Sans' },
    pitch: { n: 'Pitch', bg1: '#14081f', bg2: '#2b0f45', tx: '#ffffff', mu: '#d6c4ee', a1: '#ffd23f', a2: '#ff4f81', ff: 'Bricolage Grotesque' },
    noir: { n: 'Noir', bg1: '#0b0f14', bg2: '#18212d', tx: '#f1f5f9', mu: '#9fb0c6', a1: '#5ec8ff', a2: '#ff9f6b', ff: 'DM Sans' },
    kafue: { n: 'Kafue', bg1: '#0d3b2e', bg2: '#165c45', tx: '#f2fff8', mu: '#b7dccb', a1: '#ffb703', a2: '#ff6b35', ff: 'Bricolage Grotesque' },
    sorbet: { n: 'Sorbet', bg1: '#fff4ec', bg2: '#ffdce9', tx: '#2b1b2e', mu: '#6e5470', a1: '#e4405f', a2: '#7c4dff', ff: 'DM Sans' },
    gold: { n: 'Midnight Gold', bg1: '#0a0a0f', bg2: '#1c1730', tx: '#faf6ea', mu: '#bdb59c', a1: '#d4af37', a2: '#f5e6a8', ff: 'Fraunces' },
    ocean: { n: 'Ocean', bg1: '#032b44', bg2: '#0a5c7a', tx: '#f0fbff', mu: '#a9d6e5', a1: '#7fe7ff', a2: '#ffd166', ff: 'DM Sans' },
    editorial: { n: 'Editorial', bg1: '#f5f1e8', bg2: '#e9e1cf', tx: '#1c1a17', mu: '#5d574b', a1: '#b8322a', a2: '#1f4e5f', ff: 'Fraunces' },
    glass: { n: 'Glass', bg1: '#0f172a', bg2: '#312e81', tx: '#f8fafc', mu: '#c7d2fe', a1: '#a5b4fc', a2: '#f0abfc', ff: 'Bricolage Grotesque' },
    dawn: { n: 'Dawn', bg1: '#2a1420', bg2: '#8a3d32', tx: '#fff7f2', mu: '#ffd5c4', a1: '#ffd7a8', a2: '#ff7a59', ff: 'Fraunces' },
    slate: { n: 'Slate', bg1: '#0f1720', bg2: '#1e3a4c', tx: '#f4f7fb', mu: '#b7c6d4', a1: '#7dd3c7', a2: '#f2c14e', ff: 'DM Sans' }
  };

  function hash(s) {
    var h = 2166136261;
    for (var c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  PP.hash = hash;
  function rng(a) {
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  PP.rng = rng;

  var SCENES = {
    bars: function (a) {
      for (var i = 0; i < 5; i++) {
        var h = 70 + i * 58;
        a('rect', { x: 80 + i * 64, y: 520 - h, width: 46, height: h, rx: 9 }, 'fill:var(' + (i % 2 ? '--a2' : '--a1') + ')');
      }
      a('polyline', { points: '90,430 190,370 270,390 400,250', fill: 'none' }, 'stroke:var(--tx,#fff);stroke-width:8;stroke-linecap:round;stroke-linejoin:round;opacity:.8');
    },
    people: function (a) {
      [[165, 340, 34], [240, 300, 44], [315, 340, 34]].forEach(function (p, i) {
        a('circle', { cx: p[0], cy: p[1], r: p[2] }, 'fill:var(' + (i % 2 ? '--a2' : '--a1') + ')');
        a('ellipse', { cx: p[0], cy: p[1] + p[2] + 60, rx: p[2] * 1.6, ry: p[2] * 1.4 }, 'fill:var(' + (i % 2 ? '--a2' : '--a1') + ');opacity:.85');
      });
    },
    bulb: function (a) {
      a('circle', { cx: 240, cy: 330, r: 92 }, 'fill:var(--a1)');
      a('rect', { x: 205, y: 410, width: 70, height: 60, rx: 12 }, 'fill:var(--a2)');
      [0, 60, 120, 180, 240, 300].forEach(function (d) {
        var r = d * Math.PI / 180;
        a('line', { x1: 240 + Math.cos(r) * 125, y1: 330 + Math.sin(r) * 125, x2: 240 + Math.cos(r) * 160, y2: 330 + Math.sin(r) * 160 }, 'stroke:var(--a2);stroke-width:8;stroke-linecap:round');
      });
    },
    globe: function (a) {
      var st = 'fill:none;stroke:var(--a1);stroke-width:7';
      a('circle', { cx: 240, cy: 360, r: 125 }, st);
      a('ellipse', { cx: 240, cy: 360, rx: 55, ry: 125 }, st);
      a('ellipse', { cx: 240, cy: 360, rx: 125, ry: 45 }, st);
      a('line', { x1: 240, y1: 235, x2: 240, y2: 485 }, st);
    },
    shield: function (a) {
      a('path', { d: 'M240 230L340 270V380C340 450 290 490 240 510C190 490 140 450 140 380V270Z' }, 'fill:var(--a1)');
      a('path', { d: 'M195 370L230 405L290 335', fill: 'none' }, 'stroke:var(--bg1);stroke-width:16;stroke-linecap:round;stroke-linejoin:round');
    },
    rocket: function (a) {
      a('path', { d: 'M240 190C292 255 292 380 272 445H208C188 380 188 255 240 190Z' }, 'fill:var(--a1)');
      a('circle', { cx: 240, cy: 300, r: 27 }, 'fill:var(--bg1)');
      a('path', { d: 'M210 410L160 475L210 450Z M270 410L320 475L270 450Z' }, 'fill:var(--a2)');
      a('path', { d: 'M222 455Q240 540 258 455Z' }, 'fill:var(--a2)');
    },
    sun: function (a) {
      a('circle', { cx: 240, cy: 300, r: 68 }, 'fill:var(--a1)');
      for (var d = 0; d < 360; d += 45) {
        var r = d * Math.PI / 180;
        a('line', { x1: 240 + Math.cos(r) * 92, y1: 300 + Math.sin(r) * 92, x2: 240 + Math.cos(r) * 125, y2: 300 + Math.sin(r) * 125 }, 'stroke:var(--a1);stroke-width:9;stroke-linecap:round');
      }
      a('path', { d: 'M140 560C140 440 220 390 340 390C340 490 270 560 140 560Z' }, 'fill:var(--a2)');
      a('path', { d: 'M150 550L300 430', fill: 'none' }, 'stroke:var(--bg1);stroke-width:5;stroke-linecap:round');
    },
    coins: function (a) {
      for (var i = 0; i < 4; i++) a('ellipse', { cx: 240, cy: 500 - i * 52, rx: 105, ry: 32 }, 'fill:var(' + (i % 2 ? '--a2' : '--a1') + ');stroke:var(--bg1);stroke-width:5');
    }
  };
  var SCENE_KEYS = [
    ['rocket', /launch|rocket|startup|beacon|introducing/],
    ['bars', /revenue|sales|growth|profit|market|performance|result/],
    ['coins', /budget|cost|fund|price|\$/],
    ['shield', /secur|risk|safe|protect/],
    ['people', /team|people|community|youth|student|customer|farmer|mentor/],
    ['bulb', /idea|innovat|solution|learn|goal/],
    ['globe', /global|world|africa|country|national|internet|wi-?fi/],
    ['sun', /solar|harvest|farm|plant|leaf|energy|sun/]
  ];
  PP.pickScene = function (s) {
    var t = (s.title + ' ' + (s.items || []).join(' ') + ' ' + (s.sub || '')).toLowerCase();
    for (var pair of SCENE_KEYS) if (pair[1].test(t)) return pair[0];
    return null;
  };
  PP.art = function (seed, wide, kind) {
    var r = rng(seed), NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 480 720');
    svg.setAttribute('class', 'art' + (wide ? ' wide' : ''));
    svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    svg.setAttribute('aria-hidden', 'true');
    var add = function (tag, at, st) {
      var n = document.createElementNS(NS, tag);
      for (var k in at) n.setAttribute(k, at[k]);
      /* cssText stays allowed under a style-src policy that blocks style attributes. */
      n.style.cssText = st;
      svg.appendChild(n);
    };
    for (var i = 0; i < 6; i++) add('circle', { cx: r() * 480, cy: r() * 720, r: 60 + r() * 140 }, 'fill:var(' + (i % 2 ? '--a2' : '--a1') + ');opacity:' + (.12 + r() * .2));
    add('rect', { x: 120, y: 260, width: 220, height: 220, rx: 52, transform: 'rotate(' + (r() * 40 - 20) + ' 230 370)' }, 'fill:none;stroke:var(--a2);stroke-width:3;opacity:.5');
    if (kind && SCENES[kind]) { SCENES[kind](add); return svg; }
    var px = 150 + r() * 180, py = 260 + r() * 200;
    add('path', { d: 'M0-70C-30-70-52-48-52-20c0 36 52 90 52 90s52-54 52-90C52-48 30-70 0-70z', transform: 'translate(' + px + ' ' + py + ')' }, 'fill:var(--a1)');
    add('circle', { cx: px, cy: py - 20, r: 18 }, 'fill:var(--bg1)');
    return svg;
  };

  PP.BGNAMES = { mesh: 'Aurora glow', waves: 'Waves', topo: 'Contours', dots: 'Halftone', stripes: 'Stripes', hex: 'Honeycomb', circuit: 'Circuit', rays: 'Sunburst', bokeh: 'Bokeh', facets: 'Facets' };
  function f1(n) { return Math.round(n * 10) / 10; }
  function op2(a, b, r) { return (a + r() * b).toFixed(2); }
  PP.BG = {
    mesh: function (c, r) {
      var o = '<defs>' + [c.a1, c.a2, c.a1, c.a2].map(function (col, i) {
        return '<radialGradient id="g' + i + '"><stop offset="0" stop-color="' + col + '" stop-opacity=".75"/><stop offset="1" stop-color="' + col + '" stop-opacity="0"/></radialGradient>';
      }).join('') + '</defs>';
      for (var i = 0; i < 4; i++) o += '<circle cx="' + f1(r() * 1280) + '" cy="' + f1(r() * 720) + '" r="' + f1(280 + r() * 260) + '" fill="url(#g' + i + ')"/>';
      return o;
    },
    waves: function (c, r) {
      var o = '';
      for (var k = 0; k < 5; k++) {
        var y = 300 + k * 70 + r() * 30, a = 30 + r() * 40, ph = r() * 6.28, w = .012 + r() * .012;
        var d = 'M0 720 L0 ' + f1(y);
        for (var x = 0; x <= 1280; x += 40) d += ' L' + x + ' ' + f1(y + Math.sin(x * w + ph) * a);
        o += '<path d="' + d + ' L1280 720 Z" fill="' + (k % 2 ? c.a2 : c.a1) + '" fill-opacity="' + (.08 + k * .04).toFixed(2) + '"/>';
      }
      return o;
    },
    topo: function (c, r) {
      var o = '', ph = [r() * 6, r() * 6];
      [[200 + r() * 300, 200 + r() * 300], [800 + r() * 350, 350 + r() * 300]].forEach(function (pt, j) {
        for (var k = 1; k <= 12; k++) {
          var d = '', R = k * 34;
          for (var a = 0; a <= 360; a += 6) {
            var t = a * Math.PI / 180;
            var rr = R * (1 + .14 * Math.sin(3 * t + ph[0] + j) + .08 * Math.sin(5 * t + ph[1] + k * .05));
            d += (a ? 'L' : 'M') + f1(pt[0] + Math.cos(t) * rr * 1.3) + ' ' + f1(pt[1] + Math.sin(t) * rr) + ' ';
          }
          o += '<path d="' + d + 'Z" fill="none" stroke="' + c.tx + '" stroke-opacity=".16" stroke-width="2"/>';
        }
      });
      return o;
    },
    dots: function (c, r) {
      var o = '', ang = r() * 6.28;
      for (var y = 20; y < 720; y += 40) for (var x = 20; x < 1280; x += 40) {
        var t = (x * Math.cos(ang) + y * Math.sin(ang)) / 1500 + .5;
        var rad = Math.max(.8, Math.min(16, t * 16));
        o += '<circle cx="' + x + '" cy="' + y + '" r="' + f1(rad) + '" fill="' + c.a1 + '" fill-opacity=".3"/>';
      }
      return o;
    },
    stripes: function (c, r) {
      var o = '<g transform="rotate(' + f1(-25 + r() * 50) + ' 640 360)">';
      for (var i = 0; i < 28; i++) o += '<rect x="' + (-600 + i * 90) + '" y="-800" width="' + f1(20 + r() * 36) + '" height="2400" fill="' + (i % 2 ? c.a1 : c.a2) + '" fill-opacity="' + op2(.06, .1, r) + '"/>';
      return o + '</g>';
    },
    hex: function (c, r) {
      var o = '', R = 44, w = Math.sqrt(3) * R;
      for (var row = -1; row < 12; row++) for (var col = -1; col < 18; col++) {
        var x = col * w + (row % 2 ? w / 2 : 0), y = row * R * 1.5;
        var pts = [0, 1, 2, 3, 4, 5].map(function (i) {
          var t = (60 * i - 30) * Math.PI / 180;
          return f1(x + R * .94 * Math.cos(t)) + ',' + f1(y + R * .94 * Math.sin(t));
        }).join(' ');
        var q = r();
        o += '<polygon points="' + pts + '" fill="' + (q > .72 ? c.a1 : q > .5 ? c.a2 : 'none') + '" fill-opacity="' + op2(.08, .16, r) + '" stroke="' + c.tx + '" stroke-opacity=".1" stroke-width="1.5"/>';
      }
      return o;
    },
    circuit: function (c, r) {
      var o = '', g = 40;
      for (var k = 0; k < 26; k++) {
        var x = Math.round(r() * 32) * g, y = Math.round(r() * 18) * g, d = 'M' + x + ' ' + y, h = r() > .5;
        var n = 3 + Math.floor(r() * 3);
        for (var i = 0; i < n; i++) {
          var L = (2 + Math.floor(r() * 5)) * g * (r() > .5 ? 1 : -1);
          if (h) x += L; else y += L;
          h = !h;
          d += ' L' + x + ' ' + y;
        }
        o += '<path d="' + d + '" fill="none" stroke="' + (k % 3 ? c.a1 : c.a2) + '" stroke-opacity=".38" stroke-width="3" stroke-linejoin="round"/><circle cx="' + x + '" cy="' + y + '" r="9" fill="' + c.a1 + '" fill-opacity=".55"/>';
      }
      return o;
    },
    rays: function (c, r) {
      var o = '', cx = 300 + r() * 680, cy = -40 + r() * 300, n = 28;
      for (var i = 0; i < n; i += 2) {
        var a0 = i * 2 * Math.PI / n, a1 = (i + 1) * 2 * Math.PI / n;
        o += '<polygon points="' + f1(cx) + ',' + f1(cy) + ' ' + f1(cx + Math.cos(a0) * 2400) + ',' + f1(cy + Math.sin(a0) * 2400) + ' ' + f1(cx + Math.cos(a1) * 2400) + ',' + f1(cy + Math.sin(a1) * 2400) + '" fill="' + (i % 4 ? c.a2 : c.a1) + '" fill-opacity=".1"/>';
      }
      return o + '<circle cx="' + f1(cx) + '" cy="' + f1(cy) + '" r="90" fill="' + c.a1 + '" fill-opacity=".25"/>';
    },
    bokeh: function (c, r) {
      var o = '';
      for (var i = 0; i < 22; i++) {
        var x = f1(r() * 1280), y = f1(r() * 720), rad = f1(20 + r() * 100);
        o += '<circle cx="' + x + '" cy="' + y + '" r="' + rad + '" fill="' + (i % 2 ? c.a1 : c.a2) + '" fill-opacity="' + op2(.08, .2, r) + '"/>' + (i % 4 === 0 ? '<circle cx="' + x + '" cy="' + y + '" r="' + rad + '" fill="none" stroke="' + c.tx + '" stroke-opacity=".2" stroke-width="2"/>' : '');
      }
      return o;
    },
    facets: function (c, r) {
      var cols = 9, rows = 5, P = [];
      for (var j = 0; j <= rows; j++) {
        P[j] = [];
        for (var i = 0; i <= cols; i++) P[j][i] = f1(i * 1280 / cols + (i && i < cols ? (r() - .5) * 90 : 0)) + ',' + f1(j * 720 / rows + (j && j < rows ? (r() - .5) * 90 : 0));
      }
      var fill = function () {
        var q = r();
        return 'fill="' + (q > .66 ? c.a1 : q > .33 ? c.a2 : c.tx) + '" fill-opacity="' + op2(.03, .12, r) + '"';
      };
      var o = '';
      for (var row = 0; row < rows; row++) for (var col = 0; col < cols; col++) {
        o += '<polygon points="' + P[row][col] + ' ' + P[row][col + 1] + ' ' + P[row + 1][col] + '" ' + fill() + '/><polygon points="' + P[row][col + 1] + ' ' + P[row + 1][col + 1] + ' ' + P[row + 1][col] + '" ' + fill() + '/>';
      }
      return o;
    }
  };
  PP.bgOk = function (s) { return !!s && typeof s.bgpic === 'string' && Object.prototype.hasOwnProperty.call(PP.BG, s.bgpic); };
  PP.bgSeed = function (s) { return Number.isInteger(s.bgseed) ? s.bgseed : 12345; };
  PP.bgOp = function (s) { var v = +s.bgop; return v >= 20 && v <= 100 ? v / 100 : .7; };
  PP.bgSvg = function (k, T, seed) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" preserveAspectRatio="xMidYMid slice">' + PP.BG[k](T, rng((seed >>> 0) || 1)) + '</svg>';
  };
  var bgCache = new Map();
  PP.bgUrl = function (k, T, seed) {
    var key = [k, T.bg1, T.bg2, T.a1, T.a2, T.tx, seed].join('|');
    if (bgCache.has(key)) return bgCache.get(key);
    var url = 'data:image/svg+xml,' + encodeURIComponent(PP.bgSvg(k, T, seed));
    if (bgCache.size > 80) bgCache.clear();
    bgCache.set(key, url);
    return url;
  };
  PP.rnd = function () { return Math.floor(Math.random() * 1e9); };
  PP.rasterBg = async function (s, T) {
    var img = new Image();
    await new Promise(function (res, rej) {
      img.onload = res;
      img.onerror = function () { rej(new Error('background')); };
      img.src = PP.bgUrl(s.bgpic, T, PP.bgSeed(s));
    });
    var cv = document.createElement('canvas');
    cv.width = 1280; cv.height = 720;
    var x = cv.getContext('2d'), g = x.createLinearGradient(0, 0, 1280, 720);
    g.addColorStop(0, T.bg1); g.addColorStop(1, T.bg2);
    x.fillStyle = g; x.fillRect(0, 0, 1280, 720);
    x.globalAlpha = PP.bgOp(s); x.drawImage(img, 0, 0, 1280, 720);
    return cv.toDataURL('image/png');
  };

  PP.effTheme = function (s) {
    var base = PP.THEMES[s.theme] ? s.theme : PP.state.theme;
    var T = Object.assign({}, PP.THEMES[base]);
    if (PP.HEX.test(s.bg1 || '')) T.bg1 = s.bg1;
    if (PP.HEX.test(s.bg2 || '')) T.bg2 = s.bg2;
    if (PP.HEX.test(s.a1 || '')) T.a1 = s.a1;
    if (PP.HEX.test(s.a2 || '')) T.a2 = s.a2;
    if (PP.HEX.test(s.tx || '')) { T.tx = s.tx; T.mu = s.tx; }
    if (PP.FONTS.indexOf(s.font) >= 0) T.ff = s.font;
    return T;
  };

  PP.makeEditable = function (node, set) {
    node.contentEditable = 'plaintext-only';
    if (node.contentEditable !== 'plaintext-only') {
      node.contentEditable = 'true';
      node.addEventListener('paste', function (e) {
        e.preventDefault();
        document.execCommand('insertText', false, (e.clipboardData.getData('text/plain') || '').replace(/\s+/g, ' '));
      });
    }
    node.setAttribute('role', 'textbox');
    node.addEventListener('beforeinput', function () {
      if (!PP._textSnap) { PP.snapshot(); PP._textSnap = true; }
    });
    node.addEventListener('input', function () {
      set(PP.Sec.clean(node.textContent).slice(0, 300));
      if (PP.scheduleAutosave) PP.scheduleAutosave();
    });
    node.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); node.blur(); }
      e.stopPropagation();
    });
    node.addEventListener('blur', function () {
      PP._textSnap = false;
      if (PP.strip) PP.strip();
    });
  };

  PP.countUp = function (node, text) {
    var m = String(text).match(/^([^\d]*)([\d,.]+)(.*)$/);
    if (!m || PP.reducedMotion()) return;
    var end = parseFloat(m[2].replace(/,/g, '')), dec = (m[2].split('.')[1] || '').length, comma = m[2].indexOf(',') >= 0;
    if (!isFinite(end)) return;
    var t0 = performance.now() + 450;
    var fmt = function (v) {
      return comma ? v.toLocaleString('en-US', { maximumFractionDigits: dec, minimumFractionDigits: dec }) : v.toFixed(dec);
    };
    node.textContent = m[1] + fmt(0) + m[3];
    var tick = function (t) {
      var k = Math.min(1, Math.max(0, (t - t0) / 1300));
      var e = 1 - Math.pow(1 - k, 3);
      node.textContent = m[1] + fmt(end * e) + m[3];
      if (k < 1 && node.isConnected) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  PP.buildSlide = function (s, idx, live, edit) {
    var T = PP.effTheme(s);
    var d = PP.el('div', 'slide ' + s.kind + (idx % 2 && s.kind === 'bullets' ? ' flip' : '') + (live ? ' live' : ''));
    var v = { '--bg1': T.bg1, '--bg2': T.bg2, '--stx': T.tx, '--smu': T.mu, '--a1': T.a1, '--a2': T.a2, '--ff': "'" + T.ff + "'" };
    for (var key in v) d.style.setProperty(key, v[key]);
    if (PP.HEX.test(s.tx || '')) d.style.setProperty('--smu', 'color-mix(in srgb,' + s.tx + ' 72%,transparent)');
    if (['fade', 'zoom', 'blur', 'none'].indexOf(s.anim) >= 0) d.classList.add('an-' + s.anim);
    if (s.speed === 'fast' || s.speed === 'slow') d.style.setProperty('--sp', s.speed === 'fast' ? '55ms' : '220ms');
    if (s.align === 'left' || s.align === 'center') d.classList.add('al-' + s.align);
    if (+s.size >= 70 && +s.size <= 140) d.style.setProperty('--fs', +s.size / 100);
    var wide = ['title', 'bullets'].indexOf(s.kind) < 0;
    if (PP.bgOk(s)) {
      var bd = PP.el('div', 'bgpic');
      bd.style.backgroundImage = 'url("' + PP.bgUrl(s.bgpic, T, PP.bgSeed(s)) + '")';
      bd.style.opacity = PP.bgOp(s);
      d.append(bd);
    }
    if (s.img) {
      var im = PP.el('img', 'photo' + (wide ? ' bg' : ''));
      im.src = s.img; im.alt = '';
      d.append(im);
    } else d.append(PP.art(hash(s.title + idx), wide, PP.pickScene(s)));
    var pad = PP.el('div', 'pad'), n = 0;
    var ed = function (node, set) { if (edit) PP.makeEditable(node, set); };
    var rv = function (x) { x.classList.add('rv'); x.style.setProperty('--d', n++); return x; };
    if (s.kind !== 'quote') {
      var h = PP.el(s.kind === 'title' || s.kind === 'section' || s.kind === 'closing' ? 'h1' : 'h2', 't');
      if (edit) { h.textContent = s.title; ed(h, function (val) { s.title = val; }); }
      else String(s.title || '').split(' ').forEach(function (w, k) {
        var sp = PP.el('span', 'w', w);
        sp.style.setProperty('--i', k);
        h.append(sp, ' ');
      });
      if ((s.title || '').length > 38) h.classList.add('sm');
      pad.append(h);
      n = 3;
    }
    if ((s.sub || (edit && ['title', 'section', 'closing'].indexOf(s.kind) >= 0)) && s.kind !== 'quote') {
      var p = PP.el('p', 'sub', s.sub || '');
      ed(p, function (val) { s.sub = val; });
      pad.append(rv(p));
    }
    if (s.kind === 'quote') {
      var q = PP.el('p', 'q', s.sub || '');
      ed(q, function (val) { s.sub = val; });
      pad.append(rv(q));
      if (s.title) pad.append(rv(PP.el('p', 'sub', '— ' + s.title)));
    }
    if (s.kind === 'steps' && s.items) {
      var flow = PP.el('div', 'flow');
      s.items.forEach(function (t, k) {
        var c = PP.el('div', 'step');
        var sp = PP.el('p', null, t);
        ed(sp, function (val) { s.items[k] = val; });
        c.append(PP.el('i', null, String(k + 1)), sp);
        flow.append(rv(c));
      });
      pad.append(flow);
    }
    if (s.kind === 'bullets' && s.items) {
      var ul = PP.el('ul');
      s.items.forEach(function (t, k) {
        var li = PP.el('li', null, t);
        ed(li, function (val) { s.items[k] = val; });
        ul.append(rv(li));
      });
      pad.append(ul);
    }
    if (s.kind === 'chart' && s.stats) {
      var chart = PP.el('div', 'chart-grid');
      var vals = s.stats.map(function (x) { return Math.max(0, Number(String(x.v).replace(/[^0-9.-]/g, '')) || 0); });
      var max = Math.max(1, Math.max.apply(null, vals));
      s.stats.forEach(function (x, k) {
        var row = PP.el('div', 'chart-row');
        var label = PP.el('span', 'chart-label', x.l);
        var track = PP.el('span', 'chart-track');
        var bar = PP.el('i', 'chart-fill');
        var value = PP.el('b', 'chart-value', x.v);
        bar.style.width = (vals[k] / max * 100) + '%';
        bar.style.background = T.a1;
        track.append(bar);
        ed(label, function (val) { x.l = val; });
        ed(value, function (val) {
          x.v = val;
          var z = Math.max(0, Number(String(val).replace(/[^0-9.-]/g, '')) || 0);
          bar.style.width = (z / max * 100) + '%';
        });
        row.append(label, track, value);
        chart.append(rv(row));
      });
      pad.append(chart);
    } else if (s.kind === 'stats' && s.stats) {
      var w = PP.el('div', 'stats');
      s.stats.forEach(function (x) {
        var c = PP.el('div', 'stat');
        var bb = PP.el('b', null, x.v), lb = PP.el('span', null, x.l);
        ed(bb, function (val) { x.v = val; });
        ed(lb, function (val) { x.l = val; });
        if (live) PP.countUp(bb, x.v);
        c.append(bb, lb);
        w.append(rv(c));
      });
      pad.append(w);
    }
    if (PP.state.brand && (PP.state.brand.logo || PP.state.brand.name)) {
      var mark = PP.state.brand.logo ? PP.el('img', 'brand-mark') : PP.el('span', 'brand-mark brand-name', PP.state.brand.name);
      if (PP.state.brand.logo) { mark.src = PP.state.brand.logo; mark.alt = PP.state.brand.name || 'Brand logo'; }
      d.append(mark);
    }
    d.append(pad, PP.el('div', 'foot', (idx + 1) + ' / ' + PP.state.slides.length));
    if (s.credit) d.append(PP.el('div', 'credit', s.credit));
    return d;
  };

  PP.ro = typeof ResizeObserver === 'function' ? new ResizeObserver(function (es) {
    es.forEach(function (e) { e.target.style.setProperty('--s', e.contentRect.width / 1280); });
  }) : { observe: function () {} };

  PP.put = function (host, i, live, edit, instant) {
    var sl = PP.state.slides[i];
    if (!sl || !host) return;
    var tr = instant ? 'none' : (PP.MOTIONS.indexOf(sl.trans) >= 0 ? sl.trans : PP.state.motion);
    var w = PP.el('div', 'wrap m-' + tr);
    w.append(PP.buildSlide(sl, i, live, edit));
    host.replaceChildren(w);
  };
})(typeof window !== 'undefined' ? window : globalThis);
