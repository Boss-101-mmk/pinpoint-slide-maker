# PinPoint

Turn a Word document, a PDF, or pasted notes into a designed presentation. Present it in the browser or download a real `.pptx`.

## Quick start

1. Open `index.html` in a browser. PowerPoint export is bundled locally and loads only when you download. Word and PDF reading, fonts, and photo search need a network connection the first time you use them.
2. Drop a `.docx`, `.pdf`, `.txt`, or `.md` file, paste notes, or pick a template.
3. Press **Build presentation**.
4. Press **Present** or **Download .pptx**. The file is built in the browser and saved on the visitor's device. It is not uploaded.

A local static server also works (`python3 -m http.server`) and is what GitHub Pages uses. No build step and no package install.

Add `?debug=1` to print parsing steps in the console. Add `?admin=1` to show the feedback inbox (it still needs the proxy below).

Drag the **Editing panel** bar to float it. **Float panel** and **Dock panel** do the same without a drag. Arrow keys nudge a floating panel while that bar is focused.

## Layout

| Path | Role |
|---|---|
| `index.html` | Page structure only |
| `css/app.css` | Interface and the 1280×720 slide canvas |
| `js/config.js` | Optional proxy URLs. No secrets |
| `js/core.js` | Limits, DOM helpers, undo history |
| `js/ingest.js` | File checks, Word/PDF/text reading, notes parser |
| `js/visuals.js` | Themes, artwork, backgrounds, slide rendering |
| `js/templates.js` | Starter decks and theme swatches |
| `js/stage.js` | Preview, filmstrip, presenter, keyboard |
| `js/designer.js` | Per-slide layout, colour, motion, backgrounds |
| `js/export.js` | PowerPoint and print-to-PDF |
| `js/media.js` | Picture uploads and Openverse search |
| `js/assistant.js` | Offline outlines and optional online drafting |
| `js/storage.js` | Autosave, brand kit, sign-up, feedback, deck files |
| `js/main.js` | Wires the page |
| `pptxgen.bundle.js` | PptxGenJS, loaded on the first PowerPoint download |
| `server/proxy.js` | Optional Node proxy for AI, sign-ups, and feedback |
| `.github/workflows/deploy-pages.yml` | Publishes the static site |

Word (`mammoth`) and PDF (`pdf.js`) libraries load from the CDN only when a file of that type is chosen.

`node tests/logic.test.js` checks the parser, deck import, template list, and that the page has no duplicate ids.

## Features

Everything from the previous editor is still here: templates, themes, live text editing, speaker notes, narration, pictures, brand kit, charts, built-in backgrounds, presenter mode, editable JSON decks, print-to-PDF, autosave, sign-up, and feedback.

Also new:

| Feature | How |
|---|---|
| Undo and redo | Toolbar buttons, or Ctrl/Cmd+Z and Ctrl/Cmd+Y (Ctrl/Cmd+Shift+Z also redoes). Covers builds, text, layout, reorder, delete, pictures, and brand changes. **Undo delete** still restores the most recent deletion directly. |
| Drag to reorder | Drag a slide's handle in the filmstrip. Alt+Left and Alt+Right move the current slide. |
| Shortcuts | **Shortcuts** button or `?` |
| More looks | Dawn and Slate themes. Team update and Conference talk templates. Thirteen templates, twelve themes. |
| Presenter extras | Next-slide preview and an Exit button, plus the timer, notes, and N to read aloud. |

Other shortcuts: Ctrl/Cmd+S saves the editable deck, Ctrl/Cmd+D duplicates the current slide, Ctrl/Cmd+Enter builds, P presents, arrows / Space / Page Up / Page Down / Home / End move between slides, S hides the presenter panel, Esc exits. Shortcuts stay out of the way while you are typing.

Building again still starts from the notes box. Undo puts the previous deck back, including canvas edits.

## How your text becomes slides

| You write | PinPoint makes |
|---|---|
| First heading, then one line | Title slide with subtitle |
| A short line with no full stop, followed by lines | A slide titled with that line, one point per following line |
| A heading with nothing under it | A big section slide |
| Two to four lines that start with a number (`30% harvest lost`, `12 markets ready`) | Stat slide with large figures |
| One line starting with `>` or a quote mark | Quote slide |
| A last slide named Thank you, Questions, Contact, Next steps, or Conclusion | Closing slide, without repeating those lines as bullets |

