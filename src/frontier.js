import * as THREE from 'three';
const params=new URLSearchParams(location.search);const id=params.get('kingdom')||'north';
const sites={north:{name:'Şimal sərhəd qalası',terrain:0x566b4c,flag:0x9a3430,wood:12,stone:5,gold:3},iron:{name:'Dəmir Tac qalası',terrain:0x62664e,flag:0x777d86,wood:5,stone:12,gold:4},sun:{name:'Günəş sərhəd qalası',terrain:0x8a774b,flag:0xc49a42,wood:10,stone:7,gold:6}};const site=sites[id]||sites.north;
let state={};try{state=JSON.parse(localStorage.getItem('tvq_diplomacy_v1')||'{}')}catch{}const campaign=state.borderCampaigns?.[id];
const scene=new THREE.Scene();scene.background=new THREE.Color(0x9aa8a0);scene.fog=new THREE.Fog(0x9aa8a0,100,250);
const camera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.1,500);camera.position.set(95,88,115);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;document.querySelector('#scene').append(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xe5f0ec,0x4b4935,2));const sun=new THREE.DirectionalLight(0xffe1b3,3);sun.position.set(-65,110,55);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);scene.add(sun);
const mat=c=>new THREE.MeshStandardMaterial({color:c,roughness:.9});const grass=mat(site.terrain),stone=mat(0x777970),darkStone=mat(0x4c514d),wood=mat(0x64472e),roof=mat(0x684535),gold=mat(0xb79a58);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(240,240),grass);ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
function box(x,y,z,w,h,d,m){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y+h/2,z);o.castShadow=true;o.receiveShadow=true;scene.add(o);return o}
function tower(x,z){const t=new THREE.Mesh(new THREE.CylinderGeometry(6,7,18,10),stone);t.position.set(x,9,z);t.castShadow=true;scene.add(t);const cap=new THREE.Mesh(new THREE.ConeGeometry(7,9,10),roof);cap.position.set(x,22,z);cap.castShadow=true;scene.add(cap)}
box(0,0,-43,104,14,7,stone);box(0,0,43,104,14,7,stone);box(-49,0,0,7,14,90,stone);
const wallDamage=Math.max(0,Math.min(100,Number(campaign?.wallDamage)||0));
if(wallDamage>0){
 const rubbleMat=mat(0x625e53),crackMat=new THREE.LineBasicMaterial({color:0x292a25});
 const crackCount=Math.min(8,Math.ceil(wallDamage/12));
 for(let i=0;i<crackCount;i++){
  const x=-24+i*6,z=39.2;
  const points=[new THREE.Vector3(x,12,z),new THREE.Vector3(x+2,8,z),new THREE.Vector3(x-1,5,z),new THREE.Vector3(x+2,1,z)];
  const crack=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),crackMat);scene.add(crack);
 }
 const rubbleCount=Math.min(18,Math.ceil(wallDamage/6));
 for(let i=0;i<rubbleCount;i++){
  const size=.8+(i%3)*.45;
  const block=new THREE.Mesh(new THREE.DodecahedronGeometry(size,0),rubbleMat);
  block.position.set(-8+(i%9)*2, size*.6, 39+(Math.floor(i/9)*2));block.rotation.set(i*.4,i*.7,i*.2);block.castShadow=true;scene.add(block);
 }
 if(wallDamage>=100){box(-2,0,42,18,2,9,darkStone);const breach=new THREE.Mesh(new THREE.BoxGeometry(20,1.2,10),mat(0x3e3b32));breach.position.set(-2,1,42);scene.add(breach)}
}box(49,0,0,7,14,90,stone);
for(const p of [[-49,-43],[49,-43],[-49,43],[49,43]])tower(p[0],p[1]);box(0,0,43,20,17,9,darkStone);box(0,0,49,8,10,2,wood);
box(0,0,-5,28,25,25,stone);box(0,25,-5,20,10,19,darkStone);const keepRoof=new THREE.Mesh(new THREE.ConeGeometry(17,13,4),roof);keepRoof.position.set(0,42,-5);keepRoof.rotation.y=Math.PI/4;keepRoof.castShadow=true;scene.add(keepRoof);
function house(x,z,w,d,h){box(x,0,z,w,h,d,wood);const r=new THREE.Mesh(new THREE.ConeGeometry(Math.max(w,d)*.75,h*.8,4),roof);r.position.set(x,h+h*.35,z);r.rotation.y=Math.PI/4;r.castShadow=true;scene.add(r)}
house(-28,-25,17,13,9);house(28,-24,18,14,8);house(-29,22,14,12,8);house(29,22,16,12,7);
const well=new THREE.Mesh(new THREE.CylinderGeometry(4,4,2,12),stone);well.position.set(0,1,25);scene.add(well);
for(let i=0;i<18;i++){const x=-105+(i%6)*20,z=-105+Math.floor(i/6)*22;const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.6,.8,5,7),wood);trunk.position.set(x,2.5,z);scene.add(trunk);const crown=new THREE.Mesh(new THREE.ConeGeometry(4.5,10,7),mat(0x38543a));crown.position.set(x,8,z);crown.castShadow=true;scene.add(crown)}
const pole=new THREE.Mesh(new THREE.CylinderGeometry(.2,.25,12,8),gold);pole.position.set(0,6,42);scene.add(pole);const flag=new THREE.Mesh(new THREE.PlaneGeometry(6,4),mat(site.flag));flag.position.set(3,9,42);scene.add(flag);
for(const x of [-10,10]){const fire=new THREE.Mesh(new THREE.SphereGeometry(.8,8,8),new THREE.MeshBasicMaterial({color:0xffa33b}));fire.position.set(x,3,35);scene.add(fire);const light=new THREE.PointLight(0xffa33b,1.5,18);light.position.set(x,4,35);scene.add(light)}
// Animated garrison patrol: articulated guards circle the inner courtyard.
const patrols=[];
function makeGuard(x,z,phase,armorColor){
 const root=new THREE.Group();root.position.set(x,0,z);scene.add(root);
 const armor=mat(armorColor),skin=mat(0xb98b68),cloak=mat(0x71352d),iron=mat(0x555e61);
 const torso=new THREE.Mesh(new THREE.CylinderGeometry(1.05,1.3,3.2,8),armor);torso.position.y=4.1;torso.castShadow=true;root.add(torso);
 const head=new THREE.Mesh(new THREE.SphereGeometry(.85,10,8),skin);head.position.y=6.35;head.castShadow=true;root.add(head);
 const helmet=new THREE.Mesh(new THREE.ConeGeometry(1,1.5,8),iron);helmet.position.y=7.45;helmet.castShadow=true;root.add(helmet);
 const cape=new THREE.Mesh(new THREE.BoxGeometry(1.8,2.8,.3),cloak);cape.position.set(0,4,-.95);root.add(cape);
 const leftLeg=new THREE.Group();leftLeg.position.set(-.55,2.8,0);root.add(leftLeg);
 const rightLeg=new THREE.Group();rightLeg.position.set(.55,2.8,0);root.add(rightLeg);
 for(const leg of [leftLeg,rightLeg]){const mesh=new THREE.Mesh(new THREE.BoxGeometry(.72,2.8,.8),iron);mesh.position.y=-1.35;mesh.castShadow=true;leg.add(mesh)}
 const leftArm=new THREE.Group();leftArm.position.set(-1.15,5.1,0);root.add(leftArm);
 const rightArm=new THREE.Group();rightArm.position.set(1.15,5.1,0);root.add(rightArm);
 for(const arm of [leftArm,rightArm]){const mesh=new THREE.Mesh(new THREE.CylinderGeometry(.34,.42,2.2,7),armor);mesh.position.y=-.95;mesh.rotation.z=-.18;mesh.castShadow=true;arm.add(mesh)}
 const spear=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,7,6),wood);spear.position.set(0,2.5,0);rightArm.add(spear);
 const tip=new THREE.Mesh(new THREE.ConeGeometry(.28,.9,6),iron);tip.position.set(0,6.3,0);rightArm.add(tip);
 patrols.push({root,leftLeg,rightLeg,leftArm,rightArm,phase});
}
const garrison=campaign?.garrison||{infantry:0,spearman:0,archer:0,cavalry:0,knight:0};
const troopCount=Object.values(garrison).reduce((n,v)=>n+Math.max(0,Number(v)||0),0);
const patrolCount=Math.min(18,Math.ceil(troopCount/10));
for(let i=0;i<patrolCount;i++){
 const angle=(i/patrolCount)*Math.PI*2;
 const x=Math.cos(angle)*30,z=Math.sin(angle)*19;
 makeGuard(x,z,i*1.1,i%2?0x8b754c:0x687783);
}
const wallArchers=[];
function makeWallArcher(x,z,turn){
 const root=new THREE.Group();root.position.set(x,14,z);scene.add(root);
 const armor=mat(0x65717a),skin=mat(0xb98b68),iron=mat(0x555e61);
 const body=new THREE.Mesh(new THREE.CylinderGeometry(.7,.9,2.5,8),armor);body.position.y=1.5;root.add(body);
 const head=new THREE.Mesh(new THREE.SphereGeometry(.58,8,8),skin);head.position.y=3.15;root.add(head);
 const helmet=new THREE.Mesh(new THREE.ConeGeometry(.68,1,8),iron);helmet.position.y=4;root.add(helmet);
 const bow=new THREE.Mesh(new THREE.TorusGeometry(1.35,.11,6,16,Math.PI),wood);bow.position.set(.95,2.25,.25);bow.rotation.z=Math.PI/2;root.add(bow);
 const arrow=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,2.7,5),iron);arrow.rotation.z=Math.PI/2;arrow.position.set(1.1,2.3,.2);root.add(arrow);
 const bolt=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,2.8,5),wood);bolt.rotation.x=Math.PI/2;bolt.position.set(x,16,z);scene.add(bolt);
 const tip=new THREE.Mesh(new THREE.ConeGeometry(.16,.55,5),iron);tip.rotation.x=Math.PI/2;tip.position.set(x,16,z+turn*.9);scene.add(tip);
 wallArchers.push({root,arrow,turn,phase:turn*.8,bolt,tip,startX:x,startZ:z});
}
const archerCount=Math.max(0,Number(garrison.archer)||0);
const visibleArchers=Math.min(10,Math.ceil(archerCount/5));
for(let i=0;i<visibleArchers;i++){
 const side=i%2===0?-1:1,slot=Math.floor(i/2);
 makeWallArcher(-30+slot*20,side*43,side);
}

