import { beforeEach, describe, expect, it } from "vitest"
import {
  $draftState,
  $itemsOnGrid,
  SANDBOX_PLAYER_ID,
  addPlayer,
  craftItem,
  enterSandbox,
  placeItem,
  resetGame,
} from "../store/gameStore"

describe("Crafting System", () => {
  beforeEach(() => {
    resetGame()
    addPlayer("Crafter")
    enterSandbox()
  })

  it("can craft a Viper Blade from Rusty Dagger and Poison Shard", async () => {
    const pId = SANDBOX_PLAYER_ID

    // Place Rusty Dagger (1x2)
    placeItem("rusty_dagger", 0, 0, 0, pId)

    // Place Poison Shard (2x2) adjacent to dagger (at x=1, y=0)
    placeItem("poison_shard", 1, 0, 0, pId)

    // Trigger craft for player
    await craftItem(pId)

    const items = $itemsOnGrid.get()
    const pool = $draftState.get().availableItems[pId] || []

    // The result goes to the draft pool (shelf), the consumed items leave the grid.
    const hasViperBladeInPool = pool.includes("viper_blade")
    const hasDaggerOnGrid = items.some((i) => i.itemId === "rusty_dagger")
    const hasShardOnGrid = items.some((i) => i.itemId === "poison_shard")

    expect(hasViperBladeInPool).toBe(true)
    expect(hasDaggerOnGrid).toBe(false)
    expect(hasShardOnGrid).toBe(false)
  })
})
