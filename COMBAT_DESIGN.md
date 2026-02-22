# Combat Design & Balancing Engine

This document defines the mathematical foundation and behavioral logic for the Pack Carefully combat system.

## 1. Resource Architecture (The "Rule of 100")

The engine maintains a 1:1:1 parity between three core pools to ensure predictability and intuitive balancing.

*   **Base HP**: 100
*   **Base Energy**: 100
*   **Base Mana**: 100

### Regeneration Baselines
*   **Energy Regen**: 11.6 per second (~12 EPS). Sustains 33% of a baseline weapon's cost.
*   **Mana Regen**: 3.3 per second (~3.3 MPS). Slower recovery for high-impact magical utility.

---

## 2. The Balancing Ratio (10 / 35)

All active items (Attacks, Shields, Heals) are calibrated against a high-friction resource model.

1.  **Baseline DPS**: 10 (Damage Per Second).
2.  **Baseline EPS/MPS**: 35 (Resource Usage Per Second).
3.  **Friction Factor**: 3x. (Users exhaust energy ~3x faster than they regenerate it).

### Tier Targets
| Tier | Target DPS | Target EPS/MPS | Usage |
| :--- | :--- | :--- | :--- |
| **Common** | 10 | 35 | Sustain fire for ~4s |
| **Uncommon** | 18 | 60 | Sustain fire for ~2s |
| **Rare** | 30 | 100 | Single-shot exhaustion spikes |
| **Legendary** | 45+ | 150+ | Over-cap resource requirements |

---

## 3. Trigger & Cooldown Logic

### Cooldown Failure (Resource Awareness)
Items do not wait at 0 cooldown for resources.
*   **If Resource < Cost**: The item "misfires," logs a failure, and **instantly resets its full cooldown cycle**.
*   **Design Goal**: Prevents item queuing and forces players to build for efficiency (Energy Regen) rather than just raw power.

### Efficient Healing (No-Op Logic)
Healing items (e.g., Medkits) are resource-intelligent.
*   **If HP == MaxHP**: The item triggers its cooldown reset but **consumes 0 Energy/Mana**.
*   **Design Goal**: Prevents wasting limited resources on redundant actions during low-intensity combat phases.

---

## 4. Calculations & Unit Metrics

All engine math is strictly based on **Seconds**.

*   **DPS** = `Damage / (BaseCooldown / TriggerSpeed)`
*   **EPS** = `EnergyCost / (BaseCooldown / TriggerSpeed)`
*   **MPS** = `ManaCost / (BaseCooldown / TriggerSpeed)`

### Resource Bridges
Bridge items allow entities to break these rules by converting costs between pools (e.g., Blood Magic uses HP for Energy costs, Soul Guard uses Mana for HP damage).
