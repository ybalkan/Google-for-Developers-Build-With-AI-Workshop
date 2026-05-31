import React from 'react';
import { ItemStack } from '../types';
import { Items } from '../game/Registry';

interface SlotProps {
    item: ItemStack | null;
    isActive?: boolean;
    onClick?: (e: React.MouseEvent) => void;
    onContextMenu?: (e: React.MouseEvent) => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
}

export const Slot: React.FC<SlotProps> = ({ item, isActive, onClick, onContextMenu, onMouseEnter, onMouseLeave }) => {
    const itemDef = item ? Items[item.itemId] : null;

    return (
        <div 
            className={`w-12 h-12 bg-gray-800 border-2 flex items-center justify-center relative select-none cursor-pointer
                ${isActive ? 'border-white' : 'border-gray-600'} hover:bg-gray-700`}
            onClick={onClick}
            onContextMenu={(e) => { e.preventDefault(); if(onContextMenu) onContextMenu(e); }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            {itemDef && (
                <>
                    <span className="text-2xl">{itemDef.icon}</span>
                    {item!.count > 1 && (
                        <span className="absolute bottom-0 right-1 text-white text-xs font-bold" style={{ textShadow: '1px 1px 0 #000' }}>
                            {item!.count}
                        </span>
                    )}
                </>
            )}
        </div>
    );
};
