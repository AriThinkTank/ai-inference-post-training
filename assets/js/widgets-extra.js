/* =========================================================================
   widgets-extra.js — the deeper interactive pieces.

   sampler      step-by-step: logits -> temperature -> softmax -> cut -> draw
   basevpost    the same prompt through a base model and a post-trained one
   qkv          what attention is actually doing, one word at a time
   transformer  a token's journey through the whole stack
   pipeline3    the canonical three-stage RLHF recipe, with real data volumes
   pertoken     per-token learning versus response-level learning

   Requires widgets-train.js for T.widget, T.h, T.esc, T.bar, T.shell.
   ========================================================================= */

window.T = window.T || {};
(function (T) {
  'use strict';

  function fmt(n, d) { return Number(n).toFixed(d === undefined ? 2 : d); }
  function pct(n) { return (n * 100).toFixed(1) + '%'; }

  /* =========================================================================
     SAMPLER — the whole pipeline, one stage at a time
     ========================================================================= */

  var TOKENS = [
    { t: 'programme', l: 5.0 },
    { t: 'blending',  l: 4.7 },
    { t: 'industry',  l: 4.4 },
    { t: 'sector',    l: 4.0 },
    { t: 'policy',    l: 3.4 },
    { t: 'ethanol',   l: 2.9 }
  ];

  var STAGES = [
    {
      n: 'Raw scores',
      q: 'What the model actually hands over',
      d: 'The model finishes its sweep and produces one number per token. These are called <b>logits</b>. They are not probabilities. They can be negative, they do not add up to anything in particular, and only the gaps between them carry meaning.'
    },
    {
      n: 'Divide by temperature',
      q: 'What the temperature dial does, exactly',
      d: 'Every logit is divided by the temperature. That is the entire operation. Divide by a number below 1 and the gaps stretch apart, so the leader pulls ahead. Divide by a number above 1 and the gaps squash together, so the also-rans catch up. At temperature 1 nothing happens at all.'
    },
    {
      n: 'Softmax',
      q: 'Turning scores into probabilities',
      d: 'Raise <i>e</i> to the power of each score, then divide each by the total. Everything comes out positive and the whole set adds up to 100%. Because it is exponential, small gaps in the scores become large gaps in the probabilities, which is why temperature has such a dramatic effect.'
    },
    {
      n: 'Apply the cut',
      q: 'What k and p mean',
      d: 'This is the truncation step, and it happens after the probabilities exist. Whatever the rule removes is gone: it cannot be drawn no matter how the dice fall.'
    },
    {
      n: 'Renormalise',
      q: 'Sharing out what the cut left behind',
      d: 'The survivors no longer add up to 100%, so each is divided by the surviving total. The probability that belonged to the cut tokens gets redistributed among the ones still standing, in proportion to what they already had.'
    },
    {
      n: 'Draw',
      q: 'Rolling the dice',
      d: 'Pick a random number between 0 and 1 and walk down the list adding probabilities until you pass it. That token is the output. It gets stuck on the end of the text, and the model is asked all over again.'
    }
  ];

  T.widget('sampler', function (node) {
    var stage = 0, temp = 1.0, mode = 'topp', k = 3, p = 0.8, drawn = null;

    var body = T.shell(node, 'The sampler, one step at a time', 'Step through it',
      '<div class="sm-ctl"></div>' +
      '<div class="sm-stage"></div>' +
      '<div class="sm-table"></div>' +
      '<div class="lab-out sm-say"></div>' +
      '<div class="row sm-nav" style="margin-top:16px"></div>',
      'Logits are illustrative and the tail of 128,000 other tokens is left out so the arithmetic stays readable. ' +
      'The operations themselves are exactly what runs in production. Mechanism: Vaswani et al., ' +
      '<a class="link" href="https://arxiv.org/abs/1706.03762" target="_blank" rel="noopener">arXiv:1706.03762</a>; ' +
      'nucleus sampling: Holtzman et al., <a class="link" href="https://arxiv.org/abs/1904.09751" target="_blank" rel="noopener">arXiv:1904.09751</a>.');

    var ctl = body.querySelector('.sm-ctl'),
        stg = body.querySelector('.sm-stage'),
        tab = body.querySelector('.sm-table'),
        say = body.querySelector('.sm-say'),
        nav = body.querySelector('.sm-nav');

    ctl.innerHTML =
      '<div class="lab-controls">' +
        '<label class="ctl"><span class="meta">Temperature <b class="sm-tv">1.00</b></span>' +
          '<input type="range" class="sm-t" min="10" max="200" value="100"></label>' +
        '<label class="ctl"><span class="meta">Rule</span>' +
          '<span class="seg sm-mode">' +
            '<button type="button" data-m="none">None</button>' +
            '<button type="button" data-m="topk">Top-k</button>' +
            '<button type="button" data-m="topp" class="on">Top-p</button>' +
          '</span></label>' +
        '<label class="ctl sm-kw"><span class="meta">k = <b class="sm-kv">3</b> tokens kept</span>' +
          '<input type="range" class="sm-k" min="1" max="6" value="3"></label>' +
        '<label class="ctl sm-pw"><span class="meta">p = <b class="sm-pv">0.80</b> of the probability</span>' +
          '<input type="range" class="sm-p" min="10" max="100" value="80"></label>' +
      '</div>';

    var tEl = ctl.querySelector('.sm-t'), kEl = ctl.querySelector('.sm-k'), pEl = ctl.querySelector('.sm-p');

    function compute() {
      var scaled = TOKENS.map(function (o) { return { t: o.t, l: o.l, s: o.l / temp }; });
      var mx = Math.max.apply(null, scaled.map(function (o) { return o.s; }));
      var ex = scaled.map(function (o) { return Object.assign({}, o, { e: Math.exp(o.s - mx) }); });
      var sum = ex.reduce(function (a, o) { return a + o.e; }, 0);
      var pr = ex.map(function (o) { return Object.assign({}, o, { p: o.e / sum }); });
      pr.sort(function (a, b) { return b.p - a.p; });

      var keep;
      if (mode === 'topk') {
        keep = pr.slice(0, k);
      } else if (mode === 'topp') {
        keep = []; var acc = 0;
        for (var i = 0; i < pr.length; i++) { keep.push(pr[i]); acc += pr[i].p; if (acc >= p) break; }
      } else {
        keep = pr.slice();
      }
      var ksum = keep.reduce(function (a, o) { return a + o.p; }, 0);
      return pr.map(function (o) {
        var kept = keep.indexOf(o) > -1;
        return Object.assign({}, o, { kept: kept, fin: kept ? o.p / ksum : 0 });
      });
    }

    function renderCtl() {
      ctl.querySelector('.sm-tv').textContent = fmt(temp);
      ctl.querySelector('.sm-kv').textContent = k;
      ctl.querySelector('.sm-pv').textContent = fmt(p);
      ctl.querySelector('.sm-kw').style.opacity = mode === 'topk' ? 1 : 0.3;
      ctl.querySelector('.sm-pw').style.opacity = mode === 'topp' ? 1 : 0.3;
      kEl.disabled = mode !== 'topk'; pEl.disabled = mode !== 'topp';
      Array.prototype.forEach.call(ctl.querySelectorAll('.sm-mode button'), function (b) {
        b.classList.toggle('on', b.getAttribute('data-m') === mode);
      });
    }

    function render() {
      renderCtl();
      var d = compute(), s = STAGES[stage];

      stg.innerHTML =
        '<div class="sm-track">' +
          STAGES.map(function (x, i) {
            return '<button type="button" class="sm-dot' + (i === stage ? ' on' : '') + (i < stage ? ' done' : '') +
              '" data-i="' + i + '"><span>' + (i + 1) + '</span>' + T.esc(x.n) + '</button>';
          }).join('') +
        '</div>' +
        '<h4 class="h-card" style="margin:22px 0 8px">' + s.q + '</h4>' +
        '<p class="body-s" style="max-width:70ch">' + s.d + '</p>';

      Array.prototype.forEach.call(stg.querySelectorAll('.sm-dot'), function (b) {
        b.addEventListener('click', function () { stage = +b.getAttribute('data-i'); drawn = null; render(); });
      });

      var rows = d.map(function (o) {
        var cells = [];
        cells.push('<td class="sm-tok">' + T.esc(o.t) + '</td>');
        cells.push('<td class="num">' + fmt(o.l) + '</td>');
        if (stage >= 1) cells.push('<td class="num' + (stage === 1 ? ' hit' : '') + '">' + fmt(o.s) + '</td>');
        if (stage >= 2) cells.push('<td class="num' + (stage === 2 ? ' hit' : '') + '">' + pct(o.p) + '</td>');
        if (stage >= 3) cells.push('<td class="num' + (stage === 3 ? ' hit' : '') + '">' + (o.kept ? 'keep' : 'cut') + '</td>');
        if (stage >= 4) cells.push('<td class="num' + (stage === 4 ? ' hit' : '') + '">' + (o.kept ? pct(o.fin) : '&mdash;') + '</td>');
        var w = stage >= 4 ? o.fin : (stage >= 2 ? o.p : 0);
        cells.push('<td class="sm-bar"><span class="track"><span class="fill' +
          (stage >= 3 && !o.kept ? ' cut' : '') + '" style="width:' + (w * 100).toFixed(1) + '%"></span></span></td>');
        var dim = stage >= 3 && !o.kept;
        return '<tr class="' + (dim ? 'is-cut' : '') + (drawn === o.t ? ' is-drawn' : '') + '">' + cells.join('') + '</tr>';
      }).join('');

      var head = ['Token', 'Logit'];
      if (stage >= 1) head.push('&divide; T');
      if (stage >= 2) head.push('Softmax');
      if (stage >= 3) head.push('Cut?');
      if (stage >= 4) head.push('Final');
      head.push('');

      tab.innerHTML = '<div class="table-wrap sm-tw"><table class="sm-t2"><thead><tr>' +
        head.map(function (h) { return '<th>' + h + '</th>'; }).join('') +
        '</tr></thead><tbody>' + rows + '</tbody></table></div>';

      /* the running commentary changes with the settings, not just the stage */
      var kept = d.filter(function (o) { return o.kept; });
      var msg;
      if (stage === 1) {
        msg = temp === 1
          ? 'Temperature is exactly 1, so dividing changes nothing. The column is identical to the one before it. Move the dial and watch this column move.'
          : (temp < 1
            ? 'Dividing by ' + fmt(temp) + ' makes every score bigger and pushes the gaps <b>wider</b>. The leader is about to run away with it.'
            : 'Dividing by ' + fmt(temp) + ' shrinks every score and squeezes the gaps <b>closer together</b>. The outsiders are about to get a real chance.');
      } else if (stage === 2) {
        msg = 'The favourite now sits at ' + pct(d[0].p) + ' and the longest shot at ' + pct(d[d.length - 1].p) +
          '. At temperature ' + fmt(temp) + ' the gap between them is ' + fmt(d[0].p / d[d.length - 1].p, 1) + ' to 1.';
      } else if (stage === 3) {
        if (mode === 'none') msg = 'No rule is on, so nothing is cut. Every token in the vocabulary can still come out, including the daft ones.';
        else if (mode === 'topk') msg = '<b>k = ' + k + '</b> means keep the ' + k + ' highest-scoring tokens and bin the rest, whatever their probabilities happen to be. A fixed headcount. Simple, and blunt when the model is very sure or very unsure.';
        else msg = '<b>p = ' + fmt(p) + '</b> means work down the ranked list adding probabilities, and stop as soon as the running total reaches ' + fmt(p) +
          '. Here that takes <b>' + kept.length + '</b> token' + (kept.length === 1 ? '' : 's') +
          '. The headcount is not fixed: when the model is confident, p keeps very few; when it is unsure, p keeps many. That adaptiveness is why it is the usual default.';
      } else if (stage === 4) {
        var lost = d.filter(function (o) { return !o.kept; }).reduce(function (a, o) { return a + o.p; }, 0);
        msg = lost > 0.0001
          ? pct(lost) + ' of probability belonged to the cut tokens. It has been shared out among the ' + kept.length + ' survivors, so ' +
            T.esc(d[0].t) + ' rises from ' + pct(d[0].p) + ' to ' + pct(d[0].fin) + '.'
          : 'Nothing was cut, so renormalising leaves everything exactly as it was.';
      } else if (stage === 5) {
        msg = drawn
          ? 'Drew <b>' + T.esc(drawn) + '</b>. Press again. It will not always be the same word, and that is the point.'
          : 'Press draw. With these settings the favourite comes up about ' + pct(d[0].fin) + ' of the time.';
      } else {
        msg = 'Six candidates shown. The real list has 128,005 entries and the model produces all of them on every single token.';
      }
      say.innerHTML = msg;

      nav.innerHTML =
        '<button class="btn btn-s btn-ghost sm-back" type="button"' + (stage === 0 ? ' disabled' : '') + '>&larr; Back</button>' +
        (stage < 5
          ? '<button class="btn btn-s sm-next" type="button">Next: ' + STAGES[stage + 1].n + ' &rarr;</button>'
          : '<button class="btn btn-s sm-draw" type="button">Draw a token</button>') +
        '<button class="btn btn-s btn-ghost sm-reset" type="button">Start again</button>';

      var bk = nav.querySelector('.sm-back'), nx = nav.querySelector('.sm-next'),
          dw = nav.querySelector('.sm-draw'), rs = nav.querySelector('.sm-reset');
      if (bk) bk.addEventListener('click', function () { if (stage > 0) { stage--; drawn = null; render(); } });
      if (nx) nx.addEventListener('click', function () { stage++; render(); });
      if (rs) rs.addEventListener('click', function () { stage = 0; drawn = null; render(); });
      if (dw) dw.addEventListener('click', function () {
        var r = Math.random(), acc = 0, pick = null;
        for (var i = 0; i < d.length; i++) { if (!d[i].kept) continue; acc += d[i].fin; if (r <= acc) { pick = d[i].t; break; } }
        drawn = pick || d[0].t; render();
      });
    }

    tEl.addEventListener('input', function () { temp = +tEl.value / 100; if (stage < 1) stage = 1; drawn = null; render(); });
    kEl.addEventListener('input', function () { k = +kEl.value; if (stage < 3) stage = 3; drawn = null; render(); });
    pEl.addEventListener('input', function () { p = +pEl.value / 100; if (stage < 3) stage = 3; drawn = null; render(); });
    Array.prototype.forEach.call(ctl.querySelectorAll('.sm-mode button'), function (b) {
      b.addEventListener('click', function () { mode = b.getAttribute('data-m'); if (stage < 3) stage = 3; drawn = null; render(); });
    });

    render();
  });

  /* =========================================================================
     BASE vs POST-TRAINED — the same prompt, two models
     ========================================================================= */

  T.widget('basevpost', function (node) {
    var which = 'base';

    var BASE = 'George W. Bush, the governor of Florida in 2006 was Jeb Bush, and John McCain was an Arizona senator in 2006 \u2014 ' +
      'who later lost to obama. September 1 \u2014 U.S. President Bush signs an executive order to provide more options for faith-based ' +
      'organizations when delivering social services that are paid for with federal funds. January 1 \u2014 The current deadline set by ' +
      'United States Congress in the Unlawful Internet Gambling Enforcement Act, aka UIGEA. search: Amendments to the 1961 International ' +
      'Convention for the Protection of New Varieties of Plants require plant breeders\u2019 rights include farmer\u2019s privilege. ' +
      '2009 was a common year starting on Thursday of the Gregorian calendar\u2026';

    var POST = 'George W. Bush was the president of the United States in 2006. He served two terms in office, from January 20, 2001, ' +
      'to January 20, 2009.';

    var body = T.shell(node, 'The same prompt, two models', 'Flip between them',
      '<div class="bp-prompt"></div><div class="seg bp-seg" style="margin:18px 0"></div>' +
      '<div class="bp-out"></div><div class="lab-out bp-note"></div>',
      'Both responses are quoted from Lambert, <a class="link" href="https://rlhfbook.com" target="_blank" rel="noopener">rlhfbook.com</a>, ch. 3. ' +
      'Base model: Llama 3.1 405B Base. Post-trained model: T\u00fclu 3 405B. Same prompt, same underlying scale.');

    var pr = body.querySelector('.bp-prompt'), seg = body.querySelector('.bp-seg'),
        out = body.querySelector('.bp-out'), note = body.querySelector('.bp-note');

    pr.innerHTML = '<span class="meta">The prompt, given to both</span>' +
      '<p class="bp-q">\u201cThe president of the united states in 2006 was\u201d</p>';

    seg.innerHTML = '<button type="button" data-w="base" class="on">Llama 3.1 405B Base</button>' +
      '<button type="button" data-w="post">T\u00fclu 3 405B (post-trained)</button>';

    function render() {
      var isBase = which === 'base';
      Array.prototype.forEach.call(seg.querySelectorAll('button'), function (b) {
        b.classList.toggle('on', b.getAttribute('data-w') === which);
      });
      out.innerHTML = '<div class="bp-card ' + (isBase ? 'base' : 'post') + '">' +
        '<span class="meta">' + (isBase ? 'What a base model does' : 'What post-training bought') + '</span>' +
        '<p class="bp-text">' + (isBase ? BASE : POST) + '</p></div>';
      note.innerHTML = isBase
        ? 'It is not wrong. It gets the answer right in the first four words, then carries on writing the rest of the web page: ' +
          'a list of other 2006 facts, a stray <i>search:</i> line, a Wikipedia-style year summary. It was never asked to answer. ' +
          'It was asked what text usually comes next, and text like this is usually followed by more text like this.'
        : 'Same scale of model. It answers, it stops, and it adds the one piece of context a person would want. ' +
          'Nothing here is knowledge the base model lacked. What changed is that somebody taught it that a question is a request, not a prefix.';
    }

    Array.prototype.forEach.call(seg.querySelectorAll('button'), function (b) {
      b.addEventListener('click', function () { which = b.getAttribute('data-w'); render(); });
    });
    render();
  });

  /* =========================================================================
     QKV — what attention actually does
     ========================================================================= */

  T.widget('qkv', function (node) {
    var SENT = ['The', 'ethanol', 'policy', 'that', 'the', 'ministry', 'announced', 'last', 'year', 'was'];
    /* illustrative attention weights: for each query index, weights over 0..i */
    var W = {
      9: [0.02, 0.10, 0.41, 0.02, 0.01, 0.13, 0.19, 0.04, 0.06, 0.02],
      6: [0.02, 0.06, 0.14, 0.03, 0.02, 0.63, 0.10],
      2: [0.11, 0.72, 0.17],
      8: [0.02, 0.03, 0.06, 0.02, 0.02, 0.05, 0.09, 0.66, 0.05]
    };
    var pick = 9;

    var body = T.shell(node, 'What a word is looking at', 'Tap a word',
      '<div class="qk-sent"></div><div class="qk-out"></div>' +
      '<div class="lab-out qk-say"></div>',
      'Weights are illustrative, chosen to show the shape of a real attention pattern rather than measured from a model. ' +
      'Mechanism: Vaswani et al., <a class="link" href="https://arxiv.org/abs/1706.03762" target="_blank" rel="noopener">arXiv:1706.03762</a>.');

    var sent = body.querySelector('.qk-sent'), out = body.querySelector('.qk-out'), say = body.querySelector('.qk-say');

    function render() {
      sent.innerHTML = '<span class="meta" style="display:block;margin-bottom:10px">The sentence so far. Tap any highlighted word to see what it attends to.</span>' +
        SENT.map(function (w, i) {
          var can = !!W[i];
          return '<button type="button" class="qk-w' + (i === pick ? ' on' : '') + (can ? '' : ' off') +
            '" data-i="' + i + '"' + (can ? '' : ' disabled') + '>' + T.esc(w) + '</button>';
        }).join('');

      var w = W[pick];
      out.innerHTML = '<span class="meta" style="display:block;margin:18px 0 10px">Attention from \u201c' + T.esc(SENT[pick]) + '\u201d</span>' +
        w.map(function (v, i) {
          return T.bar(T.esc(SENT[i]), v * 100, (v * 100).toFixed(0) + '%', v > 0.3 ? '' : (v > 0.12 ? 'gold' : 'teal'));
        }).join('') +
        '<span class="meta" style="display:block;margin-top:10px">A word can only look backwards. Everything after it does not exist yet.</span>';

      var top = w.indexOf(Math.max.apply(null, w));
      var says = {
        9: 'To work out what comes after <i>was</i>, the model leans hardest on <b>policy</b> \u2014 the subject of the sentence, seven words back. ' +
           'It is not reading left to right and forgetting. Every word can reach every earlier word directly, and that is the whole trick of the transformer.',
        6: '<i>announced</i> looks almost entirely at <b>ministry</b>. Who did the announcing. This is the pattern that lets a model track who did what to whom across a long paragraph.',
        2: '<i>policy</i> looks back at <b>ethanol</b>, which is what kind of policy it is. Adjacent words, ordinary agreement.',
        8: '<i>year</i> looks at <b>last</b>, and almost nothing else. Some attention heads only ever do this sort of local bookkeeping.'
      };
      say.innerHTML = says[pick] || ('Strongest link: <b>' + T.esc(SENT[top]) + '</b>.');

      Array.prototype.forEach.call(sent.querySelectorAll('.qk-w'), function (b) {
        b.addEventListener('click', function () { pick = +b.getAttribute('data-i'); render(); });
      });
    }
    render();
  });

  /* =========================================================================
     TRANSFORMER — a token's journey
     ========================================================================= */

  var TSTEPS = [
    { n: 'Tokenise', s: 'Text in',
      d: 'Your sentence is chopped into tokens and each one is swapped for its ID number. The model never sees letters again.',
      x: '"ethanol policy" \u2192 [15339, 4272]' },
    { n: 'Embed', s: 'Numbers to vectors',
      d: 'Each ID is looked up in a giant table and becomes a list of a few thousand numbers. Words used in similar ways end up with similar lists. This table is learned, not designed.',
      x: '15339 \u2192 [0.21, \u22120.44, 0.08, \u2026] (4,096 numbers)' },
    { n: 'Add position', s: 'Where it sits',
      d: 'Attention has no built-in sense of order, so position information is mixed in. Without it, "India exports ethanol" and "ethanol exports India" would look identical.',
      x: 'vector + position 2' },
    { n: 'Attention', s: 'Look at the others',
      d: 'Each token asks a question (query), every token offers a label (key) and some content (value). Matching questions to labels decides who listens to whom. Do it several ways at once and you have multi-head attention.',
      x: 'Q \u00b7 K \u2192 weights \u2192 weighted sum of V' },
    { n: 'Feed-forward', s: 'Think about it alone',
      d: 'Each token now goes through a small two-layer network on its own, no looking sideways. This is where most of the parameters live, and where most of the stored knowledge is thought to sit.',
      x: 'up-project, non-linearity, down-project' },
    { n: 'Repeat', s: '\u00d7 80 layers',
      d: 'Attention and feed-forward, over and over. Early layers handle grammar and word identity. Later layers handle meaning, task and intent. Each layer adds to a running total rather than replacing it, which is why very deep stacks train at all.',
      x: 'layer 1 \u2192 layer 2 \u2192 \u2026 \u2192 layer 80' },
    { n: 'Unembed', s: 'Back to words',
      d: 'The final vector is multiplied against the vocabulary table to give one score for every token. Those scores are the logits, and the sampler takes over from here.',
      x: '\u2192 128,000 logits' }
  ];

  T.widget('transformer', function (node) {
    var i = 0;
    var body = T.shell(node, 'One token\u2019s journey through the model', 'Walk through it',
      '<div class="tf-rail"></div><div class="tf-panel"></div><div class="row tf-nav" style="margin-top:18px"></div>',
      'A simplified path. Layer normalisation and residual connections are left out of the diagram for clarity and mentioned in step 6. ' +
      'Full treatment: Vaswani et al., <a class="link" href="https://arxiv.org/abs/1706.03762" target="_blank" rel="noopener">arXiv:1706.03762</a>; ' +
      'Austin et al., <a class="link" href="https://jax-ml.github.io/scaling-book" target="_blank" rel="noopener">How To Scale Your Model</a>, ch. 1.');

    var rail = body.querySelector('.tf-rail'), pan = body.querySelector('.tf-panel'), nav = body.querySelector('.tf-nav');

    function render() {
      rail.innerHTML = TSTEPS.map(function (s, j) {
        return '<button type="button" class="tf-step' + (j === i ? ' on' : '') + (j < i ? ' done' : '') +
          '" data-i="' + j + '"><b>' + (j + 1) + '</b><span>' + T.esc(s.n) + '</span></button>';
      }).join('');
      var s = TSTEPS[i];
      pan.innerHTML =
        '<div class="tf-body">' +
          '<span class="meta">Step ' + (i + 1) + ' of ' + TSTEPS.length + ' &middot; ' + T.esc(s.s) + '</span>' +
          '<h4 class="h-feature" style="margin:10px 0 12px;font-size:26px">' + T.esc(s.n) + '</h4>' +
          '<p class="body-s" style="max-width:66ch">' + s.d + '</p>' +
          '<div class="tf-eg"><span class="meta">What it looks like</span><code>' + T.esc(s.x) + '</code></div>' +
        '</div>';
      nav.innerHTML =
        '<button class="btn btn-s btn-ghost tf-b" type="button"' + (i === 0 ? ' disabled' : '') + '>&larr; Back</button>' +
        '<button class="btn btn-s tf-f" type="button"' + (i === TSTEPS.length - 1 ? ' disabled' : '') + '>Next &rarr;</button>';
      Array.prototype.forEach.call(rail.querySelectorAll('.tf-step'), function (b) {
        b.addEventListener('click', function () { i = +b.getAttribute('data-i'); render(); });
      });
      nav.querySelector('.tf-b').addEventListener('click', function () { if (i > 0) { i--; render(); } });
      nav.querySelector('.tf-f').addEventListener('click', function () { if (i < TSTEPS.length - 1) { i++; render(); } });
    }
    render();
  });

  /* =========================================================================
     PIPELINE3 — the canonical three-stage recipe
     ========================================================================= */

  var P3 = [
    { n: 'Instruction tuning', v: '~10,000 examples',
      d: 'Take the base model and show it question-and-answer pairs, mostly written by people. It learns the format, and picks up some basic skills along the way.',
      w: 'Teaches the shape of a conversation. This is the step that turns a text continuer into something you can talk to.',
      c: 'Cheap. Days, not months.' },
    { n: 'Reward model', v: '~100,000 pairwise comparisons',
      d: 'Start from the instruction-tuned checkpoint and train it to predict which of two answers a person preferred. The output is a single number standing for quality.',
      w: 'Reinforcement learning needs a reward function, and "was that a good answer" is not something you can write down. So you learn it instead.',
      c: 'The original paper used 33,000 prompts.' },
    { n: 'RLHF', v: '~100,000 prompts',
      d: 'Feed the model prompts, let it generate answers, have the reward model score them, and nudge the parameters so the better answers become more likely.',
      w: 'This is where the model actually changes its behaviour. It is told what a better answer looks like, and also what to avoid.',
      c: 'The original paper used 31,000 prompts, and does not say whether they were reused from the earlier stages.' }
  ];

  T.widget('pipeline3', function (node) {
    var i = 0;
    var body = T.shell(node, 'The recipe everyone still starts from', 'Tap a stage',
      '<div class="p3-row"></div><div class="lab-out p3-out"></div>',
      'The three-stage recipe as established with OpenAI\u2019s InstructGPT in 2022. Data volumes from Ouyang et al., ' +
      '<a class="link" href="https://arxiv.org/abs/2203.02155" target="_blank" rel="noopener">arXiv:2203.02155</a>, ' +
      'as summarised in Lambert, <a class="link" href="https://rlhfbook.com" target="_blank" rel="noopener">rlhfbook.com</a>, ch. 3. ' +
      'Modern recipes run many more stages and many more rounds.');

    var row = body.querySelector('.p3-row'), out = body.querySelector('.p3-out');

    function render() {
      row.innerHTML = P3.map(function (s, j) {
        return '<button type="button" class="p3-card' + (j === i ? ' on' : '') + '" data-i="' + j + '">' +
          '<span class="code-no">Stage ' + (j + 1) + '</span>' +
          '<b>' + T.esc(s.n) + '</b>' +
          '<span class="p3-v">' + T.esc(s.v) + '</span></button>' +
          (j < P3.length - 1 ? '<span class="p3-arrow" aria-hidden="true">&rarr;</span>' : '');
      }).join('');
      var s = P3[i];
      out.innerHTML = '<dl class="deflist">' +
        '<dt>What happens</dt><dd>' + s.d + '</dd>' +
        '<dt>Why</dt><dd>' + s.w + '</dd>' +
        '<dt>Note</dt><dd>' + s.c + '</dd></dl>';
      Array.prototype.forEach.call(row.querySelectorAll('.p3-card'), function (b) {
        b.addEventListener('click', function () { i = +b.getAttribute('data-i'); render(); });
      });
    }
    render();
  });

  /* =========================================================================
     PERTOKEN — per-token versus response-level learning
     ========================================================================= */

  T.widget('pertoken', function (node) {
    var mode = 'sft';
    var ANS = ['The', 'blending', 'target', 'was', 'raised', 'to', '20', 'per', 'cent', '.'];

    var body = T.shell(node, 'Two very different kinds of feedback', 'Compare them',
      '<div class="seg pt-seg" style="margin-bottom:20px"></div><div class="pt-vis"></div><div class="lab-out pt-say"></div>',
      'Framing follows Lambert, <a class="link" href="https://rlhfbook.com" target="_blank" rel="noopener">rlhfbook.com</a>, ch. 3. ' +
      'The contrastive loss is the family of losses computed by comparing two or more examples rather than scoring each one alone.');

    var seg = body.querySelector('.pt-seg'), vis = body.querySelector('.pt-vis'), say = body.querySelector('.pt-say');
    seg.innerHTML = '<button type="button" data-m="sft" class="on">Instruction tuning</button>' +
      '<button type="button" data-m="rlhf">RLHF</button>';

    function render() {
      Array.prototype.forEach.call(seg.querySelectorAll('button'), function (b) {
        b.classList.toggle('on', b.getAttribute('data-m') === mode);
      });
      if (mode === 'sft') {
        vis.innerHTML = '<span class="meta" style="display:block;margin-bottom:10px">One correct answer. Every token graded separately.</span>' +
          '<div class="pt-line">' + ANS.map(function (w) {
            return '<span class="pt-tok graded">' + T.esc(w) + '<i>\u2713</i></span>';
          }).join('') + '</div>';
        say.innerHTML = 'Instruction tuning is a <b>per-token update</b>. At every position the model is asked what comes next, and corrected ' +
          'against the one answer somebody wrote down. It is being told a specific response it should produce. Nothing tells it what a ' +
          '<i>worse</i> answer would have looked like, because no worse answer is present.';
      } else {
        vis.innerHTML = '<span class="meta" style="display:block;margin-bottom:10px">Two whole answers. One judgement, at the end.</span>' +
          '<div class="pt-pair">' +
            '<div class="pt-ans win"><span class="meta">Answer A</span><p>The blending target was raised to 20 per cent.</p><b>preferred</b></div>' +
            '<div class="pt-ans lose"><span class="meta">Answer B</span><p>Great question! There are many things one might say about blending targets\u2026</p><b>not preferred</b></div>' +
          '</div>';
        say.innerHTML = 'RLHF works at the <b>response level</b>. Nobody says which token was wrong. The whole of A is made more likely and ' +
          'the whole of B less likely, purely because a comparison came out one way. That comparison is what makes the loss ' +
          '<b>contrastive</b>: it is computed from two examples set against each other, not from either one on its own. ' +
          'And critically, it carries <b>negative</b> feedback, which instruction tuning cannot.';
      }
      Array.prototype.forEach.call(seg.querySelectorAll('button'), function (b) {
        b.addEventListener('click', function () { mode = b.getAttribute('data-m'); render(); });
      });
    }
    render();
  });

})(window.T);
