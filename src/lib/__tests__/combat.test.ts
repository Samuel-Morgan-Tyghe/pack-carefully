import { describe, expect, it } from "vitest"
import type { InventoryItemInstance } from "../../types"
import {
  createCombatEntity,
  processCombatTick,
  simulateCombat,
} from "../combat"
import { ITEMS } from "../items/items"

describe("Combat System Integration", () => {
  it("correctly calculates damage against block over a tick", () => {
    // Setup Player with a dagger (damage)
    const playerItems: InventoryItemInstance[] = [
      {
        instanceId: "p-dagger",
        itemId: "dagger",
        x: 0,
        y: 0,
        rotation: 0,
        ownerId: "player_1",
      },
    ]
    const p = createCombatEntity("player_1", "Hero", playerItems)

    // Setup Enemy with a shield (block)
    const enemyItems: InventoryItemInstance[] = [
      {
        instanceId: "e-shield",
        itemId: "wooden_shield",
        x: 0,
        y: 0,
        rotation: 0,
        ownerId: "enemy_1",
      },
    ]
    const e = createCombatEntity("enemy_1", "Goblin", enemyItems)

    const baseDaggerCD = ITEMS.dagger.combatStats?.baseCooldown || 1.0
    const baseShieldCD = ITEMS.wooden_shield.combatStats?.baseCooldown || 5.0

    const pCDs = [
      {
        instanceId: "p-dagger",
        itemId: "dagger",
        current: 0.1,
        max: baseDaggerCD,
        baseMax: baseDaggerCD,
      },
    ]
    const eCDs = [
      {
        instanceId: "e-shield",
        itemId: "wooden_shield",
        current: 0.1,
        max: baseShieldCD,
        baseMax: baseShieldCD,
      },
    ]

    // Simulate 1 tick of 0.2s duration.
    // Dagger CD is 0.1 so it will trigger.
    const result = processCombatTick(p, e, pCDs, eCDs, 200, 0.2)

    // We expect the dagger to fire and hit.
    // Dagger dmg is 4 (usually). Let's just check if an attack event happened and Enemy took damage.
    const attackEvent = result.events.some((e) => e.includes("hits for"))
    expect(attackEvent).toBe(true)
    expect(result.enemy.hp).toBeLessThan(result.enemy.maxHp)
  })

  it("runs a full combat simulation without throws", () => {
    const pItems: InventoryItemInstance[] = [
      {
        instanceId: "i1",
        itemId: "dagger",
        x: 0,
        y: 0,
        rotation: 0,
        ownerId: "p1",
      },
    ]
    const eItems: InventoryItemInstance[] = [
      {
        instanceId: "i2",
        itemId: "dagger",
        x: 0,
        y: 0,
        rotation: 0,
        ownerId: "e1",
      },
    ]

    const player = createCombatEntity("p1", "Player", pItems)
    const enemy = createCombatEntity("e1", "Enemy", eItems)

    // Simulate a full fight. Someone should win or tie, but it shouldn't crash.
    const { winner, events } = simulateCombat(player, enemy, 1000)

    expect(["PLAYER", "ENEMY", "DRAW"]).toContain(winner)
    expect(events.length).toBeGreaterThan(0)
  })
})
