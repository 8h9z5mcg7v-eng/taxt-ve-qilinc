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
function tower(x,z){cylinder('Müdafiə qülləsi',x,0,z,7,7,17,stone,12);const cap=new THREE.Mesh(new THREE.ConeGeometry(8,8,12),roof);cap.position.set(x,21,z);cap.castShadow=true;cap.userData.label='Müdafiə qülləsi';pickables.push(cap);scene.add(cap)}
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
box('Şimal qala divarı',0,0,-wallZ,112,13,7,stone);
box('Cənub qala divarı',0,0,wallZ,112,13,7,stone);
box('Qərb qala divarı',-wallX,0,0,7,13,105,stone);
box('Şərq qala divarı',wallX,0,0,7,13,105,stone);
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
let resources={wood:1200,stone:1000,gold:500};
const levels={};
const resourceNodes={wood:document.querySelector('#wood'),stone:document.querySelector('#stone'),gold:document.querySelector('#gold')};
function refreshResources(){for(const key of Object.keys(resources))resourceNodes[key].textContent=resources[key].toLocaleString('en-US')}
function showBuilding(label){selectedBuilding=label;const level=levels[label]||1;info.innerHTML='<b>'+label+' · Səviyyə '+level+'</b>İnkişaf üçün düyməyə toxun. Növbəti səviyyə resurs tələb edir.';}
renderer.domElement.addEventListener('pointerup',e=>{const rect=renderer.domElement.getBoundingClientRect();pointer.x=((e.clientX-rect.left)/rect.width)*2-1;pointer.y=-((e.clientY-rect.top)/rect.height)*2+1;raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(pickables,false);if(hits.length){const label=hits[0].object.userData.label||'Şəhər obyekti';showBuilding(label)}});
document.querySelector('#upgrade').addEventListener('click',()=>{if(!selectedBuilding){info.innerHTML='<b>Tikili seçilməyib</b>İnkişaf etdirmək üçün əvvəlcə şəhərdə binaya toxun.';return}const current=levels[selectedBuilding]||1;const cost={wood:current*150,stone:current*100,gold:current*50};if(resources.wood<cost.wood||resources.stone<cost.stone||resources.gold<cost.gold){info.innerHTML='<b>Resurs çatışmır</b>Bu inkişaf üçün daha çox odun, daş və qızıl lazımdır.';return}resources.wood-=cost.wood;resources.stone-=cost.stone;resources.gold-=cost.gold;levels[selectedBuilding]=current+1;refreshResources();info.innerHTML='<b>'+selectedBuilding+' · Səviyyə '+(current+1)+'</b>İnkişaf tamamlandı. Xərc: '+cost.wood+' odun, '+cost.stone+' daş, '+cost.gold+' qızıl.'});
refreshResources();
const army={infantry:0,spearman:0,archer:0,cavalry:0,knight:0};
const troopCosts={infantry:{wood:10,gold:5},spearman:{wood:15,stone:5},archer:{wood:10,stone:10},cavalry:{wood:20,gold:10},knight:{stone:20,gold:20}};
const troopTitles={infantry:'Piyada',spearman:'Nizəçi',archer:'Oxçu',cavalry:'Süvari',knight:'Cəngavər'};
const recruit=document.querySelector('#recruit');
document.querySelector('#recruitToggle').addEventListener('click',()=>recruit.classList.toggle('open'));
function updateArmyStatus(){document.querySelector('#armyStatus').textContent='Hazır qoşun: '+Object.entries(army).map(([k,v])=>troopTitles[k]+': '+v).join(' · ')}
document.querySelector('#train').addEventListener('click',()=>{
 const type=document.querySelector('#troopType').value;
 const count=Math.max(1,Math.min(500,Math.floor(Number(document.querySelector('#troopCount').value)||1)));
 const cost=troopCosts[type];
 const totalCost={wood:(cost.wood||0)*count,stone:(cost.stone||0)*count,gold:(cost.gold||0)*count};
 if(Object.keys(totalCost).some(k=>resources[k]<totalCost[k])){document.querySelector('#armyStatus').textContent='Resurs çatışmır — '+count+' '+troopTitles[type]+' hazırlamaq mümkün deyil.';return}
 for(const key of Object.keys(resources))resources[key]-=totalCost[key];
 army[type]+=count;refreshResources();updateArmyStatus();
});
document.querySelector('#sendArmy').addEventListener('click',()=>{
 if(Object.values(army).every(v=>v===0)){document.querySelector('#armyStatus').textContent='Əvvəlcə kazarmada qoşun hazırla.';return}
 const params=new URLSearchParams();for(const [type,count] of Object.entries(army))params.set(type,String(count));
 location.href='./battle.html?'+params.toString();
});
updateArmyStatus();
document.querySelector('#home').addEventListener('click',()=>{camera.position.set(150,165,175);controls.target.set(0,10,12);controls.update()});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.5))});
const patrolClock=new THREE.Clock();
renderer.setAnimationLoop(()=>{const t=patrolClock.getElapsedTime();patrols.forEach((p,i)=>{p.position.x=p.userData.baseX+Math.sin(t*.7+i)*1.4;p.rotation.y=Math.sin(t*.55+i)*.22});controls.update();renderer.render(scene,camera)});
