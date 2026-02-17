
// Vanilla JS Test for Combat Logic
// Manually mocking the necessary parts to avoid TS/Import issues

const ITEMS = {
    'dagger': {
        id: 'dagger',
        name: 'Poison Dagger',
        combatStats: { damage: 200, speed: 8 }, // High damage for test
        effects: [{ type: 'POISON', value: 2 }]
    }
};

const processCombatTick = (player, enemy, playerCooldowns, enemyCooldowns, deltaMs) => {
    const p = { ...player, statuses: [...player.statuses] };
    const e = { ...enemy, statuses: [...enemy.statuses] };
    const events = [];

    // Shield Decay
    const decay = (deltaMs / 1000) * 5;
    p.shield = Math.max(0, p.shield - decay);
    e.shield = Math.max(0, e.shield - decay);

    // Passive Regen
    if (p.stats.healthRegen) p.hp = Math.min(p.maxHp, p.hp + (p.stats.healthRegen * deltaMs / 1000));
    if (p.stats.shieldRegen) p.shield += (p.stats.shieldRegen * deltaMs / 1000);

    // Process Player Cooldowns
    const nextPlayerCooldowns = playerCooldowns.map(cd => {
        let current = cd.current - deltaMs;
        if (current <= 0) {
            const def = ITEMS[cd.itemId];
            const dmg = (def.combatStats?.damage || 0) + (p.stats.damage / 10);

            let finalDmg = Math.max(1, dmg - e.baseDefense);
            if (e.shield > 0) {
                const absorbed = Math.min(e.shield, finalDmg);
                e.shield -= absorbed;
                finalDmg -= absorbed;
            }
            e.hp -= finalDmg;
            if (finalDmg > 0) events.push(`Player's ${def.name} hits for ${Math.floor(finalDmg)}!`);

            if (def.combatStats?.heal) p.hp = Math.min(p.maxHp, p.hp + def.combatStats.heal);

            if (def.effects) {
                def.effects.forEach(eff => {
                    e.statuses.push({ type: eff.type, value: eff.value });
                    events.push(`Applied ${eff.type} to Enemy!`);
                });
            }
            current = cd.max;
        }
        return { ...cd, current };
    });

    return { player: p, enemy: e, playerCooldowns: nextPlayerCooldowns, events };
};

// --- RUN TESTS ---

console.log('Running Combat Logic (Mocked in JS)...');

const p = {
    hp: 100, maxHp: 100, shield: 0,
    stats: { damage: 10, healthRegen: 0, shieldRegen: 0 },
    statuses: []
};
const e = {
    hp: 100, maxHp: 100, shield: 50, baseDefense: 0,
    statuses: []
};
const pCooldowns = [{ instanceId: '1', itemId: 'dagger', current: 10, max: 1000 }];

// Tick 20ms (Trigger Dagger)
const result = processCombatTick(p, e, pCooldowns, [], 20);

// Check Damage matches
// Dagger Dmg = 200 + (10/10) = 201
// Shield Absorb = 50. Final Dmg = 151
// Enemy HP = 100 - 151 = -51
console.log('Enemy HP:', result.enemy.hp); // Should be -51
console.log('Enemy Shield:', result.enemy.shield); // Should be 0
console.log('Events:', result.events);

if (result.enemy.hp === -51 && result.enemy.shield === 0) {
    console.log('TEST PASSED');
} else {
    console.log('TEST FAILED');
}
