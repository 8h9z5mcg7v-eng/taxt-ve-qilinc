import { resolveBattle } from './battle.js';

const troopIds = ['infantry', 'spearman', 'archer', 'cavalry', 'knight'];
const readArmy = prefix => Object.fromEntries(troopIds.map(id => {
  const input = document.getElementById(prefix + '-' + id);
  return [id, Math.max(0, Math.min(9999, Math.floor(Number(input.value) || 0)))];
}));
const total = army => Object.values(army).reduce((sum, n) => sum + n, 0);
const labels = { north: 'Şimal', south: 'Cənub', east: 'Şərq', west: 'Qərb', balanced: 'Balanslı', wedge: 'Paz', line: 'Xətt', volley: 'Yaylım' };
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

renderBattlefield(readArmy('a'), readArmy('d'), document.getElementById('direction').value);
document.getElementById('fight').addEventListener('click', () => {
  const attacker = readArmy('a');
  const defender = readArmy('d');
  const direction = document.getElementById('direction').value;
  const tactic = document.getElementById('tactic').value;
  const result = resolveBattle({ attacker, defender, direction, tactic, seed: Date.now() % 100000 });
  renderBattlefield(attacker, defender, direction);
  const panel = document.getElementById('result');
  panel.style.display = 'block';
  document.getElementById('winner').textContent =
    total(attacker) && total(defender)
      ? result.winner === 'attacker' ? '⚔ Hücum ordusu qalib gəldi' : '🛡 Müdafiə ordusu qalib gəldi'
      : 'Döyüş baş tutmadı';
  document.getElementById('ap').textContent = result.power?.attacker ?? '—';
  document.getElementById('dp').textContent = result.power?.defender ?? '—';
  document.getElementById('ar').textContent = total(result.remaining?.attacker ?? attacker);
  document.getElementById('dr').textContent = total(result.remaining?.defender ?? defender);
  const lossText = losses => troopIds.filter(id => (losses?.[id] || 0) > 0)
    .map(id => troopNames[id] + ': ' + losses[id]).join(' · ') || 'İtki yoxdur';
  document.getElementById('aLoss').textContent = lossText(result.losses?.attacker);
  document.getElementById('dLoss').textContent = lossText(result.losses?.defender);
  const log = [
    'İstiqamət: ' + labels[result.direction],
    'Taktika: ' + labels[result.tactic],
    ...(result.log || [])
  ];
  document.getElementById('log').replaceChildren(...log.map(line => {
    const li = document.createElement('li'); li.textContent = line; return li;
  }));
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});
