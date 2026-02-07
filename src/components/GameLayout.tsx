import React, { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { $phase, $players, addPlayer } from '../store/gameStore';
import Inventory from './Inventory';
import { clsx } from 'clsx';
import Journey from './Journey';
import Campfire from './Campfire';
import Header from './layout/Header';
import SupplyShelf from './layout/SupplyShelf';

const GameLayout: React.FC = () => {
  const phase = useStore($phase);
  const players = useStore($players);

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
       
       <Header />

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

          <SupplyShelf />
       </main>
    </div>
  );
};

export default GameLayout;
