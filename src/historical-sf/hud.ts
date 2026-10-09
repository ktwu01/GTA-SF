import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Matrix, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Scene } from '@babylonjs/core/scene';
import type { Crowd, TrafficMarker } from './crowd';
import { createDialogue, hasStreetSight, roleNames } from './dialogue';
import { bearingFromYaw, cardinalFromYaw, destinations, distanceBetween, FERRY_BEARING, routeDistance, routeTo, streetBlocks, worldToRadar, type DestinationId, type StreetPoint } from './navigation';

type HUDFrame={time:number;active:boolean;paused:boolean;mode:'walk'|'tram';vehicles:TrafficMarker[]};
type BubbleDiagnostic={id:number;text:string;world:StreetPoint;screen:{x:number;y:number};visible:boolean;reason:string};
export function createStreetHUD(scene:Scene,camera:FreeCamera,crowd:Crowd,dialogue:ReturnType<typeof createDialogue>,canvas:HTMLCanvasElement){
  const root=document.createElement('div');root.className='street-hud';
  root.innerHTML=`
    <div class="street-clock"><span>3:17 <small>PM</small></span><p>SAT · APRIL 14</p></div>
    <aside class="radar-card" aria-label="Street map and compass">
      <button class="radar-toggle" aria-label="Choose a destination" aria-expanded="false"><span>THE WATERFRONT</span><span>＋</span></button>
      <canvas class="radar" width="460" height="460" aria-label="Rotating map with people, cars, and destination"></canvas>
      <div class="radar-heading"><span class="heading-label">NE</span><span>MARKET STREET</span></div>
      <button class="route-summary" aria-label="Choose a destination"><span class="route-glyph">◇</span><span class="route-name">Ferry Building</span><strong class="route-distance">202 m</strong></button>
      <div class="radar-legend"><span><i class="dot-person"></i>People</span><span><i class="dot-car"></i>Cars</span><span><i class="dot-destination"></i>Place</span></div>
    </aside>
    <section class="map-selector" aria-label="Choose a place to explore" hidden><div class="map-selector-top"><span>EXPLORE THE WATERFRONT</span><button class="map-close" aria-label="Close map destinations">×</button></div><div class="destination-list"></div><p class="map-progress">0 of 4 places found</p><small>Schematic street map · approximate north</small></section>
    <div class="speech-layer" aria-label="Conversations on the street"></div>
    <button class="talk-prompt" hidden><kbd>F</kbd><span>Speak to the news seller</span><span class="talk-mark">···</span></button>
    <section class="conversation-choices" aria-label="Conversation" hidden><div class="conversation-heading"><span></span><button class="conversation-close" aria-label="End conversation">×</button></div><p class="conversation-line" hidden></p><div class="reply-list"></div></section>
    <div class="discovery-toast" role="status" aria-live="polite" hidden><span>PLACE FOUND</span><strong></strong></div>
  `;
  document.querySelector('.experience')!.append(root);
  const $=<T extends HTMLElement>(selector:string)=>root.querySelector<T>(selector)!;
  const radar=$<HTMLCanvasElement>('.radar'),ctx=radar.getContext('2d')!,map=$<HTMLElement>('.map-selector'),talk=$<HTMLButtonElement>('.talk-prompt'),choices=$<HTMLElement>('.conversation-choices');
  const bubbles=Array.from({length:3},()=>{const el=document.createElement('div');el.className='speech-bubble';el.hidden=true;el.innerHTML='<span class="speech-role"></span><p></p>';$('.speech-layer').append(el);return el;});
  let destination:DestinationId='ferry',lastChoices='',lastTalk='',expanded=false,discovered=new Set<DestinationId>(),discoveryUntil=0,drawTime=-1;
  let latest:HUDFrame={time:0,active:false,paused:false,mode:'walk',vehicles:[]},bubbleDiagnostics:BubbleDiagnostic[]=[];
  const focus=()=>canvas.focus();
  const setExpanded=(value:boolean)=>{expanded=value;map.hidden=!value;$('.radar-toggle').setAttribute('aria-expanded',String(value));document.body.classList.toggle('map-open',value);focus();};
  const selectDestination=(id:DestinationId)=>{destination=id;setExpanded(false);syncMapList();};
  function syncMapList(){
    $('.destination-list').innerHTML='';
    for(const point of destinations){
      const b=document.createElement('button');b.dataset.destination=point.id;b.setAttribute('aria-pressed',String(point.id===destination));
      b.innerHTML=`<span class="destination-icon">${discovered.has(point.id)?'✓':point.icon}</span><span>${point.name}<small>${point.detail}</small></span><span>↗</span>`;
      b.addEventListener('click',()=>selectDestination(point.id));$('.destination-list').append(b);
    }
    $('.map-progress').textContent=`${discovered.size} of ${destinations.length} places found`;
  }
  syncMapList();
  $('.radar-toggle').addEventListener('click',()=>setExpanded(!expanded));$('.route-summary').addEventListener('click',()=>setExpanded(!expanded));$('.map-close').addEventListener('click',()=>setExpanded(false));
  const speak=()=>{if(latest.paused||latest.mode!=='walk')return false;const success=dialogue.begin();if(success&&dialogue.activeId!==null){const n=crowd.people[dialogue.activeId];camera.setTarget(new Vector3(n.x,n.height*n.scale-.22+(n.z<534&&Math.abs(n.x)>14.3?.22:0),n.z));}focus();return success;};
  const reply=(index:number)=>{const next=dialogue.choose(index);if(next)selectDestination(next);focus();};
  const end=()=>{dialogue.end();focus();};
  talk.addEventListener('click',speak);$('.conversation-close').addEventListener('click',end);

  function drawMap(frame:HUDFrame){
    const size=230,cx=115,cy=113,radius=92,scale=1.34;
    ctx.setTransform(2,0,0,2,0,0);ctx.clearRect(0,0,size,size);ctx.save();ctx.translate(cx,cy);
    ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.clip();ctx.fillStyle='#293f38';ctx.fillRect(-radius,-radius,radius*2,radius*2);
    const point=(p:StreetPoint)=>worldToRadar(p,camera.position,camera.rotation.y,scale);
    const poly=(points:StreetPoint[],fill:string,stroke?:string)=>{ctx.beginPath();points.forEach((p,i)=>{const s=point(p);if(i)ctx.lineTo(s.x,s.y);else ctx.moveTo(s.x,s.y);});ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=.7;ctx.stroke();}};
    poly([{x:-200,z:615},{x:200,z:615},{x:200,z:850},{x:-200,z:850}],'#4a6870');
    poly([{x:-17.8,z:290},{x:17.8,z:290},{x:17.8,z:533},{x:110,z:533},{x:110,z:567},{x:-110,z:567},{x:-110,z:533},{x:-17.8,z:533}],'#c0bba1','#d4ccb2');
    for(const b of streetBlocks)poly([{x:b.x-b.width/2,z:b.z-b.depth/2},{x:b.x+b.width/2,z:b.z-b.depth/2},{x:b.x+b.width/2,z:b.z+b.depth/2},{x:b.x-b.width/2,z:b.z+b.depth/2}],'#627064','#1c332b');
    ctx.strokeStyle='#5e6559';ctx.lineWidth=1;for(const x of[-3.77,-2.53,2.53,3.77]){const a=point({x,z:320}),b=point({x,z:557});ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
    for(const side of[-1,1]){ctx.beginPath();for(let i=0;i<=24;i++){const t=i/24,p=point({x:side*(3.15+67*t*t),z:510+49*(1-(1-t)**3)});if(i)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);}ctx.stroke();}
    const goal=destinations.find(p=>p.id===destination)!,route=routeTo(camera.position,goal);
    ctx.beginPath();route.forEach((p,i)=>{const s=point(p);if(i)ctx.lineTo(s.x,s.y);else ctx.moveTo(s.x,s.y);});ctx.strokeStyle='#e3bc72';ctx.lineWidth=2;ctx.setLineDash([4,4]);ctx.stroke();ctx.setLineDash([]);
    for(const n of crowd.people){const p=point(n);if(Math.hypot(p.x,p.y)>radius-3)continue;ctx.fillStyle=n.id===dialogue.activeId?'#f6d48d':n.group>=0?'#e6d8b5':'#887b60';ctx.beginPath();ctx.arc(p.x,p.y,n.id===dialogue.activeId?3:1.8,0,Math.PI*2);ctx.fill();}
    for(const v of frame.vehicles){const p=point(v);if(Math.hypot(p.x,p.y)>radius-4)continue;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(-camera.rotation.y);ctx.fillStyle=v.player?'#e1b772':v.kind==='tram'?'#2c605b':'#785940';ctx.strokeStyle=v.player?'#ffe4a2':'#d4c8a5';ctx.lineWidth=.7;ctx.fillRect(-2.4,-5,4.8,10);ctx.strokeRect(-2.4,-5,4.8,10);ctx.restore();}
    for(const d of destinations){const p=worldToRadar(d,camera.position,camera.rotation.y,scale,radius-8);if(p.clamped&&d.id!==destination)continue;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.PI/4);ctx.fillStyle=d.id===destination?'#e8bd72':'#364b41';ctx.strokeStyle='#eadcb8';ctx.lineWidth=1.2;ctx.fillRect(-3.6,-3.6,7.2,7.2);ctx.strokeRect(-3.6,-3.6,7.2,7.2);ctx.restore();}
    ctx.beginPath();ctx.moveTo(0,-9);ctx.lineTo(6.5,7);ctx.lineTo(0,3.5);ctx.lineTo(-6.5,7);ctx.closePath();ctx.fillStyle='#fff6df';ctx.strokeStyle='#213e33';ctx.lineWidth=1.7;ctx.fill();ctx.stroke();ctx.restore();
    ctx.beginPath();ctx.arc(cx,cy,radius+1.5,0,Math.PI*2);ctx.strokeStyle='#acac8d';ctx.lineWidth=1;ctx.stroke();
    for(let angle=0;angle<360;angle+=15){const a=(angle-FERRY_BEARING)*Math.PI/180-camera.rotation.y;ctx.strokeStyle=angle%90===0?'#f3e6c5':'#748477';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(cx+Math.sin(a)*98,cy-Math.cos(a)*98);ctx.lineTo(cx+Math.sin(a)*(angle%90===0?102:100),cy-Math.cos(a)*(angle%90===0?102:100));ctx.stroke();}
    for(const [label,bearing] of[['N',0],['E',90],['S',180],['W',270]] as const){const a=(bearing-FERRY_BEARING)*Math.PI/180-camera.rotation.y;ctx.fillStyle=label==='N'?'#f1cc84':'#b7bd9f';ctx.font=label==='N'?'bold 11px Arial':'9px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,cx+Math.sin(a)*109,cy-Math.cos(a)*109);}
    $('.heading-label').textContent=cardinalFromYaw(camera.rotation.y);$('.route-name').textContent=goal.name;$('.route-distance').textContent=`${Math.round(routeDistance(route))} m`;
    radar.setAttribute('aria-label',`Street map. Facing ${cardinalFromYaw(camera.rotation.y)}. ${goal.name}, ${Math.round(routeDistance(route))} meters away.`);
  }

  function update(frame:HUDFrame){
    latest=frame;const show=frame.active&&!frame.paused;root.hidden=!frame.active;
    const state=dialogue.state();talk.hidden=!show||frame.mode!=='walk'||!state.nearby||state.activeId!==null;
    const talkLabel=state.nearby?`Speak to ${state.nearby.role.toLowerCase()}`:'';
    if(talkLabel!==lastTalk){talk.querySelector('span')!.textContent=talkLabel;lastTalk=talkLabel;}
    choices.hidden=!show||state.activeId===null;
    const choiceKey=`${state.activeId}-${state.stage}`;
    if(choiceKey!==lastChoices){
      lastChoices=choiceKey;$('.conversation-heading span').textContent=state.role;$('.reply-list').innerHTML='';
      if(state.stage==='greeting')for(const [index,label] of state.choices.entries()){const button=document.createElement('button');button.innerHTML=`<kbd>${index+1}</kbd><span></span>`;button.querySelector('span')!.textContent=label;button.addEventListener('click',()=>reply(index));$('.reply-list').append(button);}
      else{const button=document.createElement('button');button.textContent='Much obliged. Good afternoon.';button.addEventListener('click',end);$('.reply-list').append(button);}
    }
    const width=canvas.clientWidth,height=canvas.clientHeight,engine=scene.getEngine(),viewport=camera.viewport.toGlobal(engine.getRenderWidth(),engine.getRenderHeight());
    const occupied:{left:number;right:number;top:number;bottom:number}[]=[$('.radar-card').getBoundingClientRect()],small=width<700;
    if(!choices.hidden)occupied.push(choices.getBoundingClientRect());if(!map.hidden)occupied.push(map.getBoundingClientRect());
    bubbleDiagnostics=[];
    for(let i=0;i<3;i++){
      const bubble=bubbles[i],speech=state.speech[i];bubble.hidden=true;if(!speech)continue;
      const n=crowd.people[speech.id],distance=distanceBetween(n,camera.position),world=new Vector3(n.x,n.height*n.scale+.27+(n.z<534&&Math.abs(n.x)>14.35?.22:0),n.z);
      const projected=Vector3.Project(world,Matrix.IdentityReadOnly,scene.getTransformMatrix(),viewport),x=projected.x/engine.getRenderWidth()*width,y=projected.y/engine.getRenderHeight()*height;
      let reason=!show?'paused':distance>(speech.active?9:26)?'distance':projected.z<0||projected.z>1?'behind':!hasStreetSight(camera.position,n,frame.vehicles)?'occluded':'';
      bubble.classList.toggle('active-speech',speech.active);bubble.querySelector('.speech-role')!.textContent=roleNames[n.role];bubble.querySelector('p')!.textContent=speech.text;
      if(!reason){
        bubble.hidden=false;const w=bubble.offsetWidth,h=bubble.offsetHeight,box={left:x-w/2,right:x+w/2,top:y-h,bottom:y};
        if(x<w/2+12||x>width-w/2-12||y-h<(small?130:110)||y>height-(small?160:110))reason='offscreen';
        else if(small&&i>1)reason='budget';
        else if(occupied.some(r=>box.left<r.right+10&&box.right>r.left-10&&box.top<r.bottom+10&&box.bottom>r.top-10))reason='overlap';
        else{occupied.push(box);bubble.style.left=`${x}px`;bubble.style.top=`${y}px`;}
      }
      bubble.hidden=!!reason;bubbleDiagnostics.push({id:n.id,text:speech.text,world:{x:n.x,z:n.z},screen:{x:Math.round(x),y:Math.round(y)},visible:!reason,reason:reason||'visible'});
    }
    const activeSpeech=state.speech.find(s=>s.active),fallback=show&&activeSpeech&&!bubbleDiagnostics.some(b=>b.id===activeSpeech.id&&b.visible);
    $('.conversation-line').hidden=!fallback;if(fallback)$('.conversation-line').textContent=activeSpeech.text;
    if(show&&frame.time-drawTime>.08){drawMap(frame);drawTime=frame.time;}
    if(show)for(const d of destinations)if(!discovered.has(d.id)&&distanceBetween(camera.position,d)<7){discovered.add(d.id);discoveryUntil=frame.time+4.5;$('.discovery-toast strong').textContent=d.name;syncMapList();}
    $('.discovery-toast').hidden=!show||frame.time>discoveryUntil||discovered.size===0;
  }
  return{update,speak,reply,end,selectDestination,
    escape(){if(dialogue.activeId!==null){end();return true;}if(expanded){setExpanded(false);return true;}return false;},
    reset(){discovered.clear();destination='ferry';discoveryUntil=0;drawTime=-1;lastChoices='';setExpanded(false);syncMapList();},
    snapshot(){const goal=destinations.find(p=>p.id===destination)!;return{conversation:dialogue.state(),bubbles:bubbleDiagnostics,minimap:{player:{x:camera.position.x,z:camera.position.z},yaw:camera.rotation.y,bearing:bearingFromYaw(camera.rotation.y),cardinal:cardinalFromYaw(camera.rotation.y),northBearing:FERRY_BEARING,destination:{...goal,distance:routeDistance(routeTo(camera.position,goal))},discovered:[...discovered],expanded}};}
  };
}
