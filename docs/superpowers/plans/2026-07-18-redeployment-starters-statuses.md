# Redeployment, Expanded Starters, and Status Specialists Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add state-preserving mid-wave Pokemon redeployment, all Generation 1 through 9 traditional starters plus Pikachu, and deterministic status-specialist combat across the complete roster.

**Architecture:** Extend `GameSession`, `Tower`, and `StatusSet` as the authoritative domain objects, while keeping input and presentation logic in small UI helpers. Preserve the generated canonical snapshot and derive roster-wide combat profiles from canonical types and stats, with curated starter and notable-species overrides.

**Tech Stack:** TypeScript, Vite, Canvas API, native DOM controls, Vitest with V8 coverage, ESLint, GitHub Actions, and Vercel.

## Global Constraints

- Follow red-green-refactor for every behavior change and observe each new test fail for the intended reason before editing production code.
- Do not manually edit `src/data/generated/pokemon.ts` or any generated report.
- Redeployment costs no gold and works during building and active-wave phases.
- Redeployment preserves tower identity, level, XP, run XP, evolution, targeting, total investment, attack cooldown, and ability cooldown.
- A moved Pokemon cannot attack, activate an ability, or move again during its 5-second redeployment cooldown.
- Starter selection contains exactly 28 unique choices grouped by generation.
- Status behavior and interruptions remain deterministic for a fixed run seed.
- Status specialists trade 20 to 30 percent direct DPS for stronger status application.
- Bosses remain status-susceptible, with hard-control durations reduced by 50 percent and toxic damage capped.
- Preserve the existing 95 percent statement, branch, function, and line coverage thresholds.
- Commit completed reviewer-sized tasks and push at the end of each approved implementation stage.
- Do not merge or bypass the protected `main` branch.

---

## File Responsibility Map

- `src/engine/tower.ts` owns mutable tower position and the redeployment cooldown.
- `src/engine/game.ts` validates and executes movement without recreating towers or charging gold.
- `src/ui/redeployment.ts` provides pure destination filtering and keyboard cycling.
- `src/ui/gameScreen.ts` owns move-mode input, buttons, hints, and cancellation.
- `src/data/starters.ts` owns the nine starter groups and the exact 28 IDs.
- `src/ui/screens/starterScreen.ts` renders generation tabs and starter card metadata.
- `src/engine/status.ts` owns all active status lifecycles, refresh rules, damage, and movement effects.
- `src/engine/enemy.ts` normalizes boss status duration and exposes direct-hit transitions.
- `src/data/speciesDerivation.ts` derives combat profiles and default status kits from canonical data.
- `src/data/starterKits.ts` owns starter-specific combat-profile exceptions without modifying generated data.
- `src/ui/statusPresentation.ts` owns user-facing names, icons, colors, and descriptions for every status.
- `src/engine/render/renderer.ts` renders movement cooldowns and active enemy status icons.
- `tests/placement.test.ts`, `tests/redeploymentUi.test.ts`, `tests/starters.test.ts`, `tests/status.test.ts`, `tests/species.test.ts`, `tests/abilities.test.ts`, and `tests/balance.test.ts` provide the test-first contract.

---

## Stage 1: State-Preserving Redeployment

### Task 1: Redeployment Domain Model

**Files:**
- Modify: `src/engine/tower.ts`
- Modify: `src/engine/game.ts`
- Modify: `tests/placement.test.ts`
- Modify: `tests/abilities.test.ts`

**Interfaces:**
- Produces: `GameSession.canRedeploy(tower: Tower, col: number, row: number): ValidationResult`.
- Produces: `GameSession.redeployTower(tower: Tower, col: number, row: number): PlacementResult`.
- Produces: `Tower.moveTo(col: number, row: number, favored: boolean): void`.
- Produces: `Tower.redeployCooldownLeft: number`.
- Produces: `GameSession.REDEPLOY_COOLDOWN_SECONDS = 5`.

- [ ] **Step 1: Write failing movement and state-preservation tests**

Add these cases to `tests/placement.test.ts`, using the file's existing `owned` helper:

```ts
it("redeploys the same tower without charging gold or resetting state", () => {
  const map = getMap("verdant_route");
  const member = owned("mover", "charmander");
  const game = new GameSession(map, [member], 10);
  const pads = map.deploymentPads.filter((pad) => pad.terrain === "grass");
  const placed = game.placeTower(member.uid, pads[0]!.col, pads[0]!.row);
  expect(placed.ok).toBe(true);
  if (!placed.ok) throw new Error(placed.reason);
  const tower = placed.tower;
  tower.level = 4;
  tower.xp = 3;
  tower.runXp = 12;
  tower.targeting = "strongest";
  tower.cooldownLeft = 0.4;
  tower.abilityCooldownLeft = 6;
  const gold = game.gold;

  const moved = game.redeployTower(tower, pads[1]!.col, pads[1]!.row);

  expect(moved).toEqual({ ok: true, tower });
  expect(game.gold).toBe(gold);
  expect(game.towers).toEqual([tower]);
  expect(tower).toMatchObject({
    col: pads[1]!.col,
    row: pads[1]!.row,
    level: 4,
    xp: 3,
    runXp: 12,
    targeting: "strongest",
    cooldownLeft: 0.4,
    abilityCooldownLeft: 6,
    redeployCooldownLeft: 5,
  });
});

it("rejects invalid, occupied, incompatible, and cooling-down moves", () => {
  const map = getMap("verdant_route");
  const charmander = owned("fire", "charmander");
  const bulbasaur = owned("grass", "bulbasaur");
  const game = new GameSession(map, [charmander, bulbasaur], 11);
  const grassPads = map.deploymentPads.filter((pad) => pad.terrain === "grass");
  const mountainPads = map.deploymentPads.filter((pad) => pad.terrain === "mountain");
  const waterPad = map.deploymentPads.find((pad) => pad.terrain === "water")!;
  const fire = game.placeTower(charmander.uid, mountainPads[0]!.col, mountainPads[0]!.row);
  const grass = game.placeTower(bulbasaur.uid, grassPads[0]!.col, grassPads[0]!.row);
  if (!fire.ok || !grass.ok) throw new Error("test setup failed");

  expect(game.canRedeploy(fire.tower, fire.tower.col, fire.tower.row)).toEqual({
    ok: false,
    reason: "Choose a different habitat pad",
  });
  expect(game.canRedeploy(fire.tower, grass.tower.col, grass.tower.row)).toEqual({
    ok: false,
    reason: "Habitat pad occupied",
  });
  expect(game.canRedeploy(fire.tower, waterPad.col, waterPad.row)).toEqual({
    ok: false,
    reason: "Charmander needs a grass or mountain pad",
  });
  expect(game.redeployTower(fire.tower, mountainPads[1]!.col, mountainPads[1]!.row).ok).toBe(true);
  expect(game.canRedeploy(fire.tower, grassPads[1]!.col, grassPads[1]!.row)).toEqual({
    ok: false,
    reason: "Redeploy ready in 5.0s",
  });
});
```

