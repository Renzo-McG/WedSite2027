/**
 * Your trip (components/trip/HolidayExplorer.astro): choosing 7, 10 or 14
 * days plays one sequence.
 *
 * 1. The map camera eases out (or in) to the view that length makes room for;
 *    every pin, label and arc rides the camera.
 * 2. Places now in reach pop onto the map in turn and arcs draw out to them
 *    from Mactan; places out of reach shrink away. The newest places show as
 *    photo pins, the ones already in reach become quiet dots.
 * 3. The cards rearrange (FLIP): the newly possible places lead, the rest
 *    slide down, and out-of-reach ones step away.
 * The band and the summary are CSS (:has on the radios).
 *
 * One place is always "active": pointing at or focusing a card, tapping a pin,
 * or centring a card in the phone rail lights its arc, shows how you get
 * there, and fans its activities out around its pin.
 */
import { ease, reduceMotion, tween, whenSeen, type Tween } from "./motion";
import "./window";

interface ViewBox {
  days: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

const root = document.querySelector<HTMLElement>("[data-holiday]");

if (root) {
  const figure = root.querySelector<HTMLElement>("[data-phmap]")!;
  const svg = figure.querySelector<SVGSVGElement>("svg")!;
  const views = JSON.parse(figure.dataset.views!) as ViewBox[];
  const inputs = [...root.querySelectorAll<HTMLInputElement>(".lengths__input")];
  const list = root.querySelector<HTMLElement>("[data-places]")!;
  const placed = [...figure.querySelectorAll<HTMLElement>("[data-x]")];
  const pins = [...figure.querySelectorAll<HTMLElement>("[data-pin]")];
  const arcs = [...svg.querySelectorAll<SVGPathElement>("[data-arc]")];
  const cards = () => [...list.querySelectorAll<HTMLElement>("[data-place]")];
  const phone = window.matchMedia("(max-width: 1023px)");
  const order = cards().map((c) => c.dataset.place!);

  const initial = svg.viewBox.baseVal;
  let view = { x: initial.x, y: initial.y, w: initial.width, h: initial.height };
  let camera: Tween | null = null;
  let days = 0;
  let active = "";

  const baseAt = figure.querySelector<HTMLElement>(".phpin--base")!;
  const vias = [...figure.querySelectorAll<HTMLElement>("[data-via]")];
  const position = () => {
    for (const el of placed) {
      el.style.left = `${((Number(el.dataset.x) - view.x) / view.w) * 100}%`;
      el.style.top = `${((Number(el.dataset.y) - view.y) / view.h) * 100}%`;
    }
    // A short hop has no room for its "how to get there" label on the map;
    // the card still says it.
    const scale = figure.clientWidth / view.w;
    for (const via of vias) {
      const pin = pins.find((p) => p.dataset.pin === via.dataset.via)!;
      const dx = (Number(pin.dataset.x) - Number(baseAt.dataset.x)) * scale;
      const dy = (Number(pin.dataset.y) - Number(baseAt.dataset.y)) * scale;
      via.toggleAttribute("data-near", Math.hypot(dx, dy) < 130);
    }
  };

  const fly = (target: ViewBox, animate: boolean) => {
    camera?.cancel();
    const from = { ...view };
    camera = tween(
      animate ? 1150 : 0,
      (p) => {
        view = {
          x: from.x + (target.x - from.x) * p,
          y: from.y + (target.y - from.y) * p,
          w: from.w + (target.w - from.w) * p,
          h: from.h + (target.h - from.h) * p,
        };
        svg.setAttribute("viewBox", `${view.x} ${view.y} ${view.w} ${view.h}`);
        position();
      },
      ease.inOut,
    );
  };

  const setActive = (id: string) => {
    if (!id) return;
    active = id;
    pins.forEach((pin) => pin.toggleAttribute("data-active", pin.dataset.pin === id));
    arcs.forEach((a) => a.toggleAttribute("data-active", a.dataset.arc === id));
    figure.querySelectorAll<HTMLElement>("[data-via]").forEach((via) => {
      via.toggleAttribute("data-active", via.dataset.via === id);
    });
    cards().forEach((card) => card.toggleAttribute("data-active", card.dataset.place === id));
  };

  const choose = (next: number, first = false) => {
    if (next === days) return;
    const grew = next > days;
    days = next;
    root.dataset.days = String(days);
    const animate = !first && !reduceMotion();
    const inReach = (el: HTMLElement | SVGElement) => Number(el.dataset.from) <= days;
    const prime = (el: HTMLElement | SVGElement) => Number(el.dataset.from) === days;

    // 1. Camera.
    fly(
      views.find((v) => v.days === days)!,
      animate,
    );

    // 2. Pins and arcs.
    let k = 0;
    pins.forEach((pin) => {
      const was = pin.hasAttribute("data-in");
      const now = inReach(pin);
      pin.toggleAttribute("data-in", now);
      pin.toggleAttribute("data-prime", now && prime(pin));
      if (now && !was && animate) {
        pin.style.setProperty("--delay", `${520 + k * 110}ms`);
        pin.dataset.enter = "";
        k++;
        window.setTimeout(() => pin.removeAttribute("data-enter"), 1600);
      }
    });
    arcs.forEach((a, i) => {
      const now = inReach(a);
      a.style.transitionDelay = now && animate && grew ? `${600 + i * 70}ms` : "0ms";
      a.toggleAttribute("data-in", now);
      a.toggleAttribute("data-prime", now && prime(a));
    });

    // 3. Cards: newly possible places lead; FLIP everything that stays.
    const before = new Map(
      cards()
        .filter((c) => !c.hidden)
        .map((c) => [c, c.getBoundingClientRect()]),
    );
    const sorted = [...cards()].sort((a, b) => {
      const pa = prime(a) ? 0 : 1;
      const pb = prime(b) ? 0 : 1;
      return pa - pb || order.indexOf(a.dataset.place!) - order.indexOf(b.dataset.place!);
    });
    sorted.forEach((card) => list.appendChild(card));
    let n = 0;
    sorted.forEach((card) => {
      const show = inReach(card);
      const was = before.get(card);
      card.hidden = !show;
      if (!animate || !show) return;
      const now = card.getBoundingClientRect();
      if (!was) {
        card.animate(
          [
            { opacity: 0, transform: "translateY(24px) scale(0.96)" },
            { opacity: 1, transform: "none" },
          ],
          {
            duration: 560,
            delay: 280 + n++ * 90,
            easing: "cubic-bezier(0.23, 1, 0.32, 1)",
            fill: "backwards",
          },
        );
      } else if (was.left !== now.left || was.top !== now.top) {
        card.animate(
          [
            { transform: `translate(${was.left - now.left}px, ${was.top - now.top}px)` },
            { transform: "none" },
          ],
          { duration: 640, easing: "cubic-bezier(0.77, 0, 0.175, 1)" },
        );
      }
    });
    if (phone.matches) list.scrollTo({ left: 0, behavior: animate ? "smooth" : "auto" });

    const lead = sorted.find((c) => inReach(c) && prime(c)) ?? sorted.find(inReach);
    const keep = cards().find((c) => c.dataset.place === active && !c.hidden);
    setActive(first || !keep ? (lead?.dataset.place ?? "") : active);
  };

  // Choosing a length.
  inputs.forEach((input) =>
    input.addEventListener("change", () => input.checked && choose(Number(input.value))),
  );

  // Pointing at places.
  list.addEventListener("pointerover", (event) => {
    if (phone.matches) return;
    const card = (event.target as Element).closest<HTMLElement>("[data-place]");
    if (card) setActive(card.dataset.place!);
  });
  list.addEventListener("focusin", (event) => {
    const card = (event.target as Element).closest<HTMLElement>("[data-place]");
    if (card) setActive(card.dataset.place!);
  });
  figure.addEventListener("click", (event) => {
    const pin = (event.target as Element).closest<HTMLElement>("[data-pin]");
    if (!pin) return;
    setActive(pin.dataset.pin!);
    const card = cards().find((c) => c.dataset.place === pin.dataset.pin);
    if (!card) return;
    const behavior: ScrollBehavior = reduceMotion() ? "auto" : "smooth";
    if (phone.matches) {
      list.scrollTo({
        left: card.offsetLeft - (list.clientWidth - card.clientWidth) / 2,
        behavior,
      });
    } else {
      card.scrollIntoView({ block: "nearest", behavior });
    }
  });

  // Phones: the centred card is the active place.
  let observer: IntersectionObserver | null = null;
  const watchRail = () => {
    observer?.disconnect();
    observer = null;
    if (!phone.matches || !("IntersectionObserver" in window)) return;
    observer = new IntersectionObserver(
      (entries) => {
        const best = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (best) setActive((best.target as HTMLElement).dataset.place!);
      },
      { root: list, threshold: [0.7, 0.9, 1] },
    );
    cards().forEach((card) => observer!.observe(card));
  };
  phone.addEventListener("change", watchRail);

  root.dataset.enhanced = "";
  choose(Number(inputs.find((i) => i.checked)?.value ?? 10), true);
  watchRail();

  // The first time the map is seen, the places arrive in turn.
  whenSeen(figure, () => figure.setAttribute("data-seen", ""), 0.25);
}
