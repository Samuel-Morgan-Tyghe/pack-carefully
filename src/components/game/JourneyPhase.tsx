import { useStore } from "@nanostores/react"
import { ArrowRight, Skull, Sparkles } from "lucide-react"
import type React from "react"
import {
  $gameState,
  $players,
  assignPlayerToPath,
  choosePath,
  returnToSplitScreen,
} from "../../store/gameStore"
import AutoBattler from "./AutoBattler"
import ScavengePhase from "./ScavengePhase"

// Sub-component for Selection
const JourneySelection: React.FC = () => {
  const players = useStore($players)
  const leftPathPlayers = players.filter((p) => p.currentPath === "LEFT")
  const rightPathPlayers = players.filter((p) => p.currentPath === "RIGHT")
  const undecidedPlayers = players.filter((p) => !p.currentPath)

  const handleConfirm = () => {
    if (undecidedPlayers.length === 0) {
      if (leftPathPlayers.length > 0) {
        choosePath("LEFT")
      } else if (rightPathPlayers.length > 0) {
        choosePath("RIGHT")
      }
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-8">
      <h2 className="text-4xl font-black mb-2 uppercase tracking-widest text-yellow-500">
        Choose Your Path
      </h2>
      <p className="text-slate-400 mb-8 max-w-xl text-center">
        The group stands at a fork in the road. Split up to cover more ground,
        or stick together for safety?
      </p>

      <div className="flex flex-col md:gap-8 w-full max-w-5xl gap-4">
        {/* LEFT PATH */}
        <div className="flex-1 bg-red-900/20 border-2 border-red-900/50 rounded-xl p-6 relative hover:bg-red-900/30 transition-colors">
          <div className="absolute top-4 left-4">
            <Skull className="text-red-500" size={32} />
          </div>
          <h3 className="text-2xl font-bold text-red-400 text-center mt-8 mb-4">
            The Dark Forest
          </h3>

          <div className="bg-black/30 rounded-lg p-4 min-h-[200px] mb-4">
            {leftPathPlayers.map((p) => (
              <button
                key={p.id}
                onClick={() => assignPlayerToPath(p.id, null)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    assignPlayerToPath(p.id, null)
                  }
                }}
                type="button"
                className="flex items-center gap-2 mb-2 cursor-pointer hover:opacity-75"
              >
                <div className={`w-8 h-8 rounded-full ${p.avatarColor}`} />
                <span className="font-bold">{p.name}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              for (const p of undecidedPlayers) {
                assignPlayerToPath(p.id, "LEFT")
              }
            }}
            className="w-full py-3 bg-red-800 hover:bg-red-700 text-white font-bold rounded"
          >
            Join Left Path
          </button>

          <div className="mt-4 text-center text-xs text-red-300 opacity-75">
            High Danger • High Reward
          </div>
        </div>

        {/* MIDDLE (Undecided) */}
        <div className="w-full md:w-48 flex flex-col items-center justify-center">
          <div className="hidden md:block w-1 h-32 bg-slate-700 mb-4" />
          <div className="bg-slate-800 p-4 rounded-lg w-full text-center">
            <h4 className="text-xs uppercase font-bold text-slate-500 mb-2">
              Undecided
            </h4>
            <div className="flex flex-wrap justify-center gap-2">
              {undecidedPlayers.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-center gap-2"
                >
                  <div className={`w-6 h-6 rounded-full ${p.avatarColor}`} />
                  <span className="text-sm">{p.name}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="hidden md:block w-1 h-32 bg-slate-700 mt-4" />
        </div>

        {/* RIGHT PATH */}
        <div className="flex-1 bg-indigo-900/20 border-2 border-indigo-900/50 rounded-xl p-6 relative hover:bg-indigo-900/30 transition-colors">
          <div className="absolute top-4 right-4">
            <Sparkles className="text-indigo-500" size={32} />
          </div>
          <h3 className="text-2xl font-bold text-indigo-400 text-center mt-8 mb-4">
            The Ancient Ruins
          </h3>

          <div className="bg-black/30 rounded-lg p-4 min-h-[200px] mb-4">
            {rightPathPlayers.map((p) => (
              <button
                key={p.id}
                onClick={() => assignPlayerToPath(p.id, null)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    assignPlayerToPath(p.id, null)
                  }
                }}
                type="button"
                className="flex items-center gap-2 mb-2 cursor-pointer hover:opacity-75"
              >
                <div className={`w-8 h-8 rounded-full ${p.avatarColor}`} />
                <span className="font-bold">{p.name}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              for (const p of undecidedPlayers) {
                assignPlayerToPath(p.id, "RIGHT")
              }
            }}
            className="w-full py-3 bg-indigo-800 hover:bg-indigo-700 text-white font-bold rounded"
          >
            Join Right Path
          </button>

          <div className="mt-4 text-center text-xs text-indigo-300 opacity-75">
            Mystery • Exploration
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleConfirm}
        disabled={undecidedPlayers.length > 0}
        className="mt-12 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xl font-black py-4 px-16 rounded-full shadow-lg hover:shadow-green-500/50 transition-all active:scale-95 flex items-center gap-3"
      >
        START EXPEDITION <ArrowRight size={24} />
      </button>
    </div>
  )
}

// Simple Results View
const JourneyResults: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-white">
      <h2 className="text-3xl font-black mb-8">Path Resolved</h2>
      <button
        type="button"
        onClick={() => returnToSplitScreen()}
        className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-8 rounded"
      >
        Continue
      </button>
    </div>
  )
}

const JourneyPhase: React.FC = () => {
  const gameState = useStore($gameState)

  if (gameState.journeyStage === "ENCOUNTER") {
    return <AutoBattler />
  }

  if (gameState.journeyStage === "SCAVENGE") {
    return <ScavengePhase />
  }

  if (gameState.journeyStage === "RESULTS") {
    return <JourneyResults />
  }

  return <JourneySelection /> // Default to selection
}

export default JourneyPhase
