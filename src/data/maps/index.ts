import type { MapConfig } from "../../types";
import { verdantRoute } from "./verdantRoute";
import { riverCrossing } from "./riverCrossing";
import { graniteCave } from "./graniteCave";
import { emberCaldera } from "./emberCaldera";
import { frostboundLake } from "./frostboundLake";
import { shadowMarsh } from "./shadowMarsh";
import { skygardenRuins } from "./skygardenRuins";
import { ancientSanctuary } from "./ancientSanctuary";
import { indigoPlateau } from "./indigoPlateau";

// Ordered by difficulty; later maps unlock via wave milestones on earlier ones.
export const MAPS: MapConfig[] = [
  verdantRoute,
  riverCrossing,
  graniteCave,
  emberCaldera,
  frostboundLake,
  shadowMarsh,
  skygardenRuins,
  ancientSanctuary,
  indigoPlateau,
];

const BY_ID = new Map(MAPS.map((m) => [m.id, m]));

export function getMap(id: string): MapConfig {
  const m = BY_ID.get(id);
  if (!m) throw new Error(`Unknown map id: ${id}`);
  return m;
}
