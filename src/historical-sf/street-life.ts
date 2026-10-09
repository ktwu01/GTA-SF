import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { Scene } from '@babylonjs/core/scene';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { Masonry } from './geometry';
import { type Palette, random } from './materials';

function wheel(b:Masonry,p:Palette,x:number,y:number,z:number,r:number) {
  for(let i=0;i<16;i++) {
    const a=i/16*Math.PI*2,c=(i+1)/16*Math.PI*2;
    b.beam(p.black,[x,y+Math.cos(a)*r,z+Math.sin(a)*r],[x,y+Math.cos(c)*r,z+Math.sin(c)*r],.055,5);
    if(i%2===0)b.beam(p.wood,[x,y,z],[x,y+Math.cos(a)*r,z+Math.sin(a)*r],.027,4);
  }
  b.beam(p.rail,[x-.08,y,z],[x+.08,y,z],.11,8);
}

function person(b:Masonry,p:Palette,x:number,z:number,skirt:boolean,coat=p.coat,scale=1) {
  const y=0, s=scale;
  if(skirt){b.cylinder(coat,x,y+.57*s,z,.33*s,.92*s,.18*s,10);b.ellipsoid(coat,x,1.21*s,z,.22*s,.27*s,.16*s,false,14);}
  else {b.ellipsoid(coat,x,1.07*s,z,.25*s,.36*s,.16*s,false,14);b.beam(coat,[x-.13*s,.75*s,z],[x-.18*s,.12*s,z+.09*s],.08*s);b.beam(coat,[x+.13*s,.75*s,z],[x+.17*s,.12*s,z-.1*s],.08*s);}
  b.ellipsoid(p.skin,x,1.58*s,z,.13*s,.19*s,.13*s,false,10);
  b.cylinder(p.black,x,1.76*s,z,.24*s,.05*s,.24*s,12);b.cylinder(p.black,x,1.85*s,z,.145*s,.17*s,.13*s,10);
  for(const side of[-1,1]){b.beam(coat,[x+side*.25*s,1.29*s,z],[x+side*.3*s,.83*s,z+.04*s],.065*s);b.ellipsoid(p.skin,x+side*.3*s,.8*s,z+.04*s,.06*s,.08*s,.06*s,false,8);}
  b.box(p.black,x-.15*s,.055*s,z+.04*s,.14*s,.11*s,.27*s);b.box(p.black,x+.15*s,.055*s,z-.03*s,.14*s,.11*s,.27*s);
}

