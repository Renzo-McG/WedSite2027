import { describe, expect, it } from "vitest";
import experienceSource from "../src/components/save-the-date/SaveTheDateExperience.astro?raw";
import invitationSource from "../src/components/save-the-date/InvitationContent.astro?raw";

describe("no-JavaScript invitation contract", () => {
  it("ships the invitation settled rather than blocked by the cover", () => {
    expect(experienceSource).toContain('data-entrance="still"');
  });

  it("keeps the primary content and calendar link in normal HTML", () => {
    expect(invitationSource).toContain("<h1");
    expect(invitationSource).toContain('href="#calendar-enclosure"');
    expect(invitationSource).toContain("Save to Calendar");
  });

  it("names the wedding website in full, so the destination is never a guess", () => {
    expect(invitationSource).toContain("Visit our wedding website");
    expect(invitationSource).toContain("WEDDING_WEBSITE_PATH");
  });

  it("keeps the spoken date alongside the three visual groups", () => {
    expect(invitationSource).toContain("visually-hidden");
    expect(invitationSource).toContain("wedding.date.display");
    expect(invitationSource).toContain("dateGroups");
  });
});
