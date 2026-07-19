// Small, explicit design overrides. Canonical flags and base stats remain the
// primary source of truth for milestone pools.
export const rareIncludes = ["lapras", "snorlax", "lucario"] as const;
export const rareExcludes = ["chansey", "blissey", "smeargle"] as const;

export const powerIncludes = [
  "dragonite",
  "tyranitar",
  "salamence",
  "metagross",
  "garchomp",
  "hydreigon",
  "goodra",
  "kommo-o",
  "dragapult",
  "baxcalibur",
] as const;
export const powerExcludes = [] as const;
