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
     * Temporary AI-generated concept imagery. It is NOT a photograph of
     * Shangri-La Mactan and must never be presented as one. To replace it, drop
     * an approved or licensed destination photograph at this path — no code
     * change is needed. If the file is missing the gradient stage still renders.
     */
    image: "assets/stage/philippines-concept.webp",
    temporary: true,
    /**
     * Temporary atmospheric concept footage. These clips are not venue or
     * documentary imagery. Per-clip crop and grade values are intentionally
     * centralised so visual QA can tune the family without CSS exceptions.
     */
    videos: [
      {
        id: "1",
        src: "assets/stage/video/philippines-01.mp4",
        poster: "assets/stage/video/philippines-01-poster.webp",
        durationSeconds: 18,
        desktopPosition: "50% 50%",
        mobilePosition: "56% 50%",
        overlayStrength: 0.48,
        brightness: 0.88,
        saturation: 0.84,
        playbackRate: 1,
      },
      {
        id: "2",
        src: "assets/stage/video/philippines-02.mp4",
        poster: "assets/stage/video/philippines-02-poster.webp",
        durationSeconds: 14.8,
        desktopPosition: "50% 48%",
        mobilePosition: "58% 50%",
        overlayStrength: 0.44,
        brightness: 0.94,
        saturation: 0.84,
        playbackRate: 0.82,
      },
      {
        id: "3",
        src: "assets/stage/video/philippines-03.mp4",
        poster: "assets/stage/video/philippines-03-poster.webp",
        durationSeconds: 19.066667,
        desktopPosition: "50% 52%",
        mobilePosition: "50% 52%",
        overlayStrength: 0.48,
        brightness: 0.92,
        saturation: 0.82,
        playbackRate: 0.95,
      },
      {
        id: "4",
        src: "assets/stage/video/philippines-04.mp4",
        poster: "assets/stage/video/philippines-04-poster.webp",
        durationSeconds: 18,
        desktopPosition: "50% 50%",
        mobilePosition: "62% 50%",
        overlayStrength: 0.5,
        brightness: 0.88,
        saturation: 0.82,
        playbackRate: 1,
      },
    ],
  },
} as const;

export type Wedding = typeof wedding;
