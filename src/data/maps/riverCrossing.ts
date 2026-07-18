import source from "./authored/river-crossing.json";
import { WAVES_PER_MAP } from "../constants";
import { makeRoute, makeWaveGen } from "./routeFactory";

export const riverCrossing = makeRoute(source, {
  id: "river_crossing",
  name: "River Crossing",
  description: "Fast currents divide shoreline, island, and ridge habitats.",
  totalWaves: WAVES_PER_MAP,
  theme: { palette: "river", groundTile: 3, pathTile: 2 },
  waveGen: makeWaveGen("water", 202, 1),
  unlockRequirement: { mapId: "verdant_route", wave: 25 },
  rewardMultiplier: 1.2,
});
