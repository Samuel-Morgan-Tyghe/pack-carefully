import { processCombatTick } from "./combat"
import type { CombatEntity, ItemCooldown } from "./combat"

// Mock ITEMS if needed or just use real ones
// We'll rely on real items for now, assuming 'dagger' exists as in verification

const createPlayer = (): CombatEntity => ({
  id: "player-test",
  name: "Player",
  hp: 100,
  maxHp: 100,
  mana: 20,
  shield: 0,
  baseDefense: 0,
  energy: 100,
  maxEnergy: 100,
  stamina: 5,
  maxStamina: 5,
  stats: {
    damage: 0,
    defense: 0,
    block: 0,
    heal: 0,
    speed: 0,
    accuracy: 100,
    maxMana: 20,
    manaRegen: 0,
    shieldRegen: 0,
    healthRegen: 0,
    maxEnergy: 100,
    energyRegen: 5,
    staminaRegen: 1.0,
    maxStamina: 5,
    triggerSpeed: 1.0,
  },
  statuses: [],
  synergies: [],
  inventory: [],
})

const createEnemy = (): CombatEntity => ({
  id: "enemy-test",
  name: "Enemy",
  hp: 100,
  maxHp: 100,
  mana: 0,
  shield: 0,
  baseDefense: 0,
  energy: 100,
  maxEnergy: 100,
  stamina: 5,
  maxStamina: 5,
  stats: {
    damage: 10,
    defense: 0,
    block: 0,
    heal: 0,
    speed: 5,
    accuracy: 100,
    maxMana: 0,
    manaRegen: 0,
    shieldRegen: 0,
    healthRegen: 0,
    maxEnergy: 100,
    energyRegen: 5,
    staminaRegen: 1.0,
    maxStamina: 5,
    triggerSpeed: 1.0,
  },
  statuses: [],
  synergies: [],
  inventory: [],
})

// Polyfill for console.log during test run if needed
// But we will run this with ts-node or similar.
// Since we don't have a test runner set up in the environment explicitly, we can make a self-executing script.

async function runTests() {
  console.log("Running Combat Tests...")

  // TEST 1: Basic Attack
  {
    const p = createPlayer()
    const e = createEnemy()
    const pCooldowns: ItemCooldown[] = [
      {
        instanceId: "1",
        itemId: "dagger", // Damage 2 + 0.2
        current: 10, // almost ready
        max: 1000,
        baseMax: 1000,
      },
    ]
    const eCooldowns: ItemCooldown[] = []

    // Tick 20ms
    let time = 0
    const result = processCombatTick(
      p,
      e,
      pCooldowns,
      eCooldowns,
      20,
      time + 20,
    )
    time += 20

    if (result.playerCooldowns[0].current > 0)
      console.log("✅ Cooldown reduced correctly")
    else console.error("❌ Cooldown should be positive")

    // Tick to trigger
    const result2 = processCombatTick(
      p,
      e,
      pCooldowns,
      eCooldowns,
      20,
      time + 20,
    ) // current - 20 = -10 -> Trigger
    time += 20

    if (result2.enemy.hp < 100)
      console.log(`✅ Enemy took damage: ${100 - result2.enemy.hp}`)
    else console.error("❌ Enemy did not take damage")

    if (result2.playerCooldowns[0].current === 1000)
      console.log("✅ Cooldown reset")
    else
      console.error(
        `❌ Cooldown did not reset, is ${result2.playerCooldowns[0].current}`,
      )
  }

  // TEST 2: Shield Absorb
  {
    const p = createPlayer()
    const e = createEnemy()
    e.shield = 10
    const pCooldowns: ItemCooldown[] = [
      {
        instanceId: "1",
        itemId: "sword", // Damage 5 (no poison)
        current: 0, // ready
        max: 1000,
        baseMax: 1000,
      },
    ]

    const result = processCombatTick(p, e, pCooldowns, [], 10, 10)

    if (result.enemy.hp === 100) console.log("✅ Shield absorbed damage")
    else console.error(`❌ Enemy took HP damage: ${100 - result.enemy.hp}`)

    if (result.enemy.shield < 10)
      console.log(`✅ Shield reduced: ${result.enemy.shield}`)
    else console.error("❌ Shield not reduced")
  }

  // TEST 3: Regen
  {
    const p = createPlayer()
    p.hp = 50
    p.stats.healthRegen = 10 // 10 hp/sec

    const result = processCombatTick(p, createEnemy(), [], [], 1000, 1000) // 1 sec

    if (Math.abs(result.player.hp - 60) < 0.1)
      console.log("✅ Health Regen working")
    else console.error(`❌ Health Regen failed: ${result.player.hp}`)
  }

  console.log("Tests Completed.")
}

runTests()
