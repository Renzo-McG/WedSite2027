/**
 * Travel & Stay: links the orientation plot and the hotel list, so pointing
 * at or focusing either one shows where it is in the other. Pure enhancement:
 * without it the plot labels are ordinary in-page links and the list is
 * complete on its own.
 */

function initStayLinking(): void {
  const plot = document.querySelector<HTMLElement>("[data-stay-plot]");
  const list = document.querySelector<HTMLElement>("[data-stay-list]");
  if (!plot || !list) return;

  let active: string | null = null;

  const setActive = (id: string | null) => {
    if (id === active) return;
    active = id;
    plot.toggleAttribute("data-has-active", id !== null);
    plot
      .querySelectorAll<HTMLElement | SVGElement>("[data-stay-point], [data-stay-label]")
      .forEach((el) => {
        const key = el.getAttribute("data-stay-point") ?? el.getAttribute("data-stay-label");
        el.toggleAttribute("data-active", key === id);
      });
    list.querySelectorAll<HTMLElement>("[data-stay]").forEach((row) => {
      row.toggleAttribute("data-active", row.dataset.stay === id);
    });
  };

  const idFrom = (target: EventTarget | null): string | null => {
    if (!(target instanceof Element)) return null;
    const row = target.closest<HTMLElement>("[data-stay]");
    if (row) return row.dataset.stay ?? null;
    const label = target.closest<HTMLElement>("[data-stay-label]");
    return label?.dataset.stayLabel ?? null;
  };

  for (const root of [plot, list]) {
    root.addEventListener("pointerover", (event) => setActive(idFrom(event.target)));
    root.addEventListener("pointerleave", () => setActive(null));
    root.addEventListener("focusin", (event) => setActive(idFrom(event.target)));
    root.addEventListener("focusout", (event) => {
      if (!root.contains(event.relatedTarget as Node | null)) setActive(null);
    });
  }

  // A plot label jumps to its hotel; move focus there too so keyboard and
  // screen-reader users land on the details rather than just scrolling.
  plot.addEventListener("click", (event) => {
    const label = (event.target as Element).closest<HTMLAnchorElement>("[data-stay-label]");
    if (!label) return;
    const row = document.getElementById(`stay-${label.dataset.stayLabel}`);
    if (!row) return;
    event.preventDefault();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    row.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    row.focus({ preventScroll: true });
    history.replaceState(null, "", `#${row.id}`);
  });
}

initStayLinking();
