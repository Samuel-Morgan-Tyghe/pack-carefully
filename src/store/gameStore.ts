import { atom } from 'nanostores';
import type { GamePhase, InventoryItemInstance, Item, Player, Role, DraftState, GameState, ItemCategory } from '../types';
import { ITEMS, GRID_SIZE } from '../lib/items';
import { generateId } from '../lib/utils';
import { generateRandomContainers } from '../lib/generators';
import type { Coordinate, Container } from '../types';

import { getAdjacencyBonuses } from '../lib/adjacency';
import { computed } from 'nanostores';

// State Atoms
export const $phase = atom<GamePhase>('LOBBY');
export const $players = atom<Player[]>([]);
export const $containers = atom<Container[]>([]);
export const $currentPlayerId = atom<string | null>(null);
export const $itemsOnGrid = atom<InventoryItemInstance[]>([]);
export const $availableItems = atom<Item[]>(Object.values(ITEMS));
export const $draggedItem = atom<string | null>(null);

// Multiplayer Identity & Sync
export const $localPlayerId = atom<string | (typeof localStorage extends undefined ? null : string | null)>(
    typeof localStorage !== 'undefined' ? localStorage.getItem('pack_carefully_player_id') : null
);

// Local View State (not synced)
export const $viewingPlayerId = atom<string | null>(null);

// BroadcastChannel for cross-tab sync
const syncChannel = typeof window !== 'undefined' ? new BroadcastChannel('pack_carefully_sync') : null;

export const setLocalPlayer = (id: string | null) => {
    $localPlayerId.set(id);
    if (id !== 'OBSERVER') {
        $viewingPlayerId.set(id);
    }
    if (id && typeof localStorage !== 'undefined') {
        localStorage.setItem('pack_carefully_player_id', id);
    } else if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('pack_carefully_player_id');
    }
};

// Flag to prevent broadcast cycles
let isSyncing = false;

export const setViewingPlayer = (id: string | null) => {
    $viewingPlayerId.set(id);
};

// Syncing state changes
if (syncChannel) {
    syncChannel.onmessage = (event) => {
        const { type, payload } = event.data;

        isSyncing = true;
        try {
            switch (type) {
                case 'PHASE_UPDATE': $phase.set(payload); break;
                case 'PLAYERS_UPDATE': $players.set(payload); break;
                case 'CONTAINERS_UPDATE': $containers.set(payload); break;
                case 'ITEMS_UPDATE': $itemsOnGrid.set(payload); break;
                case 'GAME_STATE_UPDATE': $gameState.set(payload); break;
                case 'DRAFT_STATE_UPDATE': $draftState.set(payload); break;
                case 'DRAGGED_ITEM_UPDATE': $draggedItem.set(payload); break;
            }
        } finally {
            isSyncing = false;
        }
    };
}

// Helper to broadcast changes
const broadcast = (type: string, payload: unknown) => {
    if (isSyncing) return; // Prevent echoing sync messages
    if (syncChannel) {
        syncChannel.postMessage({ type, payload });
    }
};



// Derived State
export const $adjacencyBonuses = computed($itemsOnGrid, items => getAdjacencyBonuses(items));

// Gamification State


export const $gameState = atom<GameState>({
    day: 1,
    round: 1,
    morale: 100,
    isGameOver: false,
    gameResult: null,
    journeyStage: 'SELECTION',
    selectedPath: null,
    pathStatus: { LEFT: 'PENDING', RIGHT: 'PENDING' },
    lastEncounterResult: null
});

// Draft State moved to types

export const $draftState = atom<DraftState>({
    availableItems: {},
    selections: {},
    confirmed: [],
    roundNumber: 1
});

// Sync listeners (moved after all atoms declared)
$phase.listen(val => broadcast('PHASE_UPDATE', val));
$players.listen(val => broadcast('PLAYERS_UPDATE', val));
$containers.listen(val => broadcast('CONTAINERS_UPDATE', val));
$itemsOnGrid.listen(val => broadcast('ITEMS_UPDATE', val));
$gameState.listen(val => broadcast('GAME_STATE_UPDATE', val));
$draftState.listen(val => broadcast('DRAFT_STATE_UPDATE', val));
$draggedItem.listen(val => broadcast('DRAGGED_ITEM_UPDATE', val));


