'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { SplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';
import Lenis from 'lenis';
import { getBackground } from '@/lib/bg/engine';

gsap.registerPlugin(useGSAP, ScrollTrigger, ScrambleTextPlugin, MotionPathPlugin, SplitText);

const CHARS = '01<>/{}[]#$%&*+=?';

/** The text an element had when the page was rendered, even if an animation is mid-scramble. */
const original = (el: HTMLElement) => (el.dataset.text ??= el.textContent ?? '');
const NS = 'http://www.w3.org/2000/svg';

/** Sends a dot along an SVG path, then calls onEnd. */
function sendPacket(layer: Element, path: SVGPathElement, cls: string, dur: number, onEnd?: () => void) {
  const c = document.createElementNS(NS, 'circle');
  c.setAttribute('class', cls);
  c.setAttribute('r', '3.5');
  layer.appendChild(c);
  gsap.to(c, { duration: dur, ease: 'power1.inOut', motionPath: { path, align: path, alignOrigin: [0.5, 0.5] }, onComplete: () => { c.remove(); onEnd?.(); } });
}
function flash(el: Element | null | undefined) {
  if (!el) return;
  el.classList.add('hit');
  setTimeout(() => el.classList.remove('hit'), 500);
}

/** Git graph paths depend on where the commit dots land after layout. */
function buildGraph(gitlog: HTMLElement, svg: SVGSVGElement, paths: SVGPathElement[]) {
  const top = gitlog.getBoundingClientRect().top;
  const rows = [...gitlog.querySelectorAll<HTMLElement>('.c')].map((c) => {
    const d = c.querySelector('.dot')!.getBoundingClientRect();
    return { lane: Number(c.dataset.lane), y: d.top + d.height / 2 - top };
  });
  const x0 = 14, x1 = 46, h = 18, ds: [string, string][] = [];
  const mains = rows.filter((r) => r.lane === 0);
  ds.push(['main', `M${x0} ${mains[0].y} V${mains[mains.length - 1].y}`]);
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].lane !== 1 || (i > 0 && rows[i - 1].lane === 1)) continue;
    let j = i;
    while (j + 1 < rows.length && rows[j + 1].lane === 1) j++;
    const merge = rows[i - 1], fork = rows[j + 1];
    if (!merge || !fork) continue;
    ds.push(['side', `M${x0} ${fork.y} C${x0} ${fork.y - h} ${x1} ${fork.y - h} ${x1} ${fork.y - 2 * h} V${merge.y + 2 * h} C${x1} ${merge.y + h} ${x0} ${merge.y + h} ${x0} ${merge.y}`]);
  }
  if (!paths.length) ds.forEach(([cls]) => { const p = document.createElementNS(NS, 'path'); p.setAttribute('class', cls); p.setAttribute('pathLength', '1'); svg.appendChild(p); paths.push(p); });
  ds.forEach(([, d], i) => paths[i]?.setAttribute('d', d));
  return paths;
}

