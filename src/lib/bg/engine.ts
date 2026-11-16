// Background engine: one fixed canvas, one active mode at a time, drawn only inside the
// active section's stage element, so it never sits behind text and scrolls with the page.

export type RGB = readonly [number, number, number];

export interface Engine {
  ctx: CanvasRenderingContext2D;
  /** Size of the active stage, in CSS pixels. Modes draw in stage-local coordinates. */
  W: number;
  H: number;
  /** Pointer position relative to the stage, plus the time it last moved. */
  mouse: { x: number; y: number; last: number };
  reduced: boolean;
  C: { accent: RGB; warm: RGB; bad: RGB; fg: RGB; muted: RGB };
  rgba(c: RGB, a: number): string;
  lerp(a: number, b: number, t: number): number;
  text(str: string, x: number, y: number, color: string, size?: number, align?: CanvasTextAlign): void;
  dot(x: number, y: number, r: number, color: string): void;
}

export interface Mode {
  label: string;
  hint: string;
  init(): void;
  frame(dt: number, now: number): void;
  click?(x: number, y: number): void;
  resize?(): void;
}

export type ModeFactory = (E: Engine) => Mode;

type Listener = (state: { mode: string; auto: boolean }) => void;

const MONO = '"JetBrains Mono", ui-monospace, Menlo, monospace';
const UI_SELECTOR = 'a, button, input, textarea, select, label, .term, .diagram, .pdiag, .rolecard';

export class BackgroundController {
  readonly modes: Record<string, Mode> = {};
  auto = true;
  mode: string | null = null;
  private sectionMode: string | null = null;
  private stage: HTMLElement | null = null;
  private current: Mode | null = null;
  private E: Engine;
  private raw = { x: -9999, y: -9999, last: 0 };
  private listeners = new Set<Listener>();
  private raf = 0;
  private lastT = 0;
  private swapTimer: ReturnType<typeof setTimeout> | undefined;
  private pending: string | null = null;
  private cleanup: (() => void)[] = [];

