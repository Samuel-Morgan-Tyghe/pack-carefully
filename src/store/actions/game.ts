import type { Role } from "../../types"
import {
  $containers,
  $currentPlayerId,
  $gameState,
  $itemsOnGrid,
  $phase,
  $players,
} from "../atoms"

/**
 * Resets the entire game progress by clearing local storage and reloading.
 */
export const resetGame = () => {
  if (typeof localStorage !== "undefined") {
    const keys = Object.keys(localStorage)
    for (const key of keys) {
      if (key.startsWith("pack_carefully_")) {
        localStorage.removeItem(key)
      }
    }
  }
  window.location.reload()
}

/**
 * Initializes a new game session.
 */
export const startGame = () => {
  const currentPlayers = $players.get()
  const numPlayers = currentPlayers.length

  const hasTraitor = Math.random() > 0.25
  const traitorIndex = hasTraitor ? Math.floor(Math.random() * numPlayers) : -1

  const newPlayers = currentPlayers.map((p: any, idx: number) => ({
    ...p,
    role: (idx === traitorIndex ? "Traitor" : "Hiker") as Role,
    isTraitor: idx === traitorIndex,
  }))

  $players.set(newPlayers)
  $currentPlayerId.set(currentPlayers[0]?.id || undefined)

  $containers.set([])
  $itemsOnGrid.set([])

  $phase.set("BAG_BUILDING")
}

/**
 * Transition to the next game phase.
 * Note: Some transitions are handled by specialized action modules.
 */
export const nextPhase = (actions: {
  startDraft: () => void
  advanceDay: () => void
}) => {
  const current = $phase.get()

  if (current === "LOBBY") {
    startGame()
  } else if (current === "BAG_BUILDING") {
    actions.startDraft()
  } else if (current === "DRAFT") {
    $phase.set("JOURNEY")
  } else if (current === "JOURNEY") {
    $phase.set("CAMPFIRE")
  } else if (current === "CAMPFIRE") {
    actions.advanceDay()
    if ($gameState.get().isGameOver) {
      $phase.set("LOBBY")
    } else {
      actions.startDraft()
    }
  }
}

/**
 * Damage team morale. Game over at 0.
 */
export const damageMorale = (amount: number) => {
  const current = $gameState.get()
  const newMorale = Math.max(0, current.morale - amount)

  if (newMorale === 0) {
    $gameState.set({
      ...current,
      morale: 0,
      isGameOver: true,
      gameResult: "LOSS",
    })
  } else {
    $gameState.set({ ...current, morale: newMorale })
  }
}

/**
 * Heal team morale.
 */
export const healMorale = (amount: number) => {
  const current = $gameState.get()
  $gameState.set({
    ...current,
    morale: Math.min(100, current.morale + amount),
  })
}

/**
 * Advance the game to the next day.
 */
export const advanceDay = () => {
  const current = $gameState.get()
  const newDay = current.day + 1

  if (newDay > 5) {
    $gameState.set({ ...current, day: 5 })
    $phase.set("FINALE")
  } else {
    $gameState.set({
      ...current,
      day: newDay,
      round: newDay,
      journeyStage: "SELECTION",
      selectedPath: null,
      pathStatus: { LEFT: "PENDING", RIGHT: "PENDING" },
      lastEncounterResult: null,
    })
  }
}

export const damagePlayerHP = (_amount: number) => {
  // Logic from combat if needed globally, but usually handled by AutoBattler
}
