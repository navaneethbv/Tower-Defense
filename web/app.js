import {
  TILE,
  COLS,
  ROWS,
  routes,
  pokemonSpecies,
  recruitPool,
  enemies,
  buildWave,
  towerUpgradeCost,
  DIFFICULTY_MODIFIERS
} from "./data.js";

// DOM references
const board = document.getElementById("board");
const ctx = board.getContext("2d");

const dom = {
  // Screens
  mainMenuScreen: document.getElementById("mainMenuScreen"),
  pokedexScreen: document.getElementById("pokedexScreen"),
  gameScreen: document.getElementById("gameScreen"),
  
  // Menu DOM
  globalStars: document.getElementById("globalStars"),
  routesGrid: document.getElementById("routesGrid"),
  menuTeamList: document.getElementById("menuTeamList"),
  goToPokedexBtn: document.getElementById("goToPokedexBtn"),
  routeDifficulty: document.getElementById("routeDifficulty"),
  
  // Pokédex DOM
  pokedexBackBtn: document.getElementById("pokedexBackBtn"),
  pokedexGrid: document.getElementById("pokedexGrid"),
  pokedexDetailsPane: document.getElementById("pokedexDetailsPane"),
  
  // Game HUD
  hudRouteName: document.getElementById("hudRouteName"),
  hearts: document.getElementById("hearts"),
  gold: document.getElementById("gold"),
  wave: document.getElementById("wave"),
  hudMaxWaves: document.getElementById("hudMaxWaves"),
  stars: document.getElementById("stars"),
  status: document.getElementById("status"),
  teamButtons: document.getElementById("teamButtons"),
  targetMode: document.getElementById("targetMode"),
  gameSpeed: document.getElementById("gameSpeed"),
  gridToggleBtn: document.getElementById("gridToggleBtn"),
  muteToggleBtn: document.getElementById("muteToggleBtn"),
  waveProgressBar: document.getElementById("waveProgressBar"),
  
  // Selected Tower
  selectedTower: document.getElementById("selectedTower"),
  upgradeBtn: document.getElementById("upgradeBtn"),
  sellBtn: document.getElementById("sellBtn"),
  
  // Shop & Controls
  recruitBtn: document.getElementById("recruitBtn"),
  startWaveBtn: document.getElementById("startWaveBtn"),
  resetBtn: document.getElementById("resetBtn"),
  gameExitBtn: document.getElementById("gameExitBtn"),
  
  // Game Over Modal
  gameOverModal: document.getElementById("gameOverModal"),
  modalTitle: document.getElementById("modalTitle"),
  modalMessage: document.getElementById("modalMessage"),
  modalStars: document.getElementById("modalStars"),
  unlockContainer: document.getElementById("unlockContainer"),
  unlockedPokemonShowcase: document.getElementById("unlockedPokemonShowcase"),
  modalExitBtn: document.getElementById("modalExitBtn"),
  modalRetryBtn: document.getElementById("modalRetryBtn")
};

// Global Profile (saved to localStorage)
let profile = {
  stars: 0,
  unlockedPokemon: ["bulbasaur", "charmander", "squirtle", "pikachu", "geodude", "oddish", "pidgey"],
  activeTeam: ["bulbasaur", "charmander", "squirtle", "pikachu", "geodude", "oddish"],
  starsEarned: {
    route_1_1: 0,
    route_1_2: 0,
    route_1_3: 0
  }
};

// In-match Game State
const state = {
  route: null,
  hearts: 20,
  gold: 300,
  wave: 1,
  runningWave: false,
  recruitCount: 0,
  selectedSpecies: null,
  selectedTowerIndex: null,
  firstPlacementFree: true,
  
  placed: [],
  enemies: [],
  spawnQueue: [],
  projectiles: [],
  particles: [],
  floatingTexts: [],
  
  elapsedWave: 0,
  gameOver: false,
  gameSpeed: 1.0,
  
  pathSet: new Set(),
  pathPixels: [],
  
  // New features QoL state
  hoverTile: { x: -1, y: -1 },
  difficultyMode: "normal",
  muted: false,
  showGrid: false,
  waveSpawnsTotal: 0,
  waveSpawnsCount: 0
};

// Asset cache
const images = new Map();
function sprite(url) {
  if (!images.has(url)) {
    const img = new Image();
    img.src = url;
    images.set(url, img);
  }
  return images.get(url);
}

// Sound Synthesizer using Web Audio API (Retro Game Style)
let audioCtx = null;
function playSound(type) {
  if (state.muted) return;
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    const now = audioCtx.currentTime;
    
    if (type === "shoot") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
      gainNode.gain.setValueAtTime(0.12, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === "hit") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(60, now + 0.08);
      gainNode.gain.setValueAtTime(0.1, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === "evolve") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.linearRampToValueAtTime(600, now + 0.15);
      osc.frequency.linearRampToValueAtTime(400, now + 0.3);
      osc.frequency.linearRampToValueAtTime(800, now + 0.45);
      gainNode.gain.setValueAtTime(0.15, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.45);
    } else if (type === "leak") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.linearRampToValueAtTime(60, now + 0.25);
      gainNode.gain.setValueAtTime(0.2, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === "victory") {
      const notes = [261.63, 329.63, 392.00, 523.25]; // C E G C
      notes.forEach((freq, idx) => {
        const noteOsc = audioCtx.createOscillator();
        const noteGain = audioCtx.createGain();
        noteOsc.connect(noteGain);
        noteGain.connect(audioCtx.destination);
        
        noteOsc.type = "square";
        noteOsc.frequency.setValueAtTime(freq, now + idx * 0.12);
        noteGain.gain.setValueAtTime(0.08, now + idx * 0.12);
        noteGain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.12 + 0.2);
        
        noteOsc.start(now + idx * 0.12);
        noteOsc.stop(now + idx * 0.12 + 0.2);
      });
    } else if (type === "defeat") {
      const notes = [293.66, 277.18, 261.63, 220.00]; // D Db C A
      notes.forEach((freq, idx) => {
        const noteOsc = audioCtx.createOscillator();
        const noteGain = audioCtx.createGain();
        noteOsc.connect(noteGain);
        noteGain.connect(audioCtx.destination);
        
        noteOsc.type = "triangle";
        noteOsc.frequency.setValueAtTime(freq, now + idx * 0.15);
        noteGain.gain.setValueAtTime(0.12, now + idx * 0.15);
        noteGain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.15 + 0.35);
        
        noteOsc.start(now + idx * 0.15);
        noteOsc.stop(now + idx * 0.15 + 0.35);
      });
    }
  } catch (e) {
    console.warn("Sound play failed: Context not fully ready yet.", e);
  }
}

// PROFILE SAVE / LOAD
function loadProfile() {
  const data = localStorage.getItem("pokemonRouteDefenseProfile");
  if (data) {
    try {
      const loaded = JSON.parse(data);
      profile = { ...profile, ...loaded };
    } catch (e) {
      console.error("Failed parsing profile from storage", e);
    }
  }
  
  // Recalculate unlocks based on stars
  updateProfileUnlocks();
  saveProfile();
}

function saveProfile() {
  localStorage.setItem("pokemonRouteDefenseProfile", JSON.stringify(profile));
}

function updateProfileUnlocks() {
  const totalStars = Object.values(profile.starsEarned).reduce((a, b) => a + b, 0);
  profile.stars = totalStars;
  
  // Star thresholds for unlocking Machop & Gastly
  if (totalStars >= 5 && !profile.unlockedPokemon.includes("machop")) {
    profile.unlockedPokemon.push("machop");
  }
  if (totalStars >= 12 && !profile.unlockedPokemon.includes("gastly")) {
    profile.unlockedPokemon.push("gastly");
  }
}

