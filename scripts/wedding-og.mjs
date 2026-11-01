// Reproducible static artwork using local fonts and the approved watercolor.
import fs from 'node:fs';
import PDFDocument from 'pdfkit';
const doc=new PDFDocument({size:[1200,630],margin:0});
const output=fs.createWriteStream('qa/pdf-examples/wedding-og-artwork.pdf');doc.pipe(output);
doc.registerFont('script','public/fonts/font-5.ttf').registerFont('serif','public/fonts/font-1.ttf').registerFont('sans','public/fonts/typography-1.ttf').registerFont('amp','public/fonts/royal-kaynin.otf');
doc.rect(0,0,1200,630).fill('#F8F4EB');
// Subtle deterministic paper fibres, never under the principal lettering.
for(let i=0;i<1200;i++){const x=(i*971)%1200,y=(i*409)%630;doc.save().opacity(.035).strokeColor('#77835F').lineWidth(.35).moveTo(x,y).lineTo(x+2,y+.5).stroke().restore();}
doc.save().opacity(.60).image('public/images/ticket/eucalyptus.png',-115,-100,{width:470}).restore();
doc.save().translate(1200,630).rotate(180).opacity(.60).image('public/images/ticket/eucalyptus.png',-95,-95,{width:450}).restore();
doc.rect(35,35,1130,560).lineWidth(.8).strokeColor('#D8CEB5').stroke();
doc.font('sans').fontSize(17).fillColor('#6A7759').text('ПРИГЛАШЕНИЕ НА СВАДЬБУ',200,100,{width:800,align:'center',characterSpacing:2});
doc.font('serif').fontSize(83).fillColor('#303B2A').text('АННА',150,175,{width:900,align:'center',characterSpacing:6});
doc.font('amp').fontSize(46).fillColor('#303B2A').text('&',500,276,{width:200,align:'center'});
doc.strokeColor('#B49A61').lineWidth(.6).moveTo(320,307).lineTo(550,307).moveTo(650,307).lineTo(880,307).stroke();
doc.font('serif').fontSize(83).fillColor('#303B2A').text('МАКСИМ',150,337,{width:900,align:'center',characterSpacing:6});
doc.font('serif').fontSize(33).fillColor('#303B2A').text('17.07.2027',250,467,{width:700,align:'center'});
doc.end();await new Promise((resolve,reject)=>{output.on('finish',resolve);output.on('error',reject);});
