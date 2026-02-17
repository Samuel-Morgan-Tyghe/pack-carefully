import React from 'react';
import * as LucideIcons from 'lucide-react';
import { $draggedItem, $localPlayerId, $viewingPlayerId, $activePreview } from '../../store/gameStore';
import { useStore } from '@nanostores/react';
import clsx from 'clsx';

interface ShelfItemProps {
    item: {
        id: string;
        name: string;
        width: number;
        height: number;
        icon: string;
    };
}

import ItemTooltip from './ItemTooltip';

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
    const [anchorRect, setAnchorRect] = React.useState<DOMRect | null>(null);
    const [showTooltip, setShowTooltip] = React.useState(false);
    const itemRef = React.useRef<HTMLDivElement>(null);

    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData('itemId', item.id);
        e.dataTransfer.effectAllowed = 'copy';
        $draggedItem.set(item.id);

        // Custom Drag Image - Scaled to new grid size (40px)
        const dragEl = document.createElement('div');
        const CELL_SIZE = 40;
        const GAP = 2;
        dragEl.style.width = `${item.width * CELL_SIZE + (item.width - 1) * GAP}px`;
        dragEl.style.height = `${item.height * CELL_SIZE + (item.height - 1) * GAP}px`;
        dragEl.style.backgroundColor = '#F5E6CA';
        dragEl.style.backgroundImage = 'url("https://www.transparenttextures.com/patterns/paper.png")';
        dragEl.style.border = '2px solid #8D6E63';
        dragEl.style.borderRadius = '0.25rem';
        dragEl.style.position = 'absolute';
        dragEl.style.top = '-9999px';
        dragEl.style.display = 'flex';
        dragEl.style.alignItems = 'center';
        dragEl.style.justifyContent = 'center';
        dragEl.innerHTML = `<div style="font-size: 10px; color: #2D1B12; font-weight: bold;">${item.name}</div>`;

        document.body.appendChild(dragEl);
        e.dataTransfer.setDragImage(dragEl, CELL_SIZE / 2, CELL_SIZE / 2);
        setTimeout(() => { document.body.removeChild(dragEl); }, 0);
    };

    const handleDragEnd = () => {
        $draggedItem.set(null);
    };

    const viewingPlayerId = useStore($viewingPlayerId);
    const localPlayerId = useStore($localPlayerId);
    const isMe = viewingPlayerId === localPlayerId;

    const draggedItem = useStore($draggedItem);
    const isSelected = draggedItem === item.id;
    const activePreview = useStore($activePreview);
    const isDetailSelected = activePreview?.type === 'definition' && activePreview.id === item.id;

    // Grid cell size for the mini preview
    const MINI_CELL = 16;
    const MINI_GAP = 1;

    return (
        <div className="relative">
            <div
                ref={itemRef}
                draggable={isMe}
                onDragStart={(e) => isMe && handleDragStart(e)}
                onDragEnd={handleDragEnd}
                onMouseEnter={(e) => {
                    setAnchorRect(e.currentTarget.getBoundingClientRect());
                    setShowTooltip(true);
                }}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={() => {
                    if (isMe) {
                        if (isSelected) {
                            $draggedItem.set(null);
                            $activePreview.set(null);
                        } else {
                            $draggedItem.set(item.id);
                            $activePreview.set({ type: 'definition', id: item.id });
                        }
                    }
                }}
                className={clsx(
                    "group relative aspect-square flex items-center justify-center rounded-lg transition-all cursor-grab active:cursor-grabbing hover:bg-wood-800/50 p-1",
                    isSelected || isDetailSelected ? "ring-2 ring-gold-500 bg-gold-500/10 shadow-glow-gold" : "border border-wood-700/50 bg-wood-950/30"
                )}
                style={{
                    width: '100%',
                    height: '100%'
                }}
            >
                {/* Texture noise */}
                <div className="absolute inset-0 bg-paper-texture opacity-5 pointer-events-none rounded-lg" />

                {/* Shape Grid */}
                <div
                    className="relative pointer-events-none"
                    style={{
                        width: item.width * MINI_CELL + (item.width - 1) * MINI_GAP,
                        height: item.height * MINI_CELL + (item.height - 1) * MINI_GAP,
                    }}
                >
                    {/* Background cells */}
                    {Array.from({ length: item.width * item.height }).map((_, i) => (
                        <div
                            key={i}
                            className="absolute bg-wood-700/40 rounded-sm border border-wood-800/50"
                            style={{
                                width: MINI_CELL,
                                height: MINI_CELL,
                                left: (i % item.width) * (MINI_CELL + MINI_GAP),
                                top: Math.floor(i / item.width) * (MINI_CELL + MINI_GAP),
                            }}
                        />
                    ))}

                    {/* Icon Centered */}
                    <div className="absolute inset-0 flex items-center justify-center p-1 drop-shadow-md">
                        {React.createElement(
                            (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[item.icon] || LucideIcons.Package,
                            {
                                size: Math.min(item.width, item.height) >= 2 ? 18 : 12,
                                className: clsx("transition-transform group-hover:scale-110", isDetailSelected || isSelected ? "text-gold-400" : "text-parchment-300")
                            }
                        )}
                    </div>
                </div>

                {/* Lock icon if unavailable */}
                {!isMe && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg">
                        <LucideIcons.Lock size={12} className="text-wood-400" />
                    </div>
                )}
            </div>

            {/* Tooltip */}
            {(showTooltip || isDetailSelected) && anchorRect && (
                <ItemTooltip
                    itemId={item.id}
                    anchorRect={anchorRect}
                    onClose={() => {
                        setShowTooltip(false);
                        if (isDetailSelected) $activePreview.set(null);
                    }}
                />
            )}
        </div>
    );
};

export default React.memo(ShelfItem);
