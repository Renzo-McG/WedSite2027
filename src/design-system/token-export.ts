import { cssExport } from "./token-css";
import type { WeddingTokens } from "./token-types";

export function jsonExport(tokens: WeddingTokens): string {
  return `${JSON.stringify(tokens, null, 2)}\n`;
}

export function motionExport(tokens: WeddingTokens): string {
  return `${JSON.stringify(
    {
      schemaVersion: tokens.schemaVersion,
      designSystemVersion: tokens.designSystemVersion,
      activeContinuityDirection: tokens.motion.direction,
      durations: {
        local: tokens.motion.localDuration,
        openingControlFade: tokens.motion.controlFadeDuration,
        seamPause: tokens.motion.seamPauseDuration,
        seam: tokens.motion.seamDuration,
        curtain: tokens.motion.curtainDuration,
        content: tokens.motion.contentDuration,
        revealStagger: tokens.motion.revealStagger,
        sheet: tokens.motion.sheetDuration,
        scrim: tokens.motion.scrimDuration,
        provider: tokens.motion.providerDuration,
      },
      easing: {
        base: tokens.motion.baseEasing,
        physical: tokens.motion.physicalEasing,
      },
      foliage: tokens.foliage,
      reducedMotion: {
        spatialTravel: false,
        ambientFoliage: false,
        essentialState: "resolved immediately",
      },
      componentInteractionVariants: [
        "rest",
        "hover",
        "keyboard-focus",
        "pressed",
        "selected",
        "disabled",
        "confirmation",
        "error",
      ],
    },
    null,
    2,
  )}\n`;
}

export function markdownExport(tokens: WeddingTokens): string {
  return `# Emily & Lawrence Wedding Design System

- Design-system version: ${tokens.designSystemVersion}
- Schema version: ${tokens.schemaVersion}
- Exported: ${new Date().toISOString()}

## North star

> I have never seen a wedding website like this.

> This is beautifully understated.

## Palette

| Token | Value |
| --- | --- |
${Object.entries(tokens.colour)
  .map(([key, value]) => `| ${key} | ${value} |`)
  .join("\n")}

## Typography

- Display: ${tokens.typography.displayFamily}
- Script: ${tokens.typography.scriptFamily} (${tokens.typography.scriptEnabled ? "enabled" : "disabled"})
- UI: ${tokens.typography.uiFamily}
- Display scale: ${tokens.typography.displayScale}
- Tracking: ${tokens.typography.tracking}em

## Composition

- Direction: ${tokens.composition.name}
- Page padding: ${tokens.composition.pagePadding}px
- Content maximum: ${tokens.composition.contentMax}px
- Name orientation: ${tokens.composition.nameOrientation}

## Motion

- Invitation Continuity direction: ${tokens.motion.direction}
- Local response: ${tokens.motion.localDuration}ms
- Curtain: ${tokens.motion.curtainDuration}ms
- Sheet: ${tokens.motion.sheetDuration}ms
- Base easing: ${tokens.motion.baseEasing}

## Foliage

- Enabled: ${tokens.foliage.enabled}
- Density: ${tokens.foliage.density}
- Wind speed: ${tokens.foliage.windSpeed}
- Sway amplitude: ${tokens.foliage.swayAmplitude}
- Deterministic seed: ${tokens.foliage.seed}

## Accessibility decisions

- Explicit user input controls the invitation and calendar sheet.
- Reduced motion resolves state immediately and removes ambient foliage.
- Essential content exists in the static document.
- Interactive targets are designed for at least 44px.
- Countdown updates are not announced continuously.

## Unresolved decisions

- Final licensed display and script fonts.
- Final continuity direction after comparison.
- Final foliage artwork and density.
- Final desktop name orientation and mobile composition.
`;
}

export function exportBundle(tokens: WeddingTokens): Record<string, string> {
  return {
    "design-tokens.css": cssExport(tokens),
    "tokens.json": jsonExport(tokens),
    "motion-system.json": motionExport(tokens),
    "design-system-summary.md": markdownExport(tokens),
  };
}

export function downloadText(filename: string, contents: string): void {
  const blob = new Blob([contents], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
