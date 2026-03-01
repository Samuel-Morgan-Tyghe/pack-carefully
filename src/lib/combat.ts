import { $gameState } from "../store/gameStore"
import type {
  CombatEntity,
  CombatStats,
  Container,
  InventoryItemInstance,
  ItemCooldown,
  StatusEffect,
} from "../types"
import { type AdjacencyResult, getAdjacencyBonuses } from "./adjacency"
import { DEFAULT_ENERGY_REGEN, DEFAULT_MANA_REGEN } from "./constants"
import { generateRandomContainers } from "./generators"
import { ITEMS } from "./items/items"
import { generateId } from "./utils"

/**
 * Groups duplicate status effects by type and sums their values.
 */
export const groupStatusEffects = (
  statuses: StatusEffect[],
): StatusEffect[] => {
  const grouped: Record<string, number> = {}
  for (const s of statuses) {
    if (!s) continue
    grouped[s.type] = (grouped[s.type] || 0) + s.value
  }
  return Object.entries(grouped).map(([type, value]) => ({
    type: type as any,
    value,
  }))
}

/**
 * Unified factory to create a CombatEntity from inventory items.
 */
export const createCombatEntity = (
  id: string,
  name: string,
  items: InventoryItemInstance[],
  containers: Container[] = [], // Optional containers
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
    containers,
    battleStats: {},
  }
}

