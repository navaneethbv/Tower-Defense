import type {
  CapturedPokemon,
  MapConfig,
  MilestoneEncounter,
  OwnedPokemon,
  SaveGame,
  TargetingMode,
} from "../types";
import { getSpecies } from "../data/species";
import { spriteUrl, TILE, BOARD_WIDTH, BOARD_HEIGHT } from "../data/constants";
import { GameSession } from "../engine/game";
import { GameLoop } from "../engine/loop";
import { drawBoard } from "../engine/render/renderer";
import type { Tower } from "../engine/tower";
import { advanceAutoWaveTimer } from "../engine/autoWave";
import { cycleRedeploymentPad, redeploymentPads } from "./redeployment";
import { statusSummary } from "./statusPresentation";
import { playSound } from "./audio";
import { generateWave } from "../waves/generator";

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
  runSeed: number;
}

export interface CaptureResultView {
  speciesName: string;
  sprite: string;
  tierLabel: string;
  waveLabel: string;
  rewardLabel: string;
  ivLabel: string;
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function milestoneBannerView(encounter: MilestoneEncounter): string {
  const species = getSpecies(encounter.speciesId);
  return `Special encounter · ${titleCase(encounter.tier)} · ${species.name} · Wave ${encounter.wave}`;
}

export function captureResultView(capture: CapturedPokemon): CaptureResultView {
  const species = getSpecies(capture.pokemon.speciesId);
  const { damage, range, attackSpeed } = capture.pokemon.ivs;
  return {
    speciesName: species.name,
    sprite: spriteUrl(species.dex),
    tierLabel: titleCase(capture.tier),
    waveLabel: `Wave ${capture.wave}`,
    rewardLabel: capture.guaranteed
      ? "Guaranteed first-clear capture"
      : "Repeat-clear bonus capture",
    ivLabel: `DMG ${damage} · RNG ${range} · SPD ${attackSpeed}`,
  };
}

export function showCaptureResults(
  root: HTMLElement,
  captures: CapturedPokemon[],
): Promise<void> {
  if (captures.length === 0) return Promise.resolve();
  return new Promise((resolve) => {
    root.innerHTML = "";
    const screen = document.createElement("section");
    screen.className = "capture-screen meta-screen";
    screen.innerHTML = `
      <p class="capture-kicker">Route rewards</p>
      <h1>Milestone captured!</h1>
      <p class="muted">These Pokémon joined your collection with newly rolled IVs.</p>
      <div class="capture-grid">
        ${captures
          .map((capture) => {
            const view = captureResultView(capture);
            return `<article class="capture-card tier-${capture.tier}">
              <span class="capture-tier">${view.tierLabel}</span>
              <img src="${view.sprite}" alt="${view.speciesName}" />
              <h2>${view.speciesName}</h2>
              <span>${view.waveLabel}</span>
              <b>${view.rewardLabel}</b>
              <small>${view.ivLabel}</small>
            </article>`;
          })
          .join("")}
      </div>
      <button class="primary capture-continue">Continue to routes</button>
    `;
    screen.querySelector<HTMLButtonElement>(".capture-continue")!.addEventListener("click", () =>
      resolve(),
    );
    root.appendChild(screen);
  });
}

// Renders and drives a single run. Resolves when the run ends (win or loss).
export function runGame(
  root: HTMLElement,
  map: MapConfig,
  team: OwnedPokemon[],
  runSeed: number,
  settings: SaveGame["settings"],
  onSettingsChange: () => void,
): Promise<GameScreenResult> {
  return new Promise((resolve) => {
    let selectedTower: Tower | null = null;
    let movingTower: Tower | null = null;
    let deployUid: string | null = null;
    let hoveredTile: { col: number; row: number } | null = null;
    let autoWaveDelay = 0.75;
    let milestoneBannerTimer: number | undefined;

    const game = new GameSession(map, team, runSeed, {
      onChange: () => renderHud(),
      onGameOver: (won, wavesCleared) => {
        loop.stop();
        showGameOver(won, wavesCleared);
      },
    });
    if (import.meta.env.DEV) {
      const qaStartWave = Number(new URLSearchParams(window.location.search).get("__qaStartWave"));
      if (Number.isInteger(qaStartWave) && qaStartWave >= 0 && qaStartWave < map.totalWaves) {
        game.waveNumber = qaStartWave;
      }
    }

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
          <label class="auto-wave"><input id="hud-auto-wave" type="checkbox" /> Auto-wave</label>
          <button id="hud-start" class="primary"></button>
        </div>
        <canvas id="board" width="${BOARD_WIDTH}" height="${BOARD_HEIGHT}"></canvas>
        <div id="milestone-banner" class="milestone-banner" aria-live="polite" hidden></div>
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
    const hudAutoWave = layout.querySelector<HTMLInputElement>("#hud-auto-wave")!;
    const teamPanel = layout.querySelector<HTMLElement>("#team-panel")!;
    const towerPanel = layout.querySelector<HTMLElement>("#tower-panel")!;
    const hint = layout.querySelector<HTMLElement>("#hint")!;
    const milestoneBanner = layout.querySelector<HTMLElement>("#milestone-banner")!;

    const loop = new GameLoop(
      (dt) => {
        game.update(dt);
        const autoWave = advanceAutoWaveTimer(
          autoWaveDelay,
          dt,
          settings.autoWave,
          game.phase === "building",
          game.towers.length > 0,
        );
        autoWaveDelay = autoWave.delay;
        if (autoWave.start) startWave();
      },
      () => {
        const deploying = deployUid ? team.find((member) => member.uid === deployUid) : undefined;
        drawBoard(ctx, game, selectedTower, settings.particles, {
          allowedTerrain: movingTower
            ? movingTower.species.allowedTerrain
            : deploying
              ? getSpecies(deploying.speciesId).allowedTerrain
              : null,
          hovered: hoveredTile,
        });
        renderAbilityState();
      },
    );
    loop.speed = settings.speed;
    hudSpeed.value = String(settings.speed);
    hudAutoWave.checked = settings.autoWave;

    const onKeyDown = (event: KeyboardEvent): void => {
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLSelectElement) return;
      const key = event.key.toLowerCase();
      if (event.key === "Escape" && movingTower) {
        cancelMove("Redeployment cancelled.");
        return;
      }
      if ((key === "q" || key === "e") && movingTower) {
        const available = redeploymentPads(game, movingTower);
        if (available.length === 0) {
          hint.textContent = "No compatible habitat pad is free.";
          hint.classList.add("bad");
          return;
        }
        const next = cycleRedeploymentPad(available, hoveredTile, key === "e" ? 1 : -1)!;
        hoveredTile = { col: next.col, row: next.row };
        hint.textContent = `${next.terrain} habitat pad. Press Enter to redeploy.`;
        hint.classList.remove("bad");
        return;
      }
      if (event.key === "Enter" && movingTower && hoveredTile) {
        tryRedeploy(hoveredTile.col, hoveredTile.row);
        return;
      }
      if ((key === "q" || key === "e") && deployUid) {
        const available = map.deploymentPads.filter((pad) => game.canPlace(deployUid!, pad.col, pad.row).ok);
        if (available.length === 0) return;
        const current = hoveredTile
          ? available.findIndex((pad) => pad.col === hoveredTile?.col && pad.row === hoveredTile?.row)
          : -1;
        const direction = key === "e" ? 1 : -1;
        const next = available[(current + direction + available.length) % available.length]!;
        hoveredTile = { col: next.col, row: next.row };
        hint.textContent = `${next.terrain} habitat pad. Press Enter to deploy.`;
        hint.classList.remove("bad");
        return;
      }
      if (event.key === "Enter" && deployUid && hoveredTile) {
        tryPlace(hoveredTile.col, hoveredTile.row);
        return;
      }
      if (key === "a" && selectedTower?.species.ability) activateSelectedAbility();
    };
    window.addEventListener("keydown", onKeyDown);

    hudSpeed.addEventListener("change", () => {
      settings.speed = Number(hudSpeed.value) as SaveGame["settings"]["speed"];
      loop.speed = settings.speed;
      onSettingsChange();
    });

    hudAutoWave.addEventListener("change", () => {
      settings.autoWave = hudAutoWave.checked;
      onSettingsChange();
    });

    hudStart.addEventListener("click", () => {
      startWave();
    });

    canvas.addEventListener("click", (ev) => {
      const rect = canvas.getBoundingClientRect();
      const col = Math.floor(((ev.clientX - rect.left) * (canvas.width / rect.width)) / TILE);
      const row = Math.floor(((ev.clientY - rect.top) * (canvas.height / rect.height)) / TILE);
      const existing = game.towerAt(col, row);
      if (movingTower) {
        // Clicking the tower being moved is the mouse equivalent of Escape.
        if (existing === movingTower) cancelMove("Redeployment cancelled.");
        else tryRedeploy(col, row);
      } else if (deployUid) {
        tryPlace(col, row);
      } else if (existing) {
        selectedTower = existing;
        deployUid = null;
        renderTower();
      } else {
        selectedTower = null;
        renderTower();
      }
    });

    canvas.addEventListener("mousemove", (event) => {
      const rect = canvas.getBoundingClientRect();
      const col = Math.floor(((event.clientX - rect.left) * (canvas.width / rect.width)) / TILE);
      const row = Math.floor(((event.clientY - rect.top) * (canvas.height / rect.height)) / TILE);
      hoveredTile = { col, row };
      const pad = game.padAt(col, row);
      if (movingTower && pad) {
        const result = game.canRedeploy(movingTower, col, row);
        hint.textContent = result.ok ? `${pad.terrain} habitat pad. Click to redeploy.` : result.reason;
        hint.classList.toggle("bad", !result.ok);
      } else if (deployUid && pad) {
        const result = game.canPlace(deployUid, col, row);
        hint.textContent = result.ok ? `${pad.terrain} habitat pad. Click to deploy.` : result.reason;
        hint.classList.toggle("bad", !result.ok);
      }
    });

    canvas.addEventListener("mouseleave", () => {
      hoveredTile = null;
    });

    function tryPlace(col: number, row: number): void {
      if (!deployUid) return;
      const res = game.placeTower(deployUid, col, row);
      if (res.ok) {
        deployUid = null;
        selectedTower = res.tower;
        hint.textContent = `${res.tower.species.name} deployed.`;
        hint.classList.remove("bad");
        playSound("deploy", settings.muted);
      } else {
        hint.textContent = res.reason;
        hint.classList.add("bad");
      }
      renderTeam();
      renderTower();
    }

    function tryRedeploy(col: number, row: number): void {
      if (!movingTower) return;
      const result = game.redeployTower(movingTower, col, row);
      if (result.ok) {
        selectedTower = result.tower;
        movingTower = null;
        hoveredTile = null;
        hint.textContent = `${result.tower.species.name} redeployed. Ready in ${GameSession.REDEPLOY_COOLDOWN_SECONDS.toFixed(1)}s.`;
        hint.classList.remove("bad");
        playSound("deploy", settings.muted);
      } else {
        hint.textContent = result.reason;
        hint.classList.add("bad");
      }
      renderTower();
    }

    function cancelMove(message: string): void {
      movingTower = null;
      hoveredTile = null;
      hint.textContent = message;
      hint.classList.remove("bad");
      renderTower();
    }

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
          movingTower = null;
          hint.classList.remove("bad");
          hint.textContent = deployUid
            ? "Choose a glowing habitat pad. Use Q/E and Enter for keyboard placement."
            : "Select a Pokémon to deploy.";
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
        ${t.species.onHitStatus ? `<div class="tower-status">${statusSummary(t.species.onHitStatus)}</div>` : ""}
        <div class="tower-redeploy" id="redeploy-state">${
          t.redeployCooldownLeft > 0
            ? `Redeploy in ${t.redeployCooldownLeft.toFixed(1)}s`
            : "Redeploy ready"
        }</div>
        <label class="target-row">Target
          <select id="target-mode"></select>
        </label>
        <div class="tower-buttons">
          ${
            t.species.ability
              ? `<button id="ability-btn" class="ability-btn"></button>`
              : ""
          }
          <button id="redeploy-btn" class="redeploy-btn">${
            movingTower === t ? "Cancel move (Esc)" : "Redeploy"
          }</button>
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
      const redeployBtn = towerPanel.querySelector<HTMLButtonElement>("#redeploy-btn")!;
      const runOver = game.phase === "won" || game.phase === "lost";
      redeployBtn.disabled = (t.redeployCooldownLeft > 0 && movingTower !== t) || runOver;
      redeployBtn.classList.toggle("active", movingTower === t);
      redeployBtn.addEventListener("click", () => {
        if (movingTower === t) {
          cancelMove("Redeployment cancelled.");
          return;
        }
        movingTower = t;
        deployUid = null;
        hoveredTile = null;
        hint.textContent = "Choose a glowing habitat pad. Use Q/E and Enter, or Escape to cancel.";
        hint.classList.remove("bad");
        renderTeam();
        renderTower();
      });
      const upgradeBtn = towerPanel.querySelector<HTMLButtonElement>("#upgrade-btn")!;
      upgradeBtn.disabled = !game.canUpgrade(t);
      upgradeBtn.addEventListener("click", () => {
        if (game.upgradeTower(t)) renderTower();
      });
      towerPanel.querySelector<HTMLButtonElement>("#sell-btn")!.addEventListener("click", () => {
        game.sellTower(t);
        selectedTower = null;
        // A sold tower must not stay armed for movement.
        if (movingTower === t) movingTower = null;
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
        playSound("ability", settings.muted);
      }
      renderAbilityState();
    }

    function renderAbilityState(): void {
      const tower = selectedTower;
      if (!tower) return;
      const runOver = game.phase === "won" || game.phase === "lost";
      const redeploying = tower.redeployCooldownLeft > 0;

      // Driven from the render loop, so the cooldown ticks down visibly.
      const state = towerPanel.querySelector<HTMLElement>("#redeploy-state");
      if (state) {
        state.textContent = redeploying
          ? `Redeploy in ${tower.redeployCooldownLeft.toFixed(1)}s`
          : "Redeploy ready";
        state.classList.toggle("cooling", redeploying);
      }
      const redeployBtn = towerPanel.querySelector<HTMLButtonElement>("#redeploy-btn");
      if (redeployBtn) redeployBtn.disabled = (redeploying && movingTower !== tower) || runOver;

      const button = towerPanel.querySelector<HTMLButtonElement>("#ability-btn");
      const ability = tower.species.ability;
      if (!button || !ability) return;
      const coolingDown = tower.abilityCooldownLeft > 0;
      button.disabled = coolingDown || redeploying || runOver;
      button.textContent = redeploying
        ? `${ability.name} · Redeploying`
        : coolingDown
          ? `${ability.name} · ${tower.abilityCooldownLeft.toFixed(1)}s`
          : `${ability.name} · Ready (A)`;
    }

    function showGameOver(won: boolean, wavesCleared: number): void {
      const overlay = document.createElement("div");
      window.removeEventListener("keydown", onKeyDown);
      playSound(won ? "victory" : "defeat", settings.muted);
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
        resolve({
          won,
          wavesCleared,
          bossKills: game.bossKills,
          runXpByUid: game.runXpByUid(),
          runSeed,
        });
      });
    }

    function startWave(): void {
      if (game.phase !== "building") return;
      const plan = generateWave(map, game.waveNumber + 1, runSeed);
      if (plan.milestone) {
        milestoneBanner.textContent = milestoneBannerView(plan.milestone);
        milestoneBanner.className = `milestone-banner tier-${plan.milestone.tier}`;
        milestoneBanner.hidden = false;
        if (milestoneBannerTimer !== undefined) window.clearTimeout(milestoneBannerTimer);
        milestoneBannerTimer = window.setTimeout(() => {
          milestoneBanner.hidden = true;
        }, 4500);
      }
      game.startWave();
      playSound("wave", settings.muted);
    }

    renderHud();
    loop.start();
  });
}
