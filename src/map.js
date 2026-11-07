import { resolveBattle } from './battle.js';
const params=new URLSearchParams(location.search);
const troopIds=['infantry','spearman','archer','cavalry','knight'];
const names={infantry:'Piyada',spearman:'Nizəçi',archer:'Oxçu',cavalry:'Süvari',knight:'Cəngavər'};
let storedArmy={};try{storedArmy=JSON.parse(localStorage.getItem('taxt-ve-qilinc-city-v1')||'{}').army||{}}catch{}const army=Object.fromEntries(troopIds.map(k=>[k,Math.max(0,Math.min(9999,Math.floor(Number(params.has(k)?params.get(k):(storedArmy[k]||0))||0)))]));
const total=Object.values(army).reduce((a,b)=>a+b,0);
const stats=document.querySelector('#armyStats');
stats.innerHTML=troopIds.filter(k=>army[k]>0).map(k=>'<span>'+names[k]+': '+army[k]+'</span>').join('')||'<span>Ordu məlumatı yoxdur</span>';
const caravanKey='tvq_caravans_v1';
let caravans={};
try{caravans=JSON.parse(localStorage.getItem(caravanKey)||'{}')}catch{caravans={}}
function settleCaravan(id){
 const trip=caravans[id];if(!trip||trip.status!=='traveling'||Date.now()<trip.arrivesAt)return false;
 const target=territories.find(x=>x.id===id);if(!target)return false;
 let ownership={};try{ownership=JSON.parse(localStorage.getItem(territoryKey)||'{}')}catch{}
 if(!ownership[id]?.captured){
  caravans[id]={status:'intercepted',sentAt:trip.sentAt,arrivesAt:trip.arrivesAt,lossReason:'territory-lost'};
  try{localStorage.setItem(caravanKey,JSON.stringify(caravans))}catch{}
  return true;
 }
 const reward={wood:target.wood*2,stone:target.stone*2,gold:target.gold*2};
 let city={};try{city=JSON.parse(localStorage.getItem('taxt-ve-qilinc-city-v1')||'{}')}catch{}
 city.resources=city.resources||{wood:1200,stone:1000,gold:500};
 for(const key of Object.keys(reward))city.resources[key]=(Number(city.resources[key])||0)+reward[key];
 try{localStorage.setItem('taxt-ve-qilinc-city-v1',JSON.stringify(city))}catch{}
 caravans[id]={status:'returned',sentAt:trip.sentAt,arrivesAt:trip.arrivesAt,reward};
 try{localStorage.setItem(caravanKey,JSON.stringify(caravans))}catch{}
 return true;
}
const territoryKey='tvq_territory_v1';
let territory={};
try{territory=JSON.parse(localStorage.getItem(territoryKey)||'{}')}catch{}
const territories=[
 {id:'village',name:'Sərhəd kəndi',kind:'village',wood:18,stone:4,gold:2},
 {id:'mine',name:'Dəmir mədəni',kind:'mine',wood:4,stone:18,gold:5}
];
for(const id of ['village','mine'])settleCaravan(id);
function showOutpostControls(id){
 const target=territories.find(x=>x.id===id);if(!target)return;
 let panel=document.querySelector('#outpostControls');
 if(!panel){panel=document.createElement('div');panel.id='outpostControls';panel.style.cssText='margin-top:12px;padding:12px;border:1px solid #756448;border-radius:9px;background:#1d2b25';document.querySelector('.panel').append(panel)}
 const owned=!!territory[id]?.captured;
 const now=Date.now(),last=Number(territory[id]?.lastCollectedAt||now);
 const hours=Math.min(24,Math.max(0,(now-last)/3600000));
 const gain={wood:Math.floor(hours*target.wood),stone:Math.floor(hours*target.stone),gold:Math.floor(hours*target.gold)};
 const guard=territory[id]?.garrison||{infantry:0,spearman:0,archer:0,cavalry:0,knight:0};
 const guardTotal=Object.values(guard).reduce((a,n)=>a+(Number(n)||0),0);
 panel.innerHTML='<b>'+target.name+'</b><p>'+(owned?'Sənin nəzarətindədir. Toplanmamış gəlir: '+gain.wood+' odun, '+gain.stone+' daş, '+gain.gold+' qızıl.':'Məntəqə düşmən tərəfindən qorunur. Ələ keçirmək üçün döyüşdə qalib gəl.')+'</p><div class="stats"><span>🪵 '+target.wood+'/saat</span><span>🪨 '+target.stone+'/saat</span><span>🪙 '+target.gold+'/saat</span></div>'+(owned?'<p>🛡️ Qarnizon: '+guardTotal+'</p><button id="collectOutpost">Gəliri topla</button><button id="sendCaravan" style="margin:8px 0">🚚 Ticarət karvanı göndər · 10 qızıl</button><div id="caravanStatus" style="font-size:12px;margin:6px 0"></div><button id="enemyRaid" style="margin:8px 0">⚔ Düşmən basqınını sına</button><div style="margin-top:10px"><label>Piyada <input id="ogInf" type="number" min="0" max="'+army.infantry+'" value="0"></label><label>Nizəçi <input id="ogSp" type="number" min="0" max="'+army.spearman+'" value="0"></label><label>Oxçu <input id="ogAr" type="number" min="0" max="'+army.archer+'" value="0"></label><label>Süvari <input id="ogCa" type="number" min="0" max="'+army.cavalry+'" value="0"></label><label>Cəngavər <input id="ogKn" type="number" min="0" max="'+army.knight+'" value="0"></label><button id="assignOutpostGuard">Qarnizon yerləşdir</button></div>':'<button id="captureOutpost">Məntəqəni ələ keçir</button>');
 if(!owned){
  panel.querySelector('#captureOutpost').addEventListener('click',()=>{
   if(total===0){panel.querySelector('p').textContent='Məntəqəni ələ keçirmək üçün ordun olmalıdır.';return;}
   const defenders=id==='mine'
    ?{infantry:24,spearman:18,archer:20,cavalry:8,knight:0}
    :{infantry:30,spearman:12,archer:14,cavalry:5,knight:0};
   const battle=resolveBattle({attacker:army,defender:defenders,direction:'south',tactic:'balanced',terrain:id==='mine'?'hill':'forest',seed:Date.now()%100000});
   const surviving=battle.remaining.attacker;
   for(const k of troopIds)army[k]=surviving[k]||0;
   let city={};try{city=JSON.parse(localStorage.getItem('taxt-ve-qilinc-city-v1')||'{}')}catch{}
   city.army={...army};
   try{localStorage.setItem('taxt-ve-qilinc-city-v1',JSON.stringify(city))}catch{}
   if(battle.winner!=='attacker'){
    panel.querySelector('p').textContent='Hücum uğursuz oldu. İtki: '+Object.values(battle.losses.attacker).reduce((a,n)=>a+n,0)+' əsgər. Məntəqə düşməndə qaldı.';
    stats.innerHTML=troopIds.filter(k=>army[k]>0).map(k=>'<span>'+names[k]+': '+army[k]+'</span>').join('')||'<span>Səyyar ordu qalmayıb</span>';
    return;
   }
   territory[id]={captured:true,lastCollectedAt:Date.now(),garrison:{infantry:0,spearman:0,archer:0,cavalry:0,knight:0},lastBattle:{winner:battle.winner,losses:battle.losses,at:Date.now()}};
   try{localStorage.setItem(territoryKey,JSON.stringify(territory))}catch{}
   const el=document.querySelector('[data-id="'+id+'"]');if(el){el.querySelector('span').textContent='🏳 '+target.name;el.querySelector('small').textContent='Sənin nəzarətində'}
   stats.innerHTML=troopIds.filter(k=>army[k]>0).map(k=>'<span>'+names[k]+': '+army[k]+'</span>').join('')||'<span>Səyyar ordu qalmayıb</span>';
   showOutpostControls(id);
  });
  return;
 }
 const caravanButton=panel.querySelector('#sendCaravan');
 const caravanStatus=panel.querySelector('#caravanStatus');
 const activeTrip=caravans[id];
 if(activeTrip?.status==='traveling'){
  caravanStatus.textContent='Karvan yoldadır. Qayıdış: '+Math.max(0,Math.ceil((activeTrip.arrivesAt-Date.now())/1000))+' saniyə.';
  caravanButton.disabled=true;
 }else if(activeTrip?.status==='returned'){
  caravanStatus.textContent='Son karvan qayıtdı: '+activeTrip.reward.wood+' odun, '+activeTrip.reward.stone+' daş, '+activeTrip.reward.gold+' qızıl.';
 }else if(activeTrip?.status==='intercepted'){
  caravanStatus.textContent='Karvan ələ keçirildi: məntəqə səfər zamanı düşmənə keçdi.';
 }
 caravanButton.addEventListener('click',()=>{
  if(!territory[id]?.captured){caravanStatus.textContent='Karvan üçün məntəqə sənin nəzarətində olmalıdır.';return;}
  if(caravans[id]?.status==='traveling'&&Date.now()<caravans[id].arrivesAt){caravanStatus.textContent='Bu məntəqədən artıq karvan yoldadır.';return;}
  let city={};try{city=JSON.parse(localStorage.getItem('taxt-ve-qilinc-city-v1')||'{}')}catch{}
  city.resources=city.resources||{wood:1200,stone:1000,gold:500};
  if((Number(city.resources.gold)||0)<10){caravanStatus.textContent='Karvan üçün 10 qızıl lazımdır.';return;}
  city.resources.gold-=10;
  try{localStorage.setItem('taxt-ve-qilinc-city-v1',JSON.stringify(city))}catch{}
  const sentAt=Date.now(),arrivesAt=sentAt+60000;
  caravans[id]={status:'traveling',sentAt,arrivesAt};
  try{localStorage.setItem(caravanKey,JSON.stringify(caravans))}catch{}
  caravanButton.disabled=true;
  caravanStatus.textContent='🚚 Karvan yola düşdü. Təxmini qayıdış: 60 saniyə.';
  const timer=setInterval(()=>{
   if(settleCaravan(id)){
    clearInterval(timer);
    const trip=caravans[id];
    if(trip.status==='returned')caravanStatus.textContent='Karvan qayıtdı: '+trip.reward.wood+' odun, '+trip.reward.stone+' daş, '+trip.reward.gold+' qızıl.';
    else caravanStatus.textContent='Karvan ələ keçirildi: məntəqə səfər zamanı düşmənə keçdi.';
    caravanButton.disabled=false;
   }else if(Date.now()>=arrivesAt)clearInterval(timer);
   else caravanStatus.textContent='🚚 Karvan yoldadır. Qayıdış: '+Math.ceil((arrivesAt-Date.now())/1000)+' saniyə.';
  },1000);
 });
 panel.querySelector('#enemyRaid').addEventListener('click',()=>{
  const raider={infantry:35,spearman:20,archer:25,cavalry:15,knight:5};
  if(guardTotal===0){territory[id].captured=false;try{localStorage.setItem(territoryKey,JSON.stringify(territory))}catch{};panel.querySelector('p').textContent='Qarnizon olmadığı üçün düşmən məntəqəni ələ keçirdi!';return}
  const battle=resolveBattle({attacker:raider,defender:guard,direction:'south',tactic:'balanced',terrain:'forest',seed:Date.now()%100000});
  territory[id].garrison=battle.remaining.defender;
  territory[id].lastRaidAt=Date.now();
  if(battle.winner==='attacker')territory[id].captured=false;
  try{localStorage.setItem(territoryKey,JSON.stringify(territory))}catch{}
  panel.querySelector('p').textContent=(battle.winner==='defender'?'Müdafiə uğurludur! ':'Düşmən məntəqəni ələ keçirdi. ')+ 'Qarnizon: '+Object.values(battle.remaining.defender).reduce((a,n)=>a+n,0)+' · Hücumçu itkisi: '+Object.values(battle.losses.attacker).reduce((a,n)=>a+n,0);
  const place=document.querySelector('[data-id="'+id+'"]');if(place){place.querySelector('small').textContent=territory[id].captured?'Sənin nəzarətində':'Düşmən nəzarətində'}
  showOutpostControls(id);
 });
 panel.querySelector('#collectOutpost').addEventListener('click',()=>{
  let city={};try{city=JSON.parse(localStorage.getItem('taxt-ve-qilinc-city-v1')||'{}')}catch{}
  city.resources=city.resources||{wood:1200,stone:1000,gold:500};
  for(const key of ['wood','stone','gold'])city.resources[key]=Math.max(0,Number(city.resources[key])||0)+gain[key];
  try{localStorage.setItem('taxt-ve-qilinc-city-v1',JSON.stringify(city))}catch{}
  territory[id].lastCollectedAt=Date.now();try{localStorage.setItem(territoryKey,JSON.stringify(territory))}catch{}
  showOutpostControls(id);
 });
 panel.querySelector('#assignOutpostGuard').addEventListener('click',()=>{
  const keys=['infantry','spearman','archer','cavalry','knight'],ids=['ogInf','ogSp','ogAr','ogCa','ogKn'];
  const chosen=Object.fromEntries(keys.map((k,i)=>[k,Math.max(0,Math.min(army[k],Math.floor(Number(panel.querySelector('#'+ids[i]).value)||0)))]));
  if(Object.values(chosen).every(n=>n===0)){panel.querySelector('p').textContent='Qarnizona yerləşdirmək üçün əsgər seç.';return}
  for(const k of keys){army[k]-=chosen[k];guard[k]=(Number(guard[k])||0)+chosen[k]}
  territory[id].garrison=guard;
  try{localStorage.setItem(territoryKey,JSON.stringify(territory));const city=JSON.parse(localStorage.getItem('taxt-ve-qilinc-city-v1')||'{}');city.army={...army};localStorage.setItem('taxt-ve-qilinc-city-v1',JSON.stringify(city))}catch{}
  stats.innerHTML=keys.filter(k=>army[k]>0).map(k=>'<span>'+names[k]+': '+army[k]+'</span>').join('')||'<span>Səyyar ordu qalmayıb</span>';
  showOutpostControls(id);
 });
}
const targets={
capital:{title:'Paytaxt',description:'Bu sənin əsas qaləndir. Buradan ordunu və resurslarını idarə et.',enemy:false},
village:{title:'Sərhəd kəndi',description:'Kənddə kəşfiyyat və gələcək resurs tapşırıqları üçün məntəqə seçildi.',enemy:false},
forest:{title:'Qaranlıq meşə',description:'Meşə kəşfiyyat üçün uyğundur. Bu prototipdə döyüş hədəfi deyil.',enemy:false},
mine:{title:'Dəmir mədəni',description:'Mədən resurs məntəqəsidir. Gələcək mərhələdə ələ keçirmə mexanikası əlavə olunacaq.',enemy:false},
enemy:{title:'Qırmızı Qala — Düşmən',description:'Düşmən qarnizonu: 300 əsgər. Bu, sınaq döyüşüdür; nəticələr hələ serverdə qorunmur.',enemy:true}
};
let selected=null;
let fortressState={};
const worldKey='tvq_world_state_v1';
let worldState={};
try{worldState=JSON.parse(localStorage.getItem(worldKey)||'{}');fortressState=worldState.redFortress||{}}catch{worldState={};fortressState={}}
function saveWorld(){try{localStorage.setItem(worldKey,JSON.stringify(worldState))}catch{}}
function showTerritoryEconomy(){
 const panel=document.querySelector('.panel');
 let section=document.querySelector('#territoryEconomy');
 if(!section){section=document.createElement('div');section.id='territoryEconomy';section.style.cssText='margin-top:12px;padding:12px;border:1px solid #756448;border-radius:9px;background:#1d2b25';panel.append(section)}
 const now=Date.now();const last=Number(fortressState.lastCollectedAt||now);const hours=Math.min(24,Math.max(0,(now-last)/3600000));
 const gain={wood:Math.floor(hours*20),stone:Math.floor(hours*15),gold:Math.floor(hours*5)};
 section.innerHTML='<b>🏰 İdarə olunan ərazi</b><p>Qırmızı Qala hər saat +20 odun, +15 daş və +5 qızıl istehsal edir. Toplanmamış gəlir maksimum 24 saat saxlanılır.</p><div class="stats"><span>🪵 '+gain.wood+' odun</span><span>🪨 '+gain.stone+' daş</span><span>🪙 '+gain.gold+' qızıl</span></div><button id="collectIncome" style="margin-top:10px">Gəliri topla</button>';
 section.querySelector('#collectIncome').addEventListener('click',()=>{
  if(!fortressState.captured)return;
  let city={};try{city=JSON.parse(localStorage.getItem('taxt-ve-qilinc-city-v1')||'{}')}catch{}
  city.resources=city.resources||{wood:1200,stone:1000,gold:500};
  for(const key of ['wood','stone','gold'])city.resources[key]=Math.max(0,Number(city.resources[key])||0)+gain[key];
  try{localStorage.setItem('taxt-ve-qilinc-city-v1',JSON.stringify(city))}catch{}
  fortressState.lastCollectedAt=now;worldState.redFortress=fortressState;saveWorld();
  section.innerHTML='<b>Gəlir toplandı!</b><p>'+gain.wood+' odun, '+gain.stone+' daş və '+gain.gold+' qızıl şəhərin yaddaşına əlavə edildi. Şəhərə qayıdıb resurs panelini yenilə.</p>';
 });
}
function showGarrisonControls(){
 const panel=document.querySelector('.panel');
 let section=document.querySelector('#garrisonControls');
 if(!section){section=document.createElement('div');section.id='garrisonControls';section.style.cssText='margin-top:12px;padding:10px;border:1px solid #756448;border-radius:9px;background:#1d2b25';panel.append(section)}
 const garrison=fortressState.garrison||{infantry:0,spearman:0,archer:0,cavalry:0,knight:0};
 const totalGarrison=Object.values(garrison).reduce((a,n)=>a+n,0);
 section.innerHTML='<b>Qala qarnizonu: '+totalGarrison+' əsgər</b><p>Qalanı müdafiə etmək üçün ordudan əsgər ayır.</p><label style="display:block;font-size:12px;margin:7px 0">Piyada <input id="gInf" type="number" min="0" max="'+army.infantry+'" value="0"></label><label style="display:block;font-size:12px;margin:7px 0">Nizəçi <input id="gSp" type="number" min="0" max="'+army.spearman+'" value="0"></label><label style="display:block;font-size:12px;margin:7px 0">Oxçu <input id="gAr" type="number" min="0" max="'+army.archer+'" value="0"></label><label style="display:block;font-size:12px;margin:7px 0">Süvari <input id="gCa" type="number" min="0" max="'+army.cavalry+'" value="0"></label><label style="display:block;font-size:12px;margin:7px 0">Cəngavər <input id="gKn" type="number" min="0" max="'+army.knight+'" value="0"></label><button id="assignGarrison">Qarnizonu yerləşdir</button><button id="raidFortress" style="margin:8px 0">⚔ Düşmən basqınını sına</button>';
 section.querySelector('#raidFortress').addEventListener('click',()=>{
  const raider={infantry:35,spearman:20,archer:25,cavalry:15,knight:5};
  if(totalGarrison===0){
   fortressState.captured=false;
   fortressState.garrison={infantry:0,spearman:0,archer:0,cavalry:0,knight:0};
   worldState.redFortress=fortressState;saveWorld();
   const enemy=document.querySelector('[data-id="enemy"]');
   enemy.classList.remove('owned');
   enemy.querySelector('span').textContent='🛡 Düşmən qalası';
   enemy.querySelector('small').textContent='Düşmən nəzarətində';
   targets.enemy.title='Qırmızı Qala — Düşmən';
   targets.enemy.description='Düşmən qarnizonu: 300 əsgər. Qalanı yenidən fəth etmək üçün ordu göndər.';
   targets.enemy.enemy=true;
   section.querySelector('p').textContent='Qarnizon olmadığı üçün düşmən qalanı ələ keçirdi.';
   marchButton.disabled=true;
   return;
  }
  const battle=resolveBattle({attacker:raider,defender:garrison,direction:'south',tactic:'balanced',defenderTactic:(fortressState.defensePlan?.tactic||'balanced'),terrain:'fortress',seed:Date.now()%100000});
  fortressState.garrison=battle.remaining.defender;
  fortressState.lastRaidAt=Date.now();
  if(battle.winner==='attacker')fortressState.captured=false;
  worldState.redFortress=fortressState;saveWorld();
  const enemy=document.querySelector('[data-id="enemy"]');
  if(!fortressState.captured){
   enemy.classList.remove('owned');
   enemy.querySelector('span').textContent='🛡 Düşmən qalası';
   enemy.querySelector('small').textContent='Düşmən nəzarətində';
   targets.enemy.title='Qırmızı Qala — Düşmən';
   targets.enemy.description='Düşmən qarnizonu: 300 əsgər. Qalanı yenidən fəth etmək üçün ordu göndər.';
   targets.enemy.enemy=true;
  }
  section.querySelector('p').textContent=(battle.winner==='defender'?'Müdafiə uğurludur! ':'Düşmən qalanı ələ keçirdi. ')+'Qarnizonda sağ qalan: '+Object.values(battle.remaining.defender).reduce((a,n)=>a+n,0)+' · Hücumçu itkisi: '+Object.values(battle.losses.attacker).reduce((a,n)=>a+n,0);
  if(!fortressState.captured)marchButton.disabled=true;
 });
 section.querySelector('#assignGarrison').addEventListener('click',()=>{
  const keys=['infantry','spearman','archer','cavalry','knight'],ids=['gInf','gSp','gAr','gCa','gKn'];
  const additions=Object.fromEntries(keys.map((k,i)=>[k,Math.max(0,Math.min(army[k],Math.floor(Number(section.querySelector('#'+ids[i]).value)||0)))]));
  if(Object.values(additions).every(n=>n===0)){section.querySelector('p').textContent='Yerləşdirmək üçün ən azı bir əsgər seç.';return}
  for(const k of keys){army[k]-=additions[k];garrison[k]=(garrison[k]||0)+additions[k]}
  fortressState.garrison=garrison;worldState.redFortress=fortressState;saveWorld();try{const cityKey='taxt-ve-qilinc-city-v1';const city=JSON.parse(localStorage.getItem(cityKey)||'{}');city.army={...army};localStorage.setItem(cityKey,JSON.stringify(city));}catch{}
  section.querySelector('b').textContent='Qala qarnizonu: '+Object.values(garrison).reduce((a,n)=>a+n,0)+' əsgər';
  section.querySelector('p').textContent='Qarnizon saxlanıldı. Şəhər ordusundan ayrılan qoşunlar yeniləndi.';
  stats.innerHTML=keys.filter(k=>army[k]>0).map(k=>'<span>'+names[k]+': '+army[k]+'</span>').join('')||'<span>Səyyar ordu qalmayıb</span>';
 });
}
try{fortressState=JSON.parse(localStorage.getItem('tvq_world_state_v1')||'{}').redFortress||{}}catch{}
if(fortressState.captured){
 const firstSeen=Number(fortressState.capturedAt||Date.now());
 if(!fortressState.capturedAt){fortressState.capturedAt=firstSeen;worldState.redFortress=fortressState;saveWorld();}
 const raidInterval=6*60*60*1000;
 let nextRaidAt=Number(fortressState.lastRaidAt||firstSeen)+raidInterval;
 let resolvedRaids=0;
 while(fortressState.captured&&Date.now()>=nextRaidAt&&resolvedRaids<8){
  const guard=fortressState.garrison||{infantry:0,spearman:0,archer:0,cavalry:0,knight:0};
  const guardCount=Object.values(guard).reduce((sum,n)=>sum+(Number(n)||0),0);
  if(guardCount>0){
   const raiders={infantry:35,spearman:20,archer:25,cavalry:15,knight:5};
   const raid=resolveBattle({attacker:raiders,defender:guard,direction:'south',tactic:'balanced',defenderTactic:(fortressState.defensePlan?.tactic||'balanced'),terrain:'fortress',seed:Math.floor(nextRaidAt/1000)%100000});
   fortressState.garrison=raid.remaining.defender;
   fortressState.lastRaidResult={winner:raid.winner,attackerLosses:raid.losses.attacker,defenderLosses:raid.losses.defender,at:nextRaidAt};
   if(raid.winner==='attacker')fortressState.captured=false;
  }else{
   fortressState.captured=false;
   fortressState.lastRaidResult={winner:'attacker',reason:'no-garrison',at:nextRaidAt};
  }
  fortressState.lastRaidAt=nextRaidAt;
  nextRaidAt+=raidInterval;
  resolvedRaids++;
 }
 if(resolvedRaids){fortressState.resolvedRaidCount=(Number(fortressState.resolvedRaidCount)||0)+resolvedRaids;worldState.redFortress=fortressState;saveWorld();}
 const enemy=document.querySelector('[data-id="enemy"]');
 enemy.classList.add('owned');
 enemy.querySelector('span').textContent='🏳 Sənin qalən';
 enemy.querySelector('small').textContent='Fəth olunub · Sənin krallığın';
 targets.enemy.title='Qırmızı Qala — Sənin mülkün';
 targets.enemy.description='Qala sənin krallığına məxsusdur. Qarnizon yerləşdirərək onu müdafiə et.';
 targets.enemy.enemy=false;
}else{
 const enemy=document.querySelector('[data-id="enemy"]');
 enemy?.classList.remove('owned');
 if(enemy&&fortressState.lastRaidResult?.at){
  enemy.querySelector('small').textContent='Düşmən nəzarətində — son basqın nəticələndi';
 }
}
function renderRaidAlert(){
 let alert=document.querySelector('#raidAlert');
 if(!fortressState.captured){alert?.remove();return;}
 if(!alert){alert=document.createElement('section');alert.id='raidAlert';alert.style.cssText='margin-top:12px;padding:12px;border:1px solid #a87942;border-radius:10px;background:#35291f;color:#f7dfb0';document.querySelector('.panel').append(alert);}
 const base=Number(fortressState.lastRaidAt||fortressState.capturedAt||Date.now());
 const next=base+6*60*60*1000;
 const left=Math.max(0,next-Date.now());
 const hours=Math.floor(left/3600000),minutes=Math.floor((left%3600000)/60000);
 const plan=fortressState.defensePlan||{tactic:'balanced'};
 const tacticNames={balanced:'Balanslı müdafiə',line:'Sıx müdafiə xətti',volley:'Oxçu yaylımı',wedge:'Süvari pazı'};
 alert.innerHTML='<b>⚠ Qala müdafiəsi</b><p>'+(left===0?'Basqın vaxtı çatıb. Xəritəni yenilədikdə müdafiə döyüşü hesablanacaq.':left<=60*60*1000?'DİQQƏT: düşmən basqını yaxınlaşır!':'Növbəti mümkün basqına qalan vaxt: '+hours+' saat '+minutes+' dəqiqə.')+'</p><small>Qarnizonunu gücləndir. Basqın yalnız xəritə yenidən yüklənəndə hesablanır.</small>';
 let controls=alert.querySelector('#defensePlan');
 if(!controls){
  controls=document.createElement('div');controls.id='defensePlan';controls.style.cssText='margin-top:10px';
  controls.innerHTML='<label for="defenseTactic">Müdafiə taktikası</label><select id="defenseTactic" style="display:block;width:100%;margin:6px 0;padding:10px;border-radius:8px;background:#26342b;color:#fff;border:1px solid #a87942"><option value="balanced">Balanslı müdafiə</option><option value="line">Sıx müdafiə xətti</option><option value="volley">Oxçu yaylımı</option><option value="wedge">Süvari pazı</option></select><small id="planSaved">Müdafiə əmri yadda saxlanılır.</small>';
  alert.append(controls);
  controls.querySelector('#defenseTactic').addEventListener('change',e=>{
   fortressState.defensePlan={...(fortressState.defensePlan||{}),tactic:e.target.value};
   worldState.redFortress=fortressState;saveWorld();
   controls.querySelector('#planSaved').textContent='Müdafiə əmri yadda saxlanıldı: '+tacticNames[e.target.value]+'.';
  });
 }
 controls.querySelector('#defenseTactic').value=plan.tactic||'balanced';
 const scout=document.createElement('div');scout.style.cssText='margin-top:12px;padding-top:10px;border-top:1px solid #80633f';
 const report=fortressState.scoutReport;
 const reportFresh=report&&Date.now()-Number(report.at)<30*60*1000;
 scout.innerHTML='<b>🔭 Kəşfiyyat</b><p>'+(reportFresh?'Son hesabat · '+Math.ceil((30*60*1000-(Date.now()-report.at))/60000)+' dəqiqə qüvvədədir.':'Düşmən qarnizonunun tərkibini öyrənmək üçün kəşfiyyatçı göndər.')+'</p><button id="sendScout" type="button">Kəşfiyyat göndər · 10 qızıl</button>'+(reportFresh?'<div style="margin-top:8px">Düşmən qüvvələri: piyada 35 · nizəçi 20 · oxçu 25 · süvari 15 · cəngavər 5<br>Ümumi: 100 əsgər<br>Qala divarları: möhkəmləndirilmiş</div>':'');
 scout.querySelector('#sendScout').addEventListener('click',()=>{
  let city={};try{city=JSON.parse(localStorage.getItem('taxt-ve-qilinc-city-v1')||'{}')}catch{}
  city.resources=city.resources||{wood:1200,stone:1000,gold:500};
  const gold=Math.max(0,Number(city.resources.gold)||0);
  if(gold<10){scout.querySelector('p').textContent='Kəşfiyyat üçün 10 qızıl lazımdır. Mövcud qızıl: '+gold+'.';return;}
  city.resources.gold=gold-10;
  try{localStorage.setItem('taxt-ve-qilinc-city-v1',JSON.stringify(city))}catch{}
  fortressState.scoutReport={at:Date.now(),enemy:{infantry:35,spearman:20,archer:25,cavalry:15,knight:5},fortified:true};
  worldState.redFortress=fortressState;saveWorld();
  renderRaidAlert();
 });
 alert.append(scout);
}
renderRaidAlert();
setInterval(renderRaidAlert,60000);
const raidMarker=document.createElement('div');
raidMarker.id='enemyRaidMarker';
raidMarker.textContent='⚔️ 100';
raidMarker.title='Düşmən basqın dəstəsi';
raidMarker.style.cssText='display:none;position:absolute;z-index:5;left:88%;top:82%;transform:translate(-50%,-50%);padding:7px 9px;border:1px solid #f0b1a0;border-radius:9px;background:#6b2925;color:#fff;font-weight:800;font-size:12px;box-shadow:0 2px 12px #0009;pointer-events:none';
const raidStyle=document.createElement('style');
raidStyle.textContent='@keyframes enemyApproach{0%{left:88%;top:82%}100%{left:76%;top:70%}}#enemyRaidMarker.approaching{display:block;animation:enemyApproach 18s ease-in-out infinite alternate}';
document.head.append(raidStyle);
document.querySelector('#map').append(raidMarker);
function renderEnemyApproach(){
 if(!fortressState.captured){raidMarker.classList.remove('approaching');raidMarker.style.display='none';return;}
 const base=Number(fortressState.lastRaidAt||fortressState.capturedAt||Date.now());
 const left=base+6*60*60*1000-Date.now();
 if(left<=60*60*1000){raidMarker.classList.add('approaching');raidMarker.style.display='block';}
 else{raidMarker.classList.remove('approaching');raidMarker.style.display='none';}
}
renderEnemyApproach();
setInterval(renderEnemyApproach,60000);

