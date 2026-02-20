# Implementation Plan: Spatial Strategic Engine (Pack Carefully)

Based on systems analysis of *Backpack Battles* and collaborative brainstorming, this document outlines the roadmap for transitioning from a basic inventory prototype to a high-friction, co-op/traitor spatial strategy game.

---

## 1. Core Mathematical Engine (The "Math of the Bag")

### A. Stamina & Resource Ceilings
- **Goal**: Transition from pure cooldown-based combat to resource-constrained combat.
- **Mechanism**: 
    - Every weapon has a `staminaCost`.
    - Player has a `staminaRegen` rate (default 1.0/s).
    - If `stamina < cost` when cooldown hits zero, the item waits (DPS loss).
- **Status**: Basic logic implemented in `combat.ts`.

### B. Dynamic Trigger Speeds
- **Goal**: Implement multiplicative speed scaling.
- **Mechanism**: `FinalCD = BaseCD / (InternalBuffs * ExternalBuffs * InBattleEffects)`.
- **Items**: Fanny Packs (+10% Speed), Gloves of Haste.

### C. Status Effect Attrition
- **Goal**: Implement standard auto-battler status ticks.
- **Mechanisms**:
    - **Poison/Regen**: Shared 2s tick interval.
    - **Heat**: Constant trigger speed multiplier.
    - **Blind/Luck**: Additive modifiers to Accuracy (0-100% range).

---

## 2. Spatial Logistics & Bag Utility

### A. Specialized Containers (Bag Modifiers)
Implement unique bag types that modify the behavior of items placed within them:
- **Leather Bag**: Standard expansion.
- **Fanny Pack**: +10% Trigger Speed to items inside.
- **Stamina Sack**: +10% Stamina Regeneration.
- **Protective Purse**: Grant flat Block on combat start.

### B. Adjacency Logic Expansion
- **Stars (Primary)**: Proximity-based buffs.
- **Diamonds (Secondary)**: Secondary/Alternative effects based on different neighbors.
- **Clustering**: Items of same type (Food, Defense) get stacking bonuses for each adjacent sibling.

---

## 3. Crafting & Evolution

### A. Adjacency Recipes
- **Mechanism**: When items are placed adjacently in a valid configuration, a **"Craft" button** appears on the UI. Crafting is **optional** and must be manually triggered by the player.
- **First Recipe**: `Wooden Sword` + `Rock` (Whetstone) = `Hero Sword`.
- **Logic**: Scanning grid for recipes and enabling the craft action if ingredients are touching.

### B. Compaction Trade-offs (Efficiency vs. Power)
Crafting isn't always a linear upgrade. Some recipes focus on **Spatial Efficiency**:
- **Compaction**: Two items combine into a single, smaller item (e.g., 2x2 + 2x2 -> 2x3).
- **The Trade-off**: The crafted item may be slightly *less* powerful than the sum of its parts, but its reduced footprint allows for more high-tier synergies elsewhere in the bag.
- **Strategic Choice**: Players must decide between "Raw Power" (separate items) or "Build Flexibility" (compacted items).

---

## 4. Traitor & Sabotage Model (Friction of Trust)

### A. The Saboteur's Arsenal
Items designed to look helpful but apply mathematical drag:
- **Lead Weight**: Consumes Stamina (0.5/s) without dealing damage.
- **Magnetic Shard**: Disables adjacent synergy stars.
- **Rusty Nail**: Applies Bleed to the owner when they hit.
- **Hidden Disguises**: Items that appear as "Healing Herbs" to the team but are "Hemlock" in the traitor's private view.

### B. Social Sabotage Mechanics
- **Spatial Blocking**: Using large, low-value items to block optimal synergy placements.
- **Resource Drain**: Persuading the team to waste Gold on inefficient rerolls.

---

## 5. Game Loop Phases

1.  **Lobby**: Role assignment (0-1 Traitors).
2.  **The Draft**: Shared central pool of items; players pick turns.
3.  **The Journey**: Duo/Solo encounters with "Tactical Loss" options (Lose morale to gain Cursed Scrap).
4.  **The Campfire**: Social deduction phase; share stories, vote on suspicion.
5.  **The Finale (Mega-Bag)**: Real-time coordination. All bags merge into one grid. Everyone acts simultaneously to defeat a high-HP Boss while the Traitor actively moves items to break combos.

---

## 6. UI/UX Enhancements

- **Visual Synergy Feedback**: Replace generic stars with context-specific icons (Shields for DEF, Hearts for HP).
- **Real-Time Cursors**: In the Finale, show all players' cursors moving items on the shared grid.
- **Sandbox Mode**: Dedicated testing environment with URL parameter persistence (`?mode=sandbox`).

