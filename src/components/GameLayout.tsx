import React from 'react';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import { useStore } from '@nanostores/react';
import { $phase, $gameState, $viewingPlayerId } from '../store/gameStore';
import Inventory from './Inventory';
import Campfire from './Campfire';
import GameHUD from './layout/GameHUD';
import SupplyShelf from './layout/SupplyShelf';
import WelcomeScreen from './layout/WelcomeScreen';
import GameResultScreen from './layout/GameResultScreen';

import BagBuilder from './game/BagBuilder';
import JourneyPhase from './game/JourneyPhase';
import Finale from './game/Finale';
import Sandbox from './game/Sandbox';
import DebugVerification from './DebugVerification';
import Tutorial from './layout/Tutorial';
import Settings from './layout/Settings';
import ItemTooltip from './layout/ItemTooltip';

const GameLayout: React.FC = () => {
    const phase = useStore($phase);
    const gameState = useStore($gameState);
    const viewingPlayerId = useStore($viewingPlayerId);

    return (
        <div className="h-screen w-full bg-wood-900 text-parchment-100 font-sans select-none relative flex flex-col overflow-hidden">
            {/* Background overlay for vignette */}
            <div className="fixed inset-0 pointer-events-none shadow-vignette z-0 mix-blend-multiply" />

            {gameState.isGameOver && <GameResultScreen />}

            {phase === 'LOBBY' ? (
                <WelcomeScreen />
            ) : phase === 'SANDBOX' ? (
                <Sandbox />
            ) : (
                <>
                    <GameHUD />

                    {/* Main Content Area - Split screen on desktop, Top-Bottom on mobile */}
                    <main className="flex-1 flex w-full relative z-10 pt-16 pb-2 px-1 md:px-4 gap-2 flex-col md:flex-row max-w-[1600px] mx-auto overflow-hidden">

                        {/* Items Shelf - Fixed width on desktop, Auto height on mobile */}
                        {phase === 'DRAFT' && (
                            <div className="w-full md:w-64 shrink-0 flex flex-col overflow-hidden">
                                <SupplyShelf />
                            </div>
                        )}

                        {/* Inventory Section */}
                        <section className="flex-1 flex flex-col justify-center items-center w-full relative min-w-0 overflow-hidden">
                            {phase === 'BAG_BUILDING' && <BagBuilder />}

                            <div className="w-full h-full flex flex-col justify-center items-center overflow-hidden">
                                {phase === 'DRAFT' && (
                                    <Inventory playerId={viewingPlayerId || undefined} className="scale-90 lg:scale-100" />
                                )}
                                {phase === 'JOURNEY' && <JourneyPhase />}
                                {phase === 'CAMPFIRE' && <Campfire />}
                                {phase === 'FINALE' && <Finale />}
                            </div>
                        </section>
                    </main>
                </>
            )}
            <DebugVerification />
            <Tutorial />
            <Settings />
            <Tooltip
                id="item-tooltip"
                className="!bg-slate-900/95 !border !border-slate-600 !rounded-xl !p-4 !text-sm !shadow-2xl !backdrop-blur-sm !opacity-100 !z-[9999999]"
                render={({ activeAnchor }) => {
                    const itemId = activeAnchor?.getAttribute('data-item-id');
                    const instanceId = activeAnchor?.getAttribute('data-instance-id') || undefined;
                    if (!itemId) return null;
                    return <ItemTooltip itemId={itemId} instanceId={instanceId} />;
                }}
            />
        </div>
    );
};

export default GameLayout;
