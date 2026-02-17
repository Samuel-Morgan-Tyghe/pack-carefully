import React, { useRef, useState, useEffect } from 'react';
import type { PanInfo } from 'framer-motion';
import { useStore } from '@nanostores/react';
import { $itemsOnGrid, $draggedItem, moveItem, placeItem, checkCollision, rotateItem, rotateItemCounterClockwise, removeItem, toggleLock, $containers, checkSupport, $currentPlayerId, $localPlayerId, $activePreview, returnItemToPool } from '../store/gameStore';
import { GRID_SIZE, ITEMS } from '../lib/items';
import BackpackItem from './game/BackpackItem';
import BackpackGhost from './game/BackpackGhost';
import { Star } from 'lucide-react';
import { getAdjacencyBonuses, type AdjacencyResult } from '../lib/adjacency';
import clsx from 'clsx';
import ItemTooltip from './layout/ItemTooltip';

interface InventoryProps {
  playerId?: string;
  className?: string;
}

const Inventory: React.FC<InventoryProps> = ({ playerId, className }) => {
  console.log('🎮 Inventory component mounted');

  // Responsive cell size - smaller on mobile
  const [cellSize, setCellSize] = React.useState(40);
  const CELL_SIZE = cellSize;
  const GAP = 2;

  const gridRef = useRef<HTMLDivElement>(null);
  const [ghostPosition, setGhostPosition] = useState<{ x: number; y: number; valid: boolean } | null>(null);
  const [isGhostValid, setIsGhostValid] = useState(true);
  const [draggedInstanceId, setDraggedInstanceId] = useState<string | null>(null);
  const [touchState, setTouchState] = useState<{
    active: boolean;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    itemId: string | null;
    instanceId: string | null;
    initialX: number;
    initialY: number;
    rotation: number;
  } | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [pendingRotation, setPendingRotation] = useState<0 | 90 | 180 | 270>(0);

  // Detect mobile and adjust cell size
  useEffect(() => {
    const updateCellSize = () => {
      const width = window.innerWidth;
      if (width < 400) setCellSize(28);
      else if (width < 600) setCellSize(32);
      else if (width < 768) setCellSize(36);
      else setCellSize(40);
    };

    updateCellSize();
    window.addEventListener('resize', updateCellSize);
    return () => window.removeEventListener('resize', updateCellSize);
  }, []);

  const externalDraggedItem = useStore($draggedItem);
  const currentPlayerId = useStore($currentPlayerId);
  const ownerId = playerId || currentPlayerId || 'solo';

  const allItemsOnGrid = useStore($itemsOnGrid);
  const allContainers = useStore($containers);
  const localPlayerId = useStore($localPlayerId);
  const activePreview = useStore($activePreview);

  // canInteract fix: localPlayerId might be 'solo' or null in early states
  const canInteract = (ownerId === localPlayerId || localPlayerId === 'solo' || !localPlayerId) && localPlayerId !== 'OBSERVER';

  // Sink global preview to local selection
  useEffect(() => {
    if (activePreview?.type === 'instance') {
      setSelectedItemId(activePreview.id);
    } else {
      setSelectedItemId(null);
    }
  }, [activePreview]);

  // Reset rotation when selection changes
  useEffect(() => {
    setPendingRotation(0);
  }, [externalDraggedItem]);

  // Filter items for THIS player
  const itemsOnGrid = allItemsOnGrid
    .filter(i => i.ownerId === ownerId)
    .sort((a, b) => {
      const catA = ITEMS[a.itemId].category;
      const catB = ITEMS[b.itemId].category;
      if (catA === 'CONTAINER' && catB !== 'CONTAINER') return -1;
      if (catA !== 'CONTAINER' && catB === 'CONTAINER') return 1;
      return 0;
    });

  const myContainers = allContainers.filter(c => c.ownerId === ownerId);
  // Calculate cells provided by Container Items
  const containerItems = itemsOnGrid.filter(i => {
    const def = ITEMS[i.itemId];
    return def && def.category === 'CONTAINER';
  });

  const containerItemCells = containerItems.flatMap(item => {
    const def = ITEMS[item.itemId];
    const w = (item.rotation === 90 || item.rotation === 270) ? def.height : def.width;
    const h = (item.rotation === 90 || item.rotation === 270) ? def.width : def.height;
    const cells = [];
    for (let x = 0; x < w; x++) {
      for (let y = 0; y < h; y++) {
        cells.push({ x: item.x + x, y: item.y + y });
      }
    }
    return cells;
  });

  // Fixed Grid Bounds: Use full 8x8 canvas to allow placing containers anywhere
  const minX = 0;
  const minY = 0;

  const bagWidthCells = GRID_SIZE;
  const bagHeightCells = GRID_SIZE;

  const adjacencyResults = getAdjacencyBonuses(itemsOnGrid);
  const allStarredSquares = Object.values(adjacencyResults).flatMap((res: AdjacencyResult) => res.boostedSquares || []);
  const starredKeys = new Set(allStarredSquares.map((s: { x: number, y: number }) => `${s.x},${s.y}`));

  const snapToGrid = (point: { x: number, y: number }, itemWidth: number = 1, itemHeight: number = 1) => {
    if (!gridRef.current) return { x: 0, y: 0, gridX: 0, gridY: 0 };
    const rect = gridRef.current.getBoundingClientRect();
    const xOffset = point.x - rect.left;
    const yOffset = point.y - rect.top;
    const centerOffsetX = (itemWidth * (CELL_SIZE + GAP)) / 2;
    const centerOffsetY = (itemHeight * (CELL_SIZE + GAP)) / 2;
    const centeredX = xOffset - centerOffsetX;
    const centeredY = yOffset - centerOffsetY;
    const gridX = Math.round(centeredX / (CELL_SIZE + GAP)) + minX;
    const gridY = Math.round(centeredY / (CELL_SIZE + GAP)) + minY;

    return {
      x: (gridX - minX) * (CELL_SIZE + GAP),
      y: (gridY - minY) * (CELL_SIZE + GAP),
      gridX,
      gridY
    };
  };

  const calculateGhostValidity = (gx: number, gy: number, itemId: string, instanceId?: string, currentRot: number = 0) => {
    const itemDef = ITEMS[itemId];
    if (!itemDef) return false;
    const w = (currentRot === 90 || currentRot === 270) ? itemDef.height : itemDef.width;
    const h = (currentRot === 90 || currentRot === 270) ? itemDef.width : itemDef.height;
    if (checkCollision(gx, gy, w, h, itemsOnGrid, ownerId, instanceId, itemDef.category)) return false;
    if (itemDef.category !== 'CONTAINER') return checkSupport(gx, gy, w, h, itemsOnGrid, ownerId);
    return true;
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (!canInteract) return;

      // Cancel drag on Escape
      if (e.key === 'Escape' && (draggedInstanceId || externalDraggedItem)) {
        setDraggedInstanceId(null);
        setGhostPosition(null);
        $draggedItem.set(null);
        $activePreview.set(null);
        return;
      }

      // Handle rotation for selected shelf items OR placed items
      if (externalDraggedItem) {
        if (e.key.toLowerCase() === 'r' || e.key.toLowerCase() === 'e') {
          e.preventDefault();
          if (selectedItemId) {
            rotateItem(selectedItemId);
          } else {
            setPendingRotation(prev => (prev + 90) % 360 as 0 | 90 | 180 | 270);
          }
          return;
        }
        if (e.key.toLowerCase() === 'q') {
          e.preventDefault();
          if (selectedItemId) {
            rotateItemCounterClockwise(selectedItemId);
          } else {
            setPendingRotation(prev => (prev - 90 + 360) % 360 as 0 | 90 | 180 | 270);
          }
          return;
        }
      }

      if (!selectedItemId) return;
      const item = itemsOnGrid.find(i => i.instanceId === selectedItemId);
      if (!item) return;

      switch (e.key.toLowerCase()) {
        case 'delete':
        case 'backspace':
          e.preventDefault();
          removeItem(selectedItemId);
          setSelectedItemId(null);
          $activePreview.set(null);
          break;
        case ' ':
          e.preventDefault();
          toggleLock(selectedItemId);
          break;
        case 'tab': {
          e.preventDefault();
          // Cycle to next item
          const currentIndex = itemsOnGrid.findIndex(i => i.instanceId === selectedItemId);
          const nextIndex = (currentIndex + 1) % itemsOnGrid.length;
          const nextItem = itemsOnGrid[nextIndex];
          setSelectedItemId(nextItem?.instanceId || null);
          if (nextItem) {
            $activePreview.set({ type: 'instance', id: nextItem.instanceId });
          }
          break;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItemId, itemsOnGrid, draggedInstanceId, externalDraggedItem, canInteract, pendingRotation]);

  const handleDragStart = (instanceId: string) => {
    if (!canInteract) return;
    setDraggedInstanceId(instanceId);
  };

  const handleDrag = (_instanceId: string, itemId: string, currentRot: number, info: PanInfo) => {
    if (!canInteract) return;
    const itemDef = ITEMS[itemId];
    const w = (currentRot === 90 || currentRot === 270) ? itemDef.height : itemDef.width;
    const h = (currentRot === 90 || currentRot === 270) ? itemDef.width : itemDef.height;
    const { x, y, gridX, gridY } = snapToGrid(info.point, w, h);
    const valid = calculateGhostValidity(gridX, gridY, itemId, draggedInstanceId || undefined, currentRot);
    setIsGhostValid(valid);
    setGhostPosition({ x, y, valid });
  };

  const handleDragEnd = (instanceId: string, itemId: string, currentRot: number, info: PanInfo) => {
    const itemDef = ITEMS[itemId];
    const w = (currentRot === 90 || currentRot === 270) ? itemDef.height : itemDef.width;
    const h = (currentRot === 90 || currentRot === 270) ? itemDef.width : itemDef.height;
    const { gridX, gridY } = snapToGrid(info.point, w, h);

    if (calculateGhostValidity(gridX, gridY, itemId, instanceId, currentRot)) {
      moveItem(instanceId, gridX, gridY, currentRot as 0 | 90 | 180 | 270);
    } else {
      // Return to shelf logic: If placement is invalid, remove from grid and restart ghost
      removeItem(instanceId);
      returnItemToPool(ownerId, itemId);
      $draggedItem.set(itemId);
      $activePreview.set({ type: 'definition', id: itemId });
      setPendingRotation(currentRot as 0 | 90 | 180 | 270);
      setErrorMessage(`${itemDef.name} returned to shelf!`);
      setTimeout(() => setErrorMessage(null), 3000);
    }

    setDraggedInstanceId(null);
    setGhostPosition(null);
  };

  const handleDragOverExtern = (e: React.DragEvent) => {
    e.preventDefault();
    if (!canInteract) return;
    if (externalDraggedItem) {
      const itemDef = ITEMS[externalDraggedItem];
      if (!itemDef) return;
      const { x, y, gridX, gridY } = snapToGrid({ x: e.clientX, y: e.clientY }, itemDef.width, itemDef.height);
      const valid = calculateGhostValidity(gridX, gridY, externalDraggedItem);
      setIsGhostValid(valid);
      setGhostPosition({ x, y, valid });
    }
  };

  const handleTouchStart = (e: React.TouchEvent, instanceId: string, itemId: string, rotation: number) => {
    const touch = e.touches[0];
    if (!touch) return;
    setTouchState({ active: true, startX: touch.clientX, startY: touch.clientY, currentX: touch.clientX, currentY: touch.clientY, itemId, instanceId, initialX: touch.clientX, initialY: touch.clientY, rotation });
    setDraggedInstanceId(instanceId);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchState?.active || !touchState.itemId) {
      // For selected item preview on mobile
      if (externalDraggedItem) {
        const touch = e.touches[0];
        const itemDef = ITEMS[externalDraggedItem];
        if (touch && itemDef) {
          const { x, y, gridX, gridY } = snapToGrid({ x: touch.clientX, y: touch.clientY }, itemDef.width, itemDef.height);
          setGhostPosition({ x, y, valid: calculateGhostValidity(gridX, gridY, externalDraggedItem) });
        }
      }
      return;
    }
    const touch = e.touches[0];
    if (!touch) return;
    setTouchState(prev => prev ? { ...prev, currentX: touch.clientX, currentY: touch.clientY } : null);
    const itemDef = ITEMS[touchState.itemId];
    const w = (touchState.rotation === 90 || touchState.rotation === 270) ? itemDef.height : itemDef.width;
    const h = (touchState.rotation === 90 || touchState.rotation === 270) ? itemDef.width : itemDef.height;
    const { x, y, gridX, gridY } = snapToGrid({ x: touch.clientX, y: touch.clientY }, w, h);
    const valid = calculateGhostValidity(gridX, gridY, touchState.itemId, draggedInstanceId || undefined, touchState.rotation);
    setIsGhostValid(valid);
    setGhostPosition({ x, y, valid });
  };

  const handleTouchEnd = (_e: React.TouchEvent, instanceId: string) => {
    if (!touchState?.active || !touchState.itemId) {
      // Handle external item placement on mobile touch end
      if (externalDraggedItem && ghostPosition) {
        const itemDef = ITEMS[externalDraggedItem];
        const w = (pendingRotation === 90 || pendingRotation === 270) ? itemDef.height : itemDef.width;
        const h = (pendingRotation === 90 || pendingRotation === 270) ? itemDef.width : itemDef.height;
        const { gridX, gridY } = snapToGrid({ x: touchState?.currentX || 0, y: touchState?.currentY || 0 }, w, h);
        if (calculateGhostValidity(gridX, gridY, externalDraggedItem, undefined, pendingRotation)) {
          placeItem(externalDraggedItem, gridX, gridY, pendingRotation, ownerId);
          $draggedItem.set(null);
          $activePreview.set(null);
        } else {
          // Return to shelf: Keep selected so user can try again
          setErrorMessage(`${itemDef.name} returned to shelf!`);
          setTimeout(() => setErrorMessage(null), 2000);
        }
      }
      setTouchState(null);
      setDraggedInstanceId(null);
      setGhostPosition(null);
      return;
    }
    const itemDef = ITEMS[touchState.itemId];
    const w = (touchState.rotation === 90 || touchState.rotation === 270) ? itemDef.height : itemDef.width;
    const h = (touchState.rotation === 90 || touchState.rotation === 270) ? itemDef.width : itemDef.height;
    const { gridX, gridY } = snapToGrid({ x: touchState.currentX, y: touchState.currentY }, w, h);
    if (calculateGhostValidity(gridX, gridY, touchState.itemId, instanceId, touchState.rotation)) {
      moveItem(instanceId, gridX, gridY, touchState.rotation as 0 | 90 | 180 | 270);
    } else {
      removeItem(instanceId);
      returnItemToPool(ownerId, touchState.itemId);
      $draggedItem.set(touchState.itemId);
      $activePreview.set({ type: 'definition', id: touchState.itemId });
      setPendingRotation(touchState.rotation as 0 | 90 | 180 | 270);
      setErrorMessage(`${itemDef.name} returned to shelf!`);
      setTimeout(() => setErrorMessage(null), 3000);
    }
    setTouchState(null);
    setDraggedInstanceId(null);
    setGhostPosition(null);
  };

  return (
    <div className="flex flex-col items-center w-full px-2 md:px-0">
      {errorMessage && (
        <div className="mb-4 px-4 py-3 bg-red-500/20 border-2 border-red-500 rounded-lg text-red-200 font-bold text-xs animate-in fade-in slide-in-from-top-2">
          ⚠️ {errorMessage}
        </div>
      )}

      <div className={clsx("relative bg-wood-800/40 p-3 md:p-8 rounded-2xl shadow-bag border-4 border-wood-600 flex flex-col items-center", className)}>
        <div
          ref={gridRef}
          className="relative transition-all duration-500 touch-manipulation overflow-visible"
          id="inventory-grid"
          style={{
            width: bagWidthCells * CELL_SIZE + (bagWidthCells - 1) * GAP,
            height: bagHeightCells * CELL_SIZE + (bagHeightCells - 1) * GAP,
            maxWidth: '100%',
            touchAction: 'none'
          }}
          onDragOver={handleDragOverExtern}
          onDragLeave={() => setGhostPosition(null)}
          onMouseMove={(e) => {
            if (externalDraggedItem && !draggedInstanceId) {
              const itemDef = ITEMS[externalDraggedItem];
              if (!itemDef) return;
              const w = (pendingRotation === 90 || pendingRotation === 270) ? itemDef.height : itemDef.width;
              const h = (pendingRotation === 90 || pendingRotation === 270) ? itemDef.width : itemDef.height;
              const { x, y, gridX, gridY } = snapToGrid({ x: e.clientX, y: e.clientY }, w, h);
              const valid = calculateGhostValidity(gridX, gridY, externalDraggedItem, undefined, pendingRotation);
              setGhostPosition({ x, y, valid });
              setIsGhostValid(valid);
            }
          }}
          onMouseLeave={() => !draggedInstanceId && setGhostPosition(null)}
          onClick={(e) => {
            // Tap-to-place
            if (!externalDraggedItem || !canInteract) return;
            if (draggedInstanceId) return; // Don't place external if moving internal

            const itemDef = ITEMS[externalDraggedItem];
            if (!itemDef) return;
            const w = (pendingRotation === 90 || pendingRotation === 270) ? itemDef.height : itemDef.width;
            const h = (pendingRotation === 90 || pendingRotation === 270) ? itemDef.width : itemDef.height;
            const { gridX, gridY } = snapToGrid({ x: e.clientX, y: e.clientY }, w, h);

            if (calculateGhostValidity(gridX, gridY, externalDraggedItem, undefined, pendingRotation)) {
              placeItem(externalDraggedItem, gridX, gridY, pendingRotation as 0 | 90 | 180 | 270, ownerId);
              $draggedItem.set(null); // Clear selection after place
              $activePreview.set(null);
            } else {
              // Return to shelf logic: Keep selected but show error
              setErrorMessage(`${itemDef.name} returned to shelf!`);
              setTimeout(() => setErrorMessage(null), 2000);
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            const itemId = e.dataTransfer.getData('itemId');
            setGhostPosition(null);
            if (itemId && canInteract) {
              const itemDef = ITEMS[itemId];
              const w = (pendingRotation === 90 || pendingRotation === 270) ? itemDef.height : itemDef.width;
              const h = (pendingRotation === 90 || pendingRotation === 270) ? itemDef.width : itemDef.height;
              const { gridX, gridY } = snapToGrid({ x: e.clientX, y: e.clientY }, w, h);

              if (calculateGhostValidity(gridX, gridY, itemId, undefined, pendingRotation)) {
                placeItem(itemId, gridX, gridY, pendingRotation as 0 | 90 | 180 | 270, ownerId);
                $draggedItem.set(null);
                $activePreview.set(null);
              } else {
                // Return to shelf logic: Keep selected (already set via $draggedItem)
                setErrorMessage(`${itemDef.name} returned to shelf!`);
                setTimeout(() => setErrorMessage(null), 2000);
              }
            }
          }}
        >
          {/* Base Grid Background (Full 8x8) */}
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
            const x = i % GRID_SIZE;
            const y = Math.floor(i / GRID_SIZE);
            return (
              <div
                key={`grid-bg-${i}`}
                className="absolute border border-wood-600/10 pointer-events-none"
                style={{
                  left: x * (CELL_SIZE + GAP),
                  top: y * (CELL_SIZE + GAP),
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                }}
              >
                <div className="absolute inset-0 border border-wood-600/5 bg-wood-900/5" />
              </div>
            );
          })}

          {/* Surface Cells */}
          {myContainers.map(container =>
            container.cells.map((cell, idx) => {
              const isDisabled = container.disabledCells?.some(dc => dc.x === cell.x && dc.y === cell.y);
              if (isDisabled) return null;
              const hasLeft = container.cells.some(n => n.x === cell.x - 1 && n.y === cell.y);
              const hasRight = container.cells.some(n => n.x === cell.x + 1 && n.y === cell.y);
              const hasTop = container.cells.some(n => n.x === cell.x && n.y === cell.y - 1);
              const hasBottom = container.cells.some(n => n.x === cell.x && n.y === cell.y + 1);
              return (
                <div
                  key={`${container.id}-${idx}`}
                  className="absolute transition-all bg-wood-700/80 shadow-inner pointer-events-none"
                  style={{
                    left: (cell.x - minX) * (CELL_SIZE + GAP),
                    top: (cell.y - minY) * (CELL_SIZE + GAP),
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    borderLeft: !hasLeft ? '3px solid #3E2723' : '1px solid rgba(255,255,255,0.05)',
                    borderRight: !hasRight ? '3px solid #3E2723' : '1px solid rgba(255,255,255,0.05)',
                    borderTop: !hasTop ? '3px solid #3E2723' : '1px solid rgba(255,255,255,0.05)',
                    borderBottom: !hasBottom ? '3px solid #3E2723' : '1px solid rgba(255,255,255,0.05)',
                    borderTopLeftRadius: (!hasTop && !hasLeft) ? '8px' : '0',
                    borderTopRightRadius: (!hasTop && !hasRight) ? '8px' : '0',
                    borderBottomLeftRadius: (!hasBottom && !hasLeft) ? '8px' : '0',
                    borderBottomRightRadius: (!hasBottom && !hasRight) ? '8px' : '0',
                  }}
                ><div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/leather.png')]" /></div>
              );
            })
          )}

          {/* Surface Cells (Container Items) */}
          {containerItemCells.map((cell, idx) => {
            return (
              <div
                key={`item-cell-${idx}`}
                className="absolute transition-all bg-wood-700/80 shadow-inner pointer-events-none"
                style={{
                  left: (cell.x - minX) * (CELL_SIZE + GAP),
                  top: (cell.y - minY) * (CELL_SIZE + GAP),
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  borderRadius: '4px',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
              ><div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/leather.png')]" /></div>
            );
          })}

          <BackpackGhost
            ghostPosition={ghostPosition}
            isGhostValid={isGhostValid}
            draggedInstanceId={draggedInstanceId}
            externalDraggedItem={externalDraggedItem}
            itemsOnGrid={itemsOnGrid}
            CELL_SIZE={CELL_SIZE}
            GAP={GAP}
            rotation={pendingRotation}
          />

          {itemsOnGrid.map((item) => (
            <BackpackItem
              key={item.instanceId}
              item={item}
              draggedInstanceId={draggedInstanceId}
              onDragStart={handleDragStart}
              onDrag={handleDrag}
              onDragEnd={handleDragEnd}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              CELL_SIZE={CELL_SIZE}
              GAP={GAP}
              isSelected={selectedItemId === item.instanceId}
              onSelect={() => $activePreview.set({ type: 'instance', id: item.instanceId })}
              minX={minX}
              minY={minY}
              adjacencyResult={adjacencyResults[item.instanceId]}
            />
          ))}

          {/* Star Overlay */}
          {(selectedItemId || draggedInstanceId || externalDraggedItem) && (
            <div className="absolute inset-0 pointer-events-none z-50">
              {myContainers.map(container =>
                container.cells.map((cell, idx) => {
                  if (starredKeys.has(`${cell.x},${cell.y}`)) {
                    return (
                      <div
                        key={`star-overlay-${container.id}-${idx}`}
                        className="absolute flex items-center justify-center animate-bounce"
                        style={{
                          left: (cell.x - minX) * (CELL_SIZE + GAP),
                          top: (cell.y - minY) * (CELL_SIZE + GAP),
                          width: CELL_SIZE,
                          height: CELL_SIZE,
                        }}
                      ><Star className="w-6 h-6 text-gold-400 fill-gold-400 drop-shadow-[0_0_8px_rgba(255,215,0,0.8)]" /></div>
                    );
                  }
                  return null;
                })
              )}
            </div>
          )}
        </div>

        {/* Selected Item Tooltip */}
        {activePreview && (() => {
          const itemInGrid = activePreview.type === 'instance' ? itemsOnGrid.find(i => i.instanceId === activePreview.id) : null;
          const itemId = itemInGrid ? itemInGrid.itemId : (activePreview.type === 'definition' ? activePreview.id : null);

          if (!itemId) return null;

          return (
            <ItemTooltip
              itemId={itemId}
              onClose={() => $activePreview.set(null)}
            />
          );
        })()}
      </div>
    </div>
  );
};

export default Inventory;
