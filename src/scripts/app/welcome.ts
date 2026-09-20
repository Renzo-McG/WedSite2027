/**
 * Home: protects the arrival from incidental input, resolves it cleanly when
 * the hero is genuinely left behind, counts the days up, and flies the Travel
 * door's plane when the door is seen. The arrival itself is CSS
 * (styles/screen-home.css).
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
    let resolved = false;
    let observer: IntersectionObserver | null = null;
    const menu = document.querySelector<HTMLElement>("#site-menu");

    const pause = (on: boolean) => {
      if (resolved) return;
      welcome.toggleAttribute("data-paused", on);
      if (on) count?.pause();
      else count?.resume();
    };

    const resolve = () => {
      if (resolved) return;
      resolved = true;
      welcome.removeAttribute("data-paused");
      welcome.dataset.resolved = "";
      count?.cancel();
      if (days) days.textContent = String(target);
      observer?.disconnect();
    };

    // A little scroll should not destroy the arrival. If the hero is mostly
    // above the viewport, however, finish the story so returning to it never
    // reveals half-drawn geography or an intermediate photograph.
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (
            entry &&
            entry.boundingClientRect.top < 0 &&
            (!entry.isIntersecting || entry.intersectionRatio < 0.18)
          ) {
            resolve();
          }
        },
        { threshold: [0, 0.18, 0.35] },
      );
      observer.observe(welcome);
    }

    // The global menu is temporary chrome, not a decision to abandon Home.
    // Pause while it obscures the hero, then continue where the guest left it.
    menu?.addEventListener("toggle", (event) => {
      pause((event as Event & { newState?: string }).newState === "open");
    });
    document.addEventListener("visibilitychange", () => {
      pause(document.hidden || (menu?.matches(":popover-open") ?? false));
    });

    welcome.querySelector(".welcome__place")?.addEventListener("animationend", resolve, {
      once: true,
    });
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
