import type { Item } from "../../types"
import { basicBlock } from "./basicBlock"
import { basicSupport } from "./basicSupport"
import { basicWeapons } from "./basicWeapons"
import { boosters } from "./booster"
import { bridgeItems } from "./bridgeItems"
import { healthItems } from "./healthItems"

export const ITEMS: Record<string, Item> = {
  ...boosters,
  ...basicWeapons,
  ...basicBlock,
  ...basicSupport,
  ...bridgeItems,
  ...healthItems,
}

export const GRID_SIZE = 8
