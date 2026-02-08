import { atom } from 'nanostores';
import type { GamePhase, InventoryItemInstance, Item, Player, Role, DraftState, GameState, ItemCategory } from '../types';
import { ITEMS, GRID_SIZE } from '../lib/items';
import { generateId } from '../lib/utils';
import { generateRandomContainers } from '../lib/generators';
import type { Container } from '../types';

import { getAdjacencyBonuses } from '../lib/adjacency';
import { computed } from 'nanostores';

// State Atoms
export const $phase = atom<GamePhase>('LOBBY');
export const $players = atom<Player[]>([]);
export const $containers = atom<Container[]>([]); // NEW: Polyomino Containers
export const $currentPlayerId = atom<string | null>(null);
export const $itemsOnGrid = atom<InventoryItemInstance[]>([]);
export const $availableItems = atom<Item[]>(Object.values(ITEMS));
export const $draggedItem = atom<string | null>(null); // For drag feedback

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
    availableItems: [],
    currentTurnPlayerId: null,
    roundOrder: [],
    pickIndex: 0
});

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
    for(let cx = x; cx < x + width; cx++) {
        for(let cy = y; cy < y + height; cy++) {
             if (!validCells.has(`${cx},${cy}`)) return false;
        }
    }
    return true;
};

// Actions
export const addPlayer = (name: string) => {
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
};

export const startGame = () => {
  const currentPlayers = $players.get();
  const numPlayers = currentPlayers.length;
  const traitorIndex = Math.floor(Math.random() * numPlayers);
  
  const newPlayers = currentPlayers.map((p, idx) => ({
    ...p,
    role: (idx === traitorIndex ? 'Traitor' : 'Hiker') as Role,
    isTraitor: idx === traitorIndex
  }));

  $players.set(newPlayers);
  
  // Start the Draft
  startDraft();
};

export const nextPhase = () => {
  const current = $phase.get();
  
  if (current === 'LOBBY') {
      $phase.set('DRAFT');
  } else if (current === 'DRAFT') {
      $phase.set('PACKING');
  } else if (current === 'PACKING') {
      $phase.set('JOURNEY');
  } else if (current === 'JOURNEY') {
      $phase.set('CAMPFIRE');
  } else if (current === 'CAMPFIRE') {
      advanceDay(); // Advance day when leaving campfire
      if ($gameState.get().isGameOver) {
          // Stay on summary/gameover screen? Or back to Lobby?
          // For now, let's assume UI handles GameOver overlay, but phase might go to Lobby or stay Campfire
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

  const newItem: InventoryItemInstance = {
    instanceId: generateId(),
    itemId,
    x,
    y,
    rotation,
    ownerId
  };

  $itemsOnGrid.set([...items, newItem]);
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
    for (let i=0; i<50; i++) {
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

export const resetGame = () => {
    $phase.set('LOBBY');
    $itemsOnGrid.set([]);
    $players.set([]);
    $containers.set([]); // Reset containers
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

// Draft Actions
export const startDraft = () => {
    const players = $players.get();
    const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
    const playerIds = shuffledPlayers.map(p => p.id);
    
    // Snake Draft Order: 1, 2, 3, 3, 2, 1, 1, 2, 3...
    // Let's do 3 rounds?
    const rounds = 3;
    const order: string[] = [];
    
    for (let r = 0; r < rounds; r++) {
        if (r % 2 === 0) {
            order.push(...playerIds);
        } else {
            order.push(...[...playerIds].reverse());
        }
    }
    
    // Generate Balanced Pool
    // Ensure at least 1 Container and 1 Weapon per player in the pool
    const allItems = Object.values(ITEMS);
    const containers = allItems.filter(i => i.category === 'CONTAINER');
    const weapons = allItems.filter(i => i.category === 'WEAPON');
    // const others = allItems.filter(i => i.category !== 'CONTAINER' && i.category !== 'WEAPON');
    
    const pool: Item[] = [];
    const poolSize = order.length + 5; // Larger buffer for more choice
    
    // Guarantee basic needs
    for (let i = 0; i < players.length; i++) {
        pool.push(containers[Math.floor(Math.random() * containers.length)]);
        pool.push(weapons[Math.floor(Math.random() * weapons.length)]);
    }
    
    // Fill rest randomly
    while (pool.length < poolSize) {
        pool.push(allItems[Math.floor(Math.random() * allItems.length)]);
    }

    // Shuffle pool
    const shuffledPool = pool.sort(() => Math.random() - 0.5);

    $draftState.set({
        availableItems: shuffledPool,
        currentTurnPlayerId: order[0],
        roundOrder: order,
        pickIndex: 0
    });
    
    $phase.set('DRAFT');
};




export const nextDraftTurn = () => {
    const draft = $draftState.get();
    
    // Check if pool is empty first
    if (draft.availableItems.length === 0) {
        nextPhase();
        return;
    }

    const nextIndex = draft.pickIndex + 1;

    // Check if end of draft
    if (nextIndex >= draft.roundOrder.length) {
        nextPhase();
        return;
    }

    $draftState.set({
        ...draft,
        pickIndex: nextIndex,
        currentTurnPlayerId: draft.roundOrder[nextIndex]
    });
};

export const skipDraftTurn = () => {
    nextDraftTurn();
};

export const draftItemToGrid = (playerId: string, itemId: string, x: number, y: number) => {
    const draft = $draftState.get();
    
    // Validate turn
    if (draft.currentTurnPlayerId !== playerId) {
        console.warn("Not your turn!");
        return;
    }

    // Validate item in pool
    const itemInPool = draft.availableItems.find(i => i.id === itemId);
    if (!itemInPool) {
        console.warn("Item not in draft pool");
        return;
    }

    const itemDef = ITEMS[itemId];
    const w = itemDef.width;
    const h = itemDef.height; 

    // Validate placement
    const items = $itemsOnGrid.get();
    
    // Collision
    if (checkCollision(x, y, w, h, items, playerId, undefined, itemDef.category)) {
        console.warn("Collision detected");
        return;
    }

    // Support
    if (itemDef.category !== 'CONTAINER') {
        if (!checkSupport(x, y, w, h, items, playerId)) {
            console.warn("No support for item");
            return;
        }
    }

    // Place it
    placeItem(itemId, x, y, 0, playerId);

    // Remove from pool (find index of exact ID or just first match)
    // Drafting usually removes specific instance from pool
    const newPool = [...draft.availableItems];
    const index = newPool.findIndex(i => i.id === itemId);
    if (index > -1) newPool.splice(index, 1);

    $draftState.set({
        ...draft,
        availableItems: newPool
    });

    // Advance turn
    nextDraftTurn();
};

export const rummageInventory = (targetPlayerId: string): boolean => {
    const items = $itemsOnGrid.get();
    const targetItems = items.filter(i => i.ownerId === targetPlayerId && !i.locked);
    
    if (targetItems.length === 0) return false;

    // Pick random item
    const itemToMessUp = targetItems[Math.floor(Math.random() * targetItems.length)];
    
    // Try to move it to a new spot
    // 10 attempts
    for(let i=0; i<10; i++) {
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
