/* ==========================================================================
   KHUSHI MEHTA: Kiln & Thread
   Vanilla JS + GSAP + ScrollTrigger + Lenis
   ========================================================================== */
(() => {
  'use strict';

  const root = document.documentElement;

  // If the CDN libraries failed, fall back to the plain, fully visible page.
  if (!window.gsap || !window.ScrollTrigger) {
    root.classList.remove('js');
    document.querySelector('.preloader')?.remove();
    return;
  }

  /* ==========================================================================
     0. UTILS
     ========================================================================== */
  const qs = (s, el = document) => el.querySelector(s);
  const qsa = (s, el = document) => [...el.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const media = (q) => window.matchMedia(q).matches;
  const reduce = media('(prefers-reduced-motion: reduce)');
  const finePointer = media('(hover: hover) and (pointer: fine)');
  const isMobile = () => window.innerWidth <= 768;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const withTimeout = (p, ms) => Promise.race([p, wait(ms)]);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtNum = (n) => Math.round(n).toLocaleString('en-GB');

  /** Typewriter: erase the current word, type the next, hold, repeat. Grapheme-safe for Hindi/Kannada. */
  const seg = window.Intl && Intl.Segmenter ? new Intl.Segmenter('en', { granularity: 'grapheme' }) : null;
  const graphemes = (s) => (seg ? [...seg.segment(s)].map((g) => g.segment) : [...s]);
  function typeCycle(el, words, { startAfter = 2000, hold = 2000, typeMs = 90, eraseMs = 45 } = {}) {
    if (!el) return;
    let wi = 0;
    const cycle = async () => {
      if (reduce) { wi = (wi + 1) % words.length; el.textContent = words[wi]; setTimeout(cycle, hold + 400); return; }
      const cur = graphemes(el.textContent || words[wi]);
      for (let i = cur.length; i >= 0; i--) { el.textContent = cur.slice(0, i).join(''); await wait(eraseMs); }
      wi = (wi + 1) % words.length;
      const next = graphemes(words[wi]);
      for (let i = 1; i <= next.length; i++) { el.textContent = next.slice(0, i).join(''); await wait(typeMs); }
      setTimeout(cycle, hold);
    };
    setTimeout(cycle, startAfter);
  }

  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: 'expo.out', duration: 1 });

  // Seeded random so the network constellation looks the same on every visit
  const rand = ((seed) => () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  })(7);

  /** Split text into words (and optionally chars), preserving inline elements like <em>. */
  function splitText(el, chars) {
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span');
            w.className = 'w';
            const wi = document.createElement('span');
            wi.className = 'wi';
            if (chars) {
              [...part].forEach((ch) => {
                const c = document.createElement('span');
                c.className = 'c';
                c.textContent = ch;
                wi.appendChild(c);
              });
            } else {
              wi.textContent = part;
            }
            w.appendChild(wi);
            frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR' && n.namespaceURI !== 'http://www.w3.org/2000/svg') {
          walk(n);
        }
      });
    };
    walk(el);
  }

  /* ==========================================================================
     1. SMOOTH SCROLL
     ========================================================================== */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const scrollToTarget = (target) => {
    if (lenis) lenis.scrollTo(target, { duration: 1.6, offset: 0 });
    else if (typeof target === 'number') window.scrollTo({ top: target, behavior: reduce ? 'auto' : 'smooth' });
    else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  };

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.hasAttribute('data-case')) return;
    const href = a.getAttribute('href');
    if (href === '#top') { e.preventDefault(); scrollToTarget(0); return; }
    const target = href.length > 1 && qs(href);
    if (!target) return;
    e.preventDefault();
    scrollToTarget(target);
  });

  /* ==========================================================================
     2. INTRO + REEL: "Hi, I'm Khushi", then three quick scenes, text first
     ========================================================================== */
  const heroTitle = qs('.hero__title');
  const heroCopy = qs('.hero__copy');
  const heroUnderline = qs('.hero__underline path');
  const filmDark = false;
  let heroStart = () => {};

  function setupHero() {
    splitText(heroTitle, true);
    heroTitle.classList.add('split-chars');
    // the focus label rotates; London stays
    typeCycle(qs('[data-roles]'), ['All things marketing', 'Creators', 'Influencers', 'Brand', 'Launches', 'Partnerships'], { startAfter: 4200, hold: 1600, typeMs: 55, eraseMs: 30 });
    if (reduce) { gsap.set(heroUnderline, { strokeDashoffset: 0 }); return; }
    gsap.set(heroCopy, { autoAlpha: 0 });
    heroStart = () => gsap.timeline()
      .set(heroCopy, { autoAlpha: 1 })
      .from('.hero__kicker', { autoAlpha: 0, y: 14, duration: 1 }, 0)
      .fromTo(qsa('.c', heroTitle), { yPercent: 115, rotate: 7 }, { yPercent: 0, rotate: 0, duration: 1.15, stagger: 0.03 }, 0.1)
      .fromTo('.hero__lead', { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 1 }, 0.5)
      .fromTo(heroUnderline, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut' }, 1.0)
      .fromTo('.hero__portrait', { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 1.4 }, 0.3)
      .from('.hero__prompt', { autoAlpha: 0, duration: 1 }, 1.2);
  }

  function buildNetworkGrid() {
    const grid = qs('.net-grid');
    const cells = [];
    for (let i = 0; i < 300; i++) {
      const c = document.createElement('span');
      grid.appendChild(c);
      cells.push(c);
    }
    const order = cells.map((c) => ({ c, k: rand() })).sort((x, y) => x.k - y.k).map((o) => o.c);
    let lit = 0;
    return (fraction) => {
      const want = Math.round(clamp(fraction, 0, 1) * order.length);
      while (lit < want) order[lit++].classList.add('is-on');
      while (lit > want) order[--lit].classList.remove('is-on');
    };
  }

  function setupReel() {
    const reel = qs('.reel');
    if (!reel) return;
    const scenes = qsa('.scene', reel);
    const lines = qsa('.reel__line', reel);
    const count = qs('.reel__count span', reel);
    const lightTiles = buildNetworkGrid();
    if (reduce) { lightTiles(1); lines.forEach((l) => l.classList.add('is-active')); return; }

    gsap.set(scenes.slice(1), { autoAlpha: 0 });
    gsap.set(lines, { autoAlpha: 0, y: 40 });
    let active = -1;

    const show = (i) => {
      if (i === active) return;
      const prev = active;
      active = i;
      count.textContent = String(i + 1).padStart(2, '0');
      scenes.forEach((sc, k) => gsap.to(sc, { autoAlpha: k === i ? 1 : 0, duration: 0.6, ease: 'power2.out', overwrite: true }));
      scenes.forEach((sc, k) => { const img = qs('img', sc); if (img && k === i) gsap.fromTo(img, { scale: 1.08 }, { scale: 1, duration: 2.4, ease: 'power2.out', overwrite: true }); });
      lines.forEach((l, k) => {
        l.classList.toggle('is-active', k === i);
        if (k === i) gsap.to(l, { autoAlpha: 1, y: 0, duration: 0.7, delay: prev < 0 ? 0 : 0.15, ease: 'expo.out', overwrite: true });
        else gsap.to(l, { autoAlpha: 0, y: k < i ? -40 : 40, duration: 0.4, ease: 'power2.in', overwrite: true });
      });
    };

    ScrollTrigger.create({
      trigger: reel,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate(self) {
        const p = self.progress;
        show(Math.min(2, Math.floor(p * 3)));
        lightTiles(p * 3 * 1.15);
      },
      onEnter: () => show(0),
      onEnterBack: () => show(2)
    });
  }

  /* ==========================================================================
     4. KINETIC TYPE + REVEALS
     ========================================================================== */
  function setupReveals() {
    // word-line rise
    qsa('.reveal-lines').forEach((el) => {
      splitText(el, false);
      el.classList.add('split-lines');
      if (reduce) return;
      gsap.fromTo(qsa('.wi', el), { yPercent: 110 }, {
        yPercent: 0, duration: 1.2, stagger: 0.06,
        scrollTrigger: { trigger: el, start: 'top 85%', once: true }
      });
    });

    // char rise (CTA)
    qsa('[data-split="chars"]').forEach((el) => {
      if (el === heroTitle) return;
      splitText(el, true);
      el.classList.add('split-chars');
      if (reduce) return;
      gsap.fromTo(qsa('.c', el), { yPercent: 115, rotate: 6 }, {
        yPercent: 0, rotate: 0, duration: 1.2, stagger: 0.018,
        scrollTrigger: { trigger: el, start: 'top 80%', once: true }
      });
    });

    // mission: scrub words from faint to full ink
    qsa('[data-split="scrub"]').forEach((el) => {
      splitText(el, false);
      if (reduce) return;
      gsap.fromTo(qsa('.w', el), { opacity: 0.14 }, {
        opacity: 1, ease: 'none', stagger: 0.1,
        scrollTrigger: { trigger: el, start: 'top 78%', end: 'bottom 50%', scrub: 0.5 }
      });
      const strike = qs('.scribble--strike path', el);
      if (strike) gsap.to(strike, { strokeDashoffset: 0, duration: 0.8, ease: 'power2.inOut', scrollTrigger: { trigger: el, start: 'top 45%', once: true } });
    });

    // simple fade-ups
    qsa('.reveal').forEach((el) => {
      if (reduce) return;
      gsap.fromTo(el, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 1.2, scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });

    // scribbles (outside hero/mission which run their own)
    qsa('.scribble path').forEach((p) => {
      if (p.closest('.mission') || p.closest('.hero')) return;
      if (reduce) { p.style.strokeDashoffset = 0; return; }
      gsap.to(p, { strokeDashoffset: 0, duration: 1, ease: 'power2.inOut', delay: 0.3, scrollTrigger: { trigger: p.closest('.stat, .story__portrait') || p, start: 'top 78%', once: true } });
    });
    if (reduce) qsa('.mission .scribble path').forEach((p) => { p.style.strokeDashoffset = 0; });

    // handwritten margin notes
    qsa('.note').forEach((n) => {
      if (reduce || n.closest('.story')) return;
      const r = getComputedStyle(n).getPropertyValue('--r') || '-3deg';
      gsap.fromTo(n, { autoAlpha: 0, rotate: parseFloat(r) + 8, y: 10 }, {
        autoAlpha: 1, rotate: parseFloat(r), y: 0, duration: 1, delay: 0.5, ease: 'back.out(1.6)',
        scrollTrigger: { trigger: n, start: 'top 90%', once: true }
      });
    });
  }

  /* ==========================================================================
     5. STATS
     ========================================================================== */
  function setupStats() {
    qsa('[data-count]').forEach((el) => {
      const to = parseFloat(el.dataset.count);
      const from = parseFloat(el.dataset.from || 0);
      if (reduce) { el.textContent = fmtNum(to); return; }
      // keep the final value in the layout (the thread measures it), count from `from` on enter
      const o = { v: from };
      el.textContent = fmtNum(to);
      gsap.to(o, {
        v: to, duration: 2.2, ease: 'power3.out',
        onUpdate: () => { el.textContent = fmtNum(o.v); },
        scrollTrigger: { trigger: el, start: 'top 85%', once: true }
      });
    });
    if (!reduce) {
      gsap.fromTo('.stat', { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.1, stagger: 0.08, scrollTrigger: { trigger: '.stats__grid', start: 'top 80%', once: true } });
    }
  }

  /* ==========================================================================
     6. RESPONSIVE MOTION (pillars, story, work parallax)
     ========================================================================== */
  const story = qs('.story');
  const track = qs('.story__track');

  function setupResponsiveMotion() {
    const mm = gsap.matchMedia();

    mm.add('(min-width: 769px) and (prefers-reduced-motion: no-preference)', () => {
      // Pillars: earlier cards sink back as the next one stacks on top
      const cards = qsa('.pillar');
      gsap.set(cards, { '--s': 1 });
      cards.forEach((card, i) => {
        const next = cards[i + 1];
        if (!next) return;
        gsap.to(card, { '--s': 0.93, ease: 'none', scrollTrigger: { trigger: next, start: 'top bottom', end: 'top 25%', scrub: true } });
      });

      // Story: vertical scroll drives a horizontal track
      const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const sizeStory = () => { story.style.height = `${dist() + window.innerHeight}px`; };
      sizeStory();
      ScrollTrigger.addEventListener('refreshInit', sizeStory);

      const tween = gsap.to(track, {
        x: () => -dist(),
        ease: 'none',
        scrollTrigger: {
          trigger: story,
          start: 'top top',
          end: () => `+=${dist()}`,
          scrub: true,
          invalidateOnRefresh: true
        }
      });

      qsa('.chapter').forEach((ch) => {
        gsap.fromTo(qs('.chapter__num', ch), { xPercent: 25 }, {
          xPercent: -25, ease: 'none',
          scrollTrigger: { trigger: ch, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true }
        });
        gsap.fromTo(qsa('.chapter__tag, .chapter__title, p:not(.chapter__tag)', ch), { autoAlpha: 0, y: 30 }, {
          autoAlpha: 1, y: 0, duration: 1, stagger: 0.08,
          scrollTrigger: { trigger: ch, containerAnimation: tween, start: 'left 80%', once: true }
        });
      });


      return () => {
        ScrollTrigger.removeEventListener('refreshInit', sizeStory);
        story.style.height = '';
      };
    });

    mm.add('(max-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
      qsa('.chapter, .story__intro, .story__outro, .pillar').forEach((el) => {
        gsap.fromTo(el, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 1, scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
      });
    });

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo('.cta__open, .cta__card, .cta__meta', { autoAlpha: 0, y: 24 }, { y: 0,
        autoAlpha: 1, duration: 1.2, stagger: 0.15, delay: 0.4,
        scrollTrigger: { trigger: '.cta', start: 'top 60%', once: true }
      });
    });
  }

  /* ==========================================================================
     8. INTERACTIONS
     ========================================================================== */
  const nav = qs('.nav');
  const darkActive = new Set();
  function updateNavTheme() {
    const dark = filmDark || darkActive.size > 0;
    nav.classList.toggle('is-dark', dark);
  }

  function setupNav() {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (!document.body.classList.contains('case-open')) {
        nav.classList.toggle('is-hidden', y > lastY && y > 240);
      }
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    qsa('[data-theme="dark"]').forEach((sec, i) => {
      ScrollTrigger.create({
        trigger: sec, start: 'top top+=40', end: 'bottom top+=40',
        onToggle(self) { self.isActive ? darkActive.add(i) : darkActive.delete(i); updateNavTheme(); }
      });
    });

    const bar = qs('.progress span');
    ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (s) => { bar.style.transform = `scaleX(${s.progress})`; } });

    ScrollTrigger.create({
      trigger: '#stats', start: 'top 80%', endTrigger: '#contact', end: 'top 85%',
      toggleClass: { targets: '.mbar', className: 'is-on' }
    });
  }

  function setupMagnetic() {
    if (!finePointer || reduce) return;
    qsa('.magnetic').forEach((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.3);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.3);
      });
      el.addEventListener('pointerleave', () => {
        gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.4)' });
      });
    });
  }

  function setupServices() {
    qsa('.service__head').forEach((btn) => {
      btn.addEventListener('click', () => {
        const li = btn.closest('.service');
        const open = !li.classList.contains('is-open');
        li.classList.toggle('is-open', open);
        btn.setAttribute('aria-expanded', String(open));
      });
    });
  }

  const toast = qs('.toast');
  let toastTimer;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-on'), 2600);
  }

  function setupCopy() {
    qsa('[data-copy]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const text = btn.dataset.copy;
        try {
          await navigator.clipboard.writeText(text);
        } catch (_) {
          const ta = document.createElement('textarea');
          ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
          document.body.appendChild(ta); ta.select();
          try { document.execCommand('copy'); } catch (__) { /* ignore */ }
          ta.remove();
        }
        btn.textContent = 'Copied ✓';
        setTimeout(() => { btn.textContent = 'Copy'; }, 2200);
        showToast('Copied ✓ Now write me something nice.');
      });
    });
  }

  function setupFooter() {
    const y = qs('[data-year]');
    if (y) y.textContent = new Date().getFullYear();

    const clock = qs('[data-clock]');
    const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit' });
    const tick = () => { clock.textContent = fmt.format(new Date()); };
    tick(); setInterval(tick, 15000);

    typeCycle(qs('[data-hello]'), ['Hello', 'नमस्ते', 'ನಮಸ್ಕಾರ', 'नमस्कार'], { startAfter: 2000 });

    // Easter egg: type "clay"
    let buf = '';
    const pot = qs('.footer__pot');
    window.addEventListener('keydown', (e) => {
      if (e.key.length !== 1) return;
      buf = (buf + e.key.toLowerCase()).slice(-4);
      if (buf === 'clay') {
        if (pot) { pot.classList.remove('is-spin'); void pot.getBoundingClientRect(); pot.classList.add('is-spin'); }
        showToast('you found it. now email me.');
      }
    });
  }

  /* ==========================================================================
     SELECTED WORK: a layered deck you flip, peek into, then open
     ========================================================================== */
  function setupDeck() {
    const deck = qs('.deck');
    if (!deck) return;
    const stack = qs('.deck__stack', deck);
    const cards = qsa('.deck__card', deck);
    const tabs = qsa('.deck__tab', deck);
    const countEl = qs('.deck__count span', deck);
    const n = cards.length;
    const D = reduce ? 0 : 1;
    let order = cards.map((_, i) => i);
    let busy = false;
    let drag = null;

    // WLDD has no photos, so its cover is the creator network itself
    const grid = qs('.deck__media--grid .net-grid', deck);
    if (grid) {
      for (let i = 0; i < 180; i++) {
        const t = document.createElement('span');
        if (rand() < 0.55) t.className = 'is-on';
        grid.appendChild(t);
      }
    }

    const pose = (pos) => {
      const step = window.innerWidth <= 768 ? 20 : 30;
      return { x: 0, y: -pos * step, scale: 1 - pos * 0.055, rotation: pos === 0 ? 0 : pos === 1 ? -2.2 : 2.6, autoAlpha: 1, zIndex: 30 - pos };
    };

    const setPeek = (card, on) => {
      card.classList.toggle('is-peek', on);
      const btn = qs('.deck__toggle', card);
      btn.setAttribute('aria-expanded', String(on));
      btn.firstChild.nodeValue = on ? 'Close ' : 'Look closer ';
    };

    const sync = () => {
      const front = order[0];
      cards.forEach((c, i) => {
        const isFront = i === front;
        c.classList.toggle('is-front', isFront);
        c.setAttribute('aria-hidden', String(!isFront));
        c.inert = !isFront;
        if (!isFront) setPeek(c, false);
      });
      tabs.forEach((t, i) => {
        t.classList.toggle('is-active', i === front);
        t.setAttribute('aria-current', i === front ? 'true' : 'false');
      });
      countEl.textContent = String(front + 1).padStart(2, '0');
    };

    const layout = (dur = 0.8) => {
      order.forEach((ci, pos) => gsap.to(cards[ci], { ...pose(pos), duration: dur * D, ease: 'expo.out', overwrite: 'auto' }));
      sync();
    };

    // peel the top card away; it slides to the back of the stack
    const next = () => {
      if (busy) return;
      busy = true;
      const f = cards[order[0]];
      setPeek(f, false);
      gsap.to(f, {
        x: -stack.offsetWidth * 1.1, rotation: -10, autoAlpha: 0, duration: 0.45 * D, ease: 'power2.in', overwrite: true,
        onComplete: () => {
          order.push(order.shift());
          gsap.set(f, { ...pose(n - 1), autoAlpha: 0 });
          layout();
          busy = false;
        }
      });
    };

    // bring the last card back in from the left, onto the top
    const prev = () => {
      if (busy) return;
      busy = true;
      order.unshift(order.pop());
      const f = cards[order[0]];
      gsap.set(f, { x: -stack.offsetWidth * 1.1, y: 0, scale: 1, rotation: -10, autoAlpha: 0, zIndex: 40 });
      layout(0.9);
      gsap.delayedCall(0.35 * D, () => { busy = false; });
    };

    const goTo = (i) => {
      const k = order.indexOf(i);
      if (k <= 0) return;
      order = [...order.slice(k), ...order.slice(0, k)];
      layout();
    };

    order.forEach((ci, pos) => gsap.set(cards[ci], pose(pos)));
    sync();

    qsa('.deck__arrow', deck).forEach((b) => b.addEventListener('click', () => (b.dataset.dir === '1' ? next() : prev())));
    tabs.forEach((t) => t.addEventListener('click', () => goTo(+t.dataset.go)));
    stack.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    });
    cards.forEach((c) => qs('.deck__toggle', c).addEventListener('click', (e) => {
      e.stopPropagation();
      setPeek(c, !c.classList.contains('is-peek'));
    }));

    // drag / swipe the top card; a tap looks closer (touch) or opens the story (mouse)
    stack.addEventListener('pointerdown', (e) => {
      const card = e.target.closest('.deck__card.is-front');
      if (!card || busy || e.target.closest('a, button')) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      drag = { card, id: e.pointerId, x0: e.clientX, y0: e.clientY, dx: 0, moved: false, type: e.pointerType };
    });
    stack.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x0;
      const dy = e.clientY - drag.y0;
      if (!drag.moved) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        if (Math.abs(dy) > Math.abs(dx)) { drag = null; return; } // a vertical swipe is a page scroll
        drag.moved = true;
        drag.card.classList.add('is-dragging');
        drag.card.setPointerCapture(e.pointerId);
        setPeek(drag.card, false);
      }
      drag.dx = dx;
      gsap.set(drag.card, { x: dx, rotation: dx * 0.035 });
    });
    const release = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const { card, dx, moved, type } = drag;
      drag = null;
      card.classList.remove('is-dragging');
      if (!moved) {
        if (type === 'mouse' || card.classList.contains('is-peek')) openCase(card.dataset.caseId, card);
        else setPeek(card, true);
        return;
      }
      const limit = Math.min(110, stack.offsetWidth * 0.22);
      if (dx < -limit) next();
      else if (dx > limit) prev();
      else gsap.to(card, { x: 0, rotation: 0, duration: 0.7 * D, ease: 'elastic.out(1, 0.6)' });
    };
    stack.addEventListener('pointerup', release);
    stack.addEventListener('pointercancel', () => {
      if (drag && drag.moved) {
        drag.card.classList.remove('is-dragging');
        gsap.to(drag.card, { x: 0, rotation: 0, duration: 0.4 * D });
      }
      drag = null;
    });

    // the stack deals itself in when it first scrolls into view
    if (!reduce) {
      gsap.set(cards, { autoAlpha: 0 });
      ScrollTrigger.create({
        trigger: deck, start: 'top 78%', once: true,
        onEnter: () => order.forEach((ci, pos) => gsap.fromTo(cards[ci],
          { y: 140 + pos * 30, rotation: pos === 0 ? 4 : pos === 1 ? -7 : 8, autoAlpha: 0 },
          { ...pose(pos), duration: 1.25, delay: (n - 1 - pos) * 0.14, ease: 'expo.out' }))
      });
    }
    window.addEventListener('resize', () => layout(0));
  }

  /* ==========================================================================
     9. CASE STUDY PANEL
     ========================================================================== */
  const caseEl = qs('.case');
  const sheet = qs('.case__sheet');
  const caseContent = qs('.case__content');
  const lightbox = qs('.lightbox');
  let lastFocus = null;
  let openId = null;

  const fmtVal = (g, v) => v === 0 && !g.prefix ? '0' : `${g.prefix || ''}${g.decimals ? v.toFixed(g.decimals) : fmtNum(v)}${g.suffix || ''}`;

  function renderGalleryItem(it) {
    if (it.type === 'video') {
      return `<figure class="gallery__video"><video src="${esc(it.src)}" poster="${esc(it.poster || '')}" muted loop playsinline autoplay preload="none" aria-label="${esc(it.caption)}"></video>${it.caption ? `<figcaption>${esc(it.caption)}</figcaption>` : ''}</figure>`;
    }
    if (it.type === 'tiktok') {
      // click-to-load: nothing is requested from TikTok until the viewer asks for it
      return `<figure class="embed" data-tiktok="${esc(it.id)}">
          <button type="button" class="embed__play" aria-label="Play ${esc(it.handle)} on TikTok">
            <span class="embed__handle">${esc(it.handle)}</span>
            ${it.followers ? `<span class="mono embed__meta">${esc(it.followers)} followers</span>` : ''}
            <span class="embed__icon" aria-hidden="true">▶</span>
            <span class="mono embed__cta">Play on TikTok</span>
          </button>
          ${it.caption ? `<figcaption>${esc(it.caption)}</figcaption>` : ''}
        </figure>`;
    }
    return `<figure data-full="${esc(it.src)}"><img src="${esc(it.src)}" alt="${esc(it.alt)}" loading="lazy" decoding="async">${it.caption ? `<figcaption>${esc(it.caption)}</figcaption>` : ''}</figure>`;
  }

  function renderCase(c, nextCase) {
    const known = (c.growth || []).filter((g) => g.before != null && g.after != null);
    const pending = (c.growth || []).filter((g) => g.before == null || g.after == null);

    const growthRows = known.map((g, i) => {
      const max = Math.max(g.before, g.after) || 1;
      const wb = Math.max(1.5, (g.before / max) * 100);
      const wa = Math.max(1.5, (g.after / max) * 100);
      let change;
      if (g.before === 0) change = 'from zero';
      else {
        const pct = ((g.after - g.before) / g.before) * 100;
        change = `${pct > 0 ? '+' : '−'}${Math.abs(Math.round(pct))}%${g.lowerIsBetter ? ' cut' : ''}`;
      }
      return `
        <div class="growth__row">
          <div class="growth__label"><small class="mono">${esc(g.group)}</small>${esc(g.label)}</div>
          <div class="growth__bars" aria-hidden="true">
            <span class="growth__bar" style="--w:${wb}%;--d:${0.1 + i * 0.08}s"></span>
            <span class="growth__bar growth__bar--after" style="--w:${wa}%;--d:${0.25 + i * 0.08}s"></span>
          </div>
          <div class="growth__vals">${esc(fmtVal(g, g.before))} → ${esc(fmtVal(g, g.after))}<span class="mono">${esc(change)}</span></div>
        </div>`;
    }).join('');

    const pendingHtml = pending.length ? `
      <p class="mono" style="margin-top:28px;color:var(--ink-60)">Numbers on the way</p>
      <ul class="growth__pending mono">${pending.map((g) => `<li>${esc(g.label)}</li>`).join('')}</ul>` : '';

    const gallery = (c.gallery || []).map((grp) => `
      <section class="gallery-group">
        <header class="gallery-group__head">
          <h4 class="gallery-group__title">${esc(grp.title)}</h4>
          ${grp.note ? `<p class="note" style="--r:-2deg">${esc(grp.note)}</p>` : ''}
        </header>
        <div class="gallery">${(grp.items || []).map(renderGalleryItem).join('')}</div>
      </section>`).join('');

    const links = (c.links || []).length
      ? `<ul class="case__links">${c.links.map((l) => `<li><a class="mono" href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a></li>`).join('')}</ul>`
      : '';

    const beforeAfter = c.before && c.after ? `
      <div class="case__block">
        <h3 class="case__h">The <em>transformation.</em></h3>
        <div class="case__ba">
          <figure data-full="${esc(c.before.src)}"><img src="${esc(c.before.src)}" alt="${esc(c.before.label)}" loading="lazy" decoding="async"><figcaption class="mono">${esc(c.before.label)}</figcaption></figure>
          <span class="case__ba-arrow" aria-hidden="true">→</span>
          <figure data-full="${esc(c.after.src)}"><img src="${esc(c.after.src)}" alt="${esc(c.after.label)}" loading="lazy" decoding="async"><figcaption class="mono">${esc(c.after.label)}</figcaption></figure>
        </div>
      </div>` : '';

    const brands = (c.brands || []).length
      ? `<ul class="brand-wall">${c.brands.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>`
      : '';

    const list = (arr) => (arr || []).map((x) => `<li>${esc(x)}</li>`).join('');

    caseContent.innerHTML = `
      <p class="mono case__eyebrow">${esc(c.client)} · ${esc(c.place)}</p>
      <h2 class="case__title" id="case-title">${esc(c.title)}</h2>
      <p class="mono case__role">${esc(c.role)}</p>

      <div class="case__hero">
        <p class="case__hero-num">${esc(c.hero.value)}</p>
        <p class="mono case__hero-label">${esc(c.hero.label)}</p>
        <p class="case__summary">${esc(c.summary)}</p>
        ${links}
      </div>

      ${(c.numbers || []).length ? `
      <div class="case__block">
        <h3 class="case__h">The <em>numbers.</em></h3>
        <div class="case__numbers">${c.numbers.map((n) => `<div class="case__number"><strong>${esc(n.value)}</strong><span class="mono">${esc(n.label)}</span></div>`).join('')}</div>
      </div>` : ''}

      ${growthRows || pendingHtml ? `
      <div class="case__block">
        <h3 class="case__h">Before → <em>after.</em></h3>
        <div class="growth">${growthRows || ''}</div>
        ${pendingHtml}
      </div>` : ''}

      ${beforeAfter}

      <div class="case__block case__cols">
        <div><h4>The brief</h4><p>${esc(c.challenge)}</p></div>
        <div><h4>What I did</h4><ul>${list(c.approach)}</ul></div>
        <div><h4>What happened</h4><ul>${list(c.results)}</ul></div>
      </div>

      ${brands ? `
      <div class="case__block">
        <h3 class="case__h">Brands I <em>worked on.</em></h3>
        ${brands}
      </div>` : ''}

      ${gallery ? `
      <div class="case__block">
        <h3 class="case__h">The <em>work.</em></h3>
        ${gallery}
      </div>` : ''}

      <div class="case__next">
        <span class="mono" style="color:var(--ink-60)">Next case</span>
        <button type="button" data-next="${esc(nextCase.id)}">${esc(nextCase.client)}: <em>${esc(nextCase.title)}</em> →</button>
      </div>`;
  }

  function openCase(id, fromEl) {
    const cases = window.CASES || [];
    const idx = cases.findIndex((c) => c.id === id);
    if (idx < 0) return;
    const c = cases[idx];
    renderCase(c, cases[(idx + 1) % cases.length]);
    const wasOpen = !caseEl.hidden;
    openId = id;
    if (!wasOpen) lastFocus = fromEl || document.activeElement;
    caseEl.hidden = false;
    document.body.classList.add('case-open');
    lenis && lenis.stop();
    sheet.scrollTop = 0;
    history.replaceState(null, '', `#case-${id}`);

    const fromCard = fromEl && fromEl.closest ? fromEl.closest('.deck__card') : null;
    if (!wasOpen && !reduce && fromCard) {
      // morph: the sheet grows out of the card you opened
      gsap.set(sheet, { yPercent: 0 });
      const r = fromCard.getBoundingClientRect();
      const sr = sheet.getBoundingClientRect();
      const px = (v) => Math.max(0, Math.round(v)) + 'px';
      const from = 'inset(' + px(r.top - sr.top) + ' ' + px(sr.right - r.right) + ' ' + px(sr.bottom - r.bottom) + ' ' + px(r.left - sr.left) + ' round 18px)';
      gsap.fromTo(sheet, { clipPath: from }, { clipPath: 'inset(0px 0px 0px 0px round 16px)', duration: 0.95, ease: 'expo.inOut', clearProps: 'clipPath' });
      gsap.fromTo('.case__backdrop', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, ease: 'power2.out' });
    } else if (!wasOpen && !reduce) {
      gsap.fromTo(sheet, { yPercent: 100 }, { yPercent: 0, duration: 0.9, ease: 'expo.out' });
      gsap.fromTo('.case__backdrop', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, ease: 'power2.out' });
    }
    if (!reduce) {
      gsap.fromTo(qsa('.case__content > *'), { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.05, delay: wasOpen ? 0 : 0.25 });
    }
    const growth = qs('.growth', caseContent);
    setTimeout(() => growth && growth.classList.add('is-in'), reduce ? 0 : 600);
    sheet.focus({ preventScroll: true });
  }

  function closeCase() {
    if (caseEl.hidden) return;
    const done = () => {
      caseEl.hidden = true;
      document.body.classList.remove('case-open');
      lenis && lenis.start();
      openId = null;
      history.replaceState(null, '', location.pathname + location.search);
      lastFocus && lastFocus.focus({ preventScroll: true });
    };
    if (reduce) { done(); return; }
    gsap.to('.case__backdrop', { autoAlpha: 0, duration: 0.4 });
    gsap.to(sheet, { yPercent: 100, duration: 0.6, ease: 'expo.in', onComplete: done });
  }

  function setupCases() {
    qsa('[data-case]').forEach((a) => {
      a.addEventListener('click', (e) => { e.preventDefault(); openCase(a.dataset.case, a); });
    });
    caseEl.addEventListener('click', (e) => {
      if (e.target.closest('[data-case-close]')) closeCase();
      const next = e.target.closest('[data-next]');
      if (next) openCase(next.dataset.next);
      const play = e.target.closest('.embed__play');
      if (play) {
        const fig = play.closest('[data-tiktok]');
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.tiktok.com/player/v1/${encodeURIComponent(fig.dataset.tiktok)}?autoplay=1&rel=0`;
        iframe.title = play.getAttribute('aria-label');
        iframe.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture';
        iframe.loading = 'lazy';
        play.replaceWith(iframe);
        return;
      }
      const fig = e.target.closest('figure[data-full]');
      if (fig) {
        qs('img', lightbox).src = fig.dataset.full;
        qs('img', lightbox).alt = qs('img', fig).alt;
        lightbox.hidden = false;
        qs('.lightbox__close', lightbox).focus();
      }
    });
    lightbox.addEventListener('click', () => { lightbox.hidden = true; });

    // swipe down to close on touch
    let startY = null;
    sheet.addEventListener('touchstart', (e) => { startY = sheet.scrollTop <= 0 ? e.touches[0].clientY : null; }, { passive: true });
    sheet.addEventListener('touchend', (e) => {
      if (startY != null && e.changedTouches[0].clientY - startY > 120) closeCase();
      startY = null;
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!lightbox.hidden) { lightbox.hidden = true; return; }
        closeCase();
      }
      if (e.key === 'Tab' && !caseEl.hidden) {
        const f = qsa('button, a[href], [tabindex]:not([tabindex="-1"])', caseEl).filter((el) => el.offsetParent !== null);
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ==========================================================================
     10. BOOT
     ========================================================================== */
  async function boot() {
    const pre = qs('.preloader');
    const countEl = qs('[data-preload-count]');
    const potPaths = qsa('.preloader__pot path, .preloader__pot ellipse');
    const counter = { v: 0 };
    const render = () => {
      countEl.textContent = String(Math.round(counter.v)).padStart(3, '0');
      potPaths.forEach((p) => { p.style.strokeDashoffset = 1 - counter.v / 100; });
    };
    const warm = gsap.to(counter, { v: 82, duration: reduce ? 0.2 : 1.3, ease: 'power2.out', onUpdate: render });

    setupReveals();
    setupStats();
    setupHero();
    setupReel();
    await withTimeout(document.fonts ? document.fonts.ready : Promise.resolve(), 3500);
    setupResponsiveMotion();
    setupNav();
    setupMagnetic();
    setupCopy();
    setupFooter();
    setupCases();
    setupDeck();

    await warm;
    await gsap.to(counter, { v: 100, duration: reduce ? 0.1 : 0.45, ease: 'power2.inOut', onUpdate: render });
    ScrollTrigger.refresh();

    if (reduce) {
      pre.remove();
    } else {
      gsap.to(pre, { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'expo.inOut', onComplete: () => pre.remove() });
      gsap.delayedCall(0.45, () => heroStart());
    }

    // refresh once lazy images settle
    window.addEventListener('load', () => ScrollTrigger.refresh());

    const m = location.hash.match(/^#case-(.+)$/);
    if (m) setTimeout(() => openCase(m[1]), reduce ? 0 : 900);
  }

  boot();
})();
