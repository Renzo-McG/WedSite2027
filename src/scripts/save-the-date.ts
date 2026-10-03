import {
  countdownLabel,
  countdownParts,
  countdownUnits,
  countdownUnitsCompact,
} from "../lib/countdown";
import { displayFontFromSearch } from "../lib/display-font";
import {
  CALENDAR_CLOSE_SEQUENCE,
  CALENDAR_OPEN_SEQUENCE,
  OPEN_SEQUENCE,
  REDUCED_CALENDAR_CLOSE_SEQUENCE,
  REDUCED_CALENDAR_OPEN_SEQUENCE,
  REDUCED_OPEN_SEQUENCE,
  REDUCED_RESEAL_SEQUENCE,
  RESEAL_SEQUENCE,
  isStageVideoResetPoint,
  type ExperiencePhase,
  type ExperienceStep,
} from "../lib/experience-machine";
import { selectStageVideo, type StageVideo } from "../lib/stage-video";

const COMPACT_COUNTDOWN = "(max-width: 26rem)";

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
  let requested = false;
  let ended = false;
  let environmentPaused = false;
  let playToken = 0;

  const markFailure = (): void => {
    stage.dataset.videoState = "fallback";
    video.hidden = true;
    showFallback();
  };

  const playWithoutBlocking = (): void => {
    if (prefersReducedMotion() || ended || environmentPaused) return;
    started = true;
    const token = ++playToken;
    stage.dataset.videoState = "starting";
    const promise = video.play();
    if (promise) {
      promise
        .then(() => {
          if (token === playToken) stage.dataset.videoState = "playing";
        })
        .catch(() => {
          if (token !== playToken) return;
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
      // Deliberate Open owns a fresh playback, even after a previous final-frame hold.
      ++playToken;
      video.pause();
      try {
        video.currentTime = 0;
      } catch {
        // Before metadata is ready the source is already positioned at its start.
      }
      video.hidden = false;
      requested = true;
      started = false;
      ended = false;
      playWithoutBlocking();
    },
    resetAfterSeal(): void {
      // Called only after the reseal sequence has reached the fully sealed state.
      ++playToken;
      video.pause();
      try {
        video.currentTime = 0;
      } catch {
        // A failed/unavailable source is already presenting the static fallback.
      }
      started = false;
      requested = false;
      ended = false;
      stage.dataset.videoState = "sealed";
    },
    setEnvironmentPaused(paused: boolean): void {
      environmentPaused = paused;
      if (!requested || ended) return;
      if (paused) {
        if (started) {
          video.pause();
          stage.dataset.videoState = "paused";
        }
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
  let lastFocused: HTMLElement | null = null;

  page?.setAttribute("data-enhanced", "");

  function phase(): ExperiencePhase {
    return (root.dataset.phase as ExperiencePhase | undefined) ?? "sealed";
  }

  function setPhase(next: ExperiencePhase): void {
    root.dataset.phase = next;
  }

  function clearPhaseTimers(): void {
    phaseTimers.forEach((timer) => window.clearTimeout(timer));
    phaseTimers = [];
  }

  function play(
    sequence: readonly ExperienceStep[],
    onStep?: (next: ExperiencePhase) => void,
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

  function openInvitation(): void {
    if (phase() !== "sealed") return;
    showBack(false);
    play(
      prefersReducedMotion() ? REDUCED_OPEN_SEQUENCE : OPEN_SEQUENCE,
      (next) => {
        if (next === "seam-release") stageMedia.start();
      },
      () => {
        showBack(true);
      },
    );
  }

  function resealInvitation(): void {
    if (phase() !== "composed" && phase() !== "calendar-cue") return;
    showBack(false);
    play(prefersReducedMotion() ? REDUCED_RESEAL_SEQUENCE : RESEAL_SEQUENCE, undefined, () => {
      // The media reset is intentionally after the final sealed state.
      if (isStageVideoResetPoint(phase())) stageMedia.resetAfterSeal();
      opener?.focus({ preventScroll: true });
    });
  }

  setPhase("sealed");
  showBack(false);

  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    clearPhaseTimers();
    setPhase("sealed");
    showBack(false);
    stageMedia.resetAfterSeal();
  });

  opener?.addEventListener("click", openInvitation);
  back?.addEventListener("click", resealInvitation);

  /* ------------------------------------------------------------- sheet */

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
    if (!sheet || (phase() !== "composed" && phase() !== "calendar-cue")) return;
    lastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    sheet.setAttribute("aria-modal", "true");
    document.documentElement.setAttribute("data-sheet-open", "");
    setBackgroundInert(true);

    play(
      prefersReducedMotion() ? REDUCED_CALENDAR_OPEN_SEQUENCE : CALENDAR_OPEN_SEQUENCE,
      undefined,
      () => undefined,
    );
    window.setTimeout(() => sheet.focus({ preventScroll: true }), 30);
  }

  function closeSheet(): void {
    if (!sheet || !["calendar-opening", "calendar-open"].includes(phase())) return;
    play(
      prefersReducedMotion() ? REDUCED_CALENDAR_CLOSE_SEQUENCE : CALENDAR_CLOSE_SEQUENCE,
      undefined,
      () => {
        sheet.removeAttribute("aria-modal");
        document.documentElement.removeAttribute("data-sheet-open");
        setBackgroundInert(false);
        lastFocused?.focus({ preventScroll: true });
      },
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
    if (!["calendar-opening", "calendar-open"].includes(phase())) return;

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
        60_000 - (Date.now() % 60_000),
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

document.documentElement.dataset.displayType = displayFontFromSearch(window.location.search);

const experience = document.querySelector<HTMLElement>("[data-invitation]");
if (experience) setUpExperience(experience);
