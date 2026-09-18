/**
 * Shell behaviour shared by every screen: live London/Cebu clocks, the
 * wedding countdown, and the app-bar title that appears once the large screen
 * title has scrolled away (the familiar large-title pattern).
 */
import { countdownParts } from "../../lib/countdown";
import { wedding } from "../../config/wedding";
import { cebuOffsetHours } from "../../lib/guide-time";

const timeFormat = (zone: string) =>
  new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: zone });

function tickClocks(): void {
  const now = new Date();
  document.querySelectorAll<HTMLElement>("[data-clock]").forEach((el) => {
    el.textContent = timeFormat(el.dataset.clock!).format(now);
  });
  const offset = cebuOffsetHours(now);
  document.querySelectorAll<HTMLElement>("[data-clock-note]").forEach((el) => {
    el.textContent = `Cebu is ${offset} hours ahead of the UK today.`;
  });
}

function tickCountdown(): void {
  const parts = countdownParts(Date.parse(wedding.date.countdownTarget), Date.now());
  document.querySelectorAll<HTMLElement>("[data-countdown-days]").forEach((el) => {
    el.textContent = parts ? String(parts.days) : "0";
  });
  document.querySelectorAll<HTMLElement>("[data-countdown-rest]").forEach((el) => {
    el.textContent = parts
      ? `${parts.hours} h ${String(parts.minutes).padStart(2, "0")} m`
      : "Today";
  });
  document.querySelectorAll<HTMLElement>("[data-countdown]").forEach((el) => {
    el.hidden = false;
  });
}

function startClocks(): void {
  tickClocks();
  tickCountdown();
  // Align the first update with the start of the next minute, then every minute.
  const wait = 60_000 - (Date.now() % 60_000);
  window.setTimeout(() => {
    tickClocks();
    tickCountdown();
    window.setInterval(() => {
      tickClocks();
      tickCountdown();
    }, 60_000);
  }, wait);
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
    { rootMargin: "-56px 0px 0px 0px" },
  );
  observer.observe(title);
}

startClocks();
largeTitle();
