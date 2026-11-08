import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { normalizeTrainingQueue, createTrainingJob, completeTrainingQueue, trainingDurationMs } from './training.js';
import { normalizeWallRepair, getWallRepairQuote, getWallDamageVisuals } from './wall-repair.js';

// Recover an interrupted border-army dispatch before this page reads city or battle state.
const borderDispatchJournalKey='tvq_pending_border_dispatch_v1';
function recoverBorderDispatch(){
 const raw=localStorage.getItem(borderDispatchJournalKey);
 if(!raw)return;
 const journal=JSON.parse(raw);
 if(!journal?.cityAfter||!journal?.active?.battleId||!journal?.active?.url||!journal?.active?.kingdom)throw new Error('Sərhəd yürüşünün bərpa qeydi yanlışdır.');
 localStorage.setItem('taxt-ve-qilinc-city-v1',JSON.stringify(journal.cityAfter));
 localStorage.setItem('tvq_active_border_battle_v1',JSON.stringify(journal.active));
 localStorage.setItem('tvq_border_battle_kingdom',journal.active.kingdom);
 localStorage.removeItem(borderDispatchJournalKey);
}
try{recoverBorderDispatch()}catch(error){console.error('Sərhəd yürüşü bərpa edilmədi:',error)}

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
function makeGroundTexture(){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;
 const ctx=canvas.getContext('2d');const pixels=ctx.createImageData(512,512);
 let seed=73129;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 for(let i=0;i<pixels.data.length;i+=4){
  const n=(random()-.5)*24,base=91+n;
  pixels.data[i]=Math.max(0,Math.min(255,base*.92));
  pixels.data[i+1]=Math.max(0,Math.min(255,base*1.08));
  pixels.data[i+2]=Math.max(0,Math.min(255,base*.72));
  pixels.data[i+3]=255;
 }
 ctx.putImageData(pixels,0,0);
 for(let i=0;i<1800;i++){
  const x=random()*512,y=random()*512,r=.4+random()*2.8;
  ctx.fillStyle=random()>.5?'rgba(174,157,116,.16)':'rgba(35,48,32,.18)';
  ctx.beginPath();ctx.ellipse(x,y,r,r*(.35+random()*.7),random()*Math.PI,0,Math.PI*2);ctx.fill();
 }
 const texture=new THREE.CanvasTexture(canvas);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
 texture.repeat.set(24,24);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
 return texture;
}
const groundMaterial=new THREE.MeshStandardMaterial({map:makeGroundTexture(),roughness:1});
const ground=new THREE.Mesh(new THREE.PlaneGeometry(330,330,1,1),groundMaterial);ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
function box(name,x,y,z,w,h,d,material,select=true){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y+h/2,z);m.castShadow=true;m.receiveShadow=true;m.userData.label=name;if(select)pickables.push(m);scene.add(m);return m}
const pickables=[];
function cylinder(name,x,y,z,r1,r2,h,material,segments=8){const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,segments),material);m.position.set(x,y+h/2,z);m.castShadow=true;m.receiveShadow=true;m.userData.label=name;pickables.push(m);scene.add(m);return m}
function roofHouse(name,x,z,w,d,h,wall=plaster,top=roof){
 const group=new THREE.Group();group.position.set(x,0,z);group.userData.label=name;scene.add(group);
 const add=(geometry,material,px,py,pz,rz=0,ry=0)=>{
  const mesh=new THREE.Mesh(geometry,material);mesh.position.set(px,py,pz);mesh.rotation.set(0,ry,rz);
  mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.label=name;group.add(mesh);pickables.push(mesh);return mesh;
 };
 const foundation=mat(0x69675d),timber=mat(0x493322),woodLight=mat(0x886443),glass=new THREE.MeshStandardMaterial({color:0x344a4c,roughness:.24,metalness:.12,emissive:0x18292b});
 add(new THREE.BoxGeometry(w+.9,.8,d+.9),foundation,0,.4,0);
 add(new THREE.BoxGeometry(w,h,d),wall,0,.8+h/2,0);
 const roofRise=Math.max(3.4,Math.min(6.5,w*.27)),angle=Math.atan2(roofRise,w/2),slope=Math.hypot(w/2,roofRise);
 add(new THREE.BoxGeometry(slope+.9,.65,d+1.5),top,-w/4,.8+h+roofRise/2,0,-angle);
 add(new THREE.BoxGeometry(slope+.9,.65,d+1.5),top,w/4,.8+h+roofRise/2,0,angle);
 // Triangular gable ends, with exposed timber framing.
 for(const side of [-1,1]){
  const shape=new THREE.Shape();shape.moveTo(-w/2,0);shape.lineTo(w/2,0);shape.lineTo(0,roofRise);shape.closePath();
  const gable=new THREE.Mesh(new THREE.ShapeGeometry(shape),wall);gable.position.set(0,.8+h,side*(d/2-.08));gable.castShadow=true;gable.receiveShadow=true;gable.userData.label=name;group.add(gable);pickables.push(gable);
  add(new THREE.BoxGeometry(.42,roofRise+.6,.42),timber,-w/2,.8+h+roofRise/2,side*(d/2+.04));
  add(new THREE.BoxGeometry(.42,roofRise+.6,.42),timber,w/2,.8+h+roofRise/2,side*(d/2+.04));
  add(new THREE.BoxGeometry(w+.5,.42,.42),timber,0,.8+h,side*(d/2+.04));
  add(new THREE.BoxGeometry(.34,roofRise,.34),timber,0,.8+h+roofRise/2,side*(d/2+.05));
 }
 // Roof ridge and eaves make each building read as a crafted medieval structure.
 add(new THREE.CylinderGeometry(.22,.22,d+1.8,8),woodLight,0,.8+h+roofRise,0,Math.PI/2);
 for(const side of [-1,1]){
  add(new THREE.BoxGeometry(.38,.4,d+1.6),timber,side*(w/2+.12),.8+h,0);
 }
 // Door, stone threshold and iron-bound door leaf.
 add(new THREE.BoxGeometry(w*.22,h*.43,.2),timber,0,.8+h*.215,d/2+.12);
 add(new THREE.BoxGeometry(w*.16,h*.37,.12),woodLight,0,.8+h*.185,d/2+.24);
 add(new THREE.BoxGeometry(w*.25,.35,.65),foundation,0,.3,d/2+.35);
 // Recessed-looking windows with dark frames and warm glazing.
 const windowCount=Math.max(1,Math.floor(w/7));
 for(let i=0;i<windowCount;i++){
  const wx=(i-(windowCount-1)/2)*Math.min(6,w*.55);
  for(const side of [-1,1]){
   const wz=side*(d/2+.13);
   add(new THREE.BoxGeometry(1.45,2.05,.16),timber,wx,.8+h*.62,wz);
   add(new THREE.BoxGeometry(.86,1.38,.08),glass,wx,.8+h*.62,wz+Math.sign(side)*.11);
   add(new THREE.BoxGeometry(1.8,.18,.28),woodLight,wx,.8+h*.62+1.12,wz);
   add(new THREE.BoxGeometry(.18,2.2,.28),woodLight,wx-0.86,.8+h*.62,wz);
   add(new THREE.BoxGeometry(.18,2.2,.28),woodLight,wx+0.86,.8+h*.62,wz);
  }
 }
 // Visible roof tile courses: restrained rows, not a single smooth primitive.
 for(let row=0;row<3;row++){
  const offset=(row-1)*.22;
  for(const side of [-1,1]){
   const tileRail=add(new THREE.BoxGeometry(.13,.12,d+.85),woodLight,side*(w*.18+row*.01),.8+h+roofRise*(.72-row*.2),offset,side*angle);
   tileRail.material=top;
  }
 }
 // Small chimney with a dark opening and stone cap.
 if(h>=8){
  const chimneyX=w*.28;
  add(new THREE.BoxGeometry(1.45,3.5,1.45),foundation,chimneyX,.8+h+roofRise*.72,-d*.18);
  add(new THREE.BoxGeometry(1.7,.35,1.7),stoneDark,chimneyX,.8+h+roofRise*.72+1.9,-d*.18);
  add(new THREE.BoxGeometry(.55,.08,.08),dark,chimneyX,.8+h+roofRise*.72+2.1,-d*.18-.74);
 }
 return group;
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
 // The roof is removed as the tower becomes a weapon platform. Each level
 // after the first adds one visible catapult, matching the battle resolver.
 for(let i=0;i<9;i++){
  const angle=i*Math.PI*2/9,weapon=new THREE.Group();
  const base=new THREE.Mesh(new THREE.BoxGeometry(1.55,.55,1.35),wood);base.position.y=20.9;base.castShadow=true;weapon.add(base);
  for(const side of [-1,1]){const support=new THREE.Mesh(new THREE.BoxGeometry(.22,1.9,.24),wood);support.position.set(side*.48,22,0);support.castShadow=true;weapon.add(support)}
  const axle=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,1.25,8),metal);axle.rotation.z=Math.PI/2;axle.position.y=22.5;weapon.add(axle);
  const arm=new THREE.Mesh(new THREE.BoxGeometry(.28,3.1,.34),wood);arm.position.set(0,23.1,0);arm.rotation.z=-.12;arm.castShadow=true;weapon.add(arm);
  const counterweight=new THREE.Mesh(new THREE.BoxGeometry(.8,.65,.7),stoneDark);counterweight.position.set(0,21.9,-.55);weapon.add(counterweight);
  const sling=new THREE.Mesh(new THREE.SphereGeometry(.48,9,8),stoneDark);sling.position.set(0,24.9,.12);sling.castShadow=true;weapon.add(sling);
  weapon.position.set(Math.cos(angle)*5.45,0,Math.sin(angle)*5.45);weapon.rotation.y=-angle;
  weapon.visible=false;group.add(weapon);emplacements.push(weapon);
 }
 group.userData.merlons=merlons;group.userData.emplacements=emplacements;group.userData.cap=cap;
 scene.add(group);defenseTowerGroups.push(group);return group;
}
function refreshDefenseTowerModels(){
 for(const group of defenseTowerGroups){
  const level=Math.max(1,Math.min(10,Math.floor(Number(levels['Müdafiə qülləsi'])||1)));
  const height=1+(level-1)*.075;
  group.scale.set(1,height,1);
  group.userData.cap.visible=level===1;
  group.userData.cap.scale.set(1,1+(level-1)*.045,1);
  group.userData.merlons.forEach((block,i)=>{block.visible=i<Math.min(12,6+level);});
  group.userData.emplacements.forEach((weapon,i)=>{weapon.visible=i<level-1;});
 }
}
// Textured-looking terrain patches, paths and crop plots.
for(let i=0;i<36;i++){const x=((i*47)%260)-130,z=((i*83)%260)-130;if(Math.abs(x)<62&&Math.abs(z)<62)continue;const patch=new THREE.Mesh(new THREE.CircleGeometry(3+(i%4),7),i%2?grass2:grass);patch.rotation.x=-Math.PI/2;patch.position.set(x,.015,z);scene.add(patch)}
const roadmat=mat(0x9a8968);const road=new THREE.Mesh(new THREE.PlaneGeometry(13,120),roadmat);road.rotation.x=-Math.PI/2;road.position.set(0,.03,93);scene.add(road);
const cross=new THREE.Mesh(new THREE.PlaneGeometry(120,11),roadmat);cross.rotation.x=-Math.PI/2;cross.position.set(0,.035,58);scene.add(cross);
// Worn stone footpaths connect the keep to the inner workshops and gate.
const pathMat=mat(0x81765f);
function footpath(x,z,width,length,rotation=0){
 const path=new THREE.Mesh(new THREE.PlaneGeometry(width,length),pathMat);
 path.rotation.x=-Math.PI/2;path.rotation.z=rotation;path.position.set(x,.045,z);
 path.receiveShadow=true;scene.add(path);
 for(let i=0;i<Math.floor(length/5);i++){
  const seam=new THREE.Mesh(new THREE.BoxGeometry(width*.92,.035,.12),stoneDark);
  seam.position.set(x,.07,z-length/2+2.5+i*5);seam.rotation.y=rotation;scene.add(seam);
 }
}
footpath(-23,-13,5,34,.42);footpath(23,-13,5,34,-.42);
footpath(-22,29,5,32,-.4);footpath(22,29,5,32,.4);
footpath(0,39,7,24,0);
// Main keep: layered stonework, four defensive towers and a fortified entrance.
box('Baş qala',0,0,0,34,30,32,stone);
box('Baş qala',0,30,0,23,12,22,stoneDark);
box('Qala kürsüsü',0,1.1,0,36,2.2,34,stoneDark,false);
// Recessed front entrance with timber gate, iron braces and a stone arch.
box('Baş qala giriş qapısı',0,1.2,16.35,8.8,2.4,1.1,stoneDark);
box('Baş qala giriş qapısı',0,6.4,16.65,7.1,10.4,.8,wood);
for(let side=-1;side<=1;side+=2){
 box('Qala qapısının dəmir bəndi',side*2.35,6.4,17.1,.28,9.4,.18,metal);
 box('Qala qapısının dəmir bəndi',side*1.2,6.4,17.12,.18,9.4,.18,metal);
}
box('Qala qapısının üst tirı',0,11.5,17,8.2,.65,1.2,stoneDark,false);
for(const y of [9.5,13.5,24.5,28.5]){
 for(const x of [-8.5,8.5]){
  box('Baş qala pəncərəsi',x,y,16.18,2.5,3.8,.45,stoneDark,false);
  box('Baş qala pəncərəsi',x,y,16.43,1.45,2.7,.2,glass,false);
  box('Baş qala pəncərə çərçivəsi',x,y-1.65,16.56,2.9,.28,.22,woodLight,false);
 }
}
for(let i=-1;i<=1;i+=2){
 box('Qala mazğalı',i*9,40,0,2,8,2,stone);
 box('Qala mazğalı',0,40,i*9,2,8,2,stone);
}
// Four round corner towers give the keep a readable fortress silhouette.
for(const [tx,tz] of [[-14,-13],[14,-13],[-14,13],[14,13]]){
 const tower=cylinder('Baş qalanın müdafiə qülləsi',tx,0,tz,5.7,6.3,47,stone,12);
 cylinder('Qüllə üst meydançası',tx,45.5,tz,6.1,6.1,2.8,stoneDark,12);
 cylinder('Qüllə parapeti',tx,48.2,tz,5.9,5.9,1.1,stone,12);
 const cap=new THREE.Mesh(new THREE.ConeGeometry(7.3,10,12),roof);
 cap.position.set(tx,54,tz);cap.castShadow=true;cap.userData.label='Baş qalanın müdafiə qülləsi';pickables.push(cap);scene.add(cap);
 for(let n=0;n<10;n++){
  const a=n*Math.PI/5;
  const merlon=box('Qüllə mazğalı',tx+Math.cos(a)*5.65,49.2,tz+Math.sin(a)*5.65,1.05,1.7,1.05,stoneDark,false);
  merlon.rotation.y=a;
 }
 // Narrow arrow slits on the visible faces.
 box('Qüllə ox mazğalı',tx,27,tz+5.82,.48,4,.2,dark,false);
 box('Qüllə ox mazğalı',tx+5.82,27,tz,.2,4,.48,dark,false);
}
const keepRoof=new THREE.Mesh(new THREE.ConeGeometry(18,13,4),roof);keepRoof.position.set(0,51,0);keepRoof.rotation.y=Math.PI/4;keepRoof.castShadow=true;keepRoof.userData.label='Baş qala';pickables.push(keepRoof);scene.add(keepRoof);
const wallZ=49,wallX=49;
const wallSegments=[
 {label:'Şimal qala divarı',x:0,z:-wallZ,w:112,h:13,d:7,axis:'x'},
 {label:'Cənub qala divarı',x:0,z:wallZ,w:112,h:13,d:7,axis:'x'},
 {label:'Qərb qala divarı',x:-wallX,z:0,w:7,h:13,d:105,axis:'z'},
 {label:'Şərq qala divarı',x:wallX,z:0,w:7,h:13,d:105,axis:'z'}
];
const wallBattlements=[];
const wallDamageDetails=[];
const crackMaterial=new THREE.MeshStandardMaterial({color:0x211d19,roughness:1,transparent:true,opacity:.9});
const rubbleMaterial=new THREE.MeshStandardMaterial({color:0x77736a,roughness:1});
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
 const cracks=[],rubble=[];
 const wallLength=wall.axis==='x'?wall.w:wall.d;
 for(let k=0;k<5;k++){
  const along=-wallLength/2+18+k*wallLength/7;
  const x=wall.axis==='x'?along:wall.x+(wall.x<0?3.56:-3.56);
  const z=wall.axis==='x'?wall.z+(wall.z<0?3.56:-3.56):along;
  const crack=new THREE.Mesh(new THREE.BoxGeometry(wall.axis==='x'?1.25:.13,5.5,wall.axis==='x'?.13:1.25),crackMaterial);
  crack.position.set(x,6.2,z);crack.rotation.z=(k%2?-.24:.2);crack.visible=false;scene.add(crack);cracks.push(crack);
 }
 for(let k=0;k<8;k++){
  const along=-wallLength/2+12+k*wallLength/9;
  const x=wall.axis==='x'?along:wall.x+(wall.x<0?5:-5);
  const z=wall.axis==='x'?wall.z+(wall.z<0?5:-5):along;
  const stoneChunk=new THREE.Mesh(new THREE.DodecahedronGeometry(1.1+(k%3)*.35,0),rubbleMaterial);
  stoneChunk.position.set(x,.65+(k%2)*.2,z);stoneChunk.rotation.set(k*.7,k*.4,k*.25);stoneChunk.visible=false;stoneChunk.castShadow=true;scene.add(stoneChunk);rubble.push(stoneChunk);
 }
 const breachMaterial=mat(0x292923,.98);
 const breach=new THREE.Mesh(new THREE.BoxGeometry(wall.axis==='x'?15:.5,9,wall.axis==='x'?.5:15),breachMaterial);
 breach.position.set(wall.axis==='x'?0:wall.x+(wall.x<0?3.58:-3.58),5.2,wall.axis==='x'?wall.z+(wall.z<0?3.58:-3.58):0);
 breach.visible=false;breach.castShadow=true;scene.add(breach);
 wallBattlements.push({label:wall.label,base,crenels,cracks,rubble,breach});
}
function refreshWallModels(){
 const damage=Math.max(0,Math.min(100,Number(wallDamage)||0));
 for(const wall of wallBattlements){
  const level=Math.max(1,Math.min(10,Math.floor(Number(levels[wall.label])||1)));
  const scale=1+(level-1)*.055;
  wall.base.scale.y=scale;wall.base.position.y=13*(scale-1)/2;
  const visuals=getWallDamageVisuals(damage,wall.crenels.length);
  wall.crenels.forEach((block,i)=>{
   const order=(i*7)%wall.crenels.length;
   block.visible=i<Math.min(wall.crenels.length,8+level*2)&&order>=visuals.fallenCrenels;
   block.position.y=13*scale+1.5;
  });
  wall.cracks.forEach((crack,i)=>{crack.visible=i<visuals.crackCount;});
  wall.rubble.forEach((piece,i)=>{piece.visible=i<visuals.rubbleCount;});
  wall.breach.visible=visuals.breachVisible;
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
for(let i=0;i<18;i++){
 const x=-120+(i%6)*12,z=112+Math.floor(i/6)*9;
 box('Əkin sahəsi',x,.1,z,7,.2,5,i%2?grass2:roadmat,false);
 // Furrows and short timber edging make the outer fields read as cultivated plots.
 for(let row=0;row<3;row++){
  const furrow=new THREE.Mesh(new THREE.BoxGeometry(5.8,.08,.16),mat(0x746044));
  furrow.position.set(x,.25,z-1.25+row*1.25);furrow.receiveShadow=true;scene.add(furrow);
 }
 for(const side of [-1,1]){
  const fence=new THREE.Mesh(new THREE.BoxGeometry(.22,.9,5.6),wood);
  fence.position.set(x+side*3.6,.55,z);fence.castShadow=true;scene.add(fence);
 }
}
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
 const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.48*scale,.82*scale,5.5*scale,7),wood);trunk.position.set(x,2.75*scale,z);trunk.castShadow=true;trunk.receiveShadow=true;scene.add(trunk);
 const branchMat=mat(0x59412c);
 for(const side of [-1,1]){
  const branch=new THREE.Mesh(new THREE.CylinderGeometry(.16*scale,.24*scale,2.8*scale,6),branchMat);
  branch.position.set(side*1.05*scale,4.1*scale,z);branch.rotation.z=side*.68;branch.castShadow=true;scene.add(branch);
 }
 // Layered rounded foliage gives the treeline a fuller silhouette than stacked cones.
 const foliage=[[-1.35,5.8,.1,2.8], [1.25,6.2,-.35,2.7], [0,7.5,0,3.2], [-.35,9.2,.25,2.45], [1.1,8.6,.4,2.2]];
 foliage.forEach(([ox,y,oz,r],i)=>{
  const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(r*scale,1),i%2?grass:grass2);
  crown.position.set(x+ox*scale,y*scale,z+oz*scale);
  crown.scale.set(1,.9+(i%2)*.12,1);
  crown.castShadow=true;crown.receiveShadow=true;scene.add(crown);
 });
}
for(let i=0;i<24;i++){const x=-125+(i%8)*15,z=-115+Math.floor(i/8)*17;if(Math.abs(x)<65&&Math.abs(z)<65)continue;tree(x,z,.75+(i%3)*.15)}
const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,10,12);controls.enableDamping=true;controls.dampingFactor=.07;controls.maxPolarAngle=Math.PI*.48;controls.minDistance=75;controls.maxDistance=330;
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),info=document.querySelector('#info');
let selectedBuilding='';
const SAVE_KEY='taxt-ve-qilinc-city-v1';
let savedCity={};
try{savedCity=JSON.parse(localStorage.getItem(SAVE_KEY)||'{}')}catch{}
let resources={wood:Math.max(0,Number(savedCity.resources?.wood??1200)),stone:Math.max(0,Number(savedCity.resources?.stone??1000)),gold:Math.max(0,Number(savedCity.resources?.gold??500))};
const levels={...(savedCity.levels||{})};
const wounded={infantry:0,spearman:0,archer:0,cavalry:0,knight:0,...(savedCity.wounded||{})};
let treatmentEndsAt=Math.max(0,Number(savedCity.treatmentEndsAt)||0);
let trainingQueue=normalizeTrainingQueue(savedCity.trainingQueue);
let wallDamage=Math.max(0,Math.min(100,Math.floor(Number(savedCity.wallDamage)||0)));
let wallRepairEndsAt=Math.max(0,Number(savedCity.wallRepairEndsAt)||0);
let wallRepairStartedAt=Math.max(0,Number(savedCity.wallRepairStartedAt)||0);
let wallRepairInitialDamage=Math.max(0,Math.min(100,Math.floor(Number(savedCity.wallRepairInitialDamage)||0)));
function troopTitlesSafe(type){return ['infantry','spearman','archer','cavalry','knight'].includes(type)}
const resourceNodes={wood:document.querySelector('#wood'),stone:document.querySelector('#stone'),gold:document.querySelector('#gold')};
function refreshResources(){for(const key of Object.keys(resources))resourceNodes[key].textContent=resources[key].toLocaleString('en-US')}
function showBuilding(label){selectedBuilding=label;const level=levels[label]||1;const defenseNote=label==='Müdafiə qülləsi'?'<br>Hər səviyyə yüksəlişi 1 katapult əlavə edir. Hazırda: '+Math.max(0,level-1)+' katapult · '+(level===1?'Dam örtüyü qorunur':'Döyüş platforması açıqdır')+'.':label.includes('qala divarı')?'<br>Divar səviyyəsi: '+level+'/10 · daha hündür daş divar və sıx mazğallar.':' ';info.innerHTML='<b>'+label+' · Səviyyə '+level+'</b>İnkişaf üçün düyməyə toxun. Növbəti səviyyə resurs tələb edir.'+defenseNote;}
renderer.domElement.addEventListener('pointerup',e=>{const rect=renderer.domElement.getBoundingClientRect();pointer.x=((e.clientX-rect.left)/rect.width)*2-1;pointer.y=-((e.clientY-rect.top)/rect.height)*2+1;raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(pickables,false);if(hits.length){const label=hits[0].object.userData.label||'Şəhər obyekti';showBuilding(label)}});
document.querySelector('#upgrade').addEventListener('click',()=>withCityEconomyLock(()=>{if(!selectedBuilding){info.innerHTML='<b>Tikili seçilməyib</b>İnkişaf etdirmək üçün əvvəlcə şəhərdə binaya toxun.';return}const current=levels[selectedBuilding]||1;if(current>=10){info.innerHTML='<b>Maksimum səviyyə</b>'+selectedBuilding+' artıq 10-cu səviyyədədir.';return}const cost={wood:current*150,stone:current*100,gold:current*50};if(resources.wood<cost.wood||resources.stone<cost.stone||resources.gold<cost.gold){info.innerHTML='<b>Resurs çatışmır</b>Bu inkişaf üçün daha çox odun, daş və qızıl lazımdır.';return}resources.wood-=cost.wood;resources.stone-=cost.stone;resources.gold-=cost.gold;levels[selectedBuilding]=current+1;if(selectedBuilding==='Müdafiə qülləsi')refreshDefenseTowerModels();if(selectedBuilding.includes('qala divarı'))refreshWallModels();refreshResources();saveCity();info.innerHTML='<b>'+selectedBuilding+' · Səviyyə '+(current+1)+'</b>İnkişaf tamamlandı və yadda saxlanıldı. Xərc: '+cost.wood+' odun, '+cost.stone+' daş, '+cost.gold+' qızıl.'+(selectedBuilding==='Müdafiə qülləsi'?'<br>Qala müdafiəsi: '+current+' katapult hazırdır. Döyüş meydanında avtomatik tətbiq olunacaq.':'')}));
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
function saveCity(){
 try{
  let latest={};try{latest=JSON.parse(localStorage.getItem(SAVE_KEY)||'{}')}catch{}
  const mergeCounters=(base,local,remote)=>{
   const result={...(remote||{})};
   for(const key of new Set([...Object.keys(base||{}),...Object.keys(local||{}),...Object.keys(remote||{})])){
    const before=Number(base?.[key])||0;
    const current=Number(local?.[key])||0;
    const stored=Number(remote?.[key])||0;
    result[key]=Math.max(0,Math.floor(stored+(current-before)));
   }
   return result;
  };
  const baseResources=savedCity.resources||{wood:1200,stone:1000,gold:500};
  const mergedResources=mergeCounters(baseResources,resources,latest.resources||baseResources);
  const mergedArmy=mergeCounters(savedCity.army||{},army,latest.army||savedCity.army||{});
  const mergedWounded=mergeCounters(savedCity.wounded||{},wounded,latest.wounded||savedCity.wounded||{});
  const mergedLevels={...(latest.levels||savedCity.levels||{})};
  for(const key of new Set([...Object.keys(savedCity.levels||{}),...Object.keys(levels)])){
   const before=Number(savedCity.levels?.[key])||1;
   const current=Number(levels[key])||1;
   const stored=Number(latest.levels?.[key]??before)||1;
   if(current!==before)mergedLevels[key]=Math.max(1,Math.min(10,stored+(current-before)));
   else if(latest.levels?.[key]!==undefined)mergedLevels[key]=stored;
  }
  const baseTreatment=Number(savedCity.treatmentEndsAt)||0;
  const localTreatment=Number(treatmentEndsAt)||0;
  const remoteTreatment=Number(latest.treatmentEndsAt??baseTreatment)||0;
  const mergedTreatment=localTreatment!==baseTreatment?localTreatment:remoteTreatment;
  for(const key of Object.keys(resources))resources[key]=mergedResources[key]??0;
  for(const key of Object.keys(army))army[key]=mergedArmy[key]??0;
  for(const key of Object.keys(wounded))wounded[key]=mergedWounded[key]??0;
  for(const key of Object.keys(levels))levels[key]=mergedLevels[key]??levels[key];
  treatmentEndsAt=mergedTreatment;
  const next={...savedCity,...latest,resources:mergedResources,army:mergedArmy,levels:mergedLevels,wounded:mergedWounded,treatmentEndsAt,trainingQueue,wallDamage,wallRepairStartedAt,wallRepairEndsAt,wallRepairInitialDamage};
  localStorage.setItem(SAVE_KEY,JSON.stringify(next));
  savedCity=next;
  return true;
 }catch{return false}
}
async function withCityEconomyLock(action){
 const run=async()=>{
  try{
   const latest=JSON.parse(localStorage.getItem(SAVE_KEY)||'{}');
   savedCity=latest;
   for(const key of Object.keys(resources))resources[key]=Math.max(0,Math.floor(Number(latest.resources?.[key]??resources[key])||0));
   for(const key of Object.keys(army))army[key]=Math.max(0,Math.floor(Number(latest.army?.[key]??army[key])||0));
   for(const key of Object.keys(wounded))wounded[key]=Math.max(0,Math.floor(Number(latest.wounded?.[key]??wounded[key])||0));
   for(const key of Object.keys(levels))delete levels[key];
   Object.assign(levels,latest.levels||{});
   treatmentEndsAt=Math.max(0,Number(latest.treatmentEndsAt)||0);
   trainingQueue=normalizeTrainingQueue(latest.trainingQueue);
   wallDamage=Math.max(0,Math.min(100,Math.floor(Number(latest.wallDamage)||0)));
   wallRepairEndsAt=Math.max(0,Number(latest.wallRepairEndsAt)||0);
   wallRepairStartedAt=Math.max(0,Number(latest.wallRepairStartedAt)||0);
   wallRepairInitialDamage=Math.max(0,Math.min(100,Math.floor(Number(latest.wallRepairInitialDamage)||0)));
   refreshResources();updateArmyStatus();renderArmyInCity();refreshDefenseTowerModels();refreshWallModels();
  }catch{return}
  action();
 };
 if(navigator.locks?.request)await navigator.locks.request('tvq-city-economy',run);
 else run();
}
function renderWallRepairPanel(){
 let panel=document.querySelector('#wallRepairPanel');
 if(!panel){panel=document.createElement('section');panel.id='wallRepairPanel';panel.style.cssText='position:absolute;left:12px;bottom:12px;z-index:8;width:min(310px,calc(100vw - 24px));padding:11px 13px;border:1px solid #a87942;border-radius:10px;background:#1d2b25f2;color:#f4e6c8;font:12px/1.5 system-ui;box-shadow:0 8px 24px #0008';document.body.append(panel)}
 const now=Date.now(),state=normalizeWallRepair(wallDamage,wallRepairStartedAt,wallRepairEndsAt,wallRepairInitialDamage,now);
 wallDamage=state.damage;wallRepairStartedAt=state.repairStartedAt;wallRepairEndsAt=state.repairEndsAt;wallRepairInitialDamage=state.repairInitialDamage;
 const quote=getWallRepairQuote(wallDamage),remaining=Math.max(0,wallRepairEndsAt-now);
 if(remaining>0){
  const progress=Math.round(state.progress*100),minutes=Math.floor(remaining/60000),seconds=Math.ceil((remaining%60000)/1000);
  const boost=getWallRepairSpeedupQuote(wallRepairEndsAt,now);
  panel.innerHTML='<b>🧱 Qala divarlarının təmiri</b><div>Zədə: '+wallDamage+'/100 · Müdafiə bərpası: '+progress+'%</div><div style="height:7px;background:#463d30;border-radius:6px;overflow:hidden;margin:6px 0"><div style="height:100%;width:'+progress+'%;background:#8fc27a"></div></div><div>Qalan vaxt: '+minutes+' dəq. '+seconds+' san.</div><div>Divarların müdafiəsi təmir irəlilədikcə bərpa olunur.</div><button id="speedRepairWalls" style="margin-top:8px;width:100%;padding:8px;border:1px solid #c5a46a;border-radius:8px;background:#80612f;color:white;font-weight:700">25% sürətləndir · 🪙 '+boost.cost+'</button>';
  panel.querySelector('#speedRepairWalls').addEventListener('click',()=>withCityEconomyLock(()=>{
   const current=normalizeWallRepair(wallDamage,wallRepairStartedAt,wallRepairEndsAt,wallRepairInitialDamage,Date.now());
   const offer=getWallRepairSpeedupQuote(current.repairEndsAt,Date.now());
   if(resources.gold<offer.cost){panel.innerHTML='<b>Qızıl çatışmır</b><div>Sürətləndirmə üçün '+offer.cost+' qızıl lazımdır.</div>';return}
   const result=applyWallRepairSpeedup(current.repairEndsAt,Date.now(),resources.gold);
   if(!result.applied)return;
   resources.gold-=result.cost;wallRepairStartedAt=Date.now();wallRepairInitialDamage=current.damage;wallRepairEndsAt=result.repairEndsAt;wallDamage=current.damage;
   refreshResources();saveCity();renderWallRepairPanel();
  }));
  return;
 }
 if(!wallDamage){panel.innerHTML='<b>🧱 Qala divarları</b><div>Divarlar tam möhkəmdir · 0/100 zədə</div>';return}
 panel.innerHTML='<b>🧱 Qala divarlarının təmiri</b><div>Zədə: '+wallDamage+'/100</div><div>Xərc: 🪵 '+quote.cost.wood+' · 🪨 '+quote.cost.stone+' · 🪙 '+quote.cost.gold+'</div><div>Təmir vaxtı: '+Math.ceil(quote.durationMs/60000)+' dəqiqə</div><button id="repairWalls" style="margin-top:8px;width:100%;padding:9px;border:1px solid #c5a46a;border-radius:8px;background:#76542c;color:white;font-weight:700">Divarları təmir et</button>';
 panel.querySelector('#repairWalls').addEventListener('click',()=>withCityEconomyLock(()=>{
  const current=normalizeWallRepair(wallDamage,wallRepairStartedAt,wallRepairEndsAt,wallRepairInitialDamage,Date.now()),cost=getWallRepairQuote(current.damage);
  if(!current.damage){renderWallRepairPanel();return}
  if(resources.wood<cost.cost.wood||resources.stone<cost.cost.stone||resources.gold<cost.cost.gold){panel.innerHTML='<b>Resurs çatışmır</b><div>Təmir üçün daha çox odun, daş və qızıl topla.</div>';return}
  resources.wood-=cost.cost.wood;resources.stone-=cost.cost.stone;resources.gold-=cost.cost.gold;
  wallDamage=current.damage;wallRepairStartedAt=Date.now();wallRepairInitialDamage=current.damage;wallRepairEndsAt=wallRepairStartedAt+cost.durationMs;
  refreshResources();saveCity();renderWallRepairPanel();
 }));
}
function collectOfflineTerritoryIncome(){
 return withCityEconomyLock(()=>{
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
  try{
   localStorage.setItem(territoryKey,JSON.stringify(outposts));
   localStorage.setItem(worldKey,JSON.stringify(world));
   localStorage.setItem('tvq_diplomacy_v1',JSON.stringify(diplomacy));
  }catch{return {wood:0,stone:0,gold:0}}
  for(const key of Object.keys(resources))resources[key]+=collected[key];
  refreshResources();
  if(!saveCity())return {wood:0,stone:0,gold:0};
  const panel=document.querySelector('#territorySummary');
  if(panel&&Object.values(collected).some(v=>v>0)){
   const note=document.createElement('div');note.textContent='Şəhərə qayıdış gəliri: '+collected.wood+' odun · '+collected.stone+' daş · '+collected.gold+' qızıl';note.style.cssText='margin-top:6px;color:#f0d18e';panel.append(note);
  }
 }
 return collected;
 });
}
for(const key of Object.keys(army))army[key]=Math.max(0,Math.floor(Number(army[key])||0));
refreshDefenseTowerModels();
refreshWallModels();
const troopCosts={infantry:{wood:10,gold:5},spearman:{wood:15,stone:5},archer:{wood:10,stone:10},cavalry:{wood:20,gold:10},knight:{stone:20,gold:20}};
const troopTitles={infantry:'Piyada',spearman:'Nizəçi',archer:'Oxçu',cavalry:'Süvari',knight:'Cəngavər'};
const recruit=document.querySelector('#recruit');
document.querySelector('#recruitToggle').addEventListener('click',()=>recruit.classList.toggle('open'));
function updateArmyStatus(){const active=trainingQueue[0];const remaining=active?Math.max(0,Number(active.endsAt)-Date.now()):0;const level=Math.max(1,Math.min(10,Math.floor(Number(levels['Kazarma'])||1)));document.querySelector('#armyStatus').textContent='Kazarma səviyyə '+level+' · təlim sürəti +'+((level-1)*5)+'% · Hazır qoşun: '+Object.entries(army).map(([k,v])=>troopTitles[k]+': '+v).join(' · ')+(active?' · 🛠 Hazırlanır: '+troopTitles[active.type]+' '+active.count+' ədəd · '+Math.ceil(remaining/1000)+' san.':'')+(trainingQueue.length>1?' · Növbədə '+(trainingQueue.length-1)+' sifariş':'')}
function renderHospital(){
 let panel=document.querySelector('#hospitalPanel');
 if(!panel){panel=document.createElement('section');panel.id='hospitalPanel';panel.style.cssText='position:absolute;right:12px;top:112px;z-index:5;width:min(290px,calc(100vw - 24px));padding:11px 13px;border:1px solid #b58a55;border-radius:10px;background:#1d2b25ed;color:#f4e6c8;font:12px/1.5 system-ui;pointer-events:auto';document.body.append(panel)}
 const totalWounded=Object.values(wounded).reduce((sum,n)=>sum+Math.max(0,Number(n)||0),0);
 const active=treatmentEndsAt>0;
 panel.innerHTML='<b>✚ Şəfa evi · Yaralılar: '+totalWounded+'</b><div>'+Object.entries(wounded).filter(([,n])=>n>0).map(([type,n])=>troopTitles[type]+': '+n).join(' · ')+'</div><small>'+(active?'Müalicə davam edir · hər 30 saniyədə 1 əsgər bərpa olunur.':'Müalicə hər əsgər üçün 8 odun, 5 daş və 3 qızıl tələb edir. Hər 30 saniyədə 1 yaralı sağalır.')+'</small>';
 const button=document.createElement('button');button.textContent=active?'Müalicə gedir…':'Müalicəyə başla';button.disabled=active||totalWounded===0||resources.wood<totalWounded*8||resources.stone<totalWounded*5||resources.gold<totalWounded*3;button.style.cssText='display:block;width:100%;margin-top:8px;padding:9px;border:0;border-radius:7px;background:#9b7540;color:#fff;font-weight:700';
 button.addEventListener('click',()=>{const count=Object.values(wounded).reduce((sum,n)=>sum+Math.max(0,Number(n)||0),0);if(!count||treatmentEndsAt>0)return;const cost={wood:count*8,stone:count*5,gold:count*3};if(resources.wood<cost.wood||resources.stone<cost.stone||resources.gold<cost.gold)return;for(const key of Object.keys(cost))resources[key]-=cost[key];treatmentEndsAt=Date.now()+30000;refreshResources();saveCity();renderHospital()});
 panel.append(button);
}
function processHospital(){
 withCityEconomyLock(()=>{
  if(!treatmentEndsAt){renderHospital();return}
  const now=Date.now();
  let changed=false;
  while(treatmentEndsAt>0&&now>=treatmentEndsAt){
   const type=Object.keys(wounded).find(key=>(Number(wounded[key])||0)>0);
   if(!type){treatmentEndsAt=0;changed=true;break}
   wounded[type]--;army[type]=(army[type]||0)+1;changed=true;
   const remaining=Object.values(wounded).reduce((sum,n)=>sum+Math.max(0,Number(n)||0),0);
   treatmentEndsAt=remaining?treatmentEndsAt+30000:0;
  }
  if(changed){renderArmyInCity();updateArmyStatus();saveCity()}
  renderHospital();
 });
}
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

