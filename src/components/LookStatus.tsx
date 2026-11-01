import {publicSections as content} from "@/content/public-sections";

export function LookStatus({allowed}:{allowed:boolean}) {
 return <span className={'look-status '+(allowed?'look-status--allowed':'look-status--avoid')} role="img" aria-label={allowed?content.dress.allowedTitle:content.dress.avoidTitle}>
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={allowed?undefined:{transform:'rotate(180deg)'}}><path d="M8 10v10H4V10h4Zm0 1 4-8c2 0 3 1 2 4l-.5 3H19c1.5 0 2 1 1.7 2.2l-1.5 6C19 19.4 18.4 20 17 20H8" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round"/></svg>
 </span>;
}
