import type { OwnedPokemon } from "../../types";
import { getSpecies } from "../../data/species";
import { spriteUrl } from "../../data/constants";
import { displayName, ivScore } from "../../meta/collection";
import { ivBarsHtml, rarityColor } from "../components";

export function showPokemonDetails(
  parent: HTMLElement,
  p: OwnedPokemon,
  onClose: () => void,
): void {
  const s = getSpecies(p.speciesId);

  // Calculate real-time stats
  const persistentBonus = Math.min(1.5, (p.level - 1) * 0.05);
  const dmg = Math.round(
    s.base.damage * Math.pow(p.level, 0.48) * (1 + p.ivs.damage / 100) * (1 + persistentBonus)
  );
  const range = Math.round(
    s.base.range * Math.pow(p.level, 0.25) * (1 + p.ivs.range / 100)
  );
  const rawCooldown =
    (s.base.cooldown * Math.pow(0.97, Math.pow(p.level - 1, 0.7))) /
    (1 - p.ivs.attackSpeed / 300);
  const attackSpeed = (1 / rawCooldown).toFixed(2);

  const modal = document.createElement("div");
  modal.className = "reveal pokemon-details-overlay";
  modal.style.zIndex = "1000";

  const typeBadges = s.types
    .map((t) => `<span class="type-badge ${t}">${t.toUpperCase()}</span>`)
    .join(" ");

  const allowedTerrains = s.allowedTerrain
    .map(
      (t) =>
        `<span class="terrain-chip ${t} ${
          s.favoredTerrain === t ? "favored" : ""
        }">${t}${s.favoredTerrain === t ? " ★" : ""}</span>`
    )
    .join(" ");

  const statusHtml = s.onHitStatus
    ? `
      <div class="details-section">
        <h3>Status Effect</h3>
        <div class="detail-row"><span>Effect</span><b>${s.onHitStatus.kind.toUpperCase()}</b></div>
        <div class="detail-row"><span>Trigger Chance</span><b>${Math.round(
          s.onHitStatus.chance * 100
        )}%</b></div>
        <div class="detail-row"><span>Duration</span><b>${s.onHitStatus.duration}s</b></div>
        <div class="detail-row"><span>Magnitude</span><b>${s.onHitStatus.magnitude}</b></div>
      </div>`
    : "";

  const abilityHtml = s.ability
    ? `
      <div class="details-section">
        <h3>Active Ability</h3>
        <div class="detail-row"><span>Name</span><b>${s.ability.name}</b></div>
        <div class="detail-row"><span>Kind</span><b>${s.ability.kind
          .replace("_", " ")
          .toUpperCase()}</b></div>
        <div class="detail-row"><span>Cooldown</span><b>${s.ability.cooldown}s</b></div>
        <p class="ability-description">${s.ability.description}</p>
      </div>`
    : "";

  const evolutionHtml =
    s.evolutions && s.evolutions.length > 0
      ? `
      <div class="details-section">
        <h3>Evolution Path</h3>
        ${s.evolutions
          .map((e) => {
            const nextSpec = getSpecies(e.speciesId);
            return `<div class="detail-row"><span>Evolves into</span><b>${nextSpec.name} (Lv ${e.atLevel})</b></div>`;
          })
          .join("")}
      </div>`
      : "";

  modal.innerHTML = `
    <div class="reveal-card pokemon-details-card" style="border-color:${rarityColor(s.rarity)}">
      <div class="details-header">
        <h2>${displayName(p)}</h2>
        <button class="close-details-btn" id="close-details-btn">×</button>
      </div>
      
      <div class="details-body">
        <div class="details-hero">
          <img src="${spriteUrl(s.dex)}" alt="${s.name}" class="large-sprite" />
          <div class="types-row">${typeBadges}</div>
          <span class="rarity-badge" style="color:${rarityColor(s.rarity)}">${s.rarity.toUpperCase()}</span>
          <span class="muted">Lv ${p.level} · IV Score ${ivScore(p)}%</span>
        </div>

        <div class="details-scroll">
          <div class="details-section">
            <h3>Combat Properties</h3>
            <div class="detail-row"><span>Role</span><b>${s.role.replace("_", " ").toUpperCase()}</b></div>
            <div class="detail-row"><span>Combat Style</span><b>${s.combatProfile.toUpperCase()}</b></div>
            <div class="detail-row"><span>Compatible Pads</span><div class="terrains-row">${allowedTerrains}</div></div>
          </div>

          <div class="details-section">
            <h3>Individual Values (IVs)</h3>
            ${ivBarsHtml(p.ivs)}
          </div>

          <div class="details-section">
            <h3>Battle Stats</h3>
            <div class="detail-row"><span>Damage</span><b>${dmg}</b></div>
            <div class="detail-row"><span>Range</span><b>${range} px</b></div>
            <div class="detail-row"><span>Attack Speed</span><b>${attackSpeed} /s</b></div>
            <div class="detail-row"><span>Deployment Cost</span><b>🪙 ${s.base.cost}</b></div>
          </div>

          ${statusHtml}
          ${abilityHtml}
          ${evolutionHtml}
        </div>
      </div>
    </div>
  `;

  const close = () => {
    modal.remove();
    onClose();
  };

  modal.querySelector("#close-details-btn")!.addEventListener("click", close);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
  });

  parent.appendChild(modal);
}
