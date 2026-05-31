import React, { useState, useEffect, useCallback } from 'react';
import { GameEngine } from '../game/Engine';
import { INVENTORY_SIZE, HOTBAR_SIZE } from '../constants';
import { ItemStack } from '../types';
import { Items, Recipes } from '../game/Registry';
import { Slot } from './Slot';

interface GameUIProps {
    engine: GameEngine;
}

export const GameUI: React.FC<GameUIProps> = ({ engine }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inventoryState, setInventoryState] = useState<(ItemStack | null)[]>([]);
    const [activeSlot, setActiveSlot] = useState(0);
    
    // Drag and drop state
    const [cursorItem, setCursorItem] = useState<ItemStack | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);

    // Crafting state
    const [craftGrid, setCraftGrid] = useState<(ItemStack | null)[]>(new Array(9).fill(null));
    const [craftResult, setCraftResult] = useState<ItemStack | null>(null);

    const updateState = useCallback(() => {
        setInventoryState([...engine.inventory.slots]);
        setActiveSlot(engine.selectedHotbarSlot);
    }, [engine]);

    useEffect(() => {
        engine.onInventoryChange = updateState;
        updateState();

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'KeyE') {
                setIsOpen(prev => !prev);
            }
            if (e.code === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, [engine, updateState, isOpen]);

    // Crafting logic
    useEffect(() => {
        let foundResult: ItemStack | null = null;
        for (const recipe of Recipes) {
            let match = true;
            for (let y = 0; y < 3; y++) {
                for (let x = 0; x < 3; x++) {
                    const recipeItem = recipe.pattern[y][x];
                    const gridItem = craftGrid[y * 3 + x];
                    if (recipeItem === null && gridItem !== null) match = false;
                    if (recipeItem !== null && gridItem === null) match = false;
                    if (recipeItem !== null && gridItem !== null && recipeItem !== gridItem.itemId) match = false;
                }
            }
            if (match) {
                foundResult = recipe.result;
                break;
            }
        }
        setCraftResult(foundResult);
    }, [craftGrid]);

    // Handle closing inventory with item in cursor
    useEffect(() => {
        if (!isOpen && cursorItem) {
            // Try to put back in inventory
            const leftover = engine.inventory.addItem(cursorItem.itemId, cursorItem.count);
            if (leftover > 0) {
                // Drop in world (not implemented, just destroy for now)
                console.log("Dropped", leftover, cursorItem.itemId);
            }
            setCursorItem(null);
            
            // Return crafting items to inventory
            const newGrid = [...craftGrid];
            for (let i = 0; i < 9; i++) {
                if (newGrid[i]) {
                    engine.inventory.addItem(newGrid[i]!.itemId, newGrid[i]!.count);
                    newGrid[i] = null;
                }
            }
            setCraftGrid(newGrid);
        }
    }, [isOpen]);

    const handleSlotClick = (index: number, isRightClick: boolean) => {
        const clickedItem = engine.inventory.getSlot(index);

        if (!cursorItem) {
            if (clickedItem) {
                if (isRightClick) {
                    // Take half
                    const half = Math.ceil(clickedItem.count / 2);
                    setCursorItem({ itemId: clickedItem.itemId, count: half });
                    if (clickedItem.count - half === 0) {
                        engine.inventory.setSlot(index, null);
                    } else {
                        engine.inventory.setSlot(index, { ...clickedItem, count: clickedItem.count - half });
                    }
                } else {
                    // Take all
                    setCursorItem(clickedItem);
                    engine.inventory.setSlot(index, null);
                }
            }
        } else {
            if (!clickedItem) {
                if (isRightClick) {
                    // Place one
                    engine.inventory.setSlot(index, { itemId: cursorItem.itemId, count: 1 });
                    if (cursorItem.count > 1) {
                        setCursorItem({ ...cursorItem, count: cursorItem.count - 1 });
                    } else {
                        setCursorItem(null);
                    }
                } else {
                    // Place all
                    engine.inventory.setSlot(index, cursorItem);
                    setCursorItem(null);
                }
            } else if (clickedItem.itemId === cursorItem.itemId) {
                const itemDef = Items[clickedItem.itemId];
                if (isRightClick) {
                    // Add one
                    if (clickedItem.count < itemDef.maxStack) {
                        engine.inventory.setSlot(index, { ...clickedItem, count: clickedItem.count + 1 });
                        if (cursorItem.count > 1) {
                            setCursorItem({ ...cursorItem, count: cursorItem.count - 1 });
                        } else {
                            setCursorItem(null);
                        }
                    }
                } else {
                    // Add all possible
                    const space = itemDef.maxStack - clickedItem.count;
                    const toAdd = Math.min(space, cursorItem.count);
                    if (toAdd > 0) {
                        engine.inventory.setSlot(index, { ...clickedItem, count: clickedItem.count + toAdd });
                        if (cursorItem.count - toAdd === 0) {
                            setCursorItem(null);
                        } else {
                            setCursorItem({ ...cursorItem, count: cursorItem.count - toAdd });
                        }
                    }
                }
            } else {
                // Swap
                engine.inventory.setSlot(index, cursorItem);
                setCursorItem(clickedItem);
            }
        }
    };

    const handleCraftGridClick = (index: number, isRightClick: boolean) => {
        const currentSlot = craftGrid[index];
        const newGrid = [...craftGrid];

        if (!cursorItem) {
            if (currentSlot) {
                if (isRightClick) {
                    const half = Math.ceil(currentSlot.count / 2);
                    setCursorItem({ itemId: currentSlot.itemId, count: half });
                    if (currentSlot.count - half === 0) newGrid[index] = null;
                    else newGrid[index] = { ...currentSlot, count: currentSlot.count - half };
                } else {
                    setCursorItem(currentSlot);
                    newGrid[index] = null;
                }
            }
        } else {
            if (!currentSlot) {
                if (isRightClick) {
                    newGrid[index] = { itemId: cursorItem.itemId, count: 1 };
                    if (cursorItem.count > 1) setCursorItem({ ...cursorItem, count: cursorItem.count - 1 });
                    else setCursorItem(null);
                } else {
                    newGrid[index] = cursorItem;
                    setCursorItem(null);
                }
            } else if (currentSlot.itemId === cursorItem.itemId) {
                const itemDef = Items[currentSlot.itemId];
                if (isRightClick) {
                    if (currentSlot.count < itemDef.maxStack) {
                        newGrid[index] = { ...currentSlot, count: currentSlot.count + 1 };
                        if (cursorItem.count > 1) setCursorItem({ ...cursorItem, count: cursorItem.count - 1 });
                        else setCursorItem(null);
                    }
                } else {
                    const space = itemDef.maxStack - currentSlot.count;
                    const toAdd = Math.min(space, cursorItem.count);
                    if (toAdd > 0) {
                        newGrid[index] = { ...currentSlot, count: currentSlot.count + toAdd };
                        if (cursorItem.count - toAdd === 0) setCursorItem(null);
                        else setCursorItem({ ...cursorItem, count: cursorItem.count - toAdd });
                    }
                }
            } else {
                newGrid[index] = cursorItem;
                setCursorItem(currentSlot);
            }
        }
        setCraftGrid(newGrid);
    };

    const handleCraftResultClick = () => {
        if (!craftResult) return;

        if (cursorItem && (cursorItem.itemId !== craftResult.itemId || cursorItem.count + craftResult.count > Items[craftResult.itemId].maxStack)) {
            return;
        }

        // Consume
        const newGrid = [...craftGrid];
        for (let i = 0; i < 9; i++) {
            if (newGrid[i]) {
                newGrid[i]!.count -= 1;
                if (newGrid[i]!.count <= 0) newGrid[i] = null;
            }
        }
        setCraftGrid(newGrid);

        // Give
        if (cursorItem) {
            setCursorItem({ ...cursorItem, count: cursorItem.count + craftResult.count });
        } else {
            setCursorItem({ ...craftResult });
        }
    };

    return (
        <div className="absolute inset-0 pointer-events-none">
            {/* Hotbar */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-1 bg-gray-900/80 p-2 rounded pointer-events-auto">
                {inventoryState.slice(0, HOTBAR_SIZE).map((item, i) => (
                    <Slot 
                        key={`hotbar-${i}`} 
                        item={item} 
                        isActive={i === activeSlot}
                        onClick={() => {
                            if (isOpen) handleSlotClick(i, false);
                            else {
                                engine.selectedHotbarSlot = i;
                                updateState();
                            }
                        }}
                        onContextMenu={(e) => { if(isOpen) handleSlotClick(i, true); }}
                        onMouseEnter={() => item && setHoveredItem(item.itemId)}
                        onMouseLeave={() => setHoveredItem(null)}
                    />
                ))}
            </div>

            {/* Full Inventory & Crafting */}
            {isOpen && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center pointer-events-auto">
                    <div className="bg-gray-800 p-6 rounded-lg shadow-2xl border border-gray-700 flex gap-8">
                        
                        {/* Inventory Grid */}
                        <div>
                            <h2 className="text-white mb-2 font-bold">Inventory</h2>
                            <div className="grid grid-cols-9 gap-1 mb-4">
                                {inventoryState.slice(HOTBAR_SIZE).map((item, i) => (
                                    <Slot 
                                        key={`inv-${i + HOTBAR_SIZE}`} 
                                        item={item} 
                                        onClick={() => handleSlotClick(i + HOTBAR_SIZE, false)}
                                        onContextMenu={() => handleSlotClick(i + HOTBAR_SIZE, true)}
                                        onMouseEnter={() => item && setHoveredItem(item.itemId)}
                                        onMouseLeave={() => setHoveredItem(null)}
                                    />
                                ))}
                            </div>
                            <h2 className="text-white mb-2 font-bold">Hotbar</h2>
                            <div className="grid grid-cols-9 gap-1">
                                {inventoryState.slice(0, HOTBAR_SIZE).map((item, i) => (
                                    <Slot 
                                        key={`inv-hotbar-${i}`} 
                                        item={item} 
                                        onClick={() => handleSlotClick(i, false)}
                                        onContextMenu={() => handleSlotClick(i, true)}
                                        onMouseEnter={() => item && setHoveredItem(item.itemId)}
                                        onMouseLeave={() => setHoveredItem(null)}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Crafting Area */}
                        <div className="flex flex-col items-center">
                            <h2 className="text-white mb-2 font-bold">Crafting</h2>
                            <div className="flex items-center gap-4">
                                <div className="grid grid-cols-3 gap-1 bg-gray-900 p-2 rounded">
                                    {craftGrid.map((item, i) => (
                                        <Slot 
                                            key={`craft-${i}`} 
                                            item={item} 
                                            onClick={() => handleCraftGridClick(i, false)}
                                            onContextMenu={() => handleCraftGridClick(i, true)}
                                            onMouseEnter={() => item && setHoveredItem(item.itemId)}
                                            onMouseLeave={() => setHoveredItem(null)}
                                        />
                                    ))}
                                </div>
                                <div className="text-white text-2xl">➔</div>
                                <div className="bg-gray-900 p-2 rounded">
                                    <Slot 
                                        item={craftResult} 
                                        onClick={handleCraftResultClick}
                                        onMouseEnter={() => craftResult && setHoveredItem(craftResult.itemId)}
                                        onMouseLeave={() => setHoveredItem(null)}
                                    />
                                </div>
                            </div>
                            
                            {/* Recipe Hint */}
                            <div className="mt-8 text-gray-400 text-sm max-w-[200px]">
                                <p className="mb-1 font-bold text-gray-300">Basic Recipes:</p>
                                <ul className="list-disc pl-4">
                                    <li>1 Wood ➔ 4 Planks</li>
                                    <li>2 Planks (vertical) ➔ 4 Sticks</li>
                                    <li>3 Planks (top) + 2 Sticks (mid) ➔ Wooden Pickaxe</li>
                                </ul>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* Tooltip */}
            {hoveredItem && !cursorItem && (
                <div 
                    className="absolute bg-black/90 text-white px-2 py-1 rounded text-sm pointer-events-none z-50 border border-gray-600"
                    style={{ left: mousePos.x + 15, top: mousePos.y + 15 }}
                >
                    {Items[hoveredItem]?.name}
                </div>
            )}

            {/* Cursor Item (Drag & Drop) */}
            {cursorItem && (
                <div 
                    className="absolute pointer-events-none z-50"
                    style={{ left: mousePos.x - 24, top: mousePos.y - 24 }}
                >
                    <div className="w-12 h-12 flex items-center justify-center relative">
                        <span className="text-2xl">{Items[cursorItem.itemId]?.icon}</span>
                        {cursorItem.count > 1 && (
                            <span className="absolute bottom-0 right-1 text-white text-xs font-bold" style={{ textShadow: '1px 1px 0 #000' }}>
                                {cursorItem.count}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Controls Hint */}
            {!isOpen && (
                <div className="absolute top-4 left-4 text-white/70 text-sm bg-black/30 p-2 rounded pointer-events-none">
                    <p>WASD / Arrows: Move & Jump</p>
                    <p>Left Click: Mine</p>
                    <p>Right Click: Place</p>
                    <p>1-9: Select Hotbar</p>
                    <p>E: Open Inventory/Crafting</p>
                </div>
            )}
        </div>
    );
};
