import type { InventoryItemInstance, AdjacencyPattern } from '../types';
import { ITEMS } from './items';

export interface AdjacencyResult {
    instanceId: string;
    totalBuff: number;
    buffs: Record<string, number>; // stat -> additive value
    multipliers: Record<string, number>; // stat -> multiplier (e.g. { speed: 2 })
    activeRules: string[];
    boostedSquares: { x: number, y: number }[]; // Squares boosted by this item
}

export const getAdjacencyBonuses = (gridItems: InventoryItemInstance[]): Record<string, AdjacencyResult> => {
    const results: Record<string, AdjacencyResult> = {};
    const cellBoosts = new Map<string, Set<string>>();

    // Initialize results
    gridItems.forEach(item => {
        results[item.instanceId] = {
            instanceId: item.instanceId,
            totalBuff: 0,
            buffs: {},
            multipliers: {},
            activeRules: [],
            boostedSquares: []
        };
    });

    // Helper to get cells occupied by an item
    const getItemCells = (item: InventoryItemInstance) => {
        const def = ITEMS[item.itemId];
        if (!def) return [];
        const w = (item.rotation === 90 || item.rotation === 270) ? def.height : def.width;
        const h = (item.rotation === 90 || item.rotation === 270) ? def.width : def.height;
        const cells = [];
        for (let x = 0; x < w; x++) {
            for (let y = 0; y < h; y++) {
                cells.push({ x: item.x + x, y: item.y + y });
            }
        }
        return cells;
    };

    // Helper to rotate an offset based on item rotation
    const getRotatedOffset = (dx: number, dy: number, rotation: number) => {
        if (rotation === 90) return { rdx: -dy, rdy: dx };
        if (rotation === 180) return { rdx: -dx, rdy: -dy };
        if (rotation === 270) return { rdx: dy, rdy: -dx };
        return { rdx: dx, rdy: dy };
    };

    // Helper to check spatial relationship
    const checkPattern = (itemA: InventoryItemInstance, itemB: InventoryItemInstance, pattern: AdjacencyPattern) => {
        const cellsA = getItemCells(itemA);
        const cellsB = getItemCells(itemB);

        if (Array.isArray(pattern)) {
            // Apply each offset to EACH cell of itemA? 
            // Usually custom patterns are relative to ORIGN, but "surrounding" means relative to ALL cells.
            // Let's assume relative to the ITEM'S CELLS to be most flexible.
            return cellsA.some(ca =>
                pattern.some(off => {
                    const { rdx, rdy } = getRotatedOffset(off.dx, off.dy, itemA.rotation);
                    const targetX = ca.x + rdx;
                    const targetY = ca.y + rdy;
                    return cellsB.some(cb => cb.x === targetX && cb.y === targetY);
                })
            );
        }

        return cellsA.some(cellA =>
            cellsB.some(cellB => {
                const dx = Math.abs(cellA.x - cellB.x);
                const dy = Math.abs(cellA.y - cellB.y);

                if (pattern === 'ADJACENT') {
                    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
                }
                if (pattern === 'PARALLEL') {
                    // Parallel: item is 2 units away in one axis (gap of 1)
                    return (dx === 2 && dy === 0) || (dx === 0 && dy === 2);
                }
                if (pattern === 'TWO_ACROSS') {
                    // Two across: exactly 2 units away (could be interpreted as diagonal or further edge)
                    // Let's interpret as "2 cells distance"
                    return dx === 2 && dy === 2;
                }
                return false;
            })
        );
    };

    // First Pass: Identify Boosted Squares (Stars)
    gridItems.forEach(sourceItem => {
        const sourceDef = ITEMS[sourceItem.itemId];
        if (!sourceDef?.adjacency) return;

        sourceDef.adjacency.forEach(rule => {
            if (rule.type === 'BOOST_SQUARE') {
                const cells = getItemCells(sourceItem);

                if (Array.isArray(rule.pattern)) {
                    cells.forEach(cell => {
                        (rule.pattern as { dx: number, dy: number }[]).forEach((off) => {
                            const { rdx, rdy } = getRotatedOffset(off.dx, off.dy, sourceItem.rotation);
                            const t = { x: cell.x + rdx, y: cell.y + rdy };
                            const key = `${t.x},${t.y}`;
                            if (!cellBoosts.has(key)) cellBoosts.set(key, new Set());
                            cellBoosts.get(key)!.add(sourceItem.instanceId);
                            results[sourceItem.instanceId].boostedSquares.push(t);
                        });
                    });
                } else {
                    cells.forEach(cell => {
                        const targets: { x: number, y: number }[] = [];
                        if (rule.pattern === 'ADJACENT') {
                            targets.push({ x: cell.x + 1, y: cell.y }, { x: cell.x - 1, y: cell.y }, { x: cell.x, y: cell.y + 1 }, { x: cell.x, y: cell.y - 1 });
                        } else if (rule.pattern === 'PARALLEL') {
                            targets.push({ x: cell.x + 2, y: cell.y }, { x: cell.x - 2, y: cell.y }, { x: cell.x, y: cell.y + 2 }, { x: cell.x, y: cell.y - 2 });
                        }

                        targets.forEach(t => {
                            const key = `${t.x},${t.y}`;
                            if (!cellBoosts.has(key)) cellBoosts.set(key, new Set());
                            cellBoosts.get(key)!.add(sourceItem.instanceId);
                            results[sourceItem.instanceId].boostedSquares.push(t);
                        });
                    });
                }
            }
        });
    });

    // Second Pass: Apply Buffs and Multipliers
    for (let i = 0; i < gridItems.length; i++) {
        const sourceItem = gridItems[i];
        const sourceDef = ITEMS[sourceItem.itemId];
        if (!sourceDef?.adjacency) continue;

        for (let j = 0; j < gridItems.length; j++) {
            if (i === j) continue;
            const targetItem = gridItems[j];
            const targetDef = ITEMS[targetItem.itemId];

            sourceDef.adjacency.forEach(rule => {
                if (rule.type === 'BOOST_SQUARE') return; // Handled in first pass

                if (checkPattern(sourceItem, targetItem, rule.pattern)) {
                    let apply = false;
                    if (rule.targetIds?.includes(targetItem.itemId)) apply = true;
                    if (rule.targetCategories?.includes(targetDef.category)) apply = true;

                    if (apply) {
                        const effectTargetId = rule.targetSelf ? sourceItem.instanceId : targetItem.instanceId;
                        if (rule.type === 'MULTIPLIER') {
                            const stat = rule.stat || 'damage';
                            results[effectTargetId].multipliers[stat] = (results[effectTargetId].multipliers[stat] || 1) * rule.value;
                        } else {
                            const stat = rule.stat || 'damage';
                            results[effectTargetId].buffs[stat] = (results[effectTargetId].buffs[stat] || 0) + rule.value;
                            results[effectTargetId].totalBuff += rule.value;
                        }
                        results[effectTargetId].activeRules.push(`From ${sourceDef.name}: ${rule.effect}`);
                    }
                }
            });
        }

        // Apply "Star" (Boost Square) effects to Self or Others?
        // User: "If star is on weapon, this item triggers * 2 speed..."
        // This implies: If any square of item is boosted, apply bonus.
        const cells = getItemCells(sourceItem);
        const isBoosted = cells.some(c => cellBoosts.has(`${c.x},${c.y}`));
        if (isBoosted) {
            // If weapon, x2 speed
            if (sourceDef.category === 'WEAPON') {
                results[sourceItem.instanceId].multipliers['speed'] = (results[sourceItem.instanceId].multipliers['speed'] || 1) * 2;
                results[sourceItem.instanceId].activeRules.push("STAR BOOST: x2 Speed");
            } else {
                // General boost: +10 to all relevant stats?
                results[sourceItem.instanceId].buffs['damage'] = (results[sourceItem.instanceId].buffs['damage'] || 0) + 10;
                results[sourceItem.instanceId].buffs['defense'] = (results[sourceItem.instanceId].buffs['defense'] || 0) + 10;
                results[sourceItem.instanceId].totalBuff += 10;
                results[sourceItem.instanceId].activeRules.push("STAR BOOST: +10 All");
            }
        }
    }

    return results;
};
