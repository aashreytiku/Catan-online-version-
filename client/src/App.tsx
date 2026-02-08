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
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 text-slate-900 p-4 font-sans">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-6xl font-black text-blue-600 mb-4 drop-shadow-sm">
            Catan Online
          </h1>
          <p className="text-xl text-slate-600 font-medium">Build. Trade. Settle. Conquer.</p>
        </div>

        {/* Main Card */}
        <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-start">

          {/* Left Column: Instructions */}
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 h-full flex flex-col justify-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <span className="text-3xl">📜</span> How to Play
            </h2>
            <ul className="space-y-4 text-slate-600 text-sm leading-relaxed">
              <li className="flex items-start gap-3">
                <span className="bg-blue-100 text-blue-700 font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                <span><strong>Multiplayer Only:</strong> You need at least 2 players (on different browsers/devices).</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-blue-100 text-blue-700 font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                <span><strong>Host a Game:</strong> Enter your name and click "Create Game". You will get a <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono text-xs">Game ID</code>.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-blue-100 text-blue-700 font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                <span><strong>Invite Friends:</strong> Share the <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono text-xs">Game ID</code> with friends so they can join.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-blue-100 text-blue-700 font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
                <span><strong>Rejoining:</strong> If you accidentally close your tab, just enter your name and the Game ID again to reconnect!</span>
              </li>
            </ul>
          </div>

          {/* Right Column: Controls */}
          <div className="space-y-6">

            {/* Player Input */}
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
              <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Who are you?</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all text-lg font-bold text-slate-800 placeholder:text-slate-300"
                placeholder="Enter your nickname..."
              />
            </div>

            {/* Actions */}
            <div className="grid gap-4">
              {/* Box 1: Create */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-2xl border-2 border-orange-200 hover:border-orange-300 transition-colors cursor-pointer group"
                onClick={() => isConnected && playerName && handleCreateGame()}>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-orange-800 text-lg">Start New Game</h3>
                  <span className="text-2xl group-hover:scale-110 transition-transform">🏰</span>
                </div>
                <p className="text-xs text-orange-600/80 mb-4">Be the host and invite others.</p>
                <button
                  disabled={!isConnected || !playerName}
                  className="w-full py-3 bg-orange-600 group-hover:bg-orange-500 text-white rounded-xl font-bold shadow-lg transition-all"
                >
                  Create Game
                </button>
              </div>

              {/* Box 2: Join */}
              <div className="bg-white p-6 rounded-2xl border-2 border-slate-200 hover:border-blue-300 transition-colors group">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-slate-700 text-lg">Join Existing Game</h3>
                  <span className="text-2xl group-hover:scale-110 transition-transform">⚔️</span>
                </div>
                <p className="text-xs text-slate-400 mb-4">Enter the code your friend sent you.</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={joinGameId}
                    onChange={(e) => setJoinGameId(e.target.value)}
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-mono text-sm uppercase placeholder:normal-case"
                    placeholder="Game ID"
                  />
                  <button
                    onClick={handleJoinGame}
                    disabled={!isConnected || !playerName || !joinGameId}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Join
                  </button>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="animate-pulse bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 text-sm font-bold text-center">
                ⚠️ {error}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-slate-400 text-xs font-mono">
          v1.0 • {isConnected ? <span className="text-green-500">Online & Ready</span> : <span className="text-red-400">Connecting to server...</span>}
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
        gameId={gameState.id}
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
