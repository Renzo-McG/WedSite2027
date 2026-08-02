import type { OpeningPhase } from "./motion-presets";
import type { MotionMode, WeddingTokens } from "./token-types";

export const PROTOCOL = "wedding-design-lab" as const;
export const PROTOCOL_VERSION = 1 as const;

export type MotionAction =
  | "OPEN"
  | "REPLAY"
  | "PAUSE"
  | "RESUME"
  | "STEP_BACK"
  | "STEP_FORWARD"
  | "OPEN_SHEET"
  | "CLOSE_SHEET";

export type LabMessage =
  | { protocol: typeof PROTOCOL; version: typeof PROTOCOL_VERSION; type: "LAB_READY" }
  | {
      protocol: typeof PROTOCOL;
      version: typeof PROTOCOL_VERSION;
      type: "TOKENS_UPDATE";
      payload: WeddingTokens;
    }
  | {
      protocol: typeof PROTOCOL;
      version: typeof PROTOCOL_VERSION;
      type: "MOTION_COMMAND";
      payload: { action: MotionAction; phase?: OpeningPhase; speed?: number; mode?: MotionMode };
    }
  | {
      protocol: typeof PROTOCOL;
      version: typeof PROTOCOL_VERSION;
      type: "VIEWPORT_MODE";
      payload: { width: number; height: number; scale: number };
    };

export type PreviewMessage =
  | { protocol: typeof PROTOCOL; version: typeof PROTOCOL_VERSION; type: "PREVIEW_READY" }
  | {
      protocol: typeof PROTOCOL;
      version: typeof PROTOCOL_VERSION;
      type: "PREVIEW_STATE";
      payload: { phase: OpeningPhase; elapsed: number; paused: boolean; speed: number };
    }
  | {
      protocol: typeof PROTOCOL;
      version: typeof PROTOCOL_VERSION;
      type: "ERROR_REPORT";
      payload: { code: string; message: string };
    };

export function envelope(type: LabMessage["type"], payload?: unknown): LabMessage {
  return {
    protocol: PROTOCOL,
    version: PROTOCOL_VERSION,
    type,
    ...(payload === undefined ? {} : { payload }),
  } as LabMessage;
}

export function isProtocolMessage(value: unknown): value is LabMessage | PreviewMessage {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    candidate.protocol === PROTOCOL &&
    candidate.version === PROTOCOL_VERSION &&
    typeof candidate.type === "string" &&
    [
      "LAB_READY",
      "PREVIEW_READY",
      "TOKENS_UPDATE",
      "MOTION_COMMAND",
      "VIEWPORT_MODE",
      "PREVIEW_STATE",
      "ERROR_REPORT",
    ].includes(candidate.type)
  );
}
