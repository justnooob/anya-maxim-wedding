// These detectors deliberately report masked content overflow too. Decorative
// paint and native horizontal rails are the only geometric exclusions.
export function inspectLayout(){
 const width=document.documentElement.clientWidth;
 const atom=el=>el.id?'#'+el.id:el.tagName.toLowerCase()+[...el.classList].slice(0,3).map(c=>'.'+c).join('');
 const selector=el=>{const parts=[atom(el)];for(let p=el.parentElement;p&&parts.length<4;p=p.parentElement){parts.unshift(atom(p));if(p.id)break;}return parts.join(' > ');};
 const visible=el=>{if(el.closest('[hidden],[inert],[aria-hidden="true"]'))return false;for(let p=el;p;p=p.parentElement){const s=getComputedStyle(p);if(s.display==='none'||s.visibility==='hidden'||+s.opacity<.05)return false;}return true;};
 const overflow=[],clipping=[],gaps=[],smallTargets=[];
 for(const el of document.querySelectorAll('main *, .opening *,dialog[open] *,.dress-floating *')){
  if(!visible(el)||el.matches('svg,svg *,path,br,style,script'))continue;
  const box=el.getBoundingClientRect();if(box.width<1||box.height<1)continue;
  const css=getComputedStyle(el),rail=el.closest('.material-items,.dress-catalogue');
  const painted=el.closest('.watercolor,.paper-corner,.paper-wing,.paper-keel,.paper-crease,.paper-body,.envelope-shell,.envelope-flap,.portrait-hero-shade');
  if(!rail&&!painted&&(box.left< -1||box.right>width+1))overflow.push({selector:selector(el),box:{x:box.x,y:box.y,width:box.width,height:box.height},viewport:{width,height:innerHeight},amount:Math.max(-box.left,box.right-width)});
  if(!el.matches('input,textarea,svg,img,button')&&el.children.length===0&&el.textContent.trim()&&el.clientWidth>5&&el.scrollWidth>el.clientWidth+2&&!['inline','contents'].includes(css.display)&&!rail)clipping.push({selector:selector(el),text:el.textContent.slice(0,70),scroll:el.scrollWidth,client:el.clientWidth});
  if(el.matches('button,a,input:not([type=radio]):not([type=checkbox])')&&box.top>=0&&box.top<innerHeight&&box.width<44&&box.height<44&&!el.closest('p,.question-answer,label'))smallTargets.push({selector:selector(el),width:box.width,height:box.height});
 }
 for(const parent of document.querySelectorAll('main,main>section,.lookbook-frame,.lookbook-description,.questions-list,.rsvp-paper,.dress-lookbook,.dress-materials')){
  const children=[...parent.children].filter(el=>visible(el)&&el.getBoundingClientRect().height>2&&getComputedStyle(el).position!=='absolute'&&getComputedStyle(el).position!=='fixed');
  for(let i=1;i<children.length;i++){const a=children[i-1].getBoundingClientRect(),b=children[i].getBoundingClientRect(),gap=b.top-a.bottom;if(gap>Math.max(180,innerHeight*.45))gaps.push({parent:selector(parent),before:selector(children[i-1]),after:selector(children[i]),gap});}
  if(parent.matches('.lookbook-description,.rsvp-paper')&&children.length){const box=parent.getBoundingClientRect(),last=children.at(-1).getBoundingClientRect(),gap=box.bottom-last.bottom;if(gap>Math.max(180,innerHeight*.45))gaps.push({parent:selector(parent),after:selector(children.at(-1)),edge:'bottom',gap});}
 }
 return{width,height:innerHeight,documentOverflow:document.documentElement.scrollWidth-width,overflow:overflow.slice(0,50),clipping:clipping.slice(0,30),gaps,smallTargets};
}
