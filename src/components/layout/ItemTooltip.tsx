import React from 'react';
import * as LucideIcons from 'lucide-react';
import { ITEMS } from '../../lib/items';
import { X } from 'lucide-react';

interface ItemTooltipProps {
    itemId: string;
    anchorRect?: DOMRect | null;
    onClose: () => void;
}

const ItemTooltip: React.FC<ItemTooltipProps> = ({ itemId, anchorRect, onClose }) => {
    const def = ITEMS[itemId];
    if (!def) return null;

    // Position: try right of anchor, fallback left
    let style: React.CSSProperties = {};
    if (anchorRect) {
        const viewW = window.innerWidth;
        const tooltipW = 220;
        const gap = 8;

        if (anchorRect.right + tooltipW + gap < viewW) {
            // Right side
            style = {
                position: 'fixed',
                left: anchorRect.right + gap,
                top: Math.max(8, Math.min(anchorRect.top, window.innerHeight - 300)),
                zIndex: 9999,
            };
        } else {
            // Left side
            style = {
                position: 'fixed',
                left: Math.max(8, anchorRect.left - tooltipW - gap),
                top: Math.max(8, Math.min(anchorRect.top, window.innerHeight - 300)),
                zIndex: 9999,
            };
        }
    }

    const rarityColor: Record<string, string> = {
        COMMON: 'text-slate-400',
        UNCOMMON: 'text-green-400',
        RARE: 'text-blue-400',
        LEGENDARY: 'text-amber-400',
    };

    return (
        <div
            style={style}
            className="w-[220px] bg-slate-900/95 border border-slate-600 rounded-lg p-3 text-xs shadow-2xl backdrop-blur-sm pointer-events-auto animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
        >
            <button onClick={onClose} className="absolute top-1.5 right-1.5 text-slate-500 hover:text-white p-0.5">
                <X size={12} />
            </button>

            {/* Header */}
            <div className="flex items-start gap-2 mb-1.5">
                <div className="p-1 bg-wood-700/50 rounded shrink-0">
                    {React.createElement(
                        (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[def.icon] || LucideIcons.Package,
                        { size: 14, className: 'text-parchment-200' }
                    )}
                </div>
                <div className="min-w-0">
                    <div className="font-bold text-white text-[11px] leading-tight">{def.name}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[9px] font-bold uppercase ${rarityColor[def.rarity || 'COMMON']}`}>{def.rarity}</span>
                        <span className="text-[9px] text-slate-500">{def.width}×{def.height}</span>
                        <span className="text-[9px] text-slate-600 uppercase">{def.category}</span>
                    </div>
                </div>
            </div>

            <p className="text-slate-400 text-[10px] italic mb-2">{def.description}</p>

            {/* Combat Stats */}
            {def.combatStats && (
                <div className="flex flex-wrap gap-1 mb-2">
                    {def.combatStats.damage !== undefined && (
                        <span className="text-red-400 text-[9px] font-bold bg-red-950/50 px-1.5 py-0.5 rounded border border-red-900/50 flex items-center gap-0.5">
                            <LucideIcons.Swords size={9} /> {def.combatStats.damage}
                        </span>
                    )}
                    {def.combatStats.defense !== undefined && (
                        <span className="text-blue-400 text-[9px] font-bold bg-blue-950/50 px-1.5 py-0.5 rounded border border-blue-900/50 flex items-center gap-0.5">
                            <LucideIcons.Shield size={9} /> {def.combatStats.defense}
                        </span>
                    )}
                    {def.combatStats.speed !== undefined && (
                        <span className="text-yellow-400 text-[9px] font-bold bg-yellow-950/50 px-1.5 py-0.5 rounded border border-yellow-900/50 flex items-center gap-0.5">
                            <LucideIcons.Zap size={9} /> {def.combatStats.speed}
                        </span>
                    )}
                    {def.combatStats.accuracy !== undefined && (
                        <span className="text-green-400 text-[9px] font-bold bg-green-950/50 px-1.5 py-0.5 rounded border border-green-900/50 flex items-center gap-0.5">
                            <LucideIcons.Target size={9} /> {def.combatStats.accuracy}%
                        </span>
                    )}
                    {def.combatStats.heal !== undefined && (
                        <span className="text-emerald-400 text-[9px] font-bold bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-900/50 flex items-center gap-0.5">
                            <LucideIcons.Heart size={9} /> {def.combatStats.heal}
                        </span>
                    )}
                    {def.combatStats.energyCost !== undefined && (
                        <span className="text-amber-400 text-[9px] font-bold bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-900/50 flex items-center gap-0.5">
                            ⚡ {def.combatStats.energyCost}
                        </span>
                    )}
                    {def.combatStats.energyRegen !== undefined && (
                        <span className="text-amber-300 text-[9px] font-bold bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-900/50 flex items-center gap-0.5">
                            ⚡+{def.combatStats.energyRegen}/s
                        </span>
                    )}
                    {def.combatStats.maxEnergy !== undefined && (
                        <span className="text-amber-200 text-[9px] font-bold bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-900/50 flex items-center gap-0.5">
                            ⚡{def.combatStats.maxEnergy} max
                        </span>
                    )}
                </div>
            )}

            {/* Synergies */}
            {def.adjacency && def.adjacency.length > 0 && (
                <div className="border-t border-slate-700 pt-1.5 mt-1">
                    <span className="text-[8px] text-slate-500 uppercase tracking-widest font-black block mb-1">Synergies</span>
                    {def.adjacency.map((adj, i) => (
                        <div key={i} className="text-[10px] text-amber-300 mb-0.5 flex items-start gap-1">
                            <LucideIcons.Sparkles size={9} className="mt-0.5 shrink-0" />
                            <span>{adj.effect}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default React.memo(ItemTooltip);
