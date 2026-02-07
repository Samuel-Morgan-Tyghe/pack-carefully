import React from 'react';
import { useStore } from '@nanostores/react';
import { $players, startGame } from '../../store/gameStore';
import { clsx } from 'clsx';
import * as LucideIcons from 'lucide-react';

const WelcomeScreen: React.FC = () => {
    const players = useStore($players);



    return (
        <div className="w-full h-full flex flex-col justify-center items-center relative z-20">
            {/* Title Section */}
            <div className="text-center animate-in fade-in duration-700">
                <div className="mb-8 inline-block p-6 bg-wood-900/80 rounded-full border-4 border-gold-600 shadow-2xl backdrop-blur-sm">
                     <LucideIcons.Map size={64} className="text-gold-500" />
                </div>
                
                <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-parchment-100 to-parchment-500 mb-6 drop-shadow-lg font-display uppercase tracking-widest leading-none text-balance">
                    Pack<br/>Carefully
                </h1>
                
                <p className="text-2xl text-gold-500 max-w-lg mx-auto font-serif italic mb-12 border-t border-b border-wood-600 py-4 bg-wood-900/30">
                    "The journey is long, the pack is heavy.<br/>Choose your companions wisely."
                </p>

                {/* Player List */}
                <div className="flex gap-8 justify-center mb-16">
                    {players.map(p => (
                        <div key={p.id} className="flex flex-col items-center gap-3 group">
                            <div className={clsx(
                                "w-20 h-20 rounded-full border-4 border-wood-600 flex items-center justify-center text-2xl font-bold font-display shadow-xl transition-transform group-hover:scale-110 group-hover:border-gold-500 bg-wood-800 text-parchment-100", 
                                p.avatarColor
                            )}>
                                {p.name[0]}
                            </div>
                            <span className="text-sm font-bold uppercase tracking-wider text-wood-400 group-hover:text-gold-400 bg-wood-900/80 px-3 py-1 rounded-full border border-wood-700">{p.name}</span>
                        </div>
                    ))}
                </div>

                {/* Primary Action */}
                <button 
                    onClick={startGame}
                    className="group relative px-12 py-5 bg-gradient-to-r from-gold-600 to-gold-500 border-y-2 border-gold-300 text-wood-900 rounded-lg font-display font-black text-2xl tracking-[0.2em] shadow-[0_0_40px_rgba(234,179,8,0.3)] hover:shadow-[0_0_60px_rgba(234,179,8,0.5)] hover:scale-105 transition-all duration-300 overflow-hidden"
                >
                    <span className="relative z-10 flex items-center gap-4">
                        Start Expedition <LucideIcons.ArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </span>
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                </button>
            </div>
        </div>
    );
};

export default WelcomeScreen;
