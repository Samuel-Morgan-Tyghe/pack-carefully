import type { InventoryItemInstance } from '../types';
import { ITEMS } from './items';
import { getAdjacencyBonuses } from './adjacency';
import type { SynergyEffect } from './synergies';
import { calculateSynergies } from './synergies';

export interface CombatStats {
    damage: number;
    defense: number;
    block: number;
    heal: number;
    speed: number;
    accuracy: number;
    maxMana: number;
    manaRegen: number;
    shieldRegen?: number;
    healthRegen?: number;
    maxEnergy: number;
    energyRegen: number;
}

export interface StatusEffect {
    type: 'POISON' | 'FIRE' | 'STUN' | 'SLOW' | 'BLEED';
    value: number; // Stacks or Duration
    sourceId?: string;
}

export interface CombatEntity {
    id: string;
    hp: number;
    maxHp: number;
    mana: number;
    shield: number;
    baseDefense: number;
    energy: number;
    maxEnergy: number;
    image?: string;
    stats: CombatStats;
    statuses: StatusEffect[];
    synergies?: SynergyEffect[];
    onHitEffects?: { type: StatusEffect['type']; value: number; chance?: number }[];
    name: string;
    inventory: InventoryItemInstance[];
}

export interface ItemCooldown {
    instanceId: string;
    itemId: string;
    current: number; // ms remaining
    max: number;     // ms total
    baseMax: number; // Original max cooldown before modifiers
    lastTrigger?: {
        type: 'SUCCESS' | 'FAIL_ENERGY';
        timestamp: number; // Combat elapsed time
    } | null;
}

export const calculatePlayerCombatInfo = (items: InventoryItemInstance[]): { stats: CombatStats, synergies: SynergyEffect[], onHitEffects: { type: StatusEffect['type']; value: number; chance?: number }[] } => {
    const totalStats: CombatStats = {
        damage: 0,
        defense: 0,
        block: 0,
        heal: 0,
        speed: 0,
        accuracy: 100,
        maxMana: 0,
        manaRegen: 0,
        shieldRegen: 0,
        healthRegen: 0,
        maxEnergy: 100, // Base energy pool
        energyRegen: 2  // Base regen per second
    };

    items.forEach(instance => {
        const def = ITEMS[instance.itemId];
        if (def.combatStats) {
            totalStats.damage += def.combatStats.damage || 0;
            totalStats.defense += def.combatStats.defense || 0;
            totalStats.block += def.combatStats.block || 0;
            totalStats.heal += def.combatStats.heal || 0;
            totalStats.speed += def.combatStats.speed || 0;
            totalStats.maxMana += def.combatStats.manaCost ? 0 : def.combatStats.maxMana || 0;
            totalStats.shieldRegen! += def.combatStats.shieldRegen || 0;
            totalStats.healthRegen! += def.combatStats.healthRegen || 0;
            totalStats.maxEnergy += def.combatStats.maxEnergy || 0;
            totalStats.energyRegen += def.combatStats.energyRegen || 0;
        }
    });

    const bonusesMap = getAdjacencyBonuses(items);
    const totalMultipliers: Record<string, number> = {
        damage: 1, defense: 1, block: 1, heal: 1, speed: 1, accuracy: 1
    };

    Object.values(bonusesMap).forEach(bonusResult => {
        if (bonusResult.buffs) {
            Object.entries(bonusResult.buffs).forEach(([stat, val]) => {
                if (stat in totalStats) {
                    (totalStats as unknown as Record<string, number>)[stat] += val;
                }
            });
        }
        if (bonusResult.multipliers) {
            Object.entries(bonusResult.multipliers).forEach(([stat, val]) => {
                if (stat in totalMultipliers) {
                    totalMultipliers[stat] *= val;
                }
            });
        }
    });

    totalStats.damage = Math.floor(totalStats.damage * totalMultipliers.damage);
    totalStats.defense = Math.floor(totalStats.defense * totalMultipliers.defense);
    totalStats.block = Math.floor(totalStats.block * totalMultipliers.block);
    totalStats.heal = Math.floor(totalStats.heal * totalMultipliers.heal);
    totalStats.speed = Math.floor(totalStats.speed * totalMultipliers.speed);
    totalStats.accuracy = Math.floor(totalStats.accuracy * totalMultipliers.accuracy);

    const synergies = calculateSynergies(items);
    const onHitEffects: { type: StatusEffect['type']; value: number; chance?: number }[] = [];
    items.forEach(instance => {
        const def = ITEMS[instance.itemId];
        if (def.effects) {
            def.effects.forEach(eff => {
                onHitEffects.push({
                    type: eff.type as StatusEffect['type'],
                    value: eff.value,
                    chance: eff.chance
                });
            });
        }
    });

    return { stats: totalStats, synergies, onHitEffects };
};