// Derived state example (if needed) or Actions
// Helper for collision
export const checkCollision = (
    x: number,
    y: number,
    width: number,
    height: number,
    items: InventoryItemInstance[],
    ownerId: string,
    excludeInstanceId?: string,
    category?: ItemCategory
): boolean => {
    if (x < 0 || y < 0 || x + width > GRID_SIZE || y + height > GRID_SIZE) return true;

    const isContainer = category === 'CONTAINER';

    for (const item of items) {
        if (item.instanceId === excludeInstanceId) continue;

        // In FINALE, all items collide regardless of owner
        const isFinale = $phase.get() === 'FINALE';
        if (!isFinale && item.ownerId !== ownerId) continue;

        const existingItemDef = ITEMS[item.itemId];
        const isExistingContainer = existingItemDef.category === 'CONTAINER';

        // Layer Check: 
        // Containers only collide with Containers
        // Gear only collides with Gear
        if (isContainer !== isExistingContainer) continue;

        const existingW = (item.rotation === 90 || item.rotation === 270) ? existingItemDef.height : existingItemDef.width;
        const existingH = (item.rotation === 90 || item.rotation === 270) ? existingItemDef.width : existingItemDef.height;

        if (
            x < item.x + existingW &&
            x + width > item.x &&
            y < item.y + existingH &&
            y + height > item.y
        ) {
            return true;
        }
    }
    return false;
};

// Support Check: Must be inside valid Container cells
export const checkSupport = (
    x: number,
    y: number,
    width: number,
    height: number,
    _items: InventoryItemInstance[], // Unused now, containers are separate
    ownerId: string
): boolean => {
    // In FINALE, everything floats
    if ($phase.get() === 'FINALE') return true;

    const containers = $containers.get().filter(c => c.ownerId === ownerId);

    // Get all valid cells for this player
    const validCells = new Set<string>();
    containers.forEach(c => {
        c.cells.forEach(cell => {
            // Check if cell is disabled
            const isDisabled = c.disabledCells?.some(dc => dc.x === cell.x && dc.y === cell.y);
            if (!isDisabled) {
                validCells.add(`${cell.x},${cell.y}`);
            }
        });
    });

    // Check if every cell of the item matches a valid container cell
    for (let cx = x; cx < x + width; cx++) {
        for (let cy = y; cy < y + height; cy++) {
            if (!validCells.has(`${cx},${cy}`)) return false;
        }
    }
    return true;
};

// Actions
export const addPlayer = (name: string): string => {
    const currentPlayers = $players.get();
    const id = generateId();
    const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500'];
    const avatarColor = colors[currentPlayers.length % colors.length];

    // Generate Containers for the new player
    const newContainers = generateRandomContainers(id);
    $containers.set([...$containers.get(), ...newContainers]);

    $players.set([
        ...currentPlayers,
        {
            id,
            name,
            role: 'Hiker',
            isReady: false,
            isTraitor: false,
            avatarColor,
            currentPath: null
        }
    ]);

    return id;
};

export const removePlayer = (playerId: string) => {
    const currentPlayers = $players.get();
    $players.set(currentPlayers.filter(p => p.id !== playerId));

    // Also remove their containers and items
    const currentContainers = $containers.get();
    $containers.set(currentContainers.filter(c => c.ownerId !== playerId));

    const currentItems = $itemsOnGrid.get();
    $itemsOnGrid.set(currentItems.filter(i => i.ownerId !== playerId));
};

