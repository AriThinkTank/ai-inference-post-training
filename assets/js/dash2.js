/* =========================================================================
   dash2.js — the quantitative layer.

   mekko     all three stages at once: width = budget, height = cost share,
             and every share is editable
   denial    the denial half-life. How long an export control actually buys
   openw     open weights as chokepoint relief, line by line
   trends    four series over time, with fitted growth rates
   ========================================================================= */

window.D = window.D || {};
(function (D) {
  'use strict';

  /* ---------- constants, all sourced ------------------------------------ */
  var ALPHA = 3.0;   /* algorithmic efficiency multiplier per year. Ho et al. 2024 via Epoch AI;
                        Gundlach et al., arXiv:2511.23455, independently estimate ~3x per year. */
  var HWPP  = 1.3;   /* hardware price-performance improvement per year. Epoch AI. */

  /* =========================================================================
     1. MEKKO — the fix for the flat cost chart
     ========================================================================= */

  D.widget('mekko', function (node) {
    /* editable working copy */
    var W = {
      'Pretraining':   { budget: 350, rows: [['AI accelerators', 33, 1], ['R&D staff', 30, 0], ['Server components', 18, 1], ['Cluster interconnect', 11, 1], ['Energy', 4, 0], ['Data acquisition', 4, 1]] },
      'Post-training': { budget: 8,   rows: [['Human and expert data', 45, 0], ['Reinforcement environments', 25, 0], ['Compute', 20, 1], ['Research staff', 10, 0]] },
      'Inference':     { budget: 120, rows: [['AI accelerators', 50, 1], ['Energy', 18, 0], ['Data centre facility', 17, 0], ['Networking and storage', 7, 1], ['Engineering staff', 8, 0]] }
    };
    var ORDER = ['Pretraining', 'Post-training', 'Inference'];
    var editing = false, scale = 'width';

    var body = D.shell(node, 'All three bills, side by side', 'Edit any number',
      '<div class="row mk-top" style="margin-bottom:18px"></div><div class="mk-wrap"></div>' +
      '<div class="mk-edit"></div><div class="lab-out mk-out"></div>',
      'Column width is the total budget, so the areas are comparable across stages as well as within them. ' +
      'That is a Marimekko chart, and it is the right shape here because both the size of the bill and its composition matter. ' +
      'Pretraining shares from Cottier et al., <a class="link" href="https://arxiv.org/abs/2405.21015" target="_blank" rel="noopener">arXiv:2405.21015</a>; ' +
      'the other two are our own build. Every number is editable, and the chart recomputes. ' +
      'Data: <a class="link" href="assets/data/cost-stack.csv" download>cost-stack.csv</a>.');

    var top = body.querySelector('.mk-top'), wrap = body.querySelector('.mk-wrap'),
        ed = body.querySelector('.mk-edit'), out = body.querySelector('.mk-out');

    top.innerHTML = '<span class="seg mk-sc">' +
        '<button type="button" data-v="width" class="on" aria-pressed="true">True scale</button>' +
        '<button type="button" data-v="equal" aria-pressed="false">Equal width</button></span>' +
      '<button class="btn btn-s btn-ghost mk-ed" type="button">Edit the numbers</button>' +
      '<button class="btn btn-s btn-ghost mk-rs" type="button">Reset</button>';

    function draw() {
      var total = ORDER.reduce(function (a, s) { return a + W[s].budget; }, 0);
      var CW = 900, CH = 420, GAP = 10, PT = 34, PB = 44;
      var x = 0, cols = [];
      ORDER.forEach(function (s, i) {
        var w = scale === 'width'
          ? (W[s].budget / total) * (CW - GAP * (ORDER.length - 1))
          : (CW - GAP * (ORDER.length - 1)) / ORDER.length;
        cols.push({ s: s, x: x, w: w }); x += w + GAP;
      });

      var svg = '<svg class="mk-svg" viewBox="0 0 ' + CW + ' ' + (CH + PT + PB) + '" role="img" ' +
        'aria-label="Marimekko chart: column width is total budget, segment height is share of that budget">';

      cols.forEach(function (c) {
        var rows = W[c.s].rows, sum = rows.reduce(function (a, r) { return a + r[1]; }, 0) || 1;
        var y = PT;
        svg += '<text class="mk-h" x="' + (c.x + c.w / 2) + '" y="' + (PT - 16) + '" text-anchor="middle">' + D.esc(c.s) + '</text>';
        svg += '<text class="mk-b" x="' + (c.x + c.w / 2) + '" y="' + (PT - 2) + '" text-anchor="middle">$' + W[c.s].budget + 'm</text>';
        rows.forEach(function (r) {
          var h = (r[1] / sum) * CH;
          svg += '<rect class="mk-seg ' + (r[2] ? 'ctl' : 'dom') + '" x="' + c.x + '" y="' + y + '" width="' + c.w + '" height="' + Math.max(0, h - 1.5) + '"/>';
          if (h > 24 && c.w > 90) {
            var t = r[2] ? '' : ' dark';
            svg += '<text class="mk-l' + t + '" x="' + (c.x + 9) + '" y="' + (y + 17) + '">' + D.esc(r[0]) + '</text>';
            svg += '<text class="mk-p' + t + '" x="' + (c.x + 9) + '" y="' + (y + 32) + '">' + Math.round(r[1] / sum * 100) + '% &middot; $' +
              (W[c.s].budget * r[1] / sum).toFixed(1) + 'm</text>';
          } else if (h > 13) {
            svg += '<text class="mk-p' + (r[2] ? '' : ' dark') + '" x="' + (c.x + 9) + '" y="' + (y + 12) + '">' + Math.round(r[1] / sum * 100) + '%</text>';
          }
          y += h;
        });
        var dom = rows.reduce(function (a, r) { return a + (r[2] ? 0 : r[1]); }, 0) / sum * 100;
        svg += '<text class="mk-f" x="' + (c.x + c.w / 2) + '" y="' + (PT + CH + 22) + '" text-anchor="middle">' +
          Math.round(100 - dom) + '% reached by a control, ' + Math.round(dom) + '% not</text>';
        svg += '<text class="mk-f2" x="' + (c.x + c.w / 2) + '" y="' + (PT + CH + 38) + '" text-anchor="middle">exposure ' +
          D.exposureFromRows(rows, c.s).toFixed(0) + '</text>';
      });
      svg += '</svg>';

      wrap.innerHTML = svg +
        '<div class="cs-key" style="margin-top:14px"><span><i class="ctl"></i>Someone else can restrict this</span>' +
        '<span><i class="dom"></i>Nobody can</span>' +
        '<span class="meta">' + (scale === 'width' ? 'Widths are to scale: post-training is genuinely that small' : 'Widths equalised so shapes are easier to compare') + '</span></div>';

      ed.innerHTML = !editing ? '' :
        '<div class="mk-edwrap">' + ORDER.map(function (s) {
          return '<div class="mk-edcol"><h4 class="h-card">' + D.esc(s) + '</h4>' +
            '<label class="mk-f1"><span class="meta">Total budget, $m</span>' +
            '<input type="number" class="mk-bud" data-s="' + s + '" value="' + W[s].budget + '" min="0.1" step="0.1"></label>' +
            W[s].rows.map(function (r, i) {
              return '<label class="mk-f1"><span class="meta">' + D.esc(r[0]) + '</span>' +
                '<input type="number" class="mk-share" data-s="' + s + '" data-i="' + i + '" value="' + r[1] + '" min="0" max="100" step="1"></label>';
            }).join('') + '</div>';
        }).join('') + '</div>' +
        '<p class="meta" style="margin-top:12px">Shares are renormalised, so they need not sum to 100. Put your own figures in and the exposure index at the foot of each column recomputes.</p>';

      var pre = D.exposureFromRows(W['Pretraining'].rows, 'Pretraining'),
          post = D.exposureFromRows(W['Post-training'].rows, 'Post-training');
      out.innerHTML = 'Pretraining costs about <b>' + (W['Pretraining'].budget / W['Post-training'].budget).toFixed(0) +
        ' times</b> what post-training costs, and buys almost the opposite mix. ' +
        'The tall wine block at the top of the first column is the accelerator line. There is no equivalent block in the second column, ' +
        'which is why the exposure index comes out at ' + post.toFixed(0) + ' against ' + pre.toFixed(0) + '. ' +
        'Switch to equal width to compare the shapes without the size difference shouting over them.';

      Array.prototype.forEach.call(ed.querySelectorAll('.mk-share'), function (inp) {
        inp.addEventListener('input', function () {
          W[inp.getAttribute('data-s')].rows[+inp.getAttribute('data-i')][1] = Math.max(0, +inp.value || 0);
          var f = document.activeElement === inp; draw(); if (f) refocus(inp);
        });
      });
      Array.prototype.forEach.call(ed.querySelectorAll('.mk-bud'), function (inp) {
        inp.addEventListener('input', function () {
          W[inp.getAttribute('data-s')].budget = Math.max(0.1, +inp.value || 0.1);
          var f = document.activeElement === inp; draw(); if (f) refocus(inp);
        });
      });
    }

    function refocus(old) {
      var sel = old.classList.contains('mk-bud')
        ? '.mk-bud[data-s="' + old.getAttribute('data-s') + '"]'
        : '.mk-share[data-s="' + old.getAttribute('data-s') + '"][data-i="' + old.getAttribute('data-i') + '"]';
      var n = ed.querySelector(sel); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); }
    }

    top.querySelector('.mk-ed').addEventListener('click', function () {
      editing = !editing; this.textContent = editing ? 'Hide the numbers' : 'Edit the numbers'; draw();
    });
    top.querySelector('.mk-rs').addEventListener('click', function () { location.reload(); });
    Array.prototype.forEach.call(top.querySelectorAll('.mk-sc button'), function (b) {
      b.addEventListener('click', function () {
        scale = b.getAttribute('data-v');
        Array.prototype.forEach.call(top.querySelectorAll('.mk-sc button'), function (o) {
          var on = o === b; o.classList.toggle('on', on); o.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        draw();
      });
    });
    draw();
  });

  /* Exposure from an editable row set: [name, share, isControlled].
     Leverage and substitutability are stage-specific: a pretraining accelerator
     has almost no substitute (0.10) while an inference accelerator has a good
     one (0.60). Keying on name alone silently merged the two and gave wrong
     numbers for both columns. */
  var PARAM = {
    'Pretraining': { 'AI accelerators': [1.0, 0.10], 'Server components': [0.2, 0.70],
                     'Cluster interconnect': [0.6, 0.30], 'Data acquisition': [0.2, 0.50] },
    'Post-training': { 'Compute': [0.8, 0.50] },
    'Inference': { 'AI accelerators': [1.0, 0.60], 'Networking and storage': [0.6, 0.50] }
  };
  D.exposureFromRows = function (rows, stage) {
    var tbl = PARAM[stage] || {};
    var sum = rows.reduce(function (a, r) { return a + r[1]; }, 0) || 1;
    return rows.reduce(function (a, r) {
      if (!r[2]) return a;
      var pr = tbl[r[0]] || [0.8, 0.40];
      return a + (r[1] / sum) * pr[0] * (1 - pr[1]);
    }, 0) * 100;
  };

  /* =========================================================================
     2. DENIAL — how long a control actually buys
     ========================================================================= */

  D.widget('denial', function (node) {
    var gap = 30, alpha = ALPHA, hw = HWPP, openLag = 4;

    var body = D.shell(node, 'How many years does an export control actually buy?', 'Set the gap',
      '<div class="lab-controls dn-ctl"></div><div class="dn-out"></div><div class="dn-chart"></div><div class="lab-out dn-say"></div>',
      'Equation E5. <b>T = ln(R) / ln(&alpha; &middot; h)</b>, where R is how many times short of the frontier a country\u2019s accessible ' +
      'effective compute is, &alpha; is the algorithmic efficiency multiplier per year and h is hardware price-performance improvement per year. ' +
      'It follows from E4, C<sub>eff</sub>(t) = C<sub>phys</sub> &middot; &alpha;<sup>t</sup>. ' +
      'Defaults: &alpha; = 3.0 per year (Ho et al. 2024 via Epoch AI, corroborated at 3&times; by Gundlach et al., ' +
      '<a class="link" href="https://arxiv.org/abs/2511.23455" target="_blank" rel="noopener">arXiv:2511.23455</a>); ' +
      'h = 1.3 per year (Epoch AI). The open-weight lag of 4 months is Epoch AI\u2019s Capabilities Index measurement, May 2026. ' +
      'This assumes efficiency gains reach the restricted party, which open publication and open weights largely ensure. It says nothing about ' +
      'whether they can use them.');

    var ctl = body.querySelector('.dn-ctl'), out = body.querySelector('.dn-out'),
        chart = body.querySelector('.dn-chart'), say = body.querySelector('.dn-say');

    ctl.innerHTML =
      '<label class="ctl"><span class="meta">Compute gap to the frontier <b class="dn-g">30</b>&times;</span>' +
        '<input type="range" class="dn-gs" min="2" max="1000" value="30"></label>' +
      '<label class="ctl"><span class="meta">Algorithmic efficiency &alpha; <b class="dn-a">3.0</b>&times;/yr</span>' +
        '<input type="range" class="dn-as" min="100" max="500" value="300"></label>' +
      '<label class="ctl"><span class="meta">Hardware price-performance h <b class="dn-h">1.3</b>&times;/yr</span>' +
        '<input type="range" class="dn-hs" min="100" max="200" value="130"></label>' +
      '<label class="ctl"><span class="meta">Open-weight lag <b class="dn-o">4</b> months</span>' +
        '<input type="range" class="dn-os" min="0" max="24" value="4"></label>';

    function render() {
      ctl.querySelector('.dn-g').textContent = gap;
      ctl.querySelector('.dn-a').textContent = alpha.toFixed(1);
      ctl.querySelector('.dn-h').textContent = hw.toFixed(2);
      ctl.querySelector('.dn-o').textContent = openLag;

      var rate = alpha * hw;
      var T = Math.log(gap) / Math.log(rate);
      var total = T + openLag / 12;

      out.innerHTML = '<div class="gapless cols-4 dn-k">' +
        '<div><span class="meta">Combined efficiency rate</span><div class="kpi kpi-gold">' + rate.toFixed(2) + '&times;</div><span class="meta">per year</span></div>' +
        '<div><span class="meta">Years to close the compute gap</span><div class="kpi kpi-gold">' + T.toFixed(1) + '</div><span class="meta">T = ln(' + gap + ') / ln(' + rate.toFixed(2) + ')</span></div>' +
        '<div><span class="meta">Plus the open-weight lag</span><div class="kpi kpi-gold">' + (openLag / 12).toFixed(1) + '</div><span class="meta">years</span></div>' +
        '<div><span class="meta">Total delay bought</span><div class="kpi kpi-gold">' + total.toFixed(1) + '</div><span class="meta">years</span></div></div>';

      /* curve of T against gap */
      var CW = 560, CH = 210, PL = 44, PR = 14, PT = 12, PB = 34;
      function gx(g) { return PL + (Math.log(g) / Math.log(1000)) * (CW - PL - PR); }
      function gy(t) { return CH - PB - (t / 8) * (CH - PT - PB); }
      var pts = [];
      for (var g = 2; g <= 1000; g *= 1.12) pts.push([gx(g), gy(Math.log(g) / Math.log(rate))]);
      chart.innerHTML = '<span class="meta" style="display:block;margin:20px 0 8px">Years of delay, against how far behind you start</span>' +
        '<svg class="chart dn-svg" viewBox="0 0 ' + CW + ' ' + CH + '" role="img" aria-label="Delay in years against compute gap, on a log scale">' +
        [0, 2, 4, 6, 8].map(function (t) {
          return '<line class="gridline" x1="' + PL + '" y1="' + gy(t) + '" x2="' + (CW - PR) + '" y2="' + gy(t) + '"/>' +
                 '<text class="axis-label" x="' + (PL - 8) + '" y="' + (gy(t) + 4) + '" text-anchor="end">' + t + 'y</text>';
        }).join('') +
        '<polyline class="dn-line" points="' + pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ') + '"/>' +
        '<circle cx="' + gx(gap) + '" cy="' + gy(T) + '" r="5.5" fill="#620d3c" stroke="#171413" stroke-width="2"/>' +
        [2, 10, 100, 1000].map(function (g) {
          return '<text class="axis-label" x="' + gx(g) + '" y="' + (CH - 14) + '" text-anchor="middle">' + g + '&times;</text>';
        }).join('') +
        '</svg>';

      say.innerHTML = 'On these settings a country held <b>' + gap + '&times;</b> short of the frontier catches up to today\u2019s frontier capability in <b>' +
        T.toFixed(1) + ' years</b>, purely from efficiency gains it does not have to buy. Add the open-weight lag and the control has bought about <b>' +
        total.toFixed(1) + ' years</b> of delay. ' +
        (total < 2
          ? 'Under two years. At that point the instrument is a tax on timing rather than a barrier to capability.'
          : total < 4
            ? 'Two to four years is roughly one hardware generation. Long enough to matter commercially, short enough that permanent denial is not the right mental model.'
            : 'Above four years the control is doing real strategic work, but note how hard you had to push the gap to get there.') +
        '<br><br><span class="meta">The honest caveat: this measures when the compute stops binding. It says nothing about whether the people, ' +
        'the data and the environments are in place to use it. On the evidence elsewhere on this dashboard, for India those bind first.</span>';
    }

    ctl.querySelector('.dn-gs').addEventListener('input', function () { gap = +this.value; render(); });
    ctl.querySelector('.dn-as').addEventListener('input', function () { alpha = +this.value / 100; render(); });
    ctl.querySelector('.dn-hs').addEventListener('input', function () { hw = +this.value / 100; render(); });
    ctl.querySelector('.dn-os').addEventListener('input', function () { openLag = +this.value; render(); });
    render();
  });

  /* =========================================================================
     3. OPENW — open weights as chokepoint relief
     ========================================================================= */

  var RELIEF = [
    { line: 'AI accelerators', stage: 'All', before: 1.00, after: 0.85, how: 'Open weights do not make chips appear. They do let you run a smaller model, quantise it, and serve on older parts, which is why the relief is real but small.' },
    { line: 'Cluster interconnect', stage: 'Pretraining', before: 0.60, after: 0.15, how: 'If you start from published weights you skip the pretraining run entirely, and with it the one job that needs thousands of chips wired as a single machine. This is the largest single relief on the board.' },
    { line: 'Frontier model access', stage: 'All', before: 1.00, after: 0.10, how: 'A licence binds future releases. Weights already downloaded cannot be recalled by anyone, in any jurisdiction, ever. Mirroring costs almost nothing.' },
    { line: 'Serving software', stage: 'Inference', before: 0.80, after: 0.05, how: 'vLLM and SGLang are Apache-licensed. Two independent projects means no single-project dependency either.' },
    { line: 'Framework', stage: 'All', before: 0.90, after: 0.05, how: 'PyTorch holds roughly 63% share under a permissive licence and foundation governance. Concentrated and close to harmless.' },
    { line: 'Programming stack (CUDA)', stage: 'All', before: 1.00, after: 0.90, how: 'Almost no relief. Proprietary, revocable, not forkable, about 90% share. Open weights do nothing about this, and ROCm is not yet a full answer.' },
    { line: 'Human and expert data', stage: 'Post-training', before: 0.00, after: 0.00, how: 'No relief needed and none offered. This was never restricted, and open weights do not supply it either. You still have to pay people.' },
    { line: 'Reinforcement environments', stage: 'Post-training', before: 0.00, after: 0.00, how: 'The gap open weights do not fill. Published weights arrive without the environments that shaped them, which is precisely why the released model cannot easily be pushed further.' }
  ];

  D.widget('openw', function (node) {
    var sel = null, lag = 4;

    var body = D.shell(node, 'What open weights actually relieve', 'Tap a line',
      '<div class="ow-rows"></div><div class="lab-out ow-out"></div>' +
      '<div class="ow-lag"></div>',
      'Before and after scores are control leverage on the 0-1 scale used throughout this dashboard, with and without a usable open-weight ' +
      'starting point. They are our judgement; the reasoning for each is in the panel. Capability lag from Epoch AI\u2019s ' +
      '<a class="link" href="https://epoch.ai/data-insights/open-closed-eci-gap" target="_blank" rel="noopener">Capabilities Index</a>, ' +
      '29 May 2026: 4 months, 8 ECI points, 90% CI 7 to 11. Model list: ' +
      '<a class="link" href="assets/data/openweights.csv" download>openweights.csv</a>.');

    var rows = body.querySelector('.ow-rows'), out = body.querySelector('.ow-out'), lagEl = body.querySelector('.ow-lag');

    function render() {
      rows.innerHTML = '<div class="ow-head"><span>Cost line</span><span>Closed only</span><span>With open weights</span><span>Relief</span></div>' +
        RELIEF.map(function (r) {
          var rel = r.before - r.after;
          return '<button type="button" class="ow-row' + (sel === r.line ? ' on' : '') + '" data-l="' + D.esc(r.line) + '">' +
            '<span class="ow-l">' + D.esc(r.line) + '<i class="meta">' + r.stage + '</i></span>' +
            '<span class="ow-dot"><i style="opacity:' + (0.15 + r.before * 0.85) + '"></i>' + r.before.toFixed(2) + '</span>' +
            '<span class="ow-dot"><i style="opacity:' + (0.15 + r.after * 0.85) + '"></i>' + r.after.toFixed(2) + '</span>' +
            '<span class="ow-rel"><span class="ow-track"><span class="ow-fill" style="width:' + (rel * 100) + '%"></span></span>' +
            (rel > 0 ? '&minus;' + (rel * 100).toFixed(0) + '%' : 'none') + '</span></button>';
        }).join('');

      var d = RELIEF.filter(function (r) { return r.line === sel; })[0];
      var avgBefore = RELIEF.reduce(function (a, r) { return a + r.before; }, 0) / RELIEF.length;
      var avgAfter = RELIEF.reduce(function (a, r) { return a + r.after; }, 0) / RELIEF.length;
      out.innerHTML = d
        ? '<b>' + D.esc(d.line) + '</b> \u2014 ' + d.how
        : 'Average control leverage falls from <b>' + avgBefore.toFixed(2) + '</b> to <b>' + avgAfter.toFixed(2) +
          '</b> once a usable open-weight starting point exists. But look at the distribution rather than the average: ' +
          'the relief is near total on interconnect, model access and software, and near zero on chips, on CUDA, and on the two things ' +
          'post-training actually runs on. Open weights solve India\u2019s pretraining problem by making it unnecessary. They do nothing at all ' +
          'about the post-training problem. Tap any line.';

      lagEl.innerHTML = '<div class="ow-lagbox"><span class="meta">The price of the relief</span>' +
        '<label class="ctl" style="margin:12px 0"><span class="meta">Capability lag you accept <b class="ow-lv">' + lag + '</b> months</span>' +
        '<input type="range" class="ow-ls" min="0" max="24" value="' + lag + '"></label>' +
        '<p class="body-s">Epoch AI measures the current lag at <b>four months</b>, widened from three in their October 2025 analysis. ' +
        'That is about one minor version. For most public-sector and commercial uses it is not a binding difference. ' +
        'For frontier safety evaluation or long-horizon agentic work it is, because that is where the closed labs concentrate effort ' +
        'and where benchmark aggregates hide the most.</p>' +
        (lag >= 12 ? '<p class="body-s"><b>At ' + lag + ' months you are describing the US-China frontier gap, not the open-closed gap.</b> ' +
          'Epoch puts Chinese models at roughly 7 months behind the US frontier on average since 2023, with a range of 4 to 14. ' +
          'Most open weights now come from Chinese labs, so India inherits both lags, not one.</p>' : '') + '</div>';

      Array.prototype.forEach.call(rows.querySelectorAll('.ow-row'), function (b) {
        b.addEventListener('click', function () { sel = (sel === b.getAttribute('data-l')) ? null : b.getAttribute('data-l'); render(); });
      });
      lagEl.querySelector('.ow-ls').addEventListener('input', function () { lag = +this.value; render(); });
    }
    render();
  });

  /* =========================================================================
     4. TRENDS — series over time with fitted growth
     ========================================================================= */

  var SERIES = {
    'Frontier training cost': { unit: '$', log: true, d: [[2020, 4.6e6], [2022, 1.2e7], [2023, 7.9e7], [2024, 1.91e8], [2026, 3.5e8]],
      note: 'Amortised hardware and energy for the final run. Doubling roughly every year on this fit. Sources: Stanford AI Index with Epoch AI for 2023 and 2024; Epoch AI cost model elsewhere.' },
    'Price of GPT-3 quality': { unit: '$/Mtok', log: true, d: [[2021, 60], [2022, 6], [2023, 0.6], [2024, 0.06]],
      note: 'Cost of a fixed capability level, not of the frontier. A thousandfold fall in three years. Source: a16z LLMflation; the two middle points are interpolated on the log trend and graded C.' },
    'India data centre capacity': { unit: 'MW', log: false, d: [[2020, 520], [2024, 1200], [2025, 1500], [2026, 1600], [2029, 6000]],
      note: 'Colocation IT load. The last point is a projection, not an observation. Sources: JM Financial and CBRE via Systemiq; JLL June and September 2026.' },
    'India accelerator fleet': { unit: 'GPUs', log: false, d: [[2024, 10000], [2025, 34333], [2026, 38000]],
      note: 'Empanelled under the IndiaAI Mission, which is not the same as installed. Source: MeitY and IndiaAI.' },
    'Open-weight lag': { unit: 'months', log: false, d: [[2023, 3], [2025, 3], [2026, 4]],
      note: 'How far the best open-weight model trails the best closed model on the Epoch Capabilities Index. Widened slightly. Source: Epoch AI, October 2025 and May 2026.' }
  };

  D.widget('trends', function (node) {
    var key = 'Frontier training cost';

    var body = D.shell(node, 'How each of these has moved', 'Pick a series',
      '<div class="seg tr-seg" style="margin-bottom:20px;flex-wrap:wrap"></div><div class="tr-chart"></div><div class="lab-out tr-say"></div>',
      'Growth rates are compound annual rates computed from the first and last observation, equation E8: ' +
      '<b>g = (V<sub>end</sub> / V<sub>start</sub>)<sup>1/n</sup> &minus; 1</b>. With three to five observations these are fitted rates, ' +
      'not forecasts, and no confidence interval is quoted because none would mean anything. ' +
      'Data: <a class="link" href="assets/data/trends.csv" download>trends.csv</a>.');

    var seg = body.querySelector('.tr-seg'), chart = body.querySelector('.tr-chart'), say = body.querySelector('.tr-say');
    seg.innerHTML = Object.keys(SERIES).map(function (k, i) {
      return '<button type="button" data-k="' + D.esc(k) + '"' + (i === 0 ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + '>' + D.esc(k) + '</button>';
    }).join('');

    function render() {
      Array.prototype.forEach.call(seg.querySelectorAll('button'), function (b) {
        var on = b.getAttribute('data-k') === key;
        b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      var s = SERIES[key], d = s.d;
      var CW = 620, CH = 250, PL = 62, PR = 18, PT = 16, PB = 42;
      var xs = d.map(function (p) { return p[0]; }), ys = d.map(function (p) { return p[1]; });
      var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
      var lo = Math.min.apply(null, ys), hi = Math.max.apply(null, ys);
      function X(v) { return PL + (v - x0) / (x1 - x0 || 1) * (CW - PL - PR); }
      function Y(v) {
        if (s.log) { var a = Math.log10(lo), b = Math.log10(hi); return CH - PB - (Math.log10(v) - a) / (b - a || 1) * (CH - PT - PB); }
        return CH - PB - (v - 0) / (hi || 1) * (CH - PT - PB);
      }
      function fmt(v) {
        if (s.unit === '$') return D.money(v);
        if (s.unit === '$/Mtok') return '$' + (v >= 1 ? v.toFixed(0) : v.toFixed(2));
        return v.toLocaleString('en-US') + ' ' + s.unit;
      }
      var n = x1 - x0, g = Math.pow(ys[ys.length - 1] / ys[0], 1 / n) - 1;

      chart.innerHTML = '<svg class="chart tr-svg" viewBox="0 0 ' + CW + ' ' + CH + '" role="img" aria-label="' + D.esc(key) + ' over time">' +
        [0, 0.25, 0.5, 0.75, 1].map(function (f) {
          var yy = PT + f * (CH - PT - PB);
          return '<line class="gridline" x1="' + PL + '" y1="' + yy + '" x2="' + (CW - PR) + '" y2="' + yy + '"/>';
        }).join('') +
        '<text class="axis-label" x="' + (PL - 8) + '" y="' + (Y(hi) + 4) + '" text-anchor="end">' + fmt(hi) + '</text>' +
        '<text class="axis-label" x="' + (PL - 8) + '" y="' + (Y(s.log ? lo : 0) + 4) + '" text-anchor="end">' + fmt(s.log ? lo : 0) + '</text>' +
        '<polyline class="tr-line" points="' + d.map(function (p) { return X(p[0]).toFixed(1) + ',' + Y(p[1]).toFixed(1); }).join(' ') + '"/>' +
        d.map(function (p) {
          return '<circle cx="' + X(p[0]) + '" cy="' + Y(p[1]) + '" r="5" fill="#620d3c" stroke="#171413" stroke-width="2"/>' +
            '<text class="axis-label" x="' + X(p[0]) + '" y="' + (CH - 16) + '" text-anchor="middle">' + p[0] + '</text>' +
            '<text class="tr-v" x="' + X(p[0]) + '" y="' + (Y(p[1]) - 12) + '" text-anchor="middle">' + fmt(p[1]) + '</text>';
        }).join('') +
        (s.log ? '<text class="axis-label" x="' + PL + '" y="' + (PT + 10) + '">LOG SCALE</text>' : '') +
        '</svg>';

      say.innerHTML = '<b>' + (g >= 0 ? '+' : '') + (g * 100).toFixed(1) + '% a year</b> compounded over ' + n +
        ' years, a factor of ' + (ys[ys.length - 1] / ys[0] >= 1 ? (ys[ys.length - 1] / ys[0]).toFixed(1) + '&times; up' :
          (ys[0] / ys[ys.length - 1]).toFixed(0) + '&times; down') + '. ' + s.note;
    }

    Array.prototype.forEach.call(seg.querySelectorAll('button'), function (b) {
      b.addEventListener('click', function () { key = b.getAttribute('data-k'); render(); });
    });
    render();
  });

})(window.D);
