// Original Taxt və Qılınc troop definitions. Values are prototype balance data.
export const TROOPS = Object.freeze({
  infantry: Object.freeze({ id: 'infantry', name: 'Piyada', attack: 12, defense: 16, speed: 7, counters: 'archer' }),
  spearman: Object.freeze({ id: 'spearman', name: 'Nizəçi', attack: 14, defense: 20, speed: 5, counters: 'cavalry' }),
  archer: Object.freeze({ id: 'archer', name: 'Oxçu', attack: 18, defense: 8, speed: 6, counters: 'infantry' }),
  cavalry: Object.freeze({ id: 'cavalry', name: 'Süvari', attack: 22, defense: 12, speed: 11, counters: 'archer' }),
  knight: Object.freeze({ id: 'knight', name: 'Cəngavər', attack: 25, defense: 22, speed: 8, counters: 'infantry' })
});

export function createArmy(composition = {}) {
  return Object.fromEntries(Object.keys(TROOPS).map(id => [id, Math.max(0, Math.min(9999, Math.floor(Number(composition[id]) || 0)))]));
}

export function armySize(army) {
  return Object.values(createArmy(army)).reduce((sum, count) => sum + count, 0);
}
