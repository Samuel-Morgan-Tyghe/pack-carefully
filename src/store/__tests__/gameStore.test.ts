import { beforeEach, describe, expect, it } from "vitest"
import {
  $containers,
  $draftState,
  $itemsOnGrid,
  $phase,
  $players,
  addPlayer,
  createCustomContainer,
  placeItem,
  startGame,
} from "../gameStore"

describe("gameStore Integration", () => {
  beforeEach(() => {
    // Reset stores
    $players.set([])
    $containers.set([])
    $itemsOnGrid.set([])
    $phase.set("LOBBY")
    $draftState.set({
      availableItems: {},
      selections: {},
      confirmed: [],
      roundNumber: 1,
    })
  })

  it("can add a player and start the game", () => {
    addPlayer("TestPlayer")

    expect($players.get().length).toBe(1)
    expect($players.get()[0].name).toBe("TestPlayer")

    startGame()

    expect($phase.get()).toBe("BAG_BUILDING")
    expect($players.get()[0].role).toBeDefined()
  })

  it("can place an item on the grid", () => {
    const playerId = addPlayer("TestPlayer")
    startGame()

    createCustomContainer(playerId, [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
    ])

    $phase.set("DRAFT")

    $draftState.set({
      ...$draftState.get(),
      availableItems: {
        [playerId]: ["dagger"], // Use a dagger since wood_sword isn't in ITEMS
      },
    })

    const success = placeItem("dagger", 0, 0, 0, playerId)

    expect(success).toBe(true)
    expect($itemsOnGrid.get().length).toBe(1)
    expect($itemsOnGrid.get()[0].itemId).toBe("dagger")
  })
})