/** All scroll and intro animations, plus which background mode each section drives. */
export function Motion() {

  useGSAP(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const gitlog = document.querySelector<HTMLElement>('.gitlog');
    const graphSvg = gitlog?.querySelector<SVGSVGElement>('.graph');
    const gpaths: SVGPathElement[] = [];
    const rebuild = () => { if (gitlog && graphSvg) buildGraph(gitlog, graphSvg, gpaths); };
    rebuild();
    ScrollTrigger.addEventListener('refreshInit', rebuild);

    // each section's stage drives the background mode (works through pinned sections)
    const sections = [...document.querySelectorAll<HTMLElement>('main > header, main section')]
      .map((el) => ({ el, stage: el.querySelector<HTMLElement>('.bgstage') }))
      .filter((s): s is { el: HTMLElement; stage: HTMLElement } => !!s.stage);
    const pickBg = () => {
      const bg = getBackground();
      if (!bg || !sections.length) return;
      // the stage with the most visible area wins, so the drawing is always on screen
      let pick = sections[0], best = -1;
      for (const s of sections) {
        const r = s.stage.getBoundingClientRect();
        const visible = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0));
        if (visible > best) { best = visible; pick = s; }
      }
      if (best <= 0) for (const s of sections) if (s.el.getBoundingClientRect().top <= innerHeight * 0.55) pick = s;
      bg.section(pick.stage.dataset.bg!, pick.stage);
    };
    let ticking = false;
    const onScroll = () => { if (ticking) return; ticking = true; requestAnimationFrame(() => { ticking = false; pickBg(); }); };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    ScrollTrigger.addEventListener('refresh', pickBg);
    timers.push(setTimeout(pickBg, 50));

    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const lenis = new Lenis({ lerp: 0.1 });
      lenis.on('scroll', ScrollTrigger.update);
      const raf = (t: number) => lenis.raf(t * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
      const anchors = [...document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')];
      const onAnchor = (e: MouseEvent) => {
        const href = (e.currentTarget as HTMLAnchorElement).getAttribute('href')!;
        const t = document.querySelector(href);
        if (t) { e.preventDefault(); lenis.scrollTo(t as HTMLElement, { offset: -40, duration: 1.4 }); }
      };
      anchors.forEach((a) => a.addEventListener('click', onAnchor));

      // CRT power-on: a bright flash rolls vertically, the screen goes black, then the picture
      // warms up through static, slipping vertically a few times before it locks
      let bootDelay = 0;
      const boot = document.querySelector<HTMLElement>('.crt-boot');
      const mainEl = document.querySelector<HTMLElement>('main');
      if (boot && mainEl && getComputedStyle(boot).display !== 'none') {
        boot.style.animation = 'none';
        const flash = boot.querySelector<HTMLElement>('.crt-flash');
        const noise = boot.querySelector<HTMLCanvasElement>('.crt-noise');
        const nctx = noise?.getContext('2d');
        const heavy = matchMedia('(min-width: 900px)').matches; // brightness/contrast filters only on desktop
        let img: ImageData | null = nctx && noise ? nctx.createImageData(noise.width, noise.height) : null;
        const drawNoise = () => {
          if (!nctx || !img) return;
          const d = img.data;
          for (let i = 0; i < d.length; i += 4) { const v = Math.random() * 255; d[i] = v * 0.85; d[i + 1] = v; d[i + 2] = v; d[i + 3] = 255; }
          nctx.putImageData(img, 0, 0);
        };
        gsap.ticker.add(drawNoise);
        const done = () => {
          gsap.ticker.remove(drawNoise);
          img = null;
          boot.remove();
          gsap.set(mainEl, { clearProps: 'transform,filter,opacity,transformOrigin' });
        };
        const vh = innerHeight / 100;
        const tl = gsap.timeline({ onComplete: done });
        tl.set(mainEl, heavy ? { filter: 'contrast(0) brightness(0)' } : { opacity: 0 })
          // 1. bright flash rolling up and down
          .fromTo(flash, { opacity: 0, scaleX: 1, scaleY: 0.8, y: 0 }, { opacity: 1, y: 38 * vh, duration: 0.12, ease: 'power1.in' }, 0.15)
          .set(flash, { y: -38 * vh })
          .to(flash, { y: 30 * vh, scaleX: 1.3, scaleY: 0.6, duration: 0.16, ease: 'none' })
          .to(flash, { opacity: 0, duration: 0.1 })
          // 2. black, then static comes up
          .to(noise, { opacity: 0.55, duration: 0.12 }, '-=0.04')
          .set(boot, { backgroundColor: 'transparent' })
          // 3. the picture warms up through the static
          .to(mainEl, heavy ? { filter: 'contrast(1) brightness(1)', duration: 1.5, ease: 'power2.inOut' } : { opacity: 1, duration: 1.2, ease: 'power2.inOut' }, '<')
          .to(noise, { opacity: 0, duration: 1.4, ease: 'power2.in' }, '<0.1')
          // 4. vertical hold slips a few times before locking
          .to(mainEl, { y: -18, duration: 0.05, ease: 'steps(1)' }, '<0.15')
          .to(mainEl, { y: 11, duration: 0.05, ease: 'steps(1)' }, '+=0.12')
          .to(mainEl, { y: -5, duration: 0.05, ease: 'steps(1)' }, '+=0.16')
          .to(mainEl, { y: 0, duration: 0.05, ease: 'steps(1)' }, '+=0.12');
        bootDelay = 1.1;
      }

      // reading progress
      gsap.to('.progress i', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

      // nav hides on the way down, returns on the way up
      const nav = document.querySelector<HTMLElement>('nav.top');
      if (nav) {
        const hideNav = gsap.to(nav, { yPercent: -110, duration: 0.35, ease: 'power2.out', paused: true });
        ScrollTrigger.create({ start: 120, end: 'max', onUpdate: (s) => { if (s.direction === 1) hideNav.play(); else hideNav.reverse(); }, onLeaveBack: () => hideNav.reverse() });
      }

      // nav indicator slides under the section in view
      const ind = document.querySelector<HTMLElement>('.nav-ind');
      if (ind) {
        const moveTo = (id: string | null) => {
          const link = id ? document.querySelector<HTMLElement>(`[data-nav="${id}"]`) : null;
          if (!link) { gsap.to(ind, { opacity: 0, duration: 0.3 }); return; }
          gsap.to(ind, { x: link.offsetLeft, width: link.offsetWidth, opacity: 1, duration: 0.5, ease: 'power3.out' });
        };
        ['platform', 'patterns', 'capabilities', 'experience', 'projects'].forEach((id) => {
          const el = document.getElementById(id);
          if (el) ScrollTrigger.create({ trigger: el, start: 'top 50%', end: 'bottom 50%', refreshPriority: -1, onToggle: (s) => { if (s.isActive) moveTo(id); } });
        });
        ScrollTrigger.create({ trigger: '.hero', start: 'top top', end: 'bottom 50%', onEnterBack: () => moveTo(null) });
      }

      // stage frames: corners settle in, the drawing opens from the centre
      gsap.utils.toArray<HTMLElement>('.bgstage').forEach((st) => {
        gsap.fromTo(st, { clipPath: 'inset(12% 12% 12% 12%)', opacity: 0.2 }, { clipPath: 'inset(-12px -12px -40px -12px)', opacity: 1, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: st, start: 'top 85%', once: true } });
      });

      // paragraphs and list items rise line by line
      const splits: SplitText[] = [];
      const lineReveal = (targets: string, start = 'top 85%') => gsap.utils.toArray<HTMLElement>(targets).forEach((el) => {
        if (!el.textContent?.trim()) return;
        const sp = SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'split-line' });
        splits.push(sp);
        if (!sp.lines.length) return;
        gsap.fromTo(sp.lines, { yPercent: 105 }, { yPercent: 0, duration: 0.9, ease: 'power4.out', stagger: 0.06, scrollTrigger: { trigger: el, start, once: true } });
      });
      lineReveal('.hero .lead > p', 'top 95%');
      lineReveal('.platform .intro p:not(.stage-hint), .projects .ptext > p, .rolecard p, .oss p');

      // stats count up from zero
      gsap.utils.toArray<HTMLElement>('.stat b').forEach((b) => {
        const end = Number(b.textContent) || 0;
        gsap.fromTo(b, { textContent: 0 }, { textContent: end, duration: 1.6, ease: 'power2.out', snap: { textContent: 1 }, delay: 0.9 + bootDelay });
      });

      // contact headline: characters roll in like a wave
      const headline = document.querySelector<HTMLElement>('.contact .big');
      if (headline) {
        const sp = SplitText.create(headline, { type: 'words,chars' });
        splits.push(sp);
        gsap.fromTo(sp.chars, { yPercent: 110, rotate: 8, opacity: 0 }, { yPercent: 0, rotate: 0, opacity: 1, duration: 0.9, ease: 'back.out(1.6)', stagger: { each: 0.025, from: 'start' }, scrollTrigger: { trigger: headline, start: 'top 85%', once: true } });
      }

      // diagrams drift a little against the scroll
      gsap.utils.toArray<HTMLElement>('.pdiag').forEach((fig) => gsap.fromTo(fig, { y: 40 }, { y: -40, ease: 'none', scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true } }));

      // magnetic buttons on devices with a fine pointer
      const offMagnet: (() => void)[] = [];
      if (matchMedia('(pointer: fine)').matches) {
        document.querySelectorAll<HTMLElement>('.btn').forEach((b) => {
          const xTo = gsap.quickTo(b, 'x', { duration: 0.5, ease: 'power3' }), yTo = gsap.quickTo(b, 'y', { duration: 0.5, ease: 'power3' });
          const move = (e: PointerEvent) => { const r = b.getBoundingClientRect(); xTo((e.clientX - r.left - r.width / 2) * 0.25); yTo((e.clientY - r.top - r.height / 2) * 0.35); };
          const leave = () => { xTo(0); yTo(0); };
          b.addEventListener('pointermove', move); b.addEventListener('pointerleave', leave);
          offMagnet.push(() => { b.removeEventListener('pointermove', move); b.removeEventListener('pointerleave', leave); });
        });
      }

      // hero
      const intro = gsap.timeline({ delay: bootDelay });
      document.querySelectorAll<HTMLElement>('.hero .scr').forEach((s, i) =>
        intro.fromTo(s, { textContent: '' }, { duration: 1.6, scrambleText: { text: original(s), chars: CHARS, revealDelay: 0.3, speed: 0.6 }, ease: 'none' }, i * 0.25));
      intro.fromTo('.hero .eyebrow, .hero .lead', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1, stagger: 0.15, ease: 'power3.out' }, 0.4);
      const roleEl = document.getElementById('role');
      if (roleEl) {
        const roles: string[] = JSON.parse(roleEl.dataset.roles ?? '[]');
        const roleTl = gsap.timeline({ repeat: -1, delay: 2 });
        roles.forEach((_, i) => roleTl.to(roleEl, { duration: 1.2, scrambleText: { text: roles[(i + 1) % roles.length], chars: CHARS, speed: 0.8 } }, '+=2.4'));
      }
      gsap.utils.toArray<HTMLElement>('h2.title, .scr-on-view').forEach((h) =>
        gsap.fromTo(h, { textContent: '' }, { duration: 1.4, scrambleText: { text: original(h), chars: CHARS, revealDelay: 0.2, speed: 0.5 }, ease: 'none', scrollTrigger: { trigger: h, start: 'top 85%', once: true } }));

      // platform: packets along the wires
      let archFlow: ReturnType<typeof setInterval> | undefined, archCi: ReturnType<typeof setInterval> | undefined;
      const arch = document.getElementById('arch');
      if (arch) {
        const layer = arch.querySelector('.pkts')!;
        const inWire = arch.querySelector<SVGPathElement>('[data-in]')!;
        const req = [...arch.querySelectorAll<SVGPathElement>('[data-req]')];
        const ci = [...arch.querySelectorAll<SVGPathElement>('[data-ci]')];
        const prods = [...arch.querySelectorAll('[data-prod]')];
        const hub = arch.querySelector('[data-hub]');
        const flow = () => { const i = Math.floor(Math.random() * req.length); sendPacket(layer, inWire, 'pkt', 0.7, () => sendPacket(layer, req[i], 'pkt', 0.9, () => flash(prods[i]))); };
        const ciFlow = () => sendPacket(layer, ci[0], 'pkt ci', 0.6, () => sendPacket(layer, ci[1], 'pkt ci', 0.6, () => sendPacket(layer, ci[2], 'pkt ci', 1.1, () => flash(hub))));
        ScrollTrigger.create({ trigger: arch, start: 'top bottom', end: 'bottom top', onToggle: (s) => {
          clearInterval(archFlow); clearInterval(archCi);
          if (s.isActive) { archFlow = setInterval(flow, 260); archCi = setInterval(ciFlow, 3200); ciFlow(); }
        } });
        gsap.fromTo(prods, { opacity: 0, x: '+=30' }, { opacity: 1, x: '-=30', stagger: 0.05, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: arch, start: 'top 70%' } });
      }
      gsap.fromTo('.infra article', { '--fill': '0%' }, { '--fill': '100%', duration: 1.2, ease: 'power2.inOut', stagger: 0.15, scrollTrigger: { trigger: '.infra', start: 'top 85%' } });

      // git log
      if (gpaths.length) {
        gsap.fromTo(gpaths, { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: gitlog, start: 'top 70%', end: 'bottom 70%', scrub: 0.5 } });
      }
      gsap.utils.toArray<HTMLElement>('.c').forEach((c) => {
        gsap.fromTo(c.querySelectorAll('.hash, .refs, .msg, .rolecard'), { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.7, ease: 'power3.out', stagger: 0.06, scrollTrigger: { trigger: c, start: 'top 72%' } });
        gsap.fromTo(c.querySelector('.dot'), { scale: 0 }, { scale: 1, duration: 0.5, ease: 'back.out(3)', scrollTrigger: { trigger: c, start: 'top 72%' } });
      });

      // capability cards
      gsap.utils.toArray<HTMLElement>('.capgrid article').forEach((a) =>
        gsap.fromTo(a, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: a, start: 'top 85%' } }));

      // project drawings: nodes pop, edges draw, then packets flow while in view
      const diagIntervals: ReturnType<typeof setInterval>[] = [];
      gsap.utils.toArray<HTMLElement>('.pdiag').forEach((fig) => {
        const svg = fig.querySelector('svg')!, layer = svg.querySelector('.pkts')!;
        const nodes = [...svg.querySelectorAll('.n')];
        const edges = [...svg.querySelectorAll<SVGPathElement>('.e')];
        const solid = edges.filter((e) => !e.classList.contains('d')), dashed = edges.filter((e) => e.classList.contains('d'));
        gsap.set(solid, { strokeDasharray: 1, strokeDashoffset: 1 });
        const tl = gsap.timeline({ scrollTrigger: { trigger: fig, start: 'top 75%' } });
        tl.fromTo(nodes, { opacity: 0, scale: 0.85, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 0.5, stagger: 0.06, ease: 'back.out(2)' })
          .to(solid, { strokeDashoffset: 0, duration: 0.6, stagger: 0.06, ease: 'power2.inOut' }, '-=0.2');
        if (dashed.length) tl.fromTo(dashed, { opacity: 0 }, { opacity: 1, duration: 0.4 }, '<');
        const text = fig.closest('.proj')?.querySelectorAll('.ptext > *');
        if (text?.length) tl.fromTo(text, { opacity: 0, y: 20 }, { opacity: 1, y: 0, stagger: 0.07, duration: 0.6, ease: 'power3.out' }, 0);
        let iv: ReturnType<typeof setInterval> | undefined;
        ScrollTrigger.create({ trigger: fig, start: 'top bottom', end: 'bottom top', onToggle: (s) => {
          clearInterval(iv);
          if (s.isActive) {
            iv = setInterval(() => {
              const e = edges[Math.floor(Math.random() * edges.length)];
              sendPacket(layer, e, 'p', 0.8, () => flash(svg.querySelector(`[data-id="${e.dataset.to}"]`)));
            }, 380);
            diagIntervals.push(iv);
          }
        } });
      });

      return () => {
        splits.forEach((sp) => sp.revert());
        offMagnet.forEach((f) => f());
        lenis.destroy();
        gsap.ticker.remove(raf);
        anchors.forEach((a) => a.removeEventListener('click', onAnchor));
        diagIntervals.forEach(clearInterval);
        clearInterval(archFlow); clearInterval(archCi);
      };
    });

    // wide screens: pinned pattern stepper
    mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
      const list = document.querySelector('.plist');
      const items = gsap.utils.toArray<HTMLElement>('.plist article');
      const rings = document.querySelectorAll<SVGElement>('.onion [data-ring]');
      if (!list || !items.length) return;
      list.classList.add('stepping');
      const light = (art: HTMLElement) => { const on = (art.dataset.rings ?? '').split(' '); rings.forEach((r) => r.classList.toggle('on', on.includes(r.dataset.ring ?? ''))); };
      gsap.set(items, { autoAlpha: 0, y: 40 });
      gsap.set(items[0], { autoAlpha: 1, y: 0 });
      light(items[0]);
      const tl = gsap.timeline({ scrollTrigger: { trigger: '.patterns', start: 'top top', end: () => '+=' + innerHeight * (items.length - 0.5), pin: true, scrub: 0.6,
        onUpdate: (s) => light(items[Math.min(items.length - 1, Math.floor(s.progress * items.length))]) } });
      items.forEach((it, i) => { if (i) tl.to(items[i - 1], { autoAlpha: 0, y: -40, duration: 0.5 }).to(it, { autoAlpha: 1, y: 0, duration: 0.5 }, '<0.2').to({}, { duration: 0.5 }); });
      tl.to('.pbar i', { scaleX: 1, ease: 'none', duration: tl.duration() }, 0);
      gsap.to('.onion', { rotate: 30, ease: 'none', scrollTrigger: { trigger: '.patterns', start: 'top top', end: () => '+=' + innerHeight * items.length, scrub: true } });
      return () => { list.classList.remove('stepping'); gsap.set(items, { clearProps: 'all' }); rings.forEach((r) => r.classList.remove('on')); };
    });

    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => {
      ScrollTrigger.removeEventListener('refreshInit', rebuild);
      ScrollTrigger.removeEventListener('refresh', pickBg);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      timers.forEach((t) => clearTimeout(t));
    };
  });

  return null;
}
