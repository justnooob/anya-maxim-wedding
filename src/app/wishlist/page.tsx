import type {Metadata} from 'next';
import {Wishlist} from '@/components/Wishlist';
import './wishlist.css';
export const metadata:Metadata={title:'Вишлист | Аня & Максим',description:'Несколько вещей для нашей совместной жизни. Подарки, которые можно выбрать к свадебному приглашению.'};
export default function Page(){return <Wishlist/>;}
