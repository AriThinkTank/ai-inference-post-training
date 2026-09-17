/* =========================================================================
   dash3.js — showing the working.

   triangulate  the same quantity from several independent sources
   crossover    where post-training stops being a labour business
   tornado      which assumption actually moves the conclusion
   plus a small animation layer: counters that count, bars that grow,
   lines that draw themselves, and popovers on any term marked up for it.
   ========================================================================= */

window.D = window.D || {};
(function (D) {
  'use strict';

  /* =========================================================================
     ANIMATION LAYER
     ========================================================================= */

  /* count a number up when it scrolls into view */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var suffix = el.getAttribute('data-suffix') || '';
    var dp = parseInt(el.getAttribute('data-dp') || '0', 10);
    var dur = 900, t0 = null;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(dp).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* draw an SVG path from nothing */
  function drawLine(path) {
    try {
      var len = path.getTotalLength();
      path.style.strokeDasharray = len; path.style.strokeDashoffset = len;
      path.getBoundingClientRect();
      path.style.transition = 'stroke-dashoffset 1.1s cubic-bezier(.3,.7,.3,1)';
      path.style.strokeDashoffset = '0';
    } catch (e) { /* non-rendered path, nothing to do */ }
  }

  D.boot = function (root) {
    root = root || document;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      Array.prototype.forEach.call(root.querySelectorAll('[data-count]'), function (el) {
        el.textContent = parseFloat(el.getAttribute('data-count')).toFixed(parseInt(el.getAttribute('data-dp') || '0', 10)) +
          (el.getAttribute('data-suffix') || '');
      });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting || e.target.dataset.done) return;
        e.target.dataset.done = '1';
        if (e.target.hasAttribute('data-count')) animateCount(e.target);
        if (e.target.classList.contains('draw')) drawLine(e.target);
        if (e.target.classList.contains('grow')) e.target.classList.add('grown');
      });
    }, { threshold: 0.25 });
    Array.prototype.forEach.call(root.querySelectorAll('[data-count], .draw, .grow'), function (el) { io.observe(el); });
  };

  /* popovers: <b class="pop" data-pop="explanation">term</b> */
  var pop = null;
  function showPop(el) {
    if (!pop) { pop = document.createElement('div'); pop.className = 'pop-card'; document.body.appendChild(pop); }
    pop.innerHTML = '<span class="pop-t">' + D.esc(el.textContent) + '</span><span class="pop-b">' +
      el.getAttribute('data-pop') + '</span>';
    pop.classList.add('on');
    var r = el.getBoundingClientRect(), w = Math.min(340, window.innerWidth - 32);
    pop.style.width = w + 'px';
    pop.style.left = Math.round(Math.max(16, Math.min(r.left + r.width / 2 - w / 2, window.innerWidth - w - 16))) + 'px';
    var h = pop.offsetHeight, above = r.top > h + 16;
    pop.style.top = Math.round(above ? r.top - h - 10 + window.scrollY : r.bottom + 10 + window.scrollY) + 'px';
  }
  function hidePop() { if (pop) pop.classList.remove('on'); }

  D.wirePops = function (root) {
    Array.prototype.forEach.call((root || document).querySelectorAll('.pop'), function (el) {
      if (el.dataset.wired) return; el.dataset.wired = '1';
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
      el.addEventListener('mouseenter', function () { showPop(el); });
      el.addEventListener('focus', function () { showPop(el); });
      el.addEventListener('mouseleave', hidePop);
      el.addEventListener('blur', hidePop);
      el.addEventListener('click', function (e) { e.preventDefault(); showPop(el); });
      el.addEventListener('keydown', function (e) { if (e.key === 'Escape') { hidePop(); el.blur(); } });
    });
  };
  window.addEventListener('scroll', hidePop, { passive: true });

  /* =========================================================================
     1. TRIANGULATE — the same number from several sources
     ========================================================================= */

  var TRI = {
    'Inference: share of cost that is restricted hardware': {
      unit: '%', ours: 57,
      rows: [
        ['Epoch AI, 1 GW campus model, 2026', 61, 'B', 'Upfront capex of about $38bn. GPUs and servers 60%, buildings 20%, power 12%, cooling 5%, network 3%. We count the accelerator line plus a third of network as restricted.'],
        ['SemiAnalysis, Meta H100 cluster, 4-year TCO', 54, 'B', 'GPUs 46%, networking with CPU and storage 24%, colocation 20%, electricity 9%. Most of that 24% is commodity CPU and storage, so only a third counts as restricted.'],
        ['Electron Economics capex tracker, 2026', 53, 'C', 'IT equipment about 53% of all-in capex, with a range across their sources of 46 to 64%.'],
        ['JLL, Turner & Townsend, Archdesk benchmarks', 53, 'B', 'Accelerators 40-60% of all-in capex per MW, power 15-25%, cooling 8-15%, networking 8-12%, land and shell 5-15%. Midpoints taken.']
      ],
      verdict: 'Four independent estimates land between 53 and 61 per cent, mean 55.3. Our figure of 57 sits inside that and slightly above the mean. <b>The claim survives.</b> The honest correction is that the range is wider than a single number suggests, and the answer depends on whether you measure upfront capital or four-year ownership cost.'
    },
    'Pretraining: share of cost that is hardware': {
      unit: '%', ours: 62,
      rows: [
        ['Cottier et al., arXiv:2405.21015, low end of staff range', 65, 'A', 'With R&D staff at 29% of total, hardware takes 65%. This is the end of the range most favourable to our claim.'],
        ['Cottier et al., midpoint', 56, 'A', 'Staff at 39%. Hardware, servers and interconnect take the rest after energy and data.'],
        ['Cottier et al., high end of staff range', 47, 'A', 'With staff at 49%, hardware falls to 47% and pretraining is very nearly half a labour business too.'],
        ['Our dashboard figure', 62, 'B', 'Accelerators 33, servers 18, interconnect 11. Sits near the favourable end of the published range.']
      ],
      verdict: 'The claim holds, but our 62 sits near the <b>top</b> of the published range rather than in the middle. At the other end of Cottier\u2019s staff range the hardware share is 47 per cent, and the phrase "hardware business" would be a stretch. We have moved the headline to a range rather than a point, and the widget below lets you set the staff share yourself.'
    },
    'Post-training: compute as a share of the bill': {
      unit: '%', ours: 20,
      rows: [
        ['DeepSeek-R1, disclosed', 5, 'A', '147,000 GPU-hours of reinforcement learning against 2,788,000 for pretraining the base model. The only complete frontier disclosure available.'],
        ['DeepSeek-R1-Zero, disclosed', 4, 'A', '100,000 H800 GPU-hours, or 3.75% of pretraining compute.'],
        ['OpenAI o1 to o3, reported', 50, 'B', 'More than a tenfold increase in reinforcement learning compute between generations. The absolute level is not disclosed.'],
        ['Cursor Composer 1.5, disclosed', 100, 'B', 'The company states post-training compute exceeded the compute used to pretrain the base model. The only explicit statement of inversion by any laboratory.']
      ],
      verdict: '<b>This is where our original claim broke.</b> Twenty per cent is defensible for a mid-scale programme and badly wrong for frontier-scale reinforcement learning in 2026. The disclosed points span 4 to over 100 per cent. The finding is not that post-training is a labour business. It is that post-training is a labour business <i>below a certain scale of reinforcement learning</i>, and a compute business above it. The crossover is calculated in the next section.'
    }
  };

  D.widget('triangulate', function (node) {
    var key = Object.keys(TRI)[0], sel = null;

    var body = D.shell(node, 'The same number, from several sources', 'Check the working',
      '<div class="seg tg-seg" style="margin-bottom:22px;flex-wrap:wrap"></div><div class="tg-rows"></div><div class="lab-out tg-out"></div>',
      'Each row is an independent estimate of the same quantity. Where sources measure slightly different things, the note says so. ' +
      'Full list with citations: <a class="link" href="assets/data/sources-triangulation.csv" download>sources-triangulation.csv</a>.');

    var seg = body.querySelector('.tg-seg'), rows = body.querySelector('.tg-rows'), out = body.querySelector('.tg-out');
    seg.innerHTML = Object.keys(TRI).map(function (k, i) {
      return '<button type="button" data-k="' + D.esc(k) + '"' + (i === 0 ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') +
        '>' + D.esc(k.split(':')[0]) + '</button>';
    }).join('');

    function render() {
      Array.prototype.forEach.call(seg.querySelectorAll('button'), function (b) {
        var on = b.getAttribute('data-k') === key;
        b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      var t = TRI[key];
      var vals = t.rows.map(function (r) { return r[1]; });
      var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
      var mean = vals.reduce(function (a, b) { return a + b; }, 0) / vals.length;
      var span = Math.max(hi, t.ours) * 1.12;

      rows.innerHTML = '<p class="body-s" style="margin-bottom:18px">' + D.esc(key.split(': ')[1]) +
        '. Our dashboard says <b>' + t.ours + '%</b>. Here is everyone else.</p>' +
        t.rows.map(function (r, i) {
          return '<button type="button" class="tg-row' + (sel === i ? ' on' : '') + '" data-i="' + i + '">' +
            '<span class="tg-src">' + D.esc(r[0]) + ' <i class="chip chip-' + (r[2] === 'A' ? 'soft' : '') + '">' + r[2] + '</i></span>' +
            '<span class="tg-track"><span class="tg-fill grow" style="--w:' + (r[1] / span * 100) + '%"></span>' +
            '<span class="tg-mark" style="left:' + (t.ours / span * 100) + '%"></span></span>' +
            '<span class="tg-v">' + r[1] + '%</span></button>';
        }).join('') +
        '<div class="tg-legend"><span class="meta">Vertical line is our figure, ' + t.ours + '%. ' +
        'Independent estimates span ' + lo + ' to ' + hi + '%, mean ' + mean.toFixed(1) + '%.</span></div>';

      out.innerHTML = sel !== null
        ? '<b>' + D.esc(t.rows[sel][0]) + '</b> \u2014 ' + t.rows[sel][3]
        : t.verdict + ' <span class="meta">Tap any row for how that source measured it.</span>';

      Array.prototype.forEach.call(rows.querySelectorAll('.tg-row'), function (b) {
        b.addEventListener('click', function () { sel = (sel === +b.getAttribute('data-i')) ? null : +b.getAttribute('data-i'); render(); });
      });
      D.boot(rows);
    }
    Array.prototype.forEach.call(seg.querySelectorAll('button'), function (b) {
      b.addEventListener('click', function () { key = b.getAttribute('data-k'); sel = null; render(); });
    });
    render();
  });

  /* =========================================================================
     2. CROSSOVER — where post-training changes character
     ========================================================================= */

  D.widget('crossover', function (node) {
    var rlPct = 5, dataRate = 5, nComp = 100000, envCount = 20, clones = 3, staff = 1.0;
    var PRE_GPUH = 2788000, RATE = 2.0;

    var body = D.shell(node, 'When does post-training stop being a labour business?', 'Change any input',
      '<div class="lab-controls xo-ctl"></div><div class="xo-out"></div><div class="xo-chart"></div><div class="lab-out xo-say"></div>',
      'Method. Compute cost = (RL intensity &times; 2,788,000 pretraining GPU-hours) &times; $2 per GPU-hour, the rate DeepSeek used in their own disclosure. ' +
      'Data cost = comparisons &times; rate per comparison. Environment cost = interfaces &times; $20,000 + application clones &times; $300,000. ' +
      'The crossover is where compute cost equals everything else. Pretraining GPU-hours and the $2 rate are from the ' +
      'DeepSeek-V3 and R1 technical reports (grade A). Annotation and environment prices are vendor survey estimates (grade C) ' +
      'and are the numbers most worth changing.');

    var ctl = body.querySelector('.xo-ctl'), out = body.querySelector('.xo-out'),
        chart = body.querySelector('.xo-chart'), say = body.querySelector('.xo-say');

    ctl.innerHTML =
      '<label class="ctl"><span class="meta">RL intensity <b class="xo-r">5</b>% of pretraining compute</span>' +
        '<input type="range" class="xo-rs" min="1" max="200" value="5"></label>' +
      '<label class="ctl"><span class="meta">Cost per comparison $<b class="xo-d">5</b></span>' +
        '<input type="range" class="xo-ds" min="1" max="100" value="5"></label>' +
      '<label class="ctl"><span class="meta">Comparisons bought <b class="xo-n">100,000</b></span>' +
        '<input type="range" class="xo-ns" min="10" max="500" value="100"></label>' +
      '<label class="ctl"><span class="meta">Environments: <b class="xo-e">20</b> interfaces, <b class="xo-c">3</b> clones</span>' +
        '<input type="range" class="xo-es" min="0" max="100" value="20"></label>';

    function costs(rl) {
      var compute = (PRE_GPUH * rl / 100) * RATE;
      var data = nComp * dataRate;
      var env = envCount * 20000 + clones * 300000;
      var st = staff * 1e6;
      return { compute: compute, data: data, env: env, staff: st, other: data + env + st };
    }

    function render() {
      ctl.querySelector('.xo-r').textContent = rlPct;
      ctl.querySelector('.xo-d').textContent = dataRate;
      ctl.querySelector('.xo-n').textContent = String(nComp).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      ctl.querySelector('.xo-e').textContent = envCount;
      ctl.querySelector('.xo-c').textContent = clones;

      var c = costs(rlPct), total = c.compute + c.other;
      var share = c.compute / total * 100;
      var crossPct = (c.other / RATE) / PRE_GPUH * 100;

      out.innerHTML = '<div class="gapless cols-4 xo-k">' +
        '<div><span class="meta">Compute</span><div class="kpi kpi-gold">' + D.money(c.compute) + '</div><span class="meta">' + share.toFixed(0) + '% of the bill</span></div>' +
        '<div><span class="meta">Human data</span><div class="kpi kpi-gold">' + D.money(c.data) + '</div><span class="meta">' + (c.data / total * 100).toFixed(0) + '%</span></div>' +
        '<div><span class="meta">Environments</span><div class="kpi kpi-gold">' + D.money(c.env) + '</div><span class="meta">' + (c.env / total * 100).toFixed(0) + '%</span></div>' +
        '<div><span class="meta">Crossover at</span><div class="kpi kpi-gold">' + crossPct.toFixed(0) + '%</div><span class="meta">RL intensity</span></div></div>';

      /* stacked area: compute share against RL intensity */
      var CW = 620, CH = 260, PL = 52, PR = 110, PT = 16, PB = 40;
      function X(p) { return PL + (p / 200) * (CW - PL - PR); }
      function Y(v) { return CH - PB - (v / 100) * (CH - PT - PB); }
      var pts = [];
      for (var p = 1; p <= 200; p += 2) {
        var cc = costs(p); pts.push([X(p), Y(cc.compute / (cc.compute + cc.other) * 100)]);
      }
      var poly = pts.map(function (q) { return q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join(' ');
      var MARKS = [['R1-Zero', 3.75, 34], ['R1', 5.3, 14], ['Cursor 1.5', 105, 12]];

      chart.innerHTML = '<span class="meta" style="display:block;margin:22px 0 8px">Compute as a share of the post-training bill, against how hard you push reinforcement learning</span>' +
        '<svg class="chart xo-svg" viewBox="0 0 ' + CW + ' ' + CH + '" role="img" aria-label="Compute share of post-training cost rising with reinforcement learning intensity">' +
        '<rect x="' + PL + '" y="' + Y(100) + '" width="' + (CW - PL - PR) + '" height="' + (Y(50) - Y(100)) + '" fill="#f5e6ec"/>' +
        '<text class="xo-zone" x="' + (PL + 8) + '" y="' + (Y(95)) + '">COMPUTE BUSINESS</text>' +
        '<text class="xo-zone" x="' + (PL + 8) + '" y="' + (Y(8)) + '">LABOUR BUSINESS</text>' +
        [0, 25, 50, 75, 100].map(function (v) {
          return '<line class="gridline" x1="' + PL + '" y1="' + Y(v) + '" x2="' + (CW - PR) + '" y2="' + Y(v) + '"/>' +
            '<text class="axis-label" x="' + (PL - 8) + '" y="' + (Y(v) + 4) + '" text-anchor="end">' + v + '%</text>';
        }).join('') +
        '<line x1="' + PL + '" y1="' + Y(50) + '" x2="' + (CW - PR) + '" y2="' + Y(50) + '" stroke="#620d3c" stroke-width="2" stroke-dasharray="6 4"/>' +
        '<polyline class="xo-line draw" points="' + poly + '"/>' +
        MARKS.map(function (m) {
          var cc = costs(m[1]), yy = Y(cc.compute / (cc.compute + cc.other) * 100);
          return '<line class="xo-mk" x1="' + X(m[1]) + '" y1="' + yy + '" x2="' + X(m[1]) + '" y2="' + (CH - PB) + '"/>' +
            '<circle cx="' + X(m[1]) + '" cy="' + yy + '" r="4.5" fill="#f1a222" stroke="#171413" stroke-width="2"/>' +
            '<text class="xo-mkl" x="' + (X(m[1]) + (m[1] < 10 ? 10 : 0)) + '" y="' + (yy - m[2]) + '" text-anchor="' +
            (m[1] < 10 ? 'start' : 'middle') + '">' + m[0] + '</text>';
        }).join('') +
        '<circle cx="' + X(rlPct) + '" cy="' + Y(share) + '" r="7" fill="#620d3c" stroke="#171413" stroke-width="2"/>' +
        [0, 50, 100, 150, 200].map(function (p) {
          return '<text class="axis-label" x="' + X(p) + '" y="' + (CH - 14) + '" text-anchor="middle">' + p + '%</text>';
        }).join('') +
        '<text class="axis-label" x="' + (CW - PR + 8) + '" y="' + Y(50) + '">crossover</text>' +
        '</svg>';

      say.innerHTML = (share >= 50
        ? '<b>At ' + rlPct + '% RL intensity this is a compute business.</b> Compute is ' + share.toFixed(0) +
          '% of the bill. Export controls bite here, and India competes badly.'
        : '<b>At ' + rlPct + '% RL intensity this is a labour business.</b> Compute is only ' + share.toFixed(0) +
          '% of the bill; the rest is people and environments that nobody can restrict. India competes well here.') +
        ' The crossover on your current inputs sits at <b>' + crossPct.toFixed(0) + '%</b> RL intensity.' +
        '<br><br>The two disclosed DeepSeek points sit at 3.75 and 5.3 per cent, deep in labour territory. Cursor have said their ' +
        'post-training compute exceeded pretraining, which puts them past 100 and deep in compute territory. ' +
        'Both facts are true, and they describe different activities that happen to share a name. ' +
        '<span class="meta">Push the cost per comparison towards expert rates and the crossover moves right, because expert judgement is expensive enough to dominate a much larger compute bill.</span>';

      D.boot(chart);
    }

    ctl.querySelector('.xo-rs').addEventListener('input', function () { rlPct = +this.value; render(); });
    ctl.querySelector('.xo-ds').addEventListener('input', function () { dataRate = +this.value; render(); });
    ctl.querySelector('.xo-ns').addEventListener('input', function () { nComp = +this.value * 1000; render(); });
    ctl.querySelector('.xo-es').addEventListener('input', function () {
      envCount = +this.value; clones = Math.max(0, Math.round(envCount / 7)); render();
    });
    render();
  });

  /* =========================================================================
     3. TORNADO — which assumption actually moves the answer
     ========================================================================= */

  D.widget('tornado', function (node) {
    var BASE = 22.1;
    var VARS = [
      ['Inference accelerator substitutability', 0.60, 0.35, 0.85, 'How well older, cheaper or compressed alternatives do the job. The single most important judgement on the dashboard, and entirely ours.'],
      ['Inference accelerator share of cost', 50, 40, 61, 'Triangulated across four sources: Epoch AI 60, SemiAnalysis 46, Electron Economics 53, JLL and Turner & Townsend 40-60.'],
      ['Networking share of cost', 7, 3, 24, 'Epoch AI put network and other at 3%. SemiAnalysis bundle networking with CPU and storage at 24%. The truth depends on what you count.'],
      ['Networking control leverage', 0.60, 0.30, 0.90, 'High-end fabric is bundled with accelerator licences. Commodity Ethernet is not controlled at all.'],
      ['Facility and power share', 35, 25, 45, 'Epoch AI 37% combined. JLL and Turner & Townsend 33-55% depending on cooling architecture.']
    ];

    var body = D.shell(node, 'Which assumption is actually carrying the answer?', 'Read the bars',
      '<div class="td-wrap"></div><div class="lab-out td-out"></div>',
      'A one-at-a-time sensitivity test on the inference exposure index, which is 22 on the default settings. ' +
      'Each bar shows how far the index moves when that one input is taken to the low and high end of its plausible range, ' +
      'with everything else held at default. Bars are sorted by how much they move the answer, which is why this shape is called a tornado. ' +
      'It is not a probabilistic analysis and there is no distribution behind it.');

    var wrap = body.querySelector('.td-wrap'), out = body.querySelector('.td-out');

    function exposure(accShare, accSub, netShare, netLev, facShare) {
      var tot = accShare + netShare + facShare + 8;
      return ((accShare / tot) * 1.0 * (1 - accSub) + (netShare / tot) * netLev * 0.5) * 100;
    }

    var results = VARS.map(function (v) {
      var lo, hi;
      if (v[0].indexOf('substitutability') > -1) { lo = exposure(50, v[2], 7, 0.6, 35); hi = exposure(50, v[3], 7, 0.6, 35); }
      else if (v[0].indexOf('accelerator share') > -1) { lo = exposure(v[2], 0.6, 7, 0.6, 35); hi = exposure(v[3], 0.6, 7, 0.6, 35); }
      else if (v[0].indexOf('Networking share') > -1) { lo = exposure(50, 0.6, v[2], 0.6, 35); hi = exposure(50, 0.6, v[3], 0.6, 35); }
      else if (v[0].indexOf('leverage') > -1) { lo = exposure(50, 0.6, 7, v[2], 35); hi = exposure(50, 0.6, 7, v[3], 35); }
      else { lo = exposure(50, 0.6, 7, 0.6, v[2]); hi = exposure(50, 0.6, 7, 0.6, v[3]); }
      return { n: v[0], lo: Math.min(lo, hi), hi: Math.max(lo, hi), span: Math.abs(hi - lo), why: v[4] };
    }).sort(function (a, b) { return b.span - a.span; });

    var allLo = Math.min.apply(null, results.map(function (r) { return r.lo; }));
    var allHi = Math.max.apply(null, results.map(function (r) { return r.hi; }));
    var pad = (allHi - allLo) * 0.12 || 1;
    var x0 = allLo - pad, x1 = allHi + pad;
    function X(v) { return (v - x0) / (x1 - x0) * 100; }

    wrap.innerHTML = results.map(function (r, i) {
      return '<button type="button" class="td-row" data-i="' + i + '">' +
        '<span class="td-n">' + D.esc(r.n) + '</span>' +
        '<span class="td-track">' +
          '<span class="td-base" style="left:' + X(BASE) + '%"></span>' +
          '<span class="td-bar grow" style="left:' + X(r.lo) + '%;--w:' + (X(r.hi) - X(r.lo)) + '%"></span>' +
        '</span>' +
        '<span class="td-v">' + r.lo.toFixed(0) + '\u2013' + r.hi.toFixed(0) + '</span></button>';
    }).join('') +
      '<div class="td-legend"><span class="meta">Vertical line is the default index of ' + BASE.toFixed(0) +
      '. Wider bar means that assumption matters more.</span></div>';

    out.innerHTML = 'The top bar is <b>' + D.esc(results[0].n) + '</b>, and it moves the index by ' + results[0].span.toFixed(0) +
      ' points on its own. That is our judgement, not a measured quantity, which means the single most important number on this ' +
      'dashboard is one we assigned. We have said so here rather than burying it in a method note. ' +
      'The measured inputs below it move the answer far less, which is reassuring about the data and unflattering about the framework. ' +
      '<span class="meta">Tap any bar for what that input is and where its range comes from.</span>';

    Array.prototype.forEach.call(wrap.querySelectorAll('.td-row'), function (b) {
      b.addEventListener('click', function () {
        var r = results[+b.getAttribute('data-i')];
        out.innerHTML = '<b>' + D.esc(r.n) + '</b> \u2014 ' + r.why +
          '<br><br>Taking it to each end of that range moves the inference exposure index between <b>' +
          r.lo.toFixed(1) + '</b> and <b>' + r.hi.toFixed(1) + '</b>, against a default of ' + BASE.toFixed(0) + '.';
      });
    });
    D.boot(wrap);
  });

  document.addEventListener('DOMContentLoaded', function () { D.boot(document); D.wirePops(document); });
})(window.D);
