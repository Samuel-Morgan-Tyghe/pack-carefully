# Developer Handover: Pack Carefully

This document serves as a technical guide for continuing development on **Pack Carefully**, a spatial strategy auto-battler.

## 1. Core Architecture

### State Management (Nanostores)
Located in `src/store/gameStore.ts`.
- **Atoms**: Primitive state units (`$phase`, `$players`, `$itemsOnGrid`).
- **Computed**: Derived state (`$adjacencyBonuses`).
- **Sync**: Uses `BroadcastChannel` to keep state in sync across browser tabs, enabling a local-multiplayer feel during development.

### Type System
Located in `src/types/index.ts`.
- **Item**: The static definition of an object.
- **InventoryItemInstance**: The stateful placement of an item on a grid (includes `x, y, rotation, liveStats`).
- **CombatEntity**: A unified representation of a player or enemy during a fight.

---

## 2. The Spatial Engine (`src/lib/adjacency.ts`)

The most complex part of the game is calculating synergies based on item positions. This happens in three passes:

1.  **Pass 1 (Boost Squares)**: Identifies items like "Stars" or "Global Boosters" that affect specific coordinates on the grid.
2.  **Pass 2 (Visual Highlights)**: Calculates which squares should be highlighted in the UI (Active vs. Potential synergies).
3.  **Pass 3 (Stat Accumulation)**: Iterates through all items and applies their `synergies[].apply` functions to calculate `liveStats`.

**Note**: Item rotation is handled via `getRotatedOffset`. When adding new patterns, ensure they account for the item's current rotation state.

---

## 3. Combat System (`src/lib/combat.ts`)

The combat system is a tick-based simulation (usually 20-100ms per tick).

### Key Concepts:
- **Unified Factory**: `createCombatEntity(id, name, items)` converts a bag full of items into a combat-ready fighter with consolidated HP, Mana, and Energy pools.
- **Resource Management**:
    - **Energy**: Recharged via `energyRegen`. Used by physical items.
    - **Mana**: Recharged via `manaRegen`. Used by magical items.
    - **Block**: Added via Shield items. **Block decays over time** (5 per second by default) and is depleted by incoming damage before HP is touched.
- **Simulation**: `simulateCombat()` runs the entire fight logic in a loop without UI delays. This is used for "Quick Fights" in the journey phase.

---

## 4. Item Database (`src/lib/items.ts`)

To add a new item:
1.  Define the object in `ITEMS`.
2.  **Triggers**:
    - `ATTACK`: Deals damage to the enemy.
    - `HEAL`: Restores player HP.
    - `SHIELD`: Adds to the player's current Block pool.
    - `PASSIVE`: Contributes to base pools (MaxHP, Regen) but doesn't have a cooldown action.
3.  **Synergies**: Use the `apply` callback to return a `SynergyResult`.
    ```typescript
    apply: (source, target) => {
      if (ITEMS[target.itemId].category === "WEAPON") {
        return { multipliers: { damage: 1.3 } }; // 30% boost
      }
      return {};
    }
    ```

---

## 5. UI Components

- **`MegaBag.tsx`**: The chaotic combined inventory.
- **`AutoBattler.tsx`**: The real-time combat visualizer.
- **`Inventory.tsx`**: The core grid-rendering logic.
- **`ItemTooltip.tsx`**: Handles complex logic for showing base stats vs. current adjacency-boosted stats.

---

## 6. Maintenance Commands

- **Build**: `npm run build` (Ensures type safety across the simulation).
- **Cleanup**: `npx knip` (Identifies unused code).
- **Format**: `npm run lint` (Uses Biome for extremely fast linting/formatting).

## 7. Current Development Focus
- **Bridge Items**: Items that link resources (e.g., "Blood Magic" allowing items to use HP when Energy is 0).
- **Traitor Mechanics**: Logic for secret sabotage actions in the `gameStore`.
