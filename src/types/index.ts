export type Role = 'Hiker' | 'Traitor';

export type GamePhase = 'LOBBY' | 'PACKING' | 'JOURNEY' | 'CAMPFIRE' | 'GAME_OVER';

export type ItemCategory = 'ESSENTIAL' | 'TOOL' | 'SURVIVAL' | 'COMFORT' | 'SABOTAGE';

export interface Item {
  id: string;
  name: string;
  description: string;
  category: ItemCategory;
  width: number;
  height: number;
  icon: string; // Lucide icon name or image path
  scoreValue: number; // Positive for good items, negative for sabotage
}

export interface Player {
  id: string;
  name: string;
  role: Role;
  isReady: boolean;
  isTraitor: boolean; // redundancy for easy access
  avatarColor: string;
}

export interface GridCell {
  x: number;
  y: number;
  itemId: string | null;
}

export interface InventoryItemInstance {
  instanceId: string;
  itemId: string;
  x: number;
  y: number;
  rotation: 0 | 90 | 180 | 270;
}
