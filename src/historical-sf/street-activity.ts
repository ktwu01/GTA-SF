import type { StreetPoint } from './navigation.ts';

export function pedestrianPace(id:number,style:number){
  return style!==2&&style!==5&&id%7===0?'run':id%4===0?'hurry':'walk';
}
export type RailHop={height:number;velocity:number;cooldown:number};
export function groundedRailHop():RailHop{return{height:0,velocity:0,cooldown:0};}
export function advanceRailHop(state:RailHop,dt:number,point:StreetPoint,lateralSpeed:number,moving:boolean,pace:string):RailHop{
  const next={...state,cooldown:Math.max(0,state.cooldown-dt)};
  const distance=Math.min(Math.abs(point.x-3.15),Math.abs(point.x+3.15));
  if(next.height===0&&next.velocity===0&&next.cooldown===0&&moving&&pace==='run'&&point.z<534&&Math.abs(lateralSpeed)>.35&&distance<.6){next.velocity=2.6;next.cooldown=1.2;}
  if(next.velocity!==0||next.height>0){next.height+=next.velocity*dt-6*dt*dt;next.velocity-=12*dt;if(next.height<=0){next.height=0;next.velocity=0;}}
  return next;
}
export const exteriorSeats=[
  {x:-.7,z:3.12,y:.79,grip:1}, {x:.7,z:3.12,y:.79,grip:-1},
  {x:-.72,z:-3.12,y:.79,grip:1}, {x:.72,z:-3.12,y:.79,grip:-1},
  {x:1.32,z:3.38,y:.46,grip:-1}, {x:-1.32,z:-3.38,y:.46,grip:1},
];
