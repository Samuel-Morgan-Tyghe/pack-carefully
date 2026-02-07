import React from 'react';
import { useStore } from '@nanostores/react';
import { $phase, nextPhase } from '../../store/gameStore';
import { clsx } from 'clsx';
import * as LucideIcons from 'lucide-react';

const GameHUD: React.FC = () => {
  const phase = useStore($phase);

  return (
    <>
       {/* Top Left: Title/Logo (Compact) */}
       <div className="absolute top-4 left-6 z-50 pointer-events-none select-none">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-wood-900/90 rounded-lg border-2 border-gold-600 shadow-lg backdrop-blur-sm">
                <LucideIcons.Map size={24} className="text-gold-500" />
             </div>
             <div className="bg-wood-900/80 px-4 py-2 rounded-r-xl -ml-4 pl-6 border-y border-r border-wood-600 backdrop-blur-sm shadow-md">
                <h1 className="text-xl font-display font-bold uppercase tracking-widest text-parchment-100 drop-shadow-sm leading-none">Pack Carefully</h1>
             </div>
          </div>
       </div>

       {/* Top Center: Phase Indicator */}
       <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="bg-wood-900/90 border-2 border-wood-600 rounded-full px-6 py-2 shadow-xl backdrop-blur-sm flex items-center gap-4">
            {['LOBBY', 'PACKING', 'JOURNEY', 'CAMPFIRE'].map(p => (
                   <div key={p} className={clsx(
                       "text-[10px] font-bold tracking-[0.2em] uppercase font-display transition-all duration-300",
                       phase === p ? "text-gold-400 scale-110" : "text-wood-500"
                   )}>
                      {p}
                   </div>
            ))}
          </div>
       </div>

       {/* Top Right: Actions */}
       <div className="absolute top-4 right-6 z-50 flex items-center gap-4">
             <button 
                onClick={nextPhase} 
                className="px-6 py-2 bg-forest-700/90 border-2 border-forest-500 rounded-lg hover:bg-forest-600 text-parchment-100 text-xs uppercase font-bold tracking-wider shadow-lg hover:shadow-xl hover:scale-105 pointer-events-auto transition-all backdrop-blur-sm"
             >
                 Next Phase
             </button>
       </div>
    </>
  );
};

export default GameHUD;
