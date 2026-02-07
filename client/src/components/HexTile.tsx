import React from 'react';

interface Hex {
    q: number;
    r: number;
    s: number;
    terrain: string;
    resource: string | null;
    numberToken: number | null;
}

interface HexTileProps {
    hex: Hex;
    size: number;
    structure?: { type: 'settlement' | 'city' | 'road', color: string, position?: number }[];
    onClick?: () => void;
    onVertexClick?: (position: number) => void;
    onEdgeClick?: (position: number) => void;
    isBuildMode?: boolean;
    isBuildRoadMode?: boolean;
    isUpgradeMode?: boolean;
    validRoadEdges?: number[];
    isRobber?: boolean;
}

const TERRAIN_COLORS: Record<string, string> = {
    forest: '#2d6a4f', // Dark Green
    hills: '#bc6c25', // Brown/Orange
    pasture: '#95d5b2', // Light Green
    fields: '#e9c46a', // Yellow
    mountains: '#6c757d', // Grey
    desert: '#f4a261', // Sand
};

export const HexTile: React.FC<HexTileProps> = ({ hex, size, structure, onClick, onVertexClick, onEdgeClick, isBuildMode, isBuildRoadMode, isUpgradeMode, isRobber, validRoadEdges }) => {
    const { q, r, terrain, numberToken } = hex;
    // Calculate pixel coordinates
    // Pointy-top hex:
    // x = size * sqrt(3) * (q + r/2)
    // y = size * 3/2 * r
    const x = size * Math.sqrt(3) * (q + r / 2);
    const y = size * 3 / 2 * r;

    const points = [];
    for (let i = 0; i < 6; i++) {
        const angle_deg = 60 * i - 30;
        const angle_rad = Math.PI / 180 * angle_deg;
        points.push(`${size * Math.cos(angle_rad)},${size * Math.sin(angle_rad)}`);
    }

    const getVertexTransform = (index: number) => {
        const angle_deg = 60 * index - 30;
        const angle_rad = Math.PI / 180 * angle_deg;
        return `translate(${size * Math.cos(angle_rad)}, ${size * Math.sin(angle_rad)})`;
    };

    const getEdgeTransform = (index: number) => {
        // Edges are between vertices. Edge 0 is between V0 and V1.
        // V0 is at -30 deg, V1 is at 30 deg. Midpoint is at 0 deg.
        const angle_deg = 60 * index;
        const angle_rad = Math.PI / 180 * angle_deg;
        // Distance to midpoint of edge is size * cos(30deg) = size * sqrt(3)/2
        const dist = size * (Math.sqrt(3) / 2);
        return `translate(${dist * Math.cos(angle_rad)}, ${dist * Math.sin(angle_rad)}) rotate(${angle_deg + 90})`;
    };

    const color = TERRAIN_COLORS[terrain] || '#ccc';
    const textureId = `texture-${terrain}`;
    const hasTexture = ['forest', 'hills', 'pasture', 'fields', 'mountains', 'desert'].includes(terrain);

    return (
        <g transform={`translate(${x},${y})`} onClick={onClick} className="cursor-pointer hover:opacity-90 transition-opacity">
            <defs>
                {hasTexture && (
                    <pattern id={textureId} patternUnits="userSpaceOnUse" x={-size * 1.5} y={-size * 1.5} width={size * 3} height={size * 3}>
                        <image
                            href={`/assets/tile_${terrain}.png`}
                            x="0"
                            y="0"
                            width={size * 3}
                            height={size * 3}
                            preserveAspectRatio="xMidYMid slice"
                        />
                    </pattern>
                )}
            </defs>

            {/* Hexagon */}
            <polygon
                points={points.join(' ')}
                fill={hasTexture ? `url(#${textureId})` : color}
                stroke="#fff"
                strokeWidth="3"
            />

            {/* Number Token */}
            {numberToken && (
                <g>
                    <circle r={size * 0.3} fill="white" opacity="0.8" />
                    <text
                        textAnchor="middle"
                        dy=".3em"
                        fontSize={size * 0.3}
                        fontWeight="bold"
                        fill={numberToken === 6 || numberToken === 8 ? 'red' : 'black'}
                    >
                        {numberToken}
                    </text>
                </g>
            )}

            {/* Robber */}
            {isRobber && (
                <circle r={size * 0.3} fill="black" stroke="white" strokeWidth="2" />
            )}

            {/* Edges / Roads */}
            {[0, 1, 2, 3, 4, 5].map(i => {
                // Check if there is a road here
                const road = structure?.find(s => s.type === 'road' && s.position === i);

                return (
                    <g key={`edge-${i}`} transform={getEdgeTransform(i)}>
                        {/* Existing Road */}
                        {road && (
                            <rect
                                x={-size * 0.4}
                                y={-4}
                                width={size * 0.8}
                                height={8}
                                fill={road.color}
                                stroke="black"
                                strokeWidth="1"
                            />
                        )}

                        {/* Build Slot (Hitbox) */}
                        {isBuildRoadMode && !road && (!validRoadEdges || validRoadEdges.includes(i)) && (
                            <rect
                                x={-size * 0.4}
                                y={-8}
                                width={size * 0.8}
                                height={16}
                                fill="transparent"
                                fillOpacity="0"
                                className="cursor-pointer hover:fill-opacity-0 transition-all"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdgeClick?.(i);
                                }}
                            />
                        )}
                    </g>
                );
            })}

            {/* Vertices / Settlements */}
            {[0, 1, 2, 3, 4, 5].map(i => {
                const building = structure?.find(s => s.type !== 'road' && s.position === i);

                return (
                    <g key={`vertex-${i}`} transform={getVertexTransform(i)}>
                        {/* Build Slot */}
                        {isBuildMode && !building && (
                            <circle
                                r={size * 0.2}
                                fill="white"
                                fillOpacity="0.5"
                                className="cursor-pointer hover:fill-opacity-1 transition-all"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onVertexClick?.(i);
                                }}
                            />
                        )}

                        {/* Structure */}
                        {building && (
                            <g
                                onClick={(e) => {
                                    if (isUpgradeMode && building.type === 'settlement') {
                                        e.stopPropagation();
                                        onVertexClick?.(i);
                                    }
                                }}
                                className={isUpgradeMode && building.type === 'settlement' ? "cursor-pointer hover:scale-125 transition-transform" : ""}
                            >
                                {building.type === 'settlement' && (
                                    // House Shape
                                    <polygon points="-10,0 -10,-10 0,-18 10,-10 10,0" fill={building.color} stroke="white" strokeWidth="2" />
                                )}
                                {building.type === 'city' && (
                                    // Castle/Tower Shape
                                    <polygon points="-15,0 -15,-10 -10,-10 -10,-20 10,-20 10,-10 15,-10 15,0" fill={building.color} stroke="gold" strokeWidth="2" />
                                )}
                            </g>
                        )}
                    </g>
                );
            })}
        </g>
    );
};
