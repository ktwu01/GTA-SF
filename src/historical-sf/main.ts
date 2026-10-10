import './style.css';
import './hud.css';
import { createHistoricalScene, type Place } from './scene';
import { destinations, type DestinationId } from './navigation';
import { hasGameFocus } from './controls';
import sourcePack from '../../data/historical-sf/sources.json';

const arrow='<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h15M13 5l7 7-7 7" stroke="currentColor" stroke-width="1.5"/></svg>';
const fullscreenIcon='<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 4H4v4m12-4h4v4M4 16v4h4m12-4v4h-4" stroke="currentColor" stroke-width="1.5"/></svg>';
const app=document.querySelector<HTMLDivElement>('#historical-app')!;
app.innerHTML=`
  <canvas id="street" tabindex="0" aria-label="Explore San Francisco in 1906. W A S D to walk. Click to look freely. Escape opens the menu."></canvas>
  <section class="intro" aria-labelledby="intro-title">
    <img class="archive-backdrop" src="/historical-sf/references/market-film-445.jpg" alt="Original 1906 film frame looking along Market Street toward the Ferry Building" />
    <video class="archive-film" muted autoplay playsinline loop preload="metadata" poster="/historical-sf/references/market-film-445.jpg" aria-hidden="true"><source src="/historical-sf/market-1906-excerpt.mp4" type="video/mp4" /></video>
    <div class="intro-shade"></div>
    <div class="intro-copy"><p class="eyebrow">A WALK DOWN MARKET STREET</p><h1 id="intro-title">San Francisco,<br><em>1906.</em></h1><p class="intro-description">One ordinary Saturday.<br>A city on the edge of history.</p><button id="enter" class="enter-button" disabled><span>Opening the street…</span>${arrow}</button></div>
    <div class="intro-bottom"><span>STEP OFF THE CAMERA.<br>INTO THE STREET.</span><span>ORIGINAL FILM · MILES BROTHERS<br>LIBRARY OF CONGRESS, APRIL 14, 1906</span><button class="quiet-button archive-open">Explore the photographs ${arrow}</button></div>
    <p id="load-error" role="status" hidden></p>
  </section>
  <div class="experience" inert aria-hidden="true">
    <div class="game-actions" data-hud-part="menu"><button id="fullscreen" title="Fullscreen (V)" aria-label="Enter fullscreen">${fullscreenIcon}</button><button id="pause-open" title="Pause (Esc)" aria-label="Pause game"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14m8-14v14" fill="none" stroke="currentColor" stroke-width="2"/></svg></button></div>
    <div class="touch-stick" data-hud-part="move" role="button" tabindex="0" aria-label="Movement stick. Push farther to run."><span></span></div>
    <button id="touch-jump" class="touch-jump" data-hud-part="jump" aria-label="Jump">↑</button>
    <div class="drive-touch" data-hud-part="drive"><button data-drive="1" aria-label="Accelerate streetcar">↑</button><button data-drive="-1" aria-label="Brake streetcar">↓</button><button id="touch-reverse" aria-label="Reverse streetcar when stopped">↔</button><button id="touch-bell" aria-label="Ring streetcar bell"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 17h14l-2-3V9a5 5 0 0 0-10 0v5l-2 3Zm5 3h4" stroke="currentColor" stroke-width="1.5"/></svg></button></div>
  </div>
  <dialog id="pause-dialog" class="pause-dialog" aria-labelledby="pause-title">
    <header class="pause-heading"><span>SAN FRANCISCO · 1906</span><button id="pause-close" class="round-close" aria-label="Resume game">×</button></header>
    <h2 id="pause-title">Paused</h2>
    <div class="pause-layout"><nav class="pause-nav" aria-label="Game menu">
      <button id="resume" class="resume-button">Continue <span>↗</span></button>
      <button data-panel="controls" aria-pressed="true">Controls</button><button data-panel="places" aria-pressed="false">Places</button><button data-panel="settings" aria-pressed="false">Settings</button>
      <span class="menu-separator"></span><button id="compare-open">Original view</button><button class="archive-open">Photograph archive</button><button id="about-open">About the street</button><button id="reset">Replay opening</button>
    </nav><div class="pause-content">
      <section data-menu-panel="controls"><h3>The street is yours.</h3>
        <dl class="desktop-contract"><div><dt>W A S D</dt><dd>Walk</dd></div><div><dt>Mouse</dt><dd>Click the street to look freely</dd></div><div><dt>Shift / Space</dt><dd>Run / jump</dd></div><div><dt>E</dt><dd>Enter or leave the streetcar</dd></div><div><dt>1, 2</dt><dd>Reply when someone addresses you</dd></div><div><dt>Esc</dt><dd>Release mouse & pause</dd></div><div><dt>V / H</dt><dd>Fullscreen / hide interface</dd></div></dl>
        <dl class="touch-contract"><div><dt>Left stick</dt><dd>Move; push farther to run</dd></div><div><dt>Drag the street</dt><dd>Look around</dd></div><div><dt>↑</dt><dd>Jump</dd></div><div><dt>Nearby prompt</dt><dd>Enter the streetcar</dd></div></dl>
        <div class="tram-contract"><h4>At the controls</h4><p class="desktop-contract">W accelerates. S or Space brakes.<br>R reverses when stopped. B rings the bell.</p><p class="touch-contract">Hold ↑ to accelerate, ↓ to brake.<br>Reverse when stopped.</p><p>The streetcar follows its rails.</p><button id="guided" disabled>Ride automatically</button></div>
      </section>
      <section data-menu-panel="places" hidden><h3>Choose a waypoint.</h3><div class="destination-list"></div><button id="clear-route" class="subtle-button">Clear waypoint</button><p class="menu-note">The radar follows your view. North is approximate.</p></section>
      <section data-menu-panel="settings" hidden><h3>Make yourself at home.</h3><label class="setting-row"><span>Mute sound</span><input id="mute-setting" type="checkbox" /></label><label class="setting-row"><span>Spoken dialogue</span><input id="voice-setting" type="checkbox" checked /></label><label class="sensitivity-setting" for="volume-setting">Sound volume <input id="volume-setting" type="range" min="0" max="1" step="0.1" value="0.7" /></label><p id="audio-status" class="menu-note" role="status"></p><label class="setting-row"><span>Ambient conversations</span><input id="ambient-setting" type="checkbox" checked /></label><label class="setting-row"><span>Show interface</span><input id="hud-setting" type="checkbox" checked /></label><p class="menu-note">H restores the interface. On touch, tap the street to reopen this menu.</p><label class="sensitivity-setting" for="look-setting">Look sensitivity <input id="look-setting" type="range" min="0.4" max="2" step="0.1" value="1" /></label><button id="menu-fullscreen" class="subtle-button">Enter fullscreen</button><p id="display-status" class="menu-note" role="status"></p></section>
    </div></div>
  </dialog>
  <section class="comparison" role="dialog" aria-modal="true" aria-label="Compare original film and reconstruction" hidden>
    <img src="/historical-sf/references/market-film-445.jpg" alt="Market Street in the original Miles Brothers film, April 14, 1906" />
    <div class="comparison-top"><span class="eyebrow">THE SAME DIRECTION. A DIFFERENT CENTURY.</span><button id="compare-close" class="round-close" aria-label="Close comparison">×</button></div>
    <div class="comparison-bottom"><p>Market Street, April 14, 1906<span>Original film · Miles Brothers · Library of Congress</span></p><label for="compare-slider">Archive <input id="compare-slider" type="range" min="0" max="100" value="65" /> Reconstruction</label></div>
  </section>
  <dialog id="archive-dialog" class="archive-dialog"><div class="archive-top"><div><p class="eyebrow">THE CITY, ON RECORD</p><h2>Before the fire.</h2></div><button id="archive-close" class="round-close" aria-label="Close archive">×</button></div><p class="archive-intro">The photographs and film behind this walk. Market Street’s everyday life, preserved in the original images.</p><div id="archive-grid" class="archive-grid"></div><div class="archive-foot"><p>The street is an approximate reconstruction. Landmark silhouettes and facade rhythms follow these records; distances, color, traffic, and the surrounding buildings are interpreted.</p><a href="https://www.loc.gov/item/00694408/" target="_blank" rel="noopener noreferrer">Watch the complete original film ↗</a></div></dialog>
  <dialog id="about-dialog" class="about-dialog"><button id="about-close" class="round-close" aria-label="Close about">×</button><p class="eyebrow">A STREET REMEMBERED</p><h2>Built from the record.<br>Open to exploration.</h2><p>The Miles Brothers filmed Market Street on April 14, 1906, four days before the earthquake. Their camera rode toward the Ferry Building through a city in motion.</p><p>Follow the final stretch of lower Market Street to the Ferry Building. The bay-window ticket office, coffee house, warehouse, and painted advertisements follow a photograph taken from the tower in 1905. Colors, dimensions of the neighboring buildings, and street life remain interpretations.</p><button class="about-archive archive-open">See the original images ${arrow}</button></dialog>
`;
const $=<T extends HTMLElement>(s:string)=>document.querySelector<T>(s)!;
const intro=$<HTMLElement>('.intro'),experience=$<HTMLElement>('.experience'),canvas=$<HTMLCanvasElement>('#street'),enter=$<HTMLButtonElement>('#enter'),video=$<HTMLVideoElement>('.archive-film');
const archive=$<HTMLDialogElement>('#archive-dialog'),about=$<HTMLDialogElement>('#about-dialog'),pauseMenu=$<HTMLDialogElement>('#pause-dialog'),comparison=$<HTMLElement>('.comparison');
const dialogueNote=document.createElement('p');dialogueNote.textContent='The conversations are newly written in the language of the period. The original film is silent.';about.querySelector('.about-archive')!.before(dialogueNote);
let entered=false,hudVisible=true,ambientEnabled=true,lastPauseChange=0;
type Overlay='none'|'pause'|'archive'|'about'|'comparison';
let overlay:Overlay='none',overlayStack:Overlay[]=[];
const errors:string[]=[];
window.addEventListener('error',event=>errors.push(event.message));
window.addEventListener('unhandledrejection',event=>errors.push(String(event.reason)));
type ArchiveImage={id:string;path:string;title:string;date:string;pageUrl:string;rights:string;sourceId?:string;timeSeconds?:number;displayInArchive?:boolean};
const priority=['ferry-1901-hires','ferry-terminal-1905','film-445','film-490','palace-1904','call-1900','palace-c1900','market-1900','emporium-1904','film-018','film-110','film-240','film-345'];
const images=(sourcePack.images as ArchiveImage[]).filter(photo=>photo.displayInArchive!==false);
images.sort((a,b)=>{const ai=priority.indexOf(a.id),bi=priority.indexOf(b.id);return(ai<0?100:ai)-(bi<0?100:bi);});
const titles:Record<string,string>={'ferry-1901-hires':'The waterfront’s great clock','ferry-terminal-1905':'Looking back from the tower','palace-1904':'The original Palace Hotel','palace-c1900':'A second view of the Palace','call-1900':'The Call Building’s lost crown','market-1900':'Market Street at the turn of the century','emporium-1904':'The Emporium'};
function archiveCredit(photo:ArchiveImage){
  if(photo.sourceId==='loc-market-film')return 'Library of Congress · Public domain';
  if(photo.id==='ferry-terminal-1905')return 'SFMTA Photo Archive · Public domain';
  if(photo.id.startsWith('ferry-1901'))return 'New York Public Library · Public domain';
  if(photo.id==='emporium-1904')return 'San Francisco History Center · Public domain';
  if(photo.pageUrl.includes('loc.gov'))return 'Library of Congress · No known restrictions';
  return `Wikimedia Commons · ${photo.id==='palace-1904'?'CC0':'Public domain'}`;
}
const grid=$<HTMLElement>('#archive-grid');
for(const photo of images){
  const item=document.createElement('a');item.className='archive-card';item.href=photo.pageUrl;item.target='_blank';item.rel='noopener noreferrer';
  const image=document.createElement('img');image.src=photo.path;image.alt=photo.title;image.loading='lazy';
  const caption=document.createElement('div');const meta=document.createElement('span');meta.className='archive-meta';meta.textContent=photo.sourceId==='loc-market-film'?`MILES BROTHERS · 1906 · ${photo.timeSeconds}s`:photo.date;
  const title=document.createElement('h3');title.textContent=titles[photo.id]??(photo.sourceId==='loc-market-film'?'A moment on Market Street':photo.title);
  const source=document.createElement('p');source.textContent=`${archiveCredit(photo)} ↗`;
  caption.append(meta,title,source);item.append(image,caption);grid.append(item);
}

