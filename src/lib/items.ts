import type { Item } from "../types"
import { basicBlock } from "./items/basicBlock"
import { basicSupport } from "./items/basicSupport"
import { basicWeapons } from "./items/basicWeapons"
import { boosters } from "./items/booster"
import { bridgeItems } from "./items/bridgeItems"

export const ITEMS: Record<string, Item> = {
  ...boosters,
  ...basicWeapons,
  ...basicBlock,
  ...basicSupport,
  ...bridgeItems,
}

export const GRID_SIZE = 8
