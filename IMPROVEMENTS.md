# Improvements Tracker

This file tracks known gaps, missing features, and planned improvements.
The reference point for several items is PokePath TD, which does many presentation and information-density things better than we currently do.
Items are grouped by area and tagged P0 (core experience, do first), P1 (high value), or P2 (nice to have).

## 1. Map and board art (the biggest gap)

The current boards read as flat, noisy, and repetitive next to the reference game.
Root causes are structural, not just per-map authoring effort.

- [x] P0: Replace per-tile baked-edge path art with real autotiling. **Done 2026-07-19.**
  Path tiles baked a fringe into all four sides, so corridors rendered as rows of disconnected squares.
  [tools/extend-tileset.mjs](tools/extend-tileset.mjs) now appends a 16-variant Wang set per authored path material (dirt, stone, brick, crossing) below the original 64 tiles, which are copied through byte-for-byte.
  Variants are transparent outside the road body, so they composite over each route's own ground and every biome is preserved.
  The arm-clipping hack (`AUTO_CONNECTED_PATH_TILE_IDS`, `drawConnectedPathTile`) is gone.
  Water autotiling was deliberately **not** applied: the authored ground layer already carries good textured water, and the habitat layer disagrees with it in places, so autotiling from habitat both flattens the texture and invents stray puddles. See item below.
- [ ] P0: Add elevation and cliffs.
  The reference maps get most of their depth from two ground planes: grass below, pale stone plateaus above, joined by rounded cliff and ledge tiles.
  We have zero elevation vocabulary; every board is a single flat plane.
- [ ] P0: Add ground-tone variation.
  One uniform bright green fills every grass region.
  The reference alternates two or three grass tones plus tall-grass patches and flower clusters, which is what makes large open areas readable.
- [ ] P1: Grow the atlas.
  The authored atlas vocabulary is still a single 8x8 grid (64 tiles at 48px); the generated 8x16 [route-tileset.png](public/maps/route-tileset.png) only adds connected variants of four existing materials.
  Roughly a fifth of the original tiles are unusable as fillers because of baked edges (see README tile notes).
  A competitive look needs a few hundred tiles: autotile sets per terrain transition, 4 to 6 tree shapes, multi-tile buildings, and per-biome decor.
  Consider authoring at 16px and composing each 48px cell from 3x3 subtiles, which makes edges and corners much finer without changing board geometry.
- [x] P1: Stop the fence spam. **Done 2026-07-19.**
  [tools/cull-fences.mjs](tools/cull-fences.mjs) trims any fence run longer than four tiles back to a short three-tile section, in both axes.
  Removed 31 of 104 segments (Verdant 64 -> 42, River Crossing 28 -> 19), which breaks the parallel striping without emptying the boards.
  Superseded note on the original problem:
  Fences currently run in long straight rows alongside nearly every path segment, which creates a striped, gridded look.
  Reserve fences for enclosing landmarks, and use terrain transitions to define the path instead.
- [x] P1: Calm down the deployment pad rendering. **Done 2026-07-19.**
  Pads no longer stamp a habitat base tile onto the board, which was painting blue water discs over grass wherever the habitat and ground layers disagree.
  Idle pads are now four subtle corner ticks with a small habitat glyph; a filled highlight appears only while a deployment or redeployment is in progress, and an occupied pad draws nothing since the tower already covers it.
  Superseded note on the original problem:
  [drawPadState](src/engine/render/mapTiles.ts) always draws bright outlined rings with terrain glyphs, and incompatible pads get a big X, so up to 16 glowing boxes sit on top of the art at all times.
  Idle pads should be subtle inset markers baked into the terrain; strong highlighting should appear only while a deployment or redeployment is in progress.
- [x] P1: Make pads honest about the habitat they accept. **Done 2026-07-20.**
  Corrects an earlier claim in this file that `terrain[][]` "drives deployment legality". It does not.
  `canPlace` gates deployment on `pad.terrain`, and the only consumer of `terrain[][]` anywhere in the codebase is the fallback in [renderer.ts](src/engine/render/renderer.ts) that paints flat colour rectangles when the atlas image fails to load.
  The genuine defect was narrower and player-facing: **79 of 138 pads sit on ground art that contradicts the habitat they accept** (a water pad on plain grass, a grass pad on stone), so a player sees grass, picks a grass Pokemon, and is refused.
  The old `pad.tile` base tile had been communicating habitat by stamping a green square / blue disc / grey square onto the board; removing it as visual noise silently removed that cue.
  Idle pad markers are now tinted and glyphed by `pad.terrain` instead, which restores the signal without stamping tiles over the artwork, and without repainting 79 cells of authored ground.
  Locked by a test asserting the three habitats render visually distinct markers.
