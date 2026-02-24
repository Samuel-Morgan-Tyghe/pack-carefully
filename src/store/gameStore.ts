import { atom, computed } from "nanostores"
import { DEFAULT_BLOCK_DECAY } from "../lib/constants"
import { generateRandomContainers } from "../lib/generators"
import { GRID_SIZE, ITEMS } from "../lib/items"
import { generateId } from "../lib/utils"
import type {
  Container,
  Coordinate,
  DraftState,
  GamePhase,
  GameState,
  InventoryItemInstance,
  ItemCategory,
  Player,
  Role,
} from "../types"

// State Atoms
export const $phase = atom<GamePhase>("LOBBY")
export const $players = atom<Player[]>([])
export const $containers = atom<Container[]>([])
export const $currentPlayerId = atom<string | null>(null)
export const $itemsOnGrid = atom<InventoryItemInstance[]>([])
export const $draggedItem = atom<string | null>(null)
export const $dragSessionId = atom<number>(0)
export const $activePreview = atom<{
  type: "instance" | "definition"
  id: string
} | null>(null)

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

export const getPixelCoords = (gx: number, gy: number) => {
  const { cellSize, gap } = $gridConfig.get()
  return {
    x: gx * (cellSize + gap),
    y: gy * (cellSize + gap),
  }
}

// Multiplayer Identity & Sync
export const $localPlayerId = atom<
  string | (typeof localStorage extends undefined ? null : string | null)
>(
  typeof localStorage !== "undefined"
    ? localStorage.getItem("pack_carefully_player_id")
    : null,
)

// Local View State (not synced)
export const $viewingPlayerId = atom<string | null>(null)

// BroadcastChannel for cross-tab sync
const syncChannel =
  typeof window !== "undefined"
    ? new BroadcastChannel("pack_carefully_sync")
    : null

export const setLocalPlayer = (id: string | null) => {
  $localPlayerId.set(id)
  if (id !== "OBSERVER") {
    $viewingPlayerId.set(id)
  }
  if (id && typeof localStorage !== "undefined") {
    localStorage.setItem("pack_carefully_player_id", id)
  } else if (typeof localStorage !== "undefined") {
    localStorage.removeItem("pack_carefully_player_id")
  }
}

// Flag to prevent broadcast cycles
let isSyncing = false

export const setViewingPlayer = (id: string | null) => {
  $viewingPlayerId.set(id)
}

// Syncing state changes
if (syncChannel) {
  syncChannel.onmessage = (event) => {
    const { type, payload } = event.data

    isSyncing = true
    try {
      switch (type) {
        case "PHASE_UPDATE":
          $phase.set(payload)
          break
        case "PLAYERS_UPDATE":
          $players.set(payload)
          break
        case "CONTAINERS_UPDATE":
          $containers.set(payload)
          break
        case "ITEMS_UPDATE":
          $itemsOnGrid.set(payload)
          break
        case "GAME_STATE_UPDATE":
          $gameState.set(payload)
          break
        case "DRAFT_STATE_UPDATE":
          $draftState.set(payload)
          break
        case "DRAGGED_ITEM_UPDATE":
          $draggedItem.set(payload)
          break
      }
    } finally {
      isSyncing = false
    }
  }
}

// Helper to broadcast changes
const broadcast = (type: string, payload: unknown) => {
  if (isSyncing) return // Prevent echoing sync messages
  if (syncChannel) {
    syncChannel.postMessage({ type, payload })
  }
}

// Gamification State

export const $gameState = atom<GameState>({
  day: 1,
  round: 1,
  morale: 100,
  isGameOver: false,
  gameResult: null,
  journeyStage: "SELECTION",
  selectedPath: null,
  pathStatus: { LEFT: "PENDING", RIGHT: "PENDING" },
  lastEncounterResult: null,
  blockDecayRate: DEFAULT_BLOCK_DECAY, // Global block decay per second
})

// Draft State moved to types

export const $draftState = atom<DraftState>({
  availableItems: {},
  selections: {},
  confirmed: [],
  roundNumber: 1,
})

