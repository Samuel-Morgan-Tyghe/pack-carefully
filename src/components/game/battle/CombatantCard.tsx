import clsx from "clsx"
import { Battery, Shield, Skull, Sword, Zap } from "lucide-react"
import type React from "react"
import { groupStatusEffects } from "../../../lib/combat"
import type { CombatEntity, ItemCooldown } from "../../../types"
import Inventory from "../../Inventory"
import BuffHUD, { StatusBadge } from "./BuffHUD"
import { EnergyBar, HealthBar, ManaBar } from "./CombatBars"
import StatBox from "./StatBox"

interface CombatantCardProps {
  entity: CombatEntity
  cooldowns: ItemCooldown[]
  side: "player" | "enemy"
}

const CombatantCard: React.FC<CombatantCardProps> = ({
  entity,
  cooldowns,
  side,
}) => {
  const isPlayer = side === "player"
  const bgColor = isPlayer ? "bg-wood-950/40" : "bg-red-950/20"
  const borderColor = isPlayer ? "border-wood-700/50" : "border-red-900/30"
  const iconColor = isPlayer ? "text-blue-400" : "text-red-500"
  const statsColor = isPlayer ? "text-blue-300" : "text-red-300"
  const MainIcon = isPlayer ? Sword : Skull

  const slowStacks = entity.statuses
    .filter((s) => s.type === "SLOW")
    .reduce((sum, s) => sum + s.value, 0)
  const slowPenalty = Math.min(0.5, slowStacks * 0.05)
  const effectiveTriggerSpeed = entity.stats.triggerSpeed * (1 - slowPenalty)
  const isSlowed = slowPenalty > 0

  return (
    <div
      className={clsx(
        "flex-1 flex flex-col gap-4 rounded-2xl p-4 border-2 relative overflow-hidden",
        bgColor,
        borderColor,
      )}
    >
      <div
        className={clsx(
          "absolute top-0 p-2 opacity-5 pointer-events-none",
          isPlayer ? "right-0" : "left-0",
        )}
      >
        <MainIcon size={120} />
      </div>

      <div
        className={clsx(
          "flex justify-between items-center relative z-10",
          !isPlayer && "flex-row-reverse",
        )}
      >
        <h2
          className={clsx(
            "text-xl md:text-2xl font-black flex items-center gap-2 drop-shadow-md",
            iconColor,
          )}
        >
          {isPlayer ? (
            <>
              <span>{entity.name}</span>
              <div className="flex gap-1">
                {groupStatusEffects(entity.statuses).map((s, i) => (
                  <StatusBadge key={`${s.type}-${i}`} status={s} />
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex gap-1">
                {groupStatusEffects(entity.statuses).map((s, i) => (
                  <StatusBadge key={`${s.type}-${i}`} status={s} />
                ))}
              </div>
              <span>{entity.name}</span>
            </>
          )}
        </h2>
        <div
          className={clsx(
            "font-mono font-bold flex flex-col",
            statsColor,
            isPlayer ? "items-end text-right" : "items-start text-left",
          )}
        >
          <div className="flex items-center gap-2 text-xs opacity-70">
            <Shield
              size={12}
              className={isPlayer ? "text-cyan-400" : "text-red-400"}
            />
            <span>BLOCK: {Math.round(entity.block)}</span>
          </div>
          <div>
            {Math.round(entity.hp)} / {entity.maxHp} HP
          </div>
        </div>
      </div>

      <HealthBar
        current={entity.hp}
        max={entity.maxHp}
        block={entity.block}
        color={"bg-red-600"}
        side={side}
      />
      <BuffHUD entity={entity} />
      <div className="grid grid-cols-2 gap-2 mt-2">
        <EnergyBar current={entity.energy} max={entity.maxEnergy} />
        <ManaBar current={entity.mana} max={entity.maxMana} />
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 relative z-10">
        <StatBox
          icon={<Sword size={14} className="text-red-400" />}
          value={entity.stats.damage}
          label="DMG"
          tooltip={`Total damage output per trigger of ${isPlayer ? "your" : "enemy"} weapons.`}
        />
        <StatBox
          icon={<Shield size={14} className="text-blue-400" />}
          value={Math.round(entity.block)}
          label="BLK"
          tooltip={`Current damage absorption${isPlayer ? ". Block decays over time." : " for the enemy."}`}
        />
        <StatBox
          icon={<Battery size={14} className="text-amber-400" />}
          value={`${Math.round(entity.stats.energyRegen)}/s`}
          label="NRG"
          tooltip={`${isPlayer ? "Energy" : "Enemy energy"} regeneration rate per second.`}
        />
        <StatBox
          icon={
            <Zap
              size={14}
              className={clsx(
                "text-purple-400",
                isSlowed && "text-blue-400 animate-pulse",
              )}
            />
          }
          value={`${effectiveTriggerSpeed.toFixed(1)}x`}
          label="SPD"
          tooltip={
            isSlowed
              ? `${isPlayer ? "Your" : "Enemy"} speed is reduced by ${Math.round(slowPenalty * 100)}% due to SLOW (${slowStacks} stacks). Base: ${entity.stats.triggerSpeed.toFixed(1)}x`
              : `${isPlayer ? "Trigger" : "Enemy trigger"} speed multiplier.`
          }
        />
      </div>

      <div className="flex-1 flex items-center justify-center p-2 min-h-0 overflow-visible">
        <div className="scale-[0.55] sm:scale-75 md:scale-90 lg:scale-100 transition-transform origin-center">
          <Inventory
            playerId={entity.id}
            items={entity.inventory}
            containers={entity.containers}
            viewOnly={true}
            cooldowns={Object.fromEntries(
              cooldowns.map((cd) => [
                cd.instanceId,
                (1 - cd.current / cd.max) * 100,
              ]),
            )}
            className="!p-4"
          />
        </div>
      </div>
    </div>
  )
}

export default CombatantCard
