import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const host=document.querySelector('#scene');
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x879b98);
scene.fog=new THREE.Fog(0x879b98,170,340);
const camera=new THREE.PerspectiveCamera(36,innerWidth/innerHeight,.1,800);
camera.position.set(150,165,175);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.15;
host.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xdce9ef,0x4b4935,2.0));
const sun=new THREE.DirectionalLight(0xffdfb0,3.1);sun.position.set(-90,150,80);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-130;sun.shadow.camera.right=130;sun.shadow.camera.top=130;sun.shadow.camera.bottom=-130;scene.add(sun);
const fill=new THREE.DirectionalLight(0x9ab9df,1.0);fill.position.set(100,60,-100);scene.add(fill);
const mat=(c,r=.88)=>new THREE.MeshStandardMaterial({color:c,roughness:r});
const grass=mat(0x586b45),grass2=mat(0x65774b),stone=mat(0x77796f),stoneDark=mat(0x4c514d),roof=mat(0x684535),roof2=mat(0x76503a),wood=mat(0x65472e),plaster=mat(0xc1ad83),dark=mat(0x302c27),metal=mat(0x555c5b),water=mat(0x477b83,.35);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(330,330),grass);ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
function box(name,x,y,z,w,h,d,material,select=true){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y+h/2,z);m.castShadow=true;m.receiveShadow=true;m.userData.label=name;if(select)pickables.push(m);scene.add(m);return m}
const pickables=[];
function cylinder(name,x,y,z,r1,r2,h,material,segments=8){const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,segments),material);m.position.set(x,y+h/2,z);m.castShadow=true;m.receiveShadow=true;m.userData.label=name;pickables.push(m);scene.add(m);return m}
function roofHouse(name,x,z,w,d,h,wall=plaster,top=roof){
 box(name,x,0,z,w,h,d,wall);
 const r=new THREE.Mesh(new THREE.ConeGeometry(Math.max(w,d)*.72,h*.82,4),top);r.position.set(x,h+h*.36,z);r.rotation.y=Math.PI/4;r.castShadow=true;r.userData.label=name;pickables.push(r);scene.add(r);
 box(name,x,1.2,z+d/2+.04,w*.2,2.4,.12,dark);
}
const defenseTowerGroups=[];
function tower(x,z){
 const group=new THREE.Group();group.position.set(x,0,z);group.userData.baseHeight=17;
 const shaft=new THREE.Mesh(new THREE.CylinderGeometry(7,7,17,12),stone);shaft.position.y=8.5;shaft.castShadow=true;shaft.receiveShadow=true;shaft.userData.label='Müdafiə qülləsi';group.add(shaft);pickables.push(shaft);
 const crown=new THREE.Mesh(new THREE.CylinderGeometry(8,8,2.2,12),stoneDark);crown.position.y=17.2;crown.castShadow=true;crown.userData.label='Müdafiə qülləsi';group.add(crown);pickables.push(crown);
 const cap=new THREE.Mesh(new THREE.ConeGeometry(8,8,12),roof);cap.position.y=22.3;cap.castShadow=true;cap.userData.label='Müdafiə qülləsi';group.add(cap);pickables.push(cap);
 const merlons=[];
 for(let i=0;i<12;i++){const a=i*Math.PI/6;const block=new THREE.Mesh(new THREE.BoxGeometry(2.1,2.8,2.1),stone);block.position.set(Math.cos(a)*7.2,19.7,Math.sin(a)*7.2);block.castShadow=true;block.userData.label='Müdafiə qülləsi';group.add(block);pickables.push(block);merlons.push(block)}
 const slits=[];
 for(let i=0;i<4;i++){const a=i*Math.PI/2;const slit=new THREE.Mesh(new THREE.BoxGeometry(.45,3.2,.5),dark);slit.position.set(Math.cos(a)*7.04,10,Math.sin(a)*7.04);slit.lookAt(Math.cos(a)*20,10,Math.sin(a)*20);group.add(slit);slits.push(slit)}
 const emplacements=[];
 for(let i=0;i<3;i++){const weapon=new THREE.Group();const x=-4+i*4;const base=new THREE.Mesh(new THREE.BoxGeometry(2.4,.8,2.1),wood);base.position.y=21.2;weapon.add(base);const arm=new THREE.Mesh(new THREE.BoxGeometry(.35,3.2,.45),metal);arm.position.set(0,22.7,0);weapon.add(arm);const stoneShot=new THREE.Mesh(new THREE.SphereGeometry(.75,8,7),stoneDark);stoneShot.position.set(0,24.2,0);weapon.add(stoneShot);weapon.position.x=x;weapon.visible=false;group.add(weapon);emplacements.push(weapon)}
 group.userData.merlons=merlons;group.userData.emplacements=emplacements;group.userData.cap=cap;
 scene.add(group);defenseTowerGroups.push(group);return group;
}
function refreshDefenseTowerModels(){
 for(const group of defenseTowerGroups){
  const level=Math.max(1,Math.min(10,Math.floor(Number(levels['Müdafiə qülləsi'])||1)));
  const height=1+(level-1)*.075;
  group.scale.set(1,height,1);
  group.userData.cap.scale.set(1,1+(level-1)*.045,1);
  group.userData.merlons.forEach((block,i)=>{block.visible=i<Math.min(12,6+level);});
  group.userData.emplacements.forEach((weapon,i)=>{weapon.visible=level>=4+i*2;});
 }
}
// Textured-looking terrain patches, paths and crop plots.
for(let i=0;i<36;i++){const x=((i*47)%260)-130,z=((i*83)%260)-130;if(Math.abs(x)<62&&Math.abs(z)<62)continue;const patch=new THREE.Mesh(new THREE.CircleGeometry(3+(i%4),7),i%2?grass2:grass);patch.rotation.x=-Math.PI/2;patch.position.set(x,.015,z);scene.add(patch)}
const roadmat=mat(0x9a8968);const road=new THREE.Mesh(new THREE.PlaneGeometry(13,120),roadmat);road.rotation.x=-Math.PI/2;road.position.set(0,.03,93);scene.add(road);
const cross=new THREE.Mesh(new THREE.PlaneGeometry(120,11),roadmat);cross.rotation.x=-Math.PI/2;cross.position.set(0,.035,58);scene.add(cross);
// Castle keep and curtain walls.
box('Baş qala',0,0,0,34,30,32,stone);
box('Baş qala',0,30,0,23,12,22,stoneDark);
for(let i=-1;i<=1;i+=2){box('Qala mazğalı',i*9,40,0,2,8,2,stone);box('Qala mazğalı',0,40,i*9,2,8,2,stone)}
const keepRoof=new THREE.Mesh(new THREE.ConeGeometry(18,13,4),roof);keepRoof.position.set(0,51,0);keepRoof.rotation.y=Math.PI/4;keepRoof.castShadow=true;keepRoof.userData.label='Baş qala';pickables.push(keepRoof);scene.add(keepRoof);
const wallZ=49,wallX=49;
const wallSegments=[
 {label:'Şimal qala divarı',x:0,z:-wallZ,w:112,h:13,d:7,axis:'x'},
 {label:'Cənub qala divarı',x:0,z:wallZ,w:112,h:13,d:7,axis:'x'},
 {label:'Qərb qala divarı',x:-wallX,z:0,w:7,h:13,d:105,axis:'z'},
 {label:'Şərq qala divarı',x:wallX,z:0,w:7,h:13,d:105,axis:'z'}
];
const wallBattlements=[];
for(const wall of wallSegments){
 const base=box(wall.label,wall.x,0,wall.z,wall.w,wall.h,wall.d,stone);
 base.userData.wallSegment=wall.label;
 const crenels=[];
 const count=wall.axis==='x'?15:14;
 for(let i=0;i<count;i++){
  const offset=(i-(count-1)/2)*6.8;
  const block=box(wall.label,wall.axis==='x'?offset:wall.x,13,wall.axis==='x'?wall.z:offset,wall.axis==='x'?2.8:7,3.2,wall.axis==='x'?7:2.8,stoneDark,false);
  block.userData.wallSegment=wall.label;crenels.push(block);
 }
 wallBattlements.push({label:wall.label,base,crenels});
}
function refreshWallModels(){
 for(const wall of wallBattlements){
  const level=Math.max(1,Math.min(10,Math.floor(Number(levels[wall.label])||1)));
  const scale=1+(level-1)*.055;
  wall.base.scale.y=scale;wall.base.position.y=13*(scale-1)/2;
  wall.crenels.forEach((block,i)=>{
   block.visible=i<Math.min(wall.crenels.length,8+level*2);
   block.position.y=13*scale+1.5;
  });
 }
}
for(const [x,z] of [[-wallX,-wallZ],[wallX,-wallZ],[-wallX,wallZ],[wallX,wallZ]])tower(x,z);
box('Darvaza',0,0,wallZ,19,12,9,stoneDark);
box('Darvaza keçidi',0,0,wallZ+5,8,9,2,dark);
// Courtyard buildings, deliberately separated around the keep.
roofHouse('Kazarma',-29,-29,18,15,10,plaster,roof2);
roofHouse('Tövlə',29,-29,20,16,9,mat(0xa88e68),roof);
roofHouse('Dəmirçi',-30,26,15,13,8,wood,roof2);
roofHouse('Oxçuluq meydançası',30,26,19,13,7,plaster,roof);
roofHouse('Resurs anbarı',-26,68,18,13,8,wood,roof);
roofHouse('Bazar',27,68,20,12,7,plaster,roof2);
cylinder('Su quyusu',0,0,67,4,4,2,stone,12);
const pool=new THREE.Mesh(new THREE.CircleGeometry(3,20),water);pool.rotation.x=-Math.PI/2;pool.position.set(0,2.1,67);scene.add(pool);
// Archery targets, stable paddock, forge chimney and market stalls.
for(let i=0;i<3;i++){box('Ox hədəfi',24+i*6,2,45,2,4,.5,wood);cylinder('Ox hədəfi',24+i*6,4.1,45,.9,.9,.25,roof,12)}
box('Dəmirçi bacası',-36,10,33,3,10,3,stoneDark);
for(let i=0;i<3;i++)roofHouse('Bazar köşkü',17+i*8,84,6,5,3,wood,roof);
for(let i=0;i<5;i++){const t=new THREE.Mesh(new THREE.ConeGeometry(2.3,7,7),i%2?grass2:grass);t.position.set(-82+i*13,3,-72-(i%2)*12);t.castShadow=true;scene.add(t)}
// Decorative rocks and field rows beyond the walls.
for(let i=0;i<18;i++){const x=-120+(i%6)*12,z=112+Math.floor(i/6)*9;box('Əkin sahəsi',x,.1,z,7,.2,5,i%2?grass2:roadmat,false)}
// Banners, courtyard torches and small patrol squads add readable life to the blockout.
function banner(x,z,color){
 const pole=new THREE.Mesh(new THREE.CylinderGeometry(.18,.22,11,8),metal);pole.position.set(x,5.5,z);pole.castShadow=true;scene.add(pole);
 const cloth=new THREE.Mesh(new THREE.PlaneGeometry(5,3.4),mat(color,.72));cloth.position.set(x+2.45,8.1,z);cloth.rotation.y=Math.PI/2;cloth.castShadow=true;scene.add(cloth);
}
banner(-13,-13,0x9a3430);banner(13,13,0xc49a42);banner(0,48,0x9a3430);
function torch(x,z){
 const post=new THREE.Mesh(new THREE.CylinderGeometry(.22,.3,3,7),wood);post.position.set(x,1.5,z);scene.add(post);
 const flame=new THREE.Mesh(new THREE.SphereGeometry(.65,8,8),new THREE.MeshBasicMaterial({color:0xffa43b}));flame.position.set(x,3.35,z);scene.add(flame);
 const light=new THREE.PointLight(0xff9b42,1.1,13);light.position.set(x,3.5,z);scene.add(light);
}
torch(-9,44);torch(9,44);torch(-8,-45);torch(8,-45);
function makePatrol(x,z,armorColor){
 const group=new THREE.Group();group.position.set(x,0,z);group.userData.baseX=x;
 const armor=mat(armorColor,.55),skin=mat(0xb98b68),cloak=mat(0x6b302b);
 const body=new THREE.Mesh(new THREE.CylinderGeometry(.75,.95,2.7,8),armor);body.position.y=3.1;body.castShadow=true;group.add(body);
 const head=new THREE.Mesh(new THREE.SphereGeometry(.72,10,8),skin);head.position.y=5.1;head.castShadow=true;group.add(head);
 const helmet=new THREE.Mesh(new THREE.ConeGeometry(.85,1.25,8),metal);helmet.position.y=6.05;helmet.castShadow=true;group.add(helmet);
 const cape=new THREE.Mesh(new THREE.BoxGeometry(1.3,2.3,.25),cloak);cape.position.set(0,3.2,-.72);group.add(cape);
 const sword=new THREE.Mesh(new THREE.BoxGeometry(.16,2.6,.22),metal);sword.position.set(1.05,3.5,0);sword.rotation.z=-.22;group.add(sword);
 scene.add(group);return group;
}
const patrols=[makePatrol(-13,16,0x6e7780),makePatrol(13,16,0x8b754c),makePatrol(-5,38,0x687c68),makePatrol(5,38,0x8b3434)];
// Tree clusters beyond the settlement walls.
function tree(x,z,scale=1){
 const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.55*scale,.8*scale,5*scale,7),wood);trunk.position.set(x,2.5*scale,z);trunk.castShadow=true;scene.add(trunk);
 for(let i=0;i<3;i++){const crown=new THREE.Mesh(new THREE.ConeGeometry((4.2-i*.65)*scale,6*scale,8),i%2?grass:grass2);crown.position.set(x,5.2*scale+i*3*scale,z);crown.castShadow=true;scene.add(crown)}
}
for(let i=0;i<24;i++){const x=-125+(i%8)*15,z=-115+Math.floor(i/8)*17;if(Math.abs(x)<65&&Math.abs(z)<65)continue;tree(x,z,.75+(i%3)*.15)}
const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,10,12);controls.enableDamping=true;controls.dampingFactor=.07;controls.maxPolarAngle=Math.PI*.48;controls.minDistance=75;controls.maxDistance=330;
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),info=document.querySelector('#info');
let selectedBuilding='';
const SAVE_KEY='taxt-ve-qilinc-city-v1';
let savedCity={};
try{savedCity=JSON.parse(localStorage.getItem(SAVE_KEY)||'{}')}catch{}
let resources={wood:Math.max(0,Number(savedCity.resources?.wood??1200)),stone:Math.max(0,Number(savedCity.resources?.stone??1000)),gold:Math.max(0,Number(savedCity.resources?.gold??500))};
const levels={};
const resourceNodes={wood:document.querySelector('#wood'),stone:document.querySelector('#stone'),gold:document.querySelector('#gold')};
function refreshResources(){for(const key of Object.keys(resources))resourceNodes[key].textContent=resources[key].toLocaleString('en-US')}
function showBuilding(label){selectedBuilding=label;const level=levels[label]||1;const defenseNote=label==='Müdafiə qülləsi'?'<br>Hər səviyyə yüksəlişi qala müdafiəsinə 1 katapult əlavə edir. Hazırda: '+Math.max(0,level-1)+' katapult.':label.includes('qala divarı')?'<br>Divar səviyyəsi: '+level+'/10 · daha hündür daş divar və sıx mazğallar.':' ';info.innerHTML='<b>'+label+' · Səviyyə '+level+'</b>İnkişaf üçün düyməyə toxun. Növbəti səviyyə resurs tələb edir.'+defenseNote;}
renderer.domElement.addEventListener('pointerup',e=>{const rect=renderer.domElement.getBoundingClientRect();pointer.x=((e.clientX-rect.left)/rect.width)*2-1;pointer.y=-((e.clientY-rect.top)/rect.height)*2+1;raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(pickables,false);if(hits.length){const label=hits[0].object.userData.label||'Şəhər obyekti';showBuilding(label)}});
document.querySelector('#upgrade').addEventListener('click',()=>{if(!selectedBuilding){info.innerHTML='<b>Tikili seçilməyib</b>İnkişaf etdirmək üçün əvvəlcə şəhərdə binaya toxun.';return}const current=levels[selectedBuilding]||1;if(current>=10){info.innerHTML='<b>Maksimum səviyyə</b>'+selectedBuilding+' artıq 10-cu səviyyədədir.';return}const cost={wood:current*150,stone:current*100,gold:current*50};if(resources.wood<cost.wood||resources.stone<cost.stone||resources.gold<cost.gold){info.innerHTML='<b>Resurs çatışmır</b>Bu inkişaf üçün daha çox odun, daş və qızıl lazımdır.';return}resources.wood-=cost.wood;resources.stone-=cost.stone;resources.gold-=cost.gold;levels[selectedBuilding]=current+1;if(selectedBuilding==='Müdafiə qülləsi')refreshDefenseTowerModels();if(selectedBuilding.includes('qala divarı'))refreshWallModels();refreshResources();saveCity();info.innerHTML='<b>'+selectedBuilding+' · Səviyyə '+(current+1)+'</b>İnkişaf tamamlandı və yadda saxlanıldı. Xərc: '+cost.wood+' odun, '+cost.stone+' daş, '+cost.gold+' qızıl.'+(selectedBuilding==='Müdafiə qülləsi'?'<br>Qala müdafiəsi: '+current+' katapult hazırdır. Döyüş meydanında avtomatik tətbiq olunacaq.':'')});
refreshResources();
const territoryKey='tvq_territory_v1';
const worldKey='tvq_world_state_v1';
function getTerritoryIncome(){
 let outposts={},world={};
 try{outposts=JSON.parse(localStorage.getItem(territoryKey)||'{}')}catch{}
 try{world=JSON.parse(localStorage.getItem(worldKey)||'{}')}catch{}
 const rates={wood:0,stone:0,gold:0},owned=[];
 const sources=[
  {id:'village',name:'Sərhəd kəndi',wood:18,stone:4,gold:2},
  {id:'mine',name:'Dəmir mədəni',wood:4,stone:18,gold:5}
 ];
 for(const item of sources){if(outposts[item.id]?.captured){owned.push(item.name);for(const key of Object.keys(rates))rates[key]+=item[key]}}
 if(world.redFortress?.captured){owned.push('Qırmızı Qala');rates.wood+=20;rates.stone+=15;rates.gold+=5}
 const diplomacy=(()=>{try{return JSON.parse(localStorage.getItem('tvq_diplomacy_v1')||'{}')}catch{return {}}})();
 const borderRates={north:{wood:12,stone:5,gold:3},iron:{wood:5,stone:12,gold:4},sun:{wood:10,stone:7,gold:6}};
 const borderNames={north:'Şimal sərhəd məntəqəsi',iron:'Dəmir Tac sərhəd məntəqəsi',sun:'Günəş sərhəd məntəqəsi'};
 for(const [id,campaign] of Object.entries(diplomacy.borderCampaigns||{})){if(campaign?.captured&&borderRates[id]){owned.push(borderNames[id]);for(const key of Object.keys(rates))rates[key]+=borderRates[id][key]}}
 return {rates,owned};
}
function renderTerritorySummary(){
 let panel=document.querySelector('#territorySummary');
 if(!panel){panel=document.createElement('section');panel.id='territorySummary';panel.style.cssText='position:absolute;left:12px;top:112px;z-index:4;max-width:min(340px,calc(100vw - 24px));padding:10px 12px;border:1px solid #a87942;border-radius:10px;background:#1d2b25eF;color:#f4e6c8;font:12px/1.5 system-ui;pointer-events:auto';document.body.append(panel)}
 const data=getTerritoryIncome();
 panel.innerHTML='<b>🏴 Krallığın əraziləri</b><div>Nəzarətdə: '+(data.owned.length?data.owned.join(', '):'Hələ fəth edilmiş ərazi yoxdur')+'</div><div>Saatlıq gəlir: 🪵 '+data.rates.wood+' · 🪨 '+data.rates.stone+' · 🪙 '+data.rates.gold+'</div><small>Gəliri toplamaq üçün dünya xəritəsində fəth edilmiş məntəqəni seç.</small>';
}
renderTerritorySummary();
const army={infantry:0,spearman:0,archer:0,cavalry:0,knight:0,...(savedCity.army||{})};
function saveCity(){try{localStorage.setItem(SAVE_KEY,JSON.stringify({resources,army,levels}))}catch{}}
function collectOfflineTerritoryIncome(){
 let outposts={},world={};
 try{outposts=JSON.parse(localStorage.getItem(territoryKey)||'{}')}catch{}
 try{world=JSON.parse(localStorage.getItem(worldKey)||'{}')}catch{}
 const now=Date.now(),cap=24*60*60*1000;
 const sources=[
  {id:'village',rates:{wood:18,stone:4,gold:2},state:outposts.village},
  {id:'mine',rates:{wood:4,stone:18,gold:5},state:outposts.mine},
  {id:'redFortress',rates:{wood:20,stone:15,gold:5},state:world.redFortress}
 ];
 const diplomacy=(()=>{try{return JSON.parse(localStorage.getItem('tvq_diplomacy_v1')||'{}')}catch{return {}}})();
 const borderRates={north:{wood:12,stone:5,gold:3},iron:{wood:5,stone:12,gold:4},sun:{wood:10,stone:7,gold:6}};
 for(const [id,campaign] of Object.entries(diplomacy.borderCampaigns||{})){if(campaign?.captured&&borderRates[id])sources.push({id:'border_'+id,rates:borderRates[id],state:campaign})}
 let collected={wood:0,stone:0,gold:0},changed=false;
 for(const source of sources){
  const state=source.state;
  if(!state?.captured)continue;
  const last=Number(state.lastCollectedAt)||now;
  const elapsed=Math.min(cap,Math.max(0,now-last));
  for(const key of Object.keys(collected))collected[key]+=Math.floor(elapsed/3600000*source.rates[key]);
  state.lastCollectedAt=now;changed=true;
 }
 if(changed){
  for(const key of Object.keys(resources))resources[key]+=collected[key];
  try{localStorage.setItem(territoryKey,JSON.stringify(outposts));localStorage.setItem(worldKey,JSON.stringify(world));localStorage.setItem('tvq_diplomacy_v1',JSON.stringify(diplomacy))}catch{}
  refreshResources();saveCity();
  const panel=document.querySelector('#territorySummary');
  if(panel&&Object.values(collected).some(v=>v>0)){
   const note=document.createElement('div');note.textContent='Şəhərə qayıdış gəliri: '+collected.wood+' odun · '+collected.stone+' daş · '+collected.gold+' qızıl';note.style.cssText='margin-top:6px;color:#f0d18e';panel.append(note);
  }
 }
 return collected;
}
for(const key of Object.keys(army))army[key]=Math.max(0,Math.floor(Number(army[key])||0));
Object.assign(levels,savedCity.levels||{});
refreshDefenseTowerModels();
refreshWallModels();
const troopCosts={infantry:{wood:10,gold:5},spearman:{wood:15,stone:5},archer:{wood:10,stone:10},cavalry:{wood:20,gold:10},knight:{stone:20,gold:20}};
const troopTitles={infantry:'Piyada',spearman:'Nizəçi',archer:'Oxçu',cavalry:'Süvari',knight:'Cəngavər'};
const recruit=document.querySelector('#recruit');
document.querySelector('#recruitToggle').addEventListener('click',()=>recruit.classList.toggle('open'));
function updateArmyStatus(){document.querySelector('#armyStatus').textContent='Hazır qoşun: '+Object.entries(army).map(([k,v])=>troopTitles[k]+': '+v).join(' · ')}
const troopGroups=[];
const troopColors={infantry:0x9b493b,spearman:0x71808b,archer:0x527b4d,cavalry:0x987044,knight:0xb7b8bd};
function renderArmyInCity(){
 troopGroups.forEach(g=>scene.remove(g));troopGroups.length=0;
 const entries=Object.entries(army).filter(([,count])=>count>0);
 entries.forEach(([type,count],i)=>{
  const group=new THREE.Group();group.position.set(-35+i*17,0,-9);
  const visible=Math.min(5,Math.max(1,Math.ceil(count/20)));
  for(let n=0;n<visible;n++){
   const soldier=new THREE.Group();
   const body=new THREE.Mesh(new THREE.CylinderGeometry(.65,.85,2.2,7),mat(troopColors[type],.62));body.position.y=2.5;soldier.add(body);
   const head=new THREE.Mesh(new THREE.SphereGeometry(.55,8,7),mat(0xb98b68));head.position.y=4.05;soldier.add(head);
   const helmet=new THREE.Mesh(new THREE.ConeGeometry(.65,.8,7),metal);helmet.position.y=4.7;soldier.add(helmet);
   if(type==='spearman'||type==='archer'){const weapon=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,3.7,5),wood);weapon.position.set(.9,3,0);weapon.rotation.z=-.15;soldier.add(weapon)}
   if(type==='cavalry'||type==='knight'){const horse=new THREE.Mesh(new THREE.BoxGeometry(2.3,1.5,1.1),mat(0x594333));horse.position.set(0,1.1,-1);soldier.add(horse)}
   soldier.position.set((n%3)*2.3,0,Math.floor(n/3)*2.5);group.add(soldier);
  }
  scene.add(group);troopGroups.push(group);
 });
}

