# Generation I Through IX Overhaul Design

## Summary

The Pokémon Tower Defense rebuild will finish Phase 4 first, then expand the playable roster from the planned 151 Generation I species to all 1,025 default-form species introduced in Generations I through IX.
PokéAPI will be used as a development-time canonical data source, while the deployed game will use only checked-in local data and self-hosted sprites.
Tower-defense behavior will come from deterministic generation rules plus a focused curated override layer.

The remaining work includes the complete ability system, expanded enemies, balancing, polish, achievements, legacy cleanup, documentation, and Vercel deployment.

## Goals

- Complete and verify the unfinished egg, IV, collection, milestone-drop, and slot-unlock work in Phase 4.
- Support National Dex entries 1 through 1025 as playable Pokémon.
- Preserve recognizable differences between Pokémon without hand-authoring 1,025 full records.
- Keep game startup and gameplay independent of PokéAPI availability.
- Make the generated dataset reproducible and fail generation when source data is incomplete.
- Finish all remaining work described by Phases 5 through 7.
- Preserve existing saves through explicit schema migrations.
- Deliver a tested, polished, documented, and deployed static Vite application.

## Non-Goals

- Regional forms and alternate battle forms are excluded unless they have their own National Dex number.
- A separate Kanto, Johto, and Hoenn campaign is excluded from this scope.
- Runtime PokéAPI calls are excluded.
- Cloud saves, multiplayer, monetization, and paid gacha are excluded.
- A framework migration away from the current Vite, TypeScript, DOM, and canvas architecture is excluded.

## Species Scope

The roster contains exactly one default-form record for every National Dex number from 1 through 1025.
This includes babies, branching evolution families, friendship evolutions, stone evolutions, trade evolutions, regional evolution methods, and other conditions introduced through Generation IX.

Evolution conditions that do not fit a tower-defense run will be mapped to deterministic in-run level thresholds.
Simple three-stage families will generally evolve at tower levels 5 and 10.
Two-stage families will generally evolve at level 8.
Babies will evolve at level 4 and may reach a final stage at level 9.
Branching families will use one deterministic branch selected from the owned Pokémon's stable UID so the same individual always follows the same branch.
Curated overrides may replace these defaults when a family needs a more recognizable or balanced progression.

## Architecture

### Dependency boundaries

The existing dependency rule remains in force.
The `data` layer contains static definitions and imports only shared types when required by TypeScript.
The `engine`, `waves`, and `meta` layers may consume the data layer but must not depend on browser persistence.
The `ui` layer coordinates the engine, meta progression, browser events, and rendering.
The engine must not read or write `localStorage`.

Development tools under `tools/` may access the network and filesystem.
Generated game data must not contain network-dependent behavior.

### Generated and curated data

The roster will be assembled from two sources:

1. A generated canonical dataset containing stable facts from PokéAPI.
2. A curated override dataset containing tower-defense choices.

The canonical dataset will include National Dex number, identifier, English display name, current Generation IX types, canonical base stats, generation, evolution relationships, legendary and mythical flags, capture rate, and default sprite identity.
The generated output will be sorted by National Dex number and will include a schema version plus source metadata.

The curated override dataset will include explicit role, rarity, allowed terrain, favored terrain, attack type, projectile presentation, descriptions, status effects, active abilities, and any stat or evolution-threshold changes.
Existing tuned starter, Pidgey, and Geodude family records will become curated overrides instead of being discarded.

The runtime species module will merge generated records with deterministic defaults and curated overrides.
It will expose the existing `SPECIES`, `getSpecies`, `hasSpecies`, `isBaseSpecies`, and `baseSpeciesByRarity` interfaces so consumers do not need a broad rewrite.

### Generation pipeline

A development script will fetch PokéAPI resources for species 1 through 1025 and their default Pokémon records.
It will fetch each distinct evolution chain once and cache raw responses locally during a generation run.
Requests will use bounded concurrency, retries for transient failures, and clear terminal errors.

The generator will validate all inputs before replacing generated output.
It must reject missing National Dex numbers, duplicate IDs, missing default varieties, unresolved evolution references, unsupported types, malformed base stats, and missing sprite sources.
Writes will be atomic so a failed refresh cannot leave a partial dataset.

The normal development server, test command, and production build will never invoke the network generator.
Regeneration will be an explicit npm script.

### Type generation

The combat chart will use all 18 types available in Generation IX.
Dark, Steel, and Fairy will be supported by the shared type model and effectiveness chart.

The generated snapshot will use each default species record's current typing.
Invariant tests will reject unknown types outside the Generation IX chart.

### Sprites

Default front sprites for National Dex numbers 1 through 1025 will live under `public/sprites/` using the existing numeric naming convention.
The sprite acquisition tool will fetch from the official PokéAPI sprites repository and skip valid existing files.
It will reject missing or empty files and report the exact affected National Dex numbers.

Dataset tests will confirm that every runtime species resolves to a local sprite.
Vercel immutable caching will continue to apply to the sprite directory.

