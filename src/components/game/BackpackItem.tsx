import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { ITEMS } from '../../lib/items';
import * as LucideIcons from 'lucide-react';
import { rotateItem } from '../../store/gameStore';

interface BackpackItemProps {
    item: any;
    draggedInstanceId: string | null;
    onDragStart: (instanceId: string) => void;
    onDrag: (instanceId: string, itemId: string, rotation: number, info: any) => void;
    onDragEnd: (instanceId: string, itemId: string, rotation: number, info: any) => void;
    CELL_SIZE: number;
    GAP: number;
}

const BackpackItem: React.FC<BackpackItemProps> = ({ item, draggedInstanceId, onDragStart, onDrag, onDragEnd, CELL_SIZE, GAP }) => {
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
            onDragStart={() => onDragStart(item.instanceId)}
            onDrag={(_e, info) => onDrag(item.instanceId, item.itemId, item.rotation, info)}
            onDragEnd={(_e, info) => onDragEnd(item.instanceId, item.itemId, item.rotation, info)}
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
};

export default BackpackItem;
