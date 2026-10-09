export type JumpState={height:number;velocity:number;grounded:boolean};
export const standingJump=():JumpState=>({height:0,velocity:0,grounded:true});
export function startJump(state:JumpState):JumpState {
  return state.grounded?{height:0,velocity:4.3,grounded:false}:state;
}
export function advanceJump(state:JumpState,seconds:number):JumpState {
  if(state.grounded)return state;
  const dt=Math.max(0,Math.min(.05,Number.isFinite(seconds)?seconds:0));
  const height=state.height+state.velocity*dt-6.25*dt*dt,velocity=state.velocity-12.5*dt;
  return height<=0&&velocity<0?standingJump():{height:Math.max(0,height),velocity,grounded:false};
}
export function lookPitch(pitch:number){return Math.max(-1.35,Math.min(1.25,pitch));}
export function relativeMovement(forward:number,side:number,yaw:number){
  const length=Math.max(1,Math.hypot(forward,side));
  return{x:(Math.sin(yaw)*forward+Math.cos(yaw)*side)/length,z:(Math.cos(yaw)*forward-Math.sin(yaw)*side)/length};
}
export function hasGameFocus(target:EventTarget|null){
  return !(target instanceof HTMLElement&&target.closest('button,input,select,textarea,a,dialog,[role="dialog"],[contenteditable="true"]'));
}
