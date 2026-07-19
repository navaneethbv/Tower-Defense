# Redeployment, Expanded Starters, and Status Specialists

## Purpose

This specification records the approved design for mid-wave Pokemon redeployment, an expanded starter roster, and a broader Pokemon-inspired status system.
It extends the existing deterministic TypeScript engine and the full 1,025-species roster without replacing current placement, evolution, ability, save, or balance systems.

## Locked Decisions

- Redeployment is free and works during building and active-wave phases.
- A moved Pokemon keeps its complete in-run state and receives a 5-second redeployment cooldown.
- The starter roster contains all 27 traditional Grass, Fire, and Water starters from Generations 1 through 9, plus Pikachu.
- Starter choices are grouped by generation.
- The status set includes burn, poison, toxic, paralysis, freeze, sleep, confusion, slow, stun, armor break, and curse.
- Status-specialist Pokemon trade roughly 20 to 30 percent direct DPS for stronger status chance, duration, or magnitude.
- Status specialties are derived across the complete roster, with curated overrides for recognizable Pokemon.
- Implementation follows test-driven development and is split into independently committed and pushed stages.

## Redeployment

Selecting a deployed Pokemon exposes a `Redeploy` action beside targeting, upgrade, ability, and sell controls.
Activating Redeploy highlights compatible empty authored pads.
Clicking a highlighted destination moves the existing tower.
Keyboard users press `Q` or `E` to cycle compatible destinations and `Enter` to confirm.
Pressing `Escape` or selecting the original tower cancels the pending movement.

Redeployment costs no gold.
The moved tower preserves its level, XP, run XP, evolution, targeting mode, total investment, attack cooldown, and ability cooldown.
Projectiles already fired remain active after movement.
The destination must be an empty authored pad compatible with the tower's current evolved species.
Movement is available during building and active-wave phases.

After moving, the Pokemon enters a 5-second redeployment cooldown.
It cannot attack or move again during this cooldown.
Ability cooldown continues advancing normally, but the ability cannot be activated while the Pokemon is redeploying.
The tower panel and board rendering show the remaining movement cooldown.

Initial deployment validation and movement validation remain separate engine operations.
Moving never charges the initial deployment cost, recreates the tower, resets progression, or changes the placed-team membership record.
Selling and initial deployment retain their current behavior.

## Starter Roster

The first-launch starter screen contains these generation groups:

- Generation 1: Bulbasaur, Charmander, Squirtle, and Pikachu.
- Generation 2: Chikorita, Cyndaquil, and Totodile.
- Generation 3: Treecko, Torchic, and Mudkip.
- Generation 4: Turtwig, Chimchar, and Piplup.
- Generation 5: Snivy, Tepig, and Oshawott.
- Generation 6: Chespin, Fennekin, and Froakie.
- Generation 7: Rowlet, Litten, and Popplio.
- Generation 8: Grookey, Scorbunny, and Sobble.
- Generation 9: Sprigatito, Fuecoco, and Quaxly.

Generation tabs keep the 28 choices readable, with Generation 1 selected initially.
Each starter card shows its sprite, types, role, terrain compatibility, direct-damage rating, and status specialty.
The tabs and cards use native keyboard navigation and visible focus states.
The mobile screen uses a compact two-column card grid.

Choosing any starter creates a normally generated owned Pokemon and grants the existing 500 Pokecoins.
The selected starter remains permanent for that save.
Unchosen starters remain available through the existing egg and milestone capture systems.

## Status Mechanics

The status engine remains deterministic.
Each effect has a duration and magnitude, and effects that need elapsed-time behavior track it explicitly.

### Burn

Burn deals steady damage over time.
It is the common Fire-type specialist effect and supports low-direct-damage burn attackers.

### Poison

Poison deals stronger steady damage over time than burn but normally lasts for less time.

### Toxic

Toxic begins with modest damage and increases its damage each second.
Its growth has a fixed cap, with a lower effective cap against bosses and milestone enemies.

### Paralysis

Paralysis reduces movement speed by 50 percent and causes short deterministic movement interruptions.
It does not use unseeded random interruption checks.

### Freeze

Freeze completely stops movement for a short duration.
A direct Fire-type hit immediately removes freeze after applying its damage.

### Sleep

Sleep completely stops movement for longer than freeze.
The next direct-damage hit applies damage and then wakes the target.
Damage-over-time ticks do not wake a sleeping target.

### Confusion

Confusion periodically damages the affected enemy and briefly interrupts its movement.
The pulses are deterministic.

### Existing Tactical Effects

Slow continuously reduces movement speed.
Stun completely stops movement for a very short duration.
Armor break temporarily removes armor.
Curse removes armor and increases incoming status damage.

## Status Interaction Rules

Reapplying the same status does not create unlimited stacks.
The engine retains the stronger magnitude and longer remaining duration.
Different status kinds can coexist.
Hard movement stops do not compound their stop duration or create negative speed.

