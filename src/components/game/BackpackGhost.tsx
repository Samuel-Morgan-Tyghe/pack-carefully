import React from 'react';
import { cn } from '../../lib/utils';
import { ITEMS } from '../../lib/items';
import type { InventoryItemInstance } from '../../types';

interface BackpackGhostProps {
    ghostPosition: { x: number, y: number } | null;
    isGhostValid: boolean;
    draggedInstanceId: string | null;
    externalDraggedItem: string | null;
    itemsOnGrid: InventoryItemInstance[];
    CELL_SIZE: number;
    GAP: number;
    rotation?: number;
}

const BackpackGhost: React.FC<BackpackGhostProps> = ({
    ghostPosition,
    isGhostValid,
    draggedInstanceId,
    externalDraggedItem,
    itemsOnGrid,
    CELL_SIZE,
    GAP,
    rotation = 0
}) => {
    if (!ghostPosition || (!draggedInstanceId && !externalDraggedItem)) return null;

    // Determine which item is ghosting
    let itemId = externalDraggedItem;
    let rot = rotation;

    if (draggedInstanceId) {
        const item = itemsOnGrid.find(i => i.instanceId === draggedInstanceId);
        if (item) {
            itemId = item.itemId;
            rot = item.rotation;
        }
    }

    if (!itemId) return null;
    const itemDef = ITEMS[itemId];
    if (!itemDef) return null;

    const w = (rot === 90 || rot === 270) ? itemDef.height : itemDef.width;
    const h = (rot === 90 || rot === 270) ? itemDef.width : itemDef.height;

    return (
        <div
            className={cn(
                "absolute rounded-lg border-2 border-dashed z-[100] transition-all duration-75 pointer-events-none shadow-2xl",
                isGhostValid
                    ? "bg-green-500/20 border-green-400/80 shadow-green-500/10"
                    : "bg-red-500/20 border-red-400/80 shadow-red-500/10"
            )}
            style={{
                left: ghostPosition.x,
                top: ghostPosition.y,
                width: (w * CELL_SIZE) + ((w - 1) * GAP),
                height: (h * CELL_SIZE) + ((h - 1) * GAP),
            }}
        >
            {/* Pulsing Interior */}
            <div className={cn(
                "absolute inset-0 animate-pulse-slow rounded-lg",
                isGhostValid ? "bg-green-400/5" : "bg-red-400/5"
            )} />

            {/* Status Badge */}
            <div className={cn(
                "absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest whitespace-nowrap shadow-lg border",
                isGhostValid
                    ? "bg-green-600 text-white border-green-400"
                    : "bg-red-600 text-white border-red-400"
            )}>
                {isGhostValid ? "Valid Spot" : "Invalid Spot"}
            </div>
        </div>
    );
};

export default BackpackGhost;
