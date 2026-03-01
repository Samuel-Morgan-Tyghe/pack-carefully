import clsx from "clsx"
import { motion } from "framer-motion"
import type React from "react"
import { ITEMS } from "../../../lib/items/items"
import type { CombatEntity } from "../../../types"

interface SummaryStatProps {
  label: string
  value: number | string
  color: string
}

const SummaryStat: React.FC<SummaryStatProps> = ({ label, value, color }) => (
  <div className="flex justify-between items-center text-lg">
    <span className="text-parchment-400 font-medium">{label}</span>
    <span className={clsx("font-black font-mono", color)}>{value}</span>
  </div>
)

interface ItemMetricProps {
  label: string
  value: number
  color: string
}

const ItemMetric: React.FC<ItemMetricProps> = ({ label, value, color }) => (
  <div className="flex flex-col">
    <span className="text-[10px] text-wood-500 uppercase font-black tracking-widest">
      {label}
    </span>
    <span className={clsx("font-bold font-mono", color)}>
      {Math.round(value)}
    </span>
  </div>
)

interface BattleSummaryProps {
  player: CombatEntity
  enemy: CombatEntity
  onClose: () => void
}

const BattleSummary: React.FC<BattleSummaryProps> = ({
  player,
  enemy,
  onClose,
}) => {
  const allPlayerStats = Object.values(player.battleStats)
  const allEnemyStats = Object.values(enemy.battleStats)

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-wood-900 border-4 border-wood-700 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)]"
      >
        <div className="p-6 border-b-2 border-wood-700 flex justify-between items-center bg-wood-800/50">
          <h2 className="text-3xl font-black text-gold-500 uppercase tracking-tighter">
            Battle Summary
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-parchment-400"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-blue-950/20 p-6 rounded-2xl border-2 border-blue-900/30">
              <h3 className="text-xl font-bold text-blue-400 mb-4 uppercase tracking-widest border-b border-blue-900/30 pb-2">
                Offensive Stats
              </h3>
              <div className="space-y-3">
                <SummaryStat
                  label="Total Damage"
                  value={allPlayerStats.reduce((s, i) => s + i.damageDealt, 0)}
                  color="text-red-400"
                />
                <SummaryStat
                  label="Average DPS"
                  value={(
                    allPlayerStats.reduce((s, i) => s + i.damageDealt, 0) / 10
                  ).toFixed(1)}
                  color="text-orange-400"
                />
                <SummaryStat
                  label="Enemy Damage"
                  value={allEnemyStats.reduce((s, i) => s + i.damageDealt, 0)}
                  color="text-red-600"
                />
              </div>
            </div>

            <div className="bg-cyan-950/20 p-6 rounded-2xl border-2 border-cyan-900/30">
              <h3 className="text-xl font-bold text-cyan-400 mb-4 uppercase tracking-widest border-b border-cyan-900/30 pb-2">
                Defensive Stats
              </h3>
              <div className="space-y-3">
                <SummaryStat
                  label="Total Block"
                  value={allPlayerStats.reduce(
                    (s, i) => s + i.blockGenerated,
                    0,
                  )}
                  color="text-cyan-400"
                />
                <SummaryStat
                  label="Damage Mitigated"
                  value={allPlayerStats.reduce(
                    (s, i) => s + i.damageMitigated,
                    0,
                  )}
                  color="text-indigo-400"
                />
                <SummaryStat
                  label="Heals Received"
                  value={allPlayerStats.reduce((s, i) => s + i.healsDone, 0)}
                  color="text-green-400"
                />
              </div>
            </div>
          </div>

          <h3 className="text-2xl font-black text-parchment-200 mb-6 uppercase tracking-tighter">
            Item Performance
          </h3>
          <div className="grid gap-4">
            {player.inventory
              .filter((inst) => player.battleStats[inst.instanceId])
              .map((inst) => {
                const stats = player.battleStats[inst.instanceId]
                const def = ITEMS[inst.itemId]
                return (
                  <div
                    key={inst.instanceId}
                    className="flex bg-wood-800/40 p-4 rounded-xl border border-wood-700/50 hover:border-gold-500/50 transition-colors"
                  >
                    <div className="w-12 h-12 bg-black/40 rounded flex items-center justify-center text-2xl shrink-0 mr-4">
                      {def.icon || "📦"}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-parchment-100 flex justify-between">
                        <span>{def.name}</span>
                        <span className="text-xs text-wood-500 uppercase">
                          {stats.timesTriggered} triggers
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 mt-2">
                        {stats.damageDealt > 0 && (
                          <ItemMetric
                            label="Damage"
                            value={stats.damageDealt}
                            color="text-red-400"
                          />
                        )}
                        {stats.blockGenerated > 0 && (
                          <ItemMetric
                            label="Block"
                            value={stats.blockGenerated}
                            color="text-cyan-400"
                          />
                        )}
                        {stats.damageMitigated > 0 && (
                          <ItemMetric
                            label="Mitigated"
                            value={stats.damageMitigated}
                            color="text-indigo-400"
                          />
                        )}
                        {stats.healsDone > 0 && (
                          <ItemMetric
                            label="Healing"
                            value={stats.healsDone}
                            color="text-green-400"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>

        <div className="p-6 border-t-2 border-wood-700 bg-wood-800/50">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-4 bg-gold-600 hover:bg-gold-500 text-wood-950 font-black rounded-xl text-xl uppercase tracking-widest transition-all shadow-lg active:scale-95"
          >
            Return to Expedition
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default BattleSummary