// Sync listeners (moved after all atoms declared)
$phase.listen((val) => broadcast("PHASE_UPDATE", val))
$players.listen((val) => broadcast("PLAYERS_UPDATE", val))
$containers.listen((val) => broadcast("CONTAINERS_UPDATE", val))
$itemsOnGrid.listen((val) => broadcast("ITEMS_UPDATE", val))
$gameState.listen((val) => broadcast("GAME_STATE_UPDATE", val))
$draftState.listen((val) => broadcast("DRAFT_STATE_UPDATE", val))
$draggedItem.listen((val) => broadcast("DRAGGED_ITEM_UPDATE", val))

// Helper to get cells occupied by an item
export const getItemCells = (
  x: number,
  y: number,
  itemId: string,
  rotation: 0 | 90 | 180 | 270,
) => {
  const def = ITEMS[itemId]
  if (!def) return []

  const getRotatedOffset = (dx: number, dy: number, rot: number) => {
    if (rot === 90) return { rdx: -dy, rdy: dx }
    if (rot === 180) return { rdx: -dx, rdy: -dy }
    if (rot === 270) return { rdx: dy, rdy: -dx }
    return { rdx: dx, rdy: dy }
  }

  let rotated: { rdx: number; rdy: number }[]
  if (def.shape) {
    rotated = def.shape.map((coord) =>
      getRotatedOffset(coord.x, coord.y, rotation),
    )
  } else {
    rotated = []
    for (let dx = 0; dx < def.width; dx++) {
      for (let dy = 0; dy < def.height; dy++) {
        rotated.push(getRotatedOffset(dx, dy, rotation))
      }
    }
  }

  const minRDX = Math.min(...rotated.map((c) => c.rdx))
  const minRDY = Math.min(...rotated.map((c) => c.rdy))

  return rotated.map((c) => ({
    x: x + (c.rdx - minRDX),
    y: y + (c.rdy - minRDY),
  }))
}

// Derived state example (if needed) or Actions
// Helper for collision
export const checkCollision = (
  x: number,
  y: number,
  width: number,
  height: number,
  items: InventoryItemInstance[],
  ownerId: string,
  excludeInstanceId?: string,
  category?: ItemCategory,
  itemId?: string, // Optional: if provided, use shape logic
  rotation: 0 | 90 | 180 | 270 = 0,
): boolean => {
  // Use cell-based check if itemId is provided
  const cellsA = itemId ? getItemCells(x, y, itemId, rotation) : []

  // Bounds check
  if (itemId) {
    if (
      cellsA.some(
        (c) => c.x < 0 || c.y < 0 || c.x >= GRID_SIZE || c.y >= GRID_SIZE,
      )
    )
      return true
  } else {
    if (x < 0 || y < 0 || x + width > GRID_SIZE || y + height > GRID_SIZE)
      return true
  }

  const isContainer = category === "CONTAINER"

  for (const item of items) {
    if (item.instanceId === excludeInstanceId) continue

    const isFinale = $phase.get() === "FINALE"
    if (!isFinale && item.ownerId !== ownerId) continue

    const existingItemDef = ITEMS[item.itemId]
    const isExistingContainer = existingItemDef.category === "CONTAINER"

    if (isContainer !== isExistingContainer) continue

    const cellsB = getItemCells(item.x, item.y, item.itemId, item.rotation)

    // Cell vs Cell collision
    if (itemId) {
      if (
        cellsA.some((ca) => cellsB.some((cb) => ca.x === cb.x && ca.y === cb.y))
      )
        return true
    } else {
      // Legacy rect vs cell
      const w = rotation === 90 || rotation === 270 ? height : width
      const h = rotation === 90 || rotation === 270 ? width : height
      if (
        cellsB.some(
          (cb) => cb.x >= x && cb.x < x + w && cb.y >= y && cb.y < y + h,
        )
      )
        return true
    }
  }

  return false
}