## Phase 4 Completion

Phase 4 will be completed before the roster expansion begins.

The run-result flow will capture the result returned by `applyRunResult`.
Milestone drops will be claimed only when the run establishes a new best wave for that map.
The claim function remains independently idempotent so accidental repeated calls cannot duplicate rewards.
Run rewards, persistent XP, milestone eggs, and the updated best wave will be saved together after the run.

Egg tests will cover affordability, coin deduction, insufficient-funds behavior, IV bounds, hatch inventory movement, rarity distribution, and idempotent milestone claims.
Distribution tests will use a seeded random source and broad statistical bands that catch broken tables without becoming flaky.

The shop, collection, reveal, and IV bar classes will receive responsive styling consistent with the current visual system.
Browser verification will cover buying an egg, hatching it, dismissing the reveal, finding the Pokémon in the collection and loadout, and receiving a milestone egg exactly once.

The existing slot rules remain unchanged.
The home screen hint will be verified at each relevant progression boundary.

## Roster Derivation

### Rarity

Legendary and mythical source flags map to the legendary game rarity.
Non-legendary base species are assigned common or rare rarity using deterministic rules based on capture rate, canonical base-stat total, evolution depth, and a small override list.
Evolution stages inherit the family's hatch rarity even though only base stages are hatchable.

Every egg pool must contain at least one hatchable base species.
Legendary eggs will no longer need the current empty-pool fallback once the generated roster is active.

### Roles and tower stats

Canonical Attack and Special Attack influence tower damage.
Speed influences attack cooldown.
Defensive stats, HP, typing, and move identity influence role selection.
Tower range, deployment cost, and terrain access will come from a small set of role templates rather than direct canonical-stat conversion.

The initial role templates will cover balanced damage, rapid damage, sniper, area damage, tank killer, control, support, damage over time, and specialist behavior.
Deterministic derivation keeps all 1,025 species usable, while curated overrides provide recognizable exceptions.

Evolution must always improve effective combat value.
Generated invariant tests will reject families whose later stage is strictly weaker than its predecessor after all modifiers are applied.

### Terrain and attack type

Primary and secondary Pokémon types will drive default attack type, legal terrain, and favored terrain through explicit lookup tables.
Curated overrides may adjust flying, aquatic, cave-dwelling, and otherwise distinctive species.
No gameplay rule will depend on a species name string.

## Abilities and Statuses

The existing status engine remains the single implementation for slow, poison, burn, stun, armor break, and curse.
Phase 5 will add a focused active ability executor rather than one bespoke function per Pokémon.

Approximately 25 reusable ability behaviors will cover line blasts, area damage, path-wide waves, chain attacks, multishot, ricochet, execute, damage-over-time zones, status bursts, temporary buffs, armor reduction, crowd control, and limited healing or life protection.
Final evolutions, single-stage specialists, legendary Pokémon, and mythical Pokémon may reference these behaviors with data-defined parameters.

The selected tower's HUD will show an ability button only when the tower has an active ability.
The button will display cooldown state, reject activation when unavailable, and remain usable with keyboard and pointer input.
The engine will own cooldown and effect execution, while the UI will only issue commands and render state.

Ability tests will exercise reusable behavior implementations with real engine entities and seeded scenarios.
Tests will verify cooldown enforcement, valid target selection, effect application, and safe behavior when no valid target exists.

## Enemy Expansion

Enemy definitions will expand through reusable archetypes rather than one-off logic for every species.
Archetypes will include fast, swarm, tank, armored, regenerator, invisible, boss, status-resistant, and mixed specialist variants.
Map enemy pools will draw from Generation I through IX species that match each route's terrain and difficulty identity.

Enemy traits will be data-driven.
The wave generator and engine must not check species names to activate mechanics.

## Saves and Migration

The save schema version will advance only when stored structure changes.
Existing collections, eggs, teams, best waves, settings, and statistics must remain readable.

Species IDs currently stored in saves remain stable because generated identifiers use the canonical lowercase names already used by the application.
Migration will remove team references only when the corresponding owned Pokémon record is genuinely invalid.
Corrupt saves will continue to fall back safely without crashing the application.

Generated data refreshes must not silently rename a stored species ID.
Any necessary alias will be explicit and tested.

## Phase 6 Polish and Balance

Auto-wave and speed controls will be audited against the rebuild before new implementations are added.
Existing correct behavior will be retained and covered by tests where practical.

Sound effects will cover placement, attacks, hits, evolutions, wave completion, egg purchase, hatching, victory, and defeat.
Mute state will use the existing persisted setting.
Audio loading failures must not block gameplay.

Visual polish will focus on readable combat feedback, responsive HUD layout, clear selection state, restrained particles, and consistent meta screens.
Particles and sound must respect performance and accessibility settings.

Achievements will use a small data-driven set based on existing persistent statistics and progression.
They will reward play milestones without introducing another currency or blocking route progression.

