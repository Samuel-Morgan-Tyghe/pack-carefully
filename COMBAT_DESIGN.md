# Combat Design & Balancing Engine

This document defines the mathematical foundation and behavioral logic for the Pack Carefully combat system.

## 1. Resource Architecture (The "Rule of 100")

The engine maintains a 1:1:1 parity between three core pools to ensure predictability.

*   **Base HP**: 100
*   **Base Energy**: 100
*   **Base Mana**: 100

### Regeneration Baselines (Efficiency Era)
*   **Energy Regen**: 15.0 per second. 
*   **Mana Regen**: 5.0 per second.
*   **Block Decay**: 5.0 per second.

---

## 2. The Balancing Ratio (6 / 20)

All active items are calibrated against a model that prioritizes sustainability over pure friction.

### Weapons (The "Sprint" Model)
1.  **Baseline DPS**: 6.0 (Damage Per Second).
2.  **Baseline EPS/MPS**: 20.0 (Resource Usage Per Second).
3.  **Efficiency Factor**: 0.75x. (Regen covers 75% of a baseline weapon's cost).

### Defense (The "Sustainable" Model)
Shields are designed to be run indefinitely without starving your weapons.
1.  **Target EPS**: 4.0 - 10.0 EPS (Below the 15.0 Energy Regen baseline).
2.  **Vulnerability Rule**: A single shield must hit **0 Block for a period of its cooldown cycle** (Default: 10%).
    *   *Calculation*: `Block = DecayRate * (Cooldown * (1 - DEFAULT_VULNERABILITY_FACTOR))`
    *   *Goal*: This ensures that even high-tier shields cannot provide 100% protection uptime, forcing HP damage through the gaps unless synergies (Trigger Speed) are used.
3.  **Cooldown Architecture**: Long cooldowns (3s - 8s) with large block chunks to emphasize the impact of decay over time.

---

## 3. Time Metrics (Baseline)
*   **Time to Kill (TTK)**: 100 / 6.0 = **16.6 seconds**.
*   **Time to Exhaustion (TTE)**: 100 / (20.0 - 15.0) = **20.0 seconds**.

**Goal**: Combat is now slower and more strategic. Since TTE is slightly longer than TTK, a well-managed bag can sustain continuous pressure, but using multiple weapons or high-tier gear will quickly lead to misfires.

### Tier Targets
| Tier | Target DPS | Target EPS/MPS | Sustained Usage |
| :--- | :--- | :--- | :--- |
| **Common** | 6.0 | 20.0 | ~20s |
| **Uncommon** | 10.0 | 35.0 | ~5s |
| **Rare** | 18.0 | 60.0 | ~2s |
| **Legendary** | 30.0+ | 100.0 | Burst/Exhaustion |

---

## 4. Trigger & Cooldown Logic

### Cooldown Failure (Resource Awareness)
Items do not wait at 0 cooldown for resources.
*   **If Resource < Cost**: The item "misfires," logs a failure, and **instantly resets its full cooldown cycle**.

### Efficient Healing (No-Op Logic)
*   **If HP == MaxHP**: The item triggers its cooldown reset but **consumes 0 Energy/Mana**.

---

## 5. Calculations & Unit Metrics

All engine math is strictly based on **Seconds**.

*   **DPS** = `Damage / (BaseCooldown / TriggerSpeed)`
*   **EPS** = `EnergyCost / (BaseCooldown / TriggerSpeed)`
*   **MPS** = `ManaCost / (BaseCooldown / TriggerSpeed)`
