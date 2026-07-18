import source from "./authored/granite-cave.json";
import { WAVES_PER_MAP } from "../constants";
import { makeRoute, makeWaveGen } from "./routeFactory";

export const graniteCave = makeRoute(source, {
  id: "granite_cave",
  name: "Granite Cave",
  description: "A torchlit switchback through carved stone chambers.",
  totalWaves: WAVES_PER_MAP,
  theme: { palette: "granite", groundTile: 4, pathTile: 11 },
  waveGen: makeWaveGen("stone", 303, 3),
  unlockRequirement: { mapId: "river_crossing", wave: 25 },
  rewardMultiplier: 1.4,
});
