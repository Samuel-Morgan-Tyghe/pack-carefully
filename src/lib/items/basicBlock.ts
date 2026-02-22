import type { Item } from "../../types"

export const basicBlock: Record<string, Item> = {
  wooden_shield: {
    id: "wooden_shield",
    name: "Wooden Shield",
    description: "Reliable defense.",
    category: "TOOL",
    width: 2,
    height: 2,
    icon: "Shield",
    rarity: "COMMON",
    triggerType: "SHIELD",
    combatStats: {
      // Manual balance for Shields (Shields don't follow DPS targets exactly)
      block: 15,
      energyCost: 15,
      baseCooldown: 4.0,
    },
  },
  mana_shield: {
    id: "mana_shield",
    name: "Mana Shield",
    description: "Magical protection. Uses Mana for defense.",
    category: "TOOL",
    width: 2,
    height: 2,
    icon: "ShieldAlert",
    rarity: "UNCOMMON",
    triggerType: "SHIELD",
    combatStats: {
      block: 20,
      manaCost: 10,
      baseCooldown: 3.0,
    },
  },
  spirit_ward: {
    id: "spirit_ward",
    name: "Spirit Ward",
    description: "Ancient protection. Uses Mana and Energy.",
    category: "TOOL",
    width: 2,
    height: 2,
    icon: "ShieldCheck",
    rarity: "RARE",
    triggerType: "SHIELD",
    combatStats: {
      block: 40,
      manaCost: 15,
      energyCost: 25,
      baseCooldown: 5.0,
    },
  },
}
