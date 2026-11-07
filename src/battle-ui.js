import { resolveBattle } from './battle.js';

const troopIds = ['infantry', 'spearman', 'archer', 'cavalry', 'knight'];
const readArmy = prefix => Object.fromEntries(troopIds.map(id => {
  const input = document.getElementById(prefix + '-' + id);
  return [id, Math.max(0, Math.min(9999, Math.floor(Number(input.value) || 0)))];
}));
const total = army => Object.values(army).reduce((sum, n) => sum + n, 0);
const labels = { north: 'Şimal', south: 'Cənub', east: 'Şərq', west: 'Qərb', balanced: 'Balanslı', wedge: 'Paz', line: 'Xətt', volley: 'Yaylım' };

document.getElementById('fight').addEventListener('click', () => {
  const attacker = readArmy('a');
  const defender = readArmy('d');
  const direction = document.getElementById('direction').value;
  const tactic = document.getElementById('tactic').value;
  const result = resolveBattle({ attacker, defender, direction, tactic, seed: Date.now() % 100000 });
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
