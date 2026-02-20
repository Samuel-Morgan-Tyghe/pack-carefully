import { useStore } from "@nanostores/react"
import * as LucideIcons from "lucide-react"
import type React from "react"
import { $gameState, resetGame } from "../../store/gameStore"

const GameResultScreen: React.FC = () => {
  const gameState = useStore($gameState)
  const isWin = gameState.gameResult === "WIN"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-500">
      <div className="text-center p-12 max-w-2xl border-y-4 border-double border-wood-600 bg-wood-900/50">
        <div className="mb-8 flex justify-center">
          {isWin ? (
            <div className="p-6 bg-gold-500/10 rounded-full border-2 border-gold-500 animate-bounce">
              <LucideIcons.Trophy size={64} className="text-gold-500" />
            </div>
          ) : (
            <div className="p-6 bg-red-500/10 rounded-full border-2 border-red-500 animate-pulse">
              <LucideIcons.Skull size={64} className="text-red-500" />
            </div>
          )}
        </div>

        <h1 className="text-6xl font-black uppercase tracking-widest mb-4 font-display">
          {isWin ? (
            <span className="text-gold-500">Victory!</span>
          ) : (
            <span className="text-red-600">Game Over</span>
          )}
        </h1>

        <p className="text-2xl font-serif italic text-parchment-200 mb-12">
          {isWin
            ? "You survived the wilderness and reached safety."
            : "The expedition fell apart. The wilderness claimed another team."}
        </p>

        <div className="flex gap-8 justify-center text-sm font-mono text-wood-400 mb-12">
          <div>
            <div className="uppercase tracking-widest text-xs">
              Days Survived
            </div>
            <div className="text-2xl text-parchment-100">{gameState.day}</div>
          </div>
          <div>
            <div className="uppercase tracking-widest text-xs">
              Final Morale
            </div>
            <div
              className={`text-2xl ${isWin ? "text-green-400" : "text-red-500"}`}
            >
              {gameState.morale}%
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={resetGame}
          className="px-10 py-4 bg-wood-100 text-wood-900 hover:bg-white rounded-lg font-black uppercase tracking-[0.2em] shadow-lg hover:shadow-2xl hover:scale-105 transition-all"
        >
          Return to Lobby
        </button>
      </div>
    </div>
  )
}

export default GameResultScreen
