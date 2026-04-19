import {
  TILE,
  COLS,
  ROWS,
  MAX_WAVES,
  route,
  pokemonSpecies,
  recruitPool,
  enemies,
  buildWave,
  towerUpgradeCost
} from "./data.js";

const board = document.getElementById("board");
const ctx = board.getContext("2d");

const dom = {
  routeName: document.getElementById("routeName"),
  wave: document.getElementById("wave"),
  hearts: document.getElementById("hearts"),
  gold: document.getElementById("gold"),
  stars: document.getElementById("stars"),
  status: document.getElementById("status"),
  teamButtons: document.getElementById("teamButtons"),
  recruitBtn: document.getElementById("recruitBtn"),
  startWaveBtn: document.getElementById("startWaveBtn"),
  resetBtn: document.getElementById("resetBtn"),
  targetMode: document.getElementById("targetMode"),
  selectedTower: document.getElementById("selectedTower"),
  upgradeBtn: document.getElementById("upgradeBtn"),
  sellBtn: document.getElementById("sellBtn")
};

const TERRAIN_COLORS = {
  FIELD: "#20513b",
  GRASS: "#1f6a3a",
  WATER: "#245f8c",
  MOUNTAIN: "#4c566a"
};

const pathSet = new Set(route.path.map(([x, y]) => `${x},${y}`));
const pathPixels = route.path.map(([x, y]) => ({ x: x * TILE + TILE / 2, y: y * TILE + TILE / 2 }));

const state = {
  hearts: 20,
  gold: 300,
  stars: 0,
  wave: 1,
  runningWave: false,
  recruitCount: 0,
  activeTeam: ["bulbasaur", "charmander", "squirtle"],
  selectedSpecies: "bulbasaur",
  selectedTowerIndex: null,
  placed: [],
  enemies: [],
  spawnQueue: [],
  elapsedWave: 0,
  gameOver: false
};

const images = new Map();
function sprite(url) {
  if (!images.has(url)) {
    const img = new Image();
    img.src = url;
    images.set(url, img);
  }
  return images.get(url);
}

function tileTerrain(y) {
  if (route.terrainBands.waterRows.includes(y)) return "WATER";
  if (route.terrainBands.mountainRows.includes(y)) return "MOUNTAIN";
  if (route.terrainBands.grassRows.includes(y)) return "GRASS";
  return "FIELD";
}

function canPlace(speciesId, x, y) {
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return false;
  if (pathSet.has(`${x},${y}`)) return false;
  if (state.placed.some((t) => t.x === x && t.y === y)) return false;
  return pokemonSpecies[speciesId].allowedTerrain.includes(tileTerrain(y));
}

function status(message, isError = false) {
  dom.status.textContent = message;
  dom.status.style.color = isError ? "#fca5a5" : "#93c5fd";
}

function updateSelectedTowerText() {
  if (state.selectedTowerIndex === null) {
    dom.selectedTower.textContent = "None selected";
    dom.upgradeBtn.disabled = true;
    dom.sellBtn.disabled = true;
    return;
  }

  const tower = state.placed[state.selectedTowerIndex];
  if (!tower) {
    state.selectedTowerIndex = null;
    updateSelectedTowerText();
    return;
  }

  const spec = pokemonSpecies[tower.speciesId];
  const nextCost = towerUpgradeCost(tower.level);
  dom.selectedTower.textContent = `${spec.name} Lv.${tower.level} • ${tower.targetMode.toUpperCase()} • Next upgrade: ${nextCost}g`;
  dom.upgradeBtn.disabled = false;
  dom.sellBtn.disabled = false;
}

function updateHud() {
  dom.routeName.textContent = route.name;
  dom.wave.textContent = String(state.wave);
  dom.hearts.textContent = String(state.hearts);
  dom.gold.textContent = String(state.gold);
  dom.stars.textContent = String(state.stars);
  dom.startWaveBtn.disabled = state.runningWave || state.gameOver;

  const recruitCost = 120 + state.recruitCount * 15;
  dom.recruitBtn.textContent = `Recruit Random Pokémon (${recruitCost}g)`;
  updateSelectedTowerText();
}

function teamButtons() {
  dom.teamButtons.innerHTML = "";
  state.activeTeam.forEach((speciesId) => {
    const s = pokemonSpecies[speciesId];
    const btn = document.createElement("button");
    btn.textContent = `${s.name} (${s.cost}g)`;
    btn.classList.toggle("active", speciesId === state.selectedSpecies);
    btn.addEventListener("click", () => {
      state.selectedSpecies = speciesId;
      state.selectedTowerIndex = null;
      status(`Selected ${s.name} for placement.`);
      teamButtons();
      updateHud();
    });
    dom.teamButtons.appendChild(btn);
  });
}

function enemyMaxHp(enemy) {
  return enemies[enemy.type].hp + Math.floor((state.wave - 1) * 6);
}

function spawnEnemy(type) {
  const base = enemies[type];
  state.enemies.push({
    type,
    hp: base.hp + Math.floor((state.wave - 1) * 6),
    speed: base.speed,
    reward: base.reward,
    heartDamage: base.heartDamage,
    armor: base.armor ?? 0,
    pathIndex: 0,
    x: pathPixels[0].x,
    y: pathPixels[0].y,
    alive: true
  });
}

