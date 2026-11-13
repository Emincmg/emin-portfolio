'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { useGSAP } from '@gsap/react';
import Lenis from 'lenis';
import { getBackground } from '@/lib/bg/engine';

gsap.registerPlugin(useGSAP, ScrollTrigger, ScrambleTextPlugin, MotionPathPlugin);

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
  const cursor = useRef<HTMLDivElement>(null);

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

      // cursor
      const cur = cursor.current;
      let offCursor = () => {};
      if (cur && matchMedia('(pointer: fine)').matches) {
        const cx = gsap.quickTo(cur, 'x', { duration: 0.25, ease: 'power3' }), cy = gsap.quickTo(cur, 'y', { duration: 0.25, ease: 'power3' });
        const move = (e: PointerEvent) => { cur.style.opacity = '1'; cx(e.clientX); cy(e.clientY); };
        const over = (e: PointerEvent) => cur.classList.toggle('big', !!(e.target as Element).closest?.('a, button'));
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerover', over);
        offCursor = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerover', over); };
      }

      // hero
      const intro = gsap.timeline();
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
        lenis.destroy();
        gsap.ticker.remove(raf);
        anchors.forEach((a) => a.removeEventListener('click', onAnchor));
        offCursor();
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

  return <div className="cursor" ref={cursor} aria-hidden="true" />;
}
