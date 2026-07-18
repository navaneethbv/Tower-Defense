import type { GameSession } from "../game";
import type { Tower } from "../tower";
import { TILE } from "../../data/constants";
import { getSprite, isReady } from "./spriteCache";

const TERRAIN_COLORS: Record<string, string> = {
  grass: "#14351f",
  water: "#0e2f4d",
  mountain: "#3a3320",
};

// Draws the whole battlefield each frame. Pure view: reads GameSession, mutates nothing.
export function drawBoard(ctx: CanvasRenderingContext2D, game: GameSession, selected: Tower | null): void {
  const { map, path } = game;
  ctx.clearRect(0, 0, map.cols * TILE, map.rows * TILE);

  // Terrain
  for (let r = 0; r < map.rows; r++) {
    for (let c = 0; c < map.cols; c++) {
      ctx.fillStyle = TERRAIN_COLORS[map.terrain[r]![c]!] ?? "#14351f";
      ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
    }
  }
  // Grid
  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 1;
  for (let c = 0; c <= map.cols; c++) {
    ctx.beginPath();
    ctx.moveTo(c * TILE, 0);
    ctx.lineTo(c * TILE, map.rows * TILE);
    ctx.stroke();
  }
  for (let r = 0; r <= map.rows; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * TILE);
    ctx.lineTo(map.cols * TILE, r * TILE);
    ctx.stroke();
  }

  // Path
  ctx.strokeStyle = "#c2a86b";
  ctx.lineWidth = TILE * 0.7;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  path.points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.stroke();

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
  }

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