Bosses and milestone enemies remain susceptible to every status.
Freeze, sleep, stun, and paralysis interruption durations are reduced by 50 percent against those enemies.
Toxic growth uses a boss-safe cap.
These rules preserve status-team value without allowing permanent control or disproportionate boss damage.

Status effects appear as compact icons above enemy health bars.
The selected tower panel describes chance, duration, magnitude, and behavior in plain language.
Damage-over-time ticks and thaw, wake, interruption, and recovery events use distinct visual feedback.

## Roster-Wide Specialist Assignment

The existing canonical species snapshot remains the source for types and base stats.
Generated files are not manually edited.

The derivation layer classifies each Pokemon as damage-focused, balanced, or status-specialized.
Status-specialized kits reduce direct DPS by approximately 20 to 30 percent and reinvest that power in status chance, duration, or magnitude.
Damage-focused Pokemon retain higher direct output with weak or no ordinary-attack status.
Balanced Pokemon sit between those profiles.

The default type mapping is:

- Fire specialists favor burn.
- Poison specialists favor poison or toxic.
- Electric specialists favor paralysis.
- Ice specialists favor freeze.
- Psychic, Ghost, and selected Fairy specialists favor sleep or confusion.
- Fighting, Ground, Steel, Dark, and selected Ghost Pokemon retain armor break or curse.
- Grass, Water, Bug, Flying, and other control-oriented Pokemon can retain slow when their role and stats support it.

Curated species overrides take precedence over derived kits.
Existing tuned families remain curated.
Additional overrides cover recognizable status users and ensure the 28 starter choices have understandable, balanced identities.
Charmander remains a balanced burn attacker, while Pokemon such as Vulpix or Salandit can become stronger burn specialists with lower direct damage.

## Architecture

`GameSession` owns movement validation and the state-preserving move operation.
`Tower` owns its mutable grid position and redeployment cooldown.
The UI owns move-mode selection, destination highlighting, keyboard controls, cancellation, and user-facing feedback.

`StatusSet` remains the single source of active enemy effects.
It owns effect refresh rules, elapsed-time behavior, movement multipliers, damage-over-time output, hard-control state, armor behavior, wake and thaw transitions, and boss duration normalization.
`GameSession` supplies direct-hit context, applies status transitions, and preserves deterministic combat RNG where chance is required.

The canonical snapshot remains unchanged.
The species derivation layer owns status-specialist classification and default kits.
The curated species module owns intentional exceptions.
Starter generation metadata is a small hand-authored grouping that references existing canonical species IDs.

## Error Handling and Edge Cases

Redeployment fails without mutation when the destination is outside the board, lacks an authored pad, is occupied, is terrain-incompatible, is the current pad, or the cooldown is active.
Selecting another tower or pressing `Escape` safely clears move mode.
A tower removed by selling cannot remain selected for movement or ability activation.
Moving during projectile travel does not retarget or remove the projectile.

Status durations are clamped to non-negative values.
Movement multipliers are clamped between zero and one.
Damage-over-time and toxic growth cannot heal or produce negative damage.
Wake and thaw behavior occurs only after the triggering direct hit resolves.
Status application to an already defeated enemy is ignored.

Starter group metadata must contain exactly 28 unique base-stage species IDs.
Every ID must resolve in the canonical roster.
Selecting a starter remains an exactly-once save operation.

## Test-Driven Implementation Stages

### Stage 1: Redeployment

Tests are written and observed failing before production changes.
Coverage includes movement validation, compatibility, occupied pads, cooldown enforcement, state preservation, initial placement cost isolation, projectile survival, keyboard cycling, cancellation, and active-wave movement.
The stage ends with unit tests, browser verification, a commit, and a push.

### Stage 2: Expanded Starters

Tests first define all nine generation groups, the 28 unique IDs, canonical resolution, card metadata, save behavior, and keyboard-accessible generation selection.
Browser verification covers desktop and mobile layouts and starter selection from a later generation.
The stage ends with a commit and a push.

### Stage 3: Status Specialists

Tests first define every status lifecycle, refresh rule, coexistence rule, wake and thaw behavior, deterministic interruptions, boss resistance, and toxic caps.
Roster tests verify specialist classification, DPS tradeoffs, type mappings, curated overrides, and complete species invariants.
Balance tests verify early, developed, specialist, and endgame teams across all nine 100-wave routes.
Browser verification covers status icons, selected-tower descriptions, combat feedback, desktop layout, and mobile layout.
The stage ends with documentation updates, production deployment, a commit, and a push.

## Success Criteria

- A deployed Pokemon can move during an active wave without losing progression or paying gold.
- Redeployment respects compatible authored pads and the 5-second cooldown.
- All 28 approved starters are discoverable and selectable by generation.
- Every approved status has deterministic, tested gameplay behavior.
- Status specialists create a meaningful direct-damage tradeoff across the complete roster.
- Boss status resistance prevents permanent control while retaining specialist value.
- Existing saves migrate without losing progress.
- The full lint, coverage, build, browser, GitHub Actions, and Vercel production gates remain green.