let world:ReturnType<typeof createHistoricalScene>|null=null;
function releaseMouse(){if(document.pointerLockElement===canvas)document.exitPointerLock();}
function showOverlay(next:Overlay){
  if(overlay==='comparison')world?.endComparison();
  for(const dialog of[pauseMenu,archive,about])if(dialog.open)dialog.close();
  comparison.hidden=true;overlay=next;lastPauseChange=performance.now();
  document.body.classList.toggle('game-paused',entered&&next!=='none');
  experience.inert=!entered||next!=='none';canvas.inert=next!=='none';
  resetTouchControls();
  if(next==='none'){world?.setPaused(false);if(entered)canvas.focus();else enter.focus();return;}
  world?.setPaused(true);releaseMouse();
  if(next==='comparison'){world?.beginComparison();comparison.hidden=false;$('#compare-close').focus();}
  else {const dialog=next==='pause'?pauseMenu:next==='archive'?archive:about;dialog.showModal();if(next==='pause')$('#resume').focus();else dialog.querySelector<HTMLButtonElement>('.round-close')?.focus();}
}
function openOverlay(next:Overlay){if(next===overlay)return;overlayStack.push(overlay);showOverlay(next);}
function closeOverlay(){showOverlay(overlayStack.pop()??'none');}
function pauseGame(){if(!entered||overlay!=='none')return;overlayStack=[];showOverlay('pause');}
function resumeGame(capture=false){overlayStack=[];showOverlay('none');if(capture&&!matchMedia('(pointer:coarse)').matches)world?.requestLook();}
function setHudVisible(value:boolean){hudVisible=value;document.body.classList.toggle('hud-hidden',!value);$('#hud-setting').setAttribute('aria-checked',String(value));$<HTMLInputElement>('#hud-setting').checked=value;world?.setHudVisible(value);}
function menuPanel(name:string){if(name==='settings'&&world){const a=world.snapshot().audio;$('#audio-status').textContent=a.error??'Dialogue and street sounds play on your device.';}document.querySelectorAll<HTMLElement>('[data-menu-panel]').forEach(el=>el.hidden=el.dataset.menuPanel!==name);document.querySelectorAll<HTMLElement>('[data-panel]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.panel===name)));}
for(const button of Array.from(document.querySelectorAll<HTMLElement>('[data-panel]')))button.addEventListener('click',()=>menuPanel(button.dataset.panel!));
$('#pause-open').addEventListener('click',pauseGame);$('#resume').addEventListener('click',()=>resumeGame(true));$('#pause-close').addEventListener('click',()=>resumeGame(true));
document.querySelectorAll('.archive-open').forEach(button=>button.addEventListener('click',()=>openOverlay('archive')));
$('#about-open').addEventListener('click',()=>openOverlay('about'));$('#compare-open').addEventListener('click',()=>openOverlay('comparison'));
for(const id of['#archive-close','#about-close','#compare-close'])$(id).addEventListener('click',closeOverlay);
for(const dialog of[pauseMenu,archive,about])dialog.addEventListener('cancel',event=>{event.preventDefault();closeOverlay();});
$('#compare-slider').addEventListener('input',event=>{comparison.querySelector('img')!.style.opacity=String(Number((event.target as HTMLInputElement).value)/100);});
comparison.addEventListener('keydown',event=>{if(event.key==='Tab'){const focusable=Array.from(comparison.querySelectorAll<HTMLElement>('button,input'));if(event.shiftKey&&document.activeElement===focusable[0]){event.preventDefault();focusable.at(-1)!.focus();}else if(!event.shiftKey&&document.activeElement===focusable.at(-1)){event.preventDefault();focusable[0].focus();}}});

for(const point of destinations){const button=document.createElement('button');button.dataset.destination=point.id;button.innerHTML=`<span>${point.name}<small>${point.detail}</small></span><span>↗</span>`;button.addEventListener('click',()=>{world?.selectDestination(point.id);resumeGame();});$('.destination-list').append(button);}
$('#clear-route').addEventListener('click',()=>{world?.selectDestination(null);resumeGame();});
$('#mute-setting').addEventListener('change',event=>world?.setMuted((event.target as HTMLInputElement).checked));
$('#voice-setting').addEventListener('change',event=>world?.setVoices((event.target as HTMLInputElement).checked));
$('#volume-setting').addEventListener('input',event=>world?.setVolume(Number((event.target as HTMLInputElement).value)));
$('#ambient-setting').addEventListener('change',event=>{ambientEnabled=(event.target as HTMLInputElement).checked;world?.setAmbient(ambientEnabled);});
$('#hud-setting').addEventListener('change',event=>setHudVisible((event.target as HTMLInputElement).checked));
$('#look-setting').addEventListener('input',event=>world?.setSensitivity(Number((event.target as HTMLInputElement).value)));
$('#guided').addEventListener('click',()=>{resumeGame();world?.guided();});

type FullscreenDocument=Document&{webkitFullscreenElement?:Element;webkitExitFullscreen?:()=>void};
type FullscreenElement=HTMLElement&{webkitRequestFullscreen?:()=>void};
const fullscreenElement=()=>document.fullscreenElement||(document as FullscreenDocument).webkitFullscreenElement;
const fullscreenSupported=()=>!!(document.documentElement.requestFullscreen||(document.documentElement as FullscreenElement).webkitRequestFullscreen);
let fullscreenError:string|null=null;
let fullscreenPending=false,fullscreenChangedAt=-Infinity,blurCheck:ReturnType<typeof setTimeout>|null=null,hadMouseLock=false;
const changingFullscreen=()=>fullscreenPending||performance.now()-fullscreenChangedAt<500;
function syncFullscreen(){const active=!!fullscreenElement(),label=active?'Exit fullscreen':'Enter fullscreen';$('#fullscreen').setAttribute('aria-label',label);$('#fullscreen').setAttribute('title',`${label} (V)`);$('#fullscreen').setAttribute('aria-pressed',String(active));$('#menu-fullscreen').textContent=label;}
async function toggleFullscreen(){
  if(fullscreenPending)return;
  fullscreenPending=true;world?.clearInput();resetTouchControls();
  try{
    fullscreenError=null;
    if(fullscreenElement()){if(document.exitFullscreen)await document.exitFullscreen();else (document as FullscreenDocument).webkitExitFullscreen?.();}
    else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();
    else if((document.documentElement as FullscreenElement).webkitRequestFullscreen)(document.documentElement as FullscreenElement).webkitRequestFullscreen!();
    else fullscreenError='Fullscreen is unavailable in this browser. Use its window controls for a larger view.';
  }catch{fullscreenError='Fullscreen was declined by the browser. Try the button again, or use the browser’s window controls.';}
  finally{fullscreenPending=false;fullscreenChangedAt=performance.now();}
  $('#display-status').textContent=fullscreenError??'';syncFullscreen();world?.engine.resize();if(overlay==='none')canvas.focus();
}
$('#fullscreen').addEventListener('click',toggleFullscreen);$('#menu-fullscreen').addEventListener('click',toggleFullscreen);
for(const event of['fullscreenchange','webkitfullscreenchange'])document.addEventListener(event,()=>{fullscreenChangedAt=performance.now();syncFullscreen();world?.engine.resize();});
window.addEventListener('keydown',event=>{
  if(!entered)return;
  if(event.code==='Escape'){
    event.preventDefault();event.stopImmediatePropagation();
    if(performance.now()-lastPauseChange<120)return;
    if(overlay==='none')pauseGame();else closeOverlay();return;
  }
  if(overlay!=='none'||!hasGameFocus(event.target)||event.repeat)return;
  if(event.code==='KeyV'){event.preventDefault();void toggleFullscreen();}
  if(event.code==='KeyH'){event.preventDefault();setHudVisible(!hudVisible);}
},true);
document.addEventListener('pointerlockchange',()=>{const locked=document.pointerLockElement===canvas,lost=hadMouseLock&&!locked;hadMouseLock=locked;if(lost&&entered&&overlay==='none'&&!changingFullscreen())pauseGame();});
function checkBlur(){blurCheck=null;if(document.hasFocus())return;if(changingFullscreen()){blurCheck=setTimeout(checkBlur,550);return;}pauseGame();}
window.addEventListener('blur',()=>{world?.clearInput();resetTouchControls();if(blurCheck)clearTimeout(blurCheck);if(changingFullscreen())blurCheck=setTimeout(checkBlur,550);else pauseGame();});
window.addEventListener('focus',()=>{if(blurCheck)clearTimeout(blurCheck);blurCheck=null;});
document.addEventListener('visibilitychange',()=>{if(document.hidden){world?.clearInput();resetTouchControls();pauseGame();}});
canvas.addEventListener('click',event=>{if(!hudVisible&&event.pointerType!=='mouse')pauseGame();});

const stick=$<HTMLElement>('.touch-stick'),knob=stick.querySelector<HTMLElement>('span')!;let stickId:number|null=null;
function moveStick(event:PointerEvent){if(event.pointerId!==stickId)return;const box=stick.getBoundingClientRect(),dx=event.clientX-box.left-box.width/2,dy=event.clientY-box.top-box.height/2,max=box.width*.32,distance=Math.hypot(dx,dy),scale=Math.max(1,distance/max);knob.style.transform=`translate(${dx/scale}px,${dy/scale}px)`;world?.touch(-dy/Math.max(max,distance),dx/Math.max(max,distance),distance>max*.86);}
stick.addEventListener('pointerdown',event=>{event.preventDefault();stickId=event.pointerId;stick.setPointerCapture(event.pointerId);moveStick(event);});stick.addEventListener('pointermove',moveStick);
function releaseStick(){stickId=null;knob.style.transform='';world?.touch(0,0);}
for(const event of['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(event,releaseStick);
$('#touch-jump').addEventListener('pointerdown',event=>{event.preventDefault();world?.jump();});
const drivePointers=new Map<HTMLElement,number>();
for(const button of Array.from(document.querySelectorAll<HTMLElement>('[data-drive]'))){
  button.addEventListener('pointerdown',event=>{event.preventDefault();button.setPointerCapture(event.pointerId);drivePointers.set(button,event.pointerId);world?.touch(Number(button.dataset.drive),0);button.classList.add('held');});
  for(const event of['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>{drivePointers.delete(button);world?.touch(0,0);button.classList.remove('held');});
}
function resetTouchControls(){
  const captured=stickId;releaseStick();if(captured!==null&&stick.hasPointerCapture(captured))stick.releasePointerCapture(captured);
  for(const [button,id]of drivePointers){button.classList.remove('held');if(button.hasPointerCapture(id))button.releasePointerCapture(id);}drivePointers.clear();
}
$('#touch-reverse').addEventListener('click',()=>{world?.reverse();canvas.focus();});$('#touch-bell').addEventListener('click',()=>{world?.bell();canvas.focus();});
function hudFootprint(){
  const width=innerWidth,height=innerHeight;
  const rectangles=entered&&overlay==='none'&&hudVisible?Array.from(document.querySelectorAll<HTMLElement>('[data-hud-part]')).filter(el=>!el.hidden&&el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden'&&getComputedStyle(el).display!=='none').map(el=>{const r=el.getBoundingClientRect();return{part:el.dataset.hudPart,left:Math.max(0,r.left),top:Math.max(0,r.top),right:Math.min(width,r.right),bottom:Math.min(height,r.bottom)};}):[];
  const xs=[...new Set(rectangles.flatMap(r=>[r.left,r.right]))].sort((a,b)=>a-b);let area=0;
  for(let i=1;i<xs.length;i++){const intervals=rectangles.filter(r=>r.left<xs[i]&&r.right>xs[i-1]).map(r=>[r.top,r.bottom]).sort((a,b)=>a[0]-b[0]);let length=0,end=-Infinity;for(const [a,b]of intervals){length+=Math.max(0,b-Math.max(a,end));end=Math.max(end,b);}area+=(xs[i]-xs[i-1])*length;}
  return{rectangles,boundingBoxUnionPixels:Math.round(area),viewportPixels:width*height,percent:Math.round(area/(width*height)*10000)/100};
}
async function start(){
  try{
    world=createHistoricalScene(canvas,state=>{if(document.body.dataset.mode!==state.mode)resetTouchControls();document.body.dataset.mode=state.mode;$<HTMLButtonElement>('#guided').disabled=state.mode!=='tram';$('#guided').textContent=state.guided?'Drive manually':'Ride automatically';});
    (window as Window&{__historicalSF?:unknown}).__historicalSF={snapshot:()=>({...world!.snapshot(),errors:[...errors],entered,comparisonOpen:overlay==='comparison',overlay,ambientEnabled,fullscreen:{active:!!fullscreenElement(),supported:fullscreenSupported(),error:fullscreenError},hudFootprint:hudFootprint()}),navigate:(place:Place)=>world!.navigate(place),board:()=>world!.board(),ride:()=>world!.ride(),guided:()=>world!.guided(),reverse:()=>world!.reverse(),respond:(index:number)=>world!.respond(index),jump:()=>world!.jump(),menu:pauseGame,resume:resumeGame,toggleFullscreen,toggleHUD:()=>setHudVisible(!hudVisible),selectDestination:(id:DestinationId|null)=>world!.selectDestination(id),model:'gpt-6-astra'};
    await Promise.race([world.scene.whenReadyAsync(),new Promise<never>((_,reject)=>setTimeout(()=>reject(new Error('The scene did not become ready within 25 seconds.')),25000))]);
    enter.disabled=false;enter.querySelector('span')!.textContent='Step inside';
    if(new URL(location.href).searchParams.has('view')){const place=new URL(location.href).searchParams.get('view') as Place;if(['ferry','arcade','market','harbor','ship'].includes(place)){await enterStreet();world.navigate(place,false);}}
  }catch(error){errors.push(String(error));enter.hidden=true;const message=$<HTMLElement>('#load-error');message.hidden=false;message.textContent='The street could not open. Try reloading, or explore the original photographs.';console.error('Historical street could not start',error);}
}
async function enterStreet(){
  if(!world)return;entered=true;video.pause();world.enter();document.body.classList.add('entered');intro.classList.add('leaving');experience.inert=false;experience.setAttribute('aria-hidden','false');
  await new Promise(resolve=>setTimeout(resolve,1200));intro.hidden=true;if(overlay==='none')canvas.focus();
}
enter.addEventListener('click',enterStreet);
$('#reset').addEventListener('click',()=>{entered=false;releaseMouse();overlayStack=[];showOverlay('none');world?.reset();document.body.classList.remove('entered','game-paused');intro.hidden=false;intro.classList.remove('leaving');experience.inert=true;experience.setAttribute('aria-hidden','true');video.play().catch(()=>{});enter.focus();});
if(matchMedia('(prefers-reduced-motion: reduce)').matches){video.autoplay=false;video.pause();}
if(import.meta.env.DEV)setInterval(()=>{if(!world)return;const s=world.snapshot();canvas.dataset.diagnostics=JSON.stringify({mode:s.mode,paused:s.paused,camera:s.camera,input:s.input,audio:s.audio,streetcar:s.streetcar,conversation:s.hud.conversation,crowd:{count:s.crowd.count,moving:s.crowd.moving,running:s.crowd.running,hopping:s.crowd.hopping,yielding:s.crowd.yielding},riders:s.exteriorRiders,route:s.hud.route,transition:s.transition,elapsed:s.elapsed,fps:s.fps,errors});},500);
start();
