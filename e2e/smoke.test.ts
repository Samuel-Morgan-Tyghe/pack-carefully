import { expect, test } from "@playwright/test"

test.describe("Pack Carefully E2E", () => {
  test("Starts the game and renders the lobby", async ({ page }) => {
    // Navigate to the app
    await page.goto("/")
    await expect(page.locator("text=Pack Carefully")).toBeVisible()

    // Add Player 1
    const nameInput = page.getByPlaceholder("Your Name...")
    await expect(nameInput).toBeVisible()
    await nameInput.fill("Playwright Tester")
    await nameInput.press("Enter")

    // Quick validation of Sandbox navigation to bypass complex Draft phase multiplayer checks
    const sandboxButton = page.getByRole("button", {
      name: /Enter Synergy Sandbox/i,
    })
    await expect(sandboxButton).toBeVisible()
    await sandboxButton.click({ force: true })

    // Verify Sandbox transition
    await expect(page.getByText(/Synergy Sandbox/i)).toBeVisible({
      timeout: 5000,
    })
  })
})
