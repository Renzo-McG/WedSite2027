import {
  countdownLabel,
  countdownParts,
  countdownUnits,
  countdownUnitsCompact,
} from "../lib/countdown";
import {
  DEFAULT_TIMING,
  REDUCED_TIMING,
  buildEntrance,
  reverseEntrance,
  type EntrancePhase,
  type EntranceStep,
} from "../lib/entrance-machine";
import { selectStageVideo, type StageVideo } from "../lib/stage-video";

const STORAGE_KEY = "eandl.save-the-date.v1";
const OPENED = "opened";
const CALENDAR_USED_KEY = "eandl.calendar-used:v1";
/* Narrow phones, and short landscape ones where the controls sit in their own
   column beside the wording rather than across the full width. */
const COMPACT_COUNTDOWN = "(max-width: 26rem), (max-height: 30rem)";

/** Where the stage video should begin playing: the moment the cover moves. */
const VIDEO_STARTS_AT: EntrancePhase = "opening";

type SheetState = "opening" | "open" | "closing";

interface StageMediaController {
  start(): void;
  resetAfterSeal(): void;
  setEnvironmentPaused(paused: boolean): void;
}

function prefersReducedMotion(): boolean {
  return (
    document.documentElement.hasAttribute("data-reduced-motion") ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function storageOrNull(kind: "localStorage" | "sessionStorage"): Storage | null {
  try {
    return window[kind];
  } catch {
    return null;
  }
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
    // Blocked storage simply replays the opening on a later visit.
  }
}

function clearOpened(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // The next visit simply arrives already open.
  }
}

function hasUsedCalendarThisSession(): boolean {
  try {
    return window.sessionStorage.getItem(CALENDAR_USED_KEY) === "used";
  } catch {
    return false;
  }
}

function markCalendarUsedThisSession(): void {
  try {
    window.sessionStorage.setItem(CALENDAR_USED_KEY, "used");
  } catch {
    // The finite cue may replay on refresh when session storage is blocked.
  }
}

function mediaUrl(base: string, path: string): string {
  return `${base.replace(/\/?$/, "/")}${path.replace(/^\//, "")}`;
}

function configureStageVideo(stage: HTMLElement | null): StageMediaController {
  const video = stage?.querySelector<HTMLVideoElement>("[data-stage-video]") ?? null;
  const fallback = stage?.querySelector<HTMLElement>("[data-stage-fallback-layer]") ?? null;
  const noop: StageMediaController = {
    start: () => undefined,
    resetAfterSeal: () => undefined,
    setEnvironmentPaused: () => undefined,
  };

  if (!stage || !video) return noop;

  const showFallback = (): void => {
    const fallbackUrl = stage.dataset.stageFallback;
    if (fallback && fallbackUrl) fallback.style.backgroundImage = `url("${fallbackUrl}")`;
  };

  const selection = selectStageVideo(window.location.search, storageOrNull("sessionStorage"));
  stage.dataset.videoSelection = selection.video?.id ?? "none";
  stage.dataset.videoSource = selection.source;

  if (!selection.video) {
    video.removeAttribute("src");
    video.removeAttribute("poster");
    showFallback();
    return noop;
  }

  const selected: StageVideo = selection.video;
  const base = stage.dataset.stageBase ?? "/";
  stage.style.setProperty("--video-position-desktop", selected.desktopPosition);
  stage.style.setProperty("--video-position-mobile", selected.mobilePosition);
  stage.style.setProperty("--video-brightness", String(selected.brightness));
  stage.style.setProperty("--video-saturation", String(selected.saturation));
  stage.style.setProperty("--video-overlay-strength", String(selected.overlayStrength));

  video.poster = mediaUrl(base, selected.poster);
  video.src = mediaUrl(base, selected.src);
  video.defaultPlaybackRate = selected.playbackRate;
  video.load();
  video.playbackRate = selected.playbackRate;

  let started = false;
  let ended = false;
  let environmentPaused = false;

  const markFailure = (): void => {
    stage.dataset.videoState = "fallback";
    video.hidden = true;
    showFallback();
  };

  const playWithoutBlocking = (): void => {
    if (prefersReducedMotion() || ended || environmentPaused) return;
    started = true;
    stage.dataset.videoState = "starting";
    const promise = video.play();
    if (promise) {
      promise
        .then(() => {
          stage.dataset.videoState = "playing";
        })
        .catch(() => {
          started = false;
          markFailure();
        });
    }
  };

  video.addEventListener("playing", () => {
    stage.dataset.videoState = "playing";
  });
  video.addEventListener("ended", () => {
    ended = true;
    stage.dataset.videoState = "ended";
    // The browser deliberately keeps the actual final rendered frame visible.
  });
  video.addEventListener("error", markFailure);

  return {
    start(): void {
      if (started || ended) return;
      playWithoutBlocking();
    },
    resetAfterSeal(): void {
      // Called only after the reseal has reached the fully closed state.
      video.pause();
      try {
        video.currentTime = 0;
      } catch {
        // A failed/unavailable source is already presenting the static fallback.
      }
      started = false;
      ended = false;
      stage.dataset.videoState = "sealed";
    },
    setEnvironmentPaused(paused: boolean): void {
      environmentPaused = paused;
      if (!started || ended) return;
      if (paused) {
        video.pause();
        stage.dataset.videoState = "paused";
      } else {
        playWithoutBlocking();
      }
    },
  };
}

