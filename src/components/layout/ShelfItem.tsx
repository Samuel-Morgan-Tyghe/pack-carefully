import { useStore } from "@nanostores/react"
import clsx from "clsx"
import * as LucideIcons from "lucide-react"
import type React from "react"
import { $activePreview, $draggedItem } from "../../store/gameStore"
import type { Item } from "../../types"

interface ShelfItemProps {
  item: Item
}

const ShelfItem: React.FC<ShelfItemProps> = ({ item }) => {
  const draggedItem = useStore($draggedItem)
  const isDragging = draggedItem === item.id

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("itemId", item.id)
    $draggedItem.set(item.id)
    $activePreview.set({ type: "definition", id: item.id })
  }

  const handleDragEnd = () => {
    $draggedItem.set(null)
  }

  const handleMouseEnter = () => {
    $activePreview.set({ type: "definition", id: item.id })
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (draggedItem === item.id) {
      $draggedItem.set(null)
    } else {
      $draggedItem.set(item.id)
      $activePreview.set({ type: "definition", id: item.id })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      if (draggedItem === item.id) {
        $draggedItem.set(null)
      } else {
        $draggedItem.set(item.id)
        $activePreview.set({ type: "definition", id: item.id })
      }
    }
  }

  const Icon = (LucideIcons as any)[item.icon] || LucideIcons.Box

  // RARITY COLORS
  const rarityStyles = {
    COMMON:
      "bg-slate-800/80 border-slate-600 shadow-slate-950/20 text-slate-300",
    UNCOMMON:
      "bg-green-900/40 border-green-600/50 shadow-green-900/20 text-green-300",
    RARE: "bg-blue-900/40 border-blue-600/50 shadow-blue-900/20 text-blue-300",
    LEGENDARY:
      "bg-gold-900/40 border-gold-500/50 shadow-gold-600/30 text-gold-300 animate-pulse-slow",
  }

  const activeRarity = rarityStyles[item.rarity || "COMMON"]

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onMouseEnter={handleMouseEnter}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      /* biome-ignore lint/a11y/useSemanticElements: Complex draggable item container */
      role="button"
      tabIndex={0}
      data-tooltip-id="item-tooltip"
      data-item-id={item.id}
      className={clsx(
        "group relative flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all cursor-grab active:cursor-grabbing",
        "hover:scale-105 hover:z-20",
        activeRarity,
        draggedItem === item.id
          ? "ring-2 ring-gold-500 ring-offset-1 ring-offset-wood-900 shadow-gold-500/20"
          : "shadow-lg",
        isDragging ? "opacity-40" : "opacity-100",
      )}
    >
      {/* Mini Visual Shape Preview */}
      <div
        className="relative mb-1 pointer-events-none"
        style={{ width: 32, height: 32 }}
      >
        {/* Render true shape in mini grid */}
        {item.shape
          ? item.shape.map((cell, i) => (
              <div
                key={`${cell.x}-${cell.y}-${i}`}
                className={clsx(
                  "absolute rounded-sm border-[1px] border-white/10",
                  item.rarity === "LEGENDARY"
                    ? "bg-gold-500"
                    : item.rarity === "RARE"
                      ? "bg-blue-500"
                      : item.rarity === "UNCOMMON"
                        ? "bg-green-500"
                        : "bg-slate-500",
                )}
                style={{
                  width: 8,
                  height: 8,
                  left: cell.x * 8,
                  top: cell.y * 8,
                }}
              />
            ))
          : /* Simple Rect Preview */
            Array.from({ length: item.width * item.height }).map((_, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: Static grid preview
                key={`rect-${i}`}
                className={clsx(
                  "absolute rounded-sm border-[1px] border-white/10",
                  item.rarity === "LEGENDARY"
                    ? "bg-gold-500"
                    : item.rarity === "RARE"
                      ? "bg-blue-500"
                      : item.rarity === "UNCOMMON"
                        ? "bg-green-500"
                        : "bg-slate-500",
                )}
                style={{
                  width: 8,
                  height: 8,
                  left: (i % item.width) * 8,
                  top: Math.floor(i / item.width) * 8,
                }}
              />
            ))}
      </div>

      <Icon size={16} className="mb-1" />
      <span className="text-[8px] font-black uppercase tracking-tighter text-center line-clamp-1">
        {item.name}
      </span>

      {/* Rarity Indicator Sparkle/Dot */}
      <div
        className={clsx(
          "absolute top-1 right-1 w-1.5 h-1.5 rounded-full shadow-sm",
          item.rarity === "LEGENDARY"
            ? "bg-gold-400"
            : item.rarity === "RARE"
              ? "bg-blue-400"
              : item.rarity === "UNCOMMON"
                ? "bg-green-400"
                : "bg-slate-500",
        )}
      />
    </div>
  )
}

export default ShelfItem
