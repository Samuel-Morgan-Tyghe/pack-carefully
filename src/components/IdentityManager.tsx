import React from 'react';
import { useStore } from '@nanostores/react';
import { $players, $localPlayerId, setLocalPlayer, $phase } from '../store/gameStore';
import { User, Shield, View } from 'lucide-react';
import clsx from 'clsx';

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
                    <h3 className="text-xl font-display text-gold-500 mb-4 text-center tracking-widest flex items-center justify-center gap-2">
                        <User className="w-5 h-5" /> CLAIM YOUR CHARACTER
                    </h3>
                    <p className="text-parchment-200/70 text-sm mb-6 text-center">
                        This device will be locked to your character for this session.
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                        {players.map(player => {
                            // For BroadcastChannel, we'd need another atom to track claimed status effectively
                            return (
                                <button
                                    key={player.id}
                                    onClick={() => setLocalPlayer(player.id)}
                                    className={clsx(
                                        "p-3 rounded-lg border-2 transition-all flex items-center gap-3 bg-black/40",
                                        "hover:border-gold-500/50 hover:bg-black/60 active:scale-95",
                                        "border-white/10 text-parchment-200"
                                    )}
                                >
                                    <div className={clsx("w-3 h-3 rounded-full", player.avatarColor)} />
                                    <span className="font-bold">{player.name}</span>
                                </button>
                            );
                        })}
                        <button
                            onClick={() => setLocalPlayer('OBSERVER')}
                            className="col-span-2 p-3 rounded-lg border-2 border-dashed border-white/20 text-parchment-300 hover:border-parchment-400 hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                            <View className="w-4 h-4" /> WATCH AS OBSERVER
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-3 px-4 py-2 bg-black/60 border border-white/10 rounded-full backdrop-blur-sm shadow-xl">
                    <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-green-500" />
                        <span className="text-xs text-parchment-200/70 uppercase tracking-tighter">Playing as</span>
                        <span className="text-sm font-bold text-parchment-100 italic">
                            {players.find(p => p.id === localPlayerId)?.name || 'Observer'}
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