function recruitRandom() {
  const cost = 120 + state.recruitCount * 15;
  if (state.gold < cost) return status("Not enough gold to recruit.", true);

  const biasedPool = recruitPool.filter((id) => ["dps", "control"].includes(pokemonSpecies[id].role));
  const pool = state.recruitCount < 2 ? biasedPool : recruitPool;
  const pick = pool[Math.floor(Math.random() * pool.length)];

  state.gold -= cost;
  state.recruitCount += 1;

  if (!state.activeTeam.includes(pick)) {
    state.activeTeam.push(pick);
    status(`Recruited ${pokemonSpecies[pick].name}.`);
    teamButtons();
  } else {
    state.gold += 30;
    status(`Duplicate ${pokemonSpecies[pick].name}; converted to +30g.`);
  }
  updateHud();
}

function startWave() {
  if (state.runningWave || state.gameOver) return;
  state.runningWave = true;
  state.elapsedWave = 0;
  state.spawnQueue = buildWave(state.wave - 1);
  status(`Wave ${state.wave} started.`);
  updateHud();
}

function placeTower(x, y) {
  const speciesId = state.selectedSpecies;
  const spec = pokemonSpecies[speciesId];
  if (!canPlace(speciesId, x, y)) return status("Invalid tile for this Pokémon.", true);
  if (state.gold < spec.cost) return status("Not enough gold.", true);

  state.gold -= spec.cost;
  state.placed.push({
    speciesId,
    x,
    y,
    level: 1,
    cooldown: 0,
    targetMode: dom.targetMode.value
  });
  state.selectedTowerIndex = state.placed.length - 1;
  status(`${spec.name} placed on ${tileTerrain(y)}.`);
  updateHud();
}

function selectTower(x, y) {
  const found = state.placed.findIndex((t) => t.x === x && t.y === y);
  if (found === -1) {
    state.selectedTowerIndex = null;
    updateHud();
    return false;
  }
  state.selectedTowerIndex = found;
  const tower = state.placed[found];
  const spec = pokemonSpecies[tower.speciesId];
  status(`Selected ${spec.name} tower.`);
  updateHud();
  return true;
}

function upgradeSelectedTower() {
  if (state.selectedTowerIndex === null) return;
  const tower = state.placed[state.selectedTowerIndex];
  if (!tower) return;

  const cost = towerUpgradeCost(tower.level);
  if (state.gold < cost) return status("Not enough gold to upgrade.", true);

  state.gold -= cost;
  tower.level += 1;
  status(`${pokemonSpecies[tower.speciesId].name} upgraded to Lv.${tower.level}.`);
  updateHud();
}

function sellSelectedTower() {
  if (state.selectedTowerIndex === null) return;
  const tower = state.placed[state.selectedTowerIndex];
  if (!tower) return;

  const baseCost = pokemonSpecies[tower.speciesId].cost;
  const invested = Array.from({ length: tower.level - 1 }, (_, i) => towerUpgradeCost(i + 1)).reduce((a, b) => a + b, 0);
  const refund = Math.round((baseCost + invested) * 0.65);
  state.gold += refund;
  state.placed.splice(state.selectedTowerIndex, 1);
  state.selectedTowerIndex = null;
  status(`Tower sold for ${refund}g.`);
  updateHud();
}

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function chooseTarget(towerPoint, candidates, mode) {
  if (!candidates.length) return null;

  switch (mode) {
    case "last":
      return [...candidates].sort((a, b) => a.pathIndex - b.pathIndex)[0];
    case "strongest":
      return [...candidates].sort((a, b) => b.hp - a.hp)[0];
    case "weakest":
      return [...candidates].sort((a, b) => a.hp - b.hp)[0];
    case "fastest":
      return [...candidates].sort((a, b) => b.speed - a.speed)[0];
    case "slowest":
      return [...candidates].sort((a, b) => a.speed - b.speed)[0];
    case "closest":
      return [...candidates].sort((a, b) => distance(towerPoint, a) - distance(towerPoint, b))[0];
    case "first":
    default:
      return [...candidates].sort((a, b) => b.pathIndex - a.pathIndex)[0];
  }
}

function updateTowers(dt) {
  for (const tower of state.placed) {
    const spec = pokemonSpecies[tower.speciesId];
    tower.cooldown -= dt;
    if (tower.cooldown > 0) continue;

    const towerPoint = { x: tower.x * TILE + TILE / 2, y: tower.y * TILE + TILE / 2 };
    const rangePx = spec.range * TILE * (1 + (tower.level - 1) * 0.08);
    const inRange = state.enemies.filter((enemy) => enemy.alive && distance(towerPoint, enemy) <= rangePx);
    if (!inRange.length) continue;

    const target = chooseTarget(towerPoint, inRange, tower.targetMode);
    if (!target) continue;

    const baseDmg = spec.damage * (1 + (tower.level - 1) * 0.22);
    const finalDmg = Math.max(1, baseDmg - target.armor);
    target.hp -= finalDmg;

    if (spec.role === "control" && Math.random() < 0.12) {
      target.speed = Math.max(0.5, target.speed * 0.84);
    }

    if (target.hp <= 0 && target.alive) {
      target.alive = false;
      state.gold += target.reward;
    }
    tower.cooldown = Math.max(0.16, spec.cooldown * Math.pow(0.98, tower.level - 1));
  }
}

