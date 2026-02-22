import type { InventoryItemInstance, SynergyEffect } from "../types"
import { getAdjacencyBonuses } from "./adjacency"
import { ITEMS } from "./items"

export interface CombatStats {
  damage: number
  block: number
  heal: number
  maxHp: number
  healthRegen?: number
  maxMana: number
  manaRegen: number
  maxEnergy: number
  energyRegen: number
  triggerSpeed: number // Multiplier
}

export interface StatusEffect {
  type: "POISON" | "FIRE" | "STUN" | "SLOW" | "BLEED"
  value: number // Stacks or Duration
  sourceId?: string
}

export interface CombatEntity {
  id: string
  hp: number
  maxHp: number
  block: number
  mana: number
  maxMana: number
  energy: number
  maxEnergy: number
  image?: string
  stats: CombatStats
  statuses: StatusEffect[]
  synergies?: SynergyEffect[]
  onHitEffects?: {
    type: StatusEffect["type"]
    value: number
    chance?: number
  }[]
  name: string
  inventory: InventoryItemInstance[]
}

export interface ItemCooldown {
  instanceId: string
  itemId: string
  current: number // ms remaining
  max: number // ms total
  baseMax: number // Original max cooldown before modifiers
  lastTrigger?: {
    type: "SUCCESS" | "FAIL_ENERGY"
    timestamp: number // Combat elapsed time
  } | null
}

export interface CombatLogEntry {
  round: number
  message: string
  type: "DAMAGE" | "HEAL" | "BLOCK" | "INFO" | "MISS" | "EFFECT"
}

/**
 * Unified factory to create a CombatEntity from inventory items.
 */
export const createCombatEntity = (
  id: string,
  name: string,
  items: InventoryItemInstance[],
): CombatEntity => {
  const { stats, itemsWithLiveStats } = calculatePlayerCombatInfo(items)

  return {
    id,
    name,
    hp: stats.maxHp,
    maxHp: stats.maxHp,
    block: 0,
    mana: stats.maxMana,
    maxMana: stats.maxMana,
    energy: stats.maxEnergy,
    maxEnergy: stats.maxEnergy,
    stats,
    statuses: [],
    synergies: [],
    onHitEffects: [],
    inventory: itemsWithLiveStats,
  }
}

export const calculatePlayerCombatInfo = (
  items: InventoryItemInstance[],
): {
  stats: CombatStats
  itemsWithLiveStats: InventoryItemInstance[]
} => {
  const totalStats: CombatStats = {
    damage: 0,
    block: 0,
    heal: 0,
    maxHp: 100, // Base HP
    healthRegen: 0,
    maxMana: 20, // Base Mana
    manaRegen: 1,
    maxEnergy: 100, // Base Energy
    energyRegen: 5,
    triggerSpeed: 1.0, // Default multiplier
  }

  const bonusesMap = getAdjacencyBonuses(items)

  const itemsWithLiveStats = items.map((instance) => {
    const def = ITEMS[instance.itemId]
    const bonus = bonusesMap[instance.instanceId]

    // Base stats from item definition
    const liveStats = {
      damage: def.combatStats?.damage || 0,
      block: def.combatStats?.block || 0,
      heal: def.combatStats?.heal || 0,
      energyCost: def.combatStats?.energyCost || 0,
      manaCost: def.combatStats?.manaCost || 0,
      triggerSpeed: def.combatStats?.triggerSpeed || 1.0,
      baseCooldownMs: def.combatStats?.baseCooldownMs || 5000,
    }

    // Apply additive buffs
    if (bonus?.buffs) {
      liveStats.damage += bonus.buffs.damage || 0
      liveStats.block += bonus.buffs.block || 0
      liveStats.heal += bonus.buffs.heal || 0
      liveStats.manaCost += bonus.buffs.manaCost || 0
      liveStats.energyCost += bonus.buffs.energyCost || 0
    }

    // Apply multipliers
    if (bonus?.multipliers) {
      if (bonus.multipliers.damage)
        liveStats.damage = Math.floor(
          liveStats.damage * bonus.multipliers.damage,
        )
      if (bonus.multipliers.block)
        liveStats.block = Math.floor(liveStats.block * bonus.multipliers.block)
      if (bonus.multipliers.heal)
        liveStats.heal = Math.floor(liveStats.heal * bonus.multipliers.heal)
      if (bonus.multipliers.triggerSpeed)
        liveStats.triggerSpeed *= bonus.multipliers.triggerSpeed
      if (bonus.multipliers.energyCost)
        liveStats.energyCost = Math.floor(liveStats.energyCost * bonus.multipliers.energyCost)
      if (bonus.multipliers.manaCost)
        liveStats.manaCost = Math.floor(liveStats.manaCost * bonus.multipliers.manaCost)
    }

    // Accumulate global passive stats from ALL items (weapons can have passives too)
    totalStats.maxHp += def.combatStats?.maxHp || 0
    totalStats.maxEnergy += def.combatStats?.maxEnergy || 0
    totalStats.energyRegen += def.combatStats?.energyRegen || 0
    totalStats.maxMana += def.combatStats?.maxMana || 0
    totalStats.manaRegen += def.combatStats?.manaRegen || 0
    totalStats.block += def.combatStats?.block || 0
    totalStats.healthRegen =
      (totalStats.healthRegen || 0) + (def.combatStats?.healthRegen || 0)
    
    // Trigger Speed multiplier only accumulates from PASSIVE items (like bags/charms)
    if (def.triggerType === "PASSIVE" || !def.triggerType) {
      totalStats.triggerSpeed *= def.combatStats?.triggerSpeed || 1.0
    }

    return { ...instance, liveStats }
  })

  return { stats: totalStats, itemsWithLiveStats }
}

