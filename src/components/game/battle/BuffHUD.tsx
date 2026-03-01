import clsx from "clsx"
import type React from "react"
import { groupStatusEffects } from "../../../lib/combat"
import type { CombatEntity } from "../../../types"

interface StatusBadgeProps {
  status: { type: string; value: number }
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const colors: Record<string, string> = {
    POISON: "border-green-500 text-green-400 bg-green-950/40",
    FIRE: "border-orange-500 text-orange-400 bg-orange-950/40",
    STUN: "border-yellow-500 text-yellow-400 bg-yellow-950/40",
    SLOW: "border-blue-400 text-blue-300 bg-blue-950/40",
    BLEED: "border-red-600 text-red-500 bg-red-950/40",
  }

  return (
    <div
      className={clsx(
        "text-[10px] px-1.5 py-0.5 rounded border font-black uppercase flex items-center gap-1 shadow-sm",
        colors[status.type] || "border-slate-600 text-slate-300 bg-slate-800",
      )}
    >
      <span>{status.type}</span>
      {status.value > 1 && (
        <span className="bg-white/20 px-1 rounded-sm text-[8px]">
          {status.value}
        </span>
      )}
    </div>
  )
}

interface BuffHUDProps {
  entity: CombatEntity
}

export const BuffHUD: React.FC<BuffHUDProps> = ({ entity }) => {
  const grouped = groupStatusEffects(entity.statuses)

  return (
    <div className="flex flex-wrap gap-1 mt-1 empty:hidden">
      {grouped.map((s) => (
        <StatusBadge key={s.type} status={s} />
      ))}
    </div>
  )
}

export default BuffHUD
