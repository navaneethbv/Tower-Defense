# Pokémon Route Defense — MVP Blueprint

A route-based tower defense where you defend Pokémon routes by placing your own Pokémon as auto-attacking towers.

## Vision

> A Pokémon tower defense game where team composition, terrain placement, evolutions, and route progression matter as much as raw damage.

This project defines a practical implementation-ready blueprint for an MVP and vertical slice.

## Core Fantasy

- You are a Pokémon trainer defending a route.
- Wild Pokémon enter at spawn points and move toward exits.
- Your placed Pokémon auto-attack based on targeting mode.
- Escaped enemies remove hearts.
- A match ends in victory (all waves cleared) or defeat (hearts reach zero).

## Core Loop

1. Choose route.
2. Pick/load team.
3. Start with one free starter (Bulbasaur, Charmander, or Squirtle).
4. Defeat waves and earn gold.
5. Buy/place/level/replace Pokémon.
6. Survive to route completion.
7. Earn stars and progression rewards.
8. Unlock routes/Pokémon/systems and improve future runs.

## Match Flow

### Pre-match
- Route selection
- Team loadout selection
- Starter selection
- (Later) difficulty modifiers

### In-match
- Sequential wave spawning
- Enemies follow fixed path nodes
- Place Pokémon only on legal terrain tiles
- Auto-targeting with selectable target priority modes
- Gold from enemy defeats and wave clear bonuses
- Mid-run shop recruitment
- Mid-run leveling and evolution
- Enemy traits (armor/invisible/speed/regen/immunity)

### Post-match
- Victory/defeat summary
- Stars earned
- Route best wave / best score
- Progression unlock checks
- Team save/update option

## MVP Scope (Target)

- 3 starters
- 12–18 enemy species
- 3 routes
- 30–50 waves per route
- 15–25 usable Pokémon
- 5–8 ability/status archetypes
- In-run currency: gold
- Meta currency: stars
- Persistent unlocks
- Save/load team
- Target modes
- Mid-run leveling system
- Random recruit shop

## Battlefield

- Fixed-path route maps (no maze building)
- Terrain-tagged placement tiles: `Field`, `Grass`, `Water`, `Mountain`
- Terrain-constrained placement and optional terrain bonuses

Why fixed-path:
- Better balance
- Supports route-defense fantasy
- Enables meaningful terrain strategy
- Prevents path-block exploits

## Economy

- **Hearts**: lives; enemy escapes reduce hearts.
- **Gold**: in-run spend for recruit + level + (later reroll).
- **Stars**: meta progression currency for unlocks.

## Team System

- Collection layer: all unlocked Pokémon.
- Active team layer: run-eligible subset.
- Start account with starter trio.
- Active team starts at 4 slots; unlock expands to 6–8.

## Starter Roles

- Bulbasaur line: control / poison / sustain
- Charmander line: burn / high DPS / wave clear
- Squirtle line: balanced / armor break / splash

Starter is free and always available at wave 1.

## Tower Model

Per-species stats:
- Power
- Attack speed
- Range
- Crit chance
- Cost
- Terrain compatibility
- Upgrade scaling
- Ability

Target modes:
- First / Last / Strongest / Weakest / Fastest / Slowest / Closest / Statusable

## Ability Archetypes

- DoT: burn / poison / curse
- CC: slow / stun / (later freeze)
- Utility: reveal invisible / armor break / anti-regen / heart heal (rare)
- Pattern: splash / ricochet / multi-shot / execute / ramping focus

## Enemy Model

Base enemy stats:
- Health
- Armor
- Speed
- Gold reward
- Heart damage
- Visibility
- Regen
- Trait tags/immunities

Enemy types include:
- Fast, Tank, Invisible, Regenerator, Swarm, Boss, Status-immune

## Mid-run Progression

- Spend gold to level Pokémon.
- Non-linear level costs.
- Evolution at key thresholds.
- Evolution updates visuals/stats/abilities.

## Shop System (MVP)

- Random recruit egg shop using curated pool.
- Weighted rarity.
- Cost scales slightly by purchase count.
- Early anti-RNG guardrails: first two offers biased toward DPS and support/control.

## Route / World Progression

- Route nodes like `1-1`, `1-2`, `1-3`, `2-1`...
- Stars unlock future routes.
- Up to 3 stars per route via clear + challenge thresholds.

## Meta Progression

- Account progression: routes, team slots, loadouts, QoL
- Collection progression: unlocked Pokémon, evolutions, Pokédex entries
- Achievements: thematic long-term goals with star/cosmetic rewards

## Initial Roster Suggestion

Starters:
- Bulbasaur
- Charmander
- Squirtle

Early unlocks:
- Pidgey, Pikachu, Geodude, Oddish, Zubat, Butterfree, Meowth, Abra, Machop, Gastly

## Development Phases

### Phase 1 — Prototype
- 1 route, 1 starter, 5 enemy types, 5 towers, targeting, leveling, hearts/gold/waves UI

### Phase 2 — Vertical Slice
- 3 routes, 3 starters, 12–15 towers, evolutions, shop, terrain, save/load, stars

### Phase 3 — Meta Game
- Achievements, expanded unlock tree/loadouts, bosses, deeper progression

## Open Design Questions

1. Shop randomness level vs. deterministic choices?
2. Evolution triggers: level-only or branching conditions?
3. Pokémon typing: thematic only or mechanical modifiers?
4. Route-specific gimmicks and terrain identity?
5. Star award model: completion vs thresholds vs challenges?
6. Collection model: unlock-only or capture/pokédex depth?
7. Wave authoring: handcrafted only or late proceduralization?

## Data Definitions

See:
- `docs/design/game-design-document.md`
- `docs/design/system-spec.md`
- `docs/data/*.json`

## Prototype Implementation (JavaScript)

A light browser prototype is now included in `web/`.

### Run locally

```bash
cd web
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

### Current implemented systems

- Fixed-path route with terrain bands
- Starter placement and terrain validation
- Auto-attacking Pokémon towers with selectable target mode
- Tower selection, upgrading, and selling
- Wave spawning and enemy path movement
- Gold/hearts/wave/stars loop
- Random recruit shop with early role bias
- Keyboard shortcuts (Space: start wave, U: upgrade selected)
- Pokémon/enemy sprites loaded from PokeAPI sprite URLs