function tram(scene:Scene,p:Palette,color=p.green) {
  const root=new TransformNode('electric-streetcar',scene),b=new Masonry(scene,'streetcar');
  b.box(p.black,0,.57,0,2.28,.25,7.6);
  for(let x=-1.14;x<1.2;x+=.15)b.box(p.wood,x,.76,0,.13,.09,7.55);
  for(const side of[-1,1]){
    b.box(color,side*1.19,1.34,0,.13,1.08,5.25);
    b.box(p.ivory,side*1.28,1.88,0,.11,.10,5.48);b.box(p.brass,side*1.27,1.13,0,.05,.04,5.45);
    b.box(p.ivory,side*1.28,.92,0,.08,.09,5.45);
    for(let j=-2;j<=2;j++){
      const zz=j*1.04;b.box(p.tramGlass,side*1.205,2.49,zz,.025,1.11,.87);
      b.box(p.ivory,side*1.27,2.49,zz-.51,.085,1.37,.105);
      b.box(p.ivory,side*1.27,3.1,zz,.09,.13,1.07);
      b.box(p.darkTrim,side*1.27,2.52,zz,.065,.055,.89);
      b.box(p.darkTrim,side*1.28,1.42,zz-.48,.045,.67,.055);
      b.box(p.brass,side*1.29,1.03,zz,.025,.025,.78);
    }
    b.box(p.wood,side*.72,1.09,0,.53,.12,4.92);
    for(let j=0;j<5;j++)b.box(p.wood,side*1.0,1.23+j*.11,0,.07,.083,4.92);
    for(const zz of[-1.85,1.85])b.box(p.black,side*.75,.91,zz,.05,.32,.18);
    b.beam(p.brass,[side*.92,2.98,-2.38],[side*.92,2.98,2.38],.035);
    for(const zz of[-1.7,-.6,.6,1.7])b.beam(p.leather,[side*.92,2.97,zz],[side*.92,2.63,zz],.021);
  }
  b.ellipsoid(p.roof,0,3.15,0,1.5,.32,3.93,true,28);b.box(p.ivory,0,3.16,0,2.83,.10,7.73);
  b.box(p.wood,0,3.51,0,1.55,.39,5.77);
  for(const side of[-1,1])for(let zz=-2.4;zz<=2.4;zz+=.59)b.box(p.tramGlass,side*.79,3.56,zz,.03,.22,.4);
  b.ellipsoid(p.roof,0,3.75,0,1.0,.20,3.16,true,24);
  for(const end of[-1,1]){
    const zz=end*2.68;b.box(p.wood,0,1.93,zz,.65,2.29,.15);
    for(const x of[-.87,.87]){b.box(p.tramGlass,x,2.45,zz,.70,1.03,.025);for(const dx of[-.39,.39])b.box(p.ivory,x+dx,2.37,zz,.08,1.35,.16);b.box(p.ivory,x,3.02,zz,.87,.13,.16);b.box(color,x,1.36,zz,.87,.69,.14);}
    for(const x of[-1.16,1.16])b.box(p.ivory,x,2.03,end*3.61,.087,2.25,.09);
    for(const yy of[1.06,1.46,1.85])b.box(p.ivory,0,yy,end*3.62,2.36,.075,.085);
    b.box(color,0,1.02,end*3.6,2.32,.56,.11);b.box(p.brass,0,1.2,end*3.69,1.54,.032,.04);
    b.box(p.black,0,.63,end*3.88,2.42,.09,.53);b.box(p.wood,0,.46,end*4.0,2.30,.075,.31);
    b.ellipsoid(p.ivory,0,1.0,end*3.73,.19,.19,.10,false,16);
    b.cylinder(p.brass,-.52,1.29,end*3.05,.19,1.0,.15,16);b.box(p.black,-.52,1.82,end*3.05,.47,.09,.32);b.beam(p.brass,[-.52,1.89,end*3.05],[-.10,1.89,end*3.05],.04);
    b.beam(p.black,[.62,.87,end*3.12],[.62,1.55,end*3.12],.055);
    for(let i=0;i<16;i++){const a=i/16*Math.PI*2,c=(i+1)/16*Math.PI*2;b.beam(p.brass,[.62+Math.cos(a)*.23,1.58,end*3.12+Math.sin(a)*.23],[.62+Math.cos(c)*.23,1.58,end*3.12+Math.sin(c)*.23],.021,5);}
    b.ellipsoid(p.brass,0,3.08,end*3.4,.15,.13,.15,true,12);
  }
  for(const zz of[-2.0,2.0]){b.beam(p.black,[-1.3,.45,zz],[1.3,.45,zz],.09);for(const x of[-1.17,1.17])wheel(b,p,x,.49,zz,.43);for(const x of[-.9,.9]){b.box(p.black,x,.55,zz,.12,.19,1.0);b.box(p.rust,x,.68,zz,.13,.05,.9);}}
  b.beam(p.black,[0,3.98,-.8],[0,6.75,2.75],.022);b.box(p.black,0,6.75,2.75,.48,.08,.08);
  return {root,meshes:b.finish(root)};
}

