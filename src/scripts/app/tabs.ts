/**
 * ARIA tabs with a sliding thumb (Akari IP-03). Without JavaScript every panel
 * is shown in order with its own heading; with it, one panel shows at a time,
 * the URL hash selects and records the tab, and arrow keys move between tabs.
 * Panels arrive from the side you moved towards, so the tabs read as places
 * side by side. A bubbling "tabchange" event lets each panel replay its story.
 */

function initTabs(root: HTMLElement): void {
  const list = root.querySelector<HTMLElement>("[data-tablist]");
  const tabs = [...root.querySelectorAll<HTMLButtonElement>("[role='tab']")];
  const panels = [...root.querySelectorAll<HTMLElement>("[data-panel]")];
  if (!list || tabs.length === 0) return;

  root.dataset.enhanced = "";
  let current = -1;

  const select = (id: string, { focus = false, record = true } = {}) => {
    const index = Math.max(
      0,
      tabs.findIndex((t) => t.dataset.tab === id),
    );
    const direction = current === -1 || index === current ? "" : index > current ? "next" : "prev";
    current = index;
    tabs.forEach((tab, i) => {
      const on = i === index;
      tab.setAttribute("aria-selected", String(on));
      tab.tabIndex = on ? 0 : -1;
    });
    panels.forEach((panel, i) => {
      panel.hidden = i !== index;
      if (i === index) panel.dataset.enter = direction;
    });
    list.style.setProperty("--index", String(index));
    if (focus) tabs[index]?.focus();
    if (record) history.replaceState(null, "", `#${tabs[index]?.dataset.tab}`);
    root.dispatchEvent(
      new CustomEvent("tabchange", { detail: tabs[index]?.dataset.tab, bubbles: true }),
    );
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => select(tab.dataset.tab!));
    tab.addEventListener("keydown", (event) => {
      const last = tabs.length - 1;
      const next =
        event.key === "ArrowRight"
          ? (i + 1) % tabs.length
          : event.key === "ArrowLeft"
            ? (i - 1 + tabs.length) % tabs.length
            : event.key === "Home"
              ? 0
              : event.key === "End"
                ? last
                : -1;
      if (next === -1) return;
      event.preventDefault();
      select(tabs[next]!.dataset.tab!, { focus: true });
    });
  });

  const fromHash = () => {
    const id = location.hash.slice(1);
    if (tabs.some((t) => t.dataset.tab === id)) select(id, { record: false });
  };
  window.addEventListener("hashchange", fromHash);
  const initial = location.hash.slice(1);
  select(tabs.some((t) => t.dataset.tab === initial) ? initial : tabs[0]!.dataset.tab!, {
    record: false,
  });
}

document.querySelectorAll<HTMLElement>("[data-tabs]").forEach(initTabs);
