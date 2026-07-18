import source from "./authored/ember-caldera.json";
import { WAVES_PER_MAP } from "../constants";
import { makeRoute, makeWaveGen } from "./routeFactory";

export const emberCaldera = makeRoute(source, {
  id: "ember_caldera",
  name: "Ember Caldera",
  description: "Stone plinths overlook a glowing volcanic circuit.",
  totalWaves: WAVES_PER_MAP,
  theme: { palette: "ember", groundTile: 5, pathTile: 12 },
  waveGen: makeWaveGen("ember", 404, 4),
  unlockRequirement: { mapId: "granite_cave", wave: 25 },
  rewardMultiplier: 1.6,
});
