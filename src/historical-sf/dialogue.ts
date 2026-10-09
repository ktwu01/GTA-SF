import type { Crowd, Pedestrian, PersonRole, TrafficMarker } from './crowd';
import { distanceBetween, segmentHitsBlock, streetBlocks, type StreetPoint } from './navigation.ts';

export const roleNames:Record<PersonRole,string>={traveler:'Ferry traveler',news:'News seller',porter:'Porter',clerk:'Shop clerk',flowers:'Flower seller',coffee:'Coffee-house keeper'};
// Original dialogue; the sources support its subjects, not recorded speech.
const ambient:Record<PersonRole,string[]>={
  traveler:['Is this the way to the Oakland boat?','Keep the parcels together, please.','I shall meet you by the clock.','Where is the exhibit attendant?'],
  news:['A Call for the crossing, sir?','A paper to read on the boat?','Have you bought your paper yet?','Mind the wind; hold it firmly.'],
  porter:['Shall I carry that trunk?','Which boat are you taking?','Keep your baggage check safe.','A little room for the baggage, please.'],
  clerk:['Will you have it wrapped?','Your change, sir. Thank you.','A little room on the pavement, please.'],
  flowers:['A few flowers to take home?','Shall I wrap these for the crossing?','Mind the stems, please.'],
  coffee:['Coffee before your boat?','Come in for a bite of lunch.','There is room by the window.'],
};
type Choice={label:string;reply:string;destination?:'ferry'|'tickets'|'coffee'|'arcade'};
const exchanges:Record<PersonRole,{greeting:string;choices:Choice[]}>= {
  news:{greeting:'A paper for the crossing? The Call, if you please.',choices:[{label:'Which way to the ferry?',reply:'Straight down Market, under the great clock. You cannot miss it.',destination:'ferry'},{label:'Just taking a walk.',reply:'Then mind the cars. They give a fellow little room here.'}]},
  traveler:{greeting:'Good afternoon. Are you bound for the ferry?',choices:[{label:'Where do I get a ticket?',reply:'At the ticket office by the corner. Keep your parcels close.',destination:'tickets'},{label:'What is inside the building?',reply:'An exhibit of California products, I am told. Ask the attendant.',destination:'arcade'}]},
  porter:{greeting:'Any baggage to carry? A trunk, or perhaps a parcel?',choices:[{label:'Only looking about.',reply:'Then give the wagons a little room, and enjoy your afternoon.'},{label:'Where is the ferry entrance?',reply:'By the great clock ahead. Keep your baggage check safe.',destination:'ferry'}]},
  clerk:{greeting:'Good afternoon. Can I direct you somewhere?',choices:[{label:'Somewhere for coffee?',reply:'The coffee house is at the north corner, facing the Ferry.',destination:'coffee'},{label:'I should like to see the arcade.',reply:'Across the apron, beyond the cars. Fine stonework there.',destination:'arcade'}]},
  flowers:{greeting:'A few flowers for someone at home?',choices:[{label:'They look very fine.',reply:'Thank you kindly. A little color for the table.'},{label:'Is the ticket office near?',reply:'Just beside the corner here, beneath the projecting windows.',destination:'tickets'}]},
  coffee:{greeting:'Coffee before your boat? Or a bite of lunch?',choices:[{label:'I have time to look about.',reply:'Then take your time. The window looks out on a busy street.'},{label:'Which way to the boat?',reply:'Across the open apron, to the great clock. Mind the passing cars.',destination:'ferry'}]},
};
export type Speech={id:number;text:string;until:number;active:boolean};
export function hasStreetSight(from:StreetPoint,to:StreetPoint,vehicles:TrafficMarker[]){
  if(streetBlocks.some(b=>segmentHitsBlock(from,to,b)))return false;
  return !vehicles.some(v=>!(Math.abs(from.x-v.x)<1.6&&Math.abs(from.z-v.z)<4.2)&&segmentHitsBlock(from,to,{x:v.x,z:v.z,width:v.kind==='wagon'?2.2:2.7,depth:v.kind==='wagon'?7.5:8.0}));
}
export function createDialogue(crowd:Crowd){
  let speech:Speech[]=[],activeId:number|null=null,stage:'greeting'|'reply'='greeting',time=0,nextAmbient=0,nearby:Pedestrian|null=null,enabled=false,ambientEnabled=false,replyUntil=Infinity;
  const cooldown=new Map<number,number>();
  function begin(){
    if(!enabled)return false;
    if(activeId!==null){end();return true;}
    if(!nearby)return false;
    activeId=nearby.id;stage='greeting';replyUntil=Infinity;crowd.hold(activeId,time+90);
    speech=speech.filter(s=>s.id!==activeId);speech.unshift({id:activeId,text:exchanges[nearby.role].greeting,until:Infinity,active:true});return true;
  }
  function end(){if(activeId!==null){crowd.hold(activeId,time+2);cooldown.set(activeId,time+20);}activeId=null;speech=speech.filter(s=>!s.active);}
  function choose(index:number){
    if(!enabled||activeId===null||stage!=='greeting')return null;
    const choice=exchanges[crowd.people[activeId].role].choices[index];if(!choice)return null;
    stage='reply';replyUntil=time+5.5;speech=speech.filter(s=>!s.active);speech.unshift({id:activeId,text:choice.reply,until:Infinity,active:true});return choice.destination??null;
  }
  function update(now:number,viewer:StreetPoint,vehicles:TrafficMarker[],canTalk:boolean,show:boolean){
    time=now;enabled=canTalk&&show;if(activeId!==null&&time>=replyUntil)end();
    nearby=enabled?crowd.people.filter(n=>distanceBetween(n,viewer)<6&&hasStreetSight(viewer,n,vehicles)).sort((a,b)=>distanceBetween(a,viewer)-distanceBetween(b,viewer))[0]??null:null;
    if(activeId!==null&&(!canTalk||distanceBetween(viewer,crowd.people[activeId])>8))end();
    speech=speech.filter(s=>s.until>now);
    if(ambientEnabled&&show&&activeId===null&&time>=nextAmbient){
      nextAmbient=time+7.2;
      const candidates=crowd.people.filter(n=>n.id!==activeId&&distanceBetween(n,viewer)<25&&distanceBetween(n,viewer)>2&&(cooldown.get(n.id)??0)<now&&hasStreetSight(viewer,n,vehicles)).sort((a,b)=>distanceBetween(a,viewer)-distanceBetween(b,viewer));
      const chosen=candidates.slice(0,1);
      for(const [index,n] of chosen.entries()){
        const lines=ambient[n.role],line=lines[(Math.floor(time/9)+n.id)%lines.length];
        speech=speech.filter(s=>s.id!==n.id);speech.push({id:n.id,text:line,until:time+5.8-index*.8,active:false});cooldown.set(n.id,time+16);if(n.group>=0)crowd.hold(n.id,time+6);
      }
    }
  }
  return{begin,end,choose,update,setAmbient(value:boolean){ambientEnabled=value;if(!value)speech=speech.filter(s=>s.active);},get activeId(){return activeId;},
    state(){const person=activeId===null?null:crowd.people[activeId];return{activeId,stage,ambientEnabled,role:person?roleNames[person.role]:'',nearby:nearby?{id:nearby.id,role:roleNames[nearby.role],distance:nearby.distance}:null,choices:person&&stage==='greeting'?exchanges[person.role].choices.map(c=>c.label):[],speech:speech.slice(0,3)};},
    reset(){speech=[];activeId=null;stage='greeting';replyUntil=Infinity;time=0;enabled=false;nearby=null;nextAmbient=0;cooldown.clear();}
  };
}