document.querySelector('#train').addEventListener('click',()=>withCityEconomyLock(()=>{
 const type=document.querySelector('#troopType').value;
 const count=Math.max(1,Math.min(500,Math.floor(Number(document.querySelector('#troopCount').value)||1)));
 const cost=troopCosts[type];
 if(!cost){document.querySelector('#armyStatus').textContent='Naməlum qoşun növü.';return}
 if(trainingQueue.length>=8){document.querySelector('#armyStatus').textContent='Təlim növbəsi doludur. Əvvəlki sifarişlərin tamamlanmasını gözlə.';return}
 const totalCost={wood:(cost.wood||0)*count,stone:(cost.stone||0)*count,gold:(cost.gold||0)*count};
 if(Object.keys(totalCost).some(k=>resources[k]<totalCost[k])){document.querySelector('#armyStatus').textContent='Resurs çatışmır — '+count+' '+troopTitles[type]+' hazırlamaq mümkün deyil.';return}
 const barracksLevel=Math.max(1,Math.min(10,Math.floor(Number(levels['Kazarma'])||1)));
 const job=createTrainingJob({queue:trainingQueue,type,count,now:Date.now(),barracksLevel,id:'train-'+Date.now()+'-'+Math.random().toString(36).slice(2,8)});
 if(!job){document.querySelector('#armyStatus').textContent='Təlim növbəsi doludur və ya sifariş məlumatı yanlışdır.';return}
 for(const key of Object.keys(resources))resources[key]-=totalCost[key];
 trainingQueue.push(job);
 refreshResources();if(!saveCity()){document.querySelector('#armyStatus').textContent='Təlim sifarişi yadda saxlanmadı. Yenidən yoxla.';return}updateArmyStatus();
}));
function processTraining(){withCityEconomyLock(()=>{const result=completeTrainingQueue(trainingQueue,army,Date.now());if(result.completed.length){trainingQueue=result.queue;for(const type of Object.keys(army))army[type]=result.army[type]||0;if(!saveCity())return;renderArmyInCity();}updateArmyStatus()})}
document.querySelector('#sendArmy').addEventListener('click',()=>{
 if(Object.values(army).every(v=>v===0)){document.querySelector('#armyStatus').textContent='Əvvəlcə kazarmada qoşun hazırla.';return}
 const params=new URLSearchParams();for(const [type,count] of Object.entries(army))params.set(type,String(count));
 location.href='./world-map.html?'+params.toString();
});
function renderLastBattleReport(){
 let report=null;
 try{report=JSON.parse(localStorage.getItem('tvq_last_battle_report_v1')||'null')}catch{}
 if(!report)return;
 let panel=document.getElementById('battleReportPanel');
 if(!panel){panel=document.createElement('section');panel.id='battleReportPanel';panel.style.cssText='position:absolute;right:12px;top:112px;z-index:9;width:min(330px,calc(100vw - 24px));max-height:42vh;overflow:auto;padding:12px;border:1px solid #b58a55;border-radius:10px;background:#17251ff2;color:#f4e6c8;font:12px/1.5 system-ui;box-shadow:0 8px 24px #0008';document.body.append(panel)}
 const labels={infantry:'Piyada',spearman:'Nizəçi',archer:'Oxçu',cavalry:'Süvari',knight:'Cəngavər'};
 const lines=(items)=>Object.entries(labels).map(([type,label])=>'<div>'+label+': '+Math.max(0,Math.floor(Number(items?.[type])||0))+'</div>').join('');
 const won=report.winner==='attacker';
 panel.innerHTML='<b>📜 Son döyüş hesabatı</b><div style="margin:5px 0;color:'+(won?'#a9df9b':'#f0a18c')+'">'+(won?'QƏLƏBƏ':'MƏĞLUBİYYƏT')+(report.captured?' · QALA FƏTH EDİLDİ':'')+'</div><small>'+new Date(Number(report.at)||Date.now()).toLocaleString('az-AZ')+'</small><hr style="border-color:#66583e"><b>İtkilərimiz</b>'+lines(report.attackerLosses)+'<b>Sağ qalan ordumuz</b>'+lines(report.survivingAttackers)+'<b>Düşmən itkiləri</b>'+lines(report.defenderLosses)+'<div style="margin-top:7px">Divar zədəsi: '+Math.max(0,Math.floor(Number(report.wallDamage)||0))+'% · '+(report.wallBreached?'Divar yarılıb':'Divar dayanıb')+'</div><button id="dismissBattleReport" style="margin-top:10px;width:100%">Hesabatı bağla</button>';
 panel.querySelector('#dismissBattleReport').addEventListener('click',()=>{localStorage.removeItem('tvq_last_battle_report_v1');panel.remove()});
}
function renderBattleHistory(){
 let history=[];
 try{history=JSON.parse(localStorage.getItem('tvq_battle_history_v1')||'[]')}catch{}
 if(!Array.isArray(history))history=[];
 let panel=document.getElementById('battleHistoryPanel');
 if(!panel){panel=document.createElement('section');panel.id='battleHistoryPanel';panel.style.cssText='position:absolute;right:12px;top:calc(112px + min(42vh,330px) + 12px);z-index:8;width:min(330px,calc(100vw - 24px));max-height:30vh;overflow:auto;padding:12px;border:1px solid #806d4a;border-radius:10px;background:#17251fee;color:#f4e6c8;font:12px/1.5 system-ui;box-shadow:0 8px 24px #0008';document.body.append(panel)}
 if(!history.length){panel.innerHTML='<b>📚 Döyüş tarixçəsi</b><p>Hələ qeydə alınmış döyüş yoxdur.</p>';return}
 const totalLoss=(items)=>Object.values(items||{}).reduce((sum,n)=>sum+Math.max(0,Number(n)||0),0);
 const troopNames={infantry:'Piyada',spearman:'Nizəçi',archer:'Oxçu',cavalry:'Süvari',knight:'Cəngavər'};
 const troopLines=(items)=>Object.entries(troopNames).map(([type,label])=>'<div style="display:flex;justify-content:space-between"><span>'+label+'</span><b>'+Math.max(0,Math.floor(Number(items?.[type])||0))+'</b></div>').join('');
 const wins=history.filter(r=>r.winner==='attacker').length,losses=history.length-wins;
 const ownLosses=history.reduce((sum,r)=>sum+totalLoss(r.attackerLosses),0);
 const enemyLosses=history.reduce((sum,r)=>sum+totalLoss(r.defenderLosses),0);
 const captures=history.filter(r=>r.captured).length;
 const rate=Math.round(wins/Math.max(1,history.length)*100);
 const recent=history.slice(0,10).reverse();
 const bars=recent.map((r,index)=>'<div title="Döyüş '+(history.length-recent.length+index+1)+' · '+(r.winner==='attacker'?'Qələbə':'Məğlubiyyət')+'" style="flex:1;min-width:8px;height:34px;border-radius:3px 3px 0 0;background:'+(r.winner==='attacker'?'#83b879':'#bd705d')+'"></div>').join('');
 const chart='<div style="margin:8px 0 10px;padding:8px;border-radius:8px;background:#202d29"><div style="display:flex;justify-content:space-between;margin-bottom:7px;color:#d7c8a9"><b>Son döyüşlərin nəticəsi</b><small>Son '+recent.length+' döyüş</small></div><div style="height:38px;display:flex;align-items:flex-end;gap:4px">'+bars+'</div><div style="display:flex;justify-content:space-between;margin-top:5px;font-size:10px;color:#cdbb98"><span>🟢 Qələbə</span><span>🔴 Məğlubiyyət</span></div></div>';
 const stats='<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin:9px 0"><div style="padding:7px;border-radius:7px;background:#263b30">🏆 Qələbə <b>'+wins+'</b></div><div style="padding:7px;border-radius:7px;background:#3b2b27">⚔ Məğlubiyyət <b>'+losses+'</b></div><div style="padding:7px;border-radius:7px;background:#263b30">📈 Uğur faizi <b>'+rate+'%</b></div><div style="padding:7px;border-radius:7px;background:#3b3426">🏰 Fəth edilən qala <b>'+captures+'</b></div></div>'+chart+'<div style="font-size:11px;color:#d7c8a9;margin-bottom:8px">Ümumi itkilərimiz: <b>'+ownLosses+'</b> · Düşmən itkiləri: <b>'+enemyLosses+'</b></div>';
 panel.innerHTML='<b>📚 Döyüş tarixçəsi · '+history.length+'/20</b>'+stats+history.map((r,index)=>{
  const won=r.winner==='attacker',date=new Date(Number(r.at)||Date.now()).toLocaleString('az-AZ');
  return '<details style="margin-top:8px;padding:8px;border:1px solid #66583e;border-radius:7px;background:#202d29"><summary style="cursor:pointer;color:'+(won?'#a9df9b':'#f0a18c')+'">'+(index+1)+'. '+(won?'Qələbə':'Məğlubiyyət')+(r.captured?' · Qala alındı':'')+'<br><small style="color:#d7c8a9">'+date+'</small></summary><div style="margin-top:7px"><b>Öz itkilərimiz · '+totalLoss(r.attackerLosses)+'</b>'+troopLines(r.attackerLosses)+'<b style="display:block;margin-top:6px">Düşmən itkiləri · '+totalLoss(r.defenderLosses)+'</b>'+troopLines(r.defenderLosses)+'<b style="display:block;margin-top:6px">Sağ qalan ordumuz · '+totalLoss(r.survivingAttackers)+'</b>'+troopLines(r.survivingAttackers)+'<div style="margin-top:6px">Divar zədəsi: <b>'+Math.max(0,Math.floor(Number(r.wallDamage)||0))+'%</b></div></div></details>';
 }).join('')+'<button id="clearBattleHistory" style="margin-top:10px;width:100%">Tarixçəni təmizlə</button>';
 panel.querySelector('#clearBattleHistory').addEventListener('click',()=>{
  if(!confirm('Bütün döyüş tarixçəsi silinsin?'))return;
  localStorage.removeItem('tvq_battle_history_v1');renderBattleHistory();
function mountGeneralPanel(){
 const key='tvq_general_v1';
 let state={id:'alp',xp:0};
 try{state={...state,...JSON.parse(localStorage.getItem(key)||'{}')}}catch{}
 const generals={
  alp:{name:'Alp Arslan',title:'Süvari sərkərdəsi',desc:'Süvari hücumuna +18%, bütün qoşunlara +3%.',bonus:'cavalry'},
  tomris:{name:'Tomris',title:'Oxçu sərkərdəsi',desc:'Oxçu hücumuna +18%, bütün qoşunlara +3%.',bonus:'archer'},
  babek:{name:'Babək',title:'Piyada sərkərdəsi',desc:'Piyada və nizəçi hücumuna +18%, bütün qoşunlara +3%.',bonus:'infantry'}
 };
 if(!generals[state.id])state.id='alp';
 const level=Math.min(10,1+Math.floor(Math.max(0,Number(state.xp)||0)/100));
 let panel=document.getElementById('generalPanel');
 if(!panel){panel=document.createElement('section');panel.id='generalPanel';panel.style.cssText='position:fixed;left:10px;top:145px;z-index:7;width:min(245px,calc(100vw - 20px));padding:10px;border:1px solid #b58a55;border-radius:10px;background:#17251feF;color:#f4e6c8;font:11px/1.45 system-ui;box-shadow:0 8px 24px #0008';document.body.append(panel)}
 const totalXp=Math.max(0,Math.floor(Number(state.xp)||0)),levelProgress=level>=10?100:totalXp%100;
 panel.innerHTML='<b>🛡 Sərkərdə heyəti</b><div style="margin:5px 0">Səviyyə <b>'+level+'/10</b> · Təcrübə <b>'+totalXp+'</b> XP</div><div style="font-size:10px;color:#d7c8a9">'+(level>=10?'Maksimum səviyyə əldə edilib':'Növbəti səviyyəyə '+(100-levelProgress)+' XP qalıb')+'</div><select id="generalSelect" style="width:100%;padding:8px;border-radius:7px;background:#26352d;color:#fff;border:1px solid #806d4a"><option value="alp">Alp Arslan</option><option value="tomris">Tomris</option><option value="babek">Babək</option></select><div id="generalDesc" style="margin-top:7px;color:#e6d5b4"></div><div style="height:5px;background:#3b4034;border-radius:5px;margin-top:7px;overflow:hidden"><div id="generalXpBar" style="height:100%;width:'+levelProgress+'%;background:#d1a85d"></div></div><small>Döyüşdən sonra təcrübə qazanır.</small>';
 const select=panel.querySelector('#generalSelect');select.value=state.id;
 const update=()=>{state.id=select.value;localStorage.setItem(key,JSON.stringify(state));panel.querySelector('#generalDesc').textContent=generals[state.id].title+' — '+generals[state.id].desc};
 select.addEventListener('change',update);update();
}
mountGeneralPanel();

 });
}
function processReturningArmy(){return withCityEconomyLock(()=>processReturningArmyLocked())}
function processReturningArmyLocked(){
 const queueKey='tvq_return_journeys_v1';
 let trips=[];
 try{trips=JSON.parse(localStorage.getItem(queueKey)||'[]');if(!Array.isArray(trips))trips=[]}catch{trips=[]}
 let legacy=null;
 try{legacy=JSON.parse(localStorage.getItem('tvq_return_journey_v1')||'null')}catch{}
 if(legacy&&legacy.id&&!trips.some(t=>t.id===legacy.id))trips.push(legacy);
 const panelId='returnJourneyPanel';
 let panel=document.getElementById(panelId);
 if(!trips.length){panel?.remove();return}
 const now=Date.now();
 const due=trips.filter(t=>Number(t.arrivesAt)<=now);
 if(due.length){
  try{
   let latest=JSON.parse(localStorage.getItem(SAVE_KEY)||'{}');
   latest.processedReturnJourneys=latest.processedReturnJourneys||{};
   latest.army=latest.army||{};
   for(const trip of due){
    const journeyId=String(trip.id||((Number(trip.startedAt)||0)+':'+Number(trip.arrivesAt)+':'+Object.values(trip.army||{}).join(',')));
    if(latest.processedReturnJourneys[journeyId])continue;
    for(const type of Object.keys(army)){
     const count=Math.max(0,Math.floor(Number(trip.army?.[type])||0));
     latest.army[type]=Math.max(0,Math.floor(Number(latest.army[type])||0))+count;
    }
    latest.processedReturnJourneys[journeyId]={processedAt:now};
   }
   // Keep the idempotency ledger: an old journey must never be credited twice
   // if a stale tab or restored queue entry reappears much later.
   localStorage.setItem(SAVE_KEY,JSON.stringify(latest));
   trips=trips.filter(t=>Number(t.arrivesAt)>now);
   localStorage.setItem(queueKey,JSON.stringify(trips));
   if(legacy&&Number(legacy.arrivesAt)<=now)localStorage.removeItem('tvq_return_journey_v1');
   for(const type of Object.keys(army))army[type]=Math.max(0,Math.floor(Number(latest.army?.[type])||0));
   savedCity={...savedCity,...latest};
  }catch{
   if(panel)panel.textContent='⚠️ Qayıdan qoşunların nəticəsi yadda saxlanmadı. Şəhər yaddaşı yoxlanıldıqdan sonra yenidən cəhd ediləcək.';
   return;
  }
  updateArmyStatus();renderArmyInCity();
  if(!trips.length){panel?.remove();const note=document.createElement('div');note.id=panelId;note.textContent='🏰 Sağ qalan qoşunlar şəhərə qayıtdı və orduya qoşuldu.';note.style.cssText='position:absolute;left:12px;bottom:90px;z-index:8;padding:10px 13px;border:1px solid #b58a55;border-radius:9px;background:#1d2b25ed;color:#f4e6c8';document.body.append(note);return}
 }
 const next=trips.reduce((a,b)=>Number(a.arrivesAt)<Number(b.arrivesAt)?a:b);
 const left=Math.max(0,Number(next.arrivesAt)-Date.now());
 if(!panel){panel=document.createElement('section');panel.id=panelId;panel.style.cssText='position:absolute;left:12px;bottom:90px;z-index:8;padding:10px 13px;border:1px solid #b58a55;border-radius:9px;background:#1d2b25ed;color:#f4e6c8;font:12px/1.5 system-ui;pointer-events:none';document.body.append(panel)}
 const total=trips.reduce((sum,t)=>sum+Object.values(t.army||{}).reduce((n,v)=>n+Math.max(0,Number(v)||0),0),0);
 panel.textContent='⚔ Qayıdan yürüşlər: '+trips.length+' · '+Math.ceil(left/1000)+' saniyə · sağ qalan qoşun: '+total;
}
updateArmyStatus();
renderArmyInCity();
processHospital();
setInterval(processHospital,1000);
renderWallRepairPanel();
setInterval(()=>{const state=normalizeWallRepair(wallDamage,wallRepairStartedAt,wallRepairEndsAt,wallRepairInitialDamage,Date.now());if(state.damage!==wallDamage||state.repairStartedAt!==wallRepairStartedAt||state.repairEndsAt!==wallRepairEndsAt||state.repairInitialDamage!==wallRepairInitialDamage){wallDamage=state.damage;wallRepairStartedAt=state.repairStartedAt;wallRepairEndsAt=state.repairEndsAt;wallRepairInitialDamage=state.repairInitialDamage;saveCity();refreshWallModels()}renderWallRepairPanel()},1000);
processTraining();
setInterval(processTraining,1000);
processReturningArmy();
renderLastBattleReport();
renderBattleHistory();
setInterval(processReturningArmy,1000);
collectOfflineTerritoryIncome();
saveCity();
try{const world=JSON.parse(localStorage.getItem('tvq_world_state_v1')||'{}');if(world.redFortress){info.innerHTML=world.redFortress.captured?'<b>🏆 Qırmızı Qala fəth edildi!</b>Qələbə tarixi: '+new Date(world.redFortress.updatedAt).toLocaleString('az-AZ')+'.':'<b>⚔ Hücum başa çatdı</b>Düşmən qalası müdafiə olunur. Sağ qalan düşmən: '+world.redFortress.remainingDefenders+'. Ordunu yenidən hazırlaya bilərsən.';}}catch{}
document.querySelector('#home').addEventListener('click',()=>{camera.position.set(150,165,175);controls.target.set(0,10,12);controls.update()});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.5))});
const patrolClock=new THREE.Clock();
renderer.setAnimationLoop(()=>{const t=patrolClock.getElapsedTime();patrols.forEach((p,i)=>{p.position.x=p.userData.baseX+Math.sin(t*.7+i)*1.4;p.rotation.y=Math.sin(t*.55+i)*.22});controls.update();renderer.render(scene,camera)});
