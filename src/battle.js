import { TROOPS, createArmy, armySize } from './troops.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const siegeCount = value => clamp(Math.floor(Number(value) || 0), 0, 20);
const DIRECTIONS = new Set(['north', 'east', 'south', 'west']);
const TACTICS = new Set(['balanced', 'wedge', 'line', 'volley']);
const TERRAIN = new Set(['plains', 'forest', 'hill', 'fortress']);

function applyDirectionalWallDamage(direction, priorBySide = {}, legacyDamage = 0, incoming = 0) {
  const sides = { north: 0, east: 0, south: 0, west: 0 };
  for (const side of Object.keys(sides)) sides[side] = clamp(Number(priorBySide?.[side]) || 0, 0, 100);
  if (!priorBySide || !Object.keys(priorBySide).length) sides[direction] = clamp(Number(legacyDamage) || 0, 0, 100);
  const before = sides[direction];
  const dealt = Math.min(Math.max(0, Number(incoming) || 0), 100 - before);
  sides[direction] = before + dealt;
  return { bySide: sides, sideDamageBefore: before, sideDamageThisBattle: dealt, sideDamage: sides[direction] };
}

function calculatePower(army, defending, formation, opponents, commander = null, buildings = {}, defendingBuildings = {}) {
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
    const commanderType = commander?.bonus || ({alp:'cavalry',tomris:'archer',babek:'infantry'}[commander?.id]);
    const commanderLevel = Math.max(1, Math.min(10, 1 + Math.floor(Math.max(0, Number(commander?.xp) || 0) / 100)));
    const generalBonus = !defending && commanderType
      ? (commanderType === type || (commanderType === 'infantry' && type === 'spearman')
          ? 1.18 + (commanderLevel - 1) * 0.01
          : 1.03 + (commanderLevel - 1) * 0.005)
      : 1;
    const level = key => Math.max(1, Math.min(10, Math.floor(Number((defending ? defendingBuildings : buildings)[key]) || 1)));
    const buildingBonus = !defending ? (type === 'infantry' || type === 'spearman' ? 1 + (level('barracks') - 1) * 0.025 : type === 'archer' ? 1 + (level('archery') - 1) * 0.03 : type === 'cavalry' || type === 'knight' ? 1 + (level('stable') - 1) * 0.03 : 1) : (1 + (level('tower') - 1) * 0.025) * (type === 'infantry' || type === 'spearman' ? 1 + (level('barracks') - 1) * 0.02 : type === 'archer' ? 1 + (level('archery') - 1) * 0.025 : type === 'cavalry' || type === 'knight' ? 1 + (level('stable') - 1) * 0.02 : 1);
    total += count * base * formationBonus * counterBonus * generalBonus * buildingBonus;
  }
  return total;
}

/**
 * Deterministic prototype battle resolver.
 * direction: north | east | south | west
 * tactic: balanced | wedge | line | volley
 */
