import type { IVs, Rarity } from "../types";

const RARITY_COLORS: Record<Rarity, string> = {
  common: "#94a3b8",
  rare: "#38bdf8",
  legendary: "#f472b6",
};

export function rarityColor(rarity: Rarity): string {
  return RARITY_COLORS[rarity];
}

// Small three-bar IV readout (damage / range / attack speed), each 0..15.
export function ivBarsHtml(ivs: IVs): string {
  const bar = (label: string, v: number): string => {
    const pct = Math.round((v / 15) * 100);
    return `
      <div class="iv-row">
        <span class="iv-label">${label}</span>
        <span class="iv-track"><span class="iv-fill" style="width:${pct}%"></span></span>
        <span class="iv-val">${v}</span>
      </div>`;
  };
  return `<div class="iv-bars">${bar("DMG", ivs.damage)}${bar("RNG", ivs.range)}${bar("SPD", ivs.attackSpeed)}</div>`;
}
