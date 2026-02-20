# Systems Analysis of Spatial Strategic Engines: Mathematical Architectures and Design Principles

## Inventory-Based Auto-Battlers

The evolution of the auto-battler genre has recently converged with spatial reasoning puzzles, creating a unique sub-genre where the primary expression of player agency occurs within the constraints of a grid-based inventory. In titles such as **Backpack Battles**, the traditional character sheet is replaced by an interactive bag, where the physical arrangement of items dictates the numerical output of combat. This shift necessitates a rigorous mathematical framework to govern item interactions, resource management, and economic scaling.

For developers seeking to hybridize this genre with social deduction or traitor-style mechanics, understanding the precise "math of the bag" is essential. The following report provides a technical decomposition of the mechanics found in *Backpack Battles*, analyzing underlying formulas, balance philosophy, and structural requirements for adapting these systems into high-friction, hidden-information environments.

---

## The Architecture of Spatial Logistics: Inventory and Grid Mechanics

The foundational mechanic of the inventory management auto-battler is the transformation of **space into power**. Players arrange items on a two-dimensional grid where orientation and proximity trigger complex synergistic effects.

* 
**Base Configuration**: Each class starts with 12 to 14 tiles out of a 63-tile maximum.


* 
**Expansion**: Tiles are expanded by purchasing bag types that offer unique mathematical modifiers.


* 
**Bag Utility**: The choice of bag often dictates viable build archetypes for a run.



### Bag Types and Spatial Modifiers

| Bag Type | Tile Count | Primary Mathematical Modifier | Strategic Utility |
| --- | --- | --- | --- |
| **Leather Bag** | 4 | Standard slot expansion | Foundational expansion without specialized buffs.

 |
| **Fanny Pack** | 2 | +10% Trigger Speed (Additive) | Essential for high-frequency low-stamina weapons.

 |
| **Stamina Sack** | 2 | +10% Base Stamina Regeneration | Critical for heavy weapons or multi-weapon builds.

 |
| **Potion Belt** | 3 | Consumed potions grant 2 random buffs | Synergizes with high-rarity potion builds.

 |
| **Protective Purse** | 2 | +15 Block on battle start | Defensive utility for early-game survival.

 |
| **Duffle Bag** | 6 | +30% Trigger Speed during Battle Rage | Exclusive to Berserker class; powers temporary burst states.

 |
| **Fire Pit** | 9 | +4 Max Health per Fire item inside | Exclusive to Pyromancer; provides health scaling.

 |

The interaction of these bags creates a meta-puzzle to optimize the "effective area" of modifiers. For example, placing a high-stamina weapon across both a Fanny Pack and a Stamina Sack allows for a faster attack rate while mitigating increased resource drain.

### Adjacency Logic: Stars and Diamonds

The **Star** () and **Diamond** () systems are the logic gates of the inventory. These symbols indicate that an item's effect is conditional upon the items occupying adjacent tiles.

* 
**Star () Activation**: Represents primary synergy; an item typically fills only one star of another item at a time.


* 
**Diamond () Activation**: Used when an item has two distinct types of effects or requires two different sets of neighbors for full efficiency.



This system creates non-linear scaling. For instance, a "Food" item triggers 10% faster for each different type of food placed in its adjacent stars. Consequently, the mathematical value of a slot is a variable that changes based on its neighbors.

---

## The Mathematical Engine of Combat: Tempo and Resolution

Combat is asynchronous, automated, and deterministic based on the initial state and RNG seeds. Resolution relies on four pillars: Cooldowns, Stamina, Accuracy, and Critical Hits.

### The Calculus of Item Activation: Cooldowns

Cooldown (CD) is defined as "seconds per activation". The final cooldown is calculated by dividing the base cooldown by modifiers categorized as Internal, External, and In-Battle.

* 
**Internal Modifiers**: Bonuses from the item's own stars or inherent properties (e.g., Food adjacency).


* 
**External Modifiers**: Environmental factors or specialized containers (e.g., Fanny Packs, Gloves of Haste).


* 
**In-Battle Modifiers**: Dynamic effects like Heat (+2% speed per stack) or Cold (-2% per stack).



Diversifying speed boost types is significantly more efficient than stacking a single type due to this multiplicative relationship. A total speed increase of 264% can achieve nearly four activations in the time of one.

### Stamina: The Hard Ceiling

Stamina is the primary resource limiter for weapons. If a player lacks the necessary stamina when an item's cooldown reaches zero, the item waits to trigger, resulting in lost DPS.

* 
**Base Regeneration**: 1.0 per second for all characters.


* 
**Stamina Drain ()**: .


* 
**Stability**: A build is "stable" if .



Excessive speed modifiers (like Heat or Gloves of Haste) can cause a build to "collapse" as stamina is depleted. Players use "burst" items like the Banana to restore flat amounts of stamina.

### Accuracy and Evasion

Accuracy determines hit success. Base accuracy (usually 80%–100%) is modified additively by Luck and Blind.

* 
**Luck**: +5% hit chance per stack.


* 
**Blind**: -5% hit chance per stack.



"On-Attack" items (e.g., Critwood Staff) trigger regardless of whether the attack lands, provided there is enough stamina.

### The Critical Hit Framework

Critical hits provide a 2x damage multiplier and also double lifesteal effects.