// SCREEN NAV
function showScreen(screenId) {
  dom.mainMenuScreen.classList.toggle("hidden", screenId !== "mainMenuScreen");
  dom.pokedexScreen.classList.toggle("hidden", screenId !== "pokedexScreen");
  dom.gameScreen.classList.toggle("hidden", screenId !== "gameScreen");
  
  if (screenId === "mainMenuScreen") {
    renderMenu();
  } else if (screenId === "pokedexScreen") {
    renderPokedex();
  }
}

// MENU RENDERING
function renderMenu() {
  updateProfileUnlocks();
  dom.globalStars.textContent = String(profile.stars);
  
  // Populate Route select grid
  dom.routesGrid.innerHTML = "";
  routes.forEach((routeData) => {
    const isUnlocked = profile.stars >= routeData.unlockStars;
    const card = document.createElement("div");
    card.className = `route-card ${isUnlocked ? "" : "locked"}`;
    
    let starsStr = "";
    const earned = profile.starsEarned[routeData.id] || 0;
    for (let i = 0; i < 3; i++) {
      starsStr += i < earned ? "⭐" : "☆";
    }
    
    card.innerHTML = `
      <div class="route-info">
        <h3>${routeData.name}</h3>
        <p>${routeData.description}</p>
        <div class="route-meta">
          <span class="meta-waves">🌊 ${routeData.wavesCount} Waves</span>
          <span class="meta-terrain">🗺️ ${routeData.terrainMix.join(", ")}</span>
        </div>
      </div>
      ${isUnlocked ? `<div class="stars-container">${starsStr}</div>` : `<div class="lock-badge">Locked (Requires ${routeData.unlockStars} ⭐)</div>`}
    `;
    
    if (isUnlocked) {
      card.addEventListener("click", () => {
        state.difficultyMode = dom.routeDifficulty.value;
        startMatch(routeData);
      });
    }
    dom.routesGrid.appendChild(card);
  });
  
  // Populate Active Team Slots
  dom.menuTeamList.innerHTML = "";
  for (let i = 0; i < 6; i++) {
    const slot = document.createElement("div");
    slot.className = "menu-team-slot";
    
    const speciesId = profile.activeTeam[i];
    if (speciesId) {
      const spec = pokemonSpecies[speciesId];
      slot.classList.add("filled");
      
      const badgeClass = spec.favoredTerrain.toLowerCase();
      slot.innerHTML = `
        <span class="slot-tag badge ${badgeClass}">${spec.favoredTerrain}</span>
        <img src="${spec.sprite}" alt="${spec.name}">
        <span class="slot-name">${spec.name}</span>
      `;
    } else {
      slot.innerHTML = `<span style="color: #4b5563; font-size: 2rem;">+</span>`;
    }
    dom.menuTeamList.appendChild(slot);
  }
}

// POKEDEX RENDERING
let selectedPokedexSpeciesId = null;
function renderPokedex() {
  dom.pokedexGrid.innerHTML = "";
  Object.keys(pokemonSpecies).forEach((speciesId) => {
    const spec = pokemonSpecies[speciesId];
    
    // Only display base evolution stages in pokedex grid selector
    const isBaseForm = !Object.values(pokemonSpecies).some(other => other.evolutions.includes(speciesId));
    if (!isBaseForm) return;
    
    const isUnlocked = profile.unlockedPokemon.includes(speciesId);
    const card = document.createElement("div");
    card.className = `pokedex-card ${isUnlocked ? "" : "locked"}`;
    
    const spriteUrl = spec.sprite;
    const match = spriteUrl.match(/\/(\d+)\.png$/);
    const dexNum = match ? `#${String(match[1]).padStart(3, '0')}` : "#000";
    
    card.innerHTML = `
      <span class="dex-num">${dexNum}</span>
      <img src="${spriteUrl}" alt="${spec.name}">
      <span class="dex-name">${isUnlocked ? spec.name : "???"}</span>
    `;
    
    if (profile.activeTeam.includes(speciesId)) {
      card.classList.add("active-team-indicator");
    }
    
    card.addEventListener("click", () => {
      selectedPokedexSpeciesId = speciesId;
      renderPokedexDetails(speciesId);
    });
    
    dom.pokedexGrid.appendChild(card);
  });
  
  if (selectedPokedexSpeciesId) {
    renderPokedexDetails(selectedPokedexSpeciesId);
  } else {
    dom.pokedexDetailsPane.innerHTML = `<p class="select-hint">Select a Pokémon to view details and customize team loadout.</p>`;
  }
}

function renderPokedexDetails(speciesId) {
  const isUnlocked = profile.unlockedPokemon.includes(speciesId);
  const spec = pokemonSpecies[speciesId];
  
  if (!isUnlocked) {
    let unlockReq = "";
    if (speciesId === "machop") unlockReq = "Reach 5 Total Stars to unlock Machop!";
    if (speciesId === "gastly") unlockReq = "Reach 12 Total Stars to unlock Gastly!";
    
    dom.pokedexDetailsPane.innerHTML = `
      <div style="text-align: center; color: #9ca3af; padding: 2rem;">
        <span style="font-size: 3rem;">🔒</span>
        <h3 style="font-family: Montserrat, sans-serif; font-size: 1.5rem; margin-top: 1rem; color: #f3f4f6;">Locked Pokémon</h3>
        <p style="margin-top: 1rem; line-height: 1.4;">${unlockReq}</p>
      </div>
    `;
    return;
  }
  
  const badgeClass = spec.favoredTerrain.toLowerCase();
  
  let evoHtml = "";
  if (spec.evolutions && spec.evolutions.length > 0) {
    evoHtml = `
      <div class="details-evolutions">
        <h4>Evolution Tree</h4>
        <div class="evo-chain">
          <div class="evo-stage">
            <img src="${spec.sprite}">
            <span>${spec.name}</span>
          </div>
          ${spec.evolutions.map(evoId => {
            const evoSpec = pokemonSpecies[evoId];
            return `
              <span class="evo-arrow">→</span>
              <div class="evo-stage">
                <img src="${evoSpec.sprite}">
                <span>${evoSpec.name}</span>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
  }
  
  let teamSlotsHtml = `
    <div style="margin-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 1rem;">
      <h4 style="font-size: 0.9rem; margin-bottom: 0.5rem; color: #9ca3af;">Click slot to set in Active Team:</h4>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem;">
  `;
  
  for (let i = 0; i < 6; i++) {
    const activeId = profile.activeTeam[i];
    const activeSpec = activeId ? pokemonSpecies[activeId] : null;
    const isCurrent = activeId === speciesId;
    teamSlotsHtml += `
      <button class="secondary-btn replace-slot-btn ${isCurrent ? "active-slot" : ""}" 
              style="padding: 0.4rem; font-size: 0.75rem; border-radius: 0.5rem; text-align: center; text-transform: none; ${isCurrent ? "border-color: var(--accent); background: rgba(96,165,250,0.15);" : ""}"
              ${isCurrent ? "disabled" : ""}
              data-slot="${i}">
        Slot ${i + 1}: ${activeSpec ? activeSpec.name : "Empty"}
      </button>
    `;
  }
  teamSlotsHtml += `</div></div>`;
  
  dom.pokedexDetailsPane.innerHTML = `
    <div class="details-wrapper">
      <div class="details-header">
        <img src="${spec.sprite}" alt="${spec.name}">
        <div class="details-title">
          <h3>${spec.name}</h3>
          <div class="badge-row">
            <span class="badge ${badgeClass}">${spec.favoredTerrain} favored</span>
            <span class="badge normal">${spec.role}</span>
          </div>
        </div>
      </div>
      
      <p class="details-desc"><strong>Ability:</strong> ${spec.description}</p>
      
      <div class="details-stats">
        <div class="detail-stat"><span>Deploy Cost</span><span>${spec.cost}g</span></div>
        <div class="detail-stat"><span>Base Damage</span><span>${spec.damage}</span></div>
        <div class="detail-stat"><span>Attack Speed</span><span>${(1 / spec.cooldown).toFixed(1)}/s</span></div>
        <div class="detail-stat"><span>Attack Range</span><span>${spec.range} tiles</span></div>
      </div>
      
      ${evoHtml}
      ${teamSlotsHtml}
    </div>
  `;
  
  dom.pokedexDetailsPane.querySelectorAll(".replace-slot-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const slotIdx = parseInt(e.target.getAttribute("data-slot"));
      
      const dupIdx = profile.activeTeam.indexOf(speciesId);
      if (dupIdx !== -1) {
        profile.activeTeam[dupIdx] = null;
      }
      
      profile.activeTeam[slotIdx] = speciesId;
      saveProfile();
      renderPokedex();
    });
  });
}

