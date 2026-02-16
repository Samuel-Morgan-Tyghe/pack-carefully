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
}

export interface StatusEffect {
    type: 'POISON' | 'FIRE' | 'STUN' | 'SLOW' | 'BLEED';
    value: number; // Stacks or Duration
    sourceId?: string;
}

export interface CombatEntity {
    hp: number;
    maxHp: number;
    mana: number;
    image?: string;
    stats: CombatStats;
    statuses: StatusEffect[];
    synergies?: SynergyEffect[];
    onHitEffects?: { type: StatusEffect['type']; value: number; chance?: number }[];
    name: string;
}

export const calculatePlayerCombatInfo = (items: InventoryItemInstance[]): { stats: CombatStats, synergies: SynergyEffect[], onHitEffects: { type: StatusEffect['type']; value: number; chance?: number }[] } => {
    const totalStats: CombatStats = {
        damage: 0,
        defense: 0,
        block: 0,
        heal: 0,
        speed: 0,
        accuracy: 100, // Base accuracy
        maxMana: 0,
        manaRegen: 0
    };

    // 1. Base Stats from Items
    items.forEach(instance => {
        const def = ITEMS[instance.itemId];
        if (def.combatStats) {
            totalStats.damage += def.combatStats.damage || 0;
            totalStats.defense += def.combatStats.defense || 0;
            totalStats.block += def.combatStats.block || 0;
            totalStats.heal += def.combatStats.heal || 0;
            totalStats.speed += def.combatStats.speed || 0;
            totalStats.maxMana += def.combatStats.manaCost ? 0 : def.combatStats.maxMana || 0; // Item might give max mana
            // Accuracy is usually set by weapon, let's average it or take max? 
            // For now, let's say base is 100, and we don't reduce it unless specified.
            // If we have a weapon, we might want to use its specific accuracy for its attack.
            // But this is "Total Stats". Let's treat accuracy as a Modifier here?
            // Actually, individual attacks need accuracy.
        }
    });

    // 2. Adjacency Bonuses
    const bonusesMap = getAdjacencyBonuses(items);

    // Multipliers collect factors (e.g. 1.5, 2.0)
    const totalMultipliers: Record<string, number> = {
        damage: 1,
        defense: 1,
        block: 1,
        heal: 1,
        speed: 1,
        accuracy: 1
    };

    Object.values(bonusesMap).forEach(bonusResult => {
        // Apply Additive Buffs
        if (bonusResult.buffs) {
            Object.entries(bonusResult.buffs).forEach(([stat, val]) => {
                if (stat in totalStats) {
                    (totalStats as unknown as Record<string, number>)[stat] += val;
                }
            });
        }

        // Apply Multiplicative Buffs (factors)
        if (bonusResult.multipliers) {
            Object.entries(bonusResult.multipliers).forEach(([stat, val]) => {
                if (stat in totalMultipliers) {
                    totalMultipliers[stat] *= val;
                }
            });
        }
    });

    // Finalize stats with multipliers
    totalStats.damage = Math.floor(totalStats.damage * totalMultipliers.damage);
    totalStats.defense = Math.floor(totalStats.defense * totalMultipliers.defense);
    totalStats.block = Math.floor(totalStats.block * totalMultipliers.block);
    totalStats.heal = Math.floor(totalStats.heal * totalMultipliers.heal);
    totalStats.speed = Math.floor(totalStats.speed * totalMultipliers.speed);
    totalStats.accuracy = Math.floor(totalStats.accuracy * totalMultipliers.accuracy);

    // 3. Advanced Synergies
    const synergies = calculateSynergies(items);

    // ... rest of the function remains similar ...

    // Some synergies might modify stats immediately (e.g. Cooldown Reduction -> Speed?)
    synergies.forEach(syn => {
        if (syn.type === 'COOLDOWN_REDUCTION') {
            totalStats.speed += 2; // Arbitrary buff for now
        }
    });

    // 4. Collect On-Hit Effects from weapons
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
    round: number;
    message: string;
    type: 'DAMAGE' | 'HEAL' | 'BLOCK' | 'INFO' | 'MISS' | 'EFFECT';
}

