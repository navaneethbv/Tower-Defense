// Board geometry
export const TILE = 48;
export const COLS = 18;
export const ROWS = 12;
export const BOARD_WIDTH = COLS * TILE;
export const BOARD_HEIGHT = ROWS * TILE;

// Run rules
export const STARTING_LIVES = 15;
export const STARTING_GOLD = 360;
export const WAVES_PER_MAP = 50;

// Meta currency
export const STARTER_POKECOINS = 500;

// Global balance tuning. Kept central so the sim harness can sweep without
// touching per-species data. RANGE_SCALE tightens coverage so a single tower
// can't blanket the board — team size (more pokemon) becomes the real answer.
export const RANGE_SCALE = 0.78;

// Sprite location (self-hosted under public/sprites)
export function spriteUrl(dex: number): string {
  return `/sprites/${dex}.png`;
}
