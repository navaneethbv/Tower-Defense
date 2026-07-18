import type { MapConfig } from "../../types";
import { verdantRoute } from "./verdantRoute";
import { riverCrossing } from "./riverCrossing";
import { graniteCave } from "./graniteCave";
import { indigoPlateau } from "./indigoPlateau";

// Ordered by difficulty; later maps unlock via wave milestones on earlier ones.
export const MAPS: MapConfig[] = [verdantRoute, riverCrossing, graniteCave, indigoPlateau];

const BY_ID = new Map(MAPS.map((m) => [m.id, m]));

export function getMap(id: string): MapConfig {
  const m = BY_ID.get(id);
  if (!m) throw new Error(`Unknown map id: ${id}`);
  return m;
}
