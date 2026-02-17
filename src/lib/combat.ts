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

export const calculatePlayerCombatInfo = (items: InventoryItemInstance[]): {
    stats: CombatStats,
    synergies: SynergyEffect[],
    onHitEffects: { type: StatusEffect['type']; value: number; chance?: number }[],
    itemsWithLiveStats: InventoryItemInstance[]
} => {
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

    const bonusesMap = getAdjacencyBonuses(items);

    const itemsWithLiveStats = items.map(instance => {
        const def = ITEMS[instance.itemId];
        const bonus = bonusesMap[instance.instanceId];

        // Base stats from item definition
        const liveStats = {
            damage: def.combatStats?.damage || 0,
            speed: def.combatStats?.speed || 0,
            accuracy: def.combatStats?.accuracy || 100,
            energyCost: def.combatStats?.energyCost || 0,
            heal: def.combatStats?.heal || 0,
            block: def.combatStats?.block || 0
        };

        // Apply additive buffs
        if (bonus?.buffs) {
            liveStats.damage += bonus.buffs.damage || 0;
            liveStats.speed += bonus.buffs.speed || 0;
            liveStats.accuracy += bonus.buffs.accuracy || 0;
            liveStats.heal += bonus.buffs.heal || 0;
            liveStats.block += bonus.buffs.block || 0;
        }

        // Apply multipliers
        if (bonus?.multipliers) {
            if (bonus.multipliers.damage) liveStats.damage = Math.floor(liveStats.damage * bonus.multipliers.damage);
            if (bonus.multipliers.speed) liveStats.speed = Math.floor(liveStats.speed * bonus.multipliers.speed);
            if (bonus.multipliers.accuracy) liveStats.accuracy = Math.floor(liveStats.accuracy * bonus.multipliers.accuracy);
            if (bonus.multipliers.heal) liveStats.heal = Math.floor(liveStats.heal * bonus.multipliers.heal);
            if (bonus.multipliers.block) liveStats.block = Math.floor(liveStats.block * bonus.multipliers.block);
        }

        // Accumulate global passive stats
        if (def.triggerType === 'PASSIVE' || !def.triggerType) {
            totalStats.maxEnergy += def.combatStats?.maxEnergy || 0;
            totalStats.energyRegen += def.combatStats?.energyRegen || 0;
            totalStats.defense += def.combatStats?.defense || 0;
            totalStats.healthRegen! += def.combatStats?.healthRegen || 0;
            totalStats.shieldRegen! += def.combatStats?.shieldRegen || 0;

            // Apply global buffs from passive items if they exist (though usually they target specific items)
            if (bonus?.buffs?.defense) totalStats.defense += bonus.buffs.defense;
        }

        return { ...instance, liveStats };
    });

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

    return { stats: totalStats, synergies, onHitEffects, itemsWithLiveStats };
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
            const instance = p.inventory.find(i => i.instanceId === cd.instanceId);
            const def = ITEMS[cd.itemId];
            const liveStats = instance?.liveStats;

            if (!liveStats) return { ...cd, current: cd.max }; // Fail-safe

            // Only pick up items that have a trigger role (Attack, Heal, Shield)
            if (def.triggerType === 'PASSIVE') return { ...cd, current: cd.max };

            const energyCost = liveStats.energyCost || 0;

            // Check energy
            if (energyCost > 0 && p.energy < energyCost) {
                const failTrigger = { type: 'FAIL_ENERGY' as const, timestamp: elapsedTime };
                return { ...cd, current, lastTrigger: failTrigger };
            }

            // Deduct energy
            p.energy -= energyCost;
            const successTrigger = { type: 'SUCCESS' as const, timestamp: elapsedTime };

            if (def.triggerType === 'ATTACK') {
                const baseDmg = liveStats.damage || 0;
                // Resolve Accuracy
                const miss = Math.random() * 100 > (liveStats.accuracy || 100);
                if (miss) {
                    events.push(`Player's ${def.name} missed!`);
                } else {
                    let finalDmg = Math.max(1, baseDmg - e.baseDefense);
                    if (e.shield > 0) {
                        const absorbed = Math.min(e.shield, finalDmg);
                        e.shield -= absorbed;
                        finalDmg -= absorbed;
                    }
                    e.hp -= finalDmg;
                    if (finalDmg > 0) events.push(`Player's ${def.name} hits for ${Math.floor(finalDmg)}!`);
                }
            } else if (def.triggerType === 'HEAL') {
                const healVal = liveStats.heal || 0;
                p.hp = Math.min(p.maxHp, p.hp + healVal);
                events.push(`Player's ${def.name} heals for ${healVal}!`);
            } else if (def.triggerType === 'SHIELD') {
                const blockVal = liveStats.block || 0;
                p.shield += blockVal;
                events.push(`Player's ${def.name} adds ${blockVal} shield!`);
            }

            // Apply Status Effects from this specific item
            if (def.effects) {
                def.effects.forEach(eff => {
                    if (eff.chance && Math.random() * 100 > eff.chance) return;
                    e.statuses.push({ type: eff.type, value: eff.value, sourceId: def.id });
                });
            }

            current = cd.max;
            return { ...cd, current, lastTrigger: successTrigger };
        }
        return { ...cd, current };
    });

    // Process Enemy Cooldowns
    const nextEnemyCooldowns = enemyCooldowns.map(cd => {
        let current = cd.current - deltaMs;
        if (current <= 0) {
            const instance = e.inventory.find(i => i.instanceId === cd.instanceId);
            const def = ITEMS[cd.itemId];
            const liveStats = instance?.liveStats;

            if (!liveStats || def.triggerType === 'PASSIVE') return { ...cd, current: cd.max };

            // Enemy has infinite energy for now (simpler logic)
            const successTrigger = { type: 'SUCCESS' as const, timestamp: elapsedTime };

            if (def.triggerType === 'ATTACK') {
                const baseDmg = liveStats.damage || 0;
                let finalDmg = Math.max(1, baseDmg - p.baseDefense);
                if (p.shield > 0) {
                    const absorbed = Math.min(p.shield, finalDmg);
                    p.shield -= absorbed;
                    finalDmg -= absorbed;
                }
                p.hp -= finalDmg;
                if (finalDmg > 0) events.push(`${e.name}'s ${def.name} hits for ${Math.floor(finalDmg)}!`);
            } else if (def.triggerType === 'HEAL') {
                const healVal = liveStats.heal || 0;
                e.hp = Math.min(e.maxHp, e.hp + healVal);
                events.push(`${e.name} heals for ${healVal}!`);
            } else if (def.triggerType === 'SHIELD') {
                const blockVal = liveStats.block || 0;
                e.shield += blockVal;
                events.push(`${e.name} adds ${blockVal} shield!`);
            }

            current = cd.max;
            return { ...cd, current, lastTrigger: successTrigger };
        }
        return { ...cd, current };
    });

    // Process Status Effects (Poison, etc)
    e.statuses.forEach(s => {
        if (s.type === 'POISON') {
            e.hp -= (s.value * deltaMs / 1000);
        }
    });
    p.statuses.forEach(s => {
        if (s.type === 'POISON') {
            p.hp -= (s.value * deltaMs / 1000);
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
    const { stats: itemStats, synergies, onHitEffects, itemsWithLiveStats } = calculatePlayerCombatInfo(inventory);

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
        inventory: itemsWithLiveStats // Use the ones with baked liveStats
    };
};

export const calculateCombatPower = (items: InventoryItemInstance[]): number => {
    const { stats } = calculatePlayerCombatInfo(items);
    return Math.floor(stats.damage + stats.defense + (stats.speed / 2) + (stats.block / 2));
};
