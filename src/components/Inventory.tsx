import { useStore } from "@nanostores/react"
import clsx from "clsx"
import type { PanInfo } from "framer-motion"
import * as LucideIcons from "lucide-react"
import React, { useRef, useState, useEffect, useMemo } from "react"
import { type AdjacencyResult, getAdjacencyBonuses } from "../lib/adjacency"
import { calculatePlayerCombatInfo } from "../lib/combat"
import { ITEMS } from "../lib/items/items"
import {
  $activePreview,
  $craftingHighlights,
  $currentPlayerId,
  $dragSessionId,
  $draggedInstanceId,
  $draggedItem,
  $gridConfig,
  $gridState,
  $itemsOnGrid,
  $localPlayerId,
  SANDBOX_PLAYER_ID,
  checkCollision,
  checkSupport,
  getItemCells,
  getPixelCoords,
  moveItem,
  placeItem,
  removeItem,
  returnItemToPool,
  rotateItem,
  rotateItemCounterClockwise,
  toggleLock,
} from "../store/gameStore"
import type { Container, InventoryItemInstance } from "../types"
import BackpackGhost from "./game/BackpackGhost"
import BackpackItem from "./game/BackpackItem"

interface InventoryProps {
  playerId?: string
  className?: string
  items?: InventoryItemInstance[]
  containers?: Container[] // NEW: Optional containers prop
  canInteract?: boolean
  viewOnly?: boolean
  cooldowns?: Record<string, number>
}

