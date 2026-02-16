import React from 'react';
import { useStore } from '@nanostores/react';
import { $players, $localPlayerId, setLocalPlayer, $phase } from '../store/gameStore';
import { Shield } from 'lucide-react';
import type { Player } from '../types';

const IdentityManager: React.FC = () => {
    const players = useStore($players);
    const localPlayerId = useStore($localPlayerId);
    const phase = useStore($phase);

    // Only show claiming UI in LOBBY or if no identity set
    if (phase !== 'LOBBY' && localPlayerId) return null;

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-4 w-full max-w-xl px-4">
            {!localPlayerId ? (
                <div className="bg-wood-800/95 border-2 border-gold-500/50 p-6 rounded-2xl shadow-2xl backdrop-blur-md w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-col gap-4">
                        <p className="text-parchment-200 text-center">You need to join the expedition to play.</p>
                        <button
                            onClick={() => {
                                window.location.reload();
                            }}
                            className="bg-gold-600 text-wood-900 font-bold py-3 px-6 rounded-xl uppercase tracking-widest"
                        >
                            Return to Join
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-3 px-4 py-2 bg-black/60 border border-white/10 rounded-full backdrop-blur-sm shadow-xl">
                    <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-green-500" />
                        <span className="text-xs text-parchment-200/70 uppercase tracking-tighter">Playing as</span>
                        <span className="text-sm font-bold text-parchment-100 italic">
                            {players.find((p: Player) => p.id === localPlayerId)?.name || 'Observer'}
                        </span>
                    </div>
                    <button
                        onClick={() => setLocalPlayer(null)}
                        className="ml-2 text-[10px] text-red-400/50 hover:text-red-400 uppercase font-bold transition-colors"
                    >
                        Unlink
                    </button>
                </div>
            )}
        </div>
    );
};

export default IdentityManager;
