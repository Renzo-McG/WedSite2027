/**
 * Home: lets a tap, key or scroll skip the arrival, counts the days up as the
 * date resolves, and flies the Travel door's plane when the door is seen.
 * The arrival itself is CSS (styles/screen-home.css).
 */
import { countdownParts } from "../../lib/countdown";
import { wedding } from "../../config/wedding";
import { ease, reduceMotion, tween, whenSeen } from "./motion";

const welcome = document.querySelector<HTMLElement>("[data-welcome]");
const arrival = document.documentElement.dataset.arrival;

if (welcome) {
  const days = welcome.querySelector<HTMLElement>("[data-count-up]");
  const parts = countdownParts(Date.parse(wedding.date.countdownTarget), Date.now());
  const target = parts?.days ?? 0;
  let count: ReturnType<typeof tween> | null = null;
  const countUp = (delay: number) => {
    count?.cancel();
    if (!days) return;
    count = tween(
      1200,
      (p) => (days.textContent = String(Math.round(p * target))),
      ease.out,
      delay,
    );
  };

  if (arrival === "first" && !reduceMotion()) {
    const inputs = ["pointerdown", "wheel", "keydown", "touchstart"] as const;
    const skip = () => {
      welcome.dataset.skip = "";
      countUp(0);
      inputs.forEach((type) => window.removeEventListener(type, skip));
    };
    inputs.forEach((type) => window.addEventListener(type, skip, { passive: true }));
    window.setTimeout(() => inputs.forEach((type) => window.removeEventListener(type, skip)), 3400);
    countUp(3250);
  } else {
    countUp(arrival === "return" ? 250 : 0);
  }
}

const door = document.querySelector<HTMLElement>(".door--travel");
const flight = door?.querySelector<SVGAnimateMotionElement>("animateMotion");
if (door && flight) {
  let landing = 0;
  const fly = () => {
    door.dataset.seen = "";
    if (reduceMotion()) return;
    door.removeAttribute("data-landed");
    door.dataset.flying = "";
    flight.beginElement();
    // Once it lands, the plane gives way to Cebu's ripple.
    clearTimeout(landing);
    landing = window.setTimeout(() => (door.dataset.landed = ""), 2600);
  };
  whenSeen(door, fly, 0.6);
  door.addEventListener("pointerenter", () => {
    if (!door.hasAttribute("data-seen") || reduceMotion()) return;
    // Fly again: reset the line, then draw it with the plane.
    door.removeAttribute("data-seen");
    requestAnimationFrame(() => requestAnimationFrame(fly));
  });
}
