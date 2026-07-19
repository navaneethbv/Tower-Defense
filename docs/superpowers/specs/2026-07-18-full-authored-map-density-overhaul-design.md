# Full Authored Map Density Overhaul

## Goal

Transform all nine battlefields from mechanically valid tile boards into dense, memorable locations with the visual completeness of a polished top-down creature-adventure map.
Preserve route balance and runtime behavior while allowing careful path and habitat-pad coordinate adjustments that strengthen each composition.
Keep all terrain artwork original and stored locally.

## Confirmed Product Decisions

- Keep the existing nine route IDs, progression order, 18-by-12 board dimensions, 100-wave structure, and deterministic simulation behavior.
- Use fully authored tile maps rather than procedural decoration or single-image map backgrounds.
- Allow careful enemy-path and habitat-pad coordinate changes when they improve composition.
- Preserve route difficulty, enemy travel behavior, pad counts, habitat balance, and viable team composition.
- Keep every terrain, structure, path, landmark, and habitat-pad asset original.
- Make route selector thumbnails represent the real authored maps.
- Favor environmental completeness without reducing combat readability.

## Chosen Approach

The implementation will expand the original local pixel-art atlas and hand-author all nine route JSON files.
Each route will contain explicit ground, path, landmark, decor, habitat, and deployment-pad information.
The canvas renderer will draw authored path tiles instead of painting the normal route as a broad vector stroke.
A reusable miniature renderer will draw the same map data into route-card previews.

The existing `MapConfig` contract remains the runtime boundary.
The Tiled adapter will gain only the focused fields needed for authored path layers and landmark validation.
Gameplay systems will continue consuming waypoints, terrain, and deployment pads without depending on visual tile details.

Two alternatives were rejected.
A smarter procedural generator would remain recognizable as a repeated system and would not create nine specific places.
Full-map background images could provide density quickly but would make responsive rendering, path changes, pad interaction, and future editing brittle.

## Visual System

The shared style remains crisp, top-down, 16-bit-inspired pixel art with nearest-neighbor scaling.
The existing Moss, Meadow, Sand, Water, Stone, and Ink colors remain the common family, with route-specific highlight, shadow, snow, lava, marsh, and ruin tones.
The atlas will add transition tiles, authored corners, banks, cliffs, stairs, bridges, gates, walls, and multi-tile landmark pieces.

Every route must contain one dominant landmark that establishes its identity immediately.
Every route must also contain at least two secondary landmark clusters, a deliberate entrance treatment, a deliberate exit treatment, and irregular environmental boundaries.
Large undecorated fields are not allowed unless they are intentional combat-clearance zones adjacent to the enemy path.

Decorative density will be highest around board edges and landmarks, moderate around deployment areas, and deliberately restrained inside the enemy corridor.
Large decor may not obscure enemies, towers, pads, health bars, status chips, projectiles, or placement feedback.
Small texture details may enter the path corridor only when they preserve silhouette contrast.

## Route Compositions

### Verdant Route

Verdant Route is a welcoming meadow circuit organized around a research outpost and central pond.
Enclosed flower gardens, hedges, fences, shrubs, signs, and small service structures create distinct upper and lower districts.
The path remains broad and forgiving, with long early firing lanes and clear turns.

### River Crossing

River Crossing is organized around a diagonal river with two islands and multiple shorelines.
Bridges, reeds, docks, stones, current marks, and riverbank transitions make water the dominant visual and strategic feature.
The path crosses or follows the river in a way that creates recognizable shoreline and island deployment positions.

### Granite Cave

Granite Cave contains connected chambers separated by cliff walls and narrow passages.
Torch alcoves, mineral pools, stalagmites, boulders, cave mouths, and elevation transitions break the board into readable rooms.
The switchback path retains constrained sight lines without becoming visually cramped.

### Ember Caldera