export const calculatePlayerCombatInfo = (
  items: InventoryItemInstance[],
): {
  stats: CombatStats
  itemsWithLiveStats: InventoryItemInstance[]
  bonusesMap: Record<string, AdjacencyResult>
} => {
  console.log(
    `[Combat] calculatePlayerCombatInfo START (${items.length} items)`,
  )
  const totalStats: CombatStats = {
    damage: 0,
    block: 0,
    heal: 0,
    maxHp: 100, // Base HP
    healthRegen: 0,
    maxMana: 100, // Balanced with HP and Energy
    manaRegen: DEFAULT_MANA_REGEN,
    maxEnergy: 100, // Base Energy
    energyRegen: DEFAULT_ENERGY_REGEN,
    triggerSpeed: 1.0, // Default multiplier
  }

  const bonusesMap = getAdjacencyBonuses(items)

  const itemsWithLiveStats = items
    .filter((instance) => {
      const exists = !!ITEMS[instance.itemId]
      if (!exists)
        console.warn(
          `[Combat] Skipping item with unknown ID: ${instance.itemId}`,
        )
      return exists
    })
    .map((instance) => {
      const def = ITEMS[instance.itemId]
      const bonus = bonusesMap[instance.instanceId]

      // Base stats from item definition
      const baseEffects = def.effects ? [...def.effects] : []
      const liveStats = {
        damage: def.combatStats?.damage || 0,
        block: def.combatStats?.block || 0,
        heal: def.combatStats?.heal || 0,
        spikes: def.combatStats?.spikes || 0,
        energyCost: def.combatStats?.energyCost || 0,
        manaCost: def.combatStats?.manaCost || 0,
        triggerSpeed: def.combatStats?.triggerSpeed || 1.0,
        baseCooldown: def.combatStats?.baseCooldown || 5.0, // ALREADY IN SECONDS
        effects: baseEffects as {
          type: string
          value: number
          chance?: number
        }[],
      }

      // Apply additive buffs
      if (bonus?.buffs) {
        liveStats.damage += bonus.buffs.damage || 0
        liveStats.block += bonus.buffs.block || 0
        liveStats.heal += bonus.buffs.heal || 0
        liveStats.spikes += bonus.buffs.spikes || 0
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
          liveStats.block = Math.floor(
            liveStats.block * bonus.multipliers.block,
          )
        if (bonus.multipliers.heal)
          liveStats.heal = Math.floor(liveStats.heal * bonus.multipliers.heal)
        if (bonus.multipliers.triggerSpeed)
          liveStats.triggerSpeed *= bonus.multipliers.triggerSpeed
        if (bonus.multipliers.energyCost)
          liveStats.energyCost = Math.floor(
            liveStats.energyCost * bonus.multipliers.energyCost,
          )
        if (bonus.multipliers.manaCost)
          liveStats.manaCost = Math.floor(
            liveStats.manaCost * bonus.multipliers.manaCost,
          )
      }
      // Merge adjacency-granted effects into liveStats.effects
      if (bonus?.effects && bonus.effects.length > 0) {
        for (const eff of bonus.effects) {
          const existing = liveStats.effects.find((e) => e.type === eff.type)
          if (existing) {
            existing.value += eff.value // stack values
          } else {
            liveStats.effects.push({ ...eff })
          }
        }
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

      // Calculate derived rates (DPS, EPS, MPS)
      const cooldown = liveStats.baseCooldown / liveStats.triggerSpeed
      const dps = Number((liveStats.damage / cooldown).toFixed(1))
      const eps = Number((liveStats.energyCost / cooldown).toFixed(1))
      const mps = Number((liveStats.manaCost / cooldown).toFixed(1))

      return {
        ...instance,
        liveStats: {
          ...liveStats,
          dps,
          eps,
          mps,
        },
      }
    })

  return { stats: totalStats, itemsWithLiveStats, bonusesMap }
}

/**
 * Helper to handle damage application, considering Block and defensive fallbacks.
 */
const applyDamage = (
  victim: CombatEntity,
  damage: number,
  events: string[],
  attacker?: CombatEntity,
) => {
  let remainingDmg = damage

  // Reactive Effects (When victim is hit)
  if (attacker && damage > 0) {
    // 1. Reactive Spikes
    let totalSpikes = 0
    let spikeSourceId: string | undefined
    for (const inst of victim.inventory) {
      const spikes = inst.liveStats?.spikes || 0
      if (spikes > 0) {
        totalSpikes += spikes
        spikeSourceId = inst.instanceId
      }
    }
    if (totalSpikes > 0) {
      // Attacker takes spike damage
      attacker.hp = Math.max(0, attacker.hp - totalSpikes)
      if (spikeSourceId) {
        if (!victim.battleStats[spikeSourceId]) {
          victim.battleStats[spikeSourceId] = {
            damageDealt: 0,
            blockGenerated: 0,
            damageMitigated: 0,
            healsDone: 0,
            timesTriggered: 0,
          }
        }
        victim.battleStats[spikeSourceId].damageDealt += totalSpikes
      }
      events.push(
        `${attacker.name} takes ${totalSpikes} reactive spike damage!`,
      )
    }

    // 2. Reactive Status Effects
    for (const inst of victim.inventory) {
      const def = ITEMS[inst.itemId]
      if (def?.triggerType === "SHIELD" && def.effects) {
        for (const effect of def.effects) {
          const roll = Math.random() * 100
          if (roll <= (effect.chance ?? 100)) {
            attacker.statuses.push({
              type: effect.type,
              value: effect.value,
              sourceId: inst.instanceId,
            })
            events.push(
              `${attacker.name} is chilled by ${victim.name}'s shield!`,
            )
          }
        }
      }
    }
  }

  // 1. Emergency Plating: Reduce damage if Energy is 0 (Balanced with internal cooldown simulation)
  const plating = victim.inventory.find((i) => i.itemId === "emergency_plating")
  if (victim.energy < 1 && plating) {
    const mitigation = 8
    const finalMitigated = Math.min(mitigation, remainingDmg)
    remainingDmg = Math.max(0, remainingDmg - mitigation)

    if (!victim.battleStats[plating.instanceId]) {
      victim.battleStats[plating.instanceId] = {
        damageDealt: 0,
        blockGenerated: 0,
        damageMitigated: 0,
        healsDone: 0,
        timesTriggered: 0,
      }
    }
    victim.battleStats[plating.instanceId].damageMitigated += finalMitigated
    events.push(
      `${victim.name}'s Emergency Plating mitigates ${finalMitigated} damage!`,
    )
  }

  // 2. Mana Shield: Spend Mana to generate Block when hit (Balanced: higher mana cost)
  const manaShield = victim.inventory.find((i) => i.itemId === "mana_shield")
  if (remainingDmg > 0 && victim.mana >= 25 && manaShield) {
    victim.mana -= 25
    const shieldAmount = 15
    victim.block += shieldAmount

    if (!victim.battleStats[manaShield.instanceId]) {
      victim.battleStats[manaShield.instanceId] = {
        damageDealt: 0,
        blockGenerated: 0,
        damageMitigated: 0,
        healsDone: 0,
        timesTriggered: 0,
      }
    }
    victim.battleStats[manaShield.instanceId].blockGenerated += shieldAmount
    victim.battleStats[manaShield.instanceId].timesTriggered += 1
    events.push(
      `${victim.name}'s Mana Shield consumes 25 mana for ${shieldAmount} Block!`,
    )
  }

  // 3. Block absorption
  const absorbed = Math.min(victim.block, remainingDmg)
  victim.block -= absorbed
  remainingDmg -= absorbed

  if (remainingDmg <= 0) return

  // 4. HP damage with Spirit Link fallback
  const hasSpiritLink = victim.inventory.some((i) => i.itemId === "spirit_link")

  victim.hp -= remainingDmg

  if (victim.hp < 1 && hasSpiritLink) {
    const manaNeeded = 1 - victim.hp
    if (victim.mana >= manaNeeded) {
      victim.mana -= manaNeeded
      victim.hp = 1
      events.push(`${victim.name}'s Spirit Link triggers! Mana consumed.`)
    } else {
      victim.hp = Math.max(0, victim.hp)
    }
  } else {
    victim.hp = Math.max(0, victim.hp)
  }
}

export const processCombatTick = (
  player: CombatEntity,
  enemy: CombatEntity,
  playerCooldowns: ItemCooldown[],
  enemyCooldowns: ItemCooldown[],
  deltaMs: number,
  elapsedTimeSec: number,
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
  const deltaSec = deltaMs / 1000

  // Block Decay (Depletes over time)
  const decayRate = $gameState.get().blockDecayRate
  const decay = decayRate * deltaSec
  p.block = Math.max(0, p.block - decay)
  e.block = Math.max(0, e.block - decay)

  // Dynamic Bridge Logic (Aura, Vitality, Adrenaline, Channeling)
  const processDynamicBridges = (entity: CombatEntity) => {
    const statusCount = entity.statuses.length
    if (statusCount === 0) return

    const inv = entity.inventory

    // Aura of Thorns
    if (inv.some((i) => i.itemId === "aura_of_thorns")) {
      entity.block += statusCount * 2 * deltaSec
    }

    // Vitality Pulse
    if (inv.some((i) => i.itemId === "vitality_pulse")) {
      entity.hp = Math.min(entity.maxHp, entity.hp + statusCount * 1 * deltaSec)
    }

    // Adrenaline
    if (inv.some((i) => i.itemId === "adrenaline")) {
      entity.energy = Math.min(
        entity.maxEnergy,
        entity.energy + statusCount * 2 * deltaSec,
      )
    }

    // Channeling
    if (inv.some((i) => i.itemId === "channeling")) {
      entity.mana = Math.min(
        entity.maxMana,
        entity.mana + statusCount * 1 * deltaSec,
      )
    }
  }
  processDynamicBridges(p)
  processDynamicBridges(e)

  // Passive Regen
  if (p.stats.healthRegen)
    p.hp = Math.min(p.maxHp, p.hp + p.stats.healthRegen * deltaSec)

  // Energy Regen
  p.energy = Math.min(p.maxEnergy, p.energy + p.stats.energyRegen * deltaSec)
  e.energy = Math.min(e.maxEnergy, e.energy + e.stats.energyRegen * deltaSec)

  // Mana Regen
  p.mana = Math.min(p.maxMana, p.mana + p.stats.manaRegen * deltaSec)
  e.mana = Math.min(e.maxMana, e.mana + e.stats.manaRegen * deltaSec)

  // Tick Status Effects (Every 2 seconds)
  if (
    Math.floor(elapsedTimeSec / 2) > Math.floor((elapsedTimeSec - deltaSec) / 2)
  ) {
    // 1. POISON (Hits HP ONLY when Block is 0)
    const pPoison = p.statuses
      .filter((s) => s.type === "POISON")
      .reduce((sum, s) => sum + s.value, 0)
    if (pPoison > 0 && p.block <= 0) p.hp = Math.max(0, p.hp - pPoison)

    const ePoison = e.statuses
      .filter((s) => s.type === "POISON")
      .reduce((sum, s) => sum + s.value, 0)
    if (ePoison > 0 && e.block <= 0) e.hp = Math.max(0, e.hp - ePoison)

    // 2. FIRE (Burns Block)
    const pFire = p.statuses
      .filter((s) => s.type === "FIRE")
      .reduce((sum, s) => sum + s.value, 0)
    if (pFire > 0) p.block = Math.max(0, p.block - pFire)

    const eFire = e.statuses
      .filter((s) => s.type === "FIRE")
      .reduce((sum, s) => sum + s.value, 0)
    if (eFire > 0) e.block = Math.max(0, e.block - eFire)
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
      let triggerSpeed = liveStats?.triggerSpeed || 1.0

      // SLOW logic: Each stack of SLOW reduces trigger speed by 5% (capped at 50%)
      const slowStacks = entity.statuses
        .filter((s) => s.type === "SLOW")
        .reduce((sum, s) => sum + s.value, 0)
      if (slowStacks > 0) {
        const slowPenalty = Math.min(0.5, slowStacks * 0.05)
        triggerSpeed *= 1 - slowPenalty
      }

      const current = cd.current - deltaSec * triggerSpeed

      if (current <= 0) {
        const def = ITEMS[cd.itemId]
        if (!liveStats || def.triggerType === "PASSIVE")
          return { ...cd, current: cd.max }

        let energyCost = liveStats.energyCost || 0
        const manaCost = liveStats.manaCost || 0
        let success = true

        if (entity.energy < energyCost) {
          const hasArcaneBattery = entity.inventory.some(
            (i) => i.itemId === "arcane_battery",
          )
          const hasBloodMagic = entity.inventory.some(
            (i) => i.itemId === "blood_magic",
          )

          if (hasArcaneBattery && entity.mana >= energyCost * 2) {
            entity.mana -= energyCost * 2
            energyCost = 0
            events.push(`${entity.name} uses Arcane Overflow!`)
          } else if (hasBloodMagic && entity.hp > entity.maxHp * 0.05 + 1) {
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

        // HEAL NO-OP CHECK: Do not consume resources if healing is redundant
        if (
          success &&
          def.triggerType === "HEAL" &&
          entity.hp >= entity.maxHp
        ) {
          return {
            ...cd,
            current: cd.max,
            lastTrigger: {
              type: "SUCCESS" as const,
              timestamp: elapsedTimeSec,
            },
          }
        }

        // COOLDOWN RESET LOGIC: Always reset cooldown, even on failure
        if (!success) {
          events.push(`${entity.name}'s ${def.name} failed (Low Resource)!`)
          return {
            ...cd,
            current: cd.max, // Reset to full cooldown even if failed
            lastTrigger: {
              type: "FAIL_ENERGY" as const,
              timestamp: elapsedTimeSec,
            },
          }
        }

        entity.energy -= energyCost
        entity.mana -= manaCost

        // Initialize item battle stats if missing
        if (!entity.battleStats[cd.instanceId]) {
          entity.battleStats[cd.instanceId] = {
            damageDealt: 0,
            blockGenerated: 0,
            damageMitigated: 0,
            healsDone: 0,
            timesTriggered: 0,
          }
        }
        entity.battleStats[cd.instanceId].timesTriggered++

        if (def.triggerType === "ATTACK") {
          const dmg = liveStats.damage || 0
          applyDamage(target, dmg, events, entity)
          entity.battleStats[cd.instanceId].damageDealt += dmg

          if (entity.inventory.some((i) => i.itemId === "vampiric_fangs")) {
            const heal = dmg * 0.2
            const oldHp = entity.hp
            entity.hp = Math.min(entity.maxHp, entity.hp + heal)
            entity.battleStats[cd.instanceId].healsDone += entity.hp - oldHp
          }

          if (dmg > 0)
            events.push(`${entity.name} hits for ${Math.floor(dmg)}!`)

          // Apply on-hit effects: from item definition + adjacency-granted effects
          const allEffects = [
            ...(def.effects || []),
            ...(liveStats.effects?.filter(
              (e) => !def.effects?.some((d) => d.type === e.type),
            ) || []),
          ]
          if (allEffects.length > 0) {
            for (const effect of allEffects) {
              const roll = Math.random() * 100
              if (roll <= (effect.chance ?? 100)) {
                target.statuses.push({
                  type: effect.type as any,
                  value: effect.value,
                  sourceId: cd.instanceId,
                })
                events.push(`${target.name} is afflicted with ${effect.type}!`)
              }
            }
          }
        } else if (def.triggerType === "HEAL") {
          const healAmount = liveStats.heal || 0
          const oldHp = entity.hp
          entity.hp = Math.min(entity.maxHp, entity.hp + healAmount)
          entity.battleStats[cd.instanceId].healsDone += entity.hp - oldHp
          events.push(`${entity.name} heals for ${healAmount}!`)
        } else if (def.triggerType === "SHIELD") {
          const blockAmount = liveStats.block || 0
          entity.block += blockAmount
          entity.battleStats[cd.instanceId].blockGenerated += blockAmount
          events.push(`${entity.name} adds ${blockAmount} block!`)
          // Apply shield-on-hit effects (adjacency-granted effects on SHIELD items)
          const shieldEffects = [
            ...(def.effects || []),
            ...(liveStats.effects?.filter(
              (e) => !def.effects?.some((d) => d.type === e.type),
            ) || []),
          ]
          for (const effect of shieldEffects) {
            const roll = Math.random() * 100
            if (roll <= (effect.chance ?? 100)) {
              target.statuses.push({
                type: effect.type as any,
                value: effect.value,
                sourceId: cd.instanceId,
              })
              events.push(
                `${target.name} is chilled by ${entity.name}'s shield!`,
              )
            }
          }
        }

        // Apply COOLDOWN JITTER (±12.5% of max)
        const jitterMultiplier = 0.875 + Math.random() * 0.25
        const nextMax = cd.max * jitterMultiplier

        return {
          ...cd,
          current: nextMax,
          lastTrigger: { type: "SUCCESS" as const, timestamp: elapsedTimeSec },
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
        const baseCD = inst.liveStats?.baseCooldown || 5.0
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

  const TICK_SEC = 0.1
  let time = 0

  for (let i = 0; i < maxTicks; i++) {
    const result = processCombatTick(
      p,
      e,
      pCooldowns,
      eCooldowns,
      TICK_SEC * 1000,
      time,
    )
    p = result.player
    e = result.enemy
    pCooldowns = result.playerCooldowns
    eCooldowns = result.enemyCooldowns
    allEvents.push(...result.events)
    time += TICK_SEC

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

/**
 * Generates an enemy with a unique name, health, and its own randomized bag layout and items.
 */
export const generateEnemy = (
  type: EnemyType,
  difficulty: number,
): CombatEntity => {
  const enemyId = generateId()

  // 1. Generate unique bag for the enemy (size scales slightly with difficulty)
  const containers = generateRandomContainers(enemyId)

  // 2. Determine archetype items - items now scale based on difficulty
  const archetypes: Record<
    EnemyType,
    { name: string; items: string[]; hpScale: number }
  > = {
    AGGRESSIVE: {
      name: "Savage Marauder",
      items: ["dagger", "hatchet"],
      hpScale: 1.0,
    },
    DEFENSIVE: {
      name: "Shield Bearer",
      items: ["wooden_shield", "dagger"],
      hpScale: 1.5,
    },
    SWARM: {
      name: "Rat King",
      items: ["dagger", "dagger", "dagger"],
      hpScale: 0.8,
    },
    EVASIVE: {
      name: "Forest Stalker",
      items: ["dagger", "wand_of_sparking"],
      hpScale: 1.2,
    },
    BOSS: {
      name: "The Golem",
      items: ["warhammer", "wooden_shield", "emergency_plating"],
      hpScale: 3.5,
    },
  }

  const arc = archetypes[type] || archetypes.AGGRESSIVE
  const itemsToAdd = [...arc.items]

  // Add extra items based on difficulty
  if (difficulty >= 2) {
    if (type === "AGGRESSIVE") itemsToAdd.push("dagger")
    if (type === "DEFENSIVE") itemsToAdd.push("wooden_shield")
    if (type === "SWARM") itemsToAdd.push("dagger")
    if (type === "EVASIVE") itemsToAdd.push("wand_of_sparking")
    if (type === "BOSS") itemsToAdd.push("spiked_collar")
  }
  if (difficulty >= 4) {
    if (type === "AGGRESSIVE") itemsToAdd.push("hatchet")
    if (type === "DEFENSIVE") itemsToAdd.push("emergency_plating")
    if (type === "SWARM") itemsToAdd.push("vampiric_fangs")
    if (type === "EVASIVE") itemsToAdd.push("mana_shield")
    if (type === "BOSS") itemsToAdd.push("warhammer")
  }

  const inventory: InventoryItemInstance[] = []

  // 3. Simple greedy placement for enemy items in their bag
  const bagCells = containers[0].cells
  let cellIdx = 0

  for (const itemId of itemsToAdd) {
    if (cellIdx < bagCells.length) {
      const cell = bagCells[cellIdx]
      inventory.push({
        instanceId: generateId(),
        itemId,
        x: cell.x,
        y: cell.y,
        rotation: 0,
        ownerId: enemyId,
      })
      cellIdx += 1 // Tighter placement
    }
  }

  const enemy = createCombatEntity(enemyId, arc.name, inventory, containers)

  // 4. Enhanced Scaling Logic
  // HP Scales: Base 60 + 15 per difficulty level (Day)
  enemy.hp = Math.floor((60 + difficulty * 15) * arc.hpScale)
  if (type === "BOSS") enemy.hp *= 1.5 // Extra boss buffer
  enemy.maxHp = enemy.hp

  // Stats Scaling
  enemy.stats.maxEnergy = 100 + difficulty * 30
  enemy.maxEnergy = enemy.stats.maxEnergy
  enemy.energy = enemy.stats.maxEnergy
  enemy.stats.energyRegen += difficulty * 1

  enemy.stats.maxMana = 100 + difficulty * 25
  enemy.maxMana = enemy.stats.maxMana
  enemy.mana = enemy.stats.maxMana
  enemy.stats.manaRegen += difficulty * 1

  enemy.stats.triggerSpeed = 1.0 + difficulty * 0.05 // Up to 25% faster actions at Day 5

  // Damage scaling applied to individual items for better granularity
  for (const inst of enemy.inventory) {
    if (inst.liveStats) {
      if (inst.liveStats.damage !== undefined) {
        inst.liveStats.damage = Math.floor(
          inst.liveStats.damage * (1 + difficulty * 0.1),
        )
      }
      if (inst.liveStats.block !== undefined) {
        inst.liveStats.block = Math.floor(
          inst.liveStats.block * (1 + difficulty * 0.1),
        )
      }
    }
  }

  // 5. Themed Buffs based on archetype and difficulty
  if (difficulty >= 2) {
    if (type === "AGGRESSIVE") {
      enemy.statuses.push({ type: "FIRE", value: difficulty - 1 })
    } else if (type === "DEFENSIVE") {
      enemy.block += 15 * difficulty
    } else if (type === "SWARM") {
      enemy.stats.triggerSpeed += 0.05 * difficulty
    } else if (type === "EVASIVE") {
      enemy.stats.triggerSpeed += 0.1 * difficulty
    }
  }

  return enemy
}

export const calculateCombatPower = (
  items: InventoryItemInstance[],
): number => {
  const { stats } = calculatePlayerCombatInfo(items)
  return Math.floor(stats.damage + stats.block + stats.maxHp / 10)
}
