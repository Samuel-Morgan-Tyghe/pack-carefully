
import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import * as LucideIcons from 'lucide-react';
import { $draftState, $players, skipDraftTurn, $draggedItem } from '../../store/gameStore';
import clsx from 'clsx';
import { playSound } from '../../lib/sounds';

const DraftBoard: React.FC = () => {
    const draft = useStore($draftState);
    const players = useStore($players);
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

    // For hot-seat multiplayer, everyone can drag since they're taking turns at the same device
    // The UI shows whose turn it is, and players pass the device accordingly
    const isMyTurn = true; // Always allow dragging in hot-seat mode

    const currentTurnPlayer = players.find(p => p.id === draft.currentTurnPlayerId);

    const handleItemClick = (itemId: string) => {
        // Toggle selection
        if (selectedItemId === itemId) {
            setSelectedItemId(null);
            $draggedItem.set(null);
        } else {
            setSelectedItemId(itemId);
            $draggedItem.set(itemId);
            playSound.pop();
        }
    };

    return (
        <div className="w-full bg-slate-900/90 border-b-4 border-wood-800 p-4 flex flex-col items-center justify-center shadow-2xl z-40 animate-slide-down">
            <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-widest mb-2 flex flex-col md:flex-row items-center gap-2 md:gap-4">
                <span>Pick {draft.pickIndex + 1} / {draft.roundOrder.length}</span>
                {currentTurnPlayer && (
                     <span className="text-lg text-blue-400 normal-case font-normal animate-pulse">
                        ({currentTurnPlayer.name}'s Turn)
                    </span>
                )}
            </h2>
            <div className="text-slate-400 mb-6 text-sm flex gap-1 items-center bg-slate-800/50 p-2 rounded-full px-4 overflow-x-auto max-w-full">
                <span className="mr-2 uppercase text-xs font-bold tracking-widest text-slate-500">Draft Order:</span>
                {draft.roundOrder.map((pid, idx) => {
                    const p = players.find(pl => pl.id === pid);
                    const isCurrent = idx === draft.pickIndex;
                    const isPast = idx < draft.pickIndex;
                    return (
                        <div key={idx} className={clsx(
                            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all shrink-0",
                            isCurrent ? `border-white scale-125 z-10 shadow-lg ${p?.avatarColor}` : 
                            isPast ? "border-slate-700 bg-slate-800 text-slate-600" : `border-transparent opacity-50 ${p?.avatarColor}`
                        )}>
                            {p?.name[0]}
                        </div>
                    );
                })}
            </div>
            


            <div className="flex flex-wrap gap-3 md:gap-4 justify-center max-w-4xl px-2">
                {draft.availableItems.map((item) => {
                    const Icon = (LucideIcons[item.icon as keyof typeof LucideIcons] || LucideIcons.Box) as React.ElementType;
                    
                    const isSelected = selectedItemId === item.id;

                    return (
                        <div
                            key={item.id}
                            draggable={Boolean(isMyTurn)}
                            onClick={() => handleItemClick(item.id)}
                            onDragStart={(e) => {
                                if (!isMyTurn) {
                                    e.preventDefault();
                                    return;
                                }
                                playSound.pop();
                                e.dataTransfer.setData('itemId', item.id);
                                e.dataTransfer.effectAllowed = 'copy';
                                $draggedItem.set(item.id);
                            }}
                            onDragEnd={() => {
                                $draggedItem.set(null);
                            }}
                            className={clsx(
                                "relative group w-20 h-20 md:w-24 md:h-24 bg-slate-800 border-2 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer touch-manipulation min-w-[5rem]",
                                isMyTurn ? "border-blue-500 hover:scale-110 hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] active:scale-95" : "border-slate-600 opacity-50 cursor-not-allowed",
                                isSelected && "scale-110 shadow-[0_0_30px_rgba(59,130,246,0.8)] border-blue-300 ring-4 ring-blue-400"
                            )}
                        >
                            <Icon size={28} className="text-white mb-1 md:mb-2 md:w-8 md:h-8" />
                            <span className="text-[10px] md:text-xs font-bold text-slate-200 text-center px-1 leading-tight">{item.name}</span>
                            
                            {/* Stats Tooltip */}
                            <div className="absolute bottom-full mb-2 bg-slate-900 text-xs p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity w-40 z-50 pointer-events-none border border-slate-700 shadow-xl">
                                {item.description}
                                {item.combatStats && (
                                    <div className="mt-1 text-blue-300">
                                        {Object.entries(item.combatStats).map(([k, v]) => (
                                            <div key={k}>{k}: {v}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Helper message */}
            {selectedItemId && (
                <div className="mt-6 px-6 py-3 bg-blue-500/20 border-2 border-blue-500 rounded-lg text-blue-200 font-bold text-sm animate-in fade-in max-w-md text-center">
                    📍 Item selected! Drag or tap your backpack below to place it
                </div>
            )}

            {isMyTurn && (
                <button
                    onClick={() => {
                        skipDraftTurn();
                        setSelectedItemId(null);
                        $draggedItem.set(null);
                    }}
                    className="mt-8 bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold py-2 px-6 rounded-lg border border-slate-500 transition-colors"
                >
                    SKIP TURN
                </button>
            )}

        </div>
    );
};

export default DraftBoard;
