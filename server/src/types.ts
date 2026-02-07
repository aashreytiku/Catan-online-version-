export type ResourceType = 'wood' | 'brick' | 'sheep' | 'wheat' | 'ore';
export type TerrainType = 'forest' | 'hills' | 'pasture' | 'fields' | 'mountains' | 'desert';

export interface Hex {
    id: string;
    q: number;
    r: number;
    s: number;
    terrain: TerrainType;
    resource: ResourceType | null;
    numberToken: number | null;
}

export type StructureType = 'road' | 'settlement' | 'city';

export interface Structure {
    id: string;
    type: StructureType;
    playerId: string;
    // For hex-based placement (simplified for MVP: structures live on hex vertices/edges)
    // We need a way to reference vertices/edges. 
    // Standard approach: Hex coordinates + direction/index.
    // For MVP, let's store structures on the Hex object itself for simplicity, 
    // although shared vertices are tricky.
    // Better: Store structures in a separate list in GameState, referencing hex coordinates.
    location: {
        q: number;
        r: number;
        s: number;
        position: number; // 0-5 for vertices (settlements), 0-5 for edges (roads)
    };
}

export interface Player {
    id: string;
    color: string;
    name: string;
    resources: Record<ResourceType, number>;
    victoryPoints: number;
    structures: Structure[];
    developmentCards: DevelopmentCard[];
    knightsPlayed: number;
    longestRoadSegment: number;
}

export type DevelopmentCardType = 'knight' | 'victory_point' | 'road_building' | 'year_of_plenty' | 'monopoly';

export interface DevelopmentCard {
    id: string;
    type: DevelopmentCardType;
    isNew: boolean;
    wasPlayed: boolean;
}

export interface GameState {
    id: string;
    players: Player[];
    hexes: Hex[];
    currentTurnPlayerId: string;
    diceRoll: number | null;
    status: 'waiting' | 'playing' | 'finished';
    robberHexId: string | null;
    structures: Structure[];
    phase: 'setup_round_1' | 'setup_round_2' | 'playing' | 'moving_robber' | 'stealing' | 'road_building_dev';
    subPhase?: 'building_settlement' | 'building_road';
    turnOrder: string[];
    setupTurnIndex: number;
    logs: string[];
    hasUndone: boolean;
    structuresBuiltThisTurn: string[];
    activeTrade: TradeOffer | null;
    devCardDeck: DevelopmentCardType[];
    largestArmyPlayerId: string | null;
    longestRoadPlayerId: string | null;
    roadsToBuild?: number;
    robberStealOptions?: string[]; // List of player IDs to steal from
}

export interface TradeOffer {
    id: string;
    proposerId: string;
    targetPlayerId: string;
    offer: Record<ResourceType, number>;
    request: Record<ResourceType, number>;
    status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
}
