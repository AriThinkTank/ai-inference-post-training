# After the Model Is Trained

A five-chapter explainer on post-training and inference, built from a briefing deck prepared for the High-Tech Geopolitics Programme, Takshashila Institution.

Plain HTML, CSS and JavaScript. No build step, no framework, no dependencies beyond two Google Fonts loaded from a CDN.

## Deploying to GitHub Pages

1. Create a repository and push the contents of this folder to the root of the default branch.

   ```
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<user>/<repo>.git
   git push -u origin main
   ```

2. In the repository, go to **Settings → Pages**.
3. Under **Source**, choose **Deploy from a branch**. Set the branch to `main` and the folder to `/ (root)`. Save.
4. The site appears at `https://<user>.github.io/<repo>/` within a minute or two.

The `.nojekyll` file stops GitHub from running the pages through Jekyll, which would otherwise ignore some paths. Leave it in place.

To serve the site from a subdirectory instead, move these files into that directory and choose it in step 3. All internal links are relative, so nothing needs editing.

## Running it locally

Opening `index.html` directly in a browser works. To serve it properly:

```
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Structure

```
index.html                      The map, the cast, the vocabulary
01-what-pretraining-leaves.html Chapter 01 — the next-token machine
01b-inside.html                 Chapter 01½ — attention, the stack, the sampler
02-post-training.html           Chapter 02 — four teachers
03-inference.html               Chapter 03 — inference
04-policy.html                  Chapter 04 — why it matters
05-reference.html               Chapter 05 — reading, glossary, quiz
assets/css/takshashila.css      The whole design system
assets/js/comic.js              Cast figures, navigation, scroll behaviour
assets/js/widgets-train.js      Widgets for chapters 01 and 02, plus shared helpers
assets/js/widgets-serve.js      Widgets for chapters 03 and 05
assets/js/widgets-extra.js      Sampler, attention, transformer, RLHF recipe
assets/js/guide.js              Widget briefs and hover definitions
```

## The two shared systems

**Widget briefs.** Every `data-widget` gets a yellow explainer injected above it: what it is, what you're changing, what to watch for, and a link to the source. They all live in the `BRIEFS` table at the top of `guide.js`. Edit the text there, not in the widget.

**Diagrams.** Hand-written inline SVG inside `<div class="fig">`. They use the shared `.d-box`, `.d-lbl`, `.d-sub`, `.d-arr` classes so they follow the colour tokens and respond to the stylesheet. Arrowheads come from `<marker id="ah">` and `<marker id="ahg">`, which must be defined once per page — the CSS references those ids, so a page with a figure and no defs gets lines with no heads.

**Hover definitions.** Write `<b class="def" data-t="kv-cache">KV cache</b>` anywhere and it picks up a definition and a source link from the `DEFS` table in `guide.js`. Fifty-two terms so far. A term with no entry gets a grey underline instead of an orange one, so mistakes are visible rather than silent.

`guide.js` must load last, after the widget scripts.

## How the widgets work

Every interactive element is a `<div data-widget="name">`. On load, the scripts find each one and build it. To add a widget, register it with `T.widget('name', function (node) { ... })` and drop the matching div into a page.

`widgets-train.js` defines the shared helpers, so where both files are used it must be loaded first.

## Editorial conventions

- Wine marks a change to the weights. Marigold marks compute spent per request. This is used consistently and is explained on the cover.
- Every figure carries its source in the `.source` line beneath it. Where a number comes from a vendor benchmark nobody outside the vendor can reproduce, the source line says so.
- Illustrative numbers are labelled as illustrative. The KV cache figures are computed from a stated formula so a reader can check them.
- No emoji, no exclamation marks, no border radius, no drop shadows. These are deliberate, and follow the Takshashila design language.

## Accessibility

Interactive controls are real buttons and inputs, reachable by keyboard, with a visible wine focus ring. Charts carry `role="img"` and a label. Animation is suppressed under `prefers-reduced-motion`. The one known weakness is that a few widgets convey state partly through colour; each also states it in text.

## Corrections

The four points listed under D.05 in chapter 04 are where the material is least secure. Corrections are welcome there first.
