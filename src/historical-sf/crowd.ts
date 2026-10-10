import { pedestrianPace, advanceRailHop, groundedRailHop, type RailHop } from './street-activity';
import { harborHeight,harborWalkable } from './harbor-layout';
import { separateTraffic } from './collision';
import { BoundingInfo } from '@babylonjs/core/Culling/boundingInfo';
import { Matrix, Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import '@babylonjs/core/Meshes/thinInstanceMesh';
import { Scene } from '@babylonjs/core/scene';
import { Masonry } from './geometry';
import { type Palette, random } from './materials';
import { distanceBetween, type StreetPoint } from './navigation';

export type PersonRole='traveler'|'news'|'porter'|'clerk'|'flowers'|'coffee';
export type TrafficMarker=StreetPoint&{kind:string;speed:number;direction:number;player?:boolean};
export type Pedestrian=StreetPoint&{
  id:number;role:PersonRole;style:number;scale:number;yaw:number;height:number;phase:number;
  route:StreetPoint[];target:number;wait:number;speed:number;moving:boolean;crossing:boolean;
  hop:RailHop;group:number;talking:boolean;holdUntil:number;visible:boolean;yielding:boolean;distance:number;
};
type Part='body'|'arm'|'forearm'|'thigh'|'calf'|'shoe';
type Batch={meshes:Mesh[];matrices:Float32Array;people:Pedestrian[];part:Part;double:boolean};

function makePart(scene:Scene,p:Palette,style:number,part:Part){
  const b=new Masonry(scene,`crowd-${style}-${part}`),coat=[p.navy,p.coat,p.skirt,p.warm,p.green,p.rose][style];
  const skirt=style===2||style===5;
  if(part==='body'){
    b.ellipsoid(coat,0,1.1,0,.235,.31,.155,false,14);
    if(skirt){
      b.cylinder(coat,0,.56,0,.34,.91,.18,24);
      for(let i=0;i<14;i++){const a=i/14*Math.PI*2;b.beam(coat,[Math.cos(a)*.18,.99,Math.sin(a)*.18],[Math.cos(a)*.345,.12,Math.sin(a)*.345],.012,4);}
      b.box(p.darkTrim,0,.97,.15,.34,.045,.065);
    }else{
      b.box(coat,0,.91,-.015,.37,.36,.24);
      if(style===0||style===4){b.box(coat,-.13,.83,-.04,.15,.45,.17);b.box(coat,.13,.83,-.04,.15,.45,.17);}
      b.face(p.ivory,[[-.105,1.37,.13],[0,1.09,.162],[.105,1.37,.13]]);
      for(const side of[-1,1])b.face(p.darkTrim,[[side*.12,1.39,.125],[side*.21,1.21,.14],[side*.055,1.12,.17]]);
      b.face(p.black,[[-.022,1.31,.17],[0,1.12,.18],[.027,1.31,.17]]);
      for(const y of[1.03,1.14])b.ellipsoid(p.brass,.065,y,.17,.012,.012,.012,false,6);
      b.box(p.ivory,0,.83,.12,.35,.04,.07);
    }
    b.cylinder(p.skin,0,1.43,0,.061,.16,.065,10);
    b.ellipsoid(p.skin,0,1.6,0,.118,.171,.115,false,16);
    b.ellipsoid(p.skin,0,1.59,.115,.025,.039,.035,false,8);
    for(const side of[-1,1]){
      b.ellipsoid(p.skin,side*.118,1.6,0,.018,.035,.022,false,8);
      b.ellipsoid(p.black,side*.041,1.628,.103,.010,.009,.007,false,6);
      b.beam(p.mane,[side*.022,1.655,.104],[side*.062,1.653,.094],.007,4);
    }
    b.beam(p.darkTrim,[-.027,1.535,.096],[.027,1.535,.096],.006,4);
    b.ellipsoid(p.mane,0,1.72,-.022,.116,.067,.106,false,12);
    if(style===0||style===4){
      b.cylinder(p.black,0,1.76,0,.2,.025,.2,24);b.ellipsoid(p.black,0,1.785,0,.132,.13,.124,true,20);
      b.cylinder(p.darkTrim,0,1.802,0,.133,.024,.133,18);
      if(style===0)b.beam(p.mane,[-.045,1.56,.108],[.045,1.56,.108],.011,6);
    }else if(style===1){
      b.ellipsoid(coat,0,1.765,0,.147,.055,.147,true,16);b.ellipsoid(p.darkTrim,0,1.758,.096,.142,.019,.092,false,16);
    }else if(skirt){
      b.cylinder(p.cloth,0,1.775,0,.27,.04,.26,24);b.cylinder(coat,0,1.835,0,.15,.09,.14,20);
      b.box(p.ivory,.15,1.84,-.01,.10,.055,.075);b.ellipsoid(p.mane,0,1.64,-.116,.10,.078,.047,false,10);
    }else{
      b.cylinder(p.cloth,0,1.775,0,.225,.032,.225,24);b.cylinder(p.cloth,0,1.837,0,.15,.10,.15,20);b.cylinder(p.black,0,1.819,0,.151,.028,.151,20);
    }
    if(style===4){
      b.box(p.wood,.29,.57,.09,.28,.35,.12);b.beam(p.black,[.2,.82,.09],[.38,.82,.09],.018);b.beam(p.black,[.2,.73,.09],[.2,.82,.09],.012);b.beam(p.black,[.38,.73,.09],[.38,.82,.09],.012);
    }
    if(style===1){
      b.box(p.cloth,.34,.92,.14,.35,.3,.32);b.box(p.wood,.34,.92,.305,.025,.31,.018);b.box(p.wood,.34,1.076,.14,.37,.016,.022);
    }
    if(style===3){
      b.box(p.ivory,-.31,.8,.20,.26,.34,.027);
      for(let i=0;i<7;i++)b.box(p.darkTrim,-.31,.68+i*.043,.219,.22,.008,.009);
      b.box(p.black,-.31,.936,.22,.22,.022,.009);
    }
  }else if(part==='arm'){
    b.ellipsoid(coat,0,-.16,0,.073,.19,.078,false,12);
  }else if(part==='forearm'){
    b.ellipsoid(coat,0,-.135,0,.059,.16,.061,false,12);b.cylinder(p.ivory,0,-.263,0,.054,.045,.051,10);
    b.ellipsoid(p.skin,0,-.325,.013,.048,.071,.031,false,10);
  }else if(part==='thigh'){
    b.ellipsoid(coat,0,-.19,0,.089,.235,.10,false,12);
  }else if(part==='calf'){
    b.ellipsoid(coat,0,-.195,0,.071,.215,.078,false,12);
  }else b.ellipsoid(p.black,0,-.01,.066,.082,.065,.145,false,12);
  return b.finish();
}

export function createCrowd(scene:Scene,p:Palette){
  const rng=random(19060414),people:Pedestrian[]=[],batches:Batch[]=[];
  const roles:PersonRole[]=['traveler','porter','traveler','news','clerk','flowers'];
  const add=(route:StreetPoint[],style:number,group=-1,crossing=false,role=roles[style])=>{
    const pos=route[0],id=people.length;
    people.push({...pos,id,hop:groundedRailHop(),role,style,scale:.91+rng()*.16,height:1.89,phase:rng()*Math.PI*2,yaw:route.length>1?Math.atan2(route[1].x-pos.x,route[1].z-pos.z):rng()*6.28,route,target:route.length>1?1:0,wait:group>=0?1000:rng()*3,speed:.88+rng()*.52,moving:false,crossing,group,talking:false,holdUntil:0,visible:true,yielding:false,distance:0});
  };
  for(let i=0;i<32;i++){
    const side=i%2?1:-1,x=side*(15.0+rng()*1.65),z=346+rng()*174,far=Math.max(345,Math.min(531,z+(i%3?1:-1)*(25+rng()*45)));
    add([{x,z},{x:x+side*.24,z:far}],i%6);
  }
  for(let i=0;i<28;i++){
    const side=i%2?1:-1,z=354+(i%14)*13.3+rng()*4,offset=(rng()-.5)*9;
    add([{x:side*(5+rng()*11),z},{x:-side*16,z:z+offset},{x:side*16,z:z+3}],(i+1)%6,-1,true);
  }
  for(let i=0;i<24;i++){
    const side=i%2?1:-1,x=side*(8+rng()*62),z=540+rng()*20;
    add([{x,z},{x:x-side*(8+rng()*10),z:543+rng()*15},{x:x+side*5,z:540+rng()*18}],(i+2)%6,-1,i%3===0);
  }
  const groups=[{x:-.2,z:354.9},{x:-7.3,z:361},{x:15.8,z:384},{x:-15.5,z:417},{x:7,z:449},{x:-15.8,z:487},{x:16,z:523},{x:-18.7,z:535},{x:24,z:551},{x:-25,z:551}];
  for(const [group,pos] of groups.entries())for(let i=0;i<2;i++){
    add([{x:pos.x+(i?.55:-.55),z:pos.z+(i?.48:-.48)}],(group+i+3)%6,group,false,group===7?'coffee':group===6?'flowers':group===0?'news':roles[(group+i+3)%6]);
    people.at(-1)!.yaw=i?Math.PI+.55:.55;
  }
  for(const [x,z,role] of [[119,550,'porter'],[194,590,'clerk'],[194,626,'porter'],[276,550,'clerk'],[119,427,'clerk'],[197,661,'traveler']] as const)add([{x,z}],role==='porter'?1:4,20+people.length,false,role);
  for(const x of[119,194,276,345])add([{x,z:475},{x,z:550}],1,-1,false,'porter');
  for(let i=0;i<64;i++){
    const side=i%2?1:-1,x=side*(14.9+rng()*2),z=342+rng()*187;
    add([{x,z},{x:side*(15+rng()*1.9),z:Math.max(342,Math.min(531,z+(i%3?1:-1)*(20+rng()*60)))}],i%6);
  }
  for(let i=0;i<32;i++){
    const side=i%2?1:-1,z=349+rng()*178;
    add([{x:side*16,z},{x:-side*16,z:z+(rng()-.5)*12}],i%6,-1,true);
  }
  for(let i=0;i<32;i++){
    const x=-85+rng()*170,z=538+rng()*23;
    add([{x,z},{x:Math.max(-89,Math.min(89,x+(rng()-.5)*35)),z:538+rng()*23}],i%6);
  }
  for(let i=0;i<36;i++){
    const x=[119,194,276,345][i%4]+(rng()-.5)*5,z=380+rng()*166;
    add([{x,z},{x,z:380+rng()*166}],i%6,-1,false,i%3?'traveler':'porter');
  }
  for(let i=0;i<48;i++){const x=112+(i%12)*20,z=608.7+(i%3)*.2;add([{x,z},{x:x+5,z}],i%6,-1,false,i%2?'porter':'clerk');}
  for(let i=0;i<16;i++){const x=i%2?197:191,z=620+(i%8)*6;add([{x,z},{x,z:z+3}],i%6,-1,false,'porter');}
  for(let i=0;i<20;i++){
    const x=111+rng()*232,z=608.7+rng()*.5;
    add([{x,z},{x:111+rng()*232,z}],i%6);
  }
  for(let i=0;i<8;i++){
    const x=i%2?196.8:191.2,z=620+rng()*46;
    add([{x,z},{x,z:620+rng()*46}],i%6,-1,false,'porter');
  }
  for(const n of people){const pace=pedestrianPace(n.id,n.style);if(pace==='run')n.speed=2.6+rng()*.35;else if(pace==='hurry')n.speed=1.65+rng()*.3;}
  const initial=people.map(n=>({yaw:n.yaw,phase:n.phase,wait:n.wait}));
  const meshes:Mesh[]=[];
  for(let style=0;style<6;style++){
    const subset=people.filter(n=>n.style===style);
    for(const part of['body','arm','forearm','thigh','calf','shoe'] as Part[]){
      const double=part!=='body',matrices=new Float32Array(subset.length*(double?2:1)*16),parts=makePart(scene,p,style,part);
      for(const mesh of parts){mesh.thinInstanceSetBuffer('matrix',matrices,16,false);mesh.alwaysSelectAsActiveMesh=true;mesh.setBoundingInfo(new BoundingInfo(new Vector3(-100,-1,330),new Vector3(355,7,700)));}
      meshes.push(...parts);batches.push({meshes:parts,matrices,people:subset,part,double});
    }
  }
  const scale=new Vector3(),position=new Vector3(),rotation=new Quaternion(),matrix=new Matrix();
  const pose=(array:Float32Array,index:number,n:Pedestrian,x:number,y:number,z:number,pitch=0,roll=0)=>{
    const s=n.visible?n.scale:0,co=Math.cos(n.yaw),si=Math.sin(n.yaw),base=n.x>=95?harborHeight(n):n.z<534&&Math.abs(n.x)>14.35?.22:0;
    scale.set(s,s,s);position.set(n.x+s*(co*x+si*z),base+s*y+n.hop.height,n.z+s*(-si*x+co*z));Quaternion.RotationYawPitchRollToRef(n.yaw,pitch,roll,rotation);Matrix.ComposeToRef(scale,rotation,position,matrix);matrix.copyToArray(array,index*16);
  };
  let lastTime=0;
  function update(time:number,viewer:StreetPoint,vehicles:TrafficMarker[],engagedId:number|null=null,speakingIds:number[]=[]){
    const dt=Math.max(0,Math.min(.05,time-lastTime));lastTime=time;
    for(const n of people){
      const oldX=n.x;
      n.distance=distanceBetween(n,viewer);n.visible=n.distance<125;n.talking=n.id===engagedId||speakingIds.includes(n.id);n.yielding=false;
      const canMove=n.group<0&&n.id!==engagedId&&time>=n.holdUntil;
      n.moving=false;
      if(canMove){
        if(n.wait>0)n.wait-=dt;
        else{
          const target=n.route[n.target],distance=distanceBetween(n,target);
          if(distance<.22){n.target=(n.target+1)%n.route.length;n.wait=.4+(n.id%7)*.24;}
          else{
            const vx=(target.x-n.x)/distance,vz=(target.z-n.z)/distance,next={x:n.x+vx*n.speed*dt,z:n.z+vz*n.speed*dt};
            const hazard=vehicles.some(v=>Math.abs(next.x-v.x)<2.05&&Math.abs(next.z-v.z)<(v.kind==='wagon'?6:6.1)+Math.abs(v.speed)*1.35&&Math.abs(n.x-v.x)>1.55);
            const close=distanceBetween(next,viewer)<.75&&distanceBetween(n,viewer)>=.7||people.some(other=>other.id!==n.id&&distanceBetween(next,other)<.45&&distanceBetween(n,other)>.43&&other.id<n.id);
            n.yielding=hazard;
            if(!hazard&&!close&&(n.x<95||harborWalkable(next))){n.x=next.x;n.z=next.z;n.yaw=Math.atan2(vx,vz);n.moving=true;n.phase+=dt*n.speed*5.8;}
          }
        }
      }
      const separated=separateTraffic(n,n,vehicles,.25);
      if(separated.x!==n.x||separated.z!==n.z){n.x=separated.x;n.z=separated.z;n.yielding=true;n.moving=false;}
      n.hop=advanceRailHop(n.hop,dt,n,dt>0?(n.x-oldX)/dt:0,n.moving,pedestrianPace(n.id,n.style));
      if(n.talking){const angle=Math.atan2(viewer.x-n.x,viewer.z-n.z),delta=Math.atan2(Math.sin(angle-n.yaw),Math.cos(angle-n.yaw));n.yaw+=delta*Math.min(1,dt*5);}
    }
    for(const batch of batches){
      let index=0;
      for(const n of batch.people){
        const running=pedestrianPace(n.id,n.style)==='run',stride=n.moving?Math.sin(n.phase)*(running?.6:.32):0,bob=n.moving?Math.abs(Math.sin(n.phase))*.018:Math.sin(time*1.4+n.id)*.003;
        if(batch.part==='body')pose(batch.matrices,index++,n,0,bob,0,n.moving&&running?.12:0,n.moving?Math.sin(n.phase)*.016:0);
        else for(const side of[-1,1]){
          const skirt=n.style===2||n.style===5;
          if(batch.part==='arm'||batch.part==='forearm'){
            let arm=-stride*side;
            if(n.style===1&&side===1)arm=-.7;
            if(n.style===3&&side===-1)arm=-.27;
            if(n.talking&&side===1)arm=-.65+Math.sin(time*3.1)*.17;
            if(batch.part==='arm')pose(batch.matrices,index++,n,side*.245,1.30+bob,0,arm,side*.05);
            else pose(batch.matrices,index++,n,side*.26,1.30-Math.cos(arm)*.32+bob,-Math.sin(arm)*.32,arm-.12-(n.talking&&side===1?.28:0));
          }else{
            const leg=stride*side*(skirt?.43:1),bend=n.moving?Math.max(0,-Math.sin(n.phase)*side)*(running?.8:.38):0,hip=.83;
            const kneeY=hip-Math.cos(leg)*.38,kneeZ=-Math.sin(leg)*.38;
            if(batch.part==='thigh')pose(batch.matrices,index++,n,side*.115,hip+bob,0,leg);
            else if(batch.part==='calf')pose(batch.matrices,index++,n,side*.115,kneeY+bob,kneeZ,leg+bend);
            else pose(batch.matrices,index++,n,side*.115,Math.max(.067,kneeY-Math.cos(leg+bend)*.38)+bob,kneeZ-Math.sin(leg+bend)*.38,Math.min(.15,leg+bend));
          }
        }
      }
      for(const mesh of batch.meshes)mesh.thinInstanceBufferUpdated('matrix');
    }
  }
  return{people,meshes,update,
    nearest(point:StreetPoint,radius=6){return people.filter(n=>n.visible&&distanceBetween(n,point)<radius).sort((a,b)=>distanceBetween(a,point)-distanceBetween(b,point))[0]??null;},
    hold(id:number,until:number){const person=people[id];if(person)person.holdUntil=until;},
    reset(){for(const n of people){n.hop=groundedRailHop();n.x=n.route[0].x;n.z=n.route[0].z;n.yaw=initial[n.id].yaw;n.phase=initial[n.id].phase;n.target=n.route.length>1?1:0;n.wait=initial[n.id].wait;n.holdUntil=0;n.talking=false;n.moving=false;n.yielding=false;n.visible=true;n.distance=0;}lastTime=0;},
    snapshot(){return{count:people.length,moving:people.filter(n=>n.moving).length,running:people.filter(n=>n.moving&&pedestrianPace(n.id,n.style)==='run').length,hopping:people.filter(n=>n.hop.height>0).length,crossing:people.filter(n=>n.crossing&&Math.abs(n.x)<14.3&&n.moving).length,inRoad:people.filter(n=>Math.abs(n.x)<14.3).length,yielding:people.filter(n=>n.yielding).length,visible:people.filter(n=>n.visible).length,groups:groups.length,sourceMeshes:meshes.length,rendering:'thin instances',people:people.map(n=>({id:n.id,x:n.x,z:n.z,role:n.role,moving:n.moving,talking:n.talking,crossing:n.crossing,yielding:n.yielding}))};}
  };
}
export type Crowd=ReturnType<typeof createCrowd>;
