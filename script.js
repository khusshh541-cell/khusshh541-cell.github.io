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
    // For the hero, land after the film so the headline is showing
    scrollToTarget(target);
  });

  /* ==========================================================================
     2. HERO: film (frames → video → SVG fallback)
     ========================================================================== */
  const hero = qs('.hero');
  const stage = qs('.hero__stage');
  const canvas = qs('.hero__canvas');
  const ctx = canvas.getContext('2d');
  const filmSvg = qs('.hero__film');
  const heroCopy = qs('.hero__copy');
  const heroTitle = qs('.hero__title');
  const heroUnderline = qs('.hero__underline path');
  const REVEAL_AT = 0.84;
  let heroMode = 'svg';
  let filmDark = false;

  async function detectFilm() {
    let count = parseInt(canvas.dataset.frameCount, 10) || 0;
    let mobileCount = 0;
    let wantVideo = true; // unknown manifest (e.g. file://) → still try the video
    let clipSrcs = (canvas.dataset.clips || '').split(',').map((s) => s.trim()).filter(Boolean);
    try {
      const r = await withTimeout(fetch('assets/frames/manifest.json', { cache: 'no-store' }), 1500);
      if (r && r.ok) {
        const j = await r.json();
        count = j.count || count;
        mobileCount = j.mobileCount || 0;
        wantVideo = j.video === true;
        if (Array.isArray(j.clips)) clipSrcs = j.clips;
      }
    } catch (_) { /* file:// or missing manifest */ }
    if (count > 0) return { mode: 'frames', count, mobileCount };

    // separate scene clips, scrubbed one after another
    if (clipSrcs.length) {
      const clips = await Promise.all(clipSrcs.map((src) => new Promise((resolve) => {
        const v = document.createElement('video');
        v.muted = true; v.playsInline = true; v.preload = 'auto';
        const t = setTimeout(() => resolve(null), 4000);
        v.addEventListener('loadeddata', () => { clearTimeout(t); resolve(v); }, { once: true });
        v.addEventListener('error', () => { clearTimeout(t); resolve(null); }, { once: true });
        v.src = src;
      })));
      if (clips.every(Boolean)) return { mode: 'clips', clips };
    }
    if (!wantVideo) return { mode: 'svg' };

    const video = await new Promise((resolve) => {
      const v = document.createElement('video');
      v.muted = true; v.playsInline = true; v.preload = 'auto';
      const done = (ok) => { clearTimeout(t); resolve(ok ? v : null); };
      const t = setTimeout(() => done(false), 2000);
      v.addEventListener('loadeddata', () => done(true), { once: true });
      v.addEventListener('error', () => done(false), { once: true });
      v.src = 'assets/video/journey-scrub.mp4';
    });
    if (video) return { mode: 'video', video };
    return { mode: 'svg' };
  }

  // ----- canvas rendering (shared by frames + video modes)
  let dpr = 1;
  function sizeCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, isMobile() ? 1.5 : 2);
    canvas.width = Math.round(stage.clientWidth * dpr);
    canvas.height = Math.round(stage.clientHeight * dpr);
  }
  function drawCover(src, sw, sh) {
    if (!src || !sw) return;
    const cw = canvas.width, ch = canvas.height;
    const s = Math.max(cw / sw, ch / sh);
    const w = sw * s, h = sh * s;
    ctx.drawImage(src, (cw - w) / 2, (ch - h) / 2, w, h);
  }

  // ----- frames
  let frames = [];
  let frameCount = 0;
  let frameTarget = 0, frameCurrent = 0, lastDrawn = -1;

  function frameUrl(i, dir) { return `assets/frames/${dir}/f_${String(i + 1).padStart(4, '0')}.webp`; }

  async function loadFrames(count, dir) {
    frameCount = count;
    frames = new Array(count);
    const load = (i) => new Promise((res) => {
      if (frames[i]) return res();
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => { frames[i] = img; res(); };
      img.onerror = () => res();
      img.src = frameUrl(i, dir);
    });
    const order = [];
    const seen = new Set();
    [10, 5, 1].forEach((step) => { for (let i = 0; i < count; i += step) if (!seen.has(i)) { seen.add(i); order.push(i); } });
    const firstBatch = order.slice(0, Math.ceil(count / 10));
    const rest = order.slice(firstBatch.length);
    await Promise.all(firstBatch.map(load));
    // background fill with limited concurrency
    (async () => {
      const queue = rest.slice();
      const worker = async () => { while (queue.length) await load(queue.shift()); };
      await Promise.all(Array.from({ length: 6 }, worker));
    })();
  }
  function nearestFrame(i) {
    for (let d = 0; d < frameCount; d++) {
      if (frames[i - d]) return frames[i - d];
      if (frames[i + d]) return frames[i + d];
    }
    return null;
  }
  function drawFrame(i) {
    const img = nearestFrame(i);
    if (img) drawCover(img, img.naturalWidth, img.naturalHeight);
  }

  // ----- SVG film (fallback, also the designed default until real footage exists)
  function buildFilmSvg() {
    const nodesG = qs('.act2__nodes', filmSvg);
    const linksG = qs('.act2__links', filmSvg);
    const rainG = qs('.act3__rain', filmSvg);
    const NS = 'http://www.w3.org/2000/svg';
    const pts = [];
    let guard = 0;
    while (pts.length < 22 && guard++ < 2000) {
      const p = { x: 130 + rand() * 940, y: 130 + rand() * 520 };
      if (pts.every((q) => Math.hypot(q.x - p.x, q.y - p.y) > 120)) pts.push(p);
    }
    // nearest-neighbour chain from the entry point = "threading beads"
    const chain = [];
    let cur = { x: 250, y: 600 };
    const pool = pts.slice();
    while (pool.length) {
      pool.sort((a, b) => Math.hypot(a.x - cur.x, a.y - cur.y) - Math.hypot(b.x - cur.x, b.y - cur.y));
      cur = pool.shift();
      chain.push(cur);
    }
    const linkPath = (a, b, bend) => {
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const nx = -(b.y - a.y) * bend, ny = (b.x - a.x) * bend;
      return `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} Q ${(mx + nx).toFixed(1)} ${(my + ny).toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
    };
    let prev = { x: 250, y: 600 };
    chain.forEach((p, i) => {
      const path = document.createElementNS(NS, 'path');
      path.setAttribute('d', linkPath(prev, p, i % 2 ? 0.18 : -0.18));
      path.setAttribute('pathLength', '1');
      linksG.appendChild(path);
      prev = p;
    });
    // a few cross-links to turn the chain into a web
    for (let i = 0; i < chain.length - 4; i += 3) {
      const path = document.createElementNS(NS, 'path');
      path.setAttribute('d', linkPath(chain[i], chain[i + 4], 0.12));
      path.setAttribute('pathLength', '1');
      path.classList.add('is-cross');
      linksG.appendChild(path);
    }
    chain.forEach((p) => {
      const g = document.createElementNS(NS, 'g');
      g.innerHTML = '<g class="node"><rect x="-17" y="-27" width="34" height="54" rx="7"/><circle cx="0" cy="-9" r="6.5"/><line x1="-9" y1="6" x2="9" y2="6"/><line x1="-9" y1="14" x2="4" y2="14"/></g>';
      nodesG.appendChild(g);
      gsap.set(g, { x: p.x, y: p.y });
    });
    for (let i = 0; i < 46; i++) {
      const l = document.createElementNS(NS, 'line');
      const x = rand() * 1300 - 50, y = rand() * 900 - 100;
      l.setAttribute('x1', x); l.setAttribute('y1', y);
      l.setAttribute('x2', x - 7); l.setAttribute('y2', y + 30);
      rainG.appendChild(l);
    }
  }

  function buildHeroTimeline() {
    const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
    const caps = qsa('.hero__captions li');
    const windows = [[0.02, 0.27], [0.32, 0.57], [0.62, 0.8]];
    tl.to('.hero__prompt', { autoAlpha: 0, duration: 0.04 }, 0.03);
    caps.forEach((li, i) => {
      const [a, b] = windows[i];
      tl.fromTo(li, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.035, ease: 'power2.out' }, a);
      tl.to(li, { autoAlpha: 0, y: -18, duration: 0.035, ease: 'power2.in' }, b - 0.035);
    });
    tl.to('.hero__kicker', { autoAlpha: 0, duration: 0.04 }, 0.78);

    if (heroMode === 'svg') {
      const act1 = qs('.act--1', filmSvg), act2 = qs('.act--2', filmSvg), act3 = qs('.act--3', filmSvg);
      const links = qsa('.act2__links path', filmSvg);
      const nodes = qsa('.act2__nodes > g', filmSvg);
      const nodeInner = qsa('.act2__nodes .node', filmSvg);
      gsap.set([act2, act3], { autoAlpha: 0 });
      gsap.set(nodeInner, { scale: 0, transformOrigin: '50% 50%' });
      gsap.set(act2, { scale: 1.35, transformOrigin: '50% 50%' });

      // Act 1: the workshop (pot already drawn by the intro)
      tl.to('.act1__spin', { strokeDashoffset: 0, duration: 0.07, stagger: 0.02 }, 0.02)
        .to('.act1__glow', { scale: 1.25, transformOrigin: '50% 50%', duration: 0.24 }, 0)
        .to('.act1__peel', { strokeDashoffset: 0, duration: 0.12 }, 0.12)
        .to(act1, { autoAlpha: 0, y: -60, duration: 0.05 }, 0.27);

      // Act 2: the network
      tl.to(act2, { autoAlpha: 1, duration: 0.02 }, 0.29)
        .to('.act2__enter', { strokeDashoffset: 0, duration: 0.05 }, 0.3)
        .to(act2, { scale: 1, duration: 0.3 }, 0.3)
        .to(nodeInner, { scale: 1, duration: 0.012, stagger: 0.006, ease: 'back.out(2)' }, 0.33);
      links.forEach((p, i) => {
        tl.to(p, { strokeDashoffset: 0, duration: 0.02 }, (p.classList.contains('is-cross') ? 0.47 : 0.34) + i * 0.0055);
      });
      tl.to(nodes, { x: 600, y: 470, duration: 0.06, ease: 'power2.in', stagger: 0.001 }, 0.56)
        .to([nodeInner, links], { autoAlpha: 0, duration: 0.04 }, 0.58)
        .to('.act2__enter', { autoAlpha: 0, duration: 0.03 }, 0.58);

      // Act 3: the launch
      tl.to(act3, { autoAlpha: 1, duration: 0.02 }, 0.6)
        .to('.act3__streak', { strokeDashoffset: 0, duration: 0.07 }, 0.6)
        .fromTo('.act3__rain', { autoAlpha: 0, y: -40 }, { autoAlpha: 1, y: 40, duration: 0.12 }, 0.6)
        .fromTo('.act3__window', { autoAlpha: 0, scale: 0.9, transformOrigin: '50% 50%' }, { autoAlpha: 1, scale: 1.08, duration: 0.14 }, 0.64)
        .to(act3, { autoAlpha: 0, duration: 0.05 }, 0.79);
    }
    // footage hands off to the cream page before the headline arrives
    if (heroMode !== 'svg') tl.fromTo(canvas, { opacity: 1 }, { opacity: 0, duration: 0.07 }, REVEAL_AT - 0.08);
    tl.set({}, {}, 1); // timeline length = scroll progress 0 → 1
    return tl;
  }

  function buildHeroReveal() {
    const chars = qsa('.c', heroTitle);
    const tl = gsap.timeline({ paused: true });
    tl.set(heroCopy, { autoAlpha: 1 })
      .fromTo(chars, { yPercent: 115, rotate: 7 }, { yPercent: 0, rotate: 0, duration: 1.15, stagger: 0.022 }, 0)
      .fromTo(heroUnderline, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut' }, 0.55)
      .fromTo('.hero__sub', { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 1 }, 0.45)
      .fromTo('.hero__ctas', { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 1 }, 0.6);
    return tl;
  }

  async function setupHero() {
    splitText(heroTitle, true);
    heroTitle.classList.add('split-chars');

    if (reduce) {
      hero.classList.add('hero--static');
      gsap.set(heroUnderline, { strokeDashoffset: 0 });
      return;
    }

    const film = await detectFilm();
    heroMode = film.mode;

    if (film.mode === 'frames' || film.mode === 'video' || film.mode === 'clips') {
      hero.classList.add('hero--film');
      filmDark = true;
      sizeCanvas();
      if (film.mode === 'clips') {
        // scrub each scene clip in turn; crossfade from a snapshot of the previous scene
        const clips = film.clips;
        const snap = document.createElement('canvas');
        const sctx = snap.getContext('2d');
        let active = 0, fade = 0, cur = 0;
        const render = () => {
          const v = clips[active];
          drawCover(v, v.videoWidth, v.videoHeight);
          if (fade > 0) { ctx.globalAlpha = fade; ctx.drawImage(snap, 0, 0); ctx.globalAlpha = 1; }
        };
        clips.forEach((v, i) => v.addEventListener('seeked', () => { if (i === active) render(); }));
        hero._clips = { render };
        render();
        gsap.ticker.add(() => {
          cur += (frameTarget - cur) * 0.2;
          const n = clips.length;
          const i = Math.min(n - 1, Math.floor(cur));
          if (i !== active) {
            snap.width = canvas.width; snap.height = canvas.height;
            sctx.drawImage(canvas, 0, 0);
            fade = 1; active = i;
          }
          const v = clips[active];
          const t = clamp(cur - active, 0, 0.999) * (v.duration || 0);
          if (!v.seeking && Math.abs(v.currentTime - t) > 0.04) v.currentTime = t;
          if (fade > 0) { fade = Math.max(0, fade - 0.05); render(); }
        });
        frameCount = clips.length;
      } else if (film.mode === 'frames') {
        const dir = isMobile() && film.mobileCount ? 'mobile' : 'desktop';
        await loadFrames(isMobile() && film.mobileCount ? film.mobileCount : film.count, dir);
        drawFrame(0);
        gsap.ticker.add(() => {
          frameCurrent += (frameTarget - frameCurrent) * 0.22;
          const idx = Math.round(frameCurrent);
          if (idx !== lastDrawn) { lastDrawn = idx; drawFrame(idx); }
        });
      } else {
        const v = film.video;
        const draw = () => drawCover(v, v.videoWidth, v.videoHeight);
        v.addEventListener('seeked', draw);
        draw();
        frameCount = 0;
        hero._video = v;
      }
      window.addEventListener('resize', () => {
        sizeCanvas(); lastDrawn = -1;
        if (hero._video) drawCover(hero._video, hero._video.videoWidth, hero._video.videoHeight);
        if (hero._clips) hero._clips.render();
      });
    } else {
      hero.classList.add('hero--svg');
      buildFilmSvg();
    }

    gsap.set(heroCopy, { autoAlpha: 0 });
    const tl = buildHeroTimeline();
    const reveal = buildHeroReveal();
    let revealed = false;

    ScrollTrigger.create({
      trigger: hero,
      start: 'top top',
      end: 'bottom bottom',
      scrub: heroMode === 'svg' ? 0.6 : true,
      onUpdate(self) {
        const p = self.progress;
        tl.progress(p);
        const filmP = clamp(p / REVEAL_AT, 0, 1);
        if (heroMode === 'frames') frameTarget = filmP * (frameCount - 1);
        if (heroMode === 'clips') frameTarget = filmP * frameCount;
        if (heroMode === 'video' && hero._video) {
          const v = hero._video;
          const t = filmP * (v.duration || 0);
          if (!v.seeking && Math.abs(v.currentTime - t) > 0.03) v.currentTime = t;
        }
        filmDark = heroMode !== 'svg' && p < REVEAL_AT - 0.02;
        updateNavTheme();
        if (p >= REVEAL_AT && !revealed) { revealed = true; reveal.timeScale(1).play(); }
        else if (p < REVEAL_AT - 0.06 && revealed) { revealed = false; reveal.timeScale(2.2).reverse(); }
      }
    });
  }

  function heroIntro() {
    if (reduce) return;
    const tl = gsap.timeline();
    tl.from('.hero__kicker', { autoAlpha: 0, y: 14, duration: 1 }, 0.1)
      .from('.hero__prompt', { autoAlpha: 0, y: 14, duration: 1 }, 0.3);
    if (heroMode === 'svg') {
      tl.fromTo('.act1__glow', { autoAlpha: 0, scale: 0.6, transformOrigin: '50% 50%' }, { autoAlpha: 1, scale: 1, duration: 2 }, 0)
        .to('.act1__pot', { strokeDashoffset: 0, duration: 2.2, ease: 'power2.inOut' }, 0.1)
        .to('.act1__rim', { strokeDashoffset: 0, duration: 1, ease: 'power2.inOut' }, 1.6)
        .from('.act1__wheel', { autoAlpha: 0, duration: 1.2 }, 0.6);
      gsap.to('.act1__wheel', { strokeDashoffset: -1, duration: 5, ease: 'none', repeat: -1 });
    }
  }

  /* ==========================================================================
     3. THE THREAD: one orange line from the hero underline to the email
     ========================================================================== */
  const page = qs('.page');
  const threadSvg = qs('.thread');
  const threadPath = qs('.thread__path');
  let threadSamples = null, threadLen = 0;

  function buildThread() {
    const pageR = page.getBoundingClientRect();
    const W = page.clientWidth;
    const H = page.scrollHeight;
    threadSvg.setAttribute('width', W);
    threadSvg.setAttribute('height', H);
    threadSvg.style.height = H + 'px';

    // start: the hero underline, at the moment the stage releases
    const ur = qs('.hero__underline').getBoundingClientRect();
    const sr = stage.getBoundingClientRect();
    const stageFinalTop = hero.offsetTop + hero.offsetHeight - stage.offsetHeight;
    let px = ur.right - sr.left - 6;
    let py = stageFinalTop + (ur.top - sr.top) + ur.height * 0.55;
    let d = `M ${px.toFixed(1)} ${py.toFixed(1)}`;

    const f = (n) => n.toFixed(1);
    const C = (x1, y1, x2, y2, x, y) => { d += ` C ${f(x1)} ${f(y1)}, ${f(x2)} ${f(y2)}, ${f(x)} ${f(y)}`; px = x; py = y; };
    // vertical tangents: travel down margins
    const curveTo = (x, y) => {
      const k = Math.max(90, Math.abs(y - py) * 0.5);
      C(px, py + k, x, y - k, x, y);
    };
    // vertical departure, horizontal arrival moving in direction `dir` (+1 right, -1 left)
    // drop straight down the margin, turn a soft corner, then run along the baseline
    const sweepTo = (x, y, dir) => {
      const R = 46;
      const dy = y - R - py;
      if (dy > 0) C(px, py + dy / 3, px, y - R - dy / 3, px, y - R);
      C(px, y - R * 0.45, px + dir * R * 0.45, y, px + dir * R, y);
      const run = x - px;
      C(px + run * 0.35, y + 3, px + run * 0.7, y - 3, x, y);
    };
    // horizontal tangents: glide across a gap
    const glideTo = (x, y) => {
      const dx = (x - px) * 0.5;
      C(px + dx, py, x - dx, y, x, y);
    };

    qsa('[data-thread]').forEach((el) => {
      if (!el.getClientRects().length) return;
      const r = el.getBoundingClientRect();
      const x = r.left - pageR.left, y = r.top - pageR.top;
      const type = el.dataset.thread;
      if (type === 'point') {
        if (el.dataset.dir === 'h') glideTo(x, y); else curveTo(x, y);
      } else if (type === 'under') {
        // hand-drawn underline, drawn in the direction the thread arrives from
        const by = y + r.height + 5;
        const fromLeft = px < x + r.width / 2;
        const xs = fromLeft ? x - 14 : x + r.width + 16;
        const xe = fromLeft ? x + r.width + 16 : x - 14;
        const dir = fromLeft ? 1 : -1;
        sweepTo(xs, by, dir);
        const w = xe - xs;
        C(xs + w * 0.3, by + 7, xs + w * 0.62, by - 6, xe, by + 2);
      } else if (type === 'loop') {
        // arrive horizontally from the right, circle 1¼ times, leave down the left side
        const cx = x + r.width / 2, cy = y + r.height / 2;
        const rx = Math.min(Math.max(r.width / 2 + 34, r.width * 0.71), cx - 8), ry = r.height * 0.71, k = 0.5523;
        const topY = cy - ry;
        C(px - (px - cx) * 0.5, py, cx + rx * 0.6, topY, cx, topY);
        C(cx - k * rx, topY, cx - rx, cy - k * ry, cx - rx, cy);
        C(cx - rx, cy + k * ry, cx - k * rx, cy + ry, cx, cy + ry);
        C(cx + k * rx, cy + ry, cx + rx, cy + k * ry, cx + rx, cy);
        C(cx + rx, cy - k * ry * 1.1, cx + k * rx, cy - ry * 1.08, cx - rx * 0.05, cy - ry * 1.06);
        C(cx - k * rx * 1.1, cy - ry * 1.04, cx - rx * 1.08, cy - k * ry, cx - rx * 1.06, cy + ry * 0.1);
      }
    });

    threadPath.setAttribute('d', d);
    threadLen = threadPath.getTotalLength();
    threadPath.style.strokeDasharray = `${threadLen} ${threadLen}`;

    // sample: running max of y per length, so we can draw "just ahead of the reader"
    const n = Math.max(2, Math.ceil(threadLen / 10));
    const lens = new Float32Array(n + 1), maxY = new Float32Array(n + 1);
    let m = -Infinity;
    for (let i = 0; i <= n; i++) {
      const l = (threadLen * i) / n;
      const pt = threadPath.getPointAtLength(l);
      m = Math.max(m, pt.y);
      lens[i] = l; maxY[i] = m;
    }
    threadSamples = { lens, maxY, n };
    updateThread();
  }

  function updateThread() {
    if (!threadSamples) return;
    if (reduce) { threadPath.style.strokeDashoffset = 0; return; }
    const pageTop = page.getBoundingClientRect().top;
    const target = -pageTop + window.innerHeight * 0.62;
    const { lens, maxY, n } = threadSamples;
    let lo = 0, hi = n, ans = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (maxY[mid] <= target) { ans = mid; lo = mid + 1; } else hi = mid - 1;
    }
    const drawn = ans < 0 ? 0 : lens[ans];
    threadPath.style.strokeDashoffset = threadLen - drawn;
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
      gsap.to(p, { strokeDashoffset: 0, duration: 1, ease: 'power2.inOut', delay: 0.3, scrollTrigger: { trigger: p.closest('.stat, .story__portrait, .work-card') || p, start: 'top 78%', once: true } });
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
  const storyThread = qs('.story__thread');
  const storyPath = qs('.story__thread path');

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

      const buildStoryThread = () => {
        const W = track.scrollWidth, H = track.clientHeight;
        storyThread.setAttribute('width', W);
        storyThread.setAttribute('height', H);
        storyThread.style.width = W + 'px';
        let d = `M 0 ${(H * 0.86).toFixed(1)}`;
        for (let x = 40; x <= W; x += 40) {
          const y = H * 0.86 + Math.sin((x / W) * Math.PI * 9) * 26 + Math.sin(x / 170) * 6;
          d += ` L ${x} ${y.toFixed(1)}`;
        }
        storyPath.setAttribute('d', d);
        const L = storyPath.getTotalLength();
        storyPath.style.strokeDasharray = `${L} ${L}`;
        storyPath.style.strokeDashoffset = L;
        storyPath._len = L;
      };
      buildStoryThread();

      const tween = gsap.to(track, {
        x: () => -dist(),
        ease: 'none',
        scrollTrigger: {
          trigger: story,
          start: 'top top',
          end: () => `+=${dist()}`,
          scrub: true,
          invalidateOnRefresh: true,
          onRefresh: buildStoryThread,
          onUpdate(self) {
            const L = storyPath._len || 0;
            const W = track.scrollWidth;
            const seen = (self.progress * dist() + window.innerWidth * 0.75) / W;
            storyPath.style.strokeDashoffset = L * (1 - clamp(seen, 0, 1));
          }
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

      // Work: metric parallax inside each card
      qsa('.work-card__media').forEach((m) => {
        gsap.fromTo(qsa('.work-card__metric, .work-card__metric-label', m), { y: 50 }, { y: -30, ease: 'none', scrollTrigger: { trigger: m.closest('.work-card'), start: 'top bottom', end: 'bottom top', scrub: true } });
      });

      return () => {
        ScrollTrigger.removeEventListener('refreshInit', sizeStory);
        story.style.height = '';
      };
    });

    mm.add('(max-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(track, { '--p': 0 }, { '--p': 1, ease: 'none', scrollTrigger: { trigger: track, start: 'top 70%', end: 'bottom 70%', scrub: true } });
      qsa('.chapter, .story__intro, .story__outro, .pillar').forEach((el) => {
        gsap.fromTo(el, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 1, scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
      });
    });

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo('.work-card', { autoAlpha: 0, y: 60 }, {
        autoAlpha: 1, y: 0, duration: 1.2, stagger: 0.1,
        scrollTrigger: { trigger: '.work__grid', start: 'top 80%', once: true }
      });
      gsap.fromTo('.service', { autoAlpha: 0, y: 30 }, {
        autoAlpha: 1, y: 0, duration: 1, stagger: 0.08,
        scrollTrigger: { trigger: '.services__list', start: 'top 82%', once: true }
      });
      gsap.fromTo('.agent__flow li', { autoAlpha: 0, x: -16 }, {
        autoAlpha: 1, x: 0, duration: 0.8, stagger: 0.12,
        scrollTrigger: { trigger: '.agent', start: 'top 75%', once: true }
      });
      gsap.fromTo('.cta__email-row, .cta__actions', { autoAlpha: 0 }, {
        autoAlpha: 1, duration: 1.2, stagger: 0.15, delay: 0.4,
        scrollTrigger: { trigger: '.cta', start: 'top 60%', once: true }
      });
    });
  }

  /* ==========================================================================
     7. MARQUEE (velocity-linked)
     ========================================================================== */
  function setupMarquee() {
    const tr = qs('.marquee__track');
    if (!tr) return;
    if (reduce) return;
    let x = 0, visible = false;
    const skew = gsap.quickTo(tr, 'skewX', { duration: 0.5, ease: 'power3.out' });
    ScrollTrigger.create({ trigger: '.marquee', start: 'top bottom', end: 'bottom top', onToggle: (s) => { visible = s.isActive; } });
    gsap.ticker.add((_, dt) => {
      if (!visible) return;
      const v = lenis ? lenis.velocity : 0;
      const half = tr.scrollWidth / 2;
      x -= (0.05 + Math.min(Math.abs(v) * 0.04, 1.2)) * dt;
      if (x <= -half) x += half;
      gsap.set(tr, { x });
      skew(clamp(-v * 0.25, -6, 6));
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
      updateThread();
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

  function setupCursor() {
    if (!finePointer) return;
    root.classList.add('has-cursor');
    const cur = qs('.cursor');
    const dot = qs('.cursor__dot');
    const ring = qs('.cursor__ring');
    const label = qs('.cursor__label');
    const dx = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'power3' });
    const dy = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'power3' });
    const rx = gsap.quickTo(ring, 'x', { duration: reduce ? 0.01 : 0.45, ease: 'power3' });
    const ry = gsap.quickTo(ring, 'y', { duration: reduce ? 0.01 : 0.45, ease: 'power3' });
    gsap.set(cur, { autoAlpha: 0 });
    window.addEventListener('pointermove', (e) => { if (!cur._on) { cur._on = true; gsap.set([dot, ring], { x: e.clientX, y: e.clientY }); gsap.to(cur, { autoAlpha: 1, duration: 0.3 }); } dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); }, { passive: true });
    document.addEventListener('pointerover', (e) => {
      const t = e.target.closest('a, button, [data-cursor]');
      const lbl = t && t.dataset.cursor;
      cur.classList.toggle('is-label', !!lbl);
      cur.classList.toggle('is-link', !!t && !lbl);
      label.textContent = lbl || '';
      cur.classList.toggle('on-dark', !!e.target.closest('[data-theme="dark"], .tone-teal, .tone-ink, .tone-orange, .tone-terracotta, .case__backdrop, .lightbox'));
    });
    document.addEventListener('pointerleave', () => gsap.to(cur, { autoAlpha: 0, duration: 0.2 }));
    document.addEventListener('pointerenter', () => { if (cur._on) gsap.to(cur, { autoAlpha: 1, duration: 0.2 }); });
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

    const hello = qs('[data-hello]');
    const words = ['Hello', 'नमस्ते', 'ನಮಸ್ಕಾರ', 'नमस्कार'];
    const seg = window.Intl && Intl.Segmenter ? new Intl.Segmenter('en', { granularity: 'grapheme' }) : null;
    const graphemes = (s) => (seg ? [...seg.segment(s)].map((g) => g.segment) : [...s]);
    let wi = 0;
    const cycle = async () => {
      if (reduce) { wi = (wi + 1) % words.length; hello.textContent = words[wi]; setTimeout(cycle, 2200); return; }
      const cur = graphemes(words[wi]);
      for (let i = cur.length; i >= 0; i--) { hello.textContent = cur.slice(0, i).join(''); await wait(60); }
      wi = (wi + 1) % words.length;
      const next = graphemes(words[wi]);
      for (let i = 1; i <= next.length; i++) { hello.textContent = next.slice(0, i).join(''); await wait(110); }
      setTimeout(cycle, 2000);
    };
    setTimeout(cycle, 2000);

    // Easter egg: type "clay"
    let buf = '';
    const pot = qs('.footer__pot');
    window.addEventListener('keydown', (e) => {
      if (e.key.length !== 1) return;
      buf = (buf + e.key.toLowerCase()).slice(-4);
      if (buf === 'clay') {
        pot.classList.remove('is-spin'); void pot.getBoundingClientRect(); pot.classList.add('is-spin');
        showToast('you found it. now email me.');
      }
    });
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

    if (!wasOpen && !reduce) {
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
    await withTimeout(Promise.all([setupHero(), document.fonts ? document.fonts.ready : null]), 3500);
    setupResponsiveMotion();
    setupMarquee();
    setupNav();
    setupCursor();
    setupMagnetic();
    setupServices();
    setupCopy();
    setupFooter();
    setupCases();

    await warm;
    await gsap.to(counter, { v: 100, duration: reduce ? 0.1 : 0.45, ease: 'power2.inOut', onUpdate: render });

    ScrollTrigger.addEventListener('refresh', buildThread);
    ScrollTrigger.refresh();

    if (reduce) {
      pre.remove();
    } else {
      gsap.to(pre, { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'expo.inOut', onComplete: () => pre.remove() });
      gsap.delayedCall(0.5, heroIntro);
    }

    // refresh once lazy images settle
    window.addEventListener('load', () => ScrollTrigger.refresh());

    const m = location.hash.match(/^#case-(.+)$/);
    if (m) setTimeout(() => openCase(m[1]), reduce ? 0 : 900);
  }

  boot();
})();
