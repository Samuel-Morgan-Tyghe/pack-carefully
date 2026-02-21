# Bridge Items & Resource Fallbacks

This document outlines the "Bridge Items" designed to link disparate attributes and the fallback logic they enable.

## Bridge Item Matrix (Synergy Links)

These items "bridge" the gap between min-maxed builds, allowing players to pivot if a Traitor removes a key synergy component.

| Link | Category | Mechanic Name | Mathematical Effect |
| :--- | :--- | :--- | :--- |
| **A-D** | Attack, Block | Retribution | Convert a % of current Block into flat Attack Damage. |
| **A-H** | Attack, Health | Vampirism | Attacks heal the user for a % of damage dealt. |
| **A-E** | Attack, Energy | Overdrive | Consume extra Energy to guarantee a Multi-hit. |
| **A-M** | Attack, Mana | Arcane Blade | Weapons use Mana instead of Energy; Damage scales with Max Mana. |
| **D-B** | Block, Buff | Aura of Thorns | Gain +1 Block for every unique Buff/Debuff stack currently active. |
| **D-E** | Block, Energy | Emergency Plating | When Energy is 0, incoming damage is reduced by a flat Block bonus. |
| **M-D** | Mana, Block | Mana Shield | Spend Mana to generate Block when Hit. |
| **H-B** | Health, Buff | Vitality Pulse | Max Health increases by a small amount for every active Buff. |
| **H-E** | Health, Energy | Blood Magic | When out of Energy, items consume Health (down to 1 HP) to trigger. |
| **M-H** | Mana, Health | Spirit Link | When at 1 HP, incoming damage is subtracted from Mana instead. |
| **B-E** | Buff, Energy | Adrenaline | Every active Buff increases Max Energy or Energy Regeneration. |
| **B-M** | Buff, Mana | Channeling | Every active Buff increases Max Mana or Mana Regeneration. |
| **M-E** | Mana, Energy | Arcane Battery | When out of Energy, the player can instantly convert Mana to Energy. |

## Resource Fallback Rules (The "Last Stand" Logic)

Fallback logic is **not global**; it is a specialized power granted only when holding the corresponding **Bridge Item**.

1.  **Energy -> Block (via *Emergency Plating* Item)**: If Energy is 0, Block gain is doubled for 1s when hit.
2.  **Energy -> Health (via *Blood Magic* Item)**: If Energy is 0, weapons trigger using 5% of Max HP as the cost (Blood Trigger).
3.  **Energy -> Mana (via *Arcane Battery* Item)**: If Energy is 0, Mana is consumed at a 2:1 ratio to power items (Arcane Overflow).
4.  **Health -> Mana (via *Spirit Link* Item)**: If HP would drop below 1, and Mana > 0, incoming damage is subtracted from Mana instead (Soul Guard).
