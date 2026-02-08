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
  },
  rope: {
    id: 'rope',
    name: 'Climbing Rope',
    description: 'For steep cliffs.',
    category: 'TOOL',
    width: 2,
    height: 3, // Long item
    icon: 'Ratchet', // approximation
    scoreValue: 15,
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
    combatStats: { heal: 15 }
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
  },
  rock: {
    id: 'rock',
    name: 'Heavy Rock',
    description: 'Just useless weight.',
    category: 'SABOTAGE',
    width: 2,
    height: 2,
    icon: 'Gem', // looks like a rock?
    scoreValue: -10,
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
  },
  dagger: {
      id: 'dagger',
      name: 'Poison Dagger',
      description: 'Inflicts poison.',
      category: 'WEAPON',
      width: 1,
      height: 1,
      icon: 'Syringe', // closest to poison dagger?
      scoreValue: 7,
      combatStats: { damage: 2, speed: 8, accuracy: 90 },
      effects: [{ type: 'POISON', value: 2 }] // 2 stacks
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
      effects: [{ type: 'STUN', value: 1, chance: 30 }] // 30% chance to stun
  },
  wand: {
      id: 'wand',
      name: 'Fire Wand',
      description: 'Burns targets. Needs Mana.',
      category: 'WEAPON',
      width: 1,
      height: 2,
      icon: 'Wand2',
      scoreValue: 15,
      combatStats: { damage: 2, speed: 6, accuracy: 100, manaCost: 5 },
      effects: [{ type: 'FIRE', value: 3 }] // 3 turn burn
  },
  bow: {
      id: 'bow',
      name: 'Ranger Bow',
      description: 'High accuracy.',
      category: 'WEAPON',
      width: 1,
      height: 3,
      icon: 'Target', // or Crosshair
      scoreValue: 12,
      combatStats: { damage: 6, speed: 7, accuracy: 95 }
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
      adjacency: [
          { type: 'BUFF', targetCategories: ['ESSENTIAL'], effect: '+5 DMG', value: 5 }
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
      adjacency: [
          { type: 'BUFF', targetIds: ['sword', 'knife'], effect: '+10 DMG', value: 10 }
      ]
  },
  curse_scrap: {
      id: 'curse_scrap',
      name: 'Cursed Scrap',
      description: 'Heavy and ominous. Cannot be moved.',
      category: 'SABOTAGE',
      width: 1,
      height: 1,
      icon: 'Skull',
      scoreValue: -20,
      adjacency: [
          { type: 'DEBUFF', targetCategories: ['ESSENTIAL', 'TOOL', 'SURVIVAL'], effect: '-10 Score', value: -10 }
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
      icon: 'Square', // Placeholder
      scoreValue: 0
  },
  backpack: {
      id: 'backpack',
      name: 'Backpack',
      description: 'Significant storage.',
      category: 'CONTAINER',
      width: 2,
      height: 3,
      icon: 'Backpack',
      scoreValue: 0
  },
  mana_crystal: {
      id: 'mana_crystal',
      name: 'Mana Crystal',
      description: 'Restores magical energy.',
      category: 'ESSENTIAL',
      width: 1,
      height: 1,
      icon: 'Sparkles',
      scoreValue: 5,
      // Passive mana regen? Or consumable?
      // Let's make it a passive stat stick for now
      adjacency: [
          { type: 'BUFF', targetIds: ['wand'], effect: '+10 Mana', value: 10 }
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
      scoreValue: 0
  }
};

export const GRID_SIZE = 8; // 8x8 grid for now
