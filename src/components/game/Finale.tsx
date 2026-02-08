import React, { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { $gameState, resetGame } from '../../store/gameStore';
import { motion } from 'framer-motion';
import { Trophy, Skull, RotateCcw } from 'lucide-react';
import canvasConfetti from 'canvas-confetti'; // Renamed to avoid conflict with state
import { playSound } from '../../lib/sounds';

const Finale: React.FC = () => {
    const gameState = useStore($gameState);
    const [score, setScore] = useState(0);
    const isWin = gameState.gameResult === 'WIN' || (!gameState.gameResult && gameState.day >= 5); // Day 5 survival is win

    // Play sounds and trigger confetti
    useEffect(() => {
        if (isWin) {
            playSound.fanfare();
             canvasConfetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#FCD34D', '#F59E0B', '#B45309']
            });
        } else {
            playSound.defeat();
        }
    }, []); // Run once on mount

    // Calculate score on mount
    useEffect(() => {
        // Simple scoring logic for prototype
        // Base score + Morale + Items?
        const baseScore = gameState.day * 1000;
        const moraleBonus = gameState.morale * 50;
        const total = baseScore + moraleBonus;
        setScore(total);
    }, []);



    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black/90 text-white relative overflow-hidden">
             {/* Background glow */}
             <div className={`absolute inset-0 opacity-20 ${isWin ? 'bg-gradient-to-t from-gold-900 to-black' : 'bg-red-900'}`} />

            <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="z-10 text-center flex flex-col items-center gap-6 p-12 bg-slate-900/80 border-4 border-double border-slate-600 rounded-xl shadow-2xl backdrop-blur-md max-w-2xl w-full"
            >
                {isWin ? (
                    <>
                        <Trophy size={80} className="text-yellow-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.8)]" />
                        <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 uppercase tracking-widest">
                            Victory!
                        </h1>
                        <p className="text-2xl text-slate-300">The expedition survived the wilderness.</p>
                    </>
                ) : (
                    <>
                        <Skull size={80} className="text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]" />
                        <h1 className="text-6xl font-black text-red-600 uppercase tracking-widest">
                            Defeat
                        </h1>
                        <p className="text-2xl text-slate-300">The journey ends here.</p>
                    </>
                )}

                <div className="w-full h-px bg-slate-700 my-4" />

                <div className="grid grid-cols-2 gap-8 w-full">
                    <div className="bg-slate-800 p-4 rounded-lg flex flex-col items-center">
                        <span className="text-slate-400 text-sm uppercase font-bold">Days Survived</span>
                        <span className="text-4xl font-black">{gameState.day}</span>
                    </div>
                    <div className="bg-slate-800 p-4 rounded-lg flex flex-col items-center">
                        <span className="text-slate-400 text-sm uppercase font-bold">Group Morale</span>
                        <span className="text-4xl font-black text-blue-400">{gameState.morale}%</span>
                    </div>
                </div>

                <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 w-full mt-4">
                     <div className="flex justify-between items-end">
                         <span className="text-xl text-slate-400 font-bold uppercase">Final Score</span>
                         <span className="text-5xl font-black text-white">{score.toLocaleString()}</span>
                     </div>
                </div>

                <button 
                    onClick={() => resetGame()}
                    className="mt-8 flex items-center gap-2 bg-white text-black hover:bg-slate-200 font-black py-4 px-8 rounded-full shadow-lg transition-transform hover:scale-105"
                >
                    <RotateCcw size={20} />
                    PLAY AGAIN
                </button>
            </motion.div>
        </div>
    );
};

export default Finale;
