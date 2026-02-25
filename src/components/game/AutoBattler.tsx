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
                {player.statuses.map((s, i) => (
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
          />
          <div className="grid grid-cols-2 gap-2">
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
            <div className="scale-75 md:scale-90 lg:scale-100 transition-transform origin-center">
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
          <div className="h-24 flex items-center justify-center relative">
            <div className="absolute inset-0 bg-gold-600/10 blur-3xl rounded-full" />
            <div className="relative text-5xl font-black text-gold-500 italic">
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
                    "p-6 rounded-2xl border-4 text-center shadow-2xl",
                    gameResult === "WIN"
                      ? "bg-green-950/40 border-green-500 text-green-400"
                      : "bg-red-950/40 border-red-500 text-red-400",
                  )}
                >
                  {gameResult === "WIN" ? (
                    <Trophy className="mx-auto mb-2 text-gold-500" size={32} />
                  ) : (
                    <Skull className="mx-auto mb-2 text-red-500" size={32} />
                  )}
                  <div className="text-4xl font-black tracking-tighter">
                    {gameResult === "WIN" ? "VICTORY!" : "DEFEATED"}
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
            <div className="flex-1 space-y-2 flex flex-col justify-end ">
              <AnimatePresence initial={false}>
                {combatLog.slice(-5).map((entry, idx) => (
                  <motion.div
                    key={`${idx}-${entry.message}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={clsx(
                      "text-[11px] p-2 rounded-lg border",
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
            block={enemy.block}
            color="bg-red-600"
          />
          <div className="grid grid-cols-2 gap-2">
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
            <div className="scale-75 md:scale-90 lg:scale-100 transition-transform origin-center opacity-90">
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
    </div>
  )
}

// Helper Components
const HealthBar = ({
  current,
  max,
  block,
  color,
}: { current: number; max: number; block: number; color: string }) => (
  <div
    className="w-full bg-slate-900 h-6 rounded-full overflow-hidden border border-slate-600 relative shadow-inner"
    data-tooltip-id="combat-tooltip"
    data-tooltip-content={`HP: ${Math.round(current)}/${max}${block > 0 ? ` + Block: ${Math.round(block)}` : ""}`}
  >
    {/* Base Health */}
    <motion.div
      className={`h-full ${color}`}
      animate={{ width: `${Math.max(0, (current / max) * 100)}%` }}
    />
    {/* Block Overlay */}
    {block > 0 && (
      <motion.div
        className="absolute top-0 left-0 h-full bg-cyan-400/40 border-r-2 border-cyan-300"
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, (block / max) * 100)}%` }}
      />
    )}
    <div className="absolute inset-0 flex items-center justify-between px-3 text-[10px] font-bold text-white drop-shadow-md">
      <span>{Math.round(current)}</span>
      <span>{Math.round(max)}</span>
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
}: { status: { type: string; value: number } }) => (
  <span className="text-[10px] px-1.5 py-0.5 rounded border bg-slate-800 border-slate-600 text-slate-300">
    {status.type}
  </span>
)

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

export default AutoBattler
