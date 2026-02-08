import React from 'react';
import { motion } from 'framer-motion';
import type { Item as ItemType } from '../types';
import * as Icons from 'lucide-react';
import { cn } from '../lib/utils';


interface ItemProps {
  itemDef: ItemType;
  instanceId?: string;
  x?: number;
  y?: number;
  rotation?: number;
  isDraggable?: boolean;
  onRotate?: () => void;
}

const Item: React.FC<ItemProps> = ({ 
  itemDef, 
  instanceId, 
  x: _x, 
  y: _y, 
  rotation = 0, 
  isDraggable = true,
  onRotate: _onRotate 
}) => {
  const Icon = (Icons[itemDef.icon as keyof typeof Icons] || Icons.HelpCircle) as React.FC<Icons.LucideProps>;
  
  // Calculate visual size based on grid scale (assuming 1 unit = 4rem/64px)
  const CELL_SIZE = 64;
  const GAP = 4;
  
  // Effective width/height based on rotation
  const isRotated = rotation === 90 || rotation === 270;
  const w = isRotated ? itemDef.height : itemDef.width;
  const h = isRotated ? itemDef.width : itemDef.height;

  const style = {
    width: w * CELL_SIZE - GAP,
    height: h * CELL_SIZE - GAP,
  };

  return (
    <motion.div
      layoutId={instanceId} // Shared layout ID for smooth transitions?
      className={cn(
        "relative flex items-center justify-center rounded-lg shadow-md border-2",
        "bg-slate-800 border-slate-600 hover:border-camp-orange cursor-grab active:cursor-grabbing",
        "transition-colors duration-200"
      )}
      style={style}
      // Dragging logic will be handled by parent or specialized wrapper for now
      // Actually simpler: Make this a "dumb" visual component and wrap it
      // But for framer motion drag to work grid-style, we often need the parent constraints.
      // Let's keep it simple: Render visual here.
    >
      <div 
        className="flex flex-col items-center justify-center text-slate-300 pointer-events-none select-none"
        style={{ transform: `rotate(${-rotation}deg)` }} // Counter-rotate content so it stays upright? Or let it rotate?
        // Actually physically, items rotate. So don't counter-rotate.
      >
        <Icon size={24} />
        <span className="text-[10px] uppercase font-bold mt-1 tracking-wider opacity-70">
          {itemDef.name}
        </span>
      </div>
      
      {/* Rotate handle or instructions */}
      {isDraggable && (
        <div className="absolute bottom-1 right-1 w-2 h-2 bg-slate-500 rounded-full opacity-50" />
      )}
    </motion.div>
  );
};

export default Item;
