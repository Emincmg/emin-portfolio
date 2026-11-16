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

// next/font gives the face a generated family name; read it from the CSS variable so canvas text uses Roboto Mono too
const monoFamily = () => {
  const v = typeof document === 'undefined' ? '' : getComputedStyle(document.documentElement).getPropertyValue('--font-mono').trim();
  return `${v ? v + ', ' : ''}ui-monospace, Menlo, monospace`;
};
let MONO = 'ui-monospace, Menlo, monospace';
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
  private raf = 0;
  private lastT = 0;
  private swapTimer: ReturnType<typeof setTimeout> | undefined;
  private pending: string | null = null;
  private cleanup: (() => void)[] = [];
  private resizeObserver: ResizeObserver;
  private dpr = Math.min(globalThis.devicePixelRatio || 1, 2);

  /**
   * The canvas lives inside the active stage and moves to the next stage when the section changes,
   * so it scrolls natively with the page (no per-frame repositioning, no flicker on mobile Safari).
   */
  constructor(private canvas: HTMLCanvasElement, factories: Record<string, ModeFactory>) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas unavailable');
    canvas.className = 'stage-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    MONO = monoFamily();
    this.E = {
      ctx, W: 0, H: 0, mouse: { x: -9999, y: -9999, last: 0 }, reduced,
      C: { accent: [0, 229, 255], warm: [255, 43, 214], bad: [255, 59, 92], fg: [236, 233, 255], muted: [123, 118, 153] },
      rgba: (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`,
      lerp: (a, b, t) => a + (b - a) * t,
      text(str, x, y, color, size = 11, align = 'left') { ctx.font = `${size}px ${MONO}`; ctx.textAlign = align; ctx.fillStyle = color; ctx.fillText(str, x, y); },
      dot(x, y, r, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); },
    };
    for (const [name, f] of Object.entries(factories)) this.modes[name] = f(this.E);
    this.writeHints();

    // size follows the stage, not the window: mobile address-bar resizes no longer clear the canvas
    this.resizeObserver = new ResizeObserver(() => this.sizeCanvas());

    const on = <K extends keyof WindowEventMap>(type: K, fn: (e: WindowEventMap[K]) => void, opts?: AddEventListenerOptions) => {
      window.addEventListener(type, fn, opts);
      this.cleanup.push(() => window.removeEventListener(type, fn));
    };
    on('pointermove', (e) => { this.raw.x = e.clientX; this.raw.y = e.clientY; this.raw.last = performance.now(); }, { passive: true });
    on('pointerdown', (e) => this.onPointerDown(e));

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
    this.resizeObserver.disconnect();
    this.cleanup.forEach((f) => f());
    this.canvas.remove();
  }

  /** Called as sections scroll into view; switches mode only while in auto. */
  section(mode: string, stage: HTMLElement | null) {
    if (stage && stage !== this.stage) this.attach(stage);
    this.sectionMode = mode;
    if (this.auto) this.set(mode, true);
  }

  set(name: string, fromAuto = false): boolean {
    const mode = this.modes[name];
    if (!mode) return false;
    if (!fromAuto) this.auto = false;
    if (name === this.pending) return true; // already on its way in
    clearTimeout(this.swapTimer);
    this.pending = null;
    if (name === this.mode) { this.canvas.style.opacity = '1'; return true; }
    this.pending = name;
    const apply = () => {
      this.pending = null;
      this.mode = name;
      this.current = mode;
      mode.init();
      this.canvas.style.opacity = '1';
      if (this.E.reduced) this.renderOnce();
    };
    if (!this.current || this.E.reduced) apply();
    else { this.canvas.style.opacity = '0'; this.swapTimer = setTimeout(apply, 250); }
    return true;
  }

  private attach(stage: HTMLElement) {
    if (this.stage) this.resizeObserver.unobserve(this.stage);
    this.stage = stage;
    stage.appendChild(this.canvas);
    this.resizeObserver.observe(stage);
    this.sizeCanvas();
  }

  /** Each stage's caption names its own drawing, so it reads right even before it is active. */
  private writeHints() {
    document.querySelectorAll<HTMLElement>('.bgstage').forEach((st) => {
      const m = this.modes[st.dataset.bg ?? ''];
      const hint = st.querySelector('.stage-hint');
      if (m && hint) hint.textContent = `● ${m.label.toLowerCase()} — ${m.hint}`;
    });
  }

  private sizeCanvas() {
    if (!this.stage) return;
    const w = this.stage.clientWidth, h = this.stage.clientHeight;
    if (!w || !h) return;
    const pw = Math.round(w * this.dpr), ph = Math.round(h * this.dpr);
    if (this.canvas.width !== pw || this.canvas.height !== ph) { this.canvas.width = pw; this.canvas.height = ph; }
    if (w !== this.E.W || h !== this.E.H) {
      this.E.W = w; this.E.H = h;
      if (this.current) { if (this.current.resize) this.current.resize(); else this.current.init(); }
    }
    this.draw(0, performance.now());
  }

  private visibleRect(): DOMRect | null {
    if (!this.stage) return null;
    const r = this.stage.getBoundingClientRect();
    return r.bottom < 0 || r.top > innerHeight ? null : r;
  }

  private onPointerDown(e: PointerEvent) {
    const target = e.target as Element | null;
    if (target?.closest?.(UI_SELECTOR) || !this.current?.click) return;
    const r = this.visibleRect();
    if (!r) return;
    const x = e.clientX - r.left, y = e.clientY - r.top;
    if (x < -20 || y < -20 || x > r.width + 20 || y > r.height + 20) return;
    this.current.click(x, y);
    if (this.E.reduced) this.draw(0.05, performance.now());
  }

  private draw(dt: number, now: number) {
    const mode = this.current;
    const r = this.visibleRect();
    if (!mode || !r || !this.E.W) return; // off screen: keep the last frame, spend nothing
    const { ctx } = this.E;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.E.W, this.E.H);
    this.E.mouse.x = this.raw.x - r.left; this.E.mouse.y = this.raw.y - r.top; this.E.mouse.last = this.raw.last;
    try { mode.frame(dt, now); } catch (err) { console.error('[bg]', this.mode, err); }
  }

  private renderOnce() {
    for (let i = 0; i < 40; i++) this.draw(0.05, performance.now());
  }
}

let instance: BackgroundController | null = null;
export const setBackground = (c: BackgroundController | null) => { instance = c; };
export const getBackground = () => instance;
