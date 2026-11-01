/* Built-in starter decks and the theme swatches. */
(function (root) {
  'use strict';
  var PP = root.PP || (root.PP = {});

  PP.TEMPLATE_CATEGORY = {
    'Pitch deck': 'Business', 'Investor deck': 'Business', 'Business report': 'Report', 'Lesson': 'Education',
    'Proposal': 'Proposal', 'Event': 'Creative', 'Product launch': 'Business', 'Case study': 'Report',
    'Marketing plan': 'Marketing', 'Impact report': 'Report', 'Workshop': 'Education',
    'Team update': 'Business', 'Conference talk': 'Education'
  };
  PP.TPL_BG = {
    'Pitch deck': 'facets', 'Business report': 'waves', 'Lesson': 'dots', 'Proposal': 'topo', 'Event': 'bokeh',
    'Product launch': 'rays', 'Investor deck': 'mesh', 'Case study': 'hex', 'Marketing plan': 'stripes',
    'Impact report': 'circuit', 'Workshop': 'hex', 'Team update': 'stripes', 'Conference talk': 'rays'
  };
  PP.TPL_SCENE = {
    'Pitch deck': 'rocket', 'Investor deck': 'coins', 'Business report': 'bars', 'Lesson': 'bulb', 'Proposal': 'shield',
    'Event': 'people', 'Product launch': 'rocket', 'Case study': 'people', 'Marketing plan': 'globe',
    'Impact report': 'sun', 'Workshop': 'bulb', 'Team update': 'people', 'Conference talk': 'bulb'
  };

  PP.TEMPLATES = [
    { n: 'Pitch deck', theme: 'pitch', text: '# Solar Cold Rooms for Rural Markets\nKeeping harvests fresh where the grid does not reach\n\nThe problem\nFarmers lose a third of their harvest before it reaches buyers\nCold storage costs four times more than most can afford\nPower cuts spoil what little storage exists\n\nThe impact\n30% harvest lost today\n4x cost of conventional cold rooms\n12 markets ready for a pilot\n\n"A tomato that lasts a week instead of two days changes a family\'s income."\n\nHow it works\nSolar panels charge batteries during the day\nInsulated rooms hold cool temperatures overnight\nFarmers pay per crate, not per month\n\nThank you\nQuestions and next steps' },
    { n: 'Business report', theme: 'studio', text: '# Quarterly Performance Report\nJanuary to March review\n\nHighlights\n42% revenue growth on last quarter\n1,200 new customers\n3 new regional offices\n\nWhat worked\nReferral programme drove most new sign-ups\nSupport response time was cut in half\nTeam training lifted customer satisfaction\n\nRisks to watch\nSupply delays are raising costs\nTwo key roles are still vacant\nCurrency swings affect margins\n\nPlan for next quarter\nHire the two vacant roles\nSign a second supplier\nLaunch the mobile ordering app\n\nThank you\nQuestions welcome' },
    { n: 'Lesson', theme: 'sorbet', text: '# Introduction to Photosynthesis\nHow plants turn light into food\n\nLearning goals\nExplain what photosynthesis is\nName the inputs and outputs\nDescribe where it happens in the leaf\n\n"Plants build their food from sunlight, water and air."\n\nKey facts\n6 water molecules are used for each sugar molecule\n100% of the oxygen we breathe traces back to it\n\nHow it works\nChlorophyll absorbs light\nWater is split and oxygen is released\nCarbon dioxide is turned into sugar\n\nQuick check\nWhat would happen without sunlight?\nWhy are leaves green?\n\nThank you\nQuestions?' },
    { n: 'Proposal', theme: 'noir', text: '# Community Wi-Fi Project Proposal\nAffordable internet for three neighbourhoods\n\nThe need\nMost households cannot afford monthly data\nStudents travel far to get online\nSmall businesses lose sales without internet\n\nOur solution\nShared solar-powered hotspots\nPay-as-you-go access at low prices\nLocal youth trained to run each site\n\nBudget\n$18k equipment and installation\n$6k training and launch\n$4k first year support\n\nProject roadmap\nMonth 1: survey sites and sign agreements\nMonth 2: install and test equipment\nMonth 3: train operators and launch\nMonth 4: review results with the community\n\nContact\nLet us build it together' },
    { n: 'Event', theme: 'kafue', text: '# Youth Innovation Day\nA free day of ideas, skills and networking\n\nWhy join\nMeet mentors working in tech and business\nTry hands-on workshops\nPitch your idea to a friendly panel\n\nEvent at a glance\n300 young people expected\n12 workshops and talks\n1 big pitch showcase\n\nAgenda\nWelcome and keynote\nSkills workshops\nLunch and networking\nPitch showcase and awards\n\nContact\nRegister free at the front desk this month' },
    { n: 'Product launch', theme: 'aurora', text: '# Meet Beacon\nThe smart way to track every delivery\n\nThe problem\nCustomers never know where their parcel is\nSupport teams drown in calls about late orders\n\nIntroducing Beacon\nLive tracking on any phone\nAutomatic delay alerts\nOne dashboard for the whole fleet\n\nResults from the pilot\n58% fewer support calls\n4.8 customer rating\n2x faster dispatch\n\nHow it works\nScan the parcel at pickup\nBeacon follows every handover\nCustomers get a live link\n\nThank you\nJoin the early access list' },
    { n: 'Investor deck', theme: 'gold', text: '# Beacon Logistics: Seed Round\nReal-time delivery tracking for African cities\n\nThe opportunity\nMillions of parcels move through informal networks every day\nCustomers and couriers have no shared view\n\nTraction\n2,400 deliveries tracked in the pilot\n58% fewer support calls\n14 businesses on the waiting list\n\nBusiness model\nMonthly fee per courier\nSmall per-delivery fee for retailers\nPremium analytics for fleets\n\nRoadmap to scale\nQ1 launch in Lusaka\nQ2 add mobile money payments\nQ3 expand to two more cities\n\nThe ask\n$250k seed to fund product, two hires and the next city launch\n\nThank you\nLet us talk' },
    { n: 'Case study', theme: 'editorial', text: '# How Mwila Foods Doubled Online Orders\nA six-month case study\n\nThe challenge\nOrders arrived by phone and were often lost\nCustomers waited days for confirmation\n\nThe approach\nBuilt a simple online menu\nSent order updates by message\nTrained staff in one afternoon\n\nResults\n2x online orders in six months\n40% fewer missed orders\n4.7 average customer rating\n\n"We stopped losing orders and started growing."\n\nWhat we learned\nStart with the customer\'s biggest frustration\nKeep the first version simple\n\nContact\nWant similar results? Get in touch' },
    { n: 'Marketing plan', theme: 'glass', text: '# Spring Campaign Plan\nReaching young customers on social media\n\nGoals\nGrow followers by 5,000\nDouble weekly website visits\nCollect 500 email sign-ups\n\nAudience\nStudents and young professionals\nActive on mobile in the evenings\nRespond to short video and local voices\n\nCampaign timeline\nWeek 1 teaser posts\nWeek 2 launch event\nWeek 3 creator collaborations\nWeek 4 review and report\n\nBudget\n$3k content production\n$2k creator fees\n$1k paid promotion\n\nThank you\nQuestions and feedback' },
    { n: 'Impact report', theme: 'ocean', text: '# Impact Report 2026\nWhat your support made possible\n\nOur year in numbers\n1,800 young people reached\n42 workshops delivered\n15 communities served\n\n"I learned to code and now I teach others."\n\nWhere the money went\n$40k programmes\n$8k volunteer training\n$4k running costs\n\nLooking ahead\nOpen three new learning hubs\nDouble our mentor network\nReach every province\n\nThank you\nThank you to every donor and volunteer' },
    { n: 'Workshop', theme: 'aurora', text: '# Presenting with Confidence\nA two-hour hands-on workshop\n\nBy the end you will\nStructure a talk in three parts\nUse your voice and pace well\nHandle questions calmly\n\nWorkshop agenda\nWarm-up exercise\nStructure and stories\nPractice in pairs\nFeedback and reflection\n\n"The best speakers are not born; they practise."\n\nPractice rounds\n2 minutes per speaker\n3 pieces of feedback\n1 thing to improve next time\n\nThank you\nKeep practising' },
    { n: 'Team update', theme: 'slate', text: '# Product Team Weekly Update\nWhat changed, what is stuck, and what is next\n\nHighlights\nShipped the billing fix to every pilot\nSupport replies are faster this week\nTwo teams moved from trial to paid\n\nRisks to watch\nThe design role is still open\nOne hardware vendor is a week late\n\nNext week\nFinish the mobile checkout flow\nReview pilot feedback with sales\nPublish the written status note\n\nThank you\nQuestions welcome' },
    { n: 'Conference talk', theme: 'dawn', text: '# Designing for Low Connectivity\nA talk for people shipping software outside big cities\n\nWhy this talk\nMany people share a phone and drop off the network\nA product that needs fast wifi does not really work\n\nThree ideas\nStart from the slowest connection in the room\nShow progress before the data arrives\nLet people finish the task later\n\n"If it only works on fast wifi, it does not work."\n\nHow we tested it\n12 clinics with unreliable power\n3 rounds of paper prototypes\n1 launch that still worked offline\n\nThank you\nCome say hello afterwards' }
  ];

  PP.syncThemeChips = function () {
    var keys = Object.keys(PP.THEMES);
    var box = PP.$('themes');
    if (!box) return;
    Array.prototype.forEach.call(box.children, function (c, k) {
      c.setAttribute('aria-pressed', keys[k] === PP.state.theme ? 'true' : 'false');
    });
    var label = PP.$('themeLabel');
    if (label && PP.THEMES[PP.state.theme]) label.textContent = PP.THEMES[PP.state.theme].n + ' theme';
  };

  PP.useTemplate = function (t, text, free) {
    PP.currentTemplateName = t.n;
    PP.$('txt').value = text;
    PP.state.theme = t.theme;
    PP.syncThemeChips();
    PP.generate(free === true);
  };

  function filterTemplates() {
    var q = PP.$('tplSearch').value.trim().toLowerCase();
    var cat = PP.$('tplCategory').value.toLowerCase();
    Array.prototype.forEach.call(PP.$('tpls').children, function (b) {
      b.hidden = !(b.dataset.name.indexOf(q) >= 0 && (cat === 'all' || b.dataset.category.toLowerCase() === cat));
    });
  }

  PP.rebuildThemes = function () {
    var themes = PP.$('themes');
    if (!themes) return;
    themes.replaceChildren();
    Object.entries(PP.THEMES).forEach(function (pair) {
      var k = pair[0], T = pair[1];
      var b = PP.el('button', 'chip');
      b.type = 'button';
      b.style.background = 'linear-gradient(135deg,' + T.bg1 + ',' + T.bg2 + ' 55%,' + T.a1 + ')';
      b.title = T.n;
      b.setAttribute('aria-label', T.n + ' theme');
      b.setAttribute('aria-pressed', k === PP.state.theme ? 'true' : 'false');
      b.addEventListener('click', function () {
        PP.snapshot();
        PP.state.theme = k;
        if (!String(k).startsWith('style-')) PP.lockedStyle = '';
        PP.syncThemeChips();
        if (PP.state.slides.length) { PP.strip(); PP.show(PP.state.i); }
      });
      themes.append(b);
    });
    var sel = PP.$('sdTheme');
    if (sel) {
      if (![].some.call(sel.options, function (o) { return o.value === ''; })) {
        var deckOpt = PP.el('option', null, 'Deck theme');
        deckOpt.value = '';
        sel.append(deckOpt);
      }
      var keep = sel.value;
      while (sel.options.length > 1) sel.remove(1);
      Object.entries(PP.THEMES).forEach(function (pair) {
        var o = PP.el('option', null, pair[1].n);
        o.value = pair[0];
        sel.append(o);
      });
      if ([].some.call(sel.options, function (o) { return o.value === keep; })) sel.value = keep;
    }
    PP.syncThemeChips();
  };

  PP.initTemplates = function () {
    PP.rebuildThemes();

    var gallery = PP.$('tpls');
    PP.TEMPLATES.forEach(function (t) {
      var b = PP.el('button', 'template-card');
      b.type = 'button';
      b.dataset.name = t.n.toLowerCase();
      b.dataset.category = PP.TEMPLATE_CATEGORY[t.n] || 'Creative';
      var T = PP.THEMES[t.theme];
      var preview = PP.el('span', 'tpl-preview');
      preview.style.background = 'linear-gradient(135deg,' + T.bg1 + ',' + T.bg2 + ')';
      preview.style.color = T.tx;
      preview.style.setProperty('--taccent', T.a1);
      preview.style.setProperty('--a1', T.a1);
      preview.style.setProperty('--a2', T.a2);
      preview.style.setProperty('--bg1', T.bg1);
      preview.style.setProperty('--bg2', T.bg2);
      var pic = PP.art(PP.hash(t.n), true, PP.TPL_SCENE[t.n]);
      pic.style.cssText = 'position:absolute;right:-8px;top:-18px;width:92px;height:110px;opacity:.75;pointer-events:none';
      preview.append(PP.el('b', null, t.n), PP.el('i'), pic);
      b.append(preview, PP.el('small', null, b.dataset.category + ' · ' + T.n));
      b.addEventListener('click', function () { PP.useTemplate(t, t.text); });
      gallery.append(b);
    });
    PP.$('tplSearch').addEventListener('input', filterTemplates);
    PP.$('tplCategory').addEventListener('change', filterTemplates);
  };
})(typeof window !== 'undefined' ? window : globalThis);
