import { describe, expect, it } from "vitest";
import experienceSource from "../src/components/save-the-date/SaveTheDateExperience.astro?raw";
import invitationSource from "../src/components/save-the-date/InvitationContent.astro?raw";

describe("no-JavaScript invitation contract", () => {
  it("ships the invitation composed rather than blocked by the cover", () => {
    expect(experienceSource).toContain('data-phase="composed"');
  });

  it("keeps the primary content and calendar link in normal HTML", () => {
    expect(invitationSource).toContain("<h1");
    expect(invitationSource).toContain('href="#calendar-enclosure"');
    expect(invitationSource).toContain("Save to Calendar");
  });
});
