import type { SaveGame } from "../../types";
import { MAPS } from "../../data/maps";
import { isMapUnlocked, unlockedSlots, nextSlotHint } from "../../meta/progression";
import { ACHIEVEMENTS } from "../../meta/achievements";

export type HomeAction =
  | { type: "play"; mapId: string }
  | { type: "shop" }
  | { type: "collection" };

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
      const unlocked = isMapUnlocked(save, map);
      const best = save.bestWaveByMap[map.id] ?? 0;
      const card = document.createElement("div");
      card.className = "map-card" + (unlocked ? "" : " locked");
      card.innerHTML = `
        <b>${map.name}</b>
        <span class="muted">${map.description}</span>
        <span class="best">Best: wave ${best}/${map.totalWaves}</span>
        ${
          unlocked
            ? `<button class="primary play-btn">Play</button>`
            : `<span class="lock-note">🔒 Reach wave ${map.unlockRequirement?.wave} on the previous route</span>`
        }
      `;
      if (unlocked) {
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
