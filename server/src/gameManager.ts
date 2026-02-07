import type { GameState, Player } from './types.js';
import { generateMap } from './mapGenerator.js';
import { v4 as uuidv4 } from 'uuid';

export class GameManager {
    private games: Map<string, GameState> = new Map();

    createGame(): GameState {
        const id = uuidv4();
        const newGame: GameState = {
            id,
            players: [],
            hexes: generateMap(),
            structures: [],
            currentTurnPlayerId: '',
            diceRoll: null,
            robberHexId: null,
            status: 'waiting',
            phase: 'setup_round_1',
            turnOrder: [],
            setupTurnIndex: 0,
            logs: [],
            hasUndone: false,
            structuresBuiltThisTurn: [],
            activeTrade: null,
            devCardDeck: this.generateDevCardDeck(),
            largestArmyPlayerId: null,
            longestRoadPlayerId: null
        };
        this.games.set(id, newGame);
        return newGame;
    }

    private generateDevCardDeck(): any[] {
        const deck: any[] = [];
        for (let i = 0; i < 14; i++) deck.push('knight');
        for (let i = 0; i < 5; i++) deck.push('victory_point');
        for (let i = 0; i < 2; i++) deck.push('road_building');
        for (let i = 0; i < 2; i++) deck.push('year_of_plenty');
        for (let i = 0; i < 2; i++) deck.push('monopoly');

        // Shuffle
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        console.log(`[Game ${uuidv4()}] Generated Dev Card Deck (${deck.length} cards):`, deck.map(c => c.substring(0, 3)).join(', '));
        return deck;
    }

    getGame(gameId: string): GameState | undefined {
        return this.games.get(gameId);
    }

    addPlayer(gameId: string, player: Player): GameState | null {
        const game = this.games.get(gameId);
        if (!game) throw new Error(`Game ${gameId} not found`);
        if (game.status !== 'waiting') throw new Error(`Game is already in progress`);
        if (game.players.length >= 4) throw new Error(`Game is full`);

        // Assign color
        const colors = ['red', 'blue', 'green', 'orange'];
        const usedColors = game.players.map(p => p.color);
        const availableColor = colors.find(c => !usedColors.includes(c)) || 'white';
        player.color = availableColor;

        // Initialize resources (10 of each for testing/start)
        player.resources = {
            brick: 10,
            wood: 10,
            sheep: 10,
            wheat: 10,
            ore: 10
        };

        player.developmentCards = [];
        player.knightsPlayed = 0;
        player.longestRoadSegment = 0;

        game.players.push(player);
        return game;
    }

    startGame(gameId: string, playerId: string): GameState | null {
        const game = this.games.get(gameId);
        if (!game) throw new Error("Game not found");
        if (game.players.length < 1) throw new Error("Not enough players");
        if (game.players[0]!.id !== playerId) throw new Error("Only host can start game");

        game.status = 'playing';
        game.phase = 'setup_round_1';
        game.subPhase = 'building_settlement';

        // Snake draft order: P1, P2, P3, P4, P4, P3, P2, P1
        // For now, just simple order for setup round 1
        game.turnOrder = game.players.map(p => p.id);
        game.currentTurnPlayerId = game.turnOrder[0] || '';
        game.setupTurnIndex = 0;

        // Initialize Robber on Desert
        const desertHex = game.hexes.find(h => h.terrain === 'desert');
        if (desertHex) {
            game.robberHexId = desertHex.id;
        }

        return game;
    }

    removePlayer(gameId: string, playerId: string): void {
        const game = this.games.get(gameId);
        if (game) {
            game.players = game.players.filter(p => p.id !== playerId);
            if (game.players.length === 0) {
                this.games.delete(gameId);
            }
        }
    }

    rollDice(gameId: string, playerId: string): GameState | null {
        const game = this.games.get(gameId);
        if (!game || game.status !== 'playing') throw new Error("Game not active");
        if (game.currentTurnPlayerId !== playerId) throw new Error("Not your turn");
        if (game.phase !== 'playing') throw new Error("Cannot roll dice in this phase");

        const die1 = Math.floor(Math.random() * 6) + 1;
        const die2 = Math.floor(Math.random() * 6) + 1;
        const total = die1 + die2;

        game.diceRoll = total;

        if (total === 7) {
            // Robber activated
            console.log("Robber activated!");
            this.logAction(game, `${game.players.find(p => p.id === playerId)?.name} rolled a 7! Robber activated.`);
            game.phase = 'moving_robber';
        } else {
            this.logAction(game, `${game.players.find(p => p.id === playerId)?.name} rolled a ${total}.`);
            this.distributeResources(game, total);
        }

        return game;
    }

