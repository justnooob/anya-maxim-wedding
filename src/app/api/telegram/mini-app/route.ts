import "server-only";
import {miniAppRequest} from "@/server/telegram/mini-app.mjs";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const GET=(request:Request)=>miniAppRequest(request);
export const POST=(request:Request)=>miniAppRequest(request);
