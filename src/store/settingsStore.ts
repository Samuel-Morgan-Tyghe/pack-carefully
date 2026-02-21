import { atom } from "nanostores"

interface GameSettings {
  soundVolume: number // 0-100
  musicVolume: number // 0-100
  gameDifficulty: "easy" | "normal" | "hard"
  gameDuration: 3 | 5 | 7 // days
  showTutorial: boolean
  reducedMotion: boolean
}

const DEFAULT_SETTINGS: GameSettings = {
  soundVolume: 70,
  musicVolume: 50,
  gameDifficulty: "normal",
  gameDuration: 5,
  showTutorial: true,
  reducedMotion: false,
}

// Load settings from localStorage
const loadSettings = (): GameSettings => {
  try {
    const stored = localStorage.getItem("pack-carefully-settings")
    if (stored) {
      const parsed = JSON.parse(stored)
      return { ...DEFAULT_SETTINGS, ...parsed }
    }
  } catch (error) {
    console.error("Failed to load settings:", error)
  }
  return DEFAULT_SETTINGS
}

// Save settings to localStorage
const saveSettings = (settings: GameSettings) => {
  try {
    localStorage.setItem("pack-carefully-settings", JSON.stringify(settings))
  } catch (error) {
    console.error("Failed to save settings:", error)
  }
}

export const $settings = atom<GameSettings>(loadSettings())

// Actions
const updateSettings = (updates: Partial<GameSettings>) => {
  const current = $settings.get()
  const newSettings = { ...current, ...updates }
  $settings.set(newSettings)
  saveSettings(newSettings)
}

export const resetSettings = () => {
  $settings.set(DEFAULT_SETTINGS)
  saveSettings(DEFAULT_SETTINGS)
}

export const setSoundVolume = (volume: number) => {
  updateSettings({ soundVolume: Math.max(0, Math.min(100, volume)) })
}

export const setMusicVolume = (volume: number) => {
  updateSettings({ musicVolume: Math.max(0, Math.min(100, volume)) })
}

export const setDifficulty = (difficulty: "easy" | "normal" | "hard") => {
  updateSettings({ gameDifficulty: difficulty })
}

export const setGameDuration = (days: 3 | 5 | 7) => {
  updateSettings({ gameDuration: days })
}

export const toggleReducedMotion = () => {
  const current = $settings.get()
  updateSettings({ reducedMotion: !current.reducedMotion })
}