    private distributeResources(game: GameState, roll: number): void {
        if (roll === 7) return;

        // Find hexes with this number
        const hexes = game.hexes.filter(h => h.numberToken === roll && h.id !== game.robberHexId);

        hexes.forEach(hex => {
            if (!hex.resource) return;

            // Find all structures that are on the vertices of this hex
            // A structure is on this hex if any of its equivalent locations matches this hex
            const eligibleStructures = game.structures.filter(s => {
                if (s.type === 'road') return false;
                const equivalents = this.getEquivalentVertices(s.location.q, s.location.r, s.location.s, s.location.position);
                return equivalents.some(eq => eq.q === hex.q && eq.r === hex.r && eq.s === hex.s);
            });

            eligibleStructures.forEach(structure => {
                const player = game.players.find(p => p.id === structure.playerId);
                if (player && hex.resource) {
                    const amount = structure.type === 'city' ? 2 : 1;
                    player.resources[hex.resource] += amount;
                    console.log(`Given ${amount} ${hex.resource} to ${player.name}`);
                    this.logAction(game, `${player.name} received ${amount} ${hex.resource}.`);
                }
            });
        });
    }

    endTurn(gameId: string): GameState | null {
        const game = this.games.get(gameId);
        if (!game || game.status !== 'playing') throw new Error("Game not active");

        const currentPlayerIndex = game.players.findIndex(p => p.id === game.currentTurnPlayerId);
        if (currentPlayerIndex === -1) throw new Error("Player not found");

        // Refresh Dev Cards for current player (make them playable next turn)
        const currentPlayer = game.players[currentPlayerIndex];
        if (currentPlayer) {
            currentPlayer.developmentCards.forEach(c => c.isNew = false);
        }

        const nextPlayerIndex = (currentPlayerIndex + 1) % game.players.length;
        game.currentTurnPlayerId = game.players[nextPlayerIndex]!.id;
        game.diceRoll = null; // Reset dice for next player
        game.hasUndone = false; // Reset undo status
        game.structuresBuiltThisTurn = []; // Reset tracked structures
        this.logAction(game, `Turn ended. It is now ${game.players[nextPlayerIndex]!.name}'s turn.`);

        return game;
    }

    buildSettlement(gameId: string, playerId: string, location: { q: number, r: number, s: number, position: number }): GameState | null {
        const game = this.games.get(gameId);
        if (!game || game.status !== 'playing') throw new Error("Game not active");
        if (game.currentTurnPlayerId !== playerId) throw new Error("Not your turn");

        // Check phase
        if (game.phase.startsWith('setup') && game.subPhase !== 'building_settlement') throw new Error("Not in settlement building phase");

        const player = game.players.find(p => p.id === playerId);
        if (!player) throw new Error("Player not found");

        // Validate Distance Rule
        if (!this.validateSettlementPlacement(game, location, playerId)) {
            throw new Error("Invalid placement: Too close to another settlement or not connected to road");
        }

        // Cost check (skip if setup)
        const isSetup = game.phase.startsWith('setup');
        if (!isSetup) {
            if (player.resources.brick < 1 || player.resources.wood < 1 || player.resources.sheep < 1 || player.resources.wheat < 1) {
                throw new Error("Not enough resources (1 Brick, 1 Wood, 1 Sheep, 1 Wheat)");
            }
            // Deduct resources
            player.resources.brick--;
            player.resources.wood--;
            player.resources.sheep--;
            player.resources.wheat--;
        }

        // Add structure
        const structure: any = {
            id: uuidv4(),
            type: 'settlement',
            playerId,
            location
        };

        game.structures.push(structure);
        player.structures.push(structure);
        player.victoryPoints++;
        game.structuresBuiltThisTurn.push(structure.id);
        this.logAction(game, `${player.name} built a Settlement.`);

        // Handle Setup Phase Logic
        if (isSetup) {
            game.subPhase = 'building_road';
        } else {
            // Building a settlement might break an opponent's road!
            // For MVP, we might skip this complexity, but strictly speaking we should re-calc longest road for everyone.
            // But usually settlements don't break roads in Catan, they just sit on them.
            // Actually, you can build a settlement on an opponent's road (if distance rule allows) and it breaks the road?
            // No, in Catan you can only build on your own roads or open spots.
            // Wait, you can build a settlement to interrupt an opponent's longest road if it's an open spot.
            // But validateSettlementPlacement checks for distance rule.
            // If valid, we should re-check longest road for everyone?
            // For MVP, let's just check for the current player in buildRoad.
        }

        return game;
    }

