import React, { useState } from 'react';

interface DevCardModalProps {
    type: 'monopoly' | 'year_of_plenty';
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (options: any) => void;
}

const RESOURCES = ['wood', 'brick', 'sheep', 'wheat', 'ore'];

export const DevCardModal: React.FC<DevCardModalProps> = ({ type, isOpen, onClose, onConfirm }) => {
    const [selectedResource1, setSelectedResource1] = useState<string>('wood');
    const [selectedResource2, setSelectedResource2] = useState<string>('wood');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (type === 'monopoly') {
            onConfirm({ resource: selectedResource1 });
        } else {
            onConfirm({ resource1: selectedResource1, resource2: selectedResource2 });
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-600 shadow-2xl w-96">
                <h2 className="text-xl font-bold text-white mb-4 capitalize">
                    Play {type.replace(/_/g, ' ')}
                </h2>

                <div className="space-y-4">
                    {type === 'monopoly' ? (
                        <div>
                            <label className="block text-sm text-slate-400 mb-2">Choose resource to monopolize:</label>
                            <div className="grid grid-cols-3 gap-2">
                                {RESOURCES.map(res => (
                                    <button
                                        key={res}
                                        onClick={() => setSelectedResource1(res)}
                                        className={`p-2 rounded border capitalize text-sm font-bold transition-all ${selectedResource1 === res
                                                ? 'bg-blue-600 border-blue-400 text-white'
                                                : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                                            }`}
                                    >
                                        {res}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Choose first resource:</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {RESOURCES.map(res => (
                                        <button
                                            key={`1-${res}`}
                                            onClick={() => setSelectedResource1(res)}
                                            className={`p-2 rounded border capitalize text-sm font-bold transition-all ${selectedResource1 === res
                                                    ? 'bg-blue-600 border-blue-400 text-white'
                                                    : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                                                }`}
                                        >
                                            {res}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Choose second resource:</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {RESOURCES.map(res => (
                                        <button
                                            key={`2-${res}`}
                                            onClick={() => setSelectedResource2(res)}
                                            className={`p-2 rounded border capitalize text-sm font-bold transition-all ${selectedResource2 === res
                                                    ? 'bg-purple-600 border-purple-400 text-white'
                                                    : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                                                }`}
                                        >
                                            {res}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded font-bold"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded font-bold"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};
