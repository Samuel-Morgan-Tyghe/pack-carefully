import type { Item } from '../types';

export const ITEMS: Record<string, Item> = {
  compass: {
    id: 'compass',
    name: 'Compass',
    description: 'Never get lost.',
    category: 'ESSENTIAL',
    width: 1,
    height: 1,
    icon: 'Compass',
    scoreValue: 10,
    rarity: 'COMMON'
  },
  water_bottle: {
    id: 'water_bottle',
    name: 'Water Bottle',
    description: 'Hydration is key.',
    category: 'ESSENTIAL',
    width: 1,
    height: 2,
    icon: 'Droplets',
    scoreValue: 10,
    rarity: 'COMMON'
  },
  rations: {
    id: 'rations',
    name: 'Rations',
    description: 'Dried food packs.',
    category: 'ESSENTIAL',
    width: 2,
    height: 2,
    icon: 'Package',
    scoreValue: 10,
    rarity: 'COMMON'
  },
  map: {
    id: 'map',
    name: 'Trail Map',
    description: 'Know the path.',
    category: 'ESSENTIAL',
    width: 2,
    height: 2,
    icon: 'Map',
    scoreValue: 15,
    rarity: 'COMMON'
  },
  flashlight: {
    id: 'flashlight',
    name: 'Flashlight',
    description: 'See in the dark.',
    category: 'TOOL',
    width: 1,
    height: 2,
    icon: 'Flashlight',
    scoreValue: 5,
    rarity: 'COMMON'
  },
  rope: {
    id: 'rope',
    name: 'Climbing Rope',
    description: 'For steep cliffs.',
    category: 'TOOL',
    width: 2,
    height: 3,
    icon: 'Ratchet',
    scoreValue: 15,
    rarity: 'COMMON'
  },
  first_aid: {
    id: 'first_aid',
    name: 'First Aid Kit',
    description: 'Patch up wounds.',
    category: 'SURVIVAL',
    width: 2,
    height: 2,
    icon: 'BriefcaseMedical',
    scoreValue: 20,
    combatStats: { heal: 15 },
    rarity: 'UNCOMMON'
  },
  matches: {
    id: 'matches',
    name: 'Matches',
    description: 'Fire is life.',
    category: 'SURVIVAL',
    width: 1,
    height: 1,
    icon: 'Flame',
    scoreValue: 5,
    rarity: 'COMMON'
  },
  sleeping_bag: {
    id: 'sleeping_bag',
    name: 'Sleeping Bag',
    description: 'Warm nights.',
    category: 'COMFORT',
    width: 2,
    height: 3,
    icon: 'Bed',
    scoreValue: 5,
    rarity: 'COMMON'
  },
  rock: {
    id: 'rock',
    name: 'Heavy Rock',
    description: 'Just useless weight.',
    category: 'SABOTAGE',
    width: 2,
    height: 2,
    icon: 'Gem',
    scoreValue: -10,
    rarity: 'COMMON'
  },
  broken_radio: {
    id: 'broken_radio',
    name: 'Broken Radio',
    description: 'Makes noise, does nothing.',
    category: 'SABOTAGE',
    width: 2,
    height: 1,
    icon: 'Radio',
    scoreValue: -5,
    rarity: 'COMMON'
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
    combatStats: { damage: 2, speed: 8, accuracy: 90 },
    effects: [{ type: 'POISON', value: 2 }],
    rarity: 'UNCOMMON'
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
    combatStats: { damage: 8, speed: 2, accuracy: 70 },
    effects: [{ type: 'STUN', value: 1, chance: 30 }],
    rarity: 'UNCOMMON'
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
    combatStats: { damage: 2, speed: 6, accuracy: 100, manaCost: 5 },
    effects: [{ type: 'FIRE', value: 3 }],
    rarity: 'UNCOMMON'
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
    combatStats: { damage: 6, speed: 7, accuracy: 95 },
    rarity: 'UNCOMMON'
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
    combatStats: { damage: 3, speed: 7 },
    adjacency: [
      { type: 'BUFF', targetCategories: ['ESSENTIAL'], effect: '+5 Defense', value: 5 }
    ],
    rarity: 'COMMON'
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
    combatStats: { damage: 5, speed: 5 },
    adjacency: [
      { type: 'BUFF', targetCategories: ['ESSENTIAL'], effect: '+5 DMG', value: 5 }
    ],
    rarity: 'COMMON'
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
    combatStats: { heal: 10 },
    adjacency: [
      { type: 'BUFF', targetIds: ['sword', 'knife'], effect: '+10 DMG', value: 10 }
    ],
    rarity: 'UNCOMMON'
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
    adjacency: [
      { type: 'DEBUFF', targetCategories: ['ESSENTIAL', 'TOOL', 'SURVIVAL'], effect: '-10 Score', value: -10 }
    ],
    rarity: 'UNCOMMON'
  },

  // NEW WEAPONS
  battle_axe: {
    id: 'battle_axe',
    name: 'Battle Axe',
    description: 'Heavy hitter.',
    category: 'WEAPON',
    width: 2,
    height: 2,
    icon: 'Axe',
    scoreValue: 15,
    combatStats: { damage: 12, speed: 3, accuracy: 80 },
    rarity: 'UNCOMMON'
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
    combatStats: { damage: 7, speed: 5, accuracy: 85 },
    rarity: 'UNCOMMON'
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
    combatStats: { damage: 15, speed: 2, accuracy: 95 },
    rarity: 'RARE'
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
    combatStats: { damage: 2, speed: 9, accuracy: 80 },
    rarity: 'COMMON'
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
    combatStats: { damage: 6, speed: 10, accuracy: 90 },
    rarity: 'RARE'
  },

  // NEW TOOLS
  lantern: {
    id: 'lantern',
    name: 'Oil Lantern',
    description: 'Constant light.',
    category: 'TOOL',
    width: 1,
    height: 1,
    icon: 'Lamp',
    scoreValue: 12,
    rarity: 'COMMON'
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
    rarity: 'UNCOMMON'
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
    rarity: 'UNCOMMON'
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
    rarity: 'RARE'
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
    rarity: 'UNCOMMON'
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
    rarity: 'COMMON'
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
    rarity: 'UNCOMMON'
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
    rarity: 'COMMON'
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
    rarity: 'RARE'
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
    adjacency: [
      { type: 'DEBUFF', targetCategories: ['TOOL'], effect: '-5 Speed', value: -5 }
    ],
    rarity: 'UNCOMMON'
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
    rarity: 'COMMON'
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
    rarity: 'COMMON'
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
    rarity: 'UNCOMMON'
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
    rarity: 'RARE'
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
    rarity: 'UNCOMMON'
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
    adjacency: [
      { type: 'BUFF', targetIds: ['wand'], effect: '+10 Mana', value: 10 }
    ],
    rarity: 'UNCOMMON'
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
    rarity: 'COMMON'
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
    adjacency: [
      { type: 'BUFF', targetCategories: ['WEAPON'], effect: '+Double Poison', value: 2 }
    ],
    rarity: 'UNCOMMON'
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
    rarity: 'COMMON'
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
    adjacency: [
      { type: 'BUFF', targetCategories: ['WEAPON'], effect: '+5 Accuracy', value: 5 }
    ],
    rarity: 'RARE'
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
    combatStats: { damage: 25, speed: 5, accuracy: 100 },
    rarity: 'LEGENDARY'
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
    rarity: 'RARE'
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
    rarity: 'LEGENDARY'
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
    rarity: 'LEGENDARY'
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
    adjacency: [
      { type: 'BUFF', targetCategories: ['ESSENTIAL'], effect: '+10 Score to all Essentials', value: 10 }
    ],
    rarity: 'LEGENDARY'
  }
};

export const GRID_SIZE = 8; // 8x8 grid for now
