/**
 * The films guests play, with their exact sizes in bytes.
 *
 * Inside a Pages Function the deployed-asset binding returns the file without
 * a Content-Length header, so the byte-range Function (src/lib/video-range.ts)
 * takes each film's length from here. tests/video-range.test.ts fails if a film
 * is added, removed or re-encoded without updating this list and
 * public/_routes.json.
 */
export const filmSizes: Readonly<Record<string, number>> = {
  "/assets/stage/video/venue-ocean-pavilion.mp4": 10_203_157,
  "/assets/guide/film/pavilion-coast.mp4": 693_154,
  "/assets/guide/film/pavilion-approach.mp4": 680_890,
};
