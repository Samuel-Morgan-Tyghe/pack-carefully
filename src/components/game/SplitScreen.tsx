import React from 'react';
import { useStore } from '@nanostores/react';
import { choosePath, assignPlayerToPath, returnToSplitScreen, $players, $gameState } from '../../store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

const SplitScreen: React.FC = () => {
    const players = useStore($players);
    const gameState = useStore($gameState);

    const leftPlayers = players.filter(p => p.currentPath === 'LEFT');
    const rightPlayers = players.filter(p => p.currentPath === 'RIGHT');
    const unassignedPlayers = players.filter(p => !p.currentPath);

    const leftStatus = gameState.pathStatus.LEFT;
    const rightStatus = gameState.pathStatus.RIGHT;

    return (
        <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center text-parchment-100 p-8">
            <h2 className="text-4xl font-black mb-8 text-center tracking-widest uppercase">The Fork in the Road</h2>
            
            <div className="flex gap-8 w-full max-w-7xl justify-center h-[60vh]">
                {/* LEFT PATH - SOLO */}
                <div className={clsx(
                    "flex-1 border-4 rounded-xl p-6 flex flex-col items-center relative overflow-hidden transition-colors",
                    leftStatus === 'RESOLVED' ? "border-green-600 bg-green-900/20 opacity-50" : "border-wood-600 bg-wood-800"
                )}>
                    <div className="absolute inset-0 bg-[url('https://placehold.co/600x400/1a2e1a/FFFFFF/png?text=The+Old+Road')] bg-cover opacity-20 pointer-events-none" />
                    <h3 className="text-3xl font-bold mb-2 relative z-10">THE QUIET TRAIL</h3>
                    <p className="text-lg text-parchment-300 text-center relative z-10 mb-4">
                        A solo journey. Safer, but less loot.
                    </p>
                    
                    {/* Player Slots */}
                    <div className="flex-1 w-full bg-black/30 rounded-lg p-4 mb-4 relative z-10 overflow-y-auto">
                        <AnimatePresence>
                            {leftPlayers.map(p => (
                                <motion.div
                                    key={p.id}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    layoutId={`player-${p.id}`}
                                    className={`mb-2 p-2 rounded flex items-center gap-2 font-bold ${p.avatarColor}`}
                                >
                                    <span>{p.name}</span>
                                    <button 
                                        onClick={() => assignPlayerToPath(p.id, null)}
                                        className="ml-auto text-xs bg-black/40 px-2 py-1 rounded hover:bg-black/60"
                                    >
                                        LEAVE
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {leftPlayers.length === 0 && <div className="text-parchment-500 italic text-center mt-8">No one assigned</div>}
                    </div>

                    {leftStatus === 'PENDING' ? (
                        <button 
                            disabled={leftPlayers.length === 0}
                            onClick={() => choosePath('LEFT')}
                            className="w-full py-4 bg-wood-600 hover:bg-wood-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-lg relative z-10"
                        >
                            EMBARK (Left)
                        </button>
                    ) : (
                        <div className="bg-green-600 text-white font-bold py-2 px-4 rounded-full relative z-10">
                            COMPLETED
                        </div>
                    )}
                </div>

                {/* CENTER - UNASSIGNED */}
                <div className="w-64 flex flex-col items-center justify-center gap-4">
                     <div className="text-parchment-400 font-bold uppercase tracking-widest text-sm mb-2">Unassigned Team</div>
                     {unassignedPlayers.map(p => (
                         <motion.div 
                            key={p.id}
                            layoutId={`player-${p.id}`}
                            className={`w-full p-4 rounded-lg shadow-lg flex flex-col gap-2 items-center ${p.avatarColor}`}
                         >
                             <div className="font-bold text-lg">{p.name}</div>
                             <div className="flex gap-2 w-full">
                                 <button 
                                    onClick={() => assignPlayerToPath(p.id, 'LEFT')}
                                    className="flex-1 bg-black/40 hover:bg-black/60 rounded px-2 py-1 text-xs font-bold"
                                    disabled={leftStatus === 'RESOLVED'}
                                 >
                                     &lt; LEFT
                                 </button>
                                 <button 
                                    onClick={() => assignPlayerToPath(p.id, 'RIGHT')}
                                    className="flex-1 bg-black/40 hover:bg-black/60 rounded px-2 py-1 text-xs font-bold"
                                    disabled={rightStatus === 'RESOLVED'}
                                 >
                                     RIGHT &gt;
                                 </button>
                             </div>
                         </motion.div>
                     ))}
                     
                     {unassignedPlayers.length === 0 && leftStatus !== 'RESOLVED' && rightStatus !== 'RESOLVED' && (
                         <div className="text-parchment-600 italic">All assigned</div>
                     )}

                     {/* Continue / Skip Button logic? */}
                     {/* If all paths resolved? */}
                     {leftStatus === 'RESOLVED' && rightStatus === 'RESOLVED' && (
                         <button
                            onClick={returnToSplitScreen} // This will trigger nextPhase -> Campfire
                            className="mt-8 bg-gold-600 hover:bg-gold-500 text-wood-900 font-black py-4 px-8 rounded-xl shadow-[0_0_20px_rgba(234,179,8,0.5)] animate-pulse"
                         >
                             GATHER AT CAMPFIRE
                         </button>
                     )}
                </div>

                {/* RIGHT PATH - DUO */}
                <div className={clsx(
                    "flex-1 border-4 rounded-xl p-6 flex flex-col items-center relative overflow-hidden transition-colors",
                    rightStatus === 'RESOLVED' ? "border-green-600 bg-green-900/20 opacity-50" : "border-red-600 bg-wood-800"
                )}>
                    <div className="absolute inset-0 bg-[url('https://placehold.co/600x400/2e1a1a/FFFFFF/png?text=Dark+Woods')] bg-cover opacity-20 pointer-events-none" />
                    <h3 className="text-3xl font-bold mb-2 relative z-10 text-red-400">THE DARK WOODS</h3>
                    <p className="text-lg text-parchment-300 text-center relative z-10 mb-4">
                        High risk. Better rewards. Cooperation required.
                    </p>
                    
                    {/* Player Slots */}
                    <div className="flex-1 w-full bg-black/30 rounded-lg p-4 mb-4 relative z-10 overflow-y-auto">
                        <AnimatePresence>
                            {rightPlayers.map(p => (
                                <motion.div
                                    key={p.id}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    layoutId={`player-${p.id}`}
                                    className={`mb-2 p-2 rounded flex items-center gap-2 font-bold ${p.avatarColor}`}
                                >
                                    <span>{p.name}</span>
                                    <button 
                                        onClick={() => assignPlayerToPath(p.id, null)}
                                        className="ml-auto text-xs bg-black/40 px-2 py-1 rounded hover:bg-black/60"
                                    >
                                        LEAVE
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {rightPlayers.length === 0 && <div className="text-parchment-500 italic text-center mt-8">No one assigned</div>}
                    </div>

                    {rightStatus === 'PENDING' ? (
                        <button 
                            disabled={rightPlayers.length === 0}
                            onClick={() => choosePath('RIGHT')}
                            className="w-full py-4 bg-red-700 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-lg relative z-10"
                        >
                            EMBARK (Right)
                        </button>
                    ) : (
                        <div className="bg-green-600 text-white font-bold py-2 px-4 rounded-full relative z-10">
                            COMPLETED
                        </div>
                    )}
                </div>
            </div>
            
            <div className="mt-8 text-parchment-400 text-sm">
                * Assign everyone before departing. Unassigned players wait at camp (Skip turn).
            </div>
        </div>
    );
};

export default SplitScreen;
