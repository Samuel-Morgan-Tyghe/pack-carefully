import { useStore } from '@nanostores/react';
import { returnToSplitScreen, $gameState } from '../../store/gameStore';

const JourneyResults: React.FC = () => {
    const gameState = useStore($gameState);
    const result = gameState.lastEncounterResult;
    
    if (!result) return <div>Loading...</div>;

    const isVictory = result.success;

    return (
        <div className="flex flex-col items-center justify-center text-parchment-100 p-8 h-full">
            <h2 className={`text-5xl font-black mb-4 tracking-wider ${isVictory ? 'text-green-500' : 'text-red-500'}`}>
                {isVictory ? 'VICTORY!' : 'DEFEAT'}
            </h2>
            
            <div className="text-2xl text-parchment-300 mb-8 font-serif italic">
                {result.message}
            </div>

            <div className="bg-black/30 p-6 rounded-lg border border-wood-600 mb-12 max-w-md text-center">
                {isVictory ? (
                    <p className="text-green-300 text-lg">
                        You successfully repelled the threat. The team's morale remains high.
                    </p>
                ) : (
                    <div className="space-y-2">
                        <p className="text-red-400 text-lg font-bold">
                            -20 Morale
                        </p>
                        <p className="text-purple-400 text-lg font-bold">
                            +1 Cursed Scrap (Added to Bag)
                        </p>
                        <p className="text-parchment-400 text-sm mt-2">
                            The beast tore through your supplies, leaving behind dark omens.
                        </p>
                    </div>
                )}
            </div>
            
            <button 
                onClick={returnToSplitScreen}
                className="bg-wood-600 hover:bg-wood-500 text-parchment-100 font-bold py-3 px-8 rounded shadow-lg transition-colors border-2 border-wood-400 text-xl"
            >
                CONTINUE
            </button>
        </div>
    );
};

export default JourneyResults;
