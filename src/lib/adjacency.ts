import type { InventoryItemInstance, AdjacencyPattern } from '../types';
import { ITEMS, GRID_SIZE } from './items';

export interface AdjacencyResult {
    instanceId: string;
    totalBuff: number;
    buffs: Record<string, number>; // stat -> additive value
    multipliers: Record<string, number>; // stat -> multiplier (e.g. { speed: 2 })
    activeRules: string[];
    boostedSquares: { x: number, y: number }[]; // Squares boosted by this item
    activeSynergySquares: { x: number, y: number }[]; // Squares where synergy is active
    potentialSynergySquares: { x: number, y: number }[]; // Pattern squares that could synergy
}

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
                return (dx === 2 && dy === 0) || (dx === 0 && dy === 2);
            }
            if (pattern === 'TWO_ACROSS') {
                return dx === 2 && dy === 2;
            }
            return false;
        })
    );
};

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
            boostedSquares: [],
            activeSynergySquares: [],
            potentialSynergySquares: []
        };
    });

    // First Pass: Identify Boosted Squares (Stars from BOOST_SQUARE)
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

    // Second Pass: Apply Buffs and Track Synergy Squares
    gridItems.forEach((sourceItem) => {
        const sourceDef = ITEMS[sourceItem.itemId];
        if (!sourceDef?.adjacency) return;

        const cellsA = getItemCells(sourceItem);

        sourceDef.adjacency.forEach(rule => {
            if (rule.type === 'BOOST_SQUARE') return;

            // Identify pattern "footprint" cells
            const footprint: { x: number, y: number }[] = [];
            if (Array.isArray(rule.pattern)) {
                cellsA.forEach(ca => {
                    (rule.pattern as { dx: number, dy: number }[]).forEach(off => {
                        const { rdx, rdy } = getRotatedOffset(off.dx, off.dy, sourceItem.rotation);
                        footprint.push({ x: ca.x + rdx, y: ca.y + rdy });
                    });
                });
            } else {
                // Common patterns
                cellsA.forEach(ca => {
                    if (rule.pattern === 'ADJACENT') {
                        footprint.push({ x: ca.x + 1, y: ca.y }, { x: ca.x - 1, y: ca.y }, { x: ca.x, y: ca.y + 1 }, { x: ca.x, y: ca.y - 1 });
                    } else if (rule.pattern === 'PARALLEL') {
                        footprint.push({ x: ca.x + 2, y: ca.y }, { x: ca.x - 2, y: ca.y }, { x: ca.x, y: ca.y + 2 }, { x: ca.x, y: ca.y - 2 });
                    } else if (rule.pattern === 'TWO_ACROSS') {
                        footprint.push({ x: ca.x + 2, y: ca.y + 2 }, { x: ca.x - 2, y: ca.y - 2 }, { x: ca.x + 2, y: ca.y - 2 }, { x: ca.x - 2, y: ca.y + 2 });
                    }
                });
            }

            // De-duplicate footprint
            const uniqueFootprint = Array.from(new Set(footprint.map(f => `${f.x},${f.y}`)))
                .map(s => {
                    const [x, y] = s.split(',').map(Number);
                    return { x, y };
                })
                .filter(f => f.x >= 0 && f.x < GRID_SIZE && f.y >= 0 && f.y < GRID_SIZE); // Standard grid bounds

            uniqueFootprint.forEach(square => {
                // Find if any item is in this square
                const targetItem = gridItems.find(gi => {
                    if (gi.instanceId === sourceItem.instanceId) return false;
                    const tCells = getItemCells(gi);
                    return tCells.some(tc => tc.x === square.x && tc.y === square.y);
                });

                if (targetItem) {
                    const targetDef = ITEMS[targetItem.itemId];
                    let matchesCriteria = false;
                    if (rule.targetIds?.includes(targetItem.itemId)) matchesCriteria = true;
                    if (rule.targetCategories?.includes(targetDef.category)) matchesCriteria = true;
                    if (!rule.targetIds && !rule.targetCategories) matchesCriteria = true; // Generic self-buff like Compass

                    if (matchesCriteria) {
                        results[sourceItem.instanceId].activeSynergySquares.push(square);
                    } else {
                        results[sourceItem.instanceId].potentialSynergySquares.push(square);
                    }
                } else {
                    results[sourceItem.instanceId].potentialSynergySquares.push(square);
                }
            });
        });
    });

    // Third Pass: Actually apply the buffs (to avoid duplicate counts from multi-cell footprints)
    for (let i = 0; i < gridItems.length; i++) {
        const sourceItem = gridItems[i];
        const sourceDef = ITEMS[sourceItem.itemId];
        if (!sourceDef?.adjacency) continue;

        for (let j = 0; j < gridItems.length; j++) {
            if (i === j) continue;
            const targetItem = gridItems[j];
            const targetDef = ITEMS[targetItem.itemId];

            sourceDef.adjacency.forEach(rule => {
                if (rule.type === 'BOOST_SQUARE') return;

                if (checkPattern(sourceItem, targetItem, rule.pattern)) {
                    let apply = false;
                    if (rule.targetIds?.includes(targetItem.itemId)) apply = true;
                    if (rule.targetCategories?.includes(targetDef.category)) apply = true;
                    if (!rule.targetIds && !rule.targetCategories) apply = true;

                    if (apply) {
                        const effectTargetId = rule.targetSelf ? sourceItem.instanceId : targetItem.instanceId;
                        const stat = rule.stat || 'damage';
                        if (rule.type === 'MULTIPLIER') {
                            results[effectTargetId].multipliers[stat] = (results[effectTargetId].multipliers[stat] || 1) * rule.value;
                        } else {
                            results[effectTargetId].buffs[stat] = (results[effectTargetId].buffs[stat] || 0) + rule.value;
                            results[effectTargetId].totalBuff += rule.value;
                        }
                        results[effectTargetId].activeRules.push(`From ${sourceDef.name}: ${rule.effect}`);
                    }
                }
            });
        }

        // Apply "Star" (Boost Square) effects
        const cells = getItemCells(sourceItem);
        cells.forEach(c => {
            const key = `${c.x},${c.y}`;
            const boostingInstanceIds = cellBoosts.get(key);
            if (boostingInstanceIds) {
                boostingInstanceIds.forEach(boosterId => {
                    const boosterItem = gridItems.find(item => item.instanceId === boosterId);
                    if (!boosterItem) return;
                    const boosterDef = ITEMS[boosterItem.itemId];
                    if (!boosterDef || !boosterDef.adjacency) return;

                    const boostRule = boosterDef.adjacency.find(r => r.type === 'BOOST_SQUARE');
                    if (boostRule) {
                        const stat = boostRule.stat || 'damage';
                        const val = boostRule.value || 0;
                        results[sourceItem.instanceId].buffs[stat] = (results[sourceItem.instanceId].buffs[stat] || 0) + val;
                        results[sourceItem.instanceId].totalBuff += val;
                        results[sourceItem.instanceId].activeRules.push(`From ${boosterDef.name}: +${val} ${stat}`);
                    }
                });
            }
        });
    }

    return results;
};
