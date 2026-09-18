/**
 * Stay: the hotel cards and the map are one state (Akari IP-03).
 *
 * - Desktop: pointing at or focusing a card, or pressing "Show on map",
 *   activates it; pressing a pin activates and reveals its card.
 * - Phones: the cards form a horizontal rail under the map, and whichever card
 *   is centred is the active one, so control and result stay in one view.
 * - Sorting reorders the real DOM (so focus order matches what you see),
 *   animates the move (FLIP), and resets the rail to the start.
 */

const root = document.querySelector<HTMLElement>("[data-stay]");

if (root) {
  const list = root.querySelector<HTMLElement>("[data-hotels]")!;
  const map = root.querySelector<HTMLElement>("[data-stay-map]")!;
  const status = root.querySelector<HTMLElement>("[data-sort-status]");
  const pager = root.querySelector<HTMLElement>("[data-pager-index]");
  const cards = () => [...list.querySelectorAll<HTMLElement>("[data-hotel]")];
  const phone = window.matchMedia("(max-width: 1023px)");
  const reduce = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    document.documentElement.hasAttribute("data-reduced-motion");

  let active = "";

  const setActive = (id: string) => {
    if (!id || id === active) return;
    active = id;
    cards().forEach((card) => card.toggleAttribute("data-active", card.dataset.hotel === id));
    map.querySelectorAll<HTMLElement>("[data-pin]").forEach((pin) => {
      const on = pin.dataset.pin === id;
      pin.setAttribute("aria-pressed", String(on));
      pin.toggleAttribute("data-active", on);
    });
    map.querySelectorAll<SVGPathElement>("[data-link]").forEach((path) => {
      path.toggleAttribute("data-active", path.dataset.link === id);
    });
    map.querySelectorAll<HTMLElement>("[data-link-label]").forEach((label) => {
      label.toggleAttribute("data-active", label.dataset.linkLabel === id);
    });
    map.dataset.active = id;
    const index = cards().findIndex((c) => c.dataset.hotel === id);
    if (pager && index >= 0) pager.textContent = String(index + 1);
  };

  const revealCard = (id: string) => {
    const card = cards().find((c) => c.dataset.hotel === id);
    if (!card) return;
    const behavior: ScrollBehavior = reduce() ? "auto" : "smooth";
    if (phone.matches) {
      list.scrollTo({ left: card.offsetLeft - list.offsetLeft - 16, behavior });
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

  // "Show on map" on any card; on phones the map sits above the rail.
  list.addEventListener("click", (event) => {
    const button = (event.target as Element).closest<HTMLElement>("[data-show-on-map]");
    if (!button) return;
    setActive(button.dataset.showOnMap!);
    if (phone.matches) {
      map.scrollIntoView({ block: "start", behavior: reduce() ? "auto" : "smooth" });
    }
  });

  // Pins.
  map.addEventListener("click", (event) => {
    const pin = (event.target as Element).closest<HTMLElement>("[data-pin]");
    if (!pin) return;
    setActive(pin.dataset.pin!);
    revealCard(pin.dataset.pin!);
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
      { root: list, threshold: [0.6, 0.8, 1] },
    );
    cards().forEach((card) => observer!.observe(card));
  };
  phone.addEventListener("change", watchRail);
  watchRail();

  // Sorting: reorder the DOM, animate the move, reset the rail.
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
    list.scrollTo({ left: 0 });
    if (!reduce()) {
      sorted.forEach((card, i) => {
        const was = before.get(card)!;
        const now = card.getBoundingClientRect();
        const dx = was.left - now.left;
        const dy = was.top - now.top;
        if (!dx && !dy) return;
        card.animate(
          [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "translate(0, 0)" }],
          { duration: 420, delay: i * 25, easing: "cubic-bezier(0.77, 0, 0.175, 1)" },
        );
      });
    }
    const first = sorted[0]?.dataset.hotel;
    if (first) {
      active = "";
      setActive(first);
    }
  });

  root.dataset.enhanced = "";
  setActive(cards()[0]?.dataset.hotel ?? "");
}
