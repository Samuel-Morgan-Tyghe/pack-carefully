import React from 'react';
import { useStore } from '@nanostores/react';
import { $phase } from '../store/gameStore';
import Inventory from './Inventory';
import Journey from './Journey';
import Campfire from './Campfire';
import GameHUD from './layout/GameHUD';
import SupplyShelf from './layout/SupplyShelf';
import WelcomeScreen from './layout/WelcomeScreen';

const GameLayout: React.FC = () => {
  const phase = useStore($phase);

  return (
    <div className="h-screen w-screen bg-wood-900 text-parchment-100 font-sans selection:bg-gold-500 selection:text-wood-900 overflow-hidden relative flex flex-col">
       {/* Background overlay for vignette */}
       <div className="absolute inset-0 pointer-events-none shadow-vignette z-0 mix-blend-multiply" />
       
       {phase === 'LOBBY' ? (
           <WelcomeScreen />
       ) : (
           <>
               <GameHUD />

               {/* Main Content Area - Fullscreen Grid + Sidebar */}
               <main className="flex-1 flex w-full h-full relative z-10 pt-20 pb-8 px-8 gap-8 overflow-hidden">
                  
                  {/* Center Stage: Inventory / Game Board */}
                  <section className="flex-1 flex justify-center items-center h-full relative">
                     <div className="w-full h-full flex flex-col justify-center items-center">
                        {phase === 'PACKING' && <Inventory />}
                        {phase === 'JOURNEY' && <Journey />}
                        {phase === 'CAMPFIRE' && <Campfire />}
                     </div>
                  </section>

                  {/* Right Sidebar: Supply Shelf */}
                  <SupplyShelf />
               </main>
           </>
       )}
    </div>
  );
};

export default GameLayout;
