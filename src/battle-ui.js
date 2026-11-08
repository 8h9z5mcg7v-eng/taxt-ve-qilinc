import { resolveBattle } from './battle.js';

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

const troopIds = ['infantry', 'spearman', 'archer', 'cavalry', 'knight'];
const readArmy = prefix => Object.fromEntries(troopIds.map(id => {
  const input = document.getElementById(prefix + '-' + id);
  return [id, Math.max(0, Math.min(9999, Math.floor(Number(input.value) || 0)))];
}));
const total = army => Object.values(army).reduce((sum, n) => sum + n, 0);
const labels = { north: 'Şimal', south: 'Cənub', east: 'Şərq', west: 'Qərb', balanced: 'Balanslı', wedge: 'Paz', line: 'Xətt', volley: 'Yaylım', plains: 'Açıq düzənlik', forest: 'Meşə', hill: 'Təpəlik', fortress: 'Möhkəmləndirilmiş qala' };
const troopLabels = { infantry: 'P', spearman: 'N', archer: 'O', cavalry: 'S', knight: 'C' };
const troopNames = { infantry: 'Piyada', spearman: 'Nizəçi', archer: 'Oxçu', cavalry: 'Süvari', knight: 'Cəngavər' };
const svgNS = 'http://www.w3.org/2000/svg';

async function updateCitySave(mutator) {
  const update = () => {
    let saved;
    try { saved = JSON.parse(localStorage.getItem('taxt-ve-qilinc-city-v1') || '{}'); }
    catch { throw new Error('Şəhər yaddaşı oxunmadı.'); }
    mutator(saved);
    try { localStorage.setItem('taxt-ve-qilinc-city-v1', JSON.stringify(saved)); }
    catch { throw new Error('Şəhər yaddaşı yazılmadı.'); }
  };
  if (navigator.locks?.request) await navigator.locks.request('tvq-city-economy', update);
  else update();
}


function svgNode(tag, attrs, parent, value) {
  const node = document.createElementNS(svgNS, tag);
  Object.entries(attrs).forEach(([key, val]) => node.setAttribute(key, String(val)));
  if (value !== undefined) node.textContent = value;
  parent.appendChild(node);
  return node;
}

