import React from 'react';
import { cn } from '../../lib/utils';
import { ITEMS } from '../../lib/items';

interface BackpackGhostProps {
    ghostPosition: { x: number, y: number } | null;
    isGhostValid: boolean;
    draggedInstanceId: string | null;
    externalDraggedItem: string | null;
    itemsOnGrid: any[];
    CELL_SIZE: number;
    GAP: number;
}

const BackpackGhost: React.FC<BackpackGhostProps> = ({ 
    ghostPosition, 
    isGhostValid, 
    draggedInstanceId, 
    externalDraggedItem, 
    itemsOnGrid, 
    CELL_SIZE, 
    GAP 
}) => {
    if (!ghostPosition || (!draggedInstanceId && !externalDraggedItem)) return null;

    // Determine which item is ghosting
    let itemId = externalDraggedItem;
    let rot = 0;
    
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
                "absolute top-4 left-4 rounded-lg border-2 border-dashed z-40 transition-all duration-75 pointer-events-none",
                isGhostValid ? "bg-green-500/20 border-green-400" : "bg-red-500/20 border-red-400"
            )}
            style={{
                left: 16 + ghostPosition.x * (CELL_SIZE + GAP),
                top: 16 + ghostPosition.y * (CELL_SIZE + GAP),
                width: (w * CELL_SIZE) + ((w - 1) * GAP),
                height: (h * CELL_SIZE) + ((h - 1) * GAP),
            }}
        >
                {/* Optional label */}
                <div className={cn("absolute -top-6 left-0 text-[10px] font-bold uppercase", isGhostValid ? "text-green-400" : "text-red-400")}>
                    {isGhostValid ? "Place Here" : "Invalid"}
                </div>
        </div>
    );
};

export default BackpackGhost;