export interface CombatLogEntry {
    round: number; // Keep for legacy, though round is less relevant now
    message: string;
    type: 'DAMAGE' | 'HEAL' | 'BLOCK' | 'INFO' | 'MISS' | 'EFFECT';
}

export const processCombatTick = (
    player: CombatEntity,
    enemy: CombatEntity,
    playerCooldowns: ItemCooldown[],
    enemyCooldowns: ItemCooldown[],
    deltaMs: number,
    elapsedTime: number
): {
    player: CombatEntity,
    enemy: CombatEntity,
    playerCooldowns: ItemCooldown[],
    enemyCooldowns: ItemCooldown[],
    events: string[]
} => {
    const p = { ...player, statuses: [...player.statuses] };
    const e = { ...enemy, statuses: [...enemy.statuses] };
    const events: string[] = [];

    // Shield Decay: Shields lose 2% of max or 2 points per sec (approx)
    const decay = (deltaMs / 1000) * 5;
    p.shield = Math.max(0, p.shield - decay);
    e.shield = Math.max(0, e.shield - decay);

    // Passive Regen
    if (p.stats.healthRegen) p.hp = Math.min(p.maxHp, p.hp + (p.stats.healthRegen * deltaMs / 1000));
    if (p.stats.shieldRegen) p.shield += (p.stats.shieldRegen * deltaMs / 1000);

    // Energy Regen
    p.energy = Math.min(p.maxEnergy, p.energy + (p.stats.energyRegen * deltaMs / 1000));
    e.energy = Math.min(e.maxEnergy, e.energy + (e.stats.energyRegen * deltaMs / 1000));

    // Process Player Cooldowns
    const nextPlayerCooldowns = playerCooldowns.map(cd => {
        let current = cd.current - deltaMs;
        if (current <= 0) {
            // Trigger Item!
            const def = ITEMS[cd.itemId];
            const energyCost = def.combatStats?.energyCost || 0;

            // Check energy
            if (energyCost > 0 && p.energy < energyCost) {
                events.push(`Not enough energy for ${def.name}! (${Math.floor(p.energy)}/${energyCost})`);
                current = cd.max; // Reset cooldown, skip this fire
                const failTrigger: { type: 'SUCCESS' | 'FAIL_ENERGY', timestamp: number } = { type: 'FAIL_ENERGY', timestamp: elapsedTime };
                return { ...cd, current, lastTrigger: failTrigger };
            }

            const successTrigger: { type: 'SUCCESS' | 'FAIL_ENERGY', timestamp: number } = { type: 'SUCCESS', timestamp: elapsedTime };

            // Deduct energy
            p.energy -= energyCost;

            const dmg = (def.combatStats?.damage || 0) + (p.stats.damage / 10); // base + scaled

            // Resolve Damage against Enemy
            let finalDmg = Math.max(1, dmg - e.baseDefense);
            if (e.shield > 0) {
                const absorbed = Math.min(e.shield, finalDmg);
                e.shield -= absorbed;
                finalDmg -= absorbed;
            }
            e.hp -= finalDmg;
            if (finalDmg > 0) events.push(`Player's ${def.name} hits for ${Math.floor(finalDmg)}! (-${energyCost} ⚡)`);

            // Apply specific effects (Heals) - ShieldRegen is passive only now to avoid double dipping
            if (def.combatStats?.heal) p.hp = Math.min(p.maxHp, p.hp + def.combatStats.heal);

            // Apply Status Effects from this specific item
            if (def.effects) {
                def.effects.forEach(eff => {
                    // Check chance if applicable
                    if (eff.chance && Math.random() * 100 > eff.chance) return;

                    e.statuses.push({
                        type: eff.type,
                        value: eff.value,
                        sourceId: def.id
                    });
                    events.push(`Applied ${eff.type} to Enemy!`);
                });
            }

            current = cd.max; // Reset
            return { ...cd, current, lastTrigger: successTrigger };
        }
        return { ...cd, current };
    });

    // Process Enemy Cooldowns (Simple auto-attack for now)
    const nextEnemyCooldowns = enemyCooldowns.map(cd => {
        let current = cd.current - deltaMs;
        if (current <= 0) {
            const dmg = e.stats.damage;
            let finalDmg = Math.max(1, dmg - p.baseDefense);
            if (p.shield > 0) {
                const absorbed = Math.min(p.shield, finalDmg);
                p.shield -= absorbed;
                finalDmg -= absorbed;
            }
            p.hp -= finalDmg;
            events.push(`${e.name} attacks for ${Math.floor(finalDmg)}!`);
            current = cd.max;
        }
        return { ...cd, current };
    });

    // Process Status Effects (Poison, Regen, etc) on Ticks? 
    // Status effects usually tick once per second.
    // For now, let's keep it simple and ignoring DOTs until we have a better timing mechanism for them.
    // Or we can apply DOTs here based on deltaMs?
    // e.g. Poison = 5 dmg / sec.
    e.statuses.forEach(s => {
        if (s.type === 'POISON') {
            e.hp -= (s.value * deltaMs / 1000);
        }
    });

    return { player: p, enemy: e, playerCooldowns: nextPlayerCooldowns, enemyCooldowns: nextEnemyCooldowns, events };
};

