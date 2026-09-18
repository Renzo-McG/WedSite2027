/**
 * Before-you-fly checklist: remembers ticks on this device (best-effort) and
 * keeps the progress ring and count in step.
 */
const KEY = "guide:prep";

function read(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

function write(ids: string[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    /* storage unavailable: ticks last for this visit only */
  }
}

document.querySelectorAll<HTMLElement>("[data-prep]").forEach((root) => {
  const boxes = [...root.querySelectorAll<HTMLInputElement>("[data-prep-item]")];
  const count = root.querySelector<HTMLElement>("[data-prep-count]");
  const ring = root.querySelector<SVGCircleElement>("[data-prep-ring]");
  const saved = new Set(read());
  boxes.forEach((box) => (box.checked = saved.has(box.dataset.prepItem!)));

  const update = () => {
    const done = boxes.filter((b) => b.checked);
    if (count) count.textContent = String(done.length);
    ring?.style.setProperty("--progress", String((done.length / boxes.length) * 100));
    root.toggleAttribute("data-complete", done.length === boxes.length);
    write(done.map((b) => b.dataset.prepItem!));
  };

  boxes.forEach((box) => box.addEventListener("change", update));
  update();
});
