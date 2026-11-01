import 'server-only';
import {wishlistRequest} from '@/server/wishlist/http.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export function GET(request:Request){return wishlistRequest(request);}
export function POST(request:Request){return wishlistRequest(request);}
