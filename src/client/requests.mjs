export async function boundedFetch(url,options={},timeoutMs=20000,fetcher=fetch){
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeoutMs);
 try{return await fetcher(url,{...options,signal:controller.signal});}finally{clearTimeout(timer);}
}
export function requestMessage(status){
 if(status===400)return 'Проверь имя и обязательные ответы.';
 if(status===401||status===403)return 'Сессия устарела. Обнови статус формы и попробуй снова.';
 if(status===404)return 'Этот ответ уже удалён. Обнови список гостей.';
 if(status===429)return 'Слишком много попыток. Подожди немного и попробуй снова.';
 return 'Не удалось связаться с сервером. Ответы остались в форме. Попробуй ещё раз.';
}
export async function boundedJson(url,options={},timeoutMs=20000,fetcher=fetch){
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeoutMs);
 try{const response=await fetcher(url,{...options,signal:controller.signal});const result=await response.json();return {response,result};}finally{clearTimeout(timer);}
}
