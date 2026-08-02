import type { APIRoute } from "astro";
import { buildIcs } from "../lib/calendar";

/** Emitted as a static file at build time, so the download works without JavaScript. */
export const GET: APIRoute = () =>
  new Response(buildIcs(), {
    headers: { "Content-Type": "text/calendar; charset=utf-8" },
  });
