import type React from "react"
import { ITEMS } from "../../lib/items/items"
import { cn } from "../../lib/utils"
import { getItemCells } from "../../store/gameStore"
import type { Coordinate, InventoryItemInstance } from "../../types"

interface BackpackGhostProps {
  ghostPosition: { x: number; y: number; gridX: number; gridY: number } | null
  isGhostValid: boolean
  draggedInstanceId: string | null
  externalDraggedItem: string | null
  itemsOnGrid: InventoryItemInstance[]
  CELL_SIZE: number
  GAP: number
  rotation?: number
}

const BackpackGhost: React.FC<BackpackGhostProps> = ({
  ghostPosition,
  isGhostValid,
  draggedInstanceId,
  externalDraggedItem,
  itemsOnGrid,
  CELL_SIZE,
  GAP,
  rotation = 0,
}) => {
  if (!ghostPosition || (!draggedInstanceId && !externalDraggedItem))
    return null

  // Determine which item is ghosting
  let itemId = externalDraggedItem
  let rot = rotation

  if (draggedInstanceId) {
    const item = itemsOnGrid.find((i) => i.instanceId === draggedInstanceId)
    if (item) {
      itemId = item.itemId
      rot = item.rotation
    }
  }

  if (!itemId) return null
  const itemDef = ITEMS[itemId]
  if (!itemDef) return null

  // Get the "True Shape" cells relative to current grid position
  const trueCells = getItemCells(
    ghostPosition.gridX,
    ghostPosition.gridY,
    itemId,
    rot as 0 | 90 | 180 | 270,
  )

  // Normalized cells relative to the ghost's top-left
  const visualCells = trueCells.map((c: Coordinate) => ({
    x: c.x - ghostPosition.gridX,
    y: c.y - ghostPosition.gridY,
  }))

  const w = rot === 90 || rot === 270 ? itemDef.height : itemDef.width
  const h = rot === 90 || rot === 270 ? itemDef.width : itemDef.height

  return (
    <div
      className="absolute z-[100] pointer-events-none"
      style={{
        left: ghostPosition.x,
        top: ghostPosition.y,
        width: w * CELL_SIZE + (w - 1) * GAP,
        height: h * CELL_SIZE + (h - 1) * GAP,
      }}
    >
      {/* TRUE SHAPE GHOST: Render each cell individually */}
      {visualCells.map((cell: Coordinate, idx: number) => (
        <div
          key={`${idx}-${cell.x}-${cell.y}`}
          className={cn(
            "absolute rounded-md border-2 border-dashed shadow-2xl transition-all duration-75",
            isGhostValid
              ? "bg-green-500/20 border-green-400/80 shadow-green-500/10"
              : "bg-red-500/20 border-red-400/80 shadow-red-500/10",
          )}
          style={{
            width: CELL_SIZE,
            height: CELL_SIZE,
            left: cell.x * (CELL_SIZE + GAP),
            top: cell.y * (CELL_SIZE + GAP),
          }}
        >
          {/* Pulsing Interior */}
          <div
            className={cn(
              "absolute inset-0 animate-pulse-slow rounded-md",
              isGhostValid ? "bg-green-400/5" : "bg-red-400/5",
            )}
          />
        </div>
      ))}

      {/* Status Badge */}
      <div
        className={cn(
          "absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest whitespace-nowrap shadow-lg border z-[110]",
          isGhostValid
            ? "bg-green-600 text-white border-green-400"
            : "bg-red-600 text-white border-red-400",
        )}
      >
        {isGhostValid ? "Valid Spot" : "Invalid Spot"}
      </div>
    </div>
  )
}

export default BackpackGhost