  constructor(private canvas: HTMLCanvasElement, factories: Record<string, ModeFactory>) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas unavailable');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.E = {
      ctx, W: 0, H: 0, mouse: { x: -9999, y: -9999, last: 0 }, reduced,
      C: { accent: [140, 196, 214], warm: [224, 183, 122], bad: [224, 122, 106], fg: [233, 230, 223], muted: [141, 151, 163] },
      rgba: (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`,
      lerp: (a, b, t) => a + (b - a) * t,
      text(str, x, y, color, size = 11, align = 'left') { ctx.font = `${size}px ${MONO}`; ctx.textAlign = align; ctx.fillStyle = color; ctx.fillText(str, x, y); },
      dot(x, y, r, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); },
    };
    for (const [name, f] of Object.entries(factories)) this.modes[name] = f(this.E);

    const on = <K extends keyof WindowEventMap>(type: K, fn: (e: WindowEventMap[K]) => void, opts?: AddEventListenerOptions) => {
      window.addEventListener(type, fn, opts);
      this.cleanup.push(() => window.removeEventListener(type, fn));
    };
    on('pointermove', (e) => { this.raw.x = e.clientX; this.raw.y = e.clientY; this.raw.last = performance.now(); }, { passive: true });
    on('pointerdown', (e) => this.onPointerDown(e));
    on('resize', () => this.sizeCanvas());
    if (reduced) on('scroll', () => this.draw(0, performance.now()), { passive: true });

    this.sizeCanvas();
    if (!reduced) {
      this.lastT = performance.now();
      const loop = (now: number) => {
        this.raf = requestAnimationFrame(loop);
        const dt = Math.min(0.05, (now - this.lastT) / 1000);
        this.lastT = now;
        if (!document.hidden) this.draw(dt, now);
      };
      this.raf = requestAnimationFrame(loop);
    }
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    clearTimeout(this.swapTimer);
    this.cleanup.forEach((f) => f());
    this.listeners.clear();
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    fn({ mode: this.mode ?? '', auto: this.auto });
    return () => { this.listeners.delete(fn); };
  }

  /** Called as sections scroll into view; switches mode only while in auto. */
  section(mode: string, stage: HTMLElement | null) {
    if (stage && stage !== this.stage) { this.stage = stage; if (this.E.reduced) this.renderOnce(); }
    this.sectionMode = mode;
    if (this.auto) this.set(mode, true);
  }

  setAuto(on: boolean) {
    this.auto = on;
    this.emit();
    if (on && this.sectionMode) this.set(this.sectionMode, true);
  }

  set(name: string, fromAuto = false): boolean {
    const mode = this.modes[name];
    if (!mode) return false;
    if (!fromAuto) this.auto = false;
    if (name === this.pending) return true; // already on its way in
    clearTimeout(this.swapTimer);
    this.pending = null;
    if (name === this.mode) { this.canvas.style.opacity = '1'; this.emit(); return true; }
    this.pending = name;
    const apply = () => {
      this.pending = null;
      this.mode = name;
      this.current = mode;
      const r = this.stage?.getBoundingClientRect();
      if (r) { this.E.W = Math.round(r.width); this.E.H = Math.round(r.height); }
      mode.init();
      this.canvas.style.opacity = '1';
      this.emit();
      if (this.E.reduced) this.renderOnce();
    };
    if (!this.current || this.E.reduced) apply();
    else { this.canvas.style.opacity = '0'; this.swapTimer = setTimeout(apply, 300); }
    return true;
  }

  private emit() { this.listeners.forEach((f) => f({ mode: this.mode ?? '', auto: this.auto })); }

  private box(): DOMRect | null {
    if (!this.stage) return null;
    const r = this.stage.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight || r.width < 40 || r.height < 40) return null;
    return r;
  }

  private sizeCanvas() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = innerWidth * dpr;
    this.canvas.height = innerHeight * dpr;
    this.draw(0, performance.now());
  }

  private onPointerDown(e: PointerEvent) {
    const target = e.target as Element | null;
    if (target?.closest?.(UI_SELECTOR) || !this.current?.click) return;
    const r = this.box();
    if (!r) return;
    const x = e.clientX - r.left, y = e.clientY - r.top;
    if (x < -20 || y < -20 || x > r.width + 20 || y > r.height + 20) return;
    this.current.click(x, y);
    if (this.E.reduced) this.draw(0.05, performance.now());
  }

  private draw(dt: number, now: number) {
    const { ctx } = this.E;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    const r = this.box();
    const mode = this.current;
    if (!r || !mode) return;
    const w = Math.round(r.width), h = Math.round(r.height);
    if (w !== this.E.W || h !== this.E.H) { this.E.W = w; this.E.H = h; if (mode.resize) mode.resize(); else mode.init(); }
    this.E.mouse.x = this.raw.x - r.left; this.E.mouse.y = this.raw.y - r.top; this.E.mouse.last = this.raw.last;
    ctx.save();
    ctx.translate(r.left, r.top);
    ctx.beginPath(); ctx.rect(0, 0, r.width, r.height); ctx.clip();
    try { mode.frame(dt, now); } catch (err) { console.error('[bg]', this.mode, err); }
    ctx.restore();
    // hint under the stage, wrapped to the stage width
    ctx.font = `11px ${MONO}`; ctx.textAlign = 'left'; ctx.fillStyle = this.E.rgba(this.E.C.muted, 0.85);
    const words = `● ${mode.label.toLowerCase()} — ${mode.hint}`.split(' ');
    let line = '', y = r.bottom + 18;
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > r.width && line) { ctx.fillText(line, r.left, y); line = w; y += 15; } else line = test;
    }
    ctx.fillText(line, r.left, y);
  }

  private renderOnce() {
    for (let i = 0; i < 40; i++) this.draw(0.05, performance.now());
  }
}

let instance: BackgroundController | null = null;
export const setBackground = (c: BackgroundController | null) => { instance = c; };
export const getBackground = () => instance;
