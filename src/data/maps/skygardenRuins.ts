import source from "./authored/skygarden-ruins.json";
import { WAVES_PER_MAP } from "../constants";
import { makeRoute, makeWaveGen } from "./routeFactory";

export const skygardenRuins = makeRoute(source, {
  id: "skygarden_ruins",
  name: "Skygarden Ruins",
  description: "Broken walls and open air reward careful long-range coverage.",
  totalWaves: WAVES_PER_MAP,
  theme: { palette: "sky", groundTile: 8, pathTile: 15 },
  waveGen: makeWaveGen("sky", 707, 3),
  unlockRequirement: { mapId: "shadow_marsh", wave: 25 },
  rewardMultiplier: 2.2,
});
