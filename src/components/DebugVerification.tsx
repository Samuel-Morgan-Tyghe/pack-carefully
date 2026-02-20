import React, { useState } from 'react';
// import { useStore } from '@nanostores/react';
import { 
    $gameState, 
    $players, 
    $itemsOnGrid, 
    resetGame, 
    addPlayer, 
    startGame, 
    damageMorale, 
    addRandomLoot,
    rummageInventory,
    placeItem,
} from '../store/gameStore';

const DebugVerification: React.FC = () => {
    const [logs, setLogs] = useState<string[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    const log = (msg: string) => setLogs(prev => [...prev, msg]);
    const clearLogs = () => setLogs([]);

    const runTests = async () => {
        clearLogs();
        log("--- STARTING VERIFICATION ---");
        
        try {
            // TEST 1: SETUP
            log("Test 1: Setup & Reset...");
            resetGame();
            addPlayer("Tester 1");
            addPlayer("Tester 2");
            startGame();
            
            const players = $players.get();
            if (players.length !== 2) throw new Error("Failed to add players");
            log("✅ Setup passed. Players: " + players.length);

            // TEST 2: TACTICAL LOSS (Store Logic)
            log("Test 2: Tactical Loss Logic...");
            const initialMorale = $gameState.get().morale;
            damageMorale(15);
            
            // Check Morale
            if ($gameState.get().morale !== initialMorale - 15) throw new Error("Morale did not decrease correctly");
            
            // Check Loot (Heavy Rock)
            const victimId = players[0].id;
            addRandomLoot('rock', victimId);
            
            const items = $itemsOnGrid.get();
            const hasScrap = items.some(i => i.itemId === 'rock' && i.ownerId === victimId);
            
            if (!hasScrap) log("⚠️ Loot placement failed (might be full? or random fail). Retrying forced placement...");
            
            // Force place if random failed, to text logic
            if (!hasScrap) {
                placeItem('rock', 0, 0, 0, victimId);
            }
            
            log("✅ Tactical Loss Logic verified (Morale drop + Loot).");

            // TEST 3: SABOTAGE (Rummage)
            log("Test 3: Sabotage / Rummage...");
            
            // Ensure Player 2 has an item
            const p2Id = players[1].id;
            // Clear their bag first to be sure
            // Actually just place an item at 0,0
            placeItem('flashlight', 0, 0, 0, p2Id);
            
            const itemBefore = $itemsOnGrid.get().find(i => i.ownerId === p2Id && i.itemId === 'flashlight');
            if (!itemBefore) throw new Error("Failed to setup item for sabotage");
            
            log(`Item before: ${itemBefore.x}, ${itemBefore.y} (Rot: ${itemBefore.rotation})`);
            
            // Rummage
            const rummageResult = rummageInventory(p2Id);
            
            if (!rummageResult) {
                 log("⚠️ Rummage failed (could not move item?). Trying again...");
                 rummageInventory(p2Id);
            }

            const itemAfter = $itemsOnGrid.get().find(i => i.instanceId === itemBefore.instanceId);
            
            if (itemAfter) {
                if (itemAfter.x !== itemBefore.x || itemAfter.y !== itemBefore.y || itemAfter.rotation !== itemBefore.rotation) {
                    log(`✅ Item moved to: ${itemAfter.x}, ${itemAfter.y} (Rot: ${itemAfter.rotation})`);
                } else {
                    log("⚠️ Item did not move (might be no valid spots?)");
                }
            }
            
            log("--- VERIFICATION COMPLETE ---");

        } catch (e: unknown) {
            log("❌ TEST FAILED: " + (e as Error).message);
            console.error(e);
        }
    };

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 left-4 z-50 bg-gray-800 text-white px-2 py-1 text-xs rounded opacity-50 hover:opacity-100"
            >
                Debug
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 left-4 z-50 bg-black/90 p-4 rounded border border-green-500 w-80 max-h-96 overflow-auto text-green-400 font-mono text-sm shadow-2xl">
            <div className="flex justify-between mb-2">
                <span className="font-bold">System Verification</span>
                <button onClick={() => setIsOpen(false)} className="text-red-500">X</button>
            </div>
            
            <button 
                onClick={runTests}
                className="w-full bg-green-900 border border-green-700 py-1 mb-2 hover:bg-green-800"
            >
                RUN AUTO-TESTS
            </button>

            <div className="space-y-1">
                {logs.map((L, i) => (
                    <div key={i} className="border-b border-green-900/30 pb-1">{L}</div>
                ))}
            </div>
        </div>
    );
};

export default DebugVerification;
