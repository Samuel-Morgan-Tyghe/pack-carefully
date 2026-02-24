import clsx from "clsx"
import { motion } from "framer-motion"
import type { PanInfo } from "framer-motion"
import * as LucideIcons from "lucide-react"
import React from "react"
import type { AdjacencyResult } from "../../lib/adjacency"
import { ITEMS } from "../../lib/items"
import { playSound } from "../../lib/sounds"
import { getItemCells, getPixelCoords, toggleLock } from "../../store/gameStore"
import type { Coordinate, InventoryItemInstance } from "../../types"

interface BackpackItemProps {
  item: InventoryItemInstance
  draggedInstanceId: string | null
  onDragStart: (id: string, info: PanInfo) => void
  onDrag: (id: string, itemId: string, rotation: number, info: PanInfo) => void
  onDragEnd: (
    instanceId: string,
    itemId: string,
    rotation: number,
    info: PanInfo,
  ) => void
  CELL_SIZE: number
  GAP: number
  isHighlighted?: boolean
  cooldown?: number // 0-100%
  isSelected?: boolean
  onSelect?: () => void
  adjacencyResult?: AdjacencyResult
  viewOnly?: boolean
}

const BackpackItem: React.FC<BackpackItemProps> = ({
  item,
  draggedInstanceId,
  onDragStart,
  onDrag,
  onDragEnd,
  CELL_SIZE,
  GAP,
  isHighlighted,
  cooldown = 0,
  isSelected = false,
  onSelect,
  adjacencyResult,
  viewOnly = false,
}) => {
  const itemDef = ITEMS[item.itemId]
  const disguiseDef = item.disguiseItemId ? ITEMS[item.disguiseItemId] : null
  const displayDef = disguiseDef || itemDef

  const isDragging = draggedInstanceId === item.instanceId
  const canInteract = !viewOnly

  // Logic: Get the "True Shape" cells relative to item.x, item.y
  const trueCells = getItemCells(item.x, item.y, item.itemId, item.rotation)

  // Normalized cells relative to the item's own top-left (0,0)
  const visualCells = trueCells.map((c: Coordinate) => ({
    x: c.x - item.x,
    y: c.y - item.y,
  }))

  // Bounding box for the main container
  const w =
    item.rotation === 90 || item.rotation === 270
      ? itemDef.height
      : itemDef.width
  const h =
    item.rotation === 90 || item.rotation === 270
      ? itemDef.width
      : itemDef.height

  // Absolute pixel target for transform
  const coords = getPixelCoords(item.x, item.y)

  return (
    <motion.div
      drag={canInteract && !item.locked}
      dragMomentum={false}
      dragElastic={0}
      whileDrag={{ zIndex: 100, scale: 1.02 }}
      animate={{
        x: coords.x,
        y: coords.y,
        rotate: item.rotation,
      }}
      transition={{ type: "spring", stiffness: 1200, damping: 50 }}
      initial={false}
      style={{
        position: "absolute",
        width: w * CELL_SIZE + (w - 1) * GAP,
        height: h * CELL_SIZE + (h - 1) * GAP,
        left: 0,
        top: 0,
        // ALLOW POINTER EVENTS even in viewOnly so tooltips work
        pointerEvents: "auto",
      }}
      data-tooltip-id="item-tooltip"
      data-item-id={item.itemId}
      data-instance-id={item.instanceId}
      data-grid-x={item.x}
      data-grid-y={item.y}
      onDragStart={(_, info) => {
        if (canInteract && !item.locked) {
          playSound.pop()
          onDragStart(item.instanceId, info)
        }
      }}
      onDrag={(_, info) =>
        canInteract &&
        !item.locked &&
        onDrag(item.instanceId, item.itemId, item.rotation, info)
      }
      onDragEnd={(_, info) =>
        canInteract &&
        !item.locked &&
        onDragEnd(item.instanceId, item.itemId, item.rotation, info)
      }
      onClick={(e) => {
        if (!canInteract) return
        if (e.shiftKey) toggleLock(item.instanceId)
        else if (!isDragging) onSelect?.()
      }}
      className={clsx(
        "absolute transition-shadow",
        !viewOnly
          ? "cursor-grab active:cursor-grabbing hover:z-30"
          : "cursor-default",
        isDragging
          ? "opacity-50 z-50"
          : displayDef.category === "CONTAINER"
            ? "z-10"
            : "z-20",
      )}
    >
      {/* TRUE SHAPE RENDERING */}
      {visualCells.map((cell: Coordinate, idx: number) => (
        <div
          key={`${idx}-${cell.x}-${cell.y}`}
          className={clsx(
            "absolute rounded-md shadow-lg border-2 transition-all duration-200",
            isSelected &&
              "ring-4 ring-blue-400 ring-offset-2 ring-offset-black/50",
            isHighlighted &&
              "ring-4 ring-green-400 ring-offset-2 ring-offset-black/50",

            displayDef.category === "ESSENTIAL"
              ? "bg-gradient-to-br from-blue-700 to-blue-900 border-blue-500/50"
              : displayDef.category === "WEAPON"
                ? "bg-gradient-to-br from-red-800 to-red-950 border-red-600/50"
                : displayDef.category === "TOOL"
                  ? "bg-gradient-to-br from-slate-600 to-slate-800 border-slate-500/50"
                  : displayDef.category === "SURVIVAL"
                    ? "bg-gradient-to-br from-green-700 to-green-900 border-green-600/50"
                    : displayDef.category === "SABOTAGE"
                      ? "bg-gradient-to-br from-purple-800 to-purple-950 border-purple-700/50"
                      : "bg-gradient-to-br from-gray-600 to-gray-800 border-gray-500/50",

            (adjacencyResult?.totalBuff || 0) > 0 &&
              "shadow-[0_0_15px_rgba(234,179,8,0.5)] border-gold-400 ring-1 ring-gold-500",
            item.locked && "grayscale opacity-90 border-red-500/50",
          )}
          style={{
            width: CELL_SIZE,
            height: CELL_SIZE,
            left: cell.x * (CELL_SIZE + GAP),
            top: cell.y * (CELL_SIZE + GAP),
          }}
        />
      ))}

      {/* Content Container */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-30">
        <div className="transition-transform duration-300">
          {React.createElement(
            (LucideIcons as any)[displayDef.icon] || LucideIcons.Box,
            {
              className: clsx(
                "text-parchment-100",
                w === 1 && h === 1 ? "w-6 h-6" : "w-8 h-8",
              ),
            },
          )}
        </div>

        {(w > 1 || h > 1) && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-parchment-200 mt-1 drop-shadow-lg text-center px-1 line-clamp-1">
            {itemDef.name}
          </span>
        )}
      </div>

      {item.locked && (
        <div className="absolute top-1 right-1 text-red-500 z-40">
          <LucideIcons.Lock size={12} />
        </div>
      )}

      {cooldown > 0 && (
        <motion.div
          className="absolute bottom-0 left-0 right-0 bg-gray-900/60 z-20 pointer-events-none rounded-b-[4px]"
          initial={{ height: "0%" }}
          animate={{ height: `${cooldown}%` }}
          transition={{ duration: 0.1 }}
        />
      )}

      {adjacencyResult &&
        (adjacencyResult.totalBuff || 0) > 0 &&
        !item.locked && (
          <div className="absolute -top-2 -right-2 bg-gold-500 text-wood-900 font-bold text-xs w-6 h-6 rounded-full flex items-center justify-center shadow-lg border border-white transform scale-100 animate-bounce-subtle z-40">
            +{adjacencyResult.totalBuff}
          </div>
        )}
    </motion.div>
  )
}

export default BackpackItem
