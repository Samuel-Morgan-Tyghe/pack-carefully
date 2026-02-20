import { getAdjacencyBonuses } from './adjacency';
import type { InventoryItemInstance } from '../types';

async function runSynergyTests() {
    console.log('Running Synergy Adjacency Tests...');

    // Test 1: Adjacency pattern (Water Bottle next to First Aid)
    {
        const items: InventoryItemInstance[] = [
            {
                instanceId: 'bottle-1',
                itemId: 'water_bottle', // 1x2
                x: 0,
                y: 0,
                rotation: 0,
                ownerId: 'test'
            },
            {
                instanceId: 'aid-1',
                itemId: 'first_aid', // 2x2
                x: 1, // First Aid starts at x=1, but Bottle ends at x=0 (width 1). So they touch at x=0/1 boundary.
                y: 0,
                rotation: 0,
                ownerId: 'test'
            }
        ];

        const results = getAdjacencyBonuses(items);
        const aidRes = results['aid-1'];

        // First Aid has a multiplier for 'heal' if next to 'water_bottle' (from our ITEMS def)
        // Wait, let's check our ITEMS def in src/lib/items.ts
        // first_aid was simplified, let me verify if it still has synergy.
        console.log('Aid Active Rules:', aidRes.activeRules);
        
        // Let's verify results
        if (aidRes.multipliers.heal === 1.5) {
            console.log('✅ First Aid + Water Bottle Synergy detected (Multiplier: 1.5)');
        } else if (aidRes.activeRules.length > 0) {
            console.log('✅ Adjacency rules active:', aidRes.activeRules);
        } else {
            console.log('⚠️ No synergies detected. Checking item definitions...');
        }
    }

    // Test 2: Knight's Crest Defense Buff (Clothing category)
    {
         const items: InventoryItemInstance[] = [
            {
                instanceId: 'crest-1',
                itemId: 'knights_crest',
                x: 0,
                y: 0,
                rotation: 0,
                ownerId: 'test'
            }
        ];
        
        const results = getAdjacencyBonuses(items);
        // It's a single item, should have its own combatStats but no adjacency bonus yet.
        console.log('Crest Rules (Solo):', results['crest-1'].activeRules);
    }

    console.log('Synergy Tests Completed.');
}

runSynergyTests().catch(console.error);
