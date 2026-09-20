/**
 * The wedding: as the hero scrolls away, the light turns to golden hour. One
 * number (--p, 0 to 1: how far the hero has scrolled) drives the warm glow,
 * a gentle parallax and the sun sinking across the Pavilion (see
 * styles/screen-wedding.css). Reduced motion holds a still, warm frame.
 */
import { reduceMotion } from "./motion";

const vow = document.querySelector<HTMLElement>("[data-vow]");

if (vow) {
  if (reduceMotion()) {
    vow.style.setProperty("--p", "0.35");
  } else {
    let queued = false;
    const update = () => {
      queued = false;
      const rect = vow.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height * 0.8)));
      vow.style.setProperty("--p", p.toFixed(3));
    };
    const request = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    };
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    update();
  }
}
