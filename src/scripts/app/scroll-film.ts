/** Scroll owns the film frame. The still underneath is the permanent fallback. */
import { reduceMotion } from "./motion";

const clamp = (value: number) => Math.min(1, Math.max(0, value));

document.querySelectorAll<HTMLElement>("[data-scroll-film]").forEach((scene) => {
  const video = scene.querySelector<HTMLVideoElement>("[data-film-video]");
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (!video || reduceMotion() || connection?.saveData || !video.canPlayType("video/mp4")) return;

  let loaded = false;
  let failed = false;
  let queued = false;
  let target = 0;
  let seekStarted = 0;
  let slowSeeks = 0;

  // Some source footage opens with a burned-in caption. Where the crop shows it
  // (data-film-clean-media), the still stays up until the film is past those
  // frames (data-film-clean-from, in seconds), then the film fades in as usual.
  const cleanFrom = Number(video.dataset.filmCleanFrom) || 0;
  const cleanMedia = video.dataset.filmCleanMedia
    ? window.matchMedia(video.dataset.filmCleanMedia)
    : null;
  const showFrame = () => {
    const holdStill = cleanFrom > 0 && (!cleanMedia || cleanMedia.matches) && target < cleanFrom;
    scene.toggleAttribute("data-film-ready", !holdStill);
  };

  const fallback = () => {
    if (failed) return;
    failed = true;
    scene.removeAttribute("data-film-ready");
    video.removeAttribute("src");
    video.load();
  };

  const seek = () => {
    if (!loaded || failed || video.seeking) return;
    if (Math.abs(video.currentTime - target) < 0.07) {
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) showFrame();
      return;
    }
    seekStarted = performance.now();
    try {
      video.currentTime = target;
    } catch {
      fallback();
    }
  };

  const update = () => {
    queued = false;
    const rect = scene.getBoundingClientRect();
    const progress = clamp(-rect.top / Math.max(240, rect.height * 0.85));
    // Keep clear of exact media endpoints, which can decode inconsistently.
    target = 0.08 + progress * Math.max(0, video.duration - 0.16);
    seek();
  };

  const request = () => {
    if (queued || failed) return;
    queued = true;
    requestAnimationFrame(update);
  };

  video.addEventListener("loadedmetadata", () => {
    if (!Number.isFinite(video.duration) || video.duration < 1) return fallback();
    loaded = true;
    video.pause();
    request();
  });
  video.addEventListener("seeked", () => {
    if (seekStarted && performance.now() - seekStarted > 450 && ++slowSeeks >= 3) return fallback();
    showFrame();
    seek();
  });
  video.addEventListener("error", fallback);
  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", request);

  const load = () => {
    const source = video.dataset.src;
    if (!source || failed) return;
    video.src = source;
    video.preload = "auto";
    video.load();
  };
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        load();
      },
      { rootMargin: "300px" },
    );
    observer.observe(scene);
  } else {
    load();
  }
});
