/* =========================================================================
   widgets-serve.js — interactive pieces for chapters 03, 04 and 05.
   Requires widgets-train.js for the shared helpers and the registry.
   ========================================================================= */

(function (T) {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =========================================================================
     PREFILL AND DECODE — the two phases of one request
     ========================================================================= */

  T.widget('phases', function (node) {
    var prompt = ['What', ' does', ' the', ' 2019', ' ethanol', ' import', ' restriction', ' do', '?'];
    var reply = ['It', ' bars', ' ethanol', ' imports', ' for', ' fuel', ' blending', '.'];
    var body = T.shell(node, 'Watch one request being answered', 'Press run',
      '<div class="row"><button class="btn btn-s ph-run" type="button">Run the request</button>' +
      '<span class="lab-msg ph-msg">Idle.</span></div>' +
      '<div class="lab-out"><span class="meta">Phase 1 \u00b7 Prefill \u00b7 the whole prompt in one pass</span>' +
      '<div class="tok-row ph-p" style="margin-top:9px"></div></div>' +
      '<div class="lab-out"><span class="meta">Phase 2 \u00b7 Decode \u00b7 one token, then the next</span>' +
      '<div class="tok-row ph-a" style="margin-top:9px;min-height:30px"></div></div>' +
      '<div class="split-3 ph-stats"></div>',
      'Timings are schematic, chosen to show the shape rather than any real system. Mechanism: Austin et al., ' +
      'How To Scale Your Model, ch. 7; Pope et al., arXiv:2211.05102.');
    var pRow = body.querySelector('.ph-p'), aRow = body.querySelector('.ph-a'),
        msg = body.querySelector('.ph-msg'), stats = body.querySelector('.ph-stats'),
        btn = body.querySelector('.ph-run'), timers = [];

    function reset() {
      timers.forEach(clearTimeout); timers = [];
      pRow.innerHTML = prompt.map(function (t) { return '<span class="tok tok-ghost">' + T.esc(t.replace(/ /g, '\u00b7')) + '</span>'; }).join('');
      aRow.innerHTML = '';
      stats.innerHTML = '';
      msg.textContent = 'Idle.';
    }
    function stat(a, b, c) {
      stats.innerHTML =
        '<div><div class="kpi kpi-gold">' + a + '</div><div class="meta">Time to first token</div></div>' +
        '<div><div class="kpi kpi-gold">' + b + '</div><div class="meta">Time per output token</div></div>' +
        '<div><div class="kpi kpi-gold">' + c + '</div><div class="meta">Passes over the weights</div></div>';
    }
    function run() {
      reset();
      btn.disabled = true;
      msg.textContent = 'Prefill: all ' + prompt.length + ' prompt tokens at once. Limited by arithmetic.';
      var d = reduce ? 0 : 1;
      timers.push(setTimeout(function () {
        pRow.innerHTML = prompt.map(function (t) { return '<span class="tok tok-gold">' + T.esc(t.replace(/ /g, '\u00b7')) + '</span>'; }).join('');
        msg.textContent = 'Decode: one pass over every weight, per token. Limited by memory bandwidth.';
        reply.forEach(function (tk, i) {
          timers.push(setTimeout(function () {
            aRow.insertAdjacentHTML('beforeend', '<span class="tok tok-wine">' + T.esc(tk.replace(/ /g, '\u00b7')) + '</span>');
            if (i === reply.length - 1) {
              msg.textContent = 'Done. One pass read the prompt; ' + reply.length + ' more passes wrote the reply.';
              btn.disabled = false;
              stat('1 pass', '1 pass each', String(1 + reply.length));
            }
          }, 380 * d * (i + 1)));
        });
      }, 700 * d));
    }
    btn.addEventListener('click', run);
    reset();
  });

  /* =========================================================================
     KV CACHE — the calculator
     ========================================================================= */

  T.widget('kvcache', function (node) {
    var CTX = [1024, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576];
    var body = T.shell(node, 'What one conversation costs in memory', 'Move the dials',
      '<div class="lab-controls">' +
        '<div class="field"><label for="kv-ctx">Context length <span class="val" id="kv-ctxv"></span></label><input id="kv-ctx" type="range" min="0" max="9" value="6"></div>' +
        '<div class="field"><label for="kv-lay">Layers <span class="val" id="kv-layv"></span></label><input id="kv-lay" type="range" min="16" max="126" value="80"></div>' +
        '<div class="field"><label for="kv-kvh">Key-value heads <span class="val" id="kv-kvhv"></span></label><input id="kv-kvh" type="range" min="1" max="64" value="8"></div>' +
        '<div class="field"><label for="kv-dim">Head dimension <span class="val" id="kv-dimv"></span></label><input id="kv-dim" type="range" min="64" max="256" step="32" value="128"></div>' +
        '<div class="field"><label for="kv-byt">Bytes per value <span class="val" id="kv-bytv"></span></label><input id="kv-byt" type="range" min="1" max="2" value="2"></div>' +
        '<div class="field"><label for="kv-usr">Concurrent requests <span class="val" id="kv-usrv"></span></label><input id="kv-usr" type="range" min="1" max="64" value="1"></div>' +
      '</div>' +
      '<div class="kv-bars"></div>' +
      '<div class="lab-out kv-out"></div>',
      'Own calculation. Per token: 2 \u00d7 layers \u00d7 key-value heads \u00d7 head dimension \u00d7 bytes. Gigabytes are decimal (\u00f7 10\u2079). ' +
      'Weights are held at 2 bytes per parameter for a 70-billion-parameter model, so 140 GB. Cross-check on the general finding that cache ' +
      'memory can exceed weight memory at long context: industry engineering analyses, 2026, which are not independently reproducible.');

    var els = {};
    ['ctx', 'lay', 'kvh', 'dim', 'byt', 'usr'].forEach(function (k) {
      els[k] = body.querySelector('#kv-' + k); els[k + 'v'] = body.querySelector('#kv-' + k + 'v');
      els[k].addEventListener('input', render);
    });
    var bars = body.querySelector('.kv-bars'), out = body.querySelector('.kv-out');
    var WEIGHTS_GB = 140;

    function fmtCtx(n) { return n >= 1048576 ? '1m' : n >= 1024 ? (n / 1024) + 'k' : String(n); }

    function render() {
      var ctx = CTX[+els.ctx.value], lay = +els.lay.value, kvh = +els.kvh.value,
          dim = +els.dim.value, byt = +els.byt.value, usr = +els.usr.value;
      var perTok = 2 * lay * kvh * dim * byt;           // bytes
      var gb = (perTok * ctx * usr) / 1e9;
      var crossover = (WEIGHTS_GB * 1e9) / (perTok * usr);

      els.ctxv.textContent = fmtCtx(ctx) + ' tokens';
      els.layv.textContent = lay; els.kvhv.textContent = kvh; els.dimv.textContent = dim;
      els.bytv.textContent = byt === 2 ? '2 (16-bit)' : '1 (8-bit)';
      els.usrv.textContent = usr;

      var max = Math.max(gb, WEIGHTS_GB);
      bars.innerHTML =
        T.bar('KV cache', (gb / max) * 100, gb.toFixed(1) + ' GB', 'gold') +
        T.bar('The weights', (WEIGHTS_GB / max) * 100, WEIGHTS_GB + ' GB', '');

      out.innerHTML = '<dl class="deflist">' +
        '<dt>Per token</dt><dd>' + (perTok / 1e6).toFixed(2) + ' MB of accelerator memory, added by every single token and never given back until the request ends</dd>' +
        '<dt>This request</dt><dd>' + gb.toFixed(1) + ' GB for ' + fmtCtx(ctx) + ' tokens' + (usr > 1 ? ' \u00d7 ' + usr + ' concurrent requests' : '') + '</dd>' +
        '<dt>Crossover</dt><dd>At about ' + (crossover >= 1e6 ? (crossover / 1e6).toFixed(2) + ' million' : Math.round(crossover / 1000) + ' thousand') +
          ' tokens, the cache' + (usr > 1 ? 's' : '') + ' outgrow' + (usr > 1 ? '' : 's') + ' the model itself. Beyond that point, memory is dominated by the conversation rather than by the weights.</dd>' +
        '<dt>What it explains</dt><dd>' + (gb > WEIGHTS_GB
          ? 'Why long-context requests are served at low concurrency, and why cache compression is an active research area.'
          : 'Why batch size is capped: multiply this figure by the number of users sharing the machine.') + '</dd>' +
        '</dl>';
    }
    render();
  });

  /* =========================================================================
     ATTENTION DESIGNS
     ========================================================================= */

  T.widget('attention', function (node) {
    var rows = [
      { c: 'MHA', n: 'Multi-head attention', w: 'Every query head keeps its own keys and values', r: 100, s: 'The original design; now rare at scale' },
      { c: 'GQA', n: 'Grouped-query attention', w: 'Several query heads share one set of keys and values', r: 12.5, s: 'The current default in most open models' },
      { c: 'MQA', n: 'Multi-query attention', w: 'All query heads share a single set', r: 1.6, s: 'Fastest to serve, with some quality cost' },
      { c: 'MLA', n: 'Multi-head latent attention', w: 'Keys and values are compressed into a smaller latent form', r: 4, s: 'Used by DeepSeek; more complex to implement' }
    ];
    var body = T.shell(node, 'Four ways to shrink the cache', 'Tap a design',
      '<div class="at-list"></div><div class="lab-out at-out"></div>',
      'Bar lengths are illustrative ratios for a fixed number of query heads, not measurements. Mechanism: Austin et al., ' +
      'How To Scale Your Model, ch. 4; Shazeer, \u2018Fast Transformer Decoding\u2019, arXiv:1911.02150; Ainslie et al., \u2018GQA\u2019, arXiv:2305.13245.');
    var list = body.querySelector('.at-list'), out = body.querySelector('.at-out');
    list.style.cssText = 'border-top:1px solid rgba(23,20,19,0.16);border-left:1px solid rgba(23,20,19,0.16)';

    rows.forEach(function (r, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.style.cssText = 'display:grid;grid-template-columns:56px 1fr 110px;gap:14px;align-items:center;width:100%;text-align:left;' +
        'padding:13px 16px;background:#fff;border:none;border-right:1px solid rgba(23,20,19,0.16);' +
        'border-bottom:1px solid rgba(23,20,19,0.16);cursor:pointer;color:#171413';
      b.innerHTML = '<span class="code-no">' + r.c + '</span>' +
        '<span style="font-size:14.5px">' + r.n + '</span>' +
        '<span><span style="display:block;height:12px;background:rgba(23,20,19,0.08)">' +
        '<span style="display:block;height:100%;width:' + r.r + '%;background:#620d3c"></span></span></span>';
      b.addEventListener('click', function () { pick(i); });
      list.appendChild(b);
    });
    function pick(i) {
      var r = rows[i];
      Array.prototype.forEach.call(list.children, function (c, j) { c.style.background = j === i ? '#f5e6ec' : '#fff'; });
      out.innerHTML = '<span class="code-no">' + r.c + ' \u00b7 ' + r.n.toUpperCase() + '</span>' +
        '<dl class="deflist" style="margin-top:12px"><dt>What it does</dt><dd>' + r.w + '</dd>' +
        '<dt>Cache size</dt><dd>About ' + r.r + '% of the multi-head baseline, on these illustrative ratios</dd>' +
        '<dt>Status</dt><dd>' + r.s + '</dd></dl>' +
        '<p class="body-s" style="margin-top:12px">This is an architecture choice made before training. It fixes the serving cost for the model\u2019s whole life, and no amount of serving engineering fully undoes it.</p>';
    }
    pick(1);
  });

  /* =========================================================================
     PAGED ATTENTION — reservation against paging
     ========================================================================= */

  T.widget('paged', function (node) {
    var body = T.shell(node, 'Reserve for the worst case, or page it', 'Move the dial',
      '<div class="field"><label for="pg-len">How long the replies actually turn out to be <span class="val" id="pg-lenv"></span></label>' +
      '<input id="pg-len" type="range" min="5" max="100" value="22"></div>' +
      '<div class="split-even">' +
        '<div><span class="meta">Before \u00b7 one contiguous reservation per request</span><div class="pg-a" style="margin-top:10px"></div></div>' +
        '<div><span class="meta">After \u00b7 fixed-size blocks, anywhere in memory</span><div class="pg-b" style="margin-top:10px"></div></div>' +
      '</div>' +
      '<div class="lab-out pg-out"></div>',
      'Schematic. Mechanism and the reported two-to-four-fold throughput gain: Kwon et al., \u2018Efficient Memory Management for Large Language ' +
      'Model Serving with PagedAttention\u2019, SOSP 2023, arXiv:2309.06180. The figure is the authors\u2019 own measurement.');
    var slider = body.querySelector('#pg-len'), lenv = body.querySelector('#pg-lenv'),
        A = body.querySelector('.pg-a'), B = body.querySelector('.pg-b'), out = body.querySelector('.pg-out');

    function grid(cells) {
      return '<div style="display:grid;grid-template-columns:repeat(20,1fr);gap:2px">' + cells.join('') + '</div>';
    }
    function cell(fill) {
      return '<span style="display:block;padding-top:100%;background:' + fill + ';border:1px solid rgba(23,20,19,0.16)"></span>';
    }
    function render() {
      var pct = +slider.value;
      lenv.textContent = pct + '% of the reserved space';
      var TOTAL = 60, perReq = 20, used = Math.max(1, Math.round(perReq * pct / 100));
      var cols = ['#620d3c', '#b8809f', '#2f6b6b'];
      var a = [], b = [];
      for (var r = 0; r < 3; r++) {
        for (var i = 0; i < perReq; i++) a.push(cell(i < used ? cols[r] : '#F7F5F2'));
      }
      var packed = [];
      for (var r2 = 0; r2 < 3; r2++) for (var j = 0; j < used; j++) packed.push(cols[r2]);
      for (var k = 0; k < TOTAL; k++) b.push(cell(k < packed.length ? packed[k] : '#fff'));
      A.innerHTML = grid(a); B.innerHTML = grid(b);
      var wasted = TOTAL - used * 3;
      out.innerHTML = '<dl class="deflist">' +
        '<dt>Reserved</dt><dd>' + TOTAL + ' blocks, sized for the longest reply each request might produce</dd>' +
        '<dt>Actually used</dt><dd>' + (used * 3) + ' blocks</dd>' +
        '<dt>Wasted by reserving</dt><dd>' + wasted + ' blocks, or ' + Math.round(wasted / TOTAL * 100) + '% of expensive accelerator memory sitting idle</dd>' +
        '<dt>With paging</dt><dd>Those ' + wasted + ' blocks are free and reusable, so more requests fit on the same machine. ' +
        'A lookup table maps each request\u2019s sequence to scattered physical blocks, exactly as an operating system maps a program\u2019s addresses to pages.</dd>' +
        '</dl>' +
        '<p class="body-s" style="margin-top:12px">There is a second benefit that matters more than it sounds. Because blocks are separable, two requests beginning with the same text can point at the same blocks instead of duplicating them. That is what prefix caching is built on.</p>';
    }
    slider.addEventListener('input', render);
    render();
  });

  /* =========================================================================
     BATCHING — static against continuous
     ========================================================================= */

  T.widget('batching', function (node) {
    var lens = [3, 12, 5, 9];
    var body = T.shell(node, 'Keeping the accelerator busy', 'Compare the two',
      '<div class="seg bt-seg"><button type="button" data-m="static" aria-pressed="true">Static batching</button>' +
      '<button type="button" data-m="cont" aria-pressed="false">Continuous batching</button></div>' +
      '<div class="bt-view"></div><div class="lab-out bt-out"></div>',
      'Timelines are schematic. Mechanism: Yu et al., \u2018Orca\u2019, OSDI 2022; Kwon et al., arXiv:2309.06180; Agrawal et al., \u2018Sarathi-Serve\u2019, OSDI 2024.');
    var view = body.querySelector('.bt-view'), out = body.querySelector('.bt-out'), mode = 'static';

    function render() {
      var span = 12, rows = '';
      for (var i = 0; i < 4; i++) {
        var cells = '';
        for (var t = 0; t < span; t++) {
          var fill = '#fff', label = '';
          if (mode === 'static') {
            if (t < lens[i]) fill = '#620d3c';
            else fill = '#F7F5F2';
          } else {
            var used = 0, seq = [lens[i]], extra = [4, 0, 6, 2][i];
            if (t < lens[i]) fill = '#620d3c';
            else if (t < lens[i] + extra) fill = '#f1a222';
            else fill = '#fff';
          }
          cells += '<span style="display:block;height:20px;background:' + fill + ';border:1px solid rgba(23,20,19,0.16)"></span>';
        }
        rows += '<div style="display:grid;grid-template-columns:70px repeat(' + span + ',1fr);gap:2px;align-items:center;margin-bottom:4px">' +
          '<span class="meta" style="font-size:9px">' + (mode === 'static' ? 'REQ ' : 'SLOT ') + (i + 1) + '</span>' + cells + '</div>';
      }
      view.innerHTML = '<span class="meta" style="display:block;margin-bottom:8px">Time \u2192</span>' + rows +
        '<span class="meta" style="display:block;margin-top:6px">' +
        (mode === 'static' ? 'Wine: producing tokens. Warm grey: reserved but idle, waiting for the slowest reply.'
                           : 'Wine: the original request. Marigold: a new request that entered the moment a slot came free.') + '</span>';
      var busy = mode === 'static'
        ? lens.reduce(function (a, b) { return a + b; }, 0) / (4 * 12)
        : (lens.reduce(function (a, b) { return a + b; }, 0) + 12) / (4 * 12);
      out.innerHTML = '<dl class="deflist">' +
        '<dt>Utilisation</dt><dd>' + Math.round(busy * 100) + '% of the available slot-time is producing tokens</dd>' +
        '<dt>Why it matters</dt><dd>' + (mode === 'static'
          ? 'One request may need twelve tokens and the next twelve thousand. If the batch is fixed when it starts, every request in it waits for the slowest, and expensive hardware idles behind one long reply.'
          : 'A finished slot is refilled at once. No scheduler can know reply lengths in advance, so the only robust answer is to refill capacity continuously rather than plan a batch.') + '</dd>' +
        '<dt>Related</dt><dd>Chunked prefill interleaves pieces of a long prompt with ongoing decoding, so one very long prompt cannot stall everyone else.</dd>' +
        '</dl>';
    }
    Array.prototype.forEach.call(body.querySelectorAll('.bt-seg button'), function (b) {
      b.addEventListener('click', function () {
        mode = b.getAttribute('data-m');
        Array.prototype.forEach.call(body.querySelectorAll('.bt-seg button'), function (o) {
          o.setAttribute('aria-pressed', o === b ? 'true' : 'false');
        });
        render();
      });
    });
    render();
  });

  /* =========================================================================
     PREFIX CACHING — the line on your bill
     ========================================================================= */

  T.widget('prefix', function (node) {
    var body = T.shell(node, 'Text the system has already read', 'Switch the cache',
      '<div class="lab-controls">' +
        '<div class="field"><label for="px-sys">Shared opening, in tokens <span class="val" id="px-sysv"></span></label><input id="px-sys" type="range" min="500" max="20000" step="500" value="8000"></div>' +
        '<div class="field"><label for="px-new">New text per turn <span class="val" id="px-newv"></span></label><input id="px-new" type="range" min="20" max="2000" step="20" value="200"></div>' +
        '<div class="field"><label for="px-turn">Turns in the task <span class="val" id="px-turnv"></span></label><input id="px-turn" type="range" min="1" max="40" value="12"></div>' +
      '</div>' +
      '<div class="px-view"></div><div class="lab-out px-out"></div>',
      'Prices are illustrative: input tokens at one unit per thousand, cached input at a tenth of that. Real rates vary by provider and should be ' +
      'read from current documentation. Mechanism builds on PagedAttention block sharing, arXiv:2309.06180.');
    var sys = body.querySelector('#px-sys'), nw = body.querySelector('#px-new'), tn = body.querySelector('#px-turn'),
        view = body.querySelector('.px-view'), out = body.querySelector('.px-out');
    [sys, nw, tn].forEach(function (el) { el.addEventListener('input', render); });

    function render() {
      var S = +sys.value, N = +nw.value, TN = +tn.value;
      body.querySelector('#px-sysv').textContent = S.toLocaleString('en-IN');
      body.querySelector('#px-newv').textContent = N.toLocaleString('en-IN');
      body.querySelector('#px-turnv').textContent = TN;

      var without = 0, with_ = 0, cached = 0;
      for (var i = 0; i < TN; i++) {
        var prior = S + i * N;                 // the transcript so far
        without += prior + N;
        with_ += N;                            // only the new text is fresh
        cached += prior;
      }
      var costWithout = without / 1000, costWith = (with_ / 1000) + (cached / 1000) * 0.1;

      var rows = [0, 1, 2].map(function (i) {
        var prior = S + i * N;
        return '<div style="display:grid;grid-template-columns:70px 1fr;gap:12px;align-items:center;margin-bottom:6px">' +
          '<span class="meta" style="font-size:9px">TURN ' + (i + 1) + '</span>' +
          '<span style="display:flex;height:22px">' +
            '<span style="flex:' + prior + ';background:' + (i === 0 ? '#620d3c' : '#f5e6ec') + ';border:1px solid rgba(23,20,19,0.16)"></span>' +
            '<span style="flex:' + Math.max(N, prior * 0.03) + ';background:#f1a222;border:1px solid rgba(23,20,19,0.16)"></span>' +
          '</span></div>';
      }).join('');
      view.innerHTML = rows + '<span class="meta" style="display:block;margin-top:4px">' +
        'Wine: computed in full, once. Wine wash: read from the cache. Marigold: new text, computed every time.</span>';

      out.innerHTML = '<dl class="deflist">' +
        '<dt>Without caching</dt><dd>' + without.toLocaleString('en-IN') + ' input tokens billed at full rate, for ' + costWithout.toFixed(1) + ' units</dd>' +
        '<dt>With caching</dt><dd>' + with_.toLocaleString('en-IN') + ' fresh and ' + cached.toLocaleString('en-IN') + ' cached, for ' + costWith.toFixed(1) + ' units</dd>' +
        '<dt>Difference</dt><dd>About ' + (costWithout / Math.max(costWith, 0.001)).toFixed(1) + ' times cheaper on these illustrative rates</dd>' +
        '<dt>How to exploit it</dt><dd>Keep the stable material at the start of the prompt and the variable material at the end. A prefix only matches from the first token onwards.</dd>' +
        '<dt>Worth checking</dt><dd>Cached prefixes are held in shared infrastructure. Providers document retention and isolation differently, which is worth reading before sensitive material goes into a system prompt.</dd>' +
        '</dl>';
    }
    render();
  });

  /* =========================================================================
     SPECULATIVE DECODING
     ========================================================================= */

  T.widget('spec', function (node) {
    var rounds = [
      { d: [' the', ' ethanol', ' blending', ' target'], keep: 3 },
      { d: [' was', ' raised', ' to', ' twenty'], keep: 4 },
      { d: [' per', ' cent', ' in', ' 2022'], keep: 2 }
    ];
    var body = T.shell(node, 'Guess four, check them all at once', 'Step through',
      '<div class="row"><button class="btn btn-s sp-step" type="button">Run a round</button>' +
      '<button class="btn btn-s btn-ghost sp-reset" type="button">Reset</button></div>' +
      '<div class="lab-out sp-view"></div><div class="split-3 sp-stats"></div>',
      'Mechanism: Leviathan et al., \u2018Fast Inference from Transformers via Speculative Decoding\u2019, arXiv:2211.17192. The batch-size guidance ' +
      'below is drawn from vendor engineering guides, 2026, and is not independently reproduced.');
    var view = body.querySelector('.sp-view'), stats = body.querySelector('.sp-stats'), r = 0, produced = 0, passes = 0;

    function render(round) {
      var html = '';
      if (round) {
        html += '<span class="meta">Step 1 \u00b7 a small draft model proposes four tokens</span><div class="tok-row" style="margin:8px 0 16px">' +
          round.d.map(function (t) { return '<span class="tok tok-gold">' + T.esc(t.replace(/ /g, '\u00b7')) + '</span>'; }).join('') + '</div>' +
          '<span class="meta">Step 2 \u00b7 the large model checks all four in one pass it was going to make anyway</span>' +
          '<div class="tok-row" style="margin:8px 0 16px">' +
          round.d.map(function (t, i) {
            var ok = i < round.keep;
            return '<span class="tok ' + (ok ? 'tok-wine' : 'tok-ghost') + '">' + T.esc(t.replace(/ /g, '\u00b7')) +
              ' <b style="font-weight:400;font-size:9px;letter-spacing:.1em">' + (ok ? 'KEPT' : 'REJECTED') + '</b></span>';
          }).join('') + '</div>' +
          '<span class="meta">Step 3 \u00b7 keep the accepted prefix, discard the rest</span>' +
          '<p class="body-s" style="margin-top:8px">' + round.keep + ' tokens produced for the cost of roughly one pass. The rejected token is simply regenerated, so the output is identical to what the large model would have produced alone.</p>';
      } else {
        html = '<span class="meta">Ready. Press run.</span>';
      }
      view.innerHTML = html;
      stats.innerHTML =
        '<div><div class="kpi kpi-gold">' + produced + '</div><div class="meta">Tokens produced</div></div>' +
        '<div><div class="kpi kpi-gold">' + passes + '</div><div class="meta">Large-model passes</div></div>' +
        '<div><div class="kpi kpi-gold">' + (passes ? (produced / passes).toFixed(2) : '0.00') + '</div><div class="meta">Tokens per pass</div></div>';
    }
    body.querySelector('.sp-step').addEventListener('click', function () {
      var round = rounds[r % rounds.length]; r++;
      produced += round.keep; passes += 1;
      render(round);
    });
    body.querySelector('.sp-reset').addEventListener('click', function () { r = 0; produced = 0; passes = 0; render(null); });
    render(null);
  });

  /* =========================================================================
     MIXTURE OF EXPERTS — total against active
     ========================================================================= */

  T.widget('moe', function (node) {
    var body = T.shell(node, 'Most of the model sits out most of the time', 'Send a token',
      '<div class="row"><button class="btn btn-s mo-send" type="button">Send a token through</button>' +
      '<span class="lab-msg mo-msg">No token routed yet.</span></div>' +
      '<div class="mo-grid"></div>' +
      '<div class="mo-bars"></div><div class="lab-out mo-out"></div>',
      'Illustrative shape: eight experts, two selected per token. Mechanism and the batch-size arithmetic for serving: ' +
      'Austin et al., How To Scale Your Model, ch. 4, question 8, and ch. 7.');
    var grid = body.querySelector('.mo-grid'), msg = body.querySelector('.mo-msg'),
        bars = body.querySelector('.mo-bars'), out = body.querySelector('.mo-out');
    var words = ['ethanol', 'blending', 'programme', 'restriction', 'demand', 'feedstock', 'policy', 'target'];
    var active = [];

    grid.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid rgba(23,20,19,0.16);border-left:1px solid rgba(23,20,19,0.16);margin-top:4px';

    function render(word) {
      grid.innerHTML = '';
      for (var i = 0; i < 8; i++) {
        var on = active.indexOf(i) > -1;
        grid.insertAdjacentHTML('beforeend',
          '<div style="padding:14px 12px;background:' + (on ? '#fcf0d9' : '#fff') + ';border-right:1px solid rgba(23,20,19,0.16);border-bottom:1px solid rgba(23,20,19,0.16)">' +
          '<span class="code-no">EXPERT ' + (i + 1) + '</span>' +
          '<span class="meta" style="display:block;margin-top:6px;font-size:9px;color:' + (on ? '#171413' : 'rgba(23,20,19,0.5)') + '">' +
          (on ? 'ACTIVE' : 'IDLE') + '</span></div>');
      }
      bars.innerHTML =
        T.bar('Total parameters', 100, '400 bn', '') +
        T.bar('Active per token', 25, '100 bn', 'gold');
      out.innerHTML = '<dl class="deflist">' +
        '<dt>Total</dt><dd>What the headline says. It decides how much memory the weights occupy, which is a real constraint.</dd>' +
        '<dt>Active</dt><dd>What each token actually passes through. It decides the arithmetic per token, and therefore the speed and much of the cost.</dd>' +
        '<dt>What to ask</dt><dd>Given a total, ask what fraction is active. Without that, a parameter count says little about either capability or cost.</dd>' +
        '<dt>For compute assessments</dt><dd>Comparing a mixture-of-experts model against a dense one on total parameters alone overstates its compute per token, and understates its memory relative to its speed.</dd>' +
        '</dl>';
      msg.textContent = word ? 'Token \u201c' + word + '\u201d routed to experts ' + active.map(function (i) { return i + 1; }).join(' and ') + '.' : 'No token routed yet.';
    }
    body.querySelector('.mo-send').addEventListener('click', function () {
      var w = words[Math.floor(Math.random() * words.length)];
      active = [];
      while (active.length < 2) {
        var pick = Math.floor(Math.random() * 8);
        if (active.indexOf(pick) === -1) active.push(pick);
      }
      active.sort();
      render(w);
    });
    render(null);
  });

  /* =========================================================================
     ANSWER-TIME BUDGET
     ========================================================================= */

  T.widget('budget', function (node) {
    var body = T.shell(node, 'The same weights, three budgets', 'Move the dial',
      '<div class="field"><label for="bd">Compute allowed at answer time <span class="val" id="bdv"></span></label>' +
      '<input id="bd" type="range" min="0" max="100" value="0"></div>' +
      '<div class="bd-bars"></div><div class="lab-out bd-out"></div>',
      'Bar lengths are illustrative and are not measurements. That reported accuracy improves with answer-time compute, with diminishing ' +
      'returns and unevenly across task types, follows Lambert, arXiv:2504.12501, ch. 7, and the scaling curves published with OpenAI\u2019s o1.');
    var el = body.querySelector('#bd'), v = body.querySelector('#bdv'),
        bars = body.querySelector('.bd-bars'), out = body.querySelector('.bd-out');

    var CFG = [
      { at: 0, n: 'Configuration A \u00b7 minimum budget', d: 'No extended thinking, one sample, no tools.', acc: 30, cost: 1, lat: 'Fast' },
      { at: 34, n: 'Configuration B \u00b7 extended thinking', d: 'A long reasoning chain before answering. Cost scales with the length of the chain, and the chain is billed even where it is hidden from the user.', acc: 58, cost: 14, lat: 'Slower' },
      { at: 67, n: 'Configuration C \u00b7 thinking, sampling and tools', d: 'Many attempts, a verifier, a search loop, retries. Cost is unpredictable in advance, which is what makes agentic products hard to price.', acc: 78, cost: 90, lat: 'Slowest, and variable' }
    ];
    function render() {
      var x = +el.value;
      var cfg = CFG[0];
      CFG.forEach(function (c) { if (x >= c.at) cfg = c; });
      var frac = x / 100;
      var acc = 30 + 52 * (1 - Math.exp(-3.1 * frac));      // diminishing returns
      var cost = 1 + 119 * Math.pow(frac, 2.1);
      v.textContent = x === 0 ? 'minimum' : x + ' of 100';
      bars.innerHTML =
        T.bar('Answers correct', acc, Math.round(acc) + '%', '') +
        T.bar('Compute spent', Math.min(100, cost), '\u00d7' + cost.toFixed(0), 'gold');
      out.innerHTML = '<span class="code-no">' + cfg.n.toUpperCase() + '</span>' +
        '<p class="body-s" style="margin:10px 0 12px">' + cfg.d + '</p>' +
        '<dl class="deflist"><dt>Latency</dt><dd>' + cfg.lat + '</dd>' +
        '<dt>What this means</dt><dd>Capability is no longer a fixed property of the released weights. It is a function of the weights and the compute budget allowed at answer time \u2014 and the budget is set by whoever deploys the model, not by whoever trained it.</dd></dl>';
    }
    el.addEventListener('input', render);
    render();
  });

  /* =========================================================================
     THE SERVING STACK
     ========================================================================= */

  T.widget('stack', function (node) {
    var L = [
      { c: 'L6', n: 'Product and interface', d: 'Sets how much answer-time compute a user may spend, and what the reply looks like', o: 'The application developer', p: 'Rarely the subject of any instrument, though it sets the budget that decides deployed capability.' },
      { c: 'L5', n: 'API and gateway', d: 'Authentication, rate limits, safety filtering, usage metering and billing', o: 'The model provider or a reseller', p: 'Safety obligations are usually written for this layer.' },
      { c: 'L4', n: 'Serving engine', d: 'Scheduling, continuous batching, paged and prefix caching, speculation', o: 'vLLM, SGLang, TensorRT-LLM and similar', p: 'Where every technique in this chapter lives. It changes how much capability a given quantity of hardware delivers, and is rarely regulated at all.' },
      { c: 'L3', n: 'Kernels and runtime', d: 'The hand-tuned routines that execute attention and matrix multiplication', o: 'Chip vendors and framework authors', p: 'Occasionally reached through software export rules.' },
      { c: 'L2', n: 'Accelerators and interconnect', d: 'Memory capacity, memory bandwidth, and the links between chips', o: 'Chip designers and foundries', p: 'Export controls act here. Compute thresholds act here and on layer 1.' },
      { c: 'L1', n: 'Data centre, power and cooling', d: 'Where the machines physically are, and how much electricity they can draw', o: 'Operators, utilities, planning authorities', p: 'Reached by siting, energy and permitting policy.' }
    ];
    var body = T.shell(node, 'Six layers, and who operates each', 'Tap a layer',
      '<div class="sk-list"></div><div class="lab-out sk-out"></div>',
      'Layer structure assembled for the source deck from Austin et al., How To Scale Your Model, chs. 7-9; and engine documentation for vLLM, SGLang and TensorRT-LLM.');
    var list = body.querySelector('.sk-list'), out = body.querySelector('.sk-out');
    list.style.cssText = 'border-top:1px solid rgba(23,20,19,0.16);border-left:1px solid rgba(23,20,19,0.16)';
    L.forEach(function (l, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.style.cssText = 'display:grid;grid-template-columns:44px 1fr;gap:14px;width:100%;text-align:left;padding:13px 16px;background:#fff;' +
        'border:none;border-right:1px solid rgba(23,20,19,0.16);border-bottom:1px solid rgba(23,20,19,0.16);cursor:pointer;color:#171413';
      b.innerHTML = '<span class="code-no">' + l.c + '</span>' +
        '<span><span style="display:block;font-size:15px;font-weight:500">' + l.n + '</span>' +
        '<span class="meta" style="text-transform:none;letter-spacing:0;font-size:12px">' + l.o + '</span></span>';
      b.addEventListener('click', function () { pick(i); });
      list.appendChild(b);
    });
    function pick(i) {
      var l = L[i];
      Array.prototype.forEach.call(list.children, function (c, j) { c.style.background = j === i ? '#f5e6ec' : '#fff'; });
      out.innerHTML = '<span class="code-no">' + l.c + ' \u00b7 ' + l.n.toUpperCase() + '</span>' +
        '<dl class="deflist" style="margin-top:12px"><dt>Decides</dt><dd>' + l.d + '</dd>' +
        '<dt>Operated by</dt><dd>' + l.o + '</dd>' +
        '<dt>Policy angle</dt><dd>' + l.p + '</dd></dl>';
    }
    pick(2);
  });

  /* =========================================================================
     GLOSSARY
     ========================================================================= */

  var GLOSS = [
    ['SFT', 'Supervised fine-tuning. Training on prompt-and-answer pairs so the model copies the answer.', 'train'],
    ['RLHF', 'Reinforcement learning from human feedback. Preference training with a learned reward model in the loop.', 'train'],
    ['RLAIF', 'The same, with a model rather than a human supplying the rankings.', 'train'],
    ['DPO', 'Direct preference optimisation. Trains on preference pairs directly, with no reward model and no generation.', 'train'],
    ['RLVR', 'Reinforcement learning with verifiable rewards. The reward comes from a program that checks the answer.', 'train'],
    ['REWARD MODEL', 'A model trained to predict which of two answers a human would prefer. Used as a stand-in judge.', 'train'],
    ['POLICY', 'The model being trained, in reinforcement-learning terminology.', 'train'],
    ['PPO', 'Proximal policy optimisation. A policy-gradient method using a separate network to predict expected score.', 'train'],
    ['GRPO', 'Group relative policy optimisation. Uses the average of a group of answers as the baseline instead.', 'train'],
    ['ROLLOUT', 'One generated attempt produced during training, so that it can be scored.', 'train'],
    ['REWARD HACKING', 'Scoring well on the measure without improving at the task the measure was standing in for.', 'train'],
    ['KL PENALTY', 'The term that penalises drift from the model as it was before this stage.', 'train'],
    ['DISTILLATION', 'Training a smaller model on a larger model\u2019s outputs.', 'train'],
    ['QUANTISATION', 'Storing weights, activations or cache entries in fewer bits.', 'train'],
    ['PREFILL', 'Processing the whole prompt in one pass. Limited by arithmetic throughput.', 'serve'],
    ['DECODE', 'Producing output one token at a time. Limited by memory bandwidth.', 'serve'],
    ['KV CACHE', 'The stored key and value vectors for tokens already processed, held so they need not be recomputed.', 'serve'],
    ['PAGED ATTENTION', 'Holding the cache in fixed-size blocks scattered through memory, as an operating system pages memory.', 'serve'],
    ['PREFIX CACHING', 'Reusing the cache entries of a shared opening across many requests. What cheap cached input tokens are.', 'serve'],
    ['CONTINUOUS BATCHING', 'Letting requests join and leave a batch mid-flight instead of fixing it at the start.', 'serve'],
    ['SPECULATIVE DECODING', 'A small model proposes several tokens; the large model verifies them in one pass.', 'serve'],
    ['GQA, MQA, MLA', 'Attention designs that shrink the cache by sharing or compressing keys and values.', 'serve'],
    ['MIXTURE OF EXPERTS', 'Splitting layers into blocks and routing each token to a few, so active parameters are far fewer than total.', 'serve'],
    ['TTFT, TPOT', 'Time to first token, and time per output token. The two halves of perceived speed.', 'serve'],
    ['GOODPUT', 'Throughput counting only requests that met their latency target.', 'serve'],
    ['ANSWER-TIME COMPUTE', 'Compute spent per request to improve the answer: longer thinking, more samples, tool loops.', 'serve'],
    ['TOKEN', 'A fragment of text, roughly three-quarters of an English word. Not a character and not a word.', 'train'],
    ['BASE MODEL', 'What pretraining produces. Continues text fluently; does not answer questions.', 'train']
  ];

  T.widget('glossary', function (node) {
    var body = T.shell(node, 'Every term in one place', 'Search it',
      '<div class="lab-controls" style="grid-template-columns:2fr 1fr">' +
        '<div class="field"><label for="gl-q">Search</label><input id="gl-q" type="text" placeholder="cache, reward, decode\u2026"></div>' +
        '<div class="field"><label>Show</label><div class="seg gl-seg">' +
          '<button type="button" data-f="all" aria-pressed="true">All</button>' +
          '<button type="button" data-f="train" aria-pressed="false">Training</button>' +
          '<button type="button" data-f="serve" aria-pressed="false">Serving</button>' +
        '</div></div>' +
      '</div><div class="gl-list"></div>',
      'Definitions follow Lambert, arXiv:2504.12501, App. A, and Austin et al., How To Scale Your Model, ch. 7, simplified for a non-specialist reader.');
    var q = body.querySelector('#gl-q'), list = body.querySelector('.gl-list'), filter = 'all';

    function render() {
      var term = q.value.trim().toLowerCase();
      var rows = GLOSS.filter(function (g) {
        if (filter !== 'all' && g[2] !== filter) return false;
        if (!term) return true;
        return (g[0] + ' ' + g[1]).toLowerCase().indexOf(term) > -1;
      });
      list.innerHTML = rows.length
        ? '<div style="border-top:2px solid #171413">' + rows.map(function (g) {
            return '<div style="display:grid;grid-template-columns:200px 1fr;gap:20px;padding:12px 0;border-bottom:1px solid rgba(23,20,19,0.16)">' +
              '<span class="meta" style="color:#620d3c">' + g[0] + '</span>' +
              '<span style="font-size:14px;line-height:1.55">' + g[1] + '</span></div>';
          }).join('') + '</div>'
        : '<p class="meta" style="padding-top:14px">No term matches that. Try a shorter word.</p>';
    }
    q.addEventListener('input', render);
    Array.prototype.forEach.call(body.querySelectorAll('.gl-seg button'), function (b) {
      b.addEventListener('click', function () {
        filter = b.getAttribute('data-f');
        Array.prototype.forEach.call(body.querySelectorAll('.gl-seg button'), function (o) {
          o.setAttribute('aria-pressed', o === b ? 'true' : 'false');
        });
        render();
      });
    });
    render();
  });

  /* =========================================================================
     THE QUIZ
     ========================================================================= */

  var QUIZ = [
    { q: 'A base model is given the question \u201cWhat does the 2019 ethanol import restriction do?\u201d What is it most likely to produce?',
      a: ['A clear two-sentence answer', 'Four more questions in the same style', 'A refusal', 'A tool call'], c: 1,
      w: 'Its corpus is full of lists of questions, so continuing with more questions is a faithful continuation. Answering rather than continuing is added in supervised fine-tuning.' },
    { q: 'During supervised fine-tuning, which tokens contribute to the loss?',
      a: ['All of them', 'Only the prompt tokens', 'Only the response tokens', 'A random half'], c: 2,
      w: 'The prompt is masked. Without that, the model learns to generate prompts as readily as answers.' },
    { q: 'A reward model gives higher scores to longer answers. What does the policy learn?',
      a: ['To answer more accurately', 'To pad', 'To refuse more often', 'Nothing, the effect cancels out'], c: 1,
      w: 'This is Goodhart\u2019s law inside a training loop. The proxy was adopted because the real objective cannot be observed at scale, and the model finds the gap.' },
    { q: 'What is the defining feature of reinforcement learning with verifiable rewards?',
      a: ['A larger reward model', 'A human in the loop at every step', 'A program decides whether the answer is right', 'A longer context window'], c: 2,
      w: 'The reward becomes a fact rather than an estimate. A unit test cannot be flattered by length or confident tone.' },
    { q: 'Where did the long reasoning chains in reasoning models come from?',
      a: ['Human experts wrote them as demonstrations', 'They emerged because longer attempts passed the checker more often', 'They were copied from textbooks', 'They were hand-coded rules'], c: 1,
      w: 'The behaviour was selected for, not taught. It also means the visible chain is not a reliable account of how the answer was reached.' },
    { q: 'GRPO removes one component that PPO needs. Which?',
      a: ['The reward model', 'The frozen reference copy', 'The value network that predicts the expected score', 'The prompt dataset'], c: 2,
      w: 'The group\u2019s own average supplies the baseline instead. That frees a large share of accelerator memory, which is much of why it spread.' },
    { q: 'Which phase of a request is limited by memory bandwidth rather than by arithmetic?',
      a: ['Prefill', 'Decode', 'Both equally', 'Neither'], c: 1,
      w: 'Each output token needs its own full pass over every weight, with very little arithmetic per pass. Prefill processes the whole prompt at once and is arithmetic-limited.' },
    { q: 'At long context, what happens to the KV cache for a single request?',
      a: ['It shrinks as the model settles', 'It stays fixed', 'It can grow larger than the model weights themselves', 'It moves to disk automatically'], c: 2,
      w: 'On the worked assumptions, one request\u2019s cache equals the whole model at roughly 430,000 tokens. The cache converts a computation problem into a memory problem.' },
    { q: 'Speculative decoding changes what, exactly?',
      a: ['The answer, making it better', 'The latency, leaving the output distribution unchanged', 'The model\u2019s knowledge', 'The training data'], c: 1,
      w: 'Verification preserves the output distribution. It is a pure engineering optimisation, and it helps most at small batch sizes.' },
    { q: 'A model scores 78% on a benchmark. What is the first question worth asking?',
      a: ['How many parameters it has', 'At what answer-time budget the figure was obtained', 'Which country trained it', 'How large the training corpus was'], c: 1,
      w: 'A benchmark result is a property of a model and a budget. The same weights at ten times the budget behave like a different system, and the budget is rarely disclosed.' }
  ];

  T.widget('quiz', function (node) {
    var body = T.shell(node, 'Ten questions, no marks recorded', 'Check yourself',
      '<div class="qz-list"></div><div class="lab-out qz-score"></div>',
      'Each answer points back to the chapter it came from. Sources are cited on every panel of this site.');
    var list = body.querySelector('.qz-list'), scoreEl = body.querySelector('.qz-score'),
        answered = 0, right = 0;
    list.style.cssText = 'display:flex;flex-direction:column;gap:20px';

    QUIZ.forEach(function (item, qi) {
      var box = document.createElement('div');
      box.className = 'quiz-q';
      box.innerHTML = '<span class="code-no">Q' + (qi + 1) + '</span>' +
        '<p style="font-size:16.5px;line-height:1.45;margin:8px 0 0">' + item.q + '</p>' +
        '<div class="quiz-opts"></div><div class="quiz-fb"></div>';
      var opts = box.querySelector('.quiz-opts'), fb = box.querySelector('.quiz-fb'), done = false;
      item.a.forEach(function (txt, ai) {
        var b = document.createElement('button');
        b.type = 'button'; b.textContent = txt;
        b.addEventListener('click', function () {
          if (done) return;
          done = true; answered++;
          var ok = ai === item.c;
          if (ok) right++;
          Array.prototype.forEach.call(opts.children, function (c, ci) {
            c.classList.add(ci === item.c ? 'right' : (ci === ai ? 'wrong' : ''));
          });
          fb.innerHTML = '<b style="font-weight:500">' + (ok ? 'Correct. ' : 'Not quite. ') + '</b>' + item.w;
          fb.classList.add('show');
          scoreEl.innerHTML = '<span class="meta">Score</span><p style="font-size:22px;margin-top:6px">' +
            right + ' of ' + answered + ' answered</p>' +
            (answered === QUIZ.length ? '<p class="body-s" style="margin-top:8px">That is the whole thing. The three habits at the end of chapter 04 are the part worth keeping.</p>' : '');
        });
        opts.appendChild(b);
      });
      list.appendChild(box);
    });
    scoreEl.innerHTML = '<span class="meta">Score</span><p style="font-size:22px;margin-top:6px">Nothing answered yet</p>';
  });

})(window.T);
