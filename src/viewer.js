import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const host = document.querySelector('#stage');
const hint = document.querySelector('#hint');
const status = document.querySelector('#status');
const fileInput = document.querySelector('#file');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, innerWidth / Math.max(1, host.clientHeight), 0.05, 5000);
camera.position.set(8, 7, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.setSize(host.clientWidth, host.clientHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.info.autoReset = true;
host.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xdde8ff, 0x51402b, 2.0));
const sun = new THREE.DirectionalLight(0xffe3bd, 3.0);
sun.position.set(8, 14, 9);
scene.add(sun);
const fill = new THREE.DirectionalLight(0x8aa9cf, 1.0);
fill.position.set(-8, 5, -7);
scene.add(fill);

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(100, 64),
  new THREE.MeshStandardMaterial({ color: 0x465149, roughness: 1 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.03;
scene.add(ground);

const grid = new THREE.GridHelper(100, 100, 0x89918a, 0x66716b);
grid.position.y = -0.015;
scene.add(grid);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.maxPolarAngle = Math.PI * 0.49;
controls.minDistance = 0.5;
controls.maxDistance = 600;

let current = null;
let activeUrl = null;
let mixer = null;
const clock = new THREE.Clock();
let initialCamera = null;
const initialTarget = new THREE.Vector3();
let modelSummary = '';
let fpsFrames = 0;
let fpsStarted = performance.now();
let displayedFps = 0;
let displayedCalls = 0;
let displayedTriangles = 0;

function frameObject(object) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  object.position.sub(center);

  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const distance = maxDim * 1.65;
  camera.position.set(distance * 0.9, distance * 0.72, distance);
  camera.near = Math.max(0.01, maxDim / 1000);
  camera.far = maxDim * 100;
  camera.updateProjectionMatrix();

  controls.target.set(0, 0, 0);
  controls.minDistance = maxDim * 0.15;
  controls.maxDistance = maxDim * 15;
  controls.update();
  initialCamera = camera.position.clone();
  initialTarget.copy(controls.target);
  return { size };
}

function inspectModel(root) {
  let meshes = 0;
  let triangles = 0;
  const materials = new Set();
  const textures = new Set();
  let maxTextureEdge = 0;
  let textureCount = 0;

  root.traverse(node => {
    if (!node.isMesh) return;
    meshes += 1;
    const indexCount = node.geometry.index?.count;
    const positionCount = node.geometry.attributes.position?.count || 0;
    triangles += indexCount ? indexCount / 3 : positionCount / 3;

    const list = Array.isArray(node.material) ? node.material : [node.material];
    for (const material of list) {
      if (!material) continue;
      materials.add(material);
      for (const value of Object.values(material)) {
        if (value?.isTexture) {
          textures.add(value);
          const image = value.image;
          const width = image?.width || image?.videoWidth || image?.naturalWidth || 0;
          const height = image?.height || image?.videoHeight || image?.naturalHeight || 0;
          maxTextureEdge = Math.max(maxTextureEdge, width, height);
        }
      }
    }
  });

  textureCount = textures.size;
  return { meshes, triangles: Math.round(triangles), materials: materials.size, textures: textureCount, maxTextureEdge };
}

function disposeObject(object) {
  object.traverse(node => {
    if (!node.isMesh) return;
    node.geometry?.dispose();
    for (const material of (Array.isArray(node.material) ? node.material : [node.material])) material?.dispose();
  });
  scene.remove(object);
}

function resetView() {
  if (!initialCamera) {
    status.textContent = 'Əvvəlcə GLB modeli seç.';
    return;
  }
  camera.position.copy(initialCamera);
  controls.target.copy(initialTarget);
  controls.update();
}

function updateStatus() {
  if (!current) return;
  status.textContent = modelSummary + ' · ' + displayedFps + ' FPS · ' +
    displayedCalls + ' draw calls · ' + displayedTriangles.toLocaleString('en-US') + ' render tris';
}

document.querySelector('#pick').addEventListener('click', () => fileInput.click());
document.querySelector('#reset').addEventListener('click', resetView);

fileInput.addEventListener('change', () => {
  const file = fileInput.files?.[0];
  if (!file) return;

  if (activeUrl) URL.revokeObjectURL(activeUrl);
  activeUrl = URL.createObjectURL(file);
  status.textContent = 'Yüklənir: ' + file.name;
  hint.style.display = 'none';

  new GLTFLoader().load(
    activeUrl,
    gltf => {
      if (current) disposeObject(current);
      current = gltf.scene;
      scene.add(current);
      const { size } = frameObject(current);
      const stats = inspectModel(current);
      mixer = gltf.animations.length ? new THREE.AnimationMixer(current) : null;
      if (mixer) gltf.animations.forEach(clip => mixer.clipAction(clip).play());

      const mb = (file.size / 1048576).toFixed(1);
      modelSummary =
        file.name + ' · ' + mb + ' MB · ' +
        size.x.toFixed(1) + ' × ' + size.y.toFixed(1) + ' × ' + size.z.toFixed(1) +
        ' m · ' + stats.meshes + ' mesh · ' + stats.triangles.toLocaleString('en-US') +
        ' tris · ' + stats.materials + ' material · ' + stats.textures + ' texture' +
        (stats.maxTextureEdge ? ' · max tekstura ' + stats.maxTextureEdge + 'px' : '') +
        (gltf.animations.length ? ' · ' + gltf.animations.length + ' animasiya' : '');
      const warnings = [];
      if (stats.triangles > 250000) warnings.push('Poliqon sayı yüksəkdir (>250k)');
      if (stats.meshes > 150) warnings.push('Mesh sayı yüksəkdir (>150)');
      if (stats.materials > 30) warnings.push('Material sayı yüksəkdir (>30)');
      if (stats.maxTextureEdge > 4096) warnings.push('4K-dan böyük tekstura aşkarlandı');
      if (file.size > 30 * 1048576) warnings.push('Fayl 30 MB-dan böyükdür');
      if (warnings.length) modelSummary += ' · OPTİMİZASİYA: ' + warnings.join('; ');
      else modelSummary += ' · ilkin mobil limitlər uyğundur';
      updateStatus();
    },
    xhr => {
      if (xhr.total) status.textContent = 'Yüklənir… ' + Math.round(xhr.loaded / xhr.total * 100) + '%';
    },
    error => {
      console.error(error);
      hint.style.display = 'block';
      status.textContent = 'Model açıla bilmədi. Tək fayllı GLB formatını yoxla.';
    }
  );
});

function resize() {
  const width = host.clientWidth;
  const height = host.clientHeight;
  camera.aspect = width / Math.max(1, height);
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
}

addEventListener('resize', resize);
renderer.setAnimationLoop(() => {
  mixer?.update(clock.getDelta());
  controls.update();
  renderer.render(scene, camera);

  fpsFrames += 1;
  const now = performance.now();
  if (now - fpsStarted >= 1000) {
    displayedFps = Math.round(fpsFrames * 1000 / (now - fpsStarted));
    displayedCalls = renderer.info.render.calls;
    displayedTriangles = renderer.info.render.triangles;
    fpsFrames = 0;
    fpsStarted = now;
    updateStatus();
  }
});

let lastTap = 0;
renderer.domElement.addEventListener('pointerup', () => {
  const now = performance.now();
  if (now - lastTap < 320) resetView();
  lastTap = now;
});
