import { useStore } from "@nanostores/react"
import clsx from "clsx"
import { AnimatePresence, motion } from "framer-motion"
import {
  Activity,
  Battery,
  Droplets,
  Pause,
  Play,
  Shield,
  Skull,
  Sword,
  Trophy,
  Zap,
} from "lucide-react"
import type React from "react"
import { useEffect, useRef, useState } from "react"
import { Tooltip } from "react-tooltip"
import type {
  CombatEntity,
  CombatLogEntry,
  EnemyType,
  ItemCooldown,
} from "../../lib/combat"
import {
  createCombatEntity,
  generateEnemy,
  groupStatusEffects,
  processCombatTick,
} from "../../lib/combat"
import { ITEMS } from "../../lib/items/items"
import {
  $containers,
  $gameState,
  $itemsOnGrid,
  $localPlayerId,
} from "../../store/gameStore"
import Inventory from "../Inventory"

const AutoBattler: React.FC = () => {
  const items = useStore($itemsOnGrid)
  const containers = useStore($containers)
  const localPlayerId = useStore($localPlayerId)
  const gameState = useStore($gameState)
  const day = gameState.day

  const [player, setPlayer] = useState<CombatEntity | null>(null)
  const [enemy, setEnemy] = useState<CombatEntity | null>(null)
  const [combatLog, setCombatLog] = useState<CombatLogEntry[]>([])
  const [isFighting, setIsFighting] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [gameResult, setGameResult] = useState<"WIN" | "LOSS" | null>(null)

  const [playerCooldowns, setPlayerCooldowns] = useState<ItemCooldown[]>([])
  const [enemyCooldowns, setEnemyCooldowns] = useState<ItemCooldown[]>([])
  const [elapsedTime, setElapsedTime] = useState(0)
  const [tickSpeed, setTickSpeed] = useState(1)

  const stateRef = useRef({
    player,
    enemy,
    playerCooldowns,
    enemyCooldowns,
    isFighting,
    isPaused,
    gameResult,
  })

  // Initialize Combat on Mount or Item Change
  useEffect(() => {
    const playerItems = items.filter((i) => i.ownerId === localPlayerId)
    const playerContainers = containers.filter(
      (c) => c.ownerId === localPlayerId,
    )

    const newPlayer = createCombatEntity(
      localPlayerId || "hero",
      "Hero",
      playerItems,
      playerContainers,
    )
    setPlayer(newPlayer)

    const pCooldowns: ItemCooldown[] = newPlayer.inventory
      .filter((inst) => ITEMS[inst.itemId].triggerType !== "PASSIVE")
      .map((inst) => {
        const baseCd = inst.liveStats?.baseCooldown || 5.0
        return {
          instanceId: inst.instanceId,
          itemId: inst.itemId,
          current: Math.random() * baseCd,
          max: baseCd,
          baseMax: baseCd,
        }
      })
    setPlayerCooldowns(pCooldowns)

    // BOSS only on Day 5
    let type: EnemyType
    if (day >= 5) {
      type = "BOSS"
    } else {
      const types: EnemyType[] = ["AGGRESSIVE", "DEFENSIVE", "SWARM", "EVASIVE"]
      type = types[Math.floor(Math.random() * types.length)]
    }

    const newEnemy = generateEnemy(type, day)
    setEnemy(newEnemy)

    const eCooldowns: ItemCooldown[] = newEnemy.inventory
      .filter((inst) => ITEMS[inst.itemId].triggerType !== "PASSIVE")
      .map((inst) => {
        const baseCd = inst.liveStats?.baseCooldown || 5.0
        return {
          instanceId: inst.instanceId,
          itemId: inst.itemId,
          current: Math.random() * baseCd,
          max: baseCd,
          baseMax: baseCd,
        }
      })
    setEnemyCooldowns(eCooldowns)

    setCombatLog([])
    setGameResult(null)
    setIsFighting(false)
    setIsPaused(false)
  }, [items, containers, localPlayerId, day])

  const startCombat = () => {
    setElapsedTime(0)
    setIsFighting(true)
    setIsPaused(false)
  }

  const togglePause = () => setIsPaused(!isPaused)

  useEffect(() => {
    stateRef.current = {
      player,
      enemy,
      playerCooldowns,
      enemyCooldowns,
      isFighting,
      isPaused,
      gameResult,
    }
  }, [
    player,
    enemy,
    playerCooldowns,
    enemyCooldowns,
    isFighting,
    isPaused,
    gameResult,
  ])

  useEffect(() => {
    if (isFighting && !isPaused && !gameResult) {
      let lastTime = performance.now()
      const interval = setInterval(() => {
        const now = performance.now()
        const delta = now - lastTime
        lastTime = now

        const current = stateRef.current
        if (
          !current.player ||
          !current.enemy ||
          current.gameResult ||
          current.isPaused
        )
          return

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
          delta * tickSpeed,
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
              type: msg.includes(current.player?.name || "Hero")
                ? ("DAMAGE" as const)
                : ("INFO" as const),
            })),
          ])
        }
      }, 50)
      return () => clearInterval(interval)
    }
  }, [isFighting, gameResult, elapsedTime, tickSpeed, isPaused])

  const [showSummary, setShowSummary] = useState(false)

  if (!player || !enemy) return <div>Loading Combat...</div>

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-4 px-2 md:px-4 py-4 h-full overflow-hidden">
      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
        {/* PLAYER SIDE */}
        <div className="flex-1 flex flex-col gap-4 bg-wood-950/40 rounded-2xl p-4 border-2 border-wood-700/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
            <Sword size={120} />
          </div>

          <div className="flex justify-between items-center relative z-10">
            <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2 drop-shadow-md">
              <span className="text-blue-400">{player.name}</span>
              <div className="flex gap-1">
                {groupStatusEffects(player.statuses).map((s, i) => (
                  <StatusBadge key={`${s.type}-${i}`} status={s} />
                ))}
              </div>
            </h2>
            <div className="text-right font-mono font-bold text-blue-300 flex flex-col items-end">
              <div className="flex items-center gap-2 text-xs opacity-70">
                <Shield size={12} className="text-cyan-400" />
                <span>BLOCK: {Math.round(player.block)}</span>
              </div>
              <div>
                {Math.round(player.hp)} / {player.maxHp} HP
              </div>
            </div>
          </div>

          <HealthBar
            current={player.hp}
            max={player.maxHp}
            block={player.block}
            color="bg-blue-600"
            side="player"
          />
          <BuffHUD entity={player} />
          <div className="grid grid-cols-2 gap-2 mt-2">
            <EnergyBar current={player.energy} max={player.maxEnergy} />
            <ManaBar current={player.mana} max={player.maxMana} />
          </div>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 relative z-10">
            <StatBox
              icon={<Sword size={14} className="text-red-400" />}
              value={player.stats.damage}
              label="DMG"
              tooltip="Total damage output per trigger of your weapons."
            />
            <StatBox
              icon={<Shield size={14} className="text-blue-400" />}
              value={Math.round(player.block)}
              label="BLK"
              tooltip="Current damage absorption. Block decays over time."
            />
            <StatBox
              icon={<Battery size={14} className="text-amber-400" />}
              value={`${Math.round(player.stats.energyRegen)}/s`}
              label="NRG"
              tooltip="Energy regeneration rate per second."
            />
            <StatBox
              icon={<Zap size={14} className="text-purple-400" />}
              value={`${player.stats.triggerSpeed.toFixed(1)}x`}
              label="SPD"
              tooltip="Trigger speed multiplier for all items."
            />
          </div>

          <div className="flex-1 flex items-center justify-center p-2 min-h-0 overflow-visible">
            <div className="scale-[0.55] sm:scale-75 md:scale-90 lg:scale-100 transition-transform origin-center">
              <Inventory
                playerId={player.id}
                items={player.inventory}
                containers={player.containers}
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
          <div className="h-16 md:h-24 flex items-center justify-center relative shrink-0">
            <div className="absolute inset-0 bg-gold-600/10 blur-3xl rounded-full" />
            <div className="relative text-3xl md:text-5xl font-black text-gold-500 italic">
              VS
            </div>
          </div>

          <div className="px-4">
            <AnimatePresence mode="wait">
              {!isFighting && !gameResult ? (
                <motion.button
                  key="fight-btn"
                  onClick={startCombat}
                  className="w-full bg-gradient-to-r from-red-600 to-orange-600 text-white font-black py-4 rounded-xl shadow-2xl transition-all active:scale-95 flex flex-col items-center gap-1 group border-b-4 border-red-800"
                >
                  <span className="text-3xl group-hover:scale-125 transition-transform duration-300">
                    ⚔️
                  </span>
                  <span className="tracking-[0.2em] font-serif uppercase">
                    Begin Battle
                  </span>
                </motion.button>
              ) : isFighting && !gameResult ? (
                <div className="flex flex-col gap-2">
                  <motion.div
                    key="fighting"
                    className="bg-wood-900/80 border-2 border-red-500/50 p-4 rounded-xl text-center shadow-lg"
                  >
                    <div
                      className={clsx(
                        "text-3xl",
                        !isPaused && "animate-bounce",
                      )}
                    >
                      {isPaused ? "⏸️" : "⚔️"}
                    </div>
                    <div className="text-xs font-black text-red-500 tracking-widest mt-2 uppercase">
                      {isPaused ? "Combat Paused" : "Combat in Progress"}
                    </div>
                  </motion.div>

                  <button
                    type="button"
                    onClick={togglePause}
                    className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors border-b-4 border-slate-900"
                  >
                    {isPaused ? <Play size={16} /> : <Pause size={16} />}
                    {isPaused ? "RESUME" : "PAUSE"}
                  </button>
                </div>
              ) : (
                <motion.div
                  key="result"
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
                    <div className="text-4xl font-black tracking-tighter mb-4">
                      {gameResult === "WIN" ? "VICTORY!" : "DEFEATED"}
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowSummary(true)}
                      className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg font-bold text-sm tracking-widest uppercase transition-all"
                    >
                      View Battle Log
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="px-4">
            <div className="bg-wood-950/60 border border-wood-700/50 p-3 rounded-xl shadow-lg">
              <div className="flex justify-between items-center mb-2 text-[10px] font-black text-wood-500 tracking-widest uppercase">
                <span>
                  <Activity size={12} className="inline mr-1 text-orange-500" />{" "}
                  Speed
                </span>
                <span className="text-orange-400 font-mono">
                  {tickSpeed.toFixed(1)}x
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="4"
                step="0.1"
                value={tickSpeed}
                onChange={(e) => setTickSpeed(Number(e.target.value))}
                className="w-full accent-orange-500"
              />
            </div>
          </div>

          <div className="flex-1 bg-black/60 border-2 border-wood-700/50 rounded-2xl p-3 flex flex-col min-h-[160px] shadow-inner overflow-y-auto">
            <div className="text-center text-[10px] font-black text-wood-500 uppercase tracking-widest mb-3">
              Reports
            </div>
            <div className="flex-1 space-y-1 overflow-y-auto pr-2 custom-scrollbar max-h-[240px]">
              <AnimatePresence initial={false}>
                {combatLog.map((entry, idx) => (
                  <motion.div
                    key={`${idx}-${entry.message}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={clsx(
                      "text-[11px] py-1 border-b border-white/5 last:border-0",
                      entry.type === "DAMAGE"
                        ? "text-blue-300"
                        : "text-red-300",
                    )}
                  >
                    <span className="opacity-40 mr-2 font-mono">{idx + 1}</span>
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
            <div className="text-left font-mono font-bold text-red-300 flex flex-col items-start">
              <div className="flex items-center gap-2 text-xs opacity-70">
                <Shield size={12} className="text-red-400" />
                <span>BLOCK: {Math.round(enemy.block)}</span>
              </div>
              <div>
                {Math.round(enemy.hp)} / {enemy.maxHp} HP
              </div>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-red-500 flex items-center gap-2 drop-shadow-md">
              <div className="flex gap-1">
                {groupStatusEffects(enemy.statuses).map((s, i) => (
                  <StatusBadge key={`${s.type}-${i}`} status={s} />
                ))}
              </div>
              <span>{enemy.name}</span>
            </h2>
          </div>

          <HealthBar
            current={enemy.hp}
            max={enemy.maxHp}
            block={enemy.block}
            color="bg-red-600"
            side="enemy"
          />
          <BuffHUD entity={enemy} />
          <div className="grid grid-cols-2 gap-2 mt-2">
            <EnergyBar current={enemy.energy} max={enemy.maxEnergy} />
            <ManaBar current={enemy.mana} max={enemy.maxMana} />
          </div>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 relative z-10">
            <StatBox
              icon={<Sword size={14} className="text-red-400" />}
              value={enemy.stats.damage}
              label="DMG"
              tooltip="Total damage output per trigger of enemy weapons."
            />
            <StatBox
              icon={<Shield size={14} className="text-blue-400" />}
              value={Math.round(enemy.block)}
              label="BLK"
              tooltip="Current damage absorption for the enemy."
            />
            <StatBox
              icon={<Battery size={14} className="text-amber-400" />}
              value={`${Math.round(enemy.stats.energyRegen)}/s`}
              label="NRG"
              tooltip="Enemy energy regeneration rate."
            />
            <StatBox
              icon={<Zap size={14} className="text-purple-400" />}
              value={`${enemy.stats.triggerSpeed.toFixed(1)}x`}
              label="SPD"
              tooltip="Enemy trigger speed multiplier."
            />
          </div>

          <div className="flex-1 flex items-center justify-center p-2 min-h-0">
            <div className="scale-[0.55] sm:scale-75 md:scale-90 lg:scale-100 transition-transform origin-center opacity-90">
              <Inventory
                playerId={enemy.id}
                items={enemy.inventory}
                containers={enemy.containers}
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
          </div>
        </div>
      </div>

      <Tooltip id="combat-tooltip" />
      {showSummary && (
        <BattleSummary
          player={player}
          enemy={enemy}
          onClose={() => setShowSummary(false)}
        />
      )}
    </div>
  )
}

// Helper Components
const HealthBar = ({
  current,
  max,
  block,
  color,
  side = "player",
}: {
  current: number
  max: number
  block: number
  color: string
  side?: "player" | "enemy"
}) => (
  <div
    className="w-full bg-slate-900 h-6 rounded-full overflow-hidden border border-slate-600 relative shadow-inner"
    data-tooltip-id="combat-tooltip"
    data-tooltip-content={`HP: ${Math.round(current)}/${max}${block > 0 ? ` + Block: ${Math.round(block)}` : ""}`}
  >
    {/* Base Health */}
    <motion.div
      className={clsx("h-full absolute top-0", color)}
      style={{ [side === "player" ? "left" : "right"]: 0 }}
      animate={{ width: `${Math.max(0, (current / max) * 100)}%` }}
    />
    {/* Block Overlay */}
    {block > 0 && (
      <motion.div
        className={clsx(
          "absolute top-0 h-full bg-cyan-400/40 border-cyan-300",
          side === "player" ? "left-0 border-r-2" : "right-0 border-l-2",
        )}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, (block / max) * 100)}%` }}
      />
    )}
    <div className="absolute inset-0 flex items-center justify-between px-3 text-[10px] font-bold text-white drop-shadow-md z-10">
      <span>{side === "player" ? Math.round(current) : Math.round(max)}</span>
      <span>{side === "player" ? Math.round(max) : Math.round(current)}</span>
    </div>
  </div>
)

