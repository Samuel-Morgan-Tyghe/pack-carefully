import type { Item } from "../../types"

export const healthItems: Record<string, Item> = {
  medkit: {
    id: "medkit",
    name: "Medkit",
    description: "Heals for a small amount. High energy cost.",
    category: "SURVIVAL",
    width: 2,
    height: 1,
    icon: "Heart",
    rarity: "UNCOMMON",
    triggerType: "HEAL",
    combatStats: {
      heal: 30,
      energyCost: 60,
      baseCooldown: 6.0,
    },
  },
  healing_poultice: {
    id: "healing_poultice",
    name: "Healing Poultice",
    description: "Slowly heals over time. Uses no resources.",
    category: "SURVIVAL",
    width: 2,
    height: 1,
    icon: "Leaf",
    rarity: "COMMON",
    triggerType: "HEAL",
    combatStats: {
      heal: 15,
      energyCost: 0,
      manaCost: 0,
      baseCooldown: 8.0,
    },
  },
  arcane_bandage: {
    id: "arcane_bandage",
    name: "Arcane Bandage",
    description: "Uses mana to knit wounds rapidly.",
    category: "SURVIVAL",
    width: 1,
    height: 2,
    icon: "Sparkles",
    rarity: "RARE",
    triggerType: "HEAL",
    combatStats: {
      heal: 50,
      manaCost: 20,
      baseCooldown: 5.0,
    },
  },
}
