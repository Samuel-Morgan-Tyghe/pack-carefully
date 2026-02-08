
import type { InventoryItemInstance } from '../types';
import { ITEMS } from './items';

export interface AdjacencyResult {
    instanceId: string;
    totalBuff: number;
    activeRules: string[]; // Descriptions of active buffs
}

export const getAdjacencyBonuses = (gridItems: InventoryItemInstance[]): Record<string, AdjacencyResult> => {
    const results: Record<string, AdjacencyResult> = {};

    // Initialize results
    gridItems.forEach(item => {
        results[item.instanceId] = {
            instanceId: item.instanceId,
            totalBuff: 0,
            activeRules: []
        };
    });

    // Helper to get cells occupied by an item
    const getItemCells = (item: InventoryItemInstance) => {
        const def = ITEMS[item.itemId];
        if(!def) return [];
        const w = (item.rotation === 90 || item.rotation === 270) ? def.height : def.width;
        const h = (item.rotation === 90 || item.rotation === 270) ? def.width : def.height;
        const cells = [];
        for(let x = 0; x < w; x++) {
            for(let y = 0; y < h; y++) {
                cells.push({ x: item.x + x, y: item.y + y });
            }
        }
        return cells;
    };

    // Helper to check adjacency between two items
    const areAdjacent = (itemA: InventoryItemInstance, itemB: InventoryItemInstance) => {
        const cellsA = getItemCells(itemA);
        const cellsB = getItemCells(itemB);

        return cellsA.some(cellA => 
            cellsB.some(cellB => {
                const dx = Math.abs(cellA.x - cellB.x);
                const dy = Math.abs(cellA.y - cellB.y);
                // Adjacent if sharing an edge (Manhattan distance = 1)
                return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
            })
        );
    };

    // Calculate bonuses
    for (let i = 0; i < gridItems.length; i++) {
        const sourceItem = gridItems[i];
        const sourceDef = ITEMS[sourceItem.itemId];

        if (!sourceDef?.adjacency) continue;

        for (let j = 0; j < gridItems.length; j++) {
            if (i === j) continue;
            const targetItem = gridItems[j];
            const targetDef = ITEMS[targetItem.itemId];

            if (areAdjacent(sourceItem, targetItem)) {
                // Check all rules from source
                sourceDef.adjacency.forEach(rule => {
                    let apply = false;
                    
                    if (rule.targetIds?.includes(targetItem.itemId)) {
                        apply = true;
                    }
                    if (rule.targetCategories?.includes(targetDef.category)) {
                        apply = true;
                    }

                    if (apply) {
                        // Apply buff to SOURCE or TARGET? 
                        // Usually adjacency buffs apply to the ITEM THAT HAS THE RULE (e.g. Sword gets +5 from Potion)
                        // OR the item GIVES the buff (Potion gives +5 to Sword).
                        // Design doc: "Sword: +5 DMG if next to Strength Potion" -> Sword has rule, checks for Potion.
                        // Design doc: "Shield: +5 Block to neighbors" -> Shield has rule, gives to Neighbors.
                        
                        // Let's standardise: Rules are "If I am next to X, I get Y" (Self-Buff)
                        // OR "I give Y to neighbors of type X" (Aura)
                        
                        // Current Type def: "targetCategories". 
                        // Let's assume "Aura" style for now based on "Potion boosts attack".
                        // So Source (Potion) buffs Target (Sword).
                        
                        // Wait, previous data:
                        // Potion: targetIds: ['sword'], effect: '+10 DMG'
                        // IMPLIES Potion gives buff to Sword.
                        
                        if (results[targetItem.instanceId]) {
                             results[targetItem.instanceId].totalBuff += rule.value;
                             results[targetItem.instanceId].activeRules.push(`From ${sourceDef.name}: ${rule.effect}`);
                        }
                    }
                });
            }
        }
    }

    return results;
};
