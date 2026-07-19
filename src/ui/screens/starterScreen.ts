import type { SaveGame } from "../../types";
import { getSpecies } from "../../data/species";
import { STARTER_IDS } from "../../data/starters";
import { spriteUrl, STARTER_POKECOINS } from "../../data/constants";
import { makeOwned } from "../../meta/ivs";
import { chooseStarter } from "../../meta/save";

// First-launch screen: pick a starter. Grants the pokemon + starting PokeCoins.
export function showStarter(root: HTMLElement, save: SaveGame): Promise<void> {
  return new Promise((resolve) => {
    root.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "meta-screen starter-screen";
    wrap.innerHTML = `
      <h1>Choose your partner</h1>
      <p class="muted">You'll also receive ${STARTER_POKECOINS} PokéCoins to hatch more.</p>
      <div class="starter-grid"></div>
    `;
    const grid = wrap.querySelector<HTMLElement>(".starter-grid")!;
    for (const id of STARTER_IDS) {
      const s = getSpecies(id);
      const card = document.createElement("button");
      card.className = "starter-card";
      card.innerHTML = `
        <img src="${spriteUrl(s.dex)}" alt="${s.name}" />
        <b>${s.name}</b>
        <span class="types">${s.types.join(" / ")}</span>
        <span class="muted">${s.description}</span>
      `;
      card.addEventListener("click", () => {
        const owned = makeOwned(id);
        save.collection.push(owned);
        chooseStarter(save, owned.uid, id);
        resolve();
      });
      grid.appendChild(card);
    }
    root.appendChild(wrap);
  });
}
