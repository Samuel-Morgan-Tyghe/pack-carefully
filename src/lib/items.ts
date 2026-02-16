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
    rarity: 'COMMON',
    adjacency: [
      { type: 'BUFF', pattern: 'ADJACENT', targetCategories: ['ESSENTIAL'], effect: '+10 Score', value: 10 }
    ]
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
    rarity: 'COMMON',
    adjacency: [
      { type: 'BUFF', pattern: 'ADJACENT', targetCategories: ['SURVIVAL'], effect: '+5 Heal', value: 5 }
    ]
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
    rarity: 'COMMON',
    adjacency: [
      { type: 'BUFF', pattern: 'PARALLEL', targetCategories: ['COMFORT'], effect: '+10 Score', value: 10 }
    ]
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
    rarity: 'COMMON',
    adjacency: [
      { type: 'BOOST_SQUARE', pattern: 'ADJACENT', effect: 'Stars neighbors', value: 1 }
    ]
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
    rarity: 'COMMON',
    adjacency: [
      { type: 'MULTIPLIER', pattern: 'ADJACENT', stat: 'multiplier', effect: '1.2x All Stats', value: 1.2 }
    ]
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
    rarity: 'COMMON',
    adjacency: [
      { type: 'BUFF', pattern: 'TWO_ACROSS', targetCategories: ['TOOL'], effect: '+15 Score', value: 15 }
    ]
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
    rarity: 'UNCOMMON',
    adjacency: [
      { type: 'MULTIPLIER', pattern: 'ADJACENT', stat: 'heal', effect: '1.5x Heal', value: 1.5 }
    ]
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
    rarity: 'COMMON',
    adjacency: [
      { type: 'BOOST_SQUARE', pattern: 'PARALLEL', effect: 'Stars across gap', value: 1 }
    ]
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
    rarity: 'COMMON',
    adjacency: [
      { type: 'BUFF', pattern: 'ADJACENT', targetCategories: ['COMFORT'], effect: '+10 Score', value: 10 }
    ]
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
    rarity: 'COMMON',
    adjacency: [
      { type: 'DEBUFF', pattern: 'ADJACENT', targetCategories: ['CONTAINER'], effect: '-5 Capacity (fake)', value: -5 }
    ]
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
    rarity: 'UNCOMMON',
    adjacency: [
      { type: 'MULTIPLIER', pattern: 'ADJACENT', stat: 'speed', effect: '1.5x Speed', value: 1.5 }
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
    combatStats: { damage: 8, speed: 2, accuracy: 70 },
    effects: [{ type: 'STUN', value: 1, chance: 30 }],
    rarity: 'UNCOMMON',
    adjacency: [
      { type: 'MULTIPLIER', pattern: 'PARALLEL', stat: 'damage', effect: '1.3x DMG', value: 1.3 }
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
    combatStats: { damage: 2, speed: 6, accuracy: 100, manaCost: 5 },
    effects: [{ type: 'FIRE', value: 3 }],
    rarity: 'UNCOMMON',
    adjacency: [
      { type: 'BOOST_SQUARE', pattern: 'TWO_ACROSS', effect: 'Stars far away', value: 1 }
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
    combatStats: { damage: 6, speed: 7, accuracy: 95 },
    rarity: 'UNCOMMON',
    adjacency: [
      { type: 'MULTIPLIER', pattern: 'ADJACENT', stat: 'damage', effect: '1.2x DMG', value: 1.2 }
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
    combatStats: { damage: 3, speed: 7 },
    rarity: 'COMMON',
    adjacency: [
      { type: 'BUFF', pattern: 'ADJACENT', targetCategories: ['ESSENTIAL'], effect: '+5 Defense', value: 5 }
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
    combatStats: { damage: 5, speed: 5 },
    rarity: 'COMMON',
    adjacency: [
      { type: 'BUFF', pattern: 'ADJACENT', targetCategories: ['ESSENTIAL'], effect: '+5 DMG', value: 5 }
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
    combatStats: { heal: 10 },
    rarity: 'UNCOMMON',
    adjacency: [
      { type: 'BUFF', pattern: 'ADJACENT', targetIds: ['sword', 'knife'], effect: '+10 DMG', value: 10 }
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
      { type: 'DEBUFF', pattern: 'ADJACENT', targetCategories: ['ESSENTIAL', 'TOOL', 'SURVIVAL'], effect: '-10 Score', value: -10 }
    ]
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
    rarity: 'UNCOMMON',
    adjacency: [
      { type: 'MULTIPLIER', pattern: 'ADJACENT', stat: 'damage', effect: '1.4x DMG', value: 1.4 }
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
    combatStats: { damage: 7, speed: 5, accuracy: 85 },
    rarity: 'UNCOMMON',
    adjacency: [
      { type: 'BUFF', pattern: 'TWO_ACROSS', targetCategories: ['WEAPON'], effect: '+10 DMG', value: 10 }
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
    combatStats: { damage: 15, speed: 2, accuracy: 95 },
    rarity: 'RARE',
    adjacency: [
      { type: 'MULTIPLIER', pattern: 'PARALLEL', stat: 'damage', effect: '1.2x DMG', value: 1.2 }
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
    combatStats: { damage: 2, speed: 9, accuracy: 80 },
    rarity: 'COMMON',
    adjacency: [
      { type: 'BUFF', pattern: 'ADJACENT', targetCategories: ['ESSENTIAL'], effect: '+2 DMG', value: 2 }
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
    combatStats: { damage: 6, speed: 10, accuracy: 90 },
    rarity: 'RARE',
    adjacency: [
      { type: 'MULTIPLIER', pattern: 'ADJACENT', stat: 'speed', effect: '1.2x Speed', value: 1.2 }
    ]
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
    rarity: 'COMMON',
    adjacency: [
      { type: 'BOOST_SQUARE', pattern: 'ADJACENT', effect: 'Lights neighbors', value: 1 }
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
      { type: 'BUFF', pattern: 'PARALLEL', targetIds: ['rock'], effect: '+10 Score', value: 10 }
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
      { type: 'MULTIPLIER', pattern: 'ADJACENT', stat: 'accuracy', effect: '1.5x Accuracy', value: 1.5 }
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
      { type: 'BOOST_SQUARE', pattern: 'ADJACENT', effect: 'Trap proximity', value: 1 }
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
      { type: 'BUFF', pattern: 'ADJACENT', targetCategories: ['COMFORT'], effect: '+30 Score', value: 30 }
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
    adjacency: [
      { type: 'MULTIPLIER', pattern: 'ADJACENT', stat: 'heal', effect: '1.2x heal', value: 1.2 }
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
    adjacency: [
      { type: 'BUFF', pattern: 'PARALLEL', targetCategories: ['SURVIVAL'], effect: '+5 Defense', value: 5 }
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
      { type: 'BUFF', pattern: 'ADJACENT', targetCategories: ['COMFORT'], effect: '+20 Score', value: 20 }
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
      { type: 'BUFF', pattern: 'PARALLEL', targetCategories: ['SURVIVAL'], effect: '+10 Score', value: 10 }
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
      { type: 'BUFF', pattern: 'TWO_ACROSS', targetCategories: ['ESSENTIAL'], effect: '+20 Score', value: 20 }
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
      { type: 'DEBUFF', pattern: 'ADJACENT', targetCategories: ['TOOL'], effect: '-5 Speed', value: -5 }
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
      { type: 'DEBUFF', pattern: 'ADJACENT', targetCategories: ['COMFORT'], effect: '-10 Score', value: -10 }
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
      { type: 'BUFF', pattern: 'ADJACENT', targetCategories: ['ESSENTIAL'], effect: '+2 Score', value: 2 }
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
      { type: 'BUFF', pattern: 'ADJACENT', targetCategories: ['ESSENTIAL'], effect: '+5 Score', value: 5 }
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
      { type: 'DEBUFF', pattern: 'ADJACENT', targetCategories: ['TOOL'], effect: '-5 Accuracy', value: -5 }
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
      { type: 'BOOST_SQUARE', pattern: 'ADJACENT', effect: 'Stars neighbors', value: 1 }
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
    adjacency: [
      { type: 'BUFF', pattern: 'ADJACENT', targetIds: ['wand'], effect: '+10 Mana', value: 10 }
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
      { type: 'BUFF', pattern: 'ADJACENT', targetCategories: ['TOOL'], effect: '+1 DMG', value: 1 }
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
      { type: 'MULTIPLIER', pattern: 'ADJACENT', stat: 'multiplier', effect: '2x Poison (fake)', value: 2 }
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
      { type: 'BUFF', pattern: 'PARALLEL', targetIds: ['matches'], effect: '+20 DMG (fake)', value: 20 }
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
      { type: 'MULTIPLIER', pattern: 'PARALLEL', stat: 'accuracy', effect: '1.5x Accuracy', value: 1.5 }
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
    combatStats: { damage: 25, speed: 5, accuracy: 100 },
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
      { type: 'BOOST_SQUARE', pattern: 'ADJACENT', effect: 'Divine Stars', value: 5 }
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
      { type: 'BUFF', pattern: 'TWO_ACROSS', targetCategories: ['ESSENTIAL'], effect: '+50 Score', value: 50 }
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
        effect: 'Beam of Stars',
        value: 1
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
