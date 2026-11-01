import Link from 'next/link';
import {wishlistCopy} from '@/content/wishlist.mjs';
export function WishlistTeaser(){const copy=wishlistCopy.teaser;return <section className="wishlist-teaser chapter" id="gifts" aria-labelledby="gifts-title"><span className="chapter-kicker">{copy.eyebrow}</span><h2 id="gifts-title">{copy.title}</h2><p>{copy.text}</p><Link href="/wishlist">{copy.cta}<span aria-hidden="true">↗</span></Link></section>;}
