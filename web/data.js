export const TILE = 48;
export const COLS = 18;
export const ROWS = 12;

const sprite = (dex) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${dex}.png`;

export const DIFFICULTY_MODIFIERS = {
  normal: { hpMult: 1.0, speedMult: 1.0, rewardMult: 1.0 },
  hard: { hpMult: 1.35, speedMult: 1.15, rewardMult: 1.20 }
};

export const routes = [
  {
    id: "route_1_1",
    name: "Route 1-1 (Viridian Path)",
    unlockStars: 0,
    wavesCount: 10,
    description: "A calm, grassy route suitable for training. Watch out for Onix at the end!",
    path: [
      [0, 5], [1, 5], [2, 5], [3, 5], [4, 5], [5, 5], [6, 5],
      [6, 4], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3],
      [10, 4], [10, 5], [11, 5], [12, 5], [13, 5], [14, 5], [15, 5], [16, 5], [17, 5]
    ],
    terrainBands: {
      waterRows: [1, 2],
      mountainRows: [9, 10],
      grassRows: [4, 6, 7]
    },
    terrainMix: ["FIELD", "GRASS"]
  },
  {
    id: "route_1_2",
    name: "Route 1-2 (Cerulean River)",
    unlockStars: 2,
    wavesCount: 15,
    description: "A winding path surrounded by river water. Water types gain bonuses here. Watch out for fast Zubats!",
    path: [
      [0, 2], [1, 2], [2, 2], [3, 2], [3, 3], [3, 4], [3, 5],
      [4, 5], [5, 5], [6, 5], [7, 5], [8, 5], [8, 6], [8, 7], [8, 8],
      [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8], [14, 7], [14, 6],
      [15, 6], [16, 6], [17, 6]
    ],
    terrainBands: {
      waterRows: [3, 4, 5],
      mountainRows: [9, 10],
      grassRows: [1, 7, 8]
    },
    terrainMix: ["FIELD", "GRASS", "WATER"]
  },
  {
    id: "route_1_3",
    name: "Route 1-3 (Victory Mountain)",
    unlockStars: 4,
    wavesCount: 20,
    description: "A rocky pass with steep climbs. Beware of Mewtwo's psychic power!",
    path: [
      [0, 9], [1, 9], [2, 9], [3, 9], [4, 9], [4, 8], [4, 7], [4, 6],
      [5, 6], [6, 6], [7, 6], [8, 6], [9, 6], [9, 5], [9, 4], [9, 3],
      [10, 3], [11, 3], [12, 3], [13, 3], [14, 3], [14, 4], [14, 5],
      [15, 5], [16, 5], [17, 5]
    ],
    terrainBands: {
      waterRows: [1],
      mountainRows: [7, 8, 9],
      grassRows: [4, 5]
    },
    terrainMix: ["FIELD", "GRASS", "WATER", "MOUNTAIN"]
  },
  {
    id: "route_1_4",
    name: "Route 1-4 (Indigo Plateau)",
    unlockStars: 6,
    wavesCount: 25,
    description: "The peak summit of Kanto. Confront the Champion's final boss, Dragonite!",
    path: [
      [0, 7], [1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [5, 6], [5, 5], [5, 4],
      [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4], [12, 4],
      [12, 5], [12, 6], [12, 7], [13, 7], [14, 7], [15, 7], [16, 7], [17, 7]
    ],
    terrainBands: {
      waterRows: [0, 1],
      mountainRows: [2, 3, 9, 10],
      grassRows: [5, 6]
    },
    terrainMix: ["FIELD", "MOUNTAIN"]
  }
];

export const pokemonSpecies = {
  // Bulbasaur Line
  bulbasaur: {
    name: "Bulbasaur", cost: 90, damage: 9, cooldown: 0.7, range: 2.4, role: "control",
    allowedTerrain: ["FIELD", "GRASS"], favoredTerrain: "GRASS", sprite: sprite(1),
    evolutions: ["ivysaur", "venusaur"], description: "Shoots vine whips that slow enemies by 40% (1.5s).",
    projectileColor: "#86efac", projectileType: "leaf", types: ["grass", "poison"]
  },
  ivysaur: {
    name: "Ivysaur", cost: 180, damage: 19, cooldown: 0.65, range: 2.8, role: "control",
    allowedTerrain: ["FIELD", "GRASS"], favoredTerrain: "GRASS", sprite: sprite(2),
    evolutions: ["venusaur"], description: "Thick whips slow enemies by 45% (2.0s).",
    projectileColor: "#4ade80", projectileType: "leaf", types: ["grass", "poison"]
  },
  venusaur: {
    name: "Venusaur", cost: 320, damage: 38, cooldown: 0.6, range: 3.5, role: "control",
    allowedTerrain: ["FIELD", "GRASS"], favoredTerrain: "GRASS", sprite: sprite(3),
    evolutions: [], description: "Razor Leaves slow by 50% and poison for 4 DPS (3s).",
    projectileColor: "#22c55e", projectileType: "razor_leaf", types: ["grass", "poison"],
    ability: { name: "Solar Beam", desc: "300% damage line shot", cooldown: 20, effect: "solar_beam" }
  },

  // Charmander Line
  charmander: {
    name: "Charmander", cost: 95, damage: 13, cooldown: 0.75, range: 2.2, role: "dps",
    allowedTerrain: ["FIELD", "MOUNTAIN"], favoredTerrain: "MOUNTAIN", sprite: sprite(4),
    evolutions: ["charmeleon", "charizard"], description: "Embers Burn targets for 2.5 DPS (3.0s). Burn ignores armor.",
    projectileColor: "#fdba74", projectileType: "ember", types: ["fire"]
  },
  charmeleon: {
    name: "Charmeleon", cost: 190, damage: 25, cooldown: 0.7, range: 2.6, role: "dps",
    allowedTerrain: ["FIELD", "MOUNTAIN"], favoredTerrain: "MOUNTAIN", sprite: sprite(5),
    evolutions: ["charizard"], description: "Flame bursts Burn targets for 5.0 DPS (3.5s).",
    projectileColor: "#f97316", projectileType: "ember", types: ["fire"]
  },
  charizard: {
    name: "Charizard", cost: 350, damage: 50, cooldown: 0.6, range: 3.2, role: "dps",
    allowedTerrain: ["FIELD", "MOUNTAIN"], favoredTerrain: "MOUNTAIN", sprite: sprite(6),
    evolutions: [], description: "Fires fireballs that inflict 8.0 DPS Burn and splash (1.0 tile).",
    projectileColor: "#ef4444", projectileType: "fireball", types: ["fire", "flying"],
    ability: { name: "Inferno", desc: "Burns all enemies in 3-tile radius (10 DPS, 5s)", cooldown: 25, effect: "inferno" }
  },

  // Squirtle Line
  squirtle: {
    name: "Squirtle", cost: 90, damage: 8, cooldown: 0.55, range: 2.4, role: "balanced",
    allowedTerrain: ["FIELD", "WATER"], favoredTerrain: "WATER", sprite: sprite(7),
    evolutions: ["wartortle", "blastoise"], description: "Bubbles deal splash damage (0.8 tile).",
    projectileColor: "#7dd3fc", projectileType: "bubble", types: ["water"]
  },
  wartortle: {
    name: "Wartortle", cost: 180, damage: 16, cooldown: 0.5, range: 2.8, role: "balanced",
    allowedTerrain: ["FIELD", "WATER"], favoredTerrain: "WATER", sprite: sprite(8),
    evolutions: ["blastoise"], description: "Water pulses with wider splash (1.1 tiles).",
    projectileColor: "#38bdf8", projectileType: "bubble", types: ["water"]
  },
  blastoise: {
    name: "Blastoise", cost: 330, damage: 34, cooldown: 0.45, range: 3.4, role: "balanced",
    allowedTerrain: ["FIELD", "WATER"], favoredTerrain: "WATER", sprite: sprite(9),
    evolutions: [], description: "Hydro Pumps splash (1.4 tiles) and Break enemy armor (4s).",
    projectileColor: "#2563eb", projectileType: "hydro_pump", types: ["water"],
    ability: { name: "Surf", desc: "Slows ALL enemies by 60% for 3s", cooldown: 30, effect: "surf" }
  },

  // Pikachu Line
  pikachu: {
    name: "Pikachu", cost: 120, damage: 7, cooldown: 0.35, range: 2.6, role: "control",
    allowedTerrain: ["FIELD", "GRASS"], favoredTerrain: "GRASS", sprite: sprite(25),
    evolutions: ["raichu"], description: "Fires quick sparks that slow targets by 20% (1s).",
    projectileColor: "#fef08a", projectileType: "spark", types: ["electric"]
  },
  raichu: {
    name: "Raichu", cost: 240, damage: 14, cooldown: 0.3, range: 3.2, role: "control",
    allowedTerrain: ["FIELD", "GRASS"], favoredTerrain: "GRASS", sprite: sprite(26),
    evolutions: [], description: "Thunderbolts jump to hit 3 targets, slowing each.",
    projectileColor: "#eab308", projectileType: "spark", types: ["electric"],
    ability: { name: "Thunder", desc: "Chain lightning hits up to 8 enemies", cooldown: 18, effect: "thunder" }
  },

  // Geodude Line
  geodude: {
    name: "Geodude", cost: 130, damage: 18, cooldown: 1.2, range: 1.8, role: "tank_killer",
    allowedTerrain: ["FIELD", "MOUNTAIN"], favoredTerrain: "MOUNTAIN", sprite: sprite(74),
    evolutions: ["graveler", "golem"], description: "Hurls rocks that Stun enemies for 0.5s.",
    projectileColor: "#a8a29e", projectileType: "rock", types: ["rock", "ground"]
  },
  graveler: {
    name: "Graveler", cost: 250, damage: 38, cooldown: 1.1, range: 2.1, role: "tank_killer",
    allowedTerrain: ["FIELD", "MOUNTAIN"], favoredTerrain: "MOUNTAIN", sprite: sprite(75),
    evolutions: ["golem"], description: "Large rocks deal high damage and Stun for 0.7s.",
    projectileColor: "#78716c", projectileType: "rock", types: ["rock", "ground"]
  },
  golem: {
    name: "Golem", cost: 400, damage: 85, cooldown: 1.0, range: 2.5, role: "tank_killer",
    allowedTerrain: ["FIELD", "MOUNTAIN"], favoredTerrain: "MOUNTAIN", sprite: sprite(76),
    evolutions: [], description: "Massive boulders Stun for 0.9s and ignore 50% armor.",
    projectileColor: "#57534e", projectileType: "rock", types: ["rock", "ground"],
    ability: { name: "Earthquake", desc: "Stuns ALL enemies for 2s", cooldown: 22, effect: "earthquake" }
  },

  // Oddish Line
  oddish: {
    name: "Oddish", cost: 110, damage: 6, cooldown: 0.45, range: 2.5, role: "dot",
    allowedTerrain: ["FIELD", "GRASS"], favoredTerrain: "GRASS", sprite: sprite(43),
    evolutions: ["gloom", "vileplume"], description: "Acid spores Poison target for 4.0 DPS (4.0s).",
    projectileColor: "#e9d5ff", projectileType: "poison", types: ["grass", "poison"]
  },
  gloom: {
    name: "Gloom", cost: 200, damage: 12, cooldown: 0.4, range: 2.8, role: "dot",
    allowedTerrain: ["FIELD", "GRASS"], favoredTerrain: "GRASS", sprite: sprite(44),
    evolutions: ["vileplume"], description: "Stinky nectar Poisons target for 8.0 DPS (4.0s).",
    projectileColor: "#d8b4fe", projectileType: "poison", types: ["grass", "poison"]
  },
  vileplume: {
    name: "Vileplume", cost: 320, damage: 24, cooldown: 0.35, range: 3.3, role: "dot",
    allowedTerrain: ["FIELD", "GRASS"], favoredTerrain: "GRASS", sprite: sprite(45),
    evolutions: [], description: "Petal blizzards Poison for 15.0 DPS and Slow by 30% (4s).",
    projectileColor: "#c084fc", projectileType: "poison", types: ["grass", "poison"]
  },

  // Pidgey Line
  pidgey: {
    name: "Pidgey", cost: 100, damage: 8, cooldown: 0.5, range: 2.7, role: "dps",
    allowedTerrain: ["FIELD", "GRASS", "WATER", "MOUNTAIN"], favoredTerrain: "FIELD", sprite: sprite(16),
    evolutions: ["pidgeotto", "pidgeot"], description: "Fires gusts. Balanced stats. Can be placed anywhere.",
    projectileColor: "#f1f5f9", projectileType: "gust", types: ["normal", "flying"]
  },
  pidgeotto: {
    name: "Pidgeotto", cost: 195, damage: 17, cooldown: 0.45, range: 3.1, role: "dps",
    allowedTerrain: ["FIELD", "GRASS", "WATER", "MOUNTAIN"], favoredTerrain: "FIELD", sprite: sprite(17),
    evolutions: ["pidgeot"], description: "Fast gusts. +15% Crit chance (1.5x damage).",
    projectileColor: "#e2e8f0", projectileType: "gust", types: ["normal", "flying"]
  },
  pidgeot: {
    name: "Pidgeot", cost: 310, damage: 32, cooldown: 0.4, range: 3.6, role: "dps",
    allowedTerrain: ["FIELD", "GRASS", "WATER", "MOUNTAIN"], favoredTerrain: "FIELD", sprite: sprite(18),
    evolutions: [], description: "Hurricane gusts. +25% Crit chance (2.0x damage).",
    projectileColor: "#cbd5e1", projectileType: "gust", types: ["normal", "flying"],
    ability: { name: "Hurricane", desc: "Blows back all enemies 2 tiles", cooldown: 25, effect: "hurricane" }
  },

  // Machop Line
  machop: {
    name: "Machop", cost: 130, damage: 15, cooldown: 0.8, range: 2.0, role: "dps",
    allowedTerrain: ["FIELD", "MOUNTAIN"], favoredTerrain: "FIELD", sprite: sprite(66),
    evolutions: ["machoke", "machamp"], description: "Melee punches. Deals double damage to heavy/boss enemies.",
    projectileColor: "#fca5a5", projectileType: "fist", types: ["fighting"]
  },
  machoke: {
    name: "Machoke", cost: 240, damage: 30, cooldown: 0.75, range: 2.3, role: "dps",
    allowedTerrain: ["FIELD", "MOUNTAIN"], favoredTerrain: "FIELD", sprite: sprite(67),
    evolutions: ["machamp"], description: "Karate chops ignore enemy armor.",
    projectileColor: "#f87171", projectileType: "fist", types: ["fighting"]
  },
  machamp: {
    name: "Machamp", cost: 390, damage: 60, cooldown: 0.7, range: 2.6, role: "dps",
    allowedTerrain: ["FIELD", "MOUNTAIN"], favoredTerrain: "FIELD", sprite: sprite(68),
    evolutions: [], description: "Four-arm punches. Deals splash damage and stuns (0.4s).",
    projectileColor: "#ef4444", projectileType: "fist", types: ["fighting"],
    ability: { name: "Dynamic Punch", desc: "Single target nuke (500% damage)", cooldown: 15, effect: "dynamic_punch" }
  },

  // Gastly Line
  gastly: {
    name: "Gastly", cost: 140, damage: 10, cooldown: 0.6, range: 2.8, role: "dot",
    allowedTerrain: ["FIELD", "GRASS", "MOUNTAIN"], favoredTerrain: "GRASS", sprite: sprite(92),
    evolutions: ["haunter", "gengar"], description: "Licks targets. Ignores armor. Ghost attacks bypass speed caps.",
    projectileColor: "#d8b4fe", projectileType: "ghost", types: ["ghost", "poison"]
  },
  haunter: {
    name: "Haunter", cost: 250, damage: 20, cooldown: 0.55, range: 3.1, role: "dot",
    allowedTerrain: ["FIELD", "GRASS", "MOUNTAIN"], favoredTerrain: "GRASS", sprite: sprite(93),
    evolutions: ["gengar"], description: "Shadow claws ignore armor and slow by 20%.",
    projectileColor: "#c084fc", projectileType: "ghost", types: ["ghost", "poison"]
  },
  gengar: {
    name: "Gengar", cost: 410, damage: 45, cooldown: 0.5, range: 3.5, role: "dot",
    allowedTerrain: ["FIELD", "GRASS", "MOUNTAIN"], favoredTerrain: "GRASS", sprite: sprite(94),
    evolutions: [], description: "Shadow balls Curse targets (12.0 DPS DoT, -50% armor).",
    projectileColor: "#a855f7", projectileType: "ghost", types: ["ghost", "poison"],
    ability: { name: "Shadow Ball Barrage", desc: "Fires 5 rapid shadow balls", cooldown: 20, effect: "shadow_barrage" }
  },

  // Eevee Line (Branching evolution)
  eevee: {
    name: "Eevee", cost: 80, damage: 10, cooldown: 0.6, range: 2.3, role: "balanced",
    allowedTerrain: ["FIELD"], favoredTerrain: "FIELD", sprite: sprite(133),
    evolutions: ["vaporeon", "jolteon", "flareon"], description: "Branching evolution! Randomly evolves at Lv.5 into Vaporeon, Jolteon, or Flareon.",
    projectileColor: "#f1f5f9", projectileType: "gust", types: ["normal"]
  },
  vaporeon: {
    name: "Vaporeon", cost: 160, damage: 24, cooldown: 0.55, range: 2.8, role: "balanced",
    allowedTerrain: ["FIELD", "WATER"], favoredTerrain: "WATER", sprite: sprite(134),
    evolutions: [], description: "Water pulses deal wide splash damage (1.2 tiles).",
    projectileColor: "#60a5fa", projectileType: "bubble", types: ["water"]
  },
  jolteon: {
    name: "Jolteon", cost: 160, damage: 18, cooldown: 0.3, range: 3.0, role: "control",
    allowedTerrain: ["FIELD", "GRASS"], favoredTerrain: "GRASS", sprite: sprite(135),
    evolutions: [], description: "Fires quick thunderbolts that slow and have 15% stun chance.",
    projectileColor: "#fbbf24", projectileType: "spark", types: ["electric"]
  },
  flareon: {
    name: "Flareon", cost: 160, damage: 35, cooldown: 0.8, range: 2.5, role: "dps",
    allowedTerrain: ["FIELD", "MOUNTAIN"], favoredTerrain: "MOUNTAIN", sprite: sprite(136),
    evolutions: [], description: "Flame bursts Burn targets for 6.0 DPS (3.5s).",
    projectileColor: "#f87171", projectileType: "ember", types: ["fire"]
  },

  // Snorlax (Unlock at 8 stars)
  snorlax: {
    name: "Snorlax", cost: 200, damage: 26, cooldown: 1.4, range: 1.8, role: "tank_killer",
    allowedTerrain: ["FIELD", "GRASS"], favoredTerrain: "FIELD", sprite: sprite(143),
    evolutions: [], description: "Body Slam slams target and stuns all nearby enemies (1.2 tiles) for 1.2s.",
    projectileColor: "#9ca3af", projectileType: "rock", types: ["normal"]
  },

  // Mew (Unlock at 14 stars)
  mew: {
    name: "Mew", cost: 250, damage: 20, cooldown: 0.5, range: 3.5, role: "balanced",
    allowedTerrain: ["FIELD", "GRASS", "WATER", "MOUNTAIN"], favoredTerrain: "FIELD", sprite: sprite(151),
    evolutions: [], description: "Aura Sphere chain attacks up to 5 targets.",
    projectileColor: "#f472b6", projectileType: "ghost", types: ["psychic"]
  }
};

export const recruitPool = ["pikachu", "geodude", "oddish", "pidgey", "machop", "gastly", "eevee"];

export const enemies = {
  rattata: { name: "Rattata", hp: 35, speed: 1.2, reward: 14, heartDamage: 1, armor: 0, sprite: sprite(19), types: ["normal"] },
  zubat: { name: "Zubat", hp: 25, speed: 1.7, reward: 13, heartDamage: 1, armor: 0, sprite: sprite(41), types: ["poison", "flying"] },
  machop: { name: "Machop", hp: 65, speed: 0.85, reward: 22, heartDamage: 1, armor: 1, regen: 2, sprite: sprite(66), types: ["fighting"] },
  geodude: { name: "Geodude", hp: 90, speed: 0.7, reward: 25, heartDamage: 1, armor: 3, sprite: sprite(74), types: ["rock", "ground"] },
  gastly: { name: "Gastly", hp: 55, speed: 1.1, reward: 28, heartDamage: 1, armor: 0, spectral: true, sprite: sprite(92), types: ["ghost", "poison"] },
  onix: { name: "Onix", hp: 200, speed: 0.5, reward: 50, heartDamage: 3, armor: 4, sprite: sprite(95), types: ["rock", "ground"] },
  gyarados: { name: "Gyarados", hp: 650, speed: 0.65, reward: 100, heartDamage: 5, armor: 3, boss: true, sprite: sprite(130), types: ["water", "flying"] },
  mewtwo: { name: "Mewtwo", hp: 1600, speed: 0.75, reward: 200, heartDamage: 10, armor: 5, regen: 10, boss: true, sprite: sprite(150), types: ["psychic"] },
  dragonite: { name: "Dragonite", hp: 3200, speed: 0.65, reward: 300, heartDamage: 10, armor: 6, regen: 15, boss: true, sprite: sprite(149), types: ["dragon", "flying"] }
};

// Type chart effectiveness mappings
export const TYPE_CHART = {
  normal: { rock: 0.5, ground: 0.5, ghost: 0.0 },
  fire: { fire: 0.5, water: 0.5, grass: 2.0, rock: 0.5, dragon: 0.5 },
  water: { fire: 2.0, water: 0.5, grass: 0.5, ground: 2.0, rock: 2.0, dragon: 0.5 },
  grass: { fire: 0.5, water: 2.0, grass: 0.5, poison: 0.5, flying: 0.5, ground: 2.0, rock: 2.0, ghost: 0.5, dragon: 0.5 },
  electric: { water: 2.0, grass: 0.5, electric: 0.5, flying: 2.0, ground: 0.0, dragon: 0.5 },
  fighting: { normal: 2.0, poison: 0.5, flying: 0.5, rock: 2.0, ghost: 0.0, psychic: 0.5 },
  poison: { grass: 2.0, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5 },
  rock: { fire: 2.0, fighting: 0.5, ground: 0.5, flying: 2.0, rock: 2.0 },
  flying: { grass: 2.0, electric: 0.5, fighting: 2.0, rock: 0.5 },
  ghost: { normal: 0.0, ghost: 2.0, psychic: 2.0 }
};

export const attackTypeMap = {
  leaf: "grass",
  razor_leaf: "grass",
  ember: "fire",
  fireball: "fire",
  bubble: "water",
  hydro_pump: "water",
  spark: "electric",
  rock: "rock",
  poison: "poison",
  gust: "flying",
  fist: "fighting",
  ghost: "ghost"
};

export function getTypeEffectiveness(attackProjType, defenderTypes) {
  const attackType = attackTypeMap[attackProjType];
  if (!attackType || !TYPE_CHART[attackType]) return 1.0;
  
  let mult = 1.0;
  for (const defType of defenderTypes) {
    if (TYPE_CHART[attackType][defType] !== undefined) {
      mult *= TYPE_CHART[attackType][defType];
    }
  }
  return mult;
}

// Return wave spawns specifically designed for each route and wave index
export function buildWave(routeId, waveIndex) {
  const queue = [];
  
  if (routeId === "route_1_1") {
    const size = 5 + waveIndex * 2;
    if (waveIndex < 3) {
      for (let i = 0; i < size; i++) {
        queue.push({ type: "rattata", delay: i * 0.9 });
      }
    } else if (waveIndex < 6) {
      for (let i = 0; i < size; i++) {
        const type = i % 3 === 0 ? "zubat" : "rattata";
        queue.push({ type, delay: i * 0.8 });
      }
    } else if (waveIndex < 9) {
      for (let i = 0; i < size; i++) {
        let type = "rattata";
        if (i % 4 === 0) type = "geodude";
        else if (i % 3 === 0) type = "zubat";
        queue.push({ type, delay: i * 0.8 });
      }
    } else {
      for (let i = 0; i < 8; i++) {
        queue.push({ type: "zubat", delay: i * 0.5 });
      }
      queue.push({ type: "onix", delay: 4.5 });
    }
  } else if (routeId === "route_1_2") {
    const size = 7 + waveIndex * 2;
    if (waveIndex < 5) {
      for (let i = 0; i < size; i++) {
        const type = i % 3 === 0 ? "zubat" : (i % 5 === 4 ? "machop" : "rattata");
        queue.push({ type, delay: i * 0.85 });
      }
    } else if (waveIndex < 10) {
      for (let i = 0; i < size; i++) {
        const type = i % 3 === 0 ? "gastly" : (i % 2 === 0 ? "zubat" : "machop");
        queue.push({ type, delay: i * 0.75 });
      }
    } else if (waveIndex < 14) {
      for (let i = 0; i < size; i++) {
        const type = i % 4 === 0 ? "onix" : (i % 2 === 0 ? "gastly" : "machop");
        queue.push({ type, delay: i * 0.8 });
      }
    } else {
      for (let i = 0; i < 10; i++) {
        queue.push({ type: "gastly", delay: i * 0.6 });
      }
      queue.push({ type: "gyarados", delay: 5.0 });
    }
  } else if (routeId === "route_1_3") {
    const size = 8 + waveIndex * 3;
    if (waveIndex < 6) {
      for (let i = 0; i < size; i++) {
        const types = ["rattata", "zubat", "machop", "geodude", "gastly"];
        const type = types[i % types.length];
        queue.push({ type, delay: i * 0.8 });
      }
    } else if (waveIndex < 12) {
      for (let i = 0; i < size; i++) {
        const type = i % 3 === 0 ? "geodude" : (i % 3 === 1 ? "machop" : "gastly");
        queue.push({ type, delay: i * 0.7 });
      }
    } else if (waveIndex < 16) {
      for (let i = 0; i < size; i++) {
        const type = i % 2 === 0 ? "zubat" : "gastly";
        queue.push({ type, delay: i * 0.5 });
      }
    } else if (waveIndex < 19) {
      queue.push({ type: "onix", delay: 1.0 });
      queue.push({ type: "gyarados", delay: 4.0 });
      for (let i = 0; i < 8; i++) {
        queue.push({ type: "machop", delay: i * 0.8 + 2.0 });
      }
    } else {
      for (let i = 0; i < 12; i++) {
        queue.push({ type: "gastly", delay: i * 0.5 });
        if (i % 4 === 0) queue.push({ type: "geodude", delay: i * 0.5 + 0.2 });
      }
      queue.push({ type: "mewtwo", delay: 6.0 });
    }
  } else {
    // Route 1-4 Indigo Plateau (25 waves)
    const size = 10 + waveIndex * 3;
    if (waveIndex < 8) {
      for (let i = 0; i < size; i++) {
        const types = ["zubat", "machop", "geodude", "gastly", "onix"];
        queue.push({ type: types[i % types.length], delay: i * 0.75 });
      }
    } else if (waveIndex < 16) {
      for (let i = 0; i < size; i++) {
        const types = ["machop", "geodude", "gastly", "onix", "gyarados"];
        queue.push({ type: types[i % types.length], delay: i * 0.7 });
      }
    } else if (waveIndex < 24) {
      for (let i = 0; i < size; i++) {
        const types = ["onix", "gyarados", "mewtwo"];
        queue.push({ type: types[i % types.length], delay: i * 0.65 });
      }
    } else {
      // final Champion wave
      for (let i = 0; i < 15; i++) {
        queue.push({ type: "gyarados", delay: i * 0.8 });
        if (i % 3 === 0) queue.push({ type: "mewtwo", delay: i * 0.8 + 0.3 });
      }
      queue.push({ type: "dragonite", delay: 8.0 });
    }
  }
  return queue;
}

export function towerUpgradeCost(level) {
  return Math.round(50 * Math.pow(1.48, level - 1));
}
