import 'server-only';
import {wishlistAdminRequest} from '@/server/wishlist/http.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export function GET(request:Request){return wishlistAdminRequest(request);}
export function POST(request:Request){return wishlistAdminRequest(request);}
