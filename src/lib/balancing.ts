/**
 * PACK CAREFULLY: BALANCING UTILITIES
 *
 * Target Ratios:
 * COMMON: 10 DPS / 35 EPS (or MPS)
 * UNCOMMON: 18 DPS / 60 EPS
 * RARE: 30 DPS / 100 EPS
 *
 * Rules: energyCost <= 100, manaCost <= 100
 */

interface WeaponBalanceParams {
  dps: number
  eps?: number // Energy Per Second
  mps?: number // Mana Per Second
  baseCooldown?: number
  energyCost?: number
  manaCost?: number
}

/**
 * Calculates weapon stats based on target DPS and a primary resource rate (EPS or MPS).
 */
export const calcWeaponStats = ({
  dps,
  eps,
  mps,
  baseCooldown,
  energyCost,
  manaCost,
}: WeaponBalanceParams) => {
  // Use either EPS or MPS as the primary resource rate
  const targetRate = eps || mps || 35.0

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

  // Cap logic: Ensure resource usage does not exceed 100
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

export const TIER_TARGETS = {
  COMMON: { dps: 10, eps: 35, mps: 35 },
  UNCOMMON: { dps: 18, eps: 60, mps: 60 },
  RARE: { dps: 30, eps: 100, mps: 100 },
  LEGENDARY: { dps: 45, eps: 150, mps: 150 },
}
