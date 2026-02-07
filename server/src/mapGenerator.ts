import type { Hex, TerrainType, ResourceType } from './types.js';
import { v4 as uuidv4 } from 'uuid';

const TERRAIN_COUNTS: Record<TerrainType, number> = {
    forest: 4,
    hills: 3,
    pasture: 4,
    fields: 4,
    mountains: 3,
    desert: 1,
};

const TERRAIN_RESOURCE_MAP: Record<TerrainType, ResourceType | null> = {
    forest: 'wood',
    hills: 'brick',
    pasture: 'sheep',
    fields: 'wheat',
    mountains: 'ore',
    desert: null,
};

const NUMBER_TOKENS = [5, 2, 6, 3, 8, 10, 9, 12, 11, 4, 8, 10, 9, 4, 5, 6, 3, 11];

export function generateMap(): Hex[] {
    const hexes: Hex[] = [];
    const terrains: TerrainType[] = [];

    // Populate terrain pool
    Object.entries(TERRAIN_COUNTS).forEach(([terrain, count]) => {
        for (let i = 0; i < count; i++) {
            terrains.push(terrain as TerrainType);
        }
    });

    // Shuffle terrains
    for (let i = terrains.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const t1 = terrains[i]!;
        const t2 = terrains[j]!;
        terrains[i] = t2;
        terrains[j] = t1;
    }

    // Shuffle numbers
    const numbers = [...NUMBER_TOKENS];
    for (let i = numbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const n1 = numbers[i]!;
        const n2 = numbers[j]!;
        numbers[i] = n2;
        numbers[j] = n1;
    }

    // Generate hex grid (radius 2 for standard board)
    let terrainIndex = 0;
    let numberIndex = 0;

    // Spiral generation or simple loop? 
    // Standard Catan is often laid out in a specific spiral order for numbers to avoid clustering.
    // For MVP, we'll just iterate q, r coordinates.

    const radius = 2;
    for (let q = -radius; q <= radius; q++) {
        const r1 = Math.max(-radius, -q - radius);
        const r2 = Math.min(radius, -q + radius);
        for (let r = r1; r <= r2; r++) {
            const s = -q - r;
            const terrain = terrains[terrainIndex++] || 'desert';
            let numberToken: number | null = null;

            if (terrain !== 'desert') {
                numberToken = numbers[numberIndex++] || null;
            }

            hexes.push({
                id: uuidv4(),
                q,
                r,
                s,
                terrain,
                resource: TERRAIN_RESOURCE_MAP[terrain],
                numberToken,
            });
        }
    }

    return hexes;
}