// Support Check: Must be inside valid Container cells
export const checkSupport = (
  x: number,
  y: number,
  width: number,
  height: number,
  items: InventoryItemInstance[],
  ownerId: string,
  itemId?: string,
  rotation: 0 | 90 | 180 | 270 = 0,
): boolean => {
  // In FINALE, everything floats
  if ($phase.get() === "FINALE") return true

  const containers = $containers.get().filter((c) => c.ownerId === ownerId)
  const validCells = new Set<string>()

  for (const c of containers) {
    for (const cell of c.cells) {
      const isDisabled = c.disabledCells?.some(
        (dc) => dc.x === cell.x && dc.y === cell.y,
      )
      if (!isDisabled) {
        validCells.add(`${cell.x},${cell.y}`)
      }
    }
  }

  for (const item of items) {
    if (item.ownerId === ownerId) {
      const def = ITEMS[item.itemId]
      if (def && def.category === "CONTAINER") {
        const cells = getItemCells(item.x, item.y, item.itemId, item.rotation)
        for (const cell of cells) {
          validCells.add(`${cell.x},${cell.y}`)
        }
      }
    }
  }

  const cellsA = itemId ? getItemCells(x, y, itemId, rotation) : []

  if (itemId) {
    return cellsA.every((c) => validCells.has(`${c.x},${c.y}`))
  }

  // Legacy rect check
  for (let cx = x; cx < x + width; cx++) {
    for (let cy = y; cy < y + height; cy++) {
      if (!validCells.has(`${cx},${cy}`)) return false
    }
  }
  return true
}

// Actions
export const addPlayer = (name: string): string => {
  const currentPlayers = $players.get()
  const id = generateId()
  const colors = [
    "bg-red-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-purple-500",
  ]
  const avatarColor = colors[currentPlayers.length % colors.length]

  // Generate Containers for the new player
  const newContainers = generateRandomContainers(id)
  $containers.set([...$containers.get(), ...newContainers])

  $players.set([
    ...currentPlayers,
    {
      id,
      name,
      role: "Hiker",
      isReady: false,
      isTraitor: false,
      avatarColor,
      currentPath: null,
    },
  ])

  return id
}

export const startGame = () => {
  const currentPlayers = $players.get()
  const numPlayers = currentPlayers.length

  // Schrödinger's Traitor: 25% chance of NO traitor at all.
  // This creates genuine paranoia — nobody can ever be 100% sure.
  const hasTraitor = Math.random() > 0.25
  const traitorIndex = hasTraitor ? Math.floor(Math.random() * numPlayers) : -1

  const newPlayers = currentPlayers.map((p, idx) => ({
    ...p,
    role: (idx === traitorIndex ? "Traitor" : "Hiker") as Role,
    isTraitor: idx === traitorIndex,
  }))

  $players.set(newPlayers)
  $currentPlayerId.set(currentPlayers[0]?.id || null)

  // Reset Containers/Items (Players start fresh)
  $containers.set([])
  $itemsOnGrid.set([])

  // Start with Bag Building
  $phase.set("BAG_BUILDING")
}

export const createCustomContainer = (
  playerId: string,
  cells: Coordinate[],
) => {
  const newContainer: Container = {
    id: generateId(),
    ownerId: playerId,
    type: "BACKPACK", // Custom
    cells: cells,
    capacity: cells.length,
  }

  const currentContainers = $containers.get()
  const updatedContainers = [...currentContainers, newContainer]
  $containers.set(updatedContainers)

  // Check if all players have a container
  const players = $players.get()
  const playersWithContainers = new Set(updatedContainers.map((c) => c.ownerId))

  if (players.every((p) => playersWithContainers.has(p.id))) {
    // All players ready -> Start Draft
    console.log("[createCustomContainer] All players ready. Starting Draft.")
    setTimeout(() => {
      nextPhase()
    }, 1000) // Small delay for UX
  }
}

export const nextPhase = () => {
  const current = $phase.get()
  console.log(`[nextPhase] current phase: ${current}`)

  if (current === "LOBBY") {
    startGame() // triggers BAG_BUILDING
  } else if (current === "BAG_BUILDING") {
    startDraft() // Go to Draft after building
  } else if (current === "DRAFT") {
    $phase.set("JOURNEY")
  } else if (current === "JOURNEY") {
    $phase.set("CAMPFIRE")
  } else if (current === "CAMPFIRE") {
    advanceDay() // Advance day when leaving campfire
    if ($gameState.get().isGameOver) {
      $phase.set("LOBBY")
    } else {
      startDraft() // Start new day with Draft
    }
  }
}

