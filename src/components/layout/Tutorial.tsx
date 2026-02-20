import { useStore } from "@nanostores/react"
import { AnimatePresence, motion } from "framer-motion"
import * as LucideIcons from "lucide-react"
import type React from "react"
import { useEffect, useState } from "react"
import { $phase } from "../../store/gameStore"

interface TutorialStep {
  title: string
  description: string
  icon: keyof typeof LucideIcons
  tips?: string[]
}

const tutorialSteps: TutorialStep[] = [
  {
    title: "Welcome to Pack Carefully!",
    description:
      "A social deduction game where you must pack your backpack strategically and survive the wilderness. But beware - one player is a traitor trying to sabotage the group!",
    icon: "Map",
    tips: [
      "Work together with other hikers",
      "Watch for suspicious behavior",
      "Pack smart - space is limited!",
    ],
  },
  {
    title: "Container System",
    description:
      "Items MUST be placed inside containers (backpacks, pouches, pockets). You cannot place items in empty space!",
    icon: "Backpack",
    tips: [
      "Start by placing containers on your grid",
      "Then place items INSIDE the containers",
      "Invalid placements will show in red",
    ],
  },
  {
    title: "Keyboard Shortcuts",
    description: "Master these shortcuts to pack efficiently:",
    icon: "Keyboard",
    tips: [
      "Click: Select an item",
      "R or E: Rotate clockwise",
      "Q: Rotate counter-clockwise",
      "Space: Lock/unlock item",
      "Delete/Backspace: Remove item",
      "Tab: Cycle through items",
      "Escape: Cancel drag",
    ],
  },
  {
    title: "Adjacency Bonuses",
    description:
      "Strategic placement matters! Items next to each other can provide bonuses or penalties.",
    icon: "Sparkles",
    tips: [
      "Knife near essentials: +5 Defense",
      "Potion near weapons: +10 Damage",
      "Cursed Scrap: Debuffs neighbors!",
      "Look for the golden glow",
    ],
  },
  {
    title: "Game Phases",
    description: "The game progresses through multiple phases each day:",
    icon: "Calendar",
    tips: [
      "DRAFT: Pick items snake-draft style",
      "PACKING: Organize your backpack",
      "JOURNEY: Choose paths and face encounters",
      "CAMPFIRE: Rest and prepare",
      "Survive 5 days to win!",
    ],
  },
  {
    title: "Roles & Victory",
    description: "Each player is secretly assigned a role at the start:",
    icon: "Users",
    tips: [
      "HIKERS: Survive 5 days together",
      "TRAITOR: Sabotage the group without being caught",
      "Traitor can pick sabotage items (rocks, broken items)",
      "Keep morale above 0 to survive",
    ],
  },
]

const Tutorial: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false)
  const phase = useStore($phase)

  useEffect(() => {
    // Check if user has seen tutorial
    const seen = localStorage.getItem("pack-carefully-tutorial-seen")
    if (!seen && phase === "LOBBY") {
      setIsOpen(true)
    } else {
      setHasSeenTutorial(true)
    }
  }, [phase])

  const handleClose = () => {
    setIsOpen(false)
    setCurrentStep(0)
    localStorage.setItem("pack-carefully-tutorial-seen", "true")
    setHasSeenTutorial(true)
  }

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleClose()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const currentTutorial = tutorialSteps[currentStep]
  const Icon = (LucideIcons[currentTutorial.icon] ||
    LucideIcons.HelpCircle) as React.ElementType

  return (
    <>
      {/* Help Button */}
      {hasSeenTutorial && !isOpen && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-8 right-8 z-50 bg-blue-600 hover:bg-blue-500 text-white rounded-full p-4 shadow-lg hover:shadow-blue-500/50 transition-all"
          aria-label="Open tutorial"
        >
          <LucideIcons.HelpCircle size={28} />
        </motion.button>
      )}

      {/* Tutorial Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={handleClose}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full border-2 border-slate-700 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-3 rounded-full">
                    <Icon size={32} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-wider">
                      {currentTutorial.title}
                    </h2>
                    <div className="text-blue-200 text-sm font-bold">
                      Step {currentStep + 1} of {tutorialSteps.length}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
                >
                  <LucideIcons.X size={24} />
                </button>
              </div>

              {/* Content */}
              <div className="p-8">
                <p className="text-slate-200 text-lg mb-6 leading-relaxed">
                  {currentTutorial.description}
                </p>

                {currentTutorial.tips && (
                  <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                    <div className="flex items-center gap-2 mb-4">
                      <LucideIcons.Lightbulb
                        size={20}
                        className="text-yellow-400"
                      />
                      <h3 className="text-yellow-400 font-bold uppercase text-sm tracking-wider">
                        Key Points
                      </h3>
                    </div>
                    <ul className="space-y-2">
                      {currentTutorial.tips.map((tip) => (
                        <li
                          key={tip}
                          className="flex items-start gap-3 text-slate-300"
                        >
                          <LucideIcons.CheckCircle2
                            size={18}
                            className="text-green-400 mt-0.5 flex-shrink-0"
                          />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-slate-900/50 p-6 flex items-center justify-between border-t border-slate-700">
                {/* Progress Dots */}
                <div className="flex gap-2">
                  {tutorialSteps.map((_, idx) => (
                    <button
                      type="button"
                      key={`step-${idx}-${tutorialSteps.length}`}
                      onClick={() => setCurrentStep(idx)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx === currentStep
                          ? "bg-blue-500 w-6"
                          : idx < currentStep
                            ? "bg-blue-700"
                            : "bg-slate-600"
                      }`}
                      aria-label={`Go to step ${idx + 1}`}
                    />
                  ))}
                </div>

                {/* Navigation Buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handlePrev}
                    disabled={currentStep === 0}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors flex items-center gap-2"
                  >
                    <LucideIcons.ChevronLeft size={18} />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors flex items-center gap-2"
                  >
                    {currentStep === tutorialSteps.length - 1 ? (
                      <>
                        Got it!
                        <LucideIcons.Check size={18} />
                      </>
                    ) : (
                      <>
                        Next
                        <LucideIcons.ChevronRight size={18} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Tutorial
