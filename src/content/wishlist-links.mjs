const aliceBundlePaths = new Set([
 '/store/products/led-strip-3m-100343',
 '/store/products/led-strip-1m-100296',
]);

export function isGiftBundle(links) {
 if (links.length < 2) return false;

 // The existing editor preserves custom labels, so organizers can mark a set
 // explicitly without changing stored records or the link API shape.
 if (links.every(({label}) => /^Товар [1-8](?:\s*[:–—-]\s*.+)?$/iu.test(label.trim()))) return true;

 // Recognize the already published Alice kit by its two distinct components.
 if (links.length !== aliceBundlePaths.size) return false;
 const paths = new Set(links.map(({url}) => {
  try {
   const product = new URL(url);
   return product.origin === 'https://alice.yandex.ru' ? product.pathname.replace(/\/$/, '') : null;
  } catch {
   return null;
  }
 }));
 return [...aliceBundlePaths].every(path => paths.has(path));
}
