import { addStreetWear } from './street-wear';
import { addTerminalTraffic } from './extra-traffic';
import { createExteriorRiders } from './exterior-riders';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { DefaultRenderingPipeline } from '@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { Effect } from '@babylonjs/core/Materials/effect';
import { Engine } from '@babylonjs/core/Engines/engine';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { Scene } from '@babylonjs/core/scene';
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import { SceneInstrumentation } from '@babylonjs/core/Instrumentation/sceneInstrumentation';
import '@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent';
import '@babylonjs/core/Shaders/default.vertex';
import '@babylonjs/core/Shaders/default.fragment';
import '@babylonjs/core/Shaders/shadowMap.vertex';
import '@babylonjs/core/Shaders/shadowMap.fragment';
import '@babylonjs/core/Shaders/fxaa.vertex';
import '@babylonjs/core/Shaders/fxaa.fragment';
import '@babylonjs/core/Shaders/postprocess.vertex';
import '@babylonjs/core/Shaders/imageProcessing.fragment';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { buildStreetArchitecture } from './architecture';
import { palette } from './materials';
import { streetGround, streetLife } from './street-life';
import { createCrowd, type TrafficMarker } from './crowd';
import { createDialogue } from './dialogue';
import { createStreetHUD } from './hud';
import { createStreetAudio } from './audio';
import { moveStreetWalker } from './collision';
import { advanceJump, hasGameFocus, lookPitch, relativeMovement, standingJump, startJump } from './controls';

import { buildHarbor } from './harbor';
import { constrainHarbor, harborHeight, onShip, setHarborDocked } from './harbor-layout';

import { createCargoJob,mooredSchooner,advanceSchooner,shipHelm } from './harbor-work';
import { distanceBetween,type DestinationId } from './navigation';

export type Place = 'market'|'ferry'|'arcade'|'harbor'|'ship';
export type Mode = 'walk'|'tram'|'sail';
export type StreetState={mode:Mode;place:Place;speed:number;guided:boolean;canBoard:boolean;distance:number};
const views:Record<Place,{position:Vector3;target:Vector3;title:string;description:string}>={
  harbor:{position:new Vector3(194,2.19,590),target:new Vector3(220,12,656),title:'East Street wharves',description:'The working waterfront'},
  ship:{position:new Vector3(217,4.24,655),target:new Vector3(220,8,676),title:'Lumber schooner',description:'On deck'},
  market:{position:new Vector3(1.4,1.92,350),target:new Vector3(0,14,590),title:'Toward the waterfront',description:'Lower Market Street'},
  ferry:{position:new Vector3(-8,2.0,466),target:new Vector3(0,34,590),title:'The Ferry Building',description:'Market Street at the bay'},
  arcade:{position:new Vector3(35,1.9,548),target:new Vector3(24,7,590),title:'Under the arcade',description:'The Ferry Building'},
};

