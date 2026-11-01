/* Offline outline rules, and online deck writing when a proxy is configured. */
(function (root) {
  'use strict';
  var PP = root.PP || (root.PP = {});

  /* Order is the tie-break order and must match TPLS in server/proxy.js. */
  PP.KEYS = {
    'Investor deck': /investor|raise|funding|seed|series|traction|valuation/,
    'Pitch deck': /pitch|startup|idea|solve|problem|market|customers?|business/,
    'Business report': /report|quarter|results|review|performance|annual|kpi|update/,
    'Lesson': /teach|lesson|class|school|learn|students?|course|lecture|explain/,
    'Proposal': /proposal|project|grant|ministry|tender|propose|budget/,
    'Event': /event|conference|festival|summit|meetup|ceremony|open day|expo/,
    'Product launch': /launch|new product|release|introduc|feature|app\b|brand/,
    'Marketing plan': /marketing|campaign|social media|audience|ads?\b|followers/,
    'Case study': /case study|success story|client|before and after/,
    'Impact report': /impact|ngo|charity|donor|community|youth|nonprofit|foundation/,
    'Workshop': /workshop|training|skills|facilitat|session|bootcamp/,
    'Team update': /standup|team update|weekly update|status update|sprint|retro/,
    'Conference talk': /keynote|my talk|speaker|session abstract|conference talk/
  };
  PP.WHY = {
    'Investor deck': 'Money-focused story: opportunity, traction, model and the ask. Midnight Gold looks premium.',
    'Pitch deck': 'Problem, solution, proof and next steps in a punchy flow. Pitch theme has bold contrast.',
    'Business report': 'Clear numbers, wins, risks and plan. Studio theme keeps it clean and professional.',
    'Lesson': 'Goals, big idea, key facts and a quick check for learners. Sorbet is friendly and bright.',
    'Proposal': 'Need, solution, budget and a roadmap that decision makers can approve. Noir feels serious.',
    'Event': 'Why join, numbers, agenda and how to register. Kafue is warm and energetic.',
    'Product launch': 'Problem, product, pilot results and how it works. Aurora gives a launch-day glow.',
    'Marketing plan': 'Goals, audience, channels, timeline and budget. Glass feels modern and social.',
    'Case study': 'Challenge, approach, results and lessons. Editorial gives a magazine feel.',
    'Impact report': 'Numbers, stories and where the money went, to build donor trust. Ocean feels calm and credible.',
    'Workshop': 'Outcomes, agenda, activities and practice rounds. Aurora keeps energy up.',
    'Team update': 'Wins, risks and the week ahead, short enough to read in a stand-up. Slate stays calm.',
    'Conference talk': 'A talk shape: why it matters, three ideas, proof and a close. Dawn is warm on stage.'
  };
  PP.FAMILY = {
    'Pitch deck': 'pitch', 'Investor deck': 'pitch', 'Product launch': 'pitch',
    'Business report': 'report', 'Impact report': 'report', 'Case study': 'report', 'Team update': 'report',
    'Lesson': 'teach', 'Workshop': 'teach', 'Conference talk': 'teach',
    'Proposal': 'plan', 'Event': 'plan', 'Marketing plan': 'plan'
  };
  PP.OUTLINE = {
    pitch: [['The problem', 'Who is affected by {t}?', 'What does it cost them today?', 'Why do current options fall short?'], ['Our solution', 'Explain {t} in one sentence', 'Three things that make it work'], ['Proof so far', 'Add a number and what it shows', 'Add a second number', 'Add a third number'], ['How it works', 'Step one', 'Step two', 'Step three'], ['The ask', 'What do you need to move forward?'], ['Thank you', 'Questions and next steps']],
    report: [['Summary', 'The main result of {t} in one line', 'Why it matters'], ['Key numbers', 'Add a number and what it means', 'Add a second number', 'Add a third number'], ['What worked', 'Success one', 'Success two'], ['Challenges', 'Challenge one', 'Challenge two'], ['Next steps', 'Action one', 'Action two', 'Action three'], ['Thank you', 'Questions welcome']],
    teach: [['Learning goals', 'By the end, you can explain {t}', 'Name the key parts', 'Use it in an example'], ['Key ideas', 'Idea one', 'Idea two', 'Idea three'], ['How it works', 'Step one', 'Step two', 'Step three'], ['Quick check', 'A question for the class', 'A second question'], ['Thank you', 'Questions?']],
    plan: [['Why this matters', 'The need behind {t}', 'Who benefits'], ['The plan', 'What you will do', 'Who will do it', 'Where it happens'], ['Budget', 'Main cost and amount', 'Second cost and amount'], ['Project roadmap', 'Phase one', 'Phase two', 'Phase three'], ['Contact', 'How to reach you']]
  };

  PP.DECK_PROMPT = function (idea, n) {
    return 'You are a presentation designer and writer. Turn this idea into a complete, ready-to-present deck of about ' + n + ' slides.\n\nIDEA: ' + idea + '\n\nReply with ONE JSON object and nothing else (no markdown fences):\n{"template":"<one of: ' + Object.keys(PP.KEYS).join(', ') + '>","why":"<one sentence on why this template suits the idea>","slides":[...]}\n\nEach slide is one of:\n{"kind":"title","title":"...","sub":"one-line promise"}\n{"kind":"bullets","title":"...","items":["3 to 5 short points, each under 90 characters"]}\n{"kind":"stats","title":"...","stats":[{"v":"big number or value","l":"what it measures"}]}  (2 to 4 stats)\n{"kind":"quote","title":"who said it","sub":"the quote"}\n{"kind":"steps","title":"Roadmap or How it works","items":["3 to 5 ordered steps"]}\n{"kind":"section","title":"a bold divider statement"}\n{"kind":"closing","title":"Thank you or Contact","sub":"call to action"}\nEvery slide may also have "notes": 1 to 3 sentences the speaker can say.\n\nRules: start with a title slide and end with a closing slide. Use a variety of kinds. Write specific, persuasive, real-world content for the idea, in plain words, with titles under 50 characters. Never invent statistics, names or facts about real organisations. Where a number would help, write an illustrative placeholder in square brackets such as [30%] so the person can replace it. Write in the same language as the idea.';
  };

  var SAMPLE;
  async function getSample() {
    if (SAMPLE !== undefined) return SAMPLE;
    try { SAMPLE = window.claude ? await claude.use('sample') : null; } catch (e) { SAMPLE = null; }
    return SAMPLE;
  }

  PP.parseDeck = function (raw) {
    var text = String(raw);
    var a = text.indexOf('{'), b = text.lastIndexOf('}');
    if (a < 0 || b < a) throw new Error('The AI reply was not a deck.');
    var j = JSON.parse(text.slice(a, b + 1));
    var slides = (Array.isArray(j.slides) ? j.slides : []).slice(0, PP.CFG.MAX_SLIDES).map(function (x) {
      if (!x || PP.KINDS.indexOf(x.kind) < 0) return null;
      var s = { kind: x.kind, title: PP.cleanStr(x.title, 70) };
      if (x.sub) s.sub = PP.cleanStr(x.sub, 200);
      if (x.notes) s.notes = PP.cleanStr(x.notes, 600);
      if (Array.isArray(x.items)) s.items = x.items.slice(0, 5).map(function (t) { return PP.cleanStr(t, PP.CFG.MAX_LEN); }).filter(Boolean);
      if (Array.isArray(x.stats)) s.stats = x.stats.slice(0, 4).map(function (t) { return { v: PP.cleanStr(t && t.v, 14), l: PP.cleanStr(t && t.l, 60) }; }).filter(function (t) { return t.v && t.l; });
      if (['stats', 'chart'].indexOf(s.kind) >= 0 && !(s.stats && s.stats.length >= 2)) {
        s.kind = 'bullets';
        s.items = (s.stats || []).map(function (t) { return t.v + ' ' + t.l; });
      }
      if (['bullets', 'steps'].indexOf(s.kind) >= 0 && !(s.items && s.items.length)) return null;
      if (s.kind === 'steps' && s.items.length < 2) s.kind = 'bullets';
      if (s.kind === 'quote' && !s.sub) return null;
      if (s.kind !== 'quote' && !s.title) return null;
      if (s.kind !== 'steps' && s.kind !== 'bullets') delete s.items;
      if (['stats', 'chart'].indexOf(s.kind) < 0) delete s.stats;
      return s;
    }).filter(Boolean);
    if (slides.length < 3) throw new Error('The AI reply had too few slides.');
    return { template: PP.KEYS[j.template] ? j.template : 'Pitch deck', why: PP.cleanStr(j.why, 300), slides: slides };
  };

  function toText(ss) {
    return ss.map(function (s) {
      var L = [];
      if (s.kind === 'title') L.push('# ' + s.title, s.sub || '');
      else if (s.kind === 'quote') L.push('"' + s.sub + '"');
      else {
        L.push(s.title);
        if (s.items) L.push.apply(L, s.items);
        if (s.stats) L.push.apply(L, s.stats.map(function (x) { return x.v + ' ' + x.l; }));
        if (s.sub) L.push(s.sub);
      }
      return L.filter(Boolean).join('\n');
    }).join('\n\n');
  }

  async function askDeck(idea, n, status, research) {
    var prompt = PP.DECK_PROMPT(idea, n);
    var sm = research ? null : await getSample();
    var raw, sources = [];
    if (sm) raw = (await sm(prompt, { modelTier: 'default', cache: false, onText: function (info) { status('Writing your deck… ' + info.text.length + ' characters'); } })).text;
    else {
      var r = await fetch(PP.CFG.AI_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idea: idea, count: n, research: !!research }), referrerPolicy: 'no-referrer' });
      if (!r.ok) throw new Error('AI server error');
      var result = await r.json();
      raw = result.text;
      sources = Array.isArray(result.sources) ? result.sources : [];
    }
    var deck = PP.parseDeck(raw);
    deck.sources = sources;
    return deck;
  }

  PP.tryOnline = async function (idea, out, research) {
    if ((research || !(await getSample())) && !PP.CFG.AI_ENDPOINT) return false;
    var btn = PP.$('advise');
    var status = PP.el('div', null, research ? 'Researching the web and drafting slides…' : 'Thinking…');
    btn.disabled = true;
    out.append(status);
    try {
      var deck = await askDeck(idea, +PP.$('aiCount').value || 8, function (t) { status.textContent = t; }, research);
      var tpl = PP.TEMPLATES.find(function (x) { return x.n === deck.template; }) || PP.TEMPLATES[0];
      PP.state.theme = tpl.theme;
      PP.syncThemeChips();
      if (research && deck.sources.length) {
        var src = deck.sources.slice(0, 5);
        var refs = {
          kind: 'bullets',
          title: 'Research sources',
          items: src.map(function (x, i) {
            var host = 'source';
            try { host = new URL(x.url).hostname; } catch (e) {}
            return '[' + (i + 1) + '] ' + PP.cleanStr(x.title || x.url, 70) + ' · ' + host;
          }),
          notes: src.map(function (x, i) { return '[' + (i + 1) + '] ' + (x.title || 'Source') + ': ' + x.url; }).join('\n')
        };
        var end = deck.slides[deck.slides.length - 1]?.kind === 'closing' ? deck.slides.length - 1 : deck.slides.length;
        deck.slides.splice(end, 0, refs);
      }
      PP.snapshot();
      PP.state.slides = deck.slides;
      if (PP.state.brand) PP.state.slides.forEach(function (x) { x.a1 = PP.state.brand.primary; x.a2 = PP.state.brand.secondary; });
      PP.state.trash = [];
      PP.updateHistoryButtons();
      PP.state.i = 0;
      PP.$('txt').value = toText(deck.slides);
      PP.enableDeckControls(true);
      if (PP.enterDesign) PP.enterDesign();
      PP.strip();
      PP.show(0);
      PP.Usage.bump();
      status.textContent = 'Best fit: ' + tpl.n + '. ' + deck.why;
      if (research && deck.sources.length) {
        var list = PP.el('div');
        list.append(PP.el('strong', null, 'Sources: '));
        deck.sources.slice(0, 8).forEach(function (s) {
          try {
            var u = new URL(s.url);
            if (u.protocol !== 'https:') return;
            var a = PP.el('a', null, s.title || u.hostname);
            a.href = u.href; a.target = '_blank'; a.rel = 'noopener noreferrer';
            list.append(a);
          } catch (e) {}
        });
        out.append(list);
      }
      out.append(PP.el('div', null, research ? 'Research-backed deck ready. Sources are listed on the final slide and in speaker notes. Verify important claims before presenting.' : 'Deck written with speaker notes. Use Live Edit Canvas to change any text.'));
      return true;
    } catch (e) {
      PP.log(e);
      status.textContent = 'Online AI could not finish. Building an offline outline instead.';
      return false;
    } finally { btn.disabled = false; }
  };

  function topicOf(idea) {
    var topic = String(idea || '').split(/[.!?\n]/)[0]
      .replace(/^(please\s+)?(i\s+)?(want|need|would like)\s+(to\s+)?/i, '')
      .replace(/^(make|create|build|prepare|give|do|present|research)\s+(me\s+)?(a\s+|an\s+|the\s+)?(presentation|powerpoint|deck|slides?)\s+(about|on|for|of)?\s*/i, '')
      .replace(/^(a|an|the)\s+(presentation|deck|talk|pitch)\s+(about|on|for|of)\s+/i, '')
      .trim();
    var head = topic.split(/\s+(?:and|for|about|with|into|in|on)\s+/i)[0].trim();
    if (head.length >= 3) topic = head;
    topic = (topic || idea).slice(0, 80);
    return topic.charAt(0).toUpperCase() + topic.slice(1);
  }

  function onTopic(page, query) {
    var words = String(query || '').toLowerCase().split(/\W+/).filter(function (w) { return w.length > 3; });
    if (!words.length) return true;
    var hay = (page.title + ' ' + String(page.extract || '').slice(0, 500)).toLowerCase();
    return words.some(function (w) { return hay.indexOf(w) >= 0; });
  }

  function wikiSentences(extract) {
    return String(extract || '').replace(/\s+/g, ' ').split(/(?<=[.!?])\s+/).map(function (s) { return s.trim(); }).filter(function (s) {
      return s.length >= 40 && s.length <= 220 && !/may refer to/i.test(s);
    });
  }

  PP.slidesFromResearch = function (topic, pages) {
    var usable = (pages || []).filter(function (p) { return p && p.title && p.url && wikiSentences(p.extract).length >= 2; }).slice(0, 4);
    if (!usable.length) return null;
    var slides = [{
      kind: 'title',
      title: PP.cleanStr(topic, 70),
      sub: PP.cleanStr(usable[0].description || 'What the sources say', 140),
      notes: 'The following slides shorten public-source text. Read each cited page before presenting.'
    }];
    usable.forEach(function (page) {
      var lines = wikiSentences(page.extract).slice(0, 4).map(function (s) {
        return s.length > 120 ? s.slice(0, 117).replace(/\s+\S*$/, '') + '…' : s;
      });
      slides.push({
        kind: 'bullets',
        title: PP.cleanStr(page.title, 70),
        items: lines,
        notes: 'Source: ' + page.title + ', Wikipedia, CC BY-SA. ' + page.url
      });
    });
    slides.push({
      kind: 'bullets',
      title: 'Sources',
      items: usable.map(function (p, i) { return '[' + (i + 1) + '] ' + PP.cleanStr(p.title, 64) + ' · Wikipedia'; }),
      notes: usable.map(function (p, i) { return '[' + (i + 1) + '] ' + p.title + ': ' + p.url; }).join('\n')
    });
    slides.push({
      kind: 'closing',
      title: 'Check the sources',
      sub: 'Names and figures come from the cited pages. Confirm them before you present.',
      notes: 'Wikipedia text is used under CC BY-SA. Keep the source links in these notes.'
    });
    return slides.slice(0, PP.CFG.MAX_SLIDES);
  };

  async function wikiSearch(query) {
    var url = 'https://en.wikipedia.org/w/api.php?' + new URLSearchParams({
      action: 'query', list: 'search', srsearch: query, srlimit: '4', format: 'json', origin: '*', utf8: '1'
    });
    var r = await fetch(url, { referrerPolicy: 'no-referrer' });
    if (!r.ok) throw new Error('Research search failed.');
    var data = await r.json();
    return ((data.query && data.query.search) || []).map(function (row) { return row.title; }).filter(Boolean);
  }

  async function wikiSummary(title) {
    var r = await fetch('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(title), { referrerPolicy: 'no-referrer' });
    if (!r.ok) return null;
    var j = await r.json();
    var page = j.content_urls && j.content_urls.desktop && j.content_urls.desktop.page;
    if (!page || String(page).indexOf('https://') !== 0) return null;
    return { title: j.title || title, description: j.description || '', extract: j.extract || '', url: page };
  }

  function installDeck(slides, note) {
    var low = (PP.$('idea').value || '').toLowerCase();
    var rank = Object.entries(PP.KEYS).map(function (pair) {
      return [pair[0], (low.match(new RegExp(pair[1].source, 'g')) || []).length];
    }).sort(function (a, b) { return b[1] - a[1]; });
    var best = rank[0][1] ? rank[0][0] : 'Pitch deck';
    var tpl = PP.TEMPLATES.find(function (x) { return x.n === best; }) || PP.TEMPLATES[0];
    PP.snapshot();
    PP.state.theme = tpl.theme;
    PP.syncThemeChips();
    PP.state.slides = slides;
    if (PP.state.brand) PP.state.slides.forEach(function (x) { x.a1 = PP.state.brand.primary; x.a2 = PP.state.brand.secondary; });
    PP.state.trash = [];
    PP.updateHistoryButtons();
    PP.state.i = 0;
    PP.$('txt').value = toText(slides);
    PP.enableDeckControls(true);
    if (PP.enterDesign) PP.enterDesign();
    if (PP.lockedStyle && PP.paintStyle) PP.paintStyle(PP.lockedStyle, true);
    PP.strip();
    PP.show(0);
    PP.Usage.bump();
    return note;
  }

  PP.researchIdea = async function (idea, out) {
    var topic = topicOf(idea);
    var status = PP.el('div', null, 'Researching “' + topic + '”…');
    out.append(status);
    var titles = await wikiSearch(topic);
    var found = [];
    for (var title of titles) {
      var page = await wikiSummary(title);
      if (page && !/disambiguation/i.test(page.title) && !/may refer to/i.test(page.extract)) found.push(page);
    }
    var pages = found.filter(function (page) { return onTopic(page, topic); });
    if (!pages.length) pages = found;
    var slides = PP.slidesFromResearch(topic, pages);
    if (!slides) return false;
    status.textContent = installDeck(slides, 'Research is on the slides. Sources are on the Sources slide and in the PowerPoint notes.');
    var list = PP.el('div');
    list.append(PP.el('strong', null, 'Sources: '));
    pages.slice(0, 4).forEach(function (p) {
      var a = PP.el('a', null, p.title);
      a.href = p.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.style.marginRight = '10px';
      list.append(a);
    });
    out.append(list);
    out.append(PP.el('div', null, 'Taken from Wikipedia under CC BY-SA. Check the wording before you present. Download keeps the source links in the speaker notes.'));
    return true;
  };

  PP.advise = async function () {
    var idea = PP.Sec.clean(PP.$('idea').value).trim().slice(0, 500);
    var out = PP.$('advice');
    out.replaceChildren();
    if (idea.length < 8) { out.textContent = 'Type your idea in a sentence or two first.'; return; }
    if (PP.Usage.blocked()) return void PP.Signup.open(PP.advise);
    var btn = PP.$('advise');
    btn.disabled = true;
    try {
      if (PP.$('research').checked && PP.CFG.AI_ENDPOINT && await PP.tryOnline(idea, out, true)) return;
      try {
        if (await PP.researchIdea(idea, out)) return;
      } catch (e) {
        PP.log(e);
        out.append(PP.el('div', null, 'Public research did not respond. Building an outline you can fill in.'));
      }
    } finally { btn.disabled = false; }
    var low = idea.toLowerCase();
    var rank = Object.entries(PP.KEYS).map(function (pair) {
      return [pair[0], (low.match(new RegExp(pair[1].source, 'g')) || []).length];
    }).sort(function (a, b) { return b[1] - a[1]; });
    var best = rank[0][1] ? rank[0][0] : 'Pitch deck';
    var alt = rank[1][1] ? rank[1][0] : null;
    var topic = idea.split(/[.!?\n]/)[0].replace(/^(i\s+(want|need|would like)\s+to\s+)?(make|create|build|prepare|give|do|present)?\s*(me\s+)?(a\s+|an\s+|the\s+)?(presentation|powerpoint|deck|slides?)?\s*(about|on|for|of|to)?\s*/i, '').trim() || idea;
    topic = topic.slice(0, 60);
    topic = topic[0].toUpperCase() + topic.slice(1);
    var outline = function (n) {
      return '# ' + topic + '\nAdd your one-line promise here\n\n' + PP.OUTLINE[PP.FAMILY[n]].map(function (block) {
        return [block[0]].concat(block.slice(1).map(function (x) { return x.replace('{t}', topic.toLowerCase()); })).join('\n');
      }).join('\n\n');
    };
    out.append(PP.el('div', null, 'Best fit: ' + best + '. ' + PP.WHY[best] + (alt ? ' Runner-up: ' + alt + '.' : '')));
    var run = function (n, free) { PP.useTemplate(PP.TEMPLATES.find(function (x) { return x.n === n; }), outline(n), free); };
    run(best);
    out.append(PP.el('div', null, 'Deck built. Replace the prompt lines using Live Edit Canvas or the text box. Undo brings back the previous deck.'));
    if (alt) {
      var b = PP.el('button', null, 'Try ' + alt + ' instead');
      b.type = 'button';
      b.addEventListener('click', function () { run(alt, true); });
      out.append(b);
    }
  };

  PP.initAssistant = function () {
    var cfg = root.PINPOINT_CONFIG || {};
    PP.CFG.AI_ENDPOINT = cfg.AI_ENDPOINT || '';
    PP.CFG.API_BASE = cfg.API_BASE || '';
    PP.$('advise').addEventListener('click', function () { PP.advise(); });
    getSample().then(function (sm) {
      if (!sm) return;
      PP.$('advice').textContent = 'Online AI ready. Describe your idea and press the button.';
      var row = PP.$('searchRow');
      if (row) row.hidden = true;
      PP.$('results').hidden = true;
    });
  };
})(typeof window !== 'undefined' ? window : globalThis);
