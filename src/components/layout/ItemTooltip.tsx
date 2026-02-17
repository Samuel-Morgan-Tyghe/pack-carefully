import React from 'react';
import * as LucideIcons from 'lucide-react';
import { ITEMS } from '../../lib/items';
import { $itemsOnGrid } from '../../store/gameStore';
import { useStore } from '@nanostores/react';
import { getAdjacencyBonuses } from '../../lib/adjacency';

interface ItemTooltipProps {
    itemId: string;
    instanceId?: string;
}

const ItemTooltip: React.FC<ItemTooltipProps> = ({ itemId, instanceId }) => {
    const def = ITEMS[itemId];
    if (!def) return null;

    // Optional: Fetch instance data from store if instanceId is provided
    // This allows tooltips to show liveStats and adjacency in combat
    const itemsOnGrid = useStore($itemsOnGrid);
    const itemInstance = instanceId ? itemsOnGrid.find(i => i.instanceId === instanceId) : undefined;

    // Calculate adjacency results if we have an instance
    // Note: This might be slightly expensive but tooltips are only shown one at a time
    const adjacencyResult = React.useMemo(() => {
        if (!itemInstance) return null;
        return getAdjacencyBonuses(itemsOnGrid)[instanceId!];
    }, [itemsOnGrid, instanceId, itemInstance]);

    const rarityColor: Record<string, string> = {
        COMMON: 'text-slate-400',
        UNCOMMON: 'text-green-400',
        RARE: 'text-blue-400',
        LEGENDARY: 'text-amber-400',
    };

    const liveStats = itemInstance?.liveStats;

    return (
        <div className="w-[220px] text-xs pointer-events-none">
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

            <p className="text-slate-400 text-[10px] italic mb-2 leading-tight">{def.description}</p>

            {/* Combat Stats / Live Stats */}
            {(def.combatStats || liveStats) && (
                <div className="flex flex-wrap gap-1 mb-2">
                    {/* Damage */}
                    {(liveStats?.damage !== undefined || def.combatStats?.damage !== undefined) && (
                        <span className="text-red-400 text-[9px] font-bold bg-red-950/50 px-1.5 py-0.5 rounded border border-red-900/50 flex items-center gap-0.5">
                            <LucideIcons.Swords size={9} /> {liveStats?.damage ?? def.combatStats?.damage}
                        </span>
                    )}

                    {/* Defense/Block */}
                    {(liveStats?.block !== undefined || def.combatStats?.block !== undefined || def.combatStats?.defense !== undefined) && (
                        <span className="text-blue-400 text-[9px] font-bold bg-blue-950/50 px-1.5 py-0.5 rounded border border-blue-900/50 flex items-center gap-0.5">
                            <LucideIcons.Shield size={9} /> {liveStats?.block ?? (def.combatStats?.block ?? def.combatStats?.defense)}
                        </span>
                    )}

                    {/* Speed */}
                    {(liveStats?.speed !== undefined || def.combatStats?.speed !== undefined) && (
                        <span className="text-yellow-400 text-[9px] font-bold bg-yellow-950/50 px-1.5 py-0.5 rounded border border-yellow-900/50 flex items-center gap-0.5">
                            <LucideIcons.Zap size={9} /> {liveStats?.speed ?? def.combatStats?.speed}
                        </span>
                    )}

                    {/* Accuracy */}
                    {(liveStats?.accuracy !== undefined || def.combatStats?.accuracy !== undefined) && (
                        <span className="text-green-400 text-[9px] font-bold bg-green-950/50 px-1.5 py-0.5 rounded border border-green-900/50 flex items-center gap-0.5">
                            <LucideIcons.Target size={9} /> {liveStats?.accuracy ?? def.combatStats?.accuracy}%
                        </span>
                    )}

                    {/* Heal */}
                    {(liveStats?.heal !== undefined || def.combatStats?.heal !== undefined) && (
                        <span className="text-emerald-400 text-[9px] font-bold bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-900/50 flex items-center gap-0.5">
                            <LucideIcons.Heart size={9} /> {liveStats?.heal ?? def.combatStats?.heal}
                        </span>
                    )}

                    {/* Energy Cost */}
                    {(liveStats?.energyCost !== undefined || def.combatStats?.energyCost !== undefined) && (
                        <span className="text-amber-400 text-[9px] font-bold bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-900/50 flex items-center gap-0.5">
                            ⚡ {liveStats?.energyCost ?? def.combatStats?.energyCost}
                        </span>
                    )}

                    {/* Passive Energy Regen */}
                    {def.combatStats?.energyRegen !== undefined && (
                        <span className="text-amber-300 text-[9px] font-bold bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-900/50 flex items-center gap-0.5">
                            ⚡+{def.combatStats.energyRegen}/s
                        </span>
                    )}
                </div>
            )}

            {/* Adjacency Bonuses / Synergies */}
            {(def.adjacency && def.adjacency.length > 0) || (adjacencyResult && adjacencyResult.activeRules.length > 0) ? (
                <div className="border-t border-slate-700/50 pt-1.5 mt-1">
                    <span className="text-[8px] text-slate-500 uppercase tracking-widest font-black block mb-1">Synergies</span>

                    {/* Show base synergies in build mode, or active ones if provided */}
                    {adjacencyResult ? (
                        adjacencyResult.activeRules.map((rule: string, i: number) => (
                            <div key={i} className="text-[10px] text-gold-400 mb-0.5 flex items-start gap-1">
                                <LucideIcons.Star size={9} className="mt-0.5 shrink-0 fill-gold-400/20" />
                                <span>{rule}</span>
                            </div>
                        ))
                    ) : (
                        def.adjacency?.map((adj: any, i: number) => (
                            <div key={i} className="text-[10px] text-amber-300/70 mb-0.5 flex items-start gap-1">
                                <LucideIcons.Sparkles size={9} className="mt-0.5 shrink-0" />
                                <span>{adj.effect}</span>
                            </div>
                        ))
                    )}
                </div>
            ) : null}
        </div>
    );
};

export default React.memo(ItemTooltip);
