import { siteUrl } from "./site";

/** Approved invitation artwork, independent of the build host and base path. */
export const saveTheDateSocialImage = {
  url: new URL("assets/social/save-the-date-share.png", siteUrl).href,
  width: 1200,
  height: 630,
  type: "image/png",
  alt: "Emily & Lawrence Save the Date invitation",
} as const;
