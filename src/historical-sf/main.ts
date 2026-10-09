import './style.css';
import './hud.css';
import { createHistoricalScene, type Place } from './scene';
import sourcePack from '../../data/historical-sf/sources.json';

const arrow='<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h15M13 5l7 7-7 7" stroke="currentColor" stroke-width="1.5"/></svg>';
const play='<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m7 4 9 6-9 6V4Z" fill="currentColor"/></svg>';
const pause='<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M6 4h3v12H6zM12 4h3v12h-3z" fill="currentColor"/></svg>';
const bellIcon='<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 17h14l-2-3V9a5 5 0 0 0-10 0v5l-2 3Zm5 3h4M12 2v2" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>';
const app=document.querySelector<HTMLDivElement>('#historical-app')!;
app.innerHTML=`
  <canvas id="street" tabindex="0" aria-label="Walkable reconstruction of Market Street. Use W A S D to walk and drag to look."></canvas>
  <div class="scene-wash" aria-hidden="true"></div>
  <header class="masthead">
    <a class="wordmark" href="/historical.html" aria-label="San Francisco 1906 home"><span class="monogram">SF</span><span>San Francisco<span class="wordmark-year">1906</span></span></a>
    <div class="header-right"><span class="date-mark">SATURDAY, APRIL 14</span><button class="text-button archive-open">The archive <span>↗</span></button></div>
  </header>
  <section class="intro" aria-labelledby="intro-title">
    <img class="archive-backdrop" src="/historical-sf/references/market-film-445.jpg" alt="Original 1906 film frame looking along Market Street toward the Ferry Building" />
    <video class="archive-film" muted autoplay playsinline loop preload="metadata" poster="/historical-sf/references/market-film-445.jpg" aria-hidden="true"><source src="/historical-sf/market-1906-excerpt.mp4" type="video/mp4" /></video>
    <div class="intro-shade"></div>
    <div class="intro-copy"><p class="eyebrow">A WALK DOWN MARKET STREET</p><h1 id="intro-title">San Francisco,<br><em>1906.</em></h1><p class="intro-description">One ordinary Saturday.<br>A city on the edge of history.</p><button id="enter" class="enter-button" disabled><span>Opening the street…</span>${arrow}</button></div>
    <div class="intro-bottom"><span>STEP OFF THE CAMERA.<br>INTO THE STREET.</span><span>ORIGINAL FILM · MILES BROTHERS<br>LIBRARY OF CONGRESS, APRIL 14, 1906</span><button class="quiet-button archive-open">Explore the photographs ${arrow}</button></div>
    <p id="load-error" role="status" hidden></p>
  </section>
  <div class="experience" inert aria-hidden="true">
    <div class="district-mark"><span class="district-dot"></span> THE FERRY APPROACH <span class="district-distance">210 m to explore</span></div>
    <div class="location-caption"><p id="place-description" class="eyebrow">MARKET STREET</p><h2 id="place-title">Toward the waterfront</h2><span class="coordinates">SAN FRANCISCO BAY ↗</span></div>
    <button id="compare-open" class="compare-button"><span class="compare-icon">◧</span> Original view</button>
    <div class="tram-dashboard" hidden><div><span id="speed-number">0</span><small>mph</small></div><p id="driving-instruction">W accelerate · S brake<span>E step off · R reverse when stopped</span></p></div>
    <div class="journey-controls"><button id="ride" class="ride-button">${play}<span>Board the streetcar</span><kbd>E</kbd></button><button id="guided" class="cab-button" hidden>Guided</button><button id="reverse" class="cab-button" title="Reverse when stopped (R)" aria-label="Reverse streetcar direction" hidden>↔</button><button id="bell" class="cab-button" title="Ring the bell (B)" aria-label="Ring streetcar bell" hidden>${bellIcon}</button><span class="control-divider"></span><button id="reset" class="replay-button" aria-label="Replay the opening">↺</button></div>
    <div class="walk-hint"><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> walk</span><span>Drag to look</span><span><kbd>↑</kbd><kbd>↓</kbd> move · <kbd>←</kbd><kbd>→</kbd> turn</span></div>
    <div class="touch-controls" aria-label="Walking controls"><button data-move="0,1" aria-label="Walk forward">↑</button><button data-move="-1,0" aria-label="Step left">←</button><button data-move="0,-1" aria-label="Walk backward">↓</button><button data-move="1,0" aria-label="Step right">→</button></div>
    <div class="drive-touch"><button data-move="0,1" aria-label="Accelerate streetcar">↑<small>THROTTLE</small></button><button data-move="0,-1" aria-label="Brake streetcar">↓<small>BRAKE</small></button></div>
    <p class="reconstruction-note">An interpretation of the historic street <button id="about-open" aria-label="About this reconstruction">ⓘ</button></p>
  </div>
  <section class="comparison" role="dialog" aria-modal="true" aria-label="Compare original film and reconstruction" hidden>
    <img src="/historical-sf/references/market-film-445.jpg" alt="Market Street in the original Miles Brothers film, April 14, 1906" />
    <div class="comparison-top"><span class="eyebrow">THE SAME DIRECTION. A DIFFERENT CENTURY.</span><button id="compare-close" class="round-close" aria-label="Close comparison">×</button></div>
    <div class="comparison-bottom"><p>Market Street, April 14, 1906<span>Original film · Miles Brothers · Library of Congress</span></p><label for="compare-slider">Archive <input id="compare-slider" type="range" min="0" max="100" value="65" /> Reconstruction</label></div>
  </section>
  <dialog id="archive-dialog" class="archive-dialog"><div class="archive-top"><div><p class="eyebrow">THE CITY, ON RECORD</p><h2>Before the fire.</h2></div><button id="archive-close" class="round-close" aria-label="Close archive">×</button></div><p class="archive-intro">The photographs and film behind this walk. Market Street’s everyday life, preserved in the original images.</p><div id="archive-grid" class="archive-grid"></div><div class="archive-foot"><p>The street is an approximate reconstruction. Landmark silhouettes and facade rhythms follow these records; distances, color, traffic, and the surrounding buildings are interpreted.</p><a href="https://www.loc.gov/item/00694408/" target="_blank" rel="noopener noreferrer">Watch the complete original film ↗</a></div></dialog>
  <dialog id="about-dialog" class="about-dialog"><button id="about-close" class="round-close" aria-label="Close about">×</button><p class="eyebrow">A STREET REMEMBERED</p><h2>Built from the record.<br>Open to exploration.</h2><p>The Miles Brothers filmed Market Street on April 14, 1906, four days before the earthquake. Their camera rode toward the Ferry Building through a city in motion.</p><p>Follow the final stretch of lower Market Street to the Ferry Building. The bay-window ticket office, coffee house, warehouse, and painted advertisements follow a photograph taken from the tower in 1905. Colors, dimensions of the neighboring buildings, and street life remain interpretations.</p><button class="about-archive archive-open">See the original images ${arrow}</button></dialog>
  <div class="toast" role="status" aria-live="polite"></div>
`;

