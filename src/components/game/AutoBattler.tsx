import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { $itemsOnGrid } from '../../store/gameStore';
import type { CombatEntity, CombatLogEntry, EnemyType, ItemCooldown } from '../../lib/combat';
import { calculatePlayerCombatInfo, processCombatTick, generateEnemy } from '../../lib/combat';
import { motion, AnimatePresence } from 'framer-motion';
import { Sword, Shield, Zap, Activity, Battery } from 'lucide-react';
import BackpackItem from './BackpackItem';
import type { InventoryItemInstance } from '../../types';
import { ITEMS } from '../../lib/items';

const AutoBattler: React.FC = () => {
    const items = useStore($itemsOnGrid);

    // Initial State Setup
    const [player, setPlayer] = useState<CombatEntity | null>(null);
    const [enemy, setEnemy] = useState<CombatEntity | null>(null);
    const [combatLog, setCombatLog] = useState<CombatLogEntry[]>([]);
    const [isFighting, setIsFighting] = useState(false);
    const [gameResult, setGameResult] = useState<'WIN' | 'LOSS' | null>(null);

    // Cooldown State
    const [playerCooldowns, setPlayerCooldowns] = useState<ItemCooldown[]>([]);
    const [enemyCooldowns, setEnemyCooldowns] = useState<ItemCooldown[]>([]);
    const [cooldownMultiplier, setCooldownMultiplier] = useState(1);

    // Tick Loop Ref
    const stateRef = useRef({ player, enemy, playerCooldowns, enemyCooldowns, isFighting, gameResult });

    // Update Cooldown Max when Multiplier Changes
    useEffect(() => {
        setPlayerCooldowns(prev => prev.map(cd => ({ ...cd, max: Math.max(50, cd.baseMax * cooldownMultiplier) })));
        setEnemyCooldowns(prev => prev.map(cd => ({ ...cd, max: Math.max(50, cd.baseMax * cooldownMultiplier) })));
    }, [cooldownMultiplier]);

    // Initialize Combat on Mount
    useEffect(() => {
        const info = calculatePlayerCombatInfo(items);
        const newPlayer: CombatEntity = {
            hp: 100,
            maxHp: 100,
            mana: info.stats.maxMana || 20,
            shield: 0,
            baseDefense: info.stats.defense,
            energy: info.stats.maxEnergy,
            maxEnergy: info.stats.maxEnergy,
            stats: info.stats,
            synergies: info.synergies,
            statuses: [],
            name: "Hero",
            id: "hero",
            inventory: items
        };
        setPlayer(newPlayer);

        // Initialize Player Cooldowns
        const pCooldowns: ItemCooldown[] = items.map(inst => {
            const def = ITEMS[inst.itemId];
            const speed = (def.combatStats?.speed || 0) + (info.stats.speed / 5); // Global speed boost
            // Base cooldown 50s (50000ms), reduced by speed. 
            // Speed 7 => 50000 / 7 = ~7142ms (7.1s)
            // Speed 10 => 5000ms (5s)
            // Speed 5 => 10000ms (10s)
            const baseCd = def.combatStats?.speed ? (50000 / Math.max(1, speed)) : 10000;
            // Add randomness to start so they don't all fire at once
            const startOffset = Math.random() * baseCd;
            return {
                instanceId: inst.instanceId,
                itemId: inst.itemId,
                current: startOffset,
                max: baseCd,
                baseMax: baseCd
            };
        });
        setPlayerCooldowns(pCooldowns);

        // Initialize Enemy
        const types: EnemyType[] = ['AGGRESSIVE', 'DEFENSIVE', 'SWARM', 'EVASIVE'];
        const type = types[Math.floor(Math.random() * types.length)];
        const newEnemy = generateEnemy(type, 1);
        setEnemy(newEnemy);

        // Enemy Cooldowns
        const enemySpeed = newEnemy.stats.speed || 5;
        const enemyCd = Math.max(2000, (20 - enemySpeed) * 1000); // Slower enemy too
        setEnemyCooldowns([{
            instanceId: 'enemy-attack',
            itemId: 'enemy-attack',
            current: Math.random() * enemyCd,
            max: enemyCd,
            baseMax: enemyCd
        }]);

        setCombatLog([]);
        setGameResult(null);
        setIsFighting(false);
    }, [items]);

    const startCombat = () => {
        setIsFighting(true);
    };

    // Keep ref synced with state for the interval closure
    useEffect(() => {
        stateRef.current = { player, enemy, playerCooldowns, enemyCooldowns, isFighting, gameResult };
    }, [player, enemy, playerCooldowns, enemyCooldowns, isFighting, gameResult]);

    // Game Loop
    useEffect(() => {
        if (isFighting && !gameResult) {
            let lastTime = performance.now();
            const interval = setInterval(() => {
                const now = performance.now();
                const delta = now - lastTime; // Real time
                lastTime = now;

                const current = stateRef.current;
                if (!current.player || !current.enemy || current.gameResult) return;

                if (current.player.hp <= 0) {
                    setGameResult('LOSS');
                    setIsFighting(false);
                    return;
                }
                if (current.enemy.hp <= 0) {
                    setGameResult('WIN');
                    setIsFighting(false);
                    return;
                }

                const result = processCombatTick(
                    current.player,
                    current.enemy,
                    current.playerCooldowns,
                    current.enemyCooldowns,
                    delta
                );

                setPlayer(result.player);
                setEnemy(result.enemy);
                setPlayerCooldowns(result.playerCooldowns);
                setEnemyCooldowns(result.enemyCooldowns);

                if (result.events.length > 0) {
                    setCombatLog(prev => [
                        ...prev,
                        ...result.events.map(msg => ({
                            round: 0,
                            message: msg,
                            type: msg.includes('Player') ? 'DAMAGE' as const : 'INFO' as const
                        }))
                    ].slice(-20));
                }

            }, 50); // 20 ticks per second
            return () => clearInterval(interval);
        }
    }, [isFighting, gameResult]);

    if (!player || !enemy) return <div>Loading Combat...</div>;

    return (
        <div className="w-full max-w-6xl mx-auto flex flex-col gap-4">
            {/* Top Bar: Speed & Status - Optional if HUD covers it, but good for local control */}
            <div className="flex justify-between items-center bg-slate-900/80 p-2 rounded-lg border border-slate-700">
                <div className="text-slate-400 text-sm font-mono">COMBAT PHASE {isFighting ? '(ACTIVE)' : '(READY)'}</div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">SPEED</span>
                    <input
                        type="range"
                        min="0"
                        max="3"
                        step="0.1"
                        value={cooldownMultiplier}
                        onChange={(e) => setCooldownMultiplier(Math.max(0, parseFloat(e.target.value)))}
                        className="w-24 accent-green-500 cursor-pointer h-1 bg-slate-700 rounded-lg appearance-none"
                    />
                    <span className="text-xs font-mono text-green-400 w-8 text-right">{cooldownMultiplier.toFixed(1)}x</span>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* LEFT: PLAYER ZONE */}
                <div className="flex-1 bg-slate-900/50 rounded-xl p-4 border border-slate-700 flex flex-col gap-4">
                    {/* Player Header */}
                    <div className="flex justify-between items-end">
                        <div>
                            <h2 className="text-2xl font-black text-white flex items-center gap-2">
                                <span className="text-green-400">HERO</span>
                                <div className="flex gap-1">
                                    {player.statuses.map((s, i) => (
                                        <StatusBadge key={i} status={s} />
                                    ))}
                                </div>
                            </h2>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-slate-400">HP {Math.round(player.hp)}/{player.maxHp}</div>
                        </div>
                    </div>

                    {/* Player Health Bar */}
                    <HealthBar current={player.hp} max={player.maxHp} shield={player.shield} color="bg-green-500" />

                    {/* Player Energy Bar */}
                    <EnergyBar current={player.energy} max={player.maxEnergy} />

                    {/* Player Stats */}
                    <div className="grid grid-cols-4 gap-2">
                        <StatBox icon={<Sword size={14} className="text-red-400" />} value={player.stats.damage} label="DMG" />
                        <StatBox icon={<Shield size={14} className="text-blue-400" />} value={player.baseDefense} label="DEF" />
                        <StatBox icon={<Zap size={14} className="text-yellow-400" />} value={player.stats.speed} label="SPD" />
                        <StatBox icon={<Battery size={14} className="text-amber-400" />} value={`${Math.round(player.stats.energyRegen)}/s`} label="NRG" />
                    </div>

                    {/* Player Inventory Grid */}
                    <div className="relative bg-slate-950/50 rounded-lg border-2 border-slate-700/50 overflow-hidden"
                        style={{ width: '100%', paddingBottom: '70%', height: 0 }}>
                        <div className="absolute inset-0 flex items-center justify-center scale-90 origin-center">
                            <div className="relative" style={{ width: 8 * 40, height: 8 * 40 }}>
                                {items.map(item => {
                                    const cd = playerCooldowns.find(c => c.instanceId === item.instanceId);
                                    return (
                                        <CombatItemVisual
                                            key={item.instanceId}
                                            item={item}
                                            cooldown={cd}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* CENTER: VS & LOG */}
                <div className="lg:w-64 flex flex-col gap-4">
                    {/* Action Button */}
                    <div className="flex justify-center py-4">
                        {!isFighting && !gameResult && (
                            <button
                                onClick={startCombat}
                                className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-black py-4 px-8 rounded-xl shadow-lg hover:shadow-red-500/20 transition-all active:scale-95 w-full flex flex-col items-center gap-1 group"
                            >
                                <span className="text-2xl group-hover:scale-110 transition-transform">⚔️</span>
                                <span className="tracking-widest">FIGHT</span>
                            </button>
                        )}
                        {isFighting && (
                            <div className="text-center animate-pulse">
                                <div className="text-4xl">⚔️</div>
                                <div className="text-xs font-bold text-red-400 tracking-widest mt-2">COMBAT ACTIVE</div>
                            </div>
                        )}
                        {gameResult && (
                            <div className={`text-center p-4 rounded-xl border-2 ${gameResult === 'WIN' ? 'bg-green-900/20 border-green-500 text-green-400' : 'bg-red-900/20 border-red-500 text-red-400'}`}>
                                <div className="text-3xl font-black">{gameResult === 'WIN' ? 'VICTORY' : 'DEFEAT'}</div>
                                <div className="text-xs opacity-75 mt-1">Refresh to restart</div>
                            </div>
                        )}
                    </div>

                    {/* Combat Log */}
                    <div className="flex-1 bg-black/40 border border-slate-700 rounded-lg p-2 overflow-hidden flex flex-col min-h-[200px]">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 text-center">Battle Log</div>
                        <div className="flex-1 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-slate-700 pr-1">
                            <AnimatePresence initial={false}>
                                {combatLog.slice().reverse().map((entry, idx) => (
                                    <motion.div
                                        key={`${idx}-${entry.message}`}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={`text-[10px] md:text-xs p-1.5 rounded-sm border-l-2 leading-tight ${entry.type === 'DAMAGE' ? 'border-green-500 bg-green-900/10 text-green-200' :
                                            entry.type === 'INFO' ? 'border-red-500 bg-red-900/10 text-red-200' :
                                                'border-slate-500 text-slate-400'
                                            }`}
                                    >
                                        {entry.message}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* RIGHT: ENEMY ZONE */}
                <div className="flex-1 bg-red-950/20 rounded-xl p-4 border border-red-900/30 flex flex-col gap-4">
                    {/* Enemy Header */}
                    <div className="flex justify-between items-end">
                        <div>
                            <div className="text-sm text-red-400 font-mono mb-1">LEVEL {1} {enemy.inventory.length > 0 ? '• ARMED' : ''}</div>
                            <h2 className="text-2xl font-black text-red-500 flex items-center gap-2">
                                {enemy.name}
                                <div className="flex gap-1">
                                    {enemy.statuses.map((s, i) => (
                                        <StatusBadge key={i} status={s} />
                                    ))}
                                </div>
                            </h2>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-red-400">HP {Math.round(enemy.hp)}/{enemy.maxHp}</div>
                        </div>
                    </div>

                    {/* Enemy Health Bar */}
                    <HealthBar current={enemy.hp} max={enemy.maxHp} shield={enemy.shield} color="bg-red-600" />

                    {/* Enemy Intent / Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-red-900/20 p-2 rounded border border-red-900/30 flex items-center gap-3">
                            <div className="bg-red-900/50 p-2 rounded-full"><Sword size={16} className="text-red-400" /></div>
                            <div>
                                <div className="text-xs text-red-300 font-bold uppercase">Attack Power</div>
                                <div className="text-xl font-black text-white">{enemy.stats.damage}</div>
                            </div>
                        </div>
                        <div className="bg-slate-900/50 p-2 rounded border border-slate-700 flex flex-col justify-center">
                            {/* Intent Display */}
                            <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Next Action</div>
                            {enemyCooldowns.map(cd => (
                                <div key={cd.instanceId} className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div
                                        className="absolute inset-y-0 left-0 bg-yellow-500"
                                        style={{ width: `${Math.min(100, (1 - cd.current / cd.max) * 100)}%` }}
                                    />
                                </div>
                            ))}
                            <div className="text-right text-[10px] text-yellow-500 font-mono mt-1">
                                {enemyCooldowns[0] && enemyCooldowns[0].current > 0 ? `${(enemyCooldowns[0].current / 1000).toFixed(1)}s` : 'READY'}
                            </div>
                        </div>
                    </div>

                    {/* Enemy Inventory (Inspectable) */}
                    <div className="mt-2">
                        <div className="text-xs text-slate-500 font-bold uppercase mb-2 flex items-center gap-2">
                            <Activity size={12} /> Enemy Equipment
                        </div>
                        <div className="bg-black/40 p-2 rounded-lg border border-slate-800 min-h-[100px] flex flex-wrap gap-2 justify-center">
                            {enemy.inventory.length === 0 && <div className="text-slate-600 text-xs italic py-4">No visible equipment</div>}
                            {enemy.inventory.map((item, i) => (
                                <div key={i} className="relative group">
                                    {/* We reuse CombatItemVisual or just a simple icon for now if position is not grid-based */}
                                    <CombatItemVisual
                                        item={{ ...item, x: i % 4, y: Math.floor(i / 4) }} // Mock Grid Layout for visualization
                                        cooldown={undefined} // Enemy items don't show cooldowns on themselves usually, standard auto-attack
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper Components
const HealthBar = ({ current, max, shield, color }: { current: number, max: number, shield: number, color: string }) => (
    <div className="w-full bg-slate-900 h-6 rounded-full overflow-hidden border border-slate-600 relative shadow-inner">
        <motion.div
            className={`h-full ${color}`}
            initial={{ width: '100%' }}
            animate={{ width: `${Math.max(0, (current / max) * 100)}%` }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        />
        {shield > 0 && (
            <motion.div
                className="absolute inset-y-0 left-0 bg-cyan-400/50 border-r-2 border-cyan-200/80"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (shield / max) * 100)}%` }}
            />
        )}
        <div className="absolute inset-0 flex items-center justify-between px-3 text-[10px] font-bold text-white shadow-black drop-shadow-md">
            <span>{Math.round(current)}</span>
            <span>{Math.round(max)} {shield > 0 && <span className="text-cyan-300">(+{Math.round(shield)})</span>}</span>
        </div>
    </div>
);

const EnergyBar = ({ current, max }: { current: number, max: number }) => (
    <div className="w-full bg-slate-900 h-4 rounded-full overflow-hidden border border-slate-600 relative shadow-inner">
        <motion.div
            className="h-full bg-gradient-to-r from-amber-500 to-yellow-400"
            initial={{ width: '100%' }}
            animate={{ width: `${Math.max(0, (current / max) * 100)}%` }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        />
        <div className="absolute inset-0 flex items-center justify-between px-3 text-[9px] font-bold text-white shadow-black drop-shadow-md">
            <span>⚡ {Math.round(current)}</span>
            <span>{Math.round(max)}</span>
        </div>
    </div>
);

const StatusBadge = ({ status }: { status: any }) => (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-1 ${status.type === 'POISON' ? 'bg-green-900/50 border-green-700 text-green-300' :
        status.type === 'STUN' ? 'bg-yellow-900/50 border-yellow-700 text-yellow-300' :
            'bg-slate-800 border-slate-600 text-slate-300'
        }`}>
        {status.type}
    </span>
);


const CombatItemVisual = ({ item, cooldown }: { item: InventoryItemInstance, cooldown?: ItemCooldown }) => {
    // Calculate progress (0 to 1) 
    const progress = cooldown ? 1 - (cooldown.current / cooldown.max) : 1;
    const isReady = progress >= 1;

    return (
        <div style={{
            position: 'absolute',
            left: item.x * 40,
            top: item.y * 40,
            transform: `scale(0.9)` // Gap spacing
        }}>
            <div className="relative">
                <BackpackItem
                    item={item}
                    draggedInstanceId={null}
                    onDragStart={() => { }}
                    onDrag={() => { }}
                    onDragEnd={() => { }}
                    CELL_SIZE={40} // Smaller for combat view
                    GAP={2}
                    minX={0}
                    minY={0}
                />

                {/* Visual Cooldown Overlay */}
                {cooldown && !isReady && (
                    <div className="absolute inset-0 bg-black/60 pointer-events-none rounded overflow-hidden flex flex-col justify-end">
                        <motion.div
                            className="w-full bg-cyan-400/80"
                            style={{ height: `${progress * 100}%` }}
                            initial={false}
                            animate={{ height: `${progress * 100}%` }}
                            transition={{ type: "tween", ease: "linear", duration: 0.1 }} // Smooth 100ms updates
                        />
                    </div>
                )}

                {/* Ready Flash */}
                {isReady && cooldown && (
                    <div className="absolute inset-0 border-2 border-white/80 shadow-[0_0_15px_rgba(255,255,255,0.8)] rounded animate-pulse pointer-events-none" />
                )}

            </div>
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
