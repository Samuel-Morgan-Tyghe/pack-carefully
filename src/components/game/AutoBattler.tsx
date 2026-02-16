import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { $itemsOnGrid } from '../../store/gameStore';
import type { CombatEntity, CombatLogEntry, EnemyType } from '../../lib/combat';
import { calculatePlayerCombatInfo, resolveCombatTurn, generateEnemy } from '../../lib/combat';
import { motion, AnimatePresence } from 'framer-motion';
import { Sword, Shield, Heart, Zap, Skull, Crosshair, Sparkles, Flame, Droplets } from 'lucide-react';
import BackpackItem from './BackpackItem';
import type { InventoryItemInstance } from '../../types';

const AutoBattler: React.FC = () => {
    const items = useStore($itemsOnGrid);

    // Initial State Setup
    const [player, setPlayer] = useState<CombatEntity | null>(null);
    const [enemy, setEnemy] = useState<CombatEntity | null>(null);
    const [combatLog, setCombatLog] = useState<CombatLogEntry[]>([]);
    const [round, setRound] = useState(0);
    const [isFighting, setIsFighting] = useState(false);

    // Initialize Combat on Mount
    useEffect(() => {
        const info = calculatePlayerCombatInfo(items);
        setPlayer({
            hp: 100,
            maxHp: 100,
            mana: info.stats.maxMana || 20,
            stats: info.stats,
            synergies: info.synergies,
            statuses: [],
            name: "Hero"
        });

        // Initialize Enemy
        const types: EnemyType[] = ['AGGRESSIVE', 'DEFENSIVE', 'SWARM', 'EVASIVE'];
        const type = types[Math.floor(Math.random() * types.length)];
        setEnemy(generateEnemy(type, 1)); // Difficulty 1
        setCombatLog([]);
        setRound(1);
    }, [items]);

    const handleRound = () => {
        if (!player || !enemy || player.hp <= 0 || enemy.hp <= 0) return;

        setIsFighting(true);
        // Simulate "Loop" time
        setTimeout(() => setIsFighting(false), 1000);

        const result = resolveCombatTurn(player, enemy, round);

        setPlayer(result.player);
        setEnemy(result.enemy);
        setCombatLog(prev => [...prev, ...result.log]);
        setRound(prev => prev + 1);

        if (result.enemy.hp <= 0) {
            setCombatLog(prev => [...prev, { round: round + 1, message: "VICTORY!", type: 'INFO' }]);
        } else if (result.player.hp <= 0) {
            setCombatLog(prev => [...prev, { round: round + 1, message: "DEFEAT...", type: 'INFO' }]);
        }
    };

    if (!player || !enemy) return <div>Loading Combat...</div>;

    return (
        <div className="w-full max-w-5xl mx-auto bg-slate-900/90 border-2 border-slate-700 rounded-xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
            {/* Left: Combat View */}
            <div className="flex-1 p-6 relative">
                {/* Player Side */}
                <div className="mb-8 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2 justify-between">
                        <span className="text-green-400">YOU (Inventory)</span>
                        <div className="flex gap-2">
                            {player.statuses.map((s, i) => (
                                <span key={i} className="text-xs px-2 py-1 rounded bg-black border border-slate-600 flex items-center gap-1">
                                    {s.type === 'POISON' && <Droplets size={12} className="text-green-500" />}
                                    {s.type === 'FIRE' && <Flame size={12} className="text-orange-500" />}
                                    {s.type} ({s.value})
                                </span>
                            ))}
                        </div>
                    </h3>

                    {/* Combat Grid Render */}
                    <div className="relative bg-slate-900/50 rounded-lg border-2 border-slate-700/50 mb-4 overflow-hidden"
                        style={{ width: '100%', paddingBottom: '100%', height: 0 }}>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="relative" style={{ width: 8 * 40, height: 8 * 40 }}>
                                {items.map(item => (
                                    <CombatItemVisual key={item.instanceId} item={item} round={round} isFighting={isFighting} />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 mb-4">
                        <StatBox icon={<Sword size={16} className="text-red-400" />} value={player.stats.damage} label="DMG" />
                        <StatBox icon={<Shield size={16} className="text-blue-400" />} value={player.stats.defense} label="DEF" />
                        <StatBox icon={<Heart size={16} className="text-green-400" />} value={player.stats.block} label="BLK" />
                        <StatBox icon={<Heart size={16} className="text-green-400" />} value={player.hp} label="HP" />
                        <StatBox icon={<Zap size={16} className="text-yellow-400" />} value={player.stats.speed} label="SPD" />
                        <StatBox icon={<Crosshair size={16} className="text-purple-400" />} value={player.stats.accuracy} label="ACC" />
                        <StatBox icon={<Sparkles size={16} className="text-cyan-400" />} value={`${player.mana}/${player.stats.maxMana}`} label="MANA" />
                    </div>
                </div>

                {/* VS Divider */}
                <div className="text-center text-slate-600 font-black text-2xl my-4 opacity-50">VS</div>

                {/* Enemy Side */}
                <div className="mt-8 text-right p-4 bg-red-900/10 rounded-lg border border-red-900/30">
                    <h3 className="text-xl font-bold text-red-500 mb-2 flex items-center gap-2 justify-end">
                        <div className="flex gap-2 mr-auto">
                            {enemy.statuses.map((s, i) => (
                                <span key={i} className="text-xs px-2 py-1 rounded bg-black border border-red-900 flex items-center gap-1">
                                    {s.type === 'POISON' && <Droplets size={12} className="text-green-500" />}
                                    {s.type === 'FIRE' && <Flame size={12} className="text-orange-500" />}
                                    {s.type} ({s.value})
                                </span>
                            ))}
                        </div>
                        <span>{enemy.name}</span>
                        <Skull size={24} />
                    </h3>
                    <div className="w-full bg-slate-800 h-6 rounded-full overflow-hidden border border-slate-600 relative">
                        <motion.div
                            className="h-full bg-red-600"
                            initial={{ width: '100%' }}
                            animate={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white shadow-black drop-shadow-md">
                            {enemy.hp} / {enemy.maxHp}
                        </div>
                    </div>
                </div>

                {/* Action Bar */}
                <div className="mt-8 flex justify-center">
                    <button
                        onClick={handleRound}
                        disabled={enemy.hp <= 0 || player.hp <= 0}
                        className="bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-3 px-8 rounded-full shadow-lg hover:shadow-red-500/50 transition-all active:scale-95 flex items-center gap-2"
                    >
                        <Sword size={20} />
                        FIGHT NEXT ROUND
                    </button>
                </div>
            </div>

            {/* Right: Combat Log */}
            <div className="w-full md:w-80 bg-black/40 border-l border-slate-700 p-4 flex flex-col h-96 md:h-auto">
                <h4 className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-4 border-b border-slate-700 pb-2">Combat Log</h4>
                <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-slate-700 pr-2">
                    <AnimatePresence>
                        {combatLog.map((entry, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`text-xs md:text-sm p-2 rounded border-l-2 ${entry.type === 'DAMAGE' ? 'border-red-500 bg-red-900/20 text-red-200' :
                                        entry.type === 'BLOCK' ? 'border-blue-500 bg-blue-900/20 text-blue-200' :
                                            entry.type === 'HEAL' ? 'border-green-500 bg-green-900/20 text-green-200' :
                                                entry.type === 'MISS' ? 'border-yellow-500 bg-yellow-900/20 text-yellow-200' :
                                                    'border-slate-500 bg-slate-800/50 text-slate-300'
                                    }`}
                            >
                                <span className="opacity-50 mr-2">[R{entry.round}]</span>
                                {entry.message}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    <div ref={(el) => el?.scrollIntoView({ behavior: 'smooth' })} />
                </div>
            </div>
        </div>
    );
};

const CombatItemVisual = ({ item, round, isFighting }: { item: InventoryItemInstance, round: number, isFighting: boolean }) => {
    // We need internal state for the animation loop
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        if (isFighting) {
            setCooldown(100);
            const timer = setTimeout(() => setCooldown(0), 900); // drain over 900ms
            return () => clearTimeout(timer);
        }
    }, [isFighting, round]);

    return (
        <div style={{
            position: 'absolute',
            left: item.x * 40,
            top: item.y * 40,
            transform: `scale(0.9)`
        }}>
            <BackpackItem
                item={item}
                draggedInstanceId={null}
                onDragStart={() => { }}
                onDrag={() => { }}
                onDragEnd={() => { }}
                CELL_SIZE={40} // Smaller for combat view
                GAP={2}
                cooldown={cooldown}
                minX={0}
                minY={0}
            />
        </div>
    );
}

const StatBox = ({ icon, value, label, max }: { icon: React.ReactNode, value: number | string, label: string, max?: string }) => (
    <div className="bg-slate-900 p-2 rounded flex flex-col items-center border border-slate-700">
        <div className="mb-1">{icon}</div>
        <span className="text-lg font-black text-white">{value}{max && <span className="text-xs text-blue-300">{max}</span>}</span>
        <span className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</span>
    </div>
);

export default AutoBattler;
