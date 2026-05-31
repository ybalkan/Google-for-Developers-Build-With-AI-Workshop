import { BlockType, ItemCategory, ItemDef, Recipe } from '../types';

export const Blocks: Record<BlockType, { color: string, solid: boolean, name: string }> = {
    [BlockType.AIR]: { color: 'transparent', solid: false, name: 'Air' },
    [BlockType.DIRT]: { color: '#795548', solid: true, name: 'Dirt' },
    [BlockType.GRASS]: { color: '#4CAF50', solid: true, name: 'Grass Block' },
    [BlockType.STONE]: { color: '#9E9E9E', solid: true, name: 'Stone' },
    [BlockType.WOOD]: { color: '#5D4037', solid: true, name: 'Wood Log' },
    [BlockType.LEAVES]: { color: '#2E7D32', solid: true, name: 'Leaves' },
    [BlockType.SAND]: { color: '#F4A460', solid: true, name: 'Sand' },
    [BlockType.BEDROCK]: { color: '#212121', solid: true, name: 'Bedrock' },
    [BlockType.PLANKS]: { color: '#8D6E63', solid: true, name: 'Wooden Planks' },
    [BlockType.COBBLESTONE]: { color: '#757575', solid: true, name: 'Cobblestone' },
    [BlockType.GLASS]: { color: 'rgba(224, 247, 250, 0.5)', solid: true, name: 'Glass' },
};

export const Items: Record<string, ItemDef> = {
    'dirt': { id: 'dirt', name: 'Dirt', icon: '🟫', maxStack: 64, category: ItemCategory.BLOCK, blockType: BlockType.DIRT },
    'grass': { id: 'grass', name: 'Grass Block', icon: '🟩', maxStack: 64, category: ItemCategory.BLOCK, blockType: BlockType.GRASS },
    'stone': { id: 'stone', name: 'Stone', icon: '🪨', maxStack: 64, category: ItemCategory.BLOCK, blockType: BlockType.STONE },
    'wood': { id: 'wood', name: 'Wood Log', icon: '🪵', maxStack: 64, category: ItemCategory.BLOCK, blockType: BlockType.WOOD },
    'leaves': { id: 'leaves', name: 'Leaves', icon: '🍃', maxStack: 64, category: ItemCategory.BLOCK, blockType: BlockType.LEAVES },
    'sand': { id: 'sand', name: 'Sand', icon: '🟨', maxStack: 64, category: ItemCategory.BLOCK, blockType: BlockType.SAND },
    'planks': { id: 'planks', name: 'Wooden Planks', icon: '🟫', maxStack: 64, category: ItemCategory.BLOCK, blockType: BlockType.PLANKS },
    'cobblestone': { id: 'cobblestone', name: 'Cobblestone', icon: '🧱', maxStack: 64, category: ItemCategory.BLOCK, blockType: BlockType.COBBLESTONE },
    'stick': { id: 'stick', name: 'Stick', icon: '🦯', maxStack: 64, category: ItemCategory.RESOURCE },
    'wooden_pickaxe': { id: 'wooden_pickaxe', name: 'Wooden Pickaxe', icon: '⛏️', maxStack: 1, category: ItemCategory.TOOL, toolPower: 2 },
    'stone_pickaxe': { id: 'stone_pickaxe', name: 'Stone Pickaxe', icon: '⛏️', maxStack: 1, category: ItemCategory.TOOL, toolPower: 4 },
};

// Helper to map block type to item drop
export function getDropForItem(blockType: BlockType): string | null {
    switch (blockType) {
        case BlockType.DIRT: return 'dirt';
        case BlockType.GRASS: return 'dirt'; // Grass drops dirt
        case BlockType.STONE: return 'cobblestone'; // Stone drops cobblestone
        case BlockType.WOOD: return 'wood';
        case BlockType.LEAVES: return Math.random() < 0.1 ? 'stick' : null;
        case BlockType.SAND: return 'sand';
        case BlockType.PLANKS: return 'planks';
        case BlockType.COBBLESTONE: return 'cobblestone';
        default: return null;
    }
}

export const Recipes: Recipe[] = [
    {
        // Wood -> 4 Planks
        pattern: [
            ['wood', null, null],
            [null, null, null],
            [null, null, null]
        ],
        result: { itemId: 'planks', count: 4 }
    },
    {
        // 2 Planks -> 4 Sticks
        pattern: [
            ['planks', null, null],
            ['planks', null, null],
            [null, null, null]
        ],
        result: { itemId: 'stick', count: 4 }
    },
    {
        // Wooden Pickaxe
        pattern: [
            ['planks', 'planks', 'planks'],
            [null, 'stick', null],
            [null, 'stick', null]
        ],
        result: { itemId: 'wooden_pickaxe', count: 1 }
    },
    {
        // Stone Pickaxe
        pattern: [
            ['cobblestone', 'cobblestone', 'cobblestone'],
            [null, 'stick', null],
            [null, 'stick', null]
        ],
        result: { itemId: 'stone_pickaxe', count: 1 }
    }
];
