import type { Item } from "../../types"
import { ITEMS } from "./items"

export const bridgeItems: Record<string, Item> = {
  blood_magic: {
    id: "blood_magic",
    name: "Blood Magic",
    description:
      "Enables Blood Trigger: When out of energy, items use 5% Max HP as cost.",
    category: "SABOTAGE",
    width: 1,
    height: 1,
    icon: "Skull",
    rarity: "RARE",
    triggerType: "PASSIVE",
  },
  spirit_link: {
    id: "spirit_link",
    name: "Spirit Link",
    description:
      "Enables Soul Guard: When at 1 HP, incoming damage is subtracted from Mana.",
    category: "SURVIVAL",
    width: 1,
    height: 1,
    icon: "Link",
    rarity: "RARE",
    triggerType: "PASSIVE",
  },
  arcane_battery: {
    id: "arcane_battery",
    name: "Arcane Battery",
    description:
      "When out of energy, Mana is consumed at a 2:1 ratio to power items.",
    category: "TOOL",
    width: 1,
    height: 1,
    icon: "Zap",
    rarity: "UNCOMMON",
    triggerType: "PASSIVE",
  },
  vampiric_fangs: {
    id: "vampiric_fangs",
    name: "Vampiric Fangs",
    description: "Attacks heal the user for 20% of damage dealt.",
    category: "WEAPON",
    width: 1,
    height: 1,
    icon: "Ghost",
    rarity: "LEGENDARY",
    triggerType: "PASSIVE",
  },
  retribution: {
    id: "retribution",
    name: "Retribution",
    description:
      "Adjacent weapons gain bonus damage equal to 20% of their base Block.",
    category: "TOOL",
    width: 1,
    height: 1,
    icon: "Swords",
    rarity: "RARE",
    synergies: [
      {
        pattern: "ADJACENT",
        description: "Retribution (+20% Target Block as DMG)",
        targetIsSelf: false,
        apply: (_, target) => {
          const targetDef = ITEMS[target.itemId]
          if (
            targetDef?.category === "WEAPON" ||
            (targetDef?.combatStats?.block || 0) > 0
          ) {
            const block = targetDef.combatStats?.block || 0
            return { buffs: { damage: Math.floor(block * 0.2) } }
          }
          return {}
        },
      },
    ],
  },
  overdrive: {
    id: "overdrive",
    name: "Overdrive",
    description:
      "Adjacent weapons trigger 50% faster but cost 100% more energy.",
    category: "SABOTAGE",
    width: 1,
    height: 1,
    icon: "Zap",
    rarity: "RARE",
    synergies: [
      {
        pattern: "ADJACENT",
        description: "Overdrive (50% Speed, 100% Cost)",
        targetIsSelf: false,
        apply: (_, target) => {
          if (ITEMS[target.itemId]?.category === "WEAPON") {
            return {
              multipliers: {
                triggerSpeed: 1.5,
                energyCost: 2.0,
              },
            }
          }
          return {}
        },
      },
    ],
  },
  arcane_blade: {
    id: "arcane_blade",
    name: "Arcane Blade",
    description: "Converts adjacent weapon Energy cost to Mana cost (1:1).",
    category: "TOOL",
    width: 1,
    height: 1,
    icon: "Sparkles",
    rarity: "RARE",
    synergies: [
      {
        pattern: "ADJACENT",
        description: "Arcane Blade (Energy -> Mana)",
        targetIsSelf: false,
        apply: (_, target) => {
          const targetDef = ITEMS[target.itemId]
          if (targetDef?.category === "WEAPON") {
            const energy = targetDef.combatStats?.energyCost || 0
            return {
              buffs: { manaCost: energy },
              multipliers: { energyCost: 0 },
            }
          }
          return {}
        },
      },
    ],
  },
  aura_of_thorns: {
    id: "aura_of_thorns",
    name: "Aura of Thorns",
    description:
      "Gain +2 Block every second for every status effect active on you.",
    category: "TOOL",
    width: 1,
    height: 1,
    icon: "ShieldAlert",
    rarity: "RARE",
    triggerType: "PASSIVE",
  },
  mana_shield: {
    id: "mana_shield",
    name: "Mana Shield",
    description: "When hit, spend 5 Mana to generate 10 Block instantly.",
    category: "TOOL",
    width: 1,
    height: 1,
    icon: "Shield",
    rarity: "RARE",
    triggerType: "PASSIVE",
  },
  emergency_plating: {
    id: "emergency_plating",
    name: "Emergency Plating",
    description: "When Energy is 0, incoming damage is reduced by 5.",
    category: "TOOL",
    width: 1,
    height: 1,
    icon: "Shield",
    rarity: "UNCOMMON",
    triggerType: "PASSIVE",
  },
  vitality_pulse: {
    id: "vitality_pulse",
    name: "Vitality Pulse",
    description: "Gain +1 Health Regen for every status effect active on you.",
    category: "SURVIVAL",
    width: 1,
    height: 1,
    icon: "Heart",
    rarity: "RARE",
    triggerType: "PASSIVE",
  },
  adrenaline: {
    id: "adrenaline",
    name: "Adrenaline",
    description: "Gain +2 Energy Regen for every status effect active on you.",
    category: "TOOL",
    width: 1,
    height: 1,
    icon: "Zap",
    rarity: "RARE",
    triggerType: "PASSIVE",
  },
  channeling: {
    id: "channeling",
    name: "Channeling",
    description: "Gain +1 Mana Regen for every status effect active on you.",
    category: "TOOL",
    width: 1,
    height: 1,
    icon: "Droplets",
    rarity: "RARE",
    triggerType: "PASSIVE",
  },
}
