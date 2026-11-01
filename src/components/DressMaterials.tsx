type MaterialItem={id:string;reference:number;title:string;image:string;desktopHint:string};
type MaterialGroup={id:string;title:string;items:MaterialItem[]};

export function DressMaterials({id,title,groups,description,warning}:{id:string;title:string;groups:MaterialGroup[];description:string;warning:string|null}){
 return <section className="dress-materials" aria-labelledby={id+"-materials-title"}>
  <h3 id={id+"-materials-title"}>{title}</h3>
  <div className="material-columns">{groups.map(group=><section className="material-group" key={group.id} aria-labelledby={group.id+"-title"}>
   <h4 id={group.id+"-title"}>{group.title}</h4>
   <div className="material-items" role="region" aria-label={group.title} tabIndex={0}>
    {group.items.map(item=><figure className="material-card" key={item.id} data-material-id={item.id} data-reference={item.reference} tabIndex={0} aria-label={item.title} aria-describedby={item.desktopHint?item.id+"-hint":undefined}>
     <div className="material-photo"><img src={item.image} width={800} height={800} alt={item.title+", "+group.title.toLocaleLowerCase('ru')} loading="lazy"/>
      <span className="material-hint" id={item.id+"-hint"}><strong>{item.title}</strong>{item.desktopHint&&<span>{item.desktopHint}</span>}</span>
     </div>
    </figure>)}
   </div>
  </section>)}</div>
  <div className="material-notes"><p>{description}</p><p className="dress-black-warning" hidden={!warning}>{warning}</p></div>
 </section>;
}
