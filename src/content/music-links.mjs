// Parse user-entered music requests into text and safe, clickable web links.
// Do not turn guest text into HTML: callers render segments with React.
const urlPattern=/(?:https?:\/\/|www\.|(?:[a-z0-9-]+\.)+[a-z]{2,}\/)[^\s<>"'`]+/gi;

function safeHref(candidate) {
 const normalized=/^https?:\/\//i.test(candidate)?candidate:'https://'+candidate;
 try {
  const url=new URL(normalized);
  if(!['http:','https:'].includes(url.protocol)||!url.hostname.includes('.')||url.username||url.password)return null;
  return url.href;
 }catch{return null;}
}

// Exclude punctuation after a pasted URL without changing its visible text.
function withoutTrailingPunctuation(candidate) {
 let result=candidate.replace(/[.,!?;:\]}»]+$/g,'');
 while(result.endsWith(')') && (result.match(/\)/g)||[]).length>(result.match(/\(/g)||[]).length)
  result=result.slice(0,-1);
 return result;
}

/** @returns {{text:string,href:string|null}[]} */
export function splitMusicLinks(text){
 const value=String(text??''),segments=[];
 let cursor=0;
 for(const match of value.matchAll(urlPattern)){
  const index=match.index??0;
  // Avoid matching a URL inside an email address or a different URI scheme.
  if(index>0&&/[a-z0-9@/:._-]/i.test(value[index-1]))continue;
  const label=withoutTrailingPunctuation(match[0]);
  const href=safeHref(label);
  if(!href)continue;
  if(cursor<index)segments.push({text:value.slice(cursor,index),href:null});
  segments.push({text:label,href});
  cursor=index+label.length;
 }
 if(cursor<value.length)segments.push({text:value.slice(cursor),href:null});
 return segments.length?segments:[{text:value,href:null}];
}
