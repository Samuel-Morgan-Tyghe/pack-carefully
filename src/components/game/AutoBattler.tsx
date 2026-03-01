import { useStore } from "@nanostores/react"
import clsx from "clsx"
import { AnimatePresence, motion } from "framer-motion"
import { Activity, Pause, Play, Skull, Trophy } from "lucide-react"
import type React from "react"
import { useEffect, useRef, useState } from "react"
import { Tooltip } from "react-tooltip"
import type { EnemyType } from "../../lib/combat"
import {
  createCombatEntity,
  generateEnemy,
  processCombatTick,
} from "../../lib/combat"
import { ITEMS } from "../../lib/items/items"
import {
  $containers,
  $gameState,
  $hoveredCombatant,
  $itemsOnGrid,
  $localPlayerId,
} from "../../store/gameStore"
import type {
  CombatEntity,
  CombatLogEntry,
  InventoryItemInstance,
  ItemCooldown,
} from "../../types"
import BattleSummary from "./battle/BattleSummary"
import CombatantCard from "./battle/CombatantCard"

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
      .filter(
        (inst: InventoryItemInstance) =>
          ITEMS[inst.itemId].triggerType !== "PASSIVE",
      )
      .map((inst: InventoryItemInstance) => {
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
      .filter(
        (inst: InventoryItemInstance) =>
          ITEMS[inst.itemId].triggerType !== "PASSIVE",
      )
      .map((inst: InventoryItemInstance) => {
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
        <div
          className="flex-1 flex flex-col"
          onMouseEnter={() => $hoveredCombatant.set(player)}
          onMouseLeave={() => $hoveredCombatant.set(null)}
        >
          <CombatantCard
            entity={player}
            cooldowns={playerCooldowns}
            side="player"
          />
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
                {[...combatLog].reverse().map((entry, idx) => (
                  <motion.div
                    key={`${combatLog.length - idx}-${entry.message}`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={clsx(
                      "text-[11px] py-1 border-b border-white/5 last:border-0",
                      entry.type === "DAMAGE"
                        ? "text-blue-300"
                        : "text-red-300",
                    )}
                  >
                    <span className="opacity-40 mr-2 font-mono">
                      {combatLog.length - idx}
                    </span>
                    {entry.message}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div
          className="flex-1 flex flex-col"
          onMouseEnter={() => $hoveredCombatant.set(enemy)}
          onMouseLeave={() => $hoveredCombatant.set(null)}
        >
          <CombatantCard
            entity={enemy}
            cooldowns={enemyCooldowns}
            side="enemy"
          />
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

export default AutoBattler
