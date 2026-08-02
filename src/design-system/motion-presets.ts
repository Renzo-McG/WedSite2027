import type { ContinuityDirection, MotionMode } from "./token-types";

export const phases = [
  "closed",
  "control-active",
  "control-exiting",
  "seam-active",
  "panels-opening",
  "content-revealing",
  "composed",
  "sheet-opening",
  "sheet-open",
  "sheet-closing",
] as const;

export type OpeningPhase = (typeof phases)[number];

export interface ContinuityProfile {
  id: ContinuityDirection;
  name: string;
  rationale: string;
  communicates: string;
  strongest: string;
  risk: string;
  desktop: string;
  mobile: string;
  reduced: string;
}

export const continuityProfiles: ContinuityProfile[] = [
  {
    id: "seam",
    name: "Seam Continuity",
    rationale:
      "A fine seam makes the invitation opening and enclosure removal feel like one suite.",
    communicates: "Connection, precision and the physical logic of an invitation.",
    strongest: "The opening control, centre seam and Save The Date handover.",
    risk: "A travelling line can become decorative if it appears outside meaningful transitions.",
    desktop: "The vertical seam completes, panels part, then a short horizontal rule settles.",
    mobile: "A shorter seam and local rule preserve the gesture without dominating the screen.",
    reduced: "All related edges appear complete with no spatial travel.",
  },
  {
    id: "paper",
    name: "Paper Edge Continuity",
    rationale: "Layered masks and paper edges hand one physical surface into the next.",
    communicates: "Quiet tactility and the depth of a printed invitation suite.",
    strongest: "Panel opening and the calendar enclosure emerging from beneath the page plane.",
    risk: "Too much shadow or depth can make the suite feel like a generic modal.",
    desktop: "A paper edge reveals the composition and the sheet appears to slide from under it.",
    mobile: "The lower page edge becomes the principal cue, preserving usable space.",
    reduced: "Layer order and border contrast show the relationship immediately.",
  },
  {
    id: "botanical",
    name: "Botanical Continuity",
    rationale: "A controlled response in the nearest foliage layer cues each handover.",
    communicates: "Destination atmosphere, natural cause and effect, and gentle anticipation.",
    strongest: "Opening anticipation and the handover into the enclosure sheet.",
    risk: "The foliage can become theatrical or point like an arrow if over-emphasised.",
    desktop: "The nearest frond yields once as the panels and sheet resolve.",
    mobile: "One local foreground cluster responds; ambient layers remain secondary.",
    reduced: "A static framing change and edge emphasis retain the meaning.",
  },
];

export const motionModes: { id: MotionMode; label: string }[] = [
  { id: "normal", label: "Normal Motion" },
  { id: "reduced", label: "Reduced Motion" },
  { id: "static", label: "Static / No-JS" },
];