for(const id of ['village','mine']){if(territory[id]?.captured){const el=document.querySelector('[data-id="'+id+'"]');if(el){el.querySelector('span').textContent='🏳 '+territories.find(t=>t.id===id).name;el.querySelector('small').textContent='Sənin nəzarətində';}}}
const journeyKey='tvq_active_journey_v1';
const marchButton=document.querySelector('#march');
if(fortressState.captured){marchButton.disabled=true;marchButton.textContent='🏳 Qala fəth olunub';}
let journey=null;
try{journey=JSON.parse(localStorage.getItem(journeyKey)||'null')}catch{journey=null}
const dot=document.createElement('div');dot.className='march-dot';dot.textContent='⚔';document.querySelector('#map').append(dot);
function renderJourney(){if(!journey)return;const left=journey.arrivesAt-Date.now();document.querySelector('#path').style.display='block';dot.style.display='block';marchButton.disabled=left>0;if(left>0){marchButton.textContent='Yürüş davam edir';document.querySelector('#description').textContent='Ordu Qırmızı Qalaya doğru irəliləyir. Qalan vaxt: '+Math.ceil(left/1000)+' saniyə.';}else{marchButton.textContent='⚔ Döyüşə keç';document.querySelector('#description').textContent='Ordu düşmən qalasına çatdı. Döyüşə başlaya bilərsən.';}}
if(journey&&journey.target==='red-fortress')renderJourney();else dot.style.display='none';
document.querySelectorAll('.place').forEach(el=>el.addEventListener('click',()=>{
 document.querySelectorAll('.place').forEach(x=>x.classList.remove('selected'));
 el.classList.add('selected');selected=targets[el.dataset.id];
 document.querySelector('#targetTitle').textContent=selected.title;
 document.querySelector('#description').textContent=selected.description;
 marchButton.disabled=!selected.enemy||total===0;
 document.querySelector('#path').style.display='block';
 if(el.dataset.id==='enemy'&&fortressState.captured){showGarrisonControls();showTerritoryEconomy();}
 else document.querySelector('#garrisonControls')?.remove();
 if(el.dataset.id==='enemy'){
  let prep=document.querySelector('#attackPreparation');
  if(!prep){prep=document.createElement('div');prep.id='attackPreparation';prep.style.cssText='margin-top:12px;padding:12px;border:1px solid #8b7048;border-radius:10px;background:#202d29';document.querySelector('.panel').append(prep);}
  let plan={direction:'south',tactic:'balanced',ram:1,catapult:1};try{plan={...plan,...JSON.parse(localStorage.getItem('tvq_attack_plan_v1')||'{}')}}catch{}
  prep.innerHTML='<b>⚔ Hücum hazırlığı</b><p>Yürüşə başlamazdan əvvəl istiqaməti, taktikanı və mühasirə qurğularını seç.</p><label>Hücum istiqaməti<select id="attackDirection"><option value="south">Cənub</option><option value="north">Şimal</option><option value="east">Şərq</option><option value="west">Qərb</option></select></label><label style="display:block;margin-top:8px">Taktika<select id="attackTactic"><option value="balanced">Balanslı</option><option value="line">Piyada xətti</option><option value="volley">Oxçu yaylımı</option><option value="wedge">Süvari pazı</option></select></label><div style="display:flex;gap:10px;margin-top:8px"><label>Qoçbaşı <input id="attackRam" type="number" min="0" max="20" value="1" style="width:65px"></label><label>Katapult <input id="attackCatapult" type="number" min="0" max="20" value="1" style="width:65px"></label></div><small id="attackPlanSaved">Əmrlər bu telefonda saxlanılır.</small>';
  prep.querySelector('#attackDirection').value=plan.direction;prep.querySelector('#attackTactic').value=plan.tactic;prep.querySelector('#attackRam').value=plan.ram;prep.querySelector('#attackCatapult').value=plan.catapult;
  const savePlan=()=>{const next={direction:prep.querySelector('#attackDirection').value,tactic:prep.querySelector('#attackTactic').value,ram:Math.max(0,Math.min(20,Math.floor(Number(prep.querySelector('#attackRam').value)||0))),catapult:Math.max(0,Math.min(20,Math.floor(Number(prep.querySelector('#attackCatapult').value)||0)))};try{localStorage.setItem('tvq_attack_plan_v1',JSON.stringify(next))}catch{};prep.querySelector('#attackPlanSaved').textContent='Hücum əmrləri yadda saxlanıldı.'};
  prep.querySelectorAll('select,input').forEach(x=>x.addEventListener('change',savePlan));
 }else document.querySelector('#attackPreparation')?.remove();
 if(el.dataset.id==='village'||el.dataset.id==='mine')showOutpostControls(el.dataset.id);else document.querySelector('#outpostControls')?.remove();
}));
marchButton.addEventListener('click',()=>{
 if(journey&&journey.target==='red-fortress'&&Date.now()>=journey.arrivesAt){const next=new URLSearchParams(params);let plan={};try{plan=JSON.parse(localStorage.getItem('tvq_attack_plan_v1')||'{}')}catch{};next.set('target','red-fortress');next.set('garrison','300');next.set('direction',plan.direction||'south');next.set('tactic',plan.tactic||'balanced');next.set('ram',String(plan.ram??1));next.set('catapult',String(plan.catapult??1));location.href='./battle.html?'+next.toString();return;}
 if(!selected?.enemy||!total||journey)return;
 const duration=Math.max(30000,Math.round(180000/Math.sqrt(total)));
 journey={target:'red-fortress',startedAt:Date.now(),arrivesAt:Date.now()+duration,army};
 try{localStorage.setItem(journeyKey,JSON.stringify(journey));}catch{}
 renderJourney();
});
if(journey){setInterval(renderJourney,1000);}

if(!total)document.querySelector('#description').textContent='Şəhərdə əvvəlcə qoşun hazırla. Sonra xəritəyə qayıdıb yürüşə başla.';