function updateEnemies(dt) {
  for (const enemy of state.enemies) {
    if (!enemy.alive) continue;

    const nextIndex = enemy.pathIndex + 1;
    if (nextIndex >= pathPixels.length) {
      enemy.alive = false;
      state.hearts -= enemy.heartDamage;
      if (state.hearts <= 0) {
        state.hearts = 0;
        state.gameOver = true;
        state.runningWave = false;
        status("Defeat. Hearts reached 0.", true);
      }
      continue;
    }

    const next = pathPixels[nextIndex];
    const vx = next.x - enemy.x;
    const vy = next.y - enemy.y;
    const length = Math.sqrt(vx * vx + vy * vy) || 1;
    const step = enemy.speed * TILE * dt;

    if (step >= length) {
      enemy.x = next.x;
      enemy.y = next.y;
      enemy.pathIndex = nextIndex;
    } else {
      enemy.x += (vx / length) * step;
      enemy.y += (vy / length) * step;
    }
  }

  state.enemies = state.enemies.filter((enemy) => enemy.alive);
}

function updateWave(dt) {
  if (!state.runningWave) return;

  state.elapsedWave += dt;
  while (state.spawnQueue.length && state.spawnQueue[0].delay <= state.elapsedWave) {
    const { type } = state.spawnQueue.shift();
    spawnEnemy(type);
  }

  if (!state.spawnQueue.length && !state.enemies.length) {
    state.runningWave = false;
    state.gold += 35 + state.wave * 4;
    state.stars += 1;
    status(`Wave ${state.wave} cleared.`);
    state.wave += 1;

    if (state.wave > MAX_WAVES) {
      state.gameOver = true;
      status("Victory! Route cleared.");
    }
  }
}

function drawBoard() {
  ctx.clearRect(0, 0, board.width, board.height);

  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      const key = `${x},${y}`;
      const color = pathSet.has(key) ? "#9f7a47" : TERRAIN_COLORS[tileTerrain(y)];
      ctx.fillStyle = color;
      ctx.fillRect(x * TILE, y * TILE, TILE - 1, TILE - 1);
    }
  }

  state.placed.forEach((tower, idx) => {
    const spec = pokemonSpecies[tower.speciesId];
    const px = tower.x * TILE + 7;
    const py = tower.y * TILE + 7;

    if (state.selectedTowerIndex === idx) {
      ctx.strokeStyle = "#93c5fd";
      ctx.lineWidth = 2;
      ctx.strokeRect(tower.x * TILE + 2, tower.y * TILE + 2, TILE - 4, TILE - 4);
    }

    ctx.drawImage(sprite(spec.sprite), px, py, TILE - 14, TILE - 14);
  });

  state.enemies.forEach((enemy) => {
    ctx.drawImage(sprite(enemies[enemy.type].sprite), enemy.x - 18, enemy.y - 18, 36, 36);
    ctx.fillStyle = "#111827";
    ctx.fillRect(enemy.x - 16, enemy.y - 24, 32, 4);
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(enemy.x - 16, enemy.y - 24, 32 * Math.max(0, enemy.hp / enemyMaxHp(enemy)), 4);
  });
}

function clickBoard(event) {
  const rect = board.getBoundingClientRect();
  const x = Math.floor(((event.clientX - rect.left) * (board.width / rect.width)) / TILE);
  const y = Math.floor(((event.clientY - rect.top) * (board.height / rect.height)) / TILE);

  if (selectTower(x, y)) return;
  placeTower(x, y);
}

function reset() {
  Object.assign(state, {
    hearts: 20,
    gold: 300,
    stars: 0,
    wave: 1,
    runningWave: false,
    recruitCount: 0,
    activeTeam: ["bulbasaur", "charmander", "squirtle"],
    selectedSpecies: "bulbasaur",
    selectedTowerIndex: null,
    placed: [],
    enemies: [],
    spawnQueue: [],
    elapsedWave: 0,
    gameOver: false
  });
  teamButtons();
  updateHud();
  status("Run reset.");
}

board.addEventListener("click", clickBoard);
dom.recruitBtn.addEventListener("click", recruitRandom);
dom.startWaveBtn.addEventListener("click", startWave);
dom.resetBtn.addEventListener("click", reset);
dom.upgradeBtn.addEventListener("click", upgradeSelectedTower);
dom.sellBtn.addEventListener("click", sellSelectedTower);

document.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    startWave();
  }
  if (event.key.toLowerCase() === "u") {
    upgradeSelectedTower();
  }
});

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;

  updateWave(dt);
  updateEnemies(dt);
  updateTowers(dt);
  drawBoard();
  updateHud();

  requestAnimationFrame(loop);
}

teamButtons();
updateHud();
status("Place your starter, then press Start Wave.");
requestAnimationFrame(loop);