---

## 7. Bridge Mechanics & Resource Fallbacks (Pivoting Architecture)

To prevent "Synergy Deadlocks" (where pivoting is impossible) and to counter Traitor sabotage, the engine uses **Bridge Items** and **Fallback Logic** to link disparate attributes.

### A. Core Attribute Definitions
- **Attack (A)**: Direct damage output.
- **Defense (D)**: Passive reduction (Defense) and temporary HP (Block).
- **Health (H)**: The primary loss condition.
- **Energy (E)**: The primary mechanical limiter for physical actions.
- **Buffs (B)**: Scaling status effects (Poison, Spikes, Vampirism).
- **Mana (M)**: The primary mechanical limiter for magical/special actions.

### B. Bridge Item Matrix (Synergy Links)
These items "bridge" the gap between min-maxed builds, allowing players to pivot if a Traitor removes a key synergy component.

| Link | Mechanic Name | Mathematical Effect |
| :--- | :--- | :--- |
| **A-D** | Retribution | Convert a % of current Defense/Block into flat Attack Damage. |
| **A-H** | Vampirism | Attacks heal the user for a % of damage dealt. |
| **A-E** | Overdrive | Consume extra Energy to guarantee a Critical Hit or Multi-hit. |
| **A-M** | Arcane Blade | Weapons use Mana instead of Energy; Damage scales with Max Mana. |
| **D-B** | Aura of Thorns | Gain +1 Defense for every unique Buff/Debuff stack currently active. |
| **D-E** | Emergency Plating | When Energy is 0, incoming damage is reduced by a flat Defense bonus. |
| **M-D** | Mana Shield | Spend Mana to generate Block when Hit. |
| **H-B** | Vitality Pulse | Max Health increases by a small amount for every active Buff. |
| **H-E** | Blood Magic | When out of Energy, items consume Health (down to 1 HP) to trigger. |
| **M-H** | Spirit Link | When at 1 HP, incoming damage is subtracted from Mana instead. |
| **B-E** | Adrenaline | Every active Buff increases Max Energy or Energy Regeneration. |
| **B-M** | Channeling | Every active Buff increases Max Mana or Mana Regeneration. |
| **M-E** | Arcane Battery | When out of Energy, the player can instantly convert Mana to Energy. |

### C. Resource Fallback Rules (The "Last Stand" Logic)
Fallback logic is **not global**; it is a specialized power granted only when holding the corresponding **Bridge Item**. This allows players to intentionally "build into" a fallback strategy to counter sabotage:

1.  **Stamina Hard Ceiling**: Weapons wait for Stamina (Standard behavior for all items).
2.  **Energy -> Defense (via *Emergency Plating* Item)**: If Energy is 0, Defense is doubled for 1s when hit.
3.  **Energy -> Health (via *Blood Magic* Item)**: If Energy is 0, weapons trigger using 5% of Max HP as the cost (Blood Trigger).
4.  **Energy -> Mana (via *Arcane Battery* Item)**: If Energy is 0, Mana is consumed at a 2:1 ratio to power items (Arcane Overflow).
5.  **Health -> Mana (via *Spirit Link* Item)**: If HP would drop below 1, and Mana > 0, incoming damage is subtracted from Mana instead (Soul Guard).

---

## 8. Spatial Scaling Patterns (Geometric Multipliers)

To move away from "linear" power curves, items scale their effectiveness based on their specific location and the global composition of the bag.

### A. The "Match X for +Y" Logic
Items have low base stats but gain exponential power through these spatial matchers:

- **Corner Synergy**: Items gain +50% effectiveness if any of their cells occupy a bag corner.
- **Row/Column Resonance**: 
    - **Row-Locked**: +X Power if every cell in the same row contains an item of the same category.
    - **Column-Locked**: +X Power if every cell in the same column contains an item of the same category.
- **Category Scaling (Global)**: 
    - Effect: "+Y {Stat} for every {Category} item in the entire bag."
    - *Strategic Pivot*: Encourages "Mono-Category" builds that are vulnerable to specific Traitor removals.
- **Adjacency (Local)**: Standard star/diamond logic for immediate neighbors.

### B. Pattern Geometry
- **Triangulation**: If three items of the same ID form a triangle, they all gain a "Resonance" buff (2x effect).
- **L-Shape / T-Shape**: Specific patterns used for high-tier Tools to grant massive area-of-effect buffs to all items within the "arms" of the shape.
