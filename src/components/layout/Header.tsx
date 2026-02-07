import React from 'react';
import { useStore } from '@nanostores/react';
import { $phase, startGame, nextPhase } from '../../store/gameStore';
import { clsx } from 'clsx';
import * as LucideIcons from 'lucide-react';

const Header: React.FC = () => {
  const phase = useStore($phase);

  return (
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
  );
};

export default Header;
