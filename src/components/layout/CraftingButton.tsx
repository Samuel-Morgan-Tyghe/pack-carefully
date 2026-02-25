import { useStore } from "@nanostores/react"
import clsx from "clsx"
import * as LucideIcons from "lucide-react"
import type React from "react"
import { useEffect, useState } from "react"
import { findPossibleCraft } from "../../lib/crafting"
import {
  $craftingHighlights,
  $draftState,
  $itemsOnGrid,
  $localPlayerId,
  craftItem,
} from "../../store/gameStore"

const CraftingButton: React.FC = () => {
  const localPlayerId = useStore($localPlayerId)
  const draftState = useStore($draftState)
  const itemsOnGrid = useStore($itemsOnGrid)
  const [possibleCraft, setPossibleCraft] = useState<any>(null)

  useEffect(() => {
    if (!localPlayerId) {
      setPossibleCraft(null)
      return
    }

    const shelf = draftState.availableItems[localPlayerId] || []
    const bag = itemsOnGrid.filter((i) => i.ownerId === localPlayerId)

    const match = findPossibleCraft(shelf, bag)
    setPossibleCraft(match)
  }, [draftState, itemsOnGrid, localPlayerId])

  const handleMouseEnter = () => {
    if (possibleCraft) {
      const ids = possibleCraft.matchedSources.map((s: any) => s.id)
      $craftingHighlights.set(ids)
    }
  }

  const handleMouseLeave = () => {
    $craftingHighlights.set([])
  }

  const handleClick = () => {
    if (localPlayerId && possibleCraft) {
      craftItem(localPlayerId)
      $craftingHighlights.set([])
    }
  }

  if (!possibleCraft) return null

  return (
    <div className="fixed bottom-12 right-6 z-[100] animate-in zoom-in slide-in-from-bottom-4">
      <button
        type="button"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        data-tooltip-id="item-tooltip"
        data-item-id={possibleCraft.recipe.result}
        className={clsx(
          "group flex items-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-br from-gold-500 to-gold-700 border-2 border-gold-300 shadow-2xl transition-all hover:scale-105 active:scale-95",
          "after:absolute after:inset-0 after:rounded-2xl after:shadow-[0_0_20px_rgba(251,191,36,0.6)] after:animate-pulse-slow",
        )}
      >
        <div className="relative">
          <LucideIcons.Hammer className="w-8 h-8 text-wood-950 animate-bounce-subtle" />
          <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm">
            !
          </div>
        </div>
        <div className="flex flex-col items-start leading-tight">
          <span className="text-xs font-black uppercase tracking-widest text-wood-950 opacity-60">
            Possible Craft
          </span>
          <span className="text-lg font-display font-black text-wood-950 drop-shadow-sm">
            {possibleCraft.recipe.result
              .split("_")
              .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(" ")}
          </span>
        </div>
        <LucideIcons.ArrowRight className="w-5 h-5 text-wood-950 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  )
}

export default CraftingButton