* 
**Scaling**: Crit chance starts at 0% and scales via Luck (+5% per stack with specific items) or Debuffs (+1% per enemy debuff stack for Cursed Dagger).


* 
**Defense**: Items like the Cap of Resilience offer a 10% to 25% chance to "resist" a critical hit.



---

## Status Effect Dynamics and Attrition Scaling

Status effects (Buffs and Debuffs) drive late-game resolution, stacking indefinitely and calculating additively.

| Effect Name | Type | Mathematical Impact per Stack | Tick Interval |
| --- | --- | --- | --- |
| **Poison** | Debuff | Deals 1 damage per stack | 2.0 seconds 

 |
| **Regeneration** | Buff | Heals 1 health per stack | 2.0 seconds 

 |
| **Burn** | Debuff | Deals 1 damage; reduces by 1 | 1.0 second 

 |
| **Bleed** | Debuff | Deals 1 damage; ignores armor | 3.0 seconds 

 |
| **Heat** | Buff | Increases trigger speed by 2% | Constant 

 |
| **Cold** | Debuff | Decreases trigger speed by 2% | Constant 

 |
| **Empower** | Buff | Increases weapon damage by 1 | Constant 

 |
| **Vampirism** | Buff | Heals 1 health on melee hit | On-Hit 

 |
| **Spikes** | Buff | Deals 1 damage to melee attackers | On-Being-Hit 

 |

Poison and Regeneration are calculated simultaneously due to their shared 2-second interval. If a player has 100 Poison but 101 Regeneration, they take 0 damage on that tick.

### Resistance and Reflection

* 
**Resistance**: A percentage chance to ignore a debuff (100% resistance equals immunity).


* 
**Reflection**: A stack-based system where incoming debuffs bounce back to the attacker. Note: One stack of Reflect only bounces one stack of a multi-stack application.



---

## Class-Specific Mathematical Archetypes

* 
**The Berserker**: Defined by "Battle Rage" (triggered below 50% health), providing a +30% speed boost to items in Duffle Bags.


* 
**The Pyromancer**: Focuses on "Heat" for permanent speed scaling. High-heat thresholds grant massive bonuses (e.g., 100-damage blast at 80 Heat).


* 
**The Ranger**: Maximizes Luck and Critical Hits via Lucky Clovers.


* 
**The Reaper**: Utilizes Poison and Cards for high-attrition builds.



---

## Shop Economics and Progression Math

Players receive gold each round to spend on items and rerolls.

| Round | Gold Income | Start Health | Common% | Rare% | Epic% | Leg% | Godly% |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **1** | 12 | 25 | 90 | 10 | 10 | 0 | 10 |
| **4** | 9 | 55 | 64 | 25 | 10 | 1 | 0 |
| **8** | 21 | 115 | 20 | 30 | 25 | 15 | 10 |
| **11** | 13 | 170 | 20 | 23 | 23 | 17 | 17 |
| **12-18** | 13-15 | 190-350 | 20 | 20 | 20 | 20 | 20 |

### Economic Nuances

* 
**Rerolls**: The first 4 cost 1 gold; subsequent rerolls cost 2 gold.


* 
**Sales**: Items have a 10% base chance to be 50% off. Selling items returns 50% of the price (Sale value), allowing for a "rental" strategy with no net gold loss on sale items.


* 
**Locking**: Right-clicking "reserves" an item for the next round.



### Crafting and Recipes

Items combine automatically at the end of shopping if placed adjacently.

| Crafted Item | Ingredients | Purpose |
| --- | --- | --- |
| **Hero Sword** | Wooden Sword + 2x Whetstone | Early scaling.

 |
| **Falcon Blade** | Hero Sword + 2x Gloves of Haste | Extreme trigger rate.

 |
| **Pandamonium** | Frying Pan + Dark Crystal | High Poison application.

 |
| **Eggscalibur** | Frying Pan + Heroic Potion | High-damage food synergy.

 |

---

## Hybridization: The Traitor and Sabotage Model

Adapting these mechanics for a "traitor" game involves introducing a "Friction of Trust" where the backpack is a shared or observed space.

### Saboteur's Arsenal

| Traitor Item | Keyword Mirror | Mathematical Mechanism | Sabotage Intent |
| --- | --- | --- | --- |
| **Heavy Lead Weight** | Stamina | Consumes 0.5 Stamina/sec; 0 damage | Starves hero weapons.

 |
| **Magnetic Shard** | Adjacency | Disables adjacent stars | Breaks synergies.

 |
| **Rusty Nail** | Spikes | Applies 1 Bleed to self on hit | Drains hero health.

 |
| **Cursed Mirror** | Reflect | Reflects buffs to the enemy | Turns Luck/Empower against heroes.

 |
| **Sooty Bellows** | Heat | Consumes 5 Heat for 1 Stun | Stops Pyromancer scaling.

 |

### Economic and Social Sabotage

* 
**Spatial Blocking**: Placing "useless" items to block adjacency stars.


* 
**Hidden Information**: Using items that look like "Healing Herbs" in shared views but are "Poison Hemlock" in private views.


* 
**Reroll Drain**: Persuading the team to waste gold on "reserving" low-tier items or rerolling for items not in the current rarity pool.



The "math of the bag" provides a veil for deception; a traitor can easily claim a catastrophic failure was simply a "misunderstood synergy".