    buildRoad(gameId: string, playerId: string, location: { q: number, r: number, s: number, position: number }): GameState | null {
        const game = this.games.get(gameId);
        if (!game || game.status !== 'playing') throw new Error("Game not active");
        if (game.currentTurnPlayerId !== playerId) throw new Error("Not your turn");

        // Check phase
        if (game.phase.startsWith('setup') && game.subPhase !== 'building_road') throw new Error("Not in road building phase");

        const player = game.players.find(p => p.id === playerId);
        if (!player) throw new Error("Player not found");

        // Cost check (skip if setup or road building dev card)
        const isSetup = game.phase.startsWith('setup');
        const isRoadBuildingDev = game.phase === 'road_building_dev';

        if (!isSetup && !isRoadBuildingDev) {
            if (player.resources.brick < 1 || player.resources.wood < 1) {
                throw new Error("Not enough resources (1 Brick, 1 Wood)");
            }
            // Deduct resources
            player.resources.brick--;
            player.resources.wood--;
        }

        // Validate Placement Rules
        if (isSetup) {
            // In setup, road must connect to the latest settlement
            const latestSettlement = player.structures.filter(s => s.type === 'settlement').pop();
            if (!latestSettlement) throw new Error("No settlement found to connect to");

            // Check if road connects to this specific settlement
            const v1 = location.position;
            const v2 = (location.position + 1) % 6;

            const isConnectedTo = (vertexIndex: number) => {
                const equivalents = this.getEquivalentVertices(location.q, location.r, location.s, vertexIndex);
                return equivalents.some(eq =>
                    eq.q === latestSettlement.location.q &&
                    eq.r === latestSettlement.location.r &&
                    eq.s === latestSettlement.location.s &&
                    eq.position === latestSettlement.location.position
                );
            };

            if (!isConnectedTo(v1) && !isConnectedTo(v2)) {
                throw new Error("Setup Road must connect to latest settlement");
            }

        } else {
            // Normal phase: must connect to any of own structures
            if (!this.validateRoadPlacement(game, playerId, location)) {
                throw new Error("Invalid road placement: Must connect to your road or settlement");
            }
        }

        // Decrement free roads count ONLY if validation passed
        if (isRoadBuildingDev) {
            if (game.roadsToBuild && game.roadsToBuild > 0) {
                game.roadsToBuild--;
            }
        }

        // Add structure
        const structure: any = {
            id: uuidv4(),
            type: 'road',
            playerId,
            location
        };

        game.structures.push(structure);
        player.structures.push(structure);
        game.structuresBuiltThisTurn.push(structure.id);
        this.logAction(game, `${player.name} built a Road.`);

        // Update Longest Road
        this.updateLongestRoad(game, playerId);

        // Handle Setup Phase Progression
        if (isSetup) {
            this.advanceSetupPhase(game);
        } else if (isRoadBuildingDev && (!game.roadsToBuild || game.roadsToBuild === 0)) {
            // End road building phase
            game.phase = 'playing';
            delete game.roadsToBuild;
            this.logAction(game, `${player.name} finished placing free roads.`);
        }

        return game;
    }

    buildCity(gameId: string, playerId: string, location: { q: number, r: number, s: number, position: number }): GameState | null {
        const game = this.games.get(gameId);
        if (!game || game.status !== 'playing') throw new Error("Game not active");
        if (game.currentTurnPlayerId !== playerId) throw new Error("Not your turn");
        if (game.phase.startsWith('setup')) throw new Error("Cannot build cities during setup");

        const player = game.players.find(p => p.id === playerId);
        if (!player) throw new Error("Player not found");

        // Cost check: 3 Ore, 2 Wheat
        if (player.resources.ore < 3 || player.resources.wheat < 2) {
            throw new Error("Not enough resources (3 Ore, 2 Wheat)");
        }

        // Find existing settlement at this location
        // We need to check equivalents too, but simpler: find the structure object that matches.
        // Actually, we should use isVertexOccupied logic to find the specific structure ID.

        const equivalents = this.getEquivalentVertices(location.q, location.r, location.s, location.position);
        const existingSettlement = game.structures.find(s =>
            s.type === 'settlement' &&
            equivalents.some(eq =>
                s.location.q === eq.q &&
                s.location.r === eq.r &&
                s.location.s === eq.s &&
                s.location.position === eq.position
            )
        );

        if (!existingSettlement) {
            throw new Error("No settlement exists at this location to upgrade");
        }

        if (existingSettlement.playerId !== playerId) {
            throw new Error("You can only upgrade your own settlements");
        }

        // Deduct resources
        player.resources.ore -= 3;
        player.resources.wheat -= 2;

        // Upgrade structure
        existingSettlement.type = 'city';

        // Update VP (Settlement was 1, City is 2, so +1)
        player.victoryPoints++;

        // Track for undo?
        // If we undo a city, we downgrade to settlement.
        // For simplicity, let's treat it as a new build action for undo purposes?
        // Or just modify the existing structure.
        // Let's add to structuresBuiltThisTurn so we can undo it.
        game.structuresBuiltThisTurn.push(existingSettlement.id);

        this.logAction(game, `${player.name} upgraded a Settlement to a City!`);

        return game;
    }

