# Authored Route and Milestone Capture Overhaul

## Goal

Replace the current flat, fully placeable terrain grids with nine original pixel-art routes that feel like deliberate locations rather than abstract boards.
Each route will contain 100 waves, a small set of authored deployment pads, terrain-based placement restrictions, and guaranteed first-clear milestone captures.
The visual language may take inspiration from classic top-down creature-adventure routes and PokéPath TD's battlefield composition, but the terrain artwork and route layouts must be original.

## Confirmed Product Decisions

- The game will contain nine routes presented in a three-by-three route selector.
- Every route will contain 100 waves.
- Waves 25, 50, 75, and 100 are milestone encounters.
- The first clear of wave 25 grants a random rare Pokémon.
- The first clear of wave 50 grants a random high-stat or pseudo-legendary Pokémon.
- The first clear of wave 75 grants a random mythical Pokémon.
- The first clear of wave 100 grants a random legendary Pokémon and completes that route.
- Repeating a cleared milestone grants a 20 percent chance of another Pokémon from that milestone pool with newly rolled IVs.
- Only authored deployment pads are placeable.
- Each pad has a habitat type, and a Pokémon can only use pads included in its allowed terrain list.
- PokéAPI remains the source for local Pokémon sprites and development-time species metadata only.
- PokéAPI will not be treated as a source for terrain, building, vegetation, water, fence, cliff, path, or complete map art because those assets are not present there.

## Chosen Approach

The implementation will use an original pixel-art tile atlas rendered by the canvas engine and nine map files stored as Tiled JSON exports.
A small validated loader will translate Tiled tile layers, decor object layers, path waypoints, and deployment-pad objects into the existing `MapConfig` runtime shape.
This keeps the existing Vite and TypeScript architecture intact, avoids runtime network requests, and gives the project a visual map-authoring workflow without putting Tiled-specific concerns into the engine.

Two alternatives were rejected.
A single full-map background per route would look rich quickly but would make responsive scaling, pad highlighting, and iterative route edits brittle.
Using ripped game tiles would be visually familiar but would create licensing risk and would not satisfy the requirement for original artwork.

## Visual Direction

The map art will use crisp 16-bit-inspired pixel shapes, a fixed nearest-neighbor scale, and restrained animation.
The palette will use Moss `#4f8f5b`, Meadow `#79bd68`, Sand `#d7bd72`, Water `#4f91bd`, Stone `#736f68`, and Ink `#182536` as the core shared colors.
Each biome may derive lighter and darker shades from those colors, but it must remain part of the same visual family.

The signature visual element will be the habitat pad.
Each pad will look embedded in the world rather than overlaid as a generic square: grass pads are trimmed clearings, water pads are stepping stones or lily platforms, and mountain pads are carved stone plinths.
Hover and selection states will add a readable outline and terrain glyph without obscuring the map art.

Routes will include original combinations of paths, water, elevation, fences, shrubs, flowers, rocks, signs, ruins, and small structures.
Decor is non-interactive and will never obscure enemies, towers, deployment pads, health bars, or the path.
Path entrances and exits will be visually unambiguous.

## Route Set and Progression

The existing route IDs will remain stable so current saves continue to work.
Five routes will be added for a total of nine.

1. `verdant_route` is a forgiving meadow route with grass-heavy pads and a central pond.
2. `river_crossing` is a water-split route with island and shoreline pads.
3. `granite_cave` is a rocky switchback route with mountain-heavy pads and narrow sight lines.
4. `ember_caldera` is a volcanic route with stone pads around lava channels.
5. `frostbound_lake` is an icy lake route with shoreline, island, and ridge pads.
6. `shadow_marsh` is a misty wetland route with constrained dry ground and spectral enemies.
7. `skygarden_ruins` is an elevated ruin route with broken walls and long firing lanes.
8. `ancient_sanctuary` is a mixed-terrain temple route that demands a varied team.
9. `indigo_plateau` remains the final route and becomes a championship gauntlet using all three pad habitats.

Routes unlock in order when the previous route reaches wave 25.
This gives players access to new scenery and enemy pools without requiring a full 100-wave clear, while the strongest milestone captures remain long-term goals.
Existing progress above the new threshold unlocks the appropriate routes immediately.

The route selector will show an original pixel-art thumbnail, route name, best wave out of 100, milestone medallions, habitat mix, and locked requirement.
The selected route will show its description and a clear action to configure the team.
Desktop uses a three-by-three grid, while small screens use a single scrollable column with the same information.

## Map Data Model

`MapConfig` will gain a `theme`, a tile layer, a decor layer, and explicit deployment pads.
The current terrain grid remains the authoritative habitat lookup, but it will be authored per cell instead of created from row bands.

Each deployment pad contains a stable ID, column, row, and habitat.
The map invariant is that each pad is inside the board, is not on the enemy path, has a matching terrain value, and does not overlap another pad.
No cell without a deployment pad can accept a tower.

Tile and decor identifiers will refer to an original atlas committed under `public/maps/` with its matching Tiled tileset definition.
The atlas will include ground variants, path edges and corners, water edges, cliffs, fences, shrubs, flowers, rocks, signs, structures, and the three habitat-pad families.
The map files and atlas will be loaded locally, and tests will ensure every referenced tile and object type is defined.

## Placement Behavior

