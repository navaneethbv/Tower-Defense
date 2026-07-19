import type { GameSession } from "../game";
import type { Tower } from "../tower";
import type { Terrain } from "../../types";
import { TILE } from "../../data/constants";
import { getSprite, isReady } from "./spriteCache";
import { drawMapLayers, getMapAtlas, padVisualState } from "./mapTiles";
import { STATUS_PRESENTATION } from "../../ui/statusPresentation";

const TERRAIN_COLORS: Record<string, string> = {
  grass: "#79bd68",
  water: "#4f91bd",
  mountain: "#736f68",
};

export interface BoardInteraction {
  allowedTerrain: Terrain[] | null;
  hovered: { col: number; row: number } | null;
}

// Draws the whole battlefield each frame. Pure view: reads GameSession, mutates nothing.
export function drawBoard(
  ctx: CanvasRenderingContext2D,
  game: GameSession,
  selected: Tower | null,
  showEffects = true,
  interaction: BoardInteraction = { allowedTerrain: null, hovered: null },
): void {
  const { map, path } = game;
  ctx.clearRect(0, 0, map.cols * TILE, map.rows * TILE);

  const atlas = getMapAtlas();
  if (atlas) {
    drawMapLayers(ctx, map, atlas);
  } else {
    for (let r = 0; r < map.rows; r++) {
      for (let c = 0; c < map.cols; c++) {
        ctx.fillStyle = TERRAIN_COLORS[map.terrain[r]![c]!] ?? "#79bd68";
        ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
      }
    }
  }

  // Path
  ctx.strokeStyle = "#8e7548";
  ctx.lineWidth = TILE * 0.86;
  ctx.lineJoin = "round";
  ctx.lineCap = "square";
  ctx.beginPath();
  path.points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.stroke();
  ctx.strokeStyle = "#d7bd72";
  ctx.lineWidth = TILE * 0.7;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  path.points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.stroke();

  for (const pad of map.deploymentPads) {
    const state = padVisualState({
      occupied: Boolean(game.towerAt(pad.col, pad.row)),
      selectedTerrain: interaction.allowedTerrain,
      padTerrain: pad.terrain,
    });
    const x = pad.col * TILE;
    const y = pad.row * TILE;
    const colors: Record<typeof state, string> = {
      idle: "rgba(238,248,201,0.72)",
      compatible: "#eef8c9",
      incompatible: "#c95f58",
      occupied: "#182536",
    };
    ctx.fillStyle =
      pad.terrain === "water"
        ? "rgba(130,168,108,0.9)"
        : pad.terrain === "mountain"
          ? "rgba(145,139,128,0.9)"
          : "rgba(143,210,124,0.88)";
    ctx.fillRect(x + 7, y + 7, TILE - 14, TILE - 14);
    ctx.strokeStyle = colors[state];
    ctx.lineWidth = state === "compatible" ? 4 : 2;
    ctx.strokeRect(x + 6, y + 6, TILE - 12, TILE - 12);
    if (state === "incompatible") {
      ctx.beginPath();
      ctx.moveTo(x + 14, y + 14);
      ctx.lineTo(x + TILE - 14, y + TILE - 14);
      ctx.moveTo(x + TILE - 14, y + 14);
      ctx.lineTo(x + 14, y + TILE - 14);
      ctx.stroke();
    }
    if (interaction.hovered?.col === pad.col && interaction.hovered.row === pad.row) {
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.strokeRect(x + 2, y + 2, TILE - 4, TILE - 4);
    }
  }

  // Range ring for selected tower
  if (selected) {
    ctx.strokeStyle = "rgba(56,189,248,0.6)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(selected.pos.x, selected.pos.y, selected.rangePx(), 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(56,189,248,0.08)";
    ctx.fill();
  }

  // Enemies
  for (const e of game.enemies) {
    const s = getSprite(e.def.dex);
    const size = e.isBoss ? TILE * 1.4 : TILE * 0.9;
    if (isReady(s)) {
      ctx.drawImage(s, e.pos.x - size / 2, e.pos.y - size / 2, size, size);
    } else {
      ctx.fillStyle = "#f87171";
      ctx.beginPath();
      ctx.arc(e.pos.x, e.pos.y, size / 3, 0, Math.PI * 2);
      ctx.fill();
    }
    // HP bar
    const w = size * 0.9;
    const pct = Math.max(0, e.hp / e.maxHp);
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(e.pos.x - w / 2, e.pos.y - size / 2 - 6, w, 4);
    ctx.fillStyle = pct > 0.5 ? "#4ade80" : pct > 0.25 ? "#fbbf24" : "#f87171";
    ctx.fillRect(e.pos.x - w / 2, e.pos.y - size / 2 - 6, w * pct, 4);
    if (e.status.has("slow") || e.status.has("stun")) {
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(e.pos.x, e.pos.y, size / 2, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Status chips sit above the health bar, capped so a heavily statused enemy
    // never buries its own sprite.
    const active = e.status.active().slice(0, 5);
    if (active.length > 0) {
      const chip = 13;
      const totalWidth = active.length * chip + (active.length - 1) * 2;
      let x = e.pos.x - totalWidth / 2;
      const y = e.pos.y - size / 2 - 21;
      ctx.font = "bold 9px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const effect of active) {
        const presentation = STATUS_PRESENTATION[effect.kind];
        ctx.fillStyle = presentation.color;
        ctx.fillRect(x, y, chip, chip);
        ctx.fillStyle = "#0f172a";
        ctx.fillText(presentation.icon, x + chip / 2, y + chip / 2 + 0.5);
        x += chip + 2;
      }
    }
  }

  // Towers
  for (const t of game.towers) {
    const s = getSprite(t.species.dex);
    const size = TILE * 0.86;
    if (t.favored) {
      ctx.fillStyle = "rgba(74,222,128,0.18)";
      ctx.fillRect(t.col * TILE, t.row * TILE, TILE, TILE);
    }
    if (t === selected) {
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2;
      ctx.strokeRect(t.col * TILE + 1, t.row * TILE + 1, TILE - 2, TILE - 2);
    }
    if (isReady(s)) {
      ctx.drawImage(s, t.pos.x - size / 2, t.pos.y - size / 2, size, size);
    } else {
      ctx.fillStyle = t.species.projectile.color;
      ctx.beginPath();
      ctx.arc(t.pos.x, t.pos.y, size / 3, 0, Math.PI * 2);
      ctx.fill();
    }
    // Level badge
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(t.col * TILE + 1, t.row * TILE + 1, 16, 12);
    ctx.fillStyle = "#fbbf24";
    ctx.font = "10px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${t.level}`, t.col * TILE + 9, t.row * TILE + 7);
    // Redeployment lockout: veil the pad and count the remaining seconds down.
    if (t.redeployCooldownLeft > 0) {
      ctx.fillStyle = "rgba(15,23,42,0.62)";
      ctx.fillRect(t.col * TILE + 3, t.row * TILE + 3, TILE - 6, TILE - 6);
      ctx.fillStyle = "#f8fafc";
      ctx.font = "bold 12px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(t.redeployCooldownLeft.toFixed(1), t.pos.x, t.pos.y);
    }
  }

  if (showEffects) {
    // Projectiles
    for (const p of game.projectiles) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.pos.x, p.pos.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Floating text
    ctx.font = "bold 13px system-ui";
    ctx.textAlign = "center";
    for (const f of game.floating) {
      ctx.globalAlpha = Math.max(0, f.life);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y - (0.9 - f.life) * 24);
      ctx.globalAlpha = 1;
    }
  }
}
