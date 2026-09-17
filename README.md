# Three Stages, Three Problems

A strategic dashboard on artificial intelligence for policy readers. It works out where the money goes
at each stage of building and running an AI model, who supplies each line of that bill, which export
controls reach which line, what open weights relieve, how the chokepoints have moved over time, and
what all of that means for India.

It deliberately does not explain algorithms. The technical work sits underneath the numbers.

Plain HTML, CSS and JavaScript. No build step, no dependencies beyond two Google Fonts.

## Deploying to GitHub Pages

Push the contents of this folder to the root of the default branch, then Settings, Pages, Deploy from
a branch, `main`, `/ (root)`.

```
git add -A && git commit -m "Update dashboard" && git push
```

`.nojekyll` is a dotfile: `git add -A` picks it up, a web-interface drag-and-drop does not, and macOS
Finder hides it. Check with `git ls-files | grep nojekyll`.

## Pages

```
index.html         Overview and the headline finding
money.html         Marimekko of all three cost stacks, plus single-stage view
exposure.html      Suppliers, export controls, cost-weighted exposure
openweights.html   What open weights relieve, and the denial half-life equation
trends.html        Five series over time with fitted growth rates
india.html         Indian capability against the cost stack, scenarios, options
method.html        Every equation, assumption and source grade
```

## Data and scripts

```
assets/js/dash.js    Cost stack, exposure, controls, India fit, scenario
assets/js/dash2.js   Marimekko, denial half-life, open weights, trends
assets/data/*.csv    Seven datasets, downloadable from the pages
```

`dash.js` and `dash2.js` carry their own copies of the cost stack inline so the pages work from
`file://` without a server. If you edit `cost-stack.csv`, update `STACK` in `dash.js` and `W` in
`dash2.js` to match.

## Equations

Listed with citations in `assets/data/equations.csv`. E1 (training compute), E2 (HHI), E4 (effective
compute), E6 (KV cache) and E7 (inference price decline) are from the literature. **E3 (cost-weighted
exposure) and E5 (denial half-life) are our own constructions** and are marked as such everywhere
they appear.

## Three things to know before extending this

- **The post-training cost split is the load-bearing original claim and rests on the weakest data.**
  Compute is anchored to a disclosed figure; annotation and environment costs come from vendor pricing
  surveys with no primary price list behind them.
- **Control leverage and substitutability are our own 0-1 scales.** They are stage-specific: an
  accelerator is 0.10 substitutable in pretraining and 0.60 in inference. Keying on the component name
  alone gives wrong answers for both.
- **E5 assumes efficiency gains reach the restricted party.** Open publication and open weights ensure
  that today. A regime restricting publication would break the equation.

## Editorial conventions

Wine marks something a government somewhere can restrict. Marigold marks something nobody can. Every
figure carries its source and a grade from A (primary) to D (untraceable). Grade D material is used
for context and never in a calculation.
