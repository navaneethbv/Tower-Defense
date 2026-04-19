import { TILE, COLS, ROWS, route, pokemonSpecies, recruitPool, enemies, buildWave } from "./data.js";

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
  resetBtn: document.getElementById("resetBtn")
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

function getTileTerrain(y) {
  if (route.terrainBands.waterRows.includes(y)) return "WATER";
  if (route.terrainBands.mountainRows.includes(y)) return "MOUNTAIN";
  if (route.terrainBands.grassRows.includes(y)) return "GRASS";
  return "FIELD";
}

function canPlace(speciesId, x, y) {
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return false;
  if (pathSet.has(`${x},${y}`)) return false;
  if (state.placed.some((p) => p.x === x && p.y === y)) return false;
  const terrain = getTileTerrain(y);
  return pokemonSpecies[speciesId].allowedTerrain.includes(terrain);
}

function addStatus(msg, bad = false) {
  dom.status.textContent = msg;
  dom.status.style.color = bad ? "#fca5a5" : "#93c5fd";
}

function updateHud() {
  dom.routeName.textContent = route.name;
  dom.wave.textContent = String(state.wave);
  dom.hearts.textContent = String(state.hearts);
  dom.gold.textContent = String(state.gold);
  dom.stars.textContent = String(state.stars);
  const recruitCost = 120 + state.recruitCount * 15;
  dom.recruitBtn.textContent = `Recruit Random Pokémon (${recruitCost}g)`;
  dom.startWaveBtn.disabled = state.runningWave || state.gameOver;
}

function buildTeamButtons() {
  dom.teamButtons.innerHTML = "";
  state.activeTeam.forEach((speciesId) => {
    const s = pokemonSpecies[speciesId];
    const btn = document.createElement("button");
    btn.textContent = `${s.name} (${s.cost}g)`;
    btn.dataset.species = speciesId;
    if (speciesId === state.selectedSpecies) btn.classList.add("active");
    btn.addEventListener("click", () => {
      state.selectedSpecies = speciesId;
      buildTeamButtons();
    });
    dom.teamButtons.appendChild(btn);
  });
}

function placeTower(gridX, gridY) {
  if (state.gameOver) return;
  const speciesId = state.selectedSpecies;
  if (!canPlace(speciesId, gridX, gridY)) {
    addStatus("Invalid tile for that Pokémon.", true);
    return;
  }
  const species = pokemonSpecies[speciesId];
  if (state.gold < species.cost) {
    addStatus("Not enough gold.", true);
    return;
  }
  state.gold -= species.cost;
  state.placed.push({ speciesId, x: gridX, y: gridY, cooldown: 0, level: 1 });
  addStatus(`${species.name} placed.`);
  updateHud();
}

function spawnEnemy(type) {
  const e = enemies[type];
  state.enemies.push({
    type,
    hp: e.hp + Math.floor((state.wave - 1) * 6),
    speed: e.speed,
    reward: e.reward,
    heartDamage: e.heartDamage,
    pathIndex: 0,
    x: pathPixels[0].x,
    y: pathPixels[0].y,
    alive: true
  });
}

function startWave() {
  if (state.runningWave || state.gameOver) return;
  state.runningWave = true;
  state.elapsedWave = 0;
  state.spawnQueue = buildWave(state.wave - 1);
  addStatus(`Wave ${state.wave} started.`);
  updateHud();
}

function recruitRandom() {
  if (state.gameOver) return;
  const cost = 120 + state.recruitCount * 15;
  if (state.gold < cost) {
    addStatus("Not enough gold to recruit.", true);
    return;
  }

  const biased = state.recruitCount < 2;
  const pool = biased
    ? recruitPool.filter((id) => ["dps", "control"].includes(pokemonSpecies[id].role))
    : recruitPool;
  const pick = pool[Math.floor(Math.random() * pool.length)];

  state.gold -= cost;
  state.recruitCount += 1;

  if (!state.activeTeam.includes(pick)) {
    state.activeTeam.push(pick);
    addStatus(`Recruited ${pokemonSpecies[pick].name}!`);
    buildTeamButtons();
  } else {
    state.gold += 30;
    addStatus(`Duplicate ${pokemonSpecies[pick].name} converted to +30g.`);
  }
  updateHud();
}

