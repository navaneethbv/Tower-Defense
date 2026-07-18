import source from "./authored/shadow-marsh.json";
import { WAVES_PER_MAP } from "../constants";
import { makeRoute, makeWaveGen } from "./routeFactory";

export const shadowMarsh = makeRoute(source, {
  id: "shadow_marsh",
  name: "Shadow Marsh",
  description: "Mist, dark water, and narrow dry ground hide spectral foes.",
  totalWaves: WAVES_PER_MAP,
  theme: { palette: "shadow", groundTile: 7, pathTile: 14 },
  waveGen: makeWaveGen("shadow", 606, 6),
  unlockRequirement: { mapId: "frostbound_lake", wave: 25 },
  rewardMultiplier: 2,
});
