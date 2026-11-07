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
const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,10,12);controls.enableDamping=true;controls.dampingFactor=.07;controls.maxPolarAngle=Math.PI*.48;controls.minDistance=75;controls.maxDistance=330;
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),info=document.querySelector('#info');
renderer.domElement.addEventListener('pointerup',e=>{const rect=renderer.domElement.getBoundingClientRect();pointer.x=((e.clientX-rect.left)/rect.width)*2-1;pointer.y=-((e.clientY-rect.top)/rect.height)*2+1;raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(pickables,false);if(hits.length){const label=hits[0].object.userData.label||'Şəhər obyekti';info.innerHTML='<b>'+label+'</b>Seçilmiş tikili · inkişaf və idarəetmə növbəti mərhələdə əlavə olunacaq.'}});
document.querySelector('#home').addEventListener('click',()=>{camera.position.set(150,165,175);controls.target.set(0,10,12);controls.update()});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.5))});
renderer.setAnimationLoop(()=>{controls.update();renderer.render(scene,camera)});