Lines over 120 characters are split into sentences and trimmed. More than five points continues on a new slide. Use `#` at the start of a line to force a heading. A slide titled Timeline, Roadmap, Process, How it works, Agenda, Journey, or Phase with 3 to 5 lines becomes a numbered steps slide.

## Slide designer

Changes show immediately. **Replay animation** plays the entrance again.

| Control | What it does |
|---|---|
| Add slide, Duplicate, Delete slide | Insert, copy, or remove. A deck keeps 1 to 30 slides. |
| Move earlier, Move later | Reorder. The filmstrip does this by dragging too. |
| Layout | Title, bullet points, big numbers, editable chart, quote, steps, section break, closing. |
| Theme, font, alignment, text size | Per slide. Text size runs from 70 to 140 percent. |
| Reveal and transition | Rise, fade, zoom, blur, or none. Transitions: deck default, slide, fade, zoom, cinematic, wipe, none. |
| Backgrounds | Ten generated patterns, strength, a new variation, or apply to every slide. |
| Colours | Background, accent, and text. Reset returns to the theme. A warning appears when text would be hard to read. |
| Apply this look to all slides | Copies theme, colours, font, animation, transition, and background. |

**Design on slide** turns the preview into a canvas. Drag a block to move it, pull a corner to resize it, and use the arrow keys to nudge. Guides snap blocks to the middle of the slide and to each other. Double-click is not required: the first click selects, and the next click types. **Add text** and **Add shape** drop an object you can recolor, align, center, duplicate, or remove. Those positions and objects are stored in the editable deck and written into the PowerPoint file. This is the part that used to mean opening another design tool: the deck is already written, and you arrange it instead of starting from a blank page.

Pictures and speaker notes still edit the rest. The `.pptx` keeps text, colours, pictures, charts, and notes. Animations play in PinPoint's presenter and are not written into PowerPoint, because the export library cannot store them.

## Pictures, brand, charts, and files

- **Photos:** Add picture, or the library (up to 24). PNG, JPG, and WebP only, 3 MB each, checked by file signature. SVG uploads are refused because they can carry scripts.
- **Openverse search:** openly licensed photos. A credit line is added on the slide and in the `.pptx`. If search is busy, use the Pexels, Unsplash, Openverse, or Wikimedia Commons links.
- **Brand kit:** name, two colours, optional logo. Saved in this browser, included in deck files and PowerPoint.
- **Charts:** choose Editable chart, edit the labels in Live Edit Canvas, and the PowerPoint file gets a native chart.
- **PDF:** Print / Save PDF, then choose Save as PDF. One 16:9 slide per page.
- **Autosave:** edits are stored in this browser. Restore them from Version history. Very large decks should use Save editable deck.
- **Editable deck:** JSON project file, up to 12 MB. Open deck restores it. Use Download .pptx for PowerPoint.

## Motion

Slide transitions: Slide, Fade, Zoom, Cinematic, Wipe, None. Titles reveal word by word, points rise in, stat numbers count up, and artwork drifts. All of that switches off when the device asks for reduced motion.

## Online drafting

Type an idea, choose 6 to 12 slides, and press **Synthesize AI Deck Outline**. With no proxy, PinPoint scores the idea against the templates and fills an outline you can edit. It does not invent a finished essay.

If `js/config.js` sets `AI_ENDPOINT`, the first available engine is used:

| Where PinPoint runs | Engine |
|---|---|
| A page with the hosted Claude helper | The visitor's own Claude permission. No key in the page. |
| Your site, with `server/proxy.js` | Your proxy, which calls Anthropic |
| Anything else | The offline outline |

If the online call fails, the offline outline is used when deep research is off. With **Deep research with web sources** checked and no proxy, PinPoint explains the missing setup instead of pretending it searched the web.

Content rule: the prompt forbids invented statistics and names of real organisations. Placeholders look like `[30%]`. Check names, dates, and claims before presenting.

### Self-hosting the proxy

