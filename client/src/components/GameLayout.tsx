
import React from 'react';
import type { Player, DevelopmentCard } from '../types';

interface GameLayoutProps {
    children: React.ReactNode;
    onRollDice?: () => void;
    onEndTurn?: () => void;
    onTrade?: () => void;
    onBuild?: () => void;
    onBuildRoad?: () => void;
    onBuildCity?: () => void;
    isMyTurn?: boolean;
    hasRolled?: boolean;
    resources?: Record<string, number>;
    diceRoll?: number | null;
    gameLog?: string[];
    onUndo?: () => void;
    canUndo?: boolean;
    isSetupPhase?: boolean;
    players?: Player[];
    myPlayerId?: string;
    onBuyDevCard?: () => void;
    onPlayDevCard?: (cardId: string) => void;
}

export const GameLayout: React.FC<GameLayoutProps> = ({
    children,
    onRollDice,
    onEndTurn,
    onTrade,
    onBuild,
    onBuildRoad,
    onBuildCity,
    isMyTurn = false,
    hasRolled = false,
    resources = { wood: 0, brick: 0, sheep: 0, wheat: 0, ore: 0 },
    diceRoll,
    gameLog = [],
    onUndo,
    canUndo = false,
    isSetupPhase = false,
    players = [],
    myPlayerId = '',
    onBuyDevCard,
    onPlayDevCard
}) => {
    const myPlayer = players.find(p => p.id === myPlayerId);

    return (
        <div className="flex h-screen w-screen bg-slate-900 text-white overflow-hidden font-sans">
            {/* Left Sidebar - Stats & Dev Cards */}
            <aside className="w-56 flex flex-col bg-slate-800 border-r border-slate-700 z-20 shadow-xl">
                <div className="p-4 border-b border-slate-700 bg-slate-900/50">
                    <h2 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">MY EMPIRE</h2>
                </div>

                {/* Stats */}
                <div className="p-4 space-y-4 border-b border-slate-700">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-bold text-xs">Victory Points</span>
                        <span className="text-xl font-black text-yellow-400">{myPlayer?.victoryPoints || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-bold text-xs">Longest Road</span>
                        <span className="text-lg font-bold text-white">{myPlayer?.longestRoadSegment || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-bold text-xs">Army Size</span>
                        <span className="text-lg font-bold text-white">{myPlayer?.knightsPlayed || 0}</span>
                    </div>
                </div>

                {/* Dev Cards */}
                <div className="flex-1 p-4 overflow-y-auto bg-slate-800/50">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase">Dev Cards</h3>
                        <span className="text-[10px] bg-slate-700 px-2 py-1 rounded text-slate-300">{myPlayer?.developmentCards.length || 0}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        {myPlayer?.developmentCards.map((card, index) => {
                            let iconPath = '';
                            switch (card.type) {
                                case 'knight': iconPath = '/assets/cards/knight.jpg'; break;
                                case 'victory_point': iconPath = '/assets/cards/victory_point.jpg'; break;
                                case 'road_building': iconPath = '/assets/cards/road_builder.jpg'; break;
                                case 'year_of_plenty': iconPath = '/assets/cards/year_of_plenty.jpg'; break;
                                case 'monopoly': iconPath = '/assets/cards/monopoly.jpg'; break;
                            }

                            const isPlayable = isMyTurn && (!card.isNew || card.type === 'victory_point') && !card.wasPlayed;

                            return (
                                <div
                                    key={card.id}
                                    className={`relative w-full aspect-[2/3] rounded-lg border-2 transition-all overflow-hidden shadow-md group ${card.wasPlayed
                                        ? 'border-slate-600 opacity-50 grayscale'
                                        : isPlayable
                                            ? 'border-purple-500 cursor-pointer hover:scale-105 hover:shadow-purple-500/50'
                                            : 'border-slate-600 opacity-80 cursor-not-allowed'
                                        }`}
                                    onClick={() => {
                                        if (isPlayable && card.type !== 'victory_point') {
                                            onPlayDevCard?.(card.id);
                                        }
                                    }}
                                    title={`${card.type.replace(/_/g, ' ')}${card.isNew ? ' (New)' : ''}`}
                                >
                                    {/* 
                                        USER: ADJUST IMAGE ZOOM AND POSITION HERE 
                                        - object-cover: ensures image fills the box
                                        - scale-125: zooms in by 25% (increase to zoom more, e.g. scale-150)
                                        - object-center: centers the image
                                    */}
                                    <img
                                        src={iconPath}
                                        alt={card.type}
                                        className="absolute inset-0 w-full h-full object-cover object-center transform scale-125"
                                    />

                                    {/* New Badge */}
                                    {card.isNew && !card.wasPlayed && (
                                        <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full shadow-sm z-10"></div>
                                    )}

                                    {/* Card Name Overlay (Optional, for clarity) */}
                                    <div className="absolute bottom-0 inset-x-0 bg-black/60 p-1 text-center">
                                        <span className="text-[8px] font-bold text-white uppercase tracking-wider block truncate">
                                            {card.type === 'victory_point' ? 'VP' : card.type.replace(/_/g, ' ')}
                                        </span>
                                    </div>

                                    {/* Play Overlay */}
                                    {isPlayable && !card.wasPlayed && (
                                        <div className="absolute inset-0 bg-purple-600/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <span className="text-[10px] font-bold text-white bg-black/50 px-2 py-1 rounded">PLAY</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {(!myPlayer?.developmentCards || myPlayer.developmentCards.length === 0) && (
                            <div className="col-span-3 text-center text-slate-600 text-[10px] italic py-4">No cards</div>
                        )}
                    </div>
                </div>

                {/* Buy Button */}
                <div className="p-4 border-t border-slate-700 bg-slate-900/50">
                    <button
                        onClick={onBuyDevCard}
                        disabled={!isMyTurn}
                        className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-lg transition-all transform hover:-translate-y-1 disabled:hover:translate-y-0 flex flex-col items-center justify-center gap-1"
                    >
                        <span className="text-sm">Buy Dev Card</span>
                        <span className="text-[10px] font-normal opacity-80">1 Ore • 1 Wheat • 1 Sheep</span>
                    </button>
                </div>
            </aside>

            {/* Center Stage - The Board */}
            <main className="flex-1 relative bg-[#4b9cd3] overflow-hidden flex items-center justify-center">
                {/* Water Texture Background */}
                <div className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                </div>

                {/* Game Board Container */}
                <div className="relative z-10 transform scale-100 transition-transform duration-300 pb-24">
                    {children}
                </div>

                {/* Dice Roll Display */}
                {diceRoll && (
                    <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-slate-800/90 px-6 py-3 rounded-xl border border-slate-600 shadow-2xl flex flex-col items-center animate-bounce-short pointer-events-none">
                        <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">Last Roll</span>
                        <span className="text-3xl font-black text-white">{diceRoll}</span>
                    </div>
                )}

                {/* Bottom Bar - Controls */}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-slate-800/90 backdrop-blur-md border-t border-slate-700 flex items-center justify-between px-6 z-30">
                    {/* Hand / Resources */}
                    <div className="flex space-x-2">
                        {Object.entries(resources).map(([res, count]) => {
                            const imgPath = `/assets/card_${res}.png`;
                            return (
                                <div key={res} className="relative w-14 h-20 bg-slate-800 rounded-lg border-2 border-slate-600 shadow-lg flex flex-col items-center justify-end overflow-hidden group hover:scale-110 transition-transform duration-200 cursor-help" title={`${res}: ${count}`}>
                                    <img
                                        src={imgPath}
                                        alt={res}
                                        className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                                    />
                                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 to-transparent pointer-events-none"></div>
                                    <div className="absolute top-[-6px] right-[-6px] w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center border-2 border-slate-800 shadow-md z-10">
                                        <span className="font-bold text-xs text-white">{count}</span>
                                    </div>
                                    <span className="relative z-10 text-[8px] font-black uppercase tracking-widest text-white mb-1 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">{res}</span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                        {!isSetupPhase && (
                            <button
                                onClick={onRollDice}
                                disabled={!isMyTurn || hasRolled}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg font-bold text-sm shadow-lg transform hover:-translate-y-1 disabled:hover:translate-y-0 transition-all"
                            >
                                Roll
                            </button>
                        )}
                        {!isSetupPhase && (
                            <button
                                onClick={onTrade}
                                disabled={!isMyTurn}
                                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg font-bold text-sm shadow-lg transform hover:-translate-y-1 disabled:hover:translate-y-0 transition-all"
                            >
                                Trade
                            </button>
                        )}
                        {!isSetupPhase && (
                            <button
                                onClick={onBuild}
                                disabled={!isMyTurn}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg font-bold text-sm shadow-lg transform hover:-translate-y-1 disabled:hover:translate-y-0 transition-all"
                            >
                                Build
                            </button>
                        )}
                        {!isSetupPhase && (
                            <button
                                onClick={onBuildCity}
                                disabled={!isMyTurn}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg font-bold text-sm shadow-lg transform hover:-translate-y-1 disabled:hover:translate-y-0 transition-all"
                            >
                                City
                            </button>
                        )}
                        {!isSetupPhase && (
                            <button
                                onClick={onBuildRoad}
                                disabled={!isMyTurn}
                                className="px-4 py-2 bg-amber-700 hover:bg-amber-600 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg font-bold text-sm shadow-lg transform hover:-translate-y-1 disabled:hover:translate-y-0 transition-all"
                            >
                                Road
                            </button>
                        )}
                        {!isSetupPhase && (
                            <button
                                onClick={onEndTurn}
                                disabled={!isMyTurn || !hasRolled}
                                className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg font-bold text-sm shadow-lg transform hover:-translate-y-1 disabled:hover:translate-y-0 transition-all"
                            >
                                End Turn
                            </button>
                        )}
                    </div>
                </div>
            </main>

            {/* Right Sidebar - Info Hub */}
            <aside className="w-64 bg-slate-800 border-l border-slate-700 flex flex-col z-20 shadow-xl">
                {/* Player Table */}
                <div className="p-4 border-b border-slate-700">
                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Players</h3>
                    <div className="space-y-2">
                        {players.map((player) => (
                            <div key={player.id} className={`flex items-center justify-between p-2 rounded border ${player.id === myPlayerId ? 'bg-slate-700/50 border-blue-500/50' : 'bg-slate-700/30 border-transparent'}`}>
                                <div className="flex items-center space-x-2 overflow-hidden">
                                    <div className={`w-6 h-6 flex-shrink-0 rounded-full`} style={{ backgroundColor: player.color }}></div>
                                    <span className={`font-bold text-sm truncate ${player.id === myPlayerId ? 'text-white' : 'text-slate-300'}`}>
                                        {player.name} {player.id === myPlayerId && '(You)'}
                                    </span>
                                </div>
                                <div className="flex items-center space-x-2 text-xs flex-shrink-0">
                                    <div className="flex items-center gap-0.5" title="Victory Points">
                                        <span>🏆</span>
                                        <span className="font-bold">{player.victoryPoints}</span>
                                    </div>
                                    <div className="flex items-center gap-0.5" title="Cards in Hand">
                                        <span>🃏</span>
                                        <span className="font-bold">{Object.values(player.resources).reduce((a, b) => a + b, 0)}</span>
                                    </div>
                                    <div className="flex items-center gap-0.5" title="Army Size">
                                        <span>⚔️</span>
                                        <span className="font-bold">{player.knightsPlayed}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Game Log */}
                <div className="flex-1 p-4 overflow-y-auto border-b border-slate-700 font-mono text-[10px] text-slate-300 space-y-1 bg-slate-900/30">
                    <div className="text-slate-500 mb-2 font-bold uppercase tracking-wider sticky top-0 bg-slate-900/90 py-1">Game Log</div>
                    {gameLog.slice().reverse().map((log, i) => (
                        <div key={i} className="opacity-80 border-l-2 border-slate-600 pl-2 py-1 hover:bg-slate-800/50 transition-colors">{log}</div>
                    ))}
                    {gameLog.length === 0 && <div className="text-slate-600 italic">Game started...</div>}
                </div>

                {/* Undo Button Area */}
                {!isSetupPhase && (
                    <div className="p-2 border-b border-slate-700 bg-slate-800">
                        <button
                            onClick={onUndo}
                            disabled={!canUndo}
                            className="w-full py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white rounded font-bold text-xs transition-colors border border-slate-600"
                        >
                            Undo Last Build
                        </button>
                    </div>
                )}

                {/* Chat */}
                <div className="p-4 bg-slate-800">
                    <input
                        type="text"
                        placeholder="Type a message..."
                        className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-xs focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>
            </aside>
        </div>
    );
};
