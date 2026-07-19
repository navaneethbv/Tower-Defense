import type { MapTheme, WaveGenParams } from "../../../types";

export interface TiledProperty {
  name: string;
  type: string;
  value: string | number | boolean;
}

export interface TiledObject {
  id: number;
  name?: string;
  gid?: number;
  point?: boolean;
  x: number;
  y: number;
  width?: number;
  height?: number;
  polyline?: { x: number; y: number }[];
  properties?: TiledProperty[];
}

export interface TiledTileLayer {
  type: "tilelayer";
  name: string;
  width: number;
  height: number;
  data: number[];
}

export interface TiledObjectLayer {
  type: "objectgroup";
  name: string;
  objects: TiledObject[];
}

export type TiledLayer = TiledTileLayer | TiledObjectLayer;

export interface TiledRouteSource {
  width: number;
  height: number;
  tilewidth: number;
  tileheight: number;
  layers: TiledLayer[];
}

export interface RouteRuntimeConfig {
  id: string;
  name: string;
  description: string;
  totalWaves: number;
  theme: MapTheme;
  waveGen: WaveGenParams;
  unlockRequirement: { mapId: string; wave: number } | null;
  rewardMultiplier: number;
}
