import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { $gameState, $itemsOnGrid, damageMorale, addRandomLoot, completeEncounter, $players } from '../../store/gameStore';
import { calculateCombatPower, resolveCombatTurn, calculatePlayerCombatInfo, type CombatEntity } from '../../lib/combat';
import { motion, AnimatePresence } from 'framer-motion';
import { playSound } from '../../lib/sounds';

interface FloatingText {
    id: string;
    text: string;
    x: number;
    y: number;
    color: string;
}

const Encounter: React.FC = () => {
    const gameState = useStore($gameState);
    const items = useStore($itemsOnGrid);
    const players = useStore($players);
    const selectedPath = gameState.selectedPath;

    // Filter items to only include those owned by players on the current path
    const activePlayers = players.filter(p => p.currentPath === selectedPath).map(p => p.id);
    const pathItems = items.filter(i => activePlayers.includes(i.ownerId));

    const [feedback, setFeedback] = useState<string | null>(null);
    const [combatState, setCombatState] = useState<{ player: CombatEntity, enemy: CombatEntity } | null>(null);
    const [isFighting, setIsFighting] = useState(false);
    const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
    const [shake, setShake] = useState(0);

    // Difficulty scales slightly with day?
    const difficulty = gameState.day * 15; // Day 1=15, Day 5=75
    const power = calculateCombatPower(pathItems);

    const addFloatingText = (text: string, x: number, y: number, color: string) => {
        const id = Math.random().toString(36).substr(2, 9);
        setFloatingTexts(prev => [...prev, { id, text, x, y, color }]);
        setTimeout(() => {
            setFloatingTexts(prev => prev.filter(ft => ft.id !== id));
        }, 1000);
    };

    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const handleFight = async () => {
        setIsFighting(true);
        // Create Mock Player Entity from Items
        const { stats, synergies, onHitEffects } = calculatePlayerCombatInfo(pathItems);
        const playerEntity: CombatEntity = {
            name: "Expedition",
            hp: 100, // Shared HP?
            maxHp: 100,
            mana: 0,
            stats,
            statuses: [],
            synergies,
            onHitEffects
        };

        // Create Enemy (Generic for now, based on threat)
        const enemyEntity: CombatEntity = {
            name: "Wild Beast",
            hp: difficulty * 2,
            maxHp: difficulty * 2,
            mana: 0,
            stats: {
                damage: 5 + Math.floor(difficulty / 5),
                defense: 0,
                block: 0,
                heal: 0,
                speed: 5,
                accuracy: 90,
                maxMana: 0,
                manaRegen: 0
            },
            statuses: [],
            synergies: []
        };

        let p = playerEntity;
        let e = enemyEntity;
        setCombatState({ player: p, enemy: e });

        // Simulating 5 turns
        let victory = false;

        for (let r = 1; r <= 5; r++) {
            await wait(800);
            const res = resolveCombatTurn(p, e, r);

            // Process Log for Effects
            for (const entry of res.log) {
                await wait(400); // Stagger events

                // Determine who was hit/acted based on message (Simple heuristic for now)
                // Ideally log would have source/target IDs.
                const isPlayerAction = entry.message.startsWith("You");
                // const isEnemyAction = entry.message.includes(e.name); // Unused

                if (entry.type === 'DAMAGE') {
                    playSound.combatHit();
                    setShake(prev => prev + 1);
                    // If player damaged enemy
                    if (entry.message.includes(e.name) && entry.message.includes("hit")) {
                        addFloatingText(entry.message.match(/\d+/)?.[0] || "Hit", 200, -50, '#ef4444');
                    }
                    // If enemy damaged player
                    if (entry.message.includes("attacks for")) {
                        addFloatingText(entry.message.match(/\d+/)?.[0] || "Hit", -200, -50, '#ef4444');
                    }
                    // Keep existing sound logic or move it here? 
                    // Moving it here for sync.
                } else if (entry.type === 'BLOCK') {
                    playSound.combatBlock();
                    addFloatingText("Blocked", isPlayerAction ? -200 : 200, -80, '#3b82f6');
                } else if (entry.type === 'MISS') {
                    playSound.combatMiss();
                    addFloatingText("Miss", isPlayerAction ? 200 : -200, -80, '#9ca3af');
                }
            }

            p = res.player;
            e = res.enemy;
            setCombatState({ player: p, enemy: e }); // Update UI

            if (e.hp <= 0) {
                victory = true;
                break;
            }
            if (p.hp <= 0) break;
        }

        const success = victory || (p.hp > e.hp); // Win if killed or have more HP after 5 rounds

        await wait(1000);

        // Apply consequences immediately
        if (!success) {
            playSound.defeat();
            damageMorale(20);
            addRandomLoot('curse_scrap');
            console.log("Defeat! Morale lost and Cursed Scrap added.");
        } else {
            playSound.fanfare();
            console.log("Victory!");
        }

        const current = $gameState.get();
        // Update result locally for display (since gameStore might not store detailed result in history yet? 
        // Actually completeEncounter doesn't take result object, just success boolean.
        // But we added lastEncounterResult to GameState in types!

        $gameState.set({
            ...current,
            lastEncounterResult: {
                success,
                score: p.hp,
                difficulty,
                message: success ? "Victory!" : "Defeat!"
            }
        });

        // Mark as resolved and move to results
        completeEncounter(success);
        setIsFighting(false);
    };

    const handleTacticalLoss = () => {
        // Find a random player on this path to take the scrap
        const randomVictimId = activePlayers[Math.floor(Math.random() * activePlayers.length)];

        // Intentionally lose to get Cursed Scrap
        damageMorale(15);
        addRandomLoot('curse_scrap', randomVictimId);
        playSound.defeat();

        setFeedback("Scavenged Cursed Scrap! (-15 Morale)");

        setTimeout(() => {
            $gameState.set({
                ...$gameState.get(),
                lastEncounterResult: {
                    success: false,
                    score: 0,
                    difficulty: difficulty,
                    message: "Tactical Defeat. You found something in the darkness..."
                }
            });
            completeEncounter(false);
        }, 1500);
    };

    return (
        <motion.div
            animate={{ x: shake % 2 === 0 ? 0 : [0, -10, 10, -10, 10, 0] }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center text-parchment-100 p-8 h-full relative"
        >
            <h2 className="text-5xl font-black mb-8 text-red-500 tracking-wider">ENCOUNTER!</h2>

            <div className="flex gap-32 mb-12 items-center relative">
                {/* ENEMY */}
                <div className="flex flex-col items-center relative">
                    <div className="text-2xl text-parchment-400 mb-2">
                        {isFighting && combatState ? combatState.enemy.name : "THREAT"}
                    </div>
                    {isFighting && combatState ? (
                        <div className="relative">
                            <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="text-6xl font-black text-red-500"
                            >
                                {combatState.enemy.hp}
                            </motion.div>
                            {/* HP Bar */}
                            <div className="w-32 h-4 bg-red-900 rounded-full mt-2 overflow-hidden border border-red-500">
                                <motion.div
                                    className="h-full bg-red-500"
                                    initial={{ width: '100%' }}
                                    animate={{ width: `${(combatState.enemy.hp / combatState.enemy.maxHp) * 100}%` }}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="text-6xl font-black text-red-500">{difficulty}</div>
                    )}
                </div>

                <div className="text-4xl font-bold text-parchment-500">VS</div>

                {/* PLAYER */}
                <div className="flex flex-col items-center relative">
                    <div className="text-2xl text-parchment-400 mb-2">
                        {isFighting ? "PARTY" : "POWER"}
                    </div>
                    {isFighting && combatState ? (
                        <div className="relative">
                            <div className="text-6xl font-black text-green-400">
                                {combatState.player.hp}
                            </div>
                            <div className="w-32 h-4 bg-green-900 rounded-full mt-2 overflow-hidden border border-green-500">
                                <motion.div
                                    className="h-full bg-green-500"
                                    initial={{ width: '100%' }}
                                    animate={{ width: `${(combatState.player.hp / combatState.player.maxHp) * 100}%` }}
                                />
                            </div>
                        </div>
                    ) : (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className={`text-6xl font-black ${power >= difficulty ? 'text-green-400' : 'text-yellow-500'}`}
                        >
                            {power}
                        </motion.div>
                    )}
                </div>

                {/* Floating Texts Layer */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <AnimatePresence>
                        {floatingTexts.map(ft => (
                            <motion.div
                                key={ft.id}
                                initial={{ opacity: 1, y: 0, scale: 0.5 }}
                                animate={{ opacity: 0, y: -100, scale: 1.5 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 1 }}
                                style={{
                                    position: 'absolute',
                                    left: ft.x > 0 ? '60%' : '20%', // Rough positioning relative to center
                                    top: '40%',
                                    color: ft.color,
                                    textShadow: '0 0 5px black',
                                    fontSize: '3rem',
                                    fontWeight: '900'
                                }}
                            >
                                {ft.text}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            <p className="mb-8 text-xl text-parchment-300 max-w-md text-center">
                {isFighting ? "Combat in progress..." : "A wild beast blocks your path! Do you have the strength to drive it back?"}
            </p>

            {!isFighting && (
                <div className="flex gap-8">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleFight}
                        className="bg-red-700 hover:bg-red-600 text-white font-bold py-4 px-12 rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.5)] transition-all border-4 border-red-900 text-2xl"
                    >
                        FIGHT!
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleTacticalLoss}
                        className="bg-purple-900 hover:bg-purple-800 text-purple-200 font-bold py-4 px-8 rounded-xl shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all border-4 border-purple-500 text-xl flex flex-col items-center justify-center leading-tight"
                    >
                        <span>SCAVENGE</span>
                        <span className="text-sm font-normal opacity-70">(Take Damage)</span>
                    </motion.button>
                </div>
            )}

            {feedback && (
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute inset-0 flex items-center justify-center bg-black/60 z-50 pointer-events-none"
                >
                    <div className="bg-purple-900 border-4 border-purple-500 p-8 rounded-2xl shadow-[0_0_50px_rgba(147,51,234,0.5)] text-center">
                        <div className="text-4xl font-black text-purple-200 mb-2">SCAVENGED!</div>
                        <div className="text-xl text-purple-300">{feedback}</div>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
};

export default Encounter;
