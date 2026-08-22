/**
 * Single source of truth for the public Save the Date and every calendar export.
 */

export const wedding = {
  couple: {
    first: "Emily",
    second: "Lawrence",
  },
  cue: "Save the Date",
  date: {
    display: "Sunday, 24 October 2027",
    iso: "2027-10-24",
    /**
     * A ceremony time has not been confirmed, so the countdown targets midnight
     * at the start of the wedding day in the Philippines. The calendar entry
     * stays an all-day event until a time is agreed.
     */
    countdownTarget: "2027-10-24T00:00:00+08:00",
    resolved: "24 October 2027",
    timezone: "Asia/Manila",
  },
  venue: "Shangri-La Mactan",
  location: "Cebu, Philippines",
  note: "Formal invitation to follow",
  calendar: {
    title: "Emily & Lawrence — Wedding",
    description: "Emily and Lawrence's wedding. Formal invitation to follow.",
    fileName: "emily-lawrence-wedding.ics",
    /** Stable across builds so re-importing updates the event instead of duplicating it. */
    uid: "20271024-wedding@emilyandlawrence.com",
    stamp: "20260802T120000Z",
  },
  stage: {
    /**
     * Fallback still for the stage. This is the Ocean Pavilion poster — the
     * first frame of the venue film, graded identically — so a blocked or
     * failed video degrades to the same picture rather than to unrelated art.
     * It is also what renders without JavaScript. If the file is missing the
     * gradient stage still renders.
     */
    image: "assets/stage/video/venue-ocean-pavilion-poster.webp",
    temporary: false,
    /**
     * Authentic venue footage: the Ocean Pavilion at Shangri-La Mactan, cut
     * from the resort's own Event Spaces film. This is real imagery of the
     * wedding location and is not concept or AI-generated material. Crop and
     * grade values are centralised here so visual QA can tune the stage
     * without CSS exceptions.
     */
    videos: [
      {
        id: "ocean-pavilion",
        src: "assets/stage/video/venue-ocean-pavilion.mp4",
        poster: "assets/stage/video/venue-ocean-pavilion-poster.webp",
        durationSeconds: 19.269,
        desktopPosition: "50% 47%",
        mobilePosition: "52% 50%",
        overlayStrength: 0.46,
        brightness: 0.95,
        saturation: 0.94,
        playbackRate: 1,
      },
    ],
  },
} as const;

export type Wedding = typeof wedding;
