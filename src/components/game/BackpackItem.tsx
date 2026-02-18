import React from 'react';
import { motion } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { toggleLock } from '../../store/gameStore';
import * as LucideIcons from 'lucide-react';
import { ITEMS } from '../../lib/items';
import type { InventoryItemInstance } from '../../types';
import clsx from 'clsx';
import { playSound } from '../../lib/sounds';
import type { AdjacencyResult } from '../../lib/adjacency';

interface BackpackItemProps {
    item: InventoryItemInstance;
    draggedInstanceId: string | null;
    onDragStart: (id: string) => void;
    onDrag: (id: string, itemId: string, rotation: number, info: PanInfo) => void;
    onDragEnd: (instanceId: string, itemId: string, rotation: number, info: PanInfo) => void;
    CELL_SIZE: number;
    GAP: number;
    isHighlighted?: boolean;
    cooldown?: number; // 0-100%
    isSelected?: boolean;
    onSelect?: () => void;
    minX: number;
    minY: number;
    adjacencyResult?: AdjacencyResult;
    viewOnly?: boolean;
}

const BackpackItem: React.FC<BackpackItemProps> = ({
    item,
    draggedInstanceId,
    onDragStart,
    onDrag,
    onDragEnd,
    CELL_SIZE,
    GAP,
    isHighlighted,
    cooldown = 0,
    isSelected = false,
    onSelect,
    minX,
    minY,
    adjacencyResult,
    viewOnly = false
}) => {
    const realItemDef = ITEMS[item.itemId];
    const disguiseDef = item.disguiseItemId ? ITEMS[item.disguiseItemId] : null;

    const displayDef = disguiseDef || realItemDef;
    const itemDef = realItemDef; // Used for dimensions/logic
    const isDragging = draggedInstanceId === item.instanceId;
    const myBonus = adjacencyResult;
    const canInteract = !viewOnly;

    // Dimensions
    const w = (item.rotation === 90 || item.rotation === 270) ? itemDef.height : itemDef.width;
    const h = (item.rotation === 90 || item.rotation === 270) ? itemDef.width : itemDef.height;

    const widthPx = w * CELL_SIZE + (w - 1) * GAP;
    const heightPx = h * CELL_SIZE + (h - 1) * GAP;

    // Detect if x2 speed is active
    const hasSpeedBoost = myBonus?.multipliers?.speed === 2;

    return (
        <motion.div
            layout // Use layout animation for smooth sorting/shifts if we implement auto-sort
            drag={canInteract && !item.locked}
            dragMomentum={false}
            dragElastic={0.1}
            whileDrag={{
                scale: 1.05,
                zIndex: 100,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)"
            }}

            // Initial position
            style={{
                position: 'absolute',
                width: widthPx,
                height: heightPx,
                left: (item.x - minX) * (CELL_SIZE + GAP),
                top: (item.y - minY) * (CELL_SIZE + GAP),
                pointerEvents: viewOnly ? 'none' : 'auto'
            }}
            data-tooltip-id="item-tooltip"
            data-item-id={item.itemId}
            data-instance-id={item.instanceId}

            onDragStart={() => {
                if (canInteract && !item.locked) {
                    playSound.pop();
                    onDragStart(item.instanceId);
                }
            }}
            onDrag={(_, info) => canInteract && !item.locked && onDrag(item.instanceId, item.itemId, item.rotation, info)}
            onDragEnd={(_, info) => canInteract && !item.locked && onDragEnd(item.instanceId, item.itemId, item.rotation, info)}

            onClick={(e) => {
                if (!canInteract) return;
                if (e.shiftKey) {
                    toggleLock(item.instanceId);
                } else if (!isDragging) {
                    // Select the item
                    onSelect?.();
                }
            }}

            className={clsx(
                "absolute transition-all duration-200",
                !viewOnly ? "cursor-grab active:cursor-grabbing hover:z-30" : "cursor-default",
                isDragging ? "z-50 opacity-90" : (displayDef.category === 'CONTAINER' ? "z-10" : "z-20"),
                isHighlighted && "ring-4 ring-green-400 ring-offset-2 ring-offset-black/50 bg-green-900/20",
                isSelected && "ring-4 ring-blue-400 ring-offset-2 ring-offset-black/50 shadow-[0_0_25px_rgba(59,130,246,0.8)] scale-[1.02]",
                "rounded-md shadow-lg border-2 flex flex-col items-center justify-center select-none touch-none",
                // Base colors based on category
                displayDef.category === 'ESSENTIAL' ? "bg-gradient-to-br from-blue-700 to-blue-900 border-blue-500/50" :
                    displayDef.category === 'WEAPON' ? "bg-gradient-to-br from-red-800 to-red-950 border-red-600/50" :
                        displayDef.category === 'TOOL' ? "bg-gradient-to-br from-slate-600 to-slate-800 border-slate-500/50" :
                            displayDef.category === 'SURVIVAL' ? "bg-gradient-to-br from-green-700 to-green-900 border-green-600/50" :
                                displayDef.category === 'SABOTAGE' ? "bg-gradient-to-br from-purple-800 to-purple-950 border-purple-700/50" :
                                    "bg-gradient-to-br from-gray-600 to-gray-800 border-gray-500/50",

                // Active Adjacency Glow
                (myBonus?.totalBuff || 0) > 0 && "shadow-[0_0_15px_rgba(234,179,8,0.5)] border-gold-400 ring-1 ring-gold-500",
                hasSpeedBoost && "shadow-[0_0_20px_rgba(255,255,255,0.6)] border-white scale-[1.05]",

                // Locked Visual
                item.locked && "grayscale opacity-90 border-red-500/50 ring-2 ring-red-900/40"
            )}
        >
            {/* Icon */}
            {(() => {
                const IconComponent = (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[displayDef.icon] || LucideIcons.Box;
                return (
                    <div style={{ rotate: `${item.rotation}deg` }} className="transition-transform duration-300">
                        <IconComponent className={clsx("text-parchment-100", w === 1 && h === 1 ? "w-6 h-6" : "w-8 h-8", item.locked && "text-red-400/50")} />
                    </div>
                );
            })()}

            {/* Show Name if space allows */}
            {(w > 1 || h > 1) && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-parchment-200 mt-1 pointer-events-none">
                    {itemDef.name}
                </span>
            )}

            {/* Speed Boost Badge */}
            {hasSpeedBoost && (
                <div className="absolute top-0 left-0 bg-white text-black text-[8px] font-black px-1 rounded-br-md shadow-md animate-pulse">
                    X2 SPEED
                </div>
            )}

            {/* Lock Icon Overlay */}
            {item.locked && (
                <div className="absolute top-1 right-1 text-red-500">
                    <LucideIcons.Lock size={12} />
                </div>
            )}

            {/* Cooldown Overlay */}
            {cooldown > 0 && (
                <motion.div
                    className="absolute bottom-0 left-0 right-0 bg-gray-900/60 z-20 pointer-events-none"
                    initial={{ height: '0%' }}
                    animate={{ height: `${cooldown}%` }}
                    transition={{ duration: 0.1 }}
                />
            )}

            {/* Adjacency Badge (Additive) */}
            {myBonus && (myBonus.totalBuff || 0) > 0 && !item.locked && (
                <div className="absolute -top-2 -right-2 bg-gold-500 text-wood-900 font-bold text-xs w-6 h-6 rounded-full flex items-center justify-center shadow-lg border border-white transform scale-100 animate-bounce-subtle z-20">
                    +{myBonus.totalBuff}
                </div>
            )}

            {/* Multiplier Badge */}
            {myBonus && Object.keys(myBonus.multipliers).length > 0 && !item.locked && (
                <div className="absolute -bottom-2 -left-2 bg-blue-500 text-white font-bold text-[8px] px-1 py-0.5 rounded shadow-lg border border-white z-20">
                    {Object.entries(myBonus.multipliers).map(([stat, val]) => `x${val} ${stat.slice(0, 3)}`).join(', ')}
                </div>
            )}
        </motion.div>
    );
};

export default BackpackItem;
