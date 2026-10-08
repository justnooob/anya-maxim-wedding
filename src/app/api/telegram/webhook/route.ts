import "server-only";
import {webhook} from "@/server/telegram/webhook.mjs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const POST = webhook;
