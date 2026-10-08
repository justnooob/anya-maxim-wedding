import "server-only";
import {getRsvp,postRsvp} from "@/server/rsvp/http.mjs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export function GET(request: Request) { return getRsvp(request); }
export function POST(request: Request) { return postRsvp(request); }
