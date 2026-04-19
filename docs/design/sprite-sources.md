# Sprite Sources (Web Research)

## Primary Source
- PokeAPI sprites repository: https://github.com/PokeAPI/sprites
- API docs: https://pokeapi.co/docs

Raw URL pattern used by the prototype:
- `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{dex}.png`

Examples currently used:
- Bulbasaur: `.../1.png`
- Charmander: `.../4.png`
- Squirtle: `.../7.png`
- Pidgey: `.../16.png`
- Rattata: `.../19.png`
- Pikachu: `.../25.png`
- Zubat: `.../41.png`
- Oddish: `.../43.png`
- Geodude: `.../74.png`
- Onix: `.../95.png`

## Local asset pull attempt
A local sprite download was attempted in this environment using `curl`, but outbound tunnel requests to sprite hosts returned `403 Forbidden`.
Because of that environment limitation, sprites remain referenced as remote URLs in `web/data.js` for now.

## Trademark / IP note
Pokémon names and characters are trademarks of Nintendo/Game Freak/The Pokémon Company.
Verify legal usage rights before distribution.
