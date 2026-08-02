import { TOKEN_SCHEMA_VERSION, type WeddingTokens } from "./token-types";

export const fontChoices = {
  display: {
    "Cormorant Garamond": '"Cormorant Garamond", "Iowan Old Style", Georgia, serif',
    "Iowan Old Style": '"Iowan Old Style", "Palatino Linotype", Georgia, serif',
  },
  script: {
    Allura: 'Allura, "Segoe Script", cursive',
    "Segoe Script": '"Segoe Script", cursive',
  },
  ui: {
    "System UI": "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    Serif: 'Georgia, "Times New Roman", serif',
  },
} as const;

export const canonicalTokens: WeddingTokens = {
  schemaVersion: TOKEN_SCHEMA_VERSION,
  designSystemVersion: "0.1.0",
  colour: {
    paper: "#f7f3eb",
    paperDeep: "#eee7db",
    ink: "#171712",
    inkSoft: "#4a473f",
    sage: "#748b78",
    sageDeep: "#4f6857",
    sagePale: "#bdc9bc",
    champagne: "#c7ad82",
    lineOpacity: 0.18,
    lineStrongOpacity: 0.34,
    scrimOpacity: 0.42,
    focus: "#4f6857",
  },
  typography: {
    displayFamily: fontChoices.display["Cormorant Garamond"],
    scriptFamily: fontChoices.script.Allura,
    uiFamily: fontChoices.ui["System UI"],
    displayScale: 1,
    headingScale: 1,
    detailsScale: 1,
    bodyScale: 1,
    countdownScale: 1,
    tracking: 0,
    lineHeight: 1,
    uppercase: false,
    scriptEnabled: true,
  },
  composition: {
    name: "invitation",
    pagePadding: 32,
    contentMax: 1280,
    safeEdge: 24,
    splitRatio: 0.54,
    nameScale: 1,
    nameOrientation: "vertical",
    saveDateScale: 1,
    detailScale: 1,
    countdownScale: 1,
    primaryGap: 32,
    secondaryGap: 16,
    verticalBalance: 0,
    foliageInset: 0,
  },
  motion: {
    direction: "seam",
    localDuration: 220,
    controlFadeDuration: 480,
    seamPauseDuration: 180,
    seamDuration: 900,
    curtainDuration: 2400,
    contentDuration: 900,
    revealStagger: 140,
    sheetDuration: 720,
    scrimDuration: 480,
    providerDuration: 220,
    baseEasing: "cubic-bezier(0.22, 1, 0.36, 1)",
    physicalEasing: "cubic-bezier(0.2, 0.75, 0.25, 1)",
  },
  foliage: {
    enabled: true,
    density: 0.82,
    foregroundOpacity: 0.72,
    midgroundOpacity: 0.44,
    backgroundOpacity: 0.24,
    scale: 1,
    windSpeed: 1,
    swayAmplitude: 1,
    gustFrequency: 0.35,
    gustStrength: 0.65,
    depthSeparation: 1,
    foregroundVisible: true,
    midgroundVisible: true,
    backgroundVisible: true,
    seed: 20271024,
  },
  countdownStyle: "editorial",
  countdownSeconds: false,
};

export function cloneTokens(tokens: WeddingTokens = canonicalTokens): WeddingTokens {
  return structuredClone(tokens);
}

const hexPattern = /^#[0-9a-f]{6}$/i;

function finite(value: unknown, fallback: number, minimum: number, maximum: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(maximum, Math.max(minimum, value))
    : fallback;
}

function text(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 && value.length < 180
    ? value
    : fallback;
}

function hex(value: unknown, fallback: string): string {
  return typeof value === "string" && hexPattern.test(value) ? value.toLowerCase() : fallback;
}