function animatePatrols(time){
 wallArchers.forEach((a,i)=>{
  const pulse=Math.sin(time*.002+a.phase),cycle=((time*.001+a.phase*2)%4+4)%4;
  a.root.rotation.y=a.turn<0?Math.PI:0;
  a.arrow.position.y=2.3+pulse*.12;
  a.arrow.rotation.z=Math.PI/2+pulse*.04;
  const firing=cycle>1.15&&cycle<2.45;
  const travel=Math.max(0,cycle-1.15)/1.3;
  a.bolt.visible=firing;a.tip.visible=firing;
  a.bolt.position.set(a.startX,16,a.startZ+a.turn*travel*24);
  a.tip.position.set(a.startX,16,a.startZ+a.turn*(travel*24+.9));
 });
 patrols.forEach((g,i)=>{
  const t=time*.00022+g.phase;
  const perimeter=2*(76+48),p=(t*12)%perimeter;
  let x,z,angle;
  if(p<76){x=-38+p;z=-24;angle=Math.PI/2}
  else if(p<124){x=38;z=-24+(p-76);angle=0}
  else if(p<200){x=38-(p-124);z=24;angle=-Math.PI/2}
  else{x=-38;z=24-(p-200);angle=Math.PI}
  g.root.position.set(x,0,z);g.root.rotation.y=angle;
  const step=Math.sin(t*9+i)*.48;
  g.leftLeg.rotation.x=step;g.rightLeg.rotation.x=-step;
  g.leftArm.rotation.x=-step*.65;g.rightArm.rotation.x=step*.65;
  g.root.position.y=Math.abs(Math.sin(t*9+i))*.12;
 });
}
let dragging=false,lastX=0,lastY=0,rotation=0,tilt=0;renderer.domElement.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture(e.pointerId)});
renderer.domElement.addEventListener('pointermove',e=>{if(!dragging)return;rotation+=(e.clientX-lastX)*.008;tilt=Math.max(-.25,Math.min(.35,tilt+(e.clientY-lastY)*.004));lastX=e.clientX;lastY=e.clientY});renderer.domElement.addEventListener('pointerup',()=>dragging=false);renderer.domElement.addEventListener('pointercancel',()=>dragging=false);
let zoom=150;renderer.domElement.addEventListener('wheel',e=>{zoom=Math.max(90,Math.min(230,zoom*(e.deltaY>0?1.08:.92)))},{passive:true});
function animate(time=0){requestAnimationFrame(animate);animatePatrols(time);camera.position.x=Math.sin(rotation)*zoom*.72;camera.position.z=Math.cos(rotation)*zoom*.72;camera.position.y=Math.max(45,zoom*.58+tilt*100);camera.lookAt(0,8,0);renderer.render(scene,camera)}animate();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
document.querySelector('#name').textContent=site.name;const total=Object.values(campaign?.garrison||{}).reduce((n,v)=>n+(Number(v)||0),0);
document.querySelector('#desc').textContent=campaign?.captured?(total?'Qala sənin nəzarətindədir. Piyada: '+(garrison.infantry||0)+' · Nizəçi: '+(garrison.spearman||0)+' · Oxçu: '+(garrison.archer||0)+' · Süvari: '+(garrison.cavalry||0)+' · Cəngavər: '+(garrison.knight||0)+'.':'Qala sənin nəzarətindədir, lakin qarnizon boşdur. Dünya xəritəsinə qayıdıb müdafiəçi göndər.'):'Bu qala hazırda sənin nəzarətində deyil. Dünya xəritəsində sərhəd kampaniyasını davam etdir.';
document.querySelector('#stats').innerHTML='<span>🛡 Qarnizon: '+total+' əsgər</span><span>🧱 Divar zədəsi: '+wallDamage+'/100</span><span>⚔ Patrul: '+patrolCount+'</span><span>🏹 Divar oxçuları: '+visibleArchers+'</span><span>🪵 '+site.wood+' odun/saat</span><span>🪨 '+site.stone+' daş/saat</span><span>🪙 '+site.gold+' qızıl/saat</span>';
document.querySelector('#notice').textContent=campaign?.captured?'Qala divarları, darvaza və qarnizon binaları hazırdır. Mühasirə zədəsi: '+wallDamage+'/100 · '+(wallDamage>=100?'divar yarılıb':'divar müdafiədədir')+'.':'Məntəqə itirilib və ya hələ fəth edilməyib.';