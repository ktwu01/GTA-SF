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

export type Place = 'market'|'ferry'|'arcade';
export type Mode = 'walk'|'tram';
export type StreetState={mode:Mode;place:Place;speed:number;guided:boolean;canBoard:boolean;distance:number};
const views:Record<Place,{position:Vector3;target:Vector3;title:string;description:string}>={
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
  const buildings=buildStreetArchitecture(scene,p),ground=streetGround(scene,p),life=streetLife(scene,p);
  for(const m of[...buildings,...ground,...life.casters]) if(m.material&&!['window-shadow','window-reflection','rail-steel'].includes(m.material.name)&&!m.name.startsWith('sign'))shadows.addShadowCaster(m);
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
  let dragging=false,lastX=0,lastY=0,pointerId:number|null=null,notifyTime=0;
  const keys=new Set<string>();let touchForward=0,touchSide=0,lastUserMove=0;
  const car=life.player.root;
  const boardingDistance=()=>Math.min(Math.hypot(camera.position.x-car.position.x,camera.position.z-car.position.z-3.7),Math.hypot(camera.position.x-car.position.x,camera.position.z-car.position.z+3.7));
  const notify=()=>onChange({mode,place,speed,guided,canBoard:boardingDistance()<8,distance:boardingDistance()});
  let audioContext:AudioContext|null=null;
  const bell=()=>{audioContext??=new AudioContext();audioContext.resume().catch(()=>{});const now=audioContext.currentTime;for(const [frequency,volume,decay] of[[880,.13,.65],[1762,.06,.42],[2380,.025,.24]]){const oscillator=audioContext.createOscillator(),gain=audioContext.createGain();oscillator.type='sine';oscillator.frequency.value=frequency;gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(volume,now+.007);gain.gain.exponentialRampToValueAtTime(.0001,now+decay);oscillator.connect(gain);gain.connect(audioContext.destination);oscillator.start(now);oscillator.stop(now+decay+.02);}};
  const lerpTo=(position:Vector3,rotation:Vector3,duration=1.3)=>{const rot=rotation.clone(),old=camera.rotation.clone();while(rot.y-old.y>Math.PI)rot.y-=Math.PI*2;while(rot.y-old.y<-Math.PI)rot.y+=Math.PI*2;transition={from:camera.position.clone(),to:position,fromRotation:old,toRotation:rot,t:0,duration};};
  const navigate=(next:Place,animate=true)=>{mode='walk';speed=0;guided=false;place=next;const v=views[next],old=camera.rotation.clone(),pos=camera.position.clone();camera.position.copyFrom(v.position);camera.setTarget(v.target);const rotation=camera.rotation.clone();camera.position.copyFrom(pos);camera.rotation.copyFrom(old);if(animate)lerpTo(v.position.clone(),rotation);else{camera.position.copyFrom(v.position);camera.rotation.copyFrom(rotation);transition=null;}notify();};
  const board=()=>{
    if(!active||paused)return false;
    if(mode==='tram'){speed=0;guided=false;mode='walk';lerpTo(new Vector3(car.position.x+2.3,1.88,car.position.z+direction*2.8),new Vector3(0,direction===1?0:Math.PI,0),.85);notify();return true;}
    if(boardingDistance()>8)return false;
    mode='tram';guided=false;speed=0;lerpTo(new Vector3(car.position.x,2.45,car.position.z+direction*3.28),new Vector3(-.035,direction===1?0:Math.PI,0),1.05);bell();notify();return true;
  };
  const reverse=()=>{if(mode!=='tram'||speed>.2)return false;direction*=-1;car.rotation.y=direction===1?0:Math.PI;lerpTo(new Vector3(car.position.x,2.45,car.position.z+direction*3.28),new Vector3(-.035,direction===1?0:Math.PI,0),1.0);notify();return true;};
  const toggleGuide=()=>{if(mode!=='tram'&&!board())return false;guided=!guided;notify();return true;};
  const isEditing=(target:EventTarget|null)=>target instanceof HTMLElement&&!!target.closest('button,input,select,textarea,a,[role="dialog"]');
  const onKey=(e:KeyboardEvent)=>{
    if(!active||paused||isEditing(e.target))return;
    if(e.code==='KeyE'&&!e.repeat){e.preventDefault();board();return;}
    if(e.code==='KeyB'&&!e.repeat){e.preventDefault();bell();return;}
    if(e.code==='KeyR'&&!e.repeat&&mode==='tram'){e.preventDefault();reverse();return;}
    if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight','Space'].includes(e.code)){e.preventDefault();keys.add(e.code);if(mode==='walk')transition=null;else if(['KeyW','KeyS','ArrowUp','ArrowDown','Space'].includes(e.code))guided=false;lastUserMove=time;}
  };
  window.addEventListener('keydown',onKey);window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{keys.clear();dragging=false;touchForward=touchSide=throttleTouch=brakeTouch=0;});
  canvas.addEventListener('pointerdown',e=>{if(!active||paused)return;canvas.focus();dragging=true;pointerId=e.pointerId;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId);if(mode==='walk')transition=null;});
  canvas.addEventListener('pointermove',e=>{if(!dragging||e.pointerId!==pointerId||paused)return;camera.rotation.y+=(e.clientX-lastX)*.0025;camera.rotation.x=Math.max(-1.12,Math.min(.8,camera.rotation.x+(e.clientY-lastY)*.0025));lastX=e.clientX;lastY=e.clientY;lastUserMove=time;});
  const release=()=>{dragging=false;pointerId=null;};canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('contextmenu',e=>e.preventDefault());
  window.addEventListener('resize',()=>engine.resize());
  const constrainWalk=(previousX:number,previousZ:number)=>{
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
    camera.position.y=1.84+(camera.position.z<534&&Math.abs(camera.position.x)>14.3?.22:0)+Math.sin(time*7)*.011;
  };
  engine.runRenderLoop(()=>{
    const dt=Math.min(engine.getDeltaTime()/1000,.05);if(!paused)time+=dt;life.update(time);
    if(active&&!paused){
      if(transition){transition.t+=dt;const t=Math.min(1,transition.t/transition.duration),e=t*t*(3-2*t);Vector3.LerpToRef(transition.from,transition.to,e,camera.position);Vector3.LerpToRef(transition.fromRotation,transition.toRotation,e,camera.rotation);if(t===1)transition=null;}
      else if(mode==='tram'){
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
        if(f||s){const previousX=camera.position.x,previousZ=camera.position.z,step=(keys.has('ShiftLeft')||keys.has('ShiftRight')?5.7:3.35)*dt/Math.max(1,Math.hypot(f,s));camera.position.x+=(Math.sin(camera.rotation.y)*f+Math.cos(camera.rotation.y)*s)*step;camera.position.z+=(Math.cos(camera.rotation.y)*f-Math.sin(camera.rotation.y)*s)*step;constrainWalk(previousX,previousZ);lastUserMove=time;}
      }
      place=camera.position.z>537?'arcade':camera.position.z>455?'ferry':'market';
      if(time-notifyTime>.18){notifyTime=time;notify();}
    }
    sun.position.set(camera.position.x-80,125,camera.position.z-60);scene.render();
  });
  return {
    engine,scene,camera,views,
    enter(){active=true;paused=false;canvas.focus();notify();},navigate,board,ride:board,guided:toggleGuide,reverse,bell,
    setPaused(value:boolean){paused=value;keys.clear();touchForward=touchSide=throttleTouch=brakeTouch=0;},
    beginComparison(){comparisonView={position:camera.position.clone(),rotation:camera.rotation.clone(),transition};paused=true;keys.clear();touchForward=touchSide=throttleTouch=brakeTouch=0;camera.position.copyFrom(views.market.position);camera.setTarget(views.market.target);},
    endComparison(){if(comparisonView){camera.position.copyFrom(comparisonView.position);camera.rotation.copyFrom(comparisonView.rotation);transition=comparisonView.transition;comparisonView=null;}paused=false;},
    reset(){active=false;paused=false;time=0;direction=1;speed=0;guided=false;car.position.set(3.15,.03,358);car.rotation.y=0;navigate('market',false);},
    touch(forward:number,side:number){if(mode==='tram'){throttleTouch=forward>0?1:0;brakeTouch=forward<0?1:0;guided=false;}else{transition=null;touchForward=forward;touchSide=side;}},
    snapshot(){return{ready:scene.isReady(),active,mode,place,paused,camera:{x:camera.position.x,y:camera.position.y,z:camera.position.z,yaw:camera.rotation.y,pitch:camera.rotation.x},streetcar:{x:car.position.x,z:car.position.z,speedMps:speed,direction,guided,canBoard:boardingDistance()<8,distance:boardingDistance()},fps:Math.round(engine.getFps()*10)/10,meshes:scene.meshes.length,activeMeshes:scene.getActiveMeshes().length,drawCalls:instrumentation.drawCallsCounter.current,triangles:scene.meshes.reduce((total,mesh)=>total+mesh.getTotalIndices()/3,0),elapsed:time,lastUserMove,transition:!!transition};},
  };
}
