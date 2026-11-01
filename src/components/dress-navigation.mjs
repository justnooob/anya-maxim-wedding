// Gallery positions are shared by the page, floating controls and dialog.
export function nextLookIndex(index, delta, count, loop = true) {
 if (!count) return 0;
 return loop ? ((index + delta) % count + count) % count : Math.max(0, Math.min(count - 1, index + delta));
}

export function scrollIntent(previous, delta) {
 if (Math.abs(delta) <= 2) return previous;
 const direction = Math.sign(delta);
 const distance = previous.direction === direction ? previous.distance + Math.abs(delta) : Math.abs(delta);
 return {direction, distance, expanded: distance >= 32 ? direction < 0 : previous.expanded};
}