export const placeItem = (
  itemId: string,
  x: number,
  y: number,
  rotation: 0 | 90 | 180 | 270,
  ownerId: string,
): boolean => {
  const items = $itemsOnGrid.get()
  const itemDef = ITEMS[itemId]
  if (!itemDef) return false

  const w = rotation === 90 || rotation === 270 ? itemDef.height : itemDef.width
  const h = rotation === 90 || rotation === 270 ? itemDef.width : itemDef.height

  // Check Collision (Blocking)
  if (
    checkCollision(
      x,
      y,
      w,
      h,
      items,
      ownerId,
      undefined,
      itemDef.category,
      itemId,
      rotation,
    )
  )
    return false

  // Check Support (If not a container, must be inside containers)
  if (itemDef.category !== "CONTAINER") {
    if (!checkSupport(x, y, w, h, items, ownerId, itemId, rotation))
      return false
  }

  // DRAFT PHASE LOGIC: Enforce removal from draft pool
  if ($phase.get() === "DRAFT") {
    const draft = $draftState.get()
    const personalPool = draft.availableItems[ownerId] || []
    const draftItemIndex = personalPool.indexOf(itemId)

    if (draftItemIndex >= 0) {
      // Remove from pool
      const newPool = [...personalPool]
      newPool.splice(draftItemIndex, 1)
      $draftState.set({
        ...draft,
        availableItems: {
          ...draft.availableItems,
          [ownerId]: newPool,
        },
      })
    }
  }

  const newItem: InventoryItemInstance = {
    instanceId: generateId(),
    itemId,
    x,
    y,
    rotation,
    ownerId,
  }

  $itemsOnGrid.set([...items, newItem])
  return true
}

export const addRandomLoot = (
  itemId: string,
  targetPlayerId?: string,
): boolean => {
  const items = $itemsOnGrid.get()
  const players = $players.get()
  if (players.length === 0) return false

  // Default to first player if not specified
  const targetOwnerId = targetPlayerId || players[0].id

  const itemDef = ITEMS[itemId]
  if (!itemDef) return false

  // Let's just try 50 random spots
  for (let i = 0; i < 50; i++) {
    const x = Math.floor(Math.random() * (GRID_SIZE - itemDef.width + 1))
    const y = Math.floor(Math.random() * (GRID_SIZE - itemDef.height + 1))
    const rot = 0 // Simplified rotation for random loot

    // Check Collision
    if (
      !checkCollision(
        x,
        y,
        itemDef.width,
        itemDef.height,
        items,
        targetOwnerId,
        undefined,
        itemDef.category,
        itemId,
        rot as 0,
      )
    ) {
      // Check Support
      if (
        itemDef.category === "CONTAINER" ||
        checkSupport(
          x,
          y,
          itemDef.width,
          itemDef.height,
          items,
          targetOwnerId,
          itemId,
          rot as 0,
        )
      ) {
        return placeItem(itemId, x, y, rot as 0, targetOwnerId)
      }
    }
  }
  return false // No space found
}

export const moveItem = (
  instanceId: string,
  x: number,
  y: number,
  rotation?: 0 | 90 | 180 | 270,
): boolean => {
  const items = $itemsOnGrid.get()
  const item = items.find((i) => i.instanceId === instanceId)
  if (!item) return false

  const finalRot = rotation ?? item.rotation

  const itemDef = ITEMS[item.itemId]
  const w = finalRot === 90 || finalRot === 270 ? itemDef.height : itemDef.width
  const h = finalRot === 90 || finalRot === 270 ? itemDef.width : itemDef.height

  if (item.locked) return false // Cannot move locked items

  if (
    checkCollision(
      x,
      y,
      w,
      h,
      items,
      item.ownerId,
      instanceId,
      itemDef.category,
      item.itemId,
      finalRot,
    )
  )
    return false
  if (
    itemDef.category !== "CONTAINER" &&
    !checkSupport(x, y, w, h, items, item.ownerId, item.itemId, finalRot)
  )
    return false

  $itemsOnGrid.set(
    items.map((i) =>
      i.instanceId === instanceId ? { ...i, x, y, rotation: finalRot } : i,
    ),
  )
  return true
}

