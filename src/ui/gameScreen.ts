import type { MapConfig, OwnedPokemon, TargetingMode } from "../types";
import { getSpecies } from "../data/species";
import { spriteUrl, TILE, BOARD_WIDTH, BOARD_HEIGHT } from "../data/constants";
import { GameSession } from "../engine/game";
import { GameLoop } from "../engine/loop";
import { drawBoard } from "../engine/render/renderer";
import type { Tower } from "../engine/tower";

const TARGETING_MODES: TargetingMode[] = [
  "first",
  "last",
  "strongest",
  "weakest",
  "fastest",
  "slowest",
  "closest",
];

export interface GameScreenResult {
  won: boolean;
  wavesCleared: number;
  bossKills: number;
  runXpByUid: Record<string, number>;
}

// Renders and drives a single run. Resolves when the run ends (win or loss).
export function runGame(
  root: HTMLElement,
  map: MapConfig,
  team: OwnedPokemon[],
  runSeed: number,
): Promise<GameScreenResult> {
  return new Promise((resolve) => {
    let selectedTower: Tower | null = null;
    let deployUid: string | null = null;

    const game = new GameSession(map, team, runSeed, {
      onChange: () => renderHud(),
      onGameOver: (won, wavesCleared) => {
        loop.stop();
        showGameOver(won, wavesCleared);
      },
    });

    root.innerHTML = "";
    const layout = document.createElement("div");
    layout.className = "game-layout";
    layout.innerHTML = `
      <div class="board-wrap">
        <div class="topbar">
          <span class="stat">❤️ <b id="hud-lives"></b></span>
          <span class="stat">🪙 <b id="hud-gold"></b></span>
          <span class="stat">🌊 Wave <b id="hud-wave"></b>/${map.totalWaves}</span>
          <span class="spacer"></span>
          <label class="speed">Speed
            <select id="hud-speed">
              <option value="1">1×</option>
              <option value="2">2×</option>
              <option value="3">3×</option>
            </select>
          </label>
          <button id="hud-start" class="primary"></button>
        </div>
        <canvas id="board" width="${BOARD_WIDTH}" height="${BOARD_HEIGHT}"></canvas>
      </div>
      <aside class="sidebar">
        <h3>Team</h3>
        <div id="team-panel" class="team-panel"></div>
        <div id="tower-panel" class="tower-panel"></div>
        <p class="hint" id="hint">Select a Pokémon, then click a tile to deploy.</p>
      </aside>
    `;
    root.appendChild(layout);

    const canvas = layout.querySelector<HTMLCanvasElement>("#board")!;
    const ctx = canvas.getContext("2d")!;
    const hudLives = layout.querySelector<HTMLElement>("#hud-lives")!;
    const hudGold = layout.querySelector<HTMLElement>("#hud-gold")!;
    const hudWave = layout.querySelector<HTMLElement>("#hud-wave")!;
    const hudStart = layout.querySelector<HTMLButtonElement>("#hud-start")!;
    const hudSpeed = layout.querySelector<HTMLSelectElement>("#hud-speed")!;
    const teamPanel = layout.querySelector<HTMLElement>("#team-panel")!;
    const towerPanel = layout.querySelector<HTMLElement>("#tower-panel")!;
    const hint = layout.querySelector<HTMLElement>("#hint")!;

    const loop = new GameLoop(
      (dt) => game.update(dt),
      () => {
        drawBoard(ctx, game, selectedTower);
        renderAbilityState();
      },
    );

    const onKeyDown = (event: KeyboardEvent): void => {
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLSelectElement) return;
      if (event.key.toLowerCase() !== "a" || !selectedTower?.species.ability) return;
      activateSelectedAbility();
    };
    window.addEventListener("keydown", onKeyDown);

    hudSpeed.addEventListener("change", () => {
      loop.speed = Number(hudSpeed.value);
    });

    hudStart.addEventListener("click", () => {
      if (game.phase === "building") game.startWave();
    });

    canvas.addEventListener("click", (ev) => {
      const rect = canvas.getBoundingClientRect();
      const col = Math.floor(((ev.clientX - rect.left) * (canvas.width / rect.width)) / TILE);
      const row = Math.floor(((ev.clientY - rect.top) * (canvas.height / rect.height)) / TILE);
      const existing = game.towerAt(col, row);
      if (deployUid) {
        const res = game.placeTower(deployUid, col, row);
        if (res.ok) {
          deployUid = null;
          selectedTower = res.tower;
        } else {
          hint.textContent = res.reason;
          hint.classList.add("bad");
        }
        renderTeam();
        renderTower();
      } else if (existing) {
        selectedTower = existing;
        deployUid = null;
        renderTower();
      } else {
        selectedTower = null;
        renderTower();
      }
    });

    function renderHud(): void {
      hudLives.textContent = String(game.lives);
      hudGold.textContent = String(game.gold);
      hudWave.textContent = String(game.waveNumber);
      hudStart.disabled = game.phase !== "building";
      hudStart.textContent = game.phase === "wave" ? "Wave in progress…" : `Start Wave ${game.waveNumber + 1}`;
      renderTeam();
      renderTower();
    }

    function renderTeam(): void {
      teamPanel.innerHTML = "";
      for (const member of team) {
        const species = getSpecies(member.speciesId);
        const placed = game.isPlaced(member.uid);
        const affordable = game.gold >= species.base.cost;
        const btn = document.createElement("button");
        btn.className = "team-card";
        btn.classList.toggle("selected", deployUid === member.uid);
        btn.classList.toggle("disabled", placed || !affordable);
        btn.disabled = placed || !affordable;
        btn.innerHTML = `
          <img src="${spriteUrl(species.dex)}" alt="${species.name}" />
          <span class="nm">${species.name}</span>
          <span class="cost">${placed ? "deployed" : `🪙${species.base.cost}`}</span>
        `;
        btn.addEventListener("click", () => {
          deployUid = deployUid === member.uid ? null : member.uid;
          selectedTower = null;
          hint.classList.remove("bad");
          hint.textContent = deployUid ? "Click a valid tile to deploy." : "Select a Pokémon to deploy.";
          renderTeam();
          renderTower();
        });
        teamPanel.appendChild(btn);
      }
    }

    function renderTower(): void {
      if (!selectedTower) {
        towerPanel.innerHTML = "";
        return;
      }
      const t = selectedTower;
      towerPanel.innerHTML = `
        <div class="tower-head">
          <img src="${spriteUrl(t.species.dex)}" alt="${t.species.name}" />
          <div>
            <b>${t.species.name}</b> · Lv ${t.level}
            <div class="muted">${t.favored ? "Favored terrain (+25%)" : "Standard terrain"}</div>
          </div>
        </div>
        <div class="tower-stats">
          <span>DMG ${Math.round(t.damage())}</span>
          <span>RNG ${(t.rangePx() / TILE).toFixed(1)}</span>
          <span>CD ${t.cooldown().toFixed(2)}s</span>
        </div>
        <label class="target-row">Target
          <select id="target-mode"></select>
        </label>
        <div class="tower-buttons">
          ${
            t.species.ability
              ? `<button id="ability-btn" class="ability-btn"></button>`
              : ""
          }
          <button id="upgrade-btn" class="primary">${
            t.atMaxLevel()
              ? "Max level"
              : t.goldLevels >= 4
                ? "Level up (level via kills)"
                : `Level up (🪙${game.upgradeCost(t)})`
          }</button>
          <button id="sell-btn" class="danger">Sell (+${Math.round(t.totalInvested * 0.6)}🪙)</button>
        </div>
      `;
      const sel = towerPanel.querySelector<HTMLSelectElement>("#target-mode")!;
      for (const m of TARGETING_MODES) {
        const opt = document.createElement("option");
        opt.value = m;
        opt.textContent = m;
        if (m === t.targeting) opt.selected = true;
        sel.appendChild(opt);
      }
      sel.addEventListener("change", () => game.setTargeting(t, sel.value as TargetingMode));
      towerPanel
        .querySelector<HTMLButtonElement>("#ability-btn")
        ?.addEventListener("click", activateSelectedAbility);
      const upgradeBtn = towerPanel.querySelector<HTMLButtonElement>("#upgrade-btn")!;
      upgradeBtn.disabled = !game.canUpgrade(t);
      upgradeBtn.addEventListener("click", () => {
        if (game.upgradeTower(t)) renderTower();
      });
      towerPanel.querySelector<HTMLButtonElement>("#sell-btn")!.addEventListener("click", () => {
        game.sellTower(t);
        selectedTower = null;
        renderTower();
      });
      renderAbilityState();
    }

    function activateSelectedAbility(): void {
      if (!selectedTower?.species.ability) return;
      const result = game.activateAbility(selectedTower);
      if (!result.ok) {
        hint.textContent = result.reason;
        hint.classList.add("bad");
      } else {
        hint.textContent = `${selectedTower.species.ability.name} hit ${result.affected} target${result.affected === 1 ? "" : "s"}.`;
        hint.classList.remove("bad");
      }
      renderAbilityState();
    }

    function renderAbilityState(): void {
      const button = towerPanel.querySelector<HTMLButtonElement>("#ability-btn");
      const tower = selectedTower;
      const ability = tower?.species.ability;
      if (!button || !tower || !ability) return;
      const coolingDown = tower.abilityCooldownLeft > 0;
      button.disabled = coolingDown || game.phase === "won" || game.phase === "lost";
      button.textContent = coolingDown
        ? `${ability.name} · ${tower.abilityCooldownLeft.toFixed(1)}s`
        : `${ability.name} · Ready (A)`;
    }

    function showGameOver(won: boolean, wavesCleared: number): void {
      const overlay = document.createElement("div");
      window.removeEventListener("keydown", onKeyDown);
      overlay.className = "overlay";
      overlay.innerHTML = `
        <div class="overlay-card">
          <h2>${won ? "Route Cleared! 🏆" : "Defeated 💀"}</h2>
          <p>You cleared ${wavesCleared} wave${wavesCleared === 1 ? "" : "s"}.</p>
          <button class="primary" id="overlay-done">Continue</button>
        </div>
      `;
      layout.appendChild(overlay);
      overlay.querySelector<HTMLButtonElement>("#overlay-done")!.addEventListener("click", () => {
        resolve({ won, wavesCleared, bossKills: game.bossKills, runXpByUid: game.runXpByUid() });
      });
    }

    renderHud();
    loop.start();
  });
}
