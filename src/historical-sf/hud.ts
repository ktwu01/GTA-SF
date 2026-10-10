import { createRouteGuide } from './route-guide';
import { harborHeight, harborZones } from './harbor-layout';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Matrix, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Scene } from '@babylonjs/core/scene';
import type { Crowd, TrafficMarker } from './crowd';
import { createDialogue, hasStreetSight } from './dialogue';
import { bearingFromYaw, cardinalFromYaw, destinations, distanceBetween, FERRY_BEARING, routeDistance, routeTo, streetBlocks, worldToRadar, type DestinationId, type StreetPoint } from './navigation';

type HUDFrame={time:number;active:boolean;paused:boolean;mode:'walk'|'tram';vehicles:TrafficMarker[];speed:number;boardDistance:number;canBoard:boolean};
type BubbleDiagnostic={id:number;text:string;world:StreetPoint;screen:{x:number;y:number};visible:boolean;reason:string};
export function createStreetHUD(scene:Scene,camera:FreeCamera,crowd:Crowd,dialogue:ReturnType<typeof createDialogue>,canvas:HTMLCanvasElement,onBoard:()=>boolean){
  const root=document.createElement('div');root.className='street-hud';
  root.innerHTML=`
    <aside class="radar-shell" data-hud-part="radar" aria-label="Street map and approximate compass"><canvas class="radar" width="460" height="460" aria-label="Rotating street map"></canvas></aside>
    <div class="waypoint-card" data-hud-part="waypoint" hidden><span class="waypoint-name"></span><span class="waypoint-distance"></span><button class="waypoint-clear" aria-label="Clear waypoint">×</button></div>
    <div class="speech-layer" aria-label="Street conversation"></div>
    <button class="context-prompt" data-hud-part="context" hidden><kbd>E</kbd><span>Enter streetcar</span></button>
    <section class="conversation-choices" data-hud-part="replies" aria-label="Conversation" hidden><button class="conversation-close" aria-label="End conversation">×</button><p class="conversation-line" hidden></p><div class="reply-list"></div></section>
    <div class="speed-readout" data-hud-part="speed" hidden><strong>0</strong><span>mph</span></div>
  `;
  document.querySelector('.experience')!.append(root);
  const $=<T extends HTMLElement>(selector:string)=>root.querySelector<T>(selector)!;
  const radar=$<HTMLCanvasElement>('.radar'),ctx=radar.getContext('2d')!,prompt=$<HTMLButtonElement>('.context-prompt'),choices=$<HTMLElement>('.conversation-choices');
  const bubble=document.createElement('div');bubble.className='speech-bubble';bubble.dataset.hudPart='speech';bubble.hidden=true;bubble.innerHTML='<p></p>';$('.speech-layer').append(bubble);

  const guide=createRouteGuide(scene),discoveries=new Set<DestinationId>();
  let currentRoute:StreetPoint[]=[],routeTime=-Infinity,arrived=false,lastRoutePosition={x:Infinity,z:Infinity};
  let destination:DestinationId|null=null,lastChoices='',drawTime=-1,hudVisible=true,context:'board'|null=null;
  let latest:HUDFrame={time:0,active:false,paused:false,mode:'walk',vehicles:[],speed:0,boardDistance:Infinity,canBoard:false},bubbleDiagnostics:BubbleDiagnostic[]=[];
  const focus=()=>canvas.focus();
  const selectDestination=(id:DestinationId|null)=>{destination=id;drawTime=-1;routeTime=-Infinity;arrived=false;lastRoutePosition={x:Infinity,z:Infinity};if(!id){currentRoute=[];guide.reset();}};
  const reply=(index:number)=>{const next=dialogue.choose(index);if(next)selectDestination(next);focus();};
  const end=()=>{dialogue.end();focus();};
  prompt.addEventListener('click',()=>{if(context==='board')onBoard();focus();});
  $('.waypoint-clear').addEventListener('click',()=>{selectDestination(null);focus();});

  $('.conversation-close').addEventListener('click',end);
  function drawMap(frame:HUDFrame){
    const size=230,cx=115,cy=113,radius=92,scale=1.34;
    ctx.setTransform(2,0,0,2,0,0);ctx.clearRect(0,0,size,size);ctx.save();ctx.translate(cx,cy);
    ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.clip();ctx.fillStyle='#293f38';ctx.fillRect(-radius,-radius,radius*2,radius*2);
    const point=(p:StreetPoint)=>worldToRadar(p,camera.position,camera.rotation.y,scale);
    const poly=(points:StreetPoint[],fill:string,stroke?:string)=>{ctx.beginPath();points.forEach((p,i)=>{const s=point(p);if(i)ctx.lineTo(s.x,s.y);else ctx.moveTo(s.x,s.y);});ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=.7;ctx.stroke();}};
    poly([{x:-200,z:615},{x:200,z:615},{x:200,z:850},{x:-200,z:850}],'#4a6870');
    poly([{x:-17.8,z:290},{x:17.8,z:290},{x:17.8,z:533},{x:110,z:533},{x:110,z:567},{x:-110,z:567},{x:-110,z:533},{x:-17.8,z:533}],'#c0bba1','#d4ccb2');
    for(const zone of harborZones)poly([{x:zone.x-zone.width/2,z:zone.z-zone.depth/2},{x:zone.x+zone.width/2,z:zone.z-zone.depth/2},{x:zone.x+zone.width/2,z:zone.z+zone.depth/2},{x:zone.x-zone.width/2,z:zone.z+zone.depth/2}],'#c0bba1','#d4ccb2');
    poly([{x:215,z:632},{x:225,z:632},{x:225,z:679},{x:215,z:679}],'#8d8063','#dacdaa');
    for(const b of streetBlocks)poly([{x:b.x-b.width/2,z:b.z-b.depth/2},{x:b.x+b.width/2,z:b.z-b.depth/2},{x:b.x+b.width/2,z:b.z+b.depth/2},{x:b.x-b.width/2,z:b.z+b.depth/2}],'#627064','#1c332b');
    ctx.strokeStyle='#5e6559';ctx.lineWidth=1;for(const x of[-3.77,-2.53,2.53,3.77]){const a=point({x,z:320}),b=point({x,z:557});ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
    for(const side of[-1,1]){ctx.beginPath();for(let i=0;i<=24;i++){const t=i/24,p=point({x:side*(3.15+67*t*t),z:510+49*(1-(1-t)**3)});if(i)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);}ctx.stroke();}
    const goal=destinations.find(p=>p.id===destination);if(goal){const route=currentRoute;
    ctx.beginPath();route.forEach((p,i)=>{const s=point(p);if(i)ctx.lineTo(s.x,s.y);else ctx.moveTo(s.x,s.y);});ctx.strokeStyle='#7bc8ec';ctx.lineWidth=2.5;ctx.setLineDash([]);ctx.stroke();ctx.setLineDash([]);}
    for(const n of crowd.people){const p=point(n);if(Math.hypot(p.x,p.y)>radius-3)continue;ctx.fillStyle=n.id===dialogue.activeId?'#f6d48d':n.group>=0?'#e6d8b5':'#887b60';ctx.beginPath();ctx.arc(p.x,p.y,n.id===dialogue.activeId?3:1.8,0,Math.PI*2);ctx.fill();}
    for(const v of frame.vehicles){const p=point(v);if(Math.hypot(p.x,p.y)>radius-4)continue;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(-camera.rotation.y);ctx.fillStyle=v.player?'#e1b772':v.kind==='tram'?'#2c605b':'#785940';ctx.strokeStyle=v.player?'#ffe4a2':'#d4c8a5';ctx.lineWidth=.7;ctx.fillRect(-2.4,-5,4.8,10);ctx.strokeRect(-2.4,-5,4.8,10);ctx.restore();}
    for(const d of destinations){const p=worldToRadar(d,camera.position,camera.rotation.y,scale,radius-8);if(p.clamped&&d.id!==destination)continue;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.PI/4);ctx.fillStyle=d.id===destination?'#e8bd72':'#364b41';ctx.strokeStyle='#eadcb8';ctx.lineWidth=1.2;ctx.fillRect(-3.6,-3.6,7.2,7.2);ctx.strokeRect(-3.6,-3.6,7.2,7.2);ctx.restore();}
    ctx.beginPath();ctx.moveTo(0,-9);ctx.lineTo(6.5,7);ctx.lineTo(0,3.5);ctx.lineTo(-6.5,7);ctx.closePath();ctx.fillStyle='#fff6df';ctx.strokeStyle='#213e33';ctx.lineWidth=1.7;ctx.fill();ctx.stroke();ctx.restore();
    ctx.beginPath();ctx.arc(cx,cy,radius+1.5,0,Math.PI*2);ctx.strokeStyle='#acac8d';ctx.lineWidth=1;ctx.stroke();
    for(let angle=0;angle<360;angle+=15){const a=(angle-FERRY_BEARING)*Math.PI/180-camera.rotation.y;ctx.strokeStyle=angle%90===0?'#f3e6c5':'#748477';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(cx+Math.sin(a)*98,cy-Math.cos(a)*98);ctx.lineTo(cx+Math.sin(a)*(angle%90===0?102:100),cy-Math.cos(a)*(angle%90===0?102:100));ctx.stroke();}
    for(const [label,bearing] of[['N',0],['E',90],['S',180],['W',270]] as const){const a=(bearing-FERRY_BEARING)*Math.PI/180-camera.rotation.y;ctx.fillStyle=label==='N'?'#f1cc84':'#b7bd9f';ctx.font=label==='N'?'bold 11px Arial':'9px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,cx+Math.sin(a)*109,cy-Math.cos(a)*109);}
    radar.setAttribute('aria-label',`Street map. Facing ${cardinalFromYaw(camera.rotation.y)}.${goal?` ${goal.name}, ${Math.round(routeDistance(currentRoute))} meters away.`:''}`);
  }


  function update(frame:HUDFrame){
    latest=frame;const show=frame.active&&!frame.paused&&hudVisible;root.hidden=!show;
    const goal=destinations.find(d=>d.id===destination);
    if(goal&&show){arrived=distanceBetween(camera.position,goal)<3;if(arrived){discoveries.add(goal.id);currentRoute=[];guide.reset();}}
    if(goal&&show&&frame.time-routeTime>.65){
      routeTime=frame.time;
      if(distanceBetween(camera.position,lastRoutePosition)>.8||arrived){currentRoute=arrived?[]:routeTo(camera.position,goal);guide.setRoute(currentRoute);lastRoutePosition={x:camera.position.x,z:camera.position.z};}
    }
    guide.setVisible(show&&!arrived);
    $('.waypoint-card').hidden=!show||!goal;
    if(goal){$('.waypoint-name').textContent=goal.name;$('.waypoint-distance').textContent=arrived?'Arrived':currentRoute.length?`${Math.round(routeDistance(currentRoute))} m`:'No walking route';}
    const state=dialogue.state();context=null;
    const facing=(point:StreetPoint)=>Math.cos(Math.atan2(point.x-camera.position.x,point.z-camera.position.z)-camera.rotation.y)>.72;
    const car=frame.vehicles.find(v=>v.player);
    if(show&&state.activeId===null){
      if(frame.mode==='tram')context='board';
      else if(frame.canBoard&&frame.boardDistance<5.5&&car&&facing(car))context='board';
    }
    prompt.hidden=!context;
    if(context){prompt.querySelector('kbd')!.textContent='E';prompt.querySelector('span')!.textContent=frame.mode==='tram'?'Leave streetcar':'Enter streetcar';}
    $('.speed-readout').hidden=!show||frame.mode!=='tram';$('.speed-readout strong').textContent=String(Math.round(frame.speed*2.23694));
    choices.hidden=!show||state.activeId===null||state.stage==='reply';
    const choiceKey=`${state.activeId}-${state.stage}`;
    if(choiceKey!==lastChoices){
      lastChoices=choiceKey;$('.reply-list').innerHTML='';
      if(state.stage==='greeting')for(const [index,label] of state.choices.entries()){const button=document.createElement('button');button.innerHTML=`<kbd>${index+1}</kbd><span></span>`;button.querySelector('span')!.textContent=label;button.addEventListener('click',()=>reply(index));$('.reply-list').append(button);}
    }
    const width=canvas.clientWidth,height=canvas.clientHeight,engine=scene.getEngine(),viewport=camera.viewport.toGlobal(engine.getRenderWidth(),engine.getRenderHeight());
    const occupied=Array.from(document.querySelectorAll<HTMLElement>('[data-hud-part]')).filter(el=>el!==bubble&&el!==choices&&!el.hidden&&el.getClientRects().length).map(el=>el.getBoundingClientRect());
    if(!choices.hidden)occupied.push(choices.getBoundingClientRect());
    bubbleDiagnostics=[];bubble.hidden=true;
    const speech=state.speech.find(s=>s.active)??state.speech[0];
    if(speech){
      const n=crowd.people[speech.id],distance=distanceBetween(n,camera.position),world=new Vector3(n.x,n.height*n.scale+.27+(n.x>=95?harborHeight(n):0)+(n.x<95&&n.z<534&&Math.abs(n.x)>14.35?.22:0),n.z);
      const projected=Vector3.Project(world,Matrix.IdentityReadOnly,scene.getTransformMatrix(),viewport),x=projected.x/engine.getRenderWidth()*width,y=projected.y/engine.getRenderHeight()*height;
      let reason=!show?'hidden':distance>(speech.active?9:26)?'distance':projected.z<0||projected.z>1?'behind':!hasStreetSight(camera.position,n,frame.vehicles)?'occluded':'';
      bubble.querySelector('p')!.textContent=speech.text;
      if(!reason){
        bubble.hidden=false;const w=bubble.offsetWidth,h=bubble.offsetHeight,box={left:x-w/2,right:x+w/2,top:y-h,bottom:y};
        if(x<w/2+12||x>width-w/2-12||y-h<16||y>height-20)reason='offscreen';
        else if(occupied.some(r=>box.left<r.right+8&&box.right>r.left-8&&box.top<r.bottom+8&&box.bottom>r.top-8))reason='overlap';
        else{bubble.style.left=`${x}px`;bubble.style.top=`${y}px`;}
      }
      bubble.hidden=!!reason;bubbleDiagnostics.push({id:n.id,text:speech.text,world:{x:n.x,z:n.z},screen:{x:Math.round(x),y:Math.round(y)},visible:!reason,reason:reason||'visible'});
    }
    const activeSpeech=state.speech.find(s=>s.active),fallback=show&&activeSpeech&&!bubbleDiagnostics.some(b=>b.id===activeSpeech.id&&b.visible);
    $('.conversation-line').hidden=!fallback;if(fallback){$('.conversation-line').textContent=activeSpeech.text;choices.hidden=false;}
    choices.classList.toggle('reply-only',state.stage==='reply');
    if(show&&frame.time-drawTime>.08){drawMap(frame);drawTime=frame.time;}
  }

  return{update,reply,end,selectDestination,
    setVisible(value:boolean){hudVisible=value;root.hidden=!value;guide.setVisible(value&&latest.active&&!latest.paused&&!arrived);},

    escape(){if(dialogue.activeId!==null){end();return true;}return false;},
    reset(){destination=null;drawTime=-1;lastChoices='';routeTime=-Infinity;currentRoute=[];arrived=false;lastRoutePosition={x:Infinity,z:Infinity};discoveries.clear();guide.reset();},
    snapshot(){const goal=destinations.find(p=>p.id===destination);return{visible:hudVisible,context,conversation:dialogue.state(),bubbles:bubbleDiagnostics,discoveries:[...discoveries],route:{points:currentRoute,arrived},minimap:{player:{x:camera.position.x,z:camera.position.z},yaw:camera.rotation.y,bearing:bearingFromYaw(camera.rotation.y),cardinal:cardinalFromYaw(camera.rotation.y),sceneForwardBearing:FERRY_BEARING,destination:goal?{...goal,distance:routeDistance(currentRoute)}:null}};}
  };
}
