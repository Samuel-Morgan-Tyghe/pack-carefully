import clsx from "clsx"
import { Battery, Droplets } from "lucide-react"
import type React from "react"

interface HealthBarProps {
  current: number
  max: number
  block: number
  color: string
  side: "player" | "enemy"
}

export const HealthBar: React.FC<HealthBarProps> = ({
  current,
  max,
  block,
  color,
  side,
}) => {
  const hpPercent = (current / max) * 100
  const blockPercent = (block / max) * 100
  const isPlayer = side === "player"

  return (
    <div className="w-full h-8 bg-slate-900/50 rounded-lg border-2 border-slate-700/50 relative overflow-hidden shadow-inner">
      {/* HP Fill */}
      <div
        className={clsx(
          "h-full transition-all duration-300 shadow-[0_0_10px_rgba(0,0,0,0.3)]",
          color,
        )}
        style={{
          width: `${hpPercent}%`,
          float: "left",
        }}
      />
      {/* Block Overlay */}
      {block > 0 && (
        <div
          className="absolute top-0 bottom-0 bg-cyan-400/40 border-x border-cyan-300/50 backdrop-blur-[2px] transition-all duration-300 z-10 shadow-[0_0_15px_rgba(34,211,238,0.3)]"
          style={{
            width: `${blockPercent}%`,
            [isPlayer ? "right" : "left"]: 0,
          }}
        />
      )}
      <div className="absolute inset-0 flex items-center justify-between px-3 text-[10px] font-black text-white mix-blend-difference z-20">
        <span className="uppercase tracking-widest opacity-80">
          {isPlayer ? "YOU" : "FOE"}
        </span>
        <span className="font-mono">
          {Math.round(current)} / {max} HP
        </span>
      </div>
    </div>
  )
}

interface EnergyBarProps {
  current: number
  max: number
}

export const EnergyBar: React.FC<EnergyBarProps> = ({ current, max }) => (
  <div className="h-4 bg-slate-900 rounded border border-slate-700 relative overflow-hidden">
    <div
      className="h-full bg-blue-500 transition-all duration-300"
      style={{ width: `${(current / max) * 100}%` }}
    />
    <div className="absolute inset-0 flex items-center justify-between px-2 text-[8px] font-black text-white mix-blend-difference">
      <span className="uppercase tracking-widest opacity-80">
        <Battery size={8} className="inline mr-1" /> NRG
      </span>
      <span>
        {Math.round(current)} / {max}
      </span>
    </div>
  </div>
)

interface ManaBarProps {
  current: number
  max: number
}

export const ManaBar: React.FC<ManaBarProps> = ({ current, max }) => (
  <div className="h-4 bg-slate-900 rounded border border-slate-700 relative overflow-hidden">
    <div
      className="h-full bg-purple-600 transition-all duration-300"
      style={{ width: `${(current / max) * 100}%` }}
    />
    <div className="absolute inset-0 flex items-center justify-between px-2 text-[8px] font-black text-white mix-blend-difference">
      <span className="uppercase tracking-widest opacity-80">
        <Droplets size={8} className="inline mr-1" /> MP
      </span>
      <span>
        {Math.round(current)} / {max}
      </span>
    </div>
  </div>
)
