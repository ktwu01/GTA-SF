import type { Speech } from './dialogue';
import type { Pedestrian, TrafficMarker } from './crowd';
import type { StreetPoint } from './navigation';

type Listener=StreetPoint&{yaw:number};
export function soundPosition(source:StreetPoint,listener:Listener,reach=38){
  const dx=source.x-listener.x,dz=source.z-listener.z,distance=Math.hypot(dx,dz);
  return{distance,gain:Math.max(0,1-distance/reach)**2,pan:distance<.01?0:Math.max(-1,Math.min(1,(dx*Math.cos(listener.yaw)-dz*Math.sin(listener.yaw))/distance))};
}

export function createStreetAudio(){
  let context:AudioContext|null=null,master:GainNode|null=null,railGain:GainNode|null=null,railPan:StereoPannerNode|null=null;
  let noise:AudioBuffer|null=null,unlocked=false,paused=true,muted=false,volume=.7,voicesEnabled=true;
  let lastStep=0,lastClop=0,lastRatchet=0,nextBell=14,lastSpeechKey='',utterance:SpeechSynthesisUtterance|null=null;
  let spoken=0,lastLine='',lastVoice='',speechStatus='Waiting for a gesture',error:string|null=null;
  const synthesis=typeof speechSynthesis==='undefined'?null:speechSynthesis;
  let voices:SpeechSynthesisVoice[]=[];
  const loadVoices=()=>{voices=synthesis?.getVoices().filter(v=>v.localService&&/^en(?:-|_)/i.test(v.lang))??[];};
  loadVoices();synthesis?.addEventListener('voiceschanged',loadVoices);
  const audible=()=>unlocked&&!paused&&!muted&&volume>0;
  function cancelSpeech(){synthesis?.cancel();utterance=null;lastSpeechKey='';speechStatus=paused?'Paused':muted?'Muted':'Ready';}
  function syncMaster(){if(master&&context)master.gain.setTargetAtTime(audible()?volume:0,context.currentTime,.025);}
  function unlock(){
    if(!context){
      try{
        context=new AudioContext();master=context.createGain();master.gain.value=0;master.connect(context.destination);
        noise=context.createBuffer(1,context.sampleRate*2,context.sampleRate);const data=noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
        const air=context.createBufferSource(),filter=context.createBiquadFilter(),airGain=context.createGain();
        air.buffer=noise;air.loop=true;filter.type='lowpass';filter.frequency.value=170;airGain.gain.value=.07;air.connect(filter);filter.connect(airGain);airGain.connect(master);air.start();
        railGain=context.createGain();railGain.gain.value=0;railPan=context.createStereoPanner();railGain.connect(railPan);railPan.connect(master);
        for(const frequency of[43,87,131]){const oscillator=context.createOscillator(),gain=context.createGain();oscillator.type='triangle';oscillator.frequency.value=frequency;gain.gain.value=frequency===43?.48:.13;oscillator.connect(gain);gain.connect(railGain);oscillator.start();}
      }catch{error='Street sound is unavailable in this browser.';return;}
    }
    void context.resume().then(()=>{unlocked=true;loadVoices();syncMaster();speechStatus=paused?'Paused':'Ready';}).catch(()=>{error='Tap the street to enable sound.';});
  }
  function tone(frequency:number,duration:number,gainValue:number,pan=0,type:OscillatorType='sine'){
    if(!context||!master||!audible())return;
    const oscillator=context.createOscillator(),gain=context.createGain(),panner=context.createStereoPanner(),now=context.currentTime;
    oscillator.type=type;oscillator.frequency.setValueAtTime(frequency,now);oscillator.frequency.exponentialRampToValueAtTime(frequency*.83,now+duration);
    gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(Math.max(.0001,gainValue),now+.005);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
    panner.pan.value=pan;oscillator.connect(gain);gain.connect(panner);panner.connect(master);oscillator.start();oscillator.stop(now+duration+.01);
    oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();panner.disconnect();};
  }
  function rustle(gainValue:number,pan=0){
    if(!context||!master||!noise||!audible())return;
    const source=context.createBufferSource(),gain=context.createGain(),filter=context.createBiquadFilter(),panner=context.createStereoPanner(),now=context.currentTime;
    source.buffer=noise;filter.type='lowpass';filter.frequency.value=680;gain.gain.setValueAtTime(gainValue,now);gain.gain.exponentialRampToValueAtTime(.0001,now+.13);panner.pan.value=pan;
    source.connect(filter);filter.connect(gain);gain.connect(panner);panner.connect(master);source.start(now,Math.random(),.15);
    source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();panner.disconnect();};
  }
  function bell(source?:StreetPoint,listener?:Listener,bicycle=false){
    const spatial=source&&listener?soundPosition(source,listener,50):{gain:1,pan:0};
    for(const [frequency,gain,decay]of bicycle?[[1900,.1,.48],[3100,.04,.3]]:[[880,.16,.85],[1762,.065,.6],[2380,.03,.32]])tone(frequency,decay,gain*spatial.gain,spatial.pan);
  }
  function speak(line:Speech,people:Pedestrian[],listener:Listener){
    if(!synthesis||!voicesEnabled||!audible())return;
    const key=`${line.id}:${line.text}`;if(key===lastSpeechKey)return;
    synthesis.cancel();lastSpeechKey=key;
    if(!voices.length){loadVoices();if(!voices.length){speechStatus='No local English voice available';return;}}
    const person=people[line.id],spatial=soundPosition(person,listener,20);
    if(!line.active&&spatial.gain<.08)return;
    const voice=voices[line.id%voices.length],next=new SpeechSynthesisUtterance(line.text);
    next.voice=voice;next.lang=voice.lang;next.volume=Math.min(1,volume*(line.active?1:spatial.gain));next.rate=.93+(line.id%4)*.035;next.pitch=.88+(line.id%5)*.045;
    utterance=next;lastLine=line.text;lastVoice=voice.name;speechStatus='Speaking';spoken++;
    next.onend=()=>{if(utterance===next){utterance=null;speechStatus='Ready';}};
    next.onerror=event=>{if(utterance===next){utterance=null;speechStatus=event.error==='interrupted'||event.error==='canceled'?'Ready':'Voice unavailable';}};
    synthesis.speak(next);
  }
  function update(time:number,listener:Listener,vehicles:TrafficMarker[],people:Pedestrian[],speech:Speech[],walkingSpeed:number,grounded:boolean,cyclingSpeed:number){
    if(!audible())return;
    if(walkingSpeed>.2&&grounded&&time-lastStep>Math.max(.23,.54-walkingSpeed*.046)){lastStep=time;tone(110+Math.random()*28,.09,.085,(spoken%2?1:-1)*.1,'triangle');rustle(.11);}
    if(cyclingSpeed>.4&&time-lastRatchet>.17){lastRatchet=time;tone(1350,.025,.012);}
    const near=vehicles.filter(v=>v.kind==='tram'&&v.speed>.05).map(v=>({v,...soundPosition(v,listener)})).sort((a,b)=>b.gain-a.gain)[0];
    if(context&&railGain&&railPan){railGain.gain.setTargetAtTime(near?near.gain*Math.min(.16,near.v.speed*.04):0,context.currentTime,.16);railPan.pan.setTargetAtTime(near?.pan??0,context.currentTime,.16);}
    const horse=vehicles.filter(v=>v.kind==='wagon').map(v=>soundPosition(v,listener,28)).sort((a,b)=>b.gain-a.gain)[0];
    if(horse&&horse.gain>.02&&time-lastClop>.37){lastClop=time;tone(360,.055,.18*horse.gain,horse.pan,'triangle');tone(560,.08,.08*horse.gain,horse.pan);}
    if(time>=nextBell){nextBell=time+17;if(near&&near.distance>6)bell(near.v,listener);}
    const line=speech.find(s=>s.active)??speech[0];
    if(line)speak(line,people,listener);else if(lastSpeechKey)cancelSpeech();
  }
  return{unlock,update,bell,
    impact(){tone(90,.17,.12,'0' as unknown as number,'triangle');rustle(.08);},
    reward(){tone(660,.22,.1);tone(990,.3,.06);},
    setPaused(value:boolean){paused=value;if(value)cancelSpeech();syncMaster();},
    setMuted(value:boolean){muted=value;if(value)cancelSpeech();syncMaster();},
    setVolume(value:number){volume=Math.max(0,Math.min(1,Number.isFinite(value)?value:.7));cancelSpeech();syncMaster();},
    setVoices(value:boolean){voicesEnabled=value;if(!value)cancelSpeech();},
    reset(){cancelSpeech();lastStep=lastClop=lastRatchet=0;nextBell=14;paused=true;syncMaster();},
    snapshot(){return{unlocked,context:context?.state??'locked',muted,volume,paused,voicesEnabled,localVoices:voices.length,speechSupported:!!synthesis,speechStatus,spoken,lastLine,lastVoice,error};},
  };
}
