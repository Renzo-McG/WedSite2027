/**
 * Shell behaviour shared by every screen: the wedding countdown, the time in
 * Cebu where a screen shows it, and the app-bar title that appears once the
 * large screen title has scrolled away (the familiar large-title pattern).
 */
import { countdownParts } from "../../lib/countdown";
import { wedding } from "../../config/wedding";
import { cebuGapLabel, cebuOffsetHours } from "../../lib/guide-time";

const cebuTime = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Manila",
});
const cebuDay = new Intl.DateTimeFormat("en-GB", { weekday: "long", timeZone: "Asia/Manila" });

function tick(): void {
  const now = new Date();
  document.querySelectorAll<HTMLElement>("[data-cebu-time]").forEach((el) => {
    el.textContent = cebuTime.format(now);
  });
  document.querySelectorAll<HTMLElement>("[data-cebu-day]").forEach((el) => {
    el.textContent = cebuDay.format(now);
  });
  document.querySelectorAll<HTMLElement>("[data-cebu-offset]").forEach((el) => {
    el.textContent = String(cebuOffsetHours(now));
  });
  document.querySelectorAll<HTMLElement>("[data-cebu-gap]").forEach((el) => {
    el.textContent = cebuGapLabel(now);
  });
  const parts = countdownParts(Date.parse(wedding.date.countdownTarget), Date.now());
  document.querySelectorAll<HTMLElement>("[data-countdown-days]").forEach((el) => {
    // A screen may count up to the figure itself; it reads data-days when it does.
    el.dataset.days = parts ? String(parts.days) : "0";
    if (!el.hasAttribute("data-count-up")) el.textContent = el.dataset.days;
  });
  document.querySelectorAll<HTMLElement>("[data-countdown]").forEach((el) => {
    el.hidden = false;
  });
}

function startClock(): void {
  tick();
  // Align the next update with the start of the next minute, then every minute.
  window.setTimeout(
    () => {
      tick();
      window.setInterval(tick, 60_000);
    },
    60_000 - (Date.now() % 60_000),
  );
}

function largeTitle(): void {
  const bar = document.querySelector<HTMLElement>("[data-appbar]");
  const title = document.querySelector<HTMLElement>("[data-large-title]");
  if (!bar || !title || !("IntersectionObserver" in window)) {
    bar?.setAttribute("data-titled", "");
    return;
  }
  const observer = new IntersectionObserver(
    ([entry]) => bar.toggleAttribute("data-titled", !entry?.isIntersecting),
    { rootMargin: "-58px 0px 0px 0px" },
  );
  observer.observe(title);
}

startClock();
largeTitle();