    moveRobber(gameId: string, playerId: string, hexId: string): GameState | null {
        const game = this.games.get(gameId);
        if (!game || game.status !== 'playing') throw new Error("Game not active");
        if (game.currentTurnPlayerId !== playerId) throw new Error("Not your turn");
        if (game.phase !== 'moving_robber') throw new Error("Not in robber movement phase");

        if (hexId === game.robberHexId) throw new Error("Must move Robber to a new hex");

        game.robberHexId = hexId;
        this.logAction(game, `${game.players.find(p => p.id === playerId)?.name} moved the Robber.`);

        // Identify victims
        const victims = new Set<string>();
        const hex = game.hexes.find(h => h.id === hexId);
        if (hex) {
            // Find all structures on this hex
            game.structures.forEach(s => {
                if (s.playerId === playerId) return; // Cannot steal from self
                if (s.type === 'road') return; // Roads don't count

                // Check if structure is on this hex
                const equivalents = this.getEquivalentVertices(s.location.q, s.location.r, s.location.s, s.location.position);
                if (equivalents.some(eq => eq.q === hex.q && eq.r === hex.r && eq.s === hex.s)) {
                    victims.add(s.playerId);
                }
            });
        }

        const victimIds = Array.from(victims);

        if (victimIds.length === 0) {
            game.phase = 'playing';
            this.logAction(game, "No one to steal from.");
        } else if (victimIds.length === 1) {
            // Auto steal
            this.stealResource(game, playerId, victimIds[0]!);
            game.phase = 'playing';
        } else {
            // Multiple victims, let player choose
            game.robberStealOptions = victimIds;
            game.phase = 'stealing';
            this.logAction(game, "Choose a player to steal from.");
        }

        return game;
    }

    stealResource(game: GameState | string, playerId: string, targetPlayerId: string): GameState | null {
        // Handle overload if first arg is gameId
        let gameObj: GameState | undefined;
        if (typeof game === 'string') {
            gameObj = this.games.get(game);
            if (!gameObj) throw new Error("Game not found");
        } else {
            gameObj = game;
        }

        if (gameObj.status !== 'playing') throw new Error("Game not active");
        // Phase check: must be moving_robber (auto-steal) or stealing (manual choice)
        // But if called from moveRobber, phase might still be moving_robber. 
        // If called directly via API, phase should be stealing.

        const thief = gameObj.players.find(p => p.id === playerId);
        const victim = gameObj.players.find(p => p.id === targetPlayerId);

        if (!thief || !victim) throw new Error("Player not found");

        // Check if victim has resources
        const totalResources = Object.values(victim.resources).reduce((a, b) => a + b, 0);
        if (totalResources === 0) {
            this.logAction(gameObj, `${victim.name} has no resources to steal.`);
            if (gameObj.phase === 'stealing') gameObj.phase = 'playing';
            return gameObj;
        }

        // Pick random resource
        const resources: string[] = [];
        for (const [res, count] of Object.entries(victim.resources)) {
            for (let i = 0; i < count; i++) resources.push(res);
        }

        const stolenRes = resources[Math.floor(Math.random() * resources.length)];

        victim.resources[stolenRes as keyof typeof victim.resources]--;
        thief.resources[stolenRes as keyof typeof thief.resources]++;

        this.logAction(gameObj, `${thief.name} stole a card from ${victim.name}.`);

        gameObj.phase = 'playing';
        delete gameObj.robberStealOptions;

        return gameObj;
    }

    proposeTrade(gameId: string, playerId: string, targetPlayerId: string, offer: Record<string, number>, request: Record<string, number>): GameState | null {
        const game = this.games.get(gameId);
        if (!game || game.status !== 'playing') throw new Error("Game not active");
        if (game.currentTurnPlayerId !== playerId) throw new Error("Not your turn");
        if (game.activeTrade) throw new Error("A trade is already active");

        const proposer = game.players.find(p => p.id === playerId);
        const target = game.players.find(p => p.id === targetPlayerId);
        if (!proposer || !target) throw new Error("Player not found");
        if (playerId === targetPlayerId) throw new Error("Cannot trade with yourself");

        // Validate resources
        for (const [res, amount] of Object.entries(offer)) {
            if ((proposer.resources as any)[res] < amount) {
                throw new Error(`You don't have enough ${res}`);
            }
        }

        game.activeTrade = {
            id: uuidv4(),
            proposerId: playerId,
            targetPlayerId,
            offer: offer as any,
            request: request as any,
            status: 'pending'
        };

        this.logAction(game, `${proposer.name} proposed a trade to ${target.name}.`);
        return game;
    }

    acceptTrade(gameId: string, playerId: string): GameState | null {
        const game = this.games.get(gameId);
        if (!game || game.status !== 'playing') throw new Error("Game not active");
        if (!game.activeTrade) throw new Error("No active trade");
        if (game.activeTrade.targetPlayerId !== playerId) throw new Error("Not your trade to accept");

        const trade = game.activeTrade;
        const proposer = game.players.find(p => p.id === trade.proposerId);
        const acceptor = game.players.find(p => p.id === playerId);

        if (!proposer || !acceptor) throw new Error("Player not found");

        // Validate resources again (in case they changed?)
        // Proposer resources
        for (const [res, amount] of Object.entries(trade.offer)) {
            if (proposer.resources[res as keyof typeof proposer.resources] < amount) {
                game.activeTrade = null;
                throw new Error(`Proposer no longer has enough ${res}`);
            }
        }
        // Acceptor resources
        for (const [res, amount] of Object.entries(trade.request)) {
            if (acceptor.resources[res as keyof typeof acceptor.resources] < amount) {
                throw new Error(`You don't have enough ${res} to accept`);
            }
        }

        // Execute Trade
        for (const [res, amount] of Object.entries(trade.offer)) {
            proposer.resources[res as keyof typeof proposer.resources] -= amount;
            acceptor.resources[res as keyof typeof acceptor.resources] += amount;
        }
        for (const [res, amount] of Object.entries(trade.request)) {
            acceptor.resources[res as keyof typeof acceptor.resources] -= amount;
            proposer.resources[res as keyof typeof proposer.resources] += amount;
        }

        this.logAction(game, `Trade accepted between ${proposer.name} and ${acceptor.name}.`);
        game.activeTrade = null;
        return game;
    }