function setUpExperience(root: HTMLElement): void {
  const page = root.closest<HTMLElement>("[data-std]");
  const stage = page?.querySelector<HTMLElement>("[data-stage]") ?? null;
  const opener = root.querySelector<HTMLButtonElement>("[data-opener]");
  const back = (page ?? document).querySelector<HTMLButtonElement>("[data-replay]");
  const content = root.querySelector<HTMLElement>(".invitation__content");
  const layer = root.querySelector<HTMLElement>("[data-sheet-layer]");
  const sheet = root.querySelector<HTMLElement>("[data-sheet]");
  const trigger = root.querySelector<HTMLAnchorElement>("[data-sheet-open]");
  const countdown = root.querySelector<HTMLElement>("[data-countdown]");
  const stageMedia = configureStageVideo(stage);

  let phaseTimers: number[] = [];
  let cueTimers: number[] = [];
  let lastFocused: HTMLElement | null = null;

  page?.setAttribute("data-enhanced", "");

  /* --------------------------------------------------------- entrance */

  /* The mark's idle motion is the approved one: an almost imperceptible turn
     and a slow breath. Both are expressed as custom properties so the
     timeline and the CSS never disagree about the numbers. */
  const timing = (): typeof DEFAULT_TIMING =>
    prefersReducedMotion() ? REDUCED_TIMING : DEFAULT_TIMING;

  function phase(): EntrancePhase {
    return (root.dataset.entrance as EntrancePhase | undefined) ?? "closed";
  }

  function setPhase(next: EntrancePhase): void {
    root.dataset.entrance = next;
  }

  function clearPhaseTimers(): void {
    phaseTimers.forEach((timer) => window.clearTimeout(timer));
    phaseTimers = [];
  }

  function clearCueTimers(): void {
    cueTimers.forEach((timer) => window.clearTimeout(timer));
    cueTimers = [];
  }

  function play(
    sequence: readonly EntranceStep[],
    onStep?: (next: EntrancePhase) => void,
    done?: () => void,
  ): void {
    clearPhaseTimers();
    sequence.forEach((step, index) => {
      const apply = (): void => {
        setPhase(step.phase);
        onStep?.(step.phase);
        if (index === sequence.length - 1) done?.();
      };

      if (step.at === 0) apply();
      else phaseTimers.push(window.setTimeout(apply, step.at));
    });
  }

  function showBack(visible: boolean): void {
    if (back) back.hidden = !visible;
  }

  function isSettled(): boolean {
    return phase() === "still";
  }

  function scheduleCalendarCue(): void {
    clearCueTimers();
    if (hasUsedCalendarThisSession() || !isSettled()) return;

    cueTimers.push(
      window.setTimeout(() => {
        if (!isSettled()) return;
        root.setAttribute("data-cue", "");
        cueTimers.push(window.setTimeout(() => root.removeAttribute("data-cue"), 1260));
      }, 760),
    );
  }

  function openInvitation(): void {
    if (phase() !== "closed") return;
    clearCueTimers();
    showBack(false);
    root.removeAttribute("data-resealing");
    play(
      buildEntrance(timing()),
      (next) => {
        if (next === VIDEO_STARTS_AT) stageMedia.start();
      },
      () => {
        writeOpened();
        showBack(true);
        scheduleCalendarCue();
      },
    );
  }

  function resealInvitation(): void {
    if (!isSettled()) return;
    clearCueTimers();
    root.removeAttribute("data-cue");
    showBack(false);
    root.setAttribute("data-resealing", "");
    play(reverseEntrance(timing()), undefined, () => {
      root.removeAttribute("data-resealing");
      clearOpened();
      stageMedia.resetAfterSeal();
      opener?.focus({ preventScroll: true });
    });
  }

  setPhase(readOpened() ? "still" : "closed");
  showBack(isSettled());
  if (isSettled()) scheduleCalendarCue();

  opener?.addEventListener("click", openInvitation);
  back?.addEventListener("click", resealInvitation);

  /* ------------------------------------------------------------- sheet */

  function sheetState(): SheetState | null {
    return (root.dataset.sheet as SheetState | undefined) ?? null;
  }

  function focusableRows(): HTMLElement[] {
    if (!sheet) return [];
    return Array.from(
      sheet.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"),
    ).filter((node) => node.offsetParent !== null);
  }

  function setBackgroundInert(inert: boolean): void {
    if (content) content.inert = inert;
    if (back) back.inert = inert;
  }

  function openSheet(): void {
    if (!sheet || !isSettled() || sheetState()) return;
    clearCueTimers();
    root.removeAttribute("data-cue");
    markCalendarUsedThisSession();
    lastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    sheet.setAttribute("aria-modal", "true");
    document.documentElement.setAttribute("data-sheet-open", "");
    setBackgroundInert(true);

    root.dataset.sheet = "opening";
    window.setTimeout(
      () => {
        if (root.dataset.sheet === "opening") root.dataset.sheet = "open";
      },
      prefersReducedMotion() ? 90 : 620,
    );
    window.setTimeout(() => sheet.focus({ preventScroll: true }), 30);
  }

  function closeSheet(): void {
    const state = sheetState();
    if (!sheet || (state !== "opening" && state !== "open")) return;

    root.dataset.sheet = "closing";
    window.setTimeout(
      () => {
        delete root.dataset.sheet;
        sheet.removeAttribute("aria-modal");
        document.documentElement.removeAttribute("data-sheet-open");
        setBackgroundInert(false);
        lastFocused?.focus({ preventScroll: true });
      },
      prefersReducedMotion() ? 90 : 620,
    );
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
    const state = sheetState();
    if (state !== "opening" && state !== "open") return;

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
        stageMedia.setEnvironmentPaused(document.hidden);
        if (!document.hidden) {
          render();
          schedule();
        }
      });

      window.addEventListener("pagehide", stop);
    }
  }

  /* ----------------------------------------------------- ambient media */

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) stageMedia.setEnvironmentPaused(!entry.isIntersecting);
      },
      { threshold: 0 },
    );
    observer.observe(root);
  }
}

const experience = document.querySelector<HTMLElement>("[data-invitation]");
if (experience) setUpExperience(experience);
