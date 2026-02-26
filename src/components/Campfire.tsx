import { useStore } from "@nanostores/react"
import clsx from "clsx"
import { motion } from "framer-motion"
import { Flame, MessageSquare, Skull, ThumbsDown } from "lucide-react"
import type React from "react"
import { useState } from "react"
import {
  $currentPlayerId,
  $gameState,
  $players,
  healMorale,
  nextPhase,
  revealDisguises,
  rummageInventory,
} from "../store/gameStore"

const Campfire: React.FC = () => {
  const players = useStore($players)
  const gameState = useStore($gameState)
  const currentPlayerId = useStore($currentPlayerId)
  const [votes, setVotes] = useState<Record<string, string>>({}) // voterId -> targetId
  const [sabotageFeedback, setSabotageFeedback] = useState<string | null>(null)

  // Mock results for now - in real implementation we'd pull these from history
  const pathStatus = gameState.pathStatus

  // Find current player from the tracked ID
  const currentPlayer =
    players.find((p) => p.id === currentPlayerId) || players[0]
  const isTraitor = currentPlayer?.role === "Traitor"

  const handleSabotage = (targetId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Don't trigger vote
    const success = rummageInventory(targetId)

    if (success) {
      setSabotageFeedback("Sabotage Successful! Item moved.")
    } else {
      setSabotageFeedback("Sabotage Failed (No items/Start blocked?)")
    }

    setTimeout(() => setSabotageFeedback(null), 2000)
  }

  const handleVote = (targetId: string) => {
    // For prototype, just toggle vote for current player
    const myId = currentPlayer?.id
    if (!myId) return
    setVotes((prev) => ({
      ...prev,
      [myId]: targetId,
    }))
  }

  const handleSleep = () => {
    healMorale(10)
    nextPhase()
  }

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-6xl mx-auto p-8 gap-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 text-camp-orange mb-8"
      >
        <div className="p-4 bg-orange-900/30 rounded-full animate-pulse">
          <Flame
            size={64}
            className="text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.8)]"
          />
        </div>
        <div>
          <h2 className="text-5xl font-black uppercase tracking-widest text-parchment-100">
            Campfire
          </h2>
          <p className="text-parchment-400 text-xl">
            Day {gameState.day} Complete
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full">
        {/* DEBRIEF SECTION */}
        <div className="bg-black/40 backdrop-blur-sm border border-wood-600 rounded-xl p-8">
          <h3 className="text-2xl font-bold text-parchment-200 mb-6 flex items-center gap-2">
            <MessageSquare /> Mission Report
          </h3>

          <div className="space-y-6">
            {/* Left Path Result */}
            <div
              className={clsx(
                "p-4 rounded-lg border-l-4",
                pathStatus.LEFT === "RESOLVED"
                  ? "bg-green-900/20 border-green-500"
                  : "bg-red-900/20 border-red-500",
              )}
            >
              <div className="font-bold text-lg mb-1">The Quiet Trail</div>
              <div className="text-parchment-300">
                {pathStatus.LEFT === "RESOLVED"
                  ? " The path was clear. Supplies were gathered."
                  : " No one returned from this path (or it was skipped)."}
              </div>
            </div>

            {/* Right Path Result */}
            <div
              className={clsx(
                "p-4 rounded-lg border-l-4",
                pathStatus.RIGHT === "RESOLVED"
                  ? "bg-green-900/20 border-green-500"
                  : "bg-red-900/20 border-red-500",
              )}
            >
              <div className="font-bold text-lg mb-1">The Dark Woods</div>
              <div className="text-parchment-300">
                {pathStatus.RIGHT === "RESOLVED"
                  ? " The beast was repelled. The team survives."
                  : " Logic pending for skipped/failed right path."}
              </div>
            </div>

            <div className="mt-8 p-4 bg-wood-800/50 rounded text-center italic text-parchment-400">
              "I swear I packed the healing potion!" — Unknown
            </div>
          </div>
        </div>

        {/* VOTING SECTION */}
        <div className="bg-black/40 backdrop-blur-sm border border-wood-600 rounded-xl p-8 flex flex-col">
          <h3 className="text-2xl font-bold text-parchment-200 mb-2 flex items-center gap-2">
            <Skull /> Suspicion Meter
          </h3>
          <p className="text-parchment-400 mb-6 text-sm">
            Vote for who you think is sabotaging the group. (Does not kick yet,
            just pressures)
          </p>

          <div className="flex-1 space-y-3">
            {players.map((p) => {
              const myVote = currentPlayer && votes[currentPlayer.id] === p.id

              return (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => handleVote(p.id)}
                  className={clsx(
                    "w-full flex items-center gap-4 p-3 rounded-lg border transition-all text-left",
                    myVote
                      ? "bg-red-900/40 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]"
                      : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30",
                  )}
                >
                  <div
                    className={clsx(
                      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-lg",
                      p.avatarColor,
                    )}
                  >
                    {p.name[0]}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-parchment-100">{p.name}</div>
                    <div className="text-xs text-parchment-400">
                      {p.role === "Traitor" ? "???" : "Hiker"}
                    </div>
                  </div>

                  {/* Traitor Action */}
                  {isTraitor && currentPlayer && p.id !== currentPlayer.id && (
                    <button
                      type="button"
                      onClick={(e) => handleSabotage(p.id, e)}
                      className="px-3 py-1 bg-purple-900 border border-purple-500 text-purple-200 text-xs font-bold rounded hover:bg-purple-800 mr-2"
                      title="Rummage their bag (Shuffle 1 item)"
                    >
                      SABOTAGE
                    </button>
                  )}

                  {/* Investigate Action (Anyone) */}
                  {currentPlayer && p.id !== currentPlayer.id && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        const count = revealDisguises(p.id)
                        setSabotageFeedback(
                          `Investigated ${p.name}: Found ${count} disguised item${count !== 1 ? "s" : ""}.`,
                        )
                        setTimeout(() => setSabotageFeedback(null), 4000)
                      }}
                      className="px-3 py-1 bg-blue-900 border border-blue-500 text-blue-200 text-xs font-bold rounded hover:bg-blue-800"
                      title="Reveal Disguises"
                    >
                      INSPECT
                    </button>
                  )}

                  {/* Vote Indicator */}
                  {myVote && (
                    <div className="text-red-500 font-black uppercase tracking-widest text-xs flex items-center gap-1">
                      <ThumbsDown size={14} /> Suspect
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          <button
            type="button"
            onClick={handleSleep}
            className="mt-8 w-full py-4 bg-wood-600 hover:bg-wood-500 text-parchment-100 font-bold rounded-lg shadow-lg border-t border-wood-400 flex items-center justify-center gap-2 group"
          >
            <Flame size={20} className="group-hover:animate-pulse" />
            SLEEP & RECOVER (+10 Morale)
          </button>
        </div>
      </div>

      <div className="absolute top-4 right-4 space-y-2 pointer-events-none">
        {sabotageFeedback && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="bg-purple-900/90 text-purple-100 px-4 py-2 rounded shadow-lg border border-purple-500 font-bold flex items-center gap-2"
          >
            <Skull size={16} /> {sabotageFeedback}
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default Campfire