Add this case to `tests/abilities.test.ts`:

```ts
it("blocks attacks and abilities during the redeployment cooldown", () => {
  const { game, tower } = setup("charizard");
  const destination = game.map.deploymentPads.find(
    (pad) => tower.species.allowedTerrain.includes(pad.terrain) && (pad.col !== tower.col || pad.row !== tower.row),
  )!;
  expect(game.redeployTower(tower, destination.col, destination.row).ok).toBe(true);
  expect(game.activateAbility(tower)).toEqual({
    ok: false,
    reason: "Pokemon is redeploying",
  });
  game.update(5);
  expect(tower.redeployCooldownLeft).toBe(0);
});
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run:

```bash
npx vitest run tests/placement.test.ts tests/abilities.test.ts
```

Expected: FAIL because `redeployTower`, `canRedeploy`, and `redeployCooldownLeft` do not exist.

- [ ] **Step 3: Implement mutable tower movement and cooldown state**

In `src/engine/tower.ts`, make `favored`, `col`, `row`, and `pos` mutable, add the cooldown, and add this method:

```ts
redeployCooldownLeft = 0;

moveTo(col: number, row: number, favored: boolean): void {
  this.col = col;
  this.row = row;
  this.pos = { x: (col + 0.5) * TILE, y: (row + 0.5) * TILE };
  this.favored = favored;
}
```

In `src/engine/game.ts`, add a reusable validation result and the movement API:

```ts
export type ValidationResult = { ok: true } | PlacementError;

static readonly REDEPLOY_COOLDOWN_SECONDS = 5;

canRedeploy(tower: Tower, col: number, row: number): ValidationResult {
  if (!this.towers.includes(tower)) return { ok: false, reason: "Tower is not deployed" };
  if (tower.redeployCooldownLeft > 0) {
    return { ok: false, reason: `Redeploy ready in ${tower.redeployCooldownLeft.toFixed(1)}s` };
  }
  if (tower.col === col && tower.row === row) {
    return { ok: false, reason: "Choose a different habitat pad" };
  }
  if (col < 0 || col >= this.map.cols || row < 0 || row >= this.map.rows) {
    return { ok: false, reason: "Out of bounds" };
  }
  const pad = this.padAt(col, row);
  if (!pad) return { ok: false, reason: "Only marked habitat pads can hold Pokemon" };
  if (this.towerAt(col, row)) return { ok: false, reason: "Habitat pad occupied" };
  if (!tower.species.allowedTerrain.includes(pad.terrain)) {
    return {
      ok: false,
      reason: `${tower.species.name} needs a ${tower.species.allowedTerrain.join(" or ")} pad`,
    };
  }
  return { ok: true };
}

redeployTower(tower: Tower, col: number, row: number): PlacementResult {
  const check = this.canRedeploy(tower, col, row);
  if (!check.ok) return check;
  const pad = this.padAt(col, row)!;
  tower.moveTo(col, row, pad.terrain === tower.species.favoredTerrain);
  tower.redeployCooldownLeft = GameSession.REDEPLOY_COOLDOWN_SECONDS;
  this.emitChange();
  return { ok: true, tower };
}
```

In the tower update loop, decrement `redeployCooldownLeft` and skip firing while it remains positive:

```ts
t.redeployCooldownLeft = Math.max(0, t.redeployCooldownLeft - dt);
t.abilityCooldownLeft = Math.max(0, t.abilityCooldownLeft - dt);
t.cooldownLeft -= dt;
if (t.redeployCooldownLeft > 0 || t.cooldownLeft > 0) continue;
```

At the start of `activateAbility`, return `Pokemon is redeploying` when the cooldown is positive.

- [ ] **Step 4: Run focused and full tests and verify GREEN**

Run:

```bash
npx vitest run tests/placement.test.ts tests/abilities.test.ts
npm test
```

Expected: both commands PASS with no warnings.

- [ ] **Step 5: Commit the domain change**

```bash
git add src/engine/tower.ts src/engine/game.ts tests/placement.test.ts tests/abilities.test.ts
git commit -m "feat: add state-preserving tower redeployment"
```

### Task 2: Redeployment Controls and Presentation

**Files:**
- Create: `src/ui/redeployment.ts`
- Create: `tests/redeploymentUi.test.ts`
- Modify: `src/ui/gameScreen.ts`
- Modify: `src/engine/render/renderer.ts`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `GameSession.canRedeploy` and `GameSession.redeployTower` from Task 1.
- Produces: `redeploymentPads(game: GameSession, tower: Tower): DeploymentPad[]`.
- Produces: `cycleRedeploymentPad(pads: DeploymentPad[], current: TileSelection | null, direction: -1 | 1): DeploymentPad | undefined`.

- [ ] **Step 1: Write failing keyboard destination tests**

Create `tests/redeploymentUi.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { getMap } from "../src/data/maps";
import { GameSession } from "../src/engine/game";
import { cycleRedeploymentPad, redeploymentPads } from "../src/ui/redeployment";
import type { OwnedPokemon } from "../src/types";

const member: OwnedPokemon = {
  uid: "mover",
  speciesId: "charmander",
  ivs: { damage: 0, range: 0, attackSpeed: 0 },
  level: 1,
  xp: 0,
  hatchedAt: 0,
};

