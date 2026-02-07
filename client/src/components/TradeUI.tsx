import React, { useState } from 'react';

interface TradeUIProps {
    isOpen: boolean;
    onClose: () => void;
    gameState: any; // TODO: Type properly
    myPlayerId: string;
    onProposeTrade: (targetPlayerId: string, offer: Record<string, number>, request: Record<string, number>) => void;
    onAcceptTrade: () => void;
    onRejectTrade: () => void;
}

const RESOURCES = ['wood', 'brick', 'sheep', 'wheat', 'ore'];

export const TradeUI: React.FC<TradeUIProps> = ({ isOpen, onClose, gameState, myPlayerId, onProposeTrade, onAcceptTrade, onRejectTrade }) => {
    const [targetPlayerId, setTargetPlayerId] = useState<string>('');
    const [offer, setOffer] = useState<Record<string, number>>({ wood: 0, brick: 0, sheep: 0, wheat: 0, ore: 0 });
    const [request, setRequest] = useState<Record<string, number>>({ wood: 0, brick: 0, sheep: 0, wheat: 0, ore: 0 });

    const activeTrade = gameState.activeTrade;
    const myPlayer = gameState.players.find((p: any) => p.id === myPlayerId);
    const otherPlayers = gameState.players.filter((p: any) => p.id !== myPlayerId);

    // If there is an active trade
    if (activeTrade) {
        const isProposer = activeTrade.proposerId === myPlayerId;
        const isTarget = activeTrade.targetPlayerId === myPlayerId;
        const proposer = gameState.players.find((p: any) => p.id === activeTrade.proposerId);
        const target = gameState.players.find((p: any) => p.id === activeTrade.targetPlayerId);

        if (isTarget) {
            return (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-slate-800 p-8 rounded-xl border border-slate-600 shadow-2xl max-w-lg w-full">
                        <h2 className="text-2xl font-bold text-white mb-4">Incoming Trade Offer</h2>
                        <p className="text-slate-300 mb-6">
                            <span className="font-bold text-blue-400">{proposer?.name}</span> wants to trade with you.
                        </p>

                        <div className="grid grid-cols-2 gap-8 mb-8">
                            <div className="bg-slate-700/50 p-4 rounded-lg">
                                <h3 className="text-sm font-bold text-emerald-400 uppercase mb-2">You Get</h3>
                                <div className="space-y-1">
                                    {Object.entries(activeTrade.offer).map(([res, count]: [string, any]) => (
                                        count > 0 && (
                                            <div key={res} className="flex justify-between text-white">
                                                <span className="capitalize">{res}</span>
                                                <span className="font-bold">{count}</span>
                                            </div>
                                        )
                                    ))}
                                    {Object.values(activeTrade.offer).every((v: any) => v === 0) && <span className="text-slate-500 text-sm">Nothing</span>}
                                </div>
                            </div>
                            <div className="bg-slate-700/50 p-4 rounded-lg">
                                <h3 className="text-sm font-bold text-amber-400 uppercase mb-2">You Give</h3>
                                <div className="space-y-1">
                                    {Object.entries(activeTrade.request).map(([res, count]: [string, any]) => (
                                        count > 0 && (
                                            <div key={res} className="flex justify-between text-white">
                                                <span className="capitalize">{res}</span>
                                                <span className="font-bold">{count}</span>
                                            </div>
                                        )
                                    ))}
                                    {Object.values(activeTrade.request).every((v: any) => v === 0) && <span className="text-slate-500 text-sm">Nothing</span>}
                                </div>
                            </div>
                        </div>

                        <div className="flex space-x-4">
                            <button
                                onClick={onAcceptTrade}
                                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-lg transition-colors"
                            >
                                Accept
                            </button>
                            <button
                                onClick={onRejectTrade}
                                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold shadow-lg transition-colors"
                            >
                                Reject
                            </button>
                        </div>
                    </div>
                </div>
            );
        } else if (isProposer) {
            return (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-slate-800 p-8 rounded-xl border border-slate-600 shadow-2xl max-w-md w-full text-center">
                        <h2 className="text-2xl font-bold text-white mb-4">Trade Proposed</h2>
                        <p className="text-slate-300 mb-8">
                            Waiting for <span className="font-bold text-blue-400">{target?.name}</span> to respond...
                        </p>
                        <button
                            onClick={onRejectTrade} // Reuse reject to cancel
                            className="px-6 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg font-bold transition-colors"
                        >
                            Cancel Trade
                        </button>
                    </div>
                </div>
            );
        } else {
            // Third party view
            return null;
        }
    }

    // Proposal Form
    if (!isOpen) return null;

    const handleResourceChange = (type: 'offer' | 'request', res: string, delta: number) => {
        if (type === 'offer') {
            setOffer(prev => ({ ...prev, [res]: Math.max(0, prev[res] + delta) }));
        } else {
            setRequest(prev => ({ ...prev, [res]: Math.max(0, prev[res] + delta) }));
        }
    };

    const handleSubmit = () => {
        if (!targetPlayerId) return;
        onProposeTrade(targetPlayerId, offer, request);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-slate-800 p-8 rounded-xl border border-slate-600 shadow-2xl max-w-2xl w-full">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Propose Trade</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-400 mb-2">Select Player</label>
                    <div className="flex space-x-4">
                        {otherPlayers.map((p: any) => (
                            <button
                                key={p.id}
                                onClick={() => setTargetPlayerId(p.id)}
                                className={`px-4 py-2 rounded-lg font-bold transition-colors ${targetPlayerId === p.id
                                        ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                    }`}
                            >
                                {p.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-8">
                    {/* Offer Section */}
                    <div className="bg-slate-700/30 p-4 rounded-lg border border-slate-600">
                        <h3 className="text-lg font-bold text-emerald-400 mb-4 flex justify-between">
                            <span>You Offer</span>
                            <span className="text-xs font-normal text-slate-400 mt-1">Max: Your Inventory</span>
                        </h3>
                        <div className="space-y-3">
                            {RESOURCES.map(res => (
                                <div key={res} className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <img src={`/assets/card_${res}.png`} alt={res} className="w-6 h-8 object-cover rounded" />
                                        <span className="capitalize text-slate-200">{res}</span>
                                    </div>
                                    <div className="flex items-center space-x-2 bg-slate-800 rounded px-2 py-1">
                                        <button
                                            onClick={() => handleResourceChange('offer', res, -1)}
                                            className="text-slate-400 hover:text-white px-1"
                                        >-</button>
                                        <span className="w-4 text-center text-white font-mono">{offer[res]}</span>
                                        <button
                                            onClick={() => {
                                                if (myPlayer.resources[res] > offer[res]) {
                                                    handleResourceChange('offer', res, 1);
                                                }
                                            }}
                                            className="text-slate-400 hover:text-white px-1"
                                        >+</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Request Section */}
                    <div className="bg-slate-700/30 p-4 rounded-lg border border-slate-600">
                        <h3 className="text-lg font-bold text-amber-400 mb-4">You Request</h3>
                        <div className="space-y-3">
                            {RESOURCES.map(res => (
                                <div key={res} className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <img src={`/assets/card_${res}.png`} alt={res} className="w-6 h-8 object-cover rounded" />
                                        <span className="capitalize text-slate-200">{res}</span>
                                    </div>
                                    <div className="flex items-center space-x-2 bg-slate-800 rounded px-2 py-1">
                                        <button
                                            onClick={() => handleResourceChange('request', res, -1)}
                                            className="text-slate-400 hover:text-white px-1"
                                        >-</button>
                                        <span className="w-4 text-center text-white font-mono">{request[res]}</span>
                                        <button
                                            onClick={() => handleResourceChange('request', res, 1)}
                                            className="text-slate-400 hover:text-white px-1"
                                        >+</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={!targetPlayerId || (Object.values(offer).every(v => v === 0) && Object.values(request).every(v => v === 0))}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-bold shadow-lg transition-all"
                >
                    Propose Trade
                </button>
            </div>
        </div>
    );
};
