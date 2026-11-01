export const FAMILY_SWIPE_DISTANCE=50;
export const FAMILY_SWIPE_DOMINANCE=1.5;
export function familySwipeTarget(side,dx,dy){
 if(!Number.isFinite(dx)||!Number.isFinite(dy)||Math.abs(dx)<FAMILY_SWIPE_DISTANCE||Math.abs(dx)<=Math.abs(dy)*FAMILY_SWIPE_DOMINANCE)return null;
 if(side==='groom'&&dx<0)return 'bride';
 if(side==='bride'&&dx>0)return 'groom';
 return null;
}