function dist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function updateTowers(dt) {
  state.placed.forEach((tower) => {
    const spec = pokemonSpecies[tower.speciesId];
    tower.cooldown -= dt;
    if (tower.cooldown > 0) return;

    const towerPoint = { x: tower.x * TILE + TILE / 2, y: tower.y * TILE + TILE / 2 };
    const inRange = state.enemies
      .filter((e) => e.alive && dist(towerPoint, e) <= spec.range * TILE)
      .sort((a, b) => b.pathIndex - a.pathIndex);

    if (!inRange.length) return;

    const target = inRange[0];
    target.hp -= spec.damage * (1 + (tower.level - 1) * 0.25);

    if (spec.role === "control" && Math.random() < 0.15) {
      target.speed *= 0.8;
    }

    if (target.hp <= 0 && target.alive) {
      target.alive = false;
      state.gold += target.reward;
    }

    tower.cooldown = spec.cooldown;
  });
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
        addStatus("Defeat. Hearts reached 0.", true);
      }
      continue;
    }

    const next = pathPixels[nextIndex];
    const vx = next.x - enemy.x;
    const vy = next.y - enemy.y;
    const d = Math.sqrt(vx * vx + vy * vy) || 1;
    const move = enemy.speed * TILE * dt;

    if (move >= d) {
      enemy.x = next.x;
      enemy.y = next.y;
      enemy.pathIndex = nextIndex;
    } else {
      enemy.x += (vx / d) * move;
      enemy.y += (vy / d) * move;
    }
  }

  state.enemies = state.enemies.filter((e) => e.alive);
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
    addStatus(`Wave ${state.wave} cleared!`);
    state.wave += 1;
    if (state.wave > 20) {
      state.gameOver = true;
      addStatus("Victory! Prototype route cleared.");
    }
  }
}

function drawTile(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * TILE, y * TILE, TILE - 1, TILE - 1);
}

function drawBoard() {
  ctx.clearRect(0, 0, board.width, board.height);

  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      const key = `${x},${y}`;
      if (pathSet.has(key)) {
        drawTile(x, y, "#9f7a47");
      } else {
        const terrain = getTileTerrain(y);
        const color = terrain === "WATER" ? "#245f8c" : terrain === "MOUNTAIN" ? "#4c566a" : terrain === "GRASS" ? "#1f6a3a" : "#20513b";
        drawTile(x, y, color);
      }
    }
  }

  state.placed.forEach((tower) => {
    const spec = pokemonSpecies[tower.speciesId];
    const x = tower.x * TILE + 8;
    const y = tower.y * TILE + 8;
    const img = sprite(spec.sprite);
    ctx.drawImage(img, x, y, TILE - 16, TILE - 16);
  });

  state.enemies.forEach((enemy) => {
    const img = sprite(enemies[enemy.type].sprite);
    ctx.drawImage(img, enemy.x - 18, enemy.y - 18, 36, 36);
    ctx.fillStyle = "#111827";
    ctx.fillRect(enemy.x - 16, enemy.y - 24, 32, 4);
    ctx.fillStyle = "#ef4444";
    const ratio = Math.max(0, enemy.hp / (enemies[enemy.type].hp + Math.floor((state.wave - 1) * 6)));
    ctx.fillRect(enemy.x - 16, enemy.y - 24, 32 * ratio, 4);
  });
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
    placed: [],
    enemies: [],
    spawnQueue: [],
    elapsedWave: 0,
    gameOver: false
  });
  buildTeamButtons();
  updateHud();
  addStatus("Run reset.");
}

board.addEventListener("click", (event) => {
  const rect = board.getBoundingClientRect();
  const scaleX = board.width / rect.width;
  const scaleY = board.height / rect.height;
  const x = Math.floor(((event.clientX - rect.left) * scaleX) / TILE);
  const y = Math.floor(((event.clientY - rect.top) * scaleY) / TILE);
  placeTower(x, y);
});

dom.recruitBtn.addEventListener("click", recruitRandom);
dom.startWaveBtn.addEventListener("click", startWave);
dom.resetBtn.addEventListener("click", reset);

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

buildTeamButtons();
updateHud();
addStatus("Select a starter, place it, and start wave 1.");
requestAnimationFrame(loop);