document.querySelector('#train').addEventListener('click',()=>{
 const type=document.querySelector('#troopType').value;
 const count=Math.max(1,Math.min(500,Math.floor(Number(document.querySelector('#troopCount').value)||1)));
 const cost=troopCosts[type];
 const totalCost={wood:(cost.wood||0)*count,stone:(cost.stone||0)*count,gold:(cost.gold||0)*count};
 if(Object.keys(totalCost).some(k=>resources[k]<totalCost[k])){document.querySelector('#armyStatus').textContent='Resurs çatışmır — '+count+' '+troopTitles[type]+' hazırlamaq mümkün deyil.';return}
 for(const key of Object.keys(resources))resources[key]-=totalCost[key];
 army[type]+=count;refreshResources();saveCity();updateArmyStatus();renderArmyInCity();
});
document.querySelector('#sendArmy').addEventListener('click',()=>{
 if(Object.values(army).every(v=>v===0)){document.querySelector('#armyStatus').textContent='Əvvəlcə kazarmada qoşun hazırla.';return}
 const params=new URLSearchParams();for(const [type,count] of Object.entries(army))params.set(type,String(count));
 location.href='./world-map.html?'+params.toString();
});
updateArmyStatus();
renderArmyInCity();
collectOfflineTerritoryIncome();
saveCity();
try{const world=JSON.parse(localStorage.getItem('tvq_world_state_v1')||'{}');if(world.redFortress){info.innerHTML=world.redFortress.captured?'<b>🏆 Qırmızı Qala fəth edildi!</b>Qələbə tarixi: '+new Date(world.redFortress.updatedAt).toLocaleString('az-AZ')+'.':'<b>⚔ Hücum başa çatdı</b>Düşmən qalası müdafiə olunur. Sağ qalan düşmən: '+world.redFortress.remainingDefenders+'. Ordunu yenidən hazırlaya bilərsən.';}}catch{}
document.querySelector('#home').addEventListener('click',()=>{camera.position.set(150,165,175);controls.target.set(0,10,12);controls.update()});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.5))});
const patrolClock=new THREE.Clock();
renderer.setAnimationLoop(()=>{const t=patrolClock.getElapsedTime();patrols.forEach((p,i)=>{p.position.x=p.userData.baseX+Math.sin(t*.7+i)*1.4;p.rotation.y=Math.sin(t*.55+i)*.22});controls.update();renderer.render(scene,camera)});
