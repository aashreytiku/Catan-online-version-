import { useState, useEffect } from 'react';
import { GameLayout } from './components/GameLayout';
import { HexGrid } from './components/HexGrid';
import { Lobby } from './components/Lobby';
import { TradeUI } from './components/TradeUI';
import { DevCardModal } from './components/DevCardModal';
import { StealModal } from './components/StealModal';
import { io, Socket } from 'socket.io-client';
import type { GameState, Hex } from './types';

const getServerUrl = () => {
  if (import.meta.env.VITE_SERVER_URL) return import.meta.env.VITE_SERVER_URL;
  if (window.location.hostname === 'localhost') return 'http://localhost:3000';
  return window.location.origin; // For same-origin deployment
};

const socket: Socket = io(getServerUrl());

function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string>('');
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Dev Card Modal State
  const [activeDevCard, setActiveDevCard] = useState<{ id: string, type: 'monopoly' | 'year_of_plenty' } | null>(null);

  // Build Mode State
  const [buildMode, setBuildMode] = useState<'settlement' | 'city' | 'road' | null>(null);

  // Lobby State
  const [playerName, setPlayerName] = useState('');
  const [joinGameId, setJoinGameId] = useState('');
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    // Check if already connected
    if (socket.connected) {
      console.log('Already connected:', socket.id);
      setMyPlayerId(socket.id || '');
      setIsConnected(true);
    }

    const onConnect = () => {
      console.log('Connected:', socket.id);
      setMyPlayerId(socket.id || '');
      setIsConnected(true);
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    socket.on('game_created', (game: GameState) => {
      setGameState(game);
      setError('');
    });

    socket.on('game_joined', (game: GameState) => {
      setGameState(game);
      setError('');
    });

    socket.on('game_updated', (game: GameState) => {
      setGameState(game);
    });

    socket.on('game_error', (message: string) => {
      setToast(message);
    });

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('game_created');
      socket.off('game_joined');
      socket.off('game_updated');
      socket.off('game_error');
    };
  }, []);

  const handleCreateGame = () => {
    if (playerName) {
      socket.emit('create_game', playerName, (game: GameState) => {
        setGameState(game);
      });
    }
  };

  const handleJoinGame = () => {
    if (playerName && joinGameId) {
      socket.emit('join_game', joinGameId, playerName, (response: { success: boolean, game?: GameState, error?: string }) => {
        if (response.success && response.game) {
          setGameState(response.game);
          setError('');
        } else {
          setError(response.error || 'Failed to join game');
        }
      });
    }
  };

  const handleStartGame = () => {
    if (gameState) socket.emit('start_game', gameState.id);
  };

  const handleRollDice = () => {
    if (gameState) socket.emit('roll_dice', gameState.id);
  };

  const handleEndTurn = () => {
    if (gameState) {
      socket.emit('end_turn', gameState.id);
      setBuildMode(null);
    }
  };

  const handleUndo = () => {
    if (gameState) socket.emit('undo_build', gameState.id);
  };

  // Build Handlers
  const handleBuildSettlement = () => setBuildMode(buildMode === 'settlement' ? null : 'settlement');
  const handleBuildCity = () => setBuildMode(buildMode === 'city' ? null : 'city');
  const handleBuildRoad = () => setBuildMode(buildMode === 'road' ? null : 'road');

  // Grid Interactions
  const handleVertexClick = (hex: Hex, position: number) => {
    if (!gameState) return;
    const { q, r, s } = hex;

    // Setup Phase
    if (gameState.phase.startsWith('setup')) {
      if (gameState.subPhase === 'building_settlement') {
        socket.emit('build_settlement', gameState.id, { q, r, s, position });
      }
      return;
    }

    // Main Phase
    if (buildMode === 'settlement') {
      socket.emit('build_settlement', gameState.id, { q, r, s, position });
      setBuildMode(null);
    } else if (buildMode === 'city') {
      socket.emit('build_city', gameState.id, { q, r, s, position });
      setBuildMode(null);
    }
  };

  const handleEdgeClick = (hex: Hex, position: number) => {
    if (!gameState) return;
    const { q, r, s } = hex;

    // Setup Phase
    if (gameState.phase.startsWith('setup')) {
      if (gameState.subPhase === 'building_road') {
        socket.emit('build_road', gameState.id, { q, r, s, position });
      }
      return;
    }

    // Road Building Dev Card Phase
    if (gameState.phase === 'road_building_dev') {
      socket.emit('build_road', gameState.id, { q, r, s, position });
      return;
    }

    // Main Phase
    if (buildMode === 'road') {
      socket.emit('build_road', gameState.id, { q, r, s, position });
      setBuildMode(null);
    }
  };

  const handleHexClick = (hexId: string) => {
    if (gameState?.phase === 'moving_robber' && gameState.currentTurnPlayerId === myPlayerId) {
      socket.emit('move_robber', gameState.id, hexId);
    }
  };

  // Trade Handlers
  const handleProposeTrade = (targetPlayerId: string, offer: Record<string, number>, request: Record<string, number>) => {
    if (gameState) socket.emit('propose_trade', gameState.id, targetPlayerId, offer, request);
  };

  const handleAcceptTrade = () => {
    if (gameState) socket.emit('accept_trade', gameState.id);
  };

  const handleRejectTrade = () => {
    if (gameState) socket.emit('reject_trade', gameState.id);
  };

  // Dev Card Handlers
  const handleBuyDevCard = () => {
    if (gameState) socket.emit('buy_dev_card', gameState.id);
  };

  const handlePlayDevCard = (cardId: string) => {
    if (!gameState) return;
    const myPlayer = gameState.players.find(p => p.id === myPlayerId);
    const card = myPlayer?.developmentCards.find(c => c.id === cardId);

    if (!card) return;

    if (card.type === 'monopoly' || card.type === 'year_of_plenty') {
      setActiveDevCard({ id: cardId, type: card.type });
    } else {
      socket.emit('play_dev_card', gameState.id, cardId);
    }
  };

  const handleDevCardConfirm = (options: any) => {
    if (gameState && activeDevCard) {
      socket.emit('play_dev_card', gameState.id, activeDevCard.id, options);
      setActiveDevCard(null);
    }
  };

  const handleStealResource = (targetPlayerId: string) => {
    if (gameState) {
      socket.emit('steal_resource', gameState.id, targetPlayerId);
    }
  };

  // UI Helpers
  const myPlayer = gameState?.players.find(p => p.id === myPlayerId);
  const isMyTurn = gameState?.currentTurnPlayerId === myPlayerId;

  const getInstructionText = () => {
    if (!gameState || !isMyTurn) return "Waiting for opponent...";
    if (gameState.phase === 'moving_robber') return "Move the Robber!";
    if (gameState.phase === 'stealing') return "Choose a player to steal from!";
    if (gameState.phase === 'road_building_dev') return `Place a free Road (${gameState.roadsToBuild} left)`;
    if (gameState.phase.startsWith('setup')) {
      if (gameState.subPhase === 'building_settlement') return "Place a Settlement";
      if (gameState.subPhase === 'building_road') return "Place a Road";
    }
    if (buildMode === 'settlement') return "Select a location to build a Settlement";
    if (buildMode === 'road') return "Select an edge to build a Road";
    if (buildMode === 'city') return "Select a Settlement to upgrade";
    return "Your Turn";
  };

  // Render Lobby
  if (!gameState) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4">
        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-12">Hex Empire</h1>
        <div className="w-full max-w-md space-y-6 bg-slate-800 p-8 rounded-xl shadow-2xl border border-slate-700">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Your Name</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="Enter your name"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleCreateGame}
              disabled={!isConnected || !playerName}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Create Game
            </button>
            <div className="relative">
              <input
                type="text"
                value={joinGameId}
                onChange={(e) => setJoinGameId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                placeholder="Game ID"
              />
            </div>
          </div>
          <button
            onClick={handleJoinGame}
            disabled={!isConnected || !playerName || !joinGameId}
            className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Join Game
          </button>
          {error && (
            <div className="text-red-400 text-sm text-center bg-red-900/20 py-2 rounded border border-red-900/50">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (gameState.status === 'waiting') {
    return (
      <Lobby
        gameId={gameState.id}
        players={gameState.players}
        isHost={gameState.players[0].id === myPlayerId}
        onStartGame={handleStartGame}
      />
    );
  }

  return (
    <>
      {toast && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-lg shadow-xl z-50 flex items-center gap-3 animate-fade-in-down border border-red-400">
          <span className="text-2xl">⚠️</span>
          <span className="font-bold text-lg">{toast}</span>
        </div>
      )}

      <GameLayout
        isMyTurn={isMyTurn}
        hasRolled={gameState.diceRoll !== null}
        resources={myPlayer?.resources}
        diceRoll={gameState.diceRoll}
        gameLog={gameState.logs}
        onRollDice={handleRollDice}
        onEndTurn={handleEndTurn}
        onTrade={() => setIsTradeModalOpen(true)}
        onBuild={handleBuildSettlement}
        onBuildCity={handleBuildCity}
        onBuildRoad={handleBuildRoad}
        onUndo={handleUndo}
        canUndo={isMyTurn && !gameState.hasUndone && gameState.structuresBuiltThisTurn.length > 0}
        isSetupPhase={gameState.phase.startsWith('setup')}
        players={gameState.players}
        myPlayerId={myPlayerId}
        onBuyDevCard={handleBuyDevCard}
        onPlayDevCard={handlePlayDevCard}
      >
        <HexGrid
          hexes={gameState.hexes}
          structures={gameState.structures}
          robberHexId={gameState.robberHexId}
          onVertexClick={handleVertexClick}
          onEdgeClick={handleEdgeClick}
          onHexClick={handleHexClick}
          isBuildMode={buildMode !== null || gameState.phase.startsWith('setup') || gameState.phase === 'road_building_dev'}
          buildModeType={
            buildMode ||
            (gameState.phase.startsWith('setup') && gameState.subPhase === 'building_road' ? 'road' :
              gameState.phase.startsWith('setup') && gameState.subPhase === 'building_settlement' ? 'settlement' :
                gameState.phase === 'road_building_dev' ? 'road' : undefined)
          }
          players={gameState.players}
        />

        {/* Instruction Overlay */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-lg shadow-lg border border-blue-500 font-bold text-lg pointer-events-none z-20">
          {getInstructionText()}
        </div>

        {/* Build Mode Indicator */}
        {(buildMode || gameState.phase === 'road_building_dev') && (
          <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 bg-amber-500/80 text-white px-4 py-1 rounded-full text-sm font-bold animate-pulse pointer-events-none z-20">
            {gameState.phase === 'road_building_dev' ? "Road Building Card Active" :
              buildMode === 'settlement' ? "Settlement Mode" :
                buildMode === 'city' ? "Upgrade Mode" : "Road Mode"}
          </div>
        )}
      </GameLayout>

      <TradeUI
        isOpen={isTradeModalOpen}
        onClose={() => setIsTradeModalOpen(false)}
        gameState={gameState}
        myPlayerId={myPlayerId}
        onProposeTrade={handleProposeTrade}
        onAcceptTrade={handleAcceptTrade}
        onRejectTrade={handleRejectTrade}
      />

      {activeDevCard && (
        <DevCardModal
          type={activeDevCard.type}
          isOpen={true}
          onClose={() => setActiveDevCard(null)}
          onConfirm={handleDevCardConfirm}
        />
      )}

      <StealModal
        isOpen={gameState.phase === 'stealing' && isMyTurn}
        victimIds={gameState.robberStealOptions || []}
        players={gameState.players}
        onSelectVictim={handleStealResource}
      />
    </>
  );
}

export default App;
