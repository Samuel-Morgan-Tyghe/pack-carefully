import type React from "react"
import { useEffect, useRef } from "react"

const AppInitializer: React.FC = () => {
  const initialized = useRef(false)

  useEffect(() => {
    // Prevent double-initialization in React.StrictMode
    if (initialized.current) return

    // No longer auto-adding players to allow for the new join flow.
    initialized.current = true
  }, [])

  return null // This component renders nothing
}

export default AppInitializer
