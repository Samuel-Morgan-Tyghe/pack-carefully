import React from 'react';
import { useStore } from '@nanostores/react';
import { motion } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { $adjacencyBonuses, toggleLock, rotateItem } from '../../store/gameStore';
import * as LucideIcons from 'lucide-react';
import { ITEMS } from '../../lib/items';
import type { InventoryItemInstance } from '../../types';
import clsx from 'clsx';
import { playSound } from '../../lib/sounds';

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
    cooldown = 0
}) => {
    // If disguised, use the disguise item definition for visuals (Icon, Size?) 
    // Spec says "Alter appearance". Usually this means Icon. 
    // Size changes might break grid unless we swap the item entirely.
    // Spec: "make a Rock look like Rations". If Rock is 2x2 and Rations is 2x2, easy.
    // If sizes differ, it's tricky. "The effect persists".
    // For MVP, let's just swap the Icon and Name, but keep dimensions?
    // Or just swap Icon.
    
    const realItemDef = ITEMS[item.itemId];
    const disguiseDef = item.disguiseItemId ? ITEMS[item.disguiseItemId] : null;
    
    // VISUAL definition (Icon, Name) - Disguise takes precedence
    // FUNCTIONAL definition (Dimensions, Stats) - Real item takes precedence
    // Actually, "Disguise" usually implies it looks EXACTLY like the other thing.
    // But if dimensions differ, the illusion breaks on the grid.
    // Let's assume for now we only disguise Icon/Name/Color. 
    
    const displayDef = disguiseDef || realItemDef;
    const itemDef = realItemDef; // Used for dimensions/logic
    
    const adjacency = useStore($adjacencyBonuses);
    const isDragging = draggedInstanceId === item.instanceId;
    const myBonus = adjacency[item.instanceId];
    
    // Dimensions
    const w = (item.rotation === 90 || item.rotation === 270) ? itemDef.height : itemDef.width;
    const h = (item.rotation === 90 || item.rotation === 270) ? itemDef.width : itemDef.height;

    const widthPx = w * CELL_SIZE + (w - 1) * GAP;
    const heightPx = h * CELL_SIZE + (h - 1) * GAP;



    return (
        <motion.div
            layout // Use layout animation for smooth sorting/shifts if we implement auto-sort
            drag={!item.locked}
            dragMomentum={false}
            dragElastic={0.1}
            whileDrag={{ scale: 1.1, zIndex: 100, rotate: item.rotation }} // Keep rotation while dragging visually
            
            // Initial position
            style={{
                position: 'absolute',
                width: widthPx,
                height: heightPx,
                left: item.x * (CELL_SIZE + GAP),
                top: item.y * (CELL_SIZE + GAP),
                rotate: item.rotation // Apply rotation to the DIV
            }}
            
            onDragStart={() => {
                if (!item.locked) {
                    playSound.pop();
                    onDragStart(item.instanceId);
                }
            }}
            onDrag={(_, info) => !item.locked && onDrag(item.instanceId, item.itemId, item.rotation, info)}
            onDragEnd={(_, info) => !item.locked && onDragEnd(item.instanceId, item.itemId, item.rotation, info)}
            
            onClick={(e) => {
                if (e.shiftKey) {
                    toggleLock(item.instanceId);
                } else if (!isDragging) {
                    playSound.rotate();
                    rotateItem(item.instanceId);
                }
            }}
            
            className={clsx( // Changed from 'cn' to 'clsx' to match existing import
                "absolute cursor-grab active:cursor-grabbing hover:z-20 transition-transform",
                isDragging ? "z-50 scale-105 pointer-events-none opacity-80" : "z-10",
                isHighlighted && "ring-4 ring-green-400 ring-offset-2 ring-offset-black/50 bg-green-900/20",
                "rounded-md shadow-md border-2 flex flex-col items-center justify-center select-none touching-action-none transition-colors",
                // Base colors based on category
                displayDef.category === 'ESSENTIAL' ? "bg-blue-800 border-blue-600/50" :
                displayDef.category === 'WEAPON' ? "bg-red-900 border-red-700/50" :
                displayDef.category === 'TOOL' ? "bg-slate-700 border-slate-500/50" :
                displayDef.category === 'SURVIVAL' ? "bg-green-800 border-green-600/50" :
                displayDef.category === 'SABOTAGE' ? "bg-purple-900 border-purple-700/50" :
                "bg-gray-700 border-gray-600/50",
                
                // Active Adjacency Glow
                myBonus?.totalBuff > 0 && "shadow-[0_0_15px_rgba(234,179,8,0.5)] border-gold-400 ring-1 ring-gold-500",
                
                // Locked Visual
                item.locked && "grayscale opacity-90 border-red-500/50 ring-2 ring-red-900/40"
            )}
        >
             {/* Icon */}
             {(() => {
                 const IconComponent = (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[displayDef.icon] || LucideIcons.Box;
                 return <IconComponent className={clsx("text-parchment-100", w===1 && h===1 ? "w-6 h-6" : "w-8 h-8", item.locked && "text-red-400/50")} />;
             })()}
             
             {/* Show Name if space allows */}
             {(w > 1 || h > 1) && (
                 <span className="text-[10px] font-bold uppercase tracking-wider text-parchment-200 mt-1 pointer-events-none">
                     {itemDef.name}
                 </span>
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
             {/* Adjacency Badge */}
             {myBonus?.totalBuff > 0 && !item.locked && (
                 <div className="absolute -top-2 -right-2 bg-gold-500 text-wood-900 font-bold text-xs w-6 h-6 rounded-full flex items-center justify-center shadow-lg border border-white transform scale-100 animate-bounce-subtle z-20">
                     +{myBonus.totalBuff}
                 </div>
             )}
             
             {/* Hover info for debugging/gameplay */}
             <div className="absolute inset-0 opacity-0 hover:opacity-100 bg-black/80 flex flex-col items-center justify-center text-[10px] p-1 text-center pointer-events-none transition-opacity z-10">
                 <div className="font-bold text-gold-500">{itemDef.name}</div>
                 <div>{itemDef.description}</div>
                 {myBonus?.activeRules.length > 0 && (
                     <div className="text-green-400 mt-1 border-t border-white/20 pt-1">
                         {myBonus.activeRules.map((r, i) => <div key={i}>{r}</div>)}
                     </div>
                 )}
             </div>

        </motion.div>
    );
};

export default BackpackItem;
