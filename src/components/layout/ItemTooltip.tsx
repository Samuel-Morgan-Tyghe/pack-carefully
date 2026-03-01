import { useStore } from "@nanostores/react"
import clsx from "clsx"
import * as LucideIcons from "lucide-react"
import React from "react"
import { getAdjacencyBonuses } from "../../lib/adjacency"
import { ITEMS } from "../../lib/items/items"
import { $itemsOnGrid } from "../../store/gameStore"
import type { CombatEntity, StatusEffect } from "../../types"

interface ItemTooltipProps {
  itemId: string
  instanceId?: string
  combatEntity?: CombatEntity | null
}

const ItemTooltip: React.FC<ItemTooltipProps> = ({
  itemId,
  instanceId,
  combatEntity,
}) => {
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

  // Determine active SLOW penalty from the battle entity
  const slowStacks = combatEntity?.statuses
    ? combatEntity.statuses
        .filter((s: StatusEffect) => s.type === "SLOW")
        .reduce((sum: number, s: StatusEffect) => sum + s.value, 0)
    : 0
  const slowPenalty = Math.min(0.5, slowStacks * 0.05)
  const hasSlow = slowPenalty > 0

  // Calculate effective combat stats including synergies and debuffs
  const baseRates = React.useMemo(() => {
    if (!def.combatStats) return null

    // 1. Start with base definition stats
    const stats = { ...def.combatStats }

    // 2. Apply Adjacency Buffs
    if (adjacencyResult?.buffs) {
      const b = adjacencyResult.buffs as any
      stats.damage = (stats.damage || 0) + (b.damage || 0)
      stats.block = (stats.block || 0) + (b.block || 0)
      stats.heal = (stats.heal || 0) + (b.heal || 0)
      stats.energyCost = (stats.energyCost || 0) + (b.energyCost || 0)
      stats.manaCost = (stats.manaCost || 0) + (b.manaCost || 0)
    }

    // 3. Apply Adjacency Multipliers
    let triggerSpeed = stats.triggerSpeed || 1.0
    if (adjacencyResult?.multipliers) {
      const m = adjacencyResult.multipliers as any
      if (m.damage) stats.damage = (stats.damage || 0) * m.damage
      if (m.block) stats.block = (stats.block || 0) * m.block
      if (m.heal) stats.heal = (stats.heal || 0) * m.heal
      if (m.energyCost)
        stats.energyCost = (stats.energyCost || 0) * m.energyCost
      if (m.triggerSpeed) triggerSpeed *= m.triggerSpeed
      if (m.manaCost) stats.manaCost = (stats.manaCost || 0) * m.manaCost
    }

    // 4. Apply Combat SLOW debuff
    triggerSpeed *= 1 - slowPenalty

    const actualCD = (stats.baseCooldown || 5.0) / triggerSpeed

    return {
      dps: Number(((stats.damage || 0) / actualCD).toFixed(1)),
      eps: Number(((stats.energyCost || 0) / actualCD).toFixed(1)),
      mps: Number(((stats.manaCost || 0) / actualCD).toFixed(1)),
      actualCD: Number(actualCD.toFixed(1)),
    }
  }, [def, adjacencyResult, slowPenalty])

  const displayDps = baseRates?.dps
  const displayEps = baseRates?.eps
  const displayMps = baseRates?.mps

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

    const buff = adjacencyResult?.buffs
      ? (adjacencyResult.buffs as any)[statName] || 0
      : 0
    const multiplier = adjacencyResult?.multipliers
      ? (adjacencyResult.multipliers as any)[statName] || 1
      : 1

    const hasBoost = buff !== 0 || multiplier !== 1

    return (
      <span
        className={clsx(
          "text-sm font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 shrink-0 transition-all",
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

      {/* High Level Metrics (DPS / EPS) */}
      {(displayDps !== undefined ||
        displayEps !== undefined ||
        displayMps !== undefined) && (
        <div className="flex gap-2 mb-2 border-b border-slate-700/30 pb-2">
          {displayDps !== undefined && displayDps > 0 && (
            <div className="flex flex-col">
              <span className="text-[7px] text-slate-500 uppercase font-black">
                Lethality
              </span>
              <div className="flex items-center gap-1 text-red-400 font-black text-sm">
                <LucideIcons.Swords size={12} />
                <span>
                  {displayDps}{" "}
                  <span className="text-[10px] opacity-70">DPS</span>
                </span>
              </div>
            </div>
          )}
          {displayEps !== undefined && displayEps > 0 && (
            <div className="flex flex-col">
              <span className="text-[7px] text-slate-500 uppercase font-black">
                Exhaustion
              </span>
              <div className="flex items-center gap-1 text-indigo-400 font-black text-sm">
                <LucideIcons.Zap size={12} />
                <span>
                  {displayEps}{" "}
                  <span className="text-[10px] opacity-70">EPS</span>
                </span>
              </div>
            </div>
          )}
          {displayMps !== undefined && displayMps > 0 && (
            <div className="flex flex-col">
              <span className="text-[7px] text-slate-500 uppercase font-black">
                Magical
              </span>
              <div className="flex items-center gap-1 text-cyan-400 font-black text-sm">
                <LucideIcons.Droplets size={12} />
                <span>
                  {displayMps}{" "}
                  <span className="text-[10px] opacity-70">MPS</span>
                </span>
              </div>
            </div>
          )}
        </div>
      )}

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
            "block",
            def.combatStats?.block,
            liveStats?.block,
            "text-blue-400",
            "bg-blue-950/50",
            "border-blue-900/50",
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
            <LucideIcons.Droplets size={9} />,
            "manaCost",
            def.combatStats?.manaCost,
            liveStats?.manaCost,
            "text-cyan-400",
            "bg-cyan-950/50",
            "border-cyan-900/50",
          )}
          {renderStatBadge(
            <LucideIcons.Clock size={9} />,
            "baseCooldown",
            def.combatStats?.baseCooldown,
            baseRates ? baseRates.actualCD : liveStats?.baseCooldown,
            hasSlow ? "text-cyan-300" : "text-slate-300",
            hasSlow ? "bg-cyan-950/70" : "bg-slate-950/50",
            hasSlow ? "border-cyan-500" : "border-slate-800/50",
            hasSlow ? "s (Slowed)" : "s",
          )}
          {renderStatBadge(
            <LucideIcons.Activity size={9} />,
            "maxHp",
            def.combatStats?.maxHp,
            undefined,
            "text-rose-400",
            "bg-rose-950/50",
            "border-rose-900/50",
          )}
          {renderStatBadge(
            <LucideIcons.Droplets size={9} />,
            "maxMana",
            def.combatStats?.maxMana,
            undefined,
            "text-cyan-400",
            "bg-cyan-950/50",
            "border-cyan-900/50",
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
          {renderStatBadge(
            <LucideIcons.Battery size={9} />,
            "maxEnergy",
            def.combatStats?.maxEnergy,
            undefined,
            "text-amber-300",
            "bg-amber-950/50",
            "border-amber-900/50",
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
