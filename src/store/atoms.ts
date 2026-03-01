import { persistentAtom } from "@nanostores/persistent"
import { atom, computed } from "nanostores"
import { DEFAULT_BLOCK_DECAY } from "../lib/constants"
import { GRID_SIZE } from "../lib/items/items"
import type {
  CombatEntity,
  Container,
  DraftState,
  GamePhase,
  GameState,
  InventoryItemInstance,
  Player,
} from "../types"
import { getItemCells } from "./gridHelpers"

// State Atoms
export const $phase = persistentAtom<GamePhase>("pack_carefully_phase", "LOBBY")
export const $players = persistentAtom<Player[]>("pack_carefully_players", [], {
  encode: JSON.stringify,
  decode: (val) => JSON.parse(val || "[]"),
})
export const $draftState = persistentAtom<DraftState>(
  "pack_carefully_draft_state",
  {
    availableItems: {},
    selections: {},
    confirmed: [],
    roundNumber: 1,
  },
  {
    encode: JSON.stringify,
    decode: (val) => JSON.parse(val || "{}"),
  },
)
export const $containers = persistentAtom<Container[]>(
  "pack_carefully_containers",
  [],
  {
    encode: JSON.stringify,
    decode: (val) => JSON.parse(val || "[]"),
  },
)
export const $currentPlayerId = persistentAtom<string | undefined>(
  "pack_carefully_current_player_id",
  undefined,
)
export const $itemsOnGrid = persistentAtom<InventoryItemInstance[]>(
  "pack_carefully_items_on_grid",
  [],
  {
    encode: JSON.stringify,
    decode: (val) => JSON.parse(val || "[]"),
  },
)
export const $draggedItem = atom<string | null>(null)
export const $draggedInstanceId = atom<string | null>(null)
export const $dragSessionId = atom<number>(0)
export const $activePreview = atom<{
  type: "instance" | "definition"
  id: string
} | null>(null)
export const $craftingHighlights = atom<string[]>([])

export const $hoveredCombatant = atom<CombatEntity | null>(null)

// Grid Configuration
export const $gridConfig = atom({
  cellSize: 40,
  gap: 2,
  rows: GRID_SIZE,
  cols: GRID_SIZE,
})

/**
 * Human-readable Grid State
 * Maps every single cell index to its metadata (Is it a bag? Who owns it? What's the coord?)
 */
export const $gridState = computed(
  [$containers, $itemsOnGrid, $gridConfig],
  (containers, items, config) => {
    const state: Record<
      string,
      {
        x: number
        y: number
        isBag: boolean
        ownerId: string | null
        occupiedBy: string | null
      }
    > = {}

    for (let y = 0; y < config.rows; y++) {
      for (let x = 0; x < config.cols; x++) {
        const key = `${x},${y}`
        state[key] = { x, y, isBag: false, ownerId: null, occupiedBy: null }
      }
    }

    // Mark Bag Cells
    for (const container of containers) {
      for (const cell of container.cells) {
        const key = `${cell.x},${cell.y}`
        if (state[key]) {
          state[key].isBag = true
          state[key].ownerId = container.ownerId
        }
      }
    }

    // Mark Occupied Cells (True Shape)
    for (const item of items) {
      const cells = getItemCells(item.x, item.y, item.itemId, item.rotation)
      for (const cell of cells) {
        const key = `${cell.x},${cell.y}`
        if (state[key]) {
          state[key].occupiedBy = item.instanceId
        }
      }
    }

    return state
  },
)

// Multiplayer Identity & Sync
export const $localPlayerId = persistentAtom<string | undefined>(
  "pack_carefully_local_player_id",
  undefined,
)

// Local View State (not synced)
export const $viewingPlayerId = atom<string | undefined>(undefined)

// Gamification State
export const $gameState = persistentAtom<GameState>(
  "pack_carefully_game_state",
  {
    day: 1,
    round: 1,
    morale: 100,
    isGameOver: false,
    gameResult: null,
    journeyStage: "SELECTION",
    selectedPath: null,
    pathStatus: { LEFT: "PENDING", RIGHT: "PENDING" },
    lastEncounterResult: null,
    blockDecayRate: DEFAULT_BLOCK_DECAY,
  },
  {
    encode: JSON.stringify,
    decode: (val) => JSON.parse(val || "{}"),
  },
)
