import type { InventoryItemInstance, AdjacencyPattern, AdjacencyRule, FunctionalSynergy, SynergyResult } from '../types';
import { ITEMS, GRID_SIZE } from './items';

export interface SynergySquare {
    x: number;
    y: number;
    icon?: string;
}

export interface AdjacencyResult {
    instanceId: string;
    totalBuff: number;
    buffs: Record<string, number>; // stat -> additive value
    multipliers: Record<string, number>; // stat -> multiplier (e.g. { speed: 2 })
    activeRules: string[];
    boostedSquares: { x: number, y: number }[]; // Squares boosted by this item
    activeSynergySquares: SynergySquare[]; // Squares where synergy is active
    potentialSynergySquares: SynergySquare[]; // Pattern squares that could synergy
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

type CombinedRule = (AdjacencyRule & { isLegacy: true }) | (FunctionalSynergy & { isFunctional: true });


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

    // First Pass: Identify Boosted Squares (Global Stars)
    gridItems.forEach(sourceItem => {
        const sourceDef = ITEMS[sourceItem.itemId];
        if (!sourceDef) return;

        // Legacy Boost Squares
        sourceDef.adjacency?.forEach(rule => {
            if (rule.type === 'BOOST_SQUARE') {
                const cells = getItemCells(sourceItem);

                cells.forEach(cell => {
                    const targets: { x: number, y: number }[] = [];
                    if (Array.isArray(rule.pattern)) {
                        rule.pattern.forEach(off => {
                            const { rdx, rdy } = getRotatedOffset(off.dx, off.dy, sourceItem.rotation);
                            targets.push({ x: cell.x + rdx, y: cell.y + rdy });
                        });
                    } else if (rule.pattern === 'ADJACENT') {
                        targets.push({ x: cell.x + 1, y: cell.y }, { x: cell.x - 1, y: cell.y }, { x: cell.x, y: cell.y + 1 }, { x: cell.x, y: cell.y - 1 });
                    }

                    targets.forEach(t => {
                        if (t.x < 0 || t.x >= GRID_SIZE || t.y < 0 || t.y >= GRID_SIZE) return;
                        const key = `${t.x},${t.y}`;
                        if (!cellBoosts.has(key)) cellBoosts.set(key, new Set());
                        cellBoosts.get(key)!.add(sourceItem.instanceId);
                        results[sourceItem.instanceId].boostedSquares.push(t);
                    });
                });
            }
        });

        // Functional Boost Squares
        sourceDef.synergies?.forEach(syn => {
            if (syn.isBoostSquare) {
                const cells = getItemCells(sourceItem);
                cells.forEach(cell => {
                    const footprint: { x: number, y: number }[] = [];
                    if (Array.isArray(syn.pattern)) {
                        syn.pattern.forEach(off => {
                            const { rdx, rdy } = getRotatedOffset(off.dx, off.dy, sourceItem.rotation);
                            footprint.push({ x: cell.x + rdx, y: cell.y + rdy });
                        });
                    } else if (syn.pattern === 'ADJACENT') {
                        footprint.push({ x: cell.x + 1, y: cell.y }, { x: cell.x - 1, y: cell.y }, { x: cell.x, y: cell.y + 1 }, { x: cell.x, y: cell.y - 1 });
                    }

                    footprint.forEach(t => {
                        if (t.x < 0 || t.x >= GRID_SIZE || t.y < 0 || t.y >= GRID_SIZE) return;
                        const key = `${t.x},${t.y}`;
                        if (!cellBoosts.has(key)) cellBoosts.set(key, new Set());
                        cellBoosts.get(key)!.add(sourceItem.instanceId);
                        results[sourceItem.instanceId].boostedSquares.push(t);
                    });
                });
            }
        });
    });

