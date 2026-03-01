import type { AdjacencyPattern, InventoryItemInstance } from "../types"
import { GRID_SIZE, ITEMS } from "./items/items"

export interface SynergySquare {
  x: number
  y: number
  icon?: string
}

export interface AdjacencyResult {
  instanceId: string
  totalBuff: number
  buffs: Record<string, number> // stat -> additive value
  multipliers: Record<string, number> // stat -> multiplier
  effects: { type: string; value: number; chance?: number }[] // on-hit status effects granted by adjacency
  activeRules: string[]
  boostedSquares: { x: number; y: number }[] // Squares boosted by this item
  activeSynergySquares: SynergySquare[] // Squares where synergy is active
  potentialSynergySquares: SynergySquare[] // Pattern squares that could synergy
}

const getRotatedOffset = (dx: number, dy: number, rotation: number) => {
  if (rotation === 90) return { rdx: -dy, rdy: dx }
  if (rotation === 180) return { rdx: -dx, rdy: -dy }
  if (rotation === 270) return { rdx: dy, rdy: -dx }
  return { rdx: dx, rdy: dy }
}

const getItemCells = (item: InventoryItemInstance) => {
  const def = ITEMS[item.itemId]
  if (!def) return []

  let rotated: { rdx: number; rdy: number }[]
  if (def.shape) {
    rotated = def.shape.map((coord) =>
      getRotatedOffset(coord.x, coord.y, item.rotation),
    )
  } else {
    rotated = []
    for (let x = 0; x < def.width; x++) {
      for (let y = 0; y < def.height; y++) {
        rotated.push(getRotatedOffset(x, y, item.rotation))
      }
    }
  }

  // Find the top-left of the ROTATED bounding box to normalize coordinates
  const minRDX = Math.min(...rotated.map((c) => c.rdx))
  const minRDY = Math.min(...rotated.map((c) => c.rdy))

  return rotated.map((c) => ({
    x: item.x + (c.rdx - minRDX),
    y: item.y + (c.rdy - minRDY),
  }))
}

const checkPattern = (
  itemA: InventoryItemInstance,
  itemB: InventoryItemInstance,
  pattern: AdjacencyPattern,
) => {
  const cellsA = getItemCells(itemA)
  const cellsB = getItemCells(itemB)

  if (Array.isArray(pattern)) {
    return cellsA.some((ca) =>
      pattern.some((off) => {
        const { rdx, rdy } = getRotatedOffset(off.dx, off.dy, itemA.rotation)
        const targetX = ca.x + rdx
        const targetY = ca.y + rdy
        return cellsB.some((cb) => cb.x === targetX && cb.y === targetY)
      }),
    )
  }

  return cellsA.some((cellA) =>
    cellsB.some((cellB) => {
      const dx = Math.abs(cellA.x - cellB.x)
      const dy = Math.abs(cellA.y - cellB.y)

      if (pattern === "ADJACENT") {
        return (dx === 1 && dy === 0) || (dx === 0 && dy === 1)
      }
      if (pattern === "PARALLEL") {
        return (dx === 2 && dy === 0) || (dx === 0 && dy === 2)
      }
      if (pattern === "TWO_ACROSS") {
        return dx === 2 && dy === 2
      }
      return false
    }),
  )
}

