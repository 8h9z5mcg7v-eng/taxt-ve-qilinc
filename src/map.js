const params=new URLSearchParams(location.search);
const troopIds=['infantry','spearman','archer','cavalry','knight'];
const names={infantry:'Piyada',spearman:'Nizəçi',archer:'Oxçu',cavalry:'Süvari',knight:'Cəngavər'};
let storedArmy={};try{storedArmy=JSON.parse(localStorage.getItem('taxt-ve-qilinc-city-v1')||'{}').army||{}}catch{}const army=Object.fromEntries(troopIds.map(k=>[k,Math.max(0,Math.min(9999,Math.floor(Number(params.has(k)?params.get(k):(storedArmy[k]||0))||0)))]));
const total=Object.values(army).reduce((a,b)=>a+b,0);
const stats=document.querySelector('#armyStats');
stats.innerHTML=troopIds.filter(k=>army[k]>0).map(k=>'<span>'+names[k]+': '+army[k]+'</span>').join('')||'<span>Ordu məlumatı yoxdur</span>';
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
function showGarrisonControls(){
 const panel=document.querySelector('.panel');
 let section=document.querySelector('#garrisonControls');
 if(!section){section=document.createElement('div');section.id='garrisonControls';section.style.cssText='margin-top:12px;padding:10px;border:1px solid #756448;border-radius:9px;background:#1d2b25';panel.append(section)}
 const garrison=fortressState.garrison||{infantry:0,spearman:0,archer:0,cavalry:0,knight:0};
 const totalGarrison=Object.values(garrison).reduce((a,n)=>a+n,0);
 section.innerHTML='<b>Qala qarnizonu: '+totalGarrison+' əsgər</b><p>Qalanı müdafiə etmək üçün ordudan əsgər ayır.</p><label style="display:block;font-size:12px;margin:7px 0">Piyada <input id="gInf" type="number" min="0" max="'+army.infantry+'" value="0"></label><label style="display:block;font-size:12px;margin:7px 0">Nizəçi <input id="gSp" type="number" min="0" max="'+army.spearman+'" value="0"></label><label style="display:block;font-size:12px;margin:7px 0">Oxçu <input id="gAr" type="number" min="0" max="'+army.archer+'" value="0"></label><label style="display:block;font-size:12px;margin:7px 0">Süvari <input id="gCa" type="number" min="0" max="'+army.cavalry+'" value="0"></label><label style="display:block;font-size:12px;margin:7px 0">Cəngavər <input id="gKn" type="number" min="0" max="'+army.knight+'" value="0"></label><button id="assignGarrison">Qarnizonu yerləşdir</button>';
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
 const enemy=document.querySelector('[data-id="enemy"]');
 enemy.querySelector('span').textContent='🏰 Sənin qalən';
 enemy.querySelector('small').textContent='Fəth olunub';
 targets.enemy.title='Qırmızı Qala — Sənin mülkün';
 targets.enemy.description='Qala sənin krallığına məxsusdur. Qarnizon yerləşdirərək onu müdafiə et.';
 targets.enemy.enemy=false;
}

const journeyKey='tvq_active_journey_v1';
const marchButton=document.querySelector('#march');
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
 if(el.dataset.id==='enemy'&&fortressState.captured)showGarrisonControls();
 else document.querySelector('#garrisonControls')?.remove();
}));
marchButton.addEventListener('click',()=>{
 if(journey&&journey.target==='red-fortress'&&Date.now()>=journey.arrivesAt){const next=new URLSearchParams(params);next.set('target','red-fortress');next.set('garrison','300');location.href='./battle.html?'+next.toString();return;}
 if(!selected?.enemy||!total||journey)return;
 const duration=Math.max(30000,Math.round(180000/Math.sqrt(total)));
 journey={target:'red-fortress',startedAt:Date.now(),arrivesAt:Date.now()+duration,army};
 try{localStorage.setItem(journeyKey,JSON.stringify(journey));}catch{}
 renderJourney();
});
if(journey){setInterval(renderJourney,1000);}

if(!total)document.querySelector('#description').textContent='Şəhərdə əvvəlcə qoşun hazırla. Sonra xəritəyə qayıdıb yürüşə başla.';