/**
 * Helper to handle damage application, considering Block and defensive fallbacks.
 */
const applyDamage = (victim: CombatEntity, damage: number, events: string[]) => {
  let remainingDmg = damage

  // 1. Emergency Plating: Reduce damage if Energy is 0
  if (victim.energy < 1 && victim.inventory.some(i => i.itemId === "emergency_plating")) {
    remainingDmg = Math.max(0, remainingDmg - 5)
    events.push(`${victim.name}'s Emergency Plating mitigates 5 damage!`)
  }

  // 2. Mana Shield: Spend Mana to generate Block when hit
  if (remainingDmg > 0 && victim.mana >= 5 && victim.inventory.some(i => i.itemId === "mana_shield")) {
    victim.mana -= 5
    victim.block += 10
    events.push(`${victim.name}'s Mana Shield generates 10 Block!`)
  }

  // 3. Block absorption
  const absorbed = Math.min(victim.block, remainingDmg)
  victim.block -= absorbed
  remainingDmg -= absorbed

  if (remainingDmg <= 0) return

  // 4. HP damage with Spirit Link fallback
  const hasSpiritLink = victim.inventory.some((i) => i.itemId === "spirit_link")
  
  if (hasSpiritLink && victim.hp <= 1 && victim.mana > 0) {
    const manaDmg = remainingDmg
    victim.mana = Math.max(0, victim.mana - manaDmg)
    events.push(`${victim.name}'s Soul Guard absorbs ${Math.floor(manaDmg)} damage!`)
  } else {
    victim.hp -= remainingDmg
    if (victim.hp < 1 && hasSpiritLink && victim.mana > 0) {
      const overflow = 1 - victim.hp
      victim.hp = 1
      victim.mana = Math.max(0, victim.mana - overflow)
      events.push(`${victim.name}'s Spirit Link triggers! Mana consumed.`)
    }
  }
}

