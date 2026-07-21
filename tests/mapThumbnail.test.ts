import { describe, expect, it, vi } from "vitest";
import { MAPS } from "../src/data/maps";
import { drawRouteThumbnail } from "../src/ui/mapThumbnail";

describe("route thumbnails", () => {
  it("draws the actual authored route with pixel smoothing disabled", () => {
    const scale = vi.fn();
    const save = vi.fn();
    const restore = vi.fn();
    const drawImage = vi.fn();
    const beginPath = vi.fn();
    const rect = vi.fn();
    const clip = vi.fn();
    const translate = vi.fn();
    const rotate = vi.fn();
    const ctx = {
      canvas: { width: 270, height: 180 },
      imageSmoothingEnabled: true,
      save,
      restore,
      scale,
      drawImage,
      beginPath,
      rect,
      clip,
      translate,
      rotate,
    } as unknown as CanvasRenderingContext2D;

    drawRouteThumbnail(ctx, MAPS[0]!, {} as HTMLImageElement, 270, 180);

    expect(ctx.imageSmoothingEnabled).toBe(false);
    expect(save.mock.calls.length).toBeGreaterThanOrEqual(1);
    expect(scale).toHaveBeenCalledWith(270 / 864, 180 / 576);
    expect(restore).toHaveBeenCalledTimes(save.mock.calls.length);
    expect(drawImage.mock.calls.length).toBeGreaterThan(20);
  });
});
