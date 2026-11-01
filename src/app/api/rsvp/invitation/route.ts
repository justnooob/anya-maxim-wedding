import 'server-only';
import {downloadInvitation} from '@/server/pdf/http.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export function GET(request:Request){return downloadInvitation(request);}