1. Copy `.env.example` to `.env` on the server. Set `ANTHROPIC_API_KEY`, `ADMIN_TOKEN`, and `ALLOWED_ORIGIN`. Do not commit `.env`.
2. Node 18 or newer, no packages: `node server/proxy.js` with those variables in the environment.
3. In `js/config.js`, set `AI_ENDPOINT` to `https://your-proxy.example/deck` and `API_BASE` to `https://your-proxy.example`.
4. Add that origin to `connect-src` in the Content Security Policy in `index.html`.
5. Serve the proxy over HTTPS. For deep research, enable web search for the key's organisation. The proxy uses Anthropic's `web_search_20250305` tool, up to six searches. Web search is billed separately from tokens.

The key stays on the server. Only your site's origin may call the proxy. Deck requests are limited (`HOURLY_LIMIT`, default 8 per hour). The idea is capped at 500 characters and the body at 4 KB. The prompt lives on the server. Set `TRUST_PROXY=1` only behind a trusted load balancer. Keep `PP.DECK_PROMPT` in `js/assistant.js` identical to the prompt in `server/proxy.js`.

Replies are untrusted: only known slide types are accepted, text is length-capped, and everything is inserted as plain text.

## Free uses, sign-up, and feedback

Five free builds (Build presentation, a template, a file, or the AI button). Switching to the runner-up outline is free. The header shows the count. On the next build a sign-up box opens (name, email, consent, no password). After that, builds are unlimited on this browser. Change the limit with `CFG.FREE_USES` in `js/core.js`.

Feedback at the bottom of the page takes a star rating, a message, and an optional email.

| Where it runs | Sign-ups and feedback |
|---|---|
| Hosted page, visitor allowed to write | The page database, visible in the owner view |
| Your proxy, with `API_BASE` set | `data/signups.jsonl` and `data/feedback.jsonl` |
| Otherwise | This device only, and the visitor is told |

The free-use counter lives in the browser. Clearing site data starts it over. Sign-up has no password and no email check. You are collecting names and emails: keep the consent line and follow the rules that apply to you.

`GET /admin` compares `Authorization: Bearer` to `ADMIN_TOKEN` with a timing-safe compare. Open the site with `?admin=1`. The token stays in page memory. An email in that form registers a member on this device; that is not verified identity.

## Security model

| Risk | Protection |
|---|---|
| Script injection from document text | Text is inserted with `textContent`, never `innerHTML`. Word files are parsed with `DOMParser`, which does not run scripts. |
| Malicious files | Extension allow-list, 10 MB cap, signature check (`PK` for docx, `%PDF` for PDF, no NUL bytes in text). |
| Hidden characters | Stripped, then length-capped. |
| Data leaving the device | Files stay in the browser. Only the short idea is sent, and only when you press the AI button with a proxy or hosted helper configured. Photo search talks only to `api.openverse.org`. |
| SVG uploads | Refused. |
| PDF JavaScript | pdf.js runs with `isEvalSupported: false`. |
| Framing and plugins | `object-src 'none'`, `base-uri 'none'`, `form-action 'none'`, `no-referrer`. |
| Inline scripts | The app's HTML, CSS, and JS are separate files, so the page policy does not use `unsafe-inline`. |

Before a public launch, pin the CDN scripts with Subresource Integrity or host them yourself, and send the same Content Security Policy as an HTTP header with `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, and `Strict-Transport-Security`.

## GitHub Pages

`.github/workflows/deploy-pages.yml` publishes the static app when changes reach `main`. In the repository settings, set Pages to GitHub Actions. The workflow copies `index.html`, `css/`, `js/`, and `pptxgen.bundle.js`.

GitHub Pages does not run `server/proxy.js`. Deploy that on a separate HTTPS host and point `js/config.js` at it. Never put API keys or the admin token in the web page.

## Known limits

- PowerPoint export keeps colours, layout, text, speaker notes, uploaded pictures, and charts. It does not keep PinPoint's animations, transitions, or the generated illustrations (those are drawn as slide artwork in the browser; generated backgrounds are included as pictures).
- Scanned PDFs with no text layer cannot be read.
- Word headings come from heading styles. Bold text alone is treated as normal text.
- There is no shared workspace or comment thread. Those need an account system.

## Design notes

The app chrome is a light paper studio: warm background, serif headings, and one terracotta action. Slide themes stay separate, so a dark deck still sits on a quiet page. Present and Download stay in the header. Illustrations are generated as SVG, so they work offline and are not stock art. The same title keeps the same illustration.
