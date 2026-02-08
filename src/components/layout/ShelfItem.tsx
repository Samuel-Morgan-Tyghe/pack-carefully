import React from 'react';
import * as LucideIcons from 'lucide-react';
import { $draggedItem } from '../../store/gameStore';

interface ShelfItemProps {
    item: {
        id: string;
        name: string;
        width: number;
        height: number;
        icon: string;
    };
}

const ShelfItem: React.FC<ShelfItemProps> = ({ item }) => {
    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData('itemId', item.id);
        e.dataTransfer.effectAllowed = 'copy';
        $draggedItem.set(item.id);

        // Custom Drag Image
        const dragEl = document.createElement('div');
        dragEl.style.width = `${item.width * 64 + (item.width - 1) * 4}px`;
        dragEl.style.height = `${item.height * 64 + (item.height - 1) * 4}px`;
        dragEl.style.backgroundColor = '#F5E6CA'; // Parchment
        dragEl.style.backgroundImage = 'url("https://www.transparenttextures.com/patterns/paper.png")';
        dragEl.style.border = '2px solid #8D6E63';
        dragEl.style.borderRadius = '0.5rem';
        dragEl.style.position = 'absolute';
        dragEl.style.top = '-9999px';
        dragEl.style.display = 'flex';
        dragEl.style.flexDirection = 'column';
        dragEl.style.alignItems = 'center';
        dragEl.style.justifyContent = 'center';
        dragEl.innerHTML = `
        <div style="font-weight: bold; font-family:serif; color: #2D1B12; font-size: 14px; text-transform: uppercase;">${item.name}</div>
        <div style="font-size: 10px; color: #5D4037;">${item.width}x${item.height}</div>
        `;
        
        document.body.appendChild(dragEl);
        e.dataTransfer.setDragImage(dragEl, 32, 32);
        
        setTimeout(() => { document.body.removeChild(dragEl); }, 0);
    };

    const handleDragEnd = () => {
        $draggedItem.set(null);
    };

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            className="group flex flex-col gap-2 p-3 rounded bg-parchment-100 hover:bg-white border-2 border-parchment-500 hover:border-gold-500 transition-all cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md relative overflow-hidden"
        >
            {/* Texture noise */}
            <div className="absolute inset-0 bg-paper-texture opacity-30 pointer-events-none" />

            <div className="flex justify-between items-start w-full relative z-10">
                <div className="p-1 bg-wood-200/50 rounded">
                    {React.createElement(
                        (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[item.icon] || LucideIcons.Package,
                        { size: 20, className: "text-wood-900" }
                    )}
                </div>
            </div>
            <div className="relative z-10">
                <div className="font-serif font-bold text-sm text-wood-900 leading-tight group-hover:text-wood-600 transition-colors uppercase">{item.name}</div>
                <div className="text-[10px] text-wood-600 mt-1 font-mono">{item.width}x{item.height}</div>
            </div>
        </div>
    );
};

export default React.memo(ShelfItem);
