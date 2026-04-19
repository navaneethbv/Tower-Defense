# Game Design Document (GDD): Pokémon Route Defense

## 1) Vision
A route-based Pokémon tower defense with two progression loops:
- Tactical in-run choices (gold, placement, leveling, evolutions)
- Long-term account growth (stars, unlocks, team-building)

## 2) Design Pillars
1. Team composition matters.
2. Terrain placement matters.
3. Evolutions are meaningful in-run milestones.
4. Route progression provides long-term direction.
5. Utility/support roles are as valuable as DPS.

## 3) Core Player Loop
1. Select route
2. Select loadout
3. Pick starter
4. Defend waves
5. Spend gold between/within waves
6. Adapt to enemy traits
7. Complete route or lose hearts
8. Earn stars + unlocks
9. Improve future runs

## 4) Match Structure

### Pre-Match
- Route selection screen
- Team loadout screen
- Starter selection

### In-Match
- Fixed path enemy movement
- Tile-based legal placement
- Wave timeline + spawn groups
- Auto attacks with target mode control
- Shop offers and level-up decisions

### Post-Match
- Result summary
- Stars earned and unlock deltas
- Records (best wave, best score)

## 5) Mechanics

### 5.1 Resources
- Hearts: base life
- Gold: in-run tactical spend
- Stars: persistent progression currency

### 5.2 Placement & Terrain
- Allowed terrains per Pokémon species
- Optional favored-terrain bonuses
- No path-blocking mechanics

### 5.3 Targeting Modes
- First, Last, Strongest, Weakest, Fastest, Slowest, Closest, Statusable

### 5.4 Upgrading & Evolution
- Gold-based level progression
- Breakpoint evolutions
- Evolution modifies stat curves and sometimes ability behavior

### 5.5 Shop Model
- Random recruit from constrained pool
- Purchase cost scaling
- Early curated bias to reduce unwinnable starts

## 6) Content Plan (MVP)
- 3 routes
- 3 starters
- 15–25 recruitable Pokémon
- 12–18 enemy species
- 30–50 waves per route
- 1 boss-style encounter per route finale

## 7) Enemy Design
Trait-driven waves requiring adaptation:
- Fast (leak pressure)
- Tank (armor checks)
- Invisible (reveal checks)
- Regenerator (DPS floor + anti-regen utility)
- Swarm (AoE checks)
- Boss (multi-trait endurance checks)

## 8) Progression

### In-run progression
- Board growth through recruits
- Unit power growth through leveling/evolution
- Tactical retargeting and replacement decisions

### Meta progression
- Route unlocks by stars
- Team slot unlocks
- Pokémon unlock pool growth
- Achievements and collection expansion

## 9) UX Screens
- Profile
- Route Select
- Team Management
- Match HUD
- Post-match results
- Settings

## 10) Balancing Principles
- Role balance over canon power hierarchy
- Counterplay over hard counter walls
- High readability for enemy traits and tower roles
- Early-game stability to reduce RNG frustration

## 11) Risks & Mitigations
- **RNG frustration in shop** → early curated choices + pity logic.
- **Too many parallel systems** → MVP isolates core loop first.
- **Unit bloat** → small role-complete roster before expansion.

## 12) Success Criteria for Vertical Slice
- New player understands core loop in under 10 minutes.
- At least 3 viable team archetypes.
- Route completions feel meaningfully different by terrain + enemy composition.
- Clear sense of progression after each run.
