import { processCombatTick } from "./combat"
import type { CombatEntity, ItemCooldown } from "./combat"

const createPlayer = (): CombatEntity => ({
  id: "player-test",
  name: "Player",
  hp: 100,
  maxHp: 100,
  block: 0,
  mana: 20,
  maxMana: 20,
  energy: 100,
  maxEnergy: 100,
  stats: {
    damage: 0,
    block: 0,
    heal: 0,
    maxHp: 100,
    maxMana: 20,
    manaRegen: 1,
    maxEnergy: 100,
    energyRegen: 2,
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
  block: 0,
  mana: 20,
  maxMana: 20,
  energy: 100,
  maxEnergy: 100,
  stats: {
    damage: 10,
    block: 0,
    heal: 0,
    maxHp: 100,
    maxMana: 20,
    manaRegen: 1,
    maxEnergy: 100,
    energyRegen: 2,
    triggerSpeed: 1.0,
  },
  statuses: [],
  synergies: [],
  inventory: [],
})

async function runTests() {
  console.log("Running Combat Tests...")

  // TEST 1: Basic Attack
  {
    const p = createPlayer()
    const e = createEnemy()
    const pCooldowns: ItemCooldown[] = [
      {
        instanceId: "1",
        itemId: "dagger",
        current: 10,
        max: 1000,
        baseMax: 1000,
      },
    ]
    const eCooldowns: ItemCooldown[] = []

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

    const result2 = processCombatTick(
      p,
      e,
      pCooldowns,
      eCooldowns,
      20,
      time + 20,
    )
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

  // TEST 2: Block Absorb
  {
    const p = createPlayer()
    const e = createEnemy()
    e.block = 10
    const pCooldowns: ItemCooldown[] = [
      {
        instanceId: "1",
        itemId: "dagger", // Damage 8
        current: 0,
        max: 1000,
        baseMax: 1000,
      },
    ]

    const result = processCombatTick(p, e, pCooldowns, [], 10, 10)

    if (result.enemy.block < 10)
      console.log(`✅ Enemy block reduced: ${10 - result.enemy.block}`)
    else console.error("❌ Enemy block not reduced")

    if (result.enemy.hp === 100) console.log("✅ Enemy HP protected by block")
    else console.error("❌ Enemy HP should have been protected")
  }

  // TEST 3: Regen
  {
    const p = createPlayer()
    p.hp = 50
    p.stats.healthRegen = 10

    const result = processCombatTick(p, createEnemy(), [], [], 1000, 1000)

    if (Math.abs(result.player.hp - 60) < 0.1)
      console.log("✅ Health Regen working")
    else console.error(`❌ Health Regen failed: ${result.player.hp}`)
  }

  console.log("Tests Completed.")
}

runTests()
