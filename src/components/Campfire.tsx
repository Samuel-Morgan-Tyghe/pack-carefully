import React from 'react';
import { useStore } from '@nanostores/react';
import { $players } from '../store/gameStore';
import { clsx } from 'clsx';
import { Flame, MessageCircle, Skull } from 'lucide-react';

const Campfire: React.FC = () => {
    const players = useStore($players);
    
    return (
        <div className="flex flex-col items-center justify-center p-8 bg-black/60 rounded-3xl backdrop-blur-md border border-camp-orange/30 max-w-2xl mx-auto">
            <div className="bg-camp-orange/20 p-4 rounded-full mb-6 animate-pulse">
                <Flame size={48} className="text-camp-fire" />
            </div>
            
            <h2 className="text-3xl font-black text-camp-orange uppercase tracking-widest mb-2">Campfire Discussion</h2>
            <p className="text-slate-400 mb-8 text-center">
                Who do you trust? Discuss the journey and vote out the traitor if you can.
            </p>
            
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Chat Log Simulation */}
                <div className="bg-night-800 rounded-xl p-4 border border-white/10 h-64 overflow-y-auto">
                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                        <MessageCircle size={14} /> Team Log
                    </h3>
                    <div className="space-y-3 text-sm">
                        <div className="text-blue-400 font-bold">Alex: <span className="text-slate-300 font-normal">We missed the rope at the river. Who had it?</span></div>
                        <div className="text-green-400 font-bold">Sam: <span className="text-slate-300 font-normal">I thought Jordan grabbed it!</span></div>
                        <div className="text-yellow-400 font-bold">Jordan: <span className="text-slate-300 font-normal">I was busy packing rations!</span></div>
                        <div className="text-purple-400 font-bold">Taylor: <span className="text-slate-300 font-normal italic">*suspicious silence*</span></div>
                    </div>
                </div>
                
                {/* Voting Area */}
                <div className="flex flex-col gap-3">
                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
                        <Skull size={14} /> Vote to Kick
                    </h3>
                    
                    {players.map(p => (
                        <button 
                            key={p.id}
                            className={clsx(
                                "flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-red-900/40 hover:border-red-500 transition-all text-left group",
                                p.id === '1' && "opacity-50 cursor-not-allowed" // Can't vote self easily here?
                            )}
                        >
                             <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold", p.avatarColor)}>
                                 {p.name[0]}
                             </div>
                             <div className="flex-1 font-bold text-slate-200">{p.name}</div>
                             <div className="text-xs text-red-500 opacity-0 group-hover:opacity-100 uppercase font-bold tracking-widest transition-opacity">
                                 Vote
                             </div>
                        </button>
                    ))}
                    
                    <button className="mt-auto py-3 bg-slate-700 rounded-lg text-slate-300 font-bold uppercase tracking-widest text-xs hover:bg-slate-600 transition-colors">
                        Skip Vote
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Campfire;
