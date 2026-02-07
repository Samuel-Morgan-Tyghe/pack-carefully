import React, { useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import { $itemsOnGrid, $draggedItem, moveItem, rotateItem, placeItem, checkCollision } from '../store/gameStore';
import { GRID_SIZE, ITEMS } from '../lib/items';
import { cn } from '../lib/utils';
import * as LucideIcons from 'lucide-react';
import { motion } from 'framer-motion';

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
        {ghostPosition && (draggedInstanceId || externalDraggedItem) && (
            (() => {
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
                )
            })()
        )}

        {/* Render Items */}
        { itemsOnGrid.map((item) => {
          const itemDef = ITEMS[item.itemId];
          if (!itemDef) return null;

          const w = (item.rotation === 90 || item.rotation === 270) ? itemDef.height : itemDef.width;
          const h = (item.rotation === 90 || item.rotation === 270) ? itemDef.width : itemDef.height;
          const isDragging = item.instanceId === draggedInstanceId;

          return (
            <motion.div
              key={item.instanceId}
              drag
              dragMomentum={false}
              dragElastic={0.1}
              onDragStart={() => handleDragStart(item.instanceId)}
              onDrag={(_e, info) => handleDrag(item.instanceId, item.itemId, item.rotation, info)}
              onDragEnd={(_e, info) => handleDragEnd(item.instanceId, item.itemId, item.rotation, info)}
              whileDrag={{ scale: 1.05, zIndex: 100, cursor: 'grabbing', opacity: 0.8 }}
              className="absolute top-4 left-4" 
              initial={false}
              animate={{
                x: item.x * (CELL_SIZE + GAP), 
                y: item.y * (CELL_SIZE + GAP),
                rotate: 0 
              }}
              style={{
                width: (w * CELL_SIZE) + ((w - 1) * GAP),
                height: (h * CELL_SIZE) + ((h - 1) * GAP),
              }}
            >
              <div 
                  className={cn(
                    "w-full h-full flex items-center justify-center rounded-lg shadow-md border-2",
                    "bg-parchment-500 border-parchment-800 hover:border-gold-500 cursor-grab active:cursor-grabbing",
                    "transition-transform duration-200 group relative overflow-hidden",
                    // Texture overlay
                    "before:absolute before:inset-0 before:bg-paper-texture before:opacity-50",
                    isDragging && "scale-105 shadow-xl rotate-0 z-50 ring-2 ring-gold-400"
                  )}
                  style={{
                      backgroundSize: `${CELL_SIZE/2 + 2}px ${CELL_SIZE/2 + 2}px` // Fine grid hints
                  }}
                  onContextMenu={(e) => {
                      e.preventDefault();
                      rotateItem(item.instanceId);
                  }}
              >
                  {/* Subtle pattern or gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                  
                  {React.createElement(
                    (LucideIcons as any)[itemDef.icon] || LucideIcons.Package,
                    { size: Math.min(w, h) * 24, className: "text-wood-900 drop-shadow-sm opacity-90 relative z-10" }
                  )}
                  
                  {/* Label on hover or large items */}
                  {(w > 1 || h > 1) && (
                      <span className="absolute bottom-1 text-[9px] uppercase font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-black/50 px-1 rounded z-10">
                          {itemDef.name}
                      </span>
                  )}
                  
                  {/* Dimensions hint */}
                  <div className="absolute top-1 right-1 text-[8px] text-wood-600 font-mono z-10 font-bold">
                      {w}x{h}
                  </div>
              </div>
            </motion.div>
          );
        })}

      </div>
      
      <div className="flex gap-4 mt-4 text-xs font-bold uppercase tracking-widest text-slate-500">
        <div>Total: {itemsOnGrid.length}</div>
        <div>Drag to move • Right-click rotate</div>
      </div>
    </div>
  );
};

export default Inventory;