export function createHistoricalScene(canvas:HTMLCanvasElement,onChange:(state:StreetState)=>void) {
  const engine=new Engine(canvas,true,{preserveDrawingBuffer:true,stencil:true,powerPreference:'high-performance'},true);
  engine.setHardwareScalingLevel(1/Math.min(devicePixelRatio,matchMedia('(max-width:700px)').matches?1.4:1.65));
  const scene=new Scene(engine);const instrumentation=new SceneInstrumentation(scene);scene.clearColor=new Color4(.77,.83,.81,1);
  scene.fogMode=Scene.FOGMODE_EXP2;scene.fogDensity=.0021;scene.fogColor=new Color3(.81,.81,.74);
  scene.ambientColor=new Color3(.22,.24,.24);scene.skipPointerMovePicking=true;
  const camera=new FreeCamera('market-street-camera',views.market.position.clone(),scene);camera.minZ=.08;camera.maxZ=1450;camera.fov=.84;camera.setTarget(views.market.target);camera.inputs.clear();
  const ambient=new HemisphericLight('open-sky',new Vector3(0,1,0),scene);ambient.intensity=.72;ambient.diffuse=new Color3(.88,.92,1);ambient.groundColor=new Color3(.49,.45,.36);
  const sun=new DirectionalLight('afternoon-sun',new Vector3(.58,-.95,.48),scene);sun.intensity=1.35;sun.diffuse=new Color3(1,.91,.74);sun.position=new Vector3(-90,150,230);sun.shadowMinZ=1;sun.shadowMaxZ=260;sun.shadowFrustumSize=145;
  const shadows=new ShadowGenerator(matchMedia('(max-width:700px)').matches?1024:2048,sun);shadows.usePercentageCloserFiltering=true;shadows.filteringQuality=ShadowGenerator.QUALITY_MEDIUM;shadows.bias=.001;shadows.normalBias=.025;shadows.darkness=.22;
  const p=palette(scene);
  const buildings=buildStreetArchitecture(scene,p),ground=streetGround(scene,p),life=streetLife(scene,p),crowd=createCrowd(scene,p),harbor=buildHarbor(scene,p);
  const wear=addStreetWear(scene,p),extraTraffic=addTerminalTraffic(scene,life.player.meshes),riders=createExteriorRiders(scene,p);
  for(const m of[...extraTraffic.meshes,...riders.meshes,...buildings,...ground,...life.casters,...crowd.meshes,...harbor.meshes]) if(m.material&&!['window-shadow','window-reflection','rail-steel'].includes(m.material.name)&&!m.name.startsWith('sign'))shadows.addShadowCaster(m);
  Effect.ShadersStore['historySkyVertexShader']='precision highp float; attribute vec3 position; uniform mat4 worldViewProjection; varying vec3 vDirection; void main(){vDirection=position;gl_Position=worldViewProjection*vec4(position,1.0);}';
  Effect.ShadersStore['historySkyFragmentShader']='precision highp float; varying vec3 vDirection; void main(){vec3 d=normalize(vDirection);float t=pow(max(0.,d.y),.58);vec3 col=mix(vec3(.91,.88,.77),vec3(.52,.71,.77),t);float s=pow(max(0.,dot(d,normalize(vec3(-.58,.95,-.48)))),55.);col+=vec3(.15,.11,.04)*s;gl_FragColor=vec4(col,1.);}';
  const sky=MeshBuilder.CreateSphere('painted-sky',{diameter:2300,segments:24,sideOrientation:Mesh.BACKSIDE},scene);
  const skyMat=new ShaderMaterial('sky-gradient',scene,{vertex:'historySky',fragment:'historySky'},{attributes:['position'],uniforms:['worldViewProjection']});skyMat.backFaceCulling=false;sky.material=skyMat;sky.infiniteDistance=true;sky.isPickable=false;sky.applyFog=false;
  const pipeline=new DefaultRenderingPipeline('historical-tonality',false,scene,[camera]);pipeline.fxaaEnabled=true;pipeline.samples=1;pipeline.imageProcessingEnabled=true;
  pipeline.imageProcessing.contrast=1.13;pipeline.imageProcessing.exposure=1.05;pipeline.imageProcessing.toneMappingEnabled=true;pipeline.imageProcessing.toneMappingType=1;
  pipeline.imageProcessing.vignetteEnabled=true;pipeline.imageProcessing.vignetteWeight=.7;pipeline.imageProcessing.vignetteStretch=.4;pipeline.imageProcessing.vignetteColor=new Color4(.2,.22,.2,0);
  let mode:Mode='walk',place:Place='market',active=false,paused=false,time=0,speed=0,guided=false,direction=1,throttleTouch=0,brakeTouch=0;
  type CameraTransition={from:Vector3;to:Vector3;fromRotation:Vector3;toRotation:Vector3;t:number;duration:number};
  let transition:CameraTransition|null=null;
  let comparisonView:{position:Vector3;rotation:Vector3;transition:CameraTransition|null}|null=null;
  let dragging=false,lastX=0,lastY=0,pointerId:number|null=null,notifyTime=0,dragDistance=0,lastPointerType='mouse';
  let jumpState=standingJump(),touchSprint=false,sensitivity=1,pointerLockError:string|null=null,hudVisible=true;
  const keys=new Set<string>();let touchForward=0,touchSide=0,lastUserMove=0;
  const car=life.player.root;
  const cargo=createCargoJob();let sailing=mooredSchooner();
  const parcel=MeshBuilder.CreateBox('carried-freight-parcel',{width:.5,height:.35,depth:.4},scene);parcel.material=p.wood;parcel.parent=camera;parcel.position.set(.35,-.48,.85);parcel.isPickable=false;parcel.setEnabled(false);
  const dialogue=createDialogue(crowd),hud=createStreetHUD(scene,camera,crowd,dialogue,canvas,()=>interact());
  const boardingDistance=()=>Math.min(Math.hypot(camera.position.x-car.position.x,camera.position.z-car.position.z-3.7),Math.hypot(camera.position.x-car.position.x,camera.position.z-car.position.z+3.7));
  const notify=()=>onChange({mode,place,speed,guided,canBoard:boardingDistance()<8,distance:boardingDistance()});
  const audio=createStreetAudio();
  const listener=()=>({x:camera.position.x,z:camera.position.z,yaw:camera.rotation.y});
  const bell=()=>{audio.unlock();audio.bell(car.position,listener());};
  const lerpTo=(position:Vector3,rotation:Vector3,duration=1.3)=>{const rot=rotation.clone(),old=camera.rotation.clone();while(rot.y-old.y>Math.PI)rot.y-=Math.PI*2;while(rot.y-old.y<-Math.PI)rot.y+=Math.PI*2;transition={from:camera.position.clone(),to:position,fromRotation:old,toRotation:rot,t:0,duration};};
  const navigate=(next:Place,animate=true)=>{if(mode==='sail')return;dialogue.end();jumpState=standingJump();mode='walk';speed=0;guided=false;place=next;const v=views[next],old=camera.rotation.clone(),pos=camera.position.clone();camera.position.copyFrom(v.position);camera.setTarget(v.target);const rotation=camera.rotation.clone();camera.position.copyFrom(pos);camera.rotation.copyFrom(old);if(animate)lerpTo(v.position.clone(),rotation);else{camera.position.copyFrom(v.position);camera.rotation.copyFrom(rotation);transition=null;}notify();};
  const board=()=>{
    if(!active||paused||transition||mode==='sail')return false;
    if(mode==='walk'&&boardingDistance()>8)return false;
    clearInput();dialogue.end();jumpState=standingJump();
    if(mode==='tram'){speed=0;guided=false;mode='walk';lerpTo(new Vector3(car.position.x+2.3,1.88,car.position.z+direction*2.8),new Vector3(0,direction===1?0:Math.PI,0),.85);notify();return true;}
    mode='tram';guided=false;speed=0;lerpTo(new Vector3(car.position.x,2.45,car.position.z+direction*3.28),new Vector3(-.035,direction===1?0:Math.PI,0),1.05);bell();notify();return true;
  };
  const interact=()=>{
    if(!active||paused||transition)return false;
    if(mode==='sail'){if(sailing.phase!=='sailing')return false;sailing={...sailing,phase:'returning'};clearInput();return true;}
    if(mode==='walk'){const action=cargo.action(camera.position);if(action){dialogue.end();const job=cargo.snapshot();hud.selectDestination(action==='complete'?null:job.goal as DestinationId);return true;}
      if(jumpState.grounded&&sailing.phase==='moored'&&distanceBetween(camera.position,shipHelm)<3&&!cargo.snapshot().carrying){clearInput();dialogue.end();sailing={...sailing,phase:'departing'};setHarborDocked(false);hud.selectDestination(null);mode='sail';camera.rotation.set(.06,0,0);notify();return true;}
    }return board();
  };
  const reverse=()=>{if(!active||paused||mode!=='tram'||speed>.2||transition)return false;clearInput();direction*=-1;car.rotation.y=direction===1?0:Math.PI;lerpTo(new Vector3(car.position.x,2.45,car.position.z+direction*3.28),new Vector3(-.035,direction===1?0:Math.PI,0),1.0);notify();return true;};
  const toggleGuide=()=>{if(!active||paused||(mode!=='tram'&&!board()))return false;clearInput();guided=!guided;notify();return true;};
  const clearInput=()=>{const captured=pointerId;keys.clear();dragging=false;pointerId=null;touchForward=touchSide=throttleTouch=brakeTouch=0;touchSprint=false;if(captured!==null&&canvas.hasPointerCapture(captured))canvas.releasePointerCapture(captured);};
  const jump=()=>{if(!active||paused||mode!=='walk'||transition)return false;const wasGrounded=jumpState.grounded;jumpState=startJump(jumpState);if(wasGrounded)dialogue.end();return wasGrounded;};
  const requestLook=()=>{
    if(!active||paused||document.pointerLockElement===canvas)return;
    if(!canvas.requestPointerLock){pointerLockError='Mouse capture is unavailable. Drag to look.';return;}
    try{const result=canvas.requestPointerLock();if(result)result.catch(()=>{pointerLockError='Mouse capture was declined. Drag to look.';});}catch{pointerLockError='Mouse capture is unavailable. Drag to look.';}
  };
  const look=(dx:number,dy:number)=>{if(!active||paused)return;camera.rotation.y+=dx*.0022*sensitivity;camera.rotation.x=lookPitch(camera.rotation.x+dy*.0022*sensitivity);lastUserMove=time;};
  const onKey=(e:KeyboardEvent)=>{
    if(!active||paused||!hasGameFocus(e.target))return;
    audio.unlock();
    if(dialogue.activeId!==null&&['Digit1','Digit2'].includes(e.code)&&!e.repeat){e.preventDefault();hud.reply(e.code==='Digit1'?0:1);return;}
    if(e.code==='KeyE'&&!e.repeat){e.preventDefault();interact();return;}
    if(e.code==='KeyB'&&!e.repeat&&mode==='tram'){e.preventDefault();bell();return;}
    if(e.code==='KeyR'&&!e.repeat&&mode==='sail'){e.preventDefault();interact();return;}
    if(e.code==='KeyR'&&!e.repeat&&mode==='tram'){e.preventDefault();reverse();return;}
    if(e.code==='Space'&&mode==='walk'){e.preventDefault();if(!e.repeat)jump();return;}
    if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight','Space'].includes(e.code)){e.preventDefault();keys.add(e.code);if(mode==='walk'){transition=null;dialogue.end();}else if(['KeyW','KeyS','ArrowUp','ArrowDown','Space'].includes(e.code))guided=false;lastUserMove=time;}
  };
  window.addEventListener('keydown',onKey);window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',clearInput);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)clearInput();});
  document.addEventListener('pointerlockchange',()=>{clearInput();document.body.classList.toggle('mouse-captured',document.pointerLockElement===canvas);if(document.pointerLockElement===canvas)pointerLockError=null;});
  document.addEventListener('pointerlockerror',()=>{pointerLockError='Mouse capture was declined. Drag to look.';});
  document.addEventListener('mousemove',e=>{if(document.pointerLockElement===canvas)look(e.movementX,e.movementY);});
  canvas.addEventListener('pointerdown',e=>{if(!active||paused||e.button!==0||pointerId!==null)return;audio.unlock();canvas.focus();lastPointerType=e.pointerType;dragDistance=0;if(document.pointerLockElement===canvas)return;dragging=true;pointerId=e.pointerId;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId);if(mode==='walk')transition=null;});
  canvas.addEventListener('pointermove',e=>{if(document.pointerLockElement===canvas||!dragging||e.pointerId!==pointerId||paused)return;const dx=e.clientX-lastX,dy=e.clientY-lastY;dragDistance+=Math.abs(dx)+Math.abs(dy);look(dx,dy);lastX=e.clientX;lastY=e.clientY;});
  const release=()=>{dragging=false;pointerId=null;};canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',release);canvas.addEventListener('contextmenu',e=>e.preventDefault());
  canvas.addEventListener('click',()=>{if(lastPointerType==='mouse'&&dragDistance<6)requestLook();});
  window.addEventListener('resize',()=>engine.resize());
  const constrainWalk=(previousX:number,previousZ:number)=>{
    if(previousX>=94.5||camera.position.x>=94.5){const next=constrainHarbor({x:previousX,z:previousZ},camera.position);camera.position.x=next.x;camera.position.z=next.z;return;}
    camera.position.z=Math.max(336,Math.min(571,camera.position.z));
    camera.position.x=Math.max(-95,Math.min(95,camera.position.x));
    if(camera.position.z<534&&Math.abs(camera.position.x)>17.4){
      if(previousZ>=534)camera.position.z=534;
      else camera.position.x=Math.max(-17.4,Math.min(17.4,camera.position.x));
    }
    if(camera.position.z>564){
      if(Math.abs(camera.position.x)<21.9)camera.position.z=564;
      else {const offset=((Math.abs(camera.position.x)-22.25)%4.47+4.47)%4.47;const centerDistance=Math.min(offset,4.47-offset);if(centerDistance>1.19){if(previousZ>566.6)camera.position.x=previousX;else camera.position.z=Math.min(camera.position.z,566.6);}camera.position.z=Math.min(camera.position.z,570.6);}
    }

  };
  engine.runRenderLoop(()=>{
    const previousPosition={x:camera.position.x,z:camera.position.z},wasTransitioning=!!transition;
    const dt=Math.min(engine.getDeltaTime()/1000,.05);if(active&&!paused)time+=dt;life.update(time);
    if(active&&!paused){
      if(transition){transition.t+=dt;const t=Math.min(1,transition.t/transition.duration),e=t*t*(3-2*t);Vector3.LerpToRef(transition.from,transition.to,e,camera.position);Vector3.LerpToRef(transition.fromRotation,transition.toRotation,e,camera.rotation);if(t===1)transition=null;}
      else if(mode==='sail'){
        const throttle=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0)+touchForward,steering=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)+touchSide;
        const oldYaw=sailing.yaw;sailing=advanceSchooner(sailing,dt,throttle,steering);camera.rotation.y+=sailing.yaw-oldYaw;
        camera.position.set(sailing.x-3*Math.cos(sailing.yaw)+9*Math.sin(sailing.yaw),4.24,sailing.z+3*Math.sin(sailing.yaw)+9*Math.cos(sailing.yaw));speed=Math.abs(sailing.speed);
        if(sailing.phase==='moored'){mode='walk';speed=0;setHarborDocked(true);clearInput();notify();}
      }else if(mode==='tram'){
        const throttle=keys.has('KeyW')||keys.has('ArrowUp')||throttleTouch>0,brake=keys.has('KeyS')||keys.has('ArrowDown')||keys.has('Space')||brakeTouch>0;
        const remaining=direction===1?550-car.position.z:car.position.z-341;
        if(guided)speed+=Math.max(-1.4,Math.min(1.2,4.15-speed))*dt;
        else speed=Math.max(0,Math.min(5.5,speed+((throttle?1.45:0)-(brake?3.5:.1))*dt));
        if(remaining<speed*speed/5+2)speed=Math.max(0,speed-2.6*dt);
        car.position.z=Math.max(341,Math.min(550,car.position.z+direction*speed*dt));
        if(remaining<.07||(remaining<2.05&&speed<.05)){speed=0;guided=false;}
        camera.position.set(car.position.x,2.45+Math.sin(time*8)*Math.min(speed,.025),car.position.z+direction*3.28);
        camera.rotation.y+=((keys.has('ArrowRight')||keys.has('KeyD')?1:0)-(keys.has('ArrowLeft')||keys.has('KeyA')?1:0))*dt;
      }else{
        const f=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0)+touchForward,s=(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0)+touchSide;
        camera.rotation.y+=((keys.has('ArrowRight')?1:0)-(keys.has('ArrowLeft')?1:0))*dt*1.4;
        if(f||s){const previousX=camera.position.x,previousZ=camera.position.z,step=(keys.has('ShiftLeft')||keys.has('ShiftRight')||touchSprint?5.7:3.35)*dt,movement=relativeMovement(f,s,camera.rotation.y);camera.position.x+=movement.x*step;camera.position.z+=movement.z*step;constrainWalk(previousX,previousZ);lastUserMove=time;}
        jumpState=advanceJump(jumpState,dt);camera.position.y=1.84+(camera.position.x>=95?harborHeight(camera.position):0)+(camera.position.x<95&&camera.position.z<534&&Math.abs(camera.position.x)>14.3?.22:0)+jumpState.height+(jumpState.grounded&&(f||s)?Math.sin(time*9)*.018:0);
      }
      place=mode==='sail'||onShip(camera.position)?'ship':camera.position.x>=95?'harbor':camera.position.z>537?'arcade':camera.position.z>455?'ferry':'market';
      if(time-notifyTime>.18){notifyTime=time;notify();}
    }
    extraTraffic.update(life.traffic()[0]);
    const vehicles:TrafficMarker[]=[...life.traffic(),...extraTraffic.traffic(),{x:car.position.x,z:car.position.z,kind:'tram',speed,direction,player:true}];
    if(active&&!paused&&mode==='walk'&&!transition&&!wasTransitioning){const position=moveStreetWalker(previousPosition,camera.position,vehicles,crowd.people);camera.position.x=position.x;camera.position.z=position.z;constrainWalk(previousPosition.x,previousPosition.z);}
    harbor.update(sailing.x,sailing.z,sailing.yaw,sailing.phase==='moored');parcel.setEnabled(cargo.snapshot().carrying&&mode==='walk');
    riders.update(vehicles);
    dialogue.update(time,camera.position,vehicles,mode==='walk',active&&!paused,audio.speaking(),camera.rotation.y);
    crowd.update(time,camera.position,vehicles,dialogue.activeId,dialogue.state().speech.map(s=>s.id));
    const walkingSpeed=mode==='walk'&&!wasTransitioning&&dt>0?Math.hypot(camera.position.x-previousPosition.x,camera.position.z-previousPosition.z)/dt:0;
    audio.update(time,listener(),vehicles,crowd.people,dialogue.state().speech,walkingSpeed,jumpState.grounded);
    sun.position.set(camera.position.x-80,125,camera.position.z-60);scene.render();
    const returning=['returning','aligning','docking'].includes(sailing.phase);
    const interaction=mode==='sail'?(sailing.phase==='departing'?'Leaving wharf · return available in open water':returning?'Returning to wharf · docking automatically':'Return to wharf'):mode==='walk'?(cargo.prompt(camera.position)??(sailing.phase==='moored'&&distanceBetween(camera.position,shipHelm)<3&&!cargo.snapshot().carrying?'Set sail · W/S speed · A/D steer':null)):null;
    hud.update({time,active,paused,mode,vehicles,speed,boardDistance:boardingDistance(),canBoard:boardingDistance()<8,interaction,cargo:cargo.snapshot()});
  });
  return {
    engine,scene,camera,views,
    enter(){active=true;paused=false;audio.setPaused(false);audio.unlock();canvas.focus();notify();},navigate,board:interact,ride:board,guided:toggleGuide,reverse,bell,
    respond:hud.reply,endConversation:hud.end,selectDestination:hud.selectDestination,jump,requestLook,clearInput,
    setMuted:audio.setMuted,setVolume:audio.setVolume,setVoices:audio.setVoices,
    setAmbient:dialogue.setAmbient,setHudVisible(value:boolean){hudVisible=value;hud.setVisible(value);},setSensitivity(value:number){sensitivity=Math.max(.4,Math.min(2,Number.isFinite(value)?value:1));},
    setPaused(value:boolean){paused=value;audio.setPaused(value||!active);if(!value&&active)audio.unlock();clearInput();},
    beginComparison(){comparisonView={position:camera.position.clone(),rotation:camera.rotation.clone(),transition};paused=true;audio.setPaused(true);clearInput();camera.position.copyFrom(views.market.position);camera.setTarget(views.market.target);},
    endComparison(){if(comparisonView){camera.position.copyFrom(comparisonView.position);camera.rotation.copyFrom(comparisonView.rotation);transition=comparisonView.transition;comparisonView=null;}paused=false;audio.setPaused(!active);},
    reset(){mode='walk';sailing=mooredSchooner();setHarborDocked(true);harbor.update(220,656,0,true);cargo.reset();parcel.setEnabled(false);audio.reset();clearInput();jumpState=standingJump();active=false;paused=false;time=0;notifyTime=0;direction=1;speed=0;guided=false;crowd.reset();dialogue.reset();hud.reset();car.position.set(3.15,.03,358);car.rotation.y=0;navigate('market',false);},
    touch(forward:number,side:number,sprint=false){if(!active||paused){clearInput();return;}touchSprint=sprint;if(mode==='tram'){throttleTouch=forward>0?1:0;brakeTouch=forward<0?1:0;if(forward)guided=false;}else{if(forward||side){dialogue.end();transition=null;}touchForward=forward;touchSide=side;}},
    snapshot(){return{ready:scene.isReady(),active,mode,place,paused,cargo:cargo.snapshot(),sailing:{...sailing},camera:{x:camera.position.x,y:camera.position.y,z:camera.position.z,yaw:camera.rotation.y,pitch:camera.rotation.x},streetcar:{x:car.position.x,z:car.position.z,speedMps:speed,direction,guided,canBoard:boardingDistance()<8,distance:boardingDistance()},crowd:crowd.snapshot(),exteriorRiders:riders.snapshot(),audio:audio.snapshot(),hud:hud.snapshot(),input:{pointerLocked:document.pointerLockElement===canvas,pointerLockAvailable:!!canvas.requestPointerLock,pointerLockError,keys:[...keys],touch:{forward:touchForward,side:touchSide,throttle:throttleTouch,brake:brakeTouch,sprint:touchSprint},sensitivity,hudVisible,jump:{...jumpState}},fps:Math.round(engine.getFps()*10)/10,meshes:scene.meshes.length,activeMeshes:scene.getActiveMeshes().length,drawCalls:instrumentation.drawCallsCounter.current,uniqueGeometryTriangles:scene.meshes.reduce((total,mesh)=>total+mesh.getTotalIndices()/3,0),instanceAdjustedTriangles:scene.meshes.reduce((total,mesh)=>total+mesh.getTotalIndices()/3*Math.max(1,mesh instanceof Mesh?mesh.thinInstanceCount:0),0),elapsed:time,lastUserMove,transition:!!transition};},
  };
}