export const resolveCombatTurn = (
    player: CombatEntity,
    enemy: CombatEntity,
    round: number
): { player: CombatEntity, enemy: CombatEntity, log: CombatLogEntry[] } => {

    // Deep copy to avoid mutating state directly
    const p = JSON.parse(JSON.stringify(player));
    const e = JSON.parse(JSON.stringify(enemy));
    const log: CombatLogEntry[] = [];

    // --- PHASE 1: Status Effects (Start of Turn) ---
    const applyStatus = (entity: CombatEntity, name: string) => {
        const newStatuses: StatusEffect[] = [];
        entity.statuses.forEach(s => {
            if (s.type === 'POISON') {
                const dmg = s.value;
                entity.hp -= dmg;
                log.push({ round, message: `${name} takes ${dmg} Poison damage.`, type: 'DAMAGE' });
                newStatuses.push(s); // Poison doesn't decay, it stacks? Or assumes duration? Spec says "Stacking DoT".
            } else if (s.type === 'FIRE') {
                const dmg = 5; // Fixed high dmg
                entity.hp -= dmg;
                log.push({ round, message: `${name} burns for ${dmg} damage!`, type: 'DAMAGE' });
                if (s.value > 1) newStatuses.push({ ...s, value: s.value - 1 });
            } else if (s.type === 'STUN') {
                // Handled in Action phase
            } else {
                newStatuses.push(s);
            }
        });
        entity.statuses = newStatuses;
    };

    applyStatus(p, "Player");
    applyStatus(e, e.name);

    if (p.hp <= 0 || e.hp <= 0) return { player: p, enemy: e, log };

    // --- PHASE 2: Actions ---

    // Check Stuns
    const playerStunned = p.statuses.some((s: StatusEffect) => s.type === 'STUN');
    const enemyStunned = e.statuses.some((s: StatusEffect) => s.type === 'STUN');

    // Decrement Stun duration
    p.statuses = p.statuses.filter((s: StatusEffect) => s.type !== 'STUN' || s.value > 1).map((s: StatusEffect) => s.type === 'STUN' ? { ...s, value: s.value - 1 } : s);
    e.statuses = e.statuses.filter((s: StatusEffect) => s.type !== 'STUN' || s.value > 1).map((s: StatusEffect) => s.type === 'STUN' ? { ...s, value: s.value - 1 } : s);

    // Player Turn
    if (!playerStunned) {
        // Accuracy Check (using average of items or base?)
        // Let's assume player has Global Accuracy for now from Stats
        const acc = p.stats.accuracy; // Base 100
        const hit = Math.random() * 100 <= acc;

        if (!hit) {
            log.push({ round, message: `You missed!`, type: 'MISS' });
        } else {
            // Calculate Damage
            const dmg = p.stats.damage;

            // Check Mitigation
            let actualDmg = Math.max(0, dmg - e.stats.defense);
            // Helper: Block is temporary HP buffer? Or separate? 
            // Spec: "Block provides temporary HP buffer". 
            if (e.stats.block > 0) {
                const blocked = Math.min(e.stats.block, actualDmg);
                e.stats.block -= blocked;
                actualDmg -= blocked;
                log.push({ round, message: `${e.name} blocked ${blocked} damage.`, type: 'BLOCK' });
            }

            e.hp -= actualDmg;
            log.push({ round, message: `You hit ${e.name} for ${actualDmg} damage!`, type: 'DAMAGE' });

            // Apply On-Hit Effects from equipped weapons
            if (p.onHitEffects) {
                p.onHitEffects.forEach((eff: { type: StatusEffect['type']; value: number; chance?: number }) => {
                    const chance = eff.chance ?? 100; // Default 100% if no chance specified
                    if (Math.random() * 100 <= chance) {
                        const existing = e.statuses.find((s: StatusEffect) => s.type === eff.type);
                        if (existing) {
                            // Stack the effect
                            existing.value += eff.value;
                            log.push({ round, message: `${eff.type} stacks on ${e.name}! (${existing.value} total)`, type: 'EFFECT' });
                        } else {
                            e.statuses.push({ type: eff.type, value: eff.value });
                            log.push({ round, message: `${e.name} is afflicted with ${eff.type}!`, type: 'EFFECT' });
                        }
                    }
                });
            }
        }
    } else {
        log.push({ round, message: `You are Stunned!`, type: 'INFO' });
    }

    // Enemy Turn
    if (!enemyStunned && e.hp > 0) { // If enemy survived and not stunned
        const dmg = e.stats.damage;

        let actualDmg = Math.max(0, dmg - p.stats.defense);
        if (p.stats.block > 0) {
            const blocked = Math.min(p.stats.block, actualDmg);
            p.stats.block -= blocked; // Block degrades? Or is it per turn?
            // Spec usually implies Block refreshes or is consumed. Let's consume it.
            actualDmg -= blocked;
            log.push({ round, message: `You blocked ${blocked} damage.`, type: 'BLOCK' });
        }

        p.hp -= actualDmg;
        log.push({ round, message: `${e.name} attacks for ${actualDmg} damage!`, type: 'DAMAGE' });
    } else if (enemyStunned) {
        log.push({ round, message: `${e.name} is Stunned!`, type: 'INFO' });
    }

    return { player: p, enemy: e, log };
};

export type EnemyType = 'AGGRESSIVE' | 'DEFENSIVE' | 'SWARM' | 'EVASIVE' | 'BOSS';

export const generateEnemy = (type: EnemyType, difficulty: number): CombatEntity => {
    const baseStats = {
        damage: 5 + difficulty,
        defense: 0,
        block: 0,
        heal: 0,
        speed: 5,
        accuracy: 90,
        maxMana: 0,
        manaRegen: 0
    };

    const entity: CombatEntity = {
        name: "Unknown",
        hp: 50 + (difficulty * 10),
        maxHp: 50 + (difficulty * 10),
        mana: 0,
        stats: baseStats,
        statuses: [],
        synergies: []
    };

    switch (type) {
        case 'AGGRESSIVE':
            entity.name = "Dire Wolf";
            entity.stats.speed = 8;
            entity.stats.damage = 10 + difficulty * 2;
            entity.hp = 40 + difficulty * 5;
            entity.maxHp = entity.hp;
            break;
        case 'DEFENSIVE':
            entity.name = "Iron Bear";
            entity.stats.defense = 5 + difficulty;
            entity.hp = 80 + difficulty * 15;
            entity.maxHp = entity.hp;
            entity.stats.speed = 3;
            break;
        case 'SWARM':
            entity.name = "Swarm of Rats";
            entity.hp = 30 + difficulty * 5;
            entity.maxHp = entity.hp;
            entity.stats.speed = 7;
            break;
        case 'EVASIVE':
            entity.name = "Mist Spirit";
            entity.stats.defense = 0;
            entity.stats.speed = 10;
            break;
        case 'BOSS':
            entity.name = "The Dragon";
            entity.hp = 500;
            entity.maxHp = 500;
            entity.stats.damage = 25;
            entity.stats.defense = 5;
            break;
    }

    return entity;
};

export const calculateCombatPower = (items: InventoryItemInstance[]): number => {
    const { stats } = calculatePlayerCombatInfo(items);
    return Math.floor(stats.damage + stats.defense + (stats.speed / 2) + (stats.block / 2));
};
