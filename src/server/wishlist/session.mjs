import {validToken,sessionAge,hash} from '../rsvp/session.mjs';
export const wishlistCookie=process.env.NODE_ENV==='production'?'__Host-wedding_wishlist':'wedding_wishlist';
export function wishlistToken(request){const token=request.headers.get('cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith(wishlistCookie+'='))?.slice(wishlistCookie.length+1);return validToken(token)?token:null;}
export const wishlistCsrf=token=>hash('wishlist-csrf:'+token);
export const wishlistCookieHeader=token=>wishlistCookie+'='+token+'; Path=/; HttpOnly; SameSite=Lax; Max-Age='+sessionAge+(process.env.NODE_ENV==='production'?'; Secure':'');
