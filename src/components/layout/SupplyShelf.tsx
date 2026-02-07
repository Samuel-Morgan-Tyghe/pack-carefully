import React from 'react';
import { useStore } from '@nanostores/react';
import { $availableItems, $draggedItem } from '../../store/gameStore';
import * as LucideIcons from 'lucide-react';
import PlayerInfo from './PlayerInfo';

const SupplyShelf: React.FC = () => {
    const availableItems = useStore($availableItems);

    const handleDragStart = (e: React.DragEvent, item: any) => {
        e.dataTransfer.setData('itemId', item.id);
        e.dataTransfer.effectAllowed = 'copy';
        $draggedItem.set(item.id);

        // Custom Drag Image (Updated to match scale)
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

    return (
        <section className="w-80 bg-wood-900/90 border-l-4 border-wood-700 shadow-2xl p-6 flex flex-col gap-6 relative z-10 backdrop-blur-sm">
            {/* Supply Header */}
            <div className="flex justify-between items-center border-b-2 border-wood-700 pb-2">
                <h3 className="font-display font-bold text-2xl text-gold-500 drop-shadow-sm">Supplies</h3>
                <span className="text-xs bg-wood-800 px-2 py-1 rounded text-wood-300 font-mono border border-wood-600">{availableItems.length}</span>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-wood-600 scrollbar-track-wood-900 min-h-0">
                {/* Group by category */}
                {['ESSENTIAL', 'TOOL', 'SURVIVAL', 'COMFORT', 'SABOTAGE'].map(cat => {
                    const catItems = availableItems.filter(i => i.category === cat);
                    if (catItems.length === 0) return null;
                    return (
                        <div key={cat} className="mb-6">
                            {/* Wooden Shelf Header */}
                            <h4 className="text-xs font-serif font-bold text-wood-400 uppercase mb-2 sticky top-0 bg-wood-900/95 py-2 z-10 border-b border-wood-700 w-full flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-gold-600/50"></span> {cat}
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                                {catItems.map(item => (
                                    <div
                                        key={item.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, item)}
                                        onDragEnd={() => { $draggedItem.set(null); }}
                                        // Item Card Style
                                        className="group flex flex-col gap-2 p-3 rounded bg-parchment-100 hover:bg-white border-2 border-parchment-500 hover:border-gold-500 transition-all cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md relative overflow-hidden"
                                    >
                                        {/* Texture noise */}
                                        <div className="absolute inset-0 bg-paper-texture opacity-30 pointer-events-none" />

                                        <div className="flex justify-between items-start w-full relative z-10">
                                            <div className="p-1 bg-wood-200/50 rounded">
                                                {React.createElement(
                                                    (LucideIcons as any)[item.icon] || LucideIcons.Package,
                                                    { size: 20, className: "text-wood-900" }
                                                )}
                                            </div>
                                        </div>
                                        <div className="relative z-10">
                                            <div className="font-serif font-bold text-sm text-wood-900 leading-tight group-hover:text-wood-600 transition-colors uppercase">{item.name}</div>
                                            <div className="text-[10px] text-wood-600 mt-1 font-mono">{item.width}x{item.height}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {/* Shelf shadow */}
                            <div className="h-1 bg-black/20 mt-4 rounded-full blur-sm" />
                        </div>
                    )
                })}
            </div>
            
            <PlayerInfo />
        </section>
    );
};

export default SupplyShelf;