export const processCombatTick = (
  player: CombatEntity,
  enemy: CombatEntity,
  playerCooldowns: ItemCooldown[],
  enemyCooldowns: ItemCooldown[],
  deltaMs: number,
  elapsedTime: number,
): {
  player: CombatEntity
  enemy: CombatEntity
  playerCooldowns: ItemCooldown[]
  enemyCooldowns: ItemCooldown[]
  events: string[]
} => {
  const p = { ...player, statuses: [...player.statuses] }
  const e = { ...enemy, statuses: [...enemy.statuses] }
  const events: string[] = []

  // Block Decay (Depletes over time)
  const decayRate = 5
  const decay = (decayRate * deltaMs) / 1000
  p.block = Math.max(0, p.block - decay)
  e.block = Math.max(0, e.block - decay)

  // Dynamic Bridge Logic (Aura, Vitality, Adrenaline, Channeling)
  const processDynamicBridges = (entity: CombatEntity) => {
    const statusCount = entity.statuses.length
    if (statusCount === 0) return

    const inv = entity.inventory
    const deltaSec = deltaMs / 1000

    // Aura of Thorns
    if (inv.some(i => i.itemId === "aura_of_thorns")) {
      entity.block += (statusCount * 2 * deltaSec)
    }

    // Vitality Pulse
    if (inv.some(i => i.itemId === "vitality_pulse")) {
      entity.hp = Math.min(entity.maxHp, entity.hp + (statusCount * 1 * deltaSec))
    }

    // Adrenaline
    if (inv.some(i => i.itemId === "adrenaline")) {
      entity.energy = Math.min(entity.maxEnergy, entity.energy + (statusCount * 2 * deltaSec))
    }

    // Channeling
    if (inv.some(i => i.itemId === "channeling")) {
      entity.mana = Math.min(entity.maxMana, entity.mana + (statusCount * 1 * deltaSec))
    }
  }
  processDynamicBridges(p)
  processDynamicBridges(e)

  // Passive Regen
  if (p.stats.healthRegen)
    p.hp = Math.min(p.maxHp, p.hp + (p.stats.healthRegen * deltaMs) / 1000)

  // Energy Regen
  p.energy = Math.min(
    p.maxEnergy,
    p.energy + (p.stats.energyRegen * deltaMs) / 1000,
  )
  e.energy = Math.min(
    e.maxEnergy,
    e.energy + (e.stats.energyRegen * deltaMs) / 1000,
  )

  // Mana Regen
  p.mana = Math.min(p.maxMana, p.mana + (p.stats.manaRegen * deltaMs) / 1000)
  e.mana = Math.min(e.maxMana, e.mana + (e.stats.manaRegen * deltaMs) / 1000)

  // Tick Poison
  if (
    Math.floor(elapsedTime / 2000) > Math.floor((elapsedTime - deltaMs) / 2000)
  ) {
    const pPoison = p.statuses
      .filter((s) => s.type === "POISON")
      .reduce((sum, s) => sum + s.value, 0)
    if (pPoison > 0) p.hp = Math.max(0, p.hp - pPoison)

    const ePoison = e.statuses
      .filter((s) => s.type === "POISON")
      .reduce((sum, s) => sum + s.value, 0)
    if (ePoison > 0) e.hp = Math.max(0, e.hp - ePoison)
  }

  // Process Actions
  const updateCooldowns = (
    entity: CombatEntity,
    target: CombatEntity,
    cds: ItemCooldown[],
  ): ItemCooldown[] => {
    return cds.map((cd): ItemCooldown => {
      const instance = entity.inventory.find(
        (i) => i.instanceId === cd.instanceId,
      )
      const liveStats = instance?.liveStats
      const triggerSpeed = liveStats?.triggerSpeed || 1.0
      const current = cd.current - deltaMs * triggerSpeed

      if (current <= 0) {
        const def = ITEMS[cd.itemId]
        if (!liveStats || def.triggerType === "PASSIVE")
          return { ...cd, current: cd.max }

        let energyCost = liveStats.energyCost || 0
        const manaCost = liveStats.manaCost || 0
        let success = true

        if (entity.energy < energyCost) {
          const hasArcaneBattery = entity.inventory.some(i => i.itemId === "arcane_battery")
          const hasBloodMagic = entity.inventory.some(i => i.itemId === "blood_magic")

          if (hasArcaneBattery && entity.mana >= energyCost * 2) {
            entity.mana -= (energyCost * 2)
            energyCost = 0
            events.push(`${entity.name} uses Arcane Overflow!`)
          } else if (hasBloodMagic && entity.hp > (entity.maxHp * 0.05) + 1) {
            const bloodCost = entity.maxHp * 0.05
            entity.hp -= bloodCost
            energyCost = 0
            events.push(`${entity.name} uses Blood Trigger!`)
          } else {
            success = false
          }
        }

        if (success && entity.mana < manaCost) {
           success = false
        }

        if (!success) return { ...cd, current: 0 }

        entity.energy -= energyCost
        entity.mana -= manaCost

        if (def.triggerType === "ATTACK") {
          const dmg = liveStats.damage || 0
          applyDamage(target, dmg, events)
          
          if (entity.inventory.some(i => i.itemId === "vampiric_fangs")) {
            const heal = dmg * 0.2
            entity.hp = Math.min(entity.maxHp, entity.hp + heal)
          }

          if (dmg > 0)
            events.push(
              `${entity.name} hits for ${Math.floor(dmg)}!`,
            )
        } else if (def.triggerType === "HEAL") {
          entity.hp = Math.min(entity.maxHp, entity.hp + (liveStats.heal || 0))
          events.push(`${entity.name} heals for ${liveStats.heal}!`)
        } else if (def.triggerType === "SHIELD") {
          entity.block += liveStats.block || 0
          events.push(`${entity.name} adds ${liveStats.block} block!`)
        }

        return {
          ...cd,
          current: cd.max,
          lastTrigger: { type: "SUCCESS" as const, timestamp: elapsedTime },
        }
      }
      return { ...cd, current }
    })
  }

  const nextPlayerCooldowns = updateCooldowns(p, e, playerCooldowns)
  const nextEnemyCooldowns = updateCooldowns(e, p, enemyCooldowns)

  return {
    player: p,
    enemy: e,
    playerCooldowns: nextPlayerCooldowns,
    enemyCooldowns: nextEnemyCooldowns,
    events,
  }
}

