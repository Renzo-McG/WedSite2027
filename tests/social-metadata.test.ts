// The project intentionally omits Node type declarations; Vitest runs this in Node.
// @ts-expect-error Node built-in types are not installed.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { saveTheDateSocialImage } from "../src/config/social";
import { siteUrl } from "../src/config/site";
import layout from "../src/layouts/BaseLayout.astro?raw";
import saveTheDate from "../src/components/save-the-date/SaveTheDatePage.astro?raw";
import website from "../src/components/app/WeddingWebsiteHome.astro?raw";

describe("Save the Date social preview", () => {
  it("uses the approved final-domain artwork independent of a legacy hosting path", () => {
    expect(saveTheDateSocialImage).toEqual({
      url: `${siteUrl}assets/social/save-the-date-share.png`,
      width: 1200,
      height: 630,
      type: "image/png",
      alt: "Emily & Lawrence Save the Date invitation",
    });
    expect(saveTheDateSocialImage.url).not.toContain("WedSite2027");

    const png = readFileSync(
      new URL("../public/assets/social/save-the-date-share.png", import.meta.url),
    );
    expect(png.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
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
