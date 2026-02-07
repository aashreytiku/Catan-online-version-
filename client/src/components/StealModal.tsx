import React from 'react';
import type { Player } from '../types';

interface StealModalProps {
    isOpen: boolean;
    victimIds: string[];
    players: Player[];
    onSelectVictim: (victimId: string) => void;
}

export const StealModal: React.FC<StealModalProps> = ({ isOpen, victimIds, players, onSelectVictim }) => {
    if (!isOpen) return null;

    const victims = players.filter(p => victimIds.includes(p.id));

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-slate-800 p-8 rounded-xl border border-red-500/50 shadow-2xl w-96 text-center">
                <h2 className="text-2xl font-black text-white mb-2">Robber Attack!</h2>
                <p className="text-slate-400 mb-6">Choose a player to steal a resource from:</p>

                <div className="space-y-3">
                    {victims.map(victim => (
                        <button
                            key={victim.id}
                            onClick={() => onSelectVictim(victim.id)}
                            className="w-full p-4 rounded-lg bg-slate-700 hover:bg-slate-600 border border-slate-600 hover:border-red-500 transition-all flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full border-2 border-white/20" style={{ backgroundColor: victim.color }}></div>
                                <span className="font-bold text-white group-hover:text-red-400 transition-colors">{victim.name}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-slate-400">
                                <span>🃏</span>
                                <span>{Object.values(victim.resources).reduce((a, b) => a + b, 0)}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
