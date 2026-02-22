import type { Item } from "../../types"

export const basicBlock: Record<string, Item> = {
  wooden_shield: {
    id: "wooden_shield",
    name: "Wooden Shield",
    description: "Provides a basic block against attacks.",
    category: "TOOL",
    width: 2,
    height: 2,
    icon: "Shield",
    rarity: "COMMON",
    triggerType: "SHIELD",
    combatStats: {
      block: 15,
      energyCost: 10,
      baseCooldownMs: 4000,
    },
  },
}
