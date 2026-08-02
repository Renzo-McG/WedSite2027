import { canonicalTokens, cloneTokens, sanitiseTokens } from "./tokens";
import type { WeddingTokens } from "./token-types";

export interface TokenPreset {
  id: string;
  name: string;
  description: string;
  tokens: WeddingTokens;
}

function preset(
  id: string,
  name: string,
  description: string,
  overrides: Partial<WeddingTokens>,
): TokenPreset {
  const base = cloneTokens();
  const merged = {
    ...base,
    ...overrides,
    colour: { ...base.colour, ...overrides.colour },
    typography: { ...base.typography, ...overrides.typography },
    composition: { ...base.composition, ...overrides.composition },
    motion: { ...base.motion, ...overrides.motion },
    foliage: { ...base.foliage, ...overrides.foliage },
  };
  return { id, name, description, tokens: sanitiseTokens(merged) };
}

export const builtInPresets: TokenPreset[] = [
  {
    id: "canonical",
    name: "Canonical v0.1",
    description: "The approved working values from the wedding token source.",
    tokens: cloneTokens(canonicalTokens),
  },
  preset("softer", "Softer", "Gentler contrast, airier type, quieter foliage.", {
    colour: { ...canonicalTokens.colour, ink: "#282720", inkSoft: "#5d594f" },
    typography: { ...canonicalTokens.typography, tracking: 0.018, lineHeight: 1.08 },
    foliage: { ...canonicalTokens.foliage, foregroundOpacity: 0.56, swayAmplitude: 0.75 },
  }),
  preset("contrast", "Higher Contrast", "Crisper ink and more assertive interaction edges.", {
    colour: { ...canonicalTokens.colour, ink: "#0e0e0b", lineStrongOpacity: 0.52 },
    typography: { ...canonicalTokens.typography, displayScale: 1.05 },
  }),
  preset("editorial", "Editorial Large Type", "Larger names with a bolder editorial split.", {
    typography: { ...canonicalTokens.typography, displayScale: 1.18, tracking: -0.015 },
    composition: {
      ...canonicalTokens.composition,
      name: "editorial",
      nameScale: 1.24,
      splitRatio: 0.6,
    },
  }),
  preset("botanical", "Reduced Botanical", "A calmer, more typographic frame.", {
    foliage: {
      ...canonicalTokens.foliage,
      density: 0.45,
      foregroundOpacity: 0.44,
      midgroundOpacity: 0.28,
      backgroundOpacity: 0.14,
    },
  }),
];
