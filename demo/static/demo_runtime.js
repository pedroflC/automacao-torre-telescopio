"use strict";
// Public Pages demo. All state lives in this browser tab; no network or hardware API.
// Approximate Gaia location for the public illustration; not site coordinates.
const observatory = {latitude:41.1, longitude:-8.6};
const objects = [
  ["M31 · Andrômeda","Galáxia","Andrómeda",3.4,0+42/60+44/3600,41+16/60+8/3600,"Messier / NGC 224","00h 42m 44s","+41° 16′ 08″"],
  ["M42 · Órion","Nebulosa","Órion",4,5+35/60+17/3600,-(5+23/60+15/3600),"Messier / NGC 1976","05h 35m 17s","−05° 23′ 15″"],
  ["M45 · Plêiades","Aglomerado","Touro",1.6,3+46/60+24/3600,24+6/60+50/3600,"Messier","03h 46m 24s","+24° 06′ 50″"],
  ["NGC 7000","Nebulosa","Cisne",4,20+58/60+47/3600,44+19/60+48/3600,"NGC","20h 58m 47s","+44° 19′ 48″"],
  ["IC 1396","Nebulosa","Cefeu",3.5,21+38/60+59/3600,57+30/60+50/3600,"IC","21h 38m 59s","+57° 30′ 50″"],
  ["Vega","Estrela","Lira",0,18+36/60+56/3600,38+47/60+1/3600,"Estrela","18h 36m 56s","+38° 47′ 01″"],
  ["Sírio","Estrela","Cão Maior",-1.5,6+45/60+9/3600,-(16+42/60+58/3600),"Estrela","06h 45m 09s","−16° 42′ 58″"],
  ["Júpiter","Planeta",null,null,null,null,"Sistema Solar",null,null],
  ["Saturno","Planeta",null,null,null,null,"Sistema Solar",null,null],
  ["Lua","Lua",null,null,null,null,"Sistema Solar",null,null],
  ["Sol","Estrela",null,-26.7,null,null,"Sistema Solar",null,null,true],
  ["M13 · Hércules","Aglomerado","Hércules",5.8,16+41/60+42/3600,36+27/60+41/3600,"Messier / NGC 6205","16h 41m 42s","+36° 27′ 41″"],
  ["Deneb","Estrela","Cisne",1.3,20+41/60+26/3600,45+16/60+49/3600,"Estrela","20h 41m 26s","+45° 16′ 49″"],
  ["Vénus","Planeta",null,null,null,null,"Sistema Solar",null,null],
  ["Marte","Planeta",null,null,null,null,"Sistema Solar",null,null]
].map(([name,kind,constellation,magnitude,raHours,decDegrees,catalogue,ra,dec,blocked=false])=>({name,kind,constellation,magnitude,raHours,decDegrees,catalogue,ra,dec,alt:null,az:null,visibility:"UNKNOWN",blocked}));
const demo = {
  source:"SIMULADO",
  dome:{encoder:152667,direction:"STOPPED",motion:"STOPPED",shutters:"FECHADAS",calibrated:false},
  opta:{connected:true,validated:true,motion:"STOPPED",message:"Controlador virtual · SIMULADO",watchdog_ms:null},
  ble:{connected:true,motion:"STOPPED",lamp:false,owner:true,limit_open:false,limit_closed:true,alarm:"NÃO",stop_confirmed:true,message:"Portadas virtuais · SIMULADO"},
  telescope:{connected:false,connecting:false,status:"DESLIGADO",worker:"SIMULADO",backend:"SIMULADOR LOCAL",manufacturer:null,model:null,protocol:null,firmware:null,mount_type:null,ra:null,dec:null,alt:null,az:null,tracking:null,parked:null,homed:null,aligned:null,last_update:null},
  catalogue:objects,
  messages:["DEMONSTRAÇÃO SIMULADA · sem ligação ao ROCK", "Ações nesta página afetam apenas este navegador"]
};
let virtualTimer=null, shutterTimer=null;
const radians=x=>x*Math.PI/180;
function skyPosition(raHours,decDegrees,at=new Date()){
  if(!Number.isFinite(raHours)||!Number.isFinite(decDegrees)||!Number.isFinite(at.getTime()))return null;
  const jd=at.getTime()/86400000+2440587.5, t=(jd-2451545)/36525;
  const gmst=(280.46061837+360.98564736629*(jd-2451545)+.000387933*t*t-t*t*t/38710000)%360;
  const hour=radians(((gmst+observatory.longitude-raHours*15)%360+540)%360-180);
  const lat=radians(observatory.latitude), dec=radians(decDegrees);
  const altitude=Math.asin(Math.sin(lat)*Math.sin(dec)+Math.cos(lat)*Math.cos(dec)*Math.cos(hour));
  const azimuth=(Math.atan2(-Math.sin(hour),Math.tan(dec)*Math.cos(lat)-Math.sin(lat)*Math.cos(hour))*180/Math.PI+360)%360;
  return {alt:altitude*180/Math.PI,az:azimuth};
}
function refreshSky(){for(const item of objects){const pos=item.raHours==null?null:skyPosition(item.raHours,item.decDegrees);item.alt=pos?.alt??null;item.az=pos?.az??null;item.visibility=pos?(pos.alt>0?"ACIMA DO HORIZONTE":"ABAIXO DO HORIZONTE"):"EFEMÉRIDES INDISPONÍVEIS";}render();}
function render(){update(demo);}
function message(value){demo.messages.unshift(`SIMULADO · ${value}`);demo.messages=demo.messages.slice(0,6);render();}
function stopMotion(){if(virtualTimer){clearInterval(virtualTimer);virtualTimer=null;}if(shutterTimer){clearTimeout(shutterTimer);shutterTimer=null;}demo.dome.motion="STOPPED";demo.dome.direction="STOPPED";demo.opta.motion="STOPPED";if(demo.ble.motion==="FW"||demo.ble.motion==="BW"){demo.ble.motion="STOPPED";demo.ble.limit_open=null;demo.ble.limit_closed=null;demo.dome.shutters="POSIÇÃO DESCONHECIDA";}demo.telescope.slewing=false;}
function rotate(direction,target=null){stopMotion();demo.dome.motion=direction;demo.dome.direction=direction;demo.opta.motion=direction;virtualTimer=setInterval(()=>{demo.dome.encoder+=(direction==="CW"?9:-9);render();if(target!==null&&Math.abs(((demo.dome.encoder/4000*360)%360+360)%360-target)<2){stopMotion();message("Azimute relativo virtual atingido");}},90);message(`Rotação virtual ${direction} iniciada`);}
function shutter(direction){stopMotion();if(!demo.ble.connected){message("BLE virtual desligado");return;}demo.ble.motion=direction==="ABRIR"?"FW":"BW";demo.ble.limit_open=null;demo.ble.limit_closed=null;demo.dome.shutters=direction==="ABRIR"?"A ABRIR":"A FECHAR";render();shutterTimer=setTimeout(()=>{demo.ble.motion="STOPPED";demo.ble.limit_open=direction==="ABRIR";demo.ble.limit_closed=direction==="FECHAR";demo.dome.shutters=direction==="ABRIR"?"ABERTAS":"FECHADAS";shutterTimer=null;message(`Portadas virtuais ${direction==="ABRIR"?"abertas":"fechadas"}`);},1300);}
function telescopeCommand(label){const t=demo.telescope,target=objects.find(x=>x.name===selected);if(label.includes("SOL")||target?.blocked&&/GOTO|TRACKING|SELECIONAR|CARREGAR|APONTAR/.test(label)){message("Sol bloqueado para observação, GOTO e tracking");return;}
  if(label==="LIGAR TELESCÓPIO"){t.connecting=true;t.status="A LIGAR";render();setTimeout(()=>{t.connecting=false;t.connected=true;t.status="LIGADO · SIMULADO";t.manufacturer="SIMULAÇÃO";t.model="Telescópio virtual";t.protocol="LOCAL";t.mount_type="VIRTUAL";t.last_update=new Date().toISOString();message("Telescópio virtual ligado");},500);return;}
  if(label==="DESLIGAR"){t.connected=false;t.status="DESLIGADO";t.tracking=null;t.ra=t.dec=t.alt=t.az=null;message("Telescópio virtual desligado");return;}
  if(label==="ATUALIZAR ESTADO"){t.last_update=new Date().toISOString();message("Estado virtual atualizado");return;}
  if(label==="SELECIONAR ALVO"||label==="CARREGAR ALVO"){message(`Alvo virtual selecionado: ${target?.name||"nenhum"}`);return;}
  if(label==="GOTO"){if(!t.connected||!target||target.raHours==null){message("GOTO virtual indisponível: ligação ou efemérides em falta");return;}t.slewing=true;message(`GOTO virtual para ${target.name}`);setTimeout(()=>{if(!t.connected||!t.slewing)return;t.slewing=false;t.ra=target.ra;t.dec=target.dec;t.alt=target.alt;t.az=target.az;t.last_update=new Date().toISOString();message(`Apontamento virtual concluído: ${target.name}`);},900);return;}
  if(label.startsWith("STOP TELESCÓPIO")){t.slewing=false;t.tracking=false;message("STOP do telescópio virtual");return;}
  if(label==="TRACKING"){if(!t.connected){message("Ligue primeiro o telescópio virtual");return;}t.tracking=!t.tracking;message(`Tracking virtual ${t.tracking?"ligado":"desligado"}`);return;}
  if(label==="PARK"||label==="HOME"){if(!t.connected){message("Ligue primeiro o telescópio virtual");return;}t.parked=label==="PARK";t.homed=label==="HOME";message(`${label} virtual concluído`);return;}
  message(`${label}: função ilustrativa, sem montagem real definida`);
}
document.addEventListener("click",event=>{
  const command=event.target.closest("[data-demo-command]");if(command){telescopeCommand(command.dataset.demoCommand);return;}
  const action=event.target.closest("[data-demo-action]");if(!action)return;
  const label=action.textContent.trim().replace(/\s+/g," ").toUpperCase();
  if(label.includes("STOP")){stopMotion();message("STOP virtual imediato");return;}
  if(label.includes("CCW")){rotate("CCW");return;}
  if(label.includes("CW")){rotate("CW");return;}
  if(label.includes("ABRIR")){shutter("ABRIR");return;}
  if(label.includes("FECHAR")){shutter("FECHAR");return;}
  if(label.includes("LIGAR BLE")){demo.ble.connected=!demo.ble.connected;if(!demo.ble.connected){stopMotion();demo.ble.lamp=null;demo.ble.owner=null;}else{demo.ble.lamp=false;demo.ble.owner=false;}message(`BLE virtual ${demo.ble.connected?"ligado":"desligado"}`);return;}
  if(label.includes("ADQUIRIR")){demo.ble.owner=true;message("Controlo virtual adquirido");return;}
  if(label==="IR"){rotate("CW",180);return;}
  message(`${label}: controlo virtual ilustrativo`);
});
function lampToggle(){if(!demo.ble.connected){message("Iluminação indisponível: BLE virtual desligado");return;}demo.ble.lamp=!demo.ble.lamp;message(`Iluminação virtual ${demo.ble.lamp?"ligada":"desligada"}`);}
$("room-badge").addEventListener("click",lampToggle);
$("room-badge").addEventListener("keydown",event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();lampToggle();}});
refreshSky();setInterval(refreshSky,60000);