export const startGame = () => {
    const currentPlayers = $players.get();
    const numPlayers = currentPlayers.length;

    // Schrödinger's Traitor: 25% chance of NO traitor at all.
    // This creates genuine paranoia — nobody can ever be 100% sure.
    const hasTraitor = Math.random() > 0.25;
    const traitorIndex = hasTraitor ? Math.floor(Math.random() * numPlayers) : -1;

    const newPlayers = currentPlayers.map((p, idx) => ({
        ...p,
        role: (idx === traitorIndex ? 'Traitor' : 'Hiker') as Role,
        isTraitor: idx === traitorIndex
    }));

    $players.set(newPlayers);
    $currentPlayerId.set(currentPlayers[0]?.id || null);

    // Reset Containers/Items (Players start fresh)
    $containers.set([]);
    $itemsOnGrid.set([]);

    // Start with Bag Building
    $phase.set('BAG_BUILDING');
};

export const createCustomContainer = (playerId: string, cells: Coordinate[]) => {
    const newContainer: Container = {
        id: generateId(),
        ownerId: playerId,
        type: 'BACKPACK', // Custom
        cells: cells,
        capacity: cells.length
    };

    const currentContainers = $containers.get();
    const updatedContainers = [...currentContainers, newContainer];
    $containers.set(updatedContainers);

    // Check if all players have a container
    const players = $players.get();
    const playersWithContainers = new Set(updatedContainers.map(c => c.ownerId));

    if (players.every(p => playersWithContainers.has(p.id))) {
        // All players ready -> Start Draft
        setTimeout(() => {
            nextPhase();
        }, 1000); // Small delay for UX
    }
};

export const nextPhase = () => {
    const current = $phase.get();

    if (current === 'LOBBY') {
        startGame(); // triggers BAG_BUILDING
    } else if (current === 'BAG_BUILDING') {
        startDraft(); // Go to Draft after building
    } else if (current === 'DRAFT') {
        $phase.set('JOURNEY');
    } else if (current === 'JOURNEY') {
        $phase.set('CAMPFIRE');
    } else if (current === 'CAMPFIRE') {
        advanceDay(); // Advance day when leaving campfire
        if ($gameState.get().isGameOver) {
            $phase.set('LOBBY');
        } else {
            startDraft(); // Start new day with Draft
        }
    }
};

export const placeItem = (itemId: string, x: number, y: number, rotation: 0 | 90 | 180 | 270, ownerId: string): boolean => {
    const items = $itemsOnGrid.get();
    const itemDef = ITEMS[itemId];
    if (!itemDef) return false;

    const w = (rotation === 90 || rotation === 270) ? itemDef.height : itemDef.width;
    const h = (rotation === 90 || rotation === 270) ? itemDef.width : itemDef.height;

    // Check Collision (Blocking)
    if (checkCollision(x, y, w, h, items, ownerId, undefined, itemDef.category)) return false;

    // Check Support (If not a container, must be inside containers)
    if (itemDef.category !== 'CONTAINER') {
        if (!checkSupport(x, y, w, h, items, ownerId)) return false;
    }

    // DRAFT PHASE LOGIC: Enforce 1 item from draft pool
    const currentItems = items;
    if ($phase.get() === 'DRAFT') {
        const draft = $draftState.get();
        const personalPool = draft.availableItems[ownerId] || [];
        const draftItemIndex = personalPool.findIndex(i => i.id === itemId);

        if (draftItemIndex >= 0) {
            // Remove from pool
            const newPool = [...personalPool];
            newPool.splice(draftItemIndex, 1);
            $draftState.set({
                ...draft,
                availableItems: {
                    ...draft.availableItems,
                    [ownerId]: newPool
                }
            });
        }
    }

    const newItem: InventoryItemInstance = {
        instanceId: generateId(),
        itemId,
        x,
        y,
        rotation,
        ownerId
    };

    $itemsOnGrid.set([...currentItems, newItem]);
    return true;
};

