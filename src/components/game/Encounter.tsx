import { useStore } from "@nanostores/react"
import { AnimatePresence, motion } from "framer-motion"
import type React from "react"
import { useState } from "react"
import {
  calculateCombatPower,
  createCombatEntity,
  generateEnemy,
  simulateCombat,
} from "../../lib/combat"
import { playSound } from "../../lib/sounds"
import {
  $gameState,
  $itemsOnGrid,
  $players,
  addRandomLoot,
  completeEncounter,
  damageMorale,
} from "../../store/gameStore"

interface FloatingText {
  id: string
  text: string
  x: number
  y: number
  color: string
}

const Encounter: React.FC = () => {
  const gameState = useStore($gameState)
  const items = useStore($itemsOnGrid)
  const players = useStore($players)
  const selectedPath = gameState.selectedPath

  const activePlayers = players
    .filter((p) => p.currentPath === selectedPath)
    .map((p) => p.id)
  const pathItems = items.filter((i) => activePlayers.includes(i.ownerId))

  const [feedback, setFeedback] = useState<string | null>(null)
  const [isFighting, setIsFighting] = useState(false)
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([])
  const [shake, setShake] = useState(0)

  const difficulty = gameState.day * 15
  const power = calculateCombatPower(pathItems)

  const addFloatingText = (
    text: string,
    x: number,
    y: number,
    color: string,
  ) => {
    const id = Math.random().toString(36).substr(2, 9)
    setFloatingTexts((prev) => [...prev, { id, text, x, y, color }])
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((ft) => ft.id !== id))
    }, 1000)
  }

  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  const handleFight = async () => {
    setIsFighting(true)

    const playerEntity = createCombatEntity(
      "player-expedition",
      "Expedition",
      pathItems,
    )
    const enemyEntity = generateEnemy("AGGRESSIVE", gameState.day)

    // Visual sequence
    for (let i = 0; i < 3; i++) {
      await wait(600)
      setShake((prev) => prev + 1)
      playSound.combatHit()
      addFloatingText("⚔️", 0, -50, "#ef4444")
    }

    // Actual logic resolution using the unified simulation
    const { winner, events } = simulateCombat(playerEntity, enemyEntity)
    const success = winner === "PLAYER"

    console.log("Combat Logs:", events)

    await wait(800)

    if (!success) {
      playSound.defeat()
      damageMorale(20)
      addRandomLoot("curse_scrap")
    } else {
      playSound.fanfare()
    }

    $gameState.set({
      ...$gameState.get(),
      lastEncounterResult: {
        success,
        difficulty,
        message: success ? "Victory!" : "Defeat! The beast was too strong.",
      },
    })

    completeEncounter(success)
    setIsFighting(false)
  }

  const handleTacticalLoss = () => {
    const randomVictimId =
      activePlayers[Math.floor(Math.random() * activePlayers.length)]
    damageMorale(15)
    addRandomLoot("curse_scrap", randomVictimId)
    playSound.defeat()
    setFeedback("Scavenged Cursed Scrap! (-15 Morale)")

    setTimeout(() => {
      $gameState.set({
        ...$gameState.get(),
        lastEncounterResult: {
          success: false,
          difficulty: difficulty,
          message: "Tactical Defeat. You found something in the darkness...",
        },
      })
      completeEncounter(false)
    }, 1500)
  }

  return (
    <motion.div
      animate={{ x: shake % 2 === 0 ? 0 : [0, -10, 10, -10, 10, 0] }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center text-parchment-100 p-8 h-full relative"
    >
      <h2 className="text-5xl font-black mb-8 text-red-500 tracking-wider">
        ENCOUNTER!
      </h2>

      <div className="flex gap-32 mb-12 items-center relative">
        <div className="flex flex-col items-center">
          <div className="text-2xl text-parchment-400 mb-2">THREAT</div>
          <div className="text-6xl font-black text-red-500">{difficulty}</div>
        </div>

        <div className="text-4xl font-bold text-parchment-500 italic">VS</div>

        <div className="flex flex-col items-center">
          <div className="text-2xl text-parchment-400 mb-2">POWER</div>
          <motion.div
            animate={isFighting ? { scale: [1, 1.2, 1] } : {}}
            className={`text-6xl font-black ${power >= difficulty ? "text-green-400" : "text-yellow-500"}`}
          >
            {power}
          </motion.div>
        </div>

        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <AnimatePresence>
            {floatingTexts.map((ft) => (
              <motion.div
                key={ft.id}
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 0, y: -100 }}
                style={{
                  position: "absolute",
                  color: ft.color,
                  fontSize: "3rem",
                  fontWeight: "900",
                }}
              >
                {ft.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <p className="mb-8 text-xl text-parchment-300 max-w-md text-center italic">
        {isFighting
          ? "Determining your fate..."
          : "A wild beast blocks your path! Do you have the strength to drive it back?"}
      </p>

      {!isFighting && (
        <div className="flex gap-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={handleFight}
            className="bg-red-700 text-white font-bold py-4 px-12 rounded-xl shadow-lg text-2xl border-b-4 border-red-900"
          >
            FIGHT!
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={handleTacticalLoss}
            className="bg-purple-900 text-purple-200 font-bold py-4 px-8 rounded-xl text-xl flex flex-col items-center border-b-4 border-purple-950"
          >
            <span>SCAVENGE</span>
            <span className="text-xs opacity-70">(Take Damage)</span>
          </motion.button>
        </div>
      )}

      {feedback && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-black/60 z-50"
        >
          <div className="bg-purple-900 border-4 border-purple-500 p-8 rounded-2xl shadow-2xl text-center">
            <div className="text-4xl font-black text-purple-200 mb-2">
              SCAVENGED!
            </div>
            <div className="text-xl text-purple-300">{feedback}</div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

export default Encounter
