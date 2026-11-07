import { TROOPS, createArmy, armySize } from './troops.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const siegeCount = value => clamp(Math.floor(Number(value) || 0), 0, 20);
const DIRECTIONS = new Set(['north', 'east', 'south', 'west']);
const TACTICS = new Set(['balanced', 'wedge', 'line', 'volley']);
const TERRAIN = new Set(['plains', 'forest', 'hill', 'fortress']);

function calculatePower(army, defending, formation, opponents) {
  const enemyCount = Math.max(1, armySize(opponents));
  let total = 0;
  for (const [type, count] of Object.entries(createArmy(army))) {
    const unit = TROOPS[type];
    const base = defending ? unit.defense : unit.attack;
    const formationBonus =
      formation === 'wedge' && type === 'cavalry' ? 1.18 :
      formation === 'line' && (type === 'infantry' || type === 'spearman') ? 1.15 :
      formation === 'volley' && type === 'archer' ? 1.2 : 1;
    const counteredCount = Object.entries(createArmy(opponents))
      .reduce((sum, [enemyType, enemyUnits]) => sum + (unit.counters === enemyType ? enemyUnits : 0), 0);
    const counterBonus = 1 + 0.25 * (counteredCount / enemyCount);
    total += count * base * formationBonus * counterBonus;
  }
  return total;
}

/**
 * Deterministic prototype battle resolver.
 * direction: north | east | south | west
 * tactic: balanced | wedge | line | volley
 */
