export const TOKEN_SCHEMA_VERSION = 1 as const;

export type ContinuityDirection = "seam" | "paper" | "botanical";
export type CompositionName = "invitation" | "editorial" | "centre";
export type CountdownStyle = "editorial" | "structured";
export type MotionMode = "normal" | "reduced" | "static";

export interface ColourTokens {
  paper: string;
  paperDeep: string;
  ink: string;
  inkSoft: string;
  sage: string;
  sageDeep: string;
  sagePale: string;
  champagne: string;
  lineOpacity: number;
  lineStrongOpacity: number;
  scrimOpacity: number;
  focus: string;
}

export interface TypographyTokens {
  displayFamily: string;
  scriptFamily: string;
  uiFamily: string;
  displayScale: number;
  headingScale: number;
  detailsScale: number;
  bodyScale: number;
  countdownScale: number;
  tracking: number;
  lineHeight: number;
  uppercase: boolean;
  scriptEnabled: boolean;
}

export interface CompositionTokens {
  name: CompositionName;
  pagePadding: number;
  contentMax: number;
  safeEdge: number;
  splitRatio: number;
  nameScale: number;
  nameOrientation: "vertical" | "horizontal";
  saveDateScale: number;
  detailScale: number;
  countdownScale: number;
  primaryGap: number;
  secondaryGap: number;
  verticalBalance: number;
  foliageInset: number;
}

export interface MotionTokens {
  direction: ContinuityDirection;
  localDuration: number;
  controlFadeDuration: number;
  seamPauseDuration: number;
  seamDuration: number;
  curtainDuration: number;
  contentDuration: number;
  revealStagger: number;
  sheetDuration: number;
  scrimDuration: number;
  providerDuration: number;
  baseEasing: string;
  physicalEasing: string;
}

export interface FoliageTokens {
  enabled: boolean;
  density: number;
  foregroundOpacity: number;
  midgroundOpacity: number;
  backgroundOpacity: number;
  scale: number;
  windSpeed: number;
  swayAmplitude: number;
  gustFrequency: number;
  gustStrength: number;
  depthSeparation: number;
  foregroundVisible: boolean;
  midgroundVisible: boolean;
  backgroundVisible: boolean;
  seed: number;
}

export interface WeddingTokens {
  schemaVersion: typeof TOKEN_SCHEMA_VERSION;
  designSystemVersion: string;
  colour: ColourTokens;
  typography: TypographyTokens;
  composition: CompositionTokens;
  motion: MotionTokens;
  foliage: FoliageTokens;
  countdownStyle: CountdownStyle;
  countdownSeconds: boolean;
}

export type TokenPath =
  | `colour.${keyof ColourTokens}`
  | `typography.${keyof TypographyTokens}`
  | `composition.${keyof CompositionTokens}`
  | `motion.${keyof MotionTokens}`
  | `foliage.${keyof FoliageTokens}`
  | "countdownStyle"
  | "countdownSeconds";
