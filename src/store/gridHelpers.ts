import { GRID_SIZE, ITEMS } from "../lib/items/items"
import type {
  Container,
  GamePhase,
  InventoryItemInstance,
  ItemCategory,
} from "../types"

/**
 * Gets the actual grid cells occupied by an item given its position and rotation.
 */
export const getItemCells = (
  x: number,
  y: number,
  itemId: string,
  rotation: number,
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

/**
 * Checks if a proposed item placement collides with existing items.
 */
export const checkCollision = (
  x: number,
  y: number,
  width: number,
  height: number,
  items: InventoryItemInstance[],
  ownerId: string,
  phase: GamePhase,
  excludeInstanceId?: string,
  category?: ItemCategory,
  itemId?: string,
  rotation = 0,
): boolean => {
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
    // Legacy rect-based bounds check
    const w = rotation === 90 || rotation === 270 ? height : width
    const h = rotation === 90 || rotation === 270 ? width : height
    if (x < 0 || y < 0 || x + w > GRID_SIZE || y + h > GRID_SIZE) return true
  }

  const isContainer = category === "CONTAINER"

  for (const item of items) {
    if (item.instanceId === excludeInstanceId) continue

    const isFinale = phase === "FINALE"
    if (!isFinale && item.ownerId !== ownerId) continue

    const existingItemDef = ITEMS[item.itemId]
    const isExistingContainer = existingItemDef.category === "CONTAINER"

    if (isContainer !== isExistingContainer) continue

    const cellsB = getItemCells(item.x, item.y, item.itemId, item.rotation)

    if (itemId) {
      if (
        cellsA.some((ca) => cellsB.some((cb) => ca.x === cb.x && ca.y === cb.y))
      )
        return true
    } else {
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

/**
 * Checks if an item is fully supported by container cells.
 */
export const checkSupport = (
  x: number,
  y: number,
  width: number,
  height: number,
  items: InventoryItemInstance[],
  allContainers: Container[],
  ownerId: string,
  phase: GamePhase,
  itemId?: string,
  rotation = 0,
): boolean => {
  if (phase === "FINALE") return true

  const containers = allContainers.filter((c) => c.ownerId === ownerId)
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
  const w = rotation === 90 || rotation === 270 ? height : width
  const h = rotation === 90 || rotation === 270 ? width : height
  for (let ix = 0; ix < w; ix++) {
    for (let iy = 0; iy < h; iy++) {
      if (!validCells.has(`${x + ix},${y + iy}`)) return false
    }
  }

  return true
}

/**
 * Converts grid coordinates to pixel offsets.
 */
export const getPixelCoords = (
  gx: number,
  gy: number,
  cellSize: number,
  gap: number,
) => {
  return {
    x: gx * (cellSize + gap),
    y: gy * (cellSize + gap),
  }
}
