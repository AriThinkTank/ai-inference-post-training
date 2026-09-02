/* =========================================================================
   widgets-india.js — the quantitative pieces for chapter 06.

   Every number here traces to /assets/data/*.csv. Where a figure is our own
   calculation the widget says so and shows the arithmetic.

   chokepoints   concentration vs control leverage, the 2x2 that matters
   hhi           build your own HHI and see what it means
   fleetcalc     what India's GPU fleet can actually do
   exposure      stage exposure index, with user-set weights
   controlmap    which instrument bites at which stage
   scenario      four dials, one strategic picture
   racks         the density problem nobody costs
   ========================================================================= */

window.T = window.T || {};
(function (T) {
  'use strict';

  /* ---------------------------------------------------------------------
     DATA — mirrors assets/data/chokepoints.csv exactly.
     hhi is a LOWER BOUND: residual share is modelled as maximally
     fragmented, so it contributes nothing. lev is control leverage, 1-5.
     --------------------------------------------------------------------- */

  var CP = [
    { c: 'EUV lithography', l: 'HW', pre: 1, post: 0, inf: 0, hhi: 10000, top1: 100, lev: 5, f: 'ASML 100', g: 'A',
      why: 'One firm on Earth. Dutch licensing since 2019, and US components give Washington a say too.' },
    { c: 'Leading-edge foundry', l: 'HW', pre: 1, post: 1, inf: 1, hhi: 8168, top1: 90, lev: 4, f: 'TSMC 90, Samsung 8, Intel 2', g: 'B',
      why: 'Every advanced accelerator in the world is made in one of about three places, and mostly in one.' },
    { c: 'Merchant AI accelerators', l: 'HW', pre: 1, post: 1, inf: 1, hhi: 7793, top1: 88, lev: 5, f: 'NVIDIA 88, AMD 7', g: 'A',
      why: 'The sharpest instrument in the toolkit. One licence decision changes what a country can build.' },
    { c: 'Verifiable-reward environments', l: 'SW', pre: 0, post: 1, inf: 0, hhi: 6400, top1: 80, lev: 3, g: 'D', f: 'Frontier labs in house 80',
      why: 'Never exported because never sold. You cannot licence what nobody ships. The quietest chokepoint here.' },
    { c: 'High-end networking', l: 'HW', pre: 1, post: 1, inf: 0, hhi: 5300, top1: 70, lev: 3, f: 'NVIDIA 70, Broadcom 20', g: 'C',
      why: 'Matters enormously for training, barely at all for serving. Bundled with the accelerator licence.' },
    { c: 'Advanced packaging', l: 'HW', pre: 1, post: 1, inf: 1, hhi: 5000, top1: 70, lev: 3, f: 'TSMC 70, Samsung 10', g: 'C',
      why: 'No control instrument points at it. It does not need one: the queue is three years long.' },
    { c: 'HBM memory', l: 'HW', pre: 1, post: 1, inf: 1, hhi: 4246, top1: 58, lev: 4, f: 'SK hynix 58, Samsung 21, Micron 21', g: 'A',
      why: 'Three firms, sold out through 2026, and on the control list since December 2024.' },
    { c: 'CUDA and the driver stack', l: 'SW', pre: 1, post: 1, inf: 1, hhi: 8136, top1: 90, lev: 4, f: 'CUDA 90, ROCm 6', g: 'B',
      why: 'Concentration plus proprietary licensing. You cannot fork it. This is the software chokepoint that is real.' },
    { c: 'Deep learning frameworks', l: 'SW', pre: 1, post: 1, inf: 1, hhi: 4113, top1: 63, lev: 1, f: 'PyTorch 63, JAX 12', g: 'B',
      why: 'Just as concentrated as CUDA, and almost harmless. Permissive licence, forkable, foundation-governed.' },
    { c: 'Commodity DRAM', l: 'HW', pre: 1, post: 1, inf: 1, hhi: 2769, top1: 38, lev: 2, f: 'Samsung 38, SK 29, Micron 22', g: 'A',
      why: 'Concentrated, cyclical, expensive right now, but only the fastest grades are controlled.' },
    { c: 'Inference serving engines', l: 'SW', pre: 0, post: 0, inf: 1, hhi: 2650, top1: 45, lev: 1, f: 'vLLM 45, SGLang 20, TRT-LLM 15', g: 'C',
      why: 'Two of the top three are open source. Forking one is a weekend, not a national programme.' },
    { c: 'Open model weights', l: 'SW', pre: 0, post: 1, inf: 1, hhi: 2125, top1: 35, lev: 2, f: 'Llama 35, Qwen 30', g: 'C',
      why: 'Licences bind future releases. Weights already on your disk cannot be recalled by anyone.' },
    { c: 'EDA tool chains', l: 'SW', pre: 1, post: 0, inf: 0, hhi: 2093, top1: 32, lev: 5, g: 'B', f: 'Synopsys 32, Cadence 30, Siemens 13',
      why: 'The interesting one. Only moderately concentrated, but cloud-metered and revocable inside a billing cycle. Low HHI, maximum leverage.' },
    { c: 'Server assembly and ODM', l: 'HW', pre: 1, post: 1, inf: 1, hhi: 1444, top1: 30, lev: 1, f: 'Foxconn 30, Quanta 20, Wistron 12', g: 'C',
      why: 'The least concentrated hardware layer, and the one India has actually got good at.' },
    { c: 'NAND and storage', l: 'HW', pre: 1, post: 1, inf: 1, hhi: 1530, top1: 33, lev: 1, f: 'Samsung 33, SK 21', g: 'C',
      why: 'Effectively uncontrolled. Nobody is going to stop you buying disks.' },
    { c: 'Optical transceivers', l: 'HW', pre: 1, post: 1, inf: 1, hhi: 1437, top1: 26, lev: 1, f: 'Innolight 26, Coherent 20, Eoptolink 19', g: 'C',
      why: 'Uncontrolled, but China-heavy. A different kind of exposure, and one that runs the other way.' },
    { c: 'Power and cooling plant', l: 'HW', pre: 1, post: 1, inf: 1, hhi: 1025, top1: 25, lev: 1, f: 'Vertiv 25, Schneider 20', g: 'C',
      why: 'Competitive, uncontrolled, and still the thing most likely to delay an Indian AI data centre by a year.' }
  ];

  var STAGE_KEY = { pre: 'pre', post: 'post', inf: 'inf' };

  /* =========================================================================
     1. CHOKEPOINTS — the 2x2 that reframes the argument
     ========================================================================= */

  T.widget('chokepoints', function (node) {
    var stage = 'pre', sel = null;

    var body = T.shell(node, 'Concentration is not the same as control', 'Explore the map',
      '<div class="seg ck-seg" style="margin-bottom:20px"></div><div class="ck-wrap"></div><div class="lab-out ck-out"></div>',
      'HHI is the Herfindahl-Hirschman Index: the sum of squared market shares, 0 to 10,000. ' +
      'US Department of Justice merger guidelines treat above 2,500 as highly concentrated. ' +
      'Every value here is a <b>lower bound</b>: unnamed residual share is modelled as maximally fragmented, so it adds nothing. ' +
      'Control leverage is our own 1-5 scale, defined in the methodology section below. ' +
      'Full data: <a class="link" href="assets/data/chokepoints.csv" download>chokepoints.csv</a>.');

    var seg = body.querySelector('.ck-seg'), wrap = body.querySelector('.ck-wrap'), out = body.querySelector('.ck-out');
    seg.innerHTML = '<button type="button" data-s="pre" class="on">Pretraining</button>' +
      '<button type="button" data-s="post">Post-training</button>' +
      '<button type="button" data-s="inf">Inference</button>';

    function draw() {
      Array.prototype.forEach.call(seg.querySelectorAll('button'), function (b) {
        b.classList.toggle('on', b.getAttribute('data-s') === stage);
      });
      var live = CP.filter(function (d) { return d[STAGE_KEY[stage]] === 1; });

      var W = 640, H = 420, PL = 62, PR = 16, PT = 16, PB = 52;
      function x(h) { return PL + (h / 10000) * (W - PL - PR); }
      function y(l) { return H - PB - ((l - 1) / 4) * (H - PT - PB); }

      /* place the dots, then push apart any that would sit on top of each other.
         Without this, foundry (8168) and CUDA (8136) render as one blob. */
      var pts = live.map(function (d) { return { d: d, px: x(d.hhi), py: y(d.lev) }; });
      for (var pass = 0; pass < 60; pass++) {
        var moved = false;
        for (var a = 0; a < pts.length; a++) {
          for (var b2 = a + 1; b2 < pts.length; b2++) {
            var dx = pts[b2].px - pts[a].px, dy = pts[b2].py - pts[a].py;
            var dist = Math.sqrt(dx * dx + dy * dy) || 0.01, minD = 21;
            if (dist < minD) {
              var push = (minD - dist) / 2, ux = dx / dist, uy = dy / dist;
              pts[a].px -= ux * push; pts[a].py -= uy * push;
              pts[b2].px += ux * push; pts[b2].py += uy * push;
              moved = true;
            }
          }
        }
        if (!moved) break;
      }
      pts.forEach(function (p2) {
        p2.px = Math.max(PL + 12, Math.min(W - PR - 12, p2.px));
        p2.py = Math.max(PT + 12, Math.min(H - PB - 12, p2.py));
      });

      var dots = pts.map(function (p2) {
        var d = p2.d, on = sel === d.c;
        return '<g class="ck-dot' + (on ? ' on' : '') + '" data-c="' + T.esc(d.c) + '" tabindex="0" role="button" aria-label="' + T.esc(d.c) + '">' +
          '<circle cx="' + p2.px.toFixed(1) + '" cy="' + p2.py.toFixed(1) + '" r="' + (on ? 11 : 7.5) + '" ' +
          'fill="' + (d.l === 'HW' ? '#620d3c' : '#f1a222') + '" stroke="#171413" stroke-width="2"/>' +
          (on ? '<text class="ck-tag" x="' + (p2.px + 15).toFixed(1) + '" y="' + (p2.py + 4).toFixed(1) + '">' + T.esc(d.c) + '</text>' : '') +
          '</g>';
      }).join('');

      wrap.innerHTML =
        '<svg class="ck-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Scatter of supply concentration against control leverage">' +
          '<rect x="' + x(2500) + '" y="' + PT + '" width="' + (W - PR - x(2500)) + '" height="' + (y(3) - PT) + '" fill="#f5e6ec"/>' +
          '<line class="gridline" x1="' + x(2500) + '" y1="' + PT + '" x2="' + x(2500) + '" y2="' + (H - PB) + '"/>' +
          '<line class="gridline" x1="' + PL + '" y1="' + y(3) + '" x2="' + (W - PR) + '" y2="' + y(3) + '"/>' +
          '<line x1="' + PL + '" y1="' + (H - PB) + '" x2="' + (W - PR) + '" y2="' + (H - PB) + '" stroke="#171413" stroke-width="2"/>' +
          '<line x1="' + PL + '" y1="' + PT + '" x2="' + PL + '" y2="' + (H - PB) + '" stroke="#171413" stroke-width="2"/>' +
          dots +
          '<text class="axis-label" x="' + PL + '" y="' + (H - 28) + '">0</text>' +
          '<text class="axis-label" x="' + x(2500) + '" y="' + (H - 28) + '" text-anchor="middle">2,500</text>' +
          '<text class="axis-label" x="' + (W - PR) + '" y="' + (H - 28) + '" text-anchor="end">10,000</text>' +
          '<text class="axis-label" x="' + PL + '" y="' + (H - 10) + '">SUPPLY CONCENTRATION (HHI) \u2192</text>' +
          '<text class="axis-label" x="8" y="' + (y(5) + 4) + '">HIGH</text>' +
          '<text class="axis-label" x="8" y="' + (y(1) + 4) + '">LOW</text>' +
          '<text class="axis-label" transform="rotate(-90 16 ' + (PT + 150) + ')" x="16" y="' + (PT + 150) + '">CONTROL LEVERAGE \u2192</text>' +
          '<text class="ck-quad" x="' + (x(2500) + 12) + '" y="' + (PT + 20) + '">THE ONES THAT ACTUALLY BITE</text>' +
        '</svg>' +
        '<div class="ck-key"><span><i style="background:#620d3c"></i>Hardware</span><span><i style="background:#f1a222"></i>Software</span>' +
        '<span class="meta">' + live.length + ' inputs used at this stage</span></div>';

      Array.prototype.forEach.call(wrap.querySelectorAll('.ck-dot'), function (g) {
        function pick() { sel = g.getAttribute('data-c'); draw(); }
        g.addEventListener('click', pick);
        g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
      });

      var d = live.filter(function (o) { return o.c === sel; })[0];
      if (!d) {
        var hot = live.filter(function (o) { return o.hhi >= 2500 && o.lev >= 3; });
        out.innerHTML = '<b>Tap a dot.</b> Of the ' + live.length + ' inputs this stage needs, <b>' + hot.length +
          '</b> sit in the shaded corner: concentrated <i>and</i> controllable. Those are the ones worth losing sleep over. ' +
          'The rest are concentrated but harmless, or controllable but competitive.';
      } else {
        out.innerHTML = '<dl class="deflist">' +
          '<dt>' + T.esc(d.c) + '</dt><dd>' + d.why + '</dd>' +
          '<dt>Shares</dt><dd>' + T.esc(d.f) + ' (per cent). HHI ' + d.hhi.toLocaleString('en-IN') +
            ', which is ' + (d.hhi >= 2500 ? 'highly concentrated' : d.hhi >= 1500 ? 'moderately concentrated' : 'unconcentrated') +
            ' on the DOJ scale.</dd>' +
          '<dt>Control leverage</dt><dd>' + d.lev + ' of 5. Source grade ' + d.g + '.</dd></dl>';
      }
    }

    Array.prototype.forEach.call(seg.querySelectorAll('button'), function (b) {
      b.addEventListener('click', function () { stage = b.getAttribute('data-s'); sel = null; draw(); });
    });
    draw();
  });

  /* =========================================================================
     2. HHI — build your own
     ========================================================================= */

  T.widget('hhi', function (node) {
    var shares = [58, 21, 21, 0];

    var body = T.shell(node, 'Build a concentration index', 'Move the shares',
      '<div class="hh-ctl"></div><div class="hh-vis"></div><div class="lab-out hh-out"></div>',
      'HHI = the sum of each firm\u2019s squared percentage share. A pure monopoly scores 10,000. ' +
      'Ten equal firms score 1,000. The US Department of Justice and Federal Trade Commission 2023 merger guidelines ' +
      'treat 1,800 and above as highly concentrated for merger review; the older 2,500 threshold is still widely quoted ' +
      'and is the one used elsewhere on this page.');

    var ctl = body.querySelector('.hh-ctl'), vis = body.querySelector('.hh-vis'), out = body.querySelector('.hh-out');

    var PRESETS = [
      ['HBM memory', [58, 21, 21, 0]],
      ['AI accelerators', [88, 7, 5, 0]],
      ['EDA tools', [32, 30, 13, 25]],
      ['Server ODM', [30, 20, 12, 38]]
    ];

    ctl.innerHTML = '<div class="seg hh-pre" style="margin-bottom:18px">' +
      PRESETS.map(function (p, i) { return '<button type="button" data-i="' + i + '"' + (i === 0 ? ' class="on"' : '') + '>' + p[0] + '</button>'; }).join('') +
      '</div><div class="lab-controls">' +
      [0, 1, 2].map(function (i) {
        return '<label class="ctl"><span class="meta">Firm ' + (i + 1) + ': <b class="hh-v' + i + '">0</b>%</span>' +
          '<input type="range" class="hh-s" data-i="' + i + '" min="0" max="100" value="0"></label>';
      }).join('') + '</div>';

    function render() {
      var named = shares.slice(0, 3);
      var resid = Math.max(0, 100 - named.reduce(function (a, b) { return a + b; }, 0));
      shares[3] = resid;
      var hhi = named.reduce(function (a, s) { return a + s * s; }, 0);

      [0, 1, 2].forEach(function (i) {
        ctl.querySelector('.hh-v' + i).textContent = named[i];
        ctl.querySelector('.hh-s[data-i="' + i + '"]').value = named[i];
      });

      var band = hhi >= 2500 ? ['Highly concentrated', 'neg'] : hhi >= 1500 ? ['Moderately concentrated', 'gold'] : ['Unconcentrated', 'pos'];
      vis.innerHTML =
        '<div class="hh-bar">' +
          named.map(function (s, i) { return s > 0 ? '<span class="hh-seg s' + i + '" style="width:' + s + '%">' + (s >= 8 ? s + '%' : '') + '</span>' : ''; }).join('') +
          (resid > 0 ? '<span class="hh-seg r" style="width:' + resid + '%">' + (resid >= 8 ? 'rest ' + resid + '%' : '') + '</span>' : '') +
        '</div>' +
        '<div class="hh-num"><span class="kpi kpi-gold">' + hhi.toLocaleString('en-IN') + '</span>' +
        '<span class="chip chip-' + band[1] + '">' + band[0] + '</span></div>';

      out.innerHTML = 'Working: ' + named.filter(function (s) { return s > 0; }).map(function (s) { return s + '&sup2;'; }).join(' + ') +
        ' = <b>' + hhi.toLocaleString('en-IN') + '</b>. The remaining ' + resid + '% is treated as many tiny firms, which adds almost nothing. ' +
        'That is why every figure on this page is a floor, not an estimate. ' +
        (hhi >= 5000 ? '<br><br>Above 5,000 you are describing a market where one firm can set terms unilaterally.'
         : hhi >= 2500 ? '<br><br>Above 2,500 a coordinated action by two firms can move the market.'
         : '<br><br>Below 2,500 there is usually a second source worth qualifying.');
    }

    Array.prototype.forEach.call(ctl.querySelectorAll('.hh-s'), function (s) {
      s.addEventListener('input', function () {
        var i = +s.getAttribute('data-i'), v = +s.value;
        var others = shares.slice(0, 3).filter(function (_, j) { return j !== i; }).reduce(function (a, b) { return a + b; }, 0);
        shares[i] = Math.min(v, 100 - others);
        render();
      });
    });
    Array.prototype.forEach.call(ctl.querySelectorAll('.hh-pre button'), function (b) {
      b.addEventListener('click', function () {
        Array.prototype.forEach.call(ctl.querySelectorAll('.hh-pre button'), function (o) { o.classList.remove('on'); });
        b.classList.add('on');
        shares = PRESETS[+b.getAttribute('data-i')][1].slice();
        render();
      });
    });
    render();
  });

  /* =========================================================================
     3. FLEETCALC — what India's GPUs can actually do
     ========================================================================= */

  T.widget('fleetcalc', function (node) {
    var gpus = 38000, mfu = 40, share = 100, mode = 'post';

    var body = T.shell(node, 'What India\u2019s GPU fleet can actually do', 'Run the numbers',
      '<div class="fc-ctl"></div><div class="seg fc-seg" style="margin:20px 0"></div><div class="fc-out"></div><div class="lab-out fc-say"></div>',
      'Assumptions, all changeable above: H100-class accelerator at 989.5 TFLOP/s dense BF16 (NVIDIA datasheet); ' +
      'model FLOP utilisation as set; serving throughput of 312 output tokens per second per GPU for a 70-billion-parameter ' +
      'model under continuous batching. Fleet size from MeitY / IndiaAI, December 2025. ' +
      'DeepSeek GPU-hours are as disclosed in the V3 and R1 technical reports. ' +
      'Data: <a class="link" href="assets/data/india-compute.csv" download>india-compute.csv</a>.');

    var ctl = body.querySelector('.fc-ctl'), seg = body.querySelector('.fc-seg'),
        out = body.querySelector('.fc-out'), say = body.querySelector('.fc-say');

    ctl.innerHTML = '<div class="lab-controls">' +
      '<label class="ctl"><span class="meta">Fleet size <b class="fc-g">38,000</b> GPUs</span>' +
        '<input type="range" class="fc-gs" min="5000" max="200000" step="1000" value="38000"></label>' +
      '<label class="ctl"><span class="meta">Utilisation <b class="fc-m">40</b>% MFU</span>' +
        '<input type="range" class="fc-ms" min="10" max="60" value="40"></label>' +
      '<label class="ctl"><span class="meta">Share you can actually get <b class="fc-s">100</b>%</span>' +
        '<input type="range" class="fc-ss" min="1" max="100" value="100"></label>' +
      '</div>';

    seg.innerHTML = '<button type="button" data-m="pre">Pretrain something</button>' +
      '<button type="button" data-m="post" class="on">Post-train something</button>' +
      '<button type="button" data-m="serve">Serve the country</button>';

    var H100 = 989.5e12;

    function render() {
      ctl.querySelector('.fc-g').textContent = gpus.toLocaleString('en-IN');
      ctl.querySelector('.fc-m').textContent = mfu;
      ctl.querySelector('.fc-s').textContent = share;
      Array.prototype.forEach.call(seg.querySelectorAll('button'), function (b) {
        b.classList.toggle('on', b.getAttribute('data-m') === mode);
      });

      var eff = gpus * (share / 100);
      var flops = eff * H100 * (mfu / 100);
      var gpuh = eff * 24;
      var rows = [];

      if (mode === 'pre') {
        [['DeepSeek-V3 pretraining', 2788000, 'GPU-hours, disclosed'],
         ['GPT-4 class run, ~2\u00d710\u00b2\u2075 FLOP', 2e25 / (H100 * mfu / 100) / 3600, 'GPU-hours, derived'],
         ['2026 frontier run, ~10\u00b2\u2076 FLOP', 1e26 / (H100 * mfu / 100) / 3600, 'GPU-hours, derived']
        ].forEach(function (r) {
          var days = r[1] / gpuh;
          rows.push([r[0], days < 1 ? (days * 24).toFixed(1) + ' hours' : days.toFixed(1) + ' days', r[2]]);
        });
        say.innerHTML = 'This is the number that surprises people. India\u2019s entire national fleet, running flat out, ' +
          'reproduces DeepSeek-V3\u2019s pretraining in about <b>three days</b>. A 2026 frontier run takes about <b>two and a half months</b>. ' +
          'So the fleet is not small in absolute terms. It is small relative to what one lab dedicates to one job, ' +
          'and it is split across 14 providers with no disclosed contiguous cluster above a few thousand cards. ' +
          '<b>Fragmentation is the constraint, not the headline count.</b> Drag the share slider down to see what a realistic allocation looks like.';
      } else if (mode === 'post') {
        [['DeepSeek-R1 reinforcement learning', 147000, 'GPU-hours, disclosed'],
         ['A 70B instruction-tuning run', 12000, 'GPU-hours, typical published range'],
         ['One ablation at frontier scale', 50000, 'GPU-hours, stated range 10k-100k']
        ].forEach(function (r) {
          var days = r[1] / gpuh;
          rows.push([r[0], days < 1 ? (days * 24).toFixed(1) + ' hours' : days.toFixed(1) + ' days', r[2]]);
        });
        say.innerHTML = 'And here is the finding that should reorganise the argument. The whole reinforcement learning stage of ' +
          'DeepSeek-R1 \u2014 the run that made reasoning models famous \u2014 was 147,000 GPU-hours. ' +
          'That is <b>under four hours of India\u2019s national fleet</b>. ' +
          'On compute alone, India could run that class of work several times a week. ' +
          'What it lacks is not accelerators. It is the data, the reward environments and the people who have done it before. ' +
          'Compute is the input India has most of, and the one policy talks about most.';
      } else {
        var toks = eff * 312;
        rows.push(['Output tokens per second', Math.round(toks).toLocaleString('en-IN'), 'at 312 tok/s per GPU']);
        rows.push(['Output tokens per day', (toks * 86400).toExponential(2), 'derived']);
        [2000, 5000, 20000].forEach(function (u) {
          rows.push(['Daily users at ' + u.toLocaleString('en-IN') + ' tokens each',
            (toks * 86400 / u / 1e6).toFixed(1) + ' million', 'derived']);
        });
        say.innerHTML = 'At a moderate 5,000 output tokens per person per day, the existing fleet could serve roughly ' +
          '<b>200 million daily users</b> of a 70-billion-parameter assistant. India has around 900 million internet users. ' +
          'So one quarter of the country, on hardware already empanelled. ' +
          'Serving is where India\u2019s existing kit goes furthest, and it is the stage the policy conversation spends least time on.';
      }

      out.innerHTML = '<div class="table-wrap"><table><thead><tr><th>Workload</th><th>On this fleet</th><th>Basis</th></tr></thead><tbody>' +
        rows.map(function (r) { return '<tr><td>' + r[0] + '</td><td class="fc-n">' + r[1] + '</td><td class="meta" style="text-transform:none;letter-spacing:0">' + r[2] + '</td></tr>'; }).join('') +
        '</tbody></table></div>' +
        '<div class="fc-kpi"><span class="meta">Fleet GPU-hours available per day</span><span class="kpi kpi-gold">' +
        Math.round(gpuh).toLocaleString('en-IN') + '</span></div>';
    }

    ctl.querySelector('.fc-gs').addEventListener('input', function () { gpus = +this.value; render(); });
    ctl.querySelector('.fc-ms').addEventListener('input', function () { mfu = +this.value; render(); });
    ctl.querySelector('.fc-ss').addEventListener('input', function () { share = +this.value; render(); });
    Array.prototype.forEach.call(seg.querySelectorAll('button'), function (b) {
      b.addEventListener('click', function () { mode = b.getAttribute('data-m'); render(); });
    });
    render();
  });

  /* =========================================================================
     4. EXPOSURE — stage exposure index with user-set weights
     ========================================================================= */

  T.widget('exposure', function (node) {
    var wConc = 50, wLev = 50, subst = 50;

    var body = T.shell(node, 'Stage exposure index', 'Set your own weights',
      '<div class="ex-ctl"></div><div class="ex-out"></div><div class="lab-out ex-say"></div>',
      'Method. For each stage we take the inputs that stage actually uses, score each on normalised concentration ' +
      '(HHI/10,000) and normalised control leverage (leverage/5), combine them with the weights you set, and take the mean ' +
      'across inputs. The substitutability dial then discounts inputs that are open source or have a working second source. ' +
      'This is an index, not a measurement: it ranks stages against each other and should not be read as a probability of anything. ' +
      'Inputs and scores: <a class="link" href="assets/data/chokepoints.csv" download>chokepoints.csv</a>.');

    var ctl = body.querySelector('.ex-ctl'), out = body.querySelector('.ex-out'), say = body.querySelector('.ex-say');

    ctl.innerHTML = '<div class="lab-controls">' +
      '<label class="ctl"><span class="meta">Weight on concentration <b class="ex-a">50</b>%</span>' +
        '<input type="range" class="ex-wa" min="0" max="100" value="50"></label>' +
      '<label class="ctl"><span class="meta">Weight on control leverage <b class="ex-b">50</b>%</span>' +
        '<input type="range" class="ex-wb" min="0" max="100" value="50"></label>' +
      '<label class="ctl"><span class="meta">Credit for open or forkable inputs <b class="ex-c">50</b>%</span>' +
        '<input type="range" class="ex-wc" min="0" max="100" value="50"></label>' +
      '</div>';

    function score(stageKey) {
      var live = CP.filter(function (d) { return d[stageKey] === 1; });
      var a = wConc / (wConc + wLev || 1), b = wLev / (wConc + wLev || 1);
      var vals = live.map(function (d) {
        var s = a * (d.hhi / 10000) + b * ((d.lev - 1) / 4);
        if (d.lev <= 1) s *= (1 - subst / 100 * 0.6);   /* open / forkable discount */
        return s;
      });
      return { v: vals.reduce(function (x, y) { return x + y; }, 0) / vals.length, n: live.length, live: live };
    }

    function render() {
      ctl.querySelector('.ex-a').textContent = wConc;
      ctl.querySelector('.ex-b').textContent = wLev;
      ctl.querySelector('.ex-c').textContent = subst;

      var s = [['Pretraining', score('pre')], ['Post-training', score('post')], ['Inference', score('inf')]];
      var mx = Math.max.apply(null, s.map(function (r) { return r[1].v; }));

      out.innerHTML = s.map(function (r) {
        var pctv = (r[1].v * 100);
        return '<div class="ex-row"><span class="ex-lbl">' + r[0] + '</span>' +
          '<span class="ex-track"><span class="ex-fill' + (r[1].v === mx ? ' hot' : '') + '" style="width:' + (r[1].v / 1 * 100).toFixed(1) + '%"></span></span>' +
          '<span class="ex-num">' + pctv.toFixed(0) + '</span>' +
          '<span class="meta ex-n">' + r[1].n + ' inputs</span></div>';
      }).join('');

      var pre = s[0][1].v, post = s[1][1].v, inf = s[2][1].v;
      var gap = ((pre - inf) / pre * 100).toFixed(0);
      say.innerHTML = 'On these weights, inference sits <b>' + gap + '% below</b> pretraining on exposure. ' +
        'That ordering is stable across almost every weighting you can set, and it is the whole strategic point: ' +
        'the stage India is most able to control is also the stage that determines who can afford to use AI at scale. ' +
        'Push the open-source credit to zero and the gap narrows but does not close, because the hardware underneath ' +
        'inference is genuinely lighter than the hardware underneath training.';
    }

    ctl.querySelector('.ex-wa').addEventListener('input', function () { wConc = +this.value; render(); });
    ctl.querySelector('.ex-wb').addEventListener('input', function () { wLev = +this.value; render(); });
    ctl.querySelector('.ex-wc').addEventListener('input', function () { subst = +this.value; render(); });
    render();
  });

  /* =========================================================================
     5. RACKS — the density problem
     ========================================================================= */

  T.widget('racks', function (node) {
    var target = 100000, density = 10;

    var body = T.shell(node, 'The rack density problem', 'Change the target',
      '<div class="rk-ctl"></div><div class="rk-out"></div><div class="lab-out rk-say"></div>',
      'Arithmetic: 700 W per accelerator (H100 SXM datasheet), PUE 1.5, national colocation IT load 1,600 MW ' +
      '(JLL, June 2026). Rack counts assume 8 accelerators per legacy air-cooled rack and 72 per modern liquid-cooled rack ' +
      '(NVIDIA GB200 NVL72 specification). Hall counts assume 200 racks per hall. ' +
      'Data: <a class="link" href="assets/data/india-compute.csv" download>india-compute.csv</a>.');

    var ctl = body.querySelector('.rk-ctl'), out = body.querySelector('.rk-out'), say = body.querySelector('.rk-say');
    ctl.innerHTML = '<div class="lab-controls">' +
      '<label class="ctl"><span class="meta">GPUs to house <b class="rk-t">100,000</b></span>' +
        '<input type="range" class="rk-ts" min="10000" max="500000" step="10000" value="100000"></label>' +
      '<label class="ctl"><span class="meta">Hall design density <b class="rk-d">10</b> kW per rack</span>' +
        '<input type="range" class="rk-ds" min="5" max="130" value="10"></label></div>';

    function render() {
      ctl.querySelector('.rk-t').textContent = target.toLocaleString('en-IN');
      ctl.querySelector('.rk-d').textContent = density;

      var itMW = target * 0.7 / 1000, totMW = itMW * 1.5;
      var perRack = Math.max(1, Math.floor(density / 0.7));
      var racks = Math.ceil(target / perRack);
      var halls = Math.ceil(racks / 200);
      var shareNat = itMW / 1600 * 100;

      out.innerHTML = '<div class="gapless cols-4 rk-grid">' +
        '<div><span class="meta">IT load</span><div class="kpi kpi-gold">' + itMW.toFixed(0) + '</div><span class="meta">MW</span></div>' +
        '<div><span class="meta">With cooling</span><div class="kpi kpi-gold">' + totMW.toFixed(0) + '</div><span class="meta">MW at PUE 1.5</span></div>' +
        '<div><span class="meta">Share of national DC load</span><div class="kpi kpi-gold">' + shareNat.toFixed(1) + '</div><span class="meta">per cent</span></div>' +
        '<div><span class="meta">Racks needed</span><div class="kpi kpi-gold">' + racks.toLocaleString('en-IN') + '</div><span class="meta">~' + halls + ' halls</span></div>' +
        '</div>';

      say.innerHTML = density < 25
        ? 'At <b>' + density + ' kW a rack</b> you fit ' + perRack + ' accelerators per rack and need <b>' + racks.toLocaleString('en-IN') +
          '</b> racks, roughly ' + halls + ' full data halls. This is the thing nobody costs. India\u2019s 1,600 MW of colocation ' +
          'is real, but most of it was designed for 5 to 10 kW racks serving ordinary enterprise workloads. ' +
          'Power in megawatts was never the binding constraint. <b>Power per square metre is.</b>'
        : 'At <b>' + density + ' kW a rack</b> the same fleet fits into <b>' + racks.toLocaleString('en-IN') + '</b> racks, about ' + halls +
          ' halls. But racks above roughly 40 kW need direct liquid cooling, which means new build rather than retrofit, ' +
          'and a skills base India is only starting to develop. The megawatt number stays almost the same. ' +
          'The construction programme does not.';
    }

    ctl.querySelector('.rk-ts').addEventListener('input', function () { target = +this.value; render(); });
    ctl.querySelector('.rk-ds').addEventListener('input', function () { density = +this.value; render(); });
    render();
  });

  /* =========================================================================
     6. SCENARIO — four dials, one picture
     ========================================================================= */

  T.widget('scenario', function (node) {
    var ctrl = 2, hbm = 2, dom = 2, env = 2;

    var body = T.shell(node, 'Four dials, one strategic picture', 'Try a scenario',
      '<div class="sc-ctl"></div><div class="sc-out"></div><div class="lab-out sc-say"></div>',
      'This is a reasoning aid, not a forecast. Each dial moves a stated quantity by a stated amount, and the arithmetic ' +
      'is printed below the result so you can disagree with it. It has no probabilities in it and should not be given any. ' +
      'Baselines: 38,000 GPUs, 1,600 MW national DC IT load, HBM at three suppliers, environments at zero.');

    var ctl = body.querySelector('.sc-ctl'), out = body.querySelector('.sc-out'), say = body.querySelector('.sc-say');

    var DIALS = [
      ['ctrl', 'US licensing posture', ['Open, as today', 'Slower licences', 'Country ceilings return', 'India tiered down', 'Hard restriction']],
      ['hbm', 'HBM and packaging supply', ['Eases', 'As today', 'Tight through 2027', 'Allocation to US buyers first', 'Severe shortage']],
      ['dom', 'Domestic build-out', ['Stalls', 'On current trend', 'Target met: 100k GPUs', 'Plus high-density halls', 'Plus domestic packaging']],
      ['env', 'Environments and data', ['Nothing built', 'Scattered projects', 'One funded consortium', 'National environment corpus', 'Exported to others']]
    ];

    ctl.innerHTML = '<div class="lab-controls sc-grid">' + DIALS.map(function (d) {
      return '<label class="ctl"><span class="meta">' + d[1] + ': <b class="sc-l-' + d[0] + '">' + d[2][2] + '</b></span>' +
        '<input type="range" class="sc-s" data-k="' + d[0] + '" min="0" max="4" value="2"></label>';
    }).join('') + '</div>';

    function render() {
      var v = { ctrl: ctrl, hbm: hbm, dom: dom, env: env };
      DIALS.forEach(function (d) {
        ctl.querySelector('.sc-l-' + d[0]).textContent = d[2][v[d[0]]];
        ctl.querySelector('.sc-s[data-k="' + d[0] + '"]').value = v[d[0]];
      });

      /* stated arithmetic, printed for the reader */
      var base = 38000;
      var domMult = [0.9, 1.0, 2.63, 2.63, 2.63][dom];
      var ctrlMult = [1.15, 1.0, 0.85, 0.6, 0.35][ctrl];
      var hbmMult = [1.1, 1.0, 0.9, 0.75, 0.55][hbm];
      var fleet = Math.round(base * domMult * ctrlMult * hbmMult);

      var hallOK = dom >= 3 ? 1.0 : 0.35;   /* fraction of fleet that can actually be housed at density */
      var usable = Math.round(fleet * hallOK);

      var postCap = usable * 24 / 147000;   /* R1-scale RL runs per day */
      var users = usable * 312 * 86400 / 5000 / 1e6;
      var envScore = [0, 1, 2.5, 4, 5][env];

      out.innerHTML = '<div class="gapless cols-4 sc-grid2">' +
        '<div><span class="meta">Fleet in 2028</span><div class="kpi kpi-gold">' + fleet.toLocaleString('en-IN') + '</div><span class="meta">accelerators</span></div>' +
        '<div><span class="meta">Actually housable</span><div class="kpi kpi-gold">' + usable.toLocaleString('en-IN') + '</div><span class="meta">at hall density</span></div>' +
        '<div><span class="meta">R1-scale RL runs</span><div class="kpi kpi-gold">' + postCap.toFixed(1) + '</div><span class="meta">per day, whole fleet</span></div>' +
        '<div><span class="meta">Assistant users served</span><div class="kpi kpi-gold">' + users.toFixed(0) + '</div><span class="meta">million per day</span></div>' +
        '</div>';

      var verdict;
      if (env <= 1 && dom >= 3) {
        verdict = '<b>The expensive mistake.</b> You have bought the hardware and not built the thing that makes it useful. ' +
          'Compute without environments and evaluation data is a very costly way to run other people\u2019s models.';
      } else if (ctrl >= 3 && dom <= 1) {
        verdict = '<b>The exposed case.</b> Restriction arrives while the domestic build is still on trend. ' +
          'Note that serving capacity holds up far better than training capacity, which is the argument for weighting inference now.';
      } else if (env >= 3 && dom >= 2) {
        verdict = '<b>The interesting case.</b> Modest hardware, serious environments. This is the configuration where India ' +
          'exports something other than labour: maintained evaluation and reward environments for languages and domains nobody else covers.';
      } else if (ctrl >= 3 && env >= 3) {
        verdict = '<b>Restriction bites, but on a smaller surface.</b> With environments and open weights in hand, ' +
          'a licensing squeeze slows India down rather than stopping it. This is what hedging actually buys.';
      } else {
        verdict = 'Middle of the road. Worth pushing a dial to an extreme to see which one actually moves the outputs. ' +
          'Most people find the domestic build dial moves the headline and the environments dial moves the verdict.';
      }

      say.innerHTML = verdict + '<br><br><span class="meta">Arithmetic: 38,000 &times; ' + domMult + ' (build) &times; ' +
        ctrlMult + ' (licensing) &times; ' + hbmMult + ' (supply) = ' + fleet.toLocaleString('en-IN') + ' accelerators; ' +
        'multiplied by ' + hallOK + ' for halls able to take the density. Serving at 312 tokens per second per GPU, ' +
        '5,000 tokens per user per day. Environment readiness scored ' + envScore + ' of 5 and does not enter the hardware arithmetic, ' +
        'which is exactly the point.</span>';
    }

    Array.prototype.forEach.call(ctl.querySelectorAll('.sc-s'), function (s) {
      s.addEventListener('input', function () {
        var k = s.getAttribute('data-k'), val = +s.value;
        if (k === 'ctrl') ctrl = val; else if (k === 'hbm') hbm = val;
        else if (k === 'dom') dom = val; else env = val;
        render();
      });
    });
    render();
  });

})(window.T);
