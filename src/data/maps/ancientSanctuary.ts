import source from "./authored/ancient-sanctuary.json";
import { WAVES_PER_MAP } from "../constants";
import { makeRoute, makeWaveGen } from "./routeFactory";

export const ancientSanctuary = makeRoute(source, {
  id: "ancient_sanctuary",
  name: "Ancient Sanctuary",
  description: "A weathered temple tests all three habitat disciplines.",
  totalWaves: WAVES_PER_MAP,
  theme: { palette: "ancient", groundTile: 9, pathTile: 2 },
  waveGen: makeWaveGen("ancient", 808, 8),
  unlockRequirement: { mapId: "skygarden_ruins", wave: 25 },
  rewardMultiplier: 2.4,
});
