import { BlockType } from '../types';
import { CHUNK_WIDTH, CHUNK_HEIGHT, TILE_SIZE } from '../constants';
import { Simple1DNoise } from '../utils/math';

export class Chunk {
    public blocks: Uint8Array;
    public x: number;

    constructor(x: number) {
        this.x = x;
        this.blocks = new Uint8Array(CHUNK_WIDTH * CHUNK_HEIGHT);
    }

    getIndex(lx: number, y: number): number {
        return y * CHUNK_WIDTH + lx;
    }

    getBlock(lx: number, y: number): BlockType {
        if (lx < 0 || lx >= CHUNK_WIDTH || y < 0 || y >= CHUNK_HEIGHT) return BlockType.AIR;
        return this.blocks[this.getIndex(lx, y)];
    }

    setBlock(lx: number, y: number, type: BlockType) {
        if (lx >= 0 && lx < CHUNK_WIDTH && y >= 0 && y < CHUNK_HEIGHT) {
            this.blocks[this.getIndex(lx, y)] = type;
        }
    }
}

export class World {
    private chunks: Map<number, Chunk> = new Map();
    private noise: Simple1DNoise;
    private seed: number;

    constructor(seed: number = 12345) {
        this.seed = seed;
        this.noise = new Simple1DNoise(seed);
    }

    getChunk(chunkX: number): Chunk {
        if (!this.chunks.has(chunkX)) {
            this.generateChunk(chunkX);
        }
        return this.chunks.get(chunkX)!;
    }

    private generateChunk(chunkX: number) {
        const chunk = new Chunk(chunkX);
        const startX = chunkX * CHUNK_WIDTH;

        for (let lx = 0; lx < CHUNK_WIDTH; lx++) {
            const worldX = startX + lx;
            
            // Base terrain height
            const baseHeight = 60;
            const heightVariation = this.noise.get(worldX, 30) * 15 + this.noise.get(worldX, 10) * 5;
            const surfaceY = Math.floor(baseHeight + heightVariation);

            for (let y = 0; y < CHUNK_HEIGHT; y++) {
                if (y === CHUNK_HEIGHT - 1) {
                    chunk.setBlock(lx, y, BlockType.BEDROCK);
                } else if (y > surfaceY) {
                    // Underground
                    if (y < surfaceY + 4) {
                        chunk.setBlock(lx, y, BlockType.DIRT);
                    } else {
                        // Simple cave generation (random noise threshold)
                        // In a real game, use 2D Perlin noise here
                        const isCave = Math.random() > 0.85 && y > surfaceY + 10;
                        if (!isCave) {
                            chunk.setBlock(lx, y, BlockType.STONE);
                        }
                    }
                } else if (y === surfaceY) {
                    // Surface
                    chunk.setBlock(lx, y, BlockType.GRASS);
                    
                    // Trees
                    if (Math.random() < 0.05 && lx > 2 && lx < CHUNK_WIDTH - 2) {
                        this.generateTree(chunk, lx, y - 1);
                    }
                }
            }
        }
        this.chunks.set(chunkX, chunk);
    }

    private generateTree(chunk: Chunk, lx: number, baseY: number) {
        const height = 4 + Math.floor(Math.random() * 3);
        // Trunk
        for (let i = 0; i < height; i++) {
            if (baseY - i >= 0) chunk.setBlock(lx, baseY - i, BlockType.WOOD);
        }
        // Leaves
        for (let ly = baseY - height - 1; ly <= baseY - height + 1; ly++) {
            for (let lx2 = lx - 2; lx2 <= lx + 2; lx2++) {
                if (lx2 >= 0 && lx2 < CHUNK_WIDTH && ly >= 0) {
                    // Don't overwrite trunk
                    if (chunk.getBlock(lx2, ly) === BlockType.AIR) {
                        // Make corners empty for rounded look
                        if (Math.abs(lx2 - lx) === 2 && Math.abs(ly - (baseY - height)) === 1) continue;
                        chunk.setBlock(lx2, ly, BlockType.LEAVES);
                    }
                }
            }
        }
    }

    getBlock(x: number, y: number): BlockType {
        if (y < 0 || y >= CHUNK_HEIGHT) return BlockType.AIR;
        const chunkX = Math.floor(x / CHUNK_WIDTH);
        const lx = ((x % CHUNK_WIDTH) + CHUNK_WIDTH) % CHUNK_WIDTH;
        return this.getChunk(chunkX).getBlock(lx, y);
    }

    setBlock(x: number, y: number, type: BlockType) {
        if (y < 0 || y >= CHUNK_HEIGHT) return;
        const chunkX = Math.floor(x / CHUNK_WIDTH);
        const lx = ((x % CHUNK_WIDTH) + CHUNK_WIDTH) % CHUNK_WIDTH;
        this.getChunk(chunkX).setBlock(lx, y, type);
    }
}
