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

function renderBattlefield(attacker, defender, direction) {
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
      svgNode('circle', { r: 23, fill: color, stroke: '#18231e', 'stroke-width': 3 }, g);
      svgNode('text', { 'text-anchor': 'middle', y: 5, fill: '#18231e', 'font-size': 16, 'font-weight': 800 }, g, troopLabels[type]);
      svgNode('text', { 'text-anchor': 'middle', y: 39, fill: '#fff4dc', 'font-size': 12, 'font-weight': 700, stroke: '#17251f', 'stroke-width': 2, 'paint-order': 'stroke' }, g, String(count));
      svgNode('text', { 'text-anchor': 'middle', y: 54, fill: '#e7e2d4', 'font-size': 9 }, g, troopNames[type]);
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
if(isWorldMapAttack){const garrison=Math.max(1,Math.min(9999,Number(dispatched.get('garrison'))||300));const defense={infantry:Math.round(garrison*.3),spearman:Math.round(garrison*.2),archer:Math.round(garrison*.3),cavalry:Math.round(garrison*.1),knight:0};defense.knight=Math.max(0,garrison-Object.values(defense).reduce((a,n)=>a+n,0));for(const [type,count] of Object.entries(defense)){document.getElementById('d-'+type).value=String(count);}}
for(const type of troopIds){
 if(dispatched.has(type)){
  const field=document.getElementById('a-'+type);
  field.value=String(Math.max(0,Math.min(9999,Math.floor(Number(dispatched.get(type))||0))));
 }
}
function refreshPreview() {
  renderBattlefield(readArmy('a'), readArmy('d'), document.getElementById('direction').value);
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
    catapult: Math.max(0, Math.min(20, Math.floor(Number(isWorldMapAttack ? (dispatchedPlan.catapult??dispatched.get('catapult')??document.getElementById('catapult').value) : document.getElementById('catapult').value) || 0)))
  };
  document.getElementById('ram').value=String(siege.ram);
  document.getElementById('catapult').value=String(siege.catapult);
  const result = resolveBattle({ attacker, defender, direction, tactic, terrain, siege, seed: Date.now() % 100000 });
  const survivingAttacker = result.remaining?.attacker ?? attacker;
  // Keep the surviving dispatched army in the same local save used by the city.
  try {
    const saveKey = 'taxt-ve-qilinc-city-v1';
    const saved = JSON.parse(localStorage.getItem(saveKey) || '{}');
    localStorage.setItem(saveKey, JSON.stringify({
      ...saved,
      army: survivingAttacker
    }));
  } catch (error) {
    console.warn('Ordunun nəticəsini yadda saxlamaq mümkün olmadı.', error);
  }
  const survivingDefender = result.remaining?.defender ?? defender;
  renderBattlefield(survivingAttacker, survivingDefender, direction);
  const panel = document.getElementById('result');
  panel.style.display = 'block';
  if(isWorldMapAttack){try{const worldKey='tvq_world_state_v1';const world=JSON.parse(localStorage.getItem(worldKey)||'{}');const previous=world.redFortress||{};const captured=result.winner==='attacker';const now=Date.now();world.redFortress={...previous,captured,updatedAt:now,capturedAt:captured?now:(previous.capturedAt||null),garrison:captured?{infantry:0,spearman:0,archer:0,cavalry:0,knight:0}:survivingDefender,remainingDefenders:total(survivingDefender),lastBattle:{winner:result.winner,at:now,attackerLosses:result.losses?.attacker||{},defenderLosses:result.losses?.defender||{},survivingAttackers:total(survivingAttacker)}};localStorage.setItem(worldKey,JSON.stringify(world));localStorage.removeItem('tvq_active_journey_v1');const outcome=document.createElement('p');outcome.style.cssText='margin-top:12px;color:#f0d69d;font-weight:700';outcome.textContent=captured?'Qırmızı Qala fəth edildi! Şəhərə qayıdaraq nəticəni gör.':'Hücum uğursuz oldu. Sağ qalan ordu şəhərə qaytarıldı.';panel.appendChild(outcome);const back=document.createElement('a');back.href='./city.html';back.textContent='Şəhərə qayıt';back.style.cssText='display:block;text-align:center;margin-top:10px;padding:12px;background:#76542c;border-radius:9px;color:white;text-decoration:none';panel.appendChild(back);}catch(error){console.warn('Döyüş nəticəsi saxlanmadı',error)}}

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
