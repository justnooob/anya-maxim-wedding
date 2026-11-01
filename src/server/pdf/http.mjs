import {transaction} from '../db/index.mjs';
import {requestToken} from '../rsvp/session.mjs';
import {activeSession,ownRsvps,allowRate} from '../rsvp/repository.mjs';
import {renderTicket} from './ticket.mjs';
const headers={'Cache-Control':'private, no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff'};
export async function downloadInvitation(request,source){
  const token=requestToken(request);
  if(!token)return Response.json({error:'Откройте приглашение и сохраните ответ.'},{status:401,headers});
  // No arbitrary guest/session ID is accepted. Ownership comes only from HttpOnly cookie.
  try{
    const result=await transaction(async client=>{
      const id=await activeSession(client,token);if(!id)return {status:401};
      if(!await allowRate(client,'pdf:'+id,30))return {status:429};
      const rows=await ownRsvps(client,id);return rows.length?{rows}:{status:404};
    },source);
    if(result.status)return Response.json({error:result.status===429?'Попробуйте скачать чуть позже.':'Сохранённых ответов пока нет.'},{status:result.status,headers});
    const bytes=await renderTicket(result.rows);
    return new Response(new Uint8Array(bytes),{headers:{...headers,'Content-Type':'application/pdf','Content-Disposition':'attachment; filename="anya-maxim-invitation.pdf"'}});
  }catch{return Response.json({error:'Не удалось создать приглашение. Попробуйте ещё раз.'},{status:503,headers});}
}
