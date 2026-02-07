import React, { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { $phase, $players, $availableItems, $draggedItem, addPlayer, startGame, nextPhase } from '../store/gameStore';
import Inventory from './Inventory';
import { clsx } from 'clsx';
import * as LucideIcons from 'lucide-react';
import Journey from './Journey';
import Campfire from './Campfire';

const GameLayout: React.FC = () => {
  const phase = useStore($phase);
  const players = useStore($players);
  const availableItems = useStore($availableItems);

  useEffect(() => {
    // Init dev state if empty
    if (players.length === 0) {
      addPlayer('Alex');
      addPlayer('Sam');
      addPlayer('Jordan');
      addPlayer('Taylor');
    }
  }, [players.length]);

  return (
    <div className="min-h-screen font-sans selection:bg-gold-500 selection:text-wood-900 overflow-hidden p-8 flex flex-col relative">
       {/* Background overlay for vignette */}
       <div className="absolute inset-0 pointer-events-none shadow-vignette z-0" />
       
       {/* Header */}
       <header className="flex justify-between items-center mb-8 pb-4 relative z-10 
            bg-wood-800/90 border-b-4 border-wood-600 rounded-b-xl px-8 pt-4 -mx-8 -mt-8 shadow-lg">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-wood-900 rounded-lg border-2 border-gold-600 shadow-inner">
                <LucideIcons.Map size={32} className="text-gold-500" />
             </div>
             <div>
                <h1 className="text-4xl font-display font-bold uppercase tracking-widest text-parchment-100 drop-shadow-md">Pack Carefully</h1>
                <p className="text-sm text-gold-500 tracking-widest-xl font-serif italic border-t border-wood-600 mt-1 pt-1 opacity-80">Cooperative Survival</p>
             </div>
          </div>
          
          <div className="flex items-center gap-8">
             {/* Phase Indicator */}
             <div className="flex items-center gap-4 text-xs font-bold tracking-widest uppercase text-wood-400 font-display">
                {['LOBBY', 'PACKING', 'JOURNEY', 'CAMPFIRE'].map(p => (
                   <div key={p} className={clsx(
                       phase === p ? "text-gold-500 scale-110 transition-transform underline decoration-gold-600 decoration-2 underline-offset-4" : "opacity-40"
                   )}>
                      {p}
                   </div>
                ))}
             </div>
             
             <button 
                onClick={startGame}
                disabled={phase !== 'LOBBY'}
                className="px-8 py-3 bg-gradient-to-r from-gold-600 to-gold-500 border-2 border-gold-400 text-wood-900 rounded-lg hover:from-gold-500 hover:to-gold-400 font-display font-bold tracking-widest shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:grayscale disabled:pointer-events-none"
             >
                {phase === 'LOBBY' ? 'Start Expedition' : 'In Progress'}
             </button>
             
             {phase !== 'LOBBY' && (
                 <button onClick={nextPhase} className="px-4 py-2 bg-forest-700 rounded-full hover:bg-forest-600 text-xs uppercase font-bold">
                     Next Phase
                 </button>
             )}
          </div>
       </header>

       <main className="flex-1 flex gap-8">
          {/* Main Area: Inventory Grid */}
          <section className="flex-1 flex justify-center items-center relative z-10">
             {/* Note: The global body background provides the main texture now. 
                 We just centre the components on the 'table'. */}
             
             <div className="z-10 w-full flex justify-center p-8">
                {phase === 'PACKING' && <Inventory />}
                {phase === 'JOURNEY' && <Journey />}
                {phase === 'CAMPFIRE' && <Campfire />}
                {phase === 'LOBBY' && (
                <div className="text-center z-10 hidden lg:block">
                    <h2 className="text-4xl font-black text-white mb-4">Base Camp</h2>
                    <p className="text-lg text-slate-400 max-w-md mx-auto">
                        Gather your team. Assign roles. Prepare for the ascent.
                    </p>
                    <div className="mt-8 flex gap-4 justify-center">
                        {players.map(p => (
                            <div key={p.id} className={clsx("w-12 h-12 rounded-full border-2 border-forest-500 flex items-center justify-center", p.avatarColor)}>
                                {p.name[0]}
                            </div>
                        ))}
                    </div>
                </div>
             )}
             </div>
          </section>

          {/* Sidebar: Supplies */}
          <section className="w-80 bg-wood-900/90 border-l-4 border-wood-700 shadow-2xl p-6 flex flex-col gap-6 relative z-10 backdrop-blur-sm">
             {/* Supply Header */}
             <div className="flex justify-between items-center border-b-2 border-wood-700 pb-2">
                <h3 className="font-display font-bold text-2xl text-gold-500 drop-shadow-sm">Supplies</h3>
                <span className="text-xs bg-wood-800 px-2 py-1 rounded text-wood-300 font-mono border border-wood-600">{availableItems.length}</span>
             </div>
             
             <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-wood-600 scrollbar-track-wood-900 min-h-0">
                 {/* Group by category */}
                 {['ESSENTIAL', 'TOOL', 'SURVIVAL', 'COMFORT', 'SABOTAGE'].map(cat => {
                     const catItems = availableItems.filter(i => i.category === cat);
                     if (catItems.length === 0) return null;
                     return (
                         <div key={cat} className="mb-6">
                             {/* Wooden Shelf Header */}
                             <h4 className="text-xs font-serif font-bold text-wood-400 uppercase mb-2 sticky top-0 bg-wood-900/95 py-2 z-10 border-b border-wood-700 w-full flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-gold-600/50"></span> {cat}
                             </h4>
                             <div className="grid grid-cols-2 gap-3">
                                 {catItems.map(item => (
                                     <div
                                         key={item.id}
                                         draggable
                                         onDragStart={(e) => {
                                             e.dataTransfer.setData('itemId', item.id);
                                             e.dataTransfer.effectAllowed = 'copy';
                                             $draggedItem.set(item.id);

                                             // Custom Drag Image (Updated to match scale)
                                             const dragEl = document.createElement('div');
                                             dragEl.style.width = `${item.width * 64 + (item.width - 1) * 4}px`;
                                             dragEl.style.height = `${item.height * 64 + (item.height - 1) * 4}px`;
                                             dragEl.style.backgroundColor = '#F5E6CA'; // Parchment
                                             dragEl.style.backgroundImage = 'url("https://www.transparenttextures.com/patterns/paper.png")';
                                             dragEl.style.border = '2px solid #8D6E63';
                                             dragEl.style.borderRadius = '0.5rem';
                                             dragEl.style.position = 'absolute';
                                             dragEl.style.top = '-9999px';
                                             dragEl.style.display = 'flex';
                                             dragEl.style.flexDirection = 'column';
                                             dragEl.style.alignItems = 'center';
                                             dragEl.style.justifyContent = 'center';
                                             dragEl.innerHTML = `
                                                <div style="font-weight: bold; font-family:serif; color: #2D1B12; font-size: 14px; text-transform: uppercase;">${item.name}</div>
                                                <div style="font-size: 10px; color: #5D4037;">${item.width}x${item.height}</div>
                                             `;
                                             
                                             document.body.appendChild(dragEl);
                                             e.dataTransfer.setDragImage(dragEl, 32, 32);
                                             
                                             setTimeout(() => { document.body.removeChild(dragEl); }, 0);
                                         }}
                                         onDragEnd={() => { $draggedItem.set(null); }}
                                         // Item Card Style
                                         className="group flex flex-col gap-2 p-3 rounded bg-parchment-100 hover:bg-white border-2 border-parchment-500 hover:border-gold-500 transition-all cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md relative overflow-hidden"
                                     >
                                         {/* Texture noise */}
                                         <div className="absolute inset-0 bg-paper-texture opacity-30 pointer-events-none" />

                                         <div className="flex justify-between items-start w-full relative z-10">
                                            <div className="p-1 bg-wood-200/50 rounded">
                                                {React.createElement(
                                                    (LucideIcons as any)[item.icon] || LucideIcons.Package,
                                                    { size: 20, className: "text-wood-900" }
                                                )}
                                            </div>
                                         </div>
                                         <div className="relative z-10">
                                            <div className="font-serif font-bold text-sm text-wood-900 leading-tight group-hover:text-wood-600 transition-colors uppercase">{item.name}</div>
                                            <div className="text-[10px] text-wood-600 mt-1 font-mono">{item.width}x{item.height}</div>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                             {/* Shelf shadow */}
                             <div className="h-1 bg-black/20 mt-4 rounded-full blur-sm" />
                         </div>
                     )
                 })}
             </div>
             
             {/* Player Info Card */}
             <div className="pt-6 border-t font-serif border-wood-700 text-parchment-500">
                 {players.length > 0 && (
                     <div className="bg-wood-800 rounded-xl p-4 border border-wood-600 shadow-inner flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-forest-800 border-2 border-gold-600 flex items-center justify-center font-bold text-gold-100 font-display text-lg shadow-md">
                             A
                         </div>
                         <div>
                             <div className="font-bold text-sm text-parchment-100">Alex (You)</div>
                             <div className="text-xs text-forest-700 flex items-center gap-1 font-bold">
                                 <LucideIcons.Shield size={10} /> Hiker
                             </div>
                         </div>
                     </div>
                 )}
             </div>
          </section>
       </main>
    </div>
  );
};

export default GameLayout;
