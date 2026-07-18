import { spriteUrl } from "../../data/constants";

// Lazily loads and caches sprite images by dex number.
const cache = new Map<number, HTMLImageElement>();

export function getSprite(dex: number): HTMLImageElement {
  let img = cache.get(dex);
  if (!img) {
    img = new Image();
    img.src = spriteUrl(dex);
    cache.set(dex, img);
  }
  return img;
}

export function isReady(img: HTMLImageElement): boolean {
  return img.complete && img.naturalWidth > 0;
}
