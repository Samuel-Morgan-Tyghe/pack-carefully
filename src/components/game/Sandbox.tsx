import clsx from "clsx"
import * as LucideIcons from "lucide-react"
import type React from "react"
import { useState } from "react"
import { ITEMS } from "../../lib/items"
import {
  SANDBOX_PLAYER_ID,
  clearSandboxGrid,
  leaveSandbox,
} from "../../store/gameStore"
import Inventory from "../Inventory"
import ShelfItem from "../layout/ShelfItem"
import type { Item } from "../../types"

const Sandbox: React.FC = () => {
  const CATEGORIES = [
    ...new Set(Object.values(ITEMS).map((i: Item) => i.category)),
  ]
  const [activeTab, setActiveTab] = useState(CATEGORIES[0])

  // Sandbox uses ALL items available in the ITEMS constant
  const allItems = Object.values(ITEMS)
  const activeItems = allItems.filter((i) => i.category === activeTab)

  return (
    <div className="w-full h-full flex flex-col md:flex-row gap-4 p-4 overflow-hidden">
      {/* Left Side: Shelf */}
      <section className="w-full md:w-80 h-full bg-wood-800/50 rounded-2xl border-2 border-wood-700 flex flex-col overflow-hidden backdrop-blur-sm shadow-2xl">
        <div className="p-4 border-b border-wood-700 flex justify-between items-center gap-2">
          <button
            type="button"
            onClick={leaveSandbox}
            className="p-2 hover:bg-wood-700 text-wood-400 rounded-lg transition-colors"
            title="Back to Lobby"
          >
            <LucideIcons.Home size={20} />
          </button>
          <h2 className="text-xl font-display font-bold text-gold-500 uppercase tracking-widest flex items-center gap-2 flex-1">
            Sandbox
          </h2>
          <button
            type="button"
            onClick={clearSandboxGrid}
            className="p-2 bg-red-900/30 hover:bg-red-800/50 text-red-400 rounded-lg border border-red-700 transition-colors"
            title="Clear Grid"
          >
            <LucideIcons.Trash2 size={16} />
          </button>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-1 p-2 border-b border-wood-700 bg-black/20">
          {CATEGORIES.map((cat) => (
            <button
              type="button"
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={clsx(
                "flex-1 min-w-[80px] py-1.5 rounded text-[10px] font-bold uppercase tracking-tighter transition-all border",
                activeTab === cat
                  ? "bg-gold-600 border-gold-400 text-wood-900"
                  : "bg-wood-900/50 border-wood-700 text-wood-500 hover:text-wood-300 hover:bg-wood-800",
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-3 content-start">
          {activeItems.map((item) => (
            <ShelfItem key={item.id} item={item} />
          ))}
          {activeItems.length === 0 && (
            <div className="col-span-2 text-center py-12 text-wood-500 italic">
              No items in this category
            </div>
          )}
        </div>
      </section>

      {/* Center: The Grid */}
      <section className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="mb-4 text-center">
          <h1 className="text-2xl font-black text-white uppercase tracking-tighter mb-1">
            Synergy Sandbox
          </h1>
          <p className="text-wood-400 text-sm italic">
            Place items to test adjacency rules and synergies.
          </p>
        </div>

        <Inventory
          playerId={SANDBOX_PLAYER_ID}
          className="scale-90 lg:scale-100"
        />

        <div className="mt-8 flex gap-4">
          <div className="flex items-center gap-2 text-xs text-wood-400 bg-black/40 px-4 py-2 rounded-full border border-white/5">
            <kbd className="px-1.5 py-0.5 bg-wood-700 rounded text-parchment-100 font-mono">
              R
            </kbd>{" "}
            Rotate
          </div>
          <div className="flex items-center gap-2 text-xs text-wood-400 bg-black/40 px-4 py-2 rounded-full border border-white/5">
            <kbd className="px-1.5 py-0.5 bg-wood-700 rounded text-parchment-100 font-mono">
              DEL
            </kbd>{" "}
            Remove
          </div>
        </div>
      </section>
    </div>
  )
}

export default Sandbox