/**
 * Shared logic to simulate a full combat encounter without real-time delays.
 */
export const simulateCombat = (
  player: CombatEntity,
  enemy: CombatEntity,
  maxTicks = 2000,
): { winner: "PLAYER" | "ENEMY" | "DRAW"; events: string[] } => {
  let p = { ...player }
  let e = { ...enemy }
  const allEvents: string[] = []

  const initCDs = (entity: CombatEntity): ItemCooldown[] =>
    entity.inventory
      .filter((inst) => ITEMS[inst.itemId].triggerType !== "PASSIVE")
      .map((inst) => {
        const baseCD = inst.liveStats?.baseCooldownMs || 5000
        return {
          instanceId: inst.instanceId,
          itemId: inst.itemId,
          current: 0,
          max: baseCD,
          baseMax: baseCD,
        }
      })

  let pCooldowns = initCDs(p)
  let eCooldowns = initCDs(e)

  const TICK_MS = 100
  let time = 0

  for (let i = 0; i < maxTicks; i++) {
    const result = processCombatTick(
      p,
      e,
      pCooldowns,
      eCooldowns,
      TICK_MS,
      time,
    )
    p = result.player
    e = result.enemy
    pCooldowns = result.playerCooldowns
    eCooldowns = result.enemyCooldowns
    allEvents.push(...result.events)
    time += TICK_MS

    if (e.hp <= 0) return { winner: "PLAYER", events: allEvents }
    if (p.hp <= 0) return { winner: "ENEMY", events: allEvents }
  }

  return { winner: "DRAW", events: allEvents }
}

export type EnemyType =
  | "AGGRESSIVE"
  | "DEFENSIVE"
  | "SWARM"
  | "EVASIVE"
  | "BOSS"

export const generateEnemy = (
  _type: EnemyType,
  difficulty: number,
): CombatEntity => {
  const enemyId = `enemy-${Math.random().toString(36).substr(2, 9)}`

  // Give enemy a basic weapon
  const inventory: InventoryItemInstance[] = [
    {
      instanceId: "enemy-attack",
      itemId: "dagger",
      x: 0,
      y: 0,
      rotation: 0,
      ownerId: enemyId,
    },
  ]

  const enemy = createCombatEntity(enemyId, "Enemy", inventory)

  // Scale stats based on difficulty
  enemy.hp = 50 + difficulty * 15
  enemy.maxHp = enemy.hp
  enemy.stats.damage += difficulty * 2

  return enemy
}

export const calculateCombatPower = (
  items: InventoryItemInstance[],
): number => {
  const { stats } = calculatePlayerCombatInfo(items)
  return Math.floor(stats.damage + stats.block + stats.maxHp / 10)
}
