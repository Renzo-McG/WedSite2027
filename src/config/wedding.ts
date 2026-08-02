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
} as const;

export type Wedding = typeof wedding;
