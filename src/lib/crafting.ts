import type { InventoryItemInstance } from "../types"
import { ITEMS } from "./items/items"

export interface Recipe {
  ingredients: string[]
  result: string
}

export const RECIPES: Recipe[] = Object.values(ITEMS)
  .filter((item) => item.recipe)
  .map((item) => item.recipe as Recipe)

export interface CraftingSource {
  type: "shelf" | "bag"
  id: string // itemId for shelf, instanceId for bag
  itemId: string
}

/**
 * Finds if any crafting recipe can be fulfilled.
 * Prefers shelf items over bag items.
 */
export function findPossibleCraft(
  shelfItemIds: string[],
  bagInstances: InventoryItemInstance[],
) {
  // Combine all possible sources into one flat list for easy searching
  // Sorted: Shelf first, then Bag
  const candidates: CraftingSource[] = [
    ...shelfItemIds.map((id) => ({ type: "shelf" as const, id, itemId: id })),
    ...bagInstances.map((inst) => ({
      type: "bag" as const,
      id: inst.instanceId,
      itemId: inst.itemId,
    })),
  ]

  for (const recipe of RECIPES) {
    const matchedSources: CraftingSource[] = []
    const available = [...candidates]

    let possible = true
    for (const ingredientId of recipe.ingredients) {
      const foundIdx = available.findIndex((c) => c.itemId === ingredientId)
      if (foundIdx === -1) {
        possible = false
        break
      }
      matchedSources.push(available[foundIdx])
      available.splice(foundIdx, 1)
    }

    if (possible) {
      return { recipe, matchedSources }
    }
  }
  return null
}
