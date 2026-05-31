import { ItemStack } from '../types';
import { INVENTORY_SIZE } from '../constants';
import { Items } from './Registry';

export class Inventory {
    public slots: (ItemStack | null)[];
    private updateCallback?: () => void;

    constructor(size: number = INVENTORY_SIZE) {
        this.slots = new Array(size).fill(null);
    }

    setUpdateCallback(cb: () => void) {
        this.updateCallback = cb;
    }

    private notify() {
        if (this.updateCallback) this.updateCallback();
    }

    addItem(itemId: string, count: number = 1): number {
        const itemDef = Items[itemId];
        if (!itemDef) return count;

        let remaining = count;

        // Try to add to existing stacks
        for (let i = 0; i < this.slots.length; i++) {
            const slot = this.slots[i];
            if (slot && slot.itemId === itemId) {
                const space = itemDef.maxStack - slot.count;
                if (space > 0) {
                    const toAdd = Math.min(space, remaining);
                    slot.count += toAdd;
                    remaining -= toAdd;
                    if (remaining <= 0) {
                        this.notify();
                        return 0;
                    }
                }
            }
        }

        // Try to find empty slots
        for (let i = 0; i < this.slots.length; i++) {
            if (this.slots[i] === null) {
                const toAdd = Math.min(itemDef.maxStack, remaining);
                this.slots[i] = { itemId, count: toAdd };
                remaining -= toAdd;
                if (remaining <= 0) {
                    this.notify();
                    return 0;
                }
            }
        }

        this.notify();
        return remaining; // Return amount that couldn't fit
    }

    removeItem(slotIndex: number, count: number = 1): ItemStack | null {
        const slot = this.slots[slotIndex];
        if (!slot) return null;

        if (slot.count <= count) {
            const removed = { ...slot };
            this.slots[slotIndex] = null;
            this.notify();
            return removed;
        } else {
            slot.count -= count;
            this.notify();
            return { itemId: slot.itemId, count };
        }
    }

    setSlot(index: number, item: ItemStack | null) {
        if (index >= 0 && index < this.slots.length) {
            this.slots[index] = item;
            this.notify();
        }
    }

    getSlot(index: number): ItemStack | null {
        if (index >= 0 && index < this.slots.length) {
            return this.slots[index];
        }
        return null;
    }
}
