import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { $itemsOnGrid } from '../store/gameStore';
import { ITEMS } from '../lib/items';
import * as LucideIcons from 'lucide-react';
import { clsx } from 'clsx';

const Journey: React.FC = () => {
    const itemsOnGrid = useStore($itemsOnGrid);
    
    // Simulate events
    const [eventIndex, setEventIndex] = useState(0);
    
    const events = [
        {
            title: "River Crossing",
            description: "The bridge is washed out. We need a Rope to cross safely.",
            requiredItem: "rope",
            successText: "Excellent! The rope held firm.",
            failText: "We had to swim. Lost time and supplies.",
            icon: "Waves"
        },
        {
            title: "Dark Cave",
            description: "The path goes underground. It's pitch black.",
            requiredItem: "flashlight",
            successText: "The flashlight revealed the path.",
            failText: "Stumbled in the dark. Someone got hurt.",
            icon: "Mountain"
        }
    ];
    
    const currentEvent = events[eventIndex % events.length];
    
    const hasItem = itemsOnGrid.some(i => i.itemId === currentEvent.requiredItem);
    
    return (
        <div className="w-full max-w-2xl mx-auto">
             <div className="bg-forest-900/80 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                 {/* Event Header */}
                 <div className="h-40 bg-forest-800 relative flex items-end p-6">
                     <div className="absolute inset-0 bg-black/40" />
                     {/* Icon bg */}
                     <div className="absolute right-4 top-4 text-white/10">
                         {React.createElement((LucideIcons as any)[currentEvent.icon] || LucideIcons.Map, { size: 120 })}
                     </div>
                     
                     <div className="relative z-10">
                         <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-1">{currentEvent.title}</h2>
                         <p className="text-forest-200 text-lg">{currentEvent.description}</p>
                     </div>
                 </div>
                 
                 {/* Status Check */}
                 <div className="p-8">
                     <div className="flex items-center justify-between mb-8 p-4 bg-night-900 rounded-xl border border-white/5">
                         <div className="flex items-center gap-4">
                             <div className="p-3 bg-white/5 rounded-lg">
                                 {React.createElement((LucideIcons as any)[ITEMS[currentEvent.requiredItem]?.icon] || LucideIcons.HelpCircle, { size: 32, className: "text-camp-orange" })}
                             </div>
                             <div>
                                 <div className="text-xs uppercase font-bold text-slate-500">Required Item</div>
                                 <div className="text-xl font-bold text-white">{ITEMS[currentEvent.requiredItem]?.name}</div>
                             </div>
                         </div>
                         
                         <div className={clsx("px-4 py-2 rounded-full font-bold uppercase tracking-widest text-sm flex items-center gap-2", 
                             hasItem ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                         )}>
                             {hasItem ? (
                                 <><LucideIcons.CheckCircle size={16} /> Have It</>
                             ) : (
                                 <><LucideIcons.XCircle size={16} /> Missing</>
                             )}
                         </div>
                     </div>
                     
                     <div className="text-center">
                         <p className={clsx("text-lg font-medium", hasItem ? "text-green-400" : "text-red-400")}>
                             {hasItem ? currentEvent.successText : currentEvent.failText}
                         </p>
                     </div>
                     
                     <div className="mt-8 flex justify-center">
                         <button 
                             onClick={() => setEventIndex(i => i + 1)}
                             className="px-8 py-3 bg-forest-700 hover:bg-forest-600 text-white rounded-lg font-bold uppercase tracking-widest transition-colors"
                         >
                             Continue Journey
                         </button>
                     </div>
                 </div>
             </div>
        </div>
    );
};

export default Journey;