describe("redeployment controls", () => {
  it("returns only legal empty destination pads", () => {
    const map = getMap("verdant_route");
    const game = new GameSession(map, [member], 13);
    const origin = map.deploymentPads.find((pad) => pad.terrain === "grass")!;
    const placed = game.placeTower(member.uid, origin.col, origin.row);
    if (!placed.ok) throw new Error(placed.reason);
    const destinations = redeploymentPads(game, placed.tower);
    expect(destinations.length).toBeGreaterThan(0);
    expect(destinations).not.toContainEqual(origin);
    expect(destinations.every((pad) => game.canRedeploy(placed.tower, pad.col, pad.row).ok)).toBe(true);
  });

  it("cycles forward and backward with wraparound", () => {
    const pads = [
      { id: "a", col: 1, row: 1, terrain: "grass" as const },
      { id: "b", col: 2, row: 1, terrain: "grass" as const },
    ];
    expect(cycleRedeploymentPad(pads, null, 1)).toEqual(pads[0]);
    expect(cycleRedeploymentPad(pads, { col: 2, row: 1 }, 1)).toEqual(pads[0]);
    expect(cycleRedeploymentPad(pads, { col: 1, row: 1 }, -1)).toEqual(pads[1]);
  });
});
```

- [ ] **Step 2: Run the UI helper test and verify RED**

Run:

```bash
npx vitest run tests/redeploymentUi.test.ts
```

Expected: FAIL because `src/ui/redeployment.ts` does not exist.

- [ ] **Step 3: Implement the pure movement helpers**

Create `src/ui/redeployment.ts`:

```ts
import type { DeploymentPad } from "../types";
import type { GameSession } from "../engine/game";
import type { Tower } from "../engine/tower";

export interface TileSelection {
  col: number;
  row: number;
}

export function redeploymentPads(game: GameSession, tower: Tower): DeploymentPad[] {
  return game.map.deploymentPads.filter((pad) => game.canRedeploy(tower, pad.col, pad.row).ok);
}

export function cycleRedeploymentPad(
  pads: DeploymentPad[],
  current: TileSelection | null,
  direction: -1 | 1,
): DeploymentPad | undefined {
  if (pads.length === 0) return undefined;
  const index = current
    ? pads.findIndex((pad) => pad.col === current.col && pad.row === current.row)
    : -1;
  return pads[(index + direction + pads.length) % pads.length];
}
```

- [ ] **Step 4: Integrate move mode into the game screen**

In `src/ui/gameScreen.ts`, add `movingTower: Tower | null`, use `redeploymentPads` for `Q` and `E`, confirm movement with `Enter`, and cancel with `Escape`.
Use this exact confirmation helper:

```ts
function tryRedeploy(col: number, row: number): void {
  if (!movingTower) return;
  const result = game.redeployTower(movingTower, col, row);
  if (result.ok) {
    selectedTower = result.tower;
    movingTower = null;
    hoveredTile = null;
    hint.textContent = `${result.tower.species.name} redeployed. Ready in 5.0s.`;
    hint.classList.remove("bad");
    playSound("deploy", settings.muted);
  } else {
    hint.textContent = result.reason;
    hint.classList.add("bad");
  }
  renderTower();
}
```

Add a `Redeploy` button to the tower button group.
Disable it while the cooldown is positive or the run is over.
When activated, set `movingTower = selectedTower`, clear `deployUid`, and set the hint to `Choose a glowing habitat pad. Use Q/E and Enter, or Escape to cancel.`
When move mode is active, pass `movingTower.species.allowedTerrain` to `drawBoard`, use `game.canRedeploy` for mouse hints, and route canvas clicks to `tryRedeploy`.

- [ ] **Step 5: Render the cooldown on the board and tower panel**

In `src/engine/render/renderer.ts`, draw a dark cooldown veil and remaining seconds over towers with an active cooldown:

```ts
if (t.redeployCooldownLeft > 0) {
  ctx.fillStyle = "rgba(15,23,42,0.62)";
  ctx.fillRect(t.col * TILE + 3, t.row * TILE + 3, TILE - 6, TILE - 6);
  ctx.fillStyle = "#f8fafc";
  ctx.font = "bold 12px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(t.redeployCooldownLeft.toFixed(1), t.pos.x, t.pos.y);
}
```

In the selected tower panel, show `Redeploy ready` or `Redeploy in N.Ns` and disable the ability button while redeployment cooldown is active.
Add `.redeploy-btn` focus, disabled, and active-state rules beside the existing tower button styles in `src/styles.css`.

- [ ] **Step 6: Verify unit and browser behavior**

Run:

```bash
npx vitest run tests/placement.test.ts tests/redeploymentUi.test.ts tests/abilities.test.ts
npm run lint
npm run build
npm run dev -- --host 127.0.0.1
```

Verify at 1440 by 900 and 390 by 844:

- Select a deployed Pokemon while a wave is active.
- Enter move mode with the button.
- Move with mouse input.
- Move a second Pokemon with `Q`, `E`, and `Enter`.
- Confirm `Escape` cancels.
- Confirm the cooldown veil counts down from 5 seconds.
- Confirm the moved Pokemon cannot attack or activate its ability during cooldown.
- Confirm no browser warnings, errors, clipping, or horizontal overflow.

- [ ] **Step 7: Commit and push Stage 1**

```bash
git add src/ui/redeployment.ts tests/redeploymentUi.test.ts src/ui/gameScreen.ts src/engine/render/renderer.ts src/styles.css
git commit -m "feat: add redeployment controls and feedback"
git push
```

---

## Stage 2: Generation-Grouped Starter Selection

### Task 3: Starter Catalogue and Invariants

**Files:**
- Create: `src/data/starters.ts`
- Create: `tests/starters.test.ts`
- Modify: `src/data/species.ts`
- Modify: `src/ui/screens/starterScreen.ts`

**Interfaces:**
- Produces: `StarterGroup`.
- Produces: `STARTER_GROUPS: readonly StarterGroup[]`.
- Produces: `STARTER_IDS: readonly string[]`.
- Produces: `starterGroup(generation: number): StarterGroup`.

- [ ] **Step 1: Write the exact roster test**

Create `tests/starters.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { getSpecies, isBaseSpecies } from "../src/data/species";
import { STARTER_GROUPS, STARTER_IDS, starterGroup } from "../src/data/starters";

