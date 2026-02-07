import React from 'react';
import { HexTile } from './HexTile';
import type { Hex, Structure, Player } from '../types';

interface HexGridProps {
    hexes: Hex[];
    structures: Structure[];
    players: Player[];
    onVertexClick?: (hex: Hex, position: number) => void;
    onEdgeClick?: (hex: Hex, position: number) => void;
    onHexClick?: (hexId: string) => void;
    isBuildMode?: boolean;
    buildModeType?: 'settlement' | 'city' | 'road';
    robberHexId?: string | null;
}



export const HexGrid: React.FC<HexGridProps> = ({ hexes, structures, players, onVertexClick, onEdgeClick, onHexClick, isBuildMode, buildModeType, robberHexId }) => {
    const hexSize = 50; // Size of hex side
    const gridWidth = 800;
    const gridHeight = 600;

    const isBuildRoadMode = buildModeType === 'road';
    const isUpgradeMode = buildModeType === 'city';
    // We don't have isSetupPhase prop anymore, assume valid edges logic is handled by server validation or simplified for now.
    // If we need strict client-side validation for road building during setup, we need to pass isSetupPhase or similar.
    // For now, let's simplify getValidRoadEdges to always return true (all edges valid visually) or rely on server error.
    // Or better, just show all edges as interactive if in road mode.

    const getStructureOnHex = (hex: Hex) => {
        return structures
            .filter(s => s.location.q === hex.q && s.location.r === hex.r && s.location.s === hex.s)
            .map(s => ({
                type: s.type,
                color: players.find(p => p.id === s.playerId)?.color || 'white',
                position: s.location.position
            }));
    };

    return (
        <svg width={gridWidth} height={gridHeight} viewBox={`0 0 ${gridWidth} ${gridHeight}`} className="overflow-visible">
            <g transform={`translate(${gridWidth / 2}, ${gridHeight / 2})`}>
                {hexes.map((hex) => (
                    <HexTile
                        key={hex.id}
                        hex={hex}
                        size={hexSize}
                        structure={getStructureOnHex(hex)}
                        onClick={() => onHexClick?.(hex.id)}
                        onVertexClick={(position) => onVertexClick?.(hex, position)}
                        onEdgeClick={(position) => onEdgeClick?.(hex, position)}
                        isBuildMode={isBuildMode}
                        isBuildRoadMode={isBuildRoadMode}
                        isUpgradeMode={isUpgradeMode}
                        validRoadEdges={[0, 1, 2, 3, 4, 5]} // Simplified for now
                        isRobber={hex.id === robberHexId}
                    />
                ))}
            </g>
        </svg>
    );
};
