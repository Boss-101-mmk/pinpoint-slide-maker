'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const root = path.join(__dirname, '..');
const sandbox = {
  console,
  URLSearchParams,
  URL,
  Map,
  structuredClone,
  setTimeout,
  clearTimeout
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
sandbox.location = { search: '', href: 'http://127.0.0.1/index.html' };
vm.createContext(sandbox);
for (const file of ['js/core.js', 'js/ingest.js', 'js/visuals.js', 'js/canvas.js', 'js/assistant.js', 'js/storage.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), sandbox, { filename: file });
}
const PP = sandbox.PP;

function kinds(text) {
  return PP.Parse.run(text).map(function (s) { return s.kind + ':' + s.title; });
}

const pitch = PP.Parse.run('# Solar Cold Rooms\nFresh harvests\n\nThe impact\n30% harvest lost today\n4x cost of cold rooms\n12 markets ready for a pilot\n\nHow it works\nCharge by day\nHold overnight\nPay per crate\n\nThank you\nQuestions and next steps');
assert.strictEqual(pitch[0].kind, 'title');
assert.strictEqual(pitch[0].sub, 'Fresh harvests');
assert.ok(pitch.some(function (s) { return s.kind === 'stats' && s.stats[0].v === '30%' && s.stats[2].v === '12'; }), 'plain numbers should become stats');
assert.ok(pitch.some(function (s) { return s.kind === 'steps'; }));
const closing = pitch[pitch.length - 1];
assert.strictEqual(closing.kind, 'closing');
assert.strictEqual(closing.items, undefined, 'closing slides should not keep a duplicate bullet list');
assert.ok(closing.sub.indexOf('Questions') >= 0);

const budget = PP.Parse.run('# Proposal\nA plan\n\nBudget\n$18k equipment and installation\n$6k training and launch\n$4k first year support');
const stats = budget.find(function (s) { return s.kind === 'stats'; });
assert.ok(stats, 'currency figures should stay a stat slide');
assert.strictEqual(stats.stats[0].v.replace(/\s/g, ''), '$18k');

assert.throws(function () {
  PP.normalizeDeck({ format: 'PinPointDeck', version: 1, slides: [{ kind: 'script', title: 'x' }] });
}, /unsupported/);

const opened = PP.normalizeDeck({
  format: 'PinPointDeck',
  version: 1,
  theme: 'dawn',
  motion: 'wipe',
  brand: { name: 'Acme', primary: '#112233', secondary: '#abcdef', logo: 'data:image/svg+xml;base64,abc' },
  slides: [{
    kind: 'chart',
    title: 'Trend <script>',
    stats: [{ v: '10', l: 'Now' }, { v: '12', l: 'Next' }],
    items: ['a', 'b', 'c', 'd', 'e', 'f', 'g']
  }]
});
assert.strictEqual(opened.slides[0].kind, 'chart');
assert.strictEqual(opened.slides[0].items.length, 6);
assert.strictEqual(opened.theme, 'dawn');
assert.strictEqual(opened.brand.name, 'Acme');
assert.strictEqual(opened.brand.logo, '', 'svg data urls stay refused');
assert.ok(opened.slides[0].title.includes('Trend'));

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(function (m) { return m[1]; });
const dup = ids.filter(function (id, i) { return ids.indexOf(id) !== i; });
assert.deepStrictEqual(dup, [], 'duplicate ids: ' + dup.join(','));
assert.ok(!/unsafe-inline/.test(html), 'CSP should not allow unsafe-inline');
assert.ok(!html.includes('pptxgen.bundle.js'), 'PowerPoint library should be lazy-loaded');
assert.ok(!html.includes('mammoth'), 'Word reader should be lazy-loaded');
assert.ok(!html.includes('pdf.js'), 'PDF reader should be lazy-loaded');
assert.ok(html.includes('js/config.js') && html.includes('css/app.css'));

const proxy = fs.readFileSync(path.join(root, 'server/proxy.js'), 'utf8');
const tpl = proxy.match(/const TPLS='([^']+)'/);
assert.ok(tpl, 'proxy template list missing');
assert.strictEqual(tpl[1], Object.keys(PP.KEYS).join(', '));

const deck = PP.parseDeck('{"template":"Team update","why":"Weekly.","slides":[{"kind":"title","title":"Hello","sub":"There"},{"kind":"bullets","title":"Points","items":["One","Two"]},{"kind":"closing","title":"Thanks","sub":"Bye"}]}');
assert.strictEqual(deck.template, 'Team update');
assert.strictEqual(deck.slides.length, 3);

const frames = PP.sanitizeFrames({ title: { x: 10, y: 20, w: 30, h: 40 }, nope: { x: 1, y: 1, w: 1, h: 1 }, bad: { x: 'a' } });
assert.deepStrictEqual(Object.keys(frames), ['title']);
assert.strictEqual(frames.title.w, 36);
const extras = PP.sanitizeExtras([
  { id: 'ok', kind: 'text', x: 1, y: 2, w: 200, h: 80, text: 'Hello <b>', color: '#112233' },
  { id: 'no', kind: 'script', x: 1, y: 2, w: 80, h: 80 },
  { id: 'sh', kind: 'shape', shape: 'ellipse', x: 4, y: 5, w: 90, h: 90, fill: 'red' }
]);
assert.strictEqual(extras.length, 2);
assert.strictEqual(extras[0].text.includes('Hello'), true);
assert.strictEqual(extras[1].fill, '#3ee0b0');
const laid = PP.defaultFrames({ kind: 'title', title: 'Hello', sub: 'There' }, 0);
assert.ok(laid.title.w > 200 && laid.sub.y > laid.title.y);

console.log('logic tests passed', { slides: pitch.length, ids: ids.length, templates: Object.keys(PP.KEYS).length });
