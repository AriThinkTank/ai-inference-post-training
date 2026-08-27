/* =========================================================================
   comic.js — the cast, the page furniture.
   Every figure is drawn from hairlines in ink, wine and marigold only:
   no fills that are not in the palette, no rounded corners, no shadows.
   ========================================================================= */

(function () {
  'use strict';

  var INK = '#171413', WINE = '#620d3c', GOLD = '#f1a222',
      DEEP = '#F7F5F2', WINESOFT = '#f5e6ec', NEG = '#a3282d', POS = '#2f6b4a';

  /* ---------- mouths and eyes, shared between figures ------------------ */

  function mouth(mood, x, y, w) {
    var half = w / 2;
    switch (mood) {
      case 'happy':
      case 'proud':
        return '<path d="M ' + (x - half) + ' ' + y + ' Q ' + x + ' ' + (y + 8) + ' ' + (x + half) + ' ' + y + '" fill="none"/>';
      case 'confused':
        return '<path d="M ' + (x - half) + ' ' + (y + 3) + ' l ' + (w / 4) + ' -5 l ' + (w / 4) + ' 5 l ' + (w / 4) + ' -5 l ' + (w / 4) + ' 5" fill="none"/>';
      case 'sad':
        return '<path d="M ' + (x - half) + ' ' + (y + 5) + ' Q ' + x + ' ' + (y - 4) + ' ' + (x + half) + ' ' + (y + 5) + '" fill="none"/>';
      case 'speak':
        return '<rect x="' + (x - half / 1.6) + '" y="' + (y - 2) + '" width="' + (w / 1.25) + '" height="8" fill="none"/>';
      default:
        return '<line x1="' + (x - half) + '" y1="' + y + '" x2="' + (x + half) + '" y2="' + y + '"/>';
    }
  }

  /* ---------- ECHO — the model ---------------------------------------- */

  function echo(mood) {
    var eyes;
    if (mood === 'think') {
      eyes = '<line x1="29" y1="38" x2="39" y2="38"/><line x1="51" y1="38" x2="61" y2="38"/>';
    } else if (mood === 'sad' || mood === 'off') {
      eyes = '<path d="M29 34 l10 9 M39 34 l-10 9"/><path d="M51 34 l10 9 M61 34 l-10 9"/>';
    } else if (mood === 'proud') {
      eyes = '<rect x="29" y="34" width="10" height="9" fill="' + WINE + '" stroke="none"/>' +
             '<rect x="51" y="34" width="10" height="9" fill="' + WINE + '" stroke="none"/>';
    } else {
      eyes = '<rect x="29" y="34" width="10" height="9" fill="' + INK + '" stroke="none"/>' +
             '<rect x="51" y="34" width="10" height="9" fill="' + INK + '" stroke="none"/>';
    }
    var badge = (mood === 'proud')
      ? '<rect x="36" y="74" width="18" height="9" fill="' + GOLD + '" stroke="none"/>'
      : '<rect x="34" y="74" width="22" height="9" fill="' + WINESOFT + '"/>';
    return '' +
      '<line x1="45" y1="20" x2="45" y2="9"/>' +
      '<circle cx="45" cy="6" r="3.6" fill="' + WINE + '" stroke="none"/>' +
      '<rect x="17" y="20" width="56" height="40"/>' +
      eyes +
      mouth(mood, 45, 51, 22) +
      '<line x1="45" y1="60" x2="45" y2="66"/>' +
      '<rect x="23" y="66" width="44" height="34"/>' +
      badge +
      '<line x1="23" y1="73" x2="9" y2="87"/>' +
      '<line x1="67" y1="73" x2="81" y2="87"/>' +
      '<line x1="33" y1="100" x2="33" y2="113"/>' +
      '<line x1="57" y1="100" x2="57" y2="113"/>' +
      '<line x1="28" y1="113" x2="38" y2="113"/>' +
      '<line x1="52" y1="113" x2="62" y2="113"/>';
  }

  /* ---------- IRA — the ten-year-old reader ---------------------------- */

  function ira(mood) {
    var brows = (mood === 'doubt')
      ? '<line x1="34" y1="24" x2="42" y2="26"/><line x1="49" y1="25" x2="57" y2="21"/>'
      : (mood === 'happy' || mood === 'proud')
        ? '<line x1="34" y1="23" x2="42" y2="23"/><line x1="49" y1="23" x2="57" y2="23"/>' : '';
    var arms = (mood === 'point')
      ? '<line x1="34" y1="61" x2="20" y2="80"/><line x1="56" y1="61" x2="74" y2="52"/><line x1="74" y1="52" x2="80" y2="50"/>'
      : '<line x1="34" y1="61" x2="21" y2="81"/><line x1="56" y1="61" x2="69" y2="81"/>';
    return '' +
      '<circle cx="45" cy="32" r="19" fill="none"/>' +
      '<path d="M25 31 Q 45 4 65 31" fill="none"/>' +
      '<path d="M64 27 Q 78 35 72 54" fill="none"/>' +
      '<line x1="68" y1="52" x2="76" y2="52"/>' +
      brows +
      '<circle cx="38" cy="31" r="2.4" fill="' + INK + '" stroke="none"/>' +
      '<circle cx="52" cy="31" r="2.4" fill="' + INK + '" stroke="none"/>' +
      mouth(mood === 'point' ? 'speak' : mood, 45, 41, 13) +
      '<line x1="45" y1="51" x2="45" y2="58"/>' +
      '<path d="M31 78 L35 58 L55 58 L59 78 Z" fill="none"/>' +
      arms +
      '<line x1="38" y1="78" x2="36" y2="112"/>' +
      '<line x1="52" y1="78" x2="54" y2="112"/>' +
      '<line x1="31" y1="112" x2="40" y2="112"/>' +
      '<line x1="50" y1="112" x2="59" y2="112"/>';
  }

  /* ---------- MARK — the reward model, a machine that gives marks ------- */

  function mark(mood, label) {
    var score = label || (mood === 'fooled' ? '0.97' : mood === 'sad' ? '0.11' : '0.62');
    var led = mood === 'fooled' ? GOLD : WINE;
    return '' +
      '<rect x="13" y="24" width="64" height="48"/>' +
      '<rect x="20" y="31" width="50" height="20" fill="' + DEEP + '"/>' +
      '<text x="45" y="46" text-anchor="middle" font-family="\'Roboto Mono\', monospace" font-size="13" fill="' + INK + '" stroke="none">' + score + '</text>' +
      '<circle cx="68" cy="29" r="2.8" fill="' + led + '" stroke="none"/>' +
      '<rect x="26" y="58" width="8" height="7" fill="' + INK + '" stroke="none"/>' +
      '<rect x="56" y="58" width="8" height="7" fill="' + INK + '" stroke="none"/>' +
      mouth(mood, 45, 68, 16) +
      '<line x1="45" y1="72" x2="45" y2="98"/>' +
      '<line x1="27" y1="98" x2="63" y2="98"/>' +
      '<line x1="27" y1="98" x2="22" y2="110"/>' +
      '<line x1="63" y1="98" x2="68" y2="110"/>';
  }

  /* ---------- VERA — the verifier, a program that runs ------------------ */

  function vera(mood) {
    var glyph;
    if (mood === 'pass') {
      glyph = '<path d="M30 48 l9 10 l21 -22" fill="none" stroke="' + POS + '" stroke-width="3"/>';
    } else if (mood === 'fail') {
      glyph = '<path d="M32 36 l26 26 M58 36 l-26 26" fill="none" stroke="' + NEG + '" stroke-width="3"/>';
    } else {
      glyph = '<text x="45" y="58" text-anchor="middle" font-family="\'Roboto Mono\', monospace" font-size="24" fill="' + INK + '" stroke="none">?</text>';
    }
    return '' +
      '<rect x="15" y="22" width="60" height="52"/>' +
      '<line x1="15" y1="32" x2="75" y2="32"/>' +
      '<circle cx="22" cy="27" r="2" fill="' + WINE + '" stroke="none"/>' +
      '<circle cx="29" cy="27" r="2" fill="' + INK + '" stroke="none"/>' +
      glyph +
      '<rect x="34" y="74" width="22" height="6" fill="' + DEEP + '"/>' +
      '<line x1="45" y1="80" x2="45" y2="96"/>' +
      '<line x1="26" y1="96" x2="64" y2="96"/>';
  }

  var FIGURES = { echo: echo, ira: ira, mark: mark, vera: vera };
  var NAMES = { echo: 'Echo · the model', ira: 'Ira · age ten', mark: 'Mark · the judge', vera: 'Vera · the checker' };

  function drawCast(node) {
    var who = node.getAttribute('data-char') || 'echo';
    var mood = node.getAttribute('data-mood') || 'blank';
    var h = parseInt(node.getAttribute('data-size') || '110', 10);
    var label = node.getAttribute('data-label');
    var fn = FIGURES[who] || echo;
    var w = Math.round(h * 0.75);
    node.innerHTML =
      '<svg viewBox="0 0 90 120" width="' + w + '" height="' + h + '" role="img" aria-label="' +
      (NAMES[who] || who) + '" fill="none" stroke="' + INK + '" stroke-width="1.4" ' +
      'stroke-linecap="square" stroke-linejoin="miter">' + fn(mood, label) + '</svg>';
  }

  window.TCast = { draw: drawCast, names: NAMES };

  /* ---------- page furniture ------------------------------------------ */

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    /* cast figures */
    Array.prototype.forEach.call(document.querySelectorAll('.cast'), drawCast);

    /* a panel whose last bubble points right should hold its figure on the right,
       so the tail lands on the speaker rather than on empty paper */
    Array.prototype.forEach.call(document.querySelectorAll('.panel'), function (panel) {
      var art = panel.querySelector('.panel-art');
      if (!art || art.classList.contains('between') || art.classList.contains('center')) return;
      if (art.querySelectorAll('.cast').length !== 1) return;
      var bubbles = panel.querySelectorAll('.bubble');
      if (!bubbles.length) return;
      if (bubbles[bubbles.length - 1].classList.contains('right')) {
        art.classList.add('right');
        art.querySelector('.cast').classList.add('flip');
      }
    });

    /* mobile navigation */
    var toggle = document.querySelector('.nav-toggle');
    var links = document.querySelector('.nav-links');
    if (toggle && links) {
      toggle.addEventListener('click', function () {
        var open = links.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        toggle.textContent = open ? 'Close' : 'Menu';
      });
    }

    /* reading progress */
    var bar = document.querySelector('.progress');
    if (bar) {
      var tick = function () {
        var h = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = (h > 0 ? Math.min(100, (window.scrollY / h) * 100) : 0) + '%';
      };
      window.addEventListener('scroll', tick, { passive: true });
      window.addEventListener('resize', tick);
      tick();
    }

    /* reveal on scroll */
    var targets = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(targets, function (t) { t.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        });
      }, { rootMargin: '0px 0px -60px 0px', threshold: 0.05 });
      Array.prototype.forEach.call(targets, function (t) { io.observe(t); });
    }
  });
})();
