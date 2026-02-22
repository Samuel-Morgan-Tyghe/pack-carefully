import type { Item } from "../../types"

export const basicWeapons: Record<string, Item> = {
  // COMMON WEAPONS (~15 DPS)
  dagger: {
    id: "dagger",
    name: "Dagger",
    description: "Fast and efficient. 15 DPS.",
    category: "WEAPON",
    width: 1,
    height: 2,
    icon: "Sword",
    rarity: "COMMON",
    triggerType: "ATTACK",
    combatStats: {
      damage: 12,
      energyCost: 4,
      baseCooldownMs: 800,
    },
  },
  hatchet: {
    id: "hatchet",
    name: "Hatchet",
    description: "Heavy swings. 15 DPS.",
    category: "WEAPON",
    width: 2,
    height: 2,
    // L-shape:
    // [X][X]
    // [X][ ]
    shape: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ],
    icon: "Axe",
    rarity: "COMMON",
    triggerType: "ATTACK",
    combatStats: {
      damage: 30,
      energyCost: 10,
      baseCooldownMs: 2000,
    },
  },
  wand_of_sparking: {
    id: "wand_of_sparking",
    name: "Wand of Sparking",
    description: "Magical sparks. 15 DPS. Passive: +1 Mana Regen.",
    category: "WEAPON",
    width: 1,
    height: 2,
    icon: "Zap",
    rarity: "COMMON",
    triggerType: "ATTACK",
    combatStats: {
      damage: 15,
      manaCost: 5,
      manaRegen: 1,
      baseCooldownMs: 1000,
    },
  },

  // UNCOMMON WEAPONS (~25 DPS)
  broadsword: {
    id: "broadsword",
    name: "Broadsword",
    description: "Stronger but exhausting. 25 DPS.",
    category: "WEAPON",
    width: 1,
    height: 3,
    icon: "Sword",
    rarity: "UNCOMMON",
    triggerType: "ATTACK",
    combatStats: {
      damage: 50,
      energyCost: 25,
      baseCooldownMs: 2000,
    },
  },
  staff_of_life: {
    id: "staff_of_life",
    name: "Staff of Life",
    description: "Life magic. 25 DPS. Passive: +10 Max HP.",
    category: "WEAPON",
    width: 1,
    height: 3,
    icon: "Stick",
    rarity: "UNCOMMON",
    triggerType: "ATTACK",
    combatStats: {
      damage: 25,
      manaCost: 10,
      maxHp: 10,
      baseCooldownMs: 1000,
    },
  },

  // RARE WEAPONS (~40-50 DPS)
  warhammer: {
    id: "warhammer",
    name: "Warhammer",
    description: "Devastating but slow. 40 DPS.",
    category: "WEAPON",
    width: 3,
    height: 3,
    // T-shape (horizontal head):
    // [X][X][X]
    // [ ][X][ ]
    // [ ][X][ ]
    shape: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ],
    icon: "Hammer",
    rarity: "RARE",
    triggerType: "ATTACK",
    combatStats: {
      damage: 120,
      energyCost: 60,
      baseCooldownMs: 3000,
    },
  },
  arcane_scepter: {
    id: "arcane_scepter",
    name: "Arcane Scepter",
    description: "Arcane mastery. 50 DPS. Passive: +3 Mana Regen.",
    category: "WEAPON",
    width: 1,
    height: 3,
    icon: "Wand",
    rarity: "RARE",
    triggerType: "ATTACK",
    combatStats: {
      damage: 40,
      manaCost: 20,
      manaRegen: 3,
      baseCooldownMs: 800,
    },
  },
}