const EnergyBar = ({ current, max }: { current: number; max: number }) => (
  <div
    className="w-full bg-slate-900 h-4 rounded-full overflow-hidden border border-slate-600 relative shadow-inner"
    data-tooltip-id="combat-tooltip"
    data-tooltip-content={`Energy: ${Math.round(current)}/${max}`}
  >
    <motion.div
      className="h-full bg-indigo-600"
      animate={{ width: `${Math.max(0, (current / max) * 100)}%` }}
    />
    <div className="absolute inset-0 flex items-center justify-between px-3 text-[9px] font-bold text-white drop-shadow-md">
      <span>⚡ {Math.round(current)}</span>
      <span>{Math.round(max)}</span>
    </div>
  </div>
)

const ManaBar = ({ current, max }: { current: number; max: number }) => (
  <div
    className="w-full bg-slate-900 h-4 rounded-full overflow-hidden border border-slate-600 relative shadow-inner"
    data-tooltip-id="combat-tooltip"
    data-tooltip-content={`Mana: ${Math.round(current)}/${max}`}
  >
    <motion.div
      className="h-full bg-cyan-600"
      animate={{ width: `${Math.max(0, (current / max) * 100)}%` }}
    />
    <div className="absolute inset-0 flex items-center justify-between px-3 text-[9px] font-bold text-white drop-shadow-md">
      <span>
        <Droplets size={8} className="inline mr-1" /> {Math.round(current)}
      </span>
      <span>{Math.round(max)}</span>
    </div>
  </div>
)

