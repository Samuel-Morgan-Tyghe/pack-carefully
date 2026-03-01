# Testing Implementation Plan

- [x] Install Vitest and testing-library for React/DOM
- [x] Configure `vite.config.ts` to include Vitest
- [x] Add `"test": "vitest"` script to `package.json`
- [x] **Vitest Without Mocks Approach**:
  - [x] Create a `gameStore.test.ts` to test internal logic (`placeItem`, state transitions, draft phase updates).
  - [x] Inject real item definitions inside the test runtime.
- [x] **Combat and Synergy Refactor**:
  - [x] Port `crafting.test.ts` into a Vitest suite.
  - [x] Port `synergies.test.ts` into a Vitest suite.
  - [x] Test `processCombatTick` locally
- [x] **E2E Playwright Setup**:
  - [x] Boot dev server autonomously via Playwright config.
  - [x] Write `smoke.test.ts` to click through Lobby -> Bag Building -> Draft routing.
- [x] Ensure `npx vitest run` passes autonomously.
- [x] Ensure `npm run test:e2e` passes autonomously.
- [x] Add testing suites into Husky Pre-commit checks.