export const rotateItem = (instanceId: string) => {
  const items = $itemsOnGrid.get()
  const item = items.find((i) => i.instanceId === instanceId)
  if (!item || item.locked) return // Cannot rotate locked items

  const newRot = ((item.rotation + 90) % 360) as 0 | 90 | 180 | 270

  // Check if rotation is valid at current position
  const itemDef = ITEMS[item.itemId]
  const w = newRot === 90 || newRot === 270 ? itemDef.height : itemDef.width
  const h = newRot === 90 || newRot === 270 ? itemDef.width : itemDef.height

  if (
    checkCollision(
      item.x,
      item.y,
      w,
      h,
      items,
      item.ownerId,
      instanceId,
      itemDef.category,
      item.itemId,
      newRot,
    )
  )
    return
  if (
    itemDef.category !== "CONTAINER" &&
    !checkSupport(
      item.x,
      item.y,
      w,
      h,
      items,
      item.ownerId,
      item.itemId,
      newRot,
    )
  )
    return

  moveItem(instanceId, item.x, item.y, newRot)
}

export const toggleLock = (instanceId: string) => {
  const items = $itemsOnGrid.get()
  $itemsOnGrid.set(
    items.map((i) =>
      i.instanceId === instanceId ? { ...i, locked: !i.locked } : i,
    ),
  )
}

export const removeItem = (instanceId: string) => {
  const items = $itemsOnGrid.get()
  const item = items.find((i) => i.instanceId === instanceId)
  if (!item || item.locked) return // Cannot remove locked items

  $itemsOnGrid.set(items.filter((i) => i.instanceId !== instanceId))
}

export const rotateItemCounterClockwise = (instanceId: string) => {
  const items = $itemsOnGrid.get()
  const item = items.find((i) => i.instanceId === instanceId)
  if (!item || item.locked) return

  const newRot = ((item.rotation - 90 + 360) % 360) as 0 | 90 | 180 | 270

  // Check if rotation is valid
  const itemDef = ITEMS[item.itemId]
  const w = newRot === 90 || newRot === 270 ? itemDef.height : itemDef.width
  const h = newRot === 90 || newRot === 270 ? itemDef.width : itemDef.height

  if (
    checkCollision(
      item.x,
      item.y,
      w,
      h,
      items,
      item.ownerId,
      instanceId,
      itemDef.category,
      item.itemId,
      newRot,
    )
  )
    return
  if (
    itemDef.category !== "CONTAINER" &&
    !checkSupport(
      item.x,
      item.y,
      w,
      h,
      items,
      item.ownerId,
      item.itemId,
      newRot,
    )
  )
    return

  moveItem(instanceId, item.x, item.y, newRot)
}

export const resetGame = () => {
  $phase.set("LOBBY")
  $itemsOnGrid.set([])
  $players.set([])
  $containers.set([]) // Reset containers
  $currentPlayerId.set(null)
  $gameState.set({
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
  })
}

export const damageMorale = (amount: number) => {
  const current = $gameState.get()
  const newMorale = Math.max(0, current.morale - amount)

  if (newMorale === 0) {
    $gameState.set({
      ...current,
      morale: 0,
      isGameOver: true,
      gameResult: "LOSS",
    })
  } else {
    $gameState.set({ ...current, morale: newMorale })
  }
}

export const advanceDay = () => {
  const current = $gameState.get()
  const newDay = current.day + 1

  if (newDay > 5) {
    $gameState.set({ ...current, day: 5 }) // Stuck on day 5 or move to 6?
    $phase.set("FINALE")
  } else {
    $gameState.set({
      ...current,
      day: newDay,
      round: newDay,
      journeyStage: "SELECTION",
      selectedPath: null,
      pathStatus: { LEFT: "PENDING", RIGHT: "PENDING" }, // Reset path status for new day
      lastEncounterResult: null,
    })
  }
}

