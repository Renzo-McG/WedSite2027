/**
 * The guest companion's motion grammar in script form, for the sequences CSS
 * cannot express on its own (a plane riding a curve, a map camera, a count).
 * The curves are the same tokens as app.css, solved exactly, so scripted and
 * CSS motion share one feel.
 */

export const reduceMotion = (): boolean =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
  document.documentElement.hasAttribute("data-reduced-motion");

/** A CSS cubic-bezier() as a function of time (0–1) to progress (0–1). */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sy = (t: number) => ((ay * t + by) * t + cy) * t;
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x: number): number => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const err = sx(t) - x;
      const d = dx(t);
      if (Math.abs(err) < 1e-5) break;
      if (Math.abs(d) < 1e-6) break;
      t -= err / d;
    }
    if (t < 0 || t > 1 || Math.abs(sx(t) - x) > 1e-3) {
      // Bisection fallback for the steep curves.
      let lo = 0;
      let hi = 1;
      t = x;
      for (let i = 0; i < 24; i++) {
        if (sx(t) < x) lo = t;
        else hi = t;
        t = (lo + hi) / 2;
      }
    }
    return sy(t);
  };
}

export const ease = {
  out: cubicBezier(0.23, 1, 0.32, 1),
  inOut: cubicBezier(0.77, 0, 0.175, 1),
  drawer: cubicBezier(0.32, 0.72, 0, 1),
  /** A gentle in-out for long explanatory travel (easings.net easeInOutSine). */
  travel: cubicBezier(0.37, 0, 0.63, 1),
};

export interface Tween {
  cancel(): void;
  finished: Promise<boolean>;
}

/**
 * Runs `frame(progress)` over `duration` ms. Resolves true when it completes,
 * false if cancelled. With reduced motion it jumps straight to the end.
 */
export function tween(
  duration: number,
  frame: (p: number) => void,
  curve: (x: number) => number = ease.out,
  delay = 0,
): Tween {
  let raf = 0;
  let timer = 0;
  let done: (v: boolean) => void = () => {};
  const finished = new Promise<boolean>((resolve) => (done = resolve));
  if (reduceMotion() || duration <= 0) {
    frame(1);
    done(true);
    return { cancel() {}, finished };
  }
  const start = () => {
    const t0 = performance.now();
    const step = (now: number) => {
      const x = Math.min(1, (now - t0) / duration);
      frame(curve(x));
      if (x < 1) raf = requestAnimationFrame(step);
      else done(true);
    };
    raf = requestAnimationFrame(step);
  };
  if (delay > 0) timer = window.setTimeout(start, delay);
  else start();
  return {
    cancel() {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      done(false);
    },
    finished,
  };
}

/** Fires once when an element is well into view (or immediately if unsupported). */
export function whenSeen(el: Element, run: () => void, threshold = 0.35): void {
  if (!("IntersectionObserver" in window)) {
    run();
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        run();
      }
    },
    { threshold },
  );
  io.observe(el);
}

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