export function resolveBattle({ attacker, defender, direction = 'south', tactic = 'balanced', defenderTactic = 'balanced', terrain = 'plains', siege = {}, defenseCatapult = 0, priorWallDamage = 0, seed = 1 }) {
  const attackArmy = createArmy(attacker);
  const defendArmy = createArmy(defender);
  const attackCount = armySize(attackArmy);
  const defendCount = armySize(defendArmy);
  const safeDirection = DIRECTIONS.has(direction) ? direction : 'south';
  const safeTactic = TACTICS.has(tactic) ? tactic : 'balanced';
  const safeDefenderTactic = TACTICS.has(defenderTactic) ? defenderTactic : 'balanced';
  const safeTerrain = TERRAIN.has(terrain) ? terrain : 'plains';
  const siegeEngines = { ram: siegeCount(siege.ram), catapult: siegeCount(siege.catapult), tower: siegeCount(siege.tower) };
  const defensiveCatapults = safeTerrain === 'fortress' ? siegeCount(defenseCatapult) : 0;

  if (!attackCount || !defendCount) {
    return { winner: attackCount ? 'attacker' : 'defender', direction: safeDirection, tactic: safeTactic, attacker: attackArmy, defender: defendArmy, log: ['Döyüş üçün hər iki tərəfdə qoşun olmalıdır.'] };
  }

  const directionBonus = safeDirection === 'west' || safeDirection === 'east' ? 1.08 : 1;
  const terrainAttackBonus = safeTerrain === 'hill' ? 1.06 : 1;
  const terrainDefenseBonus = safeTerrain === 'forest' ? 1.12 : safeTerrain === 'hill' ? 1.18 : safeTerrain === 'fortress' ? 1.32 : 1;
  const cavalryPenalty = safeTerrain === 'forest' || safeTerrain === 'fortress' ? 0.88 : 1;
  const rawAttackPower = calculatePower(attackArmy, false, safeTactic, defendArmy);
  const totalAttackers = Math.max(1, attackCount);
  const cavalryShare = attackArmy.cavalry / totalAttackers;
  const cavalryTerrainFactor = 1 - (1 - cavalryPenalty) * cavalryShare;
  const wallMax = safeTerrain === 'fortress' ? 100 : 0;
  const wallDamage = Math.min(wallMax, clamp(Number(priorWallDamage) || 0, 0, wallMax) + siegeEngines.ram * 18 + siegeEngines.catapult * 30);
  const wallRemaining = Math.max(0, wallMax - wallDamage);
  const wallBreached = wallMax > 0 && wallRemaining === 0;
  const wallProtection = wallMax > 0 ? ((1 + (wallRemaining / wallMax) * 0.32) / 1.32) / (1 + siegeEngines.tower * 0.16) : 1;
  const siegeAttackBonus = wallMax > 0 ? siegeEngines.catapult * 14 + siegeEngines.tower * 10 + (wallBreached ? siegeEngines.ram * 6 : 0) : 0;
  const defensiveStoneDamage = defensiveCatapults * 12;
  const attackPower = Math.max(1, rawAttackPower * directionBonus * terrainAttackBonus * cavalryTerrainFactor + siegeAttackBonus - defensiveStoneDamage);
  const defendPower = calculatePower(defendArmy, true, safeDefenderTactic, attackArmy) * (wallBreached ? 1 : terrainDefenseBonus * wallProtection);
  const ratio = attackPower / Math.max(1, defendPower);
  const attackerWins = ratio >= 1;
  const random = (Math.sin(seed * 9301 + 49297) * 233280) % 1;
  const variance = 0.94 + Math.abs(random) * 0.12;
  const winner = attackerWins ? 'attacker' : 'defender';
  const attackerLossRate = clamp(0.28 + (defendPower / Math.max(1, attackPower)) * 0.18 + defensiveCatapults * 0.012, 0.18, 0.82);
  const defenderLossRate = clamp(0.28 + (attackPower / Math.max(1, defendPower)) * 0.18, 0.18, 0.78);
  const losses = (army, lossRate, isAttacker) => Object.fromEntries(Object.entries(army).map(([type, count]) => {
    const rangedProtection = isAttacker && attackerWins && type === 'archer' ? 0.75 : 1;
    return [type, Math.min(count, Math.round(count * lossRate * variance * rangedProtection))];
  }));
  const attackerLosses = losses(attackArmy, attackerLossRate, true);
  const defenderLosses = losses(defendArmy, defenderLossRate, false);

  return {
    winner, direction: safeDirection, tactic: safeTactic, defenderTactic: safeDefenderTactic, terrain: safeTerrain,
    siege: { ...siegeEngines, defensiveCatapults, defensiveStoneDamage, wallMax, wallDamage, wallRemaining, wallBreached, attackBonus: siegeAttackBonus },
    modifiers: { direction: directionBonus, attackerTerrain: terrainAttackBonus * cavalryTerrainFactor, defenderTerrain: wallBreached ? 1 : terrainDefenseBonus * wallProtection },
    power: { attacker: Math.round(attackPower), defender: Math.round(defendPower) },
    remaining: {
      attacker: Object.fromEntries(Object.keys(attackArmy).map(type => [type, attackArmy[type] - attackerLosses[type]])),
      defender: Object.fromEntries(Object.keys(defendArmy).map(type => [type, defendArmy[type] - defenderLosses[type]]))
    },
    losses: { attacker: attackerLosses, defender: defenderLosses },
    log: [
      `Hücum istiqaməti: ${safeDirection}`,
      `Hücum taktikası: ${safeTactic}`,
      `Müdafiə taktikası: ${safeDefenderTactic}`,
      `Ərazi: ${safeTerrain}`,
      `Mühasirə: qoçbaşı ${siegeEngines.ram}, katapult ${siegeEngines.catapult}, mühasirə qülləsi ${siegeEngines.tower}`,\n      ...(defensiveCatapults ? [`Qala müdafiə katapultları: ${defensiveCatapults} · hücum gücünə zərər: ${defensiveStoneDamage}`] : []),
      ...(wallMax ? [`Divar zədəsi: ${wallDamage}/100 · ${wallBreached ? 'divar yarıldı' : 'divar hələ dayanır'}`] : []),
      `Hücum gücü: ${Math.round(attackPower)} · Müdafiə gücü: ${Math.round(defendPower)}`,
      winner === 'attacker' ? 'Hücum edən tərəf üstün gəldi.' : 'Müdafiə tərəfi qalib gəldi.'
    ]
  };
}
