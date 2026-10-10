// Byte ranges for the Save the Date film; see src/lib/video-range.ts.
import { onVideoRequest, type VideoFunctionContext } from "../../../../src/lib/video-range";

export const onRequest = (context: VideoFunctionContext) => onVideoRequest(context);