export const addRandomLoot = (itemId: string, targetPlayerId?: string): boolean => {
    const items = $itemsOnGrid.get();
    const players = $players.get();
    if (players.length === 0) return false;

    // Default to first player if not specified
    const targetOwnerId = targetPlayerId || players[0].id;

    const itemDef = ITEMS[itemId];
    if (!itemDef) return false;

    // Try to find a valid spot
    // Simple brute force for now: try random positions 20 times?
    // Or scan grid. Grid is small (8x8).

    // Let's just try 50 random spots
    for (let i = 0; i < 50; i++) {
        const x = Math.floor(Math.random() * (GRID_SIZE - itemDef.width + 1));
        const y = Math.floor(Math.random() * (GRID_SIZE - itemDef.height + 1));
        const rot = 0; // Simplified rotation for random loot

        // For random loot, if it's gear, it needs support.
        // This makes random loot placement harder.
        // It might be better to "Force" place loot or ensure we only spawn loot if there's space.
        // Or if it's Cursed Scrap, maybe it "Breaks" the bag?
        // Let's stick to standard rules: Logic tries to find valid spot.

        // Check Collision
        if (!checkCollision(x, y, itemDef.width, itemDef.height, items, targetOwnerId, undefined, itemDef.category)) {
            // Check Support
            if (itemDef.category === 'CONTAINER' || checkSupport(x, y, itemDef.width, itemDef.height, items, targetOwnerId)) {
                return placeItem(itemId, x, y, rot, targetOwnerId);
            }
        }
    }
    return false; // No space found
};

export const moveItem = (instanceId: string, x: number, y: number, rotation?: 0 | 90 | 180 | 270): boolean => {
    const items = $itemsOnGrid.get();
    const item = items.find(i => i.instanceId === instanceId);
    if (!item) return false;

    const finalRot = rotation ?? item.rotation;

    const itemDef = ITEMS[item.itemId];
    const w = (finalRot === 90 || finalRot === 270) ? itemDef.height : itemDef.width;
    const h = (finalRot === 90 || finalRot === 270) ? itemDef.width : itemDef.height;

    if (item.locked) return false; // Cannot move locked items

    if (checkCollision(x, y, w, h, items, item.ownerId, instanceId)) return false;

    $itemsOnGrid.set(items.map(i =>
        i.instanceId === instanceId ? { ...i, x, y, rotation: finalRot } : i
    ));
    return true;
};

export const rotateItem = (instanceId: string) => {
    const items = $itemsOnGrid.get();
    const item = items.find(i => i.instanceId === instanceId);
    if (!item || item.locked) return; // Cannot rotate locked items

    const newRot = (item.rotation + 90) % 360 as 0 | 90 | 180 | 270;
    moveItem(instanceId, item.x, item.y, newRot);
};

export const toggleLock = (instanceId: string) => {
    const items = $itemsOnGrid.get();
    $itemsOnGrid.set(items.map(i =>
        i.instanceId === instanceId ? { ...i, locked: !i.locked } : i
    ));
};

export const removeItem = (instanceId: string) => {
    const items = $itemsOnGrid.get();
    const item = items.find(i => i.instanceId === instanceId);
    if (!item || item.locked) return; // Cannot remove locked items

    $itemsOnGrid.set(items.filter(i => i.instanceId !== instanceId));
};

export const rotateItemCounterClockwise = (instanceId: string) => {
    const items = $itemsOnGrid.get();
    const item = items.find(i => i.instanceId === instanceId);
    if (!item || item.locked) return;

    const newRot = (item.rotation - 90 + 360) % 360 as 0 | 90 | 180 | 270;
    moveItem(instanceId, item.x, item.y, newRot);
};

export const resetGame = () => {
    $phase.set('LOBBY');
    $itemsOnGrid.set([]);
    $players.set([]);
    $containers.set([]); // Reset containers
    $currentPlayerId.set(null);
    $gameState.set({
        day: 1,
        round: 1,
        morale: 100,
        isGameOver: false,
        gameResult: null,
        journeyStage: 'SELECTION',
        selectedPath: null,
        pathStatus: { LEFT: 'PENDING', RIGHT: 'PENDING' },
        lastEncounterResult: null
    });
};

export const damageMorale = (amount: number) => {
    const current = $gameState.get();
    const newMorale = Math.max(0, current.morale - amount);

    if (newMorale === 0) {
        $gameState.set({ ...current, morale: 0, isGameOver: true, gameResult: 'LOSS' });
    } else {
        $gameState.set({ ...current, morale: newMorale });
    }
};

