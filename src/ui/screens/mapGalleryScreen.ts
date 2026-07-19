import { MAPS } from "../../data/maps";
import { drawRouteThumbnail } from "../mapThumbnail";
import { loadMapAtlas } from "../../engine/render/mapTiles";

// Development-only review surface: renders all nine battlefields at full board
// size so composition can be compared side by side without playing each route.
export function showMapGallery(root: HTMLElement): void {
  root.innerHTML = `
    <section class="map-gallery">
      <header><p>Development review</p><h1>Authored route gallery</h1></header>
      <div class="map-gallery-grid"></div>
    </section>
  `;
  const grid = root.querySelector<HTMLElement>(".map-gallery-grid")!;
  for (const map of MAPS) {
    const card = document.createElement("article");
    card.className = "map-gallery-card";
    card.innerHTML = `<h2>${map.name}</h2><canvas class="map-gallery-board" width="864" height="576" aria-label="${map.name} full map"></canvas>`;
    grid.appendChild(card);
    void loadMapAtlas().then((atlas) => {
      const canvas = card.querySelector<HTMLCanvasElement>("canvas")!;
      const ctx = canvas.getContext("2d");
      if (atlas && ctx) drawRouteThumbnail(ctx, map, atlas, canvas.width, canvas.height);
    });
  }
}
