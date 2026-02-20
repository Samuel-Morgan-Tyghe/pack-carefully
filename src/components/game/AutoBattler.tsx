import { useStore } from "@nanostores/react"
import clsx from "clsx"
import { AnimatePresence, motion } from "framer-motion"
import {
  Activity,
  Battery,
  Shield,
  Skull,
  Sword,
  Trophy,
  Zap,
} from "lucide-react"
import type React from "react"
import { useEffect, useRef, useState } from "react"
import type {
  CombatEntity,
  CombatLogEntry,
  EnemyType,
  ItemCooldown,
} from "../../lib/combat"
import {
  calculatePlayerCombatInfo,
  generateEnemy,
  processCombatTick,
} from "../../lib/combat"
import { ITEMS } from "../../lib/items"
import { $itemsOnGrid } from "../../store/gameStore"
import Inventory from "../Inventory"

const AutoBattler: React.FC = () => {
  const items = useStore($itemsOnGrid)

  // Initial State Setup
  const [player, setPlayer] = useState<CombatEntity | null>(null)
  console.log("🚀 ~ AutoBattler ~ player:", player)
  const [enemy, setEnemy] = useState<CombatEntity | null>(null)
  const [combatLog, setCombatLog] = useState<CombatLogEntry[]>([])
  const [isFighting, setIsFighting] = useState(false)
  const [gameResult, setGameResult] = useState<"WIN" | "LOSS" | null>(null)

  // Cooldown State
  const [playerCooldowns, setPlayerCooldowns] = useState<ItemCooldown[]>([])
  const [enemyCooldowns, setEnemyCooldowns] = useState<ItemCooldown[]>([])
  const [cooldownMultiplier] = useState(1)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [tickSpeed, setTickSpeed] = useState(1) // 0.5x to 4x

  // Tick Loop Ref
  const stateRef = useRef({
    player,
    enemy,
    playerCooldowns,
    enemyCooldowns,
    isFighting,
    gameResult,
  })

  // Update Cooldown Max when Multiplier Changes
  useEffect(() => {
    setPlayerCooldowns((prev) =>
      prev.map((cd) => ({
        ...cd,
        max: Math.max(50, cd.baseMax * cooldownMultiplier),
      })),
    )
    setEnemyCooldowns((prev) =>
      prev.map((cd) => ({
        ...cd,
        max: Math.max(50, cd.baseMax * cooldownMultiplier),
      })),
    )
  }, [cooldownMultiplier])

  // Initialize Combat on Mount
  useEffect(() => {
    const { stats, synergies, itemsWithLiveStats } =
      calculatePlayerCombatInfo(items)
    const newPlayer: CombatEntity = {
      hp: 100,
      maxHp: 100,
      mana: stats.maxMana || 20,
      shield: 0,
      baseDefense: stats.defense,
      energy: stats.maxEnergy,
      maxEnergy: stats.maxEnergy,
      stamina: stats.maxStamina,
      maxStamina: stats.maxStamina,
      stats: stats,
      synergies: synergies,
      statuses: [],
      name: "Hero",
      id: "hero",
      inventory: itemsWithLiveStats,
    }
    setPlayer(newPlayer)

    // Initialize Player Cooldowns using baked liveStats
    const pCooldowns: ItemCooldown[] = itemsWithLiveStats
      .filter((inst) => ITEMS[inst.itemId].triggerType !== "PASSIVE")
      .map((inst) => {
        const speed = inst.liveStats?.speed || 1

        // Base cooldown 50s (50000ms), reduced by speed.
        const baseCd = 50000 / Math.max(1, speed)
        const startOffset = Math.random() * baseCd
        return {
          instanceId: inst.instanceId,
          itemId: inst.itemId,
          current: startOffset,
          max: baseCd,
          baseMax: baseCd,
        }
      })
    setPlayerCooldowns(pCooldowns)

    // Initialize Enemy
    const types: EnemyType[] = ["AGGRESSIVE", "DEFENSIVE", "SWARM", "EVASIVE"]
    const type = types[Math.floor(Math.random() * types.length)]
    const newEnemy = generateEnemy(type, 1)
    setEnemy(newEnemy)

    // Enemy Cooldowns
    const enemySpeed = newEnemy.stats.speed || 5
    const enemyCd = Math.max(2000, (20 - enemySpeed) * 1000) // Slower enemy too
    setEnemyCooldowns([
      {
        instanceId: "enemy-attack",
        itemId: "enemy-attack",
        current: Math.random() * enemyCd,
        max: enemyCd,
        baseMax: enemyCd,
      },
    ])

    setCombatLog([])
    setGameResult(null)
    setIsFighting(false)
  }, [items])

  const startCombat = () => {
    setElapsedTime(0)
    setIsFighting(true)
  }

  // Keep ref synced with state for the interval closure
  useEffect(() => {
    stateRef.current = {
      player,
      enemy,
      playerCooldowns,
      enemyCooldowns,
      isFighting,
      gameResult,
    }
  }, [player, enemy, playerCooldowns, enemyCooldowns, isFighting, gameResult])

  // Game Loop
  useEffect(() => {
    if (isFighting && !gameResult) {
      let lastTime = performance.now()
      const interval = setInterval(() => {
        const now = performance.now()
        const delta = now - lastTime // Real time
        lastTime = now

        const current = stateRef.current
        if (!current.player || !current.enemy || current.gameResult) return

        if (current.player.hp <= 0) {
          setGameResult("LOSS")
          setIsFighting(false)
          return
        }
        if (current.enemy.hp <= 0) {
          setGameResult("WIN")
          setIsFighting(false)
          return
        }

        const result = processCombatTick(
          current.player,
          current.enemy,
          current.playerCooldowns,
          current.enemyCooldowns,
          delta * tickSpeed, // Scale delta by tickSpeed
          elapsedTime + delta * tickSpeed,
        )

        setElapsedTime((prev) => prev + delta * tickSpeed)

        setPlayer(result.player)
        setEnemy(result.enemy)
        setPlayerCooldowns(result.playerCooldowns)
        setEnemyCooldowns(result.enemyCooldowns)

        if (result.events.length > 0) {
          setCombatLog((prev) => [
            ...prev,
            ...result.events.map((msg) => ({
              round: 0,
              message: msg,
              type: msg.includes("Player")
                ? ("DAMAGE" as const)
                : ("INFO" as const),
            })),
          ])
        }
      }, 50) // 20 ticks per second
      return () => clearInterval(interval)
    }
  }, [isFighting, gameResult, elapsedTime, tickSpeed])

  if (!player || !enemy) return <div>Loading Combat...</div>

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-4 px-2 md:px-4 py-4 h-full overflow-hidden">
      {/* DUEL ARENA */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
        {/* PLAYER SIDE */}
        <div className="flex-1 flex flex-col gap-4 bg-wood-950/40 rounded-2xl p-4 border-2 border-wood-700/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
            <Sword size={120} />
          </div>

          <div className="flex justify-between items-center relative z-10">
            <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2 drop-shadow-md">
              <span className="text-blue-400">HERO</span>
              <div className="flex gap-1">
                {player.statuses.map((s, i) => (
                  <StatusBadge key={`${s.type}-${i}`} status={s} />
                ))}
              </div>
            </h2>
            <div className="text-right font-mono font-bold text-blue-300">
              {Math.round(player.hp)} / {player.maxHp} HP
            </div>
          </div>

          <HealthBar
            current={player.hp}
            max={player.maxHp}
            shield={player.shield}
            color="bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]"
          />
          <EnergyBar current={player.energy} max={player.maxEnergy} />
          <StaminaBar current={player.stamina} max={player.maxStamina} />

          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 relative z-10">
            <StatBox
              icon={<Sword size={14} className="text-red-400" />}
              value={player.stats.damage}
              label="DMG"
            />
            <StatBox
              icon={<Shield size={14} className="text-blue-400" />}
              value={player.baseDefense}
              label="DEF"
            />
            <StatBox
              icon={<Zap size={14} className="text-yellow-400" />}
              value={player.stats.speed}
              label="SPD"
            />
            <StatBox
              icon={<Battery size={14} className="text-amber-400" />}
              value={`${Math.round(player.stats.energyRegen)}/s`}
              label="NRG"
            />
            <StatBox
              icon={<Activity size={14} className="text-green-400" />}
              value={`${player.stats.staminaRegen.toFixed(1)}/s`}
              label="STM"
            />
            <StatBox
              icon={<Zap size={14} className="text-purple-400" />}
              value={`${player.stats.triggerSpeed.toFixed(1)}x`}
              label="FAST"
            />
          </div>

          {/* PLAYER GRID */}
          <div className="flex-1 flex items-center justify-center p-2 min-h-0 overflow-visible">
            <div className="scale-75 md:scale-90 lg:scale-100 transition-transform origin-center">
              <Inventory
                items={player.inventory}
                viewOnly={true}
                cooldowns={Object.fromEntries(
                  playerCooldowns.map((cd) => [
                    cd.instanceId,
                    (1 - cd.current / cd.max) * 100,
                  ]),
                )}
                className="!p-4"
              />
            </div>
          </div>
        </div>

        {/* CENTER HUB */}
        <div className="lg:w-80 flex flex-col gap-4 shrink-0">
          {/* VS BADGE */}
          <div className="h-24 flex items-center justify-center relative">
            <div className="absolute inset-0 bg-gold-600/10 blur-3xl rounded-full" />
            <div className="relative text-5xl font-black text-gold-500 italic drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]">
              VS
            </div>
          </div>

          {/* FIGHT BUTTON / RESULTS */}
          <div className="px-4">
            <AnimatePresence mode="wait">
              {!isFighting && !gameResult ? (
                <motion.button
                  key="fight-btn"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  onClick={startCombat}
                  className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-black py-4 rounded-xl shadow-2xl transition-all active:scale-95 flex flex-col items-center gap-1 group border-b-4 border-red-800"
                >
                  <span className="text-3xl group-hover:scale-125 transition-transform duration-300">
                    ⚔️
                  </span>
                  <span className="tracking-[0.2em] font-serif uppercase">
                    Begin Battle
                  </span>
                </motion.button>
              ) : isFighting ? (
                <motion.div
                  key="fighting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-wood-900/80 border-2 border-red-500/50 p-4 rounded-xl text-center shadow-lg"
                >
                  <div className="text-3xl animate-bounce">⚔️</div>
                  <div className="text-xs font-black text-red-500 tracking-widest mt-2 uppercase">
                    Combat in Progress
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="result"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className={clsx(
                    "p-6 rounded-2xl border-4 text-center shadow-2xl relative overflow-hidden",
                    gameResult === "WIN"
                      ? "bg-green-950/40 border-green-500 text-green-400"
                      : "bg-red-950/40 border-red-500 text-red-400",
                  )}
                >
                  <div className="relative z-10">
                    {gameResult === "WIN" ? (
                      <Trophy
                        className="mx-auto mb-2 text-gold-500"
                        size={32}
                      />
                    ) : (
                      <Skull className="mx-auto mb-2 text-red-500" size={32} />
                    )}
                    <div className="text-4xl font-black tracking-tighter">
                      {gameResult === "WIN" ? "VICTORY!" : "DEFEATED"}
                    </div>
                    <div className="text-[10px] uppercase font-bold tracking-widest opacity-70 mt-2 italic">
                      The journey continues...
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-white/5 opacity-10 pointer-events-none" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* TICK SPEED CONTROL */}
          <div className="px-4 mt-2">
            <div className="bg-wood-950/60 border border-wood-700/50 p-3 rounded-xl shadow-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black text-wood-500 uppercase tracking-widest flex items-center gap-1">
                  <Activity size={12} className="text-orange-500" /> Battle
                  Speed
                </span>
                <span className="text-xs font-mono font-bold text-orange-400 bg-orange-950/30 px-2 rounded tracking-tighter shadow-inner">
                  {tickSpeed.toFixed(1)}x
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="4"
                step="0.1"
                value={tickSpeed}
                onChange={(e) =>
                  setTickSpeed(Number.parseFloat(e.target.value))
                }
                className="w-full accent-orange-500 h-1.5 bg-wood-800 rounded-lg cursor-pointer appearance-none border border-wood-700/30 shadow-inner"
              />
              <div className="flex justify-between mt-1 px-1">
                <span className="text-[8px] text-wood-600 font-bold">0.5x</span>
                <span className="text-[8px] text-wood-600 font-bold">4.0x</span>
              </div>
            </div>
          </div>

          {/* COMBAT LOG */}
          <div className="flex-1 bg-black/60 border-2 border-wood-700/50 rounded-2xl p-3 flex flex-col min-h-[160px] shadow-inner">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="h-[1px] flex-1 bg-wood-700/50" />
              <div className="text-[10px] font-black text-wood-500 uppercase tracking-widest">
                Reports
              </div>
              <div className="h-[1px] flex-1 bg-wood-700/50" />
            </div>
            <div className="flex-1 overflow-hidden space-y-2 flex flex-col justify-end">
              <AnimatePresence initial={false} mode="popLayout">
                {combatLog.map((entry, idx) => (
                  <motion.div
                    key={`${idx}-${entry.message}`}
                    layout
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={clsx(
                      "text-[11px] p-2 rounded-lg border leading-tight backdrop-blur-sm",
                      entry.type === "DAMAGE"
                        ? "border-blue-500/30 bg-blue-500/10 text-blue-200"
                        : "border-red-500/30 bg-red-500/10 text-red-200",
                    )}
                  >
                    {entry.message}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ENEMY SIDE */}
        <div className="flex-1 flex flex-col gap-4 bg-red-950/20 rounded-2xl p-4 border-2 border-red-900/30 relative overflow-hidden">
          <div className="absolute top-0 left-0 p-2 opacity-5 pointer-events-none">
            <Skull size={120} />
          </div>

          <div className="flex justify-between items-center relative z-10">
            <div className="text-left font-mono font-bold text-red-300">
              {Math.round(enemy.hp)} / {enemy.maxHp} HP
            </div>
            <h2 className="text-xl md:text-2xl font-black text-red-500 flex items-center gap-2 drop-shadow-md">
              <div className="flex gap-1">
                {enemy.statuses.map((s, i) => (
                  <StatusBadge key={`${s.type}-${i}`} status={s} />
                ))}
              </div>
              <span>{enemy.name}</span>
            </h2>
          </div>

          <HealthBar
            current={enemy.hp}
            max={enemy.maxHp}
            shield={enemy.shield}
            color="bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]"
          />

          <div className="bg-red-900/20 p-3 rounded-xl border border-red-900/30 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="bg-red-600 shadow-glow-red p-2 rounded-full">
                <Sword size={20} className="text-white" />
              </div>
              <div>
                <div className="text-[10px] text-red-300 font-bold uppercase tracking-widest">
                  Power
                </div>
                <div className="text-2xl font-black text-white">
                  {enemy.stats.damage}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                Nexu Move
              </div>
              <div className="w-32 h-2 bg-slate-900 border border-slate-700 rounded-full overflow-hidden">
                {enemyCooldowns.map((cd) => (
                  <motion.div
                    key={cd.instanceId}
                    className="h-full bg-yellow-500"
                    animate={{
                      width: `${Math.min(100, (1 - cd.current / cd.max) * 100)}%`,
                    }}
                  />
                ))}
              </div>
              <div className="text-[10px] text-yellow-500 font-mono mt-1">
                {enemyCooldowns[0]?.current > 0
                  ? `${(enemyCooldowns[0].current / 1000).toFixed(1)}s`
                  : "READY"}
              </div>
            </div>
          </div>

          {/* ENEMY EQUIPMENT / GRID */}
          <div className="flex-1 flex items-center justify-center p-2 min-h-0">
            {enemy.inventory.length > 0 ? (
              <div className="scale-75 md:scale-90 lg:scale-100 transition-transform origin-center opacity-90 overflow-visible">
                <Inventory
                  items={enemy.inventory}
                  viewOnly={true}
                  cooldowns={Object.fromEntries(
                    enemyCooldowns.map((cd) => [
                      cd.instanceId,
                      (1 - cd.current / cd.max) * 100,
                    ]),
                  )}
                  className="!p-4"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-red-500/30 italic">
                <Activity size={48} />
                <span className="text-xs uppercase font-bold tracking-widest">
                  Primal Instinct
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper Components
const HealthBar = ({
  current,
  max,
  shield,
  color,
}: { current: number; max: number; shield: number; color: string }) => (
  <div className="w-full bg-slate-900 h-6 rounded-full overflow-hidden border border-slate-600 relative shadow-inner">
    <motion.div
      className={`h-full ${color}`}
      initial={{ width: "100%" }}
      animate={{ width: `${Math.max(0, (current / max) * 100)}%` }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
    />
    {shield > 0 && (
      <motion.div
        className="absolute inset-y-0 left-0 bg-cyan-400/50 border-r-2 border-cyan-200/80"
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, (shield / max) * 100)}%` }}
      />
    )}
    <div className="absolute inset-0 flex items-center justify-between px-3 text-[10px] font-bold text-white shadow-black drop-shadow-md">
      <span>{Math.round(current)}</span>
      <span>
        {Math.round(max)}{" "}
        {shield > 0 && (
          <span className="text-cyan-300">(+{Math.round(shield)})</span>
        )}
      </span>
    </div>
  </div>
)

const EnergyBar = ({ current, max }: { current: number; max: number }) => (
  <div className="w-full bg-slate-900 h-4 rounded-full overflow-hidden border border-slate-600 relative shadow-inner">
    <motion.div
      className="h-full"
      initial={{ width: "100%" }}
      animate={{ width: `${Math.max(0, (current / max) * 100)}%` }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      style={{ background: "darkslateblue" }}
    />
    <div className="absolute inset-0 flex items-center justify-between px-3 text-[9px] font-bold text-white shadow-black drop-shadow-md">
      <span>⚡ {Math.round(current)}</span>
      <span>{Math.round(max)}</span>
    </div>
  </div>
)

const StaminaBar = ({ current, max }: { current: number; max: number }) => (
  <div className="w-full bg-slate-900 h-4 rounded-full overflow-hidden border border-slate-600 relative shadow-inner">
    <motion.div
      className="h-full bg-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
      initial={{ width: "100%" }}
      animate={{ width: `${Math.max(0, (current / max) * 100)}%` }}
      transition={{ duration: 0.1, ease: "linear" }}
    />
    <div className="absolute inset-0 flex items-center justify-between px-3 text-[9px] font-bold text-white shadow-black drop-shadow-md">
      <span>🔋 {current.toFixed(1)}</span>
      <span>{max}</span>
    </div>
  </div>
)

const StatusBadge = ({
  status,
}: { status: { type: string; value: number } }) => (
  <span
    className={`text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-1 ${
      status.type === "POISON"
        ? "bg-green-900/50 border-green-700 text-green-300"
        : status.type === "STUN"
          ? "bg-yellow-900/50 border-yellow-700 text-yellow-300"
          : "bg-slate-800 border-slate-600 text-slate-300"
    }`}
  >
    {status.type}
  </span>
)

const StatBox = ({
  icon,
  value,
  label,
  max,
}: {
  icon: React.ReactNode
  value: number | string
  label: string
  max?: string
}) => (
  <div className="bg-slate-900 p-2 rounded flex flex-col items-center border border-slate-700">
    <div className="mb-1">{icon}</div>
    <span className="text-lg font-black text-white">
      {value}
      {max && <span className="text-xs text-blue-300">{max}</span>}
    </span>
    <span className="text-[10px] text-slate-500 uppercase tracking-wider">
      {label}
    </span>
  </div>
)

export default AutoBattler