export function sanitiseTokens(input: unknown): WeddingTokens {
  const raw = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const colour = (raw.colour ?? {}) as Record<string, unknown>;
  const typography = (raw.typography ?? {}) as Record<string, unknown>;
  const composition = (raw.composition ?? {}) as Record<string, unknown>;
  const motion = (raw.motion ?? {}) as Record<string, unknown>;
  const foliage = (raw.foliage ?? {}) as Record<string, unknown>;
  const c = canonicalTokens;
  const direction = ["seam", "paper", "botanical"].includes(String(motion.direction))
    ? (motion.direction as WeddingTokens["motion"]["direction"])
    : c.motion.direction;
  const compositionName = ["invitation", "editorial", "centre"].includes(String(composition.name))
    ? (composition.name as WeddingTokens["composition"]["name"])
    : c.composition.name;

  return {
    schemaVersion: TOKEN_SCHEMA_VERSION,
    designSystemVersion: text(raw.designSystemVersion, c.designSystemVersion),
    colour: {
      paper: hex(colour.paper, c.colour.paper),
      paperDeep: hex(colour.paperDeep, c.colour.paperDeep),
      ink: hex(colour.ink, c.colour.ink),
      inkSoft: hex(colour.inkSoft, c.colour.inkSoft),
      sage: hex(colour.sage, c.colour.sage),
      sageDeep: hex(colour.sageDeep, c.colour.sageDeep),
      sagePale: hex(colour.sagePale, c.colour.sagePale),
      champagne: hex(colour.champagne, c.colour.champagne),
      lineOpacity: finite(colour.lineOpacity, c.colour.lineOpacity, 0.04, 0.7),
      lineStrongOpacity: finite(colour.lineStrongOpacity, c.colour.lineStrongOpacity, 0.08, 0.9),
      scrimOpacity: finite(colour.scrimOpacity, c.colour.scrimOpacity, 0.1, 0.8),
      focus: hex(colour.focus, c.colour.focus),
    },
    typography: {
      displayFamily: text(typography.displayFamily, c.typography.displayFamily),
      scriptFamily: text(typography.scriptFamily, c.typography.scriptFamily),
      uiFamily: text(typography.uiFamily, c.typography.uiFamily),
      displayScale: finite(typography.displayScale, c.typography.displayScale, 0.7, 1.5),
      headingScale: finite(typography.headingScale, c.typography.headingScale, 0.7, 1.5),
      detailsScale: finite(typography.detailsScale, c.typography.detailsScale, 0.75, 1.35),
      bodyScale: finite(typography.bodyScale, c.typography.bodyScale, 0.8, 1.3),
      countdownScale: finite(typography.countdownScale, c.typography.countdownScale, 0.7, 1.5),
      tracking: finite(typography.tracking, c.typography.tracking, -0.08, 0.2),
      lineHeight: finite(typography.lineHeight, c.typography.lineHeight, 0.8, 1.8),
      uppercase:
        typeof typography.uppercase === "boolean" ? typography.uppercase : c.typography.uppercase,
      scriptEnabled:
        typeof typography.scriptEnabled === "boolean"
          ? typography.scriptEnabled
          : c.typography.scriptEnabled,
    },
    composition: {
      name: compositionName,
      pagePadding: finite(composition.pagePadding, c.composition.pagePadding, 12, 96),
      contentMax: finite(composition.contentMax, c.composition.contentMax, 680, 1680),
      safeEdge: finite(composition.safeEdge, c.composition.safeEdge, 8, 72),
      splitRatio: finite(composition.splitRatio, c.composition.splitRatio, 0.35, 0.7),
      nameScale: finite(composition.nameScale, c.composition.nameScale, 0.65, 1.6),
      nameOrientation: composition.nameOrientation === "horizontal" ? "horizontal" : "vertical",
      saveDateScale: finite(composition.saveDateScale, c.composition.saveDateScale, 0.7, 1.5),
      detailScale: finite(composition.detailScale, c.composition.detailScale, 0.75, 1.35),
      countdownScale: finite(composition.countdownScale, c.composition.countdownScale, 0.7, 1.5),
      primaryGap: finite(composition.primaryGap, c.composition.primaryGap, 12, 72),
      secondaryGap: finite(composition.secondaryGap, c.composition.secondaryGap, 8, 48),
      verticalBalance: finite(composition.verticalBalance, c.composition.verticalBalance, -20, 20),
      foliageInset: finite(composition.foliageInset, c.composition.foliageInset, -80, 120),
    },
    motion: {
      direction,
      localDuration: finite(motion.localDuration, c.motion.localDuration, 120, 400),
      controlFadeDuration: finite(
        motion.controlFadeDuration,
        c.motion.controlFadeDuration,
        120,
        1000,
      ),
      seamPauseDuration: finite(motion.seamPauseDuration, c.motion.seamPauseDuration, 0, 1200),
      seamDuration: finite(motion.seamDuration, c.motion.seamDuration, 160, 1600),
      curtainDuration: finite(motion.curtainDuration, c.motion.curtainDuration, 800, 4000),
      contentDuration: finite(motion.contentDuration, c.motion.contentDuration, 160, 1600),
      revealStagger: finite(motion.revealStagger, c.motion.revealStagger, 0, 400),
      sheetDuration: finite(motion.sheetDuration, c.motion.sheetDuration, 180, 1400),
      scrimDuration: finite(motion.scrimDuration, c.motion.scrimDuration, 120, 1000),
      providerDuration: finite(motion.providerDuration, c.motion.providerDuration, 120, 500),
      baseEasing: text(motion.baseEasing, c.motion.baseEasing),
      physicalEasing: text(motion.physicalEasing, c.motion.physicalEasing),
    },
    foliage: {
      enabled: typeof foliage.enabled === "boolean" ? foliage.enabled : c.foliage.enabled,
      density: finite(foliage.density, c.foliage.density, 0, 1),
      foregroundOpacity: finite(foliage.foregroundOpacity, c.foliage.foregroundOpacity, 0, 1),
      midgroundOpacity: finite(foliage.midgroundOpacity, c.foliage.midgroundOpacity, 0, 1),
      backgroundOpacity: finite(foliage.backgroundOpacity, c.foliage.backgroundOpacity, 0, 1),
      scale: finite(foliage.scale, c.foliage.scale, 0.5, 1.8),
      windSpeed: finite(foliage.windSpeed, c.foliage.windSpeed, 0.25, 2.5),
      swayAmplitude: finite(foliage.swayAmplitude, c.foliage.swayAmplitude, 0, 2),
      gustFrequency: finite(foliage.gustFrequency, c.foliage.gustFrequency, 0, 1),
      gustStrength: finite(foliage.gustStrength, c.foliage.gustStrength, 0, 1.5),
      depthSeparation: finite(foliage.depthSeparation, c.foliage.depthSeparation, 0, 2),
      foregroundVisible:
        typeof foliage.foregroundVisible === "boolean"
          ? foliage.foregroundVisible
          : c.foliage.foregroundVisible,
      midgroundVisible:
        typeof foliage.midgroundVisible === "boolean"
          ? foliage.midgroundVisible
          : c.foliage.midgroundVisible,
      backgroundVisible:
        typeof foliage.backgroundVisible === "boolean"
          ? foliage.backgroundVisible
          : c.foliage.backgroundVisible,
      seed: Math.round(finite(foliage.seed, c.foliage.seed, 1, 99999999)),
    },
    countdownStyle: raw.countdownStyle === "structured" ? "structured" : "editorial",
    countdownSeconds:
      typeof raw.countdownSeconds === "boolean" ? raw.countdownSeconds : c.countdownSeconds,
  };
}
