import React from 'react';
import { useStore } from '@nanostores/react';
import { $draftState, $players, selectDraftItem, confirmDraftSelection } from '../../store/gameStore';
import * as Icons from 'lucide-react';
import clsx from 'clsx';
import type { Item, Player } from '../../types';

const SecretDraftPad: React.FC = () => {
    const draft = useStore($draftState);
    const players = useStore($players);
    // Since we are doing local multiplayer on one screen, we need a way to show "Current Player's Turn to Pick" 
    // OR show all 4 pads at once? 
    // User said: "first turn theres 0 shared items, users dont take it in turns they choose at the same time"

    // If it's one screen, "Same Time" implies we split the screen?
    // OR we show 4 hidden hands?

    // Let's assume split screen or 4 quadrants for now to true "Simultaneous" on one device.

    return (
        <div className="fixed inset-0 bg-wood-900/95 z-50 flex flex-col items-center justify-center p-4">
            <h2 className="text-3xl font-display text-parchment-100 mb-8 tracking-widest text-center shadow-black drop-shadow-lg">
                DRAFT PHASE: ROUND {draft.roundNumber} / 3
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-6xl">
                {players.map(player => (
                    <PlayerDraftCard key={player.id} player={player} />
                ))}
            </div>

            <div className="mt-8 text-parchment-200/50 text-sm italic">
                Pick 1 item to add to your bag. Items are revealed when everyone locks in.
            </div>
        </div>
    );
};

const PlayerDraftCard: React.FC<{ player: Player }> = ({ player }) => {
    const draft = useStore($draftState);
    const pool = draft.availableItems[player.id] || [];
    const selection = draft.selections[player.id];
    const isConfirmed = draft.confirmed.includes(player.id);

    // If confirmed, show "Ready" cover
    // If not, show options

    return (
        <div className={clsx(
            "relative p-4 rounded-xl border-2 transition-all duration-300 flex flex-col",
            isConfirmed ? "bg-green-900/20 border-green-500/50" : "bg-black/40 border-white/10"
        )}>
            <div className="flex items-center gap-2 mb-4">
                <div className={`w - 3 h - 3 rounded - full ${player.avatarColor} `} />
                <span className="font-bold text-parchment-100">{player.name}</span>
                {isConfirmed && <span className="text-green-400 text-xs ml-auto">LOCKED IN</span>}
            </div>

            {isConfirmed ? (
                <div className="flex-1 flex items-center justify-center min-h-[160px]">
                    <Icons.CheckCircle className="w-16 h-16 text-green-500/50" />
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-2">
                    {pool.map((item: Item) => {
                        const LucideIcon = (Icons as unknown as Record<string, React.ElementType>)[item.icon] || Icons.HelpCircle;
                        const isSelected = selection === item.id;

                        return (
                            <button
                                key={item.id}
                                onClick={() => selectDraftItem(player.id, item.id)}
                                className={clsx(
                                    "flex flex-col items-center p-3 rounded-lg border transition-all relative group",
                                    isSelected
                                        ? "bg-gold-500/20 border-gold-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]"
                                        : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30"
                                )}
                            >
                                <LucideIcon className={clsx("w-8 h-8 mb-2", isSelected ? "text-gold-400" : "text-parchment-200")} />
                                <span className="text-xs font-bold text-center leading-tight">{item.name}</span>

                                {/* Hover Tooltip */}
                                <div className="absolute opacity-0 group-hover:opacity-100 bottom-full mb-2 bg-black border border-white/20 p-2 rounded text-xs w-[120px] pointer-events-none z-10 transition-opacity">
                                    <div className="font-bold">{item.name}</div>
                                    <div className="text-parchment-200/70">{item.description}</div>
                                    <div className="text-[10px] mt-1 text-gold-500 capitalize">{item.category}</div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {!isConfirmed && (
                <button
                    disabled={!selection}
                    onClick={() => confirmDraftSelection(player.id)}
                    className={clsx(
                        "mt-4 py-2 rounded font-bold transition-all uppercase tracking-wider text-sm",
                        selection
                            ? "bg-gold-500 text-black hover:bg-gold-400 hover:scale-[1.02] shadow-lg"
                            : "bg-white/5 text-white/20 cursor-not-allowed"
                    )}
                >
                    Lock In
                </button>
            )}
        </div>
    );
}

export default SecretDraftPad;
