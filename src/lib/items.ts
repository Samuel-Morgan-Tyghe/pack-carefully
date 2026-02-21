import type { Item } from "../types"

const baseAttributeBooster: Omit<
  Item,
  "id" | "name" | "description" | "icon" | "combatStats" | "synergies"
> = {
  category: "TOOL",
  width: 1,
  height: 1,
  rarity: "COMMON",
}

const attributeBoosterItems: Record<string, Item> = {
  attack_booster: {
    ...baseAttributeBooster,
    id: "attack_booster",
    name: "Attack Booster",
    description: "Increases the damage of adjacent weapons by 30%.",
    icon: "Sword",
    synergies: [
      {
        pattern: "ADJACENT",
        description: "Boost Attack (+30% DMG)",
        targetIsSelf: false,
        apply: (_, target) => {
          if (ITEMS[target.itemId].category === "WEAPON") {
            return { multipliers: { damage: 1.3 } }
          }
          return {}
        },
      },
    ],
  },
  energy_booster: {
    ...baseAttributeBooster,
    id: "energy_booster",
    name: "Energy Booster",
    description: "Increases maximum energy by 20.",
    icon: "Battery",
    combatStats: {
      maxEnergy: 20,
    },
  },
  defense_booster: {
    ...baseAttributeBooster,
    id: "defense_booster",
    name: "Defense Booster",
    description: "Increases the block of adjacent armor or shields by 30%.",
    icon: "Shield",
    synergies: [
      {
        pattern: "ADJACENT",
        description: "Boost Block (+30% Block)",
        targetIsSelf: false,
        apply: (_, target) => {
          const targetItem = ITEMS[target.itemId]
          if (
            targetItem.category === "CLOTHING" ||
            targetItem.id.includes("shield") ||
            targetItem.combatStats?.block
          ) {
            return { multipliers: { block: 1.3 } }
          }
          return {}
        },
      },
    ],
  },
  health_booster: {
    ...baseAttributeBooster,
    id: "health_booster",
    name: "Health Booster",
    description: "Increases maximum HP by 20.",
    icon: "Activity",
    combatStats: {
      maxHp: 20,
    },
  },
  mana_booster: {
    ...baseAttributeBooster,
    id: "mana_booster",
    name: "Mana Booster",
    description: "Increases maximum mana by 10.",
    icon: "GlassWater",
    combatStats: {
      maxMana: 10,
    },
  },
}

const basicEquipment: Record<string, Item> = {
  dagger: {
    id: "dagger",
    name: "Dagger",
    description: "A fast, light blade. Low energy cost.",
    category: "WEAPON",
    width: 1,
    height: 2,
    icon: "Sword",
    rarity: "COMMON",
    triggerType: "ATTACK",
    combatStats: {
      damage: 8,
      energyCost: 5,
      triggerSpeed: 1.0,
      baseCooldownMs: 2500, // Faster than default
    },
  },
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
      heal: 20,
      energyCost: 30,
      baseCooldownMs: 6000, // Slow
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
      energyRegen: 2,
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
      manaRegen: 1,
    },
  },
}

const bridgeItems: Record<string, Item> = {}

export const ITEMS: Record<string, Item> = {
  ...attributeBoosterItems,
  ...basicEquipment,
  ...bridgeItems,
}

export const GRID_SIZE = 8
