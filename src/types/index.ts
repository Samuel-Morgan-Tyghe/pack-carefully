export type Role = 'Hiker' | 'Traitor';

export type GamePhase = 'LOBBY' | 'BAG_BUILDING' | 'DRAFT' | 'JOURNEY' | 'CAMPFIRE' | 'FINALE' | 'GAME_OVER';

export type ItemCategory = 'ESSENTIAL' | 'TOOL' | 'SURVIVAL' | 'COMFORT' | 'SABOTAGE' | 'CONTAINER' | 'WEAPON' | 'CLOTHING';

export type AdjacencyPattern = 'ADJACENT' | 'PARALLEL' | 'TWO_ACROSS' | { dx: number, dy: number }[];

export interface AdjacencyRule {
  type: 'BUFF' | 'DEBUFF' | 'MULTIPLIER' | 'BOOST_SQUARE';
  pattern: AdjacencyPattern;
  targetCategories?: ItemCategory[];
  targetIds?: string[];
  stat?: 'damage' | 'defense' | 'block' | 'heal' | 'speed' | 'accuracy' | 'multiplier' | 'cooldown' | 'healthRegen' | 'manaRegen' | 'maxMana' | 'energyRegen' | 'maxEnergy';
  effect: string;
  value: number; // For BUFF/DEBUFF: added value. For MULTIPLIER: factor (e.g. 1.5). For BOOST_SQUARE: level?
  stacking?: boolean; // If true, applies for EACH item matching the pattern
  targetSelf?: boolean; // If true, the buff applies to the source item, not the target
}

export interface Item {
  id: string;
  name: string;
  description: string;
  category: ItemCategory;
  width: number;
  height: number;
  icon: string; // Lucide icon name or image path
  scoreValue: number; // Positive for good items, negative for sabotage
  rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'LEGENDARY';
  adjacency?: AdjacencyRule[];
  combatStats?: {
    damage?: number;
    defense?: number; // Passive mitigation (Armor)
    block?: number; // Active mitigation (Shield HP)
    heal?: number;
    speed?: number; // Initiative
    accuracy?: number; // 0-100%
    manaCost?: number;
    maxMana?: number;
    manaRegen?: number;
    shieldRegen?: number;
    healthRegen?: number;
    energyCost?: number; // Energy consumed when this weapon fires
    maxEnergy?: number; // Adds to max energy pool
    energyRegen?: number; // Energy regenerated per second
  };
  effects?: {
    type: 'POISON' | 'FIRE' | 'STUN' | 'SLOW' | 'BLEED';
    value: number; // Stacks or Duration
    chance?: number; // % chance to apply
  }[];
}

export interface Player {
  id: string;
  name: string;
  role: Role;
  isReady: boolean;
  isTraitor: boolean; // redundancy for easy access
  avatarColor: string;
  currentPath: 'LEFT' | 'RIGHT' | null;
}

export interface GameState {
  day: number;
  round: number; // 1-5 (Same as day, but for clarity)
  morale: number; // 0-100
  isGameOver: boolean;
  gameResult: 'WIN' | 'LOSS' | null;
  journeyStage: 'SELECTION' | 'ENCOUNTER' | 'RESULTS' | 'SCAVENGE';
  selectedPath: 'LEFT' | 'RIGHT' | null;
  pathStatus: {
    LEFT: 'PENDING' | 'RESOLVED';
    RIGHT: 'PENDING' | 'RESOLVED';
  };
  lastEncounterResult: {
    success: boolean;
    score: number;
    difficulty: number;
    message: string;
  } | null;
}

export interface Coordinate {
  x: number;
  y: number;
}

export interface Container {
  id: string;
  ownerId: string;
  type: 'POUCH' | 'BACKPACK' | 'POCKET';
  cells: Coordinate[]; // Absolute grid coordinates map to specific grid slots
  capacity: number; // Number of cells
  disabledCells?: Coordinate[]; // Cells that have been "Cut" (Sabotage)
}

export interface GridCell {
  x: number;
  y: number;
  itemId: string | null;
  occupied: boolean;
  ownerId?: string | null;
}

export interface InventoryItemInstance {
  instanceId: string;
  itemId: string;
  x: number;
  y: number;
  rotation: 0 | 90 | 180 | 270;
  locked?: boolean; // If true, cannot be moved
  ownerId: string; // The player who owns this item
  disguiseItemId?: string; // If set, this item looks like this ItemId
}

export interface DraftState {
  availableItems: Record<string, Item[]>; // PlayerID -> Personal Pool
  selections: Record<string, string>; // PlayerID -> ItemID (Secret)
  confirmed: string[]; // PlayerIDs who have locked in their choice
  roundNumber: number; // 1, 2, 3...
}
