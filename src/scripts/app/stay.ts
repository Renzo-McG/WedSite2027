/**
 * Stay: the hotel cards and the map are one state (Akari IP-03).
 *
 * - Desktop: pointing at or focusing a card, or pressing "On the map",
 *   activates it; pressing a pin activates and reveals its card.
 * - Phones: the cards form a horizontal rail under the map, and whichever
 *   card is centred is the active one, so control and result stay in view.
 * - The map answers every change: the pin rises, the camera frames the hotel
 *   with the venue, and a car drives the line to the Pavilion before the drive
 *   time lands on it.
 * - Sorting reorders the real DOM (so focus order matches what you see),
 *   animates the move (FLIP), renumbers cards and pins, and hops the pins in
 *   their new order.
 * - "More about" opens a sheet that grows out of the card's photograph
 *   (same-document View Transition; a plain sheet elsewhere).
 */
import { ease, reduceMotion, tween, type Tween } from "./motion";

const root = document.querySelector<HTMLElement>("[data-stay]");

if (root) {
  const list = root.querySelector<HTMLElement>("[data-hotels]")!;
  const mapFigure = root.querySelector<HTMLElement>("[data-stay-map]")!;
  const map = mapFigure.querySelector<HTMLElement>("[data-map]")!;
  const car = map.querySelector<HTMLElement>("[data-car]")!;
  const status = root.querySelector<HTMLElement>("[data-sort-status]");
  const cards = () => [...list.querySelectorAll<HTMLElement>("[data-hotel]")];
  const pin = (id: string) => map.querySelector<HTMLElement>(`[data-pin="${id}"]`);
  const venueId = map.querySelector<HTMLElement>(".pin--venue")?.dataset.pin ?? "";
  const phone = window.matchMedia("(max-width: 1023px)");

  let active = "";
  let drive: Tween | null = null;

  /** Where a pin sits, as percentages of the map. */
  const spot = (id: string) => {
    const el = pin(id);
    return { x: parseFloat(el?.style.left ?? "50"), y: parseFloat(el?.style.top ?? "50") };
  };

  /**
   * The camera. The map's world keeps its true shape and is cropped to the
   * container like object-fit: cover; then it frames the hotel with the venue
   * (or, for the venue itself, every hotel), never showing past its edges.
   */
  const world = map.querySelector<HTMLElement>(".map__world")!;
  const frame = (id: string) => {
    const cw = map.clientWidth;
    const ch = map.clientHeight;
    const ww = world.offsetWidth;
    const wh = world.offsetHeight;
    if (!cw || !ch || !ww || !wh) return;
    const ids =
      id === venueId
        ? [...map.querySelectorAll<HTMLElement>("[data-pin]")].map((p) => p.dataset.pin!)
        : [id, venueId];
    const points = ids.map(spot);
    const pad = id === venueId ? 7 : 13;
    const minX = Math.min(...points.map((p) => p.x)) - pad;
    const maxX = Math.max(...points.map((p) => p.x)) + pad;
    const minY = Math.min(...points.map((p) => p.y)) - pad - 5; // room for the pin
    const maxY = Math.max(...points.map((p) => p.y)) + pad;
    const cover = Math.max(1, ch / wh, cw / ww);
    const fit = Math.min(cw / (((maxX - minX) / 100) * ww), ch / (((maxY - minY) / 100) * wh));
    const z = Math.max(cover, Math.min(Math.max(cover, 2.1), fit));
    const cx = ((minX + maxX) / 200) * ww;
    const cy = ((minY + maxY) / 200) * wh;
    const tx = Math.min(0, Math.max(cw - z * ww, cw / 2 - z * cx));
    const ty = Math.min(0, Math.max(ch - z * wh, ch / 2 - z * cy));
    map.style.setProperty("--z", z.toFixed(3));
    map.style.setProperty("--tx", `${((tx / ww) * 100).toFixed(3)}%`);
    map.style.setProperty("--ty", `${((ty / wh) * 100).toFixed(3)}%`);
  };
  window.addEventListener("resize", () => active && frame(active));

  /** The car drives from the hotel to the venue; the line follows it. */
  const driveTo = (id: string) => {
    drive?.cancel();
    map.querySelectorAll<SVGPathElement>("[data-link]").forEach((path) => {
      const on = path.dataset.link === id;
      path.toggleAttribute("data-active", on);
      if (!on) path.style.strokeDashoffset = "1";
    });
    map.querySelectorAll<HTMLElement>("[data-link-label]").forEach((label) => {
      label.removeAttribute("data-active");
    });
    const path = map.querySelector<SVGPathElement>(`[data-link="${id}"]`);
    car.removeAttribute("data-on");
    if (!path) return;
    const svg = path.ownerSVGElement!;
    const vb = svg.viewBox.baseVal;
    const length = path.getTotalLength();
    drive = tween(
      1000,
      (p) => {
        const at = path.getPointAtLength(length * p);
        car.style.left = `${((at.x - vb.x) / vb.width) * 100}%`;
        car.style.top = `${((at.y - vb.y) / vb.height) * 100}%`;
        path.style.strokeDashoffset = String(1 - p);
        car.setAttribute("data-on", "");
      },
      ease.inOut,
      reduceMotion() ? 0 : 280,
    );
    void drive.finished.then((done) => {
      if (!done) return;
      car.removeAttribute("data-on");
      map.querySelector<HTMLElement>(`[data-link-label="${id}"]`)?.setAttribute("data-active", "");
    });
  };

  const setActive = (id: string) => {
    if (!id || id === active) return;
    active = id;
    cards().forEach((card) => card.toggleAttribute("data-active", card.dataset.hotel === id));
    map.querySelectorAll<HTMLElement>("[data-pin]").forEach((el) => {
      const on = el.dataset.pin === id;
      el.setAttribute("aria-pressed", String(on));
      el.toggleAttribute("data-active", on);
    });
    root.querySelectorAll<HTMLElement>("[data-dot]").forEach((dot) => {
      dot.toggleAttribute("data-active", dot.dataset.dot === id);
    });
    map.dataset.active = id;
    frame(id);
    driveTo(id);
  };

  const revealCard = (id: string) => {
    const card = cards().find((c) => c.dataset.hotel === id);
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
  };

  // Desktop: hover and focus follow the pointer and the keyboard.
  list.addEventListener("pointerover", (event) => {
    if (phone.matches) return;
    const card = (event.target as Element).closest<HTMLElement>("[data-hotel]");
    if (card) setActive(card.dataset.hotel!);
  });
  list.addEventListener("focusin", (event) => {
    const card = (event.target as Element).closest<HTMLElement>("[data-hotel]");
    if (card && !phone.matches) setActive(card.dataset.hotel!);
  });

  // "On the map": on phones the map sits above the rail, so bring it into view.
  list.addEventListener("click", (event) => {
    const button = (event.target as Element).closest<HTMLElement>("[data-show-on-map]");
    if (!button) return;
    setActive(button.dataset.showOnMap!);
    if (phone.matches) revealCard(button.dataset.showOnMap!);
    mapFigure.scrollIntoView({ block: "nearest", behavior: reduceMotion() ? "auto" : "smooth" });
  });

  // Pins.
  map.addEventListener("click", (event) => {
    const target = (event.target as Element).closest<HTMLElement>("[data-pin]");
    if (!target) return;
    setActive(target.dataset.pin!);
    revealCard(target.dataset.pin!);
  });

  // Phones: the centred card in the rail is the active hotel.
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
        if (best) setActive((best.target as HTMLElement).dataset.hotel!);
      },
      { root: list, threshold: [0.7, 0.9, 1] },
    );
    cards().forEach((card) => observer!.observe(card));
  };
  phone.addEventListener("change", watchRail);
  watchRail();

  // Sorting: reorder the DOM, animate the move, renumber, hop the pins.
  const renumber = () => {
    cards().forEach((card, i) => {
      const id = card.dataset.hotel!;
      const rank = card.querySelector<HTMLElement>("[data-rank]");
      const pinRank = pin(id)?.querySelector<HTMLElement>("[data-pin-rank]");
      for (const el of [rank, pinRank]) {
        if (!el || el.textContent === String(i + 1)) continue;
        el.textContent = String(i + 1);
        if (!reduceMotion()) {
          el.animate(
            [
              { transform: "translateY(60%)", opacity: 0 },
              { transform: "none", opacity: 1 },
            ],
            {
              duration: 360,
              delay: i * 50,
              easing: "cubic-bezier(0.23, 1, 0.32, 1)",
              fill: "backwards",
            },
          );
        }
      }
      if (!reduceMotion()) {
        pin(id)
          ?.querySelector<HTMLElement>(".pin__body")
          ?.animate(
            [
              { transform: "none" },
              { transform: "translateY(-10px)", offset: 0.4 },
              { transform: "none" },
            ],
            { duration: 520, delay: 120 + i * 70, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" },
          );
      }
    });
  };

  const sort = root.querySelector<HTMLElement>("[data-sort]");
  sort?.addEventListener("change", (event) => {
    const by = (event.target as HTMLInputElement).value as "distance" | "price";
    const before = new Map(cards().map((c) => [c, c.getBoundingClientRect()]));
    const sorted = cards().sort(
      (a, b) =>
        Number(a.dataset[by]) - Number(b.dataset[by]) ||
        Number(a.dataset.order) - Number(b.dataset.order),
    );
    sorted.forEach((card) => list.appendChild(card));
    if (status) {
      status.textContent = `${sorted.length} places, ${by === "price" ? "lowest price first" : "nearest first"}`;
    }
    const dots = root.querySelector<HTMLElement>(".stay__pager");
    sorted.forEach((card) => {
      const dot = dots?.querySelector(`[data-dot="${card.dataset.hotel}"]`);
      if (dot) dots!.appendChild(dot);
    });
    list.scrollTo({ left: 0 });
    renumber();
    if (!reduceMotion()) {
      sorted.forEach((card, i) => {
        const was = before.get(card)!;
        const now = card.getBoundingClientRect();
        const dx = was.left - now.left;
        const dy = was.top - now.top;
        if (!dx && !dy) return;
        card.animate(
          [
            { transform: `translate(${dx}px, ${dy}px)`, zIndex: 2 },
            { transform: `translate(${dx / 2}px, ${dy / 2}px) scale(1.03)`, offset: 0.5 },
            { transform: "none", zIndex: 2 },
          ],
          { duration: 620, delay: i * 30, easing: "cubic-bezier(0.77, 0, 0.175, 1)" },
        );
      });
    }
    const first = sorted[0]?.dataset.hotel;
    if (first) {
      active = "";
      setActive(first);
    }
  });

  // Details: a sheet that grows out of the photograph.
  const sheet = document.querySelector<HTMLDialogElement>("[data-sheet]");
  if (sheet) {
    const slot = (name: string) => sheet.querySelector<HTMLElement>(`[data-sheet-${name}]`)!;
    let openCard: HTMLElement | null = null;

    const fill = (card: HTMLElement) => {
      const img = card.querySelector<HTMLImageElement>(".hotel__img")!;
      const copy = img.cloneNode() as HTMLImageElement;
      copy.className = "hotel-sheet__img";
      copy.loading = "eager";
      copy.sizes = "(min-width: 720px) 640px, 100vw";
      slot("media").replaceChildren(copy);
      slot("badge").textContent = card.querySelector(".hotel__badge")?.textContent?.trim() ?? "";
      slot("badge").classList.toggle("is-venue", card.classList.contains("hotel--venue"));
      slot("title").textContent = card.querySelector(".hotel__name")?.textContent ?? "";
      slot("kind").textContent =
        `${card.querySelector(".hotel__kind")?.textContent ?? ""}, ` +
        `from about ${card.querySelector(".hotel__price b")?.textContent ?? ""} a night`;
      slot("drive").replaceChildren(card.querySelector(".hotel__drive")!.cloneNode(true));
      slot("more").replaceChildren(
        ...[...card.querySelector("[data-more]")!.children].map((n) => n.cloneNode(true)),
      );
      return { from: img, to: copy };
    };

    const canMorph = () => "startViewTransition" in document && !reduceMotion();

    const open = (id: string) => {
      const card = cards().find((c) => c.dataset.hotel === id);
      if (!card) return;
      openCard = card;
      setActive(id);
      const { from, to } = fill(card);
      if (!canMorph()) {
        sheet.showModal();
        return;
      }
      from.style.viewTransitionName = "hotel-photo";
      const vt = document.startViewTransition(() => {
        // The photograph leaves the card while the sheet holds it.
        from.style.viewTransitionName = "";
        from.style.visibility = "hidden";
        to.style.viewTransitionName = "hotel-photo";
        sheet.showModal();
      });
      vt.finished.finally(() => (to.style.viewTransitionName = ""));
    };

    const close = () => {
      if (!sheet.open) return;
      const from = sheet.querySelector<HTMLImageElement>(".hotel-sheet__img");
      const to = openCard?.querySelector<HTMLImageElement>(".hotel__img");
      const trigger = openCard?.querySelector<HTMLElement>("[data-details]");
      if (!canMorph() || !from || !to) {
        sheet.close();
        if (to) to.style.visibility = "";
        trigger?.focus();
        return;
      }
      from.style.viewTransitionName = "hotel-photo";
      const vt = document.startViewTransition(() => {
        from.style.viewTransitionName = "";
        to.style.visibility = "";
        to.style.viewTransitionName = "hotel-photo";
        sheet.close();
      });
      vt.finished.finally(() => {
        to.style.viewTransitionName = "";
        trigger?.focus();
      });
    };

    list.addEventListener("click", (event) => {
      const button = (event.target as Element).closest<HTMLElement>("[data-details]");
      if (button) open(button.dataset.details!);
    });
    // Close button, Escape and a tap on the backdrop all take the photo home.
    sheet.addEventListener("submit", (event) => {
      event.preventDefault();
      close();
    });
    sheet.addEventListener("cancel", (event) => {
      event.preventDefault();
      close();
    });
    sheet.addEventListener("click", (event) => {
      if (event.target === sheet) close();
    });
  }

  root.dataset.enhanced = "";
  setActive(cards()[0]?.dataset.hotel ?? "");
}