describe("starter catalogue", () => {
  it("contains all nine generations and exactly 28 unique base species", () => {
    expect(STARTER_GROUPS.map((group) => group.generation)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(STARTER_IDS).toHaveLength(28);
    expect(new Set(STARTER_IDS).size).toBe(28);
    expect(STARTER_IDS.map((id) => getSpecies(id).name)).toEqual([
      "Bulbasaur", "Charmander", "Squirtle", "Pikachu",
      "Chikorita", "Cyndaquil", "Totodile",
      "Treecko", "Torchic", "Mudkip",
      "Turtwig", "Chimchar", "Piplup",
      "Snivy", "Tepig", "Oshawott",
      "Chespin", "Fennekin", "Froakie",
      "Rowlet", "Litten", "Popplio",
      "Grookey", "Scorbunny", "Sobble",
      "Sprigatito", "Fuecoco", "Quaxly",
    ]);
    expect(STARTER_IDS.every((id) => isBaseSpecies(getSpecies(id)))).toBe(true);
    expect(starterGroup(9).speciesIds).toEqual(["sprigatito", "fuecoco", "quaxly"]);
  });

  it("rejects an unknown generation", () => {
    expect(() => starterGroup(10)).toThrow("Unknown starter generation: 10");
  });
});
```

- [ ] **Step 2: Run the catalogue test and verify RED**

Run:

```bash
npx vitest run tests/starters.test.ts
```

Expected: FAIL because `src/data/starters.ts` does not exist.

- [ ] **Step 3: Implement the starter catalogue**

Create `src/data/starters.ts`:

```ts
export interface StarterGroup {
  generation: number;
  label: string;
  speciesIds: readonly string[];
}

export const STARTER_GROUPS = [
  { generation: 1, label: "Generation 1", speciesIds: ["bulbasaur", "charmander", "squirtle", "pikachu"] },
  { generation: 2, label: "Generation 2", speciesIds: ["chikorita", "cyndaquil", "totodile"] },
  { generation: 3, label: "Generation 3", speciesIds: ["treecko", "torchic", "mudkip"] },
  { generation: 4, label: "Generation 4", speciesIds: ["turtwig", "chimchar", "piplup"] },
  { generation: 5, label: "Generation 5", speciesIds: ["snivy", "tepig", "oshawott"] },
  { generation: 6, label: "Generation 6", speciesIds: ["chespin", "fennekin", "froakie"] },
  { generation: 7, label: "Generation 7", speciesIds: ["rowlet", "litten", "popplio"] },
  { generation: 8, label: "Generation 8", speciesIds: ["grookey", "scorbunny", "sobble"] },
  { generation: 9, label: "Generation 9", speciesIds: ["sprigatito", "fuecoco", "quaxly"] },
] as const satisfies readonly StarterGroup[];

export const STARTER_IDS = STARTER_GROUPS.flatMap((group) => [...group.speciesIds]);

export function starterGroup(generation: number): StarterGroup {
  const group = STARTER_GROUPS.find((candidate) => candidate.generation === generation);
  if (!group) throw new Error(`Unknown starter generation: ${generation}`);
  return group;
}
```

Remove the four-entry `STARTER_IDS` constant from `src/data/species.ts` and update `starterScreen.ts` to import from `src/data/starters.ts`.

- [ ] **Step 4: Run roster, save, and species tests and verify GREEN**

Run:

```bash
npx vitest run tests/starters.test.ts tests/save.test.ts tests/species.test.ts
```

Expected: PASS with 28 valid starter IDs and unchanged exactly-once starter save behavior.

- [ ] **Step 5: Commit the catalogue**

```bash
git add src/data/starters.ts tests/starters.test.ts src/data/species.ts src/ui/screens/starterScreen.ts
git commit -m "feat: add generation-grouped starter catalogue"
```

### Task 4: Starter Tabs, Cards, and Responsive Layout

**Files:**
- Modify: `src/ui/screens/starterScreen.ts`
- Modify: `src/styles.css`
- Modify: `tests/starters.test.ts`

**Interfaces:**
- Consumes: `STARTER_GROUPS` from Task 3.
- Produces: `StarterCardView`.
- Produces: `starterCardView(speciesId: string): StarterCardView`.

- [ ] **Step 1: Write failing starter-card presentation tests**

Add to `tests/starters.test.ts`:

```ts
import { starterCardView } from "../src/ui/screens/starterScreen";

it("describes starter combat and habitat identity", () => {
  expect(starterCardView("charmander")).toMatchObject({
    name: "Charmander",
    types: "fire",
    role: "Dps",
    habitats: "grass / mountain",
    status: "Burn",
  });
  expect(starterCardView("mudkip")).toMatchObject({
    name: "Mudkip",
    types: "water",
  });
});
```

- [ ] **Step 2: Run the presentation test and verify RED**

Run:

```bash
npx vitest run tests/starters.test.ts
```

Expected: FAIL because `starterCardView` is not exported.

- [ ] **Step 3: Implement card metadata and generation tabs**

Add this view model to `starterScreen.ts`:

```ts
export interface StarterCardView {
  id: string;
  name: string;
  sprite: string;
  types: string;
  role: string;
  habitats: string;
  damage: string;
  status: string;
  description: string;
}

export function starterCardView(speciesId: string): StarterCardView {
  const species = getSpecies(speciesId);
  const dps = species.base.damage / species.base.cooldown;
  return {
    id: species.id,
    name: species.name,
    sprite: spriteUrl(species.dex),
    types: species.types.join(" / "),
    role: species.role.replace("_", " ").replace(/^./, (character) => character.toUpperCase()),
    habitats: species.allowedTerrain.join(" / "),
    damage: dps >= 24 ? "High direct damage" : dps >= 14 ? "Balanced direct damage" : "Status-focused damage",
    status: species.onHitStatus
      ? species.onHitStatus.kind.replace("armorBreak", "Armor break").replace(/^./, (character) => character.toUpperCase())
      : "Direct damage",
    description: species.description,
  };
}
```

Render a `role="tablist"` containing nine generation buttons.
Track `activeGeneration = 1`, set `aria-selected`, render only the active group's cards, and focus the new tab after `ArrowLeft`, `ArrowRight`, `Home`, or `End` input.
Keep the existing click handler that creates one owned Pokemon, grants 500 Pokecoins, and resolves the screen.

- [ ] **Step 4: Add responsive tab and card styles**

Add `.starter-tabs`, `.starter-tab`, `.starter-details`, and `.starter-traits` rules to `src/styles.css`.
Use a horizontally scrollable tab row, a three-column desktop card grid, a two-column grid below 640 pixels, 88-pixel sprites on mobile, and visible `:focus-visible` outlines.
Do not add animation to tab changes.

- [ ] **Step 5: Verify unit and browser behavior**

Run:

```bash
npx vitest run tests/starters.test.ts tests/save.test.ts
npm run lint
npm run build
npm run dev -- --host 127.0.0.1
```

Verify at 1440 by 900 and 390 by 844:

- All nine generation tabs are reachable by keyboard.
- Generation 1 initially shows four cards including Pikachu.
- Generation 9 shows Sprigatito, Fuecoco, and Quaxly.
- Cards show types, role, habitat, damage identity, and status identity.
- Choosing Quaxly creates the collection entry and grants 500 Pokecoins exactly once.
- The mobile screen has two columns without clipped text or horizontal page overflow.
- The browser console has no warnings or errors.

- [ ] **Step 6: Commit and push Stage 2**

```bash
git add src/ui/screens/starterScreen.ts src/styles.css tests/starters.test.ts
git commit -m "feat: add responsive generation starter picker"
git push
```

---

## Stage 3: Expanded Status Engine and Specialists

### Task 5: Deterministic Status Lifecycles

**Files:**
- Modify: `src/types.ts`
- Modify: `src/engine/status.ts`
- Modify: `tests/status.test.ts`

**Interfaces:**
- Produces: expanded `StatusKind` with `toxic`, `paralysis`, `freeze`, `sleep`, and `confusion`.
- Produces: `StatusEventKind = "toxic" | "confusion" | "thaw" | "wake" | "recover"`.
- Produces: `StatusTickResult { damage: number; events: StatusEventKind[] }`.
- Produces: `StatusSet.tick(dt: number, boss?: boolean): StatusTickResult`.
- Produces: `StatusSet.afterDirectHit(attackType: TypeName): StatusEventKind[]`.
- Produces: `StatusSet.active(): ActiveStatus[]`.
- Produces: `StatusSet.speedFactor(boss?: boolean): number`.

- [ ] **Step 1: Replace status tests with explicit lifecycle contracts**

Add focused tests to `tests/status.test.ts` for these exact behaviors:

```ts
it("applies burn, poison, toxic growth, and curse status amplification", () => {
  const steady = new StatusSet();
  steady.apply("burn", 3, 4);
  steady.apply("poison", 2, 6);
  expect(steady.tick(1).damage).toBe(10);

  const toxic = new StatusSet();
  toxic.apply("toxic", 5, 3);
  expect(toxic.tick(1).damage).toBe(6);
  expect(toxic.tick(1).damage).toBe(9);

  const cursed = new StatusSet();
  cursed.apply("curse", 2, 0.35);
  cursed.apply("burn", 2, 10);
  expect(cursed.tick(1).damage).toBeCloseTo(13.5);
});

it("implements deterministic paralysis, freeze, sleep, and confusion", () => {
  const status = new StatusSet();
  status.apply("paralysis", 3, 0.5);
  expect(status.speedFactor()).toBe(0);
  status.tick(0.2);
  expect(status.speedFactor()).toBe(0.5);
  status.apply("freeze", 2, 1);
  expect(status.speedFactor()).toBe(0);
  expect(status.afterDirectHit("fire")).toContain("thaw");
  status.apply("sleep", 3, 1);
  expect(status.afterDirectHit("water")).toContain("wake");
  status.apply("confusion", 3, 5);
  expect(status.tick(1).damage).toBe(5);
});

it("halves boss hard-control duration and caps boss toxic growth", () => {
  const status = new StatusSet();
  status.apply("freeze", 4, 1, true);
  expect(status.get("freeze")?.remaining).toBe(2);
  status.apply("toxic", 20, 10, true);
  for (let second = 0; second < 10; second++) {
    expect(status.tick(1, true).damage).toBeLessThanOrEqual(30);
  }
});
```

- [ ] **Step 2: Run status tests and verify RED**

Run:

```bash
npx vitest run tests/status.test.ts
```

Expected: FAIL because the new status kinds and structured tick result do not exist.

- [ ] **Step 3: Implement the expanded status model**

Update `StatusKind` in `src/types.ts` and extend `ActiveStatus` with `elapsed: number`.
Use these constants in `src/engine/status.ts`:

```ts
const HARD_CONTROL = new Set<StatusKind>(["freeze", "sleep", "stun"]);
const PARALYSIS_PERIOD = 1.25;
const PARALYSIS_STOP = 0.18;
const CONFUSION_PERIOD = 1;
const CONFUSION_STOP = 0.15;
const TOXIC_CAP = 5;
const BOSS_TOXIC_CAP = 3;
```

Change `apply` to accept `boss = false`, halve freeze, sleep, and stun durations for bosses, and retain the stronger magnitude and longer duration on reapplication.
Implement `tick` so it advances elapsed time before calculating damage, burn and poison deal steady DPS, toxic uses `magnitude * min(1 + floor(elapsed), cap)`, confusion emits one magnitude pulse per crossed one-second boundary, and curse multiplies all status damage by `1 + magnitude`.
Implement `speedFactor(boss = false)` with this precedence: freeze, sleep, or stun returns zero; paralysis returns zero during the first 0.18 seconds of each 1.25-second period for ordinary enemies and the first 0.09 seconds for bosses, then returns 0.5; confusion returns zero during the first 0.15 seconds of each second; slow applies its normal multiplier last.
Implement `afterDirectHit` so Fire removes freeze, every direct hit removes sleep after damage, and the returned events are `thaw` and `wake` respectively.

- [ ] **Step 4: Run status tests and verify GREEN**

Run:

```bash
npx vitest run tests/status.test.ts
```

Expected: PASS for every lifecycle, refresh, interaction, and boss rule.

- [ ] **Step 5: Commit the status core**

```bash
git add src/types.ts src/engine/status.ts tests/status.test.ts
git commit -m "feat: expand deterministic status lifecycles"
```

### Task 6: Status Combat Integration

**Files:**
- Modify: `src/engine/enemy.ts`
- Modify: `src/engine/game.ts`
- Modify: `src/engine/abilities.ts`
- Modify: `tests/abilities.test.ts`
- Modify: `tests/enemies.test.ts`

**Interfaces:**
- Consumes: structured status APIs from Task 5.
- Produces: `Enemy.applyStatus(application: StatusApplication): void`.
- Produces: `Enemy.afterDirectHit(attackType: TypeName): StatusEventKind[]`.
- Produces: `Enemy.drainStatusEvents(): StatusEventKind[]`.

- [ ] **Step 1: Write failing combat-transition tests**

Add these imports, helper, and test to `tests/enemies.test.ts`:

```ts
import { Enemy } from "../src/engine/enemy";
import { PathGeometry } from "../src/engine/path";

function createTestEnemy(boss = false): Enemy {
  const map = MAPS[0]!;
  return new Enemy(
    getEnemy("rattata"),
    { hp: 100, speed: 1, armor: 0, reward: 5, heartDamage: 1, boss },
    new PathGeometry(map),
  );
}

it("wakes sleep and thaws freeze only after direct damage", () => {
  const enemy = createTestEnemy();
  enemy.applyStatus({ kind: "sleep", chance: 1, duration: 3, magnitude: 1 });
  enemy.applyStatus({ kind: "freeze", chance: 1, duration: 3, magnitude: 1 });
  expect(enemy.afterDirectHit("water")).toEqual(["wake"]);
  expect(enemy.status.has("freeze")).toBe(true);
  expect(enemy.afterDirectHit("fire")).toEqual(["thaw"]);
  expect(enemy.status.has("freeze")).toBe(false);
});
```

Add this boss-normalization test to `tests/enemies.test.ts`:

```ts
it("normalizes hard control when status is applied to a boss", () => {
  const boss = createTestEnemy(true);
  boss.applyStatus({ kind: "freeze", chance: 1, duration: 4, magnitude: 1 });
  expect(boss.status.get("freeze")?.remaining).toBe(2);
});
```

Add this game-level case to `tests/abilities.test.ts` so the real kill and reward path is exercised:

```ts
it("awards status kills exactly once", () => {
  const { game, tower } = setup("charmander");
  const enemy = addEnemy(game, tower.pos.x + 20, tower.pos.y, 1);
  tower.cooldownLeft = 999;
  enemy.applyStatus({ kind: "burn", chance: 1, duration: 2, magnitude: 2 });
  const gold = game.gold;

  game.update(1);

  expect(game.gold).toBe(gold + enemy.reward);
  expect(tower.runXp).toBe(3);
  game.update(1);
  expect(game.gold).toBe(gold + enemy.reward);
});
```

- [ ] **Step 2: Run enemy and ability tests and verify RED**

Run:

```bash
npx vitest run tests/enemies.test.ts tests/abilities.test.ts
```

Expected: FAIL because the enemy transition methods and structured tick integration do not exist.

- [ ] **Step 3: Implement enemy-owned status normalization**

In `src/engine/enemy.ts`, add:

```ts
private statusEvents: StatusEventKind[] = [];

applyStatus(application: StatusApplication): void {
  this.status.apply(application.kind, application.duration, application.magnitude, this.isBoss);
}

afterDirectHit(attackType: TypeName): StatusEventKind[] {
  const events = this.status.afterDirectHit(attackType);
  this.statusEvents.push(...events);
  return events;
}

drainStatusEvents(): StatusEventKind[] {
  return this.statusEvents.splice(0);
}
```

Update `Enemy.update` to consume `StatusTickResult`, subtract its damage, append its events, call `status.speedFactor(this.isBoss)`, and retain regeneration and path movement behavior.

- [ ] **Step 4: Route every status application through Enemy**

In `src/engine/game.ts`, replace direct `target.status.apply` calls with `target.applyStatus`.
After `resolveHit`, call `target.afterDirectHit(projectile.attackType)` only when direct damage was dealt.
Translate `wake`, `thaw`, `toxic`, and `confusion` events into floating labels.
Detect enemies killed during `Enemy.update` and call `onKill` exactly once before culling.

In `src/engine/abilities.ts`, change the status helper to call `enemy.applyStatus(status)`.

- [ ] **Step 5: Run focused and full tests and verify GREEN**

Run:

```bash
npx vitest run tests/status.test.ts tests/enemies.test.ts tests/abilities.test.ts
npm test
```

Expected: PASS with deterministic status kills, rewards, wake, thaw, and boss scaling.

- [ ] **Step 6: Commit combat integration**

```bash
git add src/engine/enemy.ts src/engine/game.ts src/engine/abilities.ts tests/enemies.test.ts tests/abilities.test.ts
git commit -m "feat: integrate statuses with deterministic combat"
```

### Task 7: Roster-Wide Combat Profiles and Starter Kits

**Files:**
- Create: `src/data/starterKits.ts`
- Modify: `src/types.ts`
- Modify: `src/data/species.ts`
- Modify: `src/data/speciesDerivation.ts`
- Modify: `tests/species.test.ts`
- Modify: `tests/starters.test.ts`

**Interfaces:**
- Produces: `CombatProfile = "damage" | "balanced" | "status"`.
- Adds: `SpeciesDef.combatProfile: CombatProfile`.
- Produces: `deriveCombatProfile(record: CanonicalPokemon, attackType: TypeName, role: Role): CombatProfile`.
- Produces: `deriveStatusKit(record: CanonicalPokemon, attackType: TypeName, profile: CombatProfile): StatusApplication | undefined`.
- Produces: `applyStarterKit(species: SpeciesDef): SpeciesDef`.

- [ ] **Step 1: Write failing profile and tradeoff tests**

Add to `tests/species.test.ts`:

```ts
it("assigns deterministic combat profiles and status-specialist tradeoffs", () => {
  expect(getSpecies("charmander").combatProfile).toBe("balanced");
  expect(getSpecies("vulpix").combatProfile).toBe("status");
  expect(getSpecies("vulpix").onHitStatus?.kind).toBe("burn");
  expect(getSpecies("salandit").combatProfile).toBe("status");
  expect(["poison", "toxic"]).toContain(getSpecies("salandit").onHitStatus?.kind);
  expect(getSpecies("mareep").onHitStatus?.kind).toBe("paralysis");
  expect(getSpecies("smoochum").onHitStatus?.kind).toBe("freeze");
  expect(SPECIES.filter((species) => species.combatProfile === "status").length).toBeGreaterThan(100);
  expect(SPECIES.every((species) => species.combatProfile !== "status" || species.onHitStatus)).toBe(true);
  expect(getSpecies("vulpix").base.damage).toBe(10);
});
```

Extend `tests/starters.test.ts` with this exact invariant:

```ts
it("gives every starter an understandable combat identity", () => {
  for (const id of STARTER_IDS) {
    const species = getSpecies(id);
    expect(["damage", "balanced", "status"]).toContain(species.combatProfile);
    expect(species.combatProfile === "status" ? species.onHitStatus : true).toBeTruthy();
  }
});
```

- [ ] **Step 2: Run species and starter tests and verify RED**

Run:

```bash
npx vitest run tests/species.test.ts tests/starters.test.ts
```

Expected: FAIL because `combatProfile`, new status mappings, and starter kit application do not exist.

- [ ] **Step 3: Implement deterministic profile classification**

In `speciesDerivation.ts`, classify supported status types as `status` when special attack is at least 10 percent higher than physical attack, the role is `support`, or base speed is at most 65.
Classify remaining species with an ordinary status kit as `balanced` and species without a kit as `damage`.
Apply a `0.75` direct-damage multiplier only to `status` profiles.
Define `SpeciesTemplate` as `Omit<SpeciesDef, "combatProfile"> & { combatProfile?: CombatProfile }`, type `CURATED_SPECIES` with it, and accept it as the optional `deriveSpecies` override.
When a curated override omits `combatProfile`, normalize it to `balanced` when `onHitStatus` exists and `damage` otherwise before returning the required `SpeciesDef`.

Use these status kits:

```ts
const STATUS_KITS: Partial<Record<TypeName, Record<"balanced" | "status", StatusApplication>>> = {
  fire: {
    balanced: { kind: "burn", chance: 0.22, duration: 2.5, magnitude: 4 },
    status: { kind: "burn", chance: 0.48, duration: 4, magnitude: 7 },
  },
  poison: {
    balanced: { kind: "poison", chance: 0.28, duration: 3, magnitude: 5 },
    status: { kind: "toxic", chance: 0.42, duration: 6, magnitude: 3 },
  },
  electric: {
    balanced: { kind: "paralysis", chance: 0.16, duration: 1.8, magnitude: 0.5 },
    status: { kind: "paralysis", chance: 0.35, duration: 3, magnitude: 0.5 },
  },
  ice: {
    balanced: { kind: "slow", chance: 0.3, duration: 2, magnitude: 0.3 },
    status: { kind: "freeze", chance: 0.2, duration: 1.4, magnitude: 1 },
  },
  psychic: {
    balanced: { kind: "confusion", chance: 0.2, duration: 2, magnitude: 4 },
    status: { kind: "sleep", chance: 0.18, duration: 2.5, magnitude: 1 },
  },
  ghost: {
    balanced: { kind: "curse", chance: 0.2, duration: 3, magnitude: 0.25 },
    status: { kind: "confusion", chance: 0.35, duration: 4, magnitude: 6 },
  },
  fairy: {
    balanced: { kind: "confusion", chance: 0.18, duration: 2.5, magnitude: 4 },
    status: { kind: "sleep", chance: 0.16, duration: 3, magnitude: 1 },
  },
};
```

Retain armor break for Fighting and Ground, curse for Dark, and slow for existing curated Grass, Water, Bug, and Flying control kits.

- [ ] **Step 4: Apply starter-specific exceptions without editing generated data**

Create `src/data/starterKits.ts` with `applyStarterKit`.
Return cloned definitions for the 28 starter IDs and leave every other definition unchanged.
Preserve existing Gen 1 tuned definitions.
Give non-curated Grass starters a balanced slow kit, Fire starters a balanced burn kit, Water starters a balanced slow kit, Rowlet a confusion kit, Froakie a slow kit, and Pikachu its curated paralysis kit.
Set every starter's deployment cost between 80 and 90 gold so every approved first choice is usable under the same opening economy.

- [ ] **Step 5: Run roster invariants and verify GREEN**

Run:

```bash
npx vitest run tests/species.test.ts tests/starters.test.ts tests/generator.test.ts
npm run data:check
```

Expected: PASS with 1,025 unique species, 28 valid starters, deterministic profiles, and no generated-file changes.

- [ ] **Step 6: Commit profile derivation**

```bash
git add src/data/starterKits.ts src/types.ts src/data/species.ts src/data/speciesDerivation.ts tests/species.test.ts tests/starters.test.ts
git commit -m "feat: derive roster-wide status specialist kits"
```

### Task 8: Status Presentation and Accessibility

**Files:**
- Create: `src/ui/statusPresentation.ts`
- Create: `tests/statusPresentation.test.ts`
- Modify: `src/ui/gameScreen.ts`
- Modify: `src/ui/screens/starterScreen.ts`
- Modify: `src/engine/render/renderer.ts`
- Modify: `src/styles.css`

**Interfaces:**
- Produces: `StatusPresentation`.
- Produces: `STATUS_PRESENTATION: Record<StatusKind, StatusPresentation>`.
- Produces: `statusSummary(application: StatusApplication): string`.

- [ ] **Step 1: Write failing presentation coverage**

Create `tests/statusPresentation.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { STATUS_PRESENTATION, statusSummary } from "../src/ui/statusPresentation";
import type { StatusKind } from "../src/types";

const KINDS: StatusKind[] = [
  "slow", "poison", "burn", "toxic", "paralysis", "freeze",
  "sleep", "confusion", "stun", "armorBreak", "curse",
];

describe("status presentation", () => {
  it("defines a visible identity for every status kind", () => {
    expect(Object.keys(STATUS_PRESENTATION).sort()).toEqual([...KINDS].sort());
    for (const kind of KINDS) {
      expect(STATUS_PRESENTATION[kind].label.length).toBeGreaterThan(2);
      expect(STATUS_PRESENTATION[kind].icon.length).toBeGreaterThan(0);
      expect(STATUS_PRESENTATION[kind].color).toMatch(/^#/);
    }
  });

  it("describes chance, duration, and effect", () => {
    expect(statusSummary({ kind: "burn", chance: 0.3, duration: 4, magnitude: 7 }))
      .toBe("Burn · 30% chance · 4.0s · 7 damage per second");
  });
});
```

- [ ] **Step 2: Run the presentation test and verify RED**

Run:

```bash
npx vitest run tests/statusPresentation.test.ts
```

Expected: FAIL because the presentation module does not exist.

- [ ] **Step 3: Implement the complete status presentation map**

Create `src/ui/statusPresentation.ts` with one `label`, one-character `icon`, hex `color`, and plain-language `effect` formatter for each status kind.
Use `🔥`, `☠`, `♨`, `⚡`, `❄`, `Z`, `?`, `▼`, `✦`, `◇`, and `✧` as the eleven compact icons.
Format percentages with whole numbers and durations with one decimal place.

- [ ] **Step 4: Render status identities in the game**

In `renderer.ts`, iterate `enemy.status.active()` and render up to five 13-pixel status chips centered above the health bar.
Use the presentation color as the chip background and the icon as white centered text.
Keep chips above bosses and ordinary enemies without covering sprites or health bars.

In `gameScreen.ts`, add `statusSummary(t.species.onHitStatus)` below the selected tower's combat stats.
In `starterScreen.ts`, replace raw status-kind formatting with `STATUS_PRESENTATION[kind].label`.
Add `.tower-status` and `.status-chip` styles with readable contrast and visible wrapping on mobile.

- [ ] **Step 5: Run presentation, renderer, and UI tests and verify GREEN**

Run:

```bash
npx vitest run tests/statusPresentation.test.ts tests/mapTiles.test.ts tests/starters.test.ts
npm run lint
npm run build
```

Expected: PASS with presentation coverage for all eleven statuses.

- [ ] **Step 6: Commit status presentation**

```bash
git add src/ui/statusPresentation.ts tests/statusPresentation.test.ts src/ui/gameScreen.ts src/ui/screens/starterScreen.ts src/engine/render/renderer.ts src/styles.css
git commit -m "feat: show status identities in battle"
```

### Task 9: Balance, Documentation, Production, and Stage Completion

**Files:**
- Modify: `tests/balance.test.ts`
- Modify: `README.md`
- Modify: `HANDOFF.md`

**Interfaces:**
- Consumes: every completed Stage 3 domain and UI interface.
- Produces: deterministic specialist-team balance assertions and final operational documentation.

- [ ] **Step 1: Write failing specialist balance assertions**

Add a status-specialist team to `tests/balance.test.ts` containing Vulpix, Salandit, Magnemite, Smoochum, Drowzee, and Gastly at good IVs and level 12.
Assert it reaches at least wave 35 on all nine routes for the fixed seeds.
Assert two runs with the same map, team, and seed return identical waves cleared.
Keep the existing lone-starter and maxed endgame bands unchanged.

- [ ] **Step 2: Run balance tests and record the new regression result**

Run:

```bash
npx vitest run tests/balance.test.ts
```

Expected: PASS if the fixed specialist parameters already meet the approved band, or FAIL with the exact route and waves-cleared result that needs tuning.
When the assertions pass without production changes, retain them as a regression gate and skip Step 3.

- [ ] **Step 3: Tune status magnitude without changing structural rules**

Adjust only `STATUS_KITS` chances, durations, magnitudes, the specialist direct-damage multiplier within `0.70` to `0.80`, and boss caps.
Do not change route wave counts, milestone pools, capture rates, starter grants, or redeployment rules.
Re-run the balance test after each single tuning change until all established and new bands pass deterministically.

- [ ] **Step 4: Update user and handoff documentation**

In `README.md`, document:

- Free 5-second-cooldown redeployment with mouse and keyboard controls.
- All 28 generation-grouped starter choices.
- All eleven status effects and the status-specialist direct-damage tradeoff.
- Boss control resistance and deterministic status behavior.

In `HANDOFF.md`, record the final test count, coverage percentages, balance bands, browser viewports, Vercel deployment ID, and the three stage commit hashes.
Keep every full Markdown sentence on its own physical line.

- [ ] **Step 5: Run the complete local quality gate**

Run:

```bash
npm ci
npm run lint
npm run test:coverage
npm run build
git diff --check
```

Expected: all commands PASS, all four coverage metrics remain at or above 95 percent, and the working diff has no whitespace errors.

- [ ] **Step 6: Perform production-like browser verification**

Run:

```bash
npm run preview -- --host 127.0.0.1
```

Verify at 1440 by 900 and 390 by 844:

- Select a Generation 9 starter on a fresh profile.
- Deploy and redeploy during an active wave using mouse input.
- Redeploy with `Q`, `E`, `Enter`, and cancel with `Escape`.
- Observe the 5-second attack and ability lockout.
- Observe burn, poison or toxic, paralysis, freeze, sleep, and confusion indicators.
- Confirm Fire direct damage thaws freeze and direct damage wakes sleep.
- Confirm boss hard control ends sooner than ordinary-enemy control.
- Confirm focus states, touch targets, status text, and the two-column mobile starter grid remain readable.
- Confirm zero browser warnings or errors.

- [ ] **Step 7: Deploy and smoke-test Vercel production**

Run from the linked project directory:

```bash
vercel --prod --yes
vercel inspect tower-defense-navy.vercel.app
curl -sS -I https://tower-defense-navy.vercel.app/
curl -sS -I https://tower-defense-navy.vercel.app/maps/route-tileset.png
curl -sS -I https://tower-defense-navy.vercel.app/sprites/1.png
```

Expected: deployment status `Ready`, the production alias returns HTTP 200, and map and sprite assets retain `public, max-age=31536000, immutable` caching.
Repeat the fresh-profile starter and one active-wave redeployment smoke test on the production alias.

- [ ] **Step 8: Commit and push Stage 3**

```bash
git add tests/balance.test.ts README.md HANDOFF.md
git commit -m "feat: balance and ship status specialists"
git push
```

- [ ] **Step 9: Verify remote quality checks**

Run:

```bash
gh run list --branch feat/gen-1-3-overhaul --workflow Quality --limit 1
gh run watch --exit-status
git status --short
git rev-list --left-right --count '@{upstream}...HEAD'
```

Expected: Lint, Test, Build, and SonarCloud complete successfully, the working tree is clean, and upstream divergence is `0 0`.

---

## Final Acceptance Checklist

- [ ] Mid-wave redeployment is free, state-preserving, terrain-safe, and cooldown-limited.
- [ ] Mouse, keyboard, and mobile redeployment flows are verified.
- [ ] The starter picker contains exactly 28 unique approved species across nine generation tabs.
- [ ] Every approved status has deterministic unit coverage and visible presentation.
- [ ] Status specialists have a measured 20 to 30 percent direct-DPS tradeoff.
- [ ] Boss and milestone hard-control resistance and toxic caps are enforced.
- [ ] All 1,025 species and every evolution reference remain valid.
- [ ] Existing early, developed, and 100-wave endgame balance bands remain green.
- [ ] Lint, 95 percent coverage, build, browser checks, GitHub Actions, and Vercel production are green.
- [ ] Every implementation stage is committed and pushed without unrelated changes.
