import { TROOPS, createArmy, armySize } from './troops.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function powerAgainst(attackerType, defenderType) {
  return TROOPS[attackerType].counters === defenderType ? 1.25 : 1;
}

function calculatePower(army, defending = false, formation = 'balanced') {
  let total = 0;
  for (const [type, count] of Object.entries(createArmy(army))) {
    const unit = TROOPS[type];
    const base = defending ? unit.defense : unit.attack;
    const formationBonus =
      formation === 'wedge' && type === 'cavalry' ? 1.18 :
      formation === 'line' && (type === 'infantry' || type === 'spearman') ? 1.15 :
      formation === 'volley' && type === 'archer' ? 1.2 : 1;
    total += count * base * formationBonus;
  }
  return total;
}

/**
 * Deterministic prototype battle resolver.
 * direction: north | east | south | west
 * tactic: balanced | wedge | line | volley
 */
export function resolveBattle({ attacker, defender, direction = 'south', tactic = 'balanced', seed = 1 }) {
  const attackArmy = createArmy(attacker);
  const defendArmy = createArmy(defender);
  const attackCount = armySize(attackArmy);
  const defendCount = armySize(defendArmy);

  if (!attackCount || !defendCount) {
    return { winner: attackCount ? 'attacker' : 'defender', direction, tactic, attacker: attackArmy, defender: defendArmy, log: ['Döyüş üçün hər iki tərəfdə qoşun olmalıdır.'] };
  }

  const directionBonus = direction === 'west' || direction === 'east' ? 1.08 : 1;
  const attackPower = calculatePower(attackArmy, false, tactic) * directionBonus;
  const defendPower = calculatePower(defendArmy, true, 'balanced');
  const ratio = attackPower / Math.max(1, defendPower);
  const attackerWins = ratio >= 1;
  const random = (Math.sin(seed * 9301 + 49297) * 233280) % 1;
  const variance = 0.94 + Math.abs(random) * 0.12;
  const winner = attackerWins ? 'attacker' : 'defender';
  const attackerLossRate = clamp(0.28 + (defendPower / Math.max(1, attackPower)) * 0.18, 0.18, 0.78);
  const defenderLossRate = clamp(0.28 + (attackPower / Math.max(1, defendPower)) * 0.18, 0.18, 0.78);
  const losses = army => Object.fromEntries(Object.entries(army).map(([type, count]) => {
    const rate = (attackerWins ? type === 'archer' ? 0.75 : 1 : 1) * (attackerWins ? attackerLossRate : defenderLossRate) * variance;
    return [type, Math.min(count, Math.round(count * rate))];
  }));
  const attackerLosses = losses(attackArmy);
  const defenderLosses = losses(defendArmy);

  return {
    winner, direction, tactic,
    power: { attacker: Math.round(attackPower), defender: Math.round(defendPower) },
    remaining: {
      attacker: Object.fromEntries(Object.keys(attackArmy).map(type => [type, attackArmy[type] - attackerLosses[type]])),
      defender: Object.fromEntries(Object.keys(defendArmy).map(type => [type, defendArmy[type] - defenderLosses[type]]))
    },
    losses: { attacker: attackerLosses, defender: defenderLosses },
    log: [
      `Hücum istiqaməti: ${direction}`,
      `Taktika: ${tactic}`,
      `Hücum gücü: ${Math.round(attackPower)} · Müdafiə gücü: ${Math.round(defendPower)}`,
      winner === 'attacker' ? 'Hücum edən tərəf üstün gəldi.' : 'Müdafiə edən tərəf qalib gəldi.'
    ]
  };
}
