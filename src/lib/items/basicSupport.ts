import type { Item } from "../../types"

export const basicSupport: Record<string, Item> = {
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
  battery_pack: {
    id: "battery_pack",
    name: "Battery Pack",
    description: "Increases max energy and energy regeneration.",
    category: "TOOL",
    width: 1,
    height: 1,
    icon: "Battery",
    rarity: "UNCOMMON",
    triggerType: "PASSIVE",
    combatStats: {
      maxEnergy: 30,
      energyRegen: 5, // Buffed to match new 15 regen meta
    },
  },
  water_canteen: {
    id: "water_canteen",
    name: "Water Canteen",
    description: "Increases max mana and mana regeneration.",
    category: "SURVIVAL",
    width: 1,
    height: 1,
    icon: "GlassWater",
    rarity: "COMMON",
    triggerType: "PASSIVE",
    combatStats: {
      maxMana: 15,
      manaRegen: 2, // Buffed to match 5 mana regen meta
    },
  },
}
