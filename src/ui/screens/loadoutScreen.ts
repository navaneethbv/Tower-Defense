import type { MapConfig, SaveGame } from "../../types";
import { getSpecies } from "../../data/species";
import { spriteUrl } from "../../data/constants";
import { unlockedSlots } from "../../meta/progression";
import { displayName, ivScore } from "../../meta/collection";

export type LoadoutResult = { start: true } | { start: false };

// Assign owned pokemon into the unlocked deploy slots, then launch the run.
export function showLoadout(root: HTMLElement, save: SaveGame, map: MapConfig): Promise<LoadoutResult> {
  return new Promise((resolve) => {
    const slots = unlockedSlots(save);
    // Working selection seeded from the saved team, capped to current slots.
    const selected: string[] = save.team.filter((u): u is string => !!u).slice(0, slots);

    function persist(): void {
      const next: (string | null)[] = [];
      for (let i = 0; i < slots; i++) next.push(selected[i] ?? null);
      save.team = next;
    }

    function render(): void {
      root.innerHTML = "";
      const wrap = document.createElement("div");
      wrap.className = "meta-screen loadout-screen";
      wrap.innerHTML = `
        <div class="home-top">
          <h1>${map.name} — Team</h1>
          <button id="back-btn">← Back</button>
        </div>
        <p class="muted">Pick up to ${slots} Pokémon (${selected.length}/${slots} chosen). Tap to add or remove.</p>
        <div class="slot-row"></div>
        <h2>Your Collection (${save.collection.length})</h2>
        <div class="collection-grid"></div>
        <div class="loadout-actions">
          <button class="primary" id="start-btn" ${selected.length === 0 ? "disabled" : ""}>Start Run</button>
        </div>
      `;
      const slotRow = wrap.querySelector<HTMLElement>(".slot-row")!;
      for (let i = 0; i < slots; i++) {
        const uid = selected[i];
        const cell = document.createElement("div");
        cell.className = "slot-cell" + (uid ? " filled" : "");
        if (uid) {
          const p = save.collection.find((c) => c.uid === uid)!;
          cell.innerHTML = `<img src="${spriteUrl(getSpecies(p.speciesId).dex)}" alt="${displayName(p)}" />`;
        } else {
          cell.textContent = "+";
        }
        slotRow.appendChild(cell);
      }

      const collectionGrid = wrap.querySelector<HTMLElement>(".collection-grid")!;
      for (const p of save.collection) {
        const s = getSpecies(p.speciesId);
        const chosen = selected.includes(p.uid);
        const card = document.createElement("button");
        card.className = "collection-card" + (chosen ? " chosen" : "");
        card.innerHTML = `
          <img src="${spriteUrl(s.dex)}" alt="${displayName(p)}" />
          <b>${displayName(p)}</b>
          <span class="muted">Lv ${p.level} · IV ${ivScore(p)}%</span>
        `;
        card.addEventListener("click", () => {
          const idx = selected.indexOf(p.uid);
          if (idx >= 0) selected.splice(idx, 1);
          else if (selected.length < slots) selected.push(p.uid);
          render();
        });
        collectionGrid.appendChild(card);
      }

      wrap.querySelector<HTMLButtonElement>("#back-btn")!.addEventListener("click", () => {
        persist();
        resolve({ start: false });
      });
      wrap.querySelector<HTMLButtonElement>("#start-btn")!.addEventListener("click", () => {
        persist();
        resolve({ start: true });
      });
      root.appendChild(wrap);
    }

    render();
  });
}
