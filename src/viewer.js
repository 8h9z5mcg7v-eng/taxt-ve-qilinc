import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const host=document.querySelector('#stage');
const hint=document.querySelector('#hint');
const status=document.querySelector('#status');
const fileInput=document.querySelector('#file');
const scene=new THREE.Scene();
scene.background=null;
const camera=new THREE.PerspectiveCamera(42,innerWidth/(innerHeight-82),.05,5000);
camera.position.set(8,7,10);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
renderer.setSize(innerWidth,innerHeight-82);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.15;
host.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xdde8ff,0x51402b,2.0));
const sun=new THREE.DirectionalLight(0xffe3bd,3.0);sun.position.set(8,14,9);scene.add(sun);
const fill=new THREE.DirectionalLight(0x8aa9cf,1.0);fill.position.set(-8,5,-7);scene.add(fill);
const ground=new THREE.Mesh(new THREE.CircleGeometry(100,64),new THREE.MeshStandardMaterial({color:0x465149,roughness:1}));
ground.rotation.x=-Math.PI/2;ground.position.y=-.03;scene.add(ground);
const grid=new THREE.GridHelper(100,100,0x89918a,0x66716b);grid.position.y=-.015;scene.add(grid);
const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;controls.dampingFactor=.06;controls.maxPolarAngle=Math.PI*.49;controls.minDistance=.5;controls.maxDistance=600;
let current=null;let activeUrl=null;
function frameObject(object){
 const box=new THREE.Box3().setFromObject(object);const size=box.getSize(new THREE.Vector3());const center=box.getCenter(new THREE.Vector3());
 object.position.sub(center);
 const maxDim=Math.max(size.x,size.y,size.z)||1;
 const distance=maxDim*1.65;
 camera.position.set(distance*.9,distance*.72,distance);
 camera.near=Math.max(.01,maxDim/1000);camera.far=maxDim*100;camera.updateProjectionMatrix();
 controls.target.set(0,0,0);controls.minDistance=maxDim*.15;controls.maxDistance=maxDim*15;controls.update();
 return {size,maxDim};
}
function disposeObject(obj){obj.traverse(n=>{if(n.isMesh){n.geometry?.dispose();for(const m of (Array.isArray(n.material)?n.material:[n.material]))m?.dispose();}});scene.remove(obj);}
document.querySelector('#pick').addEventListener('click',()=>fileInput.click());
fileInput.addEventListener('change',()=>{
 const file=fileInput.files?.[0];if(!file)return;
 if(activeUrl)URL.revokeObjectURL(activeUrl);
 activeUrl=URL.createObjectURL(file);
 status.textContent='Yüklənir: '+file.name;
 new GLTFLoader().load(activeUrl,gltf=>{
  if(current)disposeObject(current);
  current=gltf.scene;scene.add(current);
  const {size}=frameObject(current);
  hint.style.display='none';
  const mb=(file.size/1048576).toFixed(1);
  status.textContent=file.name+' · '+mb+' MB · ölçü '+size.x.toFixed(1)+' × '+size.y.toFixed(1)+' × '+size.z.toFixed(1);
 },xhr=>{if(xhr.total)status.textContent='Yüklənir… '+Math.round(xhr.loaded/xhr.total*100)+'%';},err=>{
  console.error(err);status.textContent='Model açıla bilmədi. GLB faylını və teksturaları yoxla.';
 });
});
function resize(){const h=innerHeight-82;camera.aspect=innerWidth/h;camera.updateProjectionMatrix();renderer.setSize(innerWidth,h);renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));}
addEventListener('resize',resize);
renderer.setAnimationLoop(()=>{controls.update();renderer.render(scene,camera);});
