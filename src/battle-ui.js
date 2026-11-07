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
    svgNode('rect', { x: 284, y: 91, width: 24, height: 39, fill: '#332c25' }, scene);
    const damage = Math.max(0, Math.min(100, Number(wallDamage) || 0));
    if (damage >= 25) {
      svgNode('path', { d: damage >= 70 ? 'M248 78 L270 96 L258 111 L284 130 M270 96 L292 85 L307 101 L328 91 M307 101 L300 124' : 'M268 78 L281 92 L272 108 M281 92 L299 83', fill: 'none', stroke: '#292722', 'stroke-width': damage >= 70 ? 5 : 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, scene);
    }
    if (damage >= 50) {
      svgNode('path', { d: 'M214 109 L247 109 L259 130 L235 130Z M340 109 L371 109 L386 130 L354 130Z', fill: '#4c4b43', stroke: '#282b27', 'stroke-width': 2 }, scene);
    }
    if (damage >= 100) {
      svgNode('rect', { x: 264, y: 76, width: 68, height: 54, fill: '#a18a58' }, scene);
      svgNode('path', { d: 'M252 131 L266 114 L278 131 M322 131 L337 113 L350 131', fill: '#77786d', stroke: '#282b27', 'stroke-width': 3 }, scene);
      svgNode('text', { x: 300, y: 148, 'text-anchor': 'middle', fill: '#ffe0a1', 'font-size': 11, 'font-weight': 700 }, scene, 'DİVAR YARILIB');
    }
  }
  if ((siege.catapult || 0) > 0 || (siege.ram || 0) > 0) {
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
    const rams = Math.min(2, Math.max(0, Number(siege.ram) || 0));
    for (let i = 0; i < rams; i++) {
      const x = 185 + i * 42;
      svgNode('path', { d: `M${x-17} 282 L${x+17} 282 L${x+12} 292 L${x-12} 292Z M${x} 282 L${x} 253`, fill: '#80552e', stroke: '#30251e', 'stroke-width': 4, 'stroke-linejoin': 'round' }, machines);
      svgNode('path', { d: `M${x-10} 252 L${x+10} 252 L${x+6} 260 L${x-6} 260Z`, fill: '#777d86', stroke: '#292722', 'stroke-width': 2 }, machines);
    }
    scene.appendChild(machines);
  }
  field.insertBefore(scene, field.firstChild);
}

function renderBattlefield(attacker, defender, direction, terrain = 'plains', wallDamage = 0, siege = {}) {
  renderTerrain(terrain, wallDamage, siege);
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
      const g = svgNode('g', { transform: `translate(${x} ${y})` }, layer);
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
for(const type of troopIds){
 if(dispatched.has(type)){
  const field=document.getElementById('a-'+type);
  field.value=String(Math.max(0,Math.min(9999,Math.floor(Number(dispatched.get(type))||0))));
 }
}
function playCombatAnimation(attacker = {}, siege = {}) {
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
  const catapultShots = Math.min(4, siege.catapult || 0);
  for (let i = 0; i < catapultShots; i++) {
    launch(115 + i * 24, 210, 365 + i * 10, 158 + i * 12, '#e1a34b', i * 170, 5);
  }
  const attackLayer = document.getElementById('attackerUnits');
  const defendLayer = document.getElementById('defenderUnits');
  field.classList.remove('combat-active');
  void field.getBoundingClientRect();
  field.classList.add('combat-active');

  // Animate complete troop groups so the movement remains visible after
  // the post-battle formation has been rendered.
  [...attackLayer.querySelectorAll('g')].forEach((group, index) => {
    group.animate(
      [{ transform: group.getAttribute('transform') },
       { transform: group.getAttribute('transform') + ' translate(0,-18)' },
       { transform: group.getAttribute('transform') }],
      { duration: 760, delay: index * 130, easing: 'ease-in-out' }
    );
  });
  [...defendLayer.querySelectorAll('g')].forEach((group, index) => {
    group.animate(
      [{ transform: group.getAttribute('transform') },
       { transform: group.getAttribute('transform') + ' translate(0,5)' },
       { transform: group.getAttribute('transform') }],
      { duration: 680, delay: index * 100, easing: 'ease-out' }
    );
  });
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
  renderBattlefield(readArmy('a'), readArmy('d'), document.getElementById('direction').value, document.getElementById('terrain').value, currentWallDamage, { ram: Number(document.getElementById('ram').value) || 0, catapult: Number(document.getElementById('catapult').value) || 0, tower: Number(document.getElementById('tower').value) || 0 });
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
    catapult: Math.max(0, Math.min(20, Math.floor(Number(isWorldMapAttack ? (dispatchedPlan.catapult??dispatched.get('catapult')??document.getElementById('catapult').value) : document.getElementById('catapult').value) || 0))),\n    tower: Math.max(0, Math.min(20, Math.floor(Number(isWorldMapAttack ? (dispatchedPlan.tower??dispatched.get('tower')??document.getElementById('tower').value) : document.getElementById('tower').value) || 0)))
  };
  document.getElementById('ram').value=String(siege.ram);
  document.getElementById('catapult').value=String(siege.catapult);\n  document.getElementById('tower').value=String(siege.tower);
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
  const result = resolveBattle({ attacker, defender, direction, tactic, terrain, siege, priorWallDamage, seed: Date.now() % 100000 });
  fightButton.textContent = isWorldMapAttack ? 'DÖYÜŞ TAMAMLANDI' : 'YENİ DÖYÜŞÜ HESABLA';
  if (!isWorldMapAttack) fightButton.disabled = false;
  const survivingAttacker = result.remaining?.attacker ?? attacker;
  // Only dispatched world-map battles consume and update the city army.
  if (isWorldMapAttack || isBorderBattle) {
    try {
      const saveKey = 'taxt-ve-qilinc-city-v1';
      const saved = JSON.parse(localStorage.getItem(saveKey) || '{}');
      localStorage.setItem(saveKey, JSON.stringify({ ...saved, army: survivingAttacker }));
    } catch (error) {
      console.warn('Ordunun nəticəsini yadda saxlamaq mümkün olmadı.', error);
    }
  }
  const survivingDefender = result.remaining?.defender ?? defender;
  currentWallDamage = result.siege?.wallDamage || 0;
  renderBattlefield(survivingAttacker, survivingDefender, direction, terrain, currentWallDamage, siege);
  playCombatAnimation(attacker, siege);
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
  document.getElementById('wallDamage').textContent = result.siege?.wallMax ? `${result.siege.wallDamage}/100` : 'Tətbiq edilmir';
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
