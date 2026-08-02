import {
  countdownLabel,
  countdownParts,
  countdownUnits,
  countdownUnitsCompact,
} from "../lib/countdown";

type Phase =
  | "closed"
  | "control-active"
  | "control-exiting"
  | "seam-active"
  | "cover-opening"
  | "content-revealing"
  | "composed"
  | "content-resolving"
  | "cover-closing"
  | "seam-restoring";

interface Step {
  phase: Phase;
  after: number;
}

const OPEN_SEQUENCE: Step[] = [
  { phase: "control-active", after: 0 },
  { phase: "control-exiting", after: 180 },
  { phase: "seam-active", after: 260 },
  { phase: "cover-opening", after: 320 },
  { phase: "content-revealing", after: 420 },
  { phase: "composed", after: 860 },
];

/** Shorter and intentional rather than a frame-perfect reverse. */
const CLOSE_SEQUENCE: Step[] = [
  { phase: "content-resolving", after: 0 },
  { phase: "cover-closing", after: 200 },
  { phase: "seam-restoring", after: 520 },
  { phase: "closed", after: 260 },
];

const REDUCED_OPEN: Step[] = [
  { phase: "content-revealing", after: 0 },
  { phase: "composed", after: 160 },
];

const REDUCED_CLOSE: Step[] = [{ phase: "closed", after: 0 }];

const STORAGE_KEY = "eandl.save-the-date.v1";
const OPENED = "opened";
/** Below this width the countdown uses `04h · 12m · 09s` instead of full words. */
const COMPACT_COUNTDOWN = "(max-width: 26rem)";

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function readOpened(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === OPENED;
  } catch {
    return false;
  }
}

function writeOpened(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, OPENED);
  } catch {
    /* Private mode and blocked storage simply replay the opening next visit. */
  }
}

function setUpExperience(root: HTMLElement): void {
  const page = root.closest<HTMLElement>("[data-std]");
  const opener = root.querySelector<HTMLButtonElement>("[data-opener]");
  /* The back control sits on the stage, outside the invitation. */
  const back = (page ?? document).querySelector<HTMLButtonElement>("[data-replay]");
  const layer = root.querySelector<HTMLElement>("[data-sheet-layer]");
  const sheet = root.querySelector<HTMLElement>("[data-sheet]");
  const trigger = root.querySelector<HTMLAnchorElement>("[data-sheet-open]");
  const countdown = root.querySelector<HTMLElement>("[data-countdown]");

  let timers: number[] = [];
  let lastFocused: HTMLElement | null = null;

  page?.setAttribute("data-enhanced", "");

  function clearTimers(): void {
    timers.forEach((timer) => window.clearTimeout(timer));
    timers = [];
  }

  function play(sequence: Step[], done?: () => void): void {
    clearTimers();
    let elapsed = 0;
    sequence.forEach((step, index) => {
      elapsed += step.after;
      timers.push(
        window.setTimeout(() => {
          root.setAttribute("data-phase", step.phase);
          if (index === sequence.length - 1) done?.();
        }, elapsed),
      );
    });
  }

  function showBack(visible: boolean): void {
    if (back) back.hidden = !visible;
  }

  function open(): void {
    play(prefersReducedMotion() ? REDUCED_OPEN : OPEN_SEQUENCE);
    writeOpened();
    showBack(true);
  }

  function close(): void {
    showBack(false);
    play(prefersReducedMotion() ? REDUCED_CLOSE : CLOSE_SEQUENCE, () => {
      opener?.focus({ preventScroll: true });
    });
  }

  root.setAttribute("data-phase", readOpened() ? "composed" : "closed");
  showBack(root.getAttribute("data-phase") === "composed");

  opener?.addEventListener("click", open);
  back?.addEventListener("click", close);

  /* ------------------------------------------------------------- sheet */

  function focusableRows(): HTMLElement[] {
    if (!sheet) return [];
    return Array.from(
      sheet.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"),
    ).filter((node) => node.offsetParent !== null);
  }

  function openSheet(): void {
    if (!sheet) return;
    lastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    root.setAttribute("data-sheet", "open");
    sheet.setAttribute("aria-modal", "true");
    document.documentElement.setAttribute("data-sheet-open", "");
    window.setTimeout(() => sheet.focus({ preventScroll: true }), 20);
  }

  function closeSheet(): void {
    if (!sheet || root.getAttribute("data-sheet") !== "open") return;
    root.removeAttribute("data-sheet");
    sheet.removeAttribute("aria-modal");
    document.documentElement.removeAttribute("data-sheet-open");
    lastFocused?.focus({ preventScroll: true });
  }

  trigger?.addEventListener("click", (event) => {
    event.preventDefault();
    openSheet();
  });

  layer?.addEventListener("click", (event) => {
    const target = event.target;
    if (target instanceof Element && target.closest("[data-sheet-close]")) {
      event.preventDefault();
      closeSheet();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (root.getAttribute("data-sheet") !== "open") return;

    if (event.key === "Escape") {
      event.preventDefault();
      closeSheet();
      return;
    }

    if (event.key !== "Tab" || !sheet) return;

    const rows = focusableRows();
    const first = rows[0];
    const last = rows[rows.length - 1];
    if (!first || !last) return;

    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === sheet)) {
      event.preventDefault();
      last.focus({ preventScroll: true });
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus({ preventScroll: true });
    }
  });

  /* --------------------------------------------------------- countdown */

  if (countdown) {
    const target = Number(countdown.dataset.target);
    const resolved = countdown.dataset.resolved ?? "";
    const compact = window.matchMedia(COMPACT_COUNTDOWN);
    let tick: number | undefined;

    const render = (): void => {
      const parts = countdownParts(target, Date.now());

      /* The accessible name changes only once a day, so assistive technology is
         never interrupted by the seconds. */
      countdown.setAttribute("aria-label", countdownLabel(parts, resolved));

      if (!parts) {
        countdown.textContent = resolved;
        return;
      }

      const units = compact.matches ? countdownUnitsCompact(parts) : countdownUnits(parts);
      countdown.replaceChildren(
        ...units.flatMap((unit, index) => {
          const value = document.createElement("span");
          value.className = "countdown__unit";
          value.textContent = unit;
          if (index === 0) return [value];

          const separator = document.createElement("span");
          separator.className = "countdown__sep";
          separator.setAttribute("aria-hidden", "true");
          separator.textContent = "·";
          return [separator, value];
        }),
      );
    };

    const stop = (): void => {
      if (tick !== undefined) window.clearTimeout(tick);
      tick = undefined;
    };

    /* Aligned to the next whole second rather than a free-running interval, so
       the display never drifts or skips a number. */
    const schedule = (): void => {
      tick = window.setTimeout(
        () => {
          render();
          schedule();
        },
        1000 - (Date.now() % 1000),
      );
    };

    if (Number.isFinite(target)) {
      render();
      schedule();
      compact.addEventListener("change", render);

      document.addEventListener("visibilitychange", () => {
        stop();
        if (!document.hidden) {
          render();
          schedule();
        }
      });

      window.addEventListener("pagehide", stop);
    }
  }

  /* ----------------------------------------------------- ambient motion */

  if (page) {
    const setPaused = (paused: boolean): void => {
      if (paused) page.setAttribute("data-paused", "");
      else page.removeAttribute("data-paused");
    };

    document.addEventListener("visibilitychange", () => setPaused(document.hidden));

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) setPaused(!entry.isIntersecting);
        },
        { threshold: 0 },
      );
      observer.observe(root);
    }
  }
}

const experience = document.querySelector<HTMLElement>("[data-invitation]");
if (experience) setUpExperience(experience);
