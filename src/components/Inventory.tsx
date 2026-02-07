import React, { useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import { $itemsOnGrid, $draggedItem, moveItem, placeItem, checkCollision } from '../store/gameStore';
import { GRID_SIZE, ITEMS } from '../lib/items';
import BackpackItem from './game/BackpackItem';
import BackpackGhost from './game/BackpackGhost';

const CELL_SIZE = 64; 
const GAP = 4;

const Inventory: React.FC = () => {
  const itemsOnGrid = useStore($itemsOnGrid);
  const externalDraggedItem = useStore($draggedItem);
  const gridRef = useRef<HTMLDivElement>(null);
  
  // Track dragging state
  const [draggedInstanceId, setDraggedInstanceId] = useState<string | null>(null);
  const [ghostPosition, setGhostPosition] = useState<{x: number, y: number} | null>(null);
  const [isGhostValid, setIsGhostValid] = useState(true);

  const snapToGrid = (point: {x: number, y: number}) => {
     if (!gridRef.current) return { x: 0, y: 0, gridX: 0, gridY: 0 };
     const rect = gridRef.current.getBoundingClientRect();
     // rect.left includes the 4px border.
     // The inner content starts at rect.left + 4px (border) + 16px (padding) = 20px offset.
     const xOffset = point.x - (rect.left + 20); 
     const yOffset = point.y - (rect.top + 20);
     
     // Use Math.floor to ensure we select the cell we are hovering over, 
     // rather than snapping to the next one halfway through.
     const gridX = Math.floor(xOffset / (CELL_SIZE + GAP));
     const gridY = Math.floor(yOffset / (CELL_SIZE + GAP));
     
     // Clamp to grid bounds to prevent "way off" values outside
     const clampedX = Math.max(0, Math.min(GRID_SIZE - 1, gridX));
     const clampedY = Math.max(0, Math.min(GRID_SIZE - 1, gridY));

     return { 
         x: clampedX * (CELL_SIZE + GAP), 
         y: clampedY * (CELL_SIZE + GAP),
         gridX: clampedX,
         gridY: clampedY
     };
  };

  const calculateGhostValidity = (gx: number, gy: number, itemId: string, instanceId?: string, currentRot: number = 0) => {
      const itemDef = ITEMS[itemId];
      if (!itemDef) return false;
      const w = (currentRot === 90 || currentRot === 270) ? itemDef.height : itemDef.width;
      const h = (currentRot === 90 || currentRot === 270) ? itemDef.width : itemDef.height;
      return !checkCollision(gx, gy, w, h, itemsOnGrid, instanceId);
  };

  const handleDragStart = (instanceId: string) => {
      setDraggedInstanceId(instanceId);
      // We don't set ghost position yet, wait for move
  };

  const handleDrag = (_instanceId: string, itemId: string, currentRot: number, info: any) => {
      const { gridX, gridY } = snapToGrid(info.point);
      
      // Update ghost
      setGhostPosition({ x: gridX, y: gridY });
      
      // Check validation
      const valid = calculateGhostValidity(gridX, gridY, itemId, draggedInstanceId || undefined, currentRot);
      setIsGhostValid(valid);
  };

  const handleDragEnd = (instanceId: string, itemId: string, currentRot: number, info: any) => {
    const { gridX, gridY } = snapToGrid(info.point);
    
    if (calculateGhostValidity(gridX, gridY, itemId, instanceId, currentRot)) {
        moveItem(instanceId, gridX, gridY, currentRot as any);
    }
    
    // Reset state
    setDraggedInstanceId(null);
    setGhostPosition(null);
  };

  // HTML5 Drag Over (from Sidebar)
  const handleDragOverExtern = (e: React.DragEvent) => {
      e.preventDefault();
      
      // Only show ghost if we know what item is being dragged (from store)
      if (externalDraggedItem) {
          const rect = gridRef.current?.getBoundingClientRect();
          if (rect) {
              const x = e.clientX - (rect.left + 20);
              const y = e.clientY - (rect.top + 20);
              const gx = Math.floor(x / (CELL_SIZE + GAP));
              const gy = Math.floor(y / (CELL_SIZE + GAP));
              
              // Allow ghost to show even if out of bounds (to show red), but clamp for stability or check bounds
              if (gx >= -1 && gx <= GRID_SIZE && gy >= -1 && gy <= GRID_SIZE) {
                   setGhostPosition({ x: gx, y: gy });
                   const valid = calculateGhostValidity(gx, gy, externalDraggedItem);
                   setIsGhostValid(valid);
              }
          }
      }
  };

  const handleDragLeaveExtern = () => {
      if (externalDraggedItem) {
          setGhostPosition(null);
      }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 text-camp-orange font-bold text-xl uppercase tracking-widest">
        Backpack Capacity
      </div>
      
      {/* Grid Container - The "Backpack" */}
      <div 
        ref={gridRef}
        className="relative rounded-3xl p-4 shadow-leather-stitch bg-leather-texture transition-colors"
        id="inventory-grid"
        style={{
          width: GRID_SIZE * CELL_SIZE + 32 + (GRID_SIZE - 1) * GAP, 
          height: GRID_SIZE * CELL_SIZE + 32 + (GRID_SIZE - 1) * GAP,
        }}
        onDragOver={handleDragOverExtern}
        onDragLeave={handleDragLeaveExtern}
        onDrop={(e) => {
            e.preventDefault();
            const itemId = e.dataTransfer.getData('itemId');
            // Reset ghost
            setGhostPosition(null);

            if (itemId) {
                const rect = gridRef.current?.getBoundingClientRect();
                if (rect) {
                    // Same offset logic: border(4) + padding(16) = 20
                    const x = e.clientX - (rect.left + 20);
                    const y = e.clientY - (rect.top + 20);
                    
                    const gx = Math.floor(x / (CELL_SIZE + GAP));
                    const gy = Math.floor(y / (CELL_SIZE + GAP));
                    
                    // Only place if within bounds
                    if (gx >= 0 && gx < GRID_SIZE && gy >= 0 && gy < GRID_SIZE) {
                         if (!checkCollision(gx, gy, ITEMS[itemId].width, ITEMS[itemId].height, itemsOnGrid)) {
                              placeItem(itemId, gx, gy, 0);
                         }
                    }
                }
            }
        }}
      >
        {/* Render Grid Background Cells */}
        <div 
          className="grid gap-[4px]"
          style={{ 
            gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
            gridTemplateRows: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`
          }}
        >
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
              return (
                <div 
                  key={i} 
                  className="bg-black/20 border-white/5 rounded-sm border shadow-cell-inset"
                />
              );
          })}
        </div>

        {/* Ghost Highlight */}
        <BackpackGhost 
             ghostPosition={ghostPosition}
             isGhostValid={isGhostValid}
             draggedInstanceId={draggedInstanceId}
             externalDraggedItem={externalDraggedItem}
             itemsOnGrid={itemsOnGrid}
             CELL_SIZE={CELL_SIZE}
             GAP={GAP}
        />

        {/* Render Items */}
        { itemsOnGrid.map((item) => (
            <BackpackItem 
                key={item.instanceId}
                item={item}
                draggedInstanceId={draggedInstanceId}
                onDragStart={handleDragStart}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                CELL_SIZE={CELL_SIZE}
                GAP={GAP}
            />
        ))}

      </div>
      
      <div className="flex gap-4 mt-4 text-xs font-bold uppercase tracking-widest text-slate-500">
        <div>Total: {itemsOnGrid.length}</div>
        <div>Drag to move • Right-click rotate</div>
      </div>
    </div>
  );
};

export default Inventory;
