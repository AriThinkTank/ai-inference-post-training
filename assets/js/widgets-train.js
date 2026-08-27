/* =========================================================================
   widgets-train.js — interactive pieces for the map, chapter 01 and 02.
   Every widget renders itself into <div data-widget="name">.
   No dependencies. Nothing here is animated beyond a simple transition.
   ========================================================================= */

window.T = window.T || {};
(function (T) {
  'use strict';

  /* ---------- tiny helpers -------------------------------------------- */

  var registry = {};
  T.widget = function (name, fn) { registry[name] = fn; };

  T.h = function (html) {
    var d = document.createElement('div');
    d.innerHTML = html.trim();
    return d.firstElementChild;
  };
  T.esc = function (s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c];
    });
  };
  T.num = function (n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); };
  T.bar = function (label, pct, num, cls) {
    return '<div class="barline' + (cls === 'cut' ? ' is-cut' : '') + '"><span class="lbl">' + label + '</span>' +
      '<span class="track"><span class="fill ' + (cls || '') + '" style="width:' + Math.max(0, Math.min(100, pct)) + '%"></span></span>' +
      '<span class="num">' + num + '</span></div>';
  };
  T.shell = function (node, title, tag, bodyHTML, footHTML) {
    node.classList.add('lab');
    node.innerHTML =
      '<div class="lab-head"><h3 class="h-sub">' + title + '</h3><span class="lab-tag">' + (tag || 'Try it') + '</span></div>' +
      '<div class="lab-body">' + bodyHTML + '</div>' +
      (footHTML ? '<div class="lab-foot">' + footHTML + '</div>' : '');
    return node.querySelector('.lab-body');
  };

  document.addEventListener('DOMContentLoaded', function () {
    Array.prototype.forEach.call(document.querySelectorAll('[data-widget]'), function (node) {
      var fn = registry[node.getAttribute('data-widget')];
      if (fn) { try { fn(node); } catch (e) { node.innerHTML = '<p class="meta">This piece could not be drawn.</p>'; } }
    });
  });

  /* =========================================================================
     THE MAP — seven stages
     ========================================================================= */

  var STAGES = [
    { c: 'P.01', n: 'Pretraining', kind: 'w', k: 'Read almost the whole internet and learn to guess what comes next.',
      t: 'Next-token prediction over a very large corpus. Produces a base model that continues text but does not answer questions.',
      s: 'One enormous run, done once', link: '01-what-pretraining-leaves.html' },
    { c: 'P.02', n: 'Supervised fine-tuning', kind: 'w', k: 'Show it thousands of good answers and let it copy them.',
      t: 'Prompt-and-answer pairs, with only the answer tokens scored. Teaches format, stopping, register, refusal style and tool syntax.',
      s: 'Low compute, high data quality', link: '02-post-training.html#sft' },
    { c: 'P.03', n: 'Preference training', kind: 'w', k: 'Two answers go up on the board and a judge points at the better one.',
      t: 'RLHF, RLAIF or DPO. Probability moves towards the preferred answer and away from the other.',
      s: 'Moderate, rising with annotation volume', link: '02-post-training.html#preference' },
    { c: 'P.04', n: 'Verifiable-reward RL', kind: 'w', k: 'A program marks the homework, so nobody has to guess.',
      t: 'The reward comes from a checker that runs: a unit test, an exact-match comparison, a proof checker.',
      s: 'High and rising fast', link: '02-post-training.html#rlvr' },
    { c: 'P.05', n: 'Agentic RL', kind: 'w', k: 'Give it a long job with real tools and mark only the finished job.',
      t: 'Episodes of hundreds of steps, scored once at the end. Credit assignment and idle accelerators are the hard parts.',
      s: 'Very high, and infrastructure-heavy', link: '02-post-training.html#agentic' },
    { c: 'P.06', n: 'Compress and serve', kind: 'w', k: 'Shrink it so it fits on cheaper machines.',
      t: 'Distillation and quantisation, then loading the weights onto accelerators behind a serving engine.',
      s: 'Low, and it lowers every later cost', link: '02-post-training.html#compression' },
    { c: 'P.07', n: 'Answer-time compute', kind: 'i', k: 'Let it think longer, try several times, or use tools before it replies.',
      t: 'No weights change. Capability becomes a function of the weights and the compute budget allowed per request.',
      s: 'Spent on every single request', link: '03-inference.html#budget' }
  ];

  T.widget('map', function (node) {
    var body = T.shell(node, 'The whole pipeline, in seven stages', 'Tap a stage',
      '<div class="map-strip"></div><div class="lab-out map-detail"></div>',
      'Stage naming follows Lambert, arXiv:2504.12501, ch. 3; serving stages follow Austin et al., How To Scale Your Model, ch. 7.');
    var strip = body.querySelector('.map-strip');
    var out = body.querySelector('.map-detail');

    strip.style.cssText = 'display:flex;flex-wrap:wrap;border-top:1px solid rgba(23,20,19,0.16);border-left:1px solid rgba(23,20,19,0.16)';
    STAGES.forEach(function (s, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.style.cssText = 'flex:1 1 132px;min-width:132px;text-align:left;padding:14px 14px 16px;background:#fff;border:none;' +
        'border-right:1px solid rgba(23,20,19,0.16);border-bottom:1px solid rgba(23,20,19,0.16);cursor:pointer;transition:background .15s ease';
      b.innerHTML = '<span style="display:block;height:4px;margin-bottom:11px;background:' + (s.kind === 'w' ? '#620d3c' : '#f1a222') + '"></span>' +
        '<span class="code-no">' + s.c + '</span>' +
        '<span style="display:block;font-size:14px;font-weight:500;margin-top:6px;line-height:1.25">' + s.n + '</span>';
      b.addEventListener('click', function () { pick(i); });
      b.addEventListener('mouseenter', function () { b.style.background = '#F7F5F2'; });
      b.addEventListener('mouseleave', function () { b.style.background = (i === cur ? '#F7F5F2' : '#fff'); });
      strip.appendChild(b);
    });

    var cur = -1;
    function pick(i) {
      cur = i;
      Array.prototype.forEach.call(strip.children, function (c, j) { c.style.background = j === i ? '#F7F5F2' : '#fff'; });
      var s = STAGES[i];
      out.innerHTML =
        '<div class="between" style="margin-bottom:12px">' +
          '<span class="code-no">' + s.c + ' · ' + s.n.toUpperCase() + '</span>' +
          '<span class="chip ' + (s.kind === 'w' ? 'chip-wine' : 'chip-gold') + '">' +
            (s.kind === 'w' ? 'Changes the weights' : 'Compute per request') + '</span>' +
        '</div>' +
        '<p style="font-size:17px;line-height:1.45;margin-bottom:10px">' + s.k + '</p>' +
        '<p class="body-s" style="margin-bottom:12px">' + s.t + '</p>' +
        '<dl class="deflist"><dt>Cost</dt><dd>' + s.s + '</dd>' +
        '<dt>Read on</dt><dd><a class="link" href="' + s.link + '">Go to this stage <span class="arrow">&rarr;</span></a></dd></dl>';
    }
    pick(0);
  });

  /* =========================================================================
     SIX WORDS — vocabulary cards
     ========================================================================= */

  var VOCAB = [
    { t: 'Training', m: 'Any process that changes the model\'s weights. An umbrella term, not a stage.', w: 'The model developer', x: 'Used as a synonym for pretraining' },
    { t: 'Pretraining', m: 'Next-token prediction over a very large corpus. Produces a base model that continues text but does not answer questions.', w: 'The developer, in one very large run', x: 'Treated as the whole of capability' },
    { t: 'Post-training', m: 'Everything done to the weights afterwards: supervised fine-tuning, preference learning, reinforcement learning.', w: 'The developer, in many smaller runs', x: 'Treated as a cheap finishing polish' },
    { t: 'Fine-tuning', m: 'Adapting an existing model on a specific dataset. One technique inside post-training, not all of it.', w: 'The developer or a downstream user', x: 'Used to mean all of post-training' },
    { t: 'Alignment', m: 'The goal of making behaviour match intent and stated values. A purpose, pursued partly through post-training.', w: 'Contested, and often used loosely', x: 'Treated as identical to post-training' },
    { t: 'Inference', m: 'Running the finished weights to produce an output. No weights change. Happens once per request, billions of times a day.', w: 'Whoever serves the model, and the user', x: 'Assumed to be cheap and fixed' }
  ];

  T.widget('vocab', function (node) {
    var body = T.shell(node, 'Six words that get used interchangeably, and should not be', 'Tap to turn over',
      '<div class="vocab-grid"></div>',
      'Definitions follow Lambert, arXiv:2504.12501, App. A; and Georgia Tech CS 7643, Spring 2026, lecture 23.');
    var g = body.querySelector('.vocab-grid');
    g.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));border-top:1px solid rgba(23,20,19,0.16);border-left:1px solid rgba(23,20,19,0.16)';
    VOCAB.forEach(function (v, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-pressed', 'false');
      b.style.cssText = 'text-align:left;padding:20px 20px 22px;background:#fff;border:none;min-height:170px;' +
        'border-right:1px solid rgba(23,20,19,0.16);border-bottom:1px solid rgba(23,20,19,0.16);cursor:pointer;transition:background .15s ease;color:#171413';
      var front = '<span class="code-no">0' + (i + 1) + '</span>' +
        '<span style="display:block;font-size:21px;font-weight:500;margin:10px 0 12px">' + v.t + '</span>' +
        '<span class="meta">Tap for what it means &rarr;</span>';
      var back = '<span class="code-no">0' + (i + 1) + ' · ' + v.t.toUpperCase() + '</span>' +
        '<span class="body-s" style="display:block;margin:10px 0 12px">' + v.m + '</span>' +
        '<dl class="deflist"><dt>Who pays</dt><dd>' + v.w + '</dd><dt>Misuse</dt><dd>' + v.x + '</dd></dl>';
      b.innerHTML = front;
      b.addEventListener('click', function () {
        var on = b.getAttribute('aria-pressed') === 'true';
        b.setAttribute('aria-pressed', on ? 'false' : 'true');
        b.innerHTML = on ? front : back;
        b.style.background = on ? '#fff' : '#F7F5F2';
      });
      g.appendChild(b);
    });
  });

  /* =========================================================================
     TOKENISER — cut a sentence into tokens
     ========================================================================= */

  function tokenise(text) {
    var out = [], re = /\s*[A-Za-z]+|\s*\d+|\s*[^\sA-Za-z\d]|\s+/g, m;
    while ((m = re.exec(text)) !== null) {
      var piece = m[0];
      if (/^\s+$/.test(piece)) { out.push(piece); continue; }
      var lead = piece.match(/^\s*/)[0], core = piece.slice(lead.length);
      if (/^\d+$/.test(core)) {
        for (var i = 0; i < core.length; i += 3) out.push((i === 0 ? lead : '') + core.substr(i, 3));
        continue;
      }
      if (core.length <= 6) { out.push(lead + core); continue; }
      var cut = core.length > 9 ? 5 : 4, rest = core.slice(cut);
      out.push(lead + core.slice(0, cut));
      while (rest.length) {
        var take = rest.length > 7 ? 4 : rest.length;
        out.push(rest.slice(0, take));
        rest = rest.slice(take);
      }
    }
    return out;
  }

  T.widget('tokeniser', function (node) {
    var body = T.shell(node, 'Cut a sentence into tokens', 'Type anything',
      '<div class="field"><label for="tk-in">Your sentence</label>' +
      '<textarea id="tk-in" rows="2">India has a large ethanol blending programme.</textarea></div>' +
      '<div class="lab-out"><div class="tok-row tk-out"></div></div>' +
      '<div class="split-3 tk-stats"></div>',
      'Approximate. Real tokenisers are learned from data (byte-pair encoding) and differ between models; this one applies plain rules to show the shape of the result.');
    var input = body.querySelector('#tk-in'),
        out = body.querySelector('.tk-out'),
        stats = body.querySelector('.tk-stats');

    function run() {
      var toks = tokenise(input.value);
      out.innerHTML = toks.length
        ? toks.map(function (t) {
            return '<span class="tok ' + (/^\s+$/.test(t) ? 'tok-ghost' : 'tok-wine') + '">' +
              T.esc(t.replace(/ /g, '\u00b7')) + '</span>';
          }).join('')
        : '<span class="meta">Nothing to cut yet.</span>';
      var chars = input.value.length, n = toks.length;
      stats.innerHTML =
        '<div><div class="kpi kpi-gold">' + n + '</div><div class="meta">Tokens</div></div>' +
        '<div><div class="kpi kpi-gold">' + chars + '</div><div class="meta">Characters</div></div>' +
        '<div><div class="kpi kpi-gold">' + (n ? (chars / n).toFixed(1) : '0.0') + '</div><div class="meta">Characters per token</div></div>';
    }
    input.addEventListener('input', run);
    run();
  });

  /* =========================================================================
     NEXT TOKEN — the probability list, temperature and sampling
     ========================================================================= */

  var NEXT = [
    { t: 'programme', p: 0.31 }, { t: 'blending', p: 0.24 }, { t: 'industry', p: 0.17 },
    { t: 'sector', p: 0.11 }, { t: 'policy', p: 0.06 }
  ];
  var OTHERS_N = 128000, OTHERS_P = 0.11;

  T.widget('nexttoken', function (node) {
    var body = T.shell(node, 'The only thing a base model does', 'Move the dials',
      '<div class="lab-out" style="background:#fff">' +
        '<span class="meta">The prompt, already in tokens</span>' +
        '<div class="tok-row" style="margin-top:10px">' +
          ['India', ' has', ' a', ' large', ' ethanol'].map(function (t) {
            return '<span class="tok tok-wine">' + T.esc(t.replace(/ /g, '\u00b7')) + '</span>';
          }).join('') +
          '<span class="tok tok-ghost">next?</span>' +
        '</div>' +
      '</div>' +
      '<div class="lab-controls">' +
        '<div class="field"><label for="nt-temp">Temperature <span class="val" id="nt-tempv">1.00</span></label>' +
        '<input id="nt-temp" type="range" min="10" max="200" value="100"></div>' +
        '<div class="field"><label>Sampling rule</label><div class="seg nt-mode">' +
          '<button type="button" data-m="pure" aria-pressed="true">All</button>' +
          '<button type="button" data-m="topk" aria-pressed="false">Top-k</button>' +
          '<button type="button" data-m="topp" aria-pressed="false">Top-p</button>' +
          '<button type="button" data-m="greedy" aria-pressed="false">Greedy</button>' +
        '</div></div>' +
        '<div class="field nt-kwrap"><label for="nt-k">k <span class="val" id="nt-kv">3</span></label>' +
        '<input id="nt-k" type="range" min="1" max="6" value="3"></div>' +
        '<div class="field nt-pwrap"><label for="nt-p">p <span class="val" id="nt-pv">0.80</span></label>' +
        '<input id="nt-p" type="range" min="10" max="100" value="80"></div>' +
      '</div>' +
      '<div class="nt-bars"></div>' +
      '<div class="row"><button class="btn btn-s nt-draw" type="button">Draw a token</button>' +
      '<button class="btn btn-s btn-ghost nt-draw20" type="button">Draw 20</button>' +
      '<button class="btn btn-s btn-ghost nt-reset" type="button">Clear tally</button></div>' +
      '<div class="lab-out nt-tally"></div>',
      'Probabilities are illustrative, not measured. Temperature is applied to the log-probabilities of all 128,005 entries, ' +
      'with the unnamed remainder treated as 128,000 equally likely tokens. Mechanism: Vaswani et al., arXiv:1706.03762.');

    var tempEl = body.querySelector('#nt-temp'), tempV = body.querySelector('#nt-tempv'),
        kEl = body.querySelector('#nt-k'), kV = body.querySelector('#nt-kv'),
        pEl = body.querySelector('#nt-p'), pV = body.querySelector('#nt-pv'),
        bars = body.querySelector('.nt-bars'), tally = body.querySelector('.nt-tally'),
        kwrap = body.querySelector('.nt-kwrap'), pwrap = body.querySelector('.nt-pwrap'),
        mode = 'pure', counts = {};

    function dist() {
      var T0 = parseInt(tempEl.value, 10) / 100;
      var items = NEXT.map(function (e) { return { t: e.t, w: Math.exp(Math.log(e.p) / T0) }; });
      var otherPer = Math.exp(Math.log(OTHERS_P / OTHERS_N) / T0);
      var sum = items.reduce(function (a, b) { return a + b.w; }, 0) + OTHERS_N * otherPer;
      items = items.map(function (e) { return { t: e.t, p: e.w / sum }; });
      items.push({ t: T.num(OTHERS_N) + ' others', p: (OTHERS_N * otherPer) / sum, other: true });
      return items;
    }

    function filtered() {
      var d = dist().slice().sort(function (a, b) { return b.p - a.p; });
      if (mode === 'greedy') { var top = d[0]; return d.map(function (e) { return { t: e.t, p: e === top ? 1 : 0, other: e.other, cut: e !== top }; }); }
      var keep = d.slice();
      if (mode === 'topk') { var k = parseInt(kEl.value, 10); keep = d.slice(0, k); }
      if (mode === 'topp') {
        var lim = parseInt(pEl.value, 10) / 100, acc = 0; keep = [];
        for (var i = 0; i < d.length; i++) { keep.push(d[i]); acc += d[i].p; if (acc >= lim) break; }
      }
      var s = keep.reduce(function (a, b) { return a + b.p; }, 0);
      return d.map(function (e) {
        var inKeep = keep.indexOf(e) > -1;
        return { t: e.t, p: inKeep ? e.p / s : 0, other: e.other, cut: !inKeep };
      });
    }

    function render() {
      tempV.textContent = (parseInt(tempEl.value, 10) / 100).toFixed(2);
      kV.textContent = kEl.value;
      pV.textContent = (parseInt(pEl.value, 10) / 100).toFixed(2);
      kwrap.style.opacity = mode === 'topk' ? 1 : 0.35;
      pwrap.style.opacity = mode === 'topp' ? 1 : 0.35;
      kEl.disabled = mode !== 'topk'; pEl.disabled = mode !== 'topp';
      var d = filtered();
      var anyCut = d.some(function (e) { return e.cut; });
      bars.innerHTML = '<span class="meta" style="display:block;margin-bottom:8px">Probability of each next token, after the rule is applied</span>' +
        d.map(function (e) {
          return T.bar(T.esc(e.t), e.p * 100,
            e.cut ? 'cut' : (e.p * 100).toFixed(1) + '%',
            e.cut ? 'cut' : (e.other ? 'gold' : ''));
        }).join('') +
        (anyCut
          ? '<span class="meta" style="display:block;margin-top:8px">Tokens marked <i>cut</i> have been removed by the sampling rule and can no longer be drawn, however likely the model thought they were. The rest have been rescaled to sum to one.</span>'
          : '<span class="meta" style="display:block;margin-top:8px">Every token in the vocabulary is still in play. Narrow the rule to cut the tail away.</span>');
    }

    function draw(n) {
      var d = filtered().filter(function (e) { return e.p > 0; });
      for (var i = 0; i < n; i++) {
        var r = Math.random(), acc = 0, pick = d[d.length - 1];
        for (var j = 0; j < d.length; j++) { acc += d[j].p; if (r <= acc) { pick = d[j]; break; } }
        counts[pick.t] = (counts[pick.t] || 0) + 1;
      }
      showTally();
    }
    function showTally() {
      var keys = Object.keys(counts);
      if (!keys.length) { tally.innerHTML = '<span class="meta">No draws yet. The sentence continues differently each time you draw.</span>'; return; }
      var total = keys.reduce(function (a, k) { return a + counts[k]; }, 0);
      tally.innerHTML = '<span class="meta" style="display:block;margin-bottom:10px">' + total + ' draws so far</span>' +
        '<div class="tok-row">' + keys.sort(function (a, b) { return counts[b] - counts[a]; }).map(function (k) {
          return '<span class="tok tok-gold">' + T.esc(k) + ' <b style="font-weight:500">&times;' + counts[k] + '</b></span>';
        }).join('') + '</div>';
    }

    tempEl.addEventListener('input', render);
    kEl.addEventListener('input', render);
    pEl.addEventListener('input', render);
    Array.prototype.forEach.call(body.querySelectorAll('.nt-mode button'), function (b) {
      b.addEventListener('click', function () {
        mode = b.getAttribute('data-m');
        Array.prototype.forEach.call(body.querySelectorAll('.nt-mode button'), function (o) {
          o.setAttribute('aria-pressed', o === b ? 'true' : 'false');
        });
        render();
      });
    });
    body.querySelector('.nt-draw').addEventListener('click', function () { draw(1); });
    body.querySelector('.nt-draw20').addEventListener('click', function () { draw(20); });
    body.querySelector('.nt-reset').addEventListener('click', function () { counts = {}; showTally(); });
    render(); showTally();
  });

  /* =========================================================================
     PRESENT OR ABSENT — what pretraining hands over
     ========================================================================= */

  var HANDOVER = [
    { t: 'Broad factual and world knowledge', a: 'present', w: 'Almost everything the model will ever know about the world arrives at this stage.' },
    { t: 'Fluent language, in many languages', a: 'present', w: 'Grammar, register, idiom, and the ability to move between them.' },
    { t: 'Picking up a pattern from examples inside the prompt', a: 'present', w: 'In-context learning, with no weight change at all.' },
    { t: 'Some latent reasoning ability', a: 'present', w: 'The capacity is there, but unreliable and hard to elicit on demand.' },
    { t: 'Some code and mathematics', a: 'present', w: 'Learned incidentally from the corpus rather than taught deliberately.' },
    { t: 'Answering a question rather than continuing it', a: 'absent', w: 'Given a question, a base model may produce five more questions. That is a faithful continuation of its corpus.' },
    { t: 'Knowing when to stop', a: 'absent', w: 'Nothing in pretraining teaches a natural end to a reply.' },
    { t: 'Refusal and safety behaviour', a: 'absent', w: 'The corpus contains harmful text, and a base model reproduces it on request.' },
    { t: 'Tool and function-call syntax', a: 'absent', w: 'Emitting a structured call that an external system can execute.' },
    { t: 'Reliable long-form reasoning', a: 'absent', w: 'Working through a problem in steps, on demand, and checking the result.' }
  ];

  T.widget('handover', function (node) {
    var body = T.shell(node, 'Already in the box, or added later?', 'Ten guesses',
      '<div class="ho-card lab-out"></div>' +
      '<div class="row"><button class="btn btn-s ho-a" type="button">Already there</button>' +
      '<button class="btn btn-s btn-ghost ho-b" type="button">Must be added later</button></div>' +
      '<div class="ho-fb"></div>' +
      '<div class="meta ho-score"></div>',
      'Georgia Tech CS 7643, Spring 2026, lecture 23; Lambert, arXiv:2504.12501, ch. 4.');
    var card = body.querySelector('.ho-card'), fb = body.querySelector('.ho-fb'),
        score = body.querySelector('.ho-score'), i = 0, right = 0, done = false;

    function show() {
      if (i >= HANDOVER.length) {
        card.innerHTML = '<span class="code-no">Done</span><p style="font-size:19px;margin-top:8px">' + right + ' out of ' + HANDOVER.length + ' correct.</p>' +
          '<p class="body-s">The five on the left arrive free with pretraining. The five on the right are the work of chapter 02.</p>';
        fb.innerHTML = ''; return;
      }
      card.innerHTML = '<span class="code-no">' + (i + 1) + ' of ' + HANDOVER.length + '</span>' +
        '<p style="font-size:19px;line-height:1.35;margin-top:8px">' + HANDOVER[i].t + '</p>';
      score.textContent = right + ' correct so far';
    }
    function answer(guess) {
      if (i >= HANDOVER.length || done) return;
      var item = HANDOVER[i], ok = item.a === guess;
      if (ok) right++;
      done = true;
      fb.innerHTML = '<div class="aside" style="margin-top:4px"><span class="chip ' + (ok ? 'chip-soft' : 'chip-neg') + '">' +
        (ok ? 'Correct' : 'Not quite') + '</span><p class="body-s" style="margin-top:8px">' +
        (item.a === 'present' ? 'Already there. ' : 'Added later. ') + item.w + '</p>' +
        '<button class="btn btn-s btn-ghost ho-next" type="button" style="margin-top:10px">Next</button></div>';
      fb.querySelector('.ho-next').addEventListener('click', function () { i++; done = false; fb.innerHTML = ''; show(); });
    }
    body.querySelector('.ho-a').addEventListener('click', function () { answer('present'); });
    body.querySelector('.ho-b').addEventListener('click', function () { answer('absent'); });
    show();
  });

  /* =========================================================================
     THE STAIRCASE — four teachers
     ========================================================================= */

  var STEPS = [
    { n: 'Agentic RL', teach: 'An environment', sig: 'Long tool-using episodes scored at the end', cost: 'Very high', pct: 100,
      add: 'Planning across many steps; recovery from tool failure', fail: 'Credit assignment; very costly to run and to debug' },
    { n: 'Verifiable-reward RL', teach: 'A checker that runs', sig: 'Answers marked right or wrong automatically', cost: 'High and rising', pct: 74,
      add: 'Reliable mathematics, code, logic; long reasoning chains', fail: 'Only reaches tasks where correctness is decidable' },
    { n: 'Preference learning', teach: 'A ranker', sig: 'Which of two answers a judge preferred', cost: 'Moderate', pct: 42,
      add: 'Helpfulness, judgement, tone in open-ended questions', fail: 'Reward hacking: padding, sycophancy, format gaming' },
    { n: 'Supervised fine-tuning', teach: 'A demonstrator', sig: 'Complete worked examples to copy', cost: 'Low', pct: 20,
      add: 'Answering, stopping, register, refusal style, tool syntax', fail: 'Cannot exceed the demonstrator; copies their errors' },
    { n: 'Pretraining', teach: 'The corpus', sig: 'The next token in a very large body of text', cost: 'Very high, once', pct: 96,
      add: 'Knowledge, fluency, latent ability', fail: 'Continues text rather than answering it', base: true }
  ];

  T.widget('staircase', function (node) {
    var body = T.shell(node, 'Four teachers, stacked', 'Tap a step',
      '<div class="st-list"></div><div class="lab-out st-detail"></div>',
      'Stage structure follows Lambert, arXiv:2504.12501, chs. 4-7; and \u2018Reinforcement Learning for LLM Post-Training: A Survey\u2019, ' +
      'openreview.net/forum?id=UdsXTNzzvg. Compute bars are ordinal, not measured.');
    var list = body.querySelector('.st-list'), out = body.querySelector('.st-detail');
    list.style.cssText = 'border-top:1px solid rgba(23,20,19,0.16);border-left:1px solid rgba(23,20,19,0.16)';

    STEPS.forEach(function (s, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.style.cssText = 'display:grid;grid-template-columns:1fr auto;gap:16px;width:100%;text-align:left;padding:15px 18px;background:' +
        (s.base ? '#F7F5F2' : '#fff') + ';border:none;border-right:1px solid rgba(23,20,19,0.16);border-bottom:1px solid rgba(23,20,19,0.16);' +
        'cursor:pointer;align-items:center;color:#171413;padding-left:' + (18 + (4 - i) * 14) + 'px';
      b.innerHTML = '<span><span class="code-no">' + (s.base ? 'BASE' : 'STAGE ' + (4 - i)) + '</span>' +
        '<span style="display:block;font-size:17px;font-weight:500;margin-top:4px">' + s.n + '</span>' +
        '<span class="meta" style="text-transform:none;letter-spacing:0">Teacher: ' + s.teach + '</span></span>' +
        '<span style="width:90px"><span style="display:block;height:12px;background:rgba(23,20,19,0.08)">' +
        '<span style="display:block;height:100%;width:' + s.pct + '%;background:' + (s.base ? '#b8809f' : '#620d3c') + '"></span></span>' +
        '<span class="meta" style="font-size:9px">' + s.cost + '</span></span>';
      b.addEventListener('click', function () { pick(i); });
      list.appendChild(b);
    });

    function pick(i) {
      var s = STEPS[i];
      Array.prototype.forEach.call(list.children, function (c, j) {
        c.style.background = j === i ? '#f5e6ec' : (STEPS[j].base ? '#F7F5F2' : '#fff');
      });
      out.innerHTML = '<span class="code-no">' + s.n.toUpperCase() + '</span>' +
        '<dl class="deflist" style="margin-top:12px">' +
        '<dt>Learns from</dt><dd>' + s.sig + '</dd>' +
        '<dt>What it adds</dt><dd>' + s.add + '</dd>' +
        '<dt>How it fails</dt><dd>' + s.fail + '</dd>' +
        '<dt>Compute</dt><dd>' + s.cost + '</dd></dl>';
    }
    pick(3);
  });

  /* =========================================================================
     LOSS MASKING — which tokens are scored during fine-tuning
     ========================================================================= */

  T.widget('lossmask', function (node) {
    var prompt = ['What', ' does', ' the', ' 2019', ' ethanol', ' import', ' restriction', ' do', '?'];
    var answer = ['It', ' bars', ' ethanol', ' imports', ' for', ' fuel', ' blending', ',', ' which', ' shifted', ' demand', ' onto', ' domestic', ' feedstock', '.'];
    var body = T.shell(node, 'Which tokens count towards the score?', 'Flip the switch',
      '<div class="seg lm-seg"><button type="button" data-m="on" aria-pressed="true">Mask the prompt</button>' +
      '<button type="button" data-m="off" aria-pressed="false">Score everything</button></div>' +
      '<div class="lab-out"><span class="meta">Prompt</span><div class="tok-row lm-p" style="margin:8px 0 16px"></div>' +
      '<span class="meta">Response</span><div class="tok-row lm-a" style="margin-top:8px"></div></div>' +
      '<div class="aside lm-note"></div>',
      'Lambert, arXiv:2504.12501, ch. 4. Example content is illustrative.');
    var pRow = body.querySelector('.lm-p'), aRow = body.querySelector('.lm-a'), note = body.querySelector('.lm-note'), on = true;

    function render() {
      pRow.innerHTML = prompt.map(function (t) {
        return '<span class="tok ' + (on ? 'tok-ghost' : 'tok-gold') + '">' + T.esc(t.replace(/ /g, '\u00b7')) + '</span>';
      }).join('');
      aRow.innerHTML = answer.map(function (t) {
        return '<span class="tok tok-gold">' + T.esc(t.replace(/ /g, '\u00b7')) + '</span>';
      }).join('');
      note.innerHTML = on
        ? '<span class="aside-title">Masked, which is what everyone does</span><p class="body-s">Only the ' + answer.length +
          ' response tokens contribute to the loss. The model is being taught what a good answer looks like, given the question.</p>'
        : '<span class="aside-title">Unmasked, which quietly breaks things</span><p class="body-s">All ' + (prompt.length + answer.length) +
          ' tokens are scored, so the model learns to generate questions as readily as answers. Ask it something and it may write you a new question instead.</p>';
    }
    Array.prototype.forEach.call(body.querySelectorAll('.lm-seg button'), function (b) {
      b.addEventListener('click', function () {
        on = b.getAttribute('data-m') === 'on';
        Array.prototype.forEach.call(body.querySelectorAll('.lm-seg button'), function (o) {
          o.setAttribute('aria-pressed', o === b ? 'true' : 'false');
        });
        render();
      });
    });
    render();
  });

  /* =========================================================================
     RANKER — order four answers, then meet the reward model
     ========================================================================= */

  var ANSWERS = [
    { id: 'A', tag: 'Accurate, blunt', text: 'It bars ethanol imports for fuel blending. Domestic demand rose.', words: 11, human: 2, rm: 4 },
    { id: 'B', tag: 'Accurate, clear', text: 'The restriction bars ethanol imports for fuel blending, which shifted demand onto domestic feedstock rather than reducing it.', words: 19, human: 1, rm: 2 },
    { id: 'C', tag: 'Fluent, wrong', text: 'It is a landmark reform. In short: a comprehensive framework that liberalised ethanol imports across the board, with wide-ranging benefits for every stakeholder in the value chain.', words: 28, human: 3, rm: 1 },
    { id: 'D', tag: 'Evasive', text: 'That depends on many factors and reasonable people disagree.', words: 10, human: 4, rm: 3 }
  ];

  T.widget('ranker', function (node) {
    var body = T.shell(node, 'You be the judge', 'Rank them',
      '<p class="body-s">Tap the answers in the order you think is best, starting with the best.</p>' +
      '<div class="rk-list"></div>' +
      '<div class="row"><button class="btn btn-s btn-ghost rk-reset" type="button">Start again</button></div>' +
      '<div class="rk-out"></div>',
      'Illustrative. The pattern shown \u2014 raters preferring longer answers, and reward models learning that longer is better \u2014 ' +
      'is documented in Lambert, arXiv:2504.12501, ch. 5.');
    var list = body.querySelector('.rk-list'), out = body.querySelector('.rk-out'), order = [];
    list.style.cssText = 'border-top:1px solid rgba(23,20,19,0.16);border-left:1px solid rgba(23,20,19,0.16)';

    function render() {
      list.innerHTML = '';
      ANSWERS.forEach(function (a) {
        var pos = order.indexOf(a.id);
        var b = document.createElement('button');
        b.type = 'button';
        b.style.cssText = 'display:grid;grid-template-columns:auto 1fr;gap:16px;width:100%;text-align:left;padding:14px 16px;' +
          'background:' + (pos > -1 ? '#f5e6ec' : '#fff') + ';border:none;border-right:1px solid rgba(23,20,19,0.16);' +
          'border-bottom:1px solid rgba(23,20,19,0.16);cursor:pointer;color:#171413';
        b.innerHTML = '<span class="code-no" style="min-width:38px">' + (pos > -1 ? 'RANK ' + (pos + 1) : a.id) + '</span>' +
          '<span><span class="meta" style="display:block;margin-bottom:5px">' + a.tag + '</span>' +
          '<span style="font-size:14px;line-height:1.5">' + a.text + '</span></span>';
        b.addEventListener('click', function () {
          if (pos > -1) return;
          order.push(a.id);
          render();
          if (order.length === ANSWERS.length) reveal();
        });
        list.appendChild(b);
      });
    }
    function reveal() {
      var byHuman = ANSWERS.slice().sort(function (x, y) { return x.human - y.human; }).map(function (a) { return a.id; });
      var byRM = ANSWERS.slice().sort(function (x, y) { return x.rm - y.rm; }).map(function (a) { return a.id; });
      var match = order.join('') === byHuman.join('');
      out.innerHTML =
        '<div class="lab-out" style="margin-top:18px">' +
          '<div class="split-3">' +
            '<div><span class="meta">Your order</span><p style="font-size:19px;margin-top:6px">' + order.join(' \u203a ') + '</p></div>' +
            '<div><span class="meta">Careful human raters</span><p style="font-size:19px;margin-top:6px">' + byHuman.join(' \u203a ') + '</p></div>' +
            '<div><span class="meta">A reward model that learned length</span><p style="font-size:19px;margin-top:6px;color:#620d3c">' + byRM.join(' \u203a ') + '</p></div>' +
          '</div>' +
          '<p class="body-s" style="margin-top:16px">' +
          (match ? 'Your order matches the careful raters. ' : 'Your order differs from the careful raters, which is fair: judging is a matter of taste. ') +
          'The third column is the interesting one. Trained on rankings where longer answers tended to win, the reward model puts C first \u2014 ' +
          'the fluent, confident, entirely wrong one. Every answer the model generates from now on is scored by that third column, not by you.</p>' +
        '</div>';
    }
    body.querySelector('.rk-reset').addEventListener('click', function () { order = []; out.innerHTML = ''; render(); });
    render();
  });

  /* =========================================================================
     REWARD HACKING — the game
     ========================================================================= */

  T.widget('hacking', function (node) {
    var moves = [
      { k: 'Add padding', j: 0.075, q: -0.02, s: 'Restate the question, add caveats, repeat the conclusion.' },
      { k: 'Agree with the user', j: 0.085, q: -0.05, s: 'Echo the position the user already stated.' },
      { k: 'Add headings and bullets', j: 0.06, q: -0.005, s: 'Structure that looks like rigour.' },
      { k: 'Actually improve the answer', j: 0.02, q: 0.055, s: 'Slow, and the judge barely notices.' }
    ];
    var body = T.shell(node, 'Optimise against the judge', 'Play as the model',
      '<div class="split-even"><div>' +
        '<p class="body-s">You are the policy. Every move raises the judge\u2019s score. Watch what happens to the thing the judge was standing in for.</p>' +
        '<div class="rh-moves" style="margin-top:14px"></div>' +
        '<div class="row" style="margin-top:14px">' +
          '<button class="btn btn-s btn-ghost rh-kl" type="button" aria-pressed="false">Penalty for drift: off</button>' +
          '<button class="btn btn-s btn-ghost rh-reset" type="button">Reset</button>' +
        '</div>' +
      '</div><div><div class="rh-chart"></div><div class="rh-read"></div></div></div>',
      'Schematic. The four moves, and the direction each one pushes, follow the documented cases in Lambert, arXiv:2504.12501, ch. 14 ' +
      '(over-optimisation) and ch. 15 (regularization). The numbers are invented to make the shape visible.');

    var hist = [{ j: 0.50, q: 0.50 }], kl = false;
    var mv = body.querySelector('.rh-moves'), chart = body.querySelector('.rh-chart'), read = body.querySelector('.rh-read');

    mv.style.cssText = 'border-top:1px solid rgba(23,20,19,0.16);border-left:1px solid rgba(23,20,19,0.16)';
    moves.forEach(function (m) {
      var b = document.createElement('button');
      b.type = 'button';
      b.style.cssText = 'display:block;width:100%;text-align:left;padding:11px 14px;background:#fff;border:none;' +
        'border-right:1px solid rgba(23,20,19,0.16);border-bottom:1px solid rgba(23,20,19,0.16);cursor:pointer;color:#171413';
      b.innerHTML = '<span style="font-size:14.5px;font-weight:500">' + m.k + '</span>' +
        '<span class="meta" style="display:block;text-transform:none;letter-spacing:0;margin-top:2px">' + m.s + '</span>';
      b.addEventListener('click', function () { step(m); });
      mv.appendChild(b);
    });

    function step(m) {
      var last = hist[hist.length - 1], damp = kl ? 0.35 : 1;
      hist.push({
        j: Math.max(0, Math.min(1, last.j + m.j * damp)),
        q: Math.max(0, Math.min(1, last.q + m.q * (kl ? 0.4 : 1) * (m.q > 0 ? 1 : 1)))
      });
      if (hist.length > 26) hist.shift();
      render();
    }

    function render() {
      var W = 400, H = 210, PL = 34, PR = 62, PT = 12, PB = 26;
      var n = Math.max(hist.length - 1, 10);
      function x(i) { return PL + (i / n) * (W - PL - PR); }
      function y(v) { return PT + (1 - v) * (H - PT - PB); }
      function path(key, col) {
        return '<path d="' + hist.map(function (p, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p[key]).toFixed(1); }).join(' ') +
          '" fill="none" stroke="' + col + '" stroke-width="2"/>';
      }
      var grid = [0, 0.25, 0.5, 0.75, 1].map(function (v) {
        return '<line class="gridline" x1="' + PL + '" y1="' + y(v) + '" x2="' + (W - PR) + '" y2="' + y(v) + '"/>' +
          '<text class="axis-label" x="' + (PL - 6) + '" y="' + (y(v) + 3) + '" text-anchor="end">' + v.toFixed(2) + '</text>';
      }).join('');
      var last = hist[hist.length - 1], lx = x(hist.length - 1);
      var jy = y(last.j), qy = y(last.q);
      if (Math.abs(jy - qy) < 13) { jy -= 7; qy += 7; }
      var dots = '<circle cx="' + lx + '" cy="' + y(last.j) + '" r="2.6" fill="#f1a222"/>' +
                 '<circle cx="' + lx + '" cy="' + y(last.q) + '" r="2.6" fill="#620d3c"/>';
      chart.innerHTML =
        '<span class="meta">Steps of optimisation</span>' +
        '<h4 class="chart-title" style="margin:4px 0 10px">The judge\u2019s score, and the thing it stood for</h4>' +
        '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Two lines diverging as optimisation proceeds">' +
        grid + path('j', '#f1a222') + path('q', '#620d3c') + dots +
        '<text class="series-label" x="' + (lx + 6) + '" y="' + (jy + 3) + '" fill="#a8703a">Judge</text>' +
        '<text class="series-label" x="' + (lx + 6) + '" y="' + (qy + 3) + '" fill="#620d3c">Real</text>' +
        '</svg>';
      var gap = last.j - last.q;
      read.innerHTML = '<dl class="deflist" style="margin-top:12px">' +
        '<dt>Steps</dt><dd>' + (hist.length - 1) + '</dd>' +
        '<dt>Gap</dt><dd>' + (gap >= 0 ? '+' : '') + gap.toFixed(2) + (gap > 0.25 ? ' \u2014 the model is now being rewarded for finding the judge\u2019s errors' : '') + '</dd>' +
        '</dl>';
    }

    body.querySelector('.rh-kl').addEventListener('click', function () {
      kl = !kl;
      this.setAttribute('aria-pressed', kl ? 'true' : 'false');
      this.textContent = 'Penalty for drift: ' + (kl ? 'on' : 'off');
      this.className = 'btn btn-s ' + (kl ? '' : 'btn-ghost');
    });
    body.querySelector('.rh-reset').addEventListener('click', function () { hist = [{ j: 0.5, q: 0.5 }]; render(); });
    render();
  });

  /* =========================================================================
     VERIFIABILITY — can a program mark this?
     ========================================================================= */

  var TASKS = [
    { t: 'Prove that the square root of two is irrational, in Lean', lvl: 0, k: 'V3 · Formal proof checker', w: 'A machine verifies every step. Barely gameable, but very few tasks can be written this way.' },
    { t: 'Write a function that passes this test suite', lvl: 1, k: 'V2 · Test execution', w: 'Run the code in a sandbox. Gameable by special-casing the visible tests instead of solving the task.' },
    { t: 'Solve this competition mathematics problem', lvl: 1, k: 'V1 · Exact match', w: 'Compare the final answer against a stored one. Gameable by guessing a common answer, or luck on multiple choice.' },
    { t: 'Book the meeting room and email the agenda', lvl: 1, k: 'V4 · Environment state', w: 'Ask whether the world ended up in the target state. Gameable by reaching it through a damaging or forbidden route.' },
    { t: 'Check this citation against the source', lvl: 2, k: 'Partial', w: 'A source can be fetched and compared, but judging whether it supports the claim is not decidable.' },
    { t: 'Write a good two-page policy brief', lvl: 2, k: 'V5 · Model-as-judge on a rubric', w: 'A model reads a rubric and marks the answer. Everything that made reward models gameable comes back.' },
    { t: 'Decide which of two reforms India should adopt', lvl: 3, k: 'None', w: 'Contested by construction. No checker exists, and the disagreement is the point.' },
    { t: 'Translate this poem so it still sounds like a poem', lvl: 2, k: 'Weak', w: 'Judgeable against a rubric at best. Two good translations may share almost no words.' }
  ];
  var LEVELS = ['Complete', 'High', 'Partial', 'None'];

  T.widget('verify', function (node) {
    var body = T.shell(node, 'Can a program mark it?', 'Eight tasks',
      '<div class="lab-out vf-card"></div>' +
      '<div class="seg vf-seg" style="margin-top:4px"></div>' +
      '<div class="vf-fb"></div>' +
      '<div class="vf-ladder" style="margin-top:6px"></div>',
      'Framework constructed for the source deck. Checker categories follow Lambert, arXiv:2504.12501, ch. 7; ' +
      'DeepSeek-AI, \u2018DeepSeek-R1\u2019, 2025; Shao et al., \u2018Spurious Rewards\u2019, 2025.');
    var card = body.querySelector('.vf-card'), seg = body.querySelector('.vf-seg'),
        fb = body.querySelector('.vf-fb'), ladder = body.querySelector('.vf-ladder'),
        i = 0, right = 0, placed = [];

    LEVELS.forEach(function (l, idx) {
      var b = document.createElement('button');
      b.type = 'button'; b.textContent = l;
      b.addEventListener('click', function () { answer(idx); });
      seg.appendChild(b);
    });

    function show() {
      if (i >= TASKS.length) {
        card.innerHTML = '<span class="code-no">Done</span><p style="font-size:19px;margin-top:8px">' + right + ' of ' + TASKS.length + ' placed correctly.</p>' +
          '<p class="body-s">The further down the ladder a task sits, the less of the past two years of progress applies to it.</p>';
        seg.style.display = 'none'; fb.innerHTML = ''; drawLadder(); return;
      }
      card.innerHTML = '<span class="code-no">Task ' + (i + 1) + ' of ' + TASKS.length + '</span>' +
        '<p style="font-size:19px;line-height:1.35;margin-top:8px">' + TASKS[i].t + '</p>' +
        '<span class="meta" style="display:block;margin-top:10px">How automatically verifiable is it?</span>';
    }
    function answer(idx) {
      var task = TASKS[i], ok = idx === task.lvl;
      if (ok) right++;
      placed.push(task);
      fb.innerHTML = '<div class="aside"><span class="chip ' + (ok ? 'chip-soft' : 'chip-neg') + '">' +
        (ok ? 'Correct' : 'The answer is ' + LEVELS[task.lvl]) + '</span>' +
        '<p class="body-s" style="margin-top:8px"><b style="font-weight:500">' + task.k + '.</b> ' + task.w + '</p>' +
        '<button class="btn btn-s btn-ghost vf-next" type="button" style="margin-top:10px">Next task</button></div>';
      fb.querySelector('.vf-next').addEventListener('click', function () { i++; fb.innerHTML = ''; show(); drawLadder(); });
      drawLadder();
    }
    function drawLadder() {
      var rows = LEVELS.map(function (l, idx) {
        var here = placed.filter(function (t) { return t.lvl === idx; });
        return '<div style="display:grid;grid-template-columns:110px 1fr;gap:14px;padding:9px 0;border-bottom:1px solid rgba(23,20,19,0.16)">' +
          '<span class="meta">' + l + '</span><span class="body-s" style="color:#171413">' +
          (here.length ? here.map(function (t) { return t.t; }).join('; ') : '<span class="ink-50">\u2014</span>') + '</span></div>';
      }).join('');
      ladder.innerHTML = '<span class="meta" style="display:block;margin-bottom:6px">The verifiability gradient, filling up as you go</span>' +
        '<div style="border-top:2px solid #171413">' + rows + '</div>';
    }
    show(); drawLadder();
  });

  /* =========================================================================
     GRPO — group relative advantage
     ========================================================================= */

  T.widget('grpo', function (node) {
    var res = [0, 1, 1, 0, 1, 0];
    var body = T.shell(node, 'Score answers against each other', 'Flip the marks',
      '<p class="body-s">Six answers to the same prompt. Tap any one to change what the checker said, and watch the group\u2019s own average do the work a whole extra network used to do.</p>' +
      '<div class="gr-grid"></div><div class="lab-out gr-out"></div>',
      'Introduced in DeepSeekMath, arXiv:2402.03300, and used at scale in DeepSeek-R1. Comparison with PPO, REINFORCE and RLOO in ' +
      'Lambert, arXiv:2504.12501, ch. 6.');
    var grid = body.querySelector('.gr-grid'), out = body.querySelector('.gr-out');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(6,1fr);border-top:1px solid rgba(23,20,19,0.16);border-left:1px solid rgba(23,20,19,0.16)';
    if (window.matchMedia('(max-width:620px)').matches) grid.style.gridTemplateColumns = 'repeat(3,1fr)';

    function render() {
      var mean = res.reduce(function (a, b) { return a + b; }, 0) / res.length;
      grid.innerHTML = '';
      res.forEach(function (r, i) {
        var adv = r - mean;
        var b = document.createElement('button');
        b.type = 'button';
        b.style.cssText = 'padding:14px 10px;background:' + (r ? '#f5e6ec' : '#fff') + ';border:none;text-align:left;' +
          'border-right:1px solid rgba(23,20,19,0.16);border-bottom:1px solid rgba(23,20,19,0.16);cursor:pointer;color:#171413';
        b.innerHTML = '<span class="code-no">A' + (i + 1) + '</span>' +
          '<span style="display:block;font-family:\'Roboto Mono\',monospace;font-size:11px;letter-spacing:.1em;margin:8px 0 6px;color:' +
          (r ? '#2f6b4a' : '#a3282d') + '">' + (r ? 'PASSED' : 'FAILED') + '</span>' +
          '<span style="display:block;font-size:20px">' + (adv > 0 ? '+' : '') + adv.toFixed(2) + '</span>' +
          '<span class="meta" style="font-size:9px">' + (adv > 0 ? 'pushed up' : adv < 0 ? 'pushed down' : 'no signal') + '</span>';
        b.addEventListener('click', function () { res[i] = res[i] ? 0 : 1; render(); });
        grid.appendChild(b);
      });
      var uniform = mean === 0 || mean === 1;
      out.innerHTML = '<dl class="deflist">' +
        '<dt>Group average</dt><dd>' + mean.toFixed(2) + ' \u2014 this is the baseline, and no separate network was needed to produce it</dd>' +
        '<dt>What happens</dt><dd>' + (uniform
          ? 'Every advantage is zero. The step teaches nothing at all and the compute is wasted. This is the known weakness of the method: a prompt that is too easy or too hard for the current model is a prompt worth skipping.'
          : 'Answers above the average are made more likely; answers below it are made less likely. Small steps only.') + '</dd>' +
        '</dl>';
    }
    render();
  });

  /* =========================================================================
     AGENTIC EPISODE — credit assignment
     ========================================================================= */

  T.widget('agentic', function (node) {
    var steps = [
      { w: 'MODEL', a: 'Read the task' }, { w: 'TOOL', a: 'Call search' }, { w: 'MODEL', a: 'Read the result' },
      { w: 'MODEL', a: 'Write code' }, { w: 'TOOL', a: 'Run the tests' }, { w: 'MODEL', a: 'Read the failure' },
      { w: 'MODEL', a: 'Fix and rerun' }, { w: 'MODEL', a: 'Submit' }
    ];
    var body = T.shell(node, 'One episode, one mark at the end', 'Find the mistake',
      '<p class="body-s">The whole episode scored zero. Tap the step you think caused it.</p>' +
      '<div class="ag-strip"></div><div class="lab-out ag-out"></div>',
      '\u2018Scaling Agentic RL: High-Throughput Agentic Training with Tunix\u2019, Google Developers Blog, 2026; ' +
      '\u2018Building Efficient RL Training for the Agentic Era\u2019, Salesforce AI Research, 2026. Both developer-authored, benchmarks not independently reproduced.');
    var strip = body.querySelector('.ag-strip'), out = body.querySelector('.ag-out');
    strip.style.cssText = 'display:flex;flex-wrap:wrap;border-top:1px solid rgba(23,20,19,0.16);border-left:1px solid rgba(23,20,19,0.16)';

    steps.forEach(function (s, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.style.cssText = 'flex:1 1 110px;min-width:110px;text-align:left;padding:12px 12px 14px;background:' +
        (s.w === 'TOOL' ? '#fcf0d9' : '#fff') + ';border:none;border-right:1px solid rgba(23,20,19,0.16);' +
        'border-bottom:1px solid rgba(23,20,19,0.16);cursor:pointer;color:#171413';
      b.innerHTML = '<span class="meta" style="font-size:9px">' + s.w + '</span>' +
        '<span style="display:block;font-size:13.5px;margin-top:5px;line-height:1.3">' + s.a + '</span>';
      b.addEventListener('click', function () { guess(i); });
      strip.appendChild(b);
    });
    var last = document.createElement('div');
    last.style.cssText = 'flex:1 1 110px;min-width:110px;padding:12px;background:#620d3c;color:#fff;' +
      'border-right:1px solid rgba(23,20,19,0.16);border-bottom:1px solid rgba(23,20,19,0.16)';
    last.innerHTML = '<span class="meta" style="font-size:9px;color:rgba(255,255,255,0.55)">REWARD</span>' +
      '<span style="display:block;font-size:24px;margin-top:5px">0</span>';
    strip.appendChild(last);

    out.innerHTML = '<span class="meta">Waiting</span><p class="body-s" style="margin-top:8px">Pick a step.</p>';
    function guess(i) {
      out.innerHTML = '<span class="code-no">Step ' + (i + 1) + ' \u00b7 ' + steps[i].a.toUpperCase() + '</span>' +
        '<p class="body-s" style="margin-top:10px">Possibly. The single number at the end cannot tell you, and neither can the model. ' +
        'That is the credit assignment problem: two hundred decisions, one bit of feedback. Learning is slow and noisy, and the ' +
        'engineering is worse \u2014 the accelerators sit idle while real tools run, so a batch waits for its slowest episode.</p>';
    }
  });

  /* =========================================================================
     QUANTISATION — bits, gigabytes, and which machine it fits
     ========================================================================= */

  T.widget('quantise', function (node) {
    var opts = [
      { b: 16, l: '16-bit (FP16)', gb: 140, note: 'The precision most models are trained in.' },
      { b: 8, l: '8-bit (FP8/INT8)', gb: 70, note: 'The commonest served format. Quality loss is usually small.' },
      { b: 4, l: '4-bit (INT4)', gb: 35, note: 'Aggressive. Accuracy degrades unevenly across tasks.' }
    ];
    var body = T.shell(node, 'Store each number in fewer bits', 'Pick a precision',
      '<div class="seg qz-seg"></div><div class="qz-bars"></div><div class="lab-out qz-out"></div>',
      'Own calculation: parameters \u00d7 bytes per parameter, for a 70-billion-parameter model. Excludes activations and the KV cache. ' +
      'Method: Frantar et al., \u2018GPTQ\u2019, arXiv:2210.17323. Accuracy-loss figures circulating in vendor material are not relied on here.');
    var seg = body.querySelector('.qz-seg'), bars = body.querySelector('.qz-bars'), out = body.querySelector('.qz-out'), cur = 0;

    opts.forEach(function (o, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.textContent = o.b + '-bit';
      b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
      b.addEventListener('click', function () {
        cur = i;
        Array.prototype.forEach.call(seg.children, function (c, j) { c.setAttribute('aria-pressed', j === i ? 'true' : 'false'); });
        render();
      });
      seg.appendChild(b);
    });

    function fits(gb) {
      if (gb > 100) return 'Four 40 GB accelerators, or two 80 GB ones. A data-centre machine.';
      if (gb > 45) return 'One 80 GB accelerator, just. A single server card.';
      return 'Two consumer cards, or one 48 GB workstation card. No data centre required.';
    }
    function render() {
      bars.innerHTML = opts.map(function (o, i) {
        return T.bar(o.l, (o.gb / 140) * 100, o.gb + ' GB', i === cur ? 'gold' : '');
      }).join('');
      var o = opts[cur];
      out.innerHTML = '<dl class="deflist">' +
        '<dt>Memory</dt><dd>' + o.gb + ' GB for the weights alone</dd>' +
        '<dt>Runs on</dt><dd>' + fits(o.gb) + '</dd>' +
        '<dt>Note</dt><dd>' + o.note + '</dd></dl>' +
        '<p class="body-s" style="margin-top:12px">The interesting question is not the percentage saved. It is which hardware the model becomes runnable on, because that decides who can run it.</p>';
    }
    render();
  });

})(window.T);
