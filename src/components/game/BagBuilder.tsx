import { useStore } from "@nanostores/react"
import clsx from "clsx"
import type React from "react"
import { useState } from "react"
import { GRID_SIZE } from "../../lib/items/items"
import {
  $containers,
  $localPlayerId,
  $players,
  $viewingPlayerId,
  createCustomContainer,
} from "../../store/gameStore"
import type { Coordinate, Player } from "../../types"

const MAX_CAPACITY = 15

const BagBuilder: React.FC = () => {
  const players = useStore($players)
  const containers = useStore($containers)
  const viewingPlayerId = useStore($viewingPlayerId)
  const localPlayerId = useStore($localPlayerId)

  const viewingPlayer =
    players.find((p) => p.id === viewingPlayerId) || players[0]

  if (!viewingPlayer) return null

  const hasContainer = containers.some((c) => c.ownerId === viewingPlayer.id)
  const isMe = viewingPlayer.id === localPlayerId

  return (
    <div className="fixed inset-0 bg-wood-900 z-50 flex flex-col items-center justify-center p-4">
      <h2 className="text-xl md:text-3xl font-display text-parchment-100 mb-1 md:mb-4 tracking-widest text-center">
        CONSTRUCT YOUR PACK
      </h2>
      <p className="text-parchment-200/70 mb-2 md:mb-8 text-center max-w-2xl text-[10px] sm:text-base px-4">
        Design your inventory shape. You have {MAX_CAPACITY} slots.
        <br />
        <span className="text-[10px] md:text-sm italic opacity-50">
          Click to toggle slots to build your bag.
        </span>
      </p>

      <div className="flex-1 w-full max-w-xl mx-auto flex flex-col justify-center">
        <PlayerBagEditor
          key={viewingPlayer.id}
          player={viewingPlayer}
          isLocked={hasContainer}
          isMe={isMe}
        />
      </div>
    </div>
  )
}

const PlayerBagEditor: React.FC<{
  player: Player
  isLocked: boolean
  isMe: boolean
}> = ({ player, isLocked, isMe }) => {
  const [cells, setCells] = useState<Coordinate[]>(() => {
    const startX = 3
    const startY = 3
    const initial: Coordinate[] = []
    for (let x = -1; x <= 2; x++) {
      for (let y = -1; y <= 2; y++) {
        initial.push({ x: startX + x, y: startY + y })
      }
    }
    return initial
  })

  const toggleCell = (x: number, y: number) => {
    if (isLocked) return
    setCells((prev) => {
      const exists = prev.find((c) => c.x === x && c.y === y)
      if (exists) return prev.filter((c) => c !== exists)
      if (prev.length >= MAX_CAPACITY) return prev
      return [...prev, { x, y }]
    })
  }

  const handleConfirm = () => {
    if (cells.length === 0) return
    createCustomContainer(player.id, cells)
  }

  return (
    <div
      className={clsx(
        "relative p-4 rounded-xl border-2 transition-all flex flex-col bg-wood-800 shadow-2xl z-20",
        isLocked
          ? "opacity-50 pointer-events-none border-green-500/50"
          : isMe
            ? "border-gold-500/50"
            : "border-white/10 opacity-70",
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-3 h-3 rounded-full ${player.avatarColor}`} />
        <span className="font-bold text-parchment-100">
          {player.name} {isMe && "(You)"}
        </span>
        <span className="ml-auto text-xs font-mono text-parchment-200">
          {cells.length} / {MAX_CAPACITY}
        </span>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 bg-black/40 rounded-lg overflow-hidden border border-white/5 relative">
        <div
          className={clsx(
            "grid gap-[1px]",
            !isMe && "pointer-events-none opacity-50",
          )}
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, clamp(18px, 5vw, 24px))`,
            gridTemplateRows: `repeat(${GRID_SIZE}, clamp(18px, 5vw, 24px))`,
          }}
        >
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
            const x = i % GRID_SIZE
            const y = Math.floor(i / GRID_SIZE)
            const isSelected = cells.some((c) => c.x === x && c.y === y)

            return (
              <button
                type="button"
                key={`${x}-${y}`}
                onMouseDown={() => isMe && toggleCell(x, y)}
                title={`Toggle cell ${x},${y}`}
                className={clsx(
                  "w-full h-full aspect-square rounded-sm transition-colors border outline-none",
                  "flex items-center justify-center", // For safety
                  isSelected
                    ? isMe
                      ? "bg-amber-600 border-amber-400"
                      : "bg-white/40 border-white/20"
                    : "bg-white/5 border-white/5",
                )}
              />
            )
          })}
        </div>

        {!isMe && (
          <div className="absolute inset-x-0 bottom-4 flex justify-center pointer-events-none">
            <span className="px-2 py-0.5 bg-black/60 rounded text-[9px] uppercase tracking-widest text-parchment-400 font-bold border border-white/10">
              View Only
            </span>
          </div>
        )}
      </div>

      {isMe && !isLocked && (
        <button
          type="button"
          onClick={handleConfirm}
          disabled={cells.length === 0}
          className="mt-4 py-3 bg-gold-600 text-black font-bold uppercase tracking-wider rounded-lg hover:bg-gold-500 transition-colors shadow-lg active:scale-[0.98] disabled:opacity-50"
        >
          Finalize Shape
        </button>
      )}

      {!isMe && !isLocked && (
        <div className="mt-4 py-3 text-center text-xs text-parchment-400 italic">
          Waiting for {player.name}...
        </div>
      )}

      {isLocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl z-30">
          <div className="bg-green-600/20 border-2 border-green-500 text-green-400 px-6 py-2 rounded-full font-bold tracking-widest uppercase animate-pulse">
            Ready
          </div>
        </div>
      )}
    </div>
  )
}

export default BagBuilder