// MATCH STATE CONTROLS
function startMatch(routeData) {
  state.route = routeData;
  state.hearts = 20;
  state.gold = 300;
  state.wave = 1;
  state.runningWave = false;
  state.recruitCount = 0;
  state.selectedSpecies = profile.activeTeam[0] || "bulbasaur";
  state.selectedTowerIndex = null;
  state.firstPlacementFree = true;
  state.gameOver = false;
  
  state.placed = [];
  state.enemies = [];
  state.spawnQueue = [];
  state.projectiles = [];
  state.particles = [];
  state.floatingTexts = [];
  
  state.pathSet = new Set(routeData.path.map(([x, y]) => `${x},${y}`));
  state.pathPixels = routeData.path.map(([x, y]) => ({ x: x * TILE + TILE / 2, y: y * TILE + TILE / 2 }));
  
  // Reset hover tile
  state.hoverTile = { x: -1, y: -1 };
  
  // Set progress bar width to zero
  dom.waveProgressBar.style.width = "0%";
  
  updateGameHUD();
  updateGameButtons();
  
  showScreen("gameScreen");
  playSound("victory");
  
  const diffLabel = state.difficultyMode.toUpperCase();
  updateStatus(`[${diffLabel} MODE] Place your starter, then click Start Wave.`);
}

function updateGameHUD() {
  dom.hudRouteName.textContent = `${state.route.name} (${state.difficultyMode})`;
  dom.hearts.textContent = String(state.hearts);
  dom.gold.textContent = String(state.gold);
  dom.wave.textContent = String(state.wave);
  dom.hudMaxWaves.textContent = `/${state.route.wavesCount}`;
  dom.stars.textContent = String(profile.starsEarned[state.route.id] || 0);
  
  dom.startWaveBtn.disabled = state.runningWave || state.gameOver;
  
  const recruitCost = 120 + state.recruitCount * 20;
  dom.recruitBtn.textContent = `Recruit Egg (${recruitCost}g)`;
  
  updateSelectedTowerHUD();
}

function updateGameButtons() {
  dom.teamButtons.innerHTML = "";
  profile.activeTeam.forEach((speciesId) => {
    if (!speciesId) return;
    const s = pokemonSpecies[speciesId];
    const btn = document.createElement("button");
    btn.className = `deploy-btn ${speciesId === state.selectedSpecies ? "active" : ""}`;
    
    btn.innerHTML = `
      <img src="${s.sprite}" alt="${s.name}">
      <span class="name">${s.name}</span>
      <span class="cost">${state.firstPlacementFree ? "FREE" : `${s.cost}g`}</span>
    `;
    
    btn.addEventListener("click", () => {
      state.selectedSpecies = speciesId;
      state.selectedTowerIndex = null;
      updateStatus(`Selected ${s.name} for deployment.`);
      updateGameButtons();
      updateGameHUD();
    });
    dom.teamButtons.appendChild(btn);
  });
}

function updateSelectedTowerHUD() {
  if (state.selectedTowerIndex === null) {
    dom.selectedTower.innerHTML = `<div class="tower-details-placeholder">None selected</div>`;
    dom.upgradeBtn.disabled = true;
    dom.sellBtn.disabled = true;
    return;
  }
  
  const tower = state.placed[state.selectedTowerIndex];
  if (!tower) {
    state.selectedTowerIndex = null;
    updateSelectedTowerHUD();
    return;
  }
  
  const spec = pokemonSpecies[tower.speciesId];
  const nextCost = towerUpgradeCost(tower.level);
  
  dom.selectedTower.innerHTML = `
    <div class="tower-info-wrapper">
      <div class="tower-info-header">
        <img src="${spec.sprite}">
        <div class="tower-info-text">
          <h4>${spec.name} Lv.${tower.level}</h4>
          <p>${spec.role.toUpperCase()} • ${tower.targetMode.toUpperCase()}</p>
        </div>
      </div>
      <p class="tower-desc">${spec.description}</p>
      ${tower.isFavored ? `<div style="font-size:0.75rem; color: var(--grass-color); font-weight:bold; margin-top:0.4rem;">🌟 Favored Terrain: +25% Damage!</div>` : ""}
    </div>
  `;
  
  dom.upgradeBtn.disabled = state.gold < nextCost || state.gameOver;
  dom.upgradeBtn.textContent = `Upgrade (${nextCost}g)`;
  dom.sellBtn.disabled = state.gameOver;
  
  const baseCost = pokemonSpecies[tower.speciesId].cost;
  const invested = Array.from({ length: tower.level - 1 }, (_, i) => towerUpgradeCost(i + 1)).reduce((a, b) => a + b, 0);
  const refund = Math.round((baseCost + invested) * 0.65);
  dom.sellBtn.textContent = `Sell (+${refund}g)`;
}

function updateStatus(msg, isErr = false) {
  dom.status.textContent = msg;
  dom.status.style.color = isErr ? "#fca5a5" : "#93c5fd";
}

// IN-GAME UTILITIES
function tileTerrain(y) {
  if (state.route.terrainBands.waterRows.includes(y)) return "WATER";
  if (state.route.terrainBands.mountainRows.includes(y)) return "MOUNTAIN";
  if (state.route.terrainBands.grassRows.includes(y)) return "GRASS";
  return "FIELD";
}

function canPlace(speciesId, x, y) {
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return false;
  if (state.pathSet.has(`${x},${y}`)) return false;
  if (state.placed.some((t) => t.x === x && t.y === y)) return false;
  return pokemonSpecies[speciesId].allowedTerrain.includes(tileTerrain(y));
}

function placeTower(x, y) {
  const speciesId = state.selectedSpecies;
  if (!speciesId) return;
  const spec = pokemonSpecies[speciesId];
  
  if (!canPlace(speciesId, x, y)) {
    updateStatus("Cannot deploy on this terrain type!", true);
    return;
  }
  
  const cost = state.firstPlacementFree ? 0 : spec.cost;
  if (state.gold < cost) {
    updateStatus("Not enough gold!", true);
    return;
  }
  
  state.gold -= cost;
  
  const terrainType = tileTerrain(y);
  const isFavored = spec.favoredTerrain === terrainType;
  
  state.placed.push({
    speciesId,
    x,
    y,
    level: 1,
    cooldown: 0,
    targetMode: dom.targetMode.value,
    isFavored
  });
  
  state.firstPlacementFree = false;
  state.selectedTowerIndex = state.placed.length - 1;
  
  updateStatus(`Deployed ${spec.name} on ${terrainType}.`);
  playSound("hit");
  
  updateGameButtons();
  updateGameHUD();
}

