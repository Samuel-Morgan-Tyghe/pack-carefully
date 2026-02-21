export type Role = "Hiker" | "Traitor"

export type GamePhase =
  | "LOBBY"
  | "BAG_BUILDING"
  | "DRAFT"
  | "JOURNEY"
  | "CAMPFIRE"
  | "FINALE"
  | "GAME_OVER"
  | "SANDBOX"

export type ItemCategory =
  | "ESSENTIAL"
  | "TOOL"
  | "SURVIVAL"
  | "COMFORT"
  | "SABOTAGE"
  | "CONTAINER"
  | "WEAPON"
  | "CLOTHING"

export type AdjacencyPattern =
  | "ADJACENT"
  | "PARALLEL"
  | "TWO_ACROSS"
  | "DIAMOND"
  | { dx: number; dy: number }[]

export interface SynergyResult {
  buffs?: Partial<{
    damage: number
    block: number
    heal: number
    healthRegen: number
    maxHp: number
    maxMana: number
    manaRegen: number
    energyCost: number
    maxEnergy: number
    energyRegen: number
    manaCost: number // Added
  }>
  multipliers?: Partial<
    Record<
      | "damage"
      | "block"
      | "heal"
      | "healthRegen"
      | "maxHp"
      | "maxMana"
      | "manaRegen"
      | "energyCost"
      | "maxEnergy"
      | "energyRegen"
      | "triggerSpeed"
      | "manaCost", 
      number
    >
  >
}

export interface FunctionalSynergy {
  pattern: AdjacencyPattern
  description: string
  apply: (
    source: InventoryItemInstance,
    target: InventoryItemInstance,
    allItems: InventoryItemInstance[],
  ) => SynergyResult
  targetIsSelf?: boolean // If true, source gets the bonus. Otherwise target gets it.
  isBoostSquare?: boolean // Special handling for star-based global boosts
  isDiamond?: boolean // Secondary synergy type
}

export interface SynergyEffect {
  sourceId: string
  targetId: string
  type: string
  value: number
  description: string
}

export interface Item {
  id: string
  name: string
  description: string
  category: ItemCategory
  width: number
  height: number
  icon: string // Lucide icon name or image path
  rarity: "COMMON" | "UNCOMMON" | "RARE" | "LEGENDARY"
  synergies?: FunctionalSynergy[]
  combatStats?: {
    damage?: number
    block?: number // Active mitigation (Shield HP)
    heal?: number
    healthRegen?: number
    maxHp?: number
    maxMana?: number
    manaRegen?: number
    energyCost?: number // Energy consumed when this weapon fires
    maxEnergy?: number // Adds to max energy pool
    energyRegen?: number // Energy regenerated per second
    triggerSpeed?: number // Multiplier for how fast it triggers
    baseCooldownMs?: number // Default cooldown if not specified
    manaCost?: number // Added
  }
  triggerType?: "ATTACK" | "HEAL" | "SHIELD" | "PASSIVE"
  effects?: {
    type: "POISON" | "FIRE" | "STUN" | "SLOW" | "BLEED"
    value: number // Stacks or Duration
    chance?: number // % chance to apply
  }[]
  recipe?: {
    ingredients: string[] // item IDs
    result: string // item ID
  }
}

export interface Player {
  id: string
  name: string
  role: Role
  isReady: boolean
  isTraitor: boolean // redundancy for easy access
  avatarColor: string
  currentPath: "LEFT" | "RIGHT" | null
}

export interface GameState {
  day: number
  round: number // 1-5 (Same as day, but for clarity)
  morale: number // 0-100
  isGameOver: boolean
  gameResult: "WIN" | "LOSS" | null
  journeyStage: "SELECTION" | "ENCOUNTER" | "RESULTS" | "SCAVENGE"
  selectedPath: "LEFT" | "RIGHT" | null
  pathStatus: {
    LEFT: "PENDING" | "RESOLVED"
    RIGHT: "PENDING" | "RESOLVED"
  }
  lastEncounterResult: {
    success: boolean
    difficulty: number
    message: string
  } | null
}

export interface Coordinate {
  x: number
  y: number
}

export interface Container {
  id: string
  ownerId: string
  type: "POUCH" | "BACKPACK" | "POCKET"
  cells: Coordinate[] // Absolute grid coordinates map to specific grid slots
  capacity: number // Number of cells
  disabledCells?: Coordinate[] // Cells that have been "Cut" (Sabotage)
}

export interface InventoryItemInstance {
  instanceId: string
  itemId: string
  x: number
  y: number
  rotation: 0 | 90 | 180 | 270
  locked?: boolean // If true, cannot be moved
  ownerId: string // The player who owns this item
  disguiseItemId?: string // If set, this item looks like this ItemId
  liveStats?: {
    damage?: number
    energyCost?: number
    heal?: number
    block?: number
    triggerSpeed?: number
    baseCooldownMs?: number
    manaCost?: number // Added
  }
}

export interface DraftState {
  availableItems: Record<string, Item[]> // PlayerID -> Personal Pool
  selections: Record<string, string> // PlayerID -> ItemID (Secret)
  confirmed: string[] // PlayerIDs who have locked in their choice
  roundNumber: number // 1, 2, 3...
}
