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
document.querySelectorAll('.place').forEach(el=>el.addEventListener('click',()=>{
 document.querySelectorAll('.place').forEach(x=>x.classList.remove('selected'));
 el.classList.add('selected');selected=targets[el.dataset.id];
 document.querySelector('#targetTitle').textContent=selected.title;
 document.querySelector('#description').textContent=selected.description;
 document.querySelector('#march').disabled=!selected.enemy||total===0;
 document.querySelector('#path').style.display='block';
}));
document.querySelector('#march').addEventListener('click',()=>{
 if(!selected?.enemy||!total)return;
 const next=new URLSearchParams(params);next.set('target','red-fortress');
 location.href='./battle.html?'+next.toString();
});
if(!total)document.querySelector('#description').textContent='Şəhərdə əvvəlcə qoşun hazırla. Sonra xəritəyə qayıdıb yürüşə başla.';
