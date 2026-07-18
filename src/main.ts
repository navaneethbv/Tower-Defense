import "./styles.css";
import { getMap } from "./data/maps";
import { loadSave, saveSave } from "./meta/save";
import { teamMembers } from "./meta/collection";
import { applyCompletedRun } from "./meta/runResult";
import { showStarter } from "./ui/screens/starterScreen";
import { showHome } from "./ui/screens/homeScreen";
import { showLoadout } from "./ui/screens/loadoutScreen";
import { showShop } from "./ui/screens/shopScreen";
import { showCollection } from "./ui/screens/collectionScreen";
import { runGame } from "./ui/gameScreen";
import { syncAchievements } from "./meta/achievements";

// Top-level game flow: starter pick (once) -> home hub -> loadout -> run -> apply
// results -> back to home. State lives in the SaveGame, persisted after each step.
async function main(): Promise<void> {
  const app = document.getElementById("app");
  if (!app) throw new Error("#app root not found");
  app.style.alignItems = "flex-start";

  const save = loadSave();

  if (!save.starterChosen) {
    await showStarter(app, save);
    saveSave(save);
  }

  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (syncAchievements(save).length > 0) saveSave(save);
    const action = await showHome(app, save, () => saveSave(save));

    if (action.type === "shop") {
      await showShop(app, save);
      saveSave(save);
      continue;
    }
    if (action.type === "collection") {
      await showCollection(app, save);
      saveSave(save);
      continue;
    }

    const map = getMap(action.mapId);
    const loadout = await showLoadout(app, save, map);
    saveSave(save);
    if (!loadout.start) continue;

    const team = teamMembers(save);
    if (team.length === 0) continue;

    const runSeed = (Math.random() * 0xffffffff) >>> 0;
    const result = await runGame(app, map, team, runSeed, save.settings, () => saveSave(save));

    // Persist run outcome: coins, best wave, milestone eggs, and persistent XP.
    applyCompletedRun(save, map, result);
    saveSave(save);
  }
}

void main();