Ember Caldera is built around a crater rim and connected lava channels.
Basalt shelves, vents, cooled rock, ash patches, scorched plants, and carved stone platforms create a volcanic hierarchy.
Lava remains visually bright but is kept outside the clearest combat silhouettes.

### Frostbound Lake

Frostbound Lake contains one dominant frozen lake with small islands and ridge overlooks.
Snow banks, shoreline transitions, cracked ice, frozen trees, drifted fences, and ice bridges make the lake read as a continuous landform.
The path uses snow and ice-edge variants rather than a recolored generic road.

### Shadow Marsh

Shadow Marsh uses irregular dark pools, mud banks, dead trees, roots, reeds, fog pockets, and broken boardwalks.
Dry ground forms constrained islands instead of rectangular open fields.
Fog is a restrained ambient effect and never hides placement states or enemies.

### Skygarden Ruins

Skygarden Ruins is an elevated collection of garden islands connected by bridges.
Visible cliff edges, open-air gaps, broken walls, columns, overgrown courtyards, and collapsed masonry define the composition.
Long firing lanes remain central to the route's strategic identity.

### Ancient Sanctuary

Ancient Sanctuary is a layered temple approach with gates, stairs, courtyards, statues, ceremonial pools, walls, and interior garden spaces.
The path moves through a coherent architectural sequence rather than crossing a generic stone board.
All three habitat types receive visually intentional placement districts.

### Indigo Plateau

Indigo Plateau is a monumental championship approach with terraces, banners, formal gardens, gates, and a final arena.
The composition must look more ceremonial and imposing than every preceding route.
The path and pad arrangement continue testing a complete habitat roster while preserving a clear final-route battlefield.

## Authored Data Model

The committed Tiled-compatible JSON remains the source of truth for every route.
Each route will contain these layers:

- `ground` for base and transition tiles.
- `pathTiles` for road surfaces, corners, banks, bridges, stairs, entrances, and exits.
- `habitat` for authoritative placement compatibility.
- `decor` for small and large world objects.
- `path` for deterministic enemy waypoints.
- `pads` for stable interactive deployment locations.
- `landmarks` for semantic map-completeness validation.

Landmark objects will use stable IDs and one of the focused roles `dominant`, `secondary`, `entrance`, or `exit`.
They are metadata for validation and authoring review, not a gameplay dependency.
The loader will reject missing path-tile layers, invalid dimensions, undefined tile IDs, duplicate landmark IDs, missing landmark roles, and decor or pad coordinates outside the board.

The route generator will no longer generate finished visual compositions.
It may remain as a validation, atlas-export, or fixture utility, but running it must not overwrite the manually authored route JSON files.

## Path Rendering

The renderer will draw base ground, path tiles, decor, integrated pad art, combat entities, and HUD feedback in that order.
The existing broad canvas stroke will be removed from normal rendering once every route supplies a complete path-tile layer.
A development-only optional path guide may remain available for debugging waypoint alignment, but it will not appear during normal play.

Path tiles must cover the enemy corridor and visually connect every waypoint.
Entrances and exits must meet the board boundary clearly.
Corners, bridges, stairs, and banks must align without gaps or vector overlays.
Waypoint travel remains the authoritative movement system, so visual path changes cannot introduce nondeterministic movement.

## Habitat Pads

Habitat pads will be represented by biome-specific atlas tiles rather than generic filled rectangles.
Grass pads may appear as trimmed clearings, garden beds, or marked turf.
Water pads may appear as stepping stones, docks, lily platforms, ice shelves, or ceremonial pools.
Mountain pads may appear as carved plinths, basalt shelves, ridge platforms, or ruin pedestals.

Idle pads will be recognizable through shape and a restrained terrain glyph.
Compatible pads receive a light outline.
Incompatible pads receive a blocked glyph.
Occupied pads retain a distinct border beneath the tower.
Hover and keyboard focus receive a high-contrast outline.
These states will not depend on color alone and will not cover the underlying environmental identity.

## Route Thumbnails