export const advanceDay = () => {
    const current = $gameState.get();
    const newDay = current.day + 1;

    if (newDay > 5) {
        $gameState.set({ ...current, day: 5 }); // Stuck on day 5 or move to 6?
        $phase.set('FINALE');
    } else {
        $gameState.set({
            ...current,
            day: newDay,
            round: newDay,
            journeyStage: 'SELECTION',
            selectedPath: null,
            pathStatus: { LEFT: 'PENDING', RIGHT: 'PENDING' }, // Reset path status for new day
            lastEncounterResult: null
        });
    }
};


export const choosePath = (path: 'LEFT' | 'RIGHT') => {
    const current = $gameState.get();

    // Safety check: Are there players on this path?
    const players = $players.get();
    const hasPlayers = players.some(p => p.currentPath === path);
    if (!hasPlayers) return; // Cannot start empty path? Or maybe allow it but it auto-fails?

    let stage: 'ENCOUNTER' | 'SCAVENGE' = 'ENCOUNTER';
    if (path === 'RIGHT') {
        stage = 'SCAVENGE';
    }

    $gameState.set({
        ...current,
        selectedPath: path,
        journeyStage: stage
    });
};

export const assignPlayerToPath = (playerId: string, path: 'LEFT' | 'RIGHT' | null) => {
    const players = $players.get();
    $players.set(players.map(p =>
        p.id === playerId ? { ...p, currentPath: path } : p
    ));
};

export const completeEncounter = (success: boolean) => {
    const current = $gameState.get();
    const path = current.selectedPath;
    console.log('Encounter completed. Success:', success);
    if (!path) return;

    // Use current.pathStatus directly to update the specific path
    const newStatus = { ...current.pathStatus, [path]: 'RESOLVED' as const };

    $gameState.set({
        ...current,
        pathStatus: newStatus,
        journeyStage: 'RESULTS'
    });
};

export const completeScavenge = () => {
    const current = $gameState.get();
    const path = current.selectedPath;
    if (!path) return;

    // Use current.pathStatus directly to update the specific path
    const newStatus = { ...current.pathStatus, [path]: 'RESOLVED' as const };

    // Scavenge doesn't really have "Results" screen, so maybe go back to split screen?
    // Or go to RESULTS with a simple "Looted" message?
    // Let's go to RESULTS for consistency if we have a component for it.
    // If not, we might want to call returnToSplitScreen directly?
    // Let's stick to the flow: SELECTION -> ACTION -> RESULTS -> SELECTION

    $gameState.set({
        ...current,
        pathStatus: newStatus,
        journeyStage: 'RESULTS'
    });
};

export const returnToSplitScreen = () => {
    const current = $gameState.get();
    const status = current.pathStatus;

    // Check if all active paths are resolved
    // Active path = path with players
    const players = $players.get();
    const leftActive = players.some(p => p.currentPath === 'LEFT');
    const rightActive = players.some(p => p.currentPath === 'RIGHT');

    const leftDone = !leftActive || status.LEFT === 'RESOLVED';
    const rightDone = !rightActive || status.RIGHT === 'RESOLVED';

    if (leftDone && rightDone) {
        nextPhase(); // Go to CAMPFIRE
    } else {
        $gameState.set({
            ...current,
            journeyStage: 'SELECTION',
            selectedPath: null
        });
    }
};

