import type { Item } from "../../types"
import { TIER_TARGETS, calcBlockStats } from "../balancing"

export const basicBlock: Record<string, Item> = {
  wooden_shield: {
    id: "wooden_shield",
    name: "Wooden Shield",
    description: "Low-cost defense. Has vulnerability windows.",
    category: "TOOL",
    width: 2,
    height: 2,
    icon: "Shield",
    rarity: "COMMON",
    triggerType: "SHIELD",
    combatStats: calcBlockStats({
      targetEps: TIER_TARGETS.COMMON.blockEps,
      baseCooldown: 4.0,
      // Uses global default vulnerabilityFactor
    }),
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
      ...calcBlockStats({
        targetEps: TIER_TARGETS.UNCOMMON.blockEps,
        baseCooldown: 3.0,
        // Uses global default vulnerabilityFactor
      }),
      manaCost: 18,
      energyCost: 0,
    },
  },
  spirit_ward: {
    id: "spirit_ward",
    name: "Spirit Ward",
    description: "Ancient protection. Large block, longer gaps.",
    category: "TOOL",
    width: 2,
    height: 2,
    icon: "ShieldCheck",
    rarity: "RARE",
    triggerType: "SHIELD",
    combatStats: calcBlockStats({
      targetEps: TIER_TARGETS.RARE.blockEps,
      baseCooldown: 6.0,
      vulnerabilityFactor: 0.15, // Intentional override for Rare tier
    }),
  },
}
