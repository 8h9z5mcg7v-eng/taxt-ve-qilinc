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
// Recover dispatches whose resource debit was saved before the caravan record.
try{
 const city=JSON.parse(localStorage.getItem('taxt-ve-qilinc-city-v1')||'{}');
 const pending=city.pendingCaravanDispatches||{};
 let changed=false;
 for(const id of Object.keys(pending)){
  const trip=pending[id];
  if(trip&&(!caravans[id]||Number(caravans[id].sentAt)<Number(trip.sentAt))){caravans[id]=trip;changed=true;}
 }
 if(changed){
  localStorage.setItem(caravanKey,JSON.stringify(caravans));
  city.pendingCaravanDispatches={};
  localStorage.setItem('taxt-ve-qilinc-city-v1',JSON.stringify(city));
 }
}catch(error){console.warn('Karvan göndərişi bərpa edilə bilmədi',error)}
function settleCaravan(id){
 const trip=caravans[id];if(!trip||trip.status!=='traveling'||Date.now()<trip.arrivesAt)return false;
 const target=territories.find(x=>x.id===id);if(!target)return false;
 const settlementId=id+':'+String(trip.sentAt);
 let ownership={};try{ownership=JSON.parse(localStorage.getItem(territoryKey)||'{}')}catch{}
 if(!ownership[id]?.captured){
  caravans[id]={status:'intercepted',sentAt:trip.sentAt,arrivesAt:trip.arrivesAt,lossReason:'territory-lost'};
  try{localStorage.setItem(caravanKey,JSON.stringify(caravans))}catch{return false}
  return true;
 }
 let city={};try{city=JSON.parse(localStorage.getItem('taxt-ve-qilinc-city-v1')||'{}')}catch{return false}
 city.resources=city.resources||{wood:1200,stone:1000,gold:500};
 city.army=city.army||{};
 city.caravanSettlements=city.caravanSettlements||{};
 const previous=city.caravanSettlements[settlementId];
 if(previous){
  caravans[id]={...previous,status:'returned',sentAt:trip.sentAt,arrivesAt:trip.arrivesAt};
  try{localStorage.setItem(caravanKey,JSON.stringify(caravans))}catch{return false}
  return true;
 }
 const escort=trip.escort||{infantry:0,spearman:0,archer:0,cavalry:0,knight:0};
 const escortCount=Object.values(escort).reduce((sum,n)=>sum+(Number(n)||0),0);
 const banditRoll=(Math.abs(Math.floor(Number(trip.sentAt)||0)*17+id.length*31)%100);
 let survivors={...escort},banditResult='none',reward={wood:target.wood*2,stone:target.stone*2,gold:target.gold*2};
 if(banditRoll<35){
  const bandits={infantry:12,spearman:8,archer:10,cavalry:5,knight:0};
  const fight=resolveBattle({attacker:escort,defender:bandits,direction:'south',tactic:'balanced',terrain:'forest',seed:banditRoll+Math.floor(trip.sentAt/1000)%100000});
  survivors=fight.remaining.attacker;
  if(fight.winner==='attacker')banditResult='defeated';
  else if(escortCount>0){banditResult='damaged';reward={wood:Math.floor(reward.wood/2),stone:Math.floor(reward.stone/2),gold:Math.floor(reward.gold/2)};}
  else{banditResult='captured';reward={wood:0,stone:0,gold:0};}
 }
 for(const key of troopIds)city.army[key]=(Number(city.army[key])||0)+(Number(survivors[key])||0);
 for(const key of Object.keys(reward))city.resources[key]=(Number(city.resources[key])||0)+reward[key];
 const settlement={reward,escortSurvivors:survivors,banditResult,settledAt:Date.now()};
 city.caravanSettlements[settlementId]=settlement;
 const settlementIds=Object.keys(city.caravanSettlements);
 if(settlementIds.length>30)for(const oldId of settlementIds.slice(0,settlementIds.length-30))delete city.caravanSettlements[oldId];
 try{localStorage.setItem('taxt-ve-qilinc-city-v1',JSON.stringify(city))}catch{return false}
 caravans[id]={status:'returned',sentAt:trip.sentAt,arrivesAt:trip.arrivesAt,...settlement};
 try{localStorage.setItem(caravanKey,JSON.stringify(caravans))}catch{return false}
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
const caravanStyle=document.createElement('style');
caravanStyle.textContent='@keyframes caravanVillage{from{left:22%;top:64%}to{left:70%;top:25%}}@keyframes caravanMine{from{left:22%;top:64%}to{left:50%;top:39%}}.caravan-marker{position:absolute;z-index:4;transform:translate(-50%,-50%);font-size:22px;filter:drop-shadow(0 2px 5px #000);pointer-events:none;animation-timing-function:linear;animation-fill-mode:forwards}';
document.head.append(caravanStyle);
function renderCaravanMarkers(){
 document.querySelectorAll('.caravan-marker').forEach(node=>node.remove());
 for(const id of ['village','mine']){
  const trip=caravans[id];if(!trip||trip.status!=='traveling')continue;
  const remaining=Math.max(0,trip.arrivesAt-Date.now());if(!remaining)continue;
  const marker=document.createElement('div');marker.className='caravan-marker';marker.textContent='🚚';marker.title='Ticarət karvanı yoldadır';
  marker.style.left='22%';marker.style.top='64%';
  marker.style.animationName=id==='village'?'caravanVillage':'caravanMine';
  marker.style.animationDuration=remaining+'ms';
  const elapsed=Math.max(0,Date.now()-trip.sentAt);
  marker.style.animationDelay='-'+elapsed+'ms';
  document.querySelector('#map').append(marker);
 }
}
renderCaravanMarkers();
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
 const raidCooldown=6*60*60*1000;
 const raidRemaining=Math.max(0,raidCooldown-(now-Number(territory[id]?.lastRaidAt||0)));
 panel.innerHTML='<b>'+target.name+'</b><p>'+(owned?'Sənin nəzarətindədir. Toplanmamış gəlir: '+gain.wood+' odun, '+gain.stone+' daş, '+gain.gold+' qızıl.':'Məntəqə düşmən tərəfindən qorunur. Ələ keçirmək üçün döyüşdə qalib gəl.')+'</p><div class="stats"><span>🪵 '+target.wood+'/saat</span><span>🪨 '+target.stone+'/saat</span><span>🪙 '+target.gold+'/saat</span></div>'+(owned?'<p>🛡️ Qarnizon: '+guardTotal+'</p><button id="collectOutpost">Gəliri topla</button><label style="display:block;margin:8px 0">🛡️ Müşayiətçi piyada <input id="caravanEscort" type="number" min="0" max="'+army.infantry+'" value="0" style="width:70px"></label><button id="sendCaravan" style="margin:8px 0">🚚 Ticarət karvanı göndər · 10 qızıl</button><div id="caravanStatus" style="font-size:12px;margin:6px 0"></div><button id="enemyRaid" style="margin:8px 0" '+(raidRemaining?'disabled':'')+'>'+(raidRemaining?'⏳ Basqına qədər: '+Math.ceil(raidRemaining/3600000)+' saat':'⚔ Düşmən basqınını sına')+'</button><div style="margin-top:10px"><label>Piyada <input id="ogInf" type="number" min="0" max="'+army.infantry+'" value="0"></label><label>Nizəçi <input id="ogSp" type="number" min="0" max="'+army.spearman+'" value="0"></label><label>Oxçu <input id="ogAr" type="number" min="0" max="'+army.archer+'" value="0"></label><label>Süvari <input id="ogCa" type="number" min="0" max="'+army.cavalry+'" value="0"></label><label>Cəngavər <input id="ogKn" type="number" min="0" max="'+army.knight+'" value="0"></label><button id="assignOutpostGuard">Qarnizon yerləşdir</button><button id="recallOutpostGuard" type="button" style="margin-top:7px">Qarnizonu şəhərə qaytar</button></div>':'<button id="captureOutpost">Məntəqəni ələ keçir</button>');
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
  let city={};
  try{city=JSON.parse(localStorage.getItem('taxt-ve-qilinc-city-v1')||'{}')}catch{caravanStatus.textContent='Karvan göndərilmədi: şəhər yaddaşı oxunmadı.';return;}
  city.resources=city.resources||{wood:1200,stone:1000,gold:500};
  city.army=city.army||{};
  const availableInfantry=Math.max(0,Math.floor(Number(city.army.infantry)||0));
  if((Number(city.resources.gold)||0)<10){caravanStatus.textContent='Karvan üçün 10 qızıl lazımdır.';return;}
  const escortCount=Math.max(0,Math.floor(Number(panel.querySelector('#caravanEscort').value)||0));
  if(escortCount>Math.min(army.infantry,availableInfantry)){caravanStatus.textContent='Müşayiətçi sayı şəhərdəki mövcud piyadadan çox ola bilməz.';return;}
  const sentAt=Date.now(),arrivesAt=sentAt+60000;
  const trip={status:'traveling',sentAt,arrivesAt,escort:{infantry:escortCount,spearman:0,archer:0,cavalry:0,knight:0}};
  city.resources.gold=Math.max(0,Number(city.resources.gold)||0)-10;
  city.army.infantry=availableInfantry-escortCount;
  city.pendingCaravanDispatches={...(city.pendingCaravanDispatches||{}),[id]:trip};
  try{localStorage.setItem('taxt-ve-qilinc-city-v1',JSON.stringify(city));}
  catch{caravanStatus.textContent='Karvan göndərilmədi: qızıl və qoşun dəyişiklikləri yadda saxlanmadı.';return;}
  army.infantry=Math.max(0,army.infantry-escortCount);
  caravans[id]=trip;
  try{
   localStorage.setItem(caravanKey,JSON.stringify(caravans));
   delete city.pendingCaravanDispatches[id];
   localStorage.setItem('taxt-ve-qilinc-city-v1',JSON.stringify(city));
  }catch{caravanStatus.textContent='Karvan göndərişi yaddaşa yazıldı; ehtiyat bərpa qeydi saxlanılıb.';}
  stats.innerHTML=troopIds.filter(k=>army[k]>0).map(k=>'<span>'+names[k]+': '+army[k]+'</span>').join('')||'<span>Səyyar ordu qalmayıb</span>';
  caravanButton.disabled=true;
  caravanStatus.textContent='🚚 Karvan yola düşdü. Təxmini qayıdış: 60 saniyə.';
  renderCaravanMarkers();
  const timer=setInterval(()=>{
   if(settleCaravan(id)){
    clearInterval(timer);
    const trip=caravans[id];
    if(trip.status==='returned')caravanStatus.textContent='Karvan qayıtdı: '+trip.reward.wood+' odun, '+trip.reward.stone+' daş, '+trip.reward.gold+' qızıl. '+(trip.banditResult==='defeated'?'Müşayiətçilər quldurları məğlub etdi.':trip.banditResult==='damaged'?'Quldur pusqusunda yükün yarısı itirildi.':trip.banditResult==='captured'?'Quldurlar karvanı və yükü ələ keçirdi.':'Yol təhlükəsiz idi.');
    else caravanStatus.textContent='Karvan ələ keçirildi: məntəqə səfər zamanı düşmənə keçdi.';
    caravanButton.disabled=false;
   }else if(Date.now()>=arrivesAt)clearInterval(timer);
   else caravanStatus.textContent='🚚 Karvan yoldadır. Qayıdış: '+Math.ceil((arrivesAt-Date.now())/1000)+' saniyə.';
  },1000);
 });
 panel.querySelector('#enemyRaid').addEventListener('click',()=>{
  if(Date.now()-Number(territory[id]?.lastRaidAt||0)<raidCooldown){panel.querySelector('p').textContent='Bu məntəqəyə düşmən basqını edilib. Yeni sınaq üçün 6 saat gözləməlisən.';return;}
  const raider={infantry:35,spearman:20,archer:25,cavalry:15,knight:5};
  if(guardTotal===0){territory[id].captured=false;territory[id].lastRaidAt=Date.now();try{localStorage.setItem(territoryKey,JSON.stringify(territory))}catch{};panel.querySelector('p').textContent='Qarnizon olmadığı üçün düşmən məntəqəni ələ keçirdi!';return}
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
  let city={};
  try{city=JSON.parse(localStorage.getItem('taxt-ve-qilinc-city-v1')||'{}')}catch{
   panel.querySelector('p').textContent='Gəlir toplanmadı: şəhər yaddaşı oxunmadı.';return;
  }
  city.resources=city.resources||{wood:1200,stone:1000,gold:500};
  city.outpostCollections=city.outpostCollections||{};
  const collectionId=id+':'+String(last);
  let collection=city.outpostCollections[collectionId];
  if(!collection){
   const collectedAt=Date.now();
   collection={collectedAt,gain:{...gain}};
   for(const key of ['wood','stone','gold'])city.resources[key]=Math.max(0,Number(city.resources[key])||0)+gain[key];
   city.outpostCollections[collectionId]=collection;
   const ids=Object.keys(city.outpostCollections);
   if(ids.length>60)for(const oldId of ids.slice(0,ids.length-60))delete city.outpostCollections[oldId];
   try{localStorage.setItem('taxt-ve-qilinc-city-v1',JSON.stringify(city))}catch{
    panel.querySelector('p').textContent='Gəlir toplanmadı: resurslar yadda saxlanmadı.';return;
   }
  }
  territory[id].lastCollectedAt=Number(collection.collectedAt)||Date.now();
  try{localStorage.setItem(territoryKey,JSON.stringify(territory))}catch{
   panel.querySelector('p').textContent='Gəlir artıq bir dəfə hesablanıb; vaxt möhürü saxlanmadı. Yenidən basmaq resursları təkrar artırmayacaq.';return;
  }
  showOutpostControls(id);
 });
 panel.querySelector('#assignOutpostGuard').addEventListener('click',()=>{
  const keys=['infantry','spearman','archer','cavalry','knight'],ids=['ogInf','ogSp','ogAr','ogCa','ogKn'];
  let city={};try{city=JSON.parse(localStorage.getItem('taxt-ve-qilinc-city-v1')||'{}')}catch{panel.querySelector('p').textContent='Şəhər yaddaşı oxunmadı; qarnizon dəyişdirilmədi.';return}
  city.army=city.army||{};city.outpostGarrisonTransfers=city.outpostGarrisonTransfers||{};
  const chosen=Object.fromEntries(keys.map((k,i)=>[k,Math.max(0,Math.floor(Number(panel.querySelector('#'+ids[i]).value)||0))]));
  if(Object.values(chosen).every(n=>n===0)){panel.querySelector('p').textContent='Qarnizona yerləşdirmək üçün əsgər seç.';return}
  const before={...guard},transferId=id+':assign:'+keys.map(k=>Number(before[k])||0).join('-')+':'+keys.map(k=>chosen[k]).join('-');
  const prior=city.outpostGarrisonTransfers[transferId];let next;
  if(prior)next={...prior.after};
  else{
   if(keys.some(k=>chosen[k]>(Number(city.army[k])||0))){panel.querySelector('p').textContent='Seçilən qoşun şəhərdəki mövcud saydan çoxdur.';return}
   next={...before};for(const k of keys){city.army[k]=(Number(city.army[k])||0)-chosen[k];next[k]=(Number(next[k])||0)+chosen[k]}
   city.outpostGarrisonTransfers[transferId]={outpost:id,counts:chosen,before,after:next,at:Date.now()};
   const transferIds=Object.keys(city.outpostGarrisonTransfers);if(transferIds.length>100)for(const oldId of transferIds.slice(0,transferIds.length-100))delete city.outpostGarrisonTransfers[oldId];
   try{localStorage.setItem('taxt-ve-qilinc-city-v1',JSON.stringify(city))}
   catch{panel.querySelector('p').textContent='Qoşun göndərilməsi yadda saxlanmadı.';return}
  }
  const previousTerritory=JSON.stringify(territory[id]);territory[id].garrison=next;
  try{localStorage.setItem(territoryKey,JSON.stringify(territory))}
  catch{territory[id]=JSON.parse(previousTerritory);panel.querySelector('p').textContent='Qoşun çıxışı şəhərdə qorunur; məntəqə qeydi yenilənmədi. Eyni sayla yenidən cəhd et.';return}
  for(const k of keys)army[k]=Number(city.army[k])||0;
  stats.innerHTML=keys.filter(k=>army[k]>0).map(k=>'<span>'+names[k]+': '+army[k]+'</span>').join('')||'<span>Səyyar ordu qalmayıb</span>';
  showOutpostControls(id);
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
let returnJourney=null;
try{returnJourney=JSON.parse(localStorage.getItem('tvq_return_journey_v1')||'null')}catch{returnJourney=null}
const returnPanel=document.createElement('section');
returnPanel.id='returnJourneyPanel';returnPanel.className='panel';returnPanel.style.display='none';
returnPanel.innerHTML='<h2>↩️ Geri qayıdan ordu</h2><p id="returnJourneyText"></p><div class="return-progress"><div id="returnProgressFill"></div></div><div class="stats" id="returnArmyStats"></div><div id="returnArmyComposition" class="return-composition"></div><div class="actions"><a href="./city.html">🏰 Şəhərə keç</a></div>';
document.querySelector('.wrap').append(returnPanel);
function renderReturnJourney(){
 if(!returnJourney)return;
 const now=Date.now(),start=Number(returnJourney.startedAt)||now,end=Number(returnJourney.arrivesAt)||now;
 const duration=Math.max(1,end-start),progress=Math.max(0,Math.min(1,(now-start)/duration));
 const left=Math.max(0,end-now),army=returnJourney.army||{};
 const count=Object.values(army).reduce((sum,n)=>sum+Math.max(0,Number(n)||0),0);
 dot.style.animation='none';dot.style.left=(76-(54*progress))+'%';dot.style.top=(70-(6*progress))+'%';dot.style.display='block';
 document.querySelector('#path').style.display='block';
 returnPanel.style.display='block';
 document.querySelector('#returnJourneyText').textContent=left>0?'Sağ qalan əsgərlər düşmən qalasından paytaxta qayıdır. Çatmağa: '+Math.ceil(left/1000)+' saniyə.':'Ordu paytaxta çatıb. Əsgərləri şəhər qarnizonuna qəbul etmək üçün şəhərə keç.';
 document.querySelector('#returnProgressFill').style.width=(progress*100)+'%';
 document.querySelector('#returnArmyStats').innerHTML='<span>⚔ Sağ qalan: '+count+'</span><span>🏁 '+(left>0?'Yolda':'Çatıb')+'</span><span>⏱ '+(left>0?Math.ceil(left/1000)+' san.':'Tamamlandı')+'</span>';
 const labels={infantry:'Piyada',spearman:'Nizəçi',archer:'Oxçu',cavalry:'Süvari',knight:'Cəngavər'};
 document.querySelector('#returnArmyComposition').innerHTML=Object.entries(labels).filter(([type])=>Number(army[type])>0).map(([type,label])=>'<span>'+label+': <b>'+Math.floor(Number(army[type])||0)+'</b></span>').join('')||'<span>Sağ qalan əsgər yoxdur</span>';
 if(left>0){marchButton.disabled=true;marchButton.textContent='↩️ Ordu geri qayıdır';}
 else{marchButton.disabled=true;marchButton.textContent='Ordu çatıb';}
}
renderReturnJourney();
if(returnJourney)setInterval(renderReturnJourney,500);

document.querySelectorAll('.place').forEach(el=>el.addEventListener('click',()=>{
 document.querySelectorAll('.place').forEach(x=>x.classList.remove('selected'));
 el.classList.add('selected');selected=targets[el.dataset.id];
 document.querySelector('#targetTitle').textContent=selected.title;
 document.querySelector('#description').textContent=selected.description;
 marchButton.disabled=!!returnJourney||!selected.enemy||total===0;
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
 if(returnJourney)return;
 if(journey&&journey.target==='red-fortress'&&Date.now()>=journey.arrivesAt){const next=new URLSearchParams(params);let plan={};try{plan=JSON.parse(localStorage.getItem('tvq_attack_plan_v1')||'{}')}catch{};next.set('target','red-fortress');next.set('battleId','red-'+String(journey.startedAt||0));next.set('garrison','300');next.set('direction',plan.direction||'south');next.set('tactic',plan.tactic||'balanced');next.set('ram',String(plan.ram??1));next.set('catapult',String(plan.catapult??1));let commander={};try{commander=JSON.parse(localStorage.getItem('tvq_general_v1')||'{}')}catch{};next.set('commander',commander.id||'alp');location.href='./battle.html?'+next.toString();return;}
 if(!selected?.enemy||!total||journey)return;
 const marchArmy=Object.fromEntries(['infantry','spearman','archer','cavalry','knight'].map(type=>[type,Math.max(0,Math.floor(Number(army[type])||0))]));
 const speed={infantry:1,spearman:0.96,archer:1.04,cavalry:1.48,knight:1.22};
 const weighted=Object.entries(marchArmy).reduce((sum,[type,count])=>sum+count*speed[type],0)/Math.max(1,total);
 const siegeCount=Math.max(0,Math.floor(Number(document.querySelector('#attackRam')?.value)||0))+Math.max(0,Math.floor(Number(document.querySelector('#attackCatapult')?.value)||0));
 const duration=Math.max(45000,Math.min(12*60*1000,Math.round((150000+Math.sqrt(total)*9000+siegeCount*18000)/Math.max(.7,weighted))));

 journey={target:'red-fortress',startedAt:Date.now(),arrivesAt:Date.now()+duration,duration,army:marchArmy,siege:siegeCount};
 try{localStorage.setItem(journeyKey,JSON.stringify(journey));}catch{}
 renderJourney();
});
if(journey){setInterval(renderJourney,1000);}


function mountKingdomMarket(){
 const wrap=document.querySelector('.wrap');
 if(!wrap||document.querySelector('#kingdomMarket'))return;
 const market=document.createElement('section');market.id='kingdomMarket';market.className='panel';
 market.innerHTML='<h2>🏛 Krallıqlar bazarı</h2><p>Qonşu krallıqların tacirləri ilə odun və daş mübadiləsi et. Qiymətlər hər gün dəyişir; alış və satış arasında bazar fərqi var.</p><div id="marketRates" class="stats"></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px"><label style="font-size:12px">Resurs<select id="marketResource" style="display:block;width:100%;padding:10px;margin-top:5px;border-radius:7px;background:#172127;color:#fff;border:1px solid #756448"><option value="wood">Odun</option><option value="stone">Daş</option></select></label><label style="font-size:12px">Əməliyyat<select id="marketSide" style="display:block;width:100%;padding:10px;margin-top:5px;border-radius:7px;background:#172127;color:#fff;border:1px solid #756448"><option value="buy">Al</option><option value="sell">Sat</option></select></label></div><label style="display:block;font-size:12px;margin-top:9px">Miqdar <input id="marketAmount" type="number" min="1" max="5000" value="100" style="display:block;width:100%;padding:10px;margin-top:5px;border-radius:7px;background:#172127;color:#fff;border:1px solid #756448"></label><div class="actions"><button id="marketTrade">Mübadilə et</button></div><p id="marketStatus" aria-live="polite">Ticarət qiymətləri gündəlik yenilənir.</p>';
 wrap.append(market);
 const now=new Date();
 const day=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');
 const daySeed=Number(day.replaceAll('-',''));
 const rates={wood:2+(daySeed%5),stone:4+((daySeed*7)%5)};
 function getMarketTerms(){
  let diplomacy={};try{diplomacy=JSON.parse(localStorage.getItem('tvq_diplomacy_v1')||'{}')}catch{}
  const standings=diplomacy.standings||{};
  const reputation=Object.values(standings).reduce((sum,value)=>sum+Math.max(0,Number(value)||0),0);
  const relations=diplomacy.relations||{};
  const alliedCount=Object.values(relations).filter(value=>value==='allied').length;
  const warCount=Object.values(relations).filter(value=>value==='war').length;
  const reputationDiscount=reputation>=25?0.10:reputation>=10?0.05:0;
  const allianceDiscount=Math.min(0.15,alliedCount*0.03);
  const warSurcharge=Math.min(0.24,warCount*0.08);
  const discount=Math.max(0,reputationDiscount+allianceDiscount-warSurcharge);
  const premium=Math.max(0,(reputation>=25?0.05:0)-Math.min(0.15,warCount*0.05));
  const buyPenalty=1+warSurcharge;
  const buyPrice={wood:Math.max(1,Math.ceil(rates.wood*1.12*(1-discount)*buyPenalty)),stone:Math.max(1,Math.ceil(rates.stone*1.12*(1-discount)*buyPenalty))};
  const sellPrice={wood:Math.max(1,Math.floor(rates.wood*.88*(1+premium)/(1+warCount*0.05))),stone:Math.max(1,Math.floor(rates.stone*.88*(1+premium)/(1+warCount*0.05)))};
  return {buyPrice,sellPrice,reputation,discount,premium,alliedCount,warCount};
 }
 const renderRates=()=>{
  const terms=getMarketTerms();
  market.querySelector('#marketRates').innerHTML='<span>🪵 Odun: alış '+terms.buyPrice.wood+' 🪙 · satış '+terms.sellPrice.wood+' 🪙</span><span>🪨 Daş: alış '+terms.buyPrice.stone+' 🪙 · satış '+terms.sellPrice.stone+' 🪙</span><small style="grid-column:1/-1">Diplomatik nüfuz: '+terms.reputation+' · Müttəfiq: '+terms.alliedCount+' · Müharibə: '+terms.warCount+' · '+(terms.discount?'Alışda '+Math.round(terms.discount*100)+'% xalis güzəşt':terms.premium?'Satışda '+Math.round(terms.premium*100)+'% bonus':'Xüsusi ticarət güzəşti yoxdur')+(terms.warCount?' · Müharibə bazar qiymətlərini artırır.':'')+'</small>';
 };
 renderRates();
 market.querySelector('#marketTrade').addEventListener('click',()=>{
  const resource=market.querySelector('#marketResource').value;
  const side=market.querySelector('#marketSide').value;
  const amount=Math.max(1,Math.min(5000,Math.floor(Number(market.querySelector('#marketAmount').value)||0)));
  if(!amount){market.querySelector('#marketStatus').textContent='Miqdarı düzgün daxil et.';return}
  let city={};try{city=JSON.parse(localStorage.getItem('taxt-ve-qilinc-city-v1')||'{}')}catch{}
  city.resources=city.resources||{wood:1200,stone:1000,gold:500};
  const terms=getMarketTerms();
  const price=side==='buy'?terms.buyPrice[resource]:terms.sellPrice[resource];
  const totalGold=price*amount;
  if(side==='buy'){
   if((Number(city.resources.gold)||0)<totalGold){market.querySelector('#marketStatus').textContent='Qızıl çatmır. Lazımdır: '+totalGold+' · Mövcud: '+(Number(city.resources.gold)||0)+'.';return}
   city.resources.gold-=totalGold;
   city.resources[resource]=(Number(city.resources[resource])||0)+amount;
  }else{
   if((Number(city.resources[resource])||0)<amount){market.querySelector('#marketStatus').textContent='Anbarda kifayət qədər '+(resource==='wood'?'odun':'daş')+' yoxdur.';return}
   city.resources[resource]-=amount;
   city.resources.gold=(Number(city.resources.gold)||0)+totalGold;
  }
  try{localStorage.setItem('taxt-ve-qilinc-city-v1',JSON.stringify(city))}catch{market.querySelector('#marketStatus').textContent='Yaddaşa yazmaq mümkün olmadı. Yenidən cəhd et.';return}
  market.querySelector('#marketStatus').textContent=(side==='buy'?'Aldın: ':'Satdın: ')+amount+' '+(resource==='wood'?'odun':'daş')+'. '+(side==='buy'?'Xərc: ':'Qazanc: ')+totalGold+' qızıl. Şəhər resursları yadda saxlanıldı.';
 });
}
mountKingdomMarket();

function mountDiplomacyContracts(){
 const wrap=document.querySelector('.wrap');
 if(!wrap||document.querySelector('#diplomacyContracts'))return;
 const panel=document.createElement('section');panel.id='diplomacyContracts';panel.className='panel';
 panel.innerHTML='<h2>🤝 Qonşu krallıqlarla diplomatiya</h2><p>Gündəlik təchizat müqavilələrini yerinə yetir, qızıl və nüfuz qazan. Nüfuz gələcək diplomatik imkanlar üçün saxlanılır.</p><div id="diplomacyList"></div>';
 wrap.append(panel);
 const localDay=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
 const day=localDay();
 const key='tvq_diplomacy_v1';
 let state={day,standings:{},completed:{}};
 try{state={...state,...JSON.parse(localStorage.getItem(key)||'{}')}}catch{}
 state.standings=state.standings||{};
 state.completed=state.completed||{};
 state.relations=state.relations||{};
 state.aidClaims=state.aidClaims||{};
 state.borderBattles=state.borderBattles||{};
 if(state.day!==day){state.day=day;state.completed={};}
 const kingdoms=[
  {id:'north',name:'Şimal İttifaqı',resource:'wood',base:180,bonus:260,rep:3,icon:'❄️'},
  {id:'iron',name:'Dəmir Tac',resource:'stone',base:140,bonus:320,rep:4,icon:'⚒️'},
  {id:'sun',name:'Günəş Torpaqları',resource:'wood',base:260,bonus:380,rep:5,icon:'☀️'}
 ];
 const seed=Number(day.replaceAll('-',''));
 const list=panel.querySelector('#diplomacyList');
 const relationNames={neutral:'Neytral',allied:'Müttəfiq',war:'Müharibə'};
 const relationActions={neutral:'🤝 İttifaq təklif et · 100 qızıl',allied:'⚔ Müharibə elan et · 100 qızıl',war:'🕊 Sülh təklif et · 50 qızıl'};
 function changeRelation(kingdom,card){
  const current=state.relations[kingdom.id]||'neutral';
  const next=current==='neutral'?'allied':current==='allied'?'war':'allied';
  const cost=next==='allied'&&current==='neutral'?100:next==='war'?100:50;
  let city={};try{city=JSON.parse(localStorage.getItem('taxt-ve-qilinc-city-v1')||'{}')}catch{}
  city.resources=city.resources||{wood:1200,stone:1000,gold:500};
  const gold=Math.max(0,Number(city.resources.gold)||0);
  if(gold<cost){card.querySelector('.relationStatus').textContent='Qızıl çatmır. Lazımdır: '+cost+' · Mövcud: '+gold+'.';return}
  city.resources.gold=gold-cost;
  state.relations[kingdom.id]=next;
  try{localStorage.setItem('taxt-ve-qilinc-city-v1',JSON.stringify(city));localStorage.setItem(key,JSON.stringify(state))}
  catch{card.querySelector('.relationStatus').textContent='Dəyişiklik yadda saxlanmadı.';return}
  render();
 }
 function resolveScheduledBorderRaids(){
  const now=Date.now();
  const attackers={north:{infantry:35,spearman:18,archer:30,cavalry:12,knight:5},iron:{infantry:42,spearman:28,archer:22,cavalry:10,knight:12},sun:{infantry:28,spearman:12,archer:25,cavalry:28,knight:10}};
  state.borderCampaigns=state.borderCampaigns||{};
  let changed=false;
  for(const kingdom of kingdoms){
   const campaign=state.borderCampaigns[kingdom.id];
   if(!campaign?.captured)continue;
   const garrison=campaign.garrison||{infantry:0,spearman:0,archer:0,cavalry:0,knight:0};
   const count=Object.values(garrison).reduce((n,v)=>n+(Number(v)||0),0);
   if(!campaign.nextRaidAt)campaign.nextRaidAt=(Number(campaign.capturedAt)||now)+24*60*60*1000;
   if(now<campaign.nextRaidAt)continue;
   const result=count?resolveBattle({attacker:attackers[kingdom.id]||attackers.north,defender:garrison,direction:'south',tactic:'balanced',defenderTactic:'balanced',terrain:kingdom.id==='iron'?'fortress':kingdom.id==='north'?'forest':'plains',seed:Math.floor(campaign.nextRaidAt/1000)}):{winner:'attacker',remaining:{defender:{infantry:0,spearman:0,archer:0,cavalry:0,knight:0}},losses:{attacker:{},defender:{}}};
   campaign.garrison=result.remaining.defender;
   campaign.lastRaidAt=now;
   campaign.lastRaidWinner=result.winner;
   campaign.lastRaidLosses=result.losses;
   if(result.winner==='attacker'){
    campaign.captured=false;
    campaign.lostAt=now;
    campaign.wins=Math.max(0,(Number(campaign.wins)||0)-1);
   }else{
    campaign.nextRaidAt=now+24*60*60*1000;
   }
   state.borderCampaigns[kingdom.id]=campaign;
   changed=true;
  }
  if(changed){try{localStorage.setItem(key,JSON.stringify(state))}catch{}}
 }
 function render(){
  resolveScheduledBorderRaids();
  list.innerHTML='';
  for(const kingdom of kingdoms){
   const amount=kingdom.base+((seed*(kingdom.id==='north'?3:kingdom.id==='iron'?5:7))%5)*20;
   const reward=amount+kingdom.bonus;
   const completed=state.completed[kingdom.id]===day;
   const standing=Math.max(0,Number(state.standings[kingdom.id])||0);
   const card=document.createElement('article');
   card.style.cssText='margin-top:10px;padding:12px;border:1px solid #80633f;border-radius:10px;background:#202d29';
   const resourceName=kingdom.resource==='wood'?'odun':'daş';
   const relation=state.relations[kingdom.id]||'neutral';
   card.innerHTML='<b>'+kingdom.icon+' '+kingdom.name+'</b><div style="font-size:12px;margin:5px 0 9px">Nüfuz: '+standing+' · Münasibət: '+relationNames[relation]+'</div><p style="margin:0 0 8px">'+amount+' '+resourceName+' təhvil ver · '+reward+' qızıl və '+kingdom.rep+' nüfuz qazan</p><button type="button" class="contractAction" '+(completed?'disabled':'')+'>'+ (completed?'✓ Müqavilə tamamlandı':'Müqaviləni yerinə yetir')+'</button><small class="contractStatus" style="display:block;margin-top:7px">'+(completed?'Bu günün mükafatı artıq alınıb.':'Resurslar şəhər anbarından çıxılacaq.')+'</small><div style="margin-top:10px;padding-top:9px;border-top:1px solid #80633f"><button type="button" class="relationAction">'+relationActions[relation]+'</button><small class="relationStatus" style="display:block;margin-top:6px">'+(relation==='neutral'?'İttifaq ticarət güzəştlərini gücləndirəcək.':relation==='allied'?'İttifaq qüvvədədir. Müharibə elan etsən, münasibətlər pozulacaq.':'Müharibə vəziyyətindəsən. Sülh üçün ödəniş et.')+'</small></div>';
   card.querySelector('.relationAction').addEventListener('click',()=>changeRelation(kingdom,card));
   const aidButton=document.createElement('button');
   aidButton.type='button';
   aidButton.style.cssText='margin-top:8px;width:100%';
   let cityAidClaims={};try{const savedCity=JSON.parse(localStorage.getItem('taxt-ve-qilinc-city-v1')||'{}');cityAidClaims=savedCity.aidClaims||{}}catch{}
   state.aidClaims=state.aidClaims||{};
   if(cityAidClaims[kingdom.id]===day)state.aidClaims[kingdom.id]=day;
   const aidClaimed=state.aidClaims[kingdom.id]===day;
   aidButton.disabled=relation!=='allied'||aidClaimed;
   aidButton.textContent=relation!=='allied'?'Hərbi yardım üçün müttəfiq ol':aidClaimed?'✓ Bugünkü hərbi yardım alındı':'🛡 Müttəfiqdən hərbi yardım istə';
   const aidStatus=document.createElement('small');
   aidStatus.style.cssText='display:block;margin-top:5px';
   aidStatus.textContent=aidClaimed?'Bu krallıqdan bu gün artıq yardım almısan.':relation==='allied'?'Gündə bir dəfə: 40 piyada, 20 oxçu və 10 süvari.':'Hərbi yardım yalnız ittifaq qurulduqda açılır.';
   aidButton.addEventListener('click',()=>{
    if((state.relations[kingdom.id]||'neutral')!=='allied'||state.aidClaims[kingdom.id]===day)return;
    let city={};try{city=JSON.parse(localStorage.getItem('taxt-ve-qilinc-city-v1')||'{}')}catch{}
    city.army=city.army||{};city.aidClaims=city.aidClaims||{};
    if(city.aidClaims[kingdom.id]===day){state.aidClaims[kingdom.id]=day;render();return}
    city.army.infantry=(Number(city.army.infantry)||0)+40;
    city.army.archer=(Number(city.army.archer)||0)+20;
    city.army.cavalry=(Number(city.army.cavalry)||0)+10;
    city.aidClaims[kingdom.id]=day;
    try{localStorage.setItem('taxt-ve-qilinc-city-v1',JSON.stringify(city))}
    catch{aidStatus.textContent='Yardım yadda saxlanmadı. Yenidən cəhd et.';return}
    state.aidClaims[kingdom.id]=day;
    try{localStorage.setItem(key,JSON.stringify(state))}
    catch{aidStatus.textContent='Qoşunlar saxlanıldı; gündəlik yardım qeydi şəhər yaddaşında qorunur.';return}
    render();
   });
   card.append(aidButton,aidStatus);
   if(relation==='war'){
    const battleButton=document.createElement('button');
    battleButton.type='button';
    battleButton.style.cssText='margin-top:8px;width:100%';
    const battleStatus=document.createElement('small');
    battleStatus.style.cssText='display:block;margin-top:5px';
    const battleDone=state.borderBattles[kingdom.id]===day;
    const campaign=state.borderCampaigns?.[kingdom.id]||{wins:0,captured:false};
    battleButton.disabled=battleDone||!!campaign.captured;
    battleButton.textContent=campaign.captured?'🏳 Məntəqə fəth edilib':battleDone?'✓ Bu gün döyüş tamamlanıb':'⚔ Sərhəd basqınını dəf et';
    battleStatus.textContent=(battleDone?'Bu krallıqla bu gün döyüş artıq aparılıb. Növbəti cəhd sabah mümkündür. ':'Tələb: 30 piyada, 20 oxçu, 10 süvari. Qələbə mükafatı: 80 qızıl. ')+(campaign.captured?'🏴 Sərhəd məntəqəsi ələ keçirilib.':('Sərhəd kampaniyası: '+Math.min(3,Number(campaign.wins)||0)+'/3 qələbə'+((Number(campaign.wins)||0)>=2?' · Növbəti qələbə məntəqəni açacaq.':'.')));
    battleButton.addEventListener('click',()=>{
     if(state.borderBattles[kingdom.id]===day)return;
     let city={};try{city=JSON.parse(localStorage.getItem('taxt-ve-qilinc-city-v1')||'{}')}catch{}
     city.army=city.army||{};
     const required={infantry:30,archer:20,cavalry:10};
     const missing=Object.keys(required).filter(type=>(Number(city.army[type])||0)<required[type]);
     if(missing.length){battleStatus.textContent='Qoşun çatmır. Lazım olan: 30 piyada, 20 oxçu, 10 süvari.';return}
     try{localStorage.setItem('tvq_border_battle_kingdom',kingdom.id)}catch{}
     const enemyFor={north:{infantry:32,spearman:18,archer:38,cavalry:12,knight:5,terrain:'forest'},iron:{infantry:42,spearman:35,archer:25,cavalry:8,knight:15,terrain:'fortress'},sun:{infantry:25,spearman:10,archer:28,cavalry:32,knight:12,terrain:'plains'}};
     const enemy=enemyFor[kingdom.id]||enemyFor.north;
     const params=new URLSearchParams({target:'border',battleId:'border-'+kingdom.id+'-'+day,kingdom:kingdom.id,infantry:String(city.army.infantry||0),spearman:String(city.army.spearman||0),archer:String(city.army.archer||0),cavalry:String(city.army.cavalry||0),knight:String(city.army.knight||0),garrison:String(Object.entries(enemy).filter(([k])=>k!=='terrain').reduce((sum,[,v])=>sum+v,0)),terrain:enemy.terrain,...Object.fromEntries(Object.entries(enemy).filter(([k])=>k!=='terrain').map(([k,v])=>['def_'+k,String(v)]))});
     location.href='./battle.html?'+params.toString();
    });
    card.append(battleButton,battleStatus);
    if(campaign.captured){
     const garrison=campaign.garrison||{infantry:0,spearman:0,archer:0,cavalry:0,knight:0};
     const garrisonPanel=document.createElement('div');
     garrisonPanel.style.cssText='margin-top:10px;padding:10px;border:1px solid #756448;border-radius:8px;background:#18241f';
     garrisonPanel.innerHTML='<b>🏰 Sərhəd məntəqəsinin müdafiəsi</b><p style="font-size:12px">Qarnizon: '+Object.values(garrison).reduce((n,v)=>n+(Number(v)||0),0)+' əsgər. '+(campaign.lastRaidAt?'Son basqın: '+(campaign.lastRaidWinner==='defender'?'müdafiə uğurlu oldu':'məntəqə itirildi')+'. ':'')+(campaign.nextRaidAt&&Object.values(garrison).some(v=>Number(v)>0)?'Növbəti basqına qədər: '+Math.max(0,Math.ceil((campaign.nextRaidAt-Date.now())/3600000))+' saat. ':'Qarnizon boşdur, məntəqə müdafiəsizdir.')+'</p><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px"><label>Piyada <input id="bgInf" type="number" min="0" value="0" style="width:65px"></label><label>Nizəçi <input id="bgSp" type="number" min="0" value="0" style="width:65px"></label><label>Oxçu <input id="bgAr" type="number" min="0" value="0" style="width:65px"></label><label>Süvari <input id="bgCa" type="number" min="0" value="0" style="width:65px"></label><label>Cəngavər <input id="bgKn" type="number" min="0" value="0" style="width:65px"></label></div><button id="assignBorderGuard" type="button" style="width:100%;margin-top:8px">Qarnizona əsgər göndər</button><button id="recallBorderGuard" type="button" style="width:100%;margin-top:6px">Qarnizonu şəhərə qaytar</button><small id="borderGuardStatus" style="display:block;margin-top:6px"></small>';
     card.append(garrisonPanel);
     const guardKeys=['infantry','spearman','archer','cavalry','knight'];
     const guardIds=['bgInf','bgSp','bgAr','bgCa','bgKn'];
     const guardStatus=garrisonPanel.querySelector('#borderGuardStatus');
     garrisonPanel.querySelector('#assignBorderGuard').addEventListener('click',()=>{
      let city={};try{city=JSON.parse(localStorage.getItem('taxt-ve-qilinc-city-v1')||'{}')}catch{guardStatus.textContent='Şəhər yaddaşı oxunmadı.';return}
      city.army=city.army||{};city.borderGarrisonTransfers=city.borderGarrisonTransfers||{};
      const additions=Object.fromEntries(guardKeys.map((k,i)=>[k,Math.max(0,Math.floor(Number(garrisonPanel.querySelector('#'+guardIds[i]).value)||0))]));
      if(!Object.values(additions).some(Boolean)){guardStatus.textContent='Əvvəlcə göndəriləcək əsgər sayını daxil et.';return}
      const before={...garrison},transferId=kingdom.id+':assign:'+guardKeys.map(k=>Number(before[k])||0).join('-')+':'+guardKeys.map(k=>additions[k]).join('-');
      const prior=city.borderGarrisonTransfers[transferId];let next;
      if(prior)next={...prior.after};
      else{
       const invalid=guardKeys.some(k=>additions[k]>(Number(city.army[k])||0));
       if(invalid){guardStatus.textContent='Seçilən qoşun şəhərdəki mövcud saydan çoxdur.';return}
       next={...before};for(const k of guardKeys){city.army[k]=(Number(city.army[k])||0)-additions[k];next[k]=(Number(next[k])||0)+additions[k]}
       city.borderGarrisonTransfers[transferId]={type:'assign',kingdom:kingdom.id,counts:additions,before,after:next,at:Date.now()};
       const ids=Object.keys(city.borderGarrisonTransfers);if(ids.length>100)for(const oldId of ids.slice(0,ids.length-100))delete city.borderGarrisonTransfers[oldId];
       try{localStorage.setItem('taxt-ve-qilinc-city-v1',JSON.stringify(city))}catch{guardStatus.textContent='Qoşun göndərilməsi yadda saxlanmadı.';return}
      }
      campaign.garrison=next;state.borderCampaigns=state.borderCampaigns||{};state.borderCampaigns[kingdom.id]=campaign;
      try{localStorage.setItem(key,JSON.stringify(state))}catch{guardStatus.textContent='Qoşun çıxışı şəhərdə qorunur; qarnizon qeydi yenilənmədi. Eyni sayla yenidən cəhd et.';return}
      guardStatus.textContent='Qarnizon gücləndirildi: '+Object.values(next).reduce((n,v)=>n+v,0)+' əsgər.';render();
     });;
     garrisonPanel.querySelector('#recallBorderGuard').addEventListener('click',()=>{
      let city={};try{city=JSON.parse(localStorage.getItem('taxt-ve-qilinc-city-v1')||'{}')}catch{guardStatus.textContent='Şəhər yaddaşı oxunmadı; qarnizon dəyişdirilmədi.';return}
      city.army=city.army||{};city.borderGarrisonReturns=city.borderGarrisonReturns||{};
      const returning={...garrison};if(!guardKeys.some(k=>(Number(returning[k])||0)>0)){guardStatus.textContent='Qaytarılacaq qarnizon boşdur.';return}
      const transferId=kingdom.id+':recall:'+guardKeys.map(k=>Number(returning[k])||0).join('-');
      if(!city.borderGarrisonReturns[transferId]){
       for(const k of guardKeys)city.army[k]=(Number(city.army[k])||0)+(Number(returning[k])||0);
       city.borderGarrisonReturns[transferId]={kingdom:kingdom.id,counts:returning,at:Date.now()};
       const ids=Object.keys(city.borderGarrisonReturns);if(ids.length>100)for(const oldId of ids.slice(0,ids.length-100))delete city.borderGarrisonReturns[oldId];
       try{localStorage.setItem('taxt-ve-qilinc-city-v1',JSON.stringify(city))}catch{guardStatus.textContent='Qarnizon geri çağırıla bilmədi: şəhər yaddaşı yazılmadı.';return}
      }
      campaign.garrison={infantry:0,spearman:0,archer:0,cavalry:0,knight:0};state.borderCampaigns[kingdom.id]=campaign;
      try{localStorage.setItem(key,JSON.stringify(state))}catch{guardStatus.textContent='Qoşunlar şəhərə bir dəfə qaytarıldı; sərhəd qeydi yenilənmədi. Təkrar qoşun əlavə olunmayacaq.';return}
      render();
     });;
;
    }
   }
   const button=card.querySelector('.contractAction');
   button.addEventListener('click',()=>{
    let city={};try{city=JSON.parse(localStorage.getItem('taxt-ve-qilinc-city-v1')||'{}')}catch{}
    city.resources=city.resources||{wood:1200,stone:1000,gold:500};
    const available=Math.max(0,Number(city.resources[kingdom.resource])||0);
    if(available<amount){card.querySelector('.contractStatus').textContent='Resurs çatmır. Lazımdır: '+amount+' · Mövcud: '+available+'.';return}
    city.resources[kingdom.resource]=available-amount;
    city.resources.gold=Math.max(0,Number(city.resources.gold)||0)+reward;
    state.completed[kingdom.id]=day;
    state.standings[kingdom.id]=standing+kingdom.rep;
    try{
     localStorage.setItem('taxt-ve-qilinc-city-v1',JSON.stringify(city));
     localStorage.setItem(key,JSON.stringify(state));
    }catch{
     card.querySelector('.contractStatus').textContent='Yaddaşa yazmaq mümkün olmadı. Müqavilə tamamlanmadı.';
     return;
    }
    render();
   });
   list.append(card);
  }
 }
 render();
 try{localStorage.setItem(key,JSON.stringify(state))}catch{}
}
mountDiplomacyContracts();

function renderCapturedFrontiers(){
 const map=document.querySelector('#map');if(!map)return;
 map.querySelectorAll('.frontier-marker').forEach(node=>node.remove());
 document.querySelectorAll('#frontierInfo').forEach(node=>node.remove());
 let diplomacy={};try{diplomacy=JSON.parse(localStorage.getItem('tvq_diplomacy_v1')||'{}')}catch{}
 const campaigns=diplomacy.borderCampaigns||{};
 const sites=[
  {id:'north',name:'Şimal sərhəd qalası',icon:'❄️',left:'84%',top:'18%',rate:'12 odun · 5 daş · 3 qızıl/saat',wood:12,stone:5,gold:3},
  {id:'iron',name:'Dəmir Tac qalası',icon:'⚒️',left:'84%',top:'43%',rate:'5 odun · 12 daş · 4 qızıl/saat',wood:5,stone:12,gold:4},
  {id:'sun',name:'Günəş sərhəd qalası',icon:'☀️',left:'17%',top:'39%',rate:'10 odun · 7 daş · 6 qızıl/saat',wood:10,stone:7,gold:6}
 ];
 const owned=sites.filter(site=>campaigns[site.id]?.captured);
 if(!owned.length)return;
 const info=document.createElement('section');info.className='frontier-info';info.id='frontierInfo';
 info.style.cssText='margin-top:12px;padding:12px;border:1px solid #80633f;border-radius:10px;background:#202d29';
 info.innerHTML='<b>🏴 Fəth edilmiş sərhəd qalaları</b><div id="frontierDetails"><p>Xəritədə nişana toxunaraq qarnizon və istehsal məlumatlarına bax.</p></div><p id="frontierIncomeStatus" style="font-size:12px"></p><button id="collectFrontierIncome" type="button">💰 Sərhəd gəlirlərini topla</button>';
 map.after(info);
 const collectButton=info.querySelector('#collectFrontierIncome');
 collectButton.addEventListener('click',()=>{
  let current={};try{current=JSON.parse(localStorage.getItem('tvq_diplomacy_v1')||'{}')}catch{}
  current.borderCampaigns=current.borderCampaigns||{};
  let city={};try{city=JSON.parse(localStorage.getItem('taxt-ve-qilinc-city-v1')||'{}')}catch{}
  city.resources=city.resources||{wood:1200,stone:1000,gold:500};
  const now=Date.now();
  const earned={wood:0,stone:0,gold:0};
  for(const site of sites){
   const campaign=current.borderCampaigns[site.id];
   if(!campaign?.captured)continue;
   const last=Math.max(0,Number(campaign.lastCollectedAt)||Number(campaign.capturedAt)||now);
   const hours=Math.min(24,Math.max(0,(now-last)/3600000));
   earned.wood+=Math.floor(hours*site.wood);
   earned.stone+=Math.floor(hours*site.stone);
   earned.gold+=Math.floor(hours*site.gold);
   campaign.lastCollectedAt=now;
  }
  for(const key of Object.keys(earned))city.resources[key]=(Number(city.resources[key])||0)+earned[key];
  try{
   localStorage.setItem('taxt-ve-qilinc-city-v1',JSON.stringify(city));
   localStorage.setItem('tvq_diplomacy_v1',JSON.stringify(current));
  }catch{info.querySelector('#frontierIncomeStatus').textContent='Gəliri yadda saxlamaq mümkün olmadı.';return;}
  info.querySelector('#frontierIncomeStatus').textContent='Toplandı: '+earned.wood+' odun · '+earned.stone+' daş · '+earned.gold+' qızıl. Növbəti gəlir bundan sonra hesablanacaq.';
  collectButton.disabled=true;
 });
 for(const site of owned){
  const campaign=campaigns[site.id];
  const guard=campaign.garrison||{};
  const count=Object.values(guard).reduce((n,v)=>n+(Number(v)||0),0);
  const marker=document.createElement('button');
  marker.type='button';marker.className='frontier-marker';marker.style.left=site.left;marker.style.top=site.top;
  marker.textContent=site.icon;marker.dataset.label='Sənin qalən';marker.setAttribute('aria-label',site.name);
  marker.addEventListener('click',()=>{
   info.querySelector('#frontierDetails').innerHTML='<b>'+site.icon+' '+site.name+'</b><p>Bu qala sənin krallığının nəzarətindədir. Qarnizon: <b>'+count+'</b> əsgər.</p><p>İstehsal: '+site.rate+'.</p><p>'+(count?'Qarnizon düşmən basqınlarına qarşı müdafiə yaradır.':'Qala müdafiəsizdir — qarnizon yerləşdirmək lazımdır.')+'</p><small>Son basqın: '+(campaign.lastRaidAt?new Date(campaign.lastRaidAt).toLocaleString('az-AZ'):'Hələ basqın olmayıb')+'</small><p><a href="./frontier.html?kingdom='+site.id+'" style="display:inline-block;margin-top:8px;padding:8px 10px;border:1px solid #b49a6b;border-radius:7px;color:#fff1d9;text-decoration:none;background:#59452d">🏰 3D qalaya daxil ol</a></p>';
  });
  map.append(marker);
 }
}
renderCapturedFrontiers();

if(!total)document.querySelector('#description').textContent='Şəhərdə əvvəlcə qoşun hazırla. Sonra xəritəyə qayıdıb yürüşə başla.';
