"use client";
import Script from "next/script";
import {useEffect,useRef} from "react";
import {usePathname} from "next/navigation";

// Count public invitation visits, not organizer sessions with private guest data.
const METRIKA_ID = 114154761;

export function YandexMetrika() {
  const pathname = usePathname();
  const previousPath = useRef<string|null>(null);
  useEffect(() => {
    if (!pathname) return;
    if (previousPath.current === null) { previousPath.current=pathname; return; }
    if (previousPath.current === pathname) return;
    previousPath.current=pathname;
    if (pathname === "/telegram" || pathname.startsWith("/telegram/")) return;
    // Client-side Next.js navigation does not reload the tracker.
    const ym=(window as Window & {ym?:(id:number,command:string,url:string)=>void}).ym;
    ym?.(METRIKA_ID,"hit",window.location.href);
  },[pathname]);
  if (pathname === "/telegram" || pathname?.startsWith("/telegram/")) return null;

  return <>
    <Script id="yandex-metrika" strategy="afterInteractive">{`
(function(m,e,t,r,i,k,a){
  m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
  m[i].l=1*new Date();
  for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}
  k=e.createElement(t);a=e.getElementsByTagName(t)[0];k.async=1;k.src=r;a.parentNode.insertBefore(k,a);
})(window,document,'script','https://mc.yandex.ru/metrika/tag.js?id=114154761','ym');
ym(114154761,'init',{
  ssr:true,
  webvisor:true,
  clickmap:true,
  ecommerce:"dataLayer",
  referrer:document.referrer,
  url:location.href,
  accurateTrackBounce:true,
  trackLinks:true
});
`}</Script>
    <noscript dangerouslySetInnerHTML={{__html:'<div><img src="https://mc.yandex.ru/watch/114154761" style="position:absolute; left:-9999px;" alt="" /></div>'}} />
  </>;
}
