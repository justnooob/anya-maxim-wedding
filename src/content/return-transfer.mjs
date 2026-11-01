export const returnTransferCopy={title:'Обратный трансфер до Купчино',error:'Выбери, нужен ли обратный трансфер.',hint:'Выбери один из вариантов',options:[{value:'needed',label:'Нужен'},{value:'not_needed',label:'Не нужен'}]};
export const validReturnTransfer=value=>returnTransferCopy.options.some(option=>option.value===value);
export const returnTransferLabel=value=>returnTransferCopy.options.find(option=>option.value===value)?.label||'Не указано';
