/**
 * Arriving (components/travel/ArrivalPanel.astro): a plane lands along the
 * real runway, then a car sets off for Shangri-La and the drive line draws
 * behind it, then the distance lands on the line. Plays when the panel is
 * first seen and again whenever its tab is opened.
 */
import { ease, reduceMotion, tween, whenSeen, type Tween } from "./motion";

const root = document.querySelector<HTMLElement>("[data-arrive]");

if (root) {
  const map = root.querySelector<HTMLElement>("[data-map]")!;
  const plane = root.querySelector<HTMLElement>(".arrive__plane")!;
  const car = root.querySelector<HTMLElement>("[data-car]")!;
  const drive = root.querySelector<SVGPathElement>("[data-drive]")!;
  const label = root.querySelector<HTMLElement>("[data-drive-label]")!;
  const svg = drive.ownerSVGElement!;
  const [fx, fy] = plane.dataset.landFrom!.split(",").map(Number) as [number, number];
  const [tx, ty] = plane.dataset.landTo!.split(",").map(Number) as [number, number];
  let running: Tween[] = [];

  const at = (xPct: number, yPct: number) =>
    `translate(${(xPct / 100) * map.clientWidth}px, ${(yPct / 100) * map.clientHeight}px)`;

  const play = async () => {
    running.forEach((t) => t.cancel());
    root.dataset.played = "";
    root.removeAttribute("data-driven");
    label.removeAttribute("data-on");
    const vb = svg.viewBox.baseVal;
    const length = drive.getTotalLength();

    // 1. Touchdown: the plane glides in, settles onto the runway and rolls out.
    const land = tween(
      1500,
      (p) => {
        const x = fx + (tx - fx) * p;
        const y = fy + (ty - fy) * p;
        plane.style.transform = `${at(x, y)} rotate(calc(var(--heading) + 90deg))`;
        plane.style.setProperty("--alt", String(Math.max(0, 1 - p * 1.6)));
        plane.style.opacity = String(Math.min(1, p * 5));
      },
      ease.out,
    );
    drive.style.strokeDashoffset = "1";
    car.style.opacity = "0";
    running = [land];
    if (!(await land.finished)) return;

    // 2. The drive: the car leads, the line follows.
    const go = tween(
      1600,
      (p) => {
        const point = drive.getPointAtLength(length * p);
        car.style.opacity = "1";
        car.style.transform = `translate(${((point.x - vb.x) / vb.width) * map.clientWidth}px, ${((point.y - vb.y) / vb.height) * map.clientHeight}px)`;
        drive.style.strokeDashoffset = String(1 - p);
      },
      ease.inOut,
      reduceMotion() ? 0 : 150,
    );
    running = [go];
    if (!(await go.finished)) return;
    root.dataset.driven = "";
    label.dataset.on = "";
  };

  whenSeen(root, () => void play(), 0.3);
  document.addEventListener("tabchange", (event) => {
    if ((event as CustomEvent<string>).detail === "arriving" && root.hasAttribute("data-played")) {
      void play();
    }
  });
  root.dataset.enhanced = "";
}
