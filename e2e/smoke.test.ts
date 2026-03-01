import { test, expect } from "@playwright/test"

test.describe("Pack Carefully Core Loop", () => {
  test("Completes the Lobby and Bag Building phases", async ({ page }) => {
    // 1. Navigate to the app
    await page.goto("/")
    await expect(page.locator("text=Pack Carefully")).toBeVisible()

    // 2. Add Player 1
    const nameInput = page.getByPlaceholder("Your Name...")
    await expect(nameInput).toBeVisible()
    await nameInput.focus()
    await page.keyboard.type("Player 1", { delay: 50 })
    await page.keyboard.press("Enter")

    // Wait for Welcome back screen
    await expect(page.getByText(/Welcome Back/i)).toBeVisible()

    // 3. Dismiss Tutorial Modal if present (runs on first load)
    const tutorialClose = page.locator('.fixed.inset-0.z-50 button').first() // The X button in the tutorial header
    if (await tutorialClose.isVisible({ timeout: 2000 }).catch(() => false)) {
      await tutorialClose.click()
    }

    // 4. Start the Game
    const startButton = page.getByRole("button", { name: /Start Game/i })
    await expect(startButton).toBeVisible({ timeout: 10000 })
    await startButton.click() 

    // 5. Verify transition to phase BAG_BUILDING
    await expect(page.getByText(/CONSTRUCT YOUR PACK/i)).toBeVisible({ timeout: 10000 })
    
    // 6. Player 1 (Local Player) Bag Building
    const gridButtons = page.locator('button[title^="Toggle cell"]')
    await expect(gridButtons.first()).toBeVisible()
    
    await gridButtons.nth(0).click()
    await gridButtons.nth(1).click()

    // 7. Complete Bag Building
    const finalizeButton = page.getByRole("button", { name: /Finalize Shape/i })
    await expect(finalizeButton).toBeEnabled({ timeout: 5000 })
    await finalizeButton.click()
    
    // 8. Verify waiting state or transition
    await expect(page.getByText(/Your Inventory/i)).toBeVisible({ timeout: 10000 })
  })
})