function wagon(scene:Scene,p:Palette,covered:boolean) {
  const root=new TransformNode('horse-drawn-wagon',scene),b=new Masonry(scene,'wagon');
  b.box(p.wood,0,.93,-.65,1.75,.24,2.8);b.box(p.wood,0,1.25,-1.95,1.85,.64,.12);
  for(const side of[-1,1]){b.box(p.wood,side*.85,1.25,-.65,.13,.64,2.8);for(const zz of[-1.62,.35])wheel(b,p,side*.99,.65,zz,.63);}
  b.box(p.black,0,1.62,.6,1.7,.18,.7);
  if(covered){b.box(p.cloth,0,1.85,-.88,1.63,1.24,2.0);b.ellipsoid(p.cloth,0,2.35,-.88,.87,.5,1.02,true,16);}
  else{b.box(p.cloth,-.35,1.25,-1, .65,.35,.8);b.box(p.warm,.38,1.33,-.35,.62,.55,.62);}
  b.ellipsoid(p.horse,0,1.42,3,.38,.5,.88,false,14);
  b.ellipsoid(p.horse,0,1.86,3.59,.27,.61,.4,false,12);
  b.ellipsoid(p.horse,0,2.22,3.86,.23,.29,.43,false,12);
  b.ellipsoid(p.mane,0,2.22,3.62,.12,.31,.13,false,10);
  for(const side of[-1,1])for(const zz of[2.45,3.52]){b.beam(p.horse,[side*.23,1.24,zz],[side*.29,.3,zz+.13],.085);b.box(p.mane,side*.29,.22,zz+.2,.18,.21,.27);}
  b.beam(p.mane,[0,1.6,2.2],[.08,.65,2.0],.07);
  b.beam(p.horse,[-.12,2.44,3.75],[-.15,2.69,3.72],.06);b.beam(p.horse,[.12,2.44,3.75],[.15,2.69,3.72],.06);
  for(const side of[-1,1]){b.beam(p.wood,[side*.77,.98,.55],[side*.58,1.19,3.3],.035);b.beam(p.black,[side*.14,1.9,.8],[side*.26,2.14,3.85],.012);}
  b.beam(p.black,[-.36,1.75,2.7],[.36,1.75,2.7],.07);
  // Seated driver's silhouette: the coat meets the seat, above the wagon bed.
  b.box(p.coat,0,1.98,.55,.45,.6,.3);b.ellipsoid(p.skin,0,2.4,.55,.13,.18,.13,false,10);
  b.cylinder(p.black,0,2.57,.55,.25,.05,.25,12);b.cylinder(p.black,0,2.66,.55,.15,.18,.13,10);
  const meshes=b.finish(root);return {root,meshes};
}

export function streetLife(scene:Scene,p:Palette) {
  const casters:Mesh[]=[],moving:{root:TransformNode;speed:number;start:number;lane:number;kind:string}[]=[];
  for(const [z,lane,speed] of [[426,-3.15,-1.75],[531,-3.15,-1.7]]){
    const model=tram(scene,p,z<300?p.red:p.green);model.root.position.set(lane,.06,z);if(speed<0)model.root.rotation.y=Math.PI;
    casters.push(...model.meshes);moving.push({root:model.root,speed,start:z,lane,kind:'tram'});
  }
  for(const [i,z] of [390,445,478,506,547].entries()){
    const model=wagon(scene,p,i%3===0),lane=i%2?10:-10,speed=i%2?1.4:-1.2;
    model.root.position.set(lane,.02,z);if(speed<0)model.root.rotation.y=Math.PI;
    casters.push(...model.meshes);moving.push({root:model.root,speed,start:z,lane,kind:'wagon'});
  }
  const rng=random(1976),crowd=new Masonry(scene,'sidewalk-crowd');
  for(let i=0;i<34;i++){
    const side=i%2?1:-1,x=side*(15.1+rng()*2.2),z=355+rng()*190;
    person(crowd,p,x,z,i%4===0,i%4===0?p.skirt:i%3===0?p.navy:p.coat,.91+rng()*.16);
  }
  casters.push(...crowd.finish());
  for(let i=0;i<10;i++){
    const root=new TransformNode(`walking-person-${i}`,scene),b=new Masonry(scene,`walking-person-${i}`);
    person(b,p,0,0,i%3===0,i%3===0?p.skirt:p.coat);casters.push(...b.finish(root));
    const lane=(i%2?1:-1)*(14.8+(i%3)*.65),z=355+i*19;
    root.position.set(lane,.22,z);const speed=(i%2?1:-1)*.7;if(speed<0)root.rotation.y=Math.PI;
    moving.push({root,speed,start:z,lane,kind:'pedestrian'});
  }
  const player=tram(scene,p,p.green);player.root.position.set(3.15,.03,358);casters.push(...player.meshes);
  return {casters,player,update(time:number){for(const m of moving){let z=340+((m.start-340+m.speed*time+22000)%220);m.root.position.z=z;m.root.position.y=m.kind==='pedestrian'?.22+Math.abs(Math.sin(time*3.4+m.start))*.023:.03;}}};
}

