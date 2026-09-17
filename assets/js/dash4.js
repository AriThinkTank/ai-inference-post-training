/* =========================================================================
   dash4.js — three more angles.

   margins   who actually captures the money, from company filings
   scatter3d cost share, concentration and substitutability on three axes,
             drag to rotate. Pure SVG projection, no libraries.
   substitute how long it would take India to build an alternative
   timeline  the scissors, played out year by year
   ========================================================================= */

window.D = window.D || {};
(function (D) {
  'use strict';

  /* =========================================================================
     1. MARGINS — the profit pool, from filings
     ========================================================================= */

  var POOL = [
    { l: 'Memory, including HBM', f: 'SK hynix', m: 76, kind: 'Operating', per: 'Q2 2026', g: 'A',
      india: 1, note: 'The highest margin anywhere in the stack, and the one nobody expected. Memory was supposed to be a commodity business with brutal cycles. Long-term supply agreements with roughly ten customers have changed that, at least for now. India packages memory at Sanand through Micron, which is the back end of this business rather than the profitable front.' },
    { l: 'AI accelerators', f: 'NVIDIA', m: 60.4, kind: 'Operating', per: 'FY2026', g: 'A',
      india: 0, note: 'Operating income of $130.4bn on revenue of $215.9bn, from the Form 10-K. Gross margin was 71.1 per cent, down from 75.0 the year before, largely because of a $4.5bn charge on H20 inventory that export controls stranded. That single line is worth noting: export controls cost the seller too.' },
    { l: 'Leading-edge foundry', f: 'TSMC', m: 60.3, kind: 'Operating', per: 'Q2 2026', g: 'A',
      india: 0, note: 'Gross margin 67.7 per cent, operating 60.3, net 55.6. For a business that spends tens of billions a year on plant, those are remarkable numbers, and they are what a genuine monopoly on a process node looks like. India has no entry here; Dholera targets 28 nanometres, several generations behind.' },
    { l: 'Advanced packaging', f: 'ASE, Amkor', m: 13, kind: 'Operating', per: '2025', g: 'C',
      india: 3, note: 'A fifth of TSMC\u2019s margin for work that is genuinely hard. But it is the one hardware layer where capacity rather than permission is the constraint, and India already has three plants operating. Modest margins on a layer you can actually enter beat excellent margins on one you cannot.' },
    { l: 'Data centre operation', f: 'Colocation and neocloud', m: 25, kind: 'Gross', per: '2025', g: 'C',
      india: 4, note: 'Wide spread between plain colocation and renting GPUs by the hour. India has an established industry here with 1,600 MW installed. The margin is respectable and the capital intensity is the problem, not the pricing.' },
    { l: 'Human data and annotation', f: 'Surge AI and peers', m: 40, kind: 'Gross', per: '2026', g: 'C',
      india: 5, note: 'Surge AI is reported at a $1.4bn annual revenue run rate serving frontier laboratories, though it is private and unaudited. Expert tiers command far more than generalist work. This is the layer where India\u2019s advantage is real, the margins are decent, and nobody needs an export licence.' },
    { l: 'Server assembly', f: 'Foxconn and peers', m: 3, kind: 'Operating', per: '2025', g: 'C',
      india: 4, note: 'Contract electronics manufacturing runs at two to four per cent. India does this at scale and is getting better at it. It is also the layer that captures the least of every dollar that passes through it, which is worth saying plainly when assembly is announced as an industrial achievement.' }
  ];

  D.widget('margins', function (node) {
    var sel = null, sort = 'margin';

    var body = D.shell(node, 'Who actually keeps the money', 'Tap any layer',
      '<div class="seg mg-seg" style="margin-bottom:20px"></div><div class="mg-rows"></div><div class="lab-out mg-out"></div>',
      'Margins for NVIDIA, TSMC and SK hynix are from company filings and investor relations disclosures and are graded A. ' +
      'The rest are industry estimates, graded C, because private companies and fragmented sectors do not publish comparable figures. ' +
      'Gross and operating margin are not the same measure and the column says which is which, so read across with care. ' +
      'Data: <a class="link" href="assets/data/value-capture.csv" download>value-capture.csv</a>.');

    var seg = body.querySelector('.mg-seg'), rows = body.querySelector('.mg-rows'), out = body.querySelector('.mg-out');
    seg.innerHTML = '<button type="button" data-s="margin" class="on" aria-pressed="true">By margin</button>' +
      '<button type="button" data-s="india" aria-pressed="false">By how open it is to India</button>';

    function render() {
      Array.prototype.forEach.call(seg.querySelectorAll('button'), function (b) {
        var on = b.getAttribute('data-s') === sort;
        b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      var d = POOL.slice().sort(function (a, b) { return sort === 'margin' ? b.m - a.m : b.india - a.india; });
      rows.innerHTML = '<div class="mg-head"><span>Layer</span><span>Margin</span><span>Open to India</span></div>' +
        d.map(function (r) {
          return '<button type="button" class="mg-row' + (sel === r.l ? ' on' : '') + '" data-l="' + D.esc(r.l) + '">' +
            '<span class="mg-l">' + D.esc(r.l) + '<i class="meta">' + D.esc(r.f) + ' &middot; ' + r.kind.toLowerCase() + ' &middot; ' + r.per + ' &middot; grade ' + r.g + '</i></span>' +
            '<span class="mg-m"><span class="mg-track"><span class="mg-fill grow" style="--w:' + (r.m / 80 * 100) + '%"></span></span>' +
            '<b>' + r.m + '%</b></span>' +
            '<span class="mg-i">' + [1, 2, 3, 4, 5].map(function (i) {
              return '<i class="' + (i <= r.india ? 'on' : '') + '"></i>'; }).join('') + '</span></button>';
        }).join('');

      var x = POOL.filter(function (r) { return r.l === sel; })[0];
      out.innerHTML = x
        ? '<b>' + D.esc(x.l) + '</b> \u2014 ' + x.note
        : 'Sort by margin and the top three layers are all closed to India. Sort by openness and the top three are all at or below 40 per cent. ' +
          '<b>That inverse relationship is the single most uncomfortable chart on this dashboard.</b> ' +
          'The layers that pay best are the ones with a monopoly or a duopoly protecting them, and monopolies are not open to newcomers by definition. ' +
          'The one place the pattern breaks is human data and annotation, which pays reasonably and is wide open, because its barrier to entry is a supply of credentialed people rather than a fab. ' +
          '<span class="meta">Tap any row for detail and sourcing.</span>';

      Array.prototype.forEach.call(rows.querySelectorAll('.mg-row'), function (b) {
        b.addEventListener('click', function () { sel = (sel === b.getAttribute('data-l')) ? null : b.getAttribute('data-l'); render(); });
      });
      D.boot(rows);
    }
    Array.prototype.forEach.call(seg.querySelectorAll('button'), function (b) {
      b.addEventListener('click', function () { sort = b.getAttribute('data-s'); render(); });
    });
    render();
  });

  /* =========================================================================
     2. SCATTER3D — three axes, because two were not enough
     ========================================================================= */

  var PTS = [
    { n: 'AI accelerators (pretraining)', cost: 33, conc: 78, sub: 10, s: 'pre' },
    { n: 'Cluster interconnect', cost: 11, conc: 53, sub: 30, s: 'pre' },
    { n: 'Server components', cost: 18, conc: 14, sub: 70, s: 'pre' },
    { n: 'R&D staff', cost: 30, conc: 5, sub: 90, s: 'pre' },
    { n: 'Human and expert data', cost: 45, conc: 8, sub: 20, s: 'post' },
    { n: 'RL environments', cost: 25, conc: 64, sub: 15, s: 'post' },
    { n: 'Post-training compute', cost: 20, conc: 78, sub: 50, s: 'post' },
    { n: 'AI accelerators (inference)', cost: 50, conc: 78, sub: 60, s: 'inf' },
    { n: 'Energy', cost: 18, conc: 5, sub: 95, s: 'inf' },
    { n: 'Data centre facility', cost: 17, conc: 10, sub: 90, s: 'inf' },
    { n: 'Networking and storage', cost: 7, conc: 53, sub: 50, s: 'inf' },
    { n: 'Engineering staff', cost: 8, conc: 5, sub: 90, s: 'inf' }
  ];
  var SC = { pre: '#620d3c', post: '#f1a222', inf: '#2f6b6b' };

  var AXIS = {
    cost: ['Cost share', 'How big a slice of that stage\u2019s budget this line is. A cheap line cannot hurt you much even if it vanishes.'],
    conc: ['Concentration', 'How few firms supply it, measured as a normalised Herfindahl index. Near 100 means one or two suppliers and no realistic alternative seller.'],
    sub:  ['Substitutability', 'How well something cheaper or unrestricted does the same job. Near 100 means you barely notice losing the first choice.']
  };

  D.widget('scatter3d', function (node) {
    var yaw = 0.6, pitch = 0.35, sel = null, spin = null;
    var down = null, moved = 0, shown = [];

    var body = D.shell(node, 'The danger corner', 'Drag to rotate, tap a ball',
      '<div class="s3-lead"></div>' +
      '<div class="s3-grid">' +
        '<div class="s3-wrap"><svg class="s3-svg" viewBox="20 52 430 232"></svg></div>' +
        '<div class="s3-panel"></div>' +
      '</div>' +
      '<div class="s3-ctl"></div>',
      'Concentration is normalised HHI from <a class="link" href="assets/data/chokepoints.csv" download>chokepoints.csv</a>; ' +
      'cost share and substitutability from <a class="link" href="assets/data/cost-stack.csv" download>cost-stack.csv</a>. ' +
      'Ball size is cost share, so the big balls are the expensive lines. Colour is which stage the line belongs to. ' +
      'Drag anywhere in the box to turn it; the three preset buttons move to fixed viewpoints if dragging is awkward.');

    var lead = body.querySelector('.s3-lead'), svg = body.querySelector('.s3-svg'),
        panel = body.querySelector('.s3-panel'), ctl = body.querySelector('.s3-ctl');

    lead.innerHTML =
      '<p class="body-s" style="margin-bottom:14px">A cost line is only a strategic problem if <b>all three</b> of these are true at once. ' +
      'That is why it needs a cube rather than a chart.</p>' +
      '<div class="s3-axes">' +
      ['cost', 'conc', 'sub'].map(function (k, i) {
        return '<div class="s3-ax-card"><span class="s3-ax-n">' + (i + 1) + '</span>' +
          '<b>' + AXIS[k][0] + '</b><span class="body-s">' + AXIS[k][1] + '</span></div>';
      }).join('') + '</div>' +
      '<p class="body-s" style="margin:16px 0 20px">Expensive, concentrated and <i>not</i> substitutable is the combination that hurts. ' +
      'On the cube that is the far corner: right along cost, high on concentration, near the front on substitutability. ' +
      'Press <b>Show me the danger corner</b> and count how many balls are actually in it.</p>';

    ctl.innerHTML =
      '<button class="btn btn-s s3-danger" type="button">Show me the danger corner</button>' +
      '<button class="btn btn-s btn-ghost s3-spin" type="button">Spin</button>' +
      '<button class="btn btn-s btn-ghost s3-reset" type="button">Reset</button>' +
      '<span class="s3-key"><i style="background:#620d3c"></i>Pretraining<i style="background:#f1a222"></i>Post-training<i style="background:#2f6b6b"></i>Inference</span>';

    function project(x, y, z) {
      var cx = x - 0.5, cy = y - 0.5, cz = z - 0.5;
      var X = cx * Math.cos(yaw) - cz * Math.sin(yaw);
      var Z = cx * Math.sin(yaw) + cz * Math.cos(yaw);
      var Y = cy * Math.cos(pitch) - Z * Math.sin(pitch);
      var depth = cy * Math.sin(pitch) + Z * Math.cos(pitch);
      var sc = 210 / (2.6 + depth);
      return { px: 235 + X * sc * 1.5, py: 168 - Y * sc * 1.5, d: depth };
    }

    function danger(p) { return p.cost >= 20 && p.conc >= 50 && p.sub <= 35; }

    function draw() {
      var C = [[0,0,0],[1,0,0],[1,0,1],[0,0,1],[0,1,0],[1,1,0],[1,1,1],[0,1,1]];
      var E = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
      var P = C.map(function (c) { return project(c[0], c[1], c[2]); });
      var frame = E.map(function (e) {
        return '<line class="s3-edge" x1="' + P[e[0]].px.toFixed(1) + '" y1="' + P[e[0]].py.toFixed(1) +
          '" x2="' + P[e[1]].px.toFixed(1) + '" y2="' + P[e[1]].py.toFixed(1) + '"/>';
      }).join('');

      /* shade the danger corner so it is visible from any angle */
      var Dc = [project(20/55,0.5,0), project(1,0.5,0), project(1,1,0), project(20/55,1,0),
                project(20/55,0.5,0.35), project(1,0.5,0.35), project(1,1,0.35), project(20/55,1,0.35)];
      var zone = '<polygon class="s3-zone" points="' + [4,5,6,7].map(function (i) {
        return Dc[i].px.toFixed(1) + ',' + Dc[i].py.toFixed(1); }).join(' ') + '"/>' +
        '<polygon class="s3-zone" points="' + [0,1,2,3].map(function (i) {
        return Dc[i].px.toFixed(1) + ',' + Dc[i].py.toFixed(1); }).join(' ') + '"/>';

      shown = PTS.map(function (p) {
        var q = project(p.cost / 55, p.conc / 100, p.sub / 100);
        return { p: p, q: q, r: 4 + (p.cost / 55) * 8 };
      }).sort(function (a, b) { return b.q.d - a.q.d; });

      var dots = shown.map(function (o) {
        var on = sel === o.p.n, dz = danger(o.p);
        var base = project(o.p.cost / 55, 0, o.p.sub / 100);
        return '<g class="s3-pt' + (on ? ' on' : '') + '">' +
          '<line class="s3-drop" x1="' + o.q.px.toFixed(1) + '" y1="' + o.q.py.toFixed(1) +
            '" x2="' + base.px.toFixed(1) + '" y2="' + base.py.toFixed(1) + '"/>' +
          (dz ? '<circle cx="' + o.q.px.toFixed(1) + '" cy="' + o.q.py.toFixed(1) + '" r="' + (o.r + 5).toFixed(1) +
            '" fill="none" stroke="#a3282d" stroke-width="2" stroke-dasharray="3 2"/>' : '') +
          '<circle cx="' + o.q.px.toFixed(1) + '" cy="' + o.q.py.toFixed(1) + '" r="' + (on ? o.r + 3 : o.r).toFixed(1) + '" ' +
            'fill="' + SC[o.p.s] + '" stroke="#171413" stroke-width="2" opacity="' +
            (0.6 + 0.4 * (1 - (o.q.d + 1) / 2)).toFixed(2) + '"/>' +
          (on ? '<text class="s3-lbl" x="' + (o.q.px + o.r + 8).toFixed(1) + '" y="' + (o.q.py + 4).toFixed(1) + '">' +
            D.esc(o.p.n) + '</text>' : '') + '</g>';
      }).join('');

      var c0 = project(0.5, 0.5, 0.5);
      var labs = [
        { p: project(1.34, 0, 0), t: 'COST \u2192' },
        { p: project(0, 1.26, 0), t: 'CONCENTRATION \u2191' },
        { p: project(0, 0, 1.34), t: 'SUBSTITUTABLE \u2192' }
      ];
      /* at some rotations two axis labels land on top of each other */
      for (var a1 = 0; a1 < labs.length; a1++) {
        for (var b1 = a1 + 1; b1 < labs.length; b1++) {
          if (Math.abs(labs[a1].p.px - labs[b1].p.px) < 90 && Math.abs(labs[a1].p.py - labs[b1].p.py) < 16) {
            labs[a1].p.py -= 10; labs[b1].p.py += 10;
          }
        }
      }
      var ax = labs.map(function (a) {
        return '<text class="s3-ax" x="' + a.p.px.toFixed(1) + '" y="' + a.p.py.toFixed(1) +
          '" text-anchor="' + (a.p.px < c0.px - 15 ? 'end' : a.p.px > c0.px + 15 ? 'start' : 'middle') + '">' + a.t + '</text>';
      }).join('');

      svg.innerHTML = zone + frame + ax + dots;
    }

    function info() {
      var p = sel ? PTS.filter(function (x) { return x.n === sel; })[0] : null;
      if (!p) {
        var dz = PTS.filter(danger);
        panel.innerHTML = '<div class="s3-empty"><span class="meta">Nothing selected</span>' +
          '<p class="body-s">Tap any ball to see its three scores. The <b>' + dz.length + '</b> balls ringed in red are in the danger corner:</p>' +
          '<ul class="s3-list">' + dz.map(function (x) { return '<li>' + D.esc(x.n) + '</li>'; }).join('') + '</ul>' +
          '<p class="body-s">One of those is exactly what export controls were designed around. The other has no control on it anywhere in the world, because nobody sells it.</p></div>';
        return;
      }
      var stage = { pre: 'Pretraining', post: 'Post-training', inf: 'Inference' }[p.s];
      function bar(lbl, v, inv) {
        var band = inv ? (v <= 35 ? 'bad' : v >= 65 ? 'good' : 'mid') : (v >= 50 ? 'bad' : v <= 20 ? 'good' : 'mid');
        return '<div class="s3-bar"><span class="meta">' + lbl + '</span>' +
          '<span class="s3-tr"><span class="s3-fl ' + band + '" style="width:' + v + '%"></span></span>' +
          '<b>' + v + '</b></div>';
      }
      var dz = danger(p);
      panel.innerHTML = '<span class="chip' + (dz ? ' chip-neg' : ' chip-soft') + '">' +
          (dz ? 'In the danger corner' : 'Not a chokepoint') + '</span>' +
        '<h4 class="h-card" style="margin:12px 0 4px">' + D.esc(p.n) + '</h4>' +
        '<span class="meta" style="display:block;margin-bottom:14px">' + stage + '</span>' +
        bar('Cost share', p.cost, false) + bar('Concentration', p.conc, false) + bar('Substitutable', p.sub, true) +
        '<p class="body-s" style="margin-top:14px">' + verdict(p, dz) + '</p>';
    }

    function verdict(p, dz) {
      if (dz) return 'Expensive, few suppliers, and nothing else does the job. Losing this would genuinely hurt, and there is no quick workaround.';
      if (p.conc >= 50 && p.sub >= 55) return 'Concentrated, so it looks alarming, but something cheaper does most of the job. This is the line people worry about more than they need to.';
      if (p.conc <= 20) return 'Barely concentrated at all. Whatever else is hard about this line, nobody can withhold it from you.';
      if (p.cost < 15) return 'Too small a share of the bill to be decisive on its own, even though supply is tight.';
      return 'Sits between the corners. Worth monitoring rather than worrying about.';
    }

    /* ---- interaction ------------------------------------------------------
       Pointer capture on the container swallows clicks on the SVG children,
       so selection is done by hit-testing on pointerup instead, and only when
       the pointer has barely moved. ---------------------------------------- */
    var wrap = body.querySelector('.s3-wrap');
    function localPt(e) {
      var r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal;
      return { x: (e.clientX - r.left) / r.width * vb.width + vb.x,
               y: (e.clientY - r.top) / r.height * vb.height + vb.y };
    }
    wrap.addEventListener('pointerdown', function (e) {
      down = { x: e.clientX, y: e.clientY }; moved = 0; stopSpin();
      wrap.setPointerCapture(e.pointerId);
    });
    wrap.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - down.x, dy = e.clientY - down.y;
      moved += Math.abs(dx) + Math.abs(dy);
      yaw += dx * 0.009; pitch = Math.max(-0.9, Math.min(0.9, pitch + dy * 0.006));
      down = { x: e.clientX, y: e.clientY };
      draw();
    });
    wrap.addEventListener('pointerup', function (e) {
      if (down && moved < 6) {
        var pt = localPt(e), best = null, bd = 1e9;
        shown.forEach(function (o) {
          var d = Math.hypot(o.q.px - pt.x, o.q.py - pt.y);
          if (d < Math.max(o.r + 7, 13) && d < bd) { bd = d; best = o.p.n; }
        });
        sel = (best === sel) ? null : best;
        draw(); info();
      }
      down = null;
    });
    wrap.addEventListener('pointercancel', function () { down = null; });

    function stopSpin() { if (spin) { cancelAnimationFrame(spin); spin = null; ctl.querySelector('.s3-spin').textContent = 'Spin'; } }
    ctl.querySelector('.s3-spin').addEventListener('click', function () {
      if (spin) { stopSpin(); return; }
      this.textContent = 'Stop';
      (function loop() { yaw += 0.006; draw(); spin = requestAnimationFrame(loop); })();
    });
    ctl.querySelector('.s3-reset').addEventListener('click', function () {
      stopSpin(); yaw = 0.6; pitch = 0.35; sel = null; draw(); info();
    });
    ctl.querySelector('.s3-danger').addEventListener('click', function () {
      stopSpin(); yaw = -0.72; pitch = 0.22; sel = 'AI accelerators (pretraining)'; draw(); info();
    });

    draw(); info();
  });

  /* =========================================================================
     3. SUBSTITUTE — how long would an Indian alternative take
     ========================================================================= */

  var SUB = [
    { n: 'Serving software', y: 0.05, c: 0.5, w: 'Fork an Apache-licensed engine. A weekend and a small team.', can: 5 },
    { n: 'Open model weights mirror', y: 0.1, c: 1, w: 'Storage and bandwidth. The decision costs more than the infrastructure.', can: 5 },
    { n: 'Human data and annotation', y: 1, c: 40, w: 'Recruiting and calibrating credentialed annotators across 22 languages. The constraint is verification, not headcount.', can: 5 },
    { n: 'RL environments', y: 2, c: 60, w: 'Software engineering against real domain tasks, maintained for a decade. Nobody sells this, so it has to be built.', can: 4 },
    { n: 'High-density data halls', y: 3, c: 2000, w: 'New build with liquid cooling. Planning, power connection and construction, and a skills base that barely exists here.', can: 4 },
    { n: 'Advanced packaging', y: 5, c: 3000, w: 'Three plants already operating. Yield learning is the hard part, and it cannot be bought.', can: 3 },
    { n: 'Accelerator programming stack', y: 6, c: 500, w: 'An alternative to CUDA is a decade-long ecosystem problem, not an engineering one. AMD has been trying since 2016.', can: 2 },
    { n: 'HBM fabrication', y: 8, c: 15000, w: 'Front-end memory fabrication, as distinct from the back-end packaging India already does. A different industry.', can: 1 },
    { n: 'Leading-edge logic fab', y: 12, c: 30000, w: 'Requires equipment India cannot import at the needed nodes. The timeline is set by export policy, not by capital.', can: 1 }
  ];

  D.widget('substitute', function (node) {
    var budget = 5000, horizon = 5, sel = null;

    var body = D.shell(node, 'What could India actually build, and by when', 'Set a budget and a deadline',
      '<div class="lab-controls sb-ctl"></div><div class="sb-plot"></div><div class="lab-out sb-out"></div>',
      'Years and capital are our estimates, and they are the softest numbers on this dashboard. They are meant to establish orders of ' +
      'magnitude and relative ordering, not to be quoted as costings. Capital figures are indicative programme cost in millions of dollars ' +
      'to reach a credible domestic capability, not to match world-leading scale. The feasibility score is our judgement of whether the ' +
      'binding constraint is money, time, people or somebody else\u2019s permission.');

    var ctl = body.querySelector('.sb-ctl'), plot = body.querySelector('.sb-plot'), out = body.querySelector('.sb-out');
    ctl.innerHTML =
      '<label class="ctl"><span class="meta">Capital available $<b class="sb-b">5,000</b>m</span>' +
        '<input type="range" class="sb-bs" min="10" max="30000" step="10" value="5000"></label>' +
      '<label class="ctl"><span class="meta">Deadline <b class="sb-h">5</b> years</span>' +
        '<input type="range" class="sb-hs" min="1" max="15" value="5"></label>';

    function render() {
      ctl.querySelector('.sb-b').textContent = budget.toLocaleString('en-US');
      ctl.querySelector('.sb-h').textContent = horizon;

      var CW = 620, CH = 320, PL = 170, PR = 20, PT = 16, PB = 40;
      function X(y) { return PL + (Math.log(y + 0.2) - Math.log(0.2)) / (Math.log(12.2) - Math.log(0.2)) * (CW - PL - PR); }
      var rowH = (CH - PT - PB) / SUB.length;

      plot.innerHTML = '<svg class="chart sb-svg" viewBox="0 0 ' + CW + ' ' + CH + '" role="img" aria-label="Time and capital needed for each domestic alternative">' +
        '<rect x="' + PL + '" y="' + PT + '" width="' + (X(horizon) - PL) + '" height="' + (CH - PT - PB) + '" fill="#f5e6ec"/>' +
        '<line x1="' + X(horizon) + '" y1="' + PT + '" x2="' + X(horizon) + '" y2="' + (CH - PB) + '" stroke="#620d3c" stroke-width="2" stroke-dasharray="5 4"/>' +
        SUB.map(function (r, i) {
          var y = PT + i * rowH + rowH / 2;
          var ok = r.y <= horizon && r.c <= budget;
          return '<text class="sb-n' + (ok ? ' ok' : '') + '" x="' + (PL - 10) + '" y="' + (y + 4) + '" text-anchor="end">' + D.esc(r.n) + '</text>' +
            '<line class="sb-rule" x1="' + PL + '" y1="' + y + '" x2="' + (CW - PR) + '" y2="' + y + '"/>' +
            '<circle class="sb-dot" cx="' + X(r.y) + '" cy="' + y + '" r="' + (ok ? 8 : 5.5) + '" fill="' + (ok ? '#2f6b4a' : '#a3282d') +
            '" stroke="#171413" stroke-width="2" data-n="' + D.esc(r.n) + '" tabindex="0"/>';
        }).join('') +
        [0.1, 1, 3, 6, 12].map(function (y) {
          return '<text class="axis-label" x="' + X(y) + '" y="' + (CH - 16) + '" text-anchor="middle">' + (y < 1 ? '1 month' : y + 'y') + '</text>';
        }).join('') +
        '<text class="axis-label" x="' + X(horizon) + '" y="' + (PT - 2) + '" text-anchor="middle">YOUR DEADLINE</text>' +
        '</svg>';

      var feasible = SUB.filter(function (r) { return r.y <= horizon && r.c <= budget; });
      var x = SUB.filter(function (r) { return r.n === sel; })[0];
      out.innerHTML = x
        ? '<b>' + D.esc(x.n) + '</b> \u2014 ' + x.w + ' <span class="meta">About ' + x.y + ' years and $' + x.c.toLocaleString('en-US') + 'm on our estimate.</span>'
        : '<b>' + feasible.length + ' of ' + SUB.length + ' are reachable</b> with $' + budget.toLocaleString('en-US') +
          'm inside ' + horizon + ' years. ' +
          (feasible.length >= 5
            ? 'Notice what is in that list: software, data, environments and buildings. Almost none of the reachable items are silicon, and almost all of them are things this dashboard has been arguing matter more than silicon.'
            : 'Tighten the budget and the list collapses to software and data first, which tells you where the cheap wins are.') +
          ' The two items at the bottom stay out of reach at almost any budget, because their constraint is equipment India cannot import rather than money it cannot raise. ' +
          '<span class="meta">Tap any point.</span>';

      Array.prototype.forEach.call(plot.querySelectorAll('.sb-dot'), function (c) {
        function pick() { sel = (sel === c.getAttribute('data-n')) ? null : c.getAttribute('data-n'); render(); }
        c.addEventListener('click', pick);
        c.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
      });
    }
    ctl.querySelector('.sb-bs').addEventListener('input', function () { budget = +this.value; render(); });
    ctl.querySelector('.sb-hs').addEventListener('input', function () { horizon = +this.value; render(); });
    render();
  });

  /* =========================================================================
     4. TIMELINE — the scissors, played year by year
     ========================================================================= */

  D.widget('timeline', function (node) {
    var year = 2020, playing = null;
    var FRONT = { 2020: 4.6e6, 2021: 8e6, 2022: 1.2e7, 2023: 7.9e7, 2024: 1.91e8, 2025: 2.5e8, 2026: 3.5e8 };
    var PRICE = { 2020: 200, 2021: 60, 2022: 6, 2023: 0.6, 2024: 0.06, 2025: 0.03, 2026: 0.015 };

    var body = D.shell(node, 'The scissors, year by year', 'Press play',
      '<div class="row tl-ctl" style="margin-bottom:18px"></div><div class="tl-chart"></div><div class="lab-out tl-say"></div>',
      'Frontier training cost from Stanford AI Index with Epoch AI for 2023 and 2024, and the Epoch AI cost model elsewhere. ' +
      'Price of a fixed capability level from a16z LLMflation for 2021 and 2024. Points for 2020, 2022, 2025 and 2026 are ' +
      'interpolated or extrapolated on the fitted log trend and are graded C; they are here to make the shape legible, not to be cited. ' +
      'Both axes are logarithmic, which is the only way two curves moving this fast in opposite directions fit on one chart.');

    var ctl = body.querySelector('.tl-ctl'), chart = body.querySelector('.tl-chart'), say = body.querySelector('.tl-say');
    ctl.innerHTML = '<button class="btn btn-s tl-play" type="button">Play</button>' +
      '<label class="ctl" style="flex:1;min-width:200px"><span class="meta">Year <b class="tl-y">2020</b></span>' +
      '<input type="range" class="tl-s" min="2020" max="2026" value="2020"></label>';

    function render() {
      ctl.querySelector('.tl-y').textContent = year;
      ctl.querySelector('.tl-s').value = year;
      var CW = 620, CH = 280, PL = 62, PR = 62, PT = 20, PB = 40;
      function X(y) { return PL + (y - 2020) / 6 * (CW - PL - PR); }
      function YF(v) { return CH - PB - (Math.log10(v) - 6) / (8.7 - 6) * (CH - PT - PB); }
      function YP(v) { return CH - PB - (Math.log10(v) + 2) / (2.4 + 2) * (CH - PT - PB); }
      var ys = []; for (var y = 2020; y <= year; y++) ys.push(y);

      chart.innerHTML = '<svg class="chart tl-svg" viewBox="0 0 ' + CW + ' ' + CH + '" role="img" aria-label="Frontier training cost rising while the price of fixed capability falls">' +
        [0, 0.25, 0.5, 0.75, 1].map(function (f) {
          var yy = PT + f * (CH - PT - PB);
          return '<line class="gridline" x1="' + PL + '" y1="' + yy + '" x2="' + (CW - PR) + '" y2="' + yy + '"/>';
        }).join('') +
        '<polyline class="tl-up" points="' + ys.map(function (y) { return X(y) + ',' + YF(FRONT[y]); }).join(' ') + '"/>' +
        '<polyline class="tl-dn" points="' + ys.map(function (y) { return X(y) + ',' + YP(PRICE[y]); }).join(' ') + '"/>' +
        '<circle cx="' + X(year) + '" cy="' + YF(FRONT[year]) + '" r="7" fill="#620d3c" stroke="#171413" stroke-width="2"/>' +
        '<circle cx="' + X(year) + '" cy="' + YP(PRICE[year]) + '" r="7" fill="#f1a222" stroke="#171413" stroke-width="2"/>' +
        '<text class="tl-lab up" x="' + (X(year) + 12) + '" y="' + (YF(FRONT[year]) + 4) + '">' + D.money(FRONT[year]) + '</text>' +
        '<text class="tl-lab dn" x="' + (X(year) + 12) + '" y="' + (YP(PRICE[year]) + 4) + '">$' + (PRICE[year] >= 1 ? PRICE[year].toFixed(0) : PRICE[year].toFixed(3)) + '/Mtok</text>' +
        [2020, 2022, 2024, 2026].map(function (y) {
          return '<text class="axis-label" x="' + X(y) + '" y="' + (CH - 14) + '" text-anchor="middle">' + y + '</text>';
        }).join('') +
        '<text class="axis-label" x="' + PL + '" y="' + (PT - 6) + '">COST TO BUILD THE FRONTIER \u2191</text>' +
        '<text class="axis-label" x="' + (CW - PR) + '" y="' + (CH - PB + 26) + '" text-anchor="end">PRICE OF YESTERDAY\u2019S FRONTIER \u2193</text>' +
        '</svg>';

      var gap = (FRONT[year] / FRONT[2020]) * (PRICE[2020] / PRICE[year]);
      say.innerHTML = '<b>' + year + '.</b> Building the frontier costs ' + D.money(FRONT[year]) +
        '. Buying capability that was frontier-grade in 2020 costs $' + (PRICE[year] >= 1 ? PRICE[year].toFixed(0) : PRICE[year].toFixed(3)) +
        ' per million tokens. Since 2020 the two have diverged by a factor of about <b>' +
        (gap >= 1e6 ? (gap / 1e6).toFixed(0) + ' million' : gap.toLocaleString('en-US', { maximumFractionDigits: 0 })) + '</b>. ' +
        (year <= 2021 ? 'At this point both numbers still look like the same industry.'
         : year <= 2023 ? 'The lines have separated. Building and using are becoming different businesses with different economics.'
         : 'By now they are barely related. A country priced out of the first curve is doing better every year on the second, and that is the whole argument for weighting deployment over frontier ambition.');
    }

    function stop() { if (playing) { clearInterval(playing); playing = null; ctl.querySelector('.tl-play').textContent = 'Play'; } }
    ctl.querySelector('.tl-play').addEventListener('click', function () {
      if (playing) { stop(); return; }
      this.textContent = 'Pause';
      if (year >= 2026) year = 2020;
      playing = setInterval(function () { year++; if (year >= 2026) { year = 2026; stop(); } render(); }, 750);
    });
    ctl.querySelector('.tl-s').addEventListener('input', function () { stop(); year = +this.value; render(); });
    render();
  });

})(window.D);
