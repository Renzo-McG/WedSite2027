// Byte ranges for the Travel and Wedding films; see src/lib/video-range.ts.
import { onVideoRequest, type VideoFunctionContext } from "../../../../src/lib/video-range";

export const onRequest = (context: VideoFunctionContext) => onVideoRequest(context);