const Inventory: React.FC<InventoryProps> = (props) => {
  const {
    playerId,
    className,
    items: itemsProp,
    containers: containersProp, // Use this if provided
    canInteract: canInteractProp = true,
    viewOnly = false,
    cooldowns = {},
  } = props

  const gridConfig = useStore($gridConfig)
  const globalGridState = useStore($gridState)
  const dragSessionId = useStore($dragSessionId)
  const { cellSize: CELL_SIZE, gap: GAP, rows, cols } = gridConfig

  const gridRef = useRef<HTMLDivElement>(null)

  const [ghostPosition, setGhostPosition] = useState<{
    x: number
    y: number
    gridX: number
    gridY: number
    valid: boolean
  } | null>(null)
  const [isGhostValid, setIsGhostValid] = useState(true)
  const [draggedInstanceId, setDraggedInstanceId] = useState<string | null>(
    null,
  )

  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [pendingRotation, setPendingRotation] = useState<0 | 90 | 180 | 270>(0)

  // Sync global grid config
  useEffect(() => {
    const updateCellSize = () => {
      const width = window.innerWidth
      let size = 40
      if (width < 400) size = 28
      else if (width < 600) size = 32
      else if (width < 768) size = 36

      $gridConfig.set({ ...$gridConfig.get(), cellSize: size })
    }
    updateCellSize()
    window.addEventListener("resize", updateCellSize)
    return () => window.removeEventListener("resize", updateCellSize)
  }, [])

  const externalDraggedItem = useStore($draggedItem)
  const currentPlayerId = useStore($currentPlayerId)
  const ownerId = playerId || currentPlayerId || "solo"

  const allItemsOnGrid = useStore($itemsOnGrid)
  const localPlayerId = useStore($localPlayerId)
  const activePreview = useStore($activePreview)
  const craftingHighlights = useStore($craftingHighlights)
  const externalInstanceId = useStore($draggedInstanceId)

  const canInteract =
    canInteractProp &&
    !viewOnly &&
    (ownerId === localPlayerId ||
      localPlayerId === "solo" ||
      !localPlayerId ||
      ownerId === SANDBOX_PLAYER_ID) &&
    localPlayerId !== "OBSERVER"

  useEffect(() => {
    if (activePreview?.type === "instance") setSelectedItemId(activePreview.id)
    else setSelectedItemId(null)
  }, [activePreview])

  useEffect(() => {
    setPendingRotation(0)
  }, [])

  const itemsOnGrid = (
    itemsProp || allItemsOnGrid.filter((i) => i.ownerId === ownerId)
  ).sort((a, b) => {
    const catA = ITEMS[a.itemId].category
    const catB = ITEMS[b.itemId].category
    if (catA === "CONTAINER" && catB !== "CONTAINER") return -1
    if (catA !== "CONTAINER" && catB === "CONTAINER") return 1
    return 0
  })

  // LOCAL GRID STATE: If containersProp or itemsProp are provided, we calculate a local state
  // instead of using the global one.
  const gridState = useMemo(() => {
    if (!containersProp && !itemsProp) return globalGridState

    // Calculate a local grid state for this specific instance (e.g., an Enemy)
    const state: Record<string, any> = {}
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        state[`${x},${y}`] = {
          x,
          y,
          isBag: false,
          ownerId: null,
          occupiedBy: null,
        }
      }
    }

    const containers = containersProp || []
    for (const container of containers) {
      for (const cell of container.cells) {
        const key = `${cell.x},${cell.y}`
        if (state[key]) {
          state[key].isBag = true
          state[key].ownerId = container.ownerId
        }
      }
    }

    const items = itemsProp || []
    for (const item of items) {
      const cells = getItemCells(item.x, item.y, item.itemId, item.rotation)
      for (const cell of cells) {
        const key = `${cell.x},${cell.y}`
        if (state[key]) {
          state[key].occupiedBy = item.instanceId
        }
      }
    }
    return state
  }, [containersProp, itemsProp, globalGridState, rows, cols])

  const virtualItems = useMemo(() => {
    let baseItems = [...itemsOnGrid]
    const isDragging = !!(draggedInstanceId || externalDraggedItem)
    if (!isDragging || !ghostPosition?.valid) return baseItems
    if (draggedInstanceId)
      baseItems = baseItems.filter((i) => i.instanceId !== draggedInstanceId)
    const itemId =
      draggedInstanceId || externalInstanceId
        ? itemsOnGrid.find(
            (i) => i.instanceId === (draggedInstanceId || externalInstanceId),
          )?.itemId
        : externalDraggedItem

    if (itemId) {
      const activeInstanceId =
        draggedInstanceId || externalInstanceId || "dragged-external"
      baseItems.push({
        instanceId: activeInstanceId,
        itemId,
        x: ghostPosition.gridX,
        y: ghostPosition.gridY,
        rotation:
          (activeInstanceId !== "dragged-external"
            ? itemsOnGrid.find((i) => i.instanceId === activeInstanceId)
                ?.rotation
            : pendingRotation) || 0,
        ownerId,
      } as InventoryItemInstance)
    }
    return baseItems
  }, [
    itemsOnGrid,
    draggedInstanceId,
    externalInstanceId,
    externalDraggedItem,
    ghostPosition,
    pendingRotation,
    ownerId,
  ])

  const { itemsWithLiveStats: liveVirtualItems } = useMemo(
    () => calculatePlayerCombatInfo(virtualItems),
    [virtualItems],
  )

  const virtualResults = React.useMemo(
    () => getAdjacencyBonuses(liveVirtualItems),
    [liveVirtualItems],
  )
  const allStarredSquares = Object.values(virtualResults).flatMap(
    (res: AdjacencyResult) => res.boostedSquares || [],
  )
  const starredKeys = new Set(
    allStarredSquares.map((s: { x: number; y: number }) => `${s.x},${s.y}`),
  )
  const selectedResult = selectedItemId ? virtualResults[selectedItemId] : null
  const draggedResult =
    draggedInstanceId || externalDraggedItem
      ? virtualResults[draggedInstanceId || "dragged-external"]
      : null
  const displayResult = draggedResult || selectedResult

  const snapToGrid = (
    point: { x: number; y: number },
    itemId: string,
    rotation = 0,
  ) => {
    if (!gridRef.current) return { x: 0, y: 0, gridX: 0, gridY: 0 }
    const rect = gridRef.current.getBoundingClientRect()
    const xOffset = point.x - rect.left
    const yOffset = point.y - rect.top

    const itemDef = ITEMS[itemId]
    if (!itemDef) return { x: 0, y: 0, gridX: 0, gridY: 0 }

    const w =
      rotation === 90 || rotation === 270 ? itemDef.height : itemDef.width
    const h =
      rotation === 90 || rotation === 270 ? itemDef.width : itemDef.height

    const gridX = Math.round(
      (xOffset - (w * (CELL_SIZE + GAP)) / 2) / (CELL_SIZE + GAP),
    )
    const gridY = Math.round(
      (yOffset - (h * (CELL_SIZE + GAP)) / 2) / (CELL_SIZE + GAP),
    )

    const coords = getPixelCoords(gridX, gridY)

    return {
      ...coords,
      gridX,
      gridY,
    }
  }

  const calculateGhostValidity = (
    gx: number,
    gy: number,
    itemId: string,
    instanceId?: string,
    currentRot = 0,
  ) => {
    const itemDef = ITEMS[itemId]
    if (!itemDef) return false
    const w =
      currentRot === 90 || currentRot === 270 ? itemDef.height : itemDef.width
    const h =
      currentRot === 90 || currentRot === 270 ? itemDef.width : itemDef.height

    if (
      checkCollision(
        gx,
        gy,
        w,
        h,
        itemsOnGrid,
        ownerId,
        instanceId,
        itemDef.category,
        itemId,
        currentRot as 0,
      )
    )
      return false
    if (itemDef.category !== "CONTAINER")
      return checkSupport(
        gx,
        gy,
        w,
        h,
        itemsOnGrid,
        ownerId,
        itemId,
        currentRot as 0,
      )
    return true
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return
      if (!canInteract) return
      if (e.key === "Escape" && (draggedInstanceId || externalDraggedItem)) {
        setDraggedInstanceId(null)
        setGhostPosition(null)
        $dragSessionId.set($dragSessionId.get() + 1) // Reset on cancel
        $draggedItem.set(null)
        $activePreview.set(null)
        return
      }
      if (draggedInstanceId || externalDraggedItem) {
        if (e.key.toLowerCase() === "r" || e.key.toLowerCase() === "e") {
          e.preventDefault()
          if (draggedInstanceId) rotateItem(draggedInstanceId)

          // ALWAYS update pendingRotation if an external item is active
          if (externalDraggedItem) {
            setPendingRotation(
              (prev) => ((prev + 90) % 360) as 0 | 90 | 180 | 270,
            )
          }
          return
        }
        if (e.key.toLowerCase() === "q") {
          e.preventDefault()
          if (draggedInstanceId) rotateItemCounterClockwise(draggedInstanceId)

          if (externalDraggedItem) {
            setPendingRotation(
              (prev) => ((prev - 90 + 360) % 360) as 0 | 90 | 180 | 270,
            )
          }
          return
        }
      }
      if (!selectedItemId) return
      const item = itemsOnGrid.find((i) => i.instanceId === selectedItemId)
      if (!item) return
      switch (e.key.toLowerCase()) {
        case "delete":
        case "backspace":
          e.preventDefault()
          removeItem(selectedItemId)
          setSelectedItemId(null)
          $activePreview.set(null)
          break
        case " ":
          e.preventDefault()
          toggleLock(selectedItemId)
          break
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [
    selectedItemId,
    itemsOnGrid,
    draggedInstanceId,
    externalDraggedItem,
    canInteract,
  ])

  const handleDragStart = (instanceId: string, _info: PanInfo) => {
    if (!canInteract) return
    setDraggedInstanceId(instanceId)
  }

  const handleDrag = (
    instanceId: string,
    itemId: string,
    _passedRot: number,
    info: PanInfo,
  ) => {
    if (!canInteract) return

    // LOOKUP LATEST ROTATION: Use store for grid items, or state for shelf items
    let currentRot = pendingRotation
    if (instanceId) {
      const item = itemsOnGrid.find((i) => i.instanceId === instanceId)
      if (item) currentRot = item.rotation
    }

    const { x, y, gridX, gridY } = snapToGrid(info.point, itemId, currentRot)
    const valid = calculateGhostValidity(
      gridX,
      gridY,
      itemId,
      instanceId || undefined,
      currentRot,
    )
    setIsGhostValid(valid)
    setGhostPosition({ x, y, gridX, gridY, valid })
  }

  const handleDragEnd = (
    instanceId: string,
    itemId: string,
    _passedRot: number,
    info: PanInfo,
  ) => {
    const itemDef = ITEMS[itemId]

    // LOOKUP LATEST ROTATION: Ignore the passed argument which may be stale
    let currentRot = pendingRotation
    if (instanceId) {
      const item = itemsOnGrid.find((i) => i.instanceId === instanceId)
      if (item) currentRot = item.rotation
    }

    const { gridX, gridY } = snapToGrid(info.point, itemId, currentRot)

    if (calculateGhostValidity(gridX, gridY, itemId, instanceId, currentRot)) {
      moveItem(instanceId, gridX, gridY, currentRot as 0 | 90 | 180 | 270)
    } else {
      removeItem(instanceId)
      returnItemToPool(ownerId, itemId)
      // FIX: Don't keep it as a ghost, just return it to shelf
      $draggedItem.set(null)
      $activePreview.set(null)
      setErrorMessage(`${itemDef.name} returned to shelf!`)
      setTimeout(() => setErrorMessage(null), 3000)
    }

    // Increment session ID to force a key-based remount, clearing all drag transforms
    $dragSessionId.set($dragSessionId.get() + 1)
    setDraggedInstanceId(null)
    setGhostPosition(null)
  }

  const handleDragOverExtern = (e: React.DragEvent) => {
    e.preventDefault()
    if (!canInteract || !externalDraggedItem) return
    const { x, y, gridX, gridY } = snapToGrid(
      { x: e.clientX, y: e.clientY },
      externalDraggedItem,
      pendingRotation,
    )
    const valid = calculateGhostValidity(
      gridX,
      gridY,
      externalDraggedItem,
      undefined,
      pendingRotation,
    )
    setIsGhostValid(valid)
    setGhostPosition({ x, y, gridX, gridY, valid })
  }

  return (
    <div className="flex flex-col items-center w-full px-2 md:px-0">
      {errorMessage && (
        <div className="mb-4 px-4 py-3 bg-red-500/20 border-2 border-red-500 rounded-lg text-red-200 font-bold text-xs animate-in fade-in slide-in-from-top-2">
          ⚠️ {errorMessage}
        </div>
      )}
      <div
        className={clsx(
          "relative bg-wood-800/40 p-3 md:p-8 rounded-2xl shadow-bag border-4 border-wood-600 flex flex-col items-center select-none",
          className,
        )}
      >
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
        <div
          ref={gridRef}
          className="relative transition-all duration-500 touch-manipulation overflow-visible select-none"
          id="inventory-grid"
          /* biome-ignore lint/a11y/useSemanticElements: Complex interactive grid surface */
          role="button"
          tabIndex={0}
          style={{
            width: cols * CELL_SIZE + (cols - 1) * GAP,
            height: rows * CELL_SIZE + (rows - 1) * GAP,
            maxWidth: "100%",
            touchAction: "none",
          }}
          onDragOver={handleDragOverExtern}
          onDragLeave={() => setGhostPosition(null)}
          onMouseMove={(e) => {
            if (externalDraggedItem && !draggedInstanceId && canInteract) {
              const { x, y, gridX, gridY } = snapToGrid(
                { x: e.clientX, y: e.clientY },
                externalDraggedItem,
                pendingRotation,
              )
              const valid = calculateGhostValidity(
                gridX,
                gridY,
                externalDraggedItem,
                undefined,
                pendingRotation,
              )
              setGhostPosition({ x, y, gridX, gridY, valid })
              setIsGhostValid(valid)
            }
          }}
          onMouseLeave={() => !draggedInstanceId && setGhostPosition(null)}
          onClick={(e) => {
            if (!canInteract || draggedInstanceId) return
            const activeItemId = externalDraggedItem
            const activeInstanceId = externalInstanceId

            if (!activeItemId && !activeInstanceId) return

            const { gridX, gridY } = snapToGrid(
              { x: e.clientX, y: e.clientY },
              activeItemId ||
                itemsOnGrid.find((i) => i.instanceId === activeInstanceId)
                  ?.itemId ||
                "",
              pendingRotation,
            )

            if (activeInstanceId) {
              // Internal move placement
              if (
                calculateGhostValidity(
                  gridX,
                  gridY,
                  itemsOnGrid.find((i) => i.instanceId === activeInstanceId)
                    ?.itemId || "",
                  activeInstanceId,
                  pendingRotation,
                )
              ) {
                moveItem(activeInstanceId, gridX, gridY, pendingRotation as any)
                $draggedInstanceId.set(null)
                $draggedItem.set(null)
                $dragSessionId.set($dragSessionId.get() + 1)
              }
            } else if (activeItemId) {
              // External placement
              if (
                calculateGhostValidity(
                  gridX,
                  gridY,
                  activeItemId,
                  undefined,
                  pendingRotation,
                )
              ) {
                placeItem(
                  activeItemId,
                  gridX,
                  gridY,
                  pendingRotation as any,
                  ownerId,
                )
                $draggedItem.set(null)
                $dragSessionId.set($dragSessionId.get() + 1)
              }
            }
          }}
          onDrop={(e) => {
            e.preventDefault()
            const itemId =
              e.dataTransfer.getData("itemId") || externalDraggedItem
            setGhostPosition(null)
            if (itemId && canInteract) {
              const { gridX, gridY } = snapToGrid(
                { x: e.clientX, y: e.clientY },
                itemId,
                pendingRotation,
              )
              if (
                calculateGhostValidity(
                  gridX,
                  gridY,
                  itemId,
                  undefined,
                  pendingRotation,
                )
              ) {
                placeItem(
                  itemId,
                  gridX,
                  gridY,
                  pendingRotation as 0 | 90 | 180 | 270,
                  ownerId,
                )
                $dragSessionId.set($dragSessionId.get() + 1)
                $draggedItem.set(null)

                $activePreview.set(null)
              } else {
                setErrorMessage(`${ITEMS[itemId]?.name} returned to shelf!`)
                setTimeout(() => setErrorMessage(null), 2000)
              }
            }
          }}
        >
          {/* Centralized Grid Rendering */}
          {Object.values(gridState).map((cell) => {
            const coords = getPixelCoords(cell.x, cell.y)
            const isMe = cell.ownerId === ownerId
            return (
              <div
                key={`${cell.x},${cell.y}`}
                data-x={cell.x}
                data-y={cell.y}
                data-is-bag={cell.isBag && isMe}
                data-occupied-by={cell.occupiedBy}
                className={clsx(
                  "absolute transition-all duration-300 pointer-events-none",
                  cell.isBag && isMe
                    ? "bg-wood-700/80 shadow-inner"
                    : "bg-wood-900/5 border border-wood-600/10",
                )}
                style={{
                  left: coords.x,
                  top: coords.y,
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  borderRadius: cell.isBag && isMe ? "0" : "2px",
                }}
              >
                {cell.isBag && isMe && (
                  <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/leather.png')]" />
                )}
              </div>
            )
          })}

          {!viewOnly && (
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
          )}

          {itemsOnGrid
            .filter((i) => i.instanceId !== externalInstanceId)
            .map((baseItem) => {
              // Find the version with live stats (DPS/EPS)
              const item =
                liveVirtualItems.find(
                  (li: InventoryItemInstance) =>
                    li.instanceId === baseItem.instanceId,
                ) || baseItem

              return (
                <BackpackItem
                  key={`${item.instanceId}-${dragSessionId}`}
                  item={item}
                  draggedInstanceId={draggedInstanceId}
                  onDragStart={handleDragStart}
                  onDrag={handleDrag}
                  onDragEnd={handleDragEnd}
                  CELL_SIZE={CELL_SIZE}
                  GAP={GAP}
                  isHighlighted={craftingHighlights.includes(item.instanceId)}
                  isSelected={selectedItemId === item.instanceId}
                  onSelect={() =>
                    !viewOnly &&
                    $activePreview.set({
                      type: "instance",
                      id: item.instanceId,
                    })
                  }
                  adjacencyResult={virtualResults[item.instanceId]}
                  viewOnly={viewOnly}
                  cooldown={cooldowns[item.instanceId] || 0}
                />
              )
            })}

          {(selectedItemId || draggedInstanceId || externalDraggedItem) &&
            !viewOnly && (
              <div className="absolute inset-0 pointer-events-none z-50">
                {Object.values(gridState).map((cell) => {
                  if (!cell.isBag || cell.ownerId !== ownerId) return null
                  const key = `${cell.x},${cell.y}`
                  const isGlobalStar = starredKeys.has(key)
                  const activeSyn = displayResult?.activeSynergySquares.find(
                    (s) => s.x === cell.x && s.y === cell.y,
                  )
                  const potentialSyn =
                    displayResult?.potentialSynergySquares.find(
                      (s) => s.x === cell.x && s.y === cell.y,
                    )
                  if (isGlobalStar || activeSyn || potentialSyn) {
                    const isFilled = isGlobalStar || !!activeSyn
                    const iconName =
                      activeSyn?.icon || potentialSyn?.icon || "Star"
                    const Icon =
                      (LucideIcons as any)[iconName] || LucideIcons.Star
                    const coords = getPixelCoords(cell.x, cell.y)
                    return (
                      <div
                        key={`syn-overlay-${key}`}
                        className={clsx(
                          "absolute flex items-center justify-center transition-all duration-300",
                          isFilled
                            ? "animate-bounce scale-110"
                            : "opacity-40 scale-75",
                        )}
                        style={{
                          left: coords.x,
                          top: coords.y,
                          width: CELL_SIZE,
                          height: CELL_SIZE,
                        }}
                      >
                        <Icon
                          className={clsx(
                            "w-6 h-6",
                            isFilled
                              ? "text-gold-400 fill-gold-400 drop-shadow-[0_0_8px_rgba(255,215,0,0.8)]"
                              : "text-gold-100",
                          )}
                        />
                      </div>
                    )
                  }
                  return null
                })}
              </div>
            )}
        </div>

        {/* Mobile Control Bar - Appears when "holding" an item via tap */}
        {(externalDraggedItem || externalInstanceId) && (
          <div className="mt-4 flex gap-4 animate-in slide-in-from-bottom-2 duration-300">
            <button
              type="button"
              onClick={() => {
                setPendingRotation((prev) => ((prev + 90) % 360) as any)
              }}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg"
            >
              <LucideIcons.RotateCw size={20} /> Rotate
            </button>
            <button
              type="button"
              onClick={() => {
                $draggedItem.set(null)
                $draggedInstanceId.set(null)
              }}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-bold shadow-lg"
            >
              <LucideIcons.X size={20} /> Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Inventory