function renderTerrain(terrain, wallDamage = 0, siege = {}) {
  const field = document.getElementById('battlefield');
  field.querySelector('#terrainBackdrop')?.remove();
  const scene = document.createElementNS(svgNS, 'g');
  scene.setAttribute('id', 'terrainBackdrop');
  const sky = svgNode('rect', { x: 0, y: 0, width: 600, height: 340, fill: terrain === 'forest' ? '#263d2d' : terrain === 'hill' ? '#59654a' : terrain === 'fortress' ? '#45463f' : '#8b805b' }, scene);
  svgNode('path', { d: terrain === 'hill' ? 'M0 210 Q100 95 210 190 T420 165 T600 190 L600 340 L0 340Z' : 'M0 220 Q150 195 300 220 T600 210 L600 340 L0 340Z', fill: terrain === 'forest' ? '#35583a' : terrain === 'fortress' ? '#65665b' : '#a18a58' }, scene);
  if (terrain === 'forest') {
    for (let i = 0; i < 12; i++) {
      const x = 18 + i * 52;
      svgNode('path', { d: `M${x} 205 l-17 35 h34Z`, fill: i % 2 ? '#1d3425' : '#29452d' }, scene);
    }
  } else if (terrain === 'fortress') {
    const damage = Math.max(0, Math.min(100, Number(wallDamage) || 0));
    const defenseWallLevel = Math.max(1, Math.min(10, Math.floor(Number(siege.defenseWallLevel) || 1)));
    const wallBaseHeight = 48 + Math.floor((defenseWallLevel - 1) / 3) * 2;
    svgNode('rect', { x: 214, y: 76 - (wallBaseHeight - 48), width: 172, height: wallBaseHeight + 6, fill: '#77786d', stroke: '#282b27', 'stroke-width': 5 + Math.floor((defenseWallLevel - 1) / 4) }, scene);
    if (defenseWallLevel >= 3) {
      for (let brace = 0; brace < Math.floor(defenseWallLevel / 2); brace++) {
        const braceX = 220 + brace * 32;
        svgNode('path', { d: `M${braceX} 81 L${braceX + 9} 81 L${braceX + 9} 126 L${braceX} 126Z`, fill: defenseWallLevel >= 7 ? '#9b8b6a' : '#686b62', stroke: '#343630', 'stroke-width': 1.4 }, scene);
      }
    }
    if (defenseWallLevel >= 6) {
      svgNode('path', { d: 'M216 76 L384 76 M216 83 L384 83', stroke: '#c4a56c', 'stroke-width': 1.8, opacity: .9 }, scene);
    }
    if (defenseWallLevel >= 9) {
      svgNode('path', { d: 'M214 119 L386 119', stroke: '#c4a56c', 'stroke-width': 3 }, scene);
    }
    for (let i = 0, x = 220; x < 386; x += 28, i++) {
      // Damaged walls progressively lose their merlons instead of only
      // displaying a generic damage badge.
      if (damage >= 22 && i === 2 || damage >= 48 && i === 4 || damage >= 72 && i === 0 || damage >= 88 && i === 5) continue;
      svgNode('rect', { x, y: 65, width: 14, height: 15, fill: '#99998a', stroke: '#282b27', 'stroke-width': 2 }, scene);
    }
    const defenseTowerLevel = Math.max(1, Math.min(10, Math.floor(Number(siege.defenseTowerLevel) || 1)));
    svgNode('rect', { x: 270, y: 35, width: 58, height: 44, fill: '#858679', stroke: '#282b27', 'stroke-width': 4 }, scene);
    svgNode('path', { d: damage >= 82 ? 'M262 36 L280 22 L290 30 L299 8 L312 26 L336 36Z' : 'M262 36 L299 8 L336 36Z', fill: '#6f4032', stroke: '#282b27', 'stroke-width': 3 }, scene);
    for (let levelMark = 0; levelMark < defenseTowerLevel; levelMark++) {
      const crenelX = 274 + levelMark * 5.1;
      svgNode('rect', { x: crenelX, y: 29, width: 3.5, height: 7, fill: defenseTowerLevel >= 5 ? '#c4a56c' : '#99998a', stroke: '#282b27', 'stroke-width': 0.8 }, scene);
    }
    if (defenseTowerLevel >= 5) {
      svgNode('path', { d: 'M273 73 L325 73', stroke: '#c4a56c', 'stroke-width': 2.5 }, scene);
      svgNode('path', { d: 'M270 43 L270 71 M328 43 L328 71', stroke: '#b9a078', 'stroke-width': 2 }, scene);
    }
    if (defenseTowerLevel >= 8) {
      svgNode('path', { d: 'M299 9 L299 -13 L313 -9 L299 -4Z', fill: '#b94b3c', stroke: '#282b27', 'stroke-width': 1.2 }, scene);
    }
    if (damage >= 42) {
      svgNode('path', { d: 'M297 13 L291 25 L301 31 L294 43 L304 51', fill: 'none', stroke: '#211e1a', 'stroke-width': 3.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, scene);
      svgNode('path', { d: 'M277 34 L284 40 L280 49', fill: 'none', stroke: '#211e1a', 'stroke-width': 2 }, scene);
    }
    if (damage >= 82) {
      svgNode('path', { d: 'M279 52 L289 47 L298 54 L306 47 L319 55 L316 78 L278 78Z', fill: '#55584f', stroke: '#282b27', 'stroke-width': 2 }, scene);
      for (let i = 0; i < 5; i++) {
        const x = 267 + i * 15;
        svgNode('path', { d: `M${x} 129 l6 -5 l8 4 l-3 6 l-8 0Z`, fill: ['#77786d','#969184','#5e625d'][i%3], stroke: '#393b35', 'stroke-width': 1 }, scene);
      }
    }
    svgNode('rect', { x: 284, y: 91, width: 24, height: 39, fill: '#211d19' }, scene);
    const gate = svgNode('g', { id: 'fortressGate' }, scene);
    const gateOpen = damage >= 100;
    const gateWear = Math.max(0, Math.min(1, damage / 100));
    const leftGate = svgNode('path', {
      d: gateOpen ? 'M284 92 L273 96 L267 128 L280 130Z' : 'M284 92 L296 92 L296 130 L284 130Z',
      transform: !gateOpen && damage >= 60 ? `rotate(${Math.round(gateWear * 13)} 284 92)` : '',
      fill: '#80552f', stroke: '#30251e', 'stroke-width': 2
    }, gate);
    const rightGate = svgNode('path', {
      d: gateOpen ? 'M308 92 L319 96 L325 128 L312 130Z' : 'M296 92 L308 92 L308 130 L296 130Z',
      transform: !gateOpen && damage >= 60 ? `rotate(-${Math.round(gateWear * 13)} 308 92)` : '',
      fill: '#684326', stroke: '#30251e', 'stroke-width': 2
    }, gate);
    for (let y = 101; y <= 121; y += 10) {
      svgNode('path', { d: `M285 ${y} L295 ${y} M297 ${y} L307 ${y}`, stroke: '#c0965b', 'stroke-width': 1.5 }, gate);
    }
    if (damage >= 25 && damage < 100) {
      svgNode('path', { d: 'M294 96 L290 108 L297 115 L292 128', fill: 'none', stroke: '#241c16', 'stroke-width': 2.5 }, gate);
    }
    if (damage >= 70 && damage < 100) {
      svgNode('path', { d: 'M285 114 L292 119 L287 130 M301 101 L297 109 L304 116', fill: 'none', stroke: '#241c16', 'stroke-width': 2 }, gate);
    }
    if (damage >= 25) {
      svgNode('path', { d: damage >= 70 ? 'M248 78 L270 96 L258 111 L284 130 M270 96 L292 85 L307 101 L328 91 M307 101 L300 124' : 'M268 78 L281 92 L272 108 M281 92 L299 83', fill: 'none', stroke: '#292722', 'stroke-width': damage >= 70 ? 5 : 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, scene);
    }
    if (damage >= 50) {
      svgNode('path', { d: 'M214 109 L247 109 L259 130 L235 130Z M340 109 L371 109 L386 130 L354 130Z', fill: '#4c4b43', stroke: '#282b27', 'stroke-width': 2 }, scene);
    }
    if (damage >= 15 && damage < 100) {
      const crackCount = Math.min(8, Math.floor(damage / 12));
      for (let i = 0; i < crackCount; i++) {
        const x = 224 + ((i * 31) % 150);
        const y = 79 + ((i * 17) % 42);
        svgNode('path', { d: `M${x} ${y} l-5 9 l7 5 l-4 10`, fill: 'none', stroke: '#292722', 'stroke-width': 2.2, 'stroke-linecap': 'round' }, scene);
      }
    }
    if (damage >= 35) {
      const fallenCount = Math.min(18, Math.floor((damage - 25) / 4));
      for (let i = 0; i < fallenCount; i++) {
        const x = 218 + ((i * 19) % 166);
        const y = 130 + ((i * 11) % 13);
        svgNode('path', { d: `M${x} ${y} l7 -4 l8 5 l-4 6 l-9 0Z`, fill: ['#77786d', '#969184', '#5e625d'][i % 3], stroke: '#393b35', 'stroke-width': 1 }, scene);
      }
    }
    if (damage >= 100) {
      // Open breach with broken masonry piled on both sides of the passage.
      svgNode('rect', { x: 264, y: 76, width: 68, height: 54, fill: '#a18a58' }, scene);
      svgNode('path', { d: 'M252 131 L266 114 L278 131 M322 131 L337 113 L350 131', fill: '#77786d', stroke: '#282b27', 'stroke-width': 3 }, scene);
      for (let i = 0; i < 11; i++) {
        const x = 246 + ((i * 23) % 112);
        const y = 124 + ((i * 7) % 15);
        svgNode('path', {
          d: `M${x} ${y} l8 -5 l9 6 l-5 7 l-10 0Z`,
          fill: ['#77786d', '#969184', '#5e625d'][i % 3],
          stroke: '#393b35', 'stroke-width': 1
        }, scene);
      }
      svgNode('text', { x: 300, y: 148, 'text-anchor': 'middle', fill: '#ffe0a1', 'font-size': 11, 'font-weight': 700 }, scene, 'DİVAR YARILIB');
    }
    // Show each fortress wall as its own damageable side around the keep.
    const sideDamageMap = siege.wallDamageBySide || {};
    const sideLayout = {
      north: { x1: 250, y1: 53, x2: 350, y2: 53, label: 'ŞİMAL', tx: 300, ty: 45, rubbleX: 292, rubbleY: 57 },
      south: { x1: 250, y1: 157, x2: 350, y2: 157, label: 'CƏNUB', tx: 300, ty: 174, rubbleX: 292, rubbleY: 150 },
      west: { x1: 202, y1: 78, x2: 202, y2: 128, label: 'QƏRB', tx: 188, ty: 105, rubbleX: 196, rubbleY: 108 },
      east: { x1: 398, y1: 78, x2: 398, y2: 128, label: 'ŞƏRQ', tx: 412, ty: 105, rubbleX: 390, rubbleY: 108 }
    };
    for (const [side, pos] of Object.entries(sideLayout)) {
      const sideDamage = Math.max(0, Math.min(100, Number(sideDamageMap[side]) || 0));
      const isAttackedSide = siege.attackDirection === side;
      const color = sideDamage >= 70 ? '#9b4938' : sideDamage >= 25 ? '#c18a4d' : '#a9a28f';
      svgNode('path', {
        d: `M${pos.x1} ${pos.y1} L${pos.x2} ${pos.y2}`,
        fill: 'none', stroke: isAttackedSide ? '#f2c66d' : '#35372f',
        'stroke-width': isAttackedSide ? 10 : 7, 'stroke-linecap': 'square', opacity: .95
      }, scene);
      svgNode('path', {
        d: `M${pos.x1} ${pos.y1} L${pos.x2} ${pos.y2}`,
        fill: 'none', stroke: color, 'stroke-width': Math.max(2, 6 - sideDamage * .035),
        'stroke-linecap': 'square', opacity: .95
      }, scene);
      if (sideDamage >= 15) {
        const crackCount = Math.min(5, Math.ceil(sideDamage / 20));
        for (let crack = 0; crack < crackCount; crack++) {
          const t = (crack + 1) / (crackCount + 1);
          const cx = pos.x1 + (pos.x2 - pos.x1) * t;
          const cy = pos.y1 + (pos.y2 - pos.y1) * t;
          const dx = side === 'east' || side === 'west' ? 1 : 7;
          const dy = side === 'east' || side === 'west' ? 7 : 1;
          svgNode('path', {
            d: `M${cx-dx} ${cy-dy} l${dx} ${dy} l${-dx/2} ${dy+3} l${dx+3} ${dy+2}`,
            fill: 'none', stroke: '#211e1a', 'stroke-width': 2.2,
            'stroke-linecap': 'round', 'stroke-linejoin': 'round'
          }, scene);
        }
        const rubbleCount = Math.min(5, Math.floor(sideDamage / 20));
        for (let stone = 0; stone < rubbleCount; stone++) {
          const offset = (stone - (rubbleCount - 1) / 2) * 9;
          const x = side === 'west' || side === 'east' ? pos.rubbleX + offset : pos.rubbleX + offset;
          const y = side === 'north' || side === 'south' ? pos.rubbleY : pos.rubbleY + offset;
          svgNode('path', {
            d: `M${x} ${y} l4 -3 l6 3 l-2 5 l-7 0Z`,
            fill: ['#77786d','#969184','#5e625d'][stone % 3],
            stroke: '#393b35', 'stroke-width': .8
          }, scene);
        }
      }
      svgNode('text', {
        x: pos.tx, y: pos.ty, 'text-anchor': 'middle',
        fill: isAttackedSide ? '#ffe0a1' : '#d4c6a5',
        'font-size': 8, 'font-weight': 700,
        stroke: '#292722', 'stroke-width': 1.8, 'paint-order': 'stroke'
      }, scene, `${pos.label} ${Math.round(sideDamage)}%`);
    }
    const defensiveMachines = Math.min(9, Math.max(0, Number(siege.defenseCatapult) || 0));
    for (let i = 0; i < defensiveMachines; i++) {
      const x = 222 + i * 21;
      const weapon = svgNode('g', { id: `defensiveCatapult${i}`, transform: `translate(${x} 91)` }, scene);
      svgNode('path', { d: 'M-10 12 L-8 -2 L8 -2 L10 12 M-13 -2 L13 -2 M-8 3 L8 3', fill: 'none', stroke: '#4a3020', 'stroke-width': 3, 'stroke-linecap': 'round' }, weapon);
      const arm = svgNode('g', { id: `defensiveCatapultArm${i}`, transform: 'rotate(-8 0 -17)' }, weapon);
      svgNode('path', { d: 'M0 5 L0 -25', fill: 'none', stroke: '#684326', 'stroke-width': 4, 'stroke-linecap': 'round' }, arm);
      svgNode('path', { d: 'M-5 -25 L5 -25 L3 -19 L-3 -19Z', fill: '#a18a58', stroke: '#30251e', 'stroke-width': 1.5 }, arm);
      svgNode('path', { d: 'M0 -25 Q-8 -33 -12 -25 M0 -25 Q8 -33 12 -25', fill: 'none', stroke: '#d1b27b', 'stroke-width': 1.5 }, arm);
      svgNode('circle', { cx: 0, cy: -28, r: 3.2, fill: '#77786d', stroke: '#292722', 'stroke-width': 1 }, arm);
      svgNode('text', { x: 0, y: 24, 'text-anchor': 'middle', fill: '#ffe0a1', 'font-size': 7, 'font-weight': 700, stroke: '#292722', 'stroke-width': 1, 'paint-order': 'stroke' }, weapon, 'MÜDAFİƏ');
    }
  }
  if ((siege.catapult || 0) > 0 || (siege.ram || 0) > 0 || (siege.tower || 0) > 0) {
    const machines = document.createElementNS(svgNS, 'g');
    machines.setAttribute('id', 'siegeMachines');
    const catapults = Math.min(4, Math.max(0, Number(siege.catapult) || 0));
    for (let i = 0; i < catapults; i++) {
      const x = 52 + i * 48;
      const y = 255 + (i % 2) * 13;
      const machine = svgNode('g', { id: `attackingCatapult${i}`, transform: `translate(${x} ${y})` }, machines);
      svgNode('path', { d: 'M-17 12 L0 -17 L18 12 M-12 5 L12 5', fill: 'none', stroke: '#4a3020', 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, machine);
      const arm=svgNode('g',{id:`catapultArm${i}`,transform:'rotate(-8 0 -17)'},machine);
      svgNode('path', { d: 'M0 5 L0 -34', fill:'none',stroke:'#684326','stroke-width':5,'stroke-linecap':'round' },arm);
      svgNode('path', { d: 'M-5 -34 L5 -34 L3 -27 L-3 -27Z', fill: '#9a7544', stroke: '#30251e', 'stroke-width': 2 }, arm);
      svgNode('path',{d:'M0 -34 Q-10 -42 -15 -34 M0 -34 Q10 -42 15 -34',fill:'none',stroke:'#d1b27b','stroke-width':1.8},arm);
      svgNode('circle', { cx: 0, cy: -38, r: 4, fill: '#77786d', stroke:'#292722','stroke-width':1.2 }, arm);
    }
    const towers = Math.min(2, Math.max(0, Number(siege.tower) || 0));
    for (let i = 0; i < towers; i++) {
      const x = 445 + i * 58;
      const y = 250 - i * 7;
      const tower = svgNode('g', { transform: `translate(${x} ${y})` }, machines);
      svgNode('path', { d: 'M-18 30 L-18 -28 L18 -28 L18 30Z', fill: '#9a7544', stroke: '#30251e', 'stroke-width': 3 }, tower);
      svgNode('path', { d: 'M-24 -28 L0 -43 L24 -28Z', fill: '#6e4930', stroke: '#30251e', 'stroke-width': 3 }, tower);
      svgNode('rect', { x: -7, y: -18, width: 14, height: 17, fill: '#252923', stroke: '#30251e', 'stroke-width': 2 }, tower);
      svgNode('path', { d: 'M-10 30 L-10 39 M10 30 L10 39', stroke: '#30251e', 'stroke-width': 4 }, tower);
    }
    const rams = Math.min(2, Math.max(0, Number(siege.ram) || 0));
    for (let i = 0; i < rams; i++) {
      const x = 185 + i * 42;
      const ram = svgNode('g', { id: `batteringRam${i}`, transform: `translate(${x} 0)` }, machines);
      svgNode('path', { d: 'M-17 282 L17 282 L12 292 L-12 292Z M0 282 L0 253', fill: '#80552e', stroke: '#30251e', 'stroke-width': 4, 'stroke-linejoin': 'round' }, ram);
      svgNode('path', { d: 'M-10 252 L10 252 L6 260 L-6 260Z', fill: '#777d86', stroke: '#292722', 'stroke-width': 2 }, ram);
    }
    scene.appendChild(machines);
  }
  field.insertBefore(scene, field.firstChild);
}

function renderBattlefield(attacker, defender, direction, terrain = 'plains', wallDamage = 0, siege = {}) {
  renderTerrain(terrain, wallDamage, siege);
  const field = document.getElementById('battlefield');
  field.querySelector('#fortressDefenses')?.remove();
  if (terrain === 'fortress' && (defender.archer || 0) > 0) {
    const defenses = document.createElementNS(svgNS, 'g');
    defenses.setAttribute('id', 'fortressDefenses');
    const guardCount = Math.min(4, Math.max(1, Math.ceil(defender.archer / 25)));
    for (let i = 0; i < guardCount; i++) {
      const x = 226 + i * 49;
      const guard = svgNode('g', { transform: `translate(${x} 75)` }, defenses);
      svgNode('path', { d: 'M-17 4 L-17 -12 L-10 -12 L-10 -19 L-3 -19 L-3 -12 L4 -12 L4 -19 L11 -19 L11 -12 L17 -12 L17 4Z', fill: '#8b8c80', stroke: '#292b26', 'stroke-width': 2 }, guard);
      svgNode('circle', { cx: 0, cy: -8, r: 5, fill: '#d9b58a', stroke: '#292b26', 'stroke-width': 1.5 }, guard);
      svgNode('path', { d: 'M-7 -3 L7 -3 L9 13 L-9 13Z', fill: '#b97861', stroke: '#292b26', 'stroke-width': 1.5 }, guard);
      svgNode('path', { d: 'M-12 -5 Q-20 5 -12 14 M-12 -5 L-12 14 M-12 5 L8 -6', fill: 'none', stroke: '#d7c49b', 'stroke-width': 2 }, guard);
    }
    field.appendChild(defenses);
  }
  const gate = field.querySelector('#fortressGate');
  if (gate && (siege.ram || 0) > 0) {
    gate.animate(
      [{ transform: 'translate(0px,0px)' }, { transform: 'translate(3px,0px)' },
       { transform: 'translate(-3px,0px)' }, { transform: 'translate(0px,0px)' }],
      { duration: 430, delay: 250, iterations: Math.min(4, siege.ram), easing: 'ease-in-out' }
    );
  }
  // Catapult throwing arms cock back, snap forward and release their stone.
  const catapultArms=field.querySelectorAll('#siegeMachines [id^="catapultArm"]');
  const catapultShots = Math.max(1, Math.min(3, Number(siege.catapult) || 1));
  catapultArms.forEach((arm,index)=>{
    arm.animate(
      [{transform:'rotate(-8deg)'},{transform:'rotate(-58deg)'},{transform:'rotate(24deg)'},{transform:'rotate(-8deg)'}],
      {duration:1120,delay:180+index*170,iterations:catapultShots,easing:'cubic-bezier(.25,.7,.25,1)'}
    );
  });
  const attackLayer = document.getElementById('attackerUnits');
  const defendLayer = document.getElementById('defenderUnits');
  const arrowLayer = document.getElementById('attackArrow');
  [attackLayer, defendLayer, arrowLayer].forEach(layer => layer.replaceChildren());
  const lanes = {
    infantry: [105, 95], spearman: [220, 85], archer: [370, 65],
    cavalry: [490, 105], knight: [300, 120]
  };
  for (const [army, layer, color, isAttack] of [
    [defender, defendLayer, '#e5a18b', false],
    [attacker, attackLayer, '#c8e0b7', true]
  ]) {
    for (const type of troopIds) {
      const count = army[type] || 0;
      if (!count) continue;
      const [x, defenderY] = lanes[type];
      const y = isAttack ? 245 + (type === 'archer' ? 34 : type === 'cavalry' ? -15 : 0) : defenderY;
      const g = svgNode('g', {
        transform: `translate(${x} ${y})`,
        'data-unit-type': type,
        'data-side': isAttack ? 'attacker' : 'defender'
      }, layer);
      // Distinct miniature medieval unit silhouettes instead of generic dots.
      if (type === 'cavalry' || type === 'knight') {
        svgNode('ellipse', { cx: 0, cy: 5, rx: 24, ry: 11, fill: type === 'knight' ? '#777d86' : '#76523a', stroke: '#18231e', 'stroke-width': 2 }, g);
        svgNode('path', { d: 'M14 1 Q22 -13 29 -8 L32 -2 L24 4Z', fill: '#76523a', stroke: '#18231e', 'stroke-width': 2 }, g);
        svgNode('path', { d: 'M-14 12 L-18 25 M-3 13 L-2 25 M12 12 L17 24', stroke: '#30251e', 'stroke-width': 3, 'stroke-linecap': 'round' }, g);
        svgNode('circle', { cx: 3, cy: -15, r: 7, fill: '#d9b58a', stroke: '#18231e', 'stroke-width': 2 }, g);
        svgNode('path', { d: 'M-5 -8 L13 -8 L17 9 L-8 9Z', fill: color, stroke: '#18231e', 'stroke-width': 2 }, g);
        if (type === 'knight') svgNode('path', { d: 'M-3 -22 L4 -34 L11 -22Z', fill: '#b9c3cc', stroke: '#18231e', 'stroke-width': 2 }, g);
        else svgNode('path', { d: 'M10 -8 L29 -31', stroke: '#e8d7ad', 'stroke-width': 3, 'stroke-linecap': 'round' }, g);
      } else {
        svgNode('circle', { cx: 0, cy: -14, r: 7, fill: '#d9b58a', stroke: '#18231e', 'stroke-width': 2 }, g);
        svgNode('path', { d: 'M-10 -6 L10 -6 L13 17 L-13 17Z', fill: color, stroke: '#18231e', 'stroke-width': 2 }, g);
        svgNode('path', { d: 'M-9 16 L-13 28 M8 16 L13 28', stroke: '#30251e', 'stroke-width': 3, 'stroke-linecap': 'round' }, g);
        if (type === 'spearman') svgNode('path', { d: 'M14 17 L17 -35 L20 -28', stroke: '#d7c49b', 'stroke-width': 3, 'stroke-linecap': 'round' }, g);
        if (type === 'archer') {
          svgNode('path', { d: 'M-16 -7 Q-30 5 -16 20 M-16 -7 L-16 20', stroke: '#a87943', 'stroke-width': 3, fill: 'none' }, g);
          svgNode('path', { d: 'M-16 6 L8 -5', stroke: '#e8d7ad', 'stroke-width': 2 }, g);
        }
        if (type === 'infantry') svgNode('path', { d: 'M-17 -8 L-17 13 L-5 17 L-5 -5Z', fill: '#9caa9d', stroke: '#18231e', 'stroke-width': 2 }, g);
      }
      svgNode('text', { 'text-anchor': 'middle', y: 43, fill: '#fff4dc', 'font-size': 12, 'font-weight': 700, stroke: '#17251f', 'stroke-width': 2, 'paint-order': 'stroke' }, g, String(count));
      svgNode('text', { 'text-anchor': 'middle', y: 57, fill: '#e7e2d4', 'font-size': 9, stroke: '#17251f', 'stroke-width': 1, 'paint-order': 'stroke' }, g, troopNames[type]);
    }
  }
  const arrows = {
    south: [[300, 310], [300, 183], '0,-1'],
    north: [[300, 20], [300, 145], '0,1'],
    east: [[570, 165], [430, 165], '-1,0'],
    west: [[30, 165], [170, 165], '1,0']
  };
  const [start, end, vector] = arrows[direction] || arrows.south;
  const [vx, vy] = vector.split(',').map(Number);
  svgNode('line', { x1: start[0], y1: start[1], x2: end[0], y2: end[1], stroke: '#f7d27e', 'stroke-width': 6, 'stroke-linecap': 'round' }, arrowLayer);
  const bx = end[0] - vx * 16, by = end[1] - vy * 16;
  const px = -vy * 9, py = vx * 9;
  svgNode('polygon', { points: `${end[0]},${end[1]} ${bx + px},${by + py} ${bx - px},${by - py}`, fill: '#f7d27e' }, arrowLayer);
  svgNode('text', { x: 300, y: 155, 'text-anchor': 'middle', fill: '#fff0c5', 'font-size': 11, 'font-weight': 700, stroke: '#263b2d', 'stroke-width': 3, 'paint-order': 'stroke' }, arrowLayer, 'HÜCUM İSTİQAMƏTİ');
}

// Accept the army dispatched from the city training panel.
const dispatched=new URLSearchParams(location.search);
const isWorldMapAttack=dispatched.get('target')==='red-fortress';
const isBorderBattle=dispatched.get('target')==='border';
let strategicBattleLockReason='';
const todayKey=(()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')})();
const battleId=dispatched.get('battleId')||(isWorldMapAttack?(()=>{try{return 'red-'+(JSON.parse(localStorage.getItem('tvq_active_journey_v1')||'{}').startedAt||'unknown')}catch{return 'red-unknown'}})():isBorderBattle?'border-'+(dispatched.get('kingdom')||'unknown')+'-'+todayKey:'local-'+Date.now());
let resolvedBattles={};try{resolvedBattles=JSON.parse(localStorage.getItem('tvq_resolved_battles_v1')||'{}')}catch{}
if(resolvedBattles[battleId])strategicBattleLockReason='Bu döyüşün nəticəsi artıq hesablanıb.';
if(isWorldMapAttack){
 let journey=null;try{journey=JSON.parse(localStorage.getItem('tvq_active_journey_v1')||'null')}catch{}
 if(!journey||journey.target!=='red-fortress')strategicBattleLockReason='Bu yürüş artıq tamamlanıb və ya ləğv edilib.';
 else if(Number(journey.arrivesAt)>Date.now())strategicBattleLockReason='Ordu hələ düşmən qalasına çatmayıb.';
}
if(isBorderBattle){
  let diplomacy={};try{diplomacy=JSON.parse(localStorage.getItem('tvq_diplomacy_v1')||'{}')}catch{}
  const kingdom=dispatched.get('kingdom')||localStorage.getItem('tvq_border_battle_kingdom');
  let active=null;try{active=JSON.parse(localStorage.getItem('tvq_active_border_battle_v1')||'null')}catch{}
  const activeParams=active?.url?new URLSearchParams(String(active.url).split('?')[1]||''):null;
  const dispatchMatches=!!activeParams&&active.battleId===battleId&&active.kingdom===kingdom&&active.day===todayKey&&
   troopIds.every(type=>Math.max(0,Math.floor(Number(activeParams.get(type))||0))===Math.max(0,Math.floor(Number(dispatched.get(type))||0)));
  if(!dispatchMatches)strategicBattleLockReason='Bu döyüş üçün etibarlı aktiv qoşun göndərişi tapılmadı. Dünya xəritəsindən yenidən başla.';
  else if(kingdom&&diplomacy.borderBattles?.[kingdom]===todayKey)strategicBattleLockReason='Bu sərhəd döyüşü bu gün artıq tamamlanıb.';
}
if(isWorldMapAttack||isBorderBattle){
 let city={};try{city=JSON.parse(localStorage.getItem('taxt-ve-qilinc-city-v1')||'{}')}catch{}
 let available=city.army||{};
 // World-map troops have already been deducted from the city at dispatch.
 // Validate the battle form against the active journey, not the city's remaining garrison.
 if(isWorldMapAttack){
  try{
   const activeJourney=JSON.parse(localStorage.getItem('tvq_active_journey_v1')||'null');
   available=activeJourney?.target==='red-fortress'?(activeJourney.army||{}):{};
  }catch{available={}}
 } else if(isBorderBattle){
  // Border troops were deducted from the city at dispatch; validate against the recorded dispatch payload.
  available=Object.fromEntries(troopIds.map(type=>[type,Math.max(0,Math.floor(Number(dispatched.get(type))||0))]));
 }
 for(const type of troopIds){
  const field=document.getElementById('a-'+type);
  const requested=Math.max(0,Math.floor(Number(dispatched.get(type))||0));
  const owned=Math.max(0,Math.floor(Number(available[type])||0));
  if(field)field.value=String(Math.min(requested,owned));
 }
}
if(strategicBattleLockReason){
 const control=document.getElementById('fight');
 if(control){control.disabled=true;control.textContent='DÖYÜŞ BAĞLANIB';}
 const winner=document.getElementById('winner');
 if(winner)winner.textContent=strategicBattleLockReason;
}
if(isWorldMapAttack||isBorderBattle){const garrison=Math.max(1,Math.min(9999,Number(dispatched.get('garrison'))||(isBorderBattle?75:300)));const defense=isBorderBattle?{infantry:Number(dispatched.get('def_infantry'))||45,spearman:Number(dispatched.get('def_spearman'))||10,archer:Number(dispatched.get('def_archer'))||15,cavalry:Number(dispatched.get('def_cavalry'))||5,knight:Number(dispatched.get('def_knight'))||0}:{infantry:Math.round(garrison*.3),spearman:Math.round(garrison*.2),archer:Math.round(garrison*.3),cavalry:Math.round(garrison*.1),knight:0};defense.knight=Math.max(0,defense.knight||garrison-Object.values(defense).reduce((a,n)=>a+n,0));for(const [type,count] of Object.entries(defense)){document.getElementById('d-'+type).value=String(count);}if(isBorderBattle){const terrainField=document.getElementById('terrain');const requestedTerrain=dispatched.get('terrain')||'fortress';if([...terrainField.options].some(option=>option.value===requestedTerrain))terrainField.value=requestedTerrain;}}
// In the local battle simulator, defensive catapults come from the city's upgraded towers.
if(!dispatched.has('target')){
 try{
  const citySave=JSON.parse(localStorage.getItem('taxt-ve-qilinc-city-v1')||'{}');
  const towerLevel=Math.max(1,Math.min(10,Math.floor(Number(citySave.levels?.['Müdafiə qülləsi'])||1)));
  const defenseField=document.getElementById('defenseCatapult');
  if(defenseField&&!dispatched.has('defenseCatapult'))defenseField.value=String(Math.min(20,towerLevel-1));
 }catch{}
}
for(const type of troopIds){
 if(dispatched.has(type)){
  const field=document.getElementById('a-'+type);
  field.value=String(Math.max(0,Math.min(9999,Math.floor(Number(dispatched.get(type))||0))));
 }
}
function playCombatAnimation(attacker = {}, defender = {}, siege = {}, result = {}) {
  const field = document.getElementById('battlefield');
  const svgNS = 'http://www.w3.org/2000/svg';
  const projectileLayer = document.createElementNS(svgNS, 'g');
  projectileLayer.setAttribute('id', 'combatProjectiles');
  field.querySelector('#combatProjectiles')?.remove();
  field.appendChild(projectileLayer);
  const launch = (x1, y1, x2, y2, color, delay = 0, width = 3) => {
    const shot = document.createElementNS(svgNS, 'line');
    shot.setAttribute('x1', x1); shot.setAttribute('y1', y1);
    shot.setAttribute('x2', x1); shot.setAttribute('y2', y1);
    shot.setAttribute('stroke', color); shot.setAttribute('stroke-width', width);
    shot.setAttribute('stroke-linecap', 'round');
    projectileLayer.appendChild(shot);
    const flight = shot.animate(
      [{ x2: x1, y2: y1, opacity: 0.2 }, { x2, y2, opacity: 1 }],
      { duration: 520, delay, easing: 'ease-in' }
    );
    flight.onfinish = () => {
      const impact = document.createElementNS(svgNS, 'circle');
      impact.setAttribute('cx', x2);
      impact.setAttribute('cy', y2);
      impact.setAttribute('r', width >= 5 ? 5 : 2);
      impact.setAttribute('fill', color);
      impact.setAttribute('stroke', '#fff0c5');
      impact.setAttribute('stroke-width', '1.5');
      projectileLayer.appendChild(impact);
      impact.animate(
        [{ r: 2, opacity: 1 }, { r: width >= 5 ? 18 : 9, opacity: 0 }],
        { duration: width >= 5 ? 520 : 300, easing: 'ease-out' }
      ).onfinish = () => impact.remove();
      if (width >= 5) {
        for (let piece = 0; piece < 5; piece++) {
          const debris = document.createElementNS(svgNS, 'circle');
          debris.setAttribute('cx', x2);
          debris.setAttribute('cy', y2);
          debris.setAttribute('r', 2 + (piece % 2));
          debris.setAttribute('fill', '#a99b7b');
          projectileLayer.appendChild(debris);
          const dx = (piece - 2) * 9;
          const dy = -8 - (piece % 3) * 6;
          debris.animate(
            [{ transform: 'translate(0px,0px)', opacity: 1 },
             { transform: `translate(${dx}px,${dy}px)`, opacity: 0 }],
            { duration: 560, easing: 'ease-out' }
          ).onfinish = () => debris.remove();
        }
      }
    };
  };
  const archerShots = Math.min(8, Math.ceil((attacker.archer || 0) / 20));
  for (let i = 0; i < archerShots; i++) {
    launch(90 + i * 18, 235 + (i % 2) * 12, 380 + i * 7, 150 + (i % 3) * 15, '#e8d7ad', i * 95, 2);
  }
  const defendingShots = Math.min(8, Math.ceil((defender.archer || 0) / 20));
  for (let i = 0; i < defendingShots; i++) {
    const wallArcher = result.terrain === 'fortress';
    const sourceX = wallArcher ? 226 + (i % 4) * 49 : 370 - i * 15;
    const sourceY = wallArcher ? 66 : 80 + (i % 3) * 8;
    launch(sourceX, sourceY, 185 - i * 8, 240 + (i % 2) * 12, '#f0b29a', 160 + i * 105, 2);
  }
  const catapultShots = Math.min(4, siege.catapult || 0);
  for (let i = 0; i < catapultShots; i++) {
    launch(115 + i * 24, 210, 365 + i * 10, 158 + i * 12, '#e1a34b', i * 170, 5);
  }
  const fortressCounterShots = result.terrain === 'fortress'
    ? Math.min(9, Math.max(0, Number(result.siege?.defensiveCatapults) || 0)) : 0;
  for (let i = 0; i < fortressCounterShots; i++) {
    const sourceX = 222 + i * 21;
    const targetX = 92 + (i * 47) % 390;
    const targetY = 242 + (i % 3) * 17;
    const arm = field.querySelector(`#defensiveCatapultArm${i}`);
    if (arm) arm.animate(
      [{ transform: 'rotate(-8deg)' }, { transform: 'rotate(32deg)' }, { transform: 'rotate(-8deg)' }],
      { duration: 620, delay: 180 + i * 150, easing: 'cubic-bezier(.2,.8,.2,1)' }
    );
    launch(sourceX, 78, targetX, targetY, '#8f8b80', 260 + i * 150, 6);
  }
  // Defensive towers fire coordinated arrow volleys; higher towers field more
  // firing positions, independently of the heavy defensive catapults.
  const towerVolleyCount = result.terrain === 'fortress'
    ? Math.min(10, Math.max(1, Number(result.modifiers?.defenderBuildings?.tower) || 1)) : 0;
  for (let wave = 0; wave < 2; wave++) {
    for (let i = 0; i < towerVolleyCount; i++) {
      const sourceX = 222 + (i % 5) * 38;
      const sourceY = 61 + Math.floor(i / 5) * 8;
      const targetX = 78 + ((i * 53 + wave * 31) % 440);
      const targetY = 226 + ((i + wave) % 3) * 19;
      launch(sourceX, sourceY, targetX, targetY, '#e8c879', 180 + wave * 760 + i * 72, 3);
    }
  }
  // Bring siege engines forward during the assault sequence.
  const siegeLayer = field.querySelector('#siegeMachines');
  if (siegeLayer) {
    [...siegeLayer.children].forEach((machine, index) => {
      if (machine.id?.startsWith('batteringRam')) {
        machine.animate(
          [{ transform: 'translate(0px,0px)' }, { transform: 'translate(0px,-8px)' }, { transform: 'translate(0px,7px)' }, { transform: 'translate(0px,0px)' }],
          { duration: 520, delay: 250 + index * 220, iterations: 3, easing: 'cubic-bezier(.2,.8,.2,1)' }
        );
        if (result.terrain === 'fortress') {
          const gateImpact = document.createElementNS(svgNS, 'g');
          gateImpact.setAttribute('class', 'ram-gate-impact');
          const impactX = 286 + index * 24;
          svgNode('path', { d: `M${impactX} 111 l-13 -8 m13 8 l-15 5 m15 -5 l12 -11 m-12 11 l12 10`, stroke: '#f2c36d', 'stroke-width': 3, 'stroke-linecap': 'round', fill: 'none' }, gateImpact);
          svgNode('circle', { cx: impactX, cy: 111, r: 8, fill: 'none', stroke: '#f2c36d', 'stroke-width': 2 }, gateImpact);
          field.appendChild(gateImpact);
          gateImpact.animate(
            [{ opacity: 0, transform: 'scale(.45)', transformOrigin: `${impactX}px 111px` },
             { opacity: 1, transform: 'scale(1.2)', transformOrigin: `${impactX}px 111px` },
             { opacity: 0, transform: 'scale(1.8)', transformOrigin: `${impactX}px 111px` }],
            { duration: 560, delay: 250 + index * 220, iterations: 3, easing: 'ease-out' }
          ).onfinish = () => gateImpact.remove();
          for (let hit = 0; hit < 3; hit++) {
            const splinter = document.createElementNS(svgNS, 'path');
            splinter.setAttribute('d', `M${impactX} 111 l0 -5 l5 -3 l-1 8Z`);
            splinter.setAttribute('fill', '#c18a4b');
            field.appendChild(splinter);
            splinter.animate(
              [{ transform: 'translate(0px,0px)', opacity: 1 },
               { transform: `translate(${(hit-1)*13}px,${-10-hit*5}px) rotate(${(hit-1)*35}deg)`, opacity: 0 }],
              { duration: 520, delay: 250 + index * 220 + hit * 35, iterations: 3, easing: 'ease-out' }
            ).onfinish = () => splinter.remove();
          }
          // Masonry fragments and dust now react to every battering-ram strike.
          for (let chunk = 0; chunk < 4; chunk++) {
            const stone = document.createElementNS(svgNS, 'path');
            stone.setAttribute('d', `M${impactX-5} 119 l6 -5 l7 4 l-3 7 l-8 0Z`);
            stone.setAttribute('fill', ['#858579', '#aaa28f', '#66685f', '#b3aa96'][chunk]);
            stone.setAttribute('stroke', '#393b35'); stone.setAttribute('stroke-width', '1');
            field.appendChild(stone);
            stone.animate(
              [{ transform: 'translate(0px,0px) rotate(0deg)', opacity: 1 },
               { transform: `translate(${(chunk-1.5)*15}px,${-4+chunk*5}px) rotate(${(chunk-1)*42}deg)`, opacity: 0 }],
              { duration: 760, delay: 250 + index * 220 + chunk * 28, iterations: 3, easing: 'ease-out' }
            ).onfinish = () => stone.remove();
          }
          const dust = document.createElementNS(svgNS, 'circle');
          dust.setAttribute('cx', impactX); dust.setAttribute('cy', '116');
          dust.setAttribute('r', '5'); dust.setAttribute('fill', '#c5b99d');
          dust.setAttribute('opacity', '.7'); field.appendChild(dust);
          dust.animate([{ r: 5, opacity: .7 }, { r: 24, opacity: 0 }],
            { duration: 680, delay: 250 + index * 220, iterations: 3, easing: 'ease-out' }
          ).onfinish = () => dust.remove();
        }
      } else if (index >= catapultShots && index < catapultShots + Math.min(2, siege.tower || 0)) {
        machine.animate(
          [{ transform: 'translate(0px,0px)' }, { transform: 'translate(-46px,-8px)' }],
          { duration: 1250, delay: 180 + index * 180, fill: 'forwards', easing: 'ease-in' }
        );
      }
    });
  }
  const attackLayer = document.getElementById('attackerUnits');
  const defendLayer = document.getElementById('defenderUnits');
  field.classList.remove('combat-active');
  void field.getBoundingClientRect();
  field.classList.add('combat-active');

  // Animate complete troop groups so the movement remains visible after
  // the post-battle formation has been rendered.
  [...attackLayer.querySelectorAll('g')].forEach((group, index) => {
    const formation = group.getAttribute('transform');
    const type = group.getAttribute('data-unit-type');
    const breached = !!result.siege?.wallBreached;
    const attackerWon = result.winner === 'attacker';
    const advance = breached && attackerWon ? -58 : breached ? -12 : -18;
    const motions = {
      infantry: [{ transform: formation }, { transform: formation + ` translate(0,${advance - 8})` }, { transform: formation + ` translate(0,${advance})` }],
      spearman: [{ transform: formation }, { transform: formation + ` translate(0,${advance - 12}) rotate(-3deg)` }, { transform: formation + ` translate(0,${advance})` }],
      archer: [{ transform: formation }, { transform: formation + ' translate(0,-5) rotate(-5deg)' }, { transform: formation + ' translate(0,-2)' }],
      cavalry: [{ transform: formation }, { transform: formation + ` translate(0,${advance - 22}) scale(1.08)` }, { transform: formation + ` translate(0,${advance})` }],
      knight: [{ transform: formation }, { transform: formation + ` translate(0,${advance - 15}) scale(1.12)` }, { transform: formation + ` translate(0,${advance})` }]
    };
    const motion = motions[type] || motions.infantry;
    group.animate(motion, {
      duration: breached ? 1450 : type === 'cavalry' || type === 'knight' ? 980 : 760,
      delay: index * 130, fill: breached ? 'forwards' : 'none', easing: 'ease-in-out'
    });
    if (type === 'spearman' || type === 'infantry' || type === 'knight') {
      group.animate(
        [{ opacity: 1 }, { opacity: 0.86 }, { opacity: 1 }],
        { duration: 430, delay: 420 + index * 110, iterations: 2 }
      );
    }
  });
  [...defendLayer.querySelectorAll('g')].forEach((group, index) => {
    const formation = group.getAttribute('transform');
    const type = group.getAttribute('data-unit-type');
    const breached = !!result.siege?.wallBreached;
    const attackerWon = result.winner === 'attacker';
    const retreatDistance = type === 'cavalry' || type === 'knight' ? 34 : type === 'archer' ? 27 : 21;
    const defenderAdvance = type === 'cavalry' || type === 'knight' ? 30 : 19;
    const motion = breached
      ? attackerWon
        ? [{ transform: formation }, { transform: formation + ' translate(0,8)' }, { transform: formation + ` translate(0,${-retreatDistance})` }]
        : [{ transform: formation }, { transform: formation + ' translate(0,13) scale(1.04)' }, { transform: formation + ` translate(0,${defenderAdvance})` }]
      : [{ transform: formation }, { transform: formation + (type === 'infantry' || type === 'knight' ? ' translate(0,3) scale(1.03)' : ' translate(0,5)') }, { transform: formation }];
    group.animate(motion, {
      duration: breached ? 1680 : type === 'cavalry' ? 920 : 680,
      delay: index * 125, fill: breached ? 'forwards' : 'none', easing: 'ease-in-out'
    });
    if (breached && type === 'archer') {
      group.animate(
        [{ opacity: 1 }, { opacity: .9 }, { opacity: .45 }],
        { duration: 980, delay: 480 + index * 90, fill: 'forwards', easing: 'ease-out' }
      );
    }
  });
  // Raise the attacker's standard over the captured fortress after the breach.
  if (isWorldMapAttack && result.winner === 'attacker' && result.siege?.wallBreached) {
    const capture = document.createElementNS(svgNS, 'g');
    capture.setAttribute('id', 'fortressCaptureSequence');
    const flagX = 300, flagY = 54;
    svgNode('path', { d: `M${flagX} ${flagY+5} L${flagX} 8`, stroke:'#d7d0b9', 'stroke-width':4, 'stroke-linecap':'round' }, capture);
    const banner = svgNode('path', { d:`M${flagX} 10 L${flagX+35} 17 L${flagX+31} 36 L${flagX} 29 Z`, fill:'#a83d32', stroke:'#e6c77c', 'stroke-width':2 }, capture);
    svgNode('path', { d:`M${flagX+7} 15 L${flagX+27} 19 M${flagX+7} 22 L${flagX+25} 25`, stroke:'#f2dfb0', 'stroke-width':2 }, capture);
    field.appendChild(capture);
    capture.animate(
      [{opacity:0,transform:'translate(0px,30px) scale(.75)'},{opacity:1,transform:'translate(0px,0px) scale(1)'}],
      {duration:1350,delay:2050,easing:'cubic-bezier(.2,.8,.2,1)',fill:'forwards'}
    );
    banner.animate(
      [{d:`M${flagX} 10 L${flagX+35} 17 L${flagX+31} 36 L${flagX} 29 Z`},
       {d:`M${flagX} 10 Q${flagX+18} 4 ${flagX+35} 17 L${flagX+31} 36 Q${flagX+14} 28 ${flagX} 29 Z`}],
      {duration:720,delay:3400,iterations:3,direction:'alternate'}
    );
    const title=svgNode('text',{x:300,y:48,'text-anchor':'middle',fill:'#f4d68b','font-size':17,'font-weight':800,stroke:'#20251f','stroke-width':3,'paint-order':'stroke',opacity:0},capture,'QALA ƏLƏ KEÇİRİLDİ');
    title.animate([{opacity:0,transform:'translate(0px,10px)'},{opacity:1,transform:'translate(0px,-18px)'}],
      {duration:1700,delay:2550,fill:'forwards',easing:'ease-out'});
  }
  const wallGuards = field.querySelectorAll('#fortressDefenses > g');
  wallGuards.forEach((guard, index) => {
    const base = guard.getAttribute('transform');
    const retreat = result.winner === 'attacker' && result.siege?.wallBreached;
    guard.animate(
      retreat
        ? [{ transform: base, opacity: 1 }, { transform: base + ' translate(0,5)', opacity: 1 }, { transform: base + ' translate(0,-25)', opacity: 0 }]
        : [{ transform: base }, { transform: base + ' translate(0,3)' }, { transform: base }],
      { duration: retreat ? 1420 : 640, delay: 420 + index * 110, fill: retreat ? 'forwards' : 'none', easing: 'ease-in-out' }
    );
  });
  // A breached gate triggers a visible melee only after the attackers reach
  // the courtyard; if defenders win, the defending line surges forward.
  if (result.siege?.wallMax && result.siege.wallDamage > 0) {
    const damage = Math.min(100, Number(result.siege.wallDamage) || 0);
    const field = document.getElementById('battlefield');
    const impact = document.createElementNS(svgNS, 'g');
    impact.setAttribute('id', 'wallImpactAnimation');
    const burst = svgNode('g', { transform: 'translate(300 112)' }, impact);
    for (let i = 0; i < Math.min(12, Math.max(4, Math.ceil(damage / 9))); i++) {
      const angle = (Math.PI * 2 * i) / 12;
      const dx = Math.cos(angle) * (18 + damage * .24);
      const dy = Math.sin(angle) * (12 + damage * .12);
      svgNode('path', { d: `M0 0 L${dx.toFixed(1)} ${dy.toFixed(1)}`, stroke: '#e1b36b', 'stroke-width': 2.4, 'stroke-linecap': 'round', opacity: .9 }, burst);
    }
    for (let i = 0; i < Math.min(10, Math.ceil(damage / 10)); i++) {
      const x = 270 + ((i * 17) % 60);
      const y = 116 + ((i * 13) % 18);
      const stone = svgNode('path', { d: `M${x} ${y} l5 -4 l7 3 l-2 6 l-8 0Z`, fill: '#b0a99a', stroke: '#393b35', 'stroke-width': 1 }, impact);
      stone.style.transformBox = 'fill-box';
      stone.style.transformOrigin = 'center';
      stone.animate([{ transform: 'translate(0,0) rotate(0deg)', opacity: 1 }, { transform: `translate(${(i%2?1:-1)*(8+damage*.08)}px,${8+damage*.12}px) rotate(${i%2?45:-45}deg)`, opacity: 0 }], { duration: 760 + i*35, easing: 'ease-out' });
    }
    field.appendChild(impact);
    // Each successful siege volley chips a different section of masonry;
    // fragments fall away and the newly exposed crack remains on the wall.
    const freshDamage = Math.max(0, Math.min(100, Number(result.siege.wallDamageThisBattle) || 0));
    if (freshDamage > 0) {
      const hitCount = Math.min(8, Math.max(1, Math.ceil(freshDamage / 13)));
      for (let hit = 0; hit < hitCount; hit++) {
        const x = 226 + ((hit * 37 + 19) % 145);
        const y = 83 + ((hit * 17 + 9) % 37);
        const delay = 420 + hit * 190;
        const fracture = svgNode('path', {
          d: `M${x} ${y} l-5 8 l8 5 l-5 10 M${x+3} ${y+13} l8 5`,
          fill: 'none', stroke: '#211f1a', 'stroke-width': 2.8,
          'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0
        }, field);
        fracture.animate(
          [{ opacity: 0, strokeWidth: 1 }, { opacity: 1, strokeWidth: 3 }],
          { duration: 420, delay, fill: 'forwards', easing: 'ease-out' }
        );
        for (let piece = 0; piece < 3; piece++) {
          const shard = svgNode('path', {
            d: `M${x} ${y+8} l5 -4 l6 4 l-3 6 l-7 0Z`,
            fill: ['#8c8c80', '#aaa28f', '#686b63'][piece],
            stroke: '#343630', 'stroke-width': 1
          }, field);
          shard.animate(
            [{ transform: 'translate(0px,0px) rotate(0deg)', opacity: 1 },
             { transform: `translate(${(piece-1)*13}px,${18+piece*4}px) rotate(${(piece-1)*48}deg)`, opacity: 0 }],
            { duration: 760, delay: delay + 80 + piece * 25, easing: 'ease-in' }
          ).onfinish = () => shard.remove();
        }
      }
      const wallShake = field.querySelector('#terrainBackdrop');
      if (wallShake) wallShake.animate(
        [{ transform: 'translate(0px,0px)' }, { transform: 'translate(-2px,1px)' },
         { transform: 'translate(2px,-1px)' }, { transform: 'translate(0px,0px)' }],
        { duration: 300, delay: 350, iterations: Math.min(4, hitCount), easing: 'ease-in-out' }
      );
    }
  }
  // Show representative fallen soldiers for each side, scaled to actual battle losses.
  const casualtyLayer = document.createElementNS(svgNS, 'g');
  casualtyLayer.setAttribute('id', 'battleCasualties');
  field.querySelector('#battleCasualties')?.remove();
  const casualtyLanes = { infantry: 105, spearman: 220, archer: 370, cavalry: 490, knight: 300 };
  for (const side of ['attacker', 'defender']) {
    const losses = result.losses?.[side] || {};
    const color = side === 'attacker' ? '#c8e0b7' : '#e5a18b';
    let shown = 0;
    for (const type of troopIds) {
      const lost = Math.max(0, Math.floor(Number(losses[type]) || 0));
      if (!lost) continue;
      const marks = Math.min(3, Math.max(1, Math.ceil(lost / Math.max(1, Math.ceil(((attacker[type] || 0) + (defender[type] || 0)) / 18)))));
      for (let i = 0; i < marks; i++) {
        const x = casualtyLanes[type] + (i - (marks - 1) / 2) * 13 + (side === 'attacker' ? 0 : 7);
        const y = side === 'attacker' ? 285 + (shown % 2) * 8 : 137 + (shown % 2) * 8;
        const fallen = svgNode('g', { transform: `translate(${x} ${y})`, opacity: 0 }, casualtyLayer);
        svgNode('circle', { cx: 0, cy: 0, r: 4, fill: '#d9b58a', stroke: '#292722', 'stroke-width': 1 }, fallen);
        svgNode('path', { d: 'M-3 5 L10 8 L13 13 L-7 12Z', fill: color, stroke: '#292722', 'stroke-width': 1.5 }, fallen);
        svgNode('path', { d: 'M-2 10 L-10 16 M7 11 L14 17 M0 7 L-9 4', stroke: '#30251e', 'stroke-width': 2.5, 'stroke-linecap': 'round' }, fallen);
        fallen.animate(
          [{ opacity: 0, transform: `translate(${x} ${y-13}) rotate(-22deg)` },
           { opacity: 1, transform: `translate(${x} ${y}) rotate(0deg)` }],
          { duration: 520, delay: 700 + shown * 115, fill: 'forwards', easing: 'ease-out' }
        );
        shown++;
      }
      if (shown >= 8) break;
    }
    const totalLost = Object.values(losses).reduce((sum, count) => sum + Math.max(0, Number(count) || 0), 0);
    if (totalLost > 0) {
      svgNode('text', {
        x: side === 'attacker' ? 72 : 528, y: side === 'attacker' ? 326 : 28,
        'text-anchor': side === 'attacker' ? 'start' : 'end',
        fill: color, 'font-size': 11, 'font-weight': 700,
        stroke: '#17251f', 'stroke-width': 2, 'paint-order': 'stroke'
      }, casualtyLayer, `İTKİ: ${totalLost}`);
    }
  }
  field.appendChild(casualtyLayer);
  if (result.siege?.wallBreached) {
    const meleeLayer = document.createElementNS(svgNS, 'g');
    meleeLayer.setAttribute('id', 'courtyardMelee');
    field.querySelector('#courtyardMelee')?.remove();
    field.appendChild(meleeLayer);
    const attackerWon = result.winner === 'attacker';
    for (let i = 0; i < 5; i++) {
      const clash = document.createElementNS(svgNS, 'path');
      const x = 266 + i * 17;
      const y = 174 + (i % 2) * 19;
      clash.setAttribute('d', `M${x - 7} ${y - 8} L${x + 7} ${y + 8} M${x + 7} ${y - 8} L${x - 7} ${y + 8}`);
      clash.setAttribute('stroke', attackerWon ? '#f7d27e' : '#f0a18b');
      clash.setAttribute('stroke-width', '3');
      clash.setAttribute('stroke-linecap', 'round');
      meleeLayer.appendChild(clash);
      clash.animate(
        [{ opacity: 0, transform: 'scale(.45)' }, { opacity: 1, transform: 'scale(1.2)' }, { opacity: 0, transform: 'scale(.7)' }],
        { duration: 620, delay: 1050 + i * 170, easing: 'ease-out' }
      ).onfinish = () => clash.remove();
    }
    if (!attackerWon) {
      [...defendLayer.querySelectorAll('g')].forEach((group, index) => {
        const formation = group.getAttribute('transform');
        group.animate(
          [{ transform: formation }, { transform: formation + ' translate(0,18)' }, { transform: formation }],
          { duration: 820, delay: 1350 + index * 120, easing: 'ease-in-out' }
        );
      });
    }
  }
  const arrow = document.querySelector('#attackArrow line');
  if (arrow) {
    arrow.animate(
      [{ opacity: 0.2, strokeWidth: 4 }, { opacity: 1, strokeWidth: 9 }, { opacity: 0.35, strokeWidth: 4 }],
      { duration: 1000, iterations: 2 }
    );
  }
}

let currentWallDamage = 0;

function refreshPreview() {
  const previewCity = (() => { try { return JSON.parse(localStorage.getItem('taxt-ve-qilinc-city-v1') || '{}'); } catch { return {}; } })();
  const previewWallNames = ['Şimal qala divarı','Cənub qala divarı','Qərb qala divarı','Şərq qala divarı'];
  const previewWallLevel = Math.max(1, Math.min(10, Math.round(previewWallNames.reduce((sum, name) => sum + (Number(previewCity.levels?.[name]) || 1), 0) / previewWallNames.length)));
  renderBattlefield(readArmy('a'), readArmy('d'), document.getElementById('direction').value, document.getElementById('terrain').value, currentWallDamage, { ram: Number(document.getElementById('ram').value) || 0, catapult: Number(document.getElementById('catapult').value) || 0, tower: Number(document.getElementById('tower').value) || 0, defenseCatapult: Number(document.getElementById('defenseCatapult')?.value) || 0, defenseTowerLevel: Math.max(1, Math.min(10, Math.floor(Number(previewCity.levels?.['Müdafiə qülləsi']) || 1))), defenseWallLevel: previewWallLevel });
}

refreshPreview();
document.querySelectorAll('input[type="number"], #direction').forEach(control => {
  control.addEventListener('input', refreshPreview);
  control.addEventListener('change', refreshPreview);
});
document.getElementById('fight').addEventListener('click', async () => {
  const attacker = readArmy('a');
  if(isWorldMapAttack){
    let active=null;
    try{active=JSON.parse(localStorage.getItem('tvq_active_journey_v1')||'null')}catch{}
    if(!active||active.target!=='red-fortress'||Number(active.arrivesAt)>Date.now()){
      const message='Aktiv yürüş tapılmadı və ya ordu hələ qalaya çatmayıb.';
      strategicBattleLockReason=message;
      const button=document.getElementById('fight');
      button.disabled=true;button.textContent='DÖYÜŞ BAĞLANIB';
      document.getElementById('winner').textContent=message;
      return;
    }
    for(const type of troopIds)attacker[type]=Math.min(attacker[type],Math.max(0,Math.floor(Number(active.army?.[type])||0)));
  }
  if((isWorldMapAttack||isBorderBattle)&&total(attacker)<=0){
    const message='Hücum ordusunda döyüşə biləcək əsgər yoxdur.';
    strategicBattleLockReason=message;
    const button=document.getElementById('fight');
    button.disabled=true;button.textContent='DÖYÜŞ MÜMKÜN DEYİL';
    document.getElementById('winner').textContent=message;
    return;
  }
  const defender = readArmy('d');
  const dispatchedPlan={};try{Object.assign(dispatchedPlan,JSON.parse(localStorage.getItem('tvq_attack_plan_v1')||'{}'))}catch{}
  const direction = isWorldMapAttack ? (dispatchedPlan.direction||dispatched.get('direction')||document.getElementById('direction').value) : document.getElementById('direction').value;
  const tactic = isWorldMapAttack ? (dispatchedPlan.tactic||dispatched.get('tactic')||document.getElementById('tactic').value) : document.getElementById('tactic').value;
  document.getElementById('direction').value=direction;
  document.getElementById('tactic').value=tactic;
  const terrain = document.getElementById('terrain').value;
  const siege = {
    ram: Math.max(0, Math.min(20, Math.floor(Number(isWorldMapAttack ? (dispatchedPlan.ram??dispatched.get('ram')??document.getElementById('ram').value) : document.getElementById('ram').value) || 0))),
    catapult: Math.max(0, Math.min(20, Math.floor(Number(isWorldMapAttack ? (dispatchedPlan.catapult??dispatched.get('catapult')??document.getElementById('catapult').value) : document.getElementById('catapult').value) || 0))),
    tower: Math.max(0, Math.min(20, Math.floor(Number(isWorldMapAttack ? (dispatchedPlan.tower??dispatched.get('tower')??document.getElementById('tower').value) : document.getElementById('tower').value) || 0)))
  };
  const defenseCatapult = Math.max(0, Math.min(20, Math.floor(Number(document.getElementById('defenseCatapult')?.value) || 0)));
  siege.defenseCatapult = defenseCatapult;
  siege.defenseTowerLevel = Math.max(1, Math.min(10, Math.floor(Number(localBuildings['Müdafiə qülləsi']) || 1)));
  document.getElementById('ram').value=String(siege.ram);
  document.getElementById('catapult').value=String(siege.catapult);
  document.getElementById('tower').value=String(siege.tower);
  const fightButton = document.getElementById('fight');
  if ((isWorldMapAttack || isBorderBattle) && fightButton.disabled) return;
  fightButton.disabled = true;
  fightButton.textContent = 'DÖYÜŞ HESABLANIR...';
  let priorWallDamage = 0;
  let priorWallDamageBySide = {};
  if (isWorldMapAttack) {
    try { const fortress=JSON.parse(localStorage.getItem('tvq_world_state_v1') || '{}').redFortress||{}; priorWallDamage=Number(fortress.wallDamage)||0; priorWallDamageBySide=fortress.wallDamageBySide||{}; } catch {}
  } else if (isBorderBattle) {
    try { const diplomacy=JSON.parse(localStorage.getItem('tvq_diplomacy_v1')||'{}'); const kingdom=dispatched.get('kingdom')||localStorage.getItem('tvq_border_battle_kingdom'); priorWallDamage=Number(diplomacy.borderCampaigns?.[kingdom]?.wallDamage)||0; priorWallDamageBySide=diplomacy.borderCampaigns?.[kingdom]?.wallDamageBySide||{}; } catch {}
  } else if (terrain === 'fortress') {
    try { const city=JSON.parse(localStorage.getItem('taxt-ve-qilinc-city-v1')||'{}'); priorWallDamage=Math.max(0,Math.min(100,Number(city.wallDamage)||0)); priorWallDamageBySide=city.wallDamageBySide||{}; } catch {}
  }
  let wallLevel = 1;
  // City wall upgrades protect the player's own fortress only; never apply them to enemy targets.
  if (terrain === 'fortress' && !isWorldMapAttack && !isBorderBattle) {
    try {
      const city = JSON.parse(localStorage.getItem('taxt-ve-qilinc-city-v1') || '{}');
      const levels = city.levels || {};
      const names = ['Şimal qala divarı','Cənub qala divarı','Qərb qala divarı','Şərq qala divarı'];
      wallLevel = Math.max(1, Math.min(10, Math.round(names.reduce((sum, name) => sum + (Number(levels[name]) || 1), 0) / names.length)));
    } catch {}
  }
  const commander=(()=>{try{return JSON.parse(localStorage.getItem('tvq_general_v1')||'{}')}catch{return {}}})();
  const commanderId=['alp','tomris','babek'].includes(dispatched.get('commander'))?dispatched.get('commander'):(commander.id||'alp');
  commander.id=commanderId;
  const localBuildings=(()=>{try{return JSON.parse(localStorage.getItem('taxt-ve-qilinc-city-v1')||'{}').levels||{}}catch{return {}}})();
  const attackerBuildings={barracks:Number(dispatched.get('barracksLevel'))||Number(localBuildings['Kazarma'])||1,archery:Number(dispatched.get('archeryLevel'))||Number(localBuildings['Oxçuluq meydançası'])||1,stable:Number(dispatched.get('stableLevel'))||Number(localBuildings['Tövlə'])||1};
  const defenderBuildings=(terrain==='fortress'&&!isWorldMapAttack&&!isBorderBattle)?{tower:Number(localBuildings['Müdafiə qülləsi'])||1,barracks:Number(localBuildings['Kazarma'])||1,archery:Number(localBuildings['Oxçuluq meydançası'])||1,stable:Number(localBuildings['Tövlə'])||1}:{};
  siege.defenseWallLevel = wallLevel;
  const result = resolveBattle({ attacker, defender, direction, tactic, terrain, siege, defenseCatapult, wallLevel, priorWallDamage, priorWallDamageBySide, commander, attackerBuildings, defenderBuildings, seed: Date.now() % 100000 });
  if(isWorldMapAttack||isBorderBattle){
   try{
    const ledger=JSON.parse(localStorage.getItem('tvq_resolved_battles_v1')||'{}');
    if(ledger[battleId]){strategicBattleLockReason='Bu döyüşün nəticəsi artıq hesablanıb.';fightButton.disabled=true;document.getElementById('winner').textContent=strategicBattleLockReason;return;}
    ledger[battleId]={resolvedAt:Date.now(),winner:result.winner};
    // Preserve resolved IDs permanently so an old URL cannot replay rewards or losses.
    localStorage.setItem('tvq_resolved_battles_v1',JSON.stringify(ledger));
   }catch(error){fightButton.disabled=false;document.getElementById('winner').textContent='Nəticəni təhlükəsiz yadda saxlamaq mümkün olmadı. Döyüşü təkrar hesablamadan əvvəl yaddaşı yoxla.';console.warn('Döyüş qoruma qeydi saxlanmadı',error);return;}
  }
  fightButton.textContent = (isWorldMapAttack || isBorderBattle) ? 'DÖYÜŞ TAMAMLANDI' : 'YENİ DÖYÜŞÜ HESABLA';
  if (!isWorldMapAttack && !isBorderBattle) fightButton.disabled = false;
  const survivingAttacker = result.remaining?.attacker ?? attacker;
  // Only dispatched world-map battles consume and update the city army.
  if (isWorldMapAttack || isBorderBattle) {
    try {
      await updateCitySave(saved => {
        const wounded = { infantry: 0, spearman: 0, archer: 0, cavalry: 0, knight: 0, ...(saved.wounded || {}) };
        saved.battleWoundClaims = saved.battleWoundClaims || {};
        // A battle may be retried after a failed later settlement step. Apply its wounded count once only.
        if (!saved.battleWoundClaims[battleId]) {
          for (const type of troopIds) {
            const battleLoss = Math.max(0, Number(result.losses?.attacker?.[type]) || 0);
            wounded[type] = (Number(wounded[type]) || 0) + Math.floor(battleLoss * 0.3);
          }
          saved.battleWoundClaims[battleId] = Date.now();
        }
        // The marching army was already removed from the city when the journey began.
        // Preserve any troops recruited while it was away; returning survivors are settled by the return-journey queue.
        saved.army = saved.army || {};
        saved.wounded = wounded;
      });
    } catch (error) {
      // The replay lock was written before settlement; release it if this first critical write fails.
      try {
        const ledger=JSON.parse(localStorage.getItem('tvq_resolved_battles_v1')||'{}');
        delete ledger[battleId];
        localStorage.setItem('tvq_resolved_battles_v1',JSON.stringify(ledger));
      } catch (rollbackError) { console.warn('Döyüş kilidini geri almaq mümkün olmadı',rollbackError); }
      fightButton.disabled=false;
      fightButton.textContent='YENİDƏN CƏHD ET';
      document.getElementById('winner').textContent='Qoşun itkisini yadda saxlamaq mümkün olmadı. Nəticə təsdiqlənmədi; yaddaş yerini yoxla və yenidən cəhd et.';
      console.warn('Ordunun nəticəsini yadda saxlamaq mümkün olmadı.', error);
      return;
    }
  }
  if(isWorldMapAttack || isBorderBattle){
   try{const key='tvq_general_v1';const current=JSON.parse(localStorage.getItem(key)||'{}');current.id=commanderId;current.xp=Math.max(0,Number(current.xp)||0)+25+(result.winner==='attacker'?25:0);localStorage.setItem(key,JSON.stringify(current));}
   catch(error){console.warn('Sərkərdə təcrübəsi saxlanmadı',error)}
  }
  const survivingDefender = result.remaining?.defender ?? defender;
  currentWallDamage = result.siege?.wallDamage || 0;
  if(terrain==='fortress'&&!isWorldMapAttack&&!isBorderBattle){try{await updateCitySave(saved=>{saved.wallDamage=currentWallDamage;saved.wallDamageBySide={...(result.siege?.wallDamageBySide||{})};saved.wallRepairStartedAt=0;saved.wallRepairEndsAt=0;saved.wallRepairInitialDamage=0})}catch(error){console.warn('Qala divarının zədəsi yadda saxlanmadı',error)}}
  siege.defenseTowerLevel = Math.max(1, Math.min(10, Math.floor(Number(defenderBuildings.tower || localBuildings['Müdafiə qülləsi']) || 1)));
  siege.wallDamageBySide = { ...(result.siege?.wallDamageBySide || {}) };
  siege.attackDirection = direction;
  renderBattlefield(survivingAttacker, survivingDefender, direction, terrain, currentWallDamage, siege);
  playCombatAnimation(attacker, defender, siege, result);
  const panel = document.getElementById('result');
  panel.style.display = 'block';
  if(isWorldMapAttack){try{const worldKey='tvq_world_state_v1';const world=JSON.parse(localStorage.getItem(worldKey)||'{}');const previous=world.redFortress||{};const captured=result.winner==='attacker';const now=Date.now();world.redFortress={...previous,captured,updatedAt:now,wallDamage:result.siege?.wallDamage??previous.wallDamage??0,wallDamageBySide:{...(result.siege?.wallDamageBySide||previous.wallDamageBySide||{})},capturedAt:captured?now:(previous.capturedAt||null),garrison:captured?{infantry:0,spearman:0,archer:0,cavalry:0,knight:0}:survivingDefender,remainingDefenders:total(survivingDefender),lastBattle:{winner:result.winner,at:now,attackerLosses:result.losses?.attacker||{},defenderLosses:result.losses?.defender||{},survivingAttackers:total(survivingAttacker)}};localStorage.setItem(worldKey,JSON.stringify(world));
const returnArmy=Object.fromEntries(['infantry','spearman','archer','cavalry','knight'].map(type=>[type,Math.max(0,Math.floor(Number(survivingAttacker[type])||0))]));
const returnTotal=Object.values(returnArmy).reduce((sum,n)=>sum+n,0);
const battleReport={id:'battle-'+now,winner:result.winner,at:now,captured,attackerLosses:{...(result.losses?.attacker||{})},defenderLosses:{...(result.losses?.defender||{})},survivingAttackers:{...returnArmy},survivingDefenders:{...(survivingDefender||{})},wallDamage:result.siege?.wallDamage??0,wallBreached:!!result.siege?.wallBreached,returnDuration:0};

const returnSpeed={infantry:1,spearman:.96,archer:1.04,cavalry:1.48,knight:1.22};
const weightedSpeed=Object.entries(returnArmy).reduce((sum,[type,count])=>sum+count*returnSpeed[type],0)/Math.max(1,returnTotal);
const returnDuration=returnTotal?Math.max(30000,Math.min(8*60*1000,Math.round((90000+Math.sqrt(returnTotal)*7000)/Math.max(.7,weightedSpeed)))):0;
battleReport.returnDuration=returnDuration;
try{
 localStorage.setItem('tvq_last_battle_report_v1',JSON.stringify(battleReport));
 const historyKey='tvq_battle_history_v1';
 const history=JSON.parse(localStorage.getItem(historyKey)||'[]');
 history.unshift(battleReport);
 localStorage.setItem(historyKey,JSON.stringify(history.slice(0,20)));
}catch(error){console.warn('Döyüş tarixçəsini saxlamaq mümkün olmadı',error)}
if(returnTotal){const trip={id:'battle-'+now,startedAt:now,arrivesAt:now+returnDuration,duration:returnDuration,army:returnArmy,result:captured?'victory':'defeat'};const queueKey='tvq_return_journeys_v1';const queue=(()=>{try{const value=JSON.parse(localStorage.getItem(queueKey)||'[]');return Array.isArray(value)?value:[]}catch{return []}})();queue.push(trip);localStorage.setItem(queueKey,JSON.stringify(queue));}
localStorage.removeItem('tvq_active_journey_v1');const outcome=document.createElement('p');outcome.style.cssText='margin-top:12px;color:#f0d69d;font-weight:700';outcome.textContent=captured?'Qırmızı Qala fəth edildi! Şəhərə qayıdaraq nəticəni gör.':'Hücum uğursuz oldu. Sağ qalan ordu şəhərə qaytarıldı.';panel.appendChild(outcome);const back=document.createElement('a');back.href='./city.html';back.textContent='Şəhərə qayıt';back.style.cssText='display:block;text-align:center;margin-top:10px;padding:12px;background:#76542c;border-radius:9px;color:white;text-decoration:none';panel.appendChild(back);}catch(error){console.warn('Döyüş nəticəsi saxlanmadı',error)}}
  if(isBorderBattle){
    const returnArmy=Object.fromEntries(troopIds.map(type=>[type,Math.max(0,Math.floor(Number(survivingAttacker[type])||0))]));
    const returnTotal=total(returnArmy);
    if(returnTotal){
      const queueKey='tvq_return_journeys_v1';
      const queue=(()=>{try{const value=JSON.parse(localStorage.getItem(queueKey)||'[]');return Array.isArray(value)?value:[]}catch{return []}})();
      if(!queue.some(trip=>trip.id===battleId)){
        const speed={infantry:1,spearman:.96,archer:1.04,cavalry:1.48,knight:1.22};
        const weighted=Object.entries(returnArmy).reduce((sum,[type,count])=>sum+count*speed[type],0)/Math.max(1,returnTotal);
        const duration=Math.max(30000,Math.min(8*60*1000,Math.round((90000+Math.sqrt(returnTotal)*7000)/Math.max(.7,weighted))));
        queue.push({id:battleId,startedAt:Date.now(),arrivesAt:Date.now()+duration,duration,army:returnArmy,result:result.winner==='attacker'?'victory':'defeat'});
        localStorage.setItem(queueKey,JSON.stringify(queue));
      }
    }
  }
  if(isBorderBattle){try{const diplomacyKey='tvq_diplomacy_v1';const diplomacy=JSON.parse(localStorage.getItem(diplomacyKey)||'{}');const kingdom=dispatched.get('kingdom')||localStorage.getItem('tvq_border_battle_kingdom');const dayNow=new Date();const dayKey=dayNow.getFullYear()+'-'+String(dayNow.getMonth()+1).padStart(2,'0')+'-'+String(dayNow.getDate()).padStart(2,'0');diplomacy.borderBattles=diplomacy.borderBattles||{};diplomacy.borderCampaigns=diplomacy.borderCampaigns||{};diplomacy.borderBattles[kingdom]=dayKey;const won=result.winner==='attacker';let campaign=diplomacy.borderCampaigns[kingdom]||{wins:0,captured:false};campaign.wallDamage=result.siege?.wallDamage??campaign.wallDamage??0;campaign.wallDamageBySide={...(result.siege?.wallDamageBySide||campaign.wallDamageBySide||{})};campaign.wallBreached=!!result.siege?.wallBreached;let captureBonus=0;campaign.lastBattleAt=Date.now();diplomacy.borderCampaigns[kingdom]=campaign;if(won){diplomacy.standings=diplomacy.standings||{};diplomacy.standings[kingdom]=(Number(diplomacy.standings[kingdom])||0)+1;if(!campaign.captured){campaign.wins=(Number(campaign.wins)||0)+1;if(campaign.wins>=3){campaign.captured=true;campaign.capturedAt=Date.now();campaign.lastCollectedAt=campaign.capturedAt;captureBonus=300;}}campaign.lastBattleAt=Date.now();diplomacy.borderCampaigns[kingdom]=campaign;await updateCitySave(saved=>{saved.resources=saved.resources||{wood:1200,stone:1000,gold:500};saved.battleRewardClaims=saved.battleRewardClaims||{};if(!saved.battleRewardClaims[battleId]){saved.resources.gold=(Number(saved.resources.gold)||0)+80+captureBonus;saved.battleRewardClaims[battleId]=Date.now();}});}localStorage.setItem(diplomacyKey,JSON.stringify(diplomacy));localStorage.removeItem('tvq_border_battle_kingdom');localStorage.removeItem('tvq_active_border_battle_v1');const outcome=document.createElement('p');outcome.style.cssText='margin-top:12px;color:#f0d69d;font-weight:700';outcome.textContent=won?(campaign.captured&&!captureBonus?'Sərhəd basqını dəf edildi! 80 qızıl və 1 nüfuz qazandın. Sərhəd məntəqəsi artıq sənin nəzarətindədir.':captureBonus?'Sərhəd basqını dəf edildi! 80 qızıl, 1 nüfuz və məntəqənin fəthi üçün əlavə 300 qızıl qazandın.':'Sərhəd basqını dəf edildi! 80 qızıl və 1 nüfuz qazandın. Kampaniya: '+campaign.wins+'/3 qələbə.'):'Sərhəd döyüşü məğlubiyyətlə bitdi. Sağ qalan qoşunların şəhərə qayıtdı.';panel.appendChild(outcome);const back=document.createElement('a');back.href='./world-map.html';back.textContent='Dünya xəritəsinə qayıt';back.style.cssText='display:block;text-align:center;margin-top:10px;padding:12px;background:#76542c;border-radius:9px;color:white;text-decoration:none';panel.appendChild(back);}catch(error){console.warn('Sərhəd döyüşü saxlanmadı',error)}}

  document.getElementById('winner').textContent =
    total(attacker) && total(defender)
      ? result.winner === 'attacker' ? '⚔ Hücum ordusu qalib gəldi' : '🛡 Müdafiə ordusu qalib gəldi'
      : 'Döyüş baş tutmadı';
  document.querySelector('#battlefield').setAttribute('aria-label',
    `Döyüşdən sonra sağ qalanlar: hücum ${total(survivingAttacker)}, müdafiə ${total(survivingDefender)} nəfər`);
  document.getElementById('ap').textContent = result.power?.attacker ?? '—';
  document.getElementById('dp').textContent = result.power?.defender ?? '—';
  document.getElementById('ar').textContent = total(result.remaining?.attacker ?? attacker);
  document.getElementById('dr').textContent = total(result.remaining?.defender ?? defender);
  document.getElementById('wallDamage').textContent = result.siege?.wallMax ? `${Math.round(result.siege.wallDamage)}/100 · Səviyyə ${result.siege.wallLevel}/10` : 'Tətbiq edilmir';
  document.getElementById('wallState').textContent = result.siege?.wallMax ? (result.siege.wallBreached ? 'Yarılıb' : 'Möhkəm') : 'Açıq ərazi';
  const lossText = losses => troopIds.filter(id => (losses?.[id] || 0) > 0)
    .map(id => troopNames[id] + ': ' + losses[id]).join(' · ') || 'İtki yoxdur';
  document.getElementById('aLoss').textContent = lossText(result.losses?.attacker);
  document.getElementById('dLoss').textContent = lossText(result.losses?.defender);
  const log = [
    'İstiqamət: ' + labels[result.direction],
    'Taktika: ' + labels[result.tactic],
    'Ərazi: ' + labels[result.terrain || 'plains'],
    ...(result.log || [])
  ];
  document.getElementById('log').replaceChildren(...log.map(line => {
    const li = document.createElement('li'); li.textContent = line; return li;
  }));
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});
