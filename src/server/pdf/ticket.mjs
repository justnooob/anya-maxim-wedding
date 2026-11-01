import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import path from 'node:path';
import {wedding,PUBLIC_ORIGIN,ANYA_TELEGRAM_URL,MAXIM_TELEGRAM_URL} from '../../content/wedding.mjs';
import {dressPalettes} from '../../content/dress-palettes.mjs';
import {ticketGuest} from './ticket-model.mjs';
import {paginateTicketBlocks} from './pagination.mjs';

const paper='#F8F4EB',olive='#303B2A',muted='#6A7759',gold='#B49A61';
const asset=name=>path.join(process.cwd(),'public',name);
// Node-only renderer. No remote fonts, images, browser screenshot or PII service.
export async function renderTicket(rows,{onLayout}={}){
  if(!Array.isArray(rows)||!rows.length)throw new Error('Saved guests required');
  const qr=await QRCode.toBuffer(PUBLIC_ORIGIN,{type:'png',width:480,margin:4,errorCorrectionLevel:'M',color:{dark:olive,light:paper}});
  const doc=new PDFDocument({size:'A4',margin:0,bufferPages:true,autoFirstPage:false,info:{Title:'Аня & Максим. Ваше приглашение',Author:'Аня & Максим',Subject:'Сохранённые ответы и памятка о свадьбе'}});
  const chunks=[];const done=new Promise((resolve,reject)=>{doc.on('data',part=>chunks.push(part));doc.on('end',()=>resolve(Buffer.concat(chunks)));doc.on('error',reject);});
  doc.registerFont('serif',asset('fonts/font-1.ttf'));doc.registerFont('italic',asset('fonts/font-0.ttf'));
  doc.registerFont('amp',asset('fonts/royal-kaynin.otf'));doc.registerFont('sans',asset('fonts/typography-1.ttf'));doc.registerFont('medium',asset('fonts/typography-2.ttf'));
  doc.registerFont('semibold',asset('fonts/typography-3.ttf'));
  const W=595.28,H=841.89,M=48,CW=W-M*2,BOTTOM=H-64,GAP=5;
  const clean=value=>String(value??'').normalize('NFC').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g,'').replace(/\p{Extended_Pictographic}/gu,'');
  const options=(width,extra={})=>({width,lineGap:GAP,...extra});
  // Use PDFKit's own continued-text layout for measuring AND painting mixed
  // weights. Measuring an all-Regular string would miss SemiBold word widths.
  // This in-memory scratch stream never leaves the process or stores a file.
  const measureDoc=new PDFDocument({size:[W,32768],margin:0});measureDoc.resume();
  measureDoc.registerFont('sans',asset('fonts/typography-1.ttf'));measureDoc.registerFont('semibold',asset('fonts/typography-3.ttf'));
  function paintField(target,field,x,top,width,color){
    target.font('semibold').fontSize(14).fillColor(color).text(clean(field.label)+': ',x,top,options(width,{continued:true}));
    target.font('sans').text(clean(field.value),{continued:false,link:null,underline:false});
    return target.y-top-GAP;
  }
  const fieldHeights=new Map();
  function fieldHeight(field,width){
    const key=JSON.stringify([field.label,field.value,width]);
    if(!fieldHeights.has(key))fieldHeights.set(key,paintField(measureDoc,field,0,0,width,olive));
    return fieldHeights.get(key);
  }
  function text(value,x,top,width=CW,size=14,font='sans',color=olive,extra={}){
    const occupied=height(value,width,size,font,extra);
    doc.font(font).fontSize(size).fillColor(color).text(clean(value),x,top,options(width,extra));return top+occupied;
  }
  function height(value,width=CW,size=14,font='sans',extra={}){
    // PDFKit's cursor advance includes lineGap AFTER the final line as well.
    // It is not occupied text: inter-block spacing is already explicit below.
    // Keep the 5pt leading between wrapped lines, remove only this double gap.
    return Math.max(0,doc.font(font).fontSize(size).heightOfString(clean(value),options(width,extra))-(extra.lineGap??GAP));
  }
  function line(top){doc.strokeColor(gold).lineWidth(.45).moveTo(M,top).lineTo(W-M,top).stroke();}
  function namesLine(top,size,color=olive,alignLeft=false){
    const spacing=size*.075,gap=size*.28,ampSize=size*.48;
    const left=doc.font('serif').fontSize(size).widthOfString('АННА',{characterSpacing:spacing});
    const right=doc.widthOfString('МАКСИМ',{characterSpacing:spacing});
    const middle=doc.font('amp').fontSize(ampSize).widthOfString('&');
    const x=alignLeft?M:(W-left-right-middle-gap*2)/2;
    text('АННА',x,top,CW,size,'serif',color,{characterSpacing:spacing,lineBreak:false});
    text('&',x+left+gap,top+size*.25,CW,ampSize,'amp',color,{lineBreak:false});
    text('МАКСИМ',x+left+gap*2+middle,top,CW,size,'serif',color,{characterSpacing:spacing,lineBreak:false});
  }
  let y=0;
  function newPage(){
    doc.addPage();doc.rect(0,0,W,H).fill(paper);
    doc.save().opacity(.32).image(asset('images/ticket/eucalyptus.png'),W-185,-35,{width:230}).restore();
    doc.save().opacity(.12).image(asset('images/ticket/eucalyptus.png'),-75,H-220,{width:220}).restore();
    doc.rect(25,25,W-50,H-50).lineWidth(.45).strokeColor('#D9CEB5').stroke();
    if(doc.bufferedPageRange().count>1){namesLine(35,11,muted,true);text(wedding.date,W-165,32,117,14,'sans',muted,{align:'right'});}
    y=82;
  }
  // Record actual positioned operations once. The same measured text boxes
  // determine both pagination and painting, without estimated section heights.
  function compose(id,layout,after=23){
    const operations=[];let bottom=0;
    const write=(value,x,top,width=CW,size=14,font='sans',color=olive,extra={})=>{
      const end=top+height(value,width,size,font,extra);bottom=Math.max(bottom,end);
      operations.push(offset=>text(value,x,offset+top,width,size,font,color,extra));return end;
    };
    const rule=top=>{bottom=Math.max(bottom,top+.25);operations.push(offset=>line(offset+top));};
    const image=(source,x,top,width)=>{bottom=Math.max(bottom,top+width);operations.push(offset=>doc.image(source,x,offset+top,{width,height:width}));};
    const custom=(top,extent,draw)=>{bottom=Math.max(bottom,top+extent);operations.push(offset=>draw(offset+top));};
    layout({write,rule,image,custom});
    return {id,height:bottom,after,draw:top=>operations.forEach(operation=>operation(top))};
  }
  const guests=rows.map(ticketGuest);
  newPage();namesLine(68,46);
  text(wedding.dateLong,M,127,CW,14,'sans',muted,{align:'center'});line(160);
  y=text('Ваше приглашение',M,177,CW,32,'serif',olive,{align:'center'})+8;
  const coverGap=24,halfWidth=(CW-coverGap)/2;
  // Full names must remain names, not a stack of narrow fragments. Keep the
  // short-name composition, switch the entire list to one column when needed.
  const coverColumns=guests.length>=3&&guests.every(g=>height(g.name,halfWidth,23,'serif')<=height('А',halfWidth,23,'serif')+.1)?2:1;
  const coverWidth=(CW-coverGap*(coverColumns-1))/coverColumns;
  const nameRows=[];
  for(let i=0;i<guests.length;i+=coverColumns){const group=guests.slice(i,i+coverColumns);nameRows.push({group,height:Math.max(...group.map(g=>height(g.name,coverWidth,23,'serif',{align:'center'})+5+(g.attendance==='yes'?0:height('Не приду',coverWidth,14)+5)))+2});}
  const cover=compose('invited-names',({write})=>{let top=0;for(const row of nameRows){row.group.forEach((guest,i)=>{const left=row.group.length===1?M+(CW-coverWidth)/2:M+i*(coverWidth+coverGap);const bottom=write(guest.name,left,top,coverWidth,23,'serif',olive,{align:'center'})+5;if(guest.attendance!=='yes')write('Не приду',left,bottom,coverWidth,14,'sans',muted,{align:'center'});});top+=row.height;}},20);
  if(y+cover.height>BOTTOM)throw new Error('Invitation names exceed cover');
  cover.draw(y);y+=cover.height+cover.after;
  function guestCard(guest,index){
    const col=(CW-26)/2;
    // A long LABEL does not make a short ANSWER long. Allow a readable two-line
    // label/value cell, but never squeeze a multi-line value into half a sheet.
    const singleLine=height('А',col,14);
    const twoLines=height('А\nА',col,14);
    const isShort=f=>fieldHeight(f,col)<=twoLines+.1&&height(f.value,col,14)<=singleLine+.1;
    const fieldRows=[];
    for(let i=0;i<guest.fields.length;i++){
      const first=guest.fields[i],second=guest.fields[i+1];
      const fields=second&&isShort(first)&&isShort(second)?[first,guest.fields[++i]]:[first];
      const width=fields.length===2?col:CW;
      fieldRows.push({fields,width,height:Math.max(...fields.map(f=>fieldHeight(f,width)))+8});
    }
    const status={label:'Участие',value:guest.attendance==='yes'?'Приду':'Не приду'};
    return compose('guest-'+(index+1),({write,rule,custom})=>{
      let top=0;
      if(index===0)top=write('Что мы сохранили',M,top,CW,29,'serif')+14;
      top=write(guest.name,M,top,CW,25,'serif')+7;
      const statusHeight=fieldHeight(status,CW);
      custom(top,statusHeight,at=>paintField(doc,status,M,at,CW,muted));top+=statusHeight+16;
      for(const row of fieldRows){row.fields.forEach((field,i)=>custom(top,fieldHeight(field,row.width),at=>paintField(doc,field,M+i*(col+26),at,row.width,olive)));top+=row.height;}
      rule(top+2);
    });
  }
  const cards=guests.map(guestCard);
  const blocks=[...cards];
  const changes='Если после заполнения анкеты что-то поменяется, пожалуйста, напишите Ане или Максиму. Мы сами всё поправим.';
  blocks.push(compose('changes',({write,custom})=>{
    const top=write('Если планы изменятся',M,0,CW,26,'serif')+14;
    custom(top,height(changes,CW,14),at=>{
    doc.font('sans').fontSize(14).fillColor(olive).text('Если после заполнения анкеты что-то поменяется, пожалуйста, напишите ',M,at,options(CW,{continued:true}));
    doc.fillColor(muted).text('Ане',{continued:true,link:ANYA_TELEGRAM_URL,underline:true});
    doc.fillColor(olive).text(' или ',{continued:true,link:null,underline:false});
    doc.fillColor(muted).text('Максиму',{continued:true,link:MAXIM_TELEGRAM_URL,underline:true});
    doc.fillColor(olive).text('. Мы сами всё поправим.',{continued:false,link:null,underline:false});
    });
  },18));
  const venueWidth=CW-166;
  const caption='Вся информация\nвсегда под рукой';
  const qrWidth=138,qrLeft=W-M-qrWidth;
  blocks.push(compose('venue-and-qr',({write,image})=>{
    let top=write('Немного важного перед встречей',M,0,CW,29,'serif')+14;
    top=write(wedding.dateLong+' года',M,top,CW,17,'italic')+16;
    image(qr,qrLeft,top,qrWidth);
    const qrY=write(caption,qrLeft,top+qrWidth+8,qrWidth,14,'sans',muted,{align:'center'})+6;
    write('anyaxmaxim.ru',qrLeft,qrY,qrWidth,14,'sans',muted,{align:'center',link:PUBLIC_ORIGIN});
    let left=write(wedding.venue.name,M,top,venueWidth,25,'serif')+9;
    left=write(wedding.venue.address,M,left,venueWidth,14)+12;
    write('Открыть на карте',M,left,venueWidth,14,'medium',muted,{link:wedding.venue.mapUrl,underline:true});
  },24));
  const scheduleRows=wedding.program.map(item=>({item,height:Math.max(height(item.time,65,14,'medium'),height(item.ticketTitle,CW-92,14))+10}));
  blocks.push(compose('schedule',({write,rule})=>{
    let top=write('Наш день',M,0,CW,28,'serif')+14;
    for(const row of scheduleRows){write(row.item.time,M,top,65,14,'medium',gold);write(row.item.ticketTitle,M+92,top,CW-92,14);top+=row.height;}
    rule(top+2);
  },18));
  const dressText='Девушкам: тёплый оливковый или заметно жёлто-сливочный оттенок, вплоть до золота. Мужчинам: оливковый пиджак, молочная рубашка и аксессуары в нашей гамме.';
  const black='Чёрный не используем, даже на носках.';
  const siteText='Расписание, дресс-код и другие важные моменты ждут тебя на сайте.';
  // Dress code is one semantic block; site/contacts are another. Neither is
  // tied to a page or to the preceding programme/venue.
  blocks.push(compose('dress-code',({write,custom})=>{
    let top=write('Немного о дресс-коде',M,0,CW,28,'serif')+14;
    const swatches=(label,palette,x,at)=>{write(label,x,at,235,14,'medium');custom(at+28,20,position=>palette.forEach((shade,i)=>doc.circle(x+12+i*29,position+10,10).fillAndStroke(shade.color,'#D9CEB5')));};
    swatches('Для девушек',dressPalettes.olive,M,top);swatches('Для мужчин',dressPalettes.olive,M+260,top);
    swatches('Сливочное масло и золото',dressPalettes.creamGold,M,top+68);swatches('Молочная рубашка',dressPalettes.milk,M+260,top+68);top+=146;
    top=write(dressText,M,top,CW,14)+12;
    top=write(black,M,top,CW,14,'medium')+12;
    write('Посмотреть все примеры образов',M,top,CW,14,'medium',muted,{link:PUBLIC_ORIGIN+'/#dress-code',underline:true});
  },25));
  blocks.push(compose('site-and-contacts',({write})=>{
    let top=write(siteText,M,0,CW,14)+10;
    top=write('Вернуться на сайт',M,top,CW,14,'medium',muted,{link:PUBLIC_ORIGIN,underline:true})+20;
    top=write('Если возникнут вопросы',M,top,CW,24,'serif')+10;
    write('Аня',M,top,90,14,'medium',muted,{link:ANYA_TELEGRAM_URL,underline:true});write('Максим',M+115,top,140,14,'medium',muted,{link:MAXIM_TELEGRAM_URL,underline:true});
  },0));
  const firstTop=y,pages=paginateTicketBlocks(blocks,{firstTop,bottom:BOTTOM});
  const trace=[];
  pages.forEach((page,index)=>{if(index)newPage();for(const {block,top} of page){block.draw(top);trace.push({id:block.id,page:index+1,top,height:block.height,after:block.after});}});
  onLayout?.({coverColumns,firstTop,continuationTop:82,bottom:BOTTOM,blocks:trace});
  const range=doc.bufferedPageRange();for(let i=0;i<range.count;i++){doc.switchToPage(i);text(`${i+1} / ${range.count}`,W-M-45,H-47,45,8,'sans',muted,{align:'right'});}
  measureDoc.end();doc.end();return done;
}
