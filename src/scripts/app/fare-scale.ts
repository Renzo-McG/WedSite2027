/**
 * The fare scale (components/travel/FareScale.astro): keeps every price tag
 * readable at any width. Tags start stacked by price (CSS, no JS needed) as
 * a reasonable default; this measures what actually rendered and only pushes
 * a tag onto a new level when it would truly overlap one already placed
 * there, so narrow widths get more stagger and wide ones get less. A tag
 * that would spill past the track's edge is nudged back inside it; the
 * leader line stays put, since it belongs to the marker, not the tag.
 */

const track = document.querySelector<HTMLElement>("[data-fare-track]");
const scale = track?.closest<HTMLElement>("[data-fare-scale]");

if (track && scale) {
  const dots = [...track.querySelectorAll<HTMLElement>(".fare-scale__dot")];
  const ROW_GAP = 10;
  const ROW_PAD = 8;

  const layout = () => {
    const trackWidth = track.clientWidth;
    if (!trackWidth) return;
    const trackLeft = track.getBoundingClientRect().left;

    const items = dots.map((dot) => {
      const tag = dot.querySelector<HTMLElement>("[data-fare-tag]")!;
      const dotRect = dot.getBoundingClientRect();
      const tagRect = tag.getBoundingClientRect();
      return {
        dot,
        center: dotRect.left + dotRect.width / 2 - trackLeft,
        width: tagRect.width,
        height: tagRect.height,
      };
    });

    // Greedy left-to-right stacking: walk tags by their marker position and
    // give each the lowest level whose last occupant clears it by ROW_GAP.
    const levelRight: number[] = [];
    let maxLevel = 0;
    [...items]
      .sort((a, b) => a.center - b.center)
      .forEach((item) => {
        const left = item.center - item.width / 2;
        let level = 0;
        while (levelRight[level] !== undefined && levelRight[level]! + ROW_GAP > left) level++;
        levelRight[level] = item.center + item.width / 2;
        maxLevel = Math.max(maxLevel, level);
        item.dot.style.setProperty("--row", String(level));
      });

    const rowHeight = Math.max(...items.map((item) => item.height)) + ROW_PAD;
    scale.style.setProperty("--fs-row-h", `${rowHeight}px`);
    scale.style.setProperty("--fs-rows", String(maxLevel + 1));

    // Keep every tag inside the track without moving its stem off the marker.
    items.forEach((item) => {
      const half = item.width / 2;
      const min = half;
      const max = Math.max(half, trackWidth - half);
      const clamped = Math.min(Math.max(item.center, min), max);
      item.dot.style.setProperty("--fs-shift", `${clamped - item.center}px`);
    });
  };

  layout();
  window.addEventListener("resize", layout);
  document.addEventListener("tabchange", (event) => {
    if ((event as CustomEvent<string>).detail === "flights") layout();
  });
}