export const choosePath = (path: "LEFT" | "RIGHT") => {
  const current = $gameState.get()

  // Safety check: Are there players on this path?
  const players = $players.get()
  const hasPlayers = players.some((p) => p.currentPath === path)
  if (!hasPlayers) return // Cannot start empty path? Or maybe allow it but it auto-fails?

  let stage: "ENCOUNTER" | "SCAVENGE" = "ENCOUNTER"
  if (path === "RIGHT") {
    stage = "SCAVENGE"
  }

  $gameState.set({
    ...current,
    selectedPath: path,
    journeyStage: stage,
  })
}

export const assignPlayerToPath = (
  playerId: string,
  path: "LEFT" | "RIGHT" | null,
) => {
  const players = $players.get()
  $players.set(
    players.map((p) => (p.id === playerId ? { ...p, currentPath: path } : p)),
  )
}

export const completeScavenge = () => {
  const current = $gameState.get()
  const path = current.selectedPath
  if (!path) return

  // Use current.pathStatus directly to update the specific path
  const newStatus = { ...current.pathStatus, [path]: "RESOLVED" as const }

  $gameState.set({
    ...current,
    pathStatus: newStatus,
    journeyStage: "RESULTS",
  })
}

export const returnToSplitScreen = () => {
  const current = $gameState.get()
  const status = current.pathStatus

  // Check if all active paths are resolved
  // Active path = path with players
  const players = $players.get()
  const leftActive = players.some((p) => p.currentPath === "LEFT")
  const rightActive = players.some((p) => p.currentPath === "RIGHT")

  const leftDone = !leftActive || status.LEFT === "RESOLVED"
  const rightDone = !rightActive || status.RIGHT === "RESOLVED"

  if (leftDone && rightDone) {
    nextPhase() // Go to CAMPFIRE
  } else {
    $gameState.set({
      ...current,
      journeyStage: "SELECTION",
      selectedPath: null,
    })
  }
}

export const rummageInventory = (targetPlayerId: string): boolean => {
  const items = $itemsOnGrid.get()
  const targetItems = items.filter(
    (i) => i.ownerId === targetPlayerId && !i.locked,
  )

  if (targetItems.length === 0) return false

  // Pick random item
  const itemToMessUp =
    targetItems[Math.floor(Math.random() * targetItems.length)]

  // Try to move it to a new spot
  // 10 attempts
  for (let i = 0; i < 10; i++) {
    const x = Math.floor(Math.random() * GRID_SIZE)
    const y = Math.floor(Math.random() * GRID_SIZE)
    const rot = (Math.floor(Math.random() * 4) * 90) as 0 | 90 | 180 | 270

    // Remove item temporarily to check collision for new spot
    const otherItems = items.filter(
      (k) => k.instanceId !== itemToMessUp.instanceId,
    )

    const def = ITEMS[itemToMessUp.itemId]
    const w = rot === 90 || rot === 270 ? def.height : def.width
    const h = rot === 90 || rot === 270 ? def.width : def.height

    if (
      !checkCollision(
        x,
        y,
        w,
        h,
        otherItems,
        targetPlayerId,
        undefined,
        def.category,
        itemToMessUp.itemId,
        rot,
      )
    ) {
      if (
        def.category === "CONTAINER" ||
        checkSupport(
          x,
          y,
          w,
          h,
          otherItems,
          targetPlayerId,
          itemToMessUp.itemId,
          rot,
        )
      ) {
        moveItem(itemToMessUp.instanceId, x, y, rot)
        return true
      }
    }
  }
  return false
}

export const healMorale = (amount: number) => {
  const current = $gameState.get()
  const newMorale = Math.min(100, current.morale + amount)
  $gameState.set({ ...current, morale: newMorale })
}

