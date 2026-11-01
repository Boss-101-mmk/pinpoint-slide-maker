/* Uploaded pictures and Openverse search. SVG uploads stay refused. */
(function (root) {
  'use strict';
  var PP = root.PP || (root.PP = {});

  PP.readPic = async function (f) {
    if (f.size > 3 * 1024 * 1024) throw new Error(f.name + ' is larger than 3 MB.');
    var bytes = new Uint8Array(await f.slice(0, 12).arrayBuffer());
    var hex = Array.prototype.map.call(bytes, function (b) { return b.toString(16).padStart(2, '0'); }).join('');
    var mime = hex.indexOf('89504e47') === 0 ? 'image/png' : hex.indexOf('ffd8ff') === 0 ? 'image/jpeg' : (hex.indexOf('52494646') === 0 && hex.slice(16, 24) === '57454250') ? 'image/webp' : null;
    if (!mime) throw new Error(f.name + ' is not a real PNG, JPG or WebP picture.');
    return new Promise(function (res, rej) {
      var r = new FileReader();
      r.onload = function () { res('data:' + mime + ';base64,' + String(r.result).split(',')[1]); };
      r.onerror = function () { rej(new Error('Could not read ' + f.name)); };
      r.readAsDataURL(f);
    });
  };

  PP.tray = function () {
    var t = PP.$('tray');
    t.replaceChildren();
    PP.state.lib.forEach(function (o, k) {
      var b = PP.el('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Use picture ' + (k + 1) + ' on this slide');
      var im = PP.el('img');
      im.src = o.u; im.alt = '';
      b.append(im);
      b.addEventListener('click', function () { PP.applyImg(o.u, o.c); });
      t.append(b);
    });
    PP.$('libcount').textContent = PP.state.lib.length + ' of ' + PP.MAX_LIB;
  };

  PP.applyImg = function (url, credit) {
    if (!PP.state.slides.length) return PP.toast('Build a presentation first.');
    PP.snapshot();
    PP.state.slides[PP.state.i].img = url;
    PP.state.slides[PP.state.i].credit = credit || '';
    PP.strip();
    PP.show(PP.state.i);
  };

  PP.finders = function () {
    var raw = (PP.state.slides[PP.state.i]?.title || 'presentation').replace(/\s*\(cont\.\)/, '').replace(/[\[\]]/g, '').slice(0, 40);
    var q = encodeURIComponent(raw);
    var f = PP.$('finders');
    if (!f) return;
    f.replaceChildren();
    [['Pexels', 'https://www.pexels.com/search/' + q + '/'], ['Unsplash', 'https://unsplash.com/s/photos/' + q], ['Openverse', 'https://openverse.org/search/image?q=' + q + '&license_type=commercial'], ['Wikimedia Commons', 'https://commons.wikimedia.org/w/index.php?search=' + q + '&ns6=1']].forEach(function (pair) {
      var a = PP.el('a', null, pair[0]);
      a.href = pair[1];
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      f.append(a);
    });
  };

  async function onPic(f) {
    try {
      var u = await PP.readPic(f);
      if (PP.state.lib.length < PP.MAX_LIB) PP.state.lib.push({ u: u, c: '' });
      PP.tray();
      PP.applyImg(u, '');
    } catch (e) { PP.log(e); PP.toast(e.message); }
  }
  async function onLib(files) {
    var errs = [];
    for (var f of Array.from(files)) {
      if (PP.state.lib.length >= PP.MAX_LIB) { errs.push('Library is full (' + PP.MAX_LIB + ' pictures).'); break; }
      try { PP.state.lib.push({ u: await PP.readPic(f), c: '' }); } catch (e) { errs.push(e.message); }
    }
    PP.tray();
    if (errs.length) PP.toast(errs.join(' '));
  }

  async function fetchThumb(id) {
    var r = await fetch('https://api.openverse.org/v1/images/' + id + '/thumb/', { referrerPolicy: 'no-referrer' });
    if (!r.ok) throw new Error('Photo download failed.');
    return PP.readPic(new File([await r.blob()], 'photo'));
  }
  PP.searchPhotos = async function (q) {
    var out = PP.$('results');
    out.replaceChildren();
    PP.toast('Searching…');
    try {
      var r = await fetch('https://api.openverse.org/v1/images/?' + new URLSearchParams({ q: q, page_size: '12', license_type: 'commercial' }), { headers: { Accept: 'application/json' }, referrerPolicy: 'no-referrer' });
      if (!r.ok) throw new Error('Photo search is busy. Try again soon, or use the links above.');
      var items = ((await r.json()).results || []).slice(0, 12);
      if (!items.length) return PP.toast('No photos found. Try a simpler word.');
      items.forEach(function (it) {
        if (!/^[0-9a-f-]{36}$/i.test(String(it.id))) return;
        var credit = 'Photo: ' + String(it.creator || 'Unknown').slice(0, 40) + ' / ' + String(it.license || '').toUpperCase() + ' ' + String(it.license_version || '') + ' / Openverse';
        var b = PP.el('button');
        b.type = 'button';
        b.setAttribute('aria-label', 'Use photo: ' + String(it.title || 'untitled').slice(0, 60));
        var im = PP.el('img');
        im.loading = 'lazy'; im.alt = '';
        im.src = 'https://api.openverse.org/v1/images/' + it.id + '/thumb/';
        b.append(im);
        b.addEventListener('click', async function () {
          try {
            PP.toast('Adding photo…');
            var u = await fetchThumb(it.id);
            if (PP.state.lib.length < PP.MAX_LIB) PP.state.lib.push({ u: u, c: credit });
            PP.tray();
            PP.applyImg(u, credit);
            PP.toast();
          } catch (e) { PP.log(e); PP.toast('Could not add that photo. Try another.'); }
        });
        out.append(b);
      });
      PP.toast();
    } catch (e) {
      PP.log(e);
      PP.toast(e.message || 'Photo search failed. Use the links above instead.');
    }
  };

  PP.initMedia = function () {
    PP.$('libadd').addEventListener('click', function () { PP.$('libfile').click(); });
    PP.$('libfile').addEventListener('change', function (e) { onLib(e.target.files); e.target.value = ''; });
    PP.$('picclear').addEventListener('click', function () {
      if (!PP.state.slides.length) return;
      PP.snapshot();
      delete PP.state.slides[PP.state.i].img;
      delete PP.state.slides[PP.state.i].credit;
      PP.strip();
      PP.show(PP.state.i);
    });
    PP.$('pic').addEventListener('click', function () { PP.$('picfile').click(); });
    PP.$('picfile').addEventListener('change', function (e) {
      if (e.target.files[0]) onPic(e.target.files[0]);
      e.target.value = '';
    });
    PP.$('qgo').addEventListener('click', function () {
      var q = PP.$('q').value.trim().slice(0, 60);
      if (q) PP.searchPhotos(q);
    });
    PP.$('q').addEventListener('keydown', function (e) { if (e.key === 'Enter') PP.$('qgo').click(); });
    PP.finders();
    PP.tray();
  };
})(typeof window !== 'undefined' ? window : globalThis);