    rejectTrade(gameId: string, playerId: string): GameState | null {
        const game = this.games.get(gameId);
        if (!game || game.status !== 'playing') throw new Error("Game not active");
        if (!game.activeTrade) throw new Error("No active trade");

        // Can be rejected by target OR cancelled by proposer
        if (game.activeTrade.targetPlayerId !== playerId && game.activeTrade.proposerId !== playerId) {
            throw new Error("Not authorized to reject this trade");
        }

        const isProposer = game.activeTrade.proposerId === playerId;
        const actor = game.players.find(p => p.id === playerId);

        this.logAction(game, `${actor?.name} ${isProposer ? 'cancelled' : 'rejected'} the trade.`);
        game.activeTrade = null;
        return game;
    }

    buyDevelopmentCard(gameId: string, playerId: string): GameState | null {
        const game = this.games.get(gameId);
        if (!game || game.status !== 'playing') throw new Error("Game not active");
        if (game.currentTurnPlayerId !== playerId) throw new Error("Not your turn");
        if (game.devCardDeck.length === 0) throw new Error("No development cards left");

        const player = game.players.find(p => p.id === playerId);
        if (!player) throw new Error("Player not found");

        // Cost: 1 Ore, 1 Wheat, 1 Sheep
        if (player.resources.ore < 1 || player.resources.wheat < 1 || player.resources.sheep < 1) {
            throw new Error("Not enough resources (1 Ore, 1 Wheat, 1 Sheep)");
        }

        // Deduct resources

        player.resources.ore--;
        player.resources.wheat--;
        player.resources.sheep--;

        // Draw card
        const cardType = game.devCardDeck.pop();
        if (!cardType) throw new Error("Deck error");

        console.log(`Player ${player.name} drew ${cardType}. Remaining deck: ${game.devCardDeck.length} cards.Next 3: ${game.devCardDeck.slice(-3)} `);

        const card: any = {
            id: uuidv4(),
            type: cardType,
            isNew: true,
            wasPlayed: false
        };

        player.developmentCards.push(card);
        this.logAction(game, `${player.name} bought a Development Card.`);

        return game;
    }

    playDevelopmentCard(gameId: string, playerId: string, cardId: string, options?: any): GameState | null {
        const game = this.games.get(gameId);
        if (!game || game.status !== 'playing') throw new Error("Game not active");
        if (game.currentTurnPlayerId !== playerId) throw new Error("Not your turn");

        const player = game.players.find(p => p.id === playerId);
        if (!player) throw new Error("Player not found");

        const card = player.developmentCards.find(c => c.id === cardId);
        if (!card) throw new Error("Card not found");
        if (card.wasPlayed) throw new Error("Card already played");
        if (card.isNew && card.type !== 'victory_point') throw new Error("Cannot play a card turn it was bought");

        // Execute Effect
        switch (card.type) {
            case 'knight':
                game.phase = 'moving_robber';
                player.knightsPlayed++;
                this.checkLargestArmy(game, playerId);
                this.logAction(game, `${player.name} played a Knight! Move the robber.`);
                break;
            case 'year_of_plenty':
                // options: { resource1: string, resource2: string }
                if (!options || !options.resource1 || !options.resource2) throw new Error("Must specify 2 resources");
                player.resources[options.resource1 as keyof typeof player.resources]++;
                player.resources[options.resource2 as keyof typeof player.resources]++;
                this.logAction(game, `${player.name} played Year of Plenty.`);
                break;
            case 'road_building':
                game.phase = 'road_building_dev';
                game.roadsToBuild = 2;
                this.logAction(game, `${player.name} played Road Building.Place 2 roads.`);
                break;
            case 'monopoly':
                // options: { resource: string }
                if (!options || !options.resource) throw new Error("Must specify resource");
                const res = options.resource as keyof typeof player.resources;
                let totalStolen = 0;
                game.players.forEach(p => {
                    if (p.id !== playerId) {
                        const amount = p.resources[res];
                        p.resources[res] = 0;
                        totalStolen += amount;
                    }
                });
                player.resources[res] += totalStolen;
                this.logAction(game, `${player.name} played Monopoly on ${res} and stole ${totalStolen} !`);
                break;
            case 'victory_point':
                // Usually not "played" but revealed.
                // For MVP, we can just mark it as played to show it?
                // Or maybe just don't allow playing it explicitly.
                throw new Error("Victory Point cards are automatically counted.");
        }

        card.wasPlayed = true;
        return game;
    }

