import type { Item } from '../types';

export const ITEMS: Record<string, Item> = {
  water_bottle: {
    id: 'water_bottle',
    name: 'Water Bottle',
    description: 'Hydration.',
    category: 'ESSENTIAL',
    width: 1,
    height: 2,
    icon: 'Droplets',
    scoreValue: 10,
    rarity: 'COMMON',
    combatStats: { energyRegen: 5 },
    synergies: [
      {
        pattern: 'ADJACENT',
        description: 'Hydration (+10 Max Energy)',
        targetIsSelf: true,
        apply: (_, target) => {
          if (ITEMS[target.itemId].category === 'ESSENTIAL') return { buffs: { maxEnergy: 10 } };
          return {};
        }
      }
    ]
  },
  rations: {
    id: 'rations',
    name: 'Survival Rations',
    description: 'Dry food.',
    category: 'ESSENTIAL',
    width: 2,
    height: 1,
    icon: 'Package',
    scoreValue: 10,
    rarity: 'COMMON',
    combatStats: { healthRegen: 1, energyRegen: 2 },
    synergies: [
      {
        pattern: 'ADJACENT',
        description: 'Banquet (+3 HP Regen)',
        targetIsSelf: true,
        apply: (_, target) => {
          const targetDef = ITEMS[target.itemId];
          if (targetDef.category === 'ESSENTIAL' && (target.itemId === 'rations' || target.itemId === 'water_bottle')) {
            return { buffs: { healthRegen: 3 } };
          }
          return {};
        }
      }
    ]
  },
  flashlight: {
    id: 'flashlight',
    name: 'Flashlight',
    description: 'Spot targets.',
    category: 'TOOL',
    width: 1,
    height: 2,
    icon: 'Flashlight',
    scoreValue: 5,
    rarity: 'COMMON',
    combatStats: { accuracy: 15 },
  },
  first_aid: {
    id: 'first_aid',
    name: 'First Aid Kit',
    description: 'Emergency care.',
    category: 'SURVIVAL',
    width: 2,
    height: 2,
    icon: 'BriefcaseMedical',
    scoreValue: 20,
    triggerType: 'HEAL',
    combatStats: { heal: 15, energyCost: 20 },
    rarity: 'UNCOMMON',
    synergies: [
      {
        pattern: 'ADJACENT',
        description: 'Clean Wounds (1.5x Heal)',
        targetIsSelf: true,
        apply: (_, target) => {
          if (target.itemId === 'water_bottle') return { multipliers: { heal: 1.5 } };
          return {};
        }
      }
    ]
  },
  wooden_shield: {
    id: 'wooden_shield',
    name: 'Wooden Shield',
    description: 'Basic protection.',
    category: 'TOOL',
    width: 2,
    height: 2,
    icon: 'Shield',
    scoreValue: 15,
    rarity: 'COMMON',
    combatStats: { defense: 5, block: 10, staminaCost: 1.0 },
    synergies: [
      {
        pattern: 'ADJACENT',
        description: 'Shield Wall (+8 DEF)',
        targetIsSelf: true,
        apply: (_, target) => {
          const targetDef = ITEMS[target.itemId];
          if (targetDef.category === 'CLOTHING' || targetDef.category === 'SURVIVAL' || target.itemId === 'wooden_shield') {
            return { buffs: { defense: 8 } };
          }
          return {};
        }
      }
    ]
  },
  sleeping_bag: {
    id: 'sleeping_bag',
    name: 'Sleeping Bag',
    description: 'Rest well.',
    category: 'COMFORT',
    width: 2,
    height: 3,
    icon: 'Bed',
    scoreValue: 5,
    rarity: 'COMMON',
    combatStats: { energyRegen: 2, maxEnergy: 20, healthRegen: 3 },
  },
  rock: {
    id: 'rock',
    name: 'Heavy Rock',
    description: 'Useless weight.',
    category: 'SABOTAGE',
    width: 2,
    height: 2,
    icon: 'Gem',
    scoreValue: -10,
    rarity: 'COMMON',
  },
  wooden_sword: {
    id: 'wooden_sword',
    name: 'Wooden Sword',
    description: 'A training blade.',
    category: 'WEAPON',
    width: 1,
    height: 3,
    icon: 'Sword',
    scoreValue: 5,
    triggerType: 'ATTACK',
    combatStats: { damage: 4, speed: 5, accuracy: 90, energyCost: 10, staminaCost: 0.7 },
    rarity: 'COMMON',
    recipe: {
      ingredients: ['wooden_sword', 'rock'],
      result: 'hero_sword'
    }
  },
  hero_sword: {
    id: 'hero_sword',
    name: 'Hero Sword',
    description: 'A blade of destiny.',
    category: 'WEAPON',
    width: 1,
    height: 3,
    icon: 'Sword',
    scoreValue: 25,
    triggerType: 'ATTACK',
    combatStats: { damage: 10, speed: 6, accuracy: 95, energyCost: 15, staminaCost: 1.0 },
    rarity: 'RARE',
    synergies: [
      {
        pattern: 'ADJACENT',
        description: 'Empower (+2 DMG per weapon)',
        targetIsSelf: true,
        apply: (_, target) => {
          if (ITEMS[target.itemId].category === 'WEAPON') return { buffs: { damage: 2 } };
          return {};
        }
      }
    ]
  },
  dagger: {
    id: 'dagger',
    name: 'Poison Dagger',
    description: 'Inflicts poison.',
    category: 'WEAPON',
    width: 1,
    height: 1,
    icon: 'Syringe',
    scoreValue: 7,
    triggerType: 'ATTACK',
    combatStats: { damage: 2, speed: 8, accuracy: 90, energyCost: 15, staminaCost: 0.5 },
    effects: [{ type: 'POISON', value: 2 }],
    rarity: 'UNCOMMON',
    synergies: [
      {
        pattern: 'ADJACENT',
        description: 'Dual Wield (+2 Speed)',
        targetIsSelf: true,
        apply: (_, target) => {
          if (ITEMS[target.itemId].category === 'WEAPON') return { buffs: { speed: 2 } };
          return {};
        }
      }
    ]
  },
  backpack: {
    id: 'backpack',
    name: 'Backpack',
    description: 'Significant storage.',
    category: 'CONTAINER',
    width: 2,
    height: 3,
    icon: 'Backpack',
    scoreValue: 0,
    rarity: 'UNCOMMON',
    synergies: [
      {
        pattern: 'ADJACENT',
        description: 'Easy Access (+10 Accuracy)',
        apply: (_, target) => {
          if (target.itemId === 'flashlight') return { buffs: { accuracy: 10 } };
          return {};
        }
      }
    ]
  },
  fanny_pack: {
    id: 'fanny_pack',
    name: 'Fanny Pack',
    description: 'Quick access.',
    category: 'CONTAINER',
    width: 2,
    height: 1,
    icon: 'Square',
    scoreValue: 5,
    rarity: 'COMMON',
    combatStats: { triggerSpeed: 1.1 } // +10% speed
  },
  stamina_sack: {
    id: 'stamina_sack',
    name: 'Stamina Sack',
    description: 'Breathe easy.',
    category: 'CONTAINER',
    width: 2,
    height: 1,
    icon: 'Package',
    scoreValue: 5,
    rarity: 'COMMON',
    combatStats: { staminaRegen: 1.0 } // +1.0 stamina/sec
  },
  lead_weight: {
    id: 'lead_weight',
    name: 'Lead Weight',
    description: 'Heavy burden.',
    category: 'SABOTAGE',
    width: 1,
    height: 1,
    icon: 'Anchor',
    scoreValue: -15,
    rarity: 'UNCOMMON',
    combatStats: { staminaRegen: -0.5 } // Drains stamina
  },
  rusty_nail: {
    id: 'rusty_nail',
    name: 'Rusty Nail',
    description: 'Sharp and dirty.',
    category: 'SABOTAGE',
    width: 1,
    height: 1,
    icon: 'Hash',
    scoreValue: -10,
    rarity: 'COMMON',
    synergies: [
      {
        pattern: 'ADJACENT',
        description: 'Self-Harm (Bleed)',
        targetIsSelf: true,
        apply: () => ({ buffs: { damage: -1 } }) // Placeholder for bleed mechanism
      }
    ]
  },
  knights_crest: {
    id: 'knights_crest',
    name: "Knight's Crest",
    description: 'Protects the flanks.',
    category: 'CLOTHING',
    width: 1,
    height: 1,
    icon: 'ShieldAlert',
    scoreValue: 25,
    rarity: 'RARE',
    combatStats: { defense: 10 },
    synergies: [
      {
        pattern: [
          { dx: 1, dy: 2 }, { dx: 2, dy: 1 },
          { dx: -1, dy: 2 }, { dx: -2, dy: 1 },
          { dx: 1, dy: -2 }, { dx: 2, dy: -1 },
          { dx: -1, dy: -2 }, { dx: -2, dy: -1 }
        ],
        description: 'Flank Protection (1.2x DEF)',
        targetIsSelf: true,
        apply: () => ({ multipliers: { defense: 1.2 } })
      },
      {
        pattern: 'ADJACENT',
        description: 'Reinforced (+5 DEF)',
        targetIsSelf: true,
        apply: (_, target) => {
          if (target.itemId === 'wooden_shield' || target.itemId === 'knights_crest') {
            return { buffs: { defense: 5 } };
          }
          return {};
        }
      }
    ]
  },
};

export const GRID_SIZE = 8; // 8x8 grid for now
