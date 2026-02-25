import { useStore } from "@nanostores/react"
import clsx from "clsx"
import * as LucideIcons from "lucide-react"
import type React from "react"
import { useMemo, useState } from "react"
import { ITEMS } from "../../lib/items/items"
import { $draftState, $localPlayerId } from "../../store/gameStore"
import type { Item } from "../../types"
import { ShelfCategory } from "./ShelfCategory"

const SupplyShelf: React.FC = () => {
  const { availableItems: draftPool } = useStore($draftState)
  const localPlayerId = useStore($localPlayerId)

  // Look up full item definitions from IDs
  const items = useMemo(() => {
    const ids = (localPlayerId && draftPool[localPlayerId]) || []
    return ids.map((id) => ITEMS[id]).filter(Boolean) as Item[]
  }, [draftPool, localPlayerId])

  const CATEGORIES = useMemo(() => {
    const baseCats = [...new Set(items.map((i) => i.category))]
    return ["ALL", ...baseCats]
  }, [items])

  const [activeTab, setActiveTab] = useState<string>("ALL")

  // Auto-reset tab if current one disappears (except ALL)
  const currentTab = CATEGORIES.includes(activeTab) ? activeTab : "ALL"

  const activeItems = useMemo(() => {
    if (currentTab === "ALL") return items
    return items.filter((i) => i.category === currentTab)
  }, [items, currentTab])

  return (
    <section className="h-full bg-wood-900/90 border-b-2 md:border-b-0 md:border-r-4 border-wood-700 shadow-2xl p-2 md:p-3 flex flex-row md:flex-col gap-2 relative z-10 backdrop-blur-sm overflow-hidden select-none">
      {/* Supply Header - Compact - Hidden on mobile if horizontal */}
      <div className="hidden md:flex justify-between items-center border-b border-wood-700 pb-1 shrink-0">
        <h3 className="font-display font-bold text-sm md:text-lg text-gold-500 drop-shadow-sm flex items-center gap-1.5">
          <LucideIcons.Package size={16} />
          Supplies
        </h3>
        <span className="text-[10px] bg-wood-800 px-1.5 py-0.5 rounded text-wood-300 font-mono border border-wood-600">
          {items.length}
        </span>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-col md:flex-row md:flex-wrap gap-1 overflow-y-auto md:overflow-x-auto pb-1 scrollbar-none shrink-0 border-r md:border-r-0 md:border-b border-wood-700 pr-1 md:pr-0">
        {CATEGORIES.map((cat) => {
          const count =
            cat === "ALL"
              ? items.length
              : items.filter((i) => i.category === cat).length
          if (count === 0 && cat !== currentTab) return null

          const iconName =
            cat === "ALL"
              ? "LayoutGrid"
              : cat === "WEAPON"
                ? "Swords"
                : cat === "TOOL"
                  ? "Hammer"
                  : cat === "ESSENTIAL"
                    ? "Package"
                    : cat === "SURVIVAL"
                      ? "Heart"
                      : cat === "COMFORT"
                        ? "Bed"
                        : cat === "CONTAINER"
                          ? "Square"
                          : "Skull"

          const Icon =
            (
              LucideIcons as unknown as Record<
                string,
                React.FC<{ size?: number }>
              >
            )[iconName] || LucideIcons.Package

          return (
            <button
              type="button"
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={clsx(
                "flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all border",
                currentTab === cat
                  ? "bg-gold-600 border-gold-400 text-wood-900 shadow-inner"
                  : "bg-wood-800 border-wood-600 text-wood-400 hover:bg-wood-700",
              )}
            >
              <Icon size={12} />
              <span className="hidden sm:inline">{cat.slice(0, 3)}</span>
              <span className="opacity-60">{count}</span>
            </button>
          )
        })}
      </div>

      {/* Shelf Content - Fixed Category */}
      <div className="flex-1 overflow-x-auto md:overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-wood-600 scrollbar-track-wood-900 min-h-0 w-full animate-in fade-in slide-in-from-left-2">
        <div className="flex flex-row md:flex-col gap-2 h-full">
          <ShelfCategory items={activeItems} />
        </div>
      </div>
    </section>
  )
}

export default SupplyShelf
