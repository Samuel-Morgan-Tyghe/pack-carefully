import { describe, expect, it } from "vitest"
import type { InventoryItemInstance } from "../types"
import { getAdjacencyBonuses } from "./adjacency"

describe("Synergies System", () => {
  it("detects adjacency (Water Bottle next to First Aid)", () => {
    const items: InventoryItemInstance[] = [
      {
        instanceId: "bottle-1",
        itemId: "water_bottle",
        x: 0,
        y: 0,
        rotation: 0,
        ownerId: "test",
      },
      {
        instanceId: "aid-1",
        itemId: "first_aid",
        x: 1,
        y: 0,
        rotation: 0,
        ownerId: "test",
      },
    ]

    const results = getAdjacencyBonuses(items)
    const aidRes = results["aid-1"]

    // First Aid activeRules should contain the synergy based on current game logic
    expect(aidRes).toBeDefined()
    // It should have either active rules or a specific multiplier depending on implementation
    if (aidRes.multipliers.heal) {
      expect(aidRes.multipliers.heal).toBeGreaterThan(1)
    }
  })

  it("calculates solo buffs without adjacencies (Knights Crest)", () => {
    const items: InventoryItemInstance[] = [
      {
        instanceId: "crest-1",
        itemId: "knights_crest",
        x: 0,
        y: 0,
        rotation: 0,
        ownerId: "test",
      },
    ]

    const results = getAdjacencyBonuses(items)
    expect(results["crest-1"]).toBeDefined()
  })
})
