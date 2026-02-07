import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { gameManager } from './gameManager.js';
import type { Player } from './types.js';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ["http://localhost:5173", "http://127.0.0.1:5173"];

const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins.length > 0 ? allowedOrigins : "*",
        methods: ["GET", "POST"]
    }
});

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("create_game", (playerName: string, callback) => {
        const game = gameManager.createGame();
        const player: Player = {
            id: socket.id,
            name: playerName,
            color: '', // Assigned by gameManager
            resources: { wood: 5, brick: 5, sheep: 5, wheat: 5, ore: 5 },
            victoryPoints: 0,
            structures: [],
            developmentCards: [],
            knightsPlayed: 0,
            longestRoadSegment: 0
        };
        try {
            gameManager.addPlayer(game.id, player);
            socket.join(game.id);
            callback(game);
        } catch (e: any) {
            console.error("Error creating game:", e.message);
        }
    });

    socket.on("join_game", (gameId: string, playerName: string, callback) => {
        const player: Player = {
            id: socket.id,
            name: playerName,
            color: '', // Assigned by gameManager
            resources: { wood: 0, brick: 0, sheep: 0, wheat: 0, ore: 0 },
            victoryPoints: 0,
            structures: [],
            developmentCards: [],
            knightsPlayed: 0,
            longestRoadSegment: 0
        };
        try {
            const game = gameManager.addPlayer(gameId, player);
            if (game) {
                socket.join(gameId);
                io.to(gameId).emit("game_updated", game);
                callback({ success: true, game });
            }
        } catch (e: any) {
            callback({ success: false, error: e.message });
        }
    });

    socket.on("start_game", (gameId: string) => {
        try {
            const game = gameManager.startGame(gameId, socket.id);
            if (game) io.to(gameId).emit("game_updated", game);
        } catch (e: any) {
            socket.emit("game_error", e.message);
        }
    });

    socket.on("roll_dice", (gameId: string) => {
        try {
            const game = gameManager.rollDice(gameId, socket.id);
            if (game) io.to(gameId).emit("game_updated", game);
        } catch (e: any) {
            socket.emit("game_error", e.message);
        }
    });

    socket.on("end_turn", (gameId: string) => {
        try {
            const game = gameManager.endTurn(gameId);
            if (game) io.to(gameId).emit("game_updated", game);
        } catch (e: any) {
            socket.emit("game_error", e.message);
        }
    });

    socket.on("build_settlement", (gameId: string, location: { q: number, r: number, s: number, position: number }) => {
        try {
            const game = gameManager.buildSettlement(gameId, socket.id, location);
            if (game) io.to(gameId).emit("game_updated", game);
        } catch (e: any) {
            socket.emit("game_error", e.message);
        }
    });

    socket.on("build_city", (gameId: string, location: { q: number, r: number, s: number, position: number }) => {
        try {
            const game = gameManager.buildCity(gameId, socket.id, location);
            if (game) io.to(gameId).emit("game_updated", game);
        } catch (e: any) {
            socket.emit("game_error", e.message);
        }
    });

    socket.on("build_road", (gameId: string, location: { q: number, r: number, s: number, position: number }) => {
        try {
            const game = gameManager.buildRoad(gameId, socket.id, location);
            if (game) io.to(gameId).emit("game_updated", game);
        } catch (e: any) {
            socket.emit("game_error", e.message);
        }
    });

    socket.on("move_robber", (gameId: string, hexId: string) => {
        try {
            const game = gameManager.moveRobber(gameId, socket.id, hexId);
            if (game) io.to(gameId).emit("game_updated", game);
        } catch (e: any) {
            socket.emit("game_error", e.message);
        }
    });

    socket.on("steal_resource", (gameId: string, targetPlayerId: string) => {
        try {
            const game = gameManager.stealResource(gameId, socket.id, targetPlayerId);
            if (game) io.to(gameId).emit("game_updated", game);
        } catch (e: any) {
            socket.emit("game_error", e.message);
        }
    });

    socket.on("undo_build", (gameId: string) => {
        try {
            const game = gameManager.undoLastBuild(gameId, socket.id);
            if (game) io.to(gameId).emit("game_updated", game);
        } catch (e: any) {
            socket.emit("game_error", e.message);
        }
    });

    socket.on("propose_trade", (gameId: string, targetPlayerId: string, offer: Record<string, number>, request: Record<string, number>) => {
        try {
            const game = gameManager.proposeTrade(gameId, socket.id, targetPlayerId, offer, request);
            if (game) io.to(gameId).emit("game_updated", game);
        } catch (e: any) {
            socket.emit("game_error", e.message);
        }
    });

    socket.on("accept_trade", (gameId: string) => {
        try {
            const game = gameManager.acceptTrade(gameId, socket.id);
            if (game) io.to(gameId).emit("game_updated", game);
        } catch (e: any) {
            socket.emit("game_error", e.message);
        }
    });

    socket.on("reject_trade", (gameId: string) => {
        try {
            const game = gameManager.rejectTrade(gameId, socket.id);
            if (game) io.to(gameId).emit("game_updated", game);
        } catch (e: any) {
            socket.emit("game_error", e.message);
        }
    });

    socket.on("buy_dev_card", (gameId: string) => {
        try {
            const game = gameManager.buyDevelopmentCard(gameId, socket.id);
            if (game) io.to(gameId).emit("game_updated", game);
        } catch (e: any) {
            socket.emit("game_error", e.message);
        }
    });

    socket.on("play_dev_card", (gameId: string, cardId: string, options?: any) => {
        try {
            const game = gameManager.playDevelopmentCard(gameId, socket.id, cardId, options);
            if (game) io.to(gameId).emit("game_updated", game);
        } catch (e: any) {
            socket.emit("game_error", e.message);
        }
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
        // TODO: Handle player disconnection from games
    });
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
