/**
 * The London → Cebu journey (components/travel/FlightPlanner.astro).
 *
 * One clock drives both views. Progress p (0–1) is time since leaving London
 * as a share of the chosen route's whole journey:
 * - timeline: the lit copy of the route is revealed up to p, and a plane
 *   rides its leading edge; each duration resolves as the plane passes it;
 * - map: the plane flies the first arc, waits at the hub for the change (the
 *   timeline keeps running), then flies the second arc; the lit arcs draw
 *   behind it.
 * Choosing another route lets the previous one recede (CSS) and flies the new
 * one from London. Plays when the stage first comes into view.
 */
import { ease, reduceMotion, tween, whenSeen, type Tween } from "./motion";

const stage = document.querySelector<HTMLElement>("[data-journey]");
const planner = document.querySelector<HTMLElement>("[data-planner]");

if (stage && planner) {
  const map = stage.querySelector<HTMLElement>(".jmap")!;
  const svg = map.querySelector<SVGSVGElement>("svg")!;
  const mapPlane = map.querySelector<HTMLElement>("[data-map-plane]")!;
  const readout = stage.querySelector<HTMLElement>("[data-readout]");
  const readouts = stage.querySelector<HTMLTemplateElement>("[data-readouts]");
  const inputs = [...stage.querySelectorAll<HTMLInputElement>(".jlane__input")];
  let flight: Tween | null = null;
  let seen = false;

  const lane = (id: string) => stage.querySelector<HTMLElement>(`[data-lane="${id}"]`)!;

  /** Reset a lane to "not flown yet". */
  const clearLane = (el: HTMLElement) => {
    el.querySelector<HTMLElement>("[data-lit]")!.style.clipPath = "inset(0 100% 0 0)";
    el.querySelector<HTMLElement>("[data-lane-plane]")!.style.transform = "translateX(0)";
    el.querySelectorAll<HTMLElement>("[data-at]").forEach((d) => d.removeAttribute("data-on"));
    el.removeAttribute("data-landed");
  };

  /** The chosen route comes forward everywhere: its lane, arcs and hub. */
  const mark = (id: string) => {
    stage.dataset.route = id;
    stage
      .querySelectorAll<HTMLElement | SVGElement>(
        "[data-lane], [data-map-route], [data-city-route]",
      )
      .forEach((el) => {
        const key = el.dataset.lane ?? el.dataset.mapRoute ?? el.dataset.cityRoute;
        el.toggleAttribute("data-active", key === id);
      });
  };

  const arcs = (id: string) =>
    [0, 1].map((i) => svg.querySelector<SVGPathElement>(`[data-arc="${id}-${i}"]`)!);

  /** Fly a route. `ms` is shortened for the guided preview's quick passes. */
  const fly = (id: string, ms = 3600): Tween => {
    flight?.cancel();
    const el = lane(id);
    const legs = el.dataset.legs!.split(",").map(Number) as [number, number, number];
    const total = Number(el.dataset.total);
    const rail = el.querySelector<HTMLElement>("[data-rail]")!;
    const lit = el.querySelector<HTMLElement>("[data-lit]")!;
    const plane = el.querySelector<HTMLElement>("[data-lane-plane]")!;
    const durations = [...el.querySelectorAll<HTMLElement>("[data-at]")];
    const totalLabel = el.querySelector<HTMLElement>("[data-lane-total]");
    const finalTotal = totalLabel?.textContent ?? "";
    const [arcA, arcB] = arcs(id) as [SVGPathElement, SVGPathElement];
    const lenA = arcA.getTotalLength();
    const lenB = arcB.getTotalLength();
    const vb = svg.viewBox.baseVal;

    mark(id);
    inputs.forEach((input) => {
      if (input.value !== id) window.setTimeout(() => clearLane(lane(input.value)), 420);
    });
    svg.querySelectorAll<SVGPathElement>("[data-arc]").forEach((path) => {
      if (!path.dataset.arc!.startsWith(`${id}-`)) path.style.strokeDashoffset = "1";
    });
    if (readout && readouts) {
      const text = readouts.content.querySelector<HTMLElement>(`[data-for="${id}"]`)?.textContent;
      if (text) readout.textContent = text;
    }
    el.removeAttribute("data-landed");
    stage.removeAttribute("data-landed");

    const place = (path: SVGPathElement, length: number, f: number) => {
      const at = path.getPointAtLength(length * f);
      const ahead = path.getPointAtLength(Math.min(length, length * f + 1));
      const behind = path.getPointAtLength(Math.max(0, length * f - 1));
      const angle = (Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180) / Math.PI;
      const w = map.clientWidth;
      const h = map.clientHeight;
      const x = ((at.x - vb.x) / vb.width) * w;
      const y = ((at.y - vb.y) / vb.height) * h;
      mapPlane.style.transform = `translate(${x}px, ${y}px) rotate(${angle + 90}deg)`;
    };

    const frame = (p: number) => {
      const m = p * total;
      const width = rail.clientWidth;
      lit.style.clipPath = `inset(0 ${(100 - p * 100).toFixed(2)}% 0 0)`;
      plane.style.transform = `translateX(${(p * width).toFixed(1)}px)`;
      durations.forEach((d) => d.toggleAttribute("data-on", m >= Number(d.dataset.at)));
      if (totalLabel && p < 1) {
        const mins = Math.round(m);
        totalLabel.textContent = `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, "0")}`;
      }

      // The map: first flight, the wait, the second flight.
      const fA = Math.min(1, m / legs[0]);
      const fB = Math.max(0, Math.min(1, (m - legs[0] - legs[1]) / legs[2]));
      arcA.style.strokeDashoffset = String(1 - fA);
      arcB.style.strokeDashoffset = String(1 - fB);
      const waiting = m >= legs[0] && m < legs[0] + legs[1];
      stage.toggleAttribute("data-waiting", waiting);
      if (m < legs[0]) place(arcA, lenA, fA);
      else if (waiting) place(arcA, lenA, 1);
      else place(arcB, lenB, fB);
    };

    stage.dataset.flying = "";
    flight = tween(reduceMotion() ? 0 : ms, frame, ease.travel);
    void flight.finished.then((done) => {
      if (!done) return;
      frame(1);
      if (totalLabel) totalLabel.textContent = finalTotal;
      stage.removeAttribute("data-flying");
      stage.removeAttribute("data-waiting");
      el.dataset.landed = "";
      stage.dataset.landed = "";
    });
    return flight;
  };

  /*
   * The guided preview.
   *
   * The first time Travel is opened in a session, the routes introduce
   * themselves: the one we recommend flies as usual, then each of the others
   * takes a quick pass, then it settles back on the recommendation. It exists
   * to show that the three routes are yours to choose, so the moment the
   * guest takes over — choosing a route, touching the stage, pressing a key,
   * or scrolling with intent — it stops for good and never resumes.
   *
   * It runs once per session, not once per page view, so coming back to
   * Travel later is quiet. Reduced motion skips it entirely: an automated
   * animated sequence is exactly what that setting asks us not to do.
   */
  const PREVIEW_KEY = "guide:travel-previewed";
  const previewDone = () => {
    try {
      return sessionStorage.getItem(PREVIEW_KEY) !== null;
    } catch {
      return true; // No storage: better to never auto-play than to replay.
    }
  };
  const markPreviewed = () => {
    try {
      sessionStorage.setItem(PREVIEW_KEY, "1");
    } catch {
      /* storage unavailable: the preview simply will not be remembered */
    }
  };

  let stopped = false;
  let timer = 0;
  let release: ((ok: boolean) => void) | null = null;

  const stopPreview = () => {
    if (stopped) return;
    stopped = true;
    clearTimeout(timer);
    release?.(false);
    release = null;
    stage.removeAttribute("data-previewing");
  };

  /** Wait, unless the guest has taken over in the meantime. */
  const hold = (ms: number) =>
    new Promise<boolean>((resolve) => {
      if (stopped) return resolve(false);
      release = resolve;
      timer = window.setTimeout(() => {
        release = null;
        resolve(!stopped);
      }, ms);
    });

  /** Choose a route the way the guest would, and fly it. */
  const preview = async (id: string, ms: number) => {
    if (stopped) return false;
    const input = inputs.find((i) => i.value === id);
    if (!input) return false;
    input.checked = true; // :checked drives the selector and the lanes
    const done = await fly(id, ms).finished;
    return done && !stopped;
  };

  const runPreview = async () => {
    stage.dataset.previewing = "";
    const others = inputs.map((i) => i.value).filter((id) => id !== initial);
    for (const id of others) {
      if (!(await hold(700))) return stopPreview();
      if (!(await preview(id, 1600))) return stopPreview();
    }
    if (!(await hold(600))) return stopPreview();
    await preview(initial!, 2400);
    stage.removeAttribute("data-previewing");
  };

  // Anything deliberate ends it. Scrolling needs to mean it: a few pixels of
  // trackpad drift while the stage settles is not the guest taking over.
  const watchForTakeover = () => {
    const from = window.scrollY;
    const off = () => {
      stopPreview();
      window.removeEventListener("wheel", off);
      window.removeEventListener("touchmove", off);
      window.removeEventListener("keydown", off);
      window.removeEventListener("scroll", onScroll);
      planner.removeEventListener("pointerdown", off);
    };
    const onScroll = () => {
      if (Math.abs(window.scrollY - from) > 80) off();
    };
    window.addEventListener("wheel", off, { passive: true, once: true });
    window.addEventListener("touchmove", off, { passive: true, once: true });
    window.addEventListener("keydown", off, { once: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    planner.addEventListener("pointerdown", off);
  };

  stage.dataset.enhanced = "";
  inputs.forEach((input) => {
    clearLane(lane(input.value));
    input.addEventListener("change", () => {
      // The preview sets `checked` directly, which fires no event, so every
      // change that reaches here is the guest choosing for themselves.
      stopPreview();
      if (input.checked) fly(input.value);
    });
  });
  const initial = inputs.find((i) => i.checked)?.value;
  if (initial) {
    mark(initial);
    whenSeen(
      stage,
      () => {
        seen = true;
        const first = fly(inputs.find((i) => i.checked)?.value ?? initial);
        if (reduceMotion() || previewDone()) return;
        // Counted as spent the moment it is scheduled, so a preview the guest
        // interrupts does not come back the next time they open Travel.
        markPreviewed();
        watchForTakeover();
        void first.finished.then((done) => {
          if (done && !stopped) void runPreview();
        });
      },
      0.3,
    );
  }

  // The Flights tab can be hidden when the stage first scrolls past; replay
  // when the tab is shown again, so the journey is never missed.
  document.addEventListener("tabchange", (event) => {
    const tab = (event as CustomEvent<string>).detail;
    if (tab !== "flights" || !seen) return;
    stopPreview();
    fly(inputs.find((i) => i.checked)?.value ?? initial!);
  });

  // Keep the map plane placed when the layout changes size.
  window.addEventListener("resize", () => {
    const id = inputs.find((i) => i.checked)?.value;
    if (id && lane(id).hasAttribute("data-landed")) {
      const [arcB] = arcs(id).slice(1) as [SVGPathElement];
      const end = arcB.getPointAtLength(arcB.getTotalLength());
      const vb = svg.viewBox.baseVal;
      mapPlane.style.transform = `translate(${((end.x - vb.x) / vb.width) * map.clientWidth}px, ${((end.y - vb.y) / vb.height) * map.clientHeight}px)`;
    }
  });
}
