import source from "./authored/indigo-plateau.json";
import { WAVES_PER_MAP } from "../constants";
import { makeRoute, makeWaveGen } from "./routeFactory";

export const indigoPlateau = makeRoute(source, {
  id: "indigo_plateau",
  name: "Indigo Plateau",
  description: "The championship gauntlet demands a complete habitat roster.",
  totalWaves: WAVES_PER_MAP,
  theme: { palette: "champion", groundTile: 10, pathTile: 2 },
  waveGen: makeWaveGen("champion", 909, 9),
  unlockRequirement: { mapId: "ancient_sanctuary", wave: 25 },
  rewardMultiplier: 2.6,
});
