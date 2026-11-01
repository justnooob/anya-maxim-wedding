import Link from 'next/link';
import type {Metadata} from 'next';
import {venueRules as copy} from '@/content/venue-rules';
import './rules.css';
export const metadata:Metadata={title:'Правила площадки | Аня & Максим'};
export default function VenueRules(){return <main className="venue-rules-page">
 <Link className="rules-back" href="/#rsvp">← К приглашению</Link>
 <header><span className="chapter-kicker">Пушкинская Усадьба · 17.07.2027</span><h1>{copy.title}</h1><p>{copy.intro}</p></header>
 <ol>{copy.items.map((rule,index)=><li key={rule.title}><span className="rules-number" aria-hidden="true">{String(index+1).padStart(2,'0')}</span><div><h2>{rule.title}</h2><p>{rule.text}</p>{'fee' in rule&&<p className="rules-fee">{rule.fee}</p>}</div></li>)}</ol>
 <footer><p>{copy.summary}</p><p>Если что-то вызывает сомнения, лучше заранее спросите <a href="https://t.me/Selesssta" target="_blank" rel="noopener noreferrer">Аню</a> или <a href="https://t.me/sfokin1337" target="_blank" rel="noopener noreferrer">Максима</a>.</p><Link className="rules-back" href="/#rsvp">Вернуться к приглашению →</Link></footer>
 </main>;}
