import { ITEMS } from "./dist/lib/items/items.js"
import {
  $containers,
  $draftState,
  $itemsOnGrid,
  $phase,
  $players,
  SANDBOX_PLAYER_ID,
  addPlayer,
  checkSupport,
  createCustomContainer,
  enterSandbox,
  getItemCells,
  placeItem,
  resetGame,
  startGame,
} from "./dist/store/gameStore.js"

// Mock LS
const localStorageMock = (() => {
  let store = {}
  return {
    getItem(key) {
      return store[key] || null
    },
    setItem(key, value) {
      store[key] = value.toString()
    },
    removeItem(key) {
      delete store[key]
    },
    clear() {
      store = {}
    },
  }
})()
global.localStorage = localStorageMock

function runDebug() {
  $players.set([])
  $containers.set([])
  $itemsOnGrid.set([])

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
    availableItems: { [playerId]: ["wooden_sword"] },
    selections: {},
    confirmed: [],
    roundNumber: 1,
  })

  console.log("---- Debug: Integration Test ----")
  const def = ITEMS.wooden_sword
  const cells = getItemCells(0, 0, "wooden_sword", 0)
  console.log("Sword cells:", cells)
  console.log("Containers:", JSON.stringify($containers.get()))

  const w = def.width
  const h = def.height
  const isSupported = checkSupport(0, 0, w, h, [], playerId, "wooden_sword", 0)
  console.log("isSupported?", isSupported)

  const res = placeItem("wooden_sword", 0, 0, 0, playerId)
  console.log("placeItem result:", res)

  console.log("\n---- Debug: Crafting Test ----")
  resetGame()
  addPlayer("Crafter")
  enterSandbox()
  const pId = SANDBOX_PLAYER_ID

  const wDef = ITEMS.wooden_sword
  console.log(
    "Wood Sword supported in sandbox?",
    checkSupport(0, 0, wDef.width, wDef.height, [], pId, "wooden_sword", 0),
  )
  console.log("Wood Sword placed?", placeItem("wooden_sword", 0, 0, 0, pId))
}

runDebug()
