import React from 'react';
import { useStore } from '@nanostores/react';
import { $players, $viewingPlayerId, $localPlayerId } from '../../store/gameStore';
import * as LucideIcons from 'lucide-react';
import clsx from 'clsx';

const PlayerInfo: React.FC = () => {
    const players = useStore($players);
    const viewingPlayerId = useStore($viewingPlayerId);
    const localPlayerId = useStore($localPlayerId);

    const player = players.find(p => p.id === viewingPlayerId) || players[0];
    const isMe = player?.id === localPlayerId;

    if (!player) return null;

    return (
        <div className="pt-6 border-t font-serif border-wood-700 text-parchment-500">
            <div className={clsx(
                "bg-wood-800 rounded-xl p-4 border shadow-inner flex items-center gap-3 transition-all",
                isMe ? "border-gold-600/50" : "border-wood-600 opacity-80"
            )}>
                <div className={clsx("w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-parchment-100 font-display text-lg shadow-md", player.avatarColor)}>
                    {player.name[0]}
                </div>
                <div>
                    <div className="font-bold text-sm text-parchment-100">
                        {player.name} {isMe && "(You)"}
                    </div>
                    <div className="text-xs text-wood-400 flex items-center gap-1 font-bold">
                        <LucideIcons.Shield size={10} className={isMe ? "text-gold-500" : "text-wood-500"} />
                        {player.role}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlayerInfo;
