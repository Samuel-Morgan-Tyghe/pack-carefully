import { atom } from "nanostores"
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
export const $activePreview = atom<{
  type: "instance" | "definition"
  id: string
} | null>(null)

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
): boolean => {
  if (x < 0 || y < 0 || x + width > GRID_SIZE || y + height > GRID_SIZE)
    return true

  const isContainer = category === "CONTAINER"

  for (const item of items) {
    if (item.instanceId === excludeInstanceId) continue

    // In FINALE, all items collide regardless of owner
    const isFinale = $phase.get() === "FINALE"
    if (!isFinale && item.ownerId !== ownerId) continue

    const existingItemDef = ITEMS[item.itemId]
    const isExistingContainer = existingItemDef.category === "CONTAINER"

    // Layer Check:
    // Containers only collide with Containers
    // Gear only collides with Gear
    if (isContainer !== isExistingContainer) continue

    const existingW =
      item.rotation === 90 || item.rotation === 270
        ? existingItemDef.height
        : existingItemDef.width
    const existingH =
      item.rotation === 90 || item.rotation === 270
        ? existingItemDef.width
        : existingItemDef.height

    if (
      x < item.x + existingW &&
      x + width > item.x &&
      y < item.y + existingH &&
      y + height > item.y
    ) {
      return true
    }
  }

  // 2. Base Container Check - Containers can now overlap base backpack for extension
  // We removed the nesting block to allow easier placement.

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
): boolean => {
  // In FINALE, everything floats
  if ($phase.get() === "FINALE") return true

  const containers = $containers.get().filter((c) => c.ownerId === ownerId)

  // Get all valid cells for this player
  const validCells = new Set<string>()

  // 1. Base Containers (Backpacks)
  for (const c of containers) {
    for (const cell of c.cells) {
      // Check if cell is disabled
      const isDisabled = c.disabledCells?.some(
        (dc) => dc.x === cell.x && dc.y === cell.y,
      )
      if (!isDisabled) {
        validCells.add(`${cell.x},${cell.y}`)
      }
    }
  }

  // 2. Container Items (Pouches, Fanny Packs, etc)
  // They act as valid ground for other items!
  for (const item of items) {
    if (item.ownerId === ownerId) {
      const def = ITEMS[item.itemId]
      if (def && def.category === "CONTAINER") {
        const w =
          item.rotation === 90 || item.rotation === 270 ? def.height : def.width
        const h =
          item.rotation === 90 || item.rotation === 270 ? def.width : def.height

        for (let dx = 0; dx < w; dx++) {
          for (let dy = 0; dy < h; dy++) {
            validCells.add(`${item.x + dx},${item.y + dy}`)
          }
        }
      }
    }
  }

  // Check if every cell of the item matches a valid container cell
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
    setTimeout(() => {
      nextPhase()
    }, 1000) // Small delay for UX
  }
}

export const nextPhase = () => {
  const current = $phase.get()

  if (current === "LOBBY") {
    startGame() // triggers BAG_BUILDING
  } else if (current === "BAG_BUILDING") {
    $phase.set("JOURNEY")
  } else if (current === "JOURNEY") {
    $phase.set("CAMPFIRE")
  } else if (current === "CAMPFIRE") {
    advanceDay() // Advance day when leaving campfire
    if ($gameState.get().isGameOver) {
      $phase.set("LOBBY")
    } else {
      $phase.set("BAG_BUILDING")
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
  if (checkCollision(x, y, w, h, items, ownerId, undefined, itemDef.category))
    return false

  // Check Support (If not a container, must be inside containers)
  if (itemDef.category !== "CONTAINER") {
    if (!checkSupport(x, y, w, h, items, ownerId)) return false
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
      )
    ) {
      // Check Support
      if (
        itemDef.category === "CONTAINER" ||
        checkSupport(x, y, itemDef.width, itemDef.height, items, targetOwnerId)
      ) {
        return placeItem(itemId, x, y, rot, targetOwnerId)
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

  if (checkCollision(x, y, w, h, items, item.ownerId, instanceId)) return false

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
      )
    ) {
      if (
        def.category === "CONTAINER" ||
        checkSupport(x, y, w, h, otherItems, targetPlayerId)
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

export const returnItemToPool = (ownerId: string, itemId: string) => {
  if ($phase.get() === "DRAFT") {
    const draft = $draftState.get()
    const personalPool = draft.availableItems[ownerId] || []
    const itemDef = ITEMS[itemId]
    if (itemDef) {
      $draftState.set({
        ...draft,
        availableItems: {
          ...draft.availableItems,
          [ownerId]: [...personalPool, itemDef],
        },
      })
    }
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
