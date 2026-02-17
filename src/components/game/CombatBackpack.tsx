import { motion, AnimatePresence } from 'framer-motion';
import type { InventoryItemInstance, Container } from '../../types';
import BackpackItem from './BackpackItem';
import type { ItemCooldown } from '../../lib/combat';
import clsx from 'clsx';

interface CombatBackpackProps {
    items: InventoryItemInstance[];
    containers: Container[];
    cooldowns: ItemCooldown[];
    cellSize?: number;
    gap?: number;
}

const CombatBackpack: React.FC<CombatBackpackProps> = ({
    items,
    containers,
    cooldowns,
    cellSize = 40,
    gap = 2
}) => {
    // Calculate grid bounds
    const allCells = containers.flatMap(c => c.cells);
    if (allCells.length === 0) return null;

    const minX = Math.min(...allCells.map(c => c.x));
    const minY = Math.min(...allCells.map(c => c.y));
    const maxX = Math.max(...allCells.map(c => c.x));
    const maxY = Math.max(...allCells.map(c => c.y));

    const widthCells = maxX - minX + 1;
    const heightCells = maxY - minY + 1;

    return (
        <div
            className="relative bg-wood-800/40 p-2 rounded-xl shadow-inner border-2 border-wood-600 overflow-hidden"
            style={{
                width: widthCells * cellSize + (widthCells - 1) * gap + 16, // + padding
                height: heightCells * cellSize + (heightCells - 1) * gap + 16,
            }}
        >
            <div className="relative" style={{ width: widthCells * cellSize + (widthCells - 1) * gap, height: heightCells * cellSize + (heightCells - 1) * gap }}>
                {/* Background Cells */}
                {containers.map(container =>
                    container.cells.map((cell, idx) => {
                        const hasLeft = container.cells.some(n => n.x === cell.x - 1 && n.y === cell.y);
                        const hasRight = container.cells.some(n => n.x === cell.x + 1 && n.y === cell.y);
                        const hasTop = container.cells.some(n => n.x === cell.x && n.y === cell.y - 1);
                        const hasBottom = container.cells.some(n => n.x === cell.x && n.y === cell.y + 1);

                        return (
                            <div
                                key={`${container.id}-${idx}`}
                                className="absolute bg-wood-700/60 shadow-inner pointer-events-none"
                                style={{
                                    left: (cell.x - minX) * (cellSize + gap),
                                    top: (cell.y - minY) * (cellSize + gap),
                                    width: cellSize,
                                    height: cellSize,
                                    borderLeft: !hasLeft ? '2px solid #3E2723' : '1px solid rgba(255,255,255,0.03)',
                                    borderRight: !hasRight ? '2px solid #3E2723' : '1px solid rgba(255,255,255,0.03)',
                                    borderTop: !hasTop ? '2px solid #3E2723' : '1px solid rgba(255,255,255,0.03)',
                                    borderBottom: !hasBottom ? '2px solid #3E2723' : '1px solid rgba(255,255,255,0.03)',
                                    borderTopLeftRadius: (!hasTop && !hasLeft) ? '4px' : '0',
                                    borderTopRightRadius: (!hasTop && !hasRight) ? '4px' : '0',
                                    borderBottomLeftRadius: (!hasBottom && !hasLeft) ? '4px' : '0',
                                    borderBottomRightRadius: (!hasBottom && !hasRight) ? '4px' : '0',
                                }}
                            />
                        );
                    })
                )}

                {/* Items */}
                {items.map(item => {
                    const cd = cooldowns.find(c => c.instanceId === item.instanceId);
                    const progress = cd ? 1 - (cd.current / cd.max) : 1;
                    const isReady = progress >= 1;

                    return (
                        <div
                            key={item.instanceId}
                            style={{
                                position: 'absolute',
                                left: (item.x - minX) * (cellSize + gap),
                                top: (item.y - minY) * (cellSize + gap),
                            }}
                        >
                            <div className="relative">
                                <BackpackItem
                                    item={item}
                                    draggedInstanceId={null}
                                    onDragStart={() => { }}
                                    onDrag={() => { }}
                                    onDragEnd={() => { }}
                                    CELL_SIZE={cellSize}
                                    GAP={gap}
                                    minX={minX}
                                    minY={minY}
                                />

                                {/* Cooldown Overlay */}
                                {cd && !isReady && (
                                    <div className="absolute inset-0 bg-black/50 pointer-events-none rounded overflow-hidden flex flex-col justify-end">
                                        <motion.div
                                            className="w-full bg-cyan-400/60"
                                            style={{ height: `${progress * 100}%` }}
                                            initial={false}
                                            animate={{ height: `${progress * 100}%` }}
                                            transition={{ type: "tween", ease: "linear", duration: 0.1 }}
                                        />
                                    </div>
                                )}

                                {/* Trigger Flashes */}
                                <AnimatePresence>
                                    {cd?.lastTrigger && (
                                        <motion.div
                                            key={`${item.instanceId}-${cd.lastTrigger.timestamp}`}
                                            initial={{ opacity: 0.8 }}
                                            animate={{ opacity: 0 }}
                                            className={clsx(
                                                "absolute inset-0 pointer-events-none rounded z-20",
                                                cd.lastTrigger.type === 'SUCCESS' ? "bg-white" : "bg-red-500"
                                            )}
                                            transition={{ duration: 0.4 }}
                                        />
                                    )}
                                </AnimatePresence>

                                {/* Ready Glow */}
                                {isReady && cd && (
                                    <div className="absolute inset-0 border-2 border-white/60 shadow-[0_0_10px_rgba(255,255,255,0.4)] rounded animate-pulse pointer-events-none" />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CombatBackpack;
