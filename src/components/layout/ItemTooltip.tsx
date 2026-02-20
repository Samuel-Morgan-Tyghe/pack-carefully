import { useStore } from "@nanostores/react"
import clsx from "clsx"
import * as LucideIcons from "lucide-react"
import React from "react"
import { getAdjacencyBonuses } from "../../lib/adjacency"
import { ITEMS } from "../../lib/items"
import { $itemsOnGrid } from "../../store/gameStore"

interface ItemTooltipProps {
  itemId: string
  instanceId?: string
}

const ItemTooltip: React.FC<ItemTooltipProps> = ({ itemId, instanceId }) => {
  const itemsOnGrid = useStore($itemsOnGrid)

  const def = ITEMS[itemId]

  const itemInstance = React.useMemo(
    () =>
      instanceId
        ? itemsOnGrid.find((i) => i.instanceId === instanceId)
        : undefined,
    [itemsOnGrid, instanceId],
  )

  const adjacencyResult = React.useMemo(() => {
    if (!itemInstance || !instanceId) return null
    return getAdjacencyBonuses(itemsOnGrid)[instanceId]
  }, [itemsOnGrid, instanceId, itemInstance])

  if (!def) return null

  const rarityColor: Record<string, string> = {
    COMMON: "text-slate-400",
    UNCOMMON: "text-green-400",
    RARE: "text-blue-400",
    LEGENDARY: "text-amber-400",
  }

  const liveStats = itemInstance?.liveStats

  const renderStatBadge = (
    icon: React.ReactNode,
    statName: string,
    baseValue: number | undefined,
    currentValue: number | undefined,
    colorClass: string,
    bgClass: string,
    borderClass: string,
    suffix = "",
  ) => {
    if (baseValue === undefined && currentValue === undefined) return null

    const displayValue = currentValue ?? baseValue

    // Adjacency can use 'defense' or 'block', unify here
    const buff =
      (adjacencyResult?.buffs[statName] || 0) +
      (statName === "defense" ? adjacencyResult?.buffs.block || 0 : 0)
    const multiplier =
      (adjacencyResult?.multipliers[statName] || 1) *
      (statName === "defense" ? adjacencyResult?.multipliers.block || 1 : 1)

    const hasBoost = buff !== 0 || multiplier !== 1

    return (
      <span
        className={clsx(
          "text-[9px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 shrink-0 transition-all",
          colorClass,
          bgClass,
          borderClass,
          hasBoost &&
            "ring-1 ring-gold-500/50 shadow-[0_0_8px_rgba(234,179,8,0.2)] border-gold-500/30",
        )}
      >
        {icon}
        <span>
          {displayValue}
          {suffix}
        </span>
        {hasBoost && (
          <span className="text-[7px] opacity-90 flex items-center gap-0.5 ml-0.5 font-black text-gold-400">
            {buff !== 0 && <span>{buff > 0 ? `+${buff}` : buff}</span>}
            {multiplier !== 1 && (
              <span>x{multiplier.toFixed(1).replace(".0", "")}</span>
            )}
          </span>
        )}
      </span>
    )
  }

  return (
    <div className="w-[220px] text-xs pointer-events-none">
      {/* Header */}
      <div className="flex items-start gap-2 mb-1.5">
        <div className="p-1 bg-wood-700/50 rounded shrink-0">
          {React.createElement(
            (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[
              def.icon
            ] || LucideIcons.Package,
            { size: 14, className: "text-parchment-200" },
          )}
        </div>
        <div className="min-w-0">
          <div className="font-bold text-white text-[11px] leading-tight">
            {def.name}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className={`text-[9px] font-bold uppercase ${rarityColor[def.rarity || "COMMON"]}`}
            >
              {def.rarity}
            </span>
            <span className="text-[9px] text-slate-500">
              {def.width}×{def.height}
            </span>
            <span className="text-[9px] text-slate-600 uppercase">
              {def.category}
            </span>
          </div>
        </div>
      </div>

      <p className="text-slate-400 text-[10px] italic mb-2 leading-tight">
        {def.description}
      </p>

      {/* Combat Stats / Live Stats */}
      {(def.combatStats || liveStats) && (
        <div className="flex flex-wrap gap-1 mb-2">
          {renderStatBadge(
            <LucideIcons.Swords size={9} />,
            "damage",
            def.combatStats?.damage,
            liveStats?.damage,
            "text-red-400",
            "bg-red-950/50",
            "border-red-900/50",
          )}
          {renderStatBadge(
            <LucideIcons.Shield size={9} />,
            "defense",
            def.combatStats?.defense || def.combatStats?.block,
            liveStats?.block,
            "text-blue-400",
            "bg-blue-950/50",
            "border-blue-900/50",
          )}
          {renderStatBadge(
            <LucideIcons.Zap size={9} />,
            "speed",
            def.combatStats?.speed,
            liveStats?.speed,
            "text-yellow-400",
            "bg-yellow-950/50",
            "border-yellow-900/50",
          )}
          {renderStatBadge(
            <LucideIcons.Target size={9} />,
            "accuracy",
            def.combatStats?.accuracy,
            liveStats?.accuracy,
            "text-green-400",
            "bg-green-950/50",
            "border-green-900/50",
            "%",
          )}
          {renderStatBadge(
            <LucideIcons.Heart size={9} />,
            "heal",
            def.combatStats?.heal,
            liveStats?.heal,
            "text-emerald-400",
            "bg-emerald-950/50",
            "border-emerald-900/50",
          )}
          {renderStatBadge(
            <span className="text-[9px]">⚡</span>,
            "energyCost",
            def.combatStats?.energyCost,
            liveStats?.energyCost,
            "text-amber-400",
            "bg-amber-950/50",
            "border-amber-900/50",
          )}

          {/* Passive Energy Regen - usually not boosted by adjacency yet but we check anyway */}
          {renderStatBadge(
            <span className="text-[9px]">⚡</span>,
            "energyRegen",
            def.combatStats?.energyRegen,
            undefined,
            "text-amber-300",
            "bg-amber-950/50",
            "border-amber-900/50",
            "/s",
          )}
        </div>
      )}

      {/* Adjacency Bonuses / Synergies */}
      {(def.synergies && def.synergies.length > 0) ||
      (adjacencyResult && adjacencyResult.activeRules.length > 0) ? (
        <div className="border-t border-slate-700/50 pt-1.5 mt-1">
          <span className="text-[8px] text-slate-500 uppercase tracking-widest font-black block mb-1">
            Synergies
          </span>

          {/* Show base synergies in build mode, or active ones if provided */}
          {adjacencyResult
            ? adjacencyResult.activeRules.map((rule: string) => (
                <div
                  key={rule}
                  className="text-[10px] text-gold-400 mb-0.5 flex items-start gap-1"
                >
                  <LucideIcons.Star
                    size={9}
                    className="mt-0.5 shrink-0 fill-gold-400/20"
                  />
                  <span>{rule}</span>
                </div>
              ))
            : def.synergies?.map((syn, i: number) => (
                <div
                  key={`${syn.description}-${i}`}
                  className="text-[10px] text-amber-300/70 mb-0.5 flex items-start gap-1"
                >
                  <LucideIcons.Sparkles size={9} className="mt-0.5 shrink-0" />
                  <span>{syn.description}</span>
                </div>
              ))}
        </div>
      ) : null}
    </div>
  )
}

export default React.memo(ItemTooltip)