function selectTower(x, y) {
  const found = state.placed.findIndex((t) => t.x === x && t.y === y);
  if (found === -1) {
    state.selectedTowerIndex = null;
    updateGameHUD();
    return false;
  }
  state.selectedTowerIndex = found;
  const tower = state.placed[found];
  updateStatus(`Inspecting ${pokemonSpecies[tower.speciesId].name}.`);
  updateGameHUD();
  return true;
}

function upgradeSelectedTower() {
  if (state.selectedTowerIndex === null) return;
  const tower = state.placed[state.selectedTowerIndex];
  if (!tower) return;
  
  const cost = towerUpgradeCost(tower.level);
  if (state.gold < cost) {
    updateStatus("Not enough gold!", true);
    return;
  }
  
  state.gold -= cost;
  tower.level += 1;
  
  let evolved = false;
  const originalSpec = pokemonSpecies[tower.speciesId];
  if (originalSpec.evolutions && originalSpec.evolutions.length > 0) {
    if (tower.level === 5) {
      tower.speciesId = originalSpec.evolutions[0];
      evolved = true;
    } else if (tower.level === 10 && originalSpec.evolutions.length > 1) {
      tower.speciesId = originalSpec.evolutions[1];
      evolved = true;
    }
  }
  
  if (evolved) {
    const newSpec = pokemonSpecies[tower.speciesId];
    updateStatus(`${originalSpec.name} evolved into ${newSpec.name}!`, false);
    spawnEvolveParticles(tower.x * TILE + TILE/2, tower.y * TILE + TILE/2);
    playSound("evolve");
    spawnFloatingText(tower.x * TILE + TILE/2, tower.y * TILE, "EVOLVED!", "#4ade80", 18);
  } else {
    updateStatus(`${pokemonSpecies[tower.speciesId].name} upgraded to Lv.${tower.level}.`);
    playSound("hit");
  }
  
  updateGameHUD();
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
  
  updateStatus(`Sold tower for +${refund}g.`);
  playSound("leak");
  
  updateGameHUD();
}

// IN-RUN RECRUIT SHOP
function recruitRandom() {
  const cost = 120 + state.recruitCount * 20;
  if (state.gold < cost) {
    updateStatus("Not enough gold to recruit!", true);
    return;
  }
  
  state.gold -= cost;
  state.recruitCount += 1;
  
  if (state.placed.length > 0) {
    const randTower = state.placed[Math.floor(Math.random() * state.placed.length)];
    randTower.level += 1;
    updateStatus(`Recruited! ${pokemonSpecies[randTower.speciesId].name} upgraded for free!`);
    spawnEvolveParticles(randTower.x * TILE + TILE/2, randTower.y * TILE + TILE/2);
    playSound("evolve");
  } else {
    state.gold += 150;
    updateStatus("Shop empty. Refunded 150g!");
  }
  
  updateGameHUD();
}

// START WAVE (difficulty & randomizer integration)
function startWave() {
  if (state.runningWave || state.gameOver) return;
  state.runningWave = true;
  state.elapsedWave = 0;
  
  // Chaos randomizer wave build vs normal build
  if (state.difficultyMode === "chaos") {
    state.spawnQueue = [];
    const size = 6 + state.wave * 3;
    
    // Choose pool of enemies based on unlocked collection
    const activeEnemyTypes = ["rattata", "zubat"];
    if (profile.unlockedPokemon.includes("machop")) activeEnemyTypes.push("machop");
    if (profile.unlockedPokemon.includes("geodude")) activeEnemyTypes.push("geodude");
    if (profile.unlockedPokemon.includes("gastly")) activeEnemyTypes.push("gastly");
    
    // Boss insertions
    if (state.wave >= 5) activeEnemyTypes.push("onix");
    if (state.wave >= 10) activeEnemyTypes.push("gyarados");
    if (state.wave >= 15) activeEnemyTypes.push("mewtwo");
    
    for (let i = 0; i < size; i++) {
      const type = activeEnemyTypes[Math.floor(Math.random() * activeEnemyTypes.length)];
      // Slightly randomized spawn delays to build pressure
      const delay = i * (0.5 + Math.random() * 0.5);
      state.spawnQueue.push({ type, delay });
    }
  } else {
    state.spawnQueue = buildWave(state.route.id, state.wave - 1);
  }
  
  state.waveSpawnsTotal = state.spawnQueue.length;
  state.waveSpawnsCount = 0;
  dom.waveProgressBar.style.width = "0%";
  
  updateStatus(`Wave ${state.wave} started!`);
  updateGameHUD();
}

// ENEMY DISTANCE & TARGETING
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

// SIMULATION UPDATES (dt scales by gameSpeed)
function updateTowers(dt) {
  for (const tower of state.placed) {
    const spec = pokemonSpecies[tower.speciesId];
    tower.cooldown -= dt;
    if (tower.cooldown > 0) continue;
    
    const towerPoint = { x: tower.x * TILE + TILE / 2, y: tower.y * TILE + TILE / 2 };
    const rangeMult = tower.isFavored ? 1.25 : 1.0;
    const rangePx = spec.range * TILE * (1 + (tower.level - 1) * 0.08) * rangeMult;
    
    const inRange = state.enemies.filter((enemy) => enemy.alive && distance(towerPoint, enemy) <= rangePx);
    if (!inRange.length) continue;
    
    const target = chooseTarget(towerPoint, inRange, tower.targetMode);
    if (!target) continue;
    
    spawnProjectile(towerPoint.x, towerPoint.y, target, spec, tower.level, tower.isFavored);
    playSound("shoot");
    
    tower.cooldown = Math.max(0.12, spec.cooldown * Math.pow(0.97, tower.level - 1));
  }
}

function updateEnemies(dt) {
  for (const enemy of state.enemies) {
    if (!enemy.alive) continue;
    
    const enemySpec = enemies[enemy.type];
    if (enemySpec.regen) {
      enemy.hp = Math.min(enemy.maxHp, enemy.hp + enemySpec.regen * dt);
    }
    
    let speedMult = 1.0;
    let isStunned = false;
    let isBurned = false;
    let isPoisoned = false;
    let isCursed = false;
    
    if (enemy.statusEffects) {
      if (enemy.statusEffects.burn && enemy.statusEffects.burn.duration > 0) {
        isBurned = true;
        enemy.statusEffects.burn.duration -= dt;
        enemy.hp -= enemy.statusEffects.burn.dps * dt;
        if (Math.random() < 0.08) {
          spawnBurnSmokeParticle(enemy.x, enemy.y);
        }
      }
      if (enemy.statusEffects.poison && enemy.statusEffects.poison.duration > 0) {
        isPoisoned = true;
        enemy.statusEffects.poison.duration -= dt;
        enemy.hp -= enemy.statusEffects.poison.dps * dt;
        speedMult *= 0.85;
      }
      if (enemy.statusEffects.slow && enemy.statusEffects.slow.duration > 0) {
        enemy.statusEffects.slow.duration -= dt;
        speedMult *= (1 - enemy.statusEffects.slow.amount);
      }
      if (enemy.statusEffects.stun && enemy.statusEffects.stun.duration > 0) {
        isStunned = true;
        enemy.statusEffects.stun.duration -= dt;
        speedMult = 0;
      }
      if (enemy.statusEffects.armorBreak && enemy.statusEffects.armorBreak.duration > 0) {
        enemy.statusEffects.armorBreak.duration -= dt;
      }
      if (enemy.statusEffects.curse && enemy.statusEffects.curse.duration > 0) {
        isCursed = true;
        enemy.statusEffects.curse.duration -= dt;
        enemy.hp -= enemy.statusEffects.curse.dps * dt;
      }
    }
    
    if (enemy.hp <= 0) {
      enemy.alive = false;
      state.gold += enemy.reward;
      spawnFloatingText(enemy.x, enemy.y - 10, `+${enemy.reward}g`, "#fcd34d", 15);
      updateGameHUD();
      continue;
    }
    
    const nextIndex = enemy.pathIndex + 1;
    if (nextIndex >= state.pathPixels.length) {
      enemy.alive = false;
      state.hearts -= enemy.heartDamage;
      playSound("leak");
      spawnFloatingText(enemy.x, enemy.y - 12, `-${enemy.heartDamage} ❤️`, "#ef4444", 17);
      
      if (state.hearts <= 0) {
        state.hearts = 0;
        endGame(false);
      }
      updateGameHUD();
      continue;
    }
    
    const next = state.pathPixels[nextIndex];
    const vx = next.x - enemy.x;
    const vy = next.y - enemy.y;
    const length = Math.sqrt(vx * vx + vy * vy) || 1;
    const step = enemy.speed * speedMult * TILE * dt;
    
    if (step >= length) {
      enemy.x = next.x;
      enemy.y = next.y;
      enemy.pathIndex = nextIndex;
    } else {
      enemy.x += (vx / length) * step;
      enemy.y += (vy / length) * step;
    }
    
    enemy.isBurned = isBurned;
    enemy.isPoisoned = isPoisoned;
    enemy.isStunned = isStunned;
    enemy.isCursed = isCursed;
    enemy.isSlowed = speedMult < 1.0 && !isStunned;
  }
  
  state.enemies = state.enemies.filter((enemy) => enemy.alive);
}

