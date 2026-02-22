import type { Item } from "../types"
import { basicBlock } from "./items/basicBlock"
import { basicSupport } from "./items/basicSupport"
import { basicTools } from "./items/basicTools"
import { basicWeapons } from "./items/basicWeapons"
import { bridgeItems } from "./items/bridgeItems"

export const ITEMS: Record<string, Item> = {
  ...basicTools,
  ...basicWeapons,
  ...basicBlock,
  ...basicSupport,
  ...bridgeItems,
}

export const GRID_SIZE = 8