- [ ] P2: The `habitat` layer and the `ground` layer are essentially uncorrelated.
  Nearly every ground tile appears under all three habitats across the nine routes: the bright grass tile (546 uses) sits under grass, mountain and water alike, as does the lava tile.
  This has little gameplay impact for the reasons above, but it does block water autotiling, which would invent puddles wherever the two disagree.
  Fixing it means deciding which layer is authoritative per cell and rewriting the other; the loader already enforces agreement at pad cells only.
- [ ] P2: Water needs shore transition tiles; ponds currently abut grass with a hard edge.
  Blocked on the habitat/ground reconciliation above.
- [ ] P2: The atlas source problem. `public/maps/route-tileset.svg` is a stale draft defining only ids 1-43, and no generator produces the original 64-tile authored region, so tiles 44-64 have no source in version control. The generated 65-128 range is reproducible, but the SVG should still be regenerated to match the authored source or deleted so it stops implying it is authoritative.
- [ ] P2: More landmark buildings (lab, greenhouse, gates) as multi-tile structures instead of single-tile props.
- [ ] P2: Ambient life: animated water, swaying grass, occasional wandering critters outside the play area.

## 2. In-run information density (HUD)

The topbar plus sidebar in [gameScreen.ts](src/ui/gameScreen.ts) shows lives, gold, wave number, team, and the selected tower, and nothing else.
The reference shows dramatically more decision-relevant information.

- [x] P0: Upcoming wave preview. **Done 2026-07-19.**
  [src/ui/wavePreview.ts](src/ui/wavePreview.ts) groups the next wave into one row per archetype with sprite, count, HP and armor under labelled columns, badges boss and milestone waves, and warns about spectral, regenerating, and heavily armored foes.
  Shown only during the building phase, when it can still change a decision. Covered by [tests/wavePreview.test.ts](tests/wavePreview.test.ts), including that the preview matches the wave that actually spawns for the same seed.
  Superseded note on the original problem:
  `generateWave` is deterministic per seed, so the next N waves can be computed and shown at any time (enemy sprites, counts, boss flags).
  This is cheap to build and transforms building-phase decisions.
- [x] P0: Enemy inspection panel. **Done 2026-07-19.**
  [src/ui/enemyPanel.ts](src/ui/enemyPanel.ts) shows a stat card on clicking any enemy: health, armor (flagged when broken), speed, reward, lives lost, regen, and spectral, plus plain-language notes explaining what those mechanics mean for the fight.
  Refreshes about ten times a second while a wave runs, and clears when the target dies. Covered by [tests/enemyPanel.test.ts](tests/enemyPanel.test.ts).
  Superseded note on the original problem:
  Clicking an enemy (or the wave preview) should show a stat card: HP, armor, speed, reward, heart damage, regen, and status susceptibility.
  Today `spectral` and `regen` are completely invisible to the player even though they decide fights ([targeting.ts](src/engine/targeting.ts) makes spectral enemies immune to most towers).
- [ ] P1: Live wave status: remaining enemy count and spawn progress for the current wave.
- [ ] P1: Pause and surrender controls.
  There is currently no pause and no way to end a run except dying, winning, or refreshing the page, and a refresh silently discards the entire run's rewards.
- [ ] P1: Keyboard shortcuts for wave start (Space) and speed cycling, to match the existing Q/E/Enter deployment support.
- [ ] P2: Damage-per-second or contribution stats per tower, to inform sell/upgrade decisions.
- [ ] P2: Type effectiveness feedback at deploy time (which current-route enemies this Pokemon is strong or weak against).

## 3. Gameplay systems

- [ ] P1: Multi-lane maps.
  `PathGeometry` supports exactly one polyline per map (every authored map has a single path object).
  The reference runs two simultaneous spawn queues on some maps, which is a large strategic dimension we lack.
- [ ] P1: Shop depth.
  The shop sells three egg tiers and nothing else ([shopScreen.ts](src/ui/screens/shopScreen.ts), [economy.ts](src/meta/economy.ts)).
  Candidates: consumables (potions, revives for lost lives), permanent charms (capture rate, coin gain), rare candy (collection XP), and cosmetic unlocks.
