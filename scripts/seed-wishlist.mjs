import {database} from '../src/server/db/index.mjs';
import {seedInitialWishlist} from '../src/server/wishlist/seed.mjs';
import {seedWishlistCatalogue} from '../src/server/wishlist/catalog-seed.mjs';
let source;
try{
 source=database();const result=await seedInitialWishlist(source);
 console.log(result.applied?`Wishlist initial seed applied: ${result.total} items, ${result.published} published, ${result.drafts} drafts.`:'Wishlist initial seed already applied. Existing records unchanged.');
 const catalogue=await seedWishlistCatalogue(source);
 console.log(catalogue.applied?`Wishlist catalogue v2 applied: ${catalogue.created} created, ${catalogue.updated} updated, ${catalogue.preserved} preserved.`:'Wishlist catalogue v2 already applied. Existing records unchanged.');
}catch{console.error('Wishlist seed failed. Check database connection and pending migrations. Sensitive details hidden.');process.exitCode=1;}
finally{if(source)await source.end();}
