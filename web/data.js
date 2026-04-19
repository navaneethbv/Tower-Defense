export const TILE = 48;
export const COLS = 18;
export const ROWS = 12;
export const MAX_WAVES = 25;

const sprite = (dex) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${dex}.png`;

export const route = {
  id: "route_1_1",
  name: "Route 1-1",
  path: [
    [0, 5], [1, 5], [2, 5], [3, 5], [4, 5], [5, 5], [6, 5],
    [6, 4], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3],
    [10, 4], [10, 5], [11, 5], [12, 5], [13, 5], [14, 5], [15, 5], [16, 5], [17, 5]
  ],
  terrainBands: {
    waterRows: [1, 2],
    mountainRows: [9, 10],
    grassRows: [4, 6, 7]
  }
};

export const pokemonSpecies = {
  bulbasaur: { name: "Bulbasaur", cost: 90, damage: 9, cooldown: 0.7, range: 2.4, role: "control", allowedTerrain: ["FIELD", "GRASS"], sprite: sprite(1) },
  charmander: { name: "Charmander", cost: 95, damage: 12, cooldown: 0.75, range: 2.2, role: "dps", allowedTerrain: ["FIELD", "MOUNTAIN"], sprite: sprite(4) },
  squirtle: { name: "Squirtle", cost: 90, damage: 8, cooldown: 0.55, range: 2.4, role: "balanced", allowedTerrain: ["FIELD", "WATER"], sprite: sprite(7) },
  pikachu: { name: "Pikachu", cost: 120, damage: 7, cooldown: 0.35, range: 2.6, role: "control", allowedTerrain: ["FIELD", "GRASS"], sprite: sprite(25) },
  geodude: { name: "Geodude", cost: 130, damage: 16, cooldown: 1.1, range: 1.8, role: "tank_killer", allowedTerrain: ["FIELD", "MOUNTAIN"], sprite: sprite(74) },
  oddish: { name: "Oddish", cost: 110, damage: 6, cooldown: 0.45, range: 2.5, role: "dot", allowedTerrain: ["FIELD", "GRASS"], sprite: sprite(43) },
  pidgey: { name: "Pidgey", cost: 100, damage: 8, cooldown: 0.5, range: 2.7, role: "dps", allowedTerrain: ["FIELD", "GRASS", "WATER", "MOUNTAIN"], sprite: sprite(16) }
};

export const recruitPool = ["pikachu", "geodude", "oddish", "pidgey"];

export const enemies = {
  rattata: { name: "Rattata", hp: 38, speed: 1.2, reward: 14, heartDamage: 1, armor: 0, sprite: sprite(19) },
  zubat: { name: "Zubat", hp: 28, speed: 1.65, reward: 13, heartDamage: 1, armor: 0, sprite: sprite(41) },
  onix: { name: "Onix", hp: 160, speed: 0.6, reward: 40, heartDamage: 3, armor: 2, sprite: sprite(95) }
};

export function buildWave(index) {
  const queue = [];
  const size = 7 + Math.floor(index * 1.4);
  const useZubat = index >= 3;

  for (let i = 0; i < size; i += 1) {
    const type = useZubat && i % 4 === 0 ? "zubat" : "rattata";
    queue.push({ type, delay: i * 0.75 });
  }

  if (index % 5 === 4 || index === MAX_WAVES - 1) {
    queue.push({ type: "onix", delay: size * 0.75 + 1.1 });
  }
  return queue;
}

export function towerUpgradeCost(level) {
  return Math.round(50 * Math.pow(1.45, level - 1));
}
