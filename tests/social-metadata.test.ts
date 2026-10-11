// The project intentionally omits Node type declarations; Vitest runs this in Node.
// @ts-expect-error Node built-in types are not installed.
import { readFileSync } from "node:fs";
// @ts-expect-error Node built-in types are not installed.
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { saveTheDateSocialImage } from "../src/config/social";
import { siteUrl } from "../src/config/site";
import layout from "../src/layouts/BaseLayout.astro?raw";
import saveTheDate from "../src/components/save-the-date/SaveTheDatePage.astro?raw";
import website from "../src/components/app/WeddingWebsiteHome.astro?raw";

describe("Save the Date social preview", () => {
  it("uses the approved final-domain artwork independent of a legacy hosting path", () => {
    expect(saveTheDateSocialImage).toEqual({
      url: `${siteUrl}assets/social/save-the-date-share-v2.jpg`,
      width: 1200,
      height: 630,
      type: "image/jpeg",
      alt: "Emily & Lawrence Save the Date invitation",
    });
    expect(saveTheDateSocialImage.url).not.toContain("WedSite2027");
  });

  it("serves a compact 1200 x 630 JPEG that WhatsApp will thumbnail", () => {
    const jpeg = readFileSync(
      new URL("../public/assets/social/save-the-date-share-v2.jpg", import.meta.url),
    );
    expect(jpeg.subarray(0, 2).toString("hex")).toBe("ffd8");
    // Walk the segments to the frame header for the encoded size.
    let offset = 2;
    while (jpeg[offset] === 0xff && (jpeg[offset + 1] < 0xc0 || jpeg[offset + 1] > 0xc2)) {
      offset += 2 + jpeg.readUInt16BE(offset + 2);
    }
    expect(jpeg[offset + 1], "baseline or progressive frame").toBeGreaterThanOrEqual(0xc0);
    expect(jpeg.readUInt16BE(offset + 5)).toBe(630);
    expect(jpeg.readUInt16BE(offset + 7)).toBe(1200);
    expect(jpeg.length).toBeGreaterThan(50_000);
    expect(jpeg.length).toBeLessThan(300_000);
  });

  it("keeps the approved PNG master unchanged", () => {
    const png = readFileSync(
      new URL("../public/assets/social/save-the-date-share.png", import.meta.url),
    );
    expect(png.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
    expect(createHash("sha256").update(png).digest("hex")).toBe(
      "bdabc4ffc253f1e5b738decc7092b183d40d6c8a54a34c55d84f4dc7b5a134ad",
    );
  });

  it("attaches metadata to the shared Save the Date experience only", () => {
    expect(saveTheDate).toContain('const description = "Tap to open"');
    expect(saveTheDate).toContain("socialImage={saveTheDateSocialImage}");
    expect(saveTheDate).toContain("noindex");
    expect(website).not.toContain("saveTheDateSocialImage");
    expect(website).not.toContain("Tap to open");
    expect(layout).toContain('content={socialImage ? "summary_large_image" : "summary"}');
    for (const field of [
      "og:image",
      "og:image:width",
      "og:image:height",
      "og:image:type",
      "og:image:alt",
      "twitter:title",
      "twitter:description",
      "twitter:image",
      "twitter:image:alt",
    ]) {
      expect(layout).toContain(field);
    }
    expect(layout).not.toMatch(/twitter:(site|creator)/);
  });
});