    private checkLargestArmy(game: GameState, playerId: string) {
        const player = game.players.find(p => p.id === playerId);
        if (!player) return;

        if (player.knightsPlayed >= 3) {
            const currentHolder = game.players.find(p => p.id === game.largestArmyPlayerId);
            if (!currentHolder || player.knightsPlayed > currentHolder.knightsPlayed) {
                if (game.largestArmyPlayerId !== playerId) {
                    game.largestArmyPlayerId = playerId;
                    // Update VPs
                    if (currentHolder) currentHolder.victoryPoints -= 2;
                    player.victoryPoints += 2;
                    this.logAction(game, `${player.name} took the Largest Army!`);
                }
            }
        }
    }

    undoLastBuild(gameId: string, playerId: string): GameState | null {
        const game = this.games.get(gameId);
        if (!game || game.status !== 'playing') throw new Error("Game not active");
        if (game.currentTurnPlayerId !== playerId) throw new Error("Not your turn");

        // Strict Undo Rules:
        // 1. Max 1 undo per turn
        if (game.hasUndone) {
            throw new Error("Already used undo this turn");
        }

        const player = game.players.find(p => p.id === playerId);
        if (!player) throw new Error("Player not found");

        // Find last structure built by player
        // Note: This logic assumes the last thing in the array is the last thing built.
        // But if we upgraded a settlement to a city, the structure is already in the array (just modified).
        // So we should look at structuresBuiltThisTurn.

        const lastBuiltId = game.structuresBuiltThisTurn[game.structuresBuiltThisTurn.length - 1];
        if (!lastBuiltId) throw new Error("Nothing to undo");

        const structure = game.structures.find(s => s.id === lastBuiltId);
        if (!structure) throw new Error("Structure not found");

        // 2. Can only undo actions from the current turn
        // (Already checked by looking at structuresBuiltThisTurn)

        if (structure.type === 'city') {
            // Downgrade back to settlement
            structure.type = 'settlement';
            player.resources.ore += 3;
            player.resources.wheat += 2;
            player.victoryPoints--;
            this.logAction(game, `${player.name} undid upgrading a City.`);
        } else {
            // Remove structure
            const globalIndex = game.structures.findIndex(s => s.id === structure.id);
            if (globalIndex !== -1) game.structures.splice(globalIndex, 1);

            // Remove from player structures
            // Note: player.structures contains REFERENCES to the same objects as game.structures
            const playerIndex = player.structures.findIndex(s => s.id === structure.id);
            if (playerIndex !== -1) player.structures.splice(playerIndex, 1);

            // Refund
            if (structure.type === 'settlement') {
                player.resources.brick++;
                player.resources.wood++;
                player.resources.sheep++;
                player.resources.wheat++;
                player.victoryPoints--;
                this.logAction(game, `${player.name} undid building a Settlement.`);
            } else if (structure.type === 'road') {
                player.resources.brick++;
                player.resources.wood++;
                this.logAction(game, `${player.name} undid building a Road.`);
            }
        }

        // Remove from tracked structures
        game.structuresBuiltThisTurn.pop();

        // Mark undo as used
        game.hasUndone = true;

        return game;
    }

    private logAction(game: GameState, message: string) {
        game.logs.push(`[${new Date().toLocaleTimeString()}] ${message} `);
        // Keep log size manageable
        if (game.logs.length > 50) game.logs.shift();
    }

    private validateSettlementPlacement(game: GameState, location: { q: number, r: number, s: number, position: number }, playerId?: string): boolean {
        // 1. Check exact spot (Occupancy)
        if (this.isVertexOccupied(game, location)) return false;

        // 2. Distance Rule: No other settlement within 1 edge (adjacent vertex)
        // Get all equivalent representations of this vertex to find its 3 radiating edges/neighbors
        const equivalents = this.getEquivalentVertices(location.q, location.r, location.s, location.position);

        for (const eq of equivalents) {
            // For each equivalent, the vertex at (position + 1) is a neighbor.
            // Checking (position + 1) for all 3 equivalents covers all 3 adjacent vertices.
            const neighborPos = (eq.position + 1) % 6;

            // Check if this neighbor is occupied (must check all its equivalents!)
            const neighborLoc = { q: eq.q, r: eq.r, s: eq.s, position: neighborPos };
            if (this.isVertexOccupied(game, neighborLoc)) return false;
        }

        // 3. Connectivity Rule (Main Phase only)
        // Must connect to at least one road owned by the player
        if (playerId && !game.phase.startsWith('setup')) {
            let isConnected = false;

            // Check all edges connected to this vertex
            // A vertex touches 3 edges. We can find them via the equivalents.
            // On each equivalent hex, the vertex touches Edge (position) and Edge (position - 1).
            // Iterating all equivalents covers all edges (redundantly, but safely).

            for (const eq of equivalents) {
                const edge1 = eq.position;
                const edge2 = (eq.position - 1 + 6) % 6;

                const hasRoad = game.structures.some(s =>
                    s.playerId === playerId &&
                    s.type === 'road' &&
                    s.location.q === eq.q &&
                    s.location.r === eq.r &&
                    s.location.s === eq.s &&
                    (s.location.position === edge1 || s.location.position === edge2)
                );

                if (hasRoad) {
                    isConnected = true;
                    break;
                }
            }

            if (!isConnected) {
                console.log("Invalid settlement placement: Must connect to own road");
                return false;
            }
        }

        return true;
    }

