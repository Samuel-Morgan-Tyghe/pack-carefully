import React from 'react';
import { useStore } from '@nanostores/react';
import { $availableItems } from '../../store/gameStore';
import PlayerInfo from './PlayerInfo';
import ShelfCategory from './ShelfCategory';
import * as LucideIcons from 'lucide-react';

const SupplyShelf: React.FC = () => {
    const availableItems = useStore($availableItems);

    return (
        <section className="w-full xl:w-80 h-auto xl:h-full bg-wood-900/90 border-b-4 xl:border-b-0 xl:border-l-4 border-wood-700 shadow-2xl p-3 md:p-6 flex flex-col gap-3 md:gap-6 relative z-10 backdrop-blur-sm rounded-t-xl xl:rounded-l-xl xl:rounded-t-none shrink-0 overflow-hidden order-first">
            {/* Supply Header - Hidden/Compact on mobile */}
            <div className="flex justify-between items-center border-b-2 border-wood-700 pb-2 shrink-0">
                <h3 className="font-display font-bold text-lg md:text-2xl text-gold-500 drop-shadow-sm flex items-center gap-2">
                    <LucideIcons.Package size={20} className="xl:hidden" />
                    Supplies
                </h3>
                <span className="text-xs bg-wood-800 px-2 py-1 rounded text-wood-300 font-mono border border-wood-600">{availableItems.length}</span>
            </div>

            <div className="flex-1 overflow-x-auto xl:overflow-y-auto pb-2 md:pr-2 flex flex-row xl:flex-col gap-4 scrollbar-thin scrollbar-thumb-wood-600 scrollbar-track-wood-900 min-h-0 w-full">
                {/* Categories */}
                {['CONTAINER', 'ESSENTIAL', 'TOOL', 'SURVIVAL', 'COMFORT', 'SABOTAGE'].map(cat => {
                    const items = availableItems.filter(i => i.category === cat);
                    if (items.length === 0) return null;
                    return (
                        <div key={cat} className="flex-shrink-0 xl:flex-shrink-1">
                            <ShelfCategory
                                category={cat}
                                items={items}
                            />
                        </div>
                    );
                })}
            </div>

            {/* Hide PlayerInfo on mobile shelf to save space */}
            <div className="hidden xl:block">
                <PlayerInfo />
            </div>
        </section>
    );
};

export default SupplyShelf;
