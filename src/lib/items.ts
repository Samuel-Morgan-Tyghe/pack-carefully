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

export const LEGACY_ITEMS: Record<string, Item> = {
  compass: {
    id: 'compass',
    name: 'Compass',
    description: 'Pathfinder.',
    category: 'ESSENTIAL',
    width: 1,
    height: 1,
    icon: 'Compass',
    scoreValue: 10,
    rarity: 'COMMON',
    triggerType: 'PASSIVE',
    combatStats: { maxEnergy: 10, speed: 10 },
  },
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
  },
  rations: {
    id: 'rations',
    name: 'Rations',
    description: 'Energy.',
    category: 'ESSENTIAL',
    width: 2,
    height: 2,
    icon: 'Package',
    scoreValue: 10,
    rarity: 'COMMON',
    combatStats: { energyRegen: 6 },
  },
  map: {
    id: 'map',
    name: 'Trail Map',
    description: 'Strategic planning.',
    category: 'ESSENTIAL',
    width: 2,
    height: 2,
    icon: 'Map',
    scoreValue: 15,
    rarity: 'COMMON',
    synergies: [
      {
        pattern: 'ADJACENT',
        description: 'Scouting (+15 Accuracy)',
        apply: (_, target) => {
          if (['compass', 'spyglass'].includes(target.itemId)) return { buffs: { accuracy: 15 } };
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
  rope: {
    id: 'rope',
    name: 'Climbing Rope',
    description: 'Mobility.',
    category: 'TOOL',
    width: 2,
    height: 3,
    icon: 'Ratchet',
    scoreValue: 15,
    rarity: 'COMMON',
    combatStats: { defense: 10 },
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
        description: '1.5x Heal (Clean Wounds)',
        apply: (_, target) => {
          if (['potion', 'canteen', 'water_bottle'].includes(target.itemId)) return { multipliers: { heal: 1.5 } };
          return {};
        }
      }
    ]
  },
  matches: {
    id: 'matches',
    name: 'Matches',
    description: 'Firestarter.',
    category: 'SURVIVAL',
    width: 1,
    height: 1,
    icon: 'Flame',
    scoreValue: 5,
    rarity: 'COMMON',
    synergies: [
      {
        pattern: 'ADJACENT',
        description: 'Fire-Coating (+5 DMG)',
        apply: (_, target) => {
          if (LEGACY_ITEMS[target.itemId].category === 'WEAPON') return { buffs: { damage: 5 } };
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
    synergies: [
      {
        pattern: 'ADJACENT',
        description: '-3 Speed (Heavy)',
        apply: (_, target) => {
          if (['WEAPON', 'TOOL', 'ESSENTIAL', 'SURVIVAL'].includes(LEGACY_ITEMS[target.itemId].category)) return { buffs: { speed: -3 } };
          return {};
        }
      }
    ]
  },
  broken_radio: {
    id: 'broken_radio',
    name: 'Broken Radio',
    description: 'Distracting noise.',
    category: 'SABOTAGE',
    width: 2,
    height: 1,
    icon: 'Radio',
    scoreValue: -5,
    rarity: 'COMMON',
    synergies: [
      {
        pattern: 'ADJACENT',
        description: '-8 Accuracy (Noise)',
        apply: (_, target) => {
          if (LEGACY_ITEMS[target.itemId].category === 'TOOL') return { buffs: { accuracy: -8 } };
          return {};
        }
      }
    ]
  },
  // WEAPONS (Dagger, Hammer, Wand, Bow, Knife, Sword, Potion, Curse Scrap) keep mostly same but check 'Scoring'
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
    combatStats: { damage: 2, speed: 8, accuracy: 90, energyCost: 15 },
    effects: [{ type: 'POISON', value: 2 }],
    rarity: 'UNCOMMON',
    synergies: [
      {
        pattern: 'ADJACENT',
        description: '1.3x Speed (Dual Blades)',
        apply: (_, target) => {
          if (target.itemId === 'katana') return { multipliers: { speed: 1.3 } };
          return {};
        }
      }
    ]
  },
  hammer: {
    id: 'hammer',
    name: 'War Hammer',
    description: 'Stuns enemies.',
    category: 'WEAPON',
    width: 2,
    height: 2,
    icon: 'Hammer',
    scoreValue: 12,
    triggerType: 'ATTACK',
    combatStats: { damage: 8, speed: 2, accuracy: 70, energyCost: 50 },
    effects: [{ type: 'STUN', value: 1, chance: 30 }],
    rarity: 'UNCOMMON',
    adjacency: [
      { type: 'BUFF', pattern: 'ADJACENT', targetCategories: ['WEAPON'], stat: 'damage', effect: '+5 DMG (Heavy Combo)', value: 5, targetSelf: true }
    ]
  },
  wand: {
    id: 'wand',
    name: 'Fire Wand',
    description: 'Burns targets.',
    category: 'WEAPON',
    width: 1,
    height: 2,
    icon: 'Wand2',
    scoreValue: 15,
    triggerType: 'ATTACK',
    combatStats: { damage: 2, speed: 6, accuracy: 100, manaCost: 5, energyCost: 15 },
    effects: [{ type: 'FIRE', value: 3 }],
    rarity: 'UNCOMMON',
    synergies: [
      {
        pattern: 'ADJACENT',
        description: '+5 Mana Regen (Arcane Link)',
        targetIsSelf: true,
        apply: (_, target) => {
          if (LEGACY_ITEMS[target.itemId].category === 'WEAPON') return { buffs: { manaRegen: 5 } };
          return {};
        }
      }
    ]
  },
  bow: {
    id: 'bow',
    name: 'Ranger Bow',
    description: 'High accuracy.',
    category: 'WEAPON',
    width: 1,
    height: 3,
    icon: 'Target',
    scoreValue: 12,
    triggerType: 'ATTACK',
    combatStats: { damage: 6, speed: 7, accuracy: 95, energyCost: 30 },
    rarity: 'UNCOMMON',
    synergies: [
      {
        pattern: 'ADJACENT',
        description: '+10 Accuracy (Aimed Shot)',
        targetIsSelf: true,
        apply: (_, target) => {
          if (LEGACY_ITEMS[target.itemId].category === 'WEAPON') return { buffs: { accuracy: 10 } };
          return {};
        }
      }
    ]
  },
  knife: {
    id: 'knife',
    name: 'Hunting Knife',
    description: 'Sharp blade.',
    category: 'TOOL',
    width: 1,
    height: 1,
    icon: 'Scissors',
    scoreValue: 5,
    triggerType: 'ATTACK',
    combatStats: { damage: 3, speed: 10, energyCost: 5 },
    rarity: 'COMMON',
  },
  sword: {
    id: 'sword',
    name: 'Iron Sword',
    description: 'Slay beasts.',
    category: 'TOOL',
    width: 1,
    height: 3,
    icon: 'Sword',
    scoreValue: 10,
    triggerType: 'ATTACK',
    combatStats: { damage: 5, speed: 5, energyCost: 20 },
    rarity: 'COMMON',
    adjacency: [
      { type: 'BUFF', pattern: 'ADJACENT', targetIds: ['obsidian_shield', 'knights_crest'], stat: 'defense', effect: '+8 DEF (Sword & Board)', value: 8 }
    ]
  },
  potion: {
    id: 'potion',
    name: 'Strength Potion',
    description: 'Boosts attack.',
    category: 'ESSENTIAL',
    width: 1,
    height: 1,
    icon: 'FlaskConical',
    scoreValue: 5,
    combatStats: { heal: 10, energyRegen: 2 },
    rarity: 'UNCOMMON',
    adjacency: [
      { type: 'BUFF', pattern: 'ADJACENT', targetCategories: ['WEAPON'], stat: 'damage', effect: '+8 DMG (Coated Blade)', value: 8 }
    ]
  },
  curse_scrap: {
    id: 'curse_scrap',
    name: 'Cursed Scrap',
    description: 'Heavy and ominous.',
    category: 'SABOTAGE',
    width: 1,
    height: 1,
    icon: 'Skull',
    scoreValue: -20,
    rarity: 'UNCOMMON',
    triggerType: 'PASSIVE',
    adjacency: [
      { type: 'DEBUFF', pattern: 'ADJACENT', stat: 'damage', effect: '-5 DMG (Cursed)', value: -5 }
    ]
  },
  // NEW WEAPONS (Battle Axe, Spear, Crossbow, Slingshot, Katana)
  battle_axe: {
    id: 'battle_axe',
    name: 'Battle Axe',
    description: 'Heavy hitter.',
    category: 'WEAPON',
    width: 2,
    height: 2,
    icon: 'Axe',
    scoreValue: 15,
    triggerType: 'ATTACK',
    combatStats: { damage: 12, speed: 3, accuracy: 80, energyCost: 60 },
    rarity: 'UNCOMMON',
    adjacency: [
      { type: 'BUFF', pattern: 'ADJACENT', targetCategories: ['WEAPON'], stat: 'damage', effect: '+5 DMG (Heavy Combo)', value: 5, targetSelf: true }
    ]
  },
  spear: {
    id: 'spear',
    name: 'Boar Spear',
    description: 'Keep them at distance.',
    category: 'WEAPON',
    width: 1,
    height: 4,
    icon: 'MoveVertical',
    scoreValue: 12,
    triggerType: 'ATTACK',
    combatStats: { damage: 7, speed: 5, accuracy: 85, energyCost: 35, defense: 8 },
    rarity: 'UNCOMMON',
  },
  crossbow: {
    id: 'crossbow',
    name: 'Heavy Crossbow',
    description: 'Slow but deadly.',
    category: 'WEAPON',
    width: 2,
    height: 3,
    icon: 'ArrowUpCircle',
    scoreValue: 20,
    triggerType: 'ATTACK',
    combatStats: { damage: 15, speed: 2, accuracy: 95, energyCost: 75 },
    rarity: 'RARE',
    adjacency: [
      { type: 'MULTIPLIER', pattern: 'ADJACENT', stat: 'accuracy', effect: '1.5x Accuracy (Scoped Xbow)', value: 1.5 }
    ]
  },
  slingshot: {
    id: 'slingshot',
    name: 'Slingshot',
    description: 'Better than nothing.',
    category: 'WEAPON',
    width: 1,
    height: 1,
    icon: 'CircleDot',
    scoreValue: 3,
    triggerType: 'ATTACK',
    combatStats: { damage: 2, speed: 9, accuracy: 80, energyCost: 8 },
    rarity: 'COMMON',
    adjacency: [
      { type: 'BUFF', pattern: 'ADJACENT', targetIds: ['matches'], stat: 'damage', effect: '+8 DMG (Ammo Synergy)', value: 8, targetSelf: true }
    ]
  },
  katana: {
    id: 'katana',
    name: 'Swift Katana',
    description: 'Razor sharp.',
    category: 'WEAPON',
    width: 1,
    height: 3,
    icon: 'Zap',
    scoreValue: 25,
    triggerType: 'ATTACK',
    combatStats: { damage: 6, speed: 10, accuracy: 90, energyCost: 30 },
    rarity: 'RARE',
    adjacency: [
      { type: 'MULTIPLIER', pattern: 'ADJACENT', stat: 'speed', effect: '1.3x Speed (Dual Blades)', value: 1.3 }
    ]
  },
  // NEW TOOLS (Lantern, Pickaxe, Spyglass, Bear Trap)
  lantern: {
    id: 'lantern',
    name: 'Oil Lantern',
    description: 'Constant light.',
    category: 'TOOL',
    width: 1,
    height: 1,
    icon: 'Lamp',
    scoreValue: 12,
    rarity: 'COMMON',
    combatStats: { accuracy: 20 },
  },
  pickaxe: {
    id: 'pickaxe',
    name: 'Rusty Pickaxe',
    description: 'Good for rocks.',
    category: 'TOOL',
    width: 2,
    height: 2,
    icon: 'Pickaxe',
    scoreValue: 8,
    rarity: 'COMMON'
  },
  spyglass: {
    id: 'spyglass',
    name: 'Spyglass',
    description: 'See them coming.',
    category: 'TOOL',
    width: 1,
    height: 2,
    icon: 'Search',
    scoreValue: 15,
    combatStats: { accuracy: 10 },
    rarity: 'UNCOMMON',
    adjacency: [
      { type: 'MULTIPLIER', pattern: 'ADJACENT', targetIds: ['bow', 'crossbow'], stat: 'damage', effect: '1.3x DMG (Spot Weakness)', value: 1.3 }
    ]
  },
  bear_trap: {
    id: 'bear_trap',
    name: 'Bear Trap',
    description: 'Stop them cold.',
    category: 'TOOL',
    width: 2,
    height: 2,
    icon: 'HandMetal',
    scoreValue: 10,
    triggerType: 'PASSIVE',
    effects: [{ type: 'STUN', value: 2, chance: 40 }],
    rarity: 'UNCOMMON',
    adjacency: [
      { type: 'BUFF', pattern: 'ADJACENT', stat: 'defense', effect: '+8 DEF (Rigged Trap)', value: 8 }
    ]
  },

  // NEW SURVIVAL
  large_tent: {
    id: 'large_tent',
    name: 'Masterwork Tent',
    description: 'Home away from home.',
    category: 'SURVIVAL',
    width: 3,
    height: 3,
    icon: 'Tent',
    scoreValue: 50,
    rarity: 'RARE',
    adjacency: [
      { type: 'BUFF', pattern: 'ADJACENT', targetIds: ['sleeping_bag', 'lux_pillow'], stat: 'healthRegen', effect: '+3 Regen (Camp)', value: 3 }
    ]
  },
  canteen: {
    id: 'canteen',
    name: 'Giant Canteen',
    description: 'Lots of water.',
    category: 'ESSENTIAL',
    width: 1,
    height: 2,
    icon: 'Droplets',
    scoreValue: 15,
    rarity: 'UNCOMMON',
    combatStats: { energyRegen: 4 },
    adjacency: [
      { type: 'MULTIPLIER', pattern: 'ADJACENT', targetIds: ['first_aid', 'potion'], stat: 'heal', effect: '1.5x Heal (Clean Wounds)', value: 1.5 }
    ]
  },
  dried_meat: {
    id: 'dried_meat',
    name: 'Salted Jerky',
    description: 'Long lasting.',
    category: 'ESSENTIAL',
    width: 1,
    height: 1,
    icon: 'Beef',
    scoreValue: 8,
    rarity: 'COMMON',
    combatStats: { energyRegen: 2 },
    adjacency: [
      { type: 'BUFF', pattern: 'ADJACENT', targetIds: ['rations'], stat: 'energyRegen', effect: '+2 ⚡Regen (More Food)', value: 2 }
    ]
  },
  // NEW COMFORT
  lux_pillow: {
    id: 'lux_pillow',
    name: 'Silk Pillow',
    description: 'Soft dreams.',
    category: 'COMFORT',
    width: 1,
    height: 1,
    icon: 'Cloud',
    scoreValue: 15,
    rarity: 'UNCOMMON',
    adjacency: [
      { type: 'BUFF', pattern: 'ADJACENT', targetIds: ['sleeping_bag'], stat: 'healthRegen', effect: '+3 Regen (Comfy Sleep)', value: 3 }
    ]
  },
  wooden_flute: {
    id: 'wooden_flute',
    name: 'Wooden Flute',
    description: 'Eases the mind.',
    category: 'COMFORT',
    width: 1,
    height: 2,
    icon: 'Music',
    scoreValue: 12,
    rarity: 'COMMON',
    adjacency: [
      { type: 'BUFF', pattern: 'ADJACENT', targetIds: ['adventure_journal'], stat: 'energyRegen', effect: '+3 ⚡Regen (Creative)', value: 3 }
    ]
  },
  adventure_journal: {
    id: 'adventure_journal',
    name: 'Travel Journal',
    description: 'Document the trip.',
    category: 'COMFORT',
    width: 1,
    height: 1,
    icon: 'BookOpen',
    scoreValue: 20,
    rarity: 'RARE',
    adjacency: [
      { type: 'BUFF', pattern: 'ADJACENT', targetIds: ['compass', 'map'], stat: 'accuracy', effect: '+10 Accuracy (Document Route)', value: 10 }
    ]
  },

  // NEW SABOTAGE
  sticky_tar: {
    id: 'sticky_tar',
    name: 'Pot of Tar',
    description: 'Gunk up the works.',
    category: 'SABOTAGE',
    width: 1,
    height: 1,
    icon: 'Droplet',
    scoreValue: -15,
    rarity: 'UNCOMMON',
    adjacency: [
      { type: 'DEBUFF', pattern: 'ADJACENT', targetCategories: ['WEAPON'], stat: 'speed', effect: '-5 Speed (Gummed Up)', value: -5 }
    ]
  },
  rusty_nails: {
    id: 'rusty_nails',
    name: 'Bag of Nails',
    description: 'Sharp and dirty.',
    category: 'SABOTAGE',
    width: 1,
    height: 1,
    icon: 'Hash',
    scoreValue: -5,
    effects: [{ type: 'POISON', value: 1 }],
    rarity: 'COMMON',
    adjacency: [
      { type: 'DEBUFF', pattern: 'ADJACENT', targetCategories: ['COMFORT', 'SURVIVAL'], stat: 'healthRegen', effect: '-3 Regen (Dangerous Rest)', value: -3 }
    ]
  },

  // CONTAINERS
  pouch: {
    id: 'pouch',
    name: 'Leather Pouch',
    description: 'Expand your bag.',
    category: 'CONTAINER',
    width: 2,
    height: 2,
    icon: 'Square',
    scoreValue: 0,
    rarity: 'COMMON',
    adjacency: [
      { type: 'BUFF', pattern: 'ADJACENT', targetCategories: ['ESSENTIAL'], stat: 'energyRegen', effect: '+2 ⚡Regen (Efficient Packing)', value: 2 }
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
    adjacency: [
      { type: 'BUFF', pattern: 'ADJACENT', targetCategories: ['ESSENTIAL', 'WEAPON', 'TOOL', 'SURVIVAL'], stat: 'maxEnergy', effect: '+5 Max ⚡ (More Space)', value: 5 }
    ]
  },
  iron_chest: {
    id: 'iron_chest',
    name: 'Large Iron Chest',
    description: 'Massive holds.',
    category: 'CONTAINER',
    width: 3,
    height: 3,
    icon: 'Container',
    scoreValue: 0,
    rarity: 'RARE',
    adjacency: [
      { type: 'BUFF', pattern: 'ADJACENT', targetCategories: ['WEAPON'], stat: 'defense', effect: '+3 DEF (Armored Storage)', value: 3 }
    ]
  },
  barrel: {
    id: 'barrel',
    name: 'Wooden Barrel',
    description: 'Round and sturdy.',
    category: 'CONTAINER',
    width: 2,
    height: 2,
    icon: 'Circle',
    scoreValue: 0,
    rarity: 'UNCOMMON',
    adjacency: [
      { type: 'BUFF', pattern: 'ADJACENT', targetCategories: ['SURVIVAL'], stat: 'defense', effect: '+5 DEF (Barricade)', value: 5 }
    ]
  },

  // LEGENDARIES & SPECIALS
  mana_crystal: {
    id: 'mana_crystal',
    name: 'Mana Crystal',
    description: 'Restores magical energy.',
    category: 'ESSENTIAL',
    width: 1,
    height: 1,
    icon: 'Sparkles',
    scoreValue: 5,
    rarity: 'UNCOMMON',
    triggerType: 'PASSIVE',
    combatStats: { energyRegen: 5, maxEnergy: 30 },
    adjacency: [
      { type: 'BUFF', pattern: 'ADJACENT', stat: 'energyRegen', effect: '+5 ⚡Regen (Magic Synergy)', value: 5 }
    ]
  },
  pocket: {
    id: 'pocket',
    name: 'Pocket',
    description: 'Small addition.',
    category: 'CONTAINER',
    width: 1,
    height: 2,
    icon: 'RectangleVertical',
    scoreValue: 0,
    rarity: 'COMMON',
    adjacency: [
      { type: 'BUFF', pattern: 'ADJACENT', targetCategories: ['WEAPON'], stat: 'speed', effect: '+2 Speed (Quick Draw)', value: 2 }
    ]
  },
  catalyst: {
    id: 'catalyst',
    name: 'Catalyst Vial',
    description: 'Doubles poison.',
    category: 'TOOL',
    width: 1,
    height: 1,
    icon: 'FlaskConical',
    scoreValue: 8,
    rarity: 'UNCOMMON',
    adjacency: [
      { type: 'MULTIPLIER', pattern: 'ADJACENT', targetIds: ['dagger', 'rusty_nails'], stat: 'damage', effect: '1.5x DMG (Amplify Poison)', value: 1.5 }
    ]
  },
  oil_flask: {
    id: 'oil_flask',
    name: 'Oil Flask',
    description: 'Volatile.',
    category: 'TOOL',
    width: 1,
    height: 1,
    icon: 'Droplets',
    scoreValue: 6,
    rarity: 'COMMON',
    adjacency: [
      { type: 'BUFF', pattern: 'ADJACENT', targetIds: ['matches', 'lantern'], stat: 'damage', effect: '+15 DMG (Fire Combo)', value: 15 }
    ]
  },
  scope: {
    id: 'scope',
    name: 'Marksman Scope',
    description: 'Buffs Row.',
    category: 'TOOL',
    width: 2,
    height: 1,
    icon: 'Crosshair',
    scoreValue: 10,
    rarity: 'RARE',
    adjacency: [
      { type: 'MULTIPLIER', pattern: 'ADJACENT', targetIds: ['crossbow', 'bow'], stat: 'accuracy', effect: '1.5x Accuracy (Scoped)', value: 1.5 }
    ]
  },
  excalibur: {
    id: 'excalibur',
    name: 'Excalibur',
    description: 'Pure power.',
    category: 'WEAPON',
    width: 2,
    height: 4,
    icon: 'Sword',
    scoreValue: 100,
    triggerType: 'ATTACK',
    combatStats: { damage: 25, speed: 5, accuracy: 100, energyCost: 120 },
    rarity: 'LEGENDARY',
    adjacency: [
      { type: 'MULTIPLIER', pattern: 'ADJACENT', stat: 'damage', effect: '2x DMG', value: 2.0 }
    ]
  },
  obsidian_shield: {
    id: 'obsidian_shield',
    name: 'Obsidian Shield',
    description: 'Unbreakable.',
    category: 'TOOL',
    width: 2,
    height: 2,
    icon: 'Shield',
    scoreValue: 50,
    triggerType: 'SHIELD',
    combatStats: { defense: 20, block: 30, energyCost: 25 },
    rarity: 'RARE',
    adjacency: [
      { type: 'MULTIPLIER', pattern: 'ADJACENT', stat: 'defense', effect: '1.5x Defense', value: 1.5 }
    ]
  },
  golden_feather: {
    id: 'golden_feather',
    name: 'Golden Feather',
    description: 'Prophetic insight.',
    category: 'ESSENTIAL',
    width: 1,
    height: 1,
    icon: 'Feather',
    scoreValue: 30,
    rarity: 'LEGENDARY',
    adjacency: [
      { type: 'BOOST_SQUARE', pattern: 'ADJACENT', stat: 'speed', effect: 'Boosts Speed (+20)', value: 20 }
    ]
  },
  dragon_scale: {
    id: 'dragon_scale',
    name: 'Dragon Scale',
    description: 'Fireproof armor.',
    category: 'SURVIVAL',
    width: 2,
    height: 2,
    icon: 'ShieldCheck',
    scoreValue: 80,
    rarity: 'LEGENDARY',
    triggerType: 'SHIELD',
    combatStats: { defense: 30, block: 50, energyCost: 40 },
    adjacency: [
      { type: 'MULTIPLIER', pattern: 'ADJACENT', stat: 'defense', effect: '2x Defense', value: 2.0 }
    ]
  },
  crystal_ball: {
    id: 'crystal_ball',
    name: 'Crystal Ball',
    description: 'Know the future.',
    category: 'ESSENTIAL',
    width: 1,
    height: 1,
    icon: 'CircleDot',
    scoreValue: 50,
    rarity: 'LEGENDARY',
    triggerType: 'PASSIVE',
    adjacency: [
      { type: 'MULTIPLIER', pattern: 'TWO_ACROSS', stat: 'manaRegen', effect: '2x Mana Regen', value: 2 }
    ]
  },
  prism_light: {
    id: 'prism_light',
    name: 'Prism of Light',
    description: 'Fires a beam of power.',
    category: 'TOOL',
    width: 1,
    height: 1,
    icon: 'Sun',
    scoreValue: 20,
    rarity: 'RARE',
    adjacency: [
      {
        type: 'BOOST_SQUARE',
        pattern: [{ dx: 1, dy: 0 }, { dx: 2, dy: 0 }, { dx: 3, dy: 0 }, { dx: 4, dy: 0 }],
        stat: 'damage',
        effect: 'Beam of Damage (+10)',
        value: 10
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
    adjacency: [
      {
        type: 'MULTIPLIER',
        pattern: [
          { dx: 1, dy: 2 }, { dx: 2, dy: 1 },
          { dx: -1, dy: 2 }, { dx: -2, dy: 1 },
          { dx: 1, dy: -2 }, { dx: 2, dy: -1 },
          { dx: -1, dy: -2 }, { dx: -2, dy: -1 }
        ],
        stat: 'defense',
        effect: '1.2x DEF (L-Shape)',
        value: 1.2
      }
    ]
  },
  master_triangle: {
    id: 'master_triangle',
    name: "Master's Triangle",
    description: 'Ancient focus.',
    category: 'ESSENTIAL',
    width: 1,
    height: 1,
    icon: 'Triangle',
    scoreValue: 40,
    rarity: 'LEGENDARY',
    adjacency: [
      {
        type: 'MULTIPLIER',
        pattern: [
          { dx: -1, dy: 1 }, { dx: 1, dy: 1 },
          { dx: -2, dy: 2 }, { dx: 0, dy: 2 }, { dx: 2, dy: 2 }
        ],
        stat: 'cooldown',
        effect: '0.9x Cooldown PER Neighbor',
        value: 0.9,
        targetSelf: true,
        targetCategories: ['WEAPON', 'TOOL', 'SURVIVAL', 'CLOTHING', 'CONTAINER', 'ESSENTIAL']
      }
    ]
  }
};

export const GRID_SIZE = 8; // 8x8 grid for now