    private isVertexOccupied(game: GameState, location: { q: number, r: number, s: number, position: number }): boolean {
        // Check if any structure exists at this location OR any of its equivalents
        const equivalents = this.getEquivalentVertices(location.q, location.r, location.s, location.position);

        return equivalents.some(eq =>
            game.structures.some(s =>
                s.type !== 'road' &&
                s.location.q === eq.q &&
                s.location.r === eq.r &&
                s.location.s === eq.s &&
                s.location.position === eq.position
            )
        );
    }

    private advanceSetupPhase(game: GameState) {
        const currentPlayerIndex = game.turnOrder.indexOf(game.currentTurnPlayerId);

        if (game.phase === 'setup_round_1') {
            if (currentPlayerIndex < game.players.length - 1) {
                // Next player
                game.currentTurnPlayerId = game.turnOrder[currentPlayerIndex + 1] || '';
                game.subPhase = 'building_settlement';
            } else {
                // End of Round 1, start Round 2 (Reverse order)
                game.phase = 'setup_round_2';
                // Keep same player (last player goes twice)
                // game.currentTurnPlayerId stays the same
                game.subPhase = 'building_settlement';
            }
        } else if (game.phase === 'setup_round_2') {
            if (currentPlayerIndex > 0) {
                // Previous player (reverse order)
                game.currentTurnPlayerId = game.turnOrder[currentPlayerIndex - 1] || '';
                game.subPhase = 'building_settlement';
            } else {
                // End of Setup
                game.phase = 'playing';
                game.currentTurnPlayerId = game.turnOrder[0] || ''; // Start with P1
                game.diceRoll = null;
            }
        }
    }

    // TODO: Implement buildCity similarly

    // --- Helper Methods ---

    private getNeighbor(q: number, r: number, s: number, direction: number): { q: number, r: number, s: number } {
        const directions = [
            { q: 1, r: 0, s: -1 },  // 0: East
            { q: 0, r: 1, s: -1 },  // 1: SE
            { q: -1, r: 1, s: 0 },  // 2: SW
            { q: -1, r: 0, s: 1 },  // 3: West
            { q: 0, r: -1, s: 1 },  // 4: NW
            { q: 1, r: -1, s: 0 },  // 5: NE
        ];
        const d = directions[direction % 6] || { q: 0, r: 0, s: 0 };
        return { q: q + d.q, r: r + d.r, s: s + d.s };
    }

    private getEquivalentVertices(q: number, r: number, s: number, vertex: number): { q: number, r: number, s: number, position: number }[] {
        // Vertex i on Hex A touches:
        // 1. Hex A, Vertex i
        // 2. Neighbor(Edge i), Vertex (i+4)%6
        // 3. Neighbor(Edge (i-1)), Vertex (i+2)%6

        const equivalents = [{ q, r, s, position: vertex }];

        // Neighbor 1: Direction = vertex
        const n1 = this.getNeighbor(q, r, s, vertex);
        equivalents.push({ ...n1, position: (vertex + 4) % 6 });

        // Neighbor 2: Direction = (vertex - 1)
        const dir2 = (vertex - 1 + 6) % 6;
        const n2 = this.getNeighbor(q, r, s, dir2);
        equivalents.push({ ...n2, position: (vertex + 2) % 6 });

        return equivalents;
    }

    private validateRoadPlacement(game: GameState, playerId: string, location: { q: number, r: number, s: number, position: number }): boolean {
        // A road on Edge E connects Vertex E and Vertex (E+1)%6
        const v1 = location.position;
        const v2 = (location.position + 1) % 6;

        const hasConnection = (vertexIndex: number) => {
            const equivalents = this.getEquivalentVertices(location.q, location.r, location.s, vertexIndex);

            for (const eq of equivalents) {
                // Check for Settlement/City
                const hasStructure = game.structures.some(s =>
                    s.playerId === playerId &&
                    s.type !== 'road' &&
                    s.location.q === eq.q &&
                    s.location.r === eq.r &&
                    s.location.s === eq.s &&
                    s.location.position === eq.position
                );
                if (hasStructure) return true;

                // Check for connected Road
                // Roads connected to Vertex V are on Edge V and Edge (V-1)
                const edge1 = eq.position;
                const edge2 = (eq.position - 1 + 6) % 6;

                const hasRoad = game.structures.some(s =>
                    s.playerId === playerId &&
                    s.type === 'road' &&
                    s.location.q === eq.q &&
                    s.location.r === eq.r &&
                    s.location.s === eq.s &&
                    (s.location.position === edge1 || s.location.position === edge2)
                );
                if (hasRoad) return true;
            }
            return false;
        };

        return hasConnection(v1) || hasConnection(v2);
    }

