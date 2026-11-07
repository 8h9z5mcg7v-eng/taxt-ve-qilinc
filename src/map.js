const params=new URLSearchParams(location.search);
const troopIds=['infantry','spearman','archer','cavalry','knight'];
const names={infantry:'Piyada',spearman:'Nizəçi',archer:'Oxçu',cavalry:'Süvari',knight:'Cəngavər'};
const army=Object.fromEntries(troopIds.map(k=>[k,Math.max(0,Math.min(9999,Math.floor(Number(params.get(k))||0)))]));
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