// SPONS EFFECT TRIGGER ON HIT
function applyDamageAndStatus(projectile) {
  const target = projectile.targetEnemy;
  if (!target || !target.alive) return;
  
  const spec = enemies[target.type];
  let baseDamage = projectile.damage;
  
  if (projectile.isFavored) {
    baseDamage *= 1.25;
  }
  
  let isCrit = false;
  if (projectile.pokemonType === "gust") {
    const critChance = projectile.level >= 10 ? 0.25 : (projectile.level >= 5 ? 0.15 : 0.0);
    if (Math.random() < critChance) {
      isCrit = true;
      baseDamage *= (projectile.level >= 10 ? 2.0 : 1.5);
    }
  }
  
  if (projectile.pokemonType === "fist" && (spec.boss || spec.hp > 150)) {
    baseDamage *= 2.0;
  }
  
  const isPhysical = ["gust", "fist", "rock"].includes(projectile.pokemonType);
  if (spec.spectral && isPhysical) {
    baseDamage *= 0.5;
  }
  
  let activeArmor = spec.armor ?? 0;
  if (target.statusEffects && (target.statusEffects.armorBreak || target.statusEffects.curse)) {
    activeArmor = 0;
  }
  
  if (projectile.pokemonType === "rock" && projectile.level >= 10) {
    activeArmor *= 0.5;
  }
  
  const finalDamage = Math.max(1, Math.round(baseDamage - activeArmor));
  target.hp -= finalDamage;
  
  if (projectile.splashRadius > 0) {
    const splashPx = projectile.splashRadius * TILE;
    state.enemies.forEach((other) => {
      if (other !== target && other.alive && distance(target, other) <= splashPx) {
        let splashDamage = finalDamage * 0.5;
        const otherSpec = enemies[other.type];
        let otherArmor = otherSpec.armor ?? 0;
        if (projectile.level >= 10) {
          otherArmor = 0;
        }
        const splashFinal = Math.max(1, Math.round(splashDamage - otherArmor));
        other.hp -= splashFinal;
        
        applyStatusEffects(other, projectile);
        
        if (other.hp <= 0 && other.alive) {
          other.alive = false;
          state.gold += other.reward;
          spawnFloatingText(other.x, other.y, `+${other.reward}g`, "#fcd34d", 14);
        }
      }
    });
  }
  
  applyStatusEffects(target, projectile);
  spawnHitParticles(projectile.x, projectile.y, projectile.color);
  playSound("hit");
  
  const textColor = isCrit ? "#f87171" : "#ffffff";
  const size = isCrit ? 19 : 14;
  const txt = isCrit ? `CRIT! -${finalDamage}` : `-${finalDamage}`;
  spawnFloatingText(target.x, target.y - 15, txt, textColor, size);
  
  if (projectile.pokemonType === "spark" && projectile.level >= 5) {
    let hits = 0;
    const rangePx = 2.0 * TILE;
    state.enemies.forEach((other) => {
      if (other !== target && other.alive && hits < 2 && distance(target, other) <= rangePx) {
        other.hp -= Math.max(1, Math.round(finalDamage * 0.7));
        applyStatusEffects(other, projectile);
        spawnLightningArc(target.x, target.y, other.x, other.y);
        
        hits++;
        if (other.hp <= 0 && other.alive) {
          other.alive = false;
          state.gold += other.reward;
          spawnFloatingText(other.x, other.y, `+${other.reward}g`, "#fcd34d", 14);
        }
      }
    });
  }
  
  if (target.hp <= 0 && target.alive) {
    target.alive = false;
    state.gold += target.reward;
    spawnFloatingText(target.x, target.y - 10, `+${target.reward}g`, "#fcd34d", 15);
  }
  
  updateGameHUD();
}

function applyStatusEffects(target, proj) {
  if (!target.statusEffects) target.statusEffects = {};
  const t = proj.pokemonType;
  const isBoss = enemies[target.type].boss;
  
  if (t === "leaf") {
    const amt = proj.level >= 5 ? 0.45 : 0.40;
    const dur = proj.level >= 5 ? 2.0 : 1.5;
    target.statusEffects.slow = { amount: amt, duration: isBoss ? dur * 0.5 : dur };
    if (Math.random() < 0.2) spawnFloatingText(target.x, target.y - 25, "SLOW", "#93c5fd", 11);
  } 
  else if (t === "razor_leaf") {
    target.statusEffects.slow = { amount: 0.5, duration: isBoss ? 1.0 : 2.5 };
    target.statusEffects.poison = { dps: 4.0, duration: 3.0 };
    if (Math.random() < 0.25) spawnFloatingText(target.x, target.y - 25, "POISON", "#c084fc", 11);
  }
  else if (t === "ember" || t === "fireball") {
    const dps = proj.level >= 5 ? 5.0 : 2.5;
    const dur = proj.level >= 5 ? 3.5 : 3.0;
    target.statusEffects.burn = { dps: t === "fireball" ? 8.0 : dps, duration: dur };
    if (Math.random() < 0.25) spawnFloatingText(target.x, target.y - 25, "BURNED", "#f87171", 11);
  }
  else if (t === "bubble" || t === "hydro_pump") {
    if (proj.level >= 10) {
      target.statusEffects.armorBreak = { duration: 4.0 };
      if (Math.random() < 0.2) spawnFloatingText(target.x, target.y - 25, "ARMOR BREAK", "#60a5fa", 11);
    }
  }
  else if (t === "spark") {
    const stunChance = proj.level >= 5 ? 0.15 : 0.08;
    if (Math.random() < stunChance && !isBoss) {
      target.statusEffects.stun = { duration: 0.5 };
      spawnFloatingText(target.x, target.y - 25, "PARALYZED", "#fef08a", 11);
    } else {
      target.statusEffects.slow = { amount: 0.2, duration: 1.0 };
    }
  }
  else if (t === "rock") {
    if (!isBoss) {
      const dur = proj.level >= 10 ? 0.9 : (proj.level >= 5 ? 0.7 : 0.5);
      target.statusEffects.stun = { duration: dur };
      if (Math.random() < 0.3) spawnFloatingText(target.x, target.y - 25, "STUNNED", "#a8a29e", 11);
    }
  }
  else if (t === "poison") {
    const dps = proj.level >= 10 ? 15.0 : (proj.level >= 5 ? 8.0 : 4.0);
    target.statusEffects.poison = { dps, duration: 4.0 };
    if (proj.level >= 10) {
      target.statusEffects.slow = { amount: 0.3, duration: 4.0 };
    }
    if (Math.random() < 0.25) spawnFloatingText(target.x, target.y - 25, "POISONED", "#c084fc", 11);
  }
  else if (t === "ghost") {
    if (proj.level >= 10) {
      target.statusEffects.curse = { dps: 12.0, duration: 4.0 };
      if (Math.random() < 0.25) spawnFloatingText(target.x, target.y - 25, "CURSED", "#a855f7", 11);
    } else {
      target.statusEffects.slow = { amount: 0.2, duration: 1.5 };
    }
  }
}