const $=<T extends HTMLElement>(s:string)=>document.querySelector<T>(s)!;
const intro=$<HTMLElement>('.intro'),experience=$<HTMLElement>('.experience'),canvas=$<HTMLCanvasElement>('#street'),enter=$<HTMLButtonElement>('#enter'),video=$<HTMLVideoElement>('.archive-film');
const archive=$<HTMLDialogElement>('#archive-dialog'),about=$<HTMLDialogElement>('#about-dialog'),comparison=$<HTMLElement>('.comparison');
const dialogueNote=document.createElement('p');dialogueNote.textContent='The conversations are newly written in the language of the period. The original film is silent.';about.querySelector('.about-archive')!.before(dialogueNote);
let entered=false,comparisonOpen=false,previousFocus:HTMLElement|null=null;
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
function showDialog(dialog:HTMLDialogElement){previousFocus=document.activeElement as HTMLElement;if(about.open)about.close();if(archive.open)archive.close();world?.setPaused(true);dialog.showModal();dialog.querySelector<HTMLButtonElement>('.round-close')?.focus();}
function restoreFocus(){if(entered)canvas.focus();else previousFocus?.focus();}
function closeDialog(dialog:HTMLDialogElement){dialog.close();world?.setPaused(false);restoreFocus();}
document.querySelectorAll('.archive-open').forEach(button=>button.addEventListener('click',()=>showDialog(archive)));
$('#archive-close').addEventListener('click',()=>closeDialog(archive));$('#about-open').addEventListener('click',()=>showDialog(about));$('#about-close').addEventListener('click',()=>closeDialog(about));
for(const dialog of[archive,about]){dialog.addEventListener('cancel',()=>{world?.setPaused(false);setTimeout(restoreFocus,0);});dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeDialog(dialog);}});}

