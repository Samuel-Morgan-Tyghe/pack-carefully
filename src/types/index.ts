export type Role = 'Hiker' | 'Traitor';

export type GamePhase = 'LOBBY' | 'DRAFT' | 'PACKING' | 'JOURNEY' | 'CAMPFIRE' | 'FINALE' | 'GAME_OVER';

export type ItemCategory = 'ESSENTIAL' | 'TOOL' | 'SURVIVAL' | 'COMFORT' | 'SABOTAGE' | 'CONTAINER' | 'WEAPON' | 'CLOTHING';

export interface AdjacencyRule {
  type: 'BUFF' | 'DEBUFF' | 'MECHANIC';
  targetCategories?: ItemCategory[];
  targetIds?: string[];
  effect: string;
  value: number;
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
  containerId?: string | null; // ID of container occupying this cell
  ownerId?: string | null; // Owner of the container
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
