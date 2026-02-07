import React from 'react';
import { useStore } from '@nanostores/react';
import { $availableItems } from '../../store/gameStore';
import PlayerInfo from './PlayerInfo';
import ShelfCategory from './ShelfCategory';

const SupplyShelf: React.FC = () => {
    const availableItems = useStore($availableItems);



    return (
        <section className="w-80 h-full bg-wood-900/90 border-l-4 border-wood-700 shadow-2xl p-6 flex flex-col gap-6 relative z-10 backdrop-blur-sm rounded-l-xl my-4 mr-[-2rem] mb-[-2rem]">
            {/* Supply Header */}
            <div className="flex justify-between items-center border-b-2 border-wood-700 pb-2 shrink-0">
                <h3 className="font-display font-bold text-2xl text-gold-500 drop-shadow-sm">Supplies</h3>
                <span className="text-xs bg-wood-800 px-2 py-1 rounded text-wood-300 font-mono border border-wood-600">{availableItems.length}</span>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-wood-600 scrollbar-track-wood-900 min-h-0">
                {/* Group by category */}
                {['ESSENTIAL', 'TOOL', 'SURVIVAL', 'COMFORT', 'SABOTAGE'].map(cat => (
                    <ShelfCategory 
                        key={cat} 
                        category={cat} 
                        items={availableItems.filter(i => i.category === cat)} 
                    />
                ))}
            </div>
            
            <PlayerInfo />
        </section>
    );
};

export default SupplyShelf;
