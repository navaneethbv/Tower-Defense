import type { SaveGame } from "../../types";
import { MAPS } from "../../data/maps";
import { isMapUnlocked, unlockedSlots, nextSlotHint } from "../../meta/progression";

export type HomeAction =
  | { type: "play"; mapId: string }
  | { type: "shop" }
  | { type: "collection" };

// Hub screen: shows currency, deploy slots, map select, and nav to shop/box.
export function showHome(root: HTMLElement, save: SaveGame): Promise<HomeAction> {
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
        <span class="muted">Deploy slots: <b>${slots}</b>${hint ? ` — ${hint}` : ""}</span>
      </div>
      <h2>Routes</h2>
      <div class="map-grid"></div>
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
    root.appendChild(wrap);
  });
}
