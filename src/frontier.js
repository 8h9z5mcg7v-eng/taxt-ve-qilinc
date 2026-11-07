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
box(0,0,-43,104,14,7,stone);box(0,0,43,104,14,7,stone);box(-49,0,0,7,14,90,stone);box(49,0,0,7,14,90,stone);
for(const p of [[-49,-43],[49,-43],[-49,43],[49,43]])tower(p[0],p[1]);box(0,0,43,20,17,9,darkStone);box(0,0,49,8,10,2,wood);
box(0,0,-5,28,25,25,stone);box(0,25,-5,20,10,19,darkStone);const keepRoof=new THREE.Mesh(new THREE.ConeGeometry(17,13,4),roof);keepRoof.position.set(0,42,-5);keepRoof.rotation.y=Math.PI/4;keepRoof.castShadow=true;scene.add(keepRoof);
function house(x,z,w,d,h){box(x,0,z,w,h,d,wood);const r=new THREE.Mesh(new THREE.ConeGeometry(Math.max(w,d)*.75,h*.8,4),roof);r.position.set(x,h+h*.35,z);r.rotation.y=Math.PI/4;r.castShadow=true;scene.add(r)}
house(-28,-25,17,13,9);house(28,-24,18,14,8);house(-29,22,14,12,8);house(29,22,16,12,7);
const well=new THREE.Mesh(new THREE.CylinderGeometry(4,4,2,12),stone);well.position.set(0,1,25);scene.add(well);
for(let i=0;i<18;i++){const x=-105+(i%6)*20,z=-105+Math.floor(i/6)*22;const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.6,.8,5,7),wood);trunk.position.set(x,2.5,z);scene.add(trunk);const crown=new THREE.Mesh(new THREE.ConeGeometry(4.5,10,7),mat(0x38543a));crown.position.set(x,8,z);crown.castShadow=true;scene.add(crown)}
const pole=new THREE.Mesh(new THREE.CylinderGeometry(.2,.25,12,8),gold);pole.position.set(0,6,42);scene.add(pole);const flag=new THREE.Mesh(new THREE.PlaneGeometry(6,4),mat(site.flag));flag.position.set(3,9,42);scene.add(flag);
for(const x of [-10,10]){const fire=new THREE.Mesh(new THREE.SphereGeometry(.8,8,8),new THREE.MeshBasicMaterial({color:0xffa33b}));fire.position.set(x,3,35);scene.add(fire);const light=new THREE.PointLight(0xffa33b,1.5,18);light.position.set(x,4,35);scene.add(light)}
let dragging=false,lastX=0,lastY=0,rotation=0,tilt=0;renderer.domElement.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture(e.pointerId)});
renderer.domElement.addEventListener('pointermove',e=>{if(!dragging)return;rotation+=(e.clientX-lastX)*.008;tilt=Math.max(-.25,Math.min(.35,tilt+(e.clientY-lastY)*.004));lastX=e.clientX;lastY=e.clientY});renderer.domElement.addEventListener('pointerup',()=>dragging=false);renderer.domElement.addEventListener('pointercancel',()=>dragging=false);
renderer.domElement.addEventListener('wheel',e=>{camera.position.multiplyScalar(e.deltaY>0?1.08:.92);camera.position.clampLength(70,230)},{passive:true});
function animate(){requestAnimationFrame(animate);const radius=camera.position.length();camera.position.x=Math.sin(rotation)*radius*.72;camera.position.z=Math.cos(rotation)*radius*.72;camera.position.y=Math.max(55,88+tilt*100);camera.lookAt(0,8,0);renderer.render(scene,camera)}animate();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
document.querySelector('#name').textContent=site.name;const total=Object.values(campaign?.garrison||{}).reduce((n,v)=>n+(Number(v)||0),0);
document.querySelector('#desc').textContent=campaign?.captured?'Bu məntəqə sənin krallığının nəzarətindədir. Müdafiə qarnizonunu dünya xəritəsindən idarə et.':'Bu qala hazırda sənin nəzarətində deyil. Dünya xəritəsində sərhəd kampaniyasını davam etdir.';
document.querySelector('#stats').innerHTML='<span>🛡 Qarnizon: '+total+' əsgər</span><span>🪵 '+site.wood+' odun/saat</span><span>🪨 '+site.stone+' daş/saat</span><span>🪙 '+site.gold+' qızıl/saat</span>';
document.querySelector('#notice').textContent=campaign?.captured?'Qala divarları, darvaza, qarnizon binaları və müşahidə qüllələri hazırdır.':'Məntəqə itirilib və ya hələ fəth edilməyib.';