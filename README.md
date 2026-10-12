# PinPoint

Turn a Word document, a PDF or pasted notes into a designed presentation in one click. Present it in the browser or download a real `.pptx`.

## Quick start

1. Open `index.html` in a browser (needs internet once, to load the document-reading libraries and fonts; PowerPoint export is bundled locally).
2. Drop a `.docx`, `.pdf`, `.txt` or `.md` file, or paste notes.
3. Pick a theme and motion style, then press **Build presentation**.
4. Press **Present** (arrow keys, Space, Esc) or **Download .pptx**. The `.pptx` is generated in the visitor's browser and saved to that visitor's device (through a save dialog where supported, otherwise the browser's normal download location); the presentation file is not uploaded to the app server.

Drag the **Editing panel** bar at the top of the left panel to move it independently of the slide preview. Use **Float panel** to detach it without dragging, **Dock panel** to restore the side-by-side layout, or arrow keys while the floating panel bar is focused to nudge it.

Add `?debug=1` to the URL to print every parsing step to the browser console.

## Free static hosting

The app can be hosted as a static site on Cloudflare Pages. Upload `PinPoint-site.zip` (or the contents of the `site` folder) with the Pages **Direct Upload** flow. The free static deployment serves the editor, templates, offline outline, and browser-side PowerPoint downloads.

Deep research and shared feedback/admin need a separate HTTPS proxy. Until one is configured, sign-ups and feedback stay on each visitor's device, and deep research is unavailable. To connect your own proxy, define `window.PINPOINT_CONFIG={AI_ENDPOINT:'https://your-proxy.example/deck',API_BASE:'https://your-proxy.example'}` before the main inline script and add that proxy origin to the page's `connect-src` policy. Keep API keys and the admin token on the server; never add them to this static page.

## How your text becomes slides

| You write | PinPoint makes |
|---|---|
| First heading, then one line | Title slide with subtitle |
| A short line with no full stop, followed by lines | A slide titled with that line, one point per following line |
| A heading with nothing under it | A big section slide |
| Two to four lines starting with a number (`30% harvest lost`) | Stat slide with large figures |
| One line starting with `>` or a quote mark | Quote slide |
| A last slide named Thank you, Questions, Contact, Next steps or Conclusion | Closing slide |

Lines over 120 characters are split into sentences and trimmed. More than five points continues on a new slide. Use `#` at the start of a line to force a heading.

## Code map (all in `index.html`, numbered sections)

| Section | Job | Debug tip |
|---|---|---|
| 3 Config | Limits (10 MB, 60,000 characters, 30 slides) | Change limits here |
| 4 Sec | File validation and text cleaning | Errors show in the red message under the buttons |
| 5 Extract | `.docx`, `.pdf`, `.txt` to plain text | Check the text box: it shows exactly what was read |
| 6 Parse | Text to slide objects | `?debug=1` logs the slide array |
| 7 Themes | Six palettes | Add a theme by adding one object |
| 8 art | Seeded SVG artwork per slide | Same title gives same art |
| 9 buildSlide | Slide object to DOM on a 1280x720 canvas | Each layout is one `.slide.<kind>` class |
| 10 Stage | Preview, filmstrip, present mode, keyboard | |
| 11 exportPptx | PowerPoint file via bundled PptxGenJS | |

Every stage is a small function with one job, so a wrong slide can be traced: is the text wrong (Extract), is the split wrong (Parse), or is the look wrong (buildSlide or CSS)?

## Security model

| Risk | Protection |
|---|---|
| Script injection from document text | Text is only ever inserted with `textContent`, never `innerHTML`. Word files are parsed with `DOMParser`, which does not run scripts. |
| Malicious or fake files | Extension allow-list, 10 MB cap, and file signature check (`PK` for docx, `%PDF` for PDF, no binary bytes in text files). |
| Hidden or control characters | Stripped from all input, length capped. |
| Data leaving the device | Your uploaded files stay in the browser. Only the short idea you type is sent to the AI, and only when you press the AI button. Sign-up details and feedback are sent only when the visitor submits those forms. The Content Security Policy allows connections to one host only, `api.openverse.org`, and the only thing sent there is your photo search word. PinPoint stores the free-use counter and membership flag in this browser's local storage. If server saving is not configured, sign-up details and feedback stay on this device only. No cookies are used. |
| Malicious PDF code | pdf.js runs with `isEvalSupported:false`. |
| Framing, plugins, base tag tricks | `object-src 'none'`, `base-uri 'none'`, `form-action 'none'`. |
| Referrer leaks | `no-referrer`. |

### Hardening before going public

1. Pin and verify the three CDN scripts with Subresource Integrity (`integrity="sha384-..."` plus `crossorigin="anonymous"`), or download them and host them yourself, then remove the CDN from `script-src`.
2. Serve over HTTPS and send the same CSP as an HTTP header, adding `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff` and `Strict-Transport-Security`.
3. Move the inline script and styles to files and replace `'unsafe-inline'` with hashes or nonces.

## Slide designer

Below the preview, every slide can be managed and styled on its own. Changes show instantly; press **Replay animation** to watch the slide's animation again.

| Control | What it does |
|---|---|
| Add slide, Duplicate, Delete slide | Insert a new slide after the current one, copy it, or remove it. **Undo delete** brings back deleted slides, newest first. A deck keeps at least 1 and at most 30 slides. |
| Move earlier, Move later | Reorder slides. |
| Layout | Switch a slide between Title, Bullet points, Big numbers, Quote, Steps, Section break and Closing. Your text carries across. |
| Theme for this slide | Give one slide a different theme from the rest of the deck. |
| Background, Accent, Text colours | Pick any colours. Reset colours returns to the theme. A warning appears when text would be hard to read. |
| Font, Alignment, Text size | Three fonts, left or centre, 70 to 140 percent. |
| Reveal animation and speed | Rise, Fade, Zoom, Blur or None, at Fast, Normal or Slow pace. |
| Transition into this slide | Deck default, Slide, Fade, Zoom, Cinematic, Wipe or None. |
| Add point, Remove last point | Grow or shrink the list or the row of big numbers. |
| Apply this look to all slides | Copy the current slide's theme, colours, font, animation and transition to every slide. |

Together with Live Edit Canvas (click text to retype it), Add picture and speaker notes, this edits a slide completely. The `.pptx` download keeps each slide's text, colours, pictures and notes. PowerPoint animations and transitions are not exported, because the export library cannot write them: they play inside PinPoint's own present mode.

## Studio features

| Feature | How to use it | Notes |
|---|---|---|
| Synthesize AI Deck Outline | Type an idea, press the button | Builds a deck at once from the best-fit template, with a one-click runner-up. Offline rules, not a cloud AI, unless you set `CFG.AI_ENDPOINT`. |
| Live Edit Canvas | Press the button, click any text on the slide, type | Plain text only. Enter finishes a line. Edits flow into the filmstrip and the `.pptx`. Pressing Build presentation again rebuilds from the text box and discards canvas edits. |
| Narrate | Press Narrate, or N in present mode | Uses the browser's built-in voice (free, offline, nothing uploaded). Reads your speaker notes if you wrote any, otherwise the slide text. Voice quality depends on the device. |
| Speaker notes | Box under the preview | Saved into the `.pptx` notes. |
| Presenter Studio | Press Present | Live timer, current notes, slide count. S hides the panel, arrows or swipe move, Esc exits. |
| Responsive canvas | Automatic | Every slide is drawn once on a 1280 by 720 canvas and scaled to its container with a ResizeObserver, so it stays sharp on high-density screens. Present mode refits on window resize and phone rotation. |

The interface uses a glass and neon look (translucent blurred panels over glow gradients). Browsers without blur support fall back to solid panels.

## Online AI: from a simple idea to a full presentation

Type a simple idea, choose how many slides (6 to 12) and press **Synthesize AI Deck Outline**. Claude picks the best template, then writes the whole deck: titles, points, stat slides, a quote, a roadmap, a closing slide and speaker notes for each slide. The text box fills with the deck so you can keep editing, and **Live Edit Canvas** lets you change anything on the slide itself.

Content rules: the AI is told never to invent statistics or facts about real organisations. Where a number would help it writes a placeholder in square brackets, such as [30%], for you to replace with your real figure. Always check names, dates and claims before presenting.

PinPoint picks the first engine that is available:

| Where PinPoint runs | AI engine | Setup |
|---|---|---|
| The published (hosted) page | Your own Claude account, through the page's built-in permission. The first use asks you to allow it. | None. No key anywhere. |
| Your own website | Your proxy server, `server/proxy.js`, which calls the Anthropic API | See below |
| Opened as a plain file | Offline outline rules | None |

If the online AI fails or is declined, PinPoint says so and builds the offline outline instead, so you always get a deck.

### Self-hosting the AI (your own website)

1. Create an API key in the Anthropic Console. Keep it on the server only.
2. Run the proxy (Node 18 or newer, no packages needed):
   `ANTHROPIC_API_KEY=your-key ALLOWED_ORIGIN=https://your-site.example node server/proxy.js`
3. In `index.html` set `CFG.AI_ENDPOINT='https://your-proxy.example/deck'` (section 14) and add that address to `connect-src` in the CSP at the top of the file.
4. Serve the proxy over HTTPS.

The proxy protects your key and your bill: the key never reaches the browser; only your site's origin may call it; requests are limited to 8 per hour per visitor (`HOURLY_LIMIT`); the idea is capped at 500 characters and the request body at 4 KB; the prompt lives on the server so visitors cannot use it as a free general chatbot; errors reveal nothing internal. Set a monthly spend limit on the key as a final safety net. If the proxy sits behind a load balancer, set `TRUST_PROXY=1` so visitors are told apart by their real address. Keep the prompt in `proxy.js` identical to `DECK_PROMPT` in `index.html`.

### Safety of AI replies

The AI reply is treated as untrusted. PinPoint accepts only the seven known slide types, trims every text to a fixed length, caps the number of slides and points, and inserts everything as plain text, never HTML, so a bad or manipulated reply cannot run code on the page.

Online AI uses your Claude usage on the hosted page, or your API credit on your own server.

## Built-in background pictures

Ten original backgrounds are generated inside PinPoint, so they are free, work offline and need no download: Aurora glow, Waves, Contours, Halftone, Stripes, Honeycomb, Circuit, Sunburst, Bokeh and Facets. In the **Slide designer**, click a thumbnail to put one on the current slide. They are drawn in the slide's own colours, so they match any theme or custom colour.

- **Picture strength** (20 to 100 percent) fades the picture so text stays readable.
- **New variation** redraws the same style with a different random pattern.
- **Use this background on every slide** copies the style and strength to all slides, each with its own variation. **Apply this look to all slides** also copies it.
- The `.pptx` download includes the background as a picture behind each slide.
- To add a new design, add one function to `BG` and one name to `BGNAMES` (section 22).

## Free uses, sign-up and feedback

**Five free decks.** A "deck" is one build: pressing Build presentation, picking a template, loading a file, or using the AI button. Switching to the AI's runner-up template is free. The header shows "Free decks: 2 of 5 used". On the sixth build a sign-up box opens (name, email and a consent tick, no password). After signing up, the build continues and decks are unlimited. Change the limit with `CFG.FREE_USES` (section 23).

**Feedback.** The box at the bottom collects a star rating, a message and an optional email for a reply.

**Where sign-ups and feedback are saved** (the first that works):

| Where PinPoint runs | Saved to | Who can read it |
|---|---|---|
| The published page, visitor is signed in to Claude and allowed to write | The page's own database | Only you, in the "Owner view" box that appears for you at the bottom of the page. You can also ask Claude to read them. |
| Your own website with `server/proxy.js` and `CFG.API_BASE` set | `data/signups.jsonl` and `data/feedback.jsonl` on your server | Only whoever has the server files |
| Anything else | This device only (the visitor is told) | Nobody else |

**Honest limits, please read.**
- The free-use counter is kept in the visitor's browser. Clearing site data, a private window or a different browser starts a new count. Stopping this properly needs real accounts on a server.
- On the published page, visitors who are not signed in to Claude, or who can only view the page, cannot write to its database. Their sign-up and feedback fall back to "this device only". For a public launch, host PinPoint on your own site with the server below.
- Sign-up has no password and no email check, so anyone can type any email address. Treat the list as interest, not verified accounts.
- You are collecting personal data (names and emails). Keep the consent line, tell people how you use their details, and follow the data-protection rules that apply to you.

### Server setup for sign-ups and feedback

1. Run the server as described above. It now also accepts `POST /signup` and `POST /feedback`. Both check the visitor's origin, validate every field, clean control characters, allow 10 requests per hour per visitor, cap requests at 4 KB and stop saving at 10 MB per file. Files are written with owner-only permissions.
2. In `index.html` set `CFG.API_BASE='https://your-server.example'` and add that address to `connect-src` in the CSP.
3. Read the results from `data/*.jsonl` (one JSON record per line). If you open them in a spreadsheet, treat any cell starting with `=`, `+`, `-` or `@` as text, because visitors typed it.
4. Back up the `data` folder and delete records when people ask.

## Offline idea assistant

Type your idea in a sentence or two and press **Suggest a template and outline**. PinPoint scores your words against 11 presentation types, recommends the best fit with the reason and a runner-up, and can load an outline built around your topic. It runs offline with simple rules, so it gives structure, not finished writing.

This is the fallback when no online AI is available. Never place an AI key inside `index.html`: anyone can read it.

## Free photo search

Type a word in the picture library and press **Search**. Results come from Openverse (openly licensed photos, commercial use allowed). Click one to put it on the slide and into your library. A credit line (photographer, licence) is added to the slide and to the `.pptx` automatically. Preview images are small (about 600 pixels wide), so they suit side panels better than full-screen backgrounds. If search is busy, use the Pexels, Unsplash, Openverse or Wikimedia Commons links instead. Openverse's anonymous limits may apply; this feature needs internet and was written from its public API description.

## Templates and themes

Eleven templates: Pitch deck, Investor deck, Business report, Lesson, Proposal, Event, Product launch, Marketing plan, Case study, Impact report and Workshop. Ten themes, including Midnight Gold, Ocean, Editorial and Glass.

## Motion

Slide transitions: Slide, Fade, Zoom, Cinematic (blur and scale in), Wipe, None. Inside slides: titles reveal word by word, points rise in one at a time, stat numbers count up, backgrounds drift slowly and artwork floats. All motion switches off for people who set "reduce motion" on their device.

## Template designs

Six one-click starters, each with its own theme and content structure: Pitch deck, Business report, Lesson, Proposal, Event and Product launch. Pick one, replace the words with yours, press **Build presentation**. Add a template by adding one object to the `TEMPLATES` array (name, theme, text).

## Slide types

Title, bullets, stats, quote, section, closing, and **steps** (a numbered flow, used automatically when a slide titled Timeline, Roadmap, Process, How it works, Agenda, Journey or Phase has 3 to 5 lines).

## Pictures

- **Built-in illustrations:** PinPoint matches slide wording to original SVG scenes (growth chart, people, light bulb, globe, shield, rocket, sun and leaf, coins). Edit `SCENES` and `SCENE_KEYS` to add more.
- **Your own photos:** select a slide, press **Add picture**, choose a PNG, JPG or WebP (max 3 MB). It fills the picture panel on bullet and title slides and becomes a soft background on other slides. Photos are included in the `.pptx` export. Free sources: Pexels, Unsplash, Openverse and Wikimedia Commons (links in the picture library search for the current slide's title).
- **Picture library:** add up to 24 pictures at once, then click any thumbnail to put it on the current slide. Links to Pexels, Unsplash, Openverse and Wikimedia Commons search for the current slide's title. Download there, then add to the library.
- SVG uploads are refused on purpose, because SVG files can carry scripts. Pictures are checked by file signature, not just by name.
- Pictures belong to the current deck: pressing **Build presentation** again starts a fresh deck without them.

## Known limits

- The `.pptx` export keeps colours, layout, text, speaker notes and your uploaded pictures, but not the animations, transitions or the built-in illustrations.
- Scanned PDFs (images of text) have no text layer, so nothing can be read from them.
- Word headings are detected from Heading styles; plain bold text is treated as normal text.

## Design notes

Themes and motion are original work inspired by the main styles in today's tools: gradient-rich "Aurora" (the Gamma look), clean airy "Studio" (the Beautiful.ai look), and high-contrast "Pitch". Slide imagery is generated as SVG so it works offline, carries no copyright risk and is unique per slide.

## Ideas to add next

Per-slide AI fact checking and rewriting, more chart types, shared team workspaces, and verified member accounts are useful next steps.

## Editable deck files

Use **Save editable deck** to download a JSON project file containing slide text, notes, theme settings, brand kit, built-in backgrounds and uploaded images. **Open deck** restores that project in PinPoint. Files are limited to 12 MB, and imported slide content is validated and cleaned before rendering. The deck JSON is an editable PinPoint project file; use **Download .pptx** for PowerPoint.

This portability flow complements the existing Word/PDF/text import, PPTX export, presenter mode and slide designer. PinPoint currently has no shared-workspace collaboration or comment threads; those require a server-backed identity and sync service.

## Brand kit, charts, PDF and version history

- **Brand kit:** set a name, two brand colours and an optional PNG/JPG/WebP logo. Save and apply it to the current deck and future decks on this browser. The logo and palette are included in editable deck files and PowerPoint exports.
- **Editable charts:** choose **Editable chart** in the slide designer. Edit its labels and values with Live Edit Canvas; PowerPoint export creates a native chart that can be edited in PowerPoint.
- **PDF:** press **Print / Save PDF**, then choose **Save as PDF** in the browser print dialog. It lays out one 16:9 slide per page.
- **Autosave and history:** deck edits are saved in this browser and the newest versions appear in **Version history**. Restore a saved version there. Large decks may exceed browser storage; use **Save editable deck** for a downloadable backup.

## Deep research mode

Deep research runs through the self-hosted proxy so the Anthropic key stays on the server. In index.html, set CFG.AI_ENDPOINT to the HTTPS URL ending in /deck, then add that origin to the Content Security Policy connect-src directive. Enable web search for the API key's organization in the Anthropic Console. The proxy uses Anthropic's web_search_20250305 tool with up to six searches per request.

When the checkbox is enabled, the model researches the idea before drafting slides. The app displays source links and adds a Research sources slide with URLs in its speaker notes. If the proxy is not configured, the app explains what setup is missing instead of pretending it completed live research. Web search has separate usage charges from model tokens; Anthropic currently lists $10 per 1,000 searches, plus token costs. See the official [web search tool documentation](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool).

The template chooser now has original PinPoint preview cards and category/search filters inspired by common presentation-template galleries. These are PinPoint designs, not Canva templates; users can still customize themes and slides in the designer.

## Admin feedback inbox

Open the site with ?admin=1 to show the inbox. The token is held in memory only and sent to GET /admin in the Authorization header. The proxy compares it against ADMIN_TOKEN and returns the latest feedback and sign-ups. Feedback submissions are centrally stored only when CFG.API_BASE points to the proxy; otherwise the app saves them on the visitor's device.

Set ADMIN_TOKEN to a long random secret in the server environment. Keep it out of index.html and source control. Set CFG.API_BASE to the proxy base URL in index.html, and allow that origin in connect-src. Set ALLOWED_ORIGIN to the exact website origin. For local preview, use the same origin as the app's browser URL and a local-only token. Do not expose the admin inbox over plain HTTP on a public network.

The inbox access form accepts either the admin token or a member email. A valid email registers the member through the configured sign-up store and remembers that membership in this browser's local storage, so it remains signed in after reloads on this device. This is email-only membership, not verified identity; use an email verification or password flow before treating it as secure authentication on a public site. The admin token is kept only in page memory.


## GitHub Pages

This repository includes `.github/workflows/deploy-pages.yml` to publish the static app whenever changes reach `main`. To enable it, open **Settings → Pages**, set the build source to **GitHub Actions**, then check the **Actions** tab for the first deployment. The site URL will be `https://boss-101-mmk.github.io/pinpoint-slide-maker/`.

GitHub Pages serves only the static editor. It does not run the Node backend. To enable proxy-based AI research and centrally stored feedback, deploy `server/proxy.js` on a separate HTTPS Node host, copy `.env.example` to `.env`, set real values on the server, and configure `PINPOINT_CONFIG` and the Content Security Policy in `index.html` for that proxy. Never commit `.env` or put API keys or the admin token in the web page.
