import { DEFAULT_BLOCK_DECAY, DEFAULT_VULNERABILITY_FACTOR } from "./constants"

/**
 * PACK CAREFULLY: BALANCING UTILITIES
 *
 * Target Ratios (Efficiency Era):
 * COMMON: 6.0 DPS / 20.0 EPS (or MPS)
 * UNCOMMON: 10.0 DPS / 35.0 EPS
 * RARE: 18.0 DPS / 60.0 EPS
 */

interface WeaponBalanceParams {
  dps: number
  eps?: number
  mps?: number
  baseCooldown?: number
  energyCost?: number
  manaCost?: number
}

interface BlockBalanceParams {
  targetEps: number // Sustainable EPS (Below 15.0 Regen)
  baseCooldown: number
  vulnerabilityFactor?: number
}

/**
 * Calculates weapon stats based on target DPS and resource rates.
 */
export const calcWeaponStats = ({
  dps,
  eps,
  mps,
  baseCooldown,
  energyCost,
  manaCost,
}: WeaponBalanceParams) => {
  const targetRate = eps || mps || 20.0

  let finalCD = baseCooldown || 1.0
  let finalResource = energyCost ?? manaCost ?? finalCD * targetRate

  if (energyCost !== undefined || manaCost !== undefined) {
    const cost = energyCost ?? (manaCost as number)
    finalCD = Number((cost / targetRate).toFixed(2))
    finalResource = cost
  } else if (baseCooldown !== undefined) {
    finalResource = Number((baseCooldown * targetRate).toFixed(1))
    finalCD = baseCooldown
  }

  if (finalResource > 100) {
    const ratio = finalResource / 100
    finalResource = 100
    finalCD = Number((finalCD * ratio).toFixed(2))
  }

  const finalDamage = Number((finalCD * dps).toFixed(1))

  return {
    damage: finalDamage,
    energyCost: eps !== undefined ? finalResource : 0,
    manaCost: mps !== undefined ? finalResource : 0,
    baseCooldown: finalCD,
  }
}

/**
 * Calculates block stats with forced vulnerability windows.
 */
export const calcBlockStats = ({
  targetEps,
  baseCooldown,
  vulnerabilityFactor = DEFAULT_VULNERABILITY_FACTOR,
}: BlockBalanceParams) => {
  const energyCost = Number((baseCooldown * targetEps).toFixed(1))
  const protectedTime = baseCooldown * (1 - vulnerabilityFactor)
  const blockValue = Math.floor(protectedTime * DEFAULT_BLOCK_DECAY)

  return {
    block: blockValue,
    energyCost: energyCost,
    baseCooldown: baseCooldown,
  }
}

export const TIER_TARGETS = {
  COMMON: { dps: 6.0, eps: 20.0, mps: 20.0, blockEps: 4.0 },
  UNCOMMON: { dps: 10.0, eps: 35.0, mps: 35.0, blockEps: 6.0 },
  RARE: { dps: 18.0, eps: 60.0, mps: 60.0, blockEps: 10.0 },
  LEGENDARY: { dps: 30.0, eps: 100.0, mps: 100.0, blockEps: 15.0 },
}