export type EnemyType = 'AGGRESSIVE' | 'DEFENSIVE' | 'SWARM' | 'EVASIVE' | 'BOSS';

const ENEMY_TEMPLATES: Record<EnemyType, {
    names: string[];
    pool: string[];
    baseHp: number;
    hpPerDiff: number;
    baseDef: number;
    defPerDiff: number;
    itemsCount: number; // Base items
}> = {
    AGGRESSIVE: {
        names: ['Dire Wolf', 'Berserker', 'Wild Boar'],
        pool: ['dagger', 'sword', 'hammer', 'battle_axe', 'oil_flask'],
        baseHp: 40, hpPerDiff: 10,
        baseDef: 0, defPerDiff: 0,
        itemsCount: 1
    },
    DEFENSIVE: {
        names: ['Iron Bear', 'Stone Golem', 'Turtle'],
        pool: ['rock', 'shield', 'helmet', 'potion', 'hammer'], // helmet/shield if exist, else basic
        baseHp: 80, hpPerDiff: 20,
        baseDef: 2, defPerDiff: 1,
        itemsCount: 1
    },
    SWARM: {
        names: ['Rat Pack', 'Bee Swarm', 'Kobold'],
        pool: ['dagger', 'slingshot', 'broken_radio', 'rusty_nails'],
        baseHp: 30, hpPerDiff: 5,
        baseDef: 0, defPerDiff: 0,
        itemsCount: 2
    },
    EVASIVE: {
        names: ['Wind Spirit', 'Ninja', 'Bat'],
        pool: ['bow', 'slingshot', 'dagger', 'rope'],
        baseHp: 35, hpPerDiff: 8,
        baseDef: 0, defPerDiff: 0,
        itemsCount: 1
    },
    BOSS: {
        names: ['Dragon', 'Dark Knight', 'Beholder'],
        pool: ['excalibur', 'obsidian_shield', 'dragon_scale', 'battle_axe'],
        baseHp: 200, hpPerDiff: 50,
        baseDef: 5, defPerDiff: 2,
        itemsCount: 3
    }
};

export const generateEnemy = (type: EnemyType, difficulty: number): CombatEntity => {
    const template = ENEMY_TEMPLATES[type];
    const name = template.names[Math.floor(Math.random() * template.names.length)];
    const enemyId = `enemy-${Math.random().toString(36).substr(2, 9)}`;

    // Generate Inventory
    const inventory: InventoryItemInstance[] = [];
    const count = Math.max(1, template.itemsCount + Math.floor(difficulty / 3)); // Ensure at least 1 item, more at higher diff

    for (let i = 0; i < count; i++) {
        const itemId = template.pool[Math.floor(Math.random() * template.pool.length)];
        const itemDef = ITEMS[itemId];
        if (itemDef) {
            inventory.push({
                instanceId: `enemy-item-${i}-${Math.random().toString(36).substr(2, 9)}`,
                itemId: itemId,
                x: 0,
                y: i * 2, // Simple stacking, visual layout doesn't matter much for enemy yet
                rotation: 0,
                ownerId: enemyId
            });
        }
    }

    // Calculate Stats from Items
    const { stats: itemStats, synergies, onHitEffects } = calculatePlayerCombatInfo(inventory);

    // Base Stats
    const maxHp = template.baseHp + (template.hpPerDiff * difficulty);
    const baseDefense = template.baseDef + (template.defPerDiff * difficulty);

    // Combine
    const finalStats: CombatStats = {
        ...itemStats,
        damage: Math.max(1, itemStats.damage + Math.floor(difficulty)), // Ensure at least 1 dmg + diff scaling
        speed: Math.max(1, itemStats.speed),
        defense: itemStats.defense + baseDefense,
        maxMana: itemStats.maxMana,
        manaRegen: itemStats.manaRegen,
        shieldRegen: itemStats.shieldRegen || 0,
        healthRegen: itemStats.healthRegen || 0,
        block: itemStats.block,
        heal: itemStats.heal,
        accuracy: itemStats.accuracy
    };

    return {
        id: enemyId,
        name,
        hp: maxHp,
        maxHp: maxHp,
        mana: itemStats.maxMana,
        shield: 0,
        baseDefense,
        energy: finalStats.maxEnergy,
        maxEnergy: finalStats.maxEnergy,
        stats: finalStats,
        statuses: [],
        synergies,
        onHitEffects,
        inventory
    };
};

export const calculateCombatPower = (items: InventoryItemInstance[]): number => {
    const { stats } = calculatePlayerCombatInfo(items);
    return Math.floor(stats.damage + stats.defense + (stats.speed / 2) + (stats.block / 2));
};
