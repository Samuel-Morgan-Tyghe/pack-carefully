import { useStore } from "@nanostores/react"
import { motion } from "framer-motion"
import type { PanInfo } from "framer-motion"
import { Skull, Sword } from "lucide-react"
import React, { useRef, useState } from "react"
import { calculatePlayerCombatInfo } from "../../lib/combat"
import { GRID_SIZE, ITEMS } from "../../lib/items"
import { playSound } from "../../lib/sounds"
import { getDragHighlights } from "../../lib/synergies"
import {
  $containers,
  $currentPlayerId,
  $gameState,
  $itemsOnGrid,
  $players,
  checkCollision,
  checkSupport,
  moveItem,
} from "../../store/gameStore"
import BackpackGhost from "./BackpackGhost"
import BackpackItem from "./BackpackItem"

const CELL_SIZE = 64
const GAP = 4
const BOSS_DIFFICULTY = 200 // Hard!

const MegaBag: React.FC = () => {
  const items = useStore($itemsOnGrid)
  const players = useStore($players)
  const containers = useStore($containers)
  const currentPlayerId = useStore($currentPlayerId)
  const gridRef = useRef<HTMLDivElement>(null)

  // Track dragging state
  const [draggedInstanceId, setDraggedInstanceId] = useState<string | null>(
    null,
  )
  const [ghostPosition, setGhostPosition] = useState<{
    x: number
    y: number
  } | null>(null)
  const [isGhostValid, setIsGhostValid] = useState(true)
  const [highlightedInstanceIds, setHighlightedInstanceIds] = useState<
    string[]
  >([])

  const snapToGrid = (point: { x: number; y: number }) => {
    if (!gridRef.current) return { x: 0, y: 0, gridX: 0, gridY: 0 }
    const rect = gridRef.current.getBoundingClientRect()
    const xOffset = point.x - rect.left
    const yOffset = point.y - rect.top

    const gridX = Math.floor(xOffset / (CELL_SIZE + GAP))
    const gridY = Math.floor(yOffset / (CELL_SIZE + GAP))

    const clampedX = Math.max(0, Math.min(GRID_SIZE - 1, gridX))
    const clampedY = Math.max(0, Math.min(GRID_SIZE - 1, gridY))

    return {
      x: clampedX * (CELL_SIZE + GAP),
      y: clampedY * (CELL_SIZE + GAP),
      gridX: clampedX,
      gridY: clampedY,
    }
  }

  const calculateGhostValidity = (
    gx: number,
    gy: number,
    itemId: string,
    instanceId?: string,
    currentRot = 0,
  ) => {
    const itemDef = ITEMS[itemId]
    if (!itemDef) return false

    const item = items.find((i) => i.instanceId === instanceId)
    const ownerId = item?.ownerId || currentPlayerId || players[0]?.id // Use tracked player

    const w =
      currentRot === 90 || currentRot === 270 ? itemDef.height : itemDef.width
    const h =
      currentRot === 90 || currentRot === 270 ? itemDef.width : itemDef.height

    // 1. Collision (Item vs Item)
    const noCollision = !checkCollision(
      gx,
      gy,
      w,
      h,
      items,
      ownerId,
      instanceId,
      itemDef.category,
    )

    // 2. Support (Item inside Container)
    // We must check if the item is fully inside valid container cells
    const supported = checkSupport(gx, gy, w, h, items, ownerId)

    return noCollision && supported
  }

  const handleDragStart = (instanceId: string) => {
    setDraggedInstanceId(instanceId)
  }

  const handleDrag = (
    _instanceId: string,
    itemId: string,
    currentRot: number,
    info: PanInfo,
  ) => {
    const { gridX, gridY } = snapToGrid(info.point)
    setGhostPosition({ x: gridX, y: gridY })
    const valid = calculateGhostValidity(
      gridX,
      gridY,
      itemId,
      draggedInstanceId || undefined,
      currentRot,
    )
    setIsGhostValid(valid)

    // Calculate Synergy Highlights
    const highlights = getDragHighlights(itemId, gridX, gridY, items)
    setHighlightedInstanceIds(highlights)
  }

  const handleDragEnd = (
    instanceId: string,
    itemId: string,
    currentRot: number,
    info: PanInfo,
  ) => {
    const { gridX, gridY } = snapToGrid(info.point)

    if (calculateGhostValidity(gridX, gridY, itemId, instanceId, currentRot)) {
      playSound.place()
      moveItem(instanceId, gridX, gridY, currentRot as 0 | 90 | 180 | 270)
    }

    setDraggedInstanceId(null)
    setGhostPosition(null)
    setHighlightedInstanceIds([])
  }

  const combatInfo = calculatePlayerCombatInfo(items)
  // Simple power metric: Damage * 2 + Defense + HP/10
  const totalPower =
    combatInfo.stats.damage * 2 +
    combatInfo.stats.defense +
    Math.floor((100 + combatInfo.stats.block) / 10)
  const winChance = Math.min(100, Math.round((totalPower / 50) * 100)) // Adjusted difficulty scaling

  const handleBossFight = () => {
    const success = totalPower >= BOSS_DIFFICULTY
    $gameState.set({
      ...$gameState.get(),
      isGameOver: true,
      gameResult: success ? "WIN" : "LOSS",
    })
  }

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        layoutId="backpack-grid"
        className="relative bg-transparent p-12" // Removed background to emphasize containers
        style={{
          width: GRID_SIZE * 64 + 96 + (GRID_SIZE - 1) * GAP,
          height: GRID_SIZE * 64 + 96 + (GRID_SIZE - 1) * GAP,
        }}
      >
        <h2 className="absolute -top-16 left-0 right-0 text-center text-4xl font-black text-indigo-300 uppercase tracking-[0.2em] drop-shadow-lg">
          Pack Your Gear
        </h2>

        <div
          ref={gridRef}
          className="relative rounded-xl border-2 border-dashed border-white/10" // Visual boundary of the floor
          style={{
            width: GRID_SIZE * 64 + (GRID_SIZE - 1) * GAP,
            height: GRID_SIZE * 64 + (GRID_SIZE - 1) * GAP,
          }}
        >
          {/* Render Containers (Polyominoes) */}
          {containers.map((container) => (
            <React.Fragment key={container.id}>
              {container.cells.map((cell, idx) => {
                const isDisabled = container.disabledCells?.some(
                  (dc) => dc.x === cell.x && dc.y === cell.y,
                )
                return (
                  <div
                    key={`${container.id}-${idx}`}
                    className={
                      isDisabled
                        ? "absolute bg-black/80 border border-black/50 rounded-full shadow-inner"
                        : "absolute bg-amber-800 border border-amber-900 rounded-sm shadow-sm"
                    }
                    style={{
                      left: cell.x * (CELL_SIZE + GAP),
                      top: cell.y * (CELL_SIZE + GAP),
                      width: CELL_SIZE,
                      height: CELL_SIZE,
                      opacity: isDisabled ? 0.3 : 0.8,
                      transform: isDisabled ? "scale(0.8)" : "none",
                    }}
                  />
                )
              })}
            </React.Fragment>
          ))}

          {/* Ghost */}
          <BackpackGhost
            ghostPosition={ghostPosition}
            isGhostValid={isGhostValid}
            draggedInstanceId={draggedInstanceId}
            externalDraggedItem={null}
            itemsOnGrid={items} // Show all items
            CELL_SIZE={CELL_SIZE}
            GAP={GAP}
          />

          {/* Items */}
          {items.map((item) => (
            <BackpackItem
              key={item.instanceId}
              item={item}
              draggedInstanceId={draggedInstanceId}
              onDragStart={handleDragStart}
              onDrag={handleDrag}
              onDragEnd={handleDragEnd}
              CELL_SIZE={CELL_SIZE}
              GAP={GAP}
              isHighlighted={highlightedInstanceIds.includes(item.instanceId)}
              minX={0}
              minY={0}
            />
          ))}
        </div>
      </motion.div>

      <div className="mt-8 text-center max-w-xl flex flex-col items-center gap-4">
        <div className="bg-black/50 p-6 rounded-xl border border-indigo-500/30">
          <div className="text-3xl font-black text-white mb-2 flex items-center gap-3">
            <Sword size={32} className="text-gold-500" />
            <span>COMBAT POWER: {totalPower}</span>
          </div>
          <div className="text-indigo-300 text-sm uppercase tracking-widest mb-4">
            Target: {BOSS_DIFFICULTY} ({winChance}% Chance)
          </div>

          <button
            type="button"
            onClick={handleBossFight}
            className="bg-red-600 hover:bg-red-500 text-white font-black text-2xl py-4 px-12 rounded-full shadow-[0_0_30px_rgba(220,38,38,0.6)] animate-pulse hover:animate-none transition-transform hover:scale-105 flex items-center gap-4"
          >
            <Skull /> CONFRONT THE BEAST
          </button>
        </div>

        <p className="text-indigo-200 text-sm opacity-60">
          <span className="font-bold text-red-400">CHAOS MODE:</span> All
          inventories are combined! Any player can move any item. Traitors, do
          your worst.
        </p>
      </div>
    </div>
  )
}

export default MegaBag