export function resolveBattle({ attacker, defender, direction = 'south', tactic = 'balanced', defenderTactic = 'balanced', terrain = 'plains', siege = {}, defenseCatapult = 0, wallLevel = 1, priorWallDamage = 0, priorWallDamageBySide = {}, commander = null, attackerBuildings = {}, defenderBuildings = {}, seed = 1 }) {
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
    if (attackCount && safeTerrain === 'fortress') {
      const wallMax = 100;
      const safeWallLevel = clamp(Math.floor(Number(wallLevel) || 1), 1, 10);
      const wallDamageReduction = 1 - (safeWallLevel - 1) * 0.035;
      const incomingWallDamage = (siegeEngines.ram * 18 + siegeEngines.catapult * 30) * wallDamageReduction;
      const safePriorWallDamage = clamp(Number(priorWallDamage) || 0, 0, wallMax);
      const wallDamageThisBattle = Math.min(incomingWallDamage, wallMax - safePriorWallDamage);
      const wallDamage = safePriorWallDamage + wallDamageThisBattle;
      const directionalDamage = applyDirectionalWallDamage(safeDirection, priorWallDamageBySide, safePriorWallDamage, incomingWallDamage);
      const defensiveStoneDamage = defensiveCatapults * 12;
      const lossRate = clamp(defensiveCatapults * 0.025, 0, 0.35);
      const random = (Math.sin(seed * 9301 + 49297) * 233280) % 1;
      const variance = 0.94 + Math.abs(random) * 0.12;
      const attackerLosses = Object.fromEntries(Object.entries(attackArmy).map(([type, count]) => [type, Math.min(count, Math.round(count * lossRate * variance))]));
      const remainingAttackers = Object.fromEntries(Object.keys(attackArmy).map(type => [type, attackArmy[type] - attackerLosses[type]]));
      return {
        winner: 'attacker', direction: safeDirection, tactic: safeTactic, defenderTactic: safeDefenderTactic, terrain: safeTerrain,
        siege: { ...siegeEngines, defensiveCatapults, defensiveStoneDamage, wallMax, wallLevel: safeWallLevel, wallDamageBefore: safePriorWallDamage, wallDamageThisBattle, wallDamage, wallDamageBySide: directionalDamage.bySide, sideDamageBefore: directionalDamage.sideDamageBefore, sideDamageThisBattle: directionalDamage.sideDamageThisBattle, sideDamage: directionalDamage.sideDamage, wallRemaining: wallMax - wallDamage, wallBreached: wallDamage >= wallMax },
        power: { attacker: Math.max(1, armySize(attackArmy) * 10 - defensiveStoneDamage), defender: 0 },
        remaining: { attacker: remainingAttackers, defender: defendArmy },
        losses: { attacker: attackerLosses, defender: { ...defendArmy } },
        log: ['Qalada müdafiəçi qarnizon yoxdur.', `Müdafiə qüllələrinin katapult zərbəsi: ${defensiveCatapults} · hücumçu itkisi: ${Object.values(attackerLosses).reduce((sum, count) => sum + count, 0)}`, `Divar zədəsi: +${Math.round(wallDamageThisBattle)}% · ümumi: ${Math.round(wallDamage)}% · ${wallDamage >= wallMax ? 'divar yarıldı' : 'divar hələ dayanır'}`]
      };
    }
    return { winner: attackCount ? 'attacker' : 'defender', direction: safeDirection, tactic: safeTactic, attacker: attackArmy, defender: defendArmy, log: ['Döyüş üçün hər iki tərəfdə qoşun olmalıdır.'] };
  }

  const directionBonus = safeDirection === 'west' || safeDirection === 'east' ? 1.08 : 1;
  const terrainAttackBonus = safeTerrain === 'hill' ? 1.06 : 1;
  const terrainDefenseBonus = safeTerrain === 'forest' ? 1.12 : safeTerrain === 'hill' ? 1.18 : safeTerrain === 'fortress' ? 1.32 : 1;
  const cavalryPenalty = safeTerrain === 'forest' || safeTerrain === 'fortress' ? 0.88 : 1;
  const rawAttackPower = calculatePower(attackArmy, false, safeTactic, defendArmy, commander, attackerBuildings);
  const totalAttackers = Math.max(1, attackCount);
  const cavalryShare = attackArmy.cavalry / totalAttackers;
  const cavalryTerrainFactor = 1 - (1 - cavalryPenalty) * cavalryShare;
  const wallMax = safeTerrain === 'fortress' ? 100 : 0;
  const safeWallLevel = clamp(Math.floor(Number(wallLevel) || 1), 1, 10);
  const wallDamageReduction = 1 - (safeWallLevel - 1) * 0.035;
  const incomingWallDamage = (siegeEngines.ram * 18 + siegeEngines.catapult * 30) * wallDamageReduction;
  const safePriorWallDamage = clamp(Number(priorWallDamage) || 0, 0, wallMax);
  const wallDamageThisBattle = Math.min(incomingWallDamage, Math.max(0, wallMax - safePriorWallDamage));
  const wallDamage = Math.min(wallMax, safePriorWallDamage + incomingWallDamage);
  const wallRemaining = Math.max(0, wallMax - wallDamage);
  const wallBreached = wallMax > 0 && wallRemaining === 0;
  const directionalDamage = applyDirectionalWallDamage(safeDirection, priorWallDamageBySide, safePriorWallDamage, incomingWallDamage);
  const wallLevelBonus = 1 + (safeWallLevel - 1) * 0.045;
  const wallIntegrityFactor = wallMax > 0 ? 1 - (wallDamage / wallMax) * 0.4 : 1;
  const wallProtection = wallMax > 0 ? ((((1 + (wallRemaining / wallMax) * 0.32) / 1.32) * wallLevelBonus) / (1 + siegeEngines.tower * 0.16)) * wallIntegrityFactor : 1;
  const siegeAttackBonus = wallMax > 0 ? siegeEngines.catapult * 14 + siegeEngines.tower * 10 + (wallBreached ? siegeEngines.ram * 6 : 0) : 0;
  const defensiveStoneDamage = defensiveCatapults * 12;
  const attackPower = Math.max(1, rawAttackPower * directionBonus * terrainAttackBonus * cavalryTerrainFactor + siegeAttackBonus - defensiveStoneDamage);
  const defendPower = calculatePower(defendArmy, true, safeDefenderTactic, attackArmy, null, {}, safeTerrain === 'fortress' ? defenderBuildings : {}) * terrainDefenseBonus * wallProtection;
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
    siege: { ...siegeEngines, defensiveCatapults, defensiveStoneDamage, wallMax, wallLevel: safeWallLevel, wallLevelBonus, wallDamageReduction, wallDamageBefore: safePriorWallDamage, wallDamageThisBattle, wallDamage, wallDamageBySide: directionalDamage.bySide, sideDamageBefore: directionalDamage.sideDamageBefore, sideDamageThisBattle: directionalDamage.sideDamageThisBattle, sideDamage: directionalDamage.sideDamage, wallRemaining, wallBreached, attackBonus: siegeAttackBonus },
    modifiers: { direction: directionBonus, attackerTerrain: terrainAttackBonus * cavalryTerrainFactor, defenderTerrain: wallBreached ? 1 : terrainDefenseBonus * wallProtection, attackerBuildings: { barracks: Math.max(1,Math.min(10,Math.floor(Number(attackerBuildings.barracks)||1))), archery: Math.max(1,Math.min(10,Math.floor(Number(attackerBuildings.archery)||1))), stable: Math.max(1,Math.min(10,Math.floor(Number(attackerBuildings.stable)||1))) }, defenderBuildings: { tower: Math.max(1,Math.min(10,Math.floor(Number(defenderBuildings.tower)||1))), barracks: Math.max(1,Math.min(10,Math.floor(Number(defenderBuildings.barracks)||1))), archery: Math.max(1,Math.min(10,Math.floor(Number(defenderBuildings.archery)||1))), stable: Math.max(1,Math.min(10,Math.floor(Number(defenderBuildings.stable)||1))) } },
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
      ...(safeTerrain === 'fortress' ? [`Müdafiə qülləsi: ${Math.max(1,Math.min(10,Math.floor(Number(defenderBuildings.tower)||1)))}/10`] : []),
      `Ərazi: ${safeTerrain}`,
      `Mühasirə: qoçbaşı ${siegeEngines.ram}, katapult ${siegeEngines.catapult}, mühasirə qülləsi ${siegeEngines.tower}`,
      ...(defensiveCatapults ? [`Qala müdafiə katapultları: ${defensiveCatapults} · hücum gücünə zərər: ${defensiveStoneDamage}`] : []),
      ...(wallMax ? [`Divar səviyyəsi: ${safeWallLevel}/10 · əvvəlki zədə: ${Math.round(safePriorWallDamage)}/100 · bu döyüşdə əlavə zədə: +${Math.round(wallDamageThisBattle)} · ümumi zədə: ${Math.round(wallDamage)}/100 · müdafiə bütövlüyü: ${Math.round(wallIntegrityFactor * 100)}% · ${wallBreached ? 'divar yarıldı' : 'divar hələ dayanır'}`] : []),
      `Hücum tikililəri: Kazarma +${(Math.max(1,Math.min(10,Math.floor(Number(attackerBuildings.barracks)||1)))-1)*2.5}% piyada/nizəçi · Oxçuluq +${(Math.max(1,Math.min(10,Math.floor(Number(attackerBuildings.archery)||1)))-1)*3}% oxçu · Tövlə +${(Math.max(1,Math.min(10,Math.floor(Number(attackerBuildings.stable)||1)))-1)*3}% süvari/cəngavər`,
      ...(safeTerrain === 'fortress' ? [`Qala müdafiə tikililəri: Qüllə +${(Math.max(1,Math.min(10,Math.floor(Number(defenderBuildings.tower)||1)))-1)*2.5}% · Kazarma +${(Math.max(1,Math.min(10,Math.floor(Number(defenderBuildings.barracks)||1)))-1)*2}% piyada/nizəçi · Oxçuluq +${(Math.max(1,Math.min(10,Math.floor(Number(defenderBuildings.archery)||1)))-1)*2.5}% oxçu · Tövlə +${(Math.max(1,Math.min(10,Math.floor(Number(defenderBuildings.stable)||1)))-1)*2}% süvari/cəngavər`] : []),
      `Hücum gücü: ${Math.round(attackPower)} · Müdafiə gücü: ${Math.round(defendPower)}`,
      winner === 'attacker' ? 'Hücum edən tərəf üstün gəldi.' : 'Müdafiə tərəfi qalib gəldi.'
    ]
  };
}
