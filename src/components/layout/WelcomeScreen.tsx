import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { $players, startGame, addPlayer, setLocalPlayer } from '../../store/gameStore';

const WelcomeScreen: React.FC = () => {
    const players = useStore($players);
    const [newPlayerName, setNewPlayerName] = useState('');



    return (
        <div className="w-full h-full flex flex-col justify-center items-center relative z-20">
            {/* Title Section */}
            <div className="text-center animate-in fade-in duration-700 w-full px-4">
                <h1 className="text-5xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-parchment-100 to-parchment-500 mb-6 drop-shadow-lg font-display uppercase tracking-widest leading-none text-balance">
                    Pack<br />Carefully
                </h1>

                <p className="text-lg md:text-2xl text-gold-500 max-w-lg mx-auto font-serif italic mb-12 border-t border-b border-wood-600 py-4 bg-wood-900/30">
                    "The journey is long, the pack is heavy.<br />Choose your companions wisely."
                </p>

                {/* Join Flow */}
                <div className="max-w-md mx-auto bg-wood-800/50 p-8 rounded-2xl border-2 border-wood-700 backdrop-blur-sm shadow-2xl">
                    <h2 className="text-xl font-display text-parchment-100 mb-6 tracking-widest uppercase">Enter Your Name to Join</h2>

                    <div className="flex flex-col gap-4">
                        <input
                            type="text"
                            value={newPlayerName}
                            onChange={(e) => setNewPlayerName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && newPlayerName.trim()) {
                                    const id: string = addPlayer(newPlayerName.trim());
                                    setLocalPlayer(id);
                                }
                            }}
                            placeholder="Your Name..."
                            className="w-full bg-wood-900 border-2 border-wood-600 focus:border-gold-500 rounded-xl px-6 py-4 text-xl font-bold text-parchment-100 outline-none transition-all placeholder:text-wood-600"
                        />

                        <button
                            onClick={() => {
                                if (newPlayerName.trim()) {
                                    const id: string = addPlayer(newPlayerName.trim());
                                    setLocalPlayer(id);
                                }
                            }}
                            disabled={!newPlayerName.trim()}
                            className="w-full py-4 bg-gold-600 hover:bg-gold-500 disabled:opacity-50 disabled:cursor-not-allowed text-wood-900 font-display font-black text-xl uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95"
                        >
                            Join Expedition
                        </button>
                    </div>
                </div>

                {players.length > 0 && (
                    <div className="mt-12 flex flex-col items-center gap-6">
                        <div className="text-wood-400 font-bold uppercase tracking-widest text-sm bg-wood-900/50 px-6 py-2 rounded-full border border-wood-700">
                            {players.length} {players.length === 1 ? 'Adventurer' : 'Adventurers'} Joined
                        </div>

                        <button
                            onClick={startGame}
                            disabled={players.length < 1}
                            className="group relative px-12 py-5 bg-gradient-to-r from-green-600 to-green-500 border-y-2 border-green-300 text-white rounded-lg font-display font-black text-2xl tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 overflow-hidden"
                        >
                            Start Game
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WelcomeScreen;
