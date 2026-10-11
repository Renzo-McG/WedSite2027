import { siteUrl } from "./site";

/**
 * Approved invitation artwork, independent of the build host and base path.
 * A compact JPEG of the approved PNG (save-the-date-share.png, kept as the
 * master): WhatsApp shows no thumbnail for the 711 KB PNG.
 */
export const saveTheDateSocialImage = {
  url: new URL("assets/social/save-the-date-share-v2.jpg", siteUrl).href,
  width: 1200,
  height: 630,
  type: "image/jpeg",
  alt: "Emily & Lawrence Save the Date invitation",
} as const;
