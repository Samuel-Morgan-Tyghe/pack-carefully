import React from 'react';
import { useStore } from '@nanostores/react';
import { $phase, $gameState } from '../store/gameStore';
import Inventory from './Inventory';
import Campfire from './Campfire';
import GameHUD from './layout/GameHUD';
import SupplyShelf from './layout/SupplyShelf';
import WelcomeScreen from './layout/WelcomeScreen';
import GameResultScreen from './layout/GameResultScreen';

import SecretDraftPad from './game/SecretDraftPad';
import JourneyPhase from './game/JourneyPhase';
import Finale from './game/Finale';
import DebugVerification from './DebugVerification';
import Tutorial from './layout/Tutorial';
import Settings from './layout/Settings';

const GameLayout: React.FC = () => {
    const phase = useStore($phase);
    const gameState = useStore($gameState);

    return (
        <div className="min-h-screen w-full bg-wood-900 text-parchment-100 font-sans selection:bg-gold-500 selection:text-wood-900 relative flex flex-col">
            {/* Background overlay for vignette */}
            <div className="fixed inset-0 pointer-events-none shadow-vignette z-0 mix-blend-multiply" />

            {gameState.isGameOver && <GameResultScreen />}

            {phase === 'LOBBY' ? (
                <WelcomeScreen />
            ) : (
                <>
                    <GameHUD />

                    {/* Main Content Area - Standard Flow */}
                    <main className="flex-1 flex w-full relative z-10 pt-20 pb-8 px-4 md:px-8 gap-4 md:gap-8 flex-col md:flex-row max-w-7xl mx-auto">

                        {/* Center Stage: Inventory / Game Board */}
                        <section className="flex-1 flex flex-col justify-start items-center w-full relative">
                            {phase === 'DRAFT' && <SecretDraftPad />}

                            <div className="w-full flex-1 flex flex-col justify-center items-center mt-4 md:mt-0">
                                {(phase === 'PACKING' || phase === 'DRAFT') && <Inventory />}
                                {phase === 'JOURNEY' && <JourneyPhase />}
                                {phase === 'CAMPFIRE' && <Campfire />}
                                {phase === 'FINALE' && <Finale />}
                            </div>
                        </section>

                        {/* Right Sidebar: Supply Shelf */}
                        {phase === 'PACKING' && <SupplyShelf />}
                    </main>
                </>
            )}
            <DebugVerification />
            <Tutorial />
            <Settings />
        </div>
    );
};

export default GameLayout;
