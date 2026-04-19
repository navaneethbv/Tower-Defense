# System Specification (Implementation-Oriented)

## Runtime Entities

### PlayerProfile
- id
- stars
- unlockedRouteIds[]
- unlockedPokemonIds[]
- teamLoadouts[]
- achievements[]
- settings
- stats

### RouteDefinition
- id
- name
- unlockStars
- mapGrid
- pathNodes[]
- placementRules
- terrainLayout
- waveTableId

### PokemonSpecies
- id
- name
- rarity
- roleTags[]
- baseStats
- terrainRules
- abilityId
- evolution
- shopWeight

### PokemonInstance
- speciesId
- level
- evolutionStage
- position
- targetMode
- modifiers[]

### EnemySpecies
- id
- name
- stats
- traitTags[]
- visibility
- regen
- immunities[]
- rewards

### WaveDefinition
- routeId
- waveNumber
- enemyGroups[]
- boss
- rewards

### MatchState
- routeId
- waveIndex
- hearts
- gold
- placedUnits[]
- pendingSpawns
- activeEnemies[]
- timers
- shopState
- resultState

## Rule Defaults (MVP)

### Hearts & Leakage
- Base hearts: 20
- Default enemy leak damage: 1
- Elite leak damage: 2
- Boss leak damage: 5

### Gold Economy
- Starting gold: 300
- KO reward: enemy-specific
- Wave clear bonus: scales by wave index
- Recruit egg base cost: 120
- Recruit egg cost growth: +15 per purchase

### Level Curve
- Upgrade cost formula:
  - level 1→2: 50
  - each next level: prior * 1.5 (rounded)
- Evolution thresholds (baseline): levels 5 and 10

### Targeting Behavior
- First/Last determined by path progress metric.
- Strongest/Weakest by current HP.
- Fastest/Slowest by current movement speed.
- Closest by Euclidean distance to tower.
- Statusable excludes targets immune to tower's primary status.

## Ability Tag Taxonomy
- DAMAGE_DOT_BURN
- DAMAGE_DOT_POISON
- DAMAGE_SPLASH
- DAMAGE_CHAIN
- CONTROL_SLOW
- CONTROL_STUN
- UTILITY_REVEAL
- UTILITY_ARMOR_BREAK
- UTILITY_GOLD_BONUS
- SUPPORT_AURA_DAMAGE

## Terrain Taxonomy
- FIELD
- GRASS
- WATER
- MOUNTAIN

## Save/Load Boundaries
Persist between matches:
- PlayerProfile
- Route records
- Team loadouts
- Unlock flags

Do not persist in-match transient state:
- Active enemies
- Projectile instances
- Cooldown timers

## Milestone Scope Mapping

### Prototype
- Fixed path runner
- One route definition
- One starter + four recruitables
- Basic enemy trait system

### Vertical Slice
- Three routes
- Starter trio + 12+ recruitables
- Evolution milestones
- Stars + route unlocks
- Team save/load