function updateWaveState(dt) {
  if (!state.runningWave) return;
  
  state.elapsedWave += dt;
  while (state.spawnQueue.length && state.spawnQueue[0].delay <= state.elapsedWave) {
    const { type } = state.spawnQueue.shift();
    state.waveSpawnsCount++;
    
    // Update progress bar
    const ratio = Math.min(100, (state.waveSpawnsCount / state.waveSpawnsTotal) * 100);
    dom.waveProgressBar.style.width = `${ratio}%`;
    
    // Retrieve coefficients based on difficulty selector
    const mods = DIFFICULTY_MODIFIERS[state.difficultyMode] || { hpMult: 1.0, speedMult: 1.0, rewardMult: 1.0 };
    const base = enemies[type];
    
    // Apply difficulty modifiers!
    const hpScaling = Math.round((base.hp + Math.floor((state.wave - 1) * 8)) * mods.hpMult);
    state.enemies.push({
      type,
      hp: hpScaling,
      maxHp: hpScaling,
      speed: base.speed * mods.speedMult,
      reward: Math.round(base.reward * mods.rewardMult),
      heartDamage: base.heartDamage,
      pathIndex: 0,
      x: state.pathPixels[0].x,
      y: state.pathPixels[0].y,
      alive: true
    });
  }
  
  if (!state.spawnQueue.length && !state.enemies.length) {
    state.runningWave = false;
    
    const bonus = 35 + state.wave * 5;
    state.gold += bonus;
    spawnFloatingText(board.width / 2, board.height / 2, `WAVE CLEAR! +${bonus}g`, "#34d399", 22);
    playSound("victory");
    
    state.wave += 1;
    
    if (state.wave > state.route.wavesCount) {
      endGame(true);
    } else {
      updateGameHUD();
    }
  }
}

// VISUAL PROJECTILES IMPLEMENTATION
function spawnProjectile(x, y, target, spec, level, isFavored) {
  let splash = 0;
  if (spec.projectileType === "bubble") splash = 0.8;
  if (spec.projectileType === "bubble" && level >= 5) splash = 1.1;
  if (spec.projectileType === "hydro_pump") splash = 1.4;
  if (spec.projectileType === "fireball") splash = 1.0;
  if (spec.projectileType === "fist" && level >= 10) splash = 0.8;
  
  state.projectiles.push({
    x,
    y,
    targetEnemy: target,
    speed: 380,
    color: spec.projectileColor,
    size: spec.projectileType === "rock" ? 7 : 5,
    pokemonType: spec.projectileType,
    damage: spec.damage * (1 + (level - 1) * 0.22),
    level,
    splashRadius: splash,
    isFavored
  });
}

function updateProjectiles(dt) {
  for (const proj of state.projectiles) {
    const target = proj.targetEnemy;
    
    let tx = proj.x;
    let ty = proj.y;
    
    if (target && target.alive) {
      tx = target.x;
      ty = target.y;
    } else {
      tx = target ? target.x : proj.x;
      ty = target ? target.y : proj.y;
    }
    
    const dx = tx - proj.x;
    const dy = ty - proj.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < 8) {
      applyDamageAndStatus(proj);
      proj.remove = true;
    } else {
      const step = proj.speed * dt;
      proj.x += (dx / dist) * step;
      proj.y += (dy / dist) * step;
    }
  }
  
  state.projectiles = state.projectiles.filter(p => !p.remove);
}

// PARTICLES IMPLEMENTATION
function spawnHitParticles(x, y, color) {
  for (let i = 0; i < 8; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 40 + Math.random() * 80;
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color,
      size: 2 + Math.random() * 2,
      life: 0,
      maxLife: 0.35 + Math.random() * 0.15
    });
  }
}

function spawnEvolveParticles(x, y) {
  for (let i = 0; i < 30; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 60 + Math.random() * 120;
    const colors = ["#4ade80", "#38bdf8", "#fb7185", "#fef08a", "#fff"];
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 3 + Math.random() * 4,
      life: 0,
      maxLife: 0.6 + Math.random() * 0.4
    });
  }
}

function spawnBurnSmokeParticle(x, y) {
  state.particles.push({
    x: x - 6 + Math.random() * 12,
    y: y - 10,
    vx: -10 + Math.random() * 20,
    vy: -20 - Math.random() * 30,
    color: "#f97316",
    size: 2 + Math.random() * 3,
    life: 0,
    maxLife: 0.4 + Math.random() * 0.3
  });
}

function spawnLightningArc(x1, y1, x2, y2) {
  state.particles.push({
    isLightning: true,
    x1, y1, x2, y2,
    color: "#fef08a",
    life: 0,
    maxLife: 0.12
  });
}

function updateParticles(dt) {
  for (const p of state.particles) {
    p.life += dt;
    if (p.isLightning) continue;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.96;
    p.vy *= 0.96;
  }
  state.particles = state.particles.filter(p => p.life < p.maxLife);
}

// FLOATING TEXTS IMPLEMENTATION
function spawnFloatingText(x, y, text, color, size = 14) {
  state.floatingTexts.push({
    x,
    y,
    text,
    color,
    size,
    life: 0,
    maxLife: 0.95
  });
}

function updateFloatingTexts(dt) {
  for (const ft of state.floatingTexts) {
    ft.life += dt;
    ft.y -= 18 * dt;
  }
  state.floatingTexts = state.floatingTexts.filter(ft => ft.life < ft.maxLife);
}

// END GAME RESULTS
function endGame(victory) {
  state.gameOver = true;
  state.runningWave = false;
  
  if (victory) {
    let starsEarned = 1;
    if (state.hearts >= 20) starsEarned = 3;
    else if (state.hearts >= 10) starsEarned = 2;
    
    const prevStars = profile.starsEarned[state.route.id] || 0;
    if (starsEarned > prevStars) {
      profile.starsEarned[state.route.id] = starsEarned;
      updateProfileUnlocks();
      saveProfile();
    }
    
    dom.modalTitle.textContent = "Victory!";
    dom.modalTitle.style.color = "#34d399";
    dom.modalMessage.textContent = `You successfully cleared all waves of ${state.route.name}!`;
    
    let starsStr = "";
    for (let i = 0; i < 3; i++) {
      starsStr += i < starsEarned ? "⭐" : "☆";
    }
    dom.modalStars.textContent = starsStr;
    playSound("victory");
    
    const totalStars = Object.values(profile.starsEarned).reduce((a, b) => a + b, 0);
    const hasMachopNow = totalStars >= 5;
    const hasGastlyNow = totalStars >= 12;
    
    const unlockedMachopJustNow = hasMachopNow && !profile.unlockedPokemon.includes("machop");
    const unlockedGastlyJustNow = hasGastlyNow && !profile.unlockedPokemon.includes("gastly");
    
    if (unlockedMachopJustNow || unlockedGastlyJustNow) {
      dom.unlockContainer.classList.remove("hidden");
      const pokeId = unlockedGastlyJustNow ? "gastly" : "machop";
      const spec = pokemonSpecies[pokeId];
      
      dom.unlockedPokemonShowcase.innerHTML = `
        <img src="${spec.sprite}">
        <span>${spec.name} unlocked!</span>
      `;
      
      updateProfileUnlocks();
      saveProfile();
    } else {
      dom.unlockContainer.classList.add("hidden");
    }
    
  } else {
    dom.modalTitle.textContent = "Defeat";
    dom.modalTitle.style.color = "#f87171";
    dom.modalMessage.textContent = `Route overrun. Hearts reached 0 on wave ${state.wave}.`;
    dom.modalStars.textContent = "☆☆☆";
    dom.unlockContainer.classList.add("hidden");
    playSound("defeat");
  }
  
  dom.gameOverModal.classList.remove("hidden");
  updateGameHUD();
}

