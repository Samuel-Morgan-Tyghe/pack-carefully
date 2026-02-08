import React from 'react';
import { useStore } from '@nanostores/react';
import { $gameState, $itemsOnGrid, damageMorale, addRandomLoot, completeEncounter, $players } from '../../store/gameStore';
import { calculateCombatPower, resolveCombatTurn, calculatePlayerCombatInfo, type CombatEntity } from '../../lib/combat';
import { motion } from 'framer-motion';
import { playSound } from '../../lib/sounds';

const Encounter: React.FC = () => {
    const gameState = useStore($gameState);
    const items = useStore($itemsOnGrid);
    const players = useStore($players);
    const selectedPath = gameState.selectedPath;

    // Filter items to only include those owned by players on the current path
    const activePlayers = players.filter(p => p.currentPath === selectedPath).map(p => p.id);
    const pathItems = items.filter(i => activePlayers.includes(i.ownerId));
    
    const [feedback, setFeedback] = React.useState<string | null>(null);

    // Difficulty scales slightly with day?
    const difficulty = gameState.day * 15; // Day 1=15, Day 5=75
    const power = calculateCombatPower(pathItems);

    const handleFight = () => {
        // Create Mock Player Entity from Items
        const { stats, synergies } = calculatePlayerCombatInfo(pathItems);
        const playerEntity: CombatEntity = {
            name: "Expedition",
            hp: 100, // Shared HP?
            maxHp: 100,
            mana: 0,
            stats,
            statuses: [],
            synergies
        };

        // Create Enemy (Generic for now, based on threat)
        const enemyEntity: CombatEntity = {
            name: "Wild Beast",
            hp: difficulty * 2,
            maxHp: difficulty * 2,
            mana: 0,
            stats: { 
                damage: 5 + Math.floor(difficulty/5), 
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
        
        // Resolve a single turn or full combat? 
        // For "Journey Phase" quick encounter, maybe just 1 turn or simulation?
        // Let's do a simple check: Power vs Difficulty + Random
        // If Power > Difficulty, huge advantage.
        
        // Simulating 5 turns
        let p = playerEntity;
        let e = enemyEntity;
        let victory = false;
        
        for(let r=1; r<=5; r++) {
             const res = resolveCombatTurn(p, e, r);
             p = res.player;
             e = res.enemy;
             if (e.hp <= 0) {
                 victory = true;
                 break;
             }
             if (p.hp <= 0) break;
        }
        
        const success = victory || (p.hp > e.hp); // Win if killed or have more HP after 5 rounds
        
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
        <div className="flex flex-col items-center justify-center text-parchment-100 p-8 h-full">
            <h2 className="text-5xl font-black mb-8 text-red-500 tracking-wider">ENCOUNTER!</h2>
            
            <div className="flex gap-16 mb-12 items-center">
                {/* THREAT */}
                <div className="flex flex-col items-center">
                    <div className="text-2xl text-parchment-400 mb-2">THREAT</div>
                    <div className="text-6xl font-black text-red-500">{difficulty}</div>
                </div>

                <div className="text-4xl font-bold text-parchment-500">VS</div>

                {/* POWER */}
                <div className="flex flex-col items-center">
                    <div className="text-2xl text-parchment-400 mb-2">POWER</div>
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`text-6xl font-black ${power >= difficulty ? 'text-green-400' : 'text-yellow-500'}`}
                    >
                        {power}
                    </motion.div>
                </div>
            </div>

            <p className="mb-8 text-xl text-parchment-300 max-w-md text-center">
                A wild beast blocks your path! Do you have the strength to drive it back?
            </p>

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
        </div>
    );
};

export default Encounter;
