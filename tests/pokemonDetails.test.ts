import { describe, expect, it, vi } from "vitest";
import { showPokemonDetails } from "../src/ui/components/pokemonDetails";
import type { OwnedPokemon } from "../src/types";
import { Tower } from "../src/engine/tower";
import { persistentDamageBonus } from "../src/meta/collection";

describe("pokemon details modal", () => {
  it("creates and appends the details overlay to parent element", () => {
    // Mock basic DOM APIs needed by the component
    const mockElement = {
      innerHTML: "",
      className: "",
      style: { zIndex: "" },
      querySelector: vi.fn().mockReturnValue({ addEventListener: vi.fn(), focus: vi.fn() }),
      addEventListener: vi.fn(),
      appendChild: vi.fn(),
      remove: vi.fn(),
    } as unknown as HTMLElement;

    const pokemon: OwnedPokemon = {
      uid: "detail-test",
      speciesId: "charmander",
      ivs: { damage: 15, range: 15, attackSpeed: 15 },
      level: 50,
      xp: 0,
      hatchedAt: 0,
    };

    const parent = {
      appendChild: vi.fn(),
    } as unknown as HTMLElement;

    const onClose = vi.fn();
    const originalDocument = globalThis.document;

    globalThis.document = {
      activeElement: null,
      createElement: vi.fn().mockReturnValue(mockElement),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as typeof document;

    try {
      showPokemonDetails(parent, pokemon, onClose);

      expect(globalThis.document.createElement).toHaveBeenCalledWith("div");
      expect(parent.appendChild).toHaveBeenCalledWith(mockElement);

      const tower = new Tower(
        pokemon.uid,
        pokemon.speciesId,
        pokemon.ivs,
        0,
        0,
        false,
        persistentDamageBonus(pokemon),
        pokemon.level,
      );
      expect(mockElement.innerHTML).toContain(`<b>${Math.round(tower.damage())}</b>`);
      expect(mockElement.innerHTML).toContain(`<b>${Math.round(tower.rangePx())} px</b>`);
      expect(mockElement.innerHTML).toContain(`<b>${(1 / tower.cooldown()).toFixed(2)} /s</b>`);
    } finally {
      globalThis.document = originalDocument;
    }
  });

  it("behaves as an accessible modal dialog", () => {
    const closeButton = {
      addEventListener: vi.fn(),
      focus: vi.fn(),
    };
    const modal = {
      innerHTML: "",
      className: "",
      style: { zIndex: "" },
      querySelector: vi.fn().mockReturnValue(closeButton),
      addEventListener: vi.fn(),
      remove: vi.fn(),
    } as unknown as HTMLElement;
    const previousFocus = { focus: vi.fn() };
    let keydownHandler: ((event: KeyboardEvent) => void) | undefined;
    const originalDocument = globalThis.document;
    globalThis.document = {
      activeElement: previousFocus,
      createElement: vi.fn().mockReturnValue(modal),
      addEventListener: vi.fn((type: string, handler: (event: KeyboardEvent) => void) => {
        if (type === "keydown") keydownHandler = handler;
      }),
      removeEventListener: vi.fn(),
    } as unknown as typeof document;
    const parent = { appendChild: vi.fn() } as unknown as HTMLElement;
    const onClose = vi.fn();
    const pokemon: OwnedPokemon = {
      uid: "accessible-detail",
      speciesId: "bulbasaur",
      ivs: { damage: 0, range: 0, attackSpeed: 0 },
      level: 1,
      xp: 0,
      hatchedAt: 0,
    };

    try {
      showPokemonDetails(parent, pokemon, onClose);

      expect(modal.innerHTML).toContain('role="dialog"');
      expect(modal.innerHTML).toContain('aria-modal="true"');
      expect(modal.innerHTML).toContain('aria-label="Close Pokémon details"');
      expect(closeButton.focus).toHaveBeenCalledOnce();
      expect(keydownHandler).toBeTypeOf("function");

      keydownHandler!({ key: "Escape", preventDefault: vi.fn() } as unknown as KeyboardEvent);

      expect(modal.remove).toHaveBeenCalledOnce();
      expect(globalThis.document.removeEventListener).toHaveBeenCalledWith(
        "keydown",
        keydownHandler,
      );
      expect(previousFocus.focus).toHaveBeenCalledOnce();
      expect(onClose).toHaveBeenCalledOnce();
    } finally {
      globalThis.document = originalDocument;
    }
  });
});
