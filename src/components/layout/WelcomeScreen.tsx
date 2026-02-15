import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { $players, startGame, addPlayer, removePlayer } from '../../store/gameStore';
import { clsx } from 'clsx';
import * as LucideIcons from 'lucide-react';

const WelcomeScreen: React.FC = () => {
    const players = useStore($players);
    const [isAddingPlayer, setIsAddingPlayer] = useState(false);
    const [newPlayerName, setNewPlayerName] = useState('');



    return (
        <div className="w-full h-full flex flex-col justify-center items-center relative z-20">
            {/* Title Section */}
            <div className="text-center animate-in fade-in duration-700">
                <div className="mb-8 inline-block p-6 bg-wood-900/80 rounded-full border-4 border-gold-600 shadow-2xl backdrop-blur-sm">
                     <LucideIcons.Map size={64} className="text-gold-500" />
                </div>
                
                <h1 className="text-5xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-parchment-100 to-parchment-500 mb-6 drop-shadow-lg font-display uppercase tracking-widest leading-none text-balance px-4">
                    Pack<br/>Carefully
                </h1>
                
                <p className="text-lg md:text-2xl text-gold-500 max-w-lg mx-auto font-serif italic mb-4 border-t border-b border-wood-600 py-4 bg-wood-900/30 px-4">
                    "The journey is long, the pack is heavy.<br/>Choose your companions wisely."
                </p>

                {/* Game Mode Badge */}
                <div className="mb-8 inline-flex items-center gap-2 bg-blue-500/20 border-2 border-blue-500 rounded-full px-4 md:px-6 py-2">
                    <LucideIcons.Users size={20} className="text-blue-400" />
                    <span className="text-blue-300 font-bold uppercase text-xs md:text-sm tracking-wider">
                        Local Multiplayer • Hot-Seat
                    </span>
                </div>

                {/* Player Count Info */}
                <div className="mb-6 text-slate-400 text-sm">
                    {players.length} {players.length === 1 ? 'Player' : 'Players'} • 2-6 recommended
                </div>

                {/* Player List */}
                <div className="flex gap-6 justify-center mb-8 flex-wrap">
                    {players.map(p => (
                        <div key={p.id} className="flex flex-col items-center gap-3 group relative">
                            <div className={clsx(
                                "w-20 h-20 rounded-full border-4 border-wood-600 flex items-center justify-center text-2xl font-bold font-display shadow-xl transition-transform group-hover:scale-110 group-hover:border-gold-500 bg-wood-800 text-parchment-100",
                                p.avatarColor
                            )}>
                                {p.name[0]}
                                {/* Remove Button */}
                                {players.length > 2 && (
                                    <button
                                        onClick={() => removePlayer(p.id)}
                                        className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                        title="Remove player"
                                    >
                                        <LucideIcons.X size={14} className="text-white" />
                                    </button>
                                )}
                            </div>
                            <span className="text-sm font-bold uppercase tracking-wider text-wood-400 group-hover:text-gold-400 bg-wood-900/80 px-3 py-1 rounded-full border border-wood-700">{p.name}</span>
                        </div>
                    ))}

                    {/* Add Player Button */}
                    {players.length < 6 && !isAddingPlayer && (
                        <div className="flex flex-col items-center gap-3">
                            <button
                                onClick={() => setIsAddingPlayer(true)}
                                className="w-20 h-20 rounded-full border-4 border-dashed border-wood-600 hover:border-gold-500 flex items-center justify-center bg-wood-800/50 hover:bg-wood-700 transition-all shadow-xl hover:scale-110"
                            >
                                <LucideIcons.Plus size={32} className="text-wood-400 hover:text-gold-400" />
                            </button>
                            <span className="text-sm font-bold uppercase tracking-wider text-wood-400">Add Player</span>
                        </div>
                    )}

                    {/* Add Player Input */}
                    {isAddingPlayer && (
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-20 h-20 rounded-full border-4 border-gold-500 flex items-center justify-center bg-wood-800 shadow-xl">
                                <LucideIcons.User size={32} className="text-gold-400" />
                            </div>
                            <input
                                type="text"
                                value={newPlayerName}
                                onChange={(e) => setNewPlayerName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && newPlayerName.trim()) {
                                        addPlayer(newPlayerName.trim());
                                        setNewPlayerName('');
                                        setIsAddingPlayer(false);
                                    } else if (e.key === 'Escape') {
                                        setNewPlayerName('');
                                        setIsAddingPlayer(false);
                                    }
                                }}
                                placeholder="Name..."
                                autoFocus
                                className="text-sm font-bold uppercase tracking-wider text-parchment-100 bg-wood-800 px-3 py-1 rounded-full border-2 border-gold-500 outline-none focus:ring-2 focus:ring-gold-400 w-32 text-center"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        if (newPlayerName.trim()) {
                                            addPlayer(newPlayerName.trim());
                                            setNewPlayerName('');
                                            setIsAddingPlayer(false);
                                        }
                                    }}
                                    className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded"
                                >
                                    ✓
                                </button>
                                <button
                                    onClick={() => {
                                        setNewPlayerName('');
                                        setIsAddingPlayer(false);
                                    }}
                                    className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* How to Play Note */}
                <div className="mb-8 max-w-md mx-auto text-center">
                    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <LucideIcons.Info size={16} className="text-blue-400" />
                            <span className="text-blue-400 font-bold text-sm uppercase">How It Works</span>
                        </div>
                        <p className="text-slate-300 text-sm">
                            Players take turns on the same device. Pass the mouse/keyboard during draft phase.
                            One player is secretly a traitor!
                        </p>
                    </div>
                </div>

                {/* Primary Action */}
                <button
                    onClick={startGame}
                    disabled={players.length < 2}
                    className="group relative px-8 md:px-12 py-4 md:py-5 bg-gradient-to-r from-gold-600 to-gold-500 border-y-2 border-gold-300 text-wood-900 rounded-lg font-display font-black text-xl md:text-2xl tracking-[0.2em] shadow-[0_0_40px_rgba(234,179,8,0.3)] hover:shadow-[0_0_60px_rgba(234,179,8,0.5)] hover:scale-105 active:scale-95 transition-all duration-300 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 touch-manipulation"
                >
                    <span className="relative z-10 flex items-center gap-4">
                        Start Expedition <LucideIcons.ArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </span>
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                </button>

                {players.length < 2 && (
                    <div className="mt-4 text-red-400 text-sm font-bold">
                        Need at least 2 players to start
                    </div>
                )}
            </div>
        </div>
    );
};

export default WelcomeScreen;
