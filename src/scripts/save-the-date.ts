import { countdownParts, countdownUnits } from "../lib/countdown";

type Phase =
  | "closed"
  | "control-active"
  | "control-exiting"
  | "seam-active"
  | "cover-opening"
  | "content-revealing"
  | "composed";

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

const REDUCED_SEQUENCE: Step[] = [
  { phase: "content-revealing", after: 0 },
  { phase: "composed", after: 160 },
];

const STORAGE_KEY = "eandl.save-the-date.v1";
const OPENED = "opened";
const COUNTDOWN_INTERVAL = 20000;

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
  const replay = root.querySelector<HTMLButtonElement>("[data-replay]");
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

  function play(sequence: Step[]): void {
    clearTimers();
    let elapsed = 0;
    for (const step of sequence) {
      elapsed += step.after;
      timers.push(
        window.setTimeout(() => {
          root.setAttribute("data-phase", step.phase);
        }, elapsed),
      );
    }
  }

  function open(): void {
    play(prefersReducedMotion() ? REDUCED_SEQUENCE : OPEN_SEQUENCE);
    writeOpened();
    if (replay) replay.hidden = false;
  }

  function replayOpening(): void {
    clearTimers();
    root.setAttribute("data-phase", "closed");
    if (replay) replay.hidden = true;
    window.setTimeout(() => opener?.focus({ preventScroll: true }), 60);
  }

  root.setAttribute("data-phase", readOpened() ? "composed" : "closed");
  if (replay) replay.hidden = root.getAttribute("data-phase") !== "composed";

  opener?.addEventListener("click", open);
  replay?.addEventListener("click", replayOpening);

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

    const render = (): void => {
      const parts = countdownParts(target, Date.now());
      if (!parts) {
        countdown.textContent = resolved;
        return;
      }

      countdown.replaceChildren(
        ...countdownUnits(parts).flatMap((unit, index) => {
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

    if (Number.isFinite(target)) {
      render();
      window.setInterval(render, COUNTDOWN_INTERVAL);
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
