import React, { useRef, useState, useEffect } from 'react';
import type { PanInfo } from 'framer-motion';
import { useStore } from '@nanostores/react';
import { $itemsOnGrid, $draggedItem, moveItem, placeItem, checkCollision, $players, $draftState, rotateItem, rotateItemCounterClockwise, removeItem, toggleLock, $containers, checkSupport, $currentPlayerId } from '../store/gameStore';
import { GRID_SIZE, ITEMS } from '../lib/items';
import BackpackItem from './game/BackpackItem';
import BackpackGhost from './game/BackpackGhost';
import clsx from 'clsx';

const Inventory: React.FC = () => {
  console.log('🎮 Inventory component mounted');

  // Responsive cell size - smaller on mobile
  const [cellSize, setCellSize] = React.useState(64);
  const CELL_SIZE = cellSize;
  const GAP = 4;

  // Detect mobile and adjust cell size
  React.useEffect(() => {
    const updateCellSize = () => {
      const width = window.innerWidth;
      console.log('📐 Screen width:', width);

      // Very small screens (iPhone SE, etc) - 32px cells
      if (width < 400) {
        console.log('📱 Very small screen - 32px cells');
        setCellSize(32);
      }
      // Small mobile screens - 40px cells
      else if (width < 600) {
        console.log('📱 Small mobile - 40px cells');
        setCellSize(40);
      }
      // Tablet/larger mobile - 48px cells
      else if (width < 768) {
        console.log('📱 Large mobile - 48px cells');
        setCellSize(48);
      }
      // Desktop - 64px cells
      else {
        console.log('💻 Desktop - 64px cells');
        setCellSize(64);
      }
    };

    updateCellSize();
    window.addEventListener('resize', updateCellSize);
    return () => window.removeEventListener('resize', updateCellSize);
  }, []);
  const externalDraggedItem = useStore($draggedItem);
  const players = useStore($players);
  const currentPlayerId = useStore($currentPlayerId);
  const ownerId = currentPlayerId || players[0]?.id || 'solo';
  const allItemsOnGrid = useStore($itemsOnGrid);
  const allContainers = useStore($containers);

  // Sort items: Containers first (Layer 0), then Gear (Layer 1)
  const itemsOnGrid = allItemsOnGrid
    .filter(i => i.ownerId === ownerId)
    .sort((a, b) => {
      const catA = ITEMS[a.itemId].category;
      const catB = ITEMS[b.itemId].category;
      if (catA === 'CONTAINER' && catB !== 'CONTAINER') return -1;
      if (catA !== 'CONTAINER' && catB === 'CONTAINER') return 1;
      return 0;
    });
  const gridRef = useRef<HTMLDivElement>(null);

  // Track dragging state
  const [draggedInstanceId, setDraggedInstanceId] = useState<string | null>(null);
  const [ghostPosition, setGhostPosition] = useState<{ x: number, y: number } | null>(null);
  const [isGhostValid, setIsGhostValid] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Touch state for mobile drag-and-drop
  const [touchState, setTouchState] = useState<{
    active: boolean;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    itemId: string | null;
    rotation: number;
  } | null>(null);

  const snapToGrid = (point: { x: number, y: number }, itemWidth: number = 1, itemHeight: number = 1) => {
    if (!gridRef.current) return { x: 0, y: 0, gridX: 0, gridY: 0 };
    const rect = gridRef.current.getBoundingClientRect();
    // rect.left includes the 4px border.
    // The inner content starts at rect.left + 4px (border) + 16px (padding) = 20px offset.
    const xOffset = point.x - (rect.left + 20);
    const yOffset = point.y - (rect.top + 20);

    // Center the item under the cursor by offsetting by half the item size
    const centerOffsetX = (itemWidth * (CELL_SIZE + GAP)) / 2;
    const centerOffsetY = (itemHeight * (CELL_SIZE + GAP)) / 2;

    // Adjust for centering
    const centeredX = xOffset - centerOffsetX;
    const centeredY = yOffset - centerOffsetY;

    // Snap to grid
    const gridX = Math.round(centeredX / (CELL_SIZE + GAP));
    const gridY = Math.round(centeredY / (CELL_SIZE + GAP));

    // Clamp to grid bounds to prevent "way off" values outside
    const clampedX = Math.max(0, Math.min(GRID_SIZE - itemWidth, gridX));
    const clampedY = Math.max(0, Math.min(GRID_SIZE - itemHeight, gridY));

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

    // Check collision first
    if (checkCollision(gx, gy, w, h, itemsOnGrid, ownerId, instanceId, itemDef.category)) {
      return false;
    }

    // For non-container items, also check support (must be inside containers)
    if (itemDef.category !== 'CONTAINER') {
      return checkSupport(gx, gy, w, h, itemsOnGrid, ownerId);
    }

    return true;
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Cancel drag on Escape
      if (e.key === 'Escape' && draggedInstanceId) {
        setDraggedInstanceId(null);
        setGhostPosition(null);
        return;
      }

      // If no item is selected, ignore other shortcuts
      if (!selectedItemId) return;

      const item = itemsOnGrid.find(i => i.instanceId === selectedItemId);
      if (!item) return;

      switch (e.key.toLowerCase()) {
        case 'r':
        case 'e':
          e.preventDefault();
          rotateItem(selectedItemId);
          break;
        case 'q':
          e.preventDefault();
          rotateItemCounterClockwise(selectedItemId);
          break;
        case 'delete':
        case 'backspace':
          e.preventDefault();
          removeItem(selectedItemId);
          setSelectedItemId(null);
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
          setSelectedItemId(itemsOnGrid[nextIndex]?.instanceId || null);
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItemId, itemsOnGrid, draggedInstanceId]);

  const handleDragStart = (instanceId: string) => {
    setDraggedInstanceId(instanceId);
    // We don't set ghost position yet, wait for move
  };

  const handleDrag = (_instanceId: string, itemId: string, currentRot: number, info: PanInfo) => {
    const itemDef = ITEMS[itemId];
    const w = (currentRot === 90 || currentRot === 270) ? itemDef.height : itemDef.width;
    const h = (currentRot === 90 || currentRot === 270) ? itemDef.width : itemDef.height;
    const { x, y, gridX, gridY } = snapToGrid(info.point, w, h);

    // Update ghost with pixel coordinates
    setGhostPosition({ x, y });

    // Check validation with grid coordinates
    const valid = calculateGhostValidity(gridX, gridY, itemId, draggedInstanceId || undefined, currentRot);
    setIsGhostValid(valid);
  };

  const handleDragEnd = (instanceId: string, itemId: string, currentRot: number, info: PanInfo) => {
    const itemDef = ITEMS[itemId];
    const w = (currentRot === 90 || currentRot === 270) ? itemDef.height : itemDef.width;
    const h = (currentRot === 90 || currentRot === 270) ? itemDef.width : itemDef.height;
    const { gridX, gridY } = snapToGrid(info.point, w, h);

    if (calculateGhostValidity(gridX, gridY, itemId, instanceId, currentRot)) {
      moveItem(instanceId, gridX, gridY, currentRot as 0 | 90 | 180 | 270);
    } else {
      // Show error message
      if (itemDef.category !== 'CONTAINER' && !checkSupport(gridX, gridY, itemDef.width, itemDef.height, itemsOnGrid, ownerId)) {
        setErrorMessage('Items must be placed inside containers!');
        setTimeout(() => setErrorMessage(null), 3000);
      }
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
      const itemDef = ITEMS[externalDraggedItem];
      if (!itemDef) return;

      const { x, y, gridX, gridY } = snapToGrid(
        { x: e.clientX, y: e.clientY },
        itemDef.width,
        itemDef.height
      );

      // Update ghost with pixel coordinates
      setGhostPosition({ x, y });

      // Check validation with grid coordinates
      const valid = calculateGhostValidity(gridX, gridY, externalDraggedItem);
      setIsGhostValid(valid);
    }
  };

  const handleDragLeaveExtern = () => {
    if (externalDraggedItem) {
      setGhostPosition(null);
    }
  };

  // Touch event handlers for mobile drag-and-drop
  const handleTouchStart = (e: React.TouchEvent, instanceId: string, itemId: string, rotation: number) => {
    console.log('🟢 Touch Start:', { instanceId, itemId, rotation });
    const touch = e.touches[0];
    if (!touch) return;

    setTouchState({
      active: true,
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      itemId,
      rotation
    });
    setDraggedInstanceId(instanceId);
    console.log('Touch state initialized:', { x: touch.clientX, y: touch.clientY });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchState?.active) return;

    const touch = e.touches[0];
    if (!touch) return;

    console.log('🔵 Touch Move:', { x: touch.clientX, y: touch.clientY });

    setTouchState(prev => prev ? {
      ...prev,
      currentX: touch.clientX,
      currentY: touch.clientY
    } : null);

    // Update ghost position
    if (touchState.itemId) {
      const itemDef = ITEMS[touchState.itemId];
      const w = (touchState.rotation === 90 || touchState.rotation === 270) ? itemDef.height : itemDef.width;
      const h = (touchState.rotation === 90 || touchState.rotation === 270) ? itemDef.width : itemDef.height;

      const { x, y, gridX, gridY } = snapToGrid({ x: touch.clientX, y: touch.clientY }, w, h);

      setGhostPosition({ x, y });

      const valid = calculateGhostValidity(gridX, gridY, touchState.itemId, draggedInstanceId || undefined, touchState.rotation);
      setIsGhostValid(valid);

      console.log('Ghost updated:', { x, y, gridX, gridY, valid });
    }
  };

  const handleTouchEnd = (_e: React.TouchEvent, instanceId: string) => {
    console.log('🔴 Touch End:', { instanceId, touchState });

    if (!touchState?.active || !touchState.itemId) {
      console.log('Touch end without active state');
      setTouchState(null);
      setDraggedInstanceId(null);
      setGhostPosition(null);
      return;
    }

    const itemDef = ITEMS[touchState.itemId];
    const w = (touchState.rotation === 90 || touchState.rotation === 270) ? itemDef.height : itemDef.width;
    const h = (touchState.rotation === 90 || touchState.rotation === 270) ? itemDef.width : itemDef.height;

    const { gridX, gridY } = snapToGrid(
      { x: touchState.currentX, y: touchState.currentY },
      w,
      h
    );

    console.log('Attempting to place at:', { gridX, gridY });

    if (calculateGhostValidity(gridX, gridY, touchState.itemId, instanceId, touchState.rotation)) {
      console.log('✅ Valid placement, moving item');
      moveItem(instanceId, gridX, gridY, touchState.rotation as 0 | 90 | 180 | 270);
    } else {
      console.log('❌ Invalid placement');
      if (itemDef.category !== 'CONTAINER' && !checkSupport(gridX, gridY, w, h, itemsOnGrid, ownerId)) {
        setErrorMessage('Items must be placed inside containers!');
        setTimeout(() => setErrorMessage(null), 3000);
      }
    }

    // Reset state
    setTouchState(null);
    setDraggedInstanceId(null);
    setGhostPosition(null);
  };

  return (
    <div className="flex flex-col items-center w-full px-2 md:px-0">
      {/* Error Message */}
      {errorMessage && (
        <div className="mb-4 px-4 md:px-6 py-3 bg-red-500/20 border-2 border-red-500 rounded-lg text-red-200 font-bold text-xs md:text-sm animate-in fade-in slide-in-from-top-2 max-w-full">
          ⚠️ {errorMessage}
        </div>
      )}

      <div className="mb-4 text-camp-orange font-bold text-lg md:text-xl uppercase tracking-widest">
        Backpack Capacity
      </div>

      {/* Helper message when no containers */}
      {allContainers.filter(c => c.ownerId === ownerId).length === 0 && (
        <div className="mb-4 px-6 py-3 bg-blue-500/20 border-2 border-blue-500 rounded-lg text-blue-200 font-bold text-sm max-w-md text-center">
          💡 Tip: Place containers (backpacks, pouches) first, then place items inside them!
        </div>
      )}

      {/* Grid Container - The "Backpack" */}
      <div
        ref={gridRef}
        className="relative rounded-3xl p-4 shadow-leather-stitch bg-leather-texture transition-colors touch-manipulation max-w-full overflow-auto"
        id="inventory-grid"
        style={{
          width: GRID_SIZE * CELL_SIZE + 32 + (GRID_SIZE - 1) * GAP,
          height: GRID_SIZE * CELL_SIZE + 32 + (GRID_SIZE - 1) * GAP,
          maxWidth: '100%',
          touchAction: 'none' // Changed from manipulation to none for better drag control
        }}
        onDragOver={handleDragOverExtern}
        onDragLeave={handleDragLeaveExtern}
        onTouchMove={(e) => {
          console.log('📱 Grid touchMove');
          if (touchState?.active) {
            handleTouchMove(e);
          }
        }}
        onClick={(e) => {
          // Handle tap-to-place for mobile/touch
          if (!externalDraggedItem) return;

          const rect = gridRef.current?.getBoundingClientRect();
          if (rect) {
            const x = e.clientX - (rect.left + 20);
            const y = e.clientY - (rect.top + 20);

            const gx = Math.floor(x / (CELL_SIZE + GAP));
            const gy = Math.floor(y / (CELL_SIZE + GAP));

            if (gx >= 0 && gx < GRID_SIZE && gy >= 0 && gy < GRID_SIZE) {
              const isDrafting = $draftState.get().availableItems.some(i => i.id === externalDraggedItem);

              if (isDrafting) {
                import('../store/gameStore').then(mod => {
                  if (mod.draftItemToGrid) {
                    mod.draftItemToGrid(ownerId, externalDraggedItem, gx, gy);
                    $draggedItem.set(null);
                  }
                });
              } else {
                if (!checkCollision(gx, gy, ITEMS[externalDraggedItem].width, ITEMS[externalDraggedItem].height, itemsOnGrid, ownerId, undefined, ITEMS[externalDraggedItem].category)) {
                  import('../store/gameStore').then(mod => {
                    if (ITEMS[externalDraggedItem].category === 'CONTAINER' || (mod.checkSupport && mod.checkSupport(gx, gy, ITEMS[externalDraggedItem].width, ITEMS[externalDraggedItem].height, itemsOnGrid, ownerId))) {
                      placeItem(externalDraggedItem, gx, gy, 0, ownerId);
                      $draggedItem.set(null);
                    }
                  });
                }
              }
            }
          }
        }}
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
                // Check collision. If it returns false (no collision) -> Place it.
                // But we also need to check "Support" if it's Gear.
                // placeItem does checking internally too, but checkCollision ensures the UI doesn't flicker?
                // Actually, let's just allow placeItem to handle logic. drop -> attempt place -> if success -> remove from draft.

                // BUT `placeItem` doesn't know about Draft Pool removal.
                // If we are dragging from Draft, we need to call `draftItem` logic but with Coordinates!

                // We need a new action: `draftItemToGrid(playerId, itemId, x, y)`?
                // Or refactor `draftItem` in store.
                // Currently `draftItem` does auto-placement.

                // Check if we are in Draft Phase?
                // Check if we are in Draft Phase?
                // Check if we are in Draft Phase?
                // Check if we are in Draft Phase?
                const isDrafting = $draftState.get().availableItems.some(i => i.id === itemId);

                if (isDrafting) {
                  import('../store/gameStore').then(mod => {
                    if (mod.draftItemToGrid) {
                      mod.draftItemToGrid(ownerId, itemId, gx, gy);
                    }
                  });
                } else {
                  // Standard move/place logic
                  if (!checkCollision(gx, gy, ITEMS[itemId].width, ITEMS[itemId].height, itemsOnGrid, ownerId, undefined, ITEMS[itemId].category)) {
                    import('../store/gameStore').then(mod => {
                      if (ITEMS[itemId].category === 'CONTAINER' || (mod.checkSupport && mod.checkSupport(gx, gy, ITEMS[itemId].width, ITEMS[itemId].height, itemsOnGrid, ownerId))) {
                        placeItem(itemId, gx, gy, 0, ownerId);
                      }
                    });
                  }
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

        {/* Container Cell Overlays - Show valid placement zones */}
        {allContainers
          .filter(c => c.ownerId === ownerId)
          .map(container =>
            container.cells.map((cell, idx) => {
              const isDisabled = container.disabledCells?.some(dc => dc.x === cell.x && dc.y === cell.y);
              if (isDisabled) return null;

              return (
                <div
                  key={`${container.id}-${idx}`}
                  className={clsx(
                    "absolute pointer-events-none transition-all",
                    draggedInstanceId || externalDraggedItem
                      ? "bg-green-500/20 border-2 border-green-500/50"
                      : "bg-blue-500/5 border border-blue-500/20"
                  )}
                  style={{
                    left: cell.x * (CELL_SIZE + GAP),
                    top: cell.y * (CELL_SIZE + GAP),
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    borderRadius: '4px'
                  }}
                />
              );
            })
          )}

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
            onSelect={() => setSelectedItemId(item.instanceId)}
          />
        ))}

      </div>

      {/* Item Detail Panel */}
      {selectedItemId && (() => {
        const selectedItem = itemsOnGrid.find(i => i.instanceId === selectedItemId);
        if (!selectedItem) return null;
        const def = ITEMS[selectedItem.itemId];
        if (!def) return null;
        return (
          <div className="mt-3 max-w-md w-full bg-slate-800/90 border border-slate-600 rounded-xl p-3 md:p-4 text-sm">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-lg font-black text-white">{def.name}</span>
              <span className="text-xs uppercase tracking-wider text-slate-400 bg-slate-700 px-2 py-0.5 rounded">{def.category}</span>
              <span className="text-xs text-slate-500 ml-auto">{def.width}×{def.height}</span>
            </div>
            <p className="text-slate-300 text-xs mb-2">{def.description}</p>
            {def.combatStats && (
              <div className="flex flex-wrap gap-2 mb-2">
                {def.combatStats.damage ? <span className="text-red-400 text-xs font-bold">⚔️ {def.combatStats.damage} DMG</span> : null}
                {def.combatStats.defense ? <span className="text-blue-400 text-xs font-bold">🛡️ {def.combatStats.defense} DEF</span> : null}
                {def.combatStats.speed ? <span className="text-yellow-400 text-xs font-bold">⚡ {def.combatStats.speed} SPD</span> : null}
                {def.combatStats.accuracy ? <span className="text-green-400 text-xs font-bold">🎯 {def.combatStats.accuracy}% ACC</span> : null}
                {def.combatStats.heal ? <span className="text-emerald-400 text-xs font-bold">💚 {def.combatStats.heal} HEAL</span> : null}
              </div>
            )}
            {def.effects && def.effects.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {def.effects.map((eff, i) => (
                  <span key={i} className="text-purple-300 text-xs font-bold bg-purple-900/50 px-2 py-0.5 rounded">
                    {eff.type} ({eff.value}{eff.chance ? `, ${eff.chance}%` : ''})
                  </span>
                ))}
              </div>
            )}
            {def.adjacency && def.adjacency.length > 0 && (
              <div className="border-t border-slate-700 pt-2 mt-2">
                <span className="text-xs text-slate-400 uppercase tracking-wider">Adjacency Bonuses:</span>
                {def.adjacency.map((adj, i) => (
                  <div key={i} className="text-xs text-amber-300 mt-1">✨ {adj.effect}</div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      <div className="flex flex-col gap-2 mt-4 text-xs font-bold uppercase tracking-widest text-slate-500 text-center px-2">
        <div>Total: {itemsOnGrid.length}</div>
        <div className="hidden md:flex gap-3 flex-wrap justify-center">
          <span>Click: Select</span>
          <span>R/E: Rotate</span>
          <span>Q: Rotate CCW</span>
          <span>Space: Lock</span>
          <span>Del: Remove</span>
          <span>Tab: Cycle</span>
        </div>
        <div className="md:hidden text-center text-slate-400">
          <span>📱 Tap items to select • Tap grid to place</span>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