// CANVAS DRAWING LAYOUTS
function drawBoard() {
  ctx.clearRect(0, 0, board.width, board.height);
  
  // 1. Draw Terrain Tile Grid
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      const isPath = state.pathSet.has(`${x},${y}`);
      let color = "#1e293b";
      
      if (isPath) {
        color = "#854d0e";
      } else {
        const terrain = tileTerrain(y);
        if (terrain === "WATER") color = "#0891b2";
        else if (terrain === "MOUNTAIN") color = "#4b5563";
        else if (terrain === "GRASS") color = "#047857";
        else color = "#065f46";
      }
      
      ctx.fillStyle = color;
      ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
      
      // Toggleable Grid Line rendering overlay
      if (state.showGrid) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
        ctx.lineWidth = 1.0;
        ctx.strokeRect(x * TILE, y * TILE, TILE, TILE);
      } else {
        ctx.strokeStyle = "rgba(0,0,0,0.15)";
        ctx.lineWidth = 1;
        ctx.strokeRect(x * TILE, y * TILE, TILE, TILE);
      }
      
      if (!isPath) {
        const terrain = tileTerrain(y);
        ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
        if (terrain === "GRASS") {
          ctx.fillRect(x * TILE + 8, y * TILE + 8, 4, 12);
          ctx.fillRect(x * TILE + 24, y * TILE + 16, 4, 12);
        } else if (terrain === "WATER") {
          ctx.beginPath();
          ctx.arc(x * TILE + 20, y * TILE + 20, 10, 0, Math.PI);
          ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
          ctx.stroke();
        } else if (terrain === "MOUNTAIN") {
          ctx.beginPath();
          ctx.moveTo(x * TILE + TILE / 2, y * TILE + 10);
          ctx.lineTo(x * TILE + 10, y * TILE + TILE - 10);
          ctx.lineTo(x * TILE + TILE - 10, y * TILE + TILE - 10);
          ctx.closePath();
          ctx.fill();
        }
      }
    }
  }
  
  // 2. Draw route path boundaries cleanly (dirt outline)
  ctx.strokeStyle = "#a16207";
  ctx.lineWidth = 3;
  ctx.beginPath();
  state.pathPixels.forEach((pixel, idx) => {
    if (idx === 0) ctx.moveTo(pixel.x, pixel.y);
    else ctx.lineTo(pixel.x, pixel.y);
  });
  ctx.stroke();
  
  // Draw Entry and Exit Sign boards
  if (state.pathPixels.length > 0) {
    const entry = state.pathPixels[0];
    const exit = state.pathPixels[state.pathPixels.length - 1];
    
    ctx.fillStyle = "#b45309";
    ctx.fillRect(entry.x - 20, entry.y - 20, 10, 20);
    ctx.fillStyle = "#d97706";
    ctx.fillRect(entry.x - 25, entry.y - 30, 20, 12);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 8px Outfit";
    ctx.fillText("IN", entry.x - 20, entry.y - 21);
    
    ctx.fillStyle = "#b45309";
    ctx.fillRect(exit.x + 10, exit.y - 20, 10, 20);
    ctx.fillStyle = "#d97706";
    ctx.fillRect(exit.x + 5, exit.y - 30, 20, 12);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 8px Outfit";
    ctx.fillText("OUT", exit.x + 8, exit.y - 21);
  }
  
  // 2.5 Draw Placement Hover range circle and sprite silhouette
  if (state.hoverTile.x !== -1 && state.selectedSpecies && state.selectedTowerIndex === null && !state.gameOver) {
    const hx = state.hoverTile.x;
    const hy = state.hoverTile.y;
    const spec = pokemonSpecies[state.selectedSpecies];
    
    const legal = canPlace(state.selectedSpecies, hx, hy);
    const terrainType = tileTerrain(hy);
    const isFavored = spec.favoredTerrain === terrainType;
    
    // Highlight hover cell
    ctx.fillStyle = legal ? (isFavored ? "rgba(16, 185, 129, 0.3)" : "rgba(96, 165, 250, 0.25)") : "rgba(239, 68, 68, 0.3)";
    ctx.fillRect(hx * TILE, hy * TILE, TILE, TILE);
    ctx.strokeStyle = legal ? (isFavored ? "#10b981" : "#60a5fa") : "#ef4444";
    ctx.lineWidth = 2;
    ctx.strokeRect(hx * TILE, hy * TILE, TILE, TILE);
    
    // Draw ghost preview sprite
    ctx.globalAlpha = 0.45;
    ctx.drawImage(sprite(spec.sprite), hx * TILE + 6, hy * TILE + 6, TILE - 12, TILE - 12);
    ctx.globalAlpha = 1.0;
    
    // Draw range preview circle
    const rangeMult = isFavored ? 1.25 : 1.0;
    const rangePx = spec.range * TILE * rangeMult;
    ctx.beginPath();
    ctx.arc(hx * TILE + TILE / 2, hy * TILE + TILE / 2, rangePx, 0, Math.PI * 2);
    ctx.fillStyle = legal ? "rgba(96, 165, 250, 0.08)" : "rgba(239, 68, 68, 0.08)";
    ctx.fill();
    ctx.strokeStyle = legal ? "rgba(96, 165, 250, 0.25)" : "rgba(239, 68, 68, 0.25)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  
  // 3. Draw placed Pokémon towers
  state.placed.forEach((tower, idx) => {
    const spec = pokemonSpecies[tower.speciesId];
    const px = tower.x * TILE + 6;
    const py = tower.y * TILE + 6;
    const size = TILE - 12;
    
    if (tower.isFavored) {
      ctx.shadowColor = spec.projectileColor;
      ctx.shadowBlur = 12;
      ctx.strokeStyle = spec.projectileColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(tower.x * TILE + 4, tower.y * TILE + 4, TILE - 8, TILE - 8);
      ctx.shadowBlur = 0;
    }
    
    if (state.selectedTowerIndex === idx) {
      ctx.strokeStyle = "#60a5fa";
      ctx.lineWidth = 3;
      ctx.strokeRect(tower.x * TILE + 2, tower.y * TILE + 2, TILE - 4, TILE - 4);
      
      const rangeMult = tower.isFavored ? 1.25 : 1.0;
      const rangePx = spec.range * TILE * (1 + (tower.level - 1) * 0.08) * rangeMult;
      ctx.beginPath();
      ctx.arc(tower.x * TILE + TILE/2, tower.y * TILE + TILE/2, rangePx, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(96, 165, 250, 0.12)";
      ctx.fill();
      ctx.strokeStyle = "rgba(96, 165, 250, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    
    ctx.drawImage(sprite(spec.sprite), px, py, size, size);
    
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(tower.x * TILE + TILE - 18, tower.y * TILE + TILE - 12, 16, 10);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 8px sans-serif";
    ctx.fillText(`L${tower.level}`, tower.x * TILE + TILE - 16, tower.y * TILE + TILE - 4);
  });
  
  // 4. Draw Enemies
  state.enemies.forEach((enemy) => {
    const spec = enemies[enemy.type];
    ctx.drawImage(sprite(spec.sprite), enemy.x - 20, enemy.y - 20, 40, 40);
    
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(enemy.x - 18, enemy.y - 28, 36, 5);
    
    ctx.fillStyle = "#ef4444";
    const hpRatio = Math.max(0, enemy.hp / enemy.maxHp);
    ctx.fillRect(enemy.x - 18, enemy.y - 28, 36 * hpRatio, 5);
    
    if (enemy.isStunned) {
      ctx.fillStyle = "rgba(234, 179, 8, 0.25)";
      ctx.fillRect(enemy.x - 20, enemy.y - 20, 40, 40);
      ctx.font = "10px Outfit";
      ctx.fillText("💫", enemy.x - 8, enemy.y - 32);
    }
    if (enemy.isBurned) {
      ctx.fillStyle = "rgba(239, 68, 68, 0.2)";
      ctx.fillRect(enemy.x - 20, enemy.y - 20, 40, 40);
      ctx.font = "10px Outfit";
      ctx.fillText("🔥", enemy.x - 18, enemy.y - 32);
    }
    if (enemy.isPoisoned) {
      ctx.fillStyle = "rgba(168, 85, 247, 0.2)";
      ctx.fillRect(enemy.x - 20, enemy.y - 20, 40, 40);
      ctx.font = "10px Outfit";
      ctx.fillText("💜", enemy.x + 8, enemy.y - 32);
    }
    if (enemy.isCursed) {
      ctx.strokeStyle = "#a855f7";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(enemy.x - 22, enemy.y - 22, 44, 44);
    }
  });
  
  // 5. Draw Projectiles
  state.projectiles.forEach((proj) => {
    ctx.fillStyle = proj.color;
    ctx.beginPath();
    
    if (proj.pokemonType === "leaf" || proj.pokemonType === "razor_leaf") {
      ctx.ellipse(proj.x, proj.y, proj.size * 1.5, proj.size * 0.7, Math.PI / 4, 0, Math.PI * 2);
    } else if (proj.pokemonType === "spark") {
      ctx.rect(proj.x - 2, proj.y - 4, 4, 8);
    } else {
      ctx.arc(proj.x, proj.y, proj.size, 0, Math.PI * 2);
    }
    ctx.fill();
  });
  
  // 6. Draw Particles
  state.particles.forEach((p) => {
    if (p.isLightning) {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      const midX = (p.x1 + p.x2) / 2 + (-10 + Math.random() * 20);
      const midY = (p.y1 + p.y2) / 2 + (-10 + Math.random() * 20);
      ctx.moveTo(p.x1, p.y1);
      ctx.lineTo(midX, midY);
      ctx.lineTo(p.x2, p.y2);
      ctx.stroke();
    } else {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = 1 - (p.life / p.maxLife);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }
  });
  
  // 7. Draw Floating Texts
  state.floatingTexts.forEach((ft) => {
    ctx.fillStyle = ft.color;
    ctx.font = `bold ${ft.size}px Outfit`;
    ctx.textAlign = "center";
    ctx.globalAlpha = 1 - (ft.life / ft.maxLife);
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.globalAlpha = 1.0;
  });
}

// EVENT HANDLERS
function clickBoard(event) {
  const rect = board.getBoundingClientRect();
  const scaleX = board.width / rect.width;
  const scaleY = board.height / rect.height;
  
  const x = Math.floor(((event.clientX - rect.left) * scaleX) / TILE);
  const y = Math.floor(((event.clientY - rect.top) * scaleY) / TILE);
  
  if (selectTower(x, y)) return;
  placeTower(x, y);
}

// GAME SPEED SELECTION
dom.gameSpeed.addEventListener("change", (e) => {
  state.gameSpeed = parseFloat(e.target.value);
});

// INITIALIZATIONS & ATTACHMENTS
dom.goToPokedexBtn.addEventListener("click", () => showScreen("pokedexScreen"));
dom.pokedexBackBtn.addEventListener("click", () => showScreen("mainMenuScreen"));

dom.recruitBtn.addEventListener("click", recruitRandom);
dom.startWaveBtn.addEventListener("click", startWave);

dom.resetBtn.addEventListener("click", () => {
  if (confirm("Restart this route match? Progress will be reset.")) {
    startMatch(state.route);
  }
});

dom.gameExitBtn.addEventListener("click", () => {
  if (confirm("Quit run and return to the main menu?")) {
    showScreen("mainMenuScreen");
  }
});

dom.upgradeBtn.addEventListener("click", upgradeSelectedTower);
dom.sellBtn.addEventListener("click", sellSelectedTower);

// Modal button controls
dom.modalExitBtn.addEventListener("click", () => {
  dom.gameOverModal.classList.add("hidden");
  showScreen("mainMenuScreen");
});

dom.modalRetryBtn.addEventListener("click", () => {
  dom.gameOverModal.classList.add("hidden");
  startMatch(state.route);
});

// Sound toggle
dom.muteToggleBtn.addEventListener("click", () => {
  state.muted = !state.muted;
  dom.muteToggleBtn.textContent = state.muted ? "🔇 Muted" : "🔊 Sound";
  dom.muteToggleBtn.classList.toggle("active", !state.muted);
  updateStatus(state.muted ? "Audio muted." : "Audio enabled.");
});

// Grid toggle
dom.gridToggleBtn.addEventListener("click", () => {
  state.showGrid = !state.showGrid;
  dom.gridToggleBtn.textContent = state.showGrid ? "🌐 Grid ON" : "🌐 Grid";
  dom.gridToggleBtn.classList.toggle("active", state.showGrid);
});

// Mouse coordinates on board for placement hover range previews
board.addEventListener("mousemove", (event) => {
  if (dom.gameScreen.classList.contains("hidden") || state.gameOver) return;
  const rect = board.getBoundingClientRect();
  const scaleX = board.width / rect.width;
  const scaleY = board.height / rect.height;
  
  const x = Math.floor(((event.clientX - rect.left) * scaleX) / TILE);
  const y = Math.floor(((event.clientY - rect.top) * scaleY) / TILE);
  
  state.hoverTile = { x, y };
});

board.addEventListener("mouseleave", () => {
  state.hoverTile = { x: -1, y: -1 };
});

// KEYBOARD ACCELERATIONS
document.addEventListener("keydown", (event) => {
  if (dom.gameScreen.classList.contains("hidden")) return;
  
  if (event.code === "Space") {
    event.preventDefault();
    startWave();
  }
  if (event.key.toLowerCase() === "u") {
    upgradeSelectedTower();
  }
});

// target mode binding
dom.targetMode.addEventListener("change", (e) => {
  if (state.selectedTowerIndex !== null) {
    const tower = state.placed[state.selectedTowerIndex];
    if (tower) {
      tower.targetMode = e.target.value;
      updateStatus(`Target mode updated to: ${tower.targetMode.toUpperCase()}`);
      updateGameHUD();
    }
  }
});

board.addEventListener("click", clickBoard);

// RUNTIME LOOP (runs requestAnimationFrame)
let last = performance.now();
function gameLoop(now) {
  const dt = Math.min(0.033, (now - last) / 1000) * state.gameSpeed;
  last = now;
  
  if (!dom.gameScreen.classList.contains("hidden") && !state.gameOver) {
    updateWaveState(dt);
    updateEnemies(dt);
    updateTowers(dt);
    updateProjectiles(dt);
    updateParticles(dt);
    updateFloatingTexts(dt);
    drawBoard();
  }
  
  requestAnimationFrame(gameLoop);
}

// SETUP INIT INVOCATION
loadProfile();
showScreen("mainMenuScreen");
requestAnimationFrame(gameLoop);