async function start(){
  try {
    world=createHistoricalScene(canvas,state=>{
      const view=world?.views[state.place];if(view){$('#place-title').textContent=view.title;$('#place-description').textContent=view.description;}
      $('#ride').innerHTML=`${state.mode==='tram'?pause:play}<span>${state.mode==='tram'?'Step off':state.canBoard?'Board the streetcar':`Streetcar · ${Math.round(state.distance)} m`}</span><kbd>E</kbd>`;
      for(const id of['#guided','#bell','#reverse','.tram-dashboard'])$(id).hidden=state.mode!=='tram';
      $('#speed-number').textContent=String(Math.round(state.speed*2.23694));
      $('#guided').textContent=state.guided?'Manual':'Guided';
      const smallScreen=matchMedia('(max-width:700px)').matches;
      $('#driving-instruction').innerHTML=state.guided?`Enjoy the ride<span>${smallScreen?'Throttle or brake takes control':'W or S to take control'}</span>`:smallScreen?'Hold throttle to accelerate<span>Brake to slow down</span>':'W accelerate · S brake<span>E step off · R reverse when stopped</span>';
      document.body.dataset.mode=state.mode;
    });
    (window as Window&{__historicalSF?:unknown}).__historicalSF={snapshot:()=>({...world!.snapshot(),errors:[...errors],entered,comparisonOpen}),navigate:(place:Place)=>world!.navigate(place),board:()=>world!.board(),ride:()=>world!.ride(),guided:()=>world!.guided(),reverse:()=>world!.reverse(),speak:()=>world!.speak(),respond:(index:number)=>world!.respond(index),model:'gpt-6-astra'};
    await Promise.race([world.scene.whenReadyAsync(),new Promise<never>((_,reject)=>setTimeout(()=>reject(new Error('The scene did not become ready within 25 seconds.')),25000))]);
    enter.disabled=false;enter.querySelector('span')!.textContent='Step inside';
    if(new URL(location.href).searchParams.has('view')){const p=new URL(location.href).searchParams.get('view') as Place;if(['ferry','arcade','market'].includes(p)){await enterStreet();world.navigate(p,false);}}
  } catch(error){errors.push(String(error));enter.hidden=true;const message=$<HTMLElement>('#load-error');message.hidden=false;message.textContent='The street could not open. Try reloading, or explore the original photographs.';console.error('Historical street could not start',error);}
}
async function enterStreet(){
  if(!world)return;entered=true;video.pause();world.enter();document.body.classList.add('entered');intro.classList.add('leaving');experience.inert=false;experience.setAttribute('aria-hidden','false');
  await new Promise(resolve=>setTimeout(resolve,1600));intro.hidden=true;canvas.focus();
}
enter.addEventListener('click',enterStreet);
let toastTimer=0;
function toast(message:string){$('.toast').textContent=message;$('.toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=window.setTimeout(()=>$('.toast').classList.remove('visible'),3600);}
$('#ride').addEventListener('click',()=>{if(!world?.board())toast('Walk up to either open platform to board.');canvas.focus();});
$('#guided').addEventListener('click',()=>{world?.guided();canvas.focus();});
$('#bell').addEventListener('click',()=>{world?.bell();canvas.focus();});
$('#reverse').addEventListener('click',()=>{if(!world?.reverse())toast('Bring the streetcar to a stop before reversing.');canvas.focus();});
$('#reset').addEventListener('click',()=>{world?.reset();entered=false;document.body.classList.remove('entered');intro.hidden=false;intro.classList.remove('leaving');experience.inert=true;experience.setAttribute('aria-hidden','true');video.play().catch(()=>{});enter.focus();});
function closeCompare(){comparison.hidden=true;comparisonOpen=false;world?.endComparison();canvas.focus();}
$('#compare-open').addEventListener('click',()=>{world?.beginComparison();comparison.hidden=false;comparisonOpen=true;$('#compare-close').focus();});
$('#compare-close').addEventListener('click',closeCompare);
$('#compare-slider').addEventListener('input',event=>{comparison.querySelector('img')!.style.opacity=String(Number((event.target as HTMLInputElement).value)/100);});
window.addEventListener('keydown',event=>{if(event.key==='Escape'&&comparisonOpen){event.preventDefault();closeCompare();}});
comparison.addEventListener('keydown',event=>{if(event.key==='Tab'){const focusable=Array.from(comparison.querySelectorAll<HTMLElement>('button,input'));if(event.shiftKey&&document.activeElement===focusable[0]){event.preventDefault();focusable.at(-1)!.focus();}else if(!event.shiftKey&&document.activeElement===focusable.at(-1)){event.preventDefault();focusable[0].focus();}}});
document.querySelectorAll<HTMLElement>('[data-move]').forEach(button=>{
  button.addEventListener('pointerdown',event=>{event.preventDefault();button.setPointerCapture(event.pointerId);const [side,forward]=button.dataset.move!.split(',').map(Number);world?.touch(forward,side);button.classList.add('held');});
  for(const name of['pointerup','pointercancel','lostpointercapture'])button.addEventListener(name,()=>{world?.touch(0,0);button.classList.remove('held');});
});
if(matchMedia('(prefers-reduced-motion: reduce)').matches){video.autoplay=false;video.pause();}
start();
