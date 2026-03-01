import type React from "react"

interface StatBoxProps {
  icon: React.ReactNode
  value: number | string
  label: string
  tooltip?: string
}

const StatBox: React.FC<StatBoxProps> = ({ icon, value, label, tooltip }) => (
  <div
    className="bg-slate-900 p-2 rounded flex flex-col items-center border border-slate-700 hover:bg-slate-800 transition-colors"
    data-tooltip-id="combat-tooltip"
    data-tooltip-content={tooltip}
  >
    <div className="mb-1">{icon}</div>
    <span className="text-lg font-black text-white">{value}</span>
    <span className="text-[10px] text-slate-500 uppercase tracking-wider text-center">
      {label}
    </span>
  </div>
)

export default StatBox