- [ ] P1: Shiny Pokemon.
  A low-probability shiny roll on hatch and capture, with a sprite tint or alternate sprite, a collection marker, and a profile counter, is a proven long-tail retention hook.
- [ ] P2: Challenge scoring per route (star objectives such as no lives lost, limited team size, or speed clears) instead of best-wave only.
  This is open question 5 in [open-questions.md](docs/design/open-questions.md).
- [ ] P2: Special enemy behaviors beyond spectral: gold stealers, healers, shielded enemies, splitters.
  The `EnemyDef` shape in [types.ts](src/types.ts) makes these easy to add and the wave generator can gate them by wave band.
- [ ] P2: Endless mode after wave 100, with leaderboard-style personal bests.
- [ ] P2: Evolution conditions beyond level thresholds (items, terrain), open question 2.

## 4. Meta screens

- [ ] P1: Player profile page.
  `save.stats` already tracks runs, waves, hatches, bosses, and victories, but almost none of it is surfaced.
  A profile screen should show lifetime stats, per-route records, and the achievement grid; consider adding time played, highest single hit, enemies defeated, and per-status application counts to `stats` (needs a save version bump per [save.ts](src/meta/save.ts)).
- [ ] P1: Collection browsing at scale.
  With 1,025 possible species, [collectionScreen.ts](src/ui/screens/collectionScreen.ts) needs search, sort (level, rarity, dex, recency), and filters (type, terrain, role) rather than a flat grid.
  The reference's team manager has search plus terrain filter tabs and favorites.
- [ ] P2: Dex-style completion tracker: species owned, species defeated, per-generation completion.
- [ ] P2: More achievements (currently seven in [achievements.ts](src/meta/achievements.ts)), ideally with coin or cosmetic rewards attached so unlocks feel like more than a checkbox.

## 5. Audio

- [ ] P1: Real sound design.
  [audio.ts](src/ui/audio.ts) plays single-oscillator sine beeps for eight events.
  Replace with short authored samples (hits, deaths, status procs, UI clicks) and add per-category volume sliders instead of a single mute.
- [ ] P2: Background music per screen and per biome, with its own volume control.

## 6. Platform and accessibility

- [ ] P1: Touch support.
  Deployment relies on hover hints and Q/E/Enter; on touch there is no hover and no keyboard, so mobile play degrades to blind tapping.
  Add tap-to-select then tap-to-place flows with an explicit confirm, and larger touch targets.
- [ ] P2: Fullscreen toggle and better scaling of the fixed 864x576 canvas on large displays.
- [ ] P2: Save export and import (clipboard or file) as insurance against localStorage loss; currently a cleared browser wipes everything.
- [ ] P2: Reduced-motion setting and colorblind-safe pad and status colors.

## 7. Onboarding

- [ ] P1: First-run guidance.
  A new player gets one hint line and no explanation of terrain compatibility, targeting modes, abilities, statuses, or the milestone system.
  A short interactive first-wave tutorial on Verdant Route plus contextual first-time tooltips would cover it.

## 8. Balance and tuning

- [ ] P1: Early waves are too easy; several waves pass before meaningful pressure appears (see also the act pressure notes in [HANDOFF.md](HANDOFF.md)).
  Tune with the headless sim harness in [headlessSim.ts](src/engine/headlessSim.ts) and keep `tests/balance.test.ts` green.
- [ ] P2: Revisit gold-only in-run leveling to 100 against the post-wave-35 exponential HP curve in [scaling.ts](src/waves/scaling.ts); verify the intended difficulty band holds at waves 60 to 100 with a maxed team.
- [ ] P2: Spectral coverage pressure: on Shadow Marsh a team without ghost or psychic attackers soft-fails without warning; either warn at loadout time or surface it in the route card.

## 9. Engineering hygiene

- [ ] P2: The renderer draws every frame from scratch with no static-layer caching; pre-render the map layers to an offscreen canvas and redraw only dynamic entities.
- [ ] P2: `tools/build-verdant-route.js` and `tools/generate-route-maps.mjs` overlap in purpose; consolidate map validation tooling.
- [ ] P2: SonarCloud analysis is wired but dormant until the `SONAR_TOKEN` secret is configured.
