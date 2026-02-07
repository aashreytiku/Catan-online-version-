import React, { useState } from 'react';

interface LobbyProps {
    gameId: string;
    players: any[]; // TODO: Type properly
    isHost: boolean;
    onStartGame: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({ gameId, players, isHost, onStartGame }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(gameId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-8">
            <div className="max-w-md w-full bg-slate-800 rounded-xl shadow-2xl p-8 border border-slate-700">
                <h1 className="text-3xl font-bold text-center mb-8 text-blue-400">Game Lobby</h1>

                {/* Game ID Section */}
                <div className="mb-8 bg-slate-900 p-4 rounded-lg border border-slate-700">
                    <p className="text-sm text-slate-400 mb-2 uppercase tracking-wider font-semibold">Game ID (Share this)</p>
                    <div className="flex items-center justify-between">
                        <code className="text-xl font-mono text-green-400">{gameId}</code>
                        <button
                            onClick={handleCopy}
                            className="ml-4 px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors"
                        >
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                </div>

                {/* Players List */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4 flex items-center">
                        Players <span className="ml-2 text-sm bg-slate-700 px-2 py-1 rounded-full">{players.length}/4</span>
                    </h2>
                    <div className="space-y-3">
                        {players.map((player) => (
                            <div key={player.id} className="flex items-center bg-slate-700/50 p-3 rounded-lg">
                                <div
                                    className="w-4 h-4 rounded-full mr-3 shadow-lg border border-white/20"
                                    style={{ backgroundColor: player.color }}
                                />
                                <span className="font-medium">{player.name}</span>
                                {player.id === players[0].id && (
                                    <span className="ml-auto text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded uppercase font-bold">Host</span>
                                )}
                            </div>
                        ))}
                        {players.length === 0 && (
                            <div className="text-slate-500 italic text-center py-4">Waiting for players...</div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col space-y-4">
                    {isHost ? (
                        <button
                            onClick={onStartGame}
                            disabled={players.length < 1} // Allow 1 for testing, usually 2
                            className="w-full py-4 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold text-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Start Game
                        </button>
                    ) : (
                        <div className="text-center text-slate-400 animate-pulse">
                            Waiting for host to start...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