    private updateLongestRoad(game: GameState, playerId: string) {
        const player = game.players.find(p => p.id === playerId);
        if (!player) return;

        const length = this.calculateLongestRoad(game, playerId);
        player.longestRoadSegment = length;

        if (length >= 5) {
            const currentHolder = game.players.find(p => p.id === game.longestRoadPlayerId);
            if (!currentHolder || length > currentHolder.longestRoadSegment) {
                if (game.longestRoadPlayerId !== playerId) {
                    game.longestRoadPlayerId = playerId;
                    // Update VPs
                    if (currentHolder) currentHolder.victoryPoints -= 2;
                    player.victoryPoints += 2;
                    this.logAction(game, `${player.name} took the Longest Road(Length: ${length})!`);
                }
            }
        }
    }

    private calculateLongestRoad(game: GameState, playerId: string): number {
        // Get all roads for this player
        const roads = game.structures.filter(s => s.type === 'road' && s.playerId === playerId);
        if (roads.length === 0) return 0;

        // Build Adjacency Graph (Vertex -> connected Edges/Roads)
        // We identify vertices by a unique string key "q,r,s,pos"
        // But wait, vertices have equivalents. We need a canonical ID for each vertex.
        // Canonical ID: Find the equivalent with the smallest q, then r, then s.

        // Helper to get canonical vertex ID
        const getCanonicalVertexId = (q: number, r: number, s: number, pos: number): string => {
            const equivalents = this.getEquivalentVertices(q, r, s, pos);
            // Sort by q, r, s, pos to pick one
            equivalents.sort((a, b) => {
                if (a.q !== b.q) return a.q - b.q;
                if (a.r !== b.r) return a.r - b.r;
                if (a.s !== b.s) return a.s - b.s;
                return a.position - b.position;
            });
            const eq = equivalents[0];
            if (!eq) return `${q},${r},${s},${pos} `; // Fallback
            return `${eq.q},${eq.r},${eq.s},${eq.position} `;
        };

        const adj = new Map<string, string[]>(); // VertexID -> List of RoadIDs connected to it
        const roadMap = new Map<string, any>(); // RoadID -> Road Object

        roads.forEach(road => {
            roadMap.set(road.id, road);
            const v1 = getCanonicalVertexId(road.location.q, road.location.r, road.location.s, road.location.position);
            const v2 = getCanonicalVertexId(road.location.q, road.location.r, road.location.s, (road.location.position + 1) % 6);

            if (!adj.has(v1)) adj.set(v1, []);
            if (!adj.has(v2)) adj.set(v2, []);

            adj.get(v1)!.push(road.id);
            adj.get(v2)!.push(road.id);
        });

        // DFS to find max path
        let maxLen = 0;

        const dfs = (currentVertex: string, visitedRoads: Set<string>, currentLen: number) => {
            maxLen = Math.max(maxLen, currentLen);

            const connectedRoadIds = adj.get(currentVertex) || [];
            for (const roadId of connectedRoadIds) {
                if (!visitedRoads.has(roadId)) {
                    // Traverse this road
                    const road = roadMap.get(roadId);

                    // Find the OTHER vertex of this road
                    const v1 = getCanonicalVertexId(road.location.q, road.location.r, road.location.s, road.location.position);
                    const v2 = getCanonicalVertexId(road.location.q, road.location.r, road.location.s, (road.location.position + 1) % 6);
                    const nextVertex = (v1 === currentVertex) ? v2 : v1;

                    // Check if blocked by opponent settlement (Standard Catan Rule)
                    // If there is a settlement on 'currentVertex' that belongs to someone else, we can't pass through.
                    // (Unless it's the start, but we are recursing, so currentVertex is an intermediate point).
                    // We need to check if currentVertex is occupied by opponent.

                    // Check occupancy of currentVertex
                    // We need to reverse map canonical ID to a location to check game.structures
                    // Or just check all structures against this canonical ID
                    // Optimization: Pre-calculate opponent blocked vertices?
                    // For MVP, let's skip the "settlement breaks road" rule or implement it simply.
                    // Let's implement it:

                    // ... (Skipping complexity for now to ensure stability, assume roads connect through settlements)

                    visitedRoads.add(roadId);
                    dfs(nextVertex, visitedRoads, currentLen + 1);
                    visitedRoads.delete(roadId); // Backtrack
                }
            }
        };

        // Start DFS from every vertex that has only 1 road (endpoints) or all vertices if cycle
        // Optimization: Start from endpoints (degree 1) or nodes with odd degree?
        // Brute force: Start from ALL vertices in the graph.
        for (const startVertex of adj.keys()) {
            dfs(startVertex, new Set(), 0);
        }

        return maxLen;
    }
}

export const gameManager = new GameManager();
