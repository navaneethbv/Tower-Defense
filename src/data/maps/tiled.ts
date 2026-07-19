import type {
  DeploymentPad,
  LandmarkRole,
  MapConfig,
  MapDecor,
  MapLandmark,
  Terrain,
} from "../../types";
import type {
  RouteRuntimeConfig,
  TiledObjectLayer,
  TiledProperty,
  TiledRouteSource,
  TiledTileLayer,
} from "./authored/types";

const HABITATS: Record<number, Terrain> = {
  1: "grass",
  2: "water",
  3: "mountain",
};

function tileLayer(source: TiledRouteSource, name: string, id: string): TiledTileLayer {
  const layer = source.layers.find(
    (candidate): candidate is TiledTileLayer =>
      candidate.name === name && candidate.type === "tilelayer",
  );
  if (!layer) throw new Error(`${id}: missing ${name} layer`);
  if (layer.width !== source.width || layer.height !== source.height) {
    throw new Error(`${id}: invalid ${name} dimensions`);
  }
  if (layer.data.length !== source.width * source.height) {
    throw new Error(`${id}: invalid ${name} layer length`);
  }
  return layer;
}

function objectLayer(source: TiledRouteSource, name: string, id: string): TiledObjectLayer {
  const layer = source.layers.find(
    (candidate): candidate is TiledObjectLayer =>
      candidate.name === name && candidate.type === "objectgroup",
  );
  if (!layer) throw new Error(`${id}: missing ${name} layer`);
  return layer;
}

function terrainProperty(
  properties: { name: string; value: string | number | boolean }[] | undefined,
  id: string,
): Terrain {
  const value = properties?.find((property) => property.name === "terrain")?.value;
  if (value === "grass" || value === "water" || value === "mountain") return value;
  throw new Error(`${id}: pad is missing a valid terrain property`);
}

function numberProperty(
  properties: TiledProperty[] | undefined,
  name: string,
): number | undefined {
  const value = properties?.find((property) => property.name === name)?.value;
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : undefined;
}

function landmarkRole(properties: TiledProperty[] | undefined, id: string): LandmarkRole {
  const value = properties?.find((property) => property.name === "role")?.value;
  if (value === "dominant" || value === "secondary" || value === "entrance" || value === "exit") {
    return value;
  }
  throw new Error(`${id}: landmark is missing a valid role`);
}

export function loadAuthoredMap(
  source: TiledRouteSource,
  config: RouteRuntimeConfig,
): MapConfig {
  const ground = tileLayer(source, "ground", config.id);
  const habitat = tileLayer(source, "habitat", config.id);
  const pathTiles = tileLayer(source, "pathTiles", config.id);
  const landmarksLayer = objectLayer(source, "landmarks", config.id);
  const pathLayer = objectLayer(source, "path", config.id);
  const padsLayer = objectLayer(source, "pads", config.id);
  const decorLayer = objectLayer(source, "decor", config.id);
  const pathObject = pathLayer.objects.find((object) => object.polyline?.length);
  if (!pathObject?.polyline) throw new Error(`${config.id}: path layer has no polyline`);

  const terrain: Terrain[][] = [];
  for (let row = 0; row < source.height; row++) {
    const values: Terrain[] = [];
    for (let col = 0; col < source.width; col++) {
      const value = HABITATS[habitat.data[row * source.width + col]!];
      if (!value) throw new Error(`${config.id}: invalid habitat tile at ${col},${row}`);
      values.push(value);
    }
    terrain.push(values);
  }

  const seenPads = new Set<string>();
  const deploymentPads: DeploymentPad[] = padsLayer.objects.map((object) => {
    const id = object.name?.trim();
    if (!id) throw new Error(`${config.id}: pad is missing an id`);
    if (seenPads.has(id)) throw new Error(`${config.id}: duplicate pad ${id}`);
    seenPads.add(id);
    const col = Math.floor(object.x / source.tilewidth);
    const row = Math.floor(object.y / source.tileheight);
    const padTerrain = terrainProperty(object.properties, config.id);
    if (col < 0 || col >= source.width || row < 0 || row >= source.height) {
      throw new Error(`${config.id}: pad ${id} is outside the board`);
    }
    if (terrain[row]![col] !== padTerrain) {
      throw new Error(`${config.id}: pad ${id} does not match habitat layer`);
    }
    const tile = numberProperty(object.properties, "tile");
    if (!tile) throw new Error(`${config.id}: pad ${id} is missing a valid tile property`);
    return { id, col, row, terrain: padTerrain, tile };
  });

  const landmarkIds = new Set<string>();
  const landmarks: MapLandmark[] = landmarksLayer.objects.map((object) => {
    const id = object.name?.trim();
    if (!id) throw new Error(`${config.id}: landmark is missing an id`);
    if (landmarkIds.has(id)) throw new Error(`${config.id}: duplicate landmark ${id}`);
    landmarkIds.add(id);
    const landmark = {
      id,
      role: landmarkRole(object.properties, config.id),
      col: Math.floor(object.x / source.tilewidth),
      row: Math.floor(object.y / source.tileheight),
      width: Math.max(1, Math.ceil((object.width ?? source.tilewidth) / source.tilewidth)),
      height: Math.max(1, Math.ceil((object.height ?? source.tileheight) / source.tileheight)),
    };
    if (
      landmark.col < 0 ||
      landmark.row < 0 ||
      landmark.col + landmark.width > source.width ||
      landmark.row + landmark.height > source.height
    ) {
      throw new Error(`${config.id}: landmark ${id} is outside the board`);
    }
    return landmark;
  });

  const roleCounts = landmarks.reduce<Record<LandmarkRole, number>>(
    (counts, landmark) => ({ ...counts, [landmark.role]: counts[landmark.role] + 1 }),
    { dominant: 0, secondary: 0, entrance: 0, exit: 0 },
  );
  if (
    roleCounts.dominant !== 1 ||
    roleCounts.secondary < 2 ||
    roleCounts.entrance !== 1 ||
    roleCounts.exit !== 1
  ) {
    throw new Error(
      `${config.id}: landmarks require 1 dominant, 2 secondary, 1 entrance, and 1 exit`,
    );
  }

  const path = pathObject.polyline.map((point) => ({
    x: (pathObject.x + point.x) / source.tilewidth - 0.5,
    y: (pathObject.y + point.y) / source.tileheight - 0.5,
  }));
  const decor: MapDecor[] = decorLayer.objects
    .filter((object) => object.gid !== undefined)
    .map((object) => ({
      tile: object.gid!,
      col: Math.floor(object.x / source.tilewidth),
      row: Math.floor(object.y / source.tileheight) - 1,
    }));

  return {
    ...config,
    cols: source.width,
    rows: source.height,
    path,
    terrain,
    tiles: [...ground.data],
    pathTiles: [...pathTiles.data],
    decor,
    deploymentPads,
    landmarks,
  };
}