export const revealDisguises = (targetPlayerId: string): number => {
  const items = $itemsOnGrid.get()
  let revealedCount = 0

  const newItems = items.map((i) => {
    if (i.ownerId === targetPlayerId && i.disguiseItemId) {
      revealedCount++
      return { ...i, disguiseItemId: undefined }
    }
    return i
  })

  if (revealedCount > 0) {
    $itemsOnGrid.set(newItems)
  }
  return revealedCount
}

export const startDraft = () => {
  const players = $players.get()
  const day = $gameState.get().day
  console.log(`[startDraft] players count: ${players.length}, day: ${day}`)

  // Generate Personal Pools based on Rarity Scaling
  const availableItems: Record<string, string[]> = {}
  const allItems = Object.values(ITEMS)

  for (const p of players) {
    const pool: string[] = []

    // Helper to roll rarity
    const rollRarity = (): "COMMON" | "UNCOMMON" | "RARE" | "LEGENDARY" => {
      const roll = Math.random()
      const uncommonWeight = Math.min(0.5, 0.1 + day * 0.08)
      const rareWeight = Math.min(0.3, day * 0.06)
      const legendaryWeight = day >= 4 ? 0.05 + (day - 4) * 0.05 : 0

      if (roll < legendaryWeight) return "LEGENDARY"
      if (roll < legendaryWeight + rareWeight) return "RARE"
      if (roll < legendaryWeight + rareWeight + uncommonWeight)
        return "UNCOMMON"
      return "COMMON"
    }

    // Generate 8 random items for each player
    for (let i = 0; i < 8; i++) {
      const selectedRarity = rollRarity()
      const filters = allItems.filter(
        (item) =>
          item.rarity === selectedRarity && item.category !== "SABOTAGE",
      )
      const finalPool =
        filters.length > 0
          ? filters
          : allItems.filter((i) => i.rarity === "COMMON")
      pool.push(finalPool[Math.floor(Math.random() * finalPool.length)].id)
    }

    availableItems[p.id] = pool
  }

  $draftState.set({
    availableItems,
    selections: {},
    confirmed: [],
    roundNumber: 1,
  })

  $phase.set("DRAFT")
  console.log(
    `[startDraft] phase set to DRAFT. availableItems keys: ${Object.keys(availableItems)}`,
  )
}

export const returnItemToPool = (ownerId: string, itemId: string) => {
  if ($phase.get() === "DRAFT") {
    const draft = $draftState.get()
    const personalPool = draft.availableItems[ownerId] || []

    $draftState.set({
      ...draft,
      availableItems: {
        ...draft.availableItems,
        [ownerId]: [...personalPool, itemId],
      },
    })
  }
}

export const SANDBOX_PLAYER_ID = "SANDBOX_USER"

// Helper to update URL params
const updateUrlParam = (key: string, value: string | null) => {
  if (typeof window === "undefined") return
  const url = new URL(window.location.href)
  if (value) {
    url.searchParams.set(key, value)
  } else {
    url.searchParams.delete(key)
  }
  window.history.replaceState({}, "", url.toString())
}

export const enterSandbox = () => {
  $phase.set("SANDBOX")
  $itemsOnGrid.set([])
  $viewingPlayerId.set(SANDBOX_PLAYER_ID)
  updateUrlParam("mode", "sandbox")

  // Create a full 8x8 grid container for sandbox
  const fullGrid: Coordinate[] = []
  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      fullGrid.push({ x, y })
    }
  }

  $containers.set([
    {
      id: "sandbox-container",
      ownerId: SANDBOX_PLAYER_ID,
      type: "BACKPACK",
      cells: fullGrid,
      capacity: GRID_SIZE * GRID_SIZE,
    },
  ])
}

export const leaveSandbox = () => {
  $phase.set("LOBBY")
  updateUrlParam("mode", null)
}

// Check for sandbox mode on init
if (typeof window !== "undefined") {
  const urlParams = new URLSearchParams(window.location.search)
  if (urlParams.get("mode") === "sandbox") {
    // Use a timeout to ensure stores are initialized
    setTimeout(() => {
      enterSandbox()
    }, 0)
  }
}

export const clearSandboxGrid = () => {
  $itemsOnGrid.set([])
}
