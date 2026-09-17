/* =========================================================================
   dash.js — the whole dashboard runs off this.

   Data mirrors assets/data/*.csv. Every figure is traceable, and the
   arithmetic is printed wherever a number is derived rather than sourced.
   ========================================================================= */

window.D = window.D || {};
(function (D) {
  'use strict';

  /* ---------- tiny helpers ---------------------------------------------- */
  D.reg = {};
  D.widget = function (n, f) { D.reg[n] = f; };
  D.esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  D.h = function (html) { var t = document.createElement('div'); t.innerHTML = html; return t.firstElementChild; };
  D.money = function (v) {
    if (v >= 1e9) return '$' + (v / 1e9).toFixed(v >= 1e10 ? 0 : 1) + 'bn';
    if (v >= 1e6) return '$' + (v / 1e6).toFixed(v >= 1e8 ? 0 : 1) + 'm';
    if (v >= 1e3) return '$' + Math.round(v / 1e3) + 'k';
    return '$' + Math.round(v);
  };
  D.shell = function (node, title, tag, body, foot) {
    node.classList.add('lab');
    node.innerHTML = '<div class="lab-head"><h3 class="h-sub">' + title + '</h3><span class="lab-tag">' + (tag || 'Try it') + '</span></div>' +
      '<div class="lab-body">' + body + '</div>' + (foot ? '<div class="lab-foot"><span class="source">' + foot + '</span></div>' : '');
    return node.querySelector('.lab-body');
  };

  /* ---------- THE DATA --------------------------------------------------- */

  var STACK = {
    'Pretraining': [
      { c: 'AI accelerators',     s: 33, lev: 1.00, sub: 0.10, note: 'Top-bin chips only. Older parts cannot stand in, because memory bandwidth and interconnect are the whole point.' },
      { c: 'R&D staff',           s: 30, lev: 0.00, sub: 0.00, note: 'Salaries and equity. Roughly a third of the bill, and nobody can stop you hiring.' },
      { c: 'Server components',   s: 18, lev: 0.20, sub: 0.70, note: 'Chassis, processors, storage. Competitive, widely available.' },
      { c: 'Cluster interconnect',s: 11, lev: 0.60, sub: 0.30, note: 'The part that turns many chips into one machine. Sold with the chips.' },
      { c: 'Energy',              s:  4, lev: 0.00, sub: 0.00, note: 'Small in money, decisive in where you can build.' },
      { c: 'Data acquisition',    s:  4, lev: 0.20, sub: 0.50, note: 'Licensing and cleaning. Rising, but still minor at this stage.' }
    ],
    'Post-training': [
      { c: 'Human preference and expert data', s: 45, lev: 0.00, sub: 0.00, note: 'Generalist comparisons cost $0.50 to $8 each. Expert work in law, medicine or code runs $20 to $100 and up.' },
      { c: 'Reinforcement environments',       s: 25, lev: 0.00, sub: 0.00, note: 'One interface environment costs about $20,000. A complex application clone runs to about $300,000.' },
      { c: 'Compute',                          s: 20, lev: 0.80, sub: 0.50, note: 'DeepSeek-R1\u2019s entire reinforcement learning stage was 147,000 GPU-hours, about $294,000 at rented rates.' },
      { c: 'Research staff',                   s: 10, lev: 0.00, sub: 0.00, note: 'Small teams. The scarce input is experience, not headcount.' }
    ],
    'Inference': [
      { c: 'AI accelerators amortised', s: 50, lev: 1.00, sub: 0.60, note: 'Older generations, lower-spec parts and compressed models all work here. That is what makes this substitutable.' },
      { c: 'Energy',                    s: 18, lev: 0.00, sub: 0.00, note: 'Continuous draw that follows demand. A domestic cost, entirely.' },
      { c: 'Data centre facility',      s: 17, lev: 0.00, sub: 0.00, note: 'Shell, power plant, cooling. Built locally, financed locally.' },
      { c: 'Networking and storage',    s:  7, lev: 0.60, sub: 0.50, note: 'Matters far less than in training. Ordinary Ethernet suffices.' },
      { c: 'Engineering staff',         s:  8, lev: 0.00, sub: 0.00, note: 'Serving engineers. Open source has lowered this barrier sharply.' }
    ]
  };

  var STAGES = ['Pretraining', 'Post-training', 'Inference'];

  var BUDGET = { 'Pretraining': 350e6, 'Post-training': 8e6, 'Inference': 120e6 };

  var INDIA = {
    'Pretraining': { 'AI accelerators': 2, 'R&D staff': 3, 'Server components': 3, 'Cluster interconnect': 1, 'Energy': 3, 'Data acquisition': 4 },
    'Post-training': { 'Human preference and expert data': 5, 'Reinforcement environments': 1, 'Compute': 5, 'Research staff': 3 },
    'Inference': { 'AI accelerators amortised': 3, 'Energy': 3, 'Data centre facility': 2, 'Networking and storage': 3, 'Engineering staff': 4 }
  };

  var INDIA_WHY = {
    'AI accelerators': '38,000 GPUs empanelled, but split across 14 providers with no disclosed contiguous cluster above a few thousand.',
    'R&D staff': 'Deep engineering base. Thin experience of actually running a frontier-scale job.',
    'Server components': 'Assembly and integration capability exists and is growing.',
    'Cluster interconnect': 'No domestic capability. Comes bundled with the chips.',
    'Energy': 'Available nationally. Constrained in Mumbai and Chennai.',
    'Data acquisition': 'Large multilingual corpora already exist through public projects.',
    'Human preference and expert data': 'Twenty-two scheduled languages, a large credentialed professional base, and an established annotation industry. India\u2019s single strongest position anywhere in the stack.',
    'Reinforcement environments': 'No maintained environment suite has been published by any Indian institution. The largest gap on this page.',
    'Compute': 'Sufficient by a wide margin at this stage. R1\u2019s whole RL run is under four hours of the national fleet.',
    'Research staff': 'Several firms run these pipelines in production already.',
    'AI accelerators amortised': 'Adequate for current serving loads, and older parts remain usable here.',
    'Data centre facility': '1,600 MW exists, but was built for 5-10 kW racks rather than 40-130 kW.',
    'Networking and storage': 'Commodity. Widely available.',
    'Engineering staff': 'Strong and improving. The serving stack is largely open source.'
  };

  D.STACK = STACK; D.STAGES = STAGES; D.BUDGET = BUDGET; D.INDIA = INDIA;

  function exposure(stage, wLev, wSub) {
    return STACK[stage].reduce(function (a, r) {
      return a + (r.s / 100) * Math.pow(r.lev, wLev) * (1 - r.sub * wSub);
    }, 0) * 100;
  }
  function domesticShare(stage) {
    return STACK[stage].reduce(function (a, r) { return a + (r.lev === 0 ? r.s : 0); }, 0);
  }
  D.exposure = exposure; D.domesticShare = domesticShare;

  /* =========================================================================
     1. COSTSTACK — where the money goes, by stage
     ========================================================================= */

  D.widget('coststack', function (node) {
    var stage = 'Pretraining', budget = BUDGET[stage], sel = null;

    var body = D.shell(node, 'Where the money actually goes', 'Pick a stage',
      '<div class="seg cs-seg"></div><div class="cs-b"></div><div class="cs-bars"></div><div class="lab-out cs-out"></div>',
      'Pretraining shares from Cottier et al., <a class="link" href="https://arxiv.org/abs/2405.21015" target="_blank" rel="noopener">arXiv:2405.21015</a>, ' +
      'the most thorough public cost model of frontier training. Post-training and inference shares are our own build from vendor pricing and disclosed GPU-hours, ' +
      'and are less firm. Money figures scale a stated default budget and are illustrative of proportion, not of any particular project. ' +
      'Data: <a class="link" href="assets/data/cost-stack.csv" download>cost-stack.csv</a>.');

    var seg = body.querySelector('.cs-seg'), bwrap = body.querySelector('.cs-b'),
        bars = body.querySelector('.cs-bars'), out = body.querySelector('.cs-out');

    seg.innerHTML = STAGES.map(function (s, i) {
      return '<button type="button" data-s="' + s + '"' + (i === 0 ? ' class="on"' : '') + '>' + s + '</button>';
    }).join('');

    function render() {
      Array.prototype.forEach.call(seg.querySelectorAll('button'), function (b) {
        var on = b.getAttribute('data-s') === stage;
        b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      var rows = STACK[stage];
      bwrap.innerHTML = '<label class="ctl"><span class="meta">Total programme budget <b>' + D.money(budget) + '</b></span>' +
        '<input type="range" class="cs-r" min="0" max="100" value="' +
        Math.round(Math.log10(budget / 1e5) / Math.log10(5e4) * 100) + '"></label>';

      bars.innerHTML = rows.map(function (r) {
        var controlled = r.lev > 0;
        return '<button type="button" class="cs-row' + (sel === r.c ? ' on' : '') + '" data-c="' + D.esc(r.c) + '">' +
          '<span class="cs-lbl">' + D.esc(r.c) + '</span>' +
          '<span class="cs-track"><span class="cs-fill ' + (controlled ? 'ctl' : 'dom') + '" style="width:' + r.s + '%"></span></span>' +
          '<span class="cs-pct">' + r.s + '%</span>' +
          '<span class="cs-money">' + D.money(budget * r.s / 100) + '</span></button>';
      }).join('') +
        '<div class="cs-key"><span><i class="ctl"></i>Someone else can restrict this</span><span><i class="dom"></i>Nobody can</span></div>';

      var d = rows.filter(function (r) { return r.c === sel; })[0];
      var dom = domesticShare(stage);
      out.innerHTML = d
        ? '<b>' + D.esc(d.c) + '</b> \u2014 ' + d.note + ' <span class="meta">Control leverage ' + d.lev.toFixed(2) +
          ', substitutability ' + d.sub.toFixed(2) + '.</span>'
        : '<b>' + dom + '% of the ' + stage.toLowerCase() + ' bill</b> is spent on things no export control can touch: people, electricity, buildings, data. ' +
          (stage === 'Post-training'
            ? 'That is the highest of any stage, and it is why post-training is a labour market rather than a hardware market.'
            : stage === 'Pretraining'
              ? 'That is the lowest of any stage. Two-thirds of a pretraining budget buys things that need somebody else\u2019s permission.'
              : 'Facilities and power are a bigger line here than most people expect, and both are built locally.') +
          ' Tap any row for detail.';

      Array.prototype.forEach.call(bars.querySelectorAll('.cs-row'), function (b) {
        b.addEventListener('click', function () { sel = (sel === b.getAttribute('data-c')) ? null : b.getAttribute('data-c'); render(); });
      });
      bwrap.querySelector('.cs-r').addEventListener('input', function () {
        budget = 1e5 * Math.pow(5e4, this.value / 100); render();
      });
    }

    Array.prototype.forEach.call(seg.querySelectorAll('button'), function (b) {
      b.addEventListener('click', function () { stage = b.getAttribute('data-s'); budget = BUDGET[stage]; sel = null; render(); });
    });
    render();
  });

  /* =========================================================================
     2. EXPOSURE — the cost-weighted exposure index
     ========================================================================= */

  D.widget('exposure', function (node) {
    var wLev = 1, wSub = 1;

    var body = D.shell(node, 'How much of each stage somebody else controls', 'Change the assumptions',
      '<div class="lab-controls ex-ctl"></div><div class="ex-out"></div><div class="lab-out ex-say"></div>',
      'Method. For each cost line: <b>share of stage budget &times; control leverage &times; (1 &minus; substitutability)</b>, summed across the stage. ' +
      'Control leverage is 0 where no instrument exists and 1 where an instrument exists and has been used. Substitutability is how far a cheaper or ' +
      'unrestricted alternative does the same job. Both scales are ours and are set out in the method page. ' +
      'The index ranks stages against each other. It is not a probability of anything.');

    var ctl = body.querySelector('.ex-ctl'), out = body.querySelector('.ex-out'), say = body.querySelector('.ex-say');
    ctl.innerHTML =
      '<label class="ctl"><span class="meta">How much control leverage matters <b class="ex-a">100</b>%</span>' +
        '<input type="range" class="ex-wa" min="0" max="200" value="100"></label>' +
      '<label class="ctl"><span class="meta">Credit for having alternatives <b class="ex-b">100</b>%</span>' +
        '<input type="range" class="ex-wb" min="0" max="100" value="100"></label>';

    function render() {
      ctl.querySelector('.ex-a').textContent = Math.round(wLev * 100);
      ctl.querySelector('.ex-b').textContent = Math.round(wSub * 100);
      var vals = STAGES.map(function (s) { return { s: s, v: exposure(s, wLev, wSub) }; });
      var mx = Math.max.apply(null, vals.map(function (r) { return r.v; }));

      out.innerHTML = vals.map(function (r) {
        return '<div class="ex-row"><span class="ex-lbl">' + r.s + '</span>' +
          '<span class="ex-track"><span class="ex-fill' + (r.v === mx ? ' hot' : '') + '" style="width:' + Math.min(100, r.v) + '%"></span></span>' +
          '<span class="ex-num">' + r.v.toFixed(0) + '</span>' +
          '<span class="meta ex-n">' + domesticShare(r.s) + '% untouchable</span></div>';
      }).join('');

      var pre = vals[0].v, post = vals[1].v, inf = vals[2].v;
      say.innerHTML = 'Pretraining <b>' + pre.toFixed(0) + '</b>, inference <b>' + inf.toFixed(0) +
        '</b>, post-training <b>' + post.toFixed(0) + '</b>. Post-training comes out ' +
        (pre / post).toFixed(1) + ' times less exposed than pretraining. ' +
        'Drag either slider to an extreme and the ordering holds, because it is driven by where the money sits rather than by the weights. ' +
        'Two-thirds of a pretraining budget buys restricted hardware. Four-fifths of a post-training budget buys people, and nobody licenses people.';
    }

    ctl.querySelector('.ex-wa').addEventListener('input', function () { wLev = +this.value / 100; render(); });
    ctl.querySelector('.ex-wb').addEventListener('input', function () { wSub = +this.value / 100; render(); });
    render();
  });

  /* =========================================================================
     3. INDIAFIT — capability against where the money is
     ========================================================================= */

  D.widget('indiafit', function (node) {
    var stage = 'Post-training', sel = null;

    var body = D.shell(node, 'India\u2019s position, weighted by where the money is', 'Pick a stage',
      '<div class="seg if-seg"></div><div class="if-grid"></div><div class="lab-out if-out"></div>',
      'Capability scores are 1 to 5 and are our judgement, with the evidence for each in the data file. ' +
      'The weighted score multiplies each capability by that line\u2019s share of the stage budget, so being strong at something ' +
      'that costs almost nothing does not flatter the total. ' +
      'Data: <a class="link" href="assets/data/india-fit.csv" download>india-fit.csv</a>.');

    var seg = body.querySelector('.if-seg'), grid = body.querySelector('.if-grid'), out = body.querySelector('.if-out');
    seg.innerHTML = STAGES.map(function (s) {
      return '<button type="button" data-s="' + s + '"' + (s === stage ? ' class="on"' : '') + '>' + s + '</button>';
    }).join('');

    function render() {
      Array.prototype.forEach.call(seg.querySelectorAll('button'), function (b) {
        var on = b.getAttribute('data-s') === stage;
        b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      var rows = STACK[stage];
      var weighted = rows.reduce(function (a, r) { return a + (r.s / 100) * INDIA[stage][r.c]; }, 0);
      var plain = rows.reduce(function (a, r) { return a + INDIA[stage][r.c]; }, 0) / rows.length;

      grid.innerHTML = '<div class="if-head"><span>Cost line</span><span>Share of bill</span><span>India, 1-5</span></div>' +
        rows.map(function (r) {
          var cap = INDIA[stage][r.c];
          return '<button type="button" class="if-row' + (sel === r.c ? ' on' : '') + '" data-c="' + D.esc(r.c) + '">' +
            '<span class="if-c">' + D.esc(r.c) + '</span>' +
            '<span class="if-s"><span class="if-track"><span class="if-fill" style="width:' + r.s + '%"></span></span>' + r.s + '%</span>' +
            '<span class="if-cap">' + [1, 2, 3, 4, 5].map(function (i) {
              return '<i class="' + (i <= cap ? 'on' : '') + (cap <= 2 ? ' bad' : cap >= 4 ? ' good' : '') + '"></i>'; }).join('') +
            '</span></button>';
        }).join('');

      var d = rows.filter(function (r) { return r.c === sel; })[0];
      out.innerHTML = d
        ? '<b>' + D.esc(d.c) + '</b> \u2014 ' + (INDIA_WHY[d.c] || '') + ' <span class="meta">Worth ' + d.s + '% of the ' + stage.toLowerCase() + ' bill.</span>'
        : '<b>Weighted score ' + weighted.toFixed(1) + ' of 5</b>, against an unweighted average of ' + plain.toFixed(1) + '. ' +
          (stage === 'Post-training'
            ? 'India scores 5 on the two lines that carry 65% of the bill, and 1 on the one that carries 25%. That single gap is the whole story of this page.'
            : stage === 'Pretraining'
              ? 'The weighted score is dragged down by the two lines India cannot supply, which between them are 44% of the bill.'
              : 'Respectable across the board, with the facility line the weak point: the halls exist but were not built for this rack density.') +
          ' Tap any row.';

      Array.prototype.forEach.call(grid.querySelectorAll('.if-row'), function (b) {
        b.addEventListener('click', function () { sel = (sel === b.getAttribute('data-c')) ? null : b.getAttribute('data-c'); render(); });
      });
    }

    Array.prototype.forEach.call(seg.querySelectorAll('button'), function (b) {
      b.addEventListener('click', function () { stage = b.getAttribute('data-s'); sel = null; render(); });
    });
    render();
  });

  /* =========================================================================
     4. CONTROLS — what each instrument actually reaches
     ========================================================================= */

  var CTRL = [
    { n: 'Chip export controls', j: 'United States, 2022 onward', hits: { 'Pretraining': 33, 'Post-training': 20, 'Inference': 50 },
      e: 'India is not embargoed and licences are available. What it buys is queue position and price, not denial.' },
    { n: 'AI Diffusion Framework', j: 'Issued Jan 2025, withdrawn May 2025', hits: { 'Pretraining': 33, 'Post-training': 20, 'Inference': 50 },
      e: 'India was placed in the middle tier before withdrawal. Nothing about India changed in between. The drafting still exists.' },
    { n: 'Memory (HBM) controls', j: 'United States, Dec 2024', hits: { 'Pretraining': 33, 'Post-training': 0, 'Inference': 50 },
      e: 'No restriction on India, but it tightens the scarcest input inside the chip, which raises price everywhere.' },
    { n: 'Equipment controls', j: 'US, Netherlands, Japan, 2023 onward', hits: { 'Pretraining': 0, 'Post-training': 0, 'Inference': 0 },
      e: 'Sits upstream of the whole board. India\u2019s 28nm plans are below the thresholds, so this is a ceiling on ambition rather than a wall.' },
    { n: 'Section 232 tariffs', j: 'United States, Jan 2026', hits: { 'Pretraining': 33, 'Post-training': 20, 'Inference': 50 },
      e: 'Raises the landed cost of anything routed through the United States. Argues for buying direct from Asian assembly.' },
    { n: 'Chip Security Act', j: 'Passed committee Mar 2026, not law', hits: { 'Pretraining': 33, 'Post-training': 20, 'Inference': 50 },
      e: 'Would embed location attestation in the chips. Turns a one-time export decision into a standing operational dependency.' },
    { n: 'Design software controls', j: 'United States, 2022 onward', hits: { 'Pretraining': 0, 'Post-training': 0, 'Inference': 0 },
      e: 'Upstream again. Cloud-delivered and licence-metered, so an action bites within one billing cycle with no shipment stopped.' }
  ];

  D.widget('controls', function (node) {
    var i = 0;
    var body = D.shell(node, 'What each instrument can actually reach', 'Tap an instrument',
      '<div class="ct-list"></div><div class="ct-vis"></div><div class="lab-out ct-out"></div>',
      'Percentages are the share of each stage\u2019s budget that the instrument touches, taken from the cost stack. ' +
      'Instruments marked as sitting upstream affect the industry that makes the chips rather than any line in these three budgets. ' +
      'Data: <a class="link" href="assets/data/controls.csv" download>controls.csv</a>.');

    var list = body.querySelector('.ct-list'), vis = body.querySelector('.ct-vis'), out = body.querySelector('.ct-out');

    function render() {
      list.innerHTML = CTRL.map(function (c, j) {
        return '<button type="button" class="ct-b' + (j === i ? ' on' : '') + '" data-i="' + j + '">' +
          '<b>' + D.esc(c.n) + '</b><span class="meta">' + D.esc(c.j) + '</span></button>';
      }).join('');
      var c = CTRL[i];
      vis.innerHTML = STAGES.map(function (s) {
        var v = c.hits[s];
        return '<div class="ct-row"><span class="ct-s">' + s + '</span>' +
          '<span class="ct-track"><span class="ct-fill" style="width:' + v + '%"></span></span>' +
          '<span class="ct-n">' + (v === 0 ? 'upstream' : v + '% of the bill') + '</span></div>';
      }).join('');
      out.innerHTML = c.e;
      Array.prototype.forEach.call(list.querySelectorAll('.ct-b'), function (b) {
        b.addEventListener('click', function () { i = +b.getAttribute('data-i'); render(); });
      });
    }
    render();
  });

  /* =========================================================================
     5. SCENARIO — four dials
     ========================================================================= */

  D.widget('scenario', function (node) {
    var v = { ctrl: 2, dom: 2, data: 2, halls: 2 };
    var DIALS = [
      ['ctrl', 'Chip access', ['Eases', 'As today', 'Slower licences', 'Country ceilings return', 'Hard restriction']],
      ['dom', 'GPU build-out', ['Stalls', 'Current trend', '100,000 target met', 'Target plus anchor cluster', 'Plus domestic packaging']],
      ['data', 'Data and environments', ['Nothing built', 'Scattered projects', 'One funded consortium', 'National corpus', 'Exported to others']],
      ['halls', 'High-density halls', ['None built', 'A few', 'Policy changed', 'Retrofits under way', 'At scale']]
    ];

    var body = D.shell(node, 'Four dials, one strategic picture', 'Try a scenario',
      '<div class="lab-controls sc-grid"></div><div class="sc-out"></div><div class="lab-out sc-say"></div>',
      'A reasoning aid, not a forecast, and it contains no probabilities. Every multiplier is printed with the result so it can be argued with. ' +
      'Baselines: 38,000 accelerators, 1,600 MW of national colocation load, no published Indian reinforcement environments.');

    var ctl = body.querySelector('.sc-grid'), out = body.querySelector('.sc-out'), say = body.querySelector('.sc-say');
    ctl.innerHTML = DIALS.map(function (d) {
      return '<label class="ctl"><span class="meta">' + d[1] + ': <b class="sc-l-' + d[0] + '">' + d[2][2] + '</b></span>' +
        '<input type="range" class="sc-s" data-k="' + d[0] + '" min="0" max="4" value="2"></label>';
    }).join('');

    function render() {
      DIALS.forEach(function (d) { ctl.querySelector('.sc-l-' + d[0]).textContent = d[2][v[d[0]]]; });

      var domM = [0.9, 1.0, 2.63, 2.63, 2.63][v.dom];
      var ctrlM = [1.15, 1.0, 0.85, 0.6, 0.35][v.ctrl];
      var fleet = Math.round(38000 * domM * ctrlM);
      var hallFrac = [0.20, 0.35, 0.50, 0.75, 1.0][v.halls];
      var usable = Math.round(fleet * hallFrac);
      var users = usable * 312 * 86400 / 5000 / 1e6;
      var rlRuns = usable * 24 / 147000;
      var dataScore = [0, 1, 2.5, 4, 5][v.data];

      out.innerHTML = '<div class="gapless cols-4 sc-k">' +
        '<div><span class="meta">Accelerators by 2028</span><div class="kpi kpi-gold">' + fleet.toLocaleString('en-US') + '</div></div>' +
        '<div><span class="meta">Actually housable</span><div class="kpi kpi-gold">' + usable.toLocaleString('en-US') + '</div></div>' +
        '<div><span class="meta">Post-training runs a day</span><div class="kpi kpi-gold">' + rlRuns.toFixed(1) + '</div></div>' +
        '<div><span class="meta">Users served daily</span><div class="kpi kpi-gold">' + users.toFixed(0) + 'm</div></div></div>';

      var verdict;
      if (v.data <= 1 && v.dom >= 2) verdict = '<b>The expensive mistake.</b> Hardware bought, and nothing distinctive to run on it. On the cost stack, this is spending heavily on the 20% line while ignoring the 70% line.';
      else if (v.ctrl >= 3 && v.dom <= 1) verdict = '<b>The exposed case.</b> Restriction arrives while the build is still on trend. Note that post-training capacity barely moves, because four-fifths of that budget was never importable.';
      else if (v.data >= 3 && v.halls >= 2) verdict = '<b>The interesting case.</b> Modest hardware, serious data and environments. This is the configuration where India sells something the frontier labs cannot buy elsewhere.';
      else if (v.ctrl >= 3 && v.data >= 3) verdict = '<b>Restriction bites a smaller surface.</b> With data and environments in hand, a licensing squeeze slows India rather than stopping it. That is what hedging buys.';
      else verdict = 'Middle of the road. Push one dial to an extreme and watch which output moves. The build dial moves the headline; the data dial moves the verdict.';

      say.innerHTML = verdict + '<br><br><span class="meta">Arithmetic: 38,000 &times; ' + domM + ' (build) &times; ' + ctrlM +
        ' (access) = ' + fleet.toLocaleString('en-US') + ', of which ' + (hallFrac * 100).toFixed(0) +
        '% can be housed at the required rack density. Serving at 312 output tokens per second per accelerator and 5,000 tokens per user per day. ' +
        'Data and environment readiness scores ' + dataScore + ' of 5 and deliberately does not enter the hardware arithmetic, because it cannot be bought with accelerators.</span>';
    }

    Array.prototype.forEach.call(ctl.querySelectorAll('.sc-s'), function (s) {
      s.addEventListener('input', function () { v[s.getAttribute('data-k')] = +s.value; render(); });
    });
    render();
  });

  /* ---------- boot -------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', function () {
    Array.prototype.forEach.call(document.querySelectorAll('[data-widget]'), function (n) {
      var f = D.reg[n.getAttribute('data-widget')];
      if (f) try { f(n); } catch (e) { console.error('widget failed', n.getAttribute('data-widget'), e); }
    });
  });
})(window.D);
