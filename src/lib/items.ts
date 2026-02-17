import type { Item } from '../types';

export const ITEMS: Record<string, Item> = {
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
    combatStats: { maxEnergy: 10 },
    adjacency: [
      { type: 'BUFF', pattern: 'ADJACENT', targetIds: ['map', 'spyglass'], stat: 'speed', effect: '+10 Speed (Navigation Duo)', value: 10 }
    ]
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
    combatStats: { energyRegen: 2 },
    adjacency: [
      { type: 'BUFF', pattern: 'ADJACENT', targetIds: ['rations', 'dried_meat'], stat: 'energyRegen', effect: '+3 ⚡Regen (Meal+Drink)', value: 3 }
    ]
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
    combatStats: { energyRegen: 3 },
    adjacency: [
      { type: 'BUFF', pattern: 'ADJACENT', targetIds: ['water_bottle', 'canteen'], stat: 'energyRegen', effect: '+3 ⚡Regen (Meal+Drink)', value: 3 }
    ]
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
    adjacency: [
      { type: 'BUFF', pattern: 'ADJACENT', targetIds: ['compass', 'spyglass'], stat: 'accuracy', effect: '+15 Accuracy (Scouting)', value: 15 }
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
    adjacency: [
      { type: 'BUFF', pattern: 'ADJACENT', targetIds: ['bow', 'crossbow'], stat: 'accuracy', effect: '+15 Accuracy (Spot Targets)', value: 15 }
    ]
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
    adjacency: [
      { type: 'BUFF', pattern: 'ADJACENT', targetIds: ['spear', 'bear_trap'], stat: 'defense', effect: '+5 DEF (Perimeter Setup)', value: 5 }
    ]
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
    combatStats: { heal: 15 },
    rarity: 'UNCOMMON',
    adjacency: [
      { type: 'MULTIPLIER', pattern: 'ADJACENT', targetIds: ['potion', 'canteen', 'water_bottle'], stat: 'heal', effect: '1.5x Heal (Clean Wounds)', value: 1.5 }
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
    adjacency: [
      { type: 'BOOST_SQUARE', pattern: 'PARALLEL', stat: 'damage', effect: 'Boosts Damage (+5)', value: 5 }
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
    combatStats: { energyRegen: 2, maxEnergy: 20 },
    adjacency: [
      { type: 'BUFF', pattern: 'ADJACENT', targetIds: ['lux_pillow', 'large_tent'], stat: 'healthRegen', effect: '+3 Regen (Good Sleep)', value: 3 }
    ]
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
    adjacency: [
      { type: 'DEBUFF', pattern: 'ADJACENT', targetCategories: ['WEAPON', 'TOOL', 'ESSENTIAL', 'SURVIVAL'], stat: 'speed', effect: '-3 Speed (Heavy)', value: -3 }
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
    adjacency: [
      { type: 'DEBUFF', pattern: 'ADJACENT', targetCategories: ['TOOL'], stat: 'accuracy', effect: '-8 Accuracy (Noise)', value: -8 }
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
    combatStats: { damage: 2, speed: 8, accuracy: 90, energyCost: 15 },
    effects: [{ type: 'POISON', value: 2 }],
    rarity: 'UNCOMMON',
    adjacency: [
      { type: 'MULTIPLIER', pattern: 'ADJACENT', targetIds: ['katana'], stat: 'speed', effect: '1.3x Speed (Dual Blades)', value: 1.3 }
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
    combatStats: { damage: 8, speed: 2, accuracy: 70, energyCost: 50 },
    effects: [{ type: 'STUN', value: 1, chance: 30 }],
    rarity: 'UNCOMMON',
    adjacency: [
      { type: 'BUFF', pattern: 'ADJACENT', targetIds: ['battle_axe'], stat: 'damage', effect: '+5 DMG (Heavy Combo)', value: 5 }
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
    combatStats: { damage: 2, speed: 6, accuracy: 100, manaCost: 5, energyCost: 15 },
    effects: [{ type: 'FIRE', value: 3 }],
    rarity: 'UNCOMMON',
    adjacency: [
      { type: 'BUFF', pattern: 'ADJACENT', targetIds: ['mana_crystal'], stat: 'manaRegen', effect: '+5 Mana Regen (Arcane Link)', value: 5 }
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
    combatStats: { damage: 6, speed: 7, accuracy: 95, energyCost: 30 },
    rarity: 'UNCOMMON',
    adjacency: [
      { type: 'BUFF', pattern: 'ADJACENT', targetIds: ['scope', 'spyglass'], stat: 'accuracy', effect: '+10 Accuracy (Aimed Shot)', value: 10 }
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
    combatStats: { damage: 3, speed: 7, energyCost: 5 },
    rarity: 'COMMON',
    adjacency: [
      { type: 'BUFF', pattern: 'ADJACENT', targetIds: ['rope', 'first_aid'], stat: 'speed', effect: '+5 Speed (Multitool)', value: 5 }
    ]
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
    adjacency: [
      { type: 'DEBUFF', pattern: 'ADJACENT', targetCategories: ['WEAPON'], stat: 'damage', effect: '-5 DMG (Cursed)', value: -5 }
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
    combatStats: { damage: 12, speed: 3, accuracy: 80, energyCost: 60 },
    rarity: 'UNCOMMON',
    adjacency: [
      { type: 'BUFF', pattern: 'ADJACENT', targetIds: ['hammer'], stat: 'damage', effect: '+5 DMG (Heavy Combo)', value: 5 }
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
    combatStats: { damage: 7, speed: 5, accuracy: 85, energyCost: 35 },
    rarity: 'UNCOMMON',
    adjacency: [
      { type: 'BUFF', pattern: 'ADJACENT', targetIds: ['obsidian_shield', 'knights_crest'], stat: 'defense', effect: '+5 DEF (Phalanx)', value: 5, targetSelf: true }
    ]
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
    combatStats: { damage: 15, speed: 2, accuracy: 95, energyCost: 75 },
    rarity: 'RARE',
    adjacency: [
      { type: 'MULTIPLIER', pattern: 'ADJACENT', targetIds: ['scope'], stat: 'accuracy', effect: '1.5x Accuracy (Scoped Xbow)', value: 1.5 }
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
    combatStats: { damage: 2, speed: 9, accuracy: 80, energyCost: 8 },
    rarity: 'COMMON',
    adjacency: [
      { type: 'BUFF', pattern: 'ADJACENT', targetIds: ['rock'], stat: 'damage', effect: '+8 DMG (Ammo!)', value: 8 }
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
    combatStats: { damage: 6, speed: 10, accuracy: 90, energyCost: 30 },
    rarity: 'RARE',
    adjacency: [
      { type: 'MULTIPLIER', pattern: 'ADJACENT', targetIds: ['dagger'], stat: 'speed', effect: '1.3x Speed (Dual Blades)', value: 1.3 }
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
    adjacency: [
      { type: 'BOOST_SQUARE', pattern: 'ADJACENT', stat: 'accuracy', effect: 'Boosts Accuracy (+15)', value: 15 }
    ]
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
    rarity: 'COMMON',
    adjacency: [
      { type: 'BUFF', pattern: 'ADJACENT', targetIds: ['rock'], stat: 'damage', effect: '+15 DMG (Break Rock)', value: 15, targetSelf: true }
    ]
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
    effects: [{ type: 'STUN', value: 2, chance: 40 }],
    rarity: 'UNCOMMON',
    adjacency: [
      { type: 'BUFF', pattern: 'ADJACENT', targetIds: ['rope'], stat: 'defense', effect: '+8 DEF (Rigged Trap)', value: 8 }
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
    combatStats: { energyRegen: 5, maxEnergy: 30 },
    adjacency: [
      { type: 'BUFF', pattern: 'ADJACENT', targetIds: ['wand', 'crystal_ball'], stat: 'energyRegen', effect: '+5 ⚡Regen (Magic Synergy)', value: 5 }
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
    combatStats: { defense: 20 },
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
    combatStats: { defense: 30 },
    rarity: 'LEGENDARY',
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
    adjacency: [
      { type: 'MULTIPLIER', pattern: 'TWO_ACROSS', targetCategories: ['ESSENTIAL'], stat: 'manaRegen', effect: '2x Mana Regen', value: 2 }
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