    // Second Pass: Identify Synergy Square Highlights (Active vs Potential)
    gridItems.forEach((sourceItem) => {
        const sourceDef = ITEMS[sourceItem.itemId];
        if (!sourceDef) return;

        const cellsA = getItemCells(sourceItem);

        // Process both legacy and functional synergies
        const allRules: CombinedRule[] = [
            ...((sourceDef.adjacency || []).map(r => ({ ...r, isLegacy: true as const }))),
            ...((sourceDef.synergies || []).map(s => ({ ...s, isFunctional: true as const })))
        ];

        allRules.forEach(rule => {
            if ('type' in rule && rule.type === 'BOOST_SQUARE') return;
            if ('isBoostSquare' in rule && rule.isBoostSquare) return;

            // Calculate Footprint
            const footprint: { x: number, y: number }[] = [];
            const pattern = rule.pattern;

            cellsA.forEach(ca => {
                if (Array.isArray(pattern)) {
                    pattern.forEach(off => {
                        const { rdx, rdy } = getRotatedOffset(off.dx, off.dy, sourceItem.rotation);
                        footprint.push({ x: ca.x + rdx, y: ca.y + rdy });
                    });
                } else {
                    if (pattern === 'ADJACENT') footprint.push({ x: ca.x + 1, y: ca.y }, { x: ca.x - 1, y: ca.y }, { x: ca.x, y: ca.y + 1 }, { x: ca.x, y: ca.y - 1 });
                    else if (pattern === 'PARALLEL') footprint.push({ x: ca.x + 2, y: ca.y }, { x: ca.x - 2, y: ca.y }, { x: ca.x, y: ca.y + 2 }, { x: ca.x, y: ca.y - 2 });
                    else if (pattern === 'TWO_ACROSS') footprint.push({ x: ca.x + 2, y: ca.y + 2 }, { x: ca.x - 2, y: ca.y - 2 }, { x: ca.x + 2, y: ca.y - 2 }, { x: ca.x - 2, y: ca.y + 2 });
                }
            });

            // De-duplicate & bounds check, and ENSURE they don't overlap the source item itself
            const cellsAKeys = new Set(cellsA.map(c => `${c.x},${c.y}`));
            const uniqueFootprint = Array.from(new Set(footprint.map(f => `${f.x},${f.y}`)))
                .map(s => { const [x, y] = s.split(',').map(Number); return { x, y }; })
                .filter(f => f.x >= 0 && f.x < GRID_SIZE && f.y >= 0 && f.y < GRID_SIZE && !cellsAKeys.has(`${f.x},${f.y}`));

            uniqueFootprint.forEach(square => {
                const targetItem = gridItems.find(gi => {
                    if (gi.instanceId === sourceItem.instanceId) return false;
                    return getItemCells(gi).some(tc => tc.x === square.x && tc.y === square.y);
                });

                let icon = 'Star'; // Default

                // Determine context-specific icon even for potential synergies
                if ('isFunctional' in rule && rule.isFunctional) {
                    const desc = rule.description.toLowerCase();
                    if (desc.includes('damage') || desc.includes('weapon') || desc.includes('attack') || desc.includes('sword') || desc.includes('wield') || desc.includes('empower')) icon = 'Swords';
                    else if (desc.includes('heal') || desc.includes('health') || desc.includes('regen') || desc.includes('diet') || desc.includes('banquet') || desc.includes('hydration')) icon = 'Heart';
                    else if (desc.includes('defense') || desc.includes('shield') || desc.includes('block') || desc.includes('armor') || desc.includes('protection')) icon = 'Shield';
                    else if (desc.includes('accuracy') || desc.includes('aim') || desc.includes('access')) icon = 'Target';
                    else if (desc.includes('speed') || desc.includes('fast') || desc.includes('quick') || desc.includes('haste')) icon = 'Zap';
                    else if (desc.includes('energy') || desc.includes('stamina') || desc.includes('battery') || desc.includes('power')) icon = 'Battery';
                } else if ('isLegacy' in rule && rule.isLegacy) {
                    const stat = rule.stat || 'damage';
                    if (stat === 'heal' || stat === 'healthRegen') icon = 'Heart';
                    else if (stat === 'damage') icon = 'Swords';
                    else if (stat === 'defense' || stat === 'block') icon = 'Shield';
                    else if (stat === 'accuracy') icon = 'Target';
                    else if (stat === 'speed') icon = 'Zap';
                    else if (stat === 'energyRegen' || stat === 'maxEnergy' || stat === 'staminaRegen') icon = 'Battery';
                    
                    if (rule.targetCategories?.includes('WEAPON')) icon = 'Swords';
                }

                if (targetItem) {
                    const targetDef = ITEMS[targetItem.itemId];
                    let isActive = false;
                    
                    if ('isFunctional' in rule && rule.isFunctional) {
                        const res: SynergyResult = rule.apply(sourceItem, targetItem, gridItems);
                        isActive = (res.buffs && Object.keys(res.buffs).length > 0) || (res.multipliers && Object.keys(res.multipliers).length > 0);
                        
                        // Refine icon if active
                        const stats = [...Object.keys(res.buffs || {}), ...Object.keys(res.multipliers || {})];
                        if (stats.includes('heal') || stats.includes('healthRegen')) icon = 'Heart';
                        else if (stats.includes('damage')) icon = 'Swords';
                        else if (stats.includes('defense') || stats.includes('block')) icon = 'Shield';
                        else if (stats.includes('accuracy')) icon = 'Target';
                        else if (stats.includes('speed')) icon = 'Zap';
                        else if (stats.includes('energyRegen') || stats.includes('maxEnergy') || stats.includes('staminaRegen')) icon = 'Battery';
                    } else if ('isLegacy' in rule && rule.isLegacy) {
                        let matches = false;
                        if (rule.targetIds?.includes(targetItem.itemId)) matches = true;
                        if (rule.targetCategories?.includes(targetDef.category)) matches = true;
                        if (!rule.targetIds && !rule.targetCategories) matches = true;

                        if (matches) {
                            const stat = rule.stat || 'damage';
                            const hasStat = (targetDef.combatStats && stat in targetDef.combatStats) || (stat === 'defense' && targetDef.combatStats?.block !== undefined);
                            isActive = hasStat || !!rule.targetSelf;
                        }
                    }

                    if (isActive) results[sourceItem.instanceId].activeSynergySquares.push({ ...square, icon });
                    else results[sourceItem.instanceId].potentialSynergySquares.push({ ...square, icon });
                } else {
                    results[sourceItem.instanceId].potentialSynergySquares.push({ ...square, icon });
                }
            });
        });
    });

