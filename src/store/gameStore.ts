import { atom } from 'nanostores';
import type { GamePhase, InventoryItemInstance, Item, Player, Role } from '../types';
import { ITEMS, GRID_SIZE } from '../lib/items';
import { generateId } from '../lib/utils';

// State Atoms
export const $phase = atom<GamePhase>('LOBBY');
export const $players = atom<Player[]>([]);
export const $currentPlayerId = atom<string | null>(null);
export const $itemsOnGrid = atom<InventoryItemInstance[]>([]);
export const $availableItems = atom<Item[]>(Object.values(ITEMS));
export const $draggedItem = atom<string | null>(null); // For drag feedback

// Gamification State
export interface GameState {
    day: number;
    morale: number; // 0-100
    isGameOver: boolean;
    gameResult: 'WIN' | 'LOSS' | null;
}

export const $gameState = atom<GameState>({
    day: 1,
    morale: 100,
    isGameOver: false,
    gameResult: null
});

// Derived state example (if needed) or Actions
// Helper for collision
export const checkCollision = (
  x: number, 
  y: number, 
  width: number, 
  height: number, 
  items: InventoryItemInstance[], 
  excludeInstanceId?: string
): boolean => {
  if (x < 0 || y < 0 || x + width > GRID_SIZE || y + height > GRID_SIZE) return true;

  for (const item of items) {
    if (item.instanceId === excludeInstanceId) continue;
    
    const existingItemDef = ITEMS[item.itemId];
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

// Actions
export const addPlayer = (name: string) => {
  const currentPlayers = $players.get();
  const id = generateId();
  const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500'];
  const avatarColor = colors[currentPlayers.length % colors.length];
  
  $players.set([
    ...currentPlayers,
    {
      id,
      name,
      role: 'Hiker',
      isReady: false,
      isTraitor: false,
      avatarColor
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
  $phase.set('PACKING');
  $currentPlayerId.set(newPlayers[0]?.id || null);
  $itemsOnGrid.set([]);
};

export const nextPhase = () => {
  const phases: GamePhase[] = ['LOBBY', 'PACKING', 'JOURNEY', 'CAMPFIRE'];
  const current = $phase.get();
  const currentIdx = phases.indexOf(current);
  let nextIdx = currentIdx + 1;
  
  if (current === 'CAMPFIRE') {
      advanceDay(); // Advance day when leaving campfire
      $phase.set('PACKING');
  } else {
      $phase.set(phases[nextIdx] || 'LOBBY');
  }
};

export const placeItem = (itemId: string, x: number, y: number, rotation: 0 | 90 | 180 | 270): boolean => {
  const items = $itemsOnGrid.get();
  const itemDef = ITEMS[itemId];
  if (!itemDef) return false;

  const w = (rotation === 90 || rotation === 270) ? itemDef.height : itemDef.width;
  const h = (rotation === 90 || rotation === 270) ? itemDef.width : itemDef.height;

  if (checkCollision(x, y, w, h, items)) return false;

  const newItem: InventoryItemInstance = {
    instanceId: generateId(),
    itemId,
    x,
    y,
    rotation
  };

  $itemsOnGrid.set([...items, newItem]);
  return true;
};

export const moveItem = (instanceId: string, x: number, y: number, rotation?: 0 | 90 | 180 | 270): boolean => {
  const items = $itemsOnGrid.get();
  const item = items.find(i => i.instanceId === instanceId);
  if (!item) return false;
  
  const finalRot = rotation ?? item.rotation;
  
  const itemDef = ITEMS[item.itemId];
  const w = (finalRot === 90 || finalRot === 270) ? itemDef.height : itemDef.width;
  const h = (finalRot === 90 || finalRot === 270) ? itemDef.width : itemDef.height;

  if (checkCollision(x, y, w, h, items, instanceId)) return false;

  $itemsOnGrid.set(items.map(i => 
    i.instanceId === instanceId ? { ...i, x, y, rotation: finalRot } : i
  ));
  return true;
};

export const rotateItem = (instanceId: string) => {
  const items = $itemsOnGrid.get();
  const item = items.find(i => i.instanceId === instanceId);
  if (!item) return;
  
  const newRot = (item.rotation + 90) % 360 as 0 | 90 | 180 | 270;
  moveItem(instanceId, item.x, item.y, newRot);
};

export const resetGame = () => {
    $phase.set('LOBBY');
    $itemsOnGrid.set([]);
    $players.set([]);
    $gameState.set({
        day: 1,
        morale: 100,
        isGameOver: false,
        gameResult: null
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
    
    if (newDay > 5) { // Win condition: Survive 5 days
        $gameState.set({ ...current, day: 5, isGameOver: true, gameResult: 'WIN' });
    } else {
        $gameState.set({ ...current, day: newDay });
    }
};
