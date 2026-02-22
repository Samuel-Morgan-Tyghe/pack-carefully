import type { Item } from "../../types"
import { ITEMS } from "../items"

export const basicTools: Record<string, Item> = {
  attack_booster: {
    category: "TOOL",
    width: 1,
    height: 1,
    rarity: "COMMON",
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
          if (ITEMS[target.itemId]?.category === "WEAPON") {
            return { multipliers: { damage: 1.3 } }
          }
          return {}
        },
      },
    ],
  },
  energy_booster: {
    category: "TOOL",
    width: 1,
    height: 1,
    rarity: "COMMON",
    id: "energy_booster",
    name: "Energy Booster",
    description: "Increases maximum energy by 20.",
    icon: "Battery",
    combatStats: {
      maxEnergy: 20,
    },
  },
  defense_booster: {
    category: "TOOL",
    width: 1,
    height: 1,
    rarity: "COMMON",
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
            targetItem?.category === "CLOTHING" ||
            targetItem?.id.includes("shield") ||
            targetItem?.combatStats?.block
          ) {
            return { multipliers: { block: 1.3 } }
          }
          return {}
        },
      },
    ],
  },
  health_booster: {
    category: "TOOL",
    width: 1,
    height: 1,
    rarity: "COMMON",
    id: "health_booster",
    name: "Health Booster",
    description: "Increases maximum HP by 20.",
    icon: "Activity",
    combatStats: {
      maxHp: 20,
    },
  },
  mana_booster: {
    category: "TOOL",
    width: 1,
    height: 1,
    rarity: "COMMON",
    id: "mana_booster",
    name: "Mana Booster",
    description: "Increases maximum mana by 10.",
    icon: "GlassWater",
    combatStats: {
      maxMana: 10,
    },
  },
}
