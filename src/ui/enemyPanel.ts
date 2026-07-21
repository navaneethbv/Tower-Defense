import type { Enemy } from "../engine/enemy";
import { spriteUrl } from "../data/constants";
import { STATUS_PRESENTATION } from "./statusPresentation";

export interface EnemyStatRow {
  label: string;
  value: string;
  /** Set when the row describes a mechanic that changes how it must be fought. */
  emphasis?: boolean;
}

export interface EnemyView {
  name: string;
  sprite: string;
  types: string[];
  hpLabel: string;
  hpPercent: number;
  isBoss: boolean;
  rows: EnemyStatRow[];
  statuses: { icon: string; label: string; color: string }[];
  notes: string[];
}

/**
 * Builds the inspection card for a live enemy.
 *
 * Spectral and regen decide whether a fight is winnable at all, but were
 * previously invisible: nothing in the HUD said why a tower could not damage a
 * Gastly. They are surfaced as emphasised rows and spelled out in notes.
 */
export function enemyView(enemy: Enemy): EnemyView {
  const def = enemy.def;
  const armor = enemy.effectiveArmor();
  const rows: EnemyStatRow[] = [
    { label: "Health", value: `${Math.max(0, Math.ceil(enemy.hp))} / ${Math.round(enemy.maxHp)}` },
    {
      label: "Armor",
      value: armor === enemy.armor ? `${armor}` : `${armor} (broken from ${enemy.armor})`,
      emphasis: armor >= 8,
    },
    { label: "Speed", value: `${enemy.speed.toFixed(2)} tiles/s` },
    { label: "Reward", value: `${enemy.reward} gold` },
    { label: "Lives lost", value: `${enemy.heartDamage}` , emphasis: enemy.heartDamage >= 3 },
  ];

  if (def.regen) {
    rows.push({ label: "Regen", value: `${def.regen} hp/s`, emphasis: true });
  }
  rows.push({
    label: "Spectral",
    value: def.spectral ? "Yes" : "No",
    emphasis: def.spectral === true,
  });

  const notes: string[] = [];
  if (def.spectral) {
    notes.push("Only ghost, psychic, or super-effective attacks can damage this target.");
  }
  if (def.regen) {
    notes.push("Heals continuously; burst it down or apply damage over time.");
  }
  if (enemy.isBoss) {
    notes.push("Boss: freeze, sleep, stun, and paralysis last half as long.");
  }

  const statuses = enemy.status.active().map((effect) => {
    const presentation = STATUS_PRESENTATION[effect.kind];
    return { icon: presentation.icon, label: presentation.label, color: presentation.color };
  });

  return {
    name: def.name,
    sprite: spriteUrl(def.dex),
    types: def.types,
    hpLabel: `${Math.max(0, Math.ceil(enemy.hp))} / ${Math.round(enemy.maxHp)}`,
    hpPercent: Math.max(0, Math.min(1, enemy.hp / enemy.maxHp)),
    isBoss: enemy.isBoss,
    rows,
    statuses,
    notes,
  };
}

export function enemyPanelHtml(view: EnemyView): string {
  const rows = view.rows
    .map(
      (row) =>
        `<div class="enemy-row${row.emphasis ? " emphasis" : ""}"><span>${row.label}</span><b>${row.value}</b></div>`,
    )
    .join("");

  const statuses = view.statuses.length
    ? `<div class="enemy-statuses">${view.statuses
        .map(
          (status) =>
            `<span class="enemy-chip" style="background:${status.color}" title="${status.label}">${status.icon}</span>`,
        )
        .join("")}</div>`
    : "";

  const notes = view.notes.map((note) => `<p class="enemy-note">${note}</p>`).join("");

  return `
    <div class="enemy-head">
      <img src="${view.sprite}" alt="" />
      <div>
        <h4>${view.name}${view.isBoss ? ' <span class="wave-badge boss">Boss</span>' : ""}</h4>
        <span class="muted">${view.types.join(" / ")}</span>
      </div>
    </div>
    <div class="enemy-hp"><span style="width:${(view.hpPercent * 100).toFixed(1)}%"></span></div>
    ${statuses}
    <div class="enemy-rows">${rows}</div>
    ${notes}
  `;
}

/**
 * Nearest living enemy to a board point, within a grab radius.
 * Enemies move, so a click needs tolerance rather than exact hit testing.
 */
export function enemyAtPoint(
  enemies: readonly Enemy[],
  x: number,
  y: number,
  radius: number,
): Enemy | null {
  let best: Enemy | null = null;
  let bestDistance = radius * radius;
  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    const dx = enemy.pos.x - x;
    const dy = enemy.pos.y - y;
    const distance = dx * dx + dy * dy;
    if (distance <= bestDistance) {
      bestDistance = distance;
      best = enemy;
    }
  }
  return best;
}