Placement validation will occur in this order: board bounds, authored pad existence, pad occupancy, Pokémon habitat compatibility, and gold affordability.
Error text will identify the actionable reason, such as `Only marked habitat pads can hold Pokémon` or `Lapras needs a water pad`.

When a team member is selected, compatible open pads will glow softly and incompatible pads will remain visible with a muted blocked glyph.
Hovering a pad will show its habitat and whether the selected Pokémon can use it.
Selecting a deployed Pokémon will preserve the existing range preview and tower controls.

Headless simulations will choose from compatible authored pads rather than scanning every open board cell.
Every route must expose enough pads for a full ten-member team, with at least four grass pads, three water pads, and three mountain pads across mixed-terrain endgame routes.
Biome-specialist routes may use a different mix but must still support at least two habitats so team building remains meaningful.

## One-Hundred-Wave Structure

Regular scaling remains procedural and deterministic for a run seed.
The 100-wave curve will be split into four acts so enemy health does not grow exponentially without relief.
Each act introduces harder archetypes and ends in a milestone encounter.

- Waves 1 through 24 teach the route's main enemy and terrain pattern.
- Wave 25 is a rare special encounter.
- Waves 26 through 49 add armor, regeneration, speed, or status pressure.
- Wave 50 is a high-stat or pseudo-legendary encounter.
- Waves 51 through 74 mix counters and elite formations.
- Wave 75 is a mythical encounter.
- Waves 76 through 99 form the final endurance act.
- Wave 100 is a legendary route finale.

Every tenth wave remains a boss wave, but waves 25, 50, 75, and 100 use explicit milestone definitions and take precedence over the normal boss rotation.
Milestone species are chosen deterministically from the route-specific eligible pool for the active run seed.
The enemy shown in the milestone wave is the Pokémon eligible for capture when that wave is cleared.

## Capture and Save Behavior

Milestone captures create an `OwnedPokemon` directly rather than granting an egg.
The captured Pokémon receives normal newly rolled IVs and begins at the same baseline collection level as a hatch.
The result screen shows the captured Pokémon, tier, IVs, and whether it was guaranteed or a repeat-clear bonus.

First-clear guarantees are tracked per route and milestone.
The existing numeric egg-drop claim marker will be migrated into a new milestone-capture record without discarding old save data.
Previously completed milestones count as claimed so existing players do not receive duplicate guaranteed rewards simply by loading the migration.
Future clears perform the 20 percent repeat roll independently for each milestone reached during that run.

The four capture pools are derived from canonical species metadata plus curated exclusions and overrides.
The rare pool contains uncommon non-legendary and non-mythical species.
The power pool contains pseudo-legendary lines and other curated high-base-stat non-legendary species.
The mythical pool contains only canonical mythical species.
The legendary pool contains only canonical legendary species.
Default forms remain the only supported forms in this release.

## Rendering and Accessibility

The battlefield stays canvas-based and uses the current board dimensions.
The renderer will draw layers in this order: base ground, water and elevation, path, world decor, deployment pads, combat effects, enemies, towers, and HUD overlays.
Pixel art uses integer coordinates and disables image smoothing.

Pad states will not rely on color alone.
Compatible, incompatible, occupied, selected, and hovered states each receive a distinct border or glyph.
Keyboard controls will allow cycling compatible pads while a team member is selected, and visible focus remains on all DOM controls.
Reduced-motion mode disables ambient water shimmer and vegetation movement while retaining necessary combat feedback.

## Testing Strategy

Development will follow red, green, refactor for every behavioral change.
Map invariant tests will cover nine unique IDs, 100 waves, valid tile dimensions, path safety, pad uniqueness, terrain consistency, and a viable habitat mix.
Placement tests will prove that non-pad cells fail, compatible pads succeed, incompatible pads fail with a useful reason, and occupied pads fail.
Wave tests will prove that milestone encounters take precedence at 25, 50, 75, and 100 and that ordinary boss behavior remains intact.
Capture tests will prove first-clear guarantees, repeat-clear 20 percent boundaries, fresh IV rolls, pool correctness, idempotent result application, and save migration.
Simulation tests will cover early, developed, and endgame teams across every route without requiring all nine 100-wave simulations in every fast unit-test run.

Browser verification will cover route selection, locked and unlocked cards, compatible-pad highlighting, blocked placement feedback, a controlled milestone capture, result presentation, desktop layout at 1440 by 900, and mobile layout at 390 by 844.
The final gate is `npm test`, `npx tsc --noEmit`, and `npm run build`, followed by a Vercel preview smoke test.

## Delivery Stages

Stage 1 adds the authored route schema, nine route definitions, route selector, original canvas tile catalog, and limited habitat pads.
Stage 2 adds 100-wave act scaling, milestone encounters, guaranteed and repeat capture behavior, save migration, and result presentation.
Stage 3 completes balance simulation, browser polish, accessibility checks, production deployment, and documentation updates.
Each stage receives its own verified commit and push, as requested.
Repository governance, GitHub Actions, SonarCloud, and branch protection remain a separate subsequent design and implementation stage because they are operationally independent from gameplay.

## Out of Scope

- Ripped or redistributed map tiles from commercial Pokémon games are not included.
- PokéAPI map imagery is not included because PokéAPI does not provide it.
- Alternate forms, Mega Evolutions, Dynamax, Terastallization, and breeding are not part of this overhaul.
- Installing the Tiled desktop application is not required at runtime or in CI because committed JSON exports are the build inputs.
- Multiplayer and cloud saves are not part of this overhaul.
