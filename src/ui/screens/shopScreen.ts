import type { Rarity, SaveGame } from "../../types";
import { EGG_PRICES } from "../../meta/economy";
import { buyEgg, canBuyEgg } from "../../meta/eggs";
import { rarityColor } from "../components";

const EGG_INFO: { rarity: Rarity; name: string; odds: string }[] = [
  { rarity: "common", name: "Common Egg", odds: "Mostly common Pokémon, small shot at a rare." },
  { rarity: "rare", name: "Rare Egg", odds: "Usually rare Pokémon, slim legendary chance." },
  { rarity: "legendary", name: "Legendary Egg", odds: "Best odds at rare and legendary Pokémon." },
];

// Buy eggs with PokéCoins. Hatching happens in the Collection screen.
export function showShop(root: HTMLElement, save: SaveGame): Promise<void> {
  return new Promise((resolve) => {
    function render(): void {
      root.innerHTML = "";
      const wrap = document.createElement("div");
      wrap.className = "meta-screen shop-screen";
      wrap.innerHTML = `
        <div class="home-top">
          <h1>🥚 Egg Shop</h1>
          <div class="home-top-right">
            <span class="currency">🪙 <b>${save.pokeCoins}</b></span>
            <button id="back-btn">← Back</button>
          </div>
        </div>
        <p class="muted">You have ${save.eggs.length} egg(s) waiting. Hatch them in your Collection.</p>
        <div class="egg-grid"></div>
      `;
      const grid = wrap.querySelector<HTMLElement>(".egg-grid")!;
      for (const info of EGG_INFO) {
        const price = EGG_PRICES[info.rarity];
        const afford = canBuyEgg(save, info.rarity);
        const card = document.createElement("div");
        card.className = "egg-card";
        card.style.borderColor = rarityColor(info.rarity);
        card.innerHTML = `
          <div class="egg-emoji">🥚</div>
          <b style="color:${rarityColor(info.rarity)}">${info.name}</b>
          <span class="muted">${info.odds}</span>
          <button class="primary buy-btn" ${afford ? "" : "disabled"}>Buy · 🪙${price}</button>
        `;
        card.querySelector<HTMLButtonElement>(".buy-btn")!.addEventListener("click", () => {
          if (buyEgg(save, info.rarity)) render();
        });
        grid.appendChild(card);
      }
      wrap.querySelector<HTMLButtonElement>("#back-btn")!.addEventListener("click", () => resolve());
      root.appendChild(wrap);
    }
    render();
  });
}