export function streetGround(scene:Scene,p:Palette) {
  const casters:Mesh[]=[],base=MeshBuilder.CreateGround('setted-terminal-apron',{width:260,height:320},scene);base.position.z=455;base.material=p.road;base.receiveShadows=true;
  for(const side of[-1,1]){
    const sidewalk=MeshBuilder.CreateGround('granite-sidewalk',{width:3.8,height:210},scene);sidewalk.position.set(side*16.3,.22,427);sidewalk.material=p.pavement;sidewalk.receiveShadows=true;
    const bed=MeshBuilder.CreateGround('worn-cable-track-bed',{width:2.88,height:235},scene);bed.position.set(side*3.15,.018,440);bed.material=p.trackbed;bed.receiveShadows=true;
  }
  const b=new Masonry(scene,'terminal-street-fittings');
  for(const side of[-1,1]){
    b.box(p.trim,side*14.3,.11,427,.27,.25,210);
    for(let i=0;i<15;i++){const a=i/15*Math.PI/2,c=(i+1)/15*Math.PI/2;const x=(angle:number)=>side*(17.3-3*Math.cos(angle)),z=(angle:number)=>532+3*Math.sin(angle);b.beam(p.trim,[x(a),.14,z(a)],[x(c),.14,z(c)],.14,5);}
    b.box(p.trim,side*56,.1,535,78,.21,.23);
  }
  for(const center of[-3.15,3.15])for(const side of[-1,1]){b.box(p.darkTrim,center+side*.62,.035,440,.145,.06,236);b.box(p.rail,center+side*.62,.073,440,.051,.027,236);}
  for(const center of[-3.15,3.15])b.box(p.black,center,.038,440,.048,.026,236);
  for(const side of[-1,1])for(const off of[-.62,.62]){
    const point=(t:number):[number,number,number]=>[side*(3.15+off+67*t*t),.064,510+49*(1-(1-t)**3)];
    for(let i=0;i<48;i++)b.beam(p.rail,point(i/48),point((i+1)/48),.026,5);
  }
  for(const side of[-1,1])for(const z of[355,411,466,530]){
    const x=side*15.1;b.cylinder(p.black,x,.42,z,.19,.82,.12,12);b.cylinder(p.black,x,3.0,z,.062,5.25,.048,12);b.cylinder(p.brass,x,5.5,z,.12,.15,.13,12);
    for(const arm of[-1,0,1]){
      const xx=x+arm*.6,yy=arm===0?6.25:5.84;b.beam(p.black,[x,5.45,z],[xx,yy-.2,z],.027,8);b.cylinder(p.black,xx,yy-.19,z,.14,.14,.12,12);b.ellipsoid(p.ivory,xx,yy,z,.18,.23,.18,false,16);
    }
  }
  for(const z of[372,427,480,532]){
    for(const side of[-1,1]){const x=side*15.8;b.cylinder(p.darkTrim,x,4.15,z,.09,8.3,.065,12);b.box(p.black,x,8.11,z,2.4,.09,.12);for(const dx of[-.9,-.3,.3,.9])b.cylinder(p.ivory,x+dx,8.23,z,.045,.16,.037,8);}
    for(let i=0;i<12;i++){const x=-15.8+i*31.6/12,xx=x+31.6/12,y=(u:number)=>8.1-1.33*(1-(u/15.8)**2);b.beam(p.black,[x,y(x),z],[xx,y(xx),z],.011,4);}
  }
  for(const x of[-3.15,3.15])b.beam(p.black,[x,6.77,320],[x,6.77,554],.010,5);
  for(let x=-91;x<=92;x+=4.5)if(Math.abs(x)>14){b.cylinder(p.black,x,.52,546,.055,1.04,.055,8);b.ellipsoid(p.black,x,1.06,546,.08,.08,.08,false,8);}
  for(const x of[-43,43]){
    for(let k=0;k<7;k++)b.box(p.wood,x,.56,551+(k-3)*.085,2.65,.055,.067);
    for(let k=0;k<5;k++)b.box(p.wood,x,.79+k*.1,551.33,2.65,.065,.055);
    for(const dx of[-1.0,1.0]){b.beam(p.black,[x+dx,.06,550.8],[x+dx,.59,551.2],.035);b.beam(p.black,[x+dx,.07,551.32],[x+dx,1.24,551.34],.034);}
  }
  for(const [side,z] of [[1,390],[-1,408],[1,502],[-1,518]]){
    const x=side*17.1;
    for(let j=0;j<3;j++){
      const xx=x-(j%2)*side*.55,zz=z+Math.floor(j/2)*.78,y=.47+(j%2)*.44;b.box(p.wood,xx,y,zz,.72,.64,.66);
      for(let k=0;k<5;k++)b.box(p.warm,xx, y-.26+k*.13,zz-.34,.73,.081,.024);
      b.beam(p.darkTrim,[xx-.31,y-.28,zz-.36],[xx+.31,y+.28,zz-.36],.025,4);
    }
    const bx=x-side*.45,bz=z+1.78;b.cylinder(p.wood,bx,.61,bz,.37,.82,.34,20);
    for(const yy of[.31,.85])for(let j=0;j<20;j++){const a=j/20*Math.PI*2,c=(j+1)/20*Math.PI*2;b.beam(p.black,[bx+Math.cos(a)*.37,yy,bz+Math.sin(a)*.37],[bx+Math.cos(c)*.37,yy,bz+Math.sin(c)*.37],.025,4);}
  }
  for(const [x,z] of [[16.4,427],[-16.7,468]]){
    for(const zz of[-.56,.56])wheel(b,p,x,.57,z+zz,.37);
    b.beam(p.black,[x,.57,z-.56],[x,.98,z+.12],.021);b.beam(p.black,[x,.57,z-.56],[x,.57,z],.022);b.beam(p.black,[x,.57,z],[x,.98,z+.12],.021);b.beam(p.black,[x,.98,z+.12],[x,.96,z+.49],.021);b.beam(p.black,[x,.57,z+.56],[x,1.12,z+.45],.022);b.beam(p.black,[x,.57,z],[x,.96,z+.49],.021);
    b.box(p.leather,x,1.04,z+.06,.18,.05,.23);b.beam(p.black,[x-.25,1.17,z+.44],[x+.25,1.17,z+.44],.026);
  }
  for(let z=338;z<556;z+=11)for(const side of[-1,1]){b.box(p.black,side*14.0,.036,z,.36,.02,.58);for(let k=0;k<5;k++)b.box(p.rail,side*14.0,.052,z-.23+k*.115,.32,.015,.024);}
  casters.push(...b.finish());return casters;
}
