import { useStore } from "@nanostores/react"
import clsx from "clsx"
import type { PanInfo } from "framer-motion"
import * as LucideIcons from "lucide-react"
import React, { useRef, useState, useEffect, useMemo } from "react"
import { type AdjacencyResult, getAdjacencyBonuses } from "../lib/adjacency"
import { ITEMS } from "../lib/items"
import {
  $activePreview,
  $currentPlayerId,
  $draggedItem,
  $gridConfig,
  $gridState,
  $itemsOnGrid,
  $localPlayerId,
  SANDBOX_PLAYER_ID,
  checkCollision,
  checkSupport,
  getPixelCoords,
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

  const gridConfig = useStore($gridConfig)
  const gridState = useStore($gridState)
  const { cellSize: CELL_SIZE, gap: GAP, rows, cols } = gridConfig

  const gridRef = useRef<HTMLDivElement>(null)

  // DRAG SESSION ID: Incrementing this forces items to remount and clear transforms
  const [dragSessionId, setDragSessionId] = useState(0)

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

  const virtualItems = useMemo(() => {
    let baseItems = [...itemsOnGrid]
    const isDragging = !!(draggedInstanceId || externalDraggedItem)
    if (!isDragging || !ghostPosition?.valid) return baseItems
    if (draggedInstanceId)
      baseItems = baseItems.filter((i) => i.instanceId !== draggedInstanceId)
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

    const widthPx = w * CELL_SIZE + (w - 1) * GAP
    const heightPx = h * CELL_SIZE + (h - 1) * GAP

    const gridX = Math.round((xOffset - widthPx / 2) / (CELL_SIZE + GAP))
    const gridY = Math.round((yOffset - heightPx / 2) / (CELL_SIZE + GAP))

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
        setDragSessionId((s) => s + 1) // Reset on cancel
        $draggedItem.set(null)
        $activePreview.set(null)
        return
      }
      if (externalDraggedItem) {
        if (e.key.toLowerCase() === "r" || e.key.toLowerCase() === "e") {
          e.preventDefault()
          if (selectedItemId) rotateItem(selectedItemId)
          else
            setPendingRotation(
              (prev) => ((prev + 90) % 360) as 0 | 90 | 180 | 270,
            )
          return
        }
        if (e.key.toLowerCase() === "q") {
          e.preventDefault()
          if (selectedItemId) rotateItemCounterClockwise(selectedItemId)
          else
            setPendingRotation(
              (prev) => ((prev - 90 + 360) % 360) as 0 | 90 | 180 | 270,
            )
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
    _instanceId: string,
    itemId: string,
    currentRot: number,
    info: PanInfo,
  ) => {
    if (!canInteract) return
    const { x, y, gridX, gridY } = snapToGrid(info.point, itemId, currentRot)
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
    const { gridX, gridY } = snapToGrid(info.point, itemId, currentRot)

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

    // Increment session ID to force a key-based remount, clearing all drag transforms
    setDragSessionId((s) => s + 1)
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
            if (!externalDraggedItem || !canInteract || draggedInstanceId)
              return
            const { gridX, gridY } = snapToGrid(
              { x: e.clientX, y: e.clientY },
              externalDraggedItem,
              pendingRotation,
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
              setDragSessionId((s) => s + 1)
              $draggedItem.set(null)
              $activePreview.set(null)
            } else {
              setErrorMessage(
                `${ITEMS[externalDraggedItem]?.name} returned to shelf!`,
              )
              setTimeout(() => setErrorMessage(null), 2000)
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
                setDragSessionId((s) => s + 1)
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

          {itemsOnGrid.map((item) => (
            <BackpackItem
              key={`${item.instanceId}-${dragSessionId}`} // KEY RESET: Clears Framer Motion transforms
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
              adjacencyResult={virtualResults[item.instanceId]}
              viewOnly={viewOnly}
              cooldown={cooldowns[item.instanceId] || 0}
            />
          ))}

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
      </div>
    </div>
  )
}

export default Inventory
