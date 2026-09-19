/**
 * The wedding window (components/trip/WeddingWindow.astro) assembles itself
 * the first time it is seen: the wedding day lands, Saturday and Monday close
 * in beside it, the bracket draws beneath. The choreography is CSS; this only
 * says when.
 */
import { whenSeen } from "./motion";

document.querySelectorAll<HTMLElement>("[data-window]").forEach((el) => {
  el.dataset.armed = "";
  whenSeen(el, () => el.setAttribute("data-seen", ""), 0.4);
});
