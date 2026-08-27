/* =========================================================================
   guide.js — two things that run across the whole site.

   1. Every interactive box gets a short plain-language brief: what it is,
      what you are actually changing, and what to watch for. Written once
      here, injected into each widget, so no widget has to carry its own.

   2. Hover definitions. Write <b class="def" data-t="kv-cache">KV cache</b>
      anywhere and this attaches a small card with a definition and a link
      to where the idea comes from. Works on tap as well as hover.

   Load this AFTER the widget scripts.
   ========================================================================= */

window.T = window.T || {};
(function (T) {
  'use strict';

  /* =========================================================================
     PART 1 — BRIEFS
     k = the knob (what changes when you touch it)
     w = what to watch (the point of the exercise)
     r = further reading, [label, url]
     ========================================================================= */

  var BRIEFS = {
    map: {
      is: 'The whole pipeline on one strip, from a blank model to a live answer.',
      k: 'Tap any stage to open it.',
      w: 'Which stages rewrite the model (wine) and which only spend money at the moment you ask a question (marigold). Only the first five change the model at all.',
      r: ['Lambert, ch. 3', 'https://rlhfbook.com']
    },
    vocab: {
      is: 'Six words that get used interchangeably in the press and mean different things.',
      k: 'Tap a card to flip it.',
      w: 'How often the difference is about who or what is doing the marking.',
      r: ['Lambert, ch. 3', 'https://rlhfbook.com']
    },
    tokeniser: {
      is: 'The chopping-up step. Before a model sees your sentence, it becomes a list of numbers.',
      k: 'Type anything. The split changes as you type.',
      w: 'Common words survive whole. Rare ones, names and Indian-language words shatter into pieces. That is why some languages cost more per sentence than others.',
      r: ['Vaswani et al., 2017', 'https://arxiv.org/abs/1706.03762']
    },
    nexttoken: {
      is: 'The one thing a base model does, laid bare. It scores every possible next word.',
      k: 'Temperature flattens or sharpens the scores. The sampling rule decides how much of the tail is allowed to be picked at all.',
      w: 'Turn temperature down and the model gets predictable and dull. Turn it up and the long tail comes alive. Nothing here changes the model. You are only changing how its answer sheet gets read.',
      r: ['Vaswani et al., 2017', 'https://arxiv.org/abs/1706.03762']
    },
    handover: {
      is: 'A checklist of ten things people assume a model can do.',
      k: 'Guess whether each one survives pretraining, then check.',
      w: 'Knowledge arrives in pretraining. Almost every behaviour arrives later.',
      r: ['Lambert, ch. 3', 'https://rlhfbook.com']
    },
    staircase: {
      is: 'The four teachers, stacked in the order they are applied.',
      k: 'Tap a step to see who is doing the marking at that stage.',
      w: 'The marker gets weaker and cheaper as you climb: a human writing the answer, a human ranking answers, a model imitating that human, then a program that just runs the code.',
      r: ['Lambert, chs. 4-7', 'https://rlhfbook.com']
    },
    lossmask: {
      is: 'Supervised fine-tuning is imitation. But you do not want the model imitating everything in the example.',
      k: 'Switch the mask on and off.',
      w: 'With the mask on, only the answer is scored. Off, the model also learns to write questions like the ones users ask, which is the opposite of useful.',
      r: ['Ouyang et al., 2022', 'https://arxiv.org/abs/2203.02155']
    },
    ranker: {
      is: 'Your turn to be the human labeller. Four answers, worst to best.',
      k: 'Drag or tap to reorder them.',
      w: 'Compare your ranking with the careful raters and with a reward model that has quietly learned that longer means better. That gap is the whole problem with preference training.',
      r: ['Ouyang et al., 2022', 'https://arxiv.org/abs/2203.02155']
    },
    hacking: {
      is: 'You are the model now. Your job is to make the judge happy.',
      k: 'Each move is something a real model has been caught doing. Play a few.',
      w: 'Two lines. The judge\u2019s score goes up. The thing the judge was standing in for does not. Then switch the drift penalty on and watch the leash pull the wine line back.',
      r: ['Lambert, ch. 14', 'https://rlhfbook.com']
    },
    verify: {
      is: 'Eight tasks. Sort them by how well a program alone could mark them.',
      k: 'Pick a rung for each task, then see where it actually sits.',
      w: 'The ladder fills from the top. Notice how quickly you run out of tasks a checker can handle, and that almost everything policy work involves sits on the bottom rung.',
      r: ['DeepSeek-R1, 2025', 'https://arxiv.org/abs/2501.12948']
    },
    grpo: {
      is: 'How a model can be trained without a second network to tell it what score to expect.',
      k: 'Tap any answer to flip it between pass and fail.',
      w: 'The group\u2019s own average becomes the bar. Answers above it get pushed up, below it get pushed down. Make all six pass, or all six fail, and the whole batch teaches nothing.',
      r: ['DeepSeekMath, 2024', 'https://arxiv.org/abs/2402.03300']
    },
    agentic: {
      is: 'An eight-step task with one reward at the very end.',
      k: 'Step through the episode.',
      w: 'The task fails. Now say which step was to blame. That is the credit assignment problem, and it is why agentic training is so much harder than everything before it.',
      r: ['Lambert, ch. 6', 'https://rlhfbook.com']
    },
    quantise: {
      is: 'Same model, stored at lower precision. Fewer bits per number.',
      k: 'Choose 16, 8 or 4 bits.',
      w: 'Where it lands. At 4 bits a 70-billion-parameter model drops onto hardware that no export regime tracks.',
      r: ['GPTQ, 2022', 'https://arxiv.org/abs/2210.17323']
    },

    phases: {
      is: 'One request, played in slow motion.',
      k: 'Press play.',
      w: 'Your prompt goes through in a single pass. The reply comes out one token at a time, each one costing a full sweep of the model. That asymmetry is why output tokens cost more than input tokens.',
      r: ['Austin et al., ch. 7', 'https://jax-ml.github.io/scaling-book']
    },
    kvcache: {
      is: 'A calculator for the memory one conversation eats while it is running.',
      k: 'Context length is the one that matters. The rest are the model\u2019s shape, fixed when it was built.',
      w: 'Drag context to the right and watch the marigold bar overtake the wine one. Past roughly 430,000 tokens, a single conversation weighs more than the entire model.',
      r: ['Austin et al., ch. 4', 'https://jax-ml.github.io/scaling-book']
    },
    attention: {
      is: 'Four ways to build attention, chosen before training and locked in for the model\u2019s whole life.',
      k: 'Pick a design.',
      w: 'What each one gives up to shrink the cache. Grouped-query attention is the compromise almost everyone ships.',
      r: ['Ainslie et al., 2023', 'https://arxiv.org/abs/2305.13245']
    },
    paged: {
      is: 'Nobody knows how long a reply will be until it is finished. So how much memory do you set aside?',
      k: 'Slide to how long the replies actually turn out to be.',
      w: 'The grey squares on the left. That is memory reserved for replies that never arrived, sitting idle on very expensive hardware.',
      r: ['Kwon et al., 2023', 'https://arxiv.org/abs/2309.06180']
    },
    batching: {
      is: 'Four requests sharing one accelerator, done two ways.',
      k: 'Flip between the old way and the current way.',
      w: 'In static batching everyone waits for the slowest reply in the group. Continuous batching lets a finished slot be refilled immediately.',
      r: ['Yu et al., Orca, 2022', 'https://www.usenix.org/conference/osdi22/presentation/yu']
    },
    prefix: {
      is: 'Two requests that begin with the same long document. The system has already read it once.',
      k: 'Change how much of the prompt is shared.',
      w: 'The shared part gets billed at a fraction of the rate. This is why agents are commercially possible at all: they replay a growing transcript on every single step.',
      r: ['Kwon et al., 2023', 'https://arxiv.org/abs/2309.06180']
    },
    spec: {
      is: 'A small fast model guesses the next few tokens. The big model checks them all in one pass.',
      k: 'Run a round.',
      w: 'Accepted guesses come free. The important part: the answer is identical to what the big model would have written alone. This buys speed, not quality.',
      r: ['Leviathan et al., 2022', 'https://arxiv.org/abs/2211.17192']
    },
    moe: {
      is: 'A model split into many separate blocks, with a router that wakes only a couple of them per token.',
      k: 'Send a token through.',
      w: 'Total parameters and active parameters are different numbers. Headlines quote the first. Cost per token follows the second.',
      r: ['Austin et al., ch. 4', 'https://jax-ml.github.io/scaling-book']
    },
    budget: {
      is: 'The same weights, given more or less time to think before answering.',
      k: 'Turn the dial.',
      w: 'Capability moves without anything about the model changing. Whoever deploys it sets this dial, not whoever trained it. That is the awkward fact underneath every compute threshold.',
      r: ['Lambert, ch. 7', 'https://rlhfbook.com']
    },
    stack: {
      is: 'Six layers between a chip and your answer.',
      k: 'Tap a layer.',
      w: 'Where each policy instrument actually lands. Most of them stop at layer 2, while most of the recent efficiency gains happened at layer 4.',
      r: ['Austin et al., chs. 7-9', 'https://jax-ml.github.io/scaling-book']
    },
    glossary: {
      is: 'Every term used on this site, in one place.',
      k: 'Search, or filter by training and serving.',
      w: 'Nothing. This one is a reference, not an argument.'
    },
    quiz: {
      is: 'Ten questions, no marks recorded, nothing sent anywhere.',
      k: 'Pick an answer to see why it is right or wrong.',
      w: 'Which chapter you should go back to.'
    }
  };

  function briefHTML(b) {
    var rows = '';
    rows += '<div class="br-row"><span class="br-k">What this is</span><span>' + b.is + '</span></div>';
    if (b.k) rows += '<div class="br-row"><span class="br-k">Your move</span><span>' + b.k + '</span></div>';
    if (b.w) rows += '<div class="br-row"><span class="br-k">Watch for</span><span>' + b.w + '</span></div>';
    if (b.r) rows += '<div class="br-row"><span class="br-k">Where it\u2019s from</span><span><a class="link" href="' +
      b.r[1] + '" target="_blank" rel="noopener">' + b.r[0] + ' <span class="arrow">\u2197</span></a></span></div>';
    return '<div class="brief">' + rows + '</div>';
  }

  function injectBriefs() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-widget]'), function (node) {
      var b = BRIEFS[node.getAttribute('data-widget')];
      if (!b || node.querySelector('.brief')) return;
      var body = node.querySelector('.lab-body');
      if (!body) return;
      body.parentNode.insertBefore(T.h(briefHTML(b)), body);
    });
  }

  /* =========================================================================
     PART 2 — HOVER DEFINITIONS
     ========================================================================= */

  var DEFS = {
    'token': ['A chunk of text, usually a few characters. Models read and write in tokens, not words. Roughly four characters each in English, and fewer in most Indian languages.', 'https://arxiv.org/abs/1706.03762', 'Vaswani et al.'],
    'base-model': ['What you have the moment pretraining ends. It continues text and knows an enormous amount. It will not answer a question, because nobody has yet asked it to.', 'https://rlhfbook.com', 'Lambert, ch. 3'],
    'pretraining': ['The single enormous run that reads most of the internet and learns to predict the next token. Done once, and it is where nearly all the knowledge comes from.', 'https://rlhfbook.com', 'Lambert, ch. 3'],
    'post-training': ['Everything done to a base model afterwards to make it usable: imitation, preference training, verifiable rewards, agentic training.', 'https://arxiv.org/abs/2504.12501', 'Lambert'],
    'sft': ['Supervised fine-tuning. Show the model thousands of good answers and have it copy them. Only the answer is scored, never the prompt.', 'https://arxiv.org/abs/2203.02155', 'Ouyang et al.'],
    'rlhf': ['Reinforcement learning from human feedback. Humans rank answers, a reward model learns to imitate those rankings, and the model is trained to score well against it.', 'https://arxiv.org/abs/2203.02155', 'Ouyang et al.'],
    'dpo': ['Direct preference optimisation. Gets to the same place as RLHF without ever building a separate reward model. Simpler, cheaper, and now very widely used.', 'https://arxiv.org/abs/2305.18290', 'Rafailov et al.'],
    'reward-model': ['A model trained to predict what a human would have preferred. It stands in for the human so training can run millions of times. It is also the thing that gets gamed.', 'https://arxiv.org/abs/2203.02155', 'Ouyang et al.'],
    'reward-hacking': ['When a model finds a way to score well that has nothing to do with being good. Padding, flattery, headings that look like rigour.', 'https://rlhfbook.com', 'Lambert, ch. 14'],
    'goodhart': ['Once a measure becomes a target, it stops being a good measure. Named for the economist Charles Goodhart, and the oldest problem in this entire field.', 'https://rlhfbook.com', 'Lambert, ch. 14'],
    'kl-penalty': ['A leash. It penalises the model for drifting too far from where it started, which limits how thoroughly it can game the judge.', 'https://rlhfbook.com', 'Lambert, ch. 15'],
    'rlvr': ['Reinforcement learning with verifiable rewards. No judge, no reward model. A program runs the answer and says pass or fail. Works beautifully where a checker exists.', 'https://arxiv.org/abs/2501.12948', 'DeepSeek-R1'],
    'grpo': ['Group relative policy optimisation. Generate several answers, use the group average as the bar. Removes the value network that PPO needs.', 'https://arxiv.org/abs/2402.03300', 'DeepSeekMath'],
    'ppo': ['Proximal policy optimisation. The workhorse algorithm behind early RLHF. Takes small steps, and needs a second network to predict expected scores.', 'https://arxiv.org/abs/1707.06347', 'Schulman et al.'],
    'constitutional-ai': ['Instead of a human judging every answer, you write down the principles and have a model apply them. Makes the values inspectable, which is rare.', 'https://arxiv.org/abs/2212.08073', 'Bai et al.'],
    'distillation': ['Training a small model on a large model\u2019s outputs. It picks up much of the behaviour at a fraction of the cost, which is the main reason capability spreads so fast.', 'https://arxiv.org/abs/2501.12948', 'DeepSeek-R1'],
    'quantisation': ['Storing each number with fewer bits. Four-bit weights are a quarter the size of sixteen-bit ones, with some loss of accuracy.', 'https://arxiv.org/abs/2210.17323', 'GPTQ'],
    'prefill': ['The first half of a request. Your whole prompt is processed in one pass. Limited by raw arithmetic speed.', 'https://jax-ml.github.io/scaling-book', 'Austin et al., ch. 7'],
    'decode': ['The second half. One token per full sweep of the model, over and over. Limited by memory speed, not arithmetic, which is why it is the expensive half.', 'https://jax-ml.github.io/scaling-book', 'Austin et al., ch. 7'],
    'kv-cache': ['Working memory for one conversation. It grows with every token and is never given back until the request ends. At long context it can outweigh the model itself.', 'https://arxiv.org/abs/2309.06180', 'Kwon et al.'],
    'ttft': ['Time to first token. How long you stare at nothing before the reply starts. Set by prefill, so it grows with prompt length.', 'https://jax-ml.github.io/scaling-book', 'Austin et al., ch. 7'],
    'tpot': ['Time per output token. The gap between one word appearing and the next. This is what makes a reply feel quick or laboured.', 'https://jax-ml.github.io/scaling-book', 'Austin et al., ch. 7'],
    'throughput': ['Total tokens the whole machine produces per second across everybody. The operator\u2019s number, not yours.', 'https://jax-ml.github.io/scaling-book', 'Austin et al., ch. 7'],
    'goodput': ['Throughput, but only counting requests that actually met their latency target. The honest version.', 'https://arxiv.org/abs/2410.04466', 'Survey, sec. 3'],
    'batch-size': ['How many requests share the accelerator at once. Raise it and cost per token falls while everyone waits longer. That dial is a commercial decision.', 'https://jax-ml.github.io/scaling-book', 'Austin et al., ch. 7'],
    'paged-attention': ['Borrowed from operating systems. Stop demanding memory in one contiguous block, cut it into pages, keep a lookup table. Reported two to four times the throughput.', 'https://arxiv.org/abs/2309.06180', 'Kwon et al.'],
    'continuous-batching': ['Refill a finished slot immediately instead of waiting for the whole group. Stops one long reply stalling everyone behind it.', 'https://www.usenix.org/conference/osdi22/presentation/yu', 'Yu et al., Orca'],
    'prefix-caching': ['If two requests start with the same text, read it once. This is why long system prompts and agent transcripts are affordable.', 'https://arxiv.org/abs/2309.06180', 'Kwon et al.'],
    'speculative-decoding': ['A small model guesses ahead, the big model checks the guesses in a single pass. Provably identical output, just sooner.', 'https://arxiv.org/abs/2211.17192', 'Leviathan et al.'],
    'moe': ['Mixture of experts. The model is split into blocks and a router wakes only a few per token. Total parameters and active parameters come apart.', 'https://jax-ml.github.io/scaling-book', 'Austin et al., ch. 4'],
    'gqa': ['Grouped-query attention. Several question-askers share one set of keys and values, which shrinks the cache by roughly eight times. The compromise nearly everyone ships.', 'https://arxiv.org/abs/2305.13245', 'Ainslie et al.'],
    'answer-time-compute': ['Compute spent at the moment you ask, rather than during training. Longer thinking, more attempts, tool calls. It moves capability after release.', 'https://rlhfbook.com', 'Lambert, ch. 7'],
    'credit-assignment': ['A task with one reward at the end and forty steps in the middle. Which step was to blame? Nobody has a clean answer, and it is the bottleneck in agentic training.', 'https://rlhfbook.com', 'Lambert, ch. 6']
  };

  var tip = null;

  function makeTip() {
    if (tip) return tip;
    tip = document.createElement('div');
    tip.className = 'tip';
    tip.setAttribute('role', 'tooltip');
    document.body.appendChild(tip);
    return tip;
  }

  function showTip(el) {
    var key = el.getAttribute('data-t');
    var d = DEFS[key];
    if (!d) return;
    var t = makeTip();
    t.innerHTML = '<span class="tip-term">' + T.esc(el.textContent) + '</span>' +
      '<span class="tip-body">' + d[0] + '</span>' +
      (d[1] ? '<a class="tip-src" href="' + d[1] + '" target="_blank" rel="noopener">' + d[2] + ' <span class="arrow">\u2197</span></a>' : '');
    t.classList.add('on');
    var r = el.getBoundingClientRect();
    var w = Math.min(340, window.innerWidth - 32);
    t.style.width = w + 'px';
    var left = r.left + r.width / 2 - w / 2;
    left = Math.max(16, Math.min(left, window.innerWidth - w - 16));
    t.style.left = Math.round(left) + 'px';
    var th = t.offsetHeight;
    var above = r.top > th + 16;
    t.style.top = Math.round(above ? r.top - th - 10 + window.scrollY : r.bottom + 10 + window.scrollY) + 'px';
    t.classList.toggle('below', !above);
  }

  function hideTip() { if (tip) tip.classList.remove('on'); }

  function wireDefs() {
    Array.prototype.forEach.call(document.querySelectorAll('.def'), function (el) {
      if (el.dataset.wired) return;
      el.dataset.wired = '1';
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
      var d = DEFS[el.getAttribute('data-t')];
      if (!d) { el.classList.add('def-missing'); return; }
      el.addEventListener('mouseenter', function () { showTip(el); });
      el.addEventListener('focus', function () { showTip(el); });
      el.addEventListener('mouseleave', function (e) {
        if (tip && e.relatedTarget && tip.contains(e.relatedTarget)) return;
        setTimeout(function () { if (!tip || !tip.matches(':hover')) hideTip(); }, 180);
      });
      el.addEventListener('blur', hideTip);
      el.addEventListener('click', function (e) { e.preventDefault(); showTip(el); });
      el.addEventListener('keydown', function (e) { if (e.key === 'Escape') { hideTip(); el.blur(); } });
    });
    document.addEventListener('click', function (e) {
      if (tip && !tip.contains(e.target) && !e.target.closest('.def')) hideTip();
    });
    window.addEventListener('scroll', hideTip, { passive: true });
  }

  document.addEventListener('DOMContentLoaded', function () {
    injectBriefs();
    wireDefs();
  });

  T.defs = DEFS;
})(window.T);