Route cards will render miniatures from the actual `ground`, `pathTiles`, `decor`, and pad data.
The miniature renderer will use the same atlas and layer ordering as the battlefield while omitting combat-only overlays.
Locked cards may be dimmed, but their route composition must remain legible.
The current CSS palette approximation and generic horizontal preview path will be removed.

Thumbnail rendering must remain sharp at desktop and mobile card sizes.
The renderer will draw into a small canvas or generated image surface with image smoothing disabled.
Thumbnail failures will fall back to a route-specific palette block with an accessible route name, not a broken canvas.

## Balance Preservation

Path and pad coordinates may change only within explicit tolerances.
Each revised route will keep its waypoint count within one point of the current route, its turn count within one turn, and its total travel distance within 10 percent of the current route.
Early-route firing coverage may not become materially harsher, and later-route choke points may not become materially easier.

Minimum deployment-pad counts are 12 for Verdant Route, 14 for River Crossing, 12 for Granite Cave, 12 for Ember Caldera, 14 for Frostbound Lake, 13 for Shadow Marsh, 14 for Skygarden Ruins, 14 for Ancient Sanctuary, and 14 for Indigo Plateau.
Every route will retain all three currently available habitat types.
Pad distribution must continue supporting the existing headless balance teams.
No pad may overlap the enemy corridor, another pad, blocking decor, or an unreadable map edge.
Existing route ordering, unlock requirements, wave generation, milestone encounters, captures, saves, and achievements remain unchanged.

## Testing Strategy

Implementation will follow red, green, refactor.
No production behavior will be added before its focused test has failed for the intended reason.

Map contract tests will cover:

- Nine stable route IDs and 18-by-12 dimensions.
- Complete `pathTiles` layers with defined atlas IDs.
- One dominant, at least two secondary, one entrance, and one exit landmark per route.
- At least eight distinct ground and path tile IDs plus six distinct decor tile IDs per route.
- Valid path-to-tile alignment and visible boundary connections.
- Path-length and turn-count tolerances relative to the approved balance baseline.
- Pad uniqueness, path safety, habitat consistency, decor safety, and current minimum counts.
- No generator overwrite of manually authored route compositions.

Rendering tests will cover:

- Authored layer ordering.
- No normal-use vector path stroke when path tiles are available.
- Biome-specific pad bases plus accessible interaction states.
- Thumbnail use of actual authored map data.
- Image smoothing disabled for battlefields and thumbnails.

Balance tests will rerun the existing early, developed, specialist, and endgame teams across all nine routes.
Browser verification will inspect every route thumbnail and every full battlefield at 1440 by 900.
Mobile verification at 390 by 844 will cover route-card readability, battlefield scaling, pad clarity, and control usability.
Browser review will also check entrances, exits, landmarks, path clarity, tower silhouettes, enemy silhouettes, and empty-space balance.

The final automated gate is:

```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
```

The final visual gate is a local production-preview review at desktop and mobile sizes with no application console errors or warnings.

## Delivery Sequence

1. Add failing map-contract tests and the authored path and landmark schema.
2. Expand the shared atlas with path transitions, biome structures, landmarks, and integrated pads.
3. Hand-author the nine route compositions and carefully adjust paths and pads within balance tolerances.
4. Replace vector path rendering and generic pad fills with authored tiles and accessible overlays.
5. Replace CSS route previews with real miniature map rendering.
6. Run balance, automated, desktop, and mobile verification and refine visual defects found during review.

## Out of Scope

- Commercial Pokemon map tiles or ripped game assets are not included.
- Board dimensions will not change.
- Enemy movement will not switch from deterministic waypoint traversal to tile-based pathfinding.
- Route progression, wave rules, combat balance targets, economy, collection systems, and save structure will not be redesigned.
- Animated weather, day and night cycles, camera movement, and parallax are not part of this pass.
- A general-purpose procedural map generator is not part of this pass.
