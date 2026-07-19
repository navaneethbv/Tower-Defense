import source from "./authored/frostbound-lake.json";
import { WAVES_PER_MAP } from "../constants";
import { makeRoute, makeWaveGen } from "./routeFactory";

export const frostboundLake = makeRoute(source, {
  id: "frostbound_lake",
  name: "Frostbound Lake",
  description: "Icy channels create long lanes between frozen islands.",
  totalWaves: WAVES_PER_MAP,
  theme: { palette: "frost", groundTile: 6, pathTile: 13 },
  waveGen: { ...makeWaveGen("frost", 505, 1), hpBase: 24, hpGrowth: 1.1 },
  unlockRequirement: { mapId: "ember_caldera", wave: 25 },
  rewardMultiplier: 1.8,
});