export const startDraft = () => {
    const players = $players.get();
    const day = $gameState.get().day;

    // Generate Personal Pools based on Rarity Scaling
    const availableItems: Record<string, Item[]> = {};
    const allItems = Object.values(ITEMS);

    players.forEach(p => {
        const pool: Item[] = [];

        // Scaling Logic:
        // Day 1: Common mostly, maybe 1 Uncommon
        // Day 5: Likely Uncommon, Rare, maybe Legendary
        for (let i = 0; i < 3; i++) {
            const roll = Math.random();
            // Simple rarity weight adjustment based on day
            // Day 1 (day=1): common=0.8, uncommon=0.2
            // Day 5 (day=5): uncommon=0.4, rare=0.3, legendary=0.1
            const uncommonWeight = Math.min(0.5, 0.1 + (day * 0.08));
            const rareWeight = Math.min(0.3, day * 0.06);
            // Legendary weight only starts appearing after day 3
            const legendaryWeight = day >= 4 ? 0.05 + (day - 4) * 0.05 : 0;

            let selectedRarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'LEGENDARY' = 'COMMON';
            if (roll < legendaryWeight) selectedRarity = 'LEGENDARY';
            else if (roll < legendaryWeight + rareWeight) selectedRarity = 'RARE';
            else if (roll < legendaryWeight + rareWeight + uncommonWeight) selectedRarity = 'UNCOMMON';

            const filters = allItems.filter(item => item.rarity === selectedRarity && item.category !== 'SABOTAGE');
            // Fallback if no items in rarity (shouldn't happen with our db)
            const finalPool = filters.length > 0 ? filters : allItems.filter(i => i.rarity === 'COMMON');

            pool.push(finalPool[Math.floor(Math.random() * finalPool.length)]);
        }

        availableItems[p.id] = pool;
    });

    $draftState.set({
        availableItems,
        selections: {},
        confirmed: [],
        roundNumber: 1
    });

    $phase.set('DRAFT');
};

export const selectDraftItem = (playerId: string, itemId: string) => {
    const draft = $draftState.get();
    const playerPool = draft.availableItems[playerId];

    if (!playerPool?.find(i => i.id === itemId)) return; // Invalid selection

    // Update selection (not confirmed yet)
    $draftState.set({
        ...draft,
        selections: {
            ...draft.selections,
            [playerId]: itemId
        }
    });

    // Auto-confirm for single player convenience? 
    // No, let them change mind until "Lock In" or just auto-lock if click?
    // User wants "Secrecy", so maybe Confirm button.
};

export const confirmDraftSelection = (playerId: string) => {
    const draft = $draftState.get();
    if (!draft.selections[playerId]) return;
    if (draft.confirmed.includes(playerId)) return;

    const newConfirmed = [...draft.confirmed, playerId];

    $draftState.set({
        ...draft,
        confirmed: newConfirmed
    });

    // Check if all players confirmed
    const players = $players.get();
    if (newConfirmed.length === players.length) {
        resolveDraftRound();
    }
};

const resolveDraftRound = () => {
    const draft = $draftState.get();
    const players = $players.get();

    // 1. Add selected items to inventory (or stash)
    // Since we don't have a "Stash" yet and user said "broken mechanic is drag and drop",
    // let's try to auto-place or put in a placeholder "Stash" location?
    // For now, let's use the old `placeItem` logic but find the first open spot?
    // OR create a "Stash" concept in gameStore?

    // Simplest approach: Try clear spot, if fail -> drop on ground (handled by UI)?
    // Better: Add to a `stashedItems` array in store, UI shows them floating to be placed?

    // For this refactor, let's trust `addRandomLoot` logic which finds a spot,
    // or just place it at 0,0 if free.

    players.forEach(p => {
        const itemId = draft.selections[p.id];
        if (itemId) {
            // Try to auto-place
            // Use a helper that brute-forces a spot
            addRandomLoot(itemId, p.id);
        }
    });

    // 2. Advance Round or End Draft
    if (draft.roundNumber >= 3) { // 3 Rounds total
        nextPhase();
    } else {
        // Start next round - Regenerate pools? Or pass leftovers?
        // User implied "First turn 0 shared items". 
        // Let's regenerate fresh pools for next round to keep it simple and fun.
        const availableItems: Record<string, Item[]> = {};
        const allItems = Object.values(ITEMS);
        players.forEach(p => {
            const pool: Item[] = [];
            for (let i = 0; i < 3; i++) {
                pool.push(allItems[Math.floor(Math.random() * allItems.length)]);
            }
            availableItems[p.id] = pool;
        });

        $draftState.set({
            availableItems,
            selections: {},
            confirmed: [],
            roundNumber: draft.roundNumber + 1
        });
    }
};

