import {
  $itemsOnGrid,
  SANDBOX_PLAYER_ID,
  addPlayer,
  enterSandbox,
  placeItem,
  resetGame,
} from "../store/gameStore"

async function runCraftingTests() {
  console.log("Running Crafting Tests...")

  // Test 1: Wooden Sword + Rock -> Hero Sword
  {
    resetGame()
    addPlayer("Crafter")
    enterSandbox()
    const pId = SANDBOX_PLAYER_ID

    // Place Wooden Sword (1x3)
    placeItem("wooden_sword", 0, 0, 0, pId)

    // Place Rock (2x2) adjacent to sword (at x=1, y=0)
    placeItem("rock", 1, 0, 0, pId)

    const items = $itemsOnGrid.get()
    console.log(
      "Items on grid after placement:",
      items.map((i) => i.itemId),
    )

    const hasHeroSword = items.some((i) => i.itemId === "hero_sword")
    const hasWoodSword = items.some((i) => i.itemId === "wooden_sword")
    const hasRock = items.some((i) => i.itemId === "rock")

    if (hasHeroSword && !hasWoodSword && !hasRock) {
      console.log(
        "✅ Crafting Successful: Hero Sword created, ingredients consumed.",
      )
    } else {
      console.error("❌ Crafting Failed!")
      console.log(
        "Status: HeroSword:",
        hasHeroSword,
        "WoodSword:",
        hasWoodSword,
        "Rock:",
        hasRock,
      )
    }
  }

  console.log("Crafting Tests Completed.")
}

runCraftingTests().catch(console.error)
