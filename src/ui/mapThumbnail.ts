import { TILE } from "../data/constants";
import type { MapConfig } from "../types";
import { drawMapLayers, loadMapAtlas } from "../engine/render/mapTiles";

export function drawRouteThumbnail(
  ctx: CanvasRenderingContext2D,
  map: MapConfig,
  atlas: HTMLImageElement,
  width: number,
  height: number,
): void {
  ctx.imageSmoothingEnabled = false;
  ctx.save();
  ctx.scale(width / (map.cols * TILE), height / (map.rows * TILE));
  drawMapLayers(ctx, map, atlas);
  ctx.restore();
}

export function mountRouteThumbnail(container: HTMLElement, map: MapConfig): void {
  const canvas = document.createElement("canvas");
  canvas.className = "route-preview";
  canvas.width = 270;
  canvas.height = 180;
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", `${map.name} map preview`);
  container.appendChild(canvas);

  void loadMapAtlas().then((atlas) => {
    const ctx = canvas.getContext("2d");
    if (atlas && ctx) drawRouteThumbnail(ctx, map, atlas, canvas.width, canvas.height);
  });
}
