import type { InventoryItemInstance } from '../types';
import { ITEMS } from './items';

export interface SynergyEffect {
    sourceId: string;
    targetId: string;
    type: 'STATUS_MULTIPLIER' | 'CHAIN_REACTION' | 'COOLDOWN_REDUCTION' | 'ROW_BUFF';
    value: number; // e.g., 2 for Double, -1 for CD
    description: string;
}

export const calculateSynergies = (items: InventoryItemInstance[]): SynergyEffect[] => {
    const effects: SynergyEffect[] = [];
    
    // Map items to coordinates for easier adjacency checking
    // Note: Items occupy multiple cells. 
    // For specific "Left/Right" logic, we need to know relative positions.
    // Let's do a O(N^2) check since N is small (< 50 items max).
    
    // Helper to get centers or just compare bounds
    
    for (const source of items) {
        const sourceDef = ITEMS[source.itemId];
        if (!sourceDef) continue;

        // 1. Status Multiplier (Example: Poisonous item on LEFT doubles poison)
        // Check hardcoded rules for now, or add to Item definition later if generic.
        // Spec: "If item on Left is Poisonous, it applies Double Poison."
        // Let's assume a specific item "Catalyst" does this for now, or just generic rule?
        // Spec says: "If item on Left is Poisonous..." - implies a rule on the RIGHT item? Or the map?
        // Let's implement specific unique item logic here for the prototype.
        
        // Example: "Catalyst" (source) doubles poison of item on its RIGHT.
        if (source.itemId === 'catalyst') {
             const target = items.find(i => i.x === source.x + sourceDef.width && i.y === source.y); // Right neighbor
             if (target) {
                 const targetDef = ITEMS[target.itemId];
                 if (targetDef.effects?.some(e => e.type === 'POISON')) {
                     effects.push({
                         sourceId: source.instanceId,
                         targetId: target.instanceId,
                         type: 'STATUS_MULTIPLIER',
                         value: 2,
                         description: 'Doubles Poison'
                     });
                 }
             }
        }
        
        // Example: Chain Reaction "Fire next to Oil"
        if (sourceDef.effects?.some(e => e.type === 'FIRE')) {
             const neighbors = items.filter(i => isAdjacent(source, i));
             neighbors.forEach(n => {
                 if (n.itemId === 'oil_flask') { // specific item ID
                      effects.push({
                         sourceId: source.instanceId,
                         targetId: n.instanceId,
                         type: 'CHAIN_REACTION',
                         value: 20, // Boom damage
                         description: 'Explosion!'
                     });
                 }
             });
        }
        
    }

    return effects;
};

// Simple collision-based adjacency (Manhattan dist = 0 between bounds? No, sharing edge)
const isAdjacent = (a: InventoryItemInstance, b: InventoryItemInstance): boolean => {
    const aDef = ITEMS[a.itemId];
    const bDef = ITEMS[b.itemId];
    
    // Expand a by 1 unit in all directions and check intersection with b
    // Simply: ranges overlap in one dim, touch in other
    const aLeft = a.x; const aRight = a.x + (a.rotation % 180 === 0 ? aDef.width : aDef.height);
    const aTop = a.y; const aBottom = a.y + (a.rotation % 180 === 0 ? aDef.height : aDef.width);
    
    const bLeft = b.x; const bRight = b.x + (b.rotation % 180 === 0 ? bDef.width : bDef.height);
    const bTop = b.y; const bBottom = b.y + (b.rotation % 180 === 0 ? bDef.height : bDef.width);

    const horizontalOverlap = aLeft < bRight && aRight > bLeft;
    const verticalOverlap = aTop < bBottom && aBottom > bTop;
    
    const touchingHorizontal = (aRight === bLeft || aLeft === bRight) && verticalOverlap;
    const touchingVertical = (aBottom === bTop || aTop === bBottom) && horizontalOverlap;

    return touchingHorizontal || touchingVertical;
}

export const getDragHighlights = (heldItemType: string, _hoveredX: number, hoveredY: number, allItems: InventoryItemInstance[]): string[] => {
    // Returns IDs of cells or items to highlight
    // Example: "Row Buff" item highlights other items in row y
    const highlights: string[] = [];
    const heldDef = ITEMS[heldItemType];
    if (!heldDef) return [];

    // Hypothetical "Scope" item buffs entire row
    if (heldDef.id === 'scope') {
         // Highlight all items in row `hoveredY`
         allItems.forEach(item => {
             // check if item overlaps Y
             const itemDef = ITEMS[item.itemId];
             const h = (item.rotation % 180 === 0 ? itemDef.height : itemDef.width);
             if (item.y <= hoveredY && item.y + h > hoveredY) {
                 highlights.push(item.instanceId);
             }
         });
    }
    
    return highlights;
};
