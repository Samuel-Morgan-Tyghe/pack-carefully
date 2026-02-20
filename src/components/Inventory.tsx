import { useStore } from "@nanostores/react"
import clsx from "clsx"
import type { PanInfo } from "framer-motion"
import * as LucideIcons from "lucide-react"
import React, { useRef, useState, useEffect, useMemo } from "react"
import { type AdjacencyResult, getAdjacencyBonuses } from "../lib/adjacency"
import { GRID_SIZE, ITEMS } from "../lib/items"
import {
  $activePreview,
  $containers,
  $currentPlayerId,
  $draggedItem,
  $itemsOnGrid,
  $localPlayerId,
  SANDBOX_PLAYER_ID,
  checkCollision,
  checkSupport,
  moveItem,
  placeItem,
  removeItem,
  returnItemToPool,
  rotateItem,
  rotateItemCounterClockwise,
  toggleLock,
} from "../store/gameStore"
import type { InventoryItemInstance } from "../types"
import BackpackGhost from "./game/BackpackGhost"
import BackpackItem from "./game/BackpackItem"

interface InventoryProps {
  playerId?: string
  className?: string
  items?: InventoryItemInstance[]
  canInteract?: boolean
  viewOnly?: boolean
  cooldowns?: Record<string, number>
}

const Inventory: React.FC<InventoryProps> = (props) => {
  const {
    playerId,
    className,
    items: itemsProp,
    canInteract: canInteractProp = true,
    viewOnly = false,
    cooldowns = {},
  } = props

  console.log("🎮 Inventory component mounted")

  // Responsive cell size - smaller on mobile
  const [cellSize, setCellSize] = React.useState(40)
  const CELL_SIZE = cellSize
  const GAP = 2

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

  // Detect mobile and adjust cell size
  useEffect(() => {
    const updateCellSize = () => {
      const width = window.innerWidth
      if (width < 400) setCellSize(28)
      else if (width < 600) setCellSize(32)
      else if (width < 768) setCellSize(36)
      else setCellSize(40)
    }

    updateCellSize()
    window.addEventListener("resize", updateCellSize)
    return () => window.removeEventListener("resize", updateCellSize)
  }, [])

  const externalDraggedItem = useStore($draggedItem)
  const currentPlayerId = useStore($currentPlayerId)
  const ownerId = playerId || currentPlayerId || "solo"

  const allItemsOnGrid = useStore($itemsOnGrid)
  const allContainers = useStore($containers)
  const localPlayerId = useStore($localPlayerId)
  const activePreview = useStore($activePreview)

  // Interaction logic
  const canInteract =
    canInteractProp &&
    !viewOnly &&
    (ownerId === localPlayerId ||
      localPlayerId === "solo" ||
      !localPlayerId ||
      ownerId === SANDBOX_PLAYER_ID) &&
    localPlayerId !== "OBSERVER"

  // Sink global preview to local selection
  useEffect(() => {
    if (activePreview?.type === "instance") {
      setSelectedItemId(activePreview.id)
    } else {
      setSelectedItemId(null)
    }
  }, [activePreview])

  // Reset rotation when selection changes
  useEffect(() => {
    setPendingRotation(0)
  }, [])

  // Use props.items if provided (combat mode), otherwise pull from store
  const itemsOnGrid = (
    itemsProp || allItemsOnGrid.filter((i) => i.ownerId === ownerId)
  ).sort((a, b) => {
    const catA = ITEMS[a.itemId].category
    const catB = ITEMS[b.itemId].category
    if (catA === "CONTAINER" && catB !== "CONTAINER") return -1
    if (catA !== "CONTAINER" && catB === "CONTAINER") return 1
    return 0
  })

  const myContainers = allContainers.filter((c) => c.ownerId === ownerId)
  const containerItems = itemsOnGrid.filter((i) => {
    const def = ITEMS[i.itemId]
    return def && def.category === "CONTAINER"
  })

  const containerItemCells = containerItems.flatMap((item) => {
    const def = ITEMS[item.itemId]
    const w =
      item.rotation === 90 || item.rotation === 270 ? def.height : def.width
    const h =
      item.rotation === 90 || item.rotation === 270 ? def.width : def.height
    const cells = []
    for (let x = 0; x < w; x++) {
      for (let y = 0; y < h; y++) {
        cells.push({ x: item.x + x, y: item.y + y })
      }
    }
    return cells
  })

  const minX = 0
  const minY = 0
  const bagWidthCells = GRID_SIZE
  const bagHeightCells = GRID_SIZE

  // Virtual adjacency for drag state
  const virtualItems = useMemo(() => {
    let baseItems = [...itemsOnGrid]
    const isDragging = !!(draggedInstanceId || externalDraggedItem)

    if (!isDragging || !ghostPosition?.valid) return baseItems

    // Remove the dragged item if it was already on the grid to avoid double counting
    if (draggedInstanceId) {
      baseItems = baseItems.filter((i) => i.instanceId !== draggedInstanceId)
    }

    // Add it at the ghost position
    const itemId = draggedInstanceId
      ? itemsOnGrid.find((i) => i.instanceId === draggedInstanceId)?.itemId
      : externalDraggedItem

    if (itemId) {
      baseItems.push({
        instanceId: draggedInstanceId || "dragged-external",
        itemId,
        x: ghostPosition.gridX,
        y: ghostPosition.gridY,
        rotation:
          (draggedInstanceId
            ? itemsOnGrid.find((i) => i.instanceId === draggedInstanceId)
                ?.rotation
            : pendingRotation) || 0,
        ownerId,
      } as InventoryItemInstance)
    }

    return baseItems
  }, [
    itemsOnGrid,
    draggedInstanceId,
    externalDraggedItem,
    ghostPosition,
    pendingRotation,
    ownerId,
  ])

  const virtualResults = React.useMemo(
    () => getAdjacencyBonuses(virtualItems),
    [virtualItems],
  )

  // 1. Global stars (BOOST_SQUARE effect)
  const allStarredSquares = Object.values(virtualResults).flatMap(
    (res: AdjacencyResult) => res.boostedSquares || [],
  )
  const starredKeys = new Set(
    allStarredSquares.map((s: { x: number; y: number }) => `${s.x},${s.y}`),
  )

  // 2. Selected item synergy feedback (Stars shown only for selection or drag)
  const selectedResult = selectedItemId ? virtualResults[selectedItemId] : null
  const draggedResult =
    draggedInstanceId || externalDraggedItem
      ? virtualResults[draggedInstanceId || "dragged-external"]
      : null
  const displayResult = draggedResult || selectedResult

  const snapToGrid = (
    point: { x: number; y: number },
    itemWidth = 1,
    itemHeight = 1,
  ) => {
    if (!gridRef.current) return { x: 0, y: 0, gridX: 0, gridY: 0 }
    const rect = gridRef.current.getBoundingClientRect()
    const xOffset = point.x - rect.left
    const yOffset = point.y - rect.top
    const centerOffsetX = (itemWidth * (CELL_SIZE + GAP)) / 2
    const centerOffsetY = (itemHeight * (CELL_SIZE + GAP)) / 2
    const centeredX = xOffset - centerOffsetX
    const centeredY = yOffset - centerOffsetY
    const gridX = Math.round(centeredX / (CELL_SIZE + GAP)) + minX
    const gridY = Math.round(centeredY / (CELL_SIZE + GAP)) + minY

    return {
      x: (gridX - minX) * (CELL_SIZE + GAP),
      y: (gridY - minY) * (CELL_SIZE + GAP),
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
      )
    )
      return false
    if (itemDef.category !== "CONTAINER")
      return checkSupport(gx, gy, w, h, itemsOnGrid, ownerId)
    return true
  }

  // Keyboard shortcuts
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
        $draggedItem.set(null)
        $activePreview.set(null)
        return
      }

      if (externalDraggedItem) {
        if (e.key.toLowerCase() === "r" || e.key.toLowerCase() === "e") {
          e.preventDefault()
          if (selectedItemId) {
            rotateItem(selectedItemId)
          } else {
            setPendingRotation(
              (prev) => ((prev + 90) % 360) as 0 | 90 | 180 | 270,
            )
          }
          return
        }
        if (e.key.toLowerCase() === "q") {
          e.preventDefault()
          if (selectedItemId) {
            rotateItemCounterClockwise(selectedItemId)
          } else {
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
        case "tab": {
          e.preventDefault()
          const currentIndex = itemsOnGrid.findIndex(
            (i) => i.instanceId === selectedItemId,
          )
          const nextIndex = (currentIndex + 1) % itemsOnGrid.length
          const nextItem = itemsOnGrid[nextIndex]
          setSelectedItemId(nextItem?.instanceId || null)
          if (nextItem) {
            $activePreview.set({ type: "instance", id: nextItem.instanceId })
          }
          break
        }
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

  const handleDragStart = (instanceId: string) => {
    if (!canInteract) return
    setDraggedInstanceId(instanceId)
  }

  const handleDrag = (
    _instanceId: string,
    itemId: string,
    currentRot: number,
    info: PanInfo,
  ) => {
    if (!canInteract) return
    const itemDef = ITEMS[itemId]
    const w =
      currentRot === 90 || currentRot === 270 ? itemDef.height : itemDef.width
    const h =
      currentRot === 90 || currentRot === 270 ? itemDef.width : itemDef.height
    const { x, y, gridX, gridY } = snapToGrid(info.point, w, h)
    const valid = calculateGhostValidity(
      gridX,
      gridY,
      itemId,
      draggedInstanceId || undefined,
      currentRot,
    )
    setIsGhostValid(valid)
    setGhostPosition({ x, y, gridX, gridY, valid })
  }

  const handleDragEnd = (
    instanceId: string,
    itemId: string,
    currentRot: number,
    info: PanInfo,
  ) => {
    const itemDef = ITEMS[itemId]
    const w =
      currentRot === 90 || currentRot === 270 ? itemDef.height : itemDef.width
    const h =
      currentRot === 90 || currentRot === 270 ? itemDef.width : itemDef.height
    const { gridX, gridY } = snapToGrid(info.point, w, h)

    if (calculateGhostValidity(gridX, gridY, itemId, instanceId, currentRot)) {
      moveItem(instanceId, gridX, gridY, currentRot as 0 | 90 | 180 | 270)
    } else {
      removeItem(instanceId)
      returnItemToPool(ownerId, itemId)
      $draggedItem.set(itemId)
      $activePreview.set({ type: "definition", id: itemId })
      setPendingRotation(currentRot as 0 | 90 | 180 | 270)
      setErrorMessage(`${itemDef.name} returned to shelf!`)
      setTimeout(() => setErrorMessage(null), 3000)
    }

    setDraggedInstanceId(null)
    setGhostPosition(null)
  }

  const handleDragOverExtern = (e: React.DragEvent) => {
    e.preventDefault()
    if (!canInteract) return
    if (externalDraggedItem) {
      const itemDef = ITEMS[externalDraggedItem]
      if (!itemDef) return
      const w =
        pendingRotation === 90 || pendingRotation === 270
          ? itemDef.height
          : itemDef.width
      const h =
        pendingRotation === 90 || pendingRotation === 270
          ? itemDef.width
          : itemDef.height
      const { x, y, gridX, gridY } = snapToGrid(
        { x: e.clientX, y: e.clientY },
        w,
        h,
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
        <div
          ref={gridRef}
          className="relative transition-all duration-500 touch-manipulation overflow-visible select-none"
          id="inventory-grid"
          role="button"
          tabIndex={0}
          style={{
            width: bagWidthCells * CELL_SIZE + (bagWidthCells - 1) * GAP,
            height: bagHeightCells * CELL_SIZE + (bagHeightCells - 1) * GAP,
            maxWidth: "100%",
            touchAction: "none",
          }}
          onDragOver={handleDragOverExtern}
          onDragLeave={() => setGhostPosition(null)}
          onMouseMove={(e) => {
            if (externalDraggedItem && !draggedInstanceId && canInteract) {
              const itemDef = ITEMS[externalDraggedItem]
              if (!itemDef) return
              const w =
                pendingRotation === 90 || pendingRotation === 270
                  ? itemDef.height
                  : itemDef.width
              const h =
                pendingRotation === 90 || pendingRotation === 270
                  ? itemDef.width
                  : itemDef.height
              const { x, y, gridX, gridY } = snapToGrid(
                { x: e.clientX, y: e.clientY },
                w,
                h,
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
            if (!externalDraggedItem || !canInteract) return
            if (draggedInstanceId) return

            const itemDef = ITEMS[externalDraggedItem]
            if (!itemDef) return
            const w =
              pendingRotation === 90 || pendingRotation === 270
                ? itemDef.height
                : itemDef.width
            const h =
              pendingRotation === 90 || pendingRotation === 270
                ? itemDef.width
                : itemDef.height
            const { gridX, gridY } = snapToGrid(
              { x: e.clientX, y: e.clientY },
              w,
              h,
            )

            if (
              calculateGhostValidity(
                gridX,
                gridY,
                externalDraggedItem,
                undefined,
                pendingRotation,
              )
            ) {
              placeItem(
                externalDraggedItem,
                gridX,
                gridY,
                pendingRotation as 0 | 90 | 180 | 270,
                ownerId,
              )
              $draggedItem.set(null)
              $activePreview.set(null)
            } else {
              setErrorMessage(`${itemDef.name} returned to shelf!`)
              setTimeout(() => setErrorMessage(null), 2000)
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault() // Prevent default scroll behavior
              if (!externalDraggedItem || !canInteract) return
              if (draggedInstanceId) return

              const itemDef = ITEMS[externalDraggedItem]
              if (!itemDef) return
              const w =
                pendingRotation === 90 || pendingRotation === 270
                  ? itemDef.height
                  : itemDef.width
              const h =
                pendingRotation === 90 || pendingRotation === 270
                  ? itemDef.width
                  : itemDef.height

              // Use ghostPosition for gridX, gridY if available, otherwise approximate center
              const currentMouseX =
                e.currentTarget.getBoundingClientRect().left +
                (ghostPosition?.x || 0) +
                (w * (CELL_SIZE + GAP)) / 2
              const currentMouseY =
                e.currentTarget.getBoundingClientRect().top +
                (ghostPosition?.y || 0) +
                (h * (CELL_SIZE + GAP)) / 2

              const { gridX, gridY } = snapToGrid(
                { x: currentMouseX, y: currentMouseY },
                w,
                h,
              )

              if (
                calculateGhostValidity(
                  gridX,
                  gridY,
                  externalDraggedItem,
                  undefined,
                  pendingRotation,
                )
              ) {
                placeItem(
                  externalDraggedItem,
                  gridX,
                  gridY,
                  pendingRotation as 0 | 90 | 180 | 270,
                  ownerId,
                )
                $draggedItem.set(null)
                $activePreview.set(null)
              } else {
                setErrorMessage(`${itemDef.name} returned to shelf!`)
                setTimeout(() => setErrorMessage(null), 2000)
              }
            }
          }}
          onDrop={(e) => {
            e.preventDefault()
            // FALLBACK: Use store if dataTransfer is empty
            const itemId =
              e.dataTransfer.getData("itemId") || externalDraggedItem
            setGhostPosition(null)

            if (itemId && canInteract) {
              const itemDef = ITEMS[itemId]
              const w =
                pendingRotation === 90 || pendingRotation === 270
                  ? itemDef.height
                  : itemDef.width
              const h =
                pendingRotation === 90 || pendingRotation === 270
                  ? itemDef.width
                  : itemDef.height
              const { gridX, gridY } = snapToGrid(
                { x: e.clientX, y: e.clientY },
                w,
                h,
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
                $draggedItem.set(null)
                $activePreview.set(null)
              } else {
                setErrorMessage(`${itemDef.name} returned to shelf!`)
                setTimeout(() => setErrorMessage(null), 2000)
              }
            }
          }}
        >
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
            const x = i % GRID_SIZE
            const y = Math.floor(i / GRID_SIZE)
            return (
              <div
                key={`grid-bg-${x}-${y}`}
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
            )
          })}

          {myContainers.map((container) =>
            container.cells.map((cell, idx) => {
              const isDisabled = container.disabledCells?.some(
                (dc) => dc.x === cell.x && dc.y === cell.y,
              )
              if (isDisabled) return null
              const hasLeft = container.cells.some(
                (n) => n.x === cell.x - 1 && n.y === cell.y,
              )
              const hasRight = container.cells.some(
                (n) => n.x === cell.x + 1 && n.y === cell.y,
              )
              const hasTop = container.cells.some(
                (n) => n.x === cell.x && n.y === cell.y - 1,
              )
              const hasBottom = container.cells.some(
                (n) => n.x === cell.x && n.y === cell.y + 1,
              )
              return (
                <div
                  key={`${container.id}-${idx}`}
                  className="absolute transition-all bg-wood-700/80 shadow-inner pointer-events-none"
                  style={{
                    left: (cell.x - minX) * (CELL_SIZE + GAP),
                    top: (cell.y - minY) * (CELL_SIZE + GAP),
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    borderLeft: !hasLeft
                      ? "3px solid #3E2723"
                      : "1px solid rgba(255,255,255,0.05)",
                    borderRight: !hasRight
                      ? "3px solid #3E2723"
                      : "1px solid rgba(255,255,255,0.05)",
                    borderTop: !hasTop
                      ? "3px solid #3E2723"
                      : "1px solid rgba(255,255,255,0.05)",
                    borderBottom: !hasBottom
                      ? "3px solid #3E2723"
                      : "1px solid rgba(255,255,255,0.05)",
                    borderTopLeftRadius: !hasTop && !hasLeft ? "8px" : "0",
                    borderTopRightRadius: !hasTop && !hasRight ? "8px" : "0",
                    borderBottomLeftRadius:
                      !hasBottom && !hasLeft ? "8px" : "0",
                    borderBottomRightRadius:
                      !hasBottom && !hasRight ? "8px" : "0",
                  }}
                >
                  <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/leather.png')]" />
                </div>
              )
            }),
          )}

          {containerItemCells.map((cell) => (
            <div
              key={`item-cell-${cell.x}-${cell.y}`}
              className="absolute transition-all bg-wood-700/80 shadow-inner pointer-events-none"
              style={{
                left: (cell.x - minX) * (CELL_SIZE + GAP),
                top: (cell.y - minY) * (CELL_SIZE + GAP),
                width: CELL_SIZE,
                height: CELL_SIZE,
                borderRadius: "4px",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/leather.png')]" />
            </div>
          ))}

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

          {itemsOnGrid.map((item) => (
            <BackpackItem
              key={item.instanceId}
              item={item}
              draggedInstanceId={draggedInstanceId}
              onDragStart={handleDragStart}
              onDrag={handleDrag}
              onDragEnd={handleDragEnd}
              CELL_SIZE={CELL_SIZE}
              GAP={GAP}
              isSelected={selectedItemId === item.instanceId}
              onSelect={() =>
                !viewOnly &&
                $activePreview.set({ type: "instance", id: item.instanceId })
              }
              minX={minX}
              minY={minY}
              adjacencyResult={virtualResults[item.instanceId]}
              viewOnly={viewOnly}
              cooldown={cooldowns[item.instanceId] || 0}
            />
          ))}

          {(selectedItemId || draggedInstanceId || externalDraggedItem) &&
            !viewOnly && (
              <div className="absolute inset-0 pointer-events-none z-50">
                {myContainers.map((container) =>
                  container.cells.map((cell, idx) => {
                    const key = `${cell.x},${cell.y}`
                    const isGlobalStar = starredKeys.has(key)

                    // Find synergy info for this square if any
                    const activeSyn = displayResult?.activeSynergySquares.find(
                      (s) => s.x === cell.x && s.y === cell.y,
                    )
                    const potentialSyn =
                      displayResult?.potentialSynergySquares.find(
                        (s) => s.x === cell.x && s.y === cell.y,
                      )

                    const isActiveSynergy = !!activeSyn
                    const isPotentialSynergy = !!potentialSyn

                    if (isGlobalStar || isActiveSynergy || isPotentialSynergy) {
                      const isFilled = isGlobalStar || isActiveSynergy
                      const iconName =
                        activeSyn?.icon || potentialSyn?.icon || "Star"

                      const Icon =
                        (
                          LucideIcons as unknown as Record<
                            string,
                            LucideIcons.LucideIcon
                          >
                        )[iconName] || LucideIcons.Star

                      return (
                        <div
                          key={`syn-overlay-${container.id}-${idx}`}
                          className={clsx(
                            "absolute flex items-center justify-center transition-all duration-300",
                            isFilled
                              ? "animate-bounce scale-110"
                              : "opacity-40 scale-75",
                          )}
                          style={{
                            left: (cell.x - minX) * (CELL_SIZE + GAP),
                            top: (cell.y - minY) * (CELL_SIZE + GAP),
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
                  }),
                )}
              </div>
            )}
        </div>

        {/* Tooltip is managed globally by react-tooltip based on data attributes in BackpackItem */}
      </div>
    </div>
  )
}

export default Inventory
