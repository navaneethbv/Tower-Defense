import type { MapConfig, SaveGame, Terrain } from "../../types";
import { getMap, MAPS } from "../../data/maps";
import { isMapUnlocked, unlockedSlots, nextSlotHint } from "../../meta/progression";
import { ACHIEVEMENTS } from "../../meta/achievements";
import { mountRouteThumbnail } from "../mapThumbnail";

export type HomeAction =
  | { type: "play"; mapId: string }
  | { type: "shop" }
  | { type: "collection" };

export interface RouteCardView {
  unlocked: boolean;
  bestLabel: string;
  lockLabel: string | null;
  habitats: Terrain[];
  milestones: { wave: 25 | 50 | 75 | 100; cleared: boolean }[];
}

const ROUTE_MILESTONES = [25, 50, 75, 100] as const;

export function routeCardView(map: MapConfig, save: SaveGame): RouteCardView {
  const best = save.bestWaveByMap[map.id] ?? 0;
  const requirement = map.unlockRequirement;
  return {
    unlocked: isMapUnlocked(save, map),
    bestLabel: `Best: ${best}/${map.totalWaves}`,
    lockLabel: requirement
      ? `Reach wave ${requirement.wave} on ${getMap(requirement.mapId).name}`
      : null,
    habitats: [...new Set(map.deploymentPads.map((pad) => pad.terrain))],
    milestones: ROUTE_MILESTONES.map((wave) => ({ wave, cleared: best >= wave })),
  };
}

// Hub screen: shows currency, deploy slots, map select, and nav to shop/box.
export function showHome(
  root: HTMLElement,
  save: SaveGame,
  onSettingsChange: () => void = () => {},
): Promise<HomeAction> {
  return new Promise((resolve) => {
    root.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "meta-screen home-screen";
    const slots = unlockedSlots(save);
    const hint = nextSlotHint(save);
    wrap.innerHTML = `
      <div class="home-top">
        <h1>Pokémon Route Defense</h1>
        <div class="currency">🪙 <b>${save.pokeCoins}</b> PokéCoins</div>
      </div>
      <div class="home-nav">
        <button id="nav-shop">🥚 Egg Shop</button>
        <button id="nav-box">📦 Collection & Team</button>
        <span class="muted">Deploy slots: <b>${slots}</b>${hint ? `: ${hint}` : ""}</span>
      </div>
      <div class="home-settings" aria-label="Game settings">
        <label><input id="setting-muted" type="checkbox" ${save.settings.muted ? "checked" : ""} /> Mute sounds</label>
        <label><input id="setting-particles" type="checkbox" ${save.settings.particles ? "checked" : ""} /> Battle effects</label>
        <label><input id="setting-auto-wave" type="checkbox" ${save.settings.autoWave ? "checked" : ""} /> Auto-wave</label>
      </div>
      <h2>Routes</h2>
      <div class="map-grid"></div>
      <div class="achievement-heading">
        <h2>Achievements</h2>
        <span class="muted">${save.achievements.length}/${ACHIEVEMENTS.length} unlocked</span>
      </div>
      <div class="achievement-grid">
        ${ACHIEVEMENTS.map((achievement) => {
          const unlocked = save.achievements.includes(achievement.id);
          return `<article class="achievement-card ${unlocked ? "unlocked" : "locked"}">
            <span class="achievement-icon">${unlocked ? "🏅" : "🔒"}</span>
            <span><b>${achievement.title}</b><small>${achievement.description}</small></span>
          </article>`;
        }).join("")}
      </div>
    `;
    const grid = wrap.querySelector<HTMLElement>(".map-grid")!;
    for (const map of MAPS) {
      const view = routeCardView(map, save);
      const card = document.createElement("article");
      card.className = "map-card" + (view.unlocked ? "" : " locked");
      card.innerHTML = `
        <div class="route-preview-slot palette-${map.theme.palette}"></div>
        <div class="route-card-head"><b>${map.name}</b><span class="best">${view.bestLabel}</span></div>
        <span class="route-description">${map.description}</span>
        <div class="habitat-chips" aria-label="Available habitats">
          ${view.habitats.map((terrain) => `<span class="habitat-chip ${terrain}">${terrain}</span>`).join("")}
        </div>
        <div class="route-milestones" aria-label="Route milestones">
          ${view.milestones
            .map(
              ({ wave, cleared }) =>
                `<span class="milestone ${cleared ? "cleared" : ""}" title="Wave ${wave}">${cleared ? "★" : "◇"}${wave}</span>`,
            )
            .join("")}
        </div>
        ${
          view.unlocked
            ? `<button class="primary play-btn">Configure team</button>`
            : `<span class="lock-note">🔒 ${view.lockLabel}</span>`
        }
      `;
      mountRouteThumbnail(card.querySelector<HTMLElement>(".route-preview-slot")!, map);
      if (view.unlocked) {
        card.querySelector<HTMLButtonElement>(".play-btn")!.addEventListener("click", () =>
          resolve({ type: "play", mapId: map.id }),
        );
      }
      grid.appendChild(card);
    }
    wrap.querySelector<HTMLButtonElement>("#nav-shop")!.addEventListener("click", () => resolve({ type: "shop" }));
    wrap.querySelector<HTMLButtonElement>("#nav-box")!.addEventListener("click", () => resolve({ type: "collection" }));
    const bindSetting = (id: string, key: "muted" | "particles" | "autoWave"): void => {
      wrap.querySelector<HTMLInputElement>(id)!.addEventListener("change", (event) => {
        save.settings[key] = (event.currentTarget as HTMLInputElement).checked;
        onSettingsChange();
      });
    };
    bindSetting("#setting-muted", "muted");
    bindSetting("#setting-particles", "particles");
    bindSetting("#setting-auto-wave", "autoWave");
    root.appendChild(wrap);
  });
}