const StatusBadge = ({
  status,
}: { status: { type: string; value: number } }) => {
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

const StatBox = ({
  icon,
  value,
  label,
  tooltip,
}: {
  icon: React.ReactNode
  value: number | string
  label: string
  tooltip?: string
}) => (
  <div
    className="bg-slate-900 p-2 rounded flex flex-col items-center border border-slate-700 hover:bg-slate-800 transition-colors"
    data-tooltip-id="combat-tooltip"
    data-tooltip-content={tooltip}
  >
    <div className="mb-1">{icon}</div>
    <span className="text-lg font-black text-white">{value}</span>
    <span className="text-[10px] text-slate-500 uppercase tracking-wider">
      {label}
    </span>
  </div>
)

const BuffHUD = ({ entity }: { entity: CombatEntity }) => {
  const grouped = groupStatusEffects(entity.statuses)

  return (
    <div className="flex flex-wrap gap-1 mt-1 empty:hidden">
      {grouped.map((s) => (
        <StatusBadge key={s.type} status={s} />
      ))}
    </div>
  )
}

const BattleSummary = ({
  player,
  enemy,
  onClose,
}: {
  player: CombatEntity
  enemy: CombatEntity
  onClose: () => void
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

const SummaryStat = ({
  label,
  value,
  color,
}: { label: string; value: number | string; color: string }) => (
  <div className="flex justify-between items-center text-lg">
    <span className="text-parchment-400 font-medium">{label}</span>
    <span className={clsx("font-black font-mono", color)}>{value}</span>
  </div>
)

const ItemMetric = ({
  label,
  value,
  color,
}: { label: string; value: number; color: string }) => (
  <div className="flex flex-col">
    <span className="text-[10px] text-wood-500 uppercase font-black tracking-widest">
      {label}
    </span>
    <span className={clsx("font-bold font-mono", color)}>
      {Math.round(value)}
    </span>
  </div>
)

export default AutoBattler