export const getAdjacencyBonuses = (
  gridItems: InventoryItemInstance[],
): Record<string, AdjacencyResult> => {
  const start = performance.now()
  const results: Record<string, AdjacencyResult> = {}

  // 1. Build lookup maps for O(1) performance
  const instanceMap = new Map<string, InventoryItemInstance>()
  const itemCellsCache = new Map<string, { x: number; y: number }[]>()
  const cellToInstanceMap = new Map<string, string>()
  const cellBoostsMap = new Map<string, Set<string>>() // Squares boosted by specific items

  // Early population of items and their cells
  for (const item of gridItems) {
    instanceMap.set(item.instanceId, item)
    const cells = getItemCells(item)
    itemCellsCache.set(item.instanceId, cells)
    for (const cell of cells) {
      cellToInstanceMap.set(`${cell.x},${cell.y}`, item.instanceId)
    }

    results[item.instanceId] = {
      instanceId: item.instanceId,
      totalBuff: 0,
      buffs: {},
      multipliers: {},
      effects: [],
      activeRules: [],
      boostedSquares: [],
      activeSynergySquares: [],
      potentialSynergySquares: [],
    }
  }

  // 2. Pre-calculate global boost squares (e.g., boosters affecting cells)
  for (const item of gridItems) {
    const def = ITEMS[item.itemId]
    if (!def?.synergies) continue

    for (const syn of def.synergies) {
      if (!syn.isBoostSquare) continue
      const cells = itemCellsCache.get(item.instanceId) || []
      for (const cell of cells) {
        const footprint: { x: number; y: number }[] = []
        if (Array.isArray(syn.pattern)) {
          for (const off of syn.pattern) {
            const { rdx, rdy } = getRotatedOffset(off.dx, off.dy, item.rotation)
            footprint.push({ x: cell.x + rdx, y: cell.y + rdy })
          }
        } else if (syn.pattern === "ADJACENT") {
          footprint.push(
            { x: cell.x + 1, y: cell.y },
            { x: cell.x - 1, y: cell.y },
            { x: cell.x, y: cell.y + 1 },
            { x: cell.x, y: cell.y - 1 },
          )
        }

        for (const t of footprint) {
          if (t.x < 0 || t.x >= GRID_SIZE || t.y < 0 || t.y >= GRID_SIZE)
            continue
          const key = `${t.x},${t.y}`
          if (!cellBoostsMap.has(key)) cellBoostsMap.set(key, new Set())
          cellBoostsMap.get(key)?.add(item.instanceId)
          results[item.instanceId].boostedSquares.push(t)
        }
      }
    }
  }

  // 3. Main Synergy Logic
  for (const sourceItem of gridItems) {
    const sourceDef = ITEMS[sourceItem.itemId]
    if (!sourceDef?.synergies) continue

    const cellsA = itemCellsCache.get(sourceItem.instanceId) || []

    for (const syn of sourceDef.synergies) {
      if (syn.isBoostSquare) continue

      // For visual feedback (stars), we look at all squares in the pattern
      const footprintSet = new Set<string>()
      for (const ca of cellsA) {
        if (Array.isArray(syn.pattern)) {
          for (const off of syn.pattern) {
            const { rdx, rdy } = getRotatedOffset(
              off.dx,
              off.dy,
              sourceItem.rotation,
            )
            footprintSet.add(`${ca.x + rdx},${ca.y + rdy}`)
          }
        } else if (syn.pattern === "ADJACENT") {
          footprintSet.add(`${ca.x + 1},${ca.y}`)
          footprintSet.add(`${ca.x - 1},${ca.y}`)
          footprintSet.add(`${ca.x},${ca.y + 1}`)
          footprintSet.add(`${ca.x},${ca.y - 1}`)
        } else if (syn.pattern === "PARALLEL") {
          footprintSet.add(`${ca.x + 2},${ca.y}`)
          footprintSet.add(`${ca.x - 2},${ca.y}`)
          footprintSet.add(`${ca.x},${ca.y + 2}`)
          footprintSet.add(`${ca.x},${ca.y - 2}`)
        } else if (syn.pattern === "TWO_ACROSS") {
          footprintSet.add(`${ca.x + 2},${ca.y + 2}`)
          footprintSet.add(`${ca.x - 2},${ca.y - 2}`)
          footprintSet.add(`${ca.x + 2},${ca.y - 2}`)
          footprintSet.add(`${ca.x - 2},${ca.y + 2}`)
        }
      }

      // Check all target items that overlap with this footprint
      const targetIdsInFootprint = new Set<string>()
      for (const fKey of footprintSet) {
        const [fx, fy] = fKey.split(",").map(Number)
        if (fx < 0 || fx >= GRID_SIZE || fy < 0 || fy >= GRID_SIZE) continue

        const targetId = cellToInstanceMap.get(fKey)
        if (targetId && targetId !== sourceItem.instanceId) {
          targetIdsInFootprint.add(targetId)
        }

        // Add to potential/active synergy visual representation
        let icon = "Star"
        const desc = syn.description.toLowerCase()
        if (
          desc.includes("damage") ||
          desc.includes("weapon") ||
          desc.includes("attack")
        )
          icon = "Swords"
        else if (
          desc.includes("heal") ||
          desc.includes("health") ||
          desc.includes("hp")
        )
          icon = "Heart"
        else if (desc.includes("block") || desc.includes("armor"))
          icon = "Shield"
        else if (desc.includes("energy") || desc.includes("battery"))
          icon = "Battery"
        else if (desc.includes("mana") || desc.includes("magic"))
          icon = "Droplets"

        const targetItem = targetId ? instanceMap.get(targetId) : null
        if (targetItem && targetItem.instanceId !== sourceItem.instanceId) {
          const res = syn.apply(sourceItem, targetItem, gridItems)
          if (
            (res.buffs && Object.keys(res.buffs).length > 0) ||
            (res.multipliers && Object.keys(res.multipliers).length > 0) ||
            (res.effects && res.effects.length > 0)
          ) {
            results[sourceItem.instanceId].activeSynergySquares.push({
              x: fx,
              y: fy,
              icon,
            })
          } else {
            results[sourceItem.instanceId].potentialSynergySquares.push({
              x: fx,
              y: fy,
              icon,
            })
          }
        } else {
          results[sourceItem.instanceId].potentialSynergySquares.push({
            x: fx,
            y: fy,
            icon,
          })
        }
      }

      // Apply actual combat bonuses
      for (const targetId of targetIdsInFootprint) {
        const targetItem = instanceMap.get(targetId)
        if (!targetItem) continue

        if (checkPattern(sourceItem, targetItem, syn.pattern)) {
          const res = syn.apply(sourceItem, targetItem, gridItems)
          const effectTargetId = syn.targetIsSelf
            ? sourceItem.instanceId
            : targetItem.instanceId

          if (res.buffs) {
            for (const [stat, val] of Object.entries(res.buffs)) {
              results[effectTargetId].buffs[stat] =
                (results[effectTargetId].buffs[stat] || 0) + (val as number)
              if (
                stat === "damage" ||
                stat === "block" ||
                stat === "heal" ||
                stat === "spikes"
              ) {
                results[effectTargetId].totalBuff += val as number
              }
            }
          }
          if (res.multipliers) {
            for (const [stat, val] of Object.entries(res.multipliers)) {
              results[effectTargetId].multipliers[stat] =
                (results[effectTargetId].multipliers[stat] || 1) *
                (val as number)
            }
          }
          if (res.effects) {
            for (const eff of res.effects) {
              results[effectTargetId].effects.push(eff)
            }
          }
          results[effectTargetId].activeRules.push(
            `From ${sourceDef.name}: ${syn.description}`,
          )
        }
      }
    }

    // 4. Handle Boost Squares (e.g. boosters affecting this item)
    for (const ca of cellsA) {
      const boosters = cellBoostsMap.get(`${ca.x},${ca.y}`)
      if (!boosters) continue

      for (const boosterId of boosters) {
        const boosterItem = instanceMap.get(boosterId)
        if (!boosterItem) continue
        const boosterDef = ITEMS[boosterItem.itemId]
        if (!boosterDef?.synergies) continue

        for (const syn of boosterDef.synergies) {
          if (!syn.isBoostSquare) continue
          const res = syn.apply(boosterItem, sourceItem, gridItems)
          if (res.buffs) {
            for (const [stat, val] of Object.entries(res.buffs)) {
              results[sourceItem.instanceId].buffs[stat] =
                (results[sourceItem.instanceId].buffs[stat] || 0) +
                (val as number)
              if (stat === "damage" || stat === "block" || stat === "heal") {
                results[sourceItem.instanceId].totalBuff += val as number
              }
            }
          }
          if (res.multipliers) {
            for (const [stat, val] of Object.entries(res.multipliers)) {
              results[sourceItem.instanceId].multipliers[stat] =
                (results[sourceItem.instanceId].multipliers[stat] || 1) *
                (val as number)
            }
          }
          results[sourceItem.instanceId].activeRules.push(
            `From ${boosterDef.name}: ${syn.description}`,
          )
        }
      }
    }
  }

  const end = performance.now()
  if (end - start > 16) {
    console.log(
      `[Synergy] ${(end - start).toFixed(2)}ms | Items: ${gridItems.length}`,
    )
  }

  return results
}
