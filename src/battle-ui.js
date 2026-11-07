import { resolveBattle } from './battle.js';

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
    svgNode('rect', { x: 214, y: 76, width: 172, height: 54, fill: '#77786d', stroke: '#282b27', 'stroke-width': 5 }, scene);
    for (let x = 220; x < 386; x += 28) svgNode('rect', { x, y: 65, width: 14, height: 15, fill: '#99998a', stroke: '#282b27', 'stroke-width': 2 }, scene);
    svgNode('rect', { x: 270, y: 35, width: 58, height: 44, fill: '#858679', stroke: '#282b27', 'stroke-width': 4 }, scene);
    svgNode('path', { d: 'M262 36 L299 8 L336 36Z', fill: '#6f4032', stroke: '#282b27', 'stroke-width': 3 }, scene);
    svgNode('rect', { x: 284, y: 91, width: 24, height: 39, fill: '#211d19' }, scene);
    const damage = Math.max(0, Math.min(100, Number(wallDamage) || 0));
    const gate = svgNode('g', { id: 'fortressGate' }, scene);
    const gateOpen = damage >= 100;
    const leftGate = svgNode('path', {
      d: gateOpen ? 'M284 92 L273 96 L267 128 L280 130Z' : 'M284 92 L296 92 L296 130 L284 130Z',
      fill: '#80552f', stroke: '#30251e', 'stroke-width': 2
    }, gate);
    const rightGate = svgNode('path', {
      d: gateOpen ? 'M308 92 L319 96 L325 128 L312 130Z' : 'M296 92 L308 92 L308 130 L296 130Z',
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
    const defensiveMachines = Math.min(3, Math.max(0, Number(siege.defenseCatapult) || 0));
    for (let i = 0; i < defensiveMachines; i++) {
      const x = 238 + i * 62;
      const weapon = svgNode('g', { transform: `translate(${x} 91)` }, scene);
      svgNode('path', { d: 'M-13 12 L-9 -2 L9 -2 L13 12 M-17 -2 L17 -2 M0 -2 L0 -22', fill: 'none', stroke: '#4a3020', 'stroke-width': 3, 'stroke-linecap': 'round' }, weapon);
      svgNode('path', { d: 'M-5 -22 L5 -22 L3 -16 L-3 -16Z', fill: '#a18a58', stroke: '#30251e', 'stroke-width': 1.5 }, weapon);
      svgNode('circle', { cx: 0, cy: -25, r: 3.5, fill: '#77786d', stroke: '#292722', 'stroke-width': 1 }, weapon);
      svgNode('text', { x: 0, y: 24, 'text-anchor': 'middle', fill: '#ffe0a1', 'font-size': 8, 'font-weight': 700, stroke: '#292722', 'stroke-width': 1, 'paint-order': 'stroke' }, weapon, 'MÜDAFİƏ');
    }
  }
  if ((siege.catapult || 0) > 0 || (siege.ram || 0) > 0 || (siege.tower || 0) > 0) {
    const machines = document.createElementNS(svgNS, 'g');
    machines.setAttribute('id', 'siegeMachines');
    const catapults = Math.min(4, Math.max(0, Number(siege.catapult) || 0));
    for (let i = 0; i < catapults; i++) {
      const x = 52 + i * 48;
      const y = 255 + (i % 2) * 13;
      const machine = svgNode('g', { transform: `translate(${x} ${y})` }, machines);
      svgNode('path', { d: 'M-17 12 L0 -17 L18 12 M-12 5 L12 5 M0 -17 L0 -28', fill: 'none', stroke: '#4a3020', 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, machine);
      svgNode('path', { d: 'M-4 -28 L4 -28 L3 -22 L-3 -22Z', fill: '#9a7544', stroke: '#30251e', 'stroke-width': 2 }, machine);
      svgNode('circle', { cx: 0, cy: -30, r: 4, fill: '#292722' }, machine);
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
    ? Math.min(8, result.siege?.defensiveCatapults || 0) : 0;
  for (let i = 0; i < fortressCounterShots; i++) {
    const sourceX = 230 + (i % 4) * 44;
    const targetX = 92 + (i * 37) % 390;
    const targetY = 242 + (i % 3) * 17;
    launch(sourceX, 78, targetX, targetY, '#8f8b80', 260 + i * 210, 6);
  }
  // Bring siege engines forward during the assault sequence.
  const siegeLayer = field.querySelector('#siegeMachines');
  if (siegeLayer) {
    [...siegeLayer.children].forEach((machine, index) => {
      if (machine.id?.startsWith('batteringRam')) {
        machine.animate(
          [{ transform: 'translate(0px,0px)' }, { transform: 'translate(0px,-16px)' }, { transform: 'translate(0px,0px)' }],
          { duration: 360, delay: 250 + index * 220, iterations: 3, easing: 'ease-in-out' }
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
  renderBattlefield(readArmy('a'), readArmy('d'), document.getElementById('direction').value, document.getElementById('terrain').value, currentWallDamage, { ram: Number(document.getElementById('ram').value) || 0, catapult: Number(document.getElementById('catapult').value) || 0, tower: Number(document.getElementById('tower').value) || 0, defenseCatapult: Number(document.getElementById('defenseCatapult')?.value) || 0 });
}

refreshPreview();
document.querySelectorAll('input[type="number"], #direction').forEach(control => {
  control.addEventListener('input', refreshPreview);
  control.addEventListener('change', refreshPreview);
});
document.getElementById('fight').addEventListener('click', () => {
  const attacker = readArmy('a');
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
  document.getElementById('ram').value=String(siege.ram);
  document.getElementById('catapult').value=String(siege.catapult);
  document.getElementById('tower').value=String(siege.tower);
  const fightButton = document.getElementById('fight');
  if (isWorldMapAttack && fightButton.disabled) return;
  fightButton.disabled = true;
  fightButton.textContent = 'DÖYÜŞ HESABLANIR...';
  let priorWallDamage = 0;
  if (isWorldMapAttack) {
    try { priorWallDamage = Number(JSON.parse(localStorage.getItem('tvq_world_state_v1') || '{}').redFortress?.wallDamage) || 0; } catch {}
  } else if (isBorderBattle) {
    try { const diplomacy=JSON.parse(localStorage.getItem('tvq_diplomacy_v1')||'{}'); const kingdom=dispatched.get('kingdom')||localStorage.getItem('tvq_border_battle_kingdom'); priorWallDamage=Number(diplomacy.borderCampaigns?.[kingdom]?.wallDamage)||0; } catch {}
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
  const result = resolveBattle({ attacker, defender, direction, tactic, terrain, siege, defenseCatapult, wallLevel, priorWallDamage, seed: Date.now() % 100000 });
  fightButton.textContent = isWorldMapAttack ? 'DÖYÜŞ TAMAMLANDI' : 'YENİ DÖYÜŞÜ HESABLA';
  if (!isWorldMapAttack) fightButton.disabled = false;
  const survivingAttacker = result.remaining?.attacker ?? attacker;
  // Only dispatched world-map battles consume and update the city army.
  if (isWorldMapAttack || isBorderBattle) {
    try {
      const saveKey = 'taxt-ve-qilinc-city-v1';
      const saved = JSON.parse(localStorage.getItem(saveKey) || '{}');
      const wounded = { infantry: 0, spearman: 0, archer: 0, cavalry: 0, knight: 0, ...(saved.wounded || {}) };
      for (const type of troopIds) {
        const battleLoss = Math.max(0, Number(result.losses?.attacker?.[type]) || 0);
        wounded[type] = (Number(wounded[type]) || 0) + Math.floor(battleLoss * 0.3);
      }
      localStorage.setItem(saveKey, JSON.stringify({ ...saved, army: survivingAttacker, wounded }));
    } catch (error) {
      console.warn('Ordunun nəticəsini yadda saxlamaq mümkün olmadı.', error);
    }
  }
  const survivingDefender = result.remaining?.defender ?? defender;
  currentWallDamage = result.siege?.wallDamage || 0;
  renderBattlefield(survivingAttacker, survivingDefender, direction, terrain, currentWallDamage, siege);
  playCombatAnimation(attacker, defender, siege, result);
  const panel = document.getElementById('result');
  panel.style.display = 'block';
  if(isWorldMapAttack){try{const worldKey='tvq_world_state_v1';const world=JSON.parse(localStorage.getItem(worldKey)||'{}');const previous=world.redFortress||{};const captured=result.winner==='attacker';const now=Date.now();world.redFortress={...previous,captured,updatedAt:now,wallDamage:result.siege?.wallDamage??previous.wallDamage??0,capturedAt:captured?now:(previous.capturedAt||null),garrison:captured?{infantry:0,spearman:0,archer:0,cavalry:0,knight:0}:survivingDefender,remainingDefenders:total(survivingDefender),lastBattle:{winner:result.winner,at:now,attackerLosses:result.losses?.attacker||{},defenderLosses:result.losses?.defender||{},survivingAttackers:total(survivingAttacker)}};localStorage.setItem(worldKey,JSON.stringify(world));localStorage.removeItem('tvq_active_journey_v1');const outcome=document.createElement('p');outcome.style.cssText='margin-top:12px;color:#f0d69d;font-weight:700';outcome.textContent=captured?'Qırmızı Qala fəth edildi! Şəhərə qayıdaraq nəticəni gör.':'Hücum uğursuz oldu. Sağ qalan ordu şəhərə qaytarıldı.';panel.appendChild(outcome);const back=document.createElement('a');back.href='./city.html';back.textContent='Şəhərə qayıt';back.style.cssText='display:block;text-align:center;margin-top:10px;padding:12px;background:#76542c;border-radius:9px;color:white;text-decoration:none';panel.appendChild(back);}catch(error){console.warn('Döyüş nəticəsi saxlanmadı',error)}}
  if(isBorderBattle){try{const diplomacyKey='tvq_diplomacy_v1';const diplomacy=JSON.parse(localStorage.getItem(diplomacyKey)||'{}');const kingdom=dispatched.get('kingdom')||localStorage.getItem('tvq_border_battle_kingdom');const dayNow=new Date();const dayKey=dayNow.getFullYear()+'-'+String(dayNow.getMonth()+1).padStart(2,'0')+'-'+String(dayNow.getDate()).padStart(2,'0');diplomacy.borderBattles=diplomacy.borderBattles||{};diplomacy.borderCampaigns=diplomacy.borderCampaigns||{};const won=result.winner==='attacker';let campaign=diplomacy.borderCampaigns[kingdom]||{wins:0,captured:false};campaign.wallDamage=result.siege?.wallDamage??campaign.wallDamage??0;campaign.wallBreached=!!result.siege?.wallBreached;let captureBonus=0;campaign.lastBattleAt=Date.now();diplomacy.borderCampaigns[kingdom]=campaign;if(won){diplomacy.borderBattles[kingdom]=dayKey;diplomacy.standings=diplomacy.standings||{};diplomacy.standings[kingdom]=(Number(diplomacy.standings[kingdom])||0)+1;if(!campaign.captured){campaign.wins=(Number(campaign.wins)||0)+1;if(campaign.wins>=3){campaign.captured=true;campaign.capturedAt=Date.now();campaign.lastCollectedAt=campaign.capturedAt;captureBonus=300;}}campaign.lastBattleAt=Date.now();diplomacy.borderCampaigns[kingdom]=campaign;const saved=JSON.parse(localStorage.getItem('taxt-ve-qilinc-city-v1')||'{}');saved.resources=saved.resources||{wood:1200,stone:1000,gold:500};saved.resources.gold=(Number(saved.resources.gold)||0)+80+captureBonus;localStorage.setItem('taxt-ve-qilinc-city-v1',JSON.stringify(saved));}localStorage.setItem(diplomacyKey,JSON.stringify(diplomacy));localStorage.removeItem('tvq_border_battle_kingdom');const outcome=document.createElement('p');outcome.style.cssText='margin-top:12px;color:#f0d69d;font-weight:700';outcome.textContent=won?(campaign.captured&&!captureBonus?'Sərhəd basqını dəf edildi! 80 qızıl və 1 nüfuz qazandın. Sərhəd məntəqəsi artıq sənin nəzarətindədir.':captureBonus?'Sərhəd basqını dəf edildi! 80 qızıl, 1 nüfuz və məntəqənin fəthi üçün əlavə 300 qızıl qazandın.':'Sərhəd basqını dəf edildi! 80 qızıl və 1 nüfuz qazandın. Kampaniya: '+campaign.wins+'/3 qələbə.'):'Sərhəd döyüşü məğlubiyyətlə bitdi. Sağ qalan qoşunların şəhərə qayıtdı.';panel.appendChild(outcome);const back=document.createElement('a');back.href='./world-map.html';back.textContent='Dünya xəritəsinə qayıt';back.style.cssText='display:block;text-align:center;margin-top:10px;padding:12px;background:#76542c;border-radius:9px;color:white;text-decoration:none';panel.appendChild(back);}catch(error){console.warn('Sərhəd döyüşü saxlanmadı',error)}}

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
