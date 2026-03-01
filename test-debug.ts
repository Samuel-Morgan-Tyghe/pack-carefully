import { ITEMS } from "./src/lib/items/items"
import {
  $containers,
  $draftState,
  $itemsOnGrid,
  $phase,
  SANDBOX_PLAYER_ID,
  addPlayer,
  checkCollision,
  checkSupport,
  createCustomContainer,
  enterSandbox,
  getItemCells,
  placeItem,
  resetGame,
  startGame,
} from "./src/store/gameStore"
import { $players } from "./src/store/gameStore"

function runDebug() {
  resetGame()
  addPlayer("Crafter")
  enterSandbox()
  const pId = SANDBOX_PLAYER_ID

  const wDef = ITEMS.wooden_sword
  console.log("Phase is:", $phase.get())
  console.log(
    "Wood Sword supported in sandbox?",
    checkSupport(0, 0, wDef.width, wDef.height, [], pId, "wooden_sword", 0),
  )
  console.log(
    "Wood Sword collision in sandbox?",
    checkCollision(
      0,
      0,
      wDef.width,
      wDef.height,
      [],
      pId,
      undefined,
      wDef.category,
      "wooden_sword",
      0,
    ),
  )

  const res = placeItem("wooden_sword", 0, 0, 0, pId)
  console.log("Wood Sword placed?", res)
  if (!res)
    console.log(
      "Failed because either collision or support returned false inside placeItem",
    )
}
runDebug()
