import source from "./authored/verdant-route.json";
import { WAVES_PER_MAP } from "../constants";
import { makeRoute, makeWaveGen } from "./routeFactory";

export const verdantRoute = makeRoute(source, {
  id: "verdant_route",
  name: "Verdant Route",
  description: "A bright meadow circuit wrapped around a quiet pond.",
  totalWaves: WAVES_PER_MAP,
  theme: { palette: "verdant", groundTile: 1, pathTile: 2 },
  waveGen: makeWaveGen("meadow", 101, 1),
  unlockRequirement: null,
  rewardMultiplier: 1,
});
