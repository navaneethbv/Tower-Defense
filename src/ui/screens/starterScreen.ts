import type { SaveGame } from "../../types";
import { getSpecies } from "../../data/species";
import { STARTER_GROUPS } from "../../data/starters";
import { spriteUrl, STARTER_POKECOINS } from "../../data/constants";
import { STATUS_PRESENTATION } from "../statusPresentation";
import { makeOwned } from "../../meta/ivs";
import { chooseStarter } from "../../meta/save";

export interface StarterCardView {
  id: string;
  name: string;
  sprite: string;
  types: string;
  role: string;
  habitats: string;
  damage: string;
  status: string;
  description: string;
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

// Flattens a species into the labels a starter card shows, so the 28 choices can
// be compared on damage identity and status identity rather than sprite alone.
export function starterCardView(speciesId: string): StarterCardView {
  const species = getSpecies(speciesId);
  const dps = species.base.damage / species.base.cooldown;
  return {
    id: species.id,
    name: species.name,
    sprite: spriteUrl(species.dex),
    types: species.types.join(" / "),
    role: titleCase(species.role.replace("_", " ")),
    habitats: species.allowedTerrain.join(" / "),
    // Purely a direct-damage rating. Status identity is reported separately, so
    // this must not imply a status specialty a species may not have.
    damage: dps >= 24 ? "High direct damage" : dps >= 14 ? "Balanced direct damage" : "Low direct damage",
    status: species.onHitStatus ? STATUS_PRESENTATION[species.onHitStatus.kind].label : "No status effect",
    description: species.description,
  };
}

// First-launch screen: pick a starter. Grants the pokemon + starting PokeCoins.
export function showStarter(root: HTMLElement, save: SaveGame): Promise<void> {
  return new Promise((resolve) => {
    root.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "meta-screen starter-screen";
    wrap.innerHTML = `
      <h1>Choose your partner</h1>
      <p class="muted">You'll also receive ${STARTER_POKECOINS} PokéCoins to hatch more.</p>
      <div class="starter-tabs" role="tablist" aria-label="Starter generation"></div>
      <div class="starter-grid" role="tabpanel"></div>
    `;
    const tabs = wrap.querySelector<HTMLElement>(".starter-tabs")!;
    const grid = wrap.querySelector<HTMLElement>(".starter-grid")!;
    let activeGeneration = 1;

    function renderTabs(): void {
      tabs.innerHTML = "";
      for (const group of STARTER_GROUPS) {
        const tab = document.createElement("button");
        tab.className = "starter-tab";
        tab.type = "button";
        tab.role = "tab";
        tab.textContent = `Gen ${group.generation}`;
        tab.id = `starter-tab-${group.generation}`;
        const active = group.generation === activeGeneration;
        tab.setAttribute("aria-selected", String(active));
        tab.tabIndex = active ? 0 : -1;
        tab.classList.toggle("active", active);
        tab.addEventListener("click", () => selectGeneration(group.generation));
        tab.addEventListener("keydown", onTabKeyDown);
        tabs.appendChild(tab);
      }
    }

    function onTabKeyDown(event: KeyboardEvent): void {
      const generations: number[] = STARTER_GROUPS.map((group) => group.generation);
      const index = generations.indexOf(activeGeneration);
      let next: number | undefined;
      if (event.key === "ArrowRight") next = generations[(index + 1) % generations.length];
      else if (event.key === "ArrowLeft")
        next = generations[(index - 1 + generations.length) % generations.length];
      else if (event.key === "Home") next = generations[0];
      else if (event.key === "End") next = generations[generations.length - 1];
      if (next === undefined) return;
      event.preventDefault();
      selectGeneration(next);
      tabs.querySelector<HTMLButtonElement>(`#starter-tab-${next}`)?.focus();
    }

    function selectGeneration(generation: number): void {
      activeGeneration = generation;
      renderTabs();
      renderCards();
    }

    function renderCards(): void {
      const group = STARTER_GROUPS.find((entry) => entry.generation === activeGeneration)!;
      grid.innerHTML = "";
      grid.setAttribute("aria-labelledby", `starter-tab-${activeGeneration}`);
      for (const id of group.speciesIds) {
        const view = starterCardView(id);
        const card = document.createElement("button");
        card.className = "starter-card";
        card.type = "button";
        card.innerHTML = `
          <img src="${view.sprite}" alt="${view.name}" />
          <b>${view.name}</b>
          <span class="types">${view.types}</span>
          <span class="starter-details">${view.role} · ${view.habitats}</span>
          <span class="starter-traits">${view.damage} · ${view.status}</span>
          <span class="muted">${view.description}</span>
        `;
        card.addEventListener("click", () => {
          const owned = makeOwned(id);
          save.collection.push(owned);
          chooseStarter(save, owned.uid, id);
          resolve();
        });
        grid.appendChild(card);
      }
    }

    renderTabs();
    renderCards();
    root.appendChild(wrap);
  });
}
