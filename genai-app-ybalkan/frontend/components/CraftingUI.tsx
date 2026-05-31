import React, { useState, useEffect } from 'react';
import { Inventory } from '../game/Inventory';
import { Recipes, Items } from '../game/Registry';
import { ItemStack } from '../types';
import { Slot } from './Slot';

interface CraftingUIProps {
    inventory: Inventory;
    onCraft: () => void;
}

export const CraftingUI: React.FC<CraftingUIProps> = ({ inventory, onCraft }) => {
    // 3x3 grid state
    const [grid, setGrid] = useState<(ItemStack | null)[]>(new Array(9).fill(null));
    const [result, setResult] = useState<ItemStack | null>(null);

    // Check recipes whenever grid changes
    useEffect(() => {
        let foundResult: ItemStack | null = null;
        
        for (const recipe of Recipes) {
            if (checkRecipe(recipe, grid)) {
                foundResult = recipe.result;
                break;
            }
        }
        setResult(foundResult);
    }, [grid]);

    const checkRecipe = (recipe: typeof Recipes[0], currentGrid: (ItemStack | null)[]) => {
        // Simple exact match for now (doesn't handle shifting pattern)
        for (let y = 0; y < 3; y++) {
            for (let x = 0; x < 3; x++) {
                const recipeItem = recipe.pattern[y][x];
                const gridItem = currentGrid[y * 3 + x];
                
                if (recipeItem === null && gridItem !== null) return false;
                if (recipeItem !== null && gridItem === null) return false;
                if (recipeItem !== null && gridItem !== null && recipeItem !== gridItem.itemId) return false;
            }
        }
        return true;
    };

    const handleGridClick = (index: number, cursorItem: ItemStack | null, setCursorItem: (item: ItemStack | null) => void) => {
        const currentSlot = grid[index];

        if (!cursorItem) {
            // Pick up
            if (currentSlot) {
                setCursorItem(currentSlot);
                const newGrid = [...grid];
                newGrid[index] = null;
                setGrid(newGrid);
            }
        } else {
            // Place
            if (!currentSlot) {
                // Place one
                const newGrid = [...grid];
                newGrid[index] = { itemId: cursorItem.itemId, count: 1 };
                setGrid(newGrid);
                
                if (cursorItem.count > 1) {
                    setCursorItem({ ...cursorItem, count: cursorItem.count - 1 });
                } else {
                    setCursorItem(null);
                }
            } else if (currentSlot.itemId === cursorItem.itemId) {
                // Add one
                const itemDef = Items[currentSlot.itemId];
                if (currentSlot.count < itemDef.maxStack) {
                    const newGrid = [...grid];
                    newGrid[index] = { ...currentSlot, count: currentSlot.count + 1 };
                    setGrid(newGrid);
                    
                    if (cursorItem.count > 1) {
                        setCursorItem({ ...cursorItem, count: cursorItem.count - 1 });
                    } else {
                        setCursorItem(null);
                    }
                }
            } else {
                // Swap
                setCursorItem(currentSlot);
                const newGrid = [...grid];
                newGrid[index] = cursorItem;
                setGrid(newGrid);
            }
        }
    };

    const handleCraftClick = (cursorItem: ItemStack | null, setCursorItem: (item: ItemStack | null) => void) => {
        if (!result) return;

        // Check if cursor can hold result
        if (cursorItem && (cursorItem.itemId !== result.itemId || cursorItem.count + result.count > Items[result.itemId].maxStack)) {
            return; // Cannot craft, cursor full or different item
        }

        // Consume ingredients
        const newGrid = [...grid];
        for (let i = 0; i < 9; i++) {
            if (newGrid[i]) {
                newGrid[i]!.count -= 1;
                if (newGrid[i]!.count <= 0) newGrid[i] = null;
            }
        }
        setGrid(newGrid);

        // Give result to cursor
        if (cursorItem) {
            setCursorItem({ ...cursorItem, count: cursorItem.count + result.count });
        } else {
            setCursorItem({ ...result });
        }
        
        onCraft();
    };

    // We need to access the parent's cursor state. 
    // For simplicity in this single-file structure, we'll pass a custom event or use a shared context.
    // Since we can't easily pass state up without prop drilling, we'll assume the parent passes down the cursor state and setter.
    return null; // Implementation moved to GameUI to share cursor state easily
};
