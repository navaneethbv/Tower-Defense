import type { OwnedPokemon, SaveGame } from "../../types";
import { getSpecies } from "../../data/species";
import { spriteUrl } from "../../data/constants";
import { hatchEgg } from "../../meta/eggs";
import { displayName, ivScore } from "../../meta/collection";
import { ivBarsHtml, rarityColor } from "../components";

// The player's box: hatch eggs (with a reveal) and browse every owned Pokémon.
export function showCollection(root: HTMLElement, save: SaveGame): Promise<void> {
  return new Promise((resolve) => {
    let reveal: OwnedPokemon | null = null;

    function render(): void {
      root.innerHTML = "";
      const wrap = document.createElement("div");
      wrap.className = "meta-screen collection-screen";
      wrap.innerHTML = `
        <div class="home-top">
          <h1>📦 Collection</h1>
          <button id="back-btn">← Back</button>
        </div>
        ${reveal ? revealHtml(reveal) : ""}
        <h2>Eggs (${save.eggs.length})</h2>
        <div class="egg-inventory"></div>
        <h2>Pokémon (${save.collection.length})</h2>
        <div class="collection-grid box"></div>
      `;

      const eggInv = wrap.querySelector<HTMLElement>(".egg-inventory")!;
      if (save.eggs.length === 0) {
        eggInv.innerHTML = `<p class="muted">No eggs. Buy some in the Egg Shop or earn them at wave milestones.</p>`;
      }
      for (const egg of save.eggs) {
        const card = document.createElement("div");
        card.className = "egg-card small";
        card.style.borderColor = rarityColor(egg.rarity);
        card.innerHTML = `
          <div class="egg-emoji">🥚</div>
          <span style="color:${rarityColor(egg.rarity)}">${egg.rarity}</span>
          <button class="primary hatch-btn">Hatch</button>
        `;
        card.querySelector<HTMLButtonElement>(".hatch-btn")!.addEventListener("click", () => {
          const hatched = hatchEgg(save, egg.uid);
          if (hatched) {
            reveal = hatched;
            render();
          }
        });
        eggInv.appendChild(card);
      }

      const grid = wrap.querySelector<HTMLElement>(".collection-grid")!;
      if (save.collection.length === 0) {
        grid.innerHTML = `<p class="muted">Your box is empty.</p>`;
      }
      for (const p of save.collection) {
        const s = getSpecies(p.speciesId);
        const card = document.createElement("div");
        card.className = "collection-card box-card";
        card.style.borderColor = rarityColor(s.rarity);
        card.innerHTML = `
          <img src="${spriteUrl(s.dex)}" alt="${displayName(p)}" />
          <b>${displayName(p)}</b>
          <span class="muted">Lv ${p.level} · ${ivScore(p)}% IV</span>
          ${ivBarsHtml(p.ivs)}
        `;
        grid.appendChild(card);
      }

      wrap.querySelector<HTMLButtonElement>("#back-btn")!.addEventListener("click", () => resolve());
      const dismiss = wrap.querySelector<HTMLButtonElement>("#reveal-dismiss");
      dismiss?.addEventListener("click", () => {
        reveal = null;
        render();
      });
      root.appendChild(wrap);
    }

    function revealHtml(p: OwnedPokemon): string {
      const s = getSpecies(p.speciesId);
      return `
        <div class="reveal">
          <div class="reveal-card" style="border-color:${rarityColor(s.rarity)}">
            <span class="muted">It hatched!</span>
            <img src="${spriteUrl(s.dex)}" alt="${s.name}" />
            <b style="color:${rarityColor(s.rarity)}">${s.name}</b>
            <span class="muted">${s.types.join(" / ")} · ${ivScore(p)}% IV</span>
            ${ivBarsHtml(p.ivs)}
            <button class="primary" id="reveal-dismiss">Nice!</button>
          </div>
        </div>`;
    }

    render();
  });
}
