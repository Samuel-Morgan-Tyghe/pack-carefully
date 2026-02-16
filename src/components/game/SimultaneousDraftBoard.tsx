import React from 'react';
import { useStore } from '@nanostores/react';
import { $draftState, $players, confirmDraftSelection, $itemsOnGrid, $viewingPlayerId } from '../../store/gameStore';
import * as Icons from 'lucide-react';
import clsx from 'clsx';
import type { Player } from '../../types';
import Inventory from '../Inventory'; // Generalized Inventory

const SimultaneousDraftBoard: React.FC = () => {
    const players = useStore($players);
    const viewingPlayerId = useStore($viewingPlayerId);

    const viewingPlayer = players.find(p => p.id === viewingPlayerId) || players[0];

    if (!viewingPlayer) return null;

    return (
        <div className="fixed inset-0 bg-wood-900 z-50 flex flex-col p-2 md:p-4 overflow-hidden">
            <h2 className="text-lg md:text-xl font-display text-parchment-100 text-center mb-2 md:mb-4 tracking-widest shadow-black drop-shadow-lg shrink-0">
                DRAFT PHASE: DRAG TO BAG
            </h2>

            <div className="flex-1 w-full max-w-5xl mx-auto min-h-0 bg-black/40 rounded-xl border border-white/5 overflow-hidden">
                <PlayerDraftQuadrant key={viewingPlayer.id} player={viewingPlayer} />
            </div>
        </div>
    );
};

const PlayerDraftQuadrant: React.FC<{ player: Player }> = ({ player }) => {
    const draft = useStore($draftState);
    const pool = draft.availableItems[player.id] || [];
    const isConfirmed = draft.confirmed.includes(player.id);
    const itemsOnGrid = useStore($itemsOnGrid);

    // Check if player has placed a draft item
    // Logic: Draft items are those in 'pool'. 
    // We check if any item on grid for this player matches an ID from the pool.
    const poolIds = new Set(pool.map(i => i.id));
    const hasPlacedDraftItem = itemsOnGrid.some(i => i.ownerId === player.id && poolIds.has(i.itemId));

    return (
        <div className={clsx(
            "relative border-2 rounded-lg flex flex-col overflow-hidden",
            isConfirmed ? "border-green-500/50 bg-green-900/10" : "border-white/10 bg-black/20"
        )}>
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-1 bg-black/40 shrink-0">
                <div className={`w-2 h-2 rounded-full ${player.avatarColor}`} />
                <span className="font-bold text-parchment-100 text-sm">{player.name}</span>
                {isConfirmed ? (
                    <span className="text-green-400 text-[10px] ml-auto font-bold uppercase">Ready</span>
                ) : (
                    <span className="text-parchment-200/50 text-[10px] ml-auto italic">
                        {hasPlacedDraftItem ? "Click Lock In" : "Drag item to bag"}
                    </span>
                )}
            </div>

            {/* Content Area: Split into Bag (Left/Bottom) and Pool (Right/Top) */}
            <div className="flex-1 flex flex-row gap-2 p-2 min-h-0">

                {/* Inventory Area */}
                <div className="flex-1 overflow-auto bg-black/20 rounded relative min-w-0 flex flex-col items-center justify-center scale-90 origin-top-left">
                    <Inventory playerId={player.id} className="pointer-events-auto" />
                    {isConfirmed && <div className="absolute inset-0 bg-black/10 z-10" />}
                </div>

                {/* Draft Pool (Draggable Sources) */}
                <div className="w-[100px] flex flex-col gap-2 overflow-y-auto shrink-0">
                    {pool.map(item => {
                        const LucideIcon = (Icons as unknown as Record<string, React.ElementType>)[item.icon] || Icons.HelpCircle;
                        // Check if this item is already placed
                        const isPlaced = itemsOnGrid.some(i => i.ownerId === player.id && i.itemId === item.id);

                        return (
                            <div
                                key={item.id}
                                draggable={!isConfirmed && !isPlaced}
                                onDragStart={(e) => {
                                    e.dataTransfer.setData('itemId', item.id);
                                    // Visual drag effect
                                    e.dataTransfer.dropEffect = 'copy';
                                }}
                                className={clsx(
                                    "p-2 rounded border flex flex-col items-center gap-1 transition-all",
                                    isPlaced
                                        ? "opacity-30 grayscale border-white/5"
                                        : "bg-white/5 border-white/20 hover:bg-white/10 hover:border-gold-500/50 cursor-grab active:cursor-grabbing"
                                )}
                            >
                                <LucideIcon className="w-6 h-6 text-parchment-200" />
                                <span className="text-[10px] text-center leading-none text-parchment-100">{item.name}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Actions */}
            {!isConfirmed && (
                <div className="p-2 border-t border-white/5 bg-black/40 flex justify-center">
                    <button
                        onClick={() => confirmDraftSelection(player.id)}
                        disabled={!hasPlacedDraftItem}
                        className={clsx(
                            "px-6 py-1 rounded text-sm font-bold uppercase tracking-wider transition-all",
                            hasPlacedDraftItem
                                ? "bg-gold-500 text-black hover:bg-gold-400 shadow-lg"
                                : "bg-white/5 text-white/20 cursor-not-allowed"
                        )}
                    >
                        Lock In
                    </button>
                </div>
            )}
        </div>
    );
}

export default SimultaneousDraftBoard;