The headless balance harness will cover all maps and representative team bands.
A starter-only profile should fail early.
Additional team members and persistent levels must improve progress monotonically within reasonable seeded averages.
A developed six-slot team should reach the late game.
A strong, evolved, high-IV team with appropriate abilities must be capable of clearing wave 50.

Balance assertions will use deterministic seed sets and ranges rather than a single lucky run.
Manual browser runs will verify that mathematically valid balance still feels readable and fair.

## Phase 7 Cleanup and Shipping

The old `web/` prototype will remain until the rebuild passes feature-parity checks for combat, targeting, terrain, statuses, progression, audio controls, and auto-wave behavior.
After parity is confirmed, `web/` will be deleted because Git history preserves it.

Obsolete one-off sprite tools and reports will be removed only after the new reproducible generator replaces them.
The maintained generation and validation tools will remain documented.

The README will describe installation, development, testing, data regeneration, build, preview, controls, save behavior, and deployment.
It will include a clear fan-project and non-affiliation notice and state that the project must not be monetized.

The Vercel CLI will be upgraded after Phase 4 as requested.
The Vite application will deploy as a static site with the existing immutable sprite cache policy.
Deployment will proceed only when the local Vercel session is authenticated and the target project can be resolved safely.

## Error Handling

- Data generation fails with actionable species IDs and endpoint information.
- A failed generation cannot replace the last valid generated dataset.
- Missing runtime species references fail fast during development and tests.
- Missing sprite loads render the existing safe visual fallback and are caught by invariant tests.
- Egg purchases that cannot be afforded make no save changes.
- Repeated milestone claims make no save changes.
- Ability activation without a valid target or completed cooldown makes no combat changes.
- Audio failures do not interrupt the game loop.
- Save writes remain wrapped in error handling and do not mutate the versioned schema partially.
- Deployment stops for authentication, project-selection, build, or verification failures instead of guessing.

## Testing Strategy

Every behavior change follows a red, green, refactor cycle.
Tests must be observed failing for the expected reason before production code is added.

Unit and invariant tests will cover:

- Egg purchasing, hatching, IVs, distributions, and milestone idempotency.
- Exactly 1,025 unique National Dex entries.
- Stable IDs and valid local sprites.
- Valid type, role, rarity, terrain, projectile, status, and ability references.
- Resolved evolution edges and deterministic branch selection.
- Non-empty common, rare, and legendary base-species hatch pools.
- Monotonic evolution combat value.
- Ability execution and cooldowns.
- Save migration and round trips.
- Wave determinism and boss structure.
- Representative balance bands across every map.

Browser end-to-end verification will cover:

- Fresh starter selection and initial currency.
- Shop purchase and insufficient-funds state.
- Egg hatch reveal and collection display.
- Loadout selection and slot limits.
- Starting, accelerating, and auto-advancing a run.
- Ability activation and cooldown feedback.
- Milestone reward persistence and duplicate prevention.
- Run defeat, run victory, persistent XP, and payout.
- Reload persistence.
- Desktop and mobile layout quality.
- A fresh-profile production smoke test after deployment.

The final gate is `npm test`, `npx tsc --noEmit`, `npm run build`, the relevant browser flows, and production smoke verification.

## Implementation Order

1. Complete Phase 4 tests, wiring, styling, and browser verification.
2. Upgrade the Vercel CLI.
3. Add the PokéAPI snapshot generator and source validation.
4. Add sprites 387 through 1025 and validate all 1,025 sprite files.
5. Replace the partial species table with generated records plus curated overrides.
6. Add roster and evolution invariant tests.
7. Implement active abilities and HUD activation.
8. Expand enemies and map pools.
9. Add save migration if the final stored schema requires it.
10. Audit and finish auto-wave, speed, audio, particles, achievements, and accessibility behavior.
11. Extend and tune the balance harness across all maps and team bands.
12. Complete browser and responsive visual QA.
13. Remove the legacy prototype and obsolete tools after parity verification.
14. Rewrite documentation and add the fan-project notice.
15. Run the complete local gate, deploy, and smoke-test the deployed application.

## Acceptance Criteria

- The application contains exactly the 1,025 default-form species introduced in Generations I through IX.
- Every species has valid local data and a local sprite.
- Every base-stage species belongs to a usable egg pool.
- Egg purchase, hatch, milestone, collection, IV, and slot flows work and are browser-verified.
- Active abilities execute through reusable engine behaviors and expose clear HUD cooldown state.
- Map enemy pools include suitable Generation I through IX species without name-based mechanics.
- Existing saves migrate without losing valid collection or team records.
- Representative developed teams can clear wave 50 within deterministic balance bands.
- Auto-wave, speed, audio, mute, particles, and achievements work without degrading core gameplay.
- The legacy prototype is removed only after feature parity is verified.
- The README and fan-project notice reflect the shipped application.
- Tests, type-checking, build, browser verification, and deployed smoke checks pass with fresh evidence.