export const rummageInventory = (targetPlayerId: string): boolean => {
    const items = $itemsOnGrid.get();
    const targetItems = items.filter(i => i.ownerId === targetPlayerId && !i.locked);

    if (targetItems.length === 0) return false;

    // Pick random item
    const itemToMessUp = targetItems[Math.floor(Math.random() * targetItems.length)];

    // Try to move it to a new spot
    // 10 attempts
    for (let i = 0; i < 10; i++) {
        const x = Math.floor(Math.random() * GRID_SIZE);
        const y = Math.floor(Math.random() * GRID_SIZE);
        const rot = (Math.floor(Math.random() * 4) * 90) as 0 | 90 | 180 | 270;

        // Remove item temporarily to check collision for new spot
        const otherItems = items.filter(k => k.instanceId !== itemToMessUp.instanceId);

        const def = ITEMS[itemToMessUp.itemId];
        const w = (rot === 90 || rot === 270) ? def.height : def.width;
        const h = (rot === 90 || rot === 270) ? def.width : def.height;

        if (!checkCollision(x, y, w, h, otherItems, targetPlayerId, undefined, def.category)) {
            if (def.category === 'CONTAINER' || checkSupport(x, y, w, h, otherItems, targetPlayerId)) {
                moveItem(itemToMessUp.instanceId, x, y, rot);
                return true;
            }
        }
    }
    return false;
};

export type SabotageType = 'DISCARD' | 'CUT_HOLE' | 'CURSE' | 'DISGUISE';

export const triggerSabotage = (targetPlayerId: string, ability: SabotageType): boolean => {
    const items = $itemsOnGrid.get();
    const containers = $containers.get();
    const targetItems = items.filter(i => i.ownerId === targetPlayerId);

    if (ability === 'DISCARD') {
        if (targetItems.length === 0) return false;
        // Remove random item
        const itemToRemove = targetItems[Math.floor(Math.random() * targetItems.length)];
        $itemsOnGrid.set(items.filter(i => i.instanceId !== itemToRemove.instanceId));
        return true;
    }

    if (ability === 'CUT_HOLE') {
        const targetContainers = containers.filter(c => c.ownerId === targetPlayerId);
        if (targetContainers.length === 0) return false;

        // Pick random container
        const container = targetContainers[Math.floor(Math.random() * targetContainers.length)];

        // Pick random cell that isn't already disabled
        const enabledCells = container.cells.filter(cell =>
            !container.disabledCells?.some(dc => dc.x === cell.x && dc.y === cell.y)
        );

        if (enabledCells.length === 0) return false;

        const cellToCut = enabledCells[Math.floor(Math.random() * enabledCells.length)];

        // Update containers
        $containers.set(containers.map(c => {
            if (c.id === container.id) {
                return {
                    ...c,
                    capacity: c.capacity - 1,
                    disabledCells: [...(c.disabledCells || []), cellToCut]
                };
            }
            return c;
        }));

        return true;
    }

    if (ability === 'CURSE') {
        // Add Cursed Scrap. It's essentially "Add Random Loot" but malicious.
        return addRandomLoot('curse_scrap', targetPlayerId);
    }

    if (ability === 'DISGUISE') {
        if (targetItems.length === 0) return false;
        const itemToDisguise = targetItems[Math.floor(Math.random() * targetItems.length)];

        // Pick a random other look
        const allItemIds = Object.keys(ITEMS);
        const randomLook = allItemIds[Math.floor(Math.random() * allItemIds.length)];

        $itemsOnGrid.set(items.map(i =>
            i.instanceId === itemToDisguise.instanceId
                ? { ...i, disguiseItemId: randomLook }
                : i
        ));
        return true;
    }

    return false;
};

export const healMorale = (amount: number) => {
    const current = $gameState.get();
    const newMorale = Math.min(100, current.morale + amount);
    $gameState.set({ ...current, morale: newMorale });
};

export const revealDisguises = (targetPlayerId: string): number => {
    const items = $itemsOnGrid.get();
    let revealedCount = 0;

    const newItems = items.map(i => {
        if (i.ownerId === targetPlayerId && i.disguiseItemId) {
            revealedCount++;
            return { ...i, disguiseItemId: undefined };
        }
        return i;
    });

    if (revealedCount > 0) {
        $itemsOnGrid.set(newItems);
    }
    return revealedCount;
};
