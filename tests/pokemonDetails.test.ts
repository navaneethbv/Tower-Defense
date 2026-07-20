import { describe, expect, it, vi } from "vitest";
import { showPokemonDetails } from "../src/ui/components/pokemonDetails";
import type { OwnedPokemon } from "../src/types";

describe("pokemon details modal", () => {
  it("creates and appends the details overlay to parent element", () => {
    // Mock basic DOM APIs needed by the component
    const mockElement = {
      innerHTML: "",
      className: "",
      style: { zIndex: "" },
      querySelector: vi.fn().mockReturnValue({ addEventListener: vi.fn() }),
      addEventListener: vi.fn(),
      appendChild: vi.fn(),
      remove: vi.fn(),
    } as unknown as HTMLElement;

    const originalDocument = globalThis.document;
    
    globalThis.document = {
      createElement: vi.fn().mockReturnValue(mockElement),
    } as unknown as typeof document;

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

    showPokemonDetails(parent, pokemon, onClose);

    expect(globalThis.document.createElement).toHaveBeenCalledWith("div");
    expect(parent.appendChild).toHaveBeenCalledWith(mockElement);
    
    // Clean up
    globalThis.document = originalDocument;
  });
});
