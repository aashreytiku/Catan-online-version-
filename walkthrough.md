# Hex Empire - Multiplayer Strategy Game

## Overview
**Hex Empire** is a real-time multiplayer strategy game inspired by Settlers of Catan. It features a hexagonal grid map, resource management, building mechanics, and live trading between players.

The project is built as a modern **Client-Server** web application.

## Technologies
- **Frontend (Client)**: React 19, TypeScript, Vite, TailwindCSS 4, Framer Motion.
- **Backend (Server)**: Node.js, Express, Socket.io, TypeScript.
- **Networking**: Real-time bidirectional communication via Socket.io.

## Project Structure
The repository is a monorepo containing two main directories:
- `/client`: The frontend React application (runs in the browser).
- `/server`: The backend Node.js application (manages game state).

## Getting Started

### Prerequisites
- **Node.js** (v18 or higher)
- **Git**

### Installation
You need to install dependencies for **both** the client and the server.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/aashreytiku/Catan-online-version-.git
    cd Catan-online-version-
    ```

2.  **Install Server Dependencies:**
    ```bash
    cd server
    npm install
    ```

3.  **Install Client Dependencies:**
    ```bash
    cd ../client
    npm install
    ```

### Running the Game Locally
You must run **two separate terminal windows** to play the game locally.

**Terminal 1 (Server):**
```bash
cd server
npm run dev
# Server starts on http://localhost:3000
```

**Terminal 2 (Client):**
```bash
cd client
npm run dev
# Client starts on http://localhost:5173
```

Open `http://localhost:5173` in your browser to play!

## Configuration

### Local Development
The client is configured to connect to `http://localhost:3000` by default.
For customization, you can create a `.env.local` file in the `/client` directory:
```env
VITE_SERVER_URL=http://localhost:3000
```

### Deployment
To deploy the game:
1.  **Server**: Deploy the `/server` directory to a Node.js host (e.g., Render, Railway, Heroku).
    - set `ALLOWED_ORIGINS` env var to your client URL (e.g. `https://my-game.vercel.app`).
2.  **Client**: Deploy the `/client` directory to a static host (e.g., Vercel, Netlify).
    - Set the `VITE_SERVER_URL` environment variable to your deployed server address (e.g., `https://my-game-api.onrender.com`).

## Gameplay Guide

### Objective
Earn **10 Victory Points (VP)** to win. Points are earned by:
-   **Settlements**: 1 VP
-   **Cities**: 2 VP
-   **Longest Road**: 2 VP (Must be >= 5 segments)
-   **Largest Army**: 2 VP (Must differ by >= 3 knights)
-   **Victory Point Cards**: 1 VP (Hidden)

### Controls
-   **Build**: Click the buttons on the left or press `B` to open build menu.
-   **Trade**: Click "Trade" to offer resources to other players.
-   **Chat**: (Coming Soon)
-   **Map Interaction**: Click hexes to move the Robber, edges to build roads, and vertices to build settlements.

## Key Features
-   **Dynamic Map**: Randomly generated hex terrain and number tokens.
-   **Real-time Updates**: Actions by other players (building, rolling dice, trading) appear instantly.
-   **Development Cards**: Buy cards to get Knights (move robber), Victory Points, or special abilities.
-   **Robber & Stealing**: Rolling a 7 activates the Robber, allowing you to block resources and steal from players.
