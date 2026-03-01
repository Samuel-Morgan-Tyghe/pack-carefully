import { useStore } from "@nanostores/react"
import { clsx } from "clsx"
import * as LucideIcons from "lucide-react"
import type React from "react"
import {
  $draftState,
  $gameState,
  $localPlayerId,
  $phase,
  $players,
  $viewingPlayerId,
  nextPhase,
  setViewingPlayer,
} from "../../store/gameStore"

const GameHUD: React.FC = () => {
  const phase = useStore($phase)
  const gameState = useStore($gameState)
  const players = useStore($players)
  const localPlayerId = useStore($localPlayerId)
  const viewingPlayerId = useStore($viewingPlayerId)
  const draftState = useStore($draftState)

  return (
    <>
      {/* Top Left: Title/Logo (Compact) - Hidden on mobile */}
      <div className="fixed top-2 left-2 md:top-4 md:left-6 z-50 pointer-events-none select-none hidden sm:block">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="p-1.5 md:p-2 bg-wood-900/90 rounded-lg border-2 border-gold-600 shadow-lg backdrop-blur-sm">
            <LucideIcons.Map
              size={20}
              className="text-gold-500 md:w-6 md:h-6"
            />
          </div>
          <div className="bg-wood-900/80 px-2 md:px-4 py-1 md:py-2 rounded-r-xl -ml-3 md:-ml-4 pl-4 md:pl-6 border-y border-r border-wood-600 backdrop-blur-sm shadow-md">
            <h1 className="text-sm md:text-xl font-display font-bold uppercase tracking-widest text-parchment-100 drop-shadow-sm leading-none">
              Pack Carefully
            </h1>
          </div>
        </div>
      </div>

      {/* Top Center: Player Navigation & Observer Switcher */}
      <div className="fixed top-1 left-1 sm:left-1/2 sm:-translate-x-1/2 md:top-4 z-[60] flex flex-col items-center gap-1 sm:gap-2">
        {/* Phase Bar */}
        <div className="bg-wood-900/95 border-2 border-wood-600 rounded-full px-2 sm:px-4 py-1 shadow-xl backdrop-blur-sm flex items-center gap-1.5 sm:gap-3">
          {["LOBBY", "BAG", "DRAFT", "JOURNEY", "CAMP"].map((p) => (
            <div
              key={p}
              className={clsx(
                "text-[7px] md:text-[9px] font-bold tracking-widest uppercase font-display transition-all duration-300",
                phase === p ||
                  (p === "BAG" && phase === "BAG_BUILDING") ||
                  (p === "CAMP" && phase === "CAMPFIRE")
                  ? "text-gold-400 scale-105"
                  : "text-wood-500/50",
              )}
            >
              {p}
            </div>
          ))}
        </div>

        {/* Player Switcher (Observation Bar) */}
        {players.length > 0 && (
          <div className="flex items-center gap-1.5 p-1 bg-black/60 rounded-full border border-white/10 backdrop-blur-md shadow-2xl pointer-events-auto">
            {players.map((player) => {
              const isMe = player.id === localPlayerId
              const isViewing = player.id === viewingPlayerId
              const isReady =
                (phase === "BAG_BUILDING" || phase === "DRAFT") &&
                draftState.confirmed.includes(player.id)

              return (
                <button
                  type="button"
                  key={player.id}
                  onClick={() => setViewingPlayer(player.id)}
                  className={clsx(
                    "relative flex items-center gap-2 px-3 py-1.5 rounded-full transition-all group",
                    isViewing
                      ? "bg-gold-600/20 ring-1 ring-gold-500/50"
                      : "hover:bg-white/5",
                  )}
                >
                  <div className="relative">
                    <div
                      className={clsx(
                        "w-3 h-3 rounded-full shadow-sm",
                        player.avatarColor,
                      )}
                    />
                    {isReady && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-black animate-pulse" />
                    )}
                  </div>
                  <div className="flex flex-col items-start leading-none">
                    <span
                      className={clsx(
                        "text-[10px] font-bold tracking-tighter transition-colors",
                        isViewing
                          ? "text-gold-400"
                          : "text-parchment-200/60 group-hover:text-parchment-100",
                      )}
                    >
                      {player.name}
                    </span>
                    {isMe && (
                      <span className="text-[7px] uppercase font-black text-gold-600/80 -mt-0.5">
                        You
                      </span>
                    )}
                  </div>
                  {isViewing && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-gold-400 rounded-full" />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Top Right: Actions & Stats - Compact on mobile */}
      <div className="fixed top-1 right-1 md:top-4 md:right-6 z-50 flex items-center gap-1.5 md:gap-6">
        {/* Stats */}
        <div className="flex items-center gap-1.5 md:gap-4 bg-wood-900/90 px-1.5 md:px-4 py-1 md:py-2 rounded-lg border border-wood-600 shadow-lg backdrop-blur-sm">
          <div className="flex flex-col items-end">
            <span className="text-[7px] md:text-[10px] text-wood-400 uppercase font-bold tracking-widest">
              Day
            </span>
            <span className="text-xs md:text-xl font-display font-bold text-parchment-100">
              {gameState.day}/5
            </span>
          </div>
          <div className="w-px h-5 md:h-8 bg-wood-700 mx-0.5 md:mx-2" />
          <div className="flex flex-col items-end min-w-[40px] md:min-w-[100px]">
            <span className="text-[7px] md:text-[10px] text-wood-400 uppercase font-bold tracking-widest mb-0.5">
              HP
            </span>
            <div className="w-full h-1 md:h-2 bg-wood-800 rounded-full overflow-hidden border border-wood-600">
              <div
                className={clsx(
                  "h-full transition-all duration-500",
                  gameState.morale > 60
                    ? "bg-green-500"
                    : gameState.morale > 30
                      ? "bg-yellow-500"
                      : "bg-red-600 animate-pulse",
                )}
                style={{ width: `${gameState.morale}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (confirm("Abandon expedition and return to Lobby?")) {
                import("../../store/gameStore").then((m) => m.resetGame())
              }
            }}
            className="hidden sm:flex px-3 py-1.5 md:py-2 bg-red-900/40 border border-red-700/50 rounded-lg hover:bg-red-800/60 text-red-100 text-[8px] md:text-xs uppercase font-black tracking-tighter hover:scale-105 pointer-events-auto transition-all backdrop-blur-sm group"
          >
            <LucideIcons.LogOut
              size={12}
              className="mr-1 group-hover:translate-x-0.5 transition-transform"
            />
            Quit
          </button>

          <button
            type="button"
            onClick={nextPhase}
            className="px-4 md:px-8 py-1.5 md:py-2 bg-forest-700/90 border-2 border-forest-500 rounded-lg hover:bg-forest-600 text-parchment-100 text-[8px] md:text-xs uppercase font-black tracking-widest shadow-lg hover:shadow-forest-500/30 hover:scale-105 pointer-events-auto transition-all backdrop-blur-sm"
          >
            {phase === "DRAFT"
              ? "Ready"
              : phase === "CAMPFIRE" && gameState.day === 5
                ? "Finish"
                : "Next"}
          </button>
        </div>
      </div>
    </>
  )
}

export default GameHUD
