import type { WeddingTokens } from "./token-types";

export function tokenCssVariables(tokens: WeddingTokens): Record<string, string> {
  const { colour: c, typography: t, composition: l, motion: m, foliage: f } = tokens;
  return {
    "--paper": c.paper,
    "--paper-deep": c.paperDeep,
    "--ink": c.ink,
    "--ink-soft": c.inkSoft,
    "--sage": c.sage,
    "--sage-deep": c.sageDeep,
    "--sage-pale": c.sagePale,
    "--champagne": c.champagne,
    "--line": `color-mix(in srgb, ${c.ink} ${c.lineOpacity * 100}%, transparent)`,
    "--line-strong": `color-mix(in srgb, ${c.ink} ${c.lineStrongOpacity * 100}%, transparent)`,
    "--scrim": `color-mix(in srgb, ${c.ink} ${c.scrimOpacity * 100}%, transparent)`,
    "--focus": c.focus,
    "--font-display": t.displayFamily,
    "--font-script": t.scriptFamily,
    "--font-ui": t.uiFamily,
    "--display-scale": String(t.displayScale),
    "--heading-scale": String(t.headingScale),
    "--details-scale": String(t.detailsScale),
    "--body-scale": String(t.bodyScale),
    "--countdown-scale": String(t.countdownScale),
    "--tracking": `${t.tracking}em`,
    "--type-leading": String(t.lineHeight),
    "--page-pad": `${l.pagePadding}px`,
    "--content-max": `${l.contentMax}px`,
    "--safe-edge": `${l.safeEdge}px`,
    "--split-ratio": String(l.splitRatio),
    "--name-scale": String(l.nameScale),
    "--save-date-scale": String(l.saveDateScale),
    "--detail-scale": String(l.detailScale),
    "--composition-countdown-scale": String(l.countdownScale),
    "--primary-gap": `${l.primaryGap}px`,
    "--secondary-gap": `${l.secondaryGap}px`,
    "--vertical-balance": `${l.verticalBalance}px`,
    "--foliage-inset": `${l.foliageInset}px`,
    "--duration-fast": `${m.localDuration}ms`,
    "--duration-control": `${m.controlFadeDuration}ms`,
    "--duration-seam-pause": `${m.seamPauseDuration}ms`,
    "--duration-seam": `${m.seamDuration}ms`,
    "--duration-curtain": `${m.curtainDuration}ms`,
    "--duration-content": `${m.contentDuration}ms`,
    "--reveal-stagger": `${m.revealStagger}ms`,
    "--duration-sheet": `${m.sheetDuration}ms`,
    "--duration-scrim": `${m.scrimDuration}ms`,
    "--duration-provider": `${m.providerDuration}ms`,
    "--ease-editorial": m.baseEasing,
    "--ease-physical": m.physicalEasing,
    "--foliage-density": String(f.density),
    "--foliage-foreground-opacity": String(f.foregroundOpacity),
    "--foliage-midground-opacity": String(f.midgroundOpacity),
    "--foliage-background-opacity": String(f.backgroundOpacity),
    "--foliage-scale": String(f.scale),
    "--wind-speed": String(f.windSpeed),
    "--sway-amplitude": String(f.swayAmplitude),
    "--gust-strength": String(f.gustStrength),
    "--depth-separation": String(f.depthSeparation),
  };
}

export function applyTokens(element: HTMLElement, tokens: WeddingTokens): void {
  for (const [name, value] of Object.entries(tokenCssVariables(tokens))) {
    element.style.setProperty(name, value);
  }
  element.dataset.continuity = tokens.motion.direction;
  element.dataset.composition = tokens.composition.name;
  element.dataset.nameOrientation = tokens.composition.nameOrientation;
  element.dataset.script = String(tokens.typography.scriptEnabled);
  element.dataset.uppercase = String(tokens.typography.uppercase);
  element.dataset.countdownStyle = tokens.countdownStyle;
  element.dataset.foliage = String(tokens.foliage.enabled);
  element.dataset.foliageForeground = String(tokens.foliage.foregroundVisible);
  element.dataset.foliageMidground = String(tokens.foliage.midgroundVisible);
  element.dataset.foliageBackground = String(tokens.foliage.backgroundVisible);
}

export function cssExport(tokens: WeddingTokens): string {
  const body = Object.entries(tokenCssVariables(tokens))
    .map(([name, value]) => `  ${name}: ${value};`)
    .join("\n");
  return `/* Emily & Lawrence Wedding Design System ${tokens.designSystemVersion} */\n:root {\n${body}\n}\n`;
}
