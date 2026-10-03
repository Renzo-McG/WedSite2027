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
  let sorting = false;
  let sortEpoch = 0;
  let sortAnimations: Animation[] = [];

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

  /**
   * Make a hotel the active one. `again` re-answers even when it is already
   * active, which is what "On the map" needs: on a desktop the pointer has
   * usually activated the card already, so without this the button had
   * nothing left to do and looked broken.
   */
  const setActive = (id: string, again = false) => {
    if (!id || (id === active && !again)) return;
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

  /** A pin answers a press on "On the map" even if it was already chosen. */
  const bouncePin = (id: string) => {
    if (reduceMotion()) return;
    pin(id)
      ?.querySelector<HTMLElement>(".pin__body")
      ?.animate(
        [
          { transform: "none" },
          { transform: "translateY(-12px) scale(1.12)", offset: 0.42 },
          { transform: "none" },
        ],
        { duration: 620, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" },
      );
  };

  // "On the map": frame the hotel, drive the line again and hop its pin, then
  // bring the map into view (on phones it sits above the rail).
  list.addEventListener("click", (event) => {
    const button = (event.target as Element).closest<HTMLElement>("[data-show-on-map]");
    if (!button) return;
    const id = button.dataset.showOnMap!;
    setActive(id, true);
    bouncePin(id);
    if (phone.matches) revealCard(id);
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
        if (sorting) return;
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

  // Sorting preserves card identity, active hotel and map state. Only position
  // belongs to the sort; rank labels update without competing motion.
  const renumber = () => {
    cards().forEach((card, i) => {
      const id = card.dataset.hotel!;
      const rank = card.querySelector<HTMLElement>("[data-rank]");
      const pinRank = pin(id)?.querySelector<HTMLElement>("[data-pin-rank]");
      for (const el of [rank, pinRank]) {
        if (!el || el.textContent === String(i + 1)) continue;
        el.textContent = String(i + 1);
      }
    });
  };

  const sort = root.querySelector<HTMLElement>("[data-sort]");
  sort?.addEventListener("change", (event) => {
    const by = (event.target as HTMLInputElement).value as "distance" | "price";
    const epoch = ++sortEpoch;
    sorting = true;
    observer?.disconnect();
    list.dataset.sorting = "";
    const before = new Map(cards().map((c) => [c, c.getBoundingClientRect()]));
    sortAnimations.forEach((animation) => animation.cancel());
    sortAnimations = [];
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
    if (phone.matches) {
      const selected = sorted.find((card) => card.dataset.hotel === active);
      if (selected)
        list.scrollLeft = selected.offsetLeft - (list.clientWidth - selected.clientWidth) / 2;
    }
    renumber();
    if (!reduceMotion()) {
      sorted.forEach((card) => {
        const was = before.get(card)!;
        const now = card.getBoundingClientRect();
        const dx = was.left - now.left;
        const dy = was.top - now.top;
        if (!dx && !dy) return;
        sortAnimations.push(
          card.animate(
            [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "translate(0, 0)" }],
            { duration: 620, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
          ),
        );
      });
    }
    window.setTimeout(
      () => {
        if (epoch !== sortEpoch) return;
        sorting = false;
        delete list.dataset.sorting;
        sortAnimations = [];
        watchRail();
      },
      reduceMotion() ? 0 : 640,
    );
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

    /*
     * The card itself is tappable, but not everything on it behaves the
     * same: the two controls keep their own jobs, and on a phone a card that
     * is not the centred one comes to the middle first, so a tap never opens
     * something the guest was only bringing into view.
     */
    list.addEventListener("click", (event) => {
      const target = event.target as Element;
      const button = target.closest<HTMLElement>("[data-details]");
      if (button) return open(button.dataset.details!);
      if (target.closest("a, button")) return;
      const card = target.closest<HTMLElement>("[data-hotel]");
      if (!card) return;
      const id = card.dataset.hotel!;
      if (phone.matches && id !== active) {
        setActive(id);
        revealCard(id);
        return;
      }
      open(id);
    });
    /*
     * Push the sheet back down to dismiss it (phones only, where it rises
     * from the bottom edge). It follows the finger, and lets go if it has
     * been pushed far enough or thrown quickly enough; otherwise it settles
     * back. The close button, Escape and a tap outside are all untouched,
     * so this is one more way out rather than the only one. Reduced motion
     * keeps those and skips the drag.
     */
    const bottomSheet = window.matchMedia("(max-width: 719px)");
    let from = 0;
    let at = 0;
    let since = 0;
    let holding = -1;

    const mayDrag = (event: PointerEvent) => {
      if (holding !== -1 || event.pointerType === "mouse") return false;
      if (!bottomSheet.matches || reduceMotion()) return false;
      const target = event.target as Element;
      if (target.closest("a, button")) return false;
      // From the handle and the photograph always; from the body only once
      // it is scrolled to the top, so the drag never fights the scroller.
      return target.closest("[data-sheet-grab]") !== null || sheet.scrollTop <= 0;
    };

    const settle = () => {
      if (holding === -1) return;
      holding = -1;
      sheet.removeAttribute("data-dragging");
      sheet.style.transform = "";
      const thrown = at / Math.max(1, performance.now() - since) > 0.55;
      const far = at > Math.min(180, sheet.clientHeight * 0.26);
      at = 0;
      if (far || thrown) close();
    };

    sheet.addEventListener("pointerdown", (event) => {
      if (!mayDrag(event)) return;
      holding = event.pointerId;
      from = event.clientY;
      since = performance.now();
      at = 0;
    });

    sheet.addEventListener("pointermove", (event) => {
      if (event.pointerId !== holding) return;
      // Downwards only: dragging up should not lift the sheet off the edge.
      at = Math.max(0, event.clientY - from);
      sheet.dataset.dragging = "";
      sheet.style.transform = `translateY(${at.toFixed(1)}px)`;
    });

    sheet.addEventListener("pointerup", settle);
    sheet.addEventListener("pointercancel", settle);

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
      // A drag that settled back can land a click on the sheet itself; that
      // is not a tap on the backdrop.
      if (event.target === sheet && performance.now() - since > 400) close();
    });
  }

  root.dataset.enhanced = "";
  setActive(cards()[0]?.dataset.hotel ?? "");
}
