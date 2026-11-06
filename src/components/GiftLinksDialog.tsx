import {useEffect, useRef} from 'react';
import {trapDialogFocus} from '@/client/dialog-focus';
import type {Gift} from './Wishlist';

export function GiftLinksDialog({item, close}: {item: Gift; close: () => void}) {
 const dialog = useRef<HTMLDialogElement>(null);
 const swipe = useRef<{x: number; y: number} | null>(null);

 useEffect(() => {
  const element = dialog.current;
  const previous = document.activeElement;
  const overflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  element?.showModal();
  return () => {
   element?.close();
   document.body.style.overflow = overflow;
   if (previous instanceof HTMLElement && previous.isConnected) previous.focus({preventScroll: true});
  };
 }, []);

 return <dialog ref={dialog} className="gift-dialog gift-links-dialog" aria-labelledby="gift-links-title"
  onKeyDown={trapDialogFocus}
  onCancel={event => {event.preventDefault(); close();}}
  onClick={event => {
   if (event.target !== event.currentTarget) return;
   const bounds = event.currentTarget.getBoundingClientRect();
   if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close();
  }}
  onTouchStart={event => {
   const point = event.touches[0];
   swipe.current = event.touches.length === 1 && event.currentTarget.scrollTop <= 0 && matchMedia('(max-width: 600px)').matches
    ? {x: point.clientX, y: point.clientY} : null;
  }}
  onTouchCancel={() => {swipe.current = null;}}
  onTouchEnd={event => {
   const start = swipe.current;
   swipe.current = null;
   const point = event.changedTouches[0];
   if (!start || !point || event.touches.length) return;
   const distance = point.clientY - start.y;
   if (distance >= 60 && distance > Math.abs(point.clientX - start.x) * 1.5) close();
  }}>
  <button type="button" className="gift-dialog-close" aria-label="Закрыть" autoFocus onClick={close}>×</button>
  <p className="chapter-kicker">{item.title}</p>
  <h2 id="gift-links-title">Этот подарок состоит из {item.links.length} товаров</h2>
  <ul className="gift-links-list">
   {item.links.map((link, index) => <li key={index}><a className="foil-button" href={link.url} target="_blank" rel="noopener noreferrer">Товар {index + 1}</a></li>)}
  </ul>
 </dialog>;
}