    // Third Pass: Calculate Final Stats
    for (let i = 0; i < gridItems.length; i++) {
        const sourceItem = gridItems[i];
        const sourceDef = ITEMS[sourceItem.itemId];
        if (!sourceDef) continue;

        for (let j = 0; j < gridItems.length; j++) {
            if (i === j) continue;
            const targetItem = gridItems[j];
            const targetDef = ITEMS[targetItem.itemId];

            // Legacy
            sourceDef.adjacency?.forEach(rule => {
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

            // Functional
            sourceDef.synergies?.forEach(syn => {
                if (syn.isBoostSquare) return;
                if (checkPattern(sourceItem, targetItem, syn.pattern)) {
                    const res = syn.apply(sourceItem, targetItem, gridItems);
                    const effectTargetId = syn.targetIsSelf ? sourceItem.instanceId : targetItem.instanceId;

                    if (res.buffs) {
                        Object.entries(res.buffs).forEach(([stat, val]) => {
                            results[effectTargetId].buffs[stat] = (results[effectTargetId].buffs[stat] || 0) + (val as number);
                            if (stat === 'damage' || stat === 'defense' || stat === 'block' || stat === 'heal') {
                                results[effectTargetId].totalBuff += (val as number);
                            }
                        });
                    }
                    if (res.multipliers) {
                        Object.entries(res.multipliers).forEach(([stat, val]) => {
                            results[effectTargetId].multipliers[stat] = (results[effectTargetId].multipliers[stat] || 1) * (val as number);
                        });
                    }
                    if ((res.buffs && Object.keys(res.buffs).length > 0) || (res.multipliers && Object.keys(res.multipliers).length > 0)) {
                        results[effectTargetId].activeRules.push(`From ${sourceDef.name}: ${syn.description}`);
                    }
                }
            });
        }

        // Apply Boost Square logic (legacy and functional)
        const cells = getItemCells(sourceItem);
        cells.forEach(c => {
            const boostingInstanceIds = cellBoosts.get(`${c.x},${c.y}`);
            if (boostingInstanceIds) {
                boostingInstanceIds.forEach(boosterId => {
                    const boosterItem = gridItems.find(item => item.instanceId === boosterId);
                    if (!boosterItem) return;
                    const boosterDef = ITEMS[boosterItem.itemId];
                    if (!boosterDef) return;

                    // Legacy Boost
                    boosterDef.adjacency?.forEach(rule => {
                        if (rule.type === 'BOOST_SQUARE') {
                            const stat = rule.stat || 'damage';
                            results[sourceItem.instanceId].buffs[stat] = (results[sourceItem.instanceId].buffs[stat] || 0) + rule.value;
                            results[sourceItem.instanceId].totalBuff += rule.value;
                            results[sourceItem.instanceId].activeRules.push(`From ${boosterDef.name}: +${rule.value} ${stat}`);
                        }
                    });

                    // Functional Boost
                    boosterDef.synergies?.forEach(syn => {
                        if (syn.isBoostSquare) {
                            const res = syn.apply(boosterItem, sourceItem, gridItems);
                            if (res.buffs) {
                                Object.entries(res.buffs).forEach(([stat, val]) => {
                                    results[sourceItem.instanceId].buffs[stat] = (results[sourceItem.instanceId].buffs[stat] || 0) + (val as number);
                                    results[sourceItem.instanceId].totalBuff += (val as number);
                                });
                            }
                            if ((res.buffs && Object.keys(res.buffs).length > 0) || (res.multipliers && Object.keys(res.multipliers).length > 0)) {
                                results[sourceItem.instanceId].activeRules.push(`From ${boosterDef.name}: ${syn.description}`);
                            }
                        }
                    });
                });
            }
        });
    }

    return results;
};
