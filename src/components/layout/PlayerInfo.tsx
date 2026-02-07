import React from 'react';
import { useStore } from '@nanostores/react';
import { $players } from '../../store/gameStore';
import * as LucideIcons from 'lucide-react';

const PlayerInfo: React.FC = () => {
  const players = useStore($players);

  return (
     <div className="pt-6 border-t font-serif border-wood-700 text-parchment-500">
         {players.length > 0 && (
             <div className="bg-wood-800 rounded-xl p-4 border border-wood-600 shadow-inner flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-forest-800 border-2 border-gold-600 flex items-center justify-center font-bold text-gold-100 font-display text-lg shadow-md">
                     A
                 </div>
                 <div>
                     <div className="font-bold text-sm text-parchment-100">Alex (You)</div>
                     <div className="text-xs text-forest-700 flex items-center gap-1 font-bold">
                         <LucideIcons.Shield size={10} /> Hiker
                     </div>
                 </div>
             </div>
         )}
     </div>
  );
};

export default PlayerInfo;
