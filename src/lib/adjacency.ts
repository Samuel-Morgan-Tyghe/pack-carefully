import type {
  AdjacencyPattern,
  InventoryItemInstance,
  SynergyResult,
} from "../types"
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
  const results: Record<string, AdjacencyResult> = {}
  const cellBoosts = new Map<string, Set<string>>()

  for (const item of gridItems) {
    results[item.instanceId] = {
      instanceId: item.instanceId,
      totalBuff: 0,
      buffs: {},
      multipliers: {},
      activeRules: [],
      boostedSquares: [],
      activeSynergySquares: [],
      potentialSynergySquares: [],
    }
  }

  for (const sourceItem of gridItems) {
    const sourceDef = ITEMS[sourceItem.itemId]
    if (!sourceDef) continue

    if (sourceDef.synergies) {
      for (const syn of sourceDef.synergies) {
        if (syn.isBoostSquare) {
          const cells = getItemCells(sourceItem)
          for (const cell of cells) {
            const footprint: { x: number; y: number }[] = []
            if (Array.isArray(syn.pattern)) {
              for (const off of syn.pattern) {
                const { rdx, rdy } = getRotatedOffset(
                  off.dx,
                  off.dy,
                  sourceItem.rotation,
                )
                footprint.push({ x: cell.x + rdx, y: cell.y + rdy })
              }
            } else if (syn.pattern === "ADJACENT") {
              footprint.push(
                { x: cell.x + 1, y: cell.y },
                { x: cell.x - 1, y: cell.y },
                { x: cell.y + 1, y: cell.y }, // BUG FIX: should be x, y+1
                { x: cell.x, y: cell.y - 1 },
              )
            }

            for (const t of footprint) {
              if (t.x < 0 || t.x >= GRID_SIZE || t.y < 0 || t.y >= GRID_SIZE)
                continue
              const key = `${t.x},${t.y}`
              if (!cellBoosts.has(key)) cellBoosts.set(key, new Set())
              cellBoosts.get(key)?.add(sourceItem.instanceId)
              results[sourceItem.instanceId].boostedSquares.push(t)
            }
          }
        }
      }
    }
  }

  for (const sourceItem of gridItems) {
    const sourceDef = ITEMS[sourceItem.itemId]
    if (!sourceDef) continue

    const cellsA = getItemCells(sourceItem)
    const allRules = sourceDef.synergies || []

    for (const rule of allRules) {
      if (rule.isBoostSquare) continue

      const footprint: { x: number; y: number }[] = []
      const pattern = rule.pattern

      for (const ca of cellsA) {
        if (Array.isArray(pattern)) {
          for (const off of pattern) {
            const { rdx, rdy } = getRotatedOffset(
              off.dx,
              off.dy,
              sourceItem.rotation,
            )
            footprint.push({ x: ca.x + rdx, y: ca.y + rdy })
          }
        } else {
          if (pattern === "ADJACENT")
            footprint.push(
              { x: ca.x + 1, y: ca.y },
              { x: ca.x - 1, y: ca.y },
              { x: ca.x, y: ca.y + 1 },
              { x: ca.x, y: ca.y - 1 },
            )
          else if (pattern === "PARALLEL")
            footprint.push(
              { x: ca.x + 2, y: ca.y },
              { x: ca.x - 2, y: ca.y },
              { x: ca.x, y: ca.y + 2 },
              { x: ca.x, y: ca.y - 2 },
            )
          else if (pattern === "TWO_ACROSS")
            footprint.push(
              { x: ca.x + 2, y: ca.y + 2 },
              { x: ca.x - 2, y: ca.y - 2 },
              { x: ca.x + 2, y: ca.y - 2 },
              { x: ca.x - 2, y: ca.y + 2 },
            )
        }
      }

      const cellsAKeys = new Set(cellsA.map((c) => `${c.x},${c.y}`))
      const uniqueFootprint = Array.from(
        new Set(footprint.map((f) => `${f.x},${f.y}`)),
      )
        .map((s) => {
          const [x, y] = s.split(",").map(Number)
          return { x, y }
        })
        .filter(
          (f) =>
            f.x >= 0 &&
            f.x < GRID_SIZE &&
            f.y >= 0 &&
            f.y < GRID_SIZE &&
            !cellsAKeys.has(`${f.x},${f.y}`),
        )

      for (const square of uniqueFootprint) {
        const targetItem = gridItems.find((gi) => {
          if (gi.instanceId === sourceItem.instanceId) return false
          return getItemCells(gi).some(
            (tc) => tc.x === square.x && tc.y === square.y,
          )
        })

        let icon = "Star"
        const desc = rule.description.toLowerCase()
        if (
          desc.includes("damage") ||
          desc.includes("weapon") ||
          desc.includes("attack") ||
          desc.includes("sword")
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

        if (targetItem) {
          const res: SynergyResult = rule.apply(
            sourceItem,
            targetItem,
            gridItems,
          )
          const isActive = !!(
            (res.buffs && Object.keys(res.buffs).length > 0) ||
            (res.multipliers && Object.keys(res.multipliers).length > 0)
          )

          if (isActive) {
            results[sourceItem.instanceId].activeSynergySquares.push({
              ...square,
              icon,
            })
          } else {
            results[sourceItem.instanceId].potentialSynergySquares.push({
              ...square,
              icon,
            })
          }
        } else {
          results[sourceItem.instanceId].potentialSynergySquares.push({
            ...square,
            icon,
          })
        }
      }
    }
  }

  for (let i = 0; i < gridItems.length; i++) {
    const sourceItem = gridItems[i]
    const sourceDef = ITEMS[sourceItem.itemId]
    if (!sourceDef) continue

    for (let j = 0; j < gridItems.length; j++) {
      if (i === j) continue
      const targetItem = gridItems[j]

      if (sourceDef.synergies) {
        for (const syn of sourceDef.synergies) {
          if (syn.isBoostSquare) continue
          if (checkPattern(sourceItem, targetItem, syn.pattern)) {
            const res = syn.apply(sourceItem, targetItem, gridItems)
            const effectTargetId = syn.targetIsSelf
              ? sourceItem.instanceId
              : targetItem.instanceId

            if (res.buffs) {
              for (const [stat, val] of Object.entries(res.buffs)) {
                results[effectTargetId].buffs[stat] =
                  (results[effectTargetId].buffs[stat] || 0) + (val as number)
                if (stat === "damage" || stat === "block" || stat === "heal") {
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
            if (
              (res.buffs && Object.keys(res.buffs).length > 0) ||
              (res.multipliers && Object.keys(res.multipliers).length > 0)
            ) {
              results[effectTargetId].activeRules.push(
                `From ${sourceDef.name}: ${syn.description}`,
              )
            }
          }
        }
      }
    }

    const cells = getItemCells(sourceItem)
    for (const c of cells) {
      const boostingInstanceIds = cellBoosts.get(`${c.x},${c.y}`)
      if (boostingInstanceIds) {
        for (const boosterId of boostingInstanceIds) {
          const boosterItem = gridItems.find(
            (item) => item.instanceId === boosterId,
          )
          if (!boosterItem) continue
          const boosterDef = ITEMS[boosterItem.itemId]
          if (!boosterDef) continue

          if (boosterDef.synergies) {
            for (const syn of boosterDef.synergies) {
              if (syn.isBoostSquare) {
                const res = syn.apply(boosterItem, sourceItem, gridItems)
                if (res.buffs) {
                  for (const [stat, val] of Object.entries(res.buffs)) {
                    results[sourceItem.instanceId].buffs[stat] =
                      (results[sourceItem.instanceId].buffs[stat] || 0) +
                      (val as number)
                    if (
                      stat === "damage" ||
                      stat === "block" ||
                      stat === "heal"
                    ) {
                      results[sourceItem.instanceId].totalBuff += val as number
                    }
                  }
                }
                if (
                  (res.buffs && Object.keys(res.buffs).length > 0) ||
                  (res.multipliers && Object.keys(res.multipliers).length > 0)
                ) {
                  results[sourceItem.instanceId].activeRules.push(
                    `From ${boosterDef.name}: ${syn.description}`,
                  )
                }
              }
            }
          }
        }
      }
    }
  }

  return results
}
