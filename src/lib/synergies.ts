import type { InventoryItemInstance } from "../types"
import { ITEMS } from "./items"

export interface SynergyEffect {
  sourceId: string
  targetId: string
  type:
    | "STATUS_MULTIPLIER"
    | "CHAIN_REACTION"
    | "COOLDOWN_REDUCTION"
    | "ROW_BUFF"
  value: number // e.g., 2 for Double, -1 for CD
  description: string
}

export const calculateSynergies = (
  items: InventoryItemInstance[],
): SynergyEffect[] => {
  const effects: SynergyEffect[] = []

  // Map items to coordinates for easier adjacency checking
  // Note: Items occupy multiple cells.
  // For specific "Left/Right" logic, we need to know relative positions.
  // Let's do a O(N^2) check since N is small (< 50 items max).

  // Helper to get centers or just compare bounds

  for (const source of items) {
    const sourceDef = ITEMS[source.itemId]
    if (!sourceDef) continue

    // Future specific synergy logic here
  }

  return effects
}

// Simple collision-based adjacency

export const getDragHighlights = (
  heldItemType: string,
  _hoveredX: number,
  _hoveredY: number,
  _allItems: InventoryItemInstance[],
): string[] => {
  // Returns IDs of cells or items to highlight
  const highlights: string[] = []
  const heldDef = ITEMS[heldItemType]
  if (!heldDef) return []

  // Future highlight logic here

  return highlights
}
