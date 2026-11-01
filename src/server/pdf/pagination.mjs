// Ordered, indivisible blocks. A block's trailing gap belongs between blocks,
// never to the fit check at the bottom of a page. No guest data is needed here.
export function paginateTicketBlocks(blocks,{firstTop,continuationTop=82,bottom}){
  const pages=[[]];let top=firstTop,previousGap=0;
  for(const block of blocks){
    if(!Number.isFinite(block.height)||block.height<0||block.height>bottom-continuationTop)throw new Error('PDF block exceeds a printable page');
    const availableTop=top+previousGap;
    if(availableTop+block.height>bottom+.01){pages.push([]);top=continuationTop;previousGap=0;}
    else top=availableTop;
    pages.at(-1).push({block,top});top+=block.height;previousGap=block.after??0;
  }
  return pages;
}
