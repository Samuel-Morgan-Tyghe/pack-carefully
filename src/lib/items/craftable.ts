import type { Item } from "../../types"
import { ITEMS } from "./items"

const RUSTY_DAGGER_STATS = {
  damage: 4,
  baseCooldown: 1.0,
  energyCost: 10,
}

const CRACKED_WAND_STATS = {
  damage: 3,
  manaCost: 8,
  baseCooldown: 1.2,
  manaRegen: 0.5,
}

const SCRAP_SHIELD_STATS = {
  block: 8,
  baseCooldown: 4.0,
  energyCost: 5,
}

export const craftableItems: Record<string, Item> = {
  shard_spikes: {
    id: "shard_spikes",
    name: "Spike Shard",
    description: "A jagged fragment. Adds reactive spikes to your defense.",
    category: "TOOL",
    width: 2,
    height: 2,
    shape: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ],
    icon: "Zap",
    rarity: "COMMON",
    triggerType: "PASSIVE",
    combatStats: {
      spikes: 3,
    },
  },
  shard_block: {
    id: "shard_block",
    name: "Block Shard",
    description: "A sturdy fragment. Adds minor block to your defense.",
    category: "TOOL",
    width: 2,
    height: 2,
    shape: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ],
    icon: "Square",
    rarity: "COMMON",
    triggerType: "PASSIVE",
    combatStats: {
      block: 5,
    },
  },
  rusty_dagger: {
    id: "rusty_dagger",
    name: "Rusty Dagger",
    description: "Old and dull. Better than nothing.",
    category: "WEAPON",
    width: 1,
    height: 2,
    icon: "Sword",
    rarity: "COMMON",
    triggerType: "ATTACK",
    combatStats: RUSTY_DAGGER_STATS,
  },
  cracked_wand: {
    id: "cracked_wand",
    name: "Cracked Wand",
    description: "Barely holds magic. Passive: +0.5 Mana Regen.",
    category: "WEAPON",
    width: 1,
    height: 2,
    icon: "Zap",
    rarity: "COMMON",
    triggerType: "ATTACK",
    combatStats: CRACKED_WAND_STATS,
  },
  scrap_shield: {
    id: "scrap_shield",
    name: "Scrap Shield",
    description: "Thin metal sheet. Provides minor protection.",
    category: "TOOL",
    width: 2,
    height: 2,
    icon: "Shield",
    rarity: "COMMON",
    triggerType: "SHIELD",
    combatStats: SCRAP_SHIELD_STATS,
  },
  spiked_shield: {
    id: "spiked_shield",
    name: "Spiked Shield",
    description: "A shield that bites back. Adds block and spikes.",
    category: "TOOL",
    width: 2,
    height: 2,
    icon: "ShieldAlert",
    rarity: "UNCOMMON",
    triggerType: "SHIELD",
    combatStats: {
      ...SCRAP_SHIELD_STATS,
      block: SCRAP_SHIELD_STATS.block,
      spikes: 3,
    },
    recipe: {
      ingredients: ["shard_spikes", "shard_block", "scrap_shield"],
      result: "spiked_shield",
    },
  },
  poison_shard: {
    id: "poison_shard",
    name: "Poison Shard",
    description:
      "Adjacent weapons and shields apply Poison on hit (+1 stack per connection).",
    category: "TOOL",
    width: 2,
    height: 2,
    shape: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ],
    icon: "Skull",
    rarity: "COMMON",
    synergies: [
      {
        pattern: "ADJACENT",
        description: "Poison on Hit (+2 per connection)",
        targetIsSelf: false,
        apply: (source, target, allItems) => {
          const targetDef = ITEMS[target.itemId]
          if (
            targetDef?.category !== "WEAPON" &&
            targetDef?.triggerType !== "SHIELD"
          )
            return {}
          // Count how many weapon/shield items this shard is adjacent to (including this one)
          const adjacentCount = allItems.filter((other) => {
            if (other.instanceId === source.instanceId) return false
            const otherDef = ITEMS[other.itemId]
            if (
              otherDef?.category !== "WEAPON" &&
              otherDef?.triggerType !== "SHIELD"
            )
              return false
            // Quick adjacency check: any cell of source is adjacent to any cell of other

            return (
              Math.abs(source.x - other.x) <= 2 ||
              Math.abs(source.y - other.y) <= 2
            )
          }).length
          return {
            effects: [{ type: "POISON" as const, value: 1 + adjacentCount }],
          }
        },
      },
    ],
  },
  fire_shard: {
    id: "fire_shard",
    name: "Fire Shard",
    description:
      "Adjacent weapons and shields apply Fire on hit (+1 stack per connection).",
    category: "TOOL",
    width: 2,
    height: 2,
    shape: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ],
    icon: "Flame",
    rarity: "COMMON",
    synergies: [
      {
        pattern: "ADJACENT",
        description: "Fire on Hit (+2 per connection)",
        targetIsSelf: false,
        apply: (source, target, allItems) => {
          const targetDef = ITEMS[target.itemId]
          if (
            targetDef?.category !== "WEAPON" &&
            targetDef?.triggerType !== "SHIELD"
          )
            return {}
          const adjacentCount = allItems.filter((other) => {
            if (other.instanceId === source.instanceId) return false
            const otherDef = ITEMS[other.itemId]
            if (
              otherDef?.category !== "WEAPON" &&
              otherDef?.triggerType !== "SHIELD"
            )
              return false
            return (
              Math.abs(source.x - other.x) <= 2 ||
              Math.abs(source.y - other.y) <= 2
            )
          }).length
          return {
            effects: [{ type: "FIRE" as const, value: 1 + adjacentCount }],
          }
        },
      },
    ],
  },
  frost_shard: {
    id: "frost_shard",
    name: "Frost Shard",
    description:
      "Adjacent weapons and shields apply Slow on hit (+1 stack per connection).",
    category: "TOOL",
    width: 2,
    height: 2,
    shape: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ],
    icon: "Snowflake",
    rarity: "COMMON",
    synergies: [
      {
        pattern: "ADJACENT",
        description: "Slow on Hit (+2 per connection)",
        targetIsSelf: false,
        apply: (source, target, allItems) => {
          const targetDef = ITEMS[target.itemId]
          if (
            targetDef?.category !== "WEAPON" &&
            targetDef?.triggerType !== "SHIELD"
          )
            return {}
          const adjacentCount = allItems.filter((other) => {
            if (other.instanceId === source.instanceId) return false
            const otherDef = ITEMS[other.itemId]
            if (
              otherDef?.category !== "WEAPON" &&
              otherDef?.triggerType !== "SHIELD"
            )
              return false
            return (
              Math.abs(source.x - other.x) <= 2 ||
              Math.abs(source.y - other.y) <= 2
            )
          }).length
          return {
            effects: [{ type: "SLOW" as const, value: 1 + adjacentCount }],
          }
        },
      },
    ],
  },
  viper_blade: {
    id: "viper_blade",
    name: "Viper Blade",
    description:
      "A toxic dagger. Poisons enemies (Hits HP only when block is 0).",
    category: "WEAPON",
    width: 1,
    height: 2,
    icon: "Sword",
    rarity: "UNCOMMON",
    triggerType: "ATTACK",
    combatStats: RUSTY_DAGGER_STATS,
    effects: [{ type: "POISON", value: 4, chance: 100 }],
    recipe: {
      ingredients: ["rusty_dagger", "poison_shard"],
      result: "viper_blade",
    },
  },
  blaze_wand: {
    id: "blaze_wand",
    name: "Blaze Wand",
    description: "A searing wand. Burns enemy block over time.",
    category: "WEAPON",
    width: 1,
    height: 2,
    icon: "Zap",
    rarity: "UNCOMMON",
    triggerType: "ATTACK",
    combatStats: CRACKED_WAND_STATS,
    effects: [{ type: "FIRE", value: 8, chance: 100 }],
    recipe: {
      ingredients: ["cracked_wand", "fire_shard"],
      result: "blaze_wand",
    },
  },
  frostbound_shield: {
    id: "frostbound_shield",
    name: "Frostbound Shield",
    description: "A chilled shield. Slows down enemy actions.",
    category: "TOOL",
    width: 2,
    height: 2,
    icon: "ShieldAlert",
    rarity: "UNCOMMON",
    triggerType: "SHIELD",
    combatStats: SCRAP_SHIELD_STATS,
    effects: [{ type: "SLOW", value: 3, chance: 100 }],
    recipe: {
      ingredients: ["scrap_shield", "frost_shard"],
      result: "frostbound_shield",
    },
  },
}
