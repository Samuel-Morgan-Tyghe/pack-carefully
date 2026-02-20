import { useStore } from "@nanostores/react"
import * as LucideIcons from "lucide-react"
import type React from "react"
import { useEffect, useState } from "react"
import { generateLootPool } from "../../lib/generators"
import type { ScavengeEvent } from "../../lib/generators"
import {
  $activePreview,
  $gameState,
  addRandomLoot,
  completeScavenge,
} from "../../store/gameStore"
import type { Item } from "../../types"

const ScavengePhase: React.FC = () => {
  const [event, setEvent] = useState<ScavengeEvent | null>(null)
  const [lootPool, setLootPool] = useState<Item[]>([])
  const gameState = useStore($gameState)

  useEffect(() => {
    // Generate a random event on mount

    const newEvent = generateLootPool(gameState.day)

    setEvent(newEvent)

    setLootPool(newEvent.items)
  }, [gameState.day])

  const handleTakeItem = (item: Item) => {
    // Attempt to add to grid
    // TODO: Handle target player ID properly in multiplayer
    // For now, assume single player or "Unspecified" adds to first player
    const success = addRandomLoot(item.id)

    if (success) {
      // remove from pool
      setLootPool((prev) => prev.filter((i) => i.id !== item.id))
    } else {
      alert("No space!")
    }
  }

  const handleContinue = () => {
    completeScavenge()
  }

  if (!event) return <div className="text-white">Exploring...</div>

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-white">
      <div className="max-w-2xl w-full bg-slate-900/90 border-2 border-slate-700 rounded-xl p-8 shadow-2xl">
        <div className="flex items-center gap-4 mb-6 border-b border-slate-700 pb-4">
          {/* Icon for Event */}
          <div className="p-4 bg-indigo-900 rounded-full">
            <LucideIcons.MapPin size={32} className="text-indigo-300" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-indigo-300 uppercase tracking-widest">
              {event.title}
            </h2>
            <p className="text-slate-400 text-lg">{event.description}</p>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-sm font-bold uppercase text-slate-500 mb-4 tracking-wider">
            Discovered Items
          </h3>
          <div className="grid grid-cols-4 gap-4">
            {lootPool.map((item, idx) => {
              const Icon =
                (
                  LucideIcons as unknown as Record<
                    string,
                    LucideIcons.LucideIcon
                  >
                )[item.icon] || LucideIcons.HelpCircle
              return (
                <button
                  type="button"
                  key={`${item.id}-${idx}`}
                  onClick={() => {
                    $activePreview.set({ type: "definition", id: item.id })
                    handleTakeItem(item)
                  }}
                  className="bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 hover:border-indigo-400 p-4 rounded-lg flex flex-col items-center gap-2 transition-all active:scale-95 group"
                >
                  <Icon
                    size={32}
                    className="text-slate-300 group-hover:text-white"
                  />
                  <span className="font-bold text-sm text-center">
                    {item.name}
                  </span>
                  {/* <span className="text-xs text-slate-500">{item.width}x{item.height}</span> */}
                </button>
              )
            })}
            {lootPool.length === 0 && (
              <div className="col-span-4 text-center text-slate-500 italic py-8 border-2 border-dashed border-slate-800 rounded-lg">
                Nothing left to scavenge.
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleContinue}
            className="bg-green-600 hover:bg-green-500 text-white font-black py-4 px-12 rounded-full shadow-lg transition-transform hover:scale-105 flex items-center gap-2"
          >
            CONTINUE JOURNEY <LucideIcons.ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default ScavengePhase
