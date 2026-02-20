import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { $itemsOnGrid, damageMorale } from '../store/gameStore'; // Import damageMorale
import { ITEMS } from '../lib/items';
import * as LucideIcons from 'lucide-react';
import { clsx } from 'clsx';

const Journey: React.FC = () => {
    const itemsOnGrid = useStore($itemsOnGrid);
    
    // Simulate events
    const [eventIndex, setEventIndex] = useState(0);
    const [resolved, setResolved] = useState(false); // Track if current event is resolved
    
    const events = [
        {
            title: "Desert Trek",
            description: "The sun is brutal. We need a Water Bottle to stay hydrated.",
            requiredItem: "water_bottle",
            successText: "Refreshing! We made it through the heat.",
            failText: "Dehydration set in. We had to slow down and lost supplies.",
            damage: 20, // Damage on fail
            icon: "Sun"
        },
        {
            title: "Dark Cave",
            description: "The path goes underground. It's pitch black.",
            requiredItem: "flashlight",
            successText: "The flashlight revealed the path.",
            failText: "Stumbled in the dark. Someone got hurt.",
            damage: 25,
            icon: "Mountain"
        }
    ];
    
    const currentEvent = events[eventIndex % events.length];
    const hasItem = itemsOnGrid.some(i => i.itemId === currentEvent.requiredItem);
    
    const resolveEvent = () => {
        if (resolved) return;
        setResolved(true);
        if (!hasItem) {
            damageMorale(currentEvent.damage);
        }
    };
    
    const nextEvent = () => {
        setResolved(false);
        setEventIndex(prev => prev + 1);
    };
    
    return (
        <div className="w-full max-w-2xl mx-auto">
             <div className="bg-forest-900/80 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                 {/* Event Header */}
                 <div className="h-40 bg-forest-800 relative flex items-end p-6">
                     <div className="absolute inset-0 bg-black/40" />
                     {/* Icon bg */}
                     <div className="absolute right-4 top-4 text-white/10">
                         {React.createElement((LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[currentEvent.icon] || LucideIcons.Map, { size: 120 })}
                     </div>
                     
                     <div className="relative z-10">
                         <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-1">{currentEvent.title}</h2>
                         <p className="text-forest-200 text-lg">{currentEvent.description}</p>
                     </div>
                 </div>
                 
                 {/* Status Check - Only show result after resolving */}
                 <div className="p-8">
                     <div className="flex items-center justify-between mb-8 p-4 bg-night-900 rounded-xl border border-white/5">
                         <div className="flex items-center gap-4">
                             <div className="p-3 bg-white/5 rounded-lg">
                                 {React.createElement((LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[ITEMS[currentEvent.requiredItem]?.icon] || LucideIcons.HelpCircle, { size: 32, className: "text-camp-orange" })}
                             </div>
                             <div>
                                 <div className="text-xs uppercase font-bold text-slate-500">Required Item</div>
                                 <div className="text-xl font-bold text-white">{ITEMS[currentEvent.requiredItem]?.name}</div>
                             </div>
                         </div>
                     </div>
                     
                     {/* Resolve / Result Area */}
                     {!resolved ? (
                        <button 
                             onClick={resolveEvent}
                             className="w-full py-4 bg-gold-600 hover:bg-gold-500 text-wood-900 rounded-lg font-black uppercase tracking-widest text-xl shadow-lg transition-all"
                        >
                            Attempt Crossing
                        </button>
                     ) : (
                        <div className="text-center animate-in fade-in slide-in-from-bottom-4">
                             <div className={clsx("text-2xl font-black uppercase mb-2", hasItem ? "text-green-400" : "text-red-500")}>
                                 {hasItem ? "Success!" : "Failure!"}
                             </div>
                             <p className="text-lg text-slate-300 mb-6">
                                 {hasItem ? currentEvent.successText : currentEvent.failText}
                                 {!hasItem && <span className="block text-red-400 font-bold mt-2">-{currentEvent.damage} Morale</span>}
                             </p>
                             
                             <button 
                                 onClick={nextEvent}
                                 className="px-8 py-3 bg-forest-700 hover:bg-forest-600 text-white rounded-lg font-bold uppercase tracking-widest transition-colors"
                             >
                                 Continue Journey
                             </button>
                        </div>
                     )}
                 </div>
             </div>
        </div>
    );
};

export default Journey;
