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
workings.html      The three headline claims tested against independent sources
exposure.html      Suppliers, export controls, cost-weighted exposure
angles.html        Profit pools from company filings, a 3D chokepoint view,
                   and what India could build by when
openweights.html   What open weights relieve, and the denial half-life equation
trends.html        Five series over time with fitted growth rates
india.html         Indian capability against the cost stack, scenarios, options
method.html        Every equation, assumption and source grade
```

## Data and scripts

```
assets/js/dash.js    Cost stack, exposure, controls, India fit, scenario
assets/js/dash2.js   Marimekko, denial half-life, open weights, trends
assets/js/dash3.js   Source triangulation, labour-compute crossover, sensitivity
                     tornado, plus the animation and popover layer
assets/js/dash4.js   Profit-pool ladder, drag-rotatable 3D scatter, time-and-capital
                     matrix, animated timeline. The 3D projection is hand-rolled
                     SVG with no library dependency.

The 3D scatter does NOT use click handlers on the SVG circles. Pointer capture on the
container swallows child clicks during drag, so selection is done by hit-testing the
projected coordinates on pointerup, and only when the pointer moved less than 6px.
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

## On the three headline claims

They were tested and one failed. See `workings.html`.

- **Inference as a property business: survived.** Four independent estimates put the restricted
  share at 53-61%; we say 57%.
- **Pretraining as a hardware business: survived, but our 62% sits near the favourable end of
  Cottier's published range.** At the other end of their staff range hardware is 47%. We now quote
  a range.
- **Post-training as a labour business: did not survive as written.** It was anchored to DeepSeek-R1
  at 5.3% RL compute. Reinforcement learning compute has since scaled by more than tenfold between
  model generations, and Cursor have disclosed post-training compute exceeding pretraining. The claim
  is now scale-dependent, with a calculated crossing point at roughly 50% RL intensity for generalist
  data and 149% for expert data.

**The single most influential number is one we assigned, not one we sourced:** accelerator
substitutability in inference. The tornado chart on `workings.html` shows it moving the index between
10 and 35 against a default of 22, while every measured input moves it by five points or less.

## Three things to know before extending this

- **The post-training cost split is the load-bearing original claim and rests on the weakest data.**
  Compute is anchored to a disclosed figure; annotation and environment costs come from vendor pricing
  surveys with no primary price list behind them.
- **Control leverage and substitutability are our own 0-1 scales.** They are stage-specific: an
  accelerator is 0.10 substitutable in pretraining and 0.60 in inference. Keying on the component name
  alone gives wrong answers for both.
- **E5 assumes efficiency gains reach the restricted party.** Open publication and open weights ensure
  that today. A regime restricting publication would break the equation.

## Terminology that caused a bug once

Three different percentages describe the same cost stack and are easy to confuse:

- **Hardware share** — accelerators, servers and interconnect only. Pretraining: 62%.
- **Reached by a control** — every line with non-zero control leverage, which adds the partly
  restricted data line. Pretraining: 66%.
- **Out of reach** — lines with zero leverage: staff, energy, buildings. Pretraining: 34%.

An earlier version used "restricted" for the first and "untouchable" for the third, which made 62
and 66 look like a contradiction. Chart labels now say "reached by a control" explicitly.

## Editorial conventions

Wine marks something a government somewhere can restrict. Marigold marks something nobody can. Every
figure carries its source and a grade from A (primary) to D (untraceable). Grade D material is used
for context and never in a calculation.
