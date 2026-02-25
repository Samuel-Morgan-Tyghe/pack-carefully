import type { Container, Coordinate } from "../types"
import { GRID_SIZE } from "./items/items"
import { generateId } from "./utils"

// Standard Tetromino definitions (normalized to 0,0) for invalidation
// Standard Tetromino definitions (normalized to 0,0) for invalidation
// const TETROMINOES = ... (Implementation later)

export const generateRandomContainers = (ownerId: string): Container[] => {
  const containers: Container[] = []

  // NEW PROGRESSION: Start with just ONE small pouch (Size 6)
  // Players must draft or scavenge for more space.
  const sizes = [6]

  // Grid tracking to prevent overlap between containers
  const occupied = new Set<string>()

  for (const size of sizes) {
    let attempts = 0
    let validShape = false
    let cells: Coordinate[] = []

    while (!validShape && attempts < 100) {
      attempts++
      // 1. Pick random start (Centerish)
      const startX = Math.floor(Math.random() * (GRID_SIZE - 4)) + 2
      const startY = Math.floor(Math.random() * (GRID_SIZE - 4)) + 2

      // 2. Random Walk Generation
      cells = generateRandomWalk(startX, startY, size, occupied)

      if (cells.length === size) {
        validShape = true
        for (const c of cells) {
          occupied.add(`${c.x},${c.y}`)
        }
      }
    }

    if (validShape) {
      containers.push({
        id: generateId(),
        ownerId,
        type: "POUCH",
        cells,
        capacity: size,
      })
    }
  }

  return containers
}

// --- LOOT GENERATION ---

import type { Item } from "../types"
import { ITEMS } from "./items/items"

export interface ScavengeEvent {
  id: string
  title: string
  description: string
  items: Item[]
}

export const generateLootPool = (day: number): ScavengeEvent => {
  console.log("Generating loot for day", day) // Use it to silence linter
  // Simple scenarios based on Day
  const scenarios = [
    {
      title: "Abandoned Campsite",
      description: "Looks like someone left in a hurry. Their loss.",
      pool: ["water_bottle", "sleeping_bag", "backpack"],
    },
    {
      title: "Overturned Merchant Cart",
      description: "Wares scattered everywhere. Some of it is still useful.",
      pool: ["flashlight", "backpack", "dagger"],
    },
    {
      title: "Ancient Ruins",
      description: "Old magic lingers here.",
      pool: ["knights_crest", "first_aid"],
    },
    {
      title: "Battlefield Remnants",
      description: "A skirmish happened here recently.",
      pool: ["dagger", "knights_crest", "first_aid"],
    },
    {
      title: "Lost Hiker's Stash",
      description: "Poor soul. They won't need this anymore.",
      pool: ["water_bottle", "flashlight", "rock"],
    },
  ]

  // Pick random scenario
  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)]

  // Pick 3-5 random items from the scenario's pool
  const numItems = 3 + Math.floor(Math.random() * 3)
  const loot: Item[] = []

  for (let i = 0; i < numItems; i++) {
    const itemId =
      scenario.pool[Math.floor(Math.random() * scenario.pool.length)]
    const item = ITEMS[itemId]
    if (item) loot.push(item)
  }

  return {
    id: `scavenge-${Date.now()}`,
    title: scenario.title,
    description: scenario.description,
    items: loot,
  }
}

const generateRandomWalk = (
  startX: number,
  startY: number,
  length: number,
  occupied: Set<string>,
): Coordinate[] => {
  const cells: Coordinate[] = [{ x: startX, y: startY }]
  const visited = new Set<string>([`${startX},${startY}`])

  if (occupied.has(`${startX},${startY}`)) return []

  let current = { x: startX, y: startY }

  while (cells.length < length) {
    // Get neighbors
    const neighbors = [
      { x: current.x + 1, y: current.y },
      { x: current.x - 1, y: current.y },
      { x: current.x, y: current.y + 1 },
      { x: current.x, y: current.y - 1 },
    ].filter(
      (n) =>
        n.x >= 0 &&
        n.x < GRID_SIZE &&
        n.y >= 0 &&
        n.y < GRID_SIZE &&
        !visited.has(`${n.x},${n.y}`) &&
        !occupied.has(`${n.x},${n.y}`),
    )

    if (neighbors.length === 0) break // Trapped

    // Pick random neighbor
    const next = neighbors[Math.floor(Math.random() * neighbors.length)]
    cells.push(next)
    visited.add(`${next.x},${next.y}`)
    current = next // Walk from the new cell (Snake style)
    // Or walk from random existing cell (Blob style)?
    // Let's mix it: 50% chance to reset current to a random existing cell
    if (Math.random() > 0.5) {
      current = cells[Math.floor(Math.random() * cells.length)]
    }
  }

  return cells.length === length ? cells : []
}
