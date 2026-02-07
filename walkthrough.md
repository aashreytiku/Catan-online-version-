# Walkthrough: Development Cards & UI Improvements
## Overview
This update introduces the Development Card system, Victory Point tracking, Largest Army/Longest Road mechanics, and significant UI improvements including a new Left Sidebar and Dynamic Player List.

## Features Implemented

### 1. Development Cards
- **Buying Cards**: Players can now buy Development Cards for 1 Ore, 1 Wheat, and 1 Sheep.
- **Deck**: A shuffled deck of 25 cards (14 Knights, 5 VP, 2 Road Building, 2 Year of Plenty, 2 Monopoly) is generated per game.
- **Playing Cards**:
    - **Knight**: Moves the Robber (sets phase to `moving_robber`) and increments Army Size.
    - **Year of Plenty**: Adds 2 resources (currently hardcoded or needs UI selector - MVP implementation adds 2 random or fixed). *Note: MVP implementation adds 2 resources directly.*
    - **Road Building**: Grants 2 roads (resources added for MVP).
    - **Monopoly**: Steals all of one resource type (needs UI selector - MVP implementation might need refinement).
    - **Victory Point**: Automatically counted towards VP total (hidden from opponents until end, but visible in own stats).
- **Restrictions**: Cards cannot be played the turn they are bought (except VP cards).

### 2. Victory Points & Special Cards
- **VP Tracking**: Victory points are tracked and displayed.
- **Largest Army**: Awarded to the first player to play 3 Knights. Can be stolen if another player exceeds the current holder's army size. Worth 2 VP.
- **Longest Road**: Awarded to the first player to build a continuous road of length 5. Can be stolen if another player exceeds the current length. Worth 2 VP.

### 3. UI Improvements
- **Left Sidebar**:
    - Displays "My Empire" stats: VP, Longest Road, Army Size.
    - Lists Development Cards in hand with "Play" buttons.
    - "Buy Dev Card" button with cost display.
- **Right Sidebar**:
    - Dynamic Player List showing all players, their colors, VP, Card Count, and Army Size.
    - Game Log updates.
- **Toast Notifications**: Improved styling and reduced duration (1s).
- **Build Modes**: Clearer state management for Building Settlements, Cities, and Roads.

## Verification Steps

### Manual Testing
1.  **Start the Server**: `npm run dev` in `server/`.
2.  **Start the Client**: `npm run dev` in `client/`.
3.  **Create Game**: Open browser, enter name, create game.
4.  **Join Game**: Open another browser/tab, enter name, join game using ID.
5.  **Play Loop**:
    - Roll Dice.
    - Collect Resources (use `dev_tools` or just play normally).
    - **Buy Dev Card**: Click "Buy Dev Card" (ensure you have resources). Check if card appears in Left Sidebar.
    - **Play Dev Card**: Click "Play" on a card. Verify effect (e.g., Knight moves robber, resources added).
    - **Build Road**: Build 5+ roads. Verify "Longest Road" stats and VP update.
    - **Play Knights**: Play 3+ Knights. Verify "Largest Army" stats and VP update.
    - **End Turn**: Verify Dev Cards become playable next turn.

## Known Limitations (MVP)
- **Year of Plenty / Monopoly UI**: The UI for selecting specific resources for these cards is not yet implemented (backend expects options, frontend might need a modal). Currently, they might fail or default.
- **Road Building**: Currently gives resources for 2 roads instead of placing them for free (simplification).
- **Victory Conditions**: Game doesn't automatically end at 10 VP yet (needs check).

## Next Steps
- Implement Resource Selector Modal for Year of Plenty and Monopoly.
- Implement "Game Over" screen.
- Refine Road Building to allow immediate placement.
