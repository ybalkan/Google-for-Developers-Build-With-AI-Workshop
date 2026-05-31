export enum BlockType {
    AIR = 0,
    DIRT = 1,
    GRASS = 2,
    STONE = 3,
    WOOD = 4,
    LEAVES = 5,
    SAND = 6,
    BEDROCK = 7,
    PLANKS = 8,
    COBBLESTONE = 9,
    GLASS = 10
}

export enum ItemCategory {
    BLOCK,
    TOOL,
    RESOURCE
}

export interface ItemDef {
    id: string;
    name: string;
    icon: string; // Emoji or color
    maxStack: number;
    category: ItemCategory;
    blockType?: BlockType; // If it places a block
    toolPower?: number; // For mining speed
    durability?: number;
}

export interface ItemStack {
    itemId: string;
    count: number;
}

export interface Vector2 {
    x: number;
    y: number;
}

export interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface Recipe {
    pattern: (string | null)[][]; // 3x3 grid, null means empty
    result: ItemStack;
}
