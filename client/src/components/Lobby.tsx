import React, { useState } from 'react';

interface LobbyProps {
    gameId: string;
    players: any[];
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
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 text-slate-900 p-8 font-sans">
            <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600 mb-2">Game Lobby</h1>
                    <p className="text-slate-500">Waiting for players to join...</p>
                </div>

                {/* Game ID Section - HERO */}
                <div className="mb-10 bg-blue-50 p-6 rounded-xl border border-blue-100 flex flex-col items-center justify-center text-center">
                    <p className="text-blue-600 font-bold uppercase tracking-widest text-xs mb-3">Invite Friends with this Code</p>
                    <div className="flex items-center gap-4 bg-white px-6 py-4 rounded-lg shadow-sm w-full max-w-sm justify-between border border-blue-100">
                        <code className="text-3xl font-black text-slate-800 tracking-wider font-mono select-all">{gameId}</code>
                        <button
                            onClick={handleCopy}
                            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${copied ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                        >
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                    <p className="text-xs text-blue-400 mt-2">They can enter this code on the homepage.</p>
                </div>

                {/* Players List */}
                <div className="mb-10">
                    <div className="flex justify-between items-end mb-4 px-2">
                        <h2 className="text-xl font-bold text-slate-800">Players</h2>
                        <span className="text-sm font-medium bg-slate-100 px-3 py-1 rounded-full text-slate-600 border border-slate-200">
                            {players.length} / 4
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {players.map((player) => (
                            <div key={player.id} className="flex items-center bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm">
                                <div
                                    className="w-10 h-10 rounded-full mr-4 shadow-sm border-2 border-white flex items-center justify-center text-xs font-bold text-white uppercase"
                                    style={{ backgroundColor: player.color }}
                                >
                                    {player.name.substring(0, 2)}
                                </div>
                                <div>
                                    <span className="font-bold text-slate-800 block">{player.name}</span>
                                    {player.id === players[0].id && (
                                        <span className="text-[10px] text-orange-600 font-black uppercase tracking-wider">Host</span>
                                    )}
                                </div>
                            </div>
                        ))}
                        {[...Array(4 - players.length)].map((_, i) => (
                            <div key={`empty-${i}`} className="flex items-center bg-slate-50/50 p-4 rounded-xl border border-dashed border-slate-200 text-slate-400">
                                <div className="w-10 h-10 rounded-full mr-4 bg-slate-100 border-2 border-slate-50"></div>
                                <span className="text-sm italic">Waiting...</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col space-y-4">
                    {isHost ? (
                        <>
                            <button
                                onClick={onStartGame}
                                disabled={players.length < 2}
                                className="w-full py-5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white rounded-xl font-black text-2xl shadow-xl shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-1 active:translate-y-0"
                            >
                                Start Game 🚀
                            </button>
                            {players.length < 2 && (
                                <p className="text-center text-sm text-red-400 font-medium">Need at least 2 players to start.</p>
                            )}
                        </>
                    ) : (
                        <div className="text-center bg-slate-50 p-6 rounded-xl border border-slate-200">
                            <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                            <p className="text-slate-500 font-medium">Waiting for host to start the game...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
