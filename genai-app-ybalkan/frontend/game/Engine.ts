import { World } from './World';
import { Player } from './Player';
import { Inventory } from './Inventory';
import { TILE_SIZE, REACH_DISTANCE, HOTBAR_SIZE } from '../constants';
import { Blocks, Items, getDropForItem } from './Registry';
import { BlockType } from '../types';

export class GameEngine {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    public world: World;
    public player: Player;
    public inventory: Inventory;
    
    private lastTime: number = 0;
    private animationFrameId: number = 0;
    
    // Input state
    private keys: Set<string> = new Set();
    private mousePos = { x: 0, y: 0 };
    private isMouseDown = false;
    private mouseButton = 0; // 0: left, 2: right

    // Game state
    public selectedHotbarSlot: number = 0;
    private timeOfDay: number = 0; // 0 to 24000
    
    // Callbacks
    public onInventoryChange?: () => void;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Could not get 2D context");
        this.ctx = ctx;

        this.world = new World(Math.random() * 10000);
        // Spawn player high up to fall to surface
        this.player = new Player(0, 0); 
        this.inventory = new Inventory();
        
        this.inventory.setUpdateCallback(() => {
            if (this.onInventoryChange) this.onInventoryChange();
        });

        // Give starting items
        this.inventory.addItem('wooden_pickaxe', 1);
        this.inventory.addItem('wood', 16);

        this.setupInputs();
    }

    public start() {
        this.lastTime = performance.now();
        this.loop(this.lastTime);
    }

    public stop() {
        cancelAnimationFrame(this.animationFrameId);
        this.cleanupInputs();
    }

    private setupInputs() {
        const handleKeyDown = (e: KeyboardEvent) => {
            this.keys.add(e.code);
            // Hotbar selection
            if (e.code.startsWith('Digit')) {
                const num = parseInt(e.code.replace('Digit', ''));
                if (num >= 1 && num <= 9) {
                    this.selectedHotbarSlot = num - 1;
                    if (this.onInventoryChange) this.onInventoryChange(); // Trigger UI update
                }
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => this.keys.delete(e.code);
        
        const handleMouseMove = (e: MouseEvent) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mousePos.x = e.clientX - rect.left;
            this.mousePos.y = e.clientY - rect.top;
        };

        const handleMouseDown = (e: MouseEvent) => {
            this.isMouseDown = true;
            this.mouseButton = e.button;
            this.handleMouseAction();
        };

        const handleMouseUp = () => {
            this.isMouseDown = false;
        };

        const handleContextMenu = (e: Event) => e.preventDefault();

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        this.canvas.addEventListener('mousemove', handleMouseMove);
        this.canvas.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);
        this.canvas.addEventListener('contextmenu', handleContextMenu);

        // Store for cleanup
        (this as any)._cleanup = () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            this.canvas.removeEventListener('mousemove', handleMouseMove);
            this.canvas.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
            this.canvas.removeEventListener('contextmenu', handleContextMenu);
        };
    }

    private cleanupInputs() {
        if ((this as any)._cleanup) (this as any)._cleanup();
    }

    private getCameraOffset() {
        return {
            x: this.player.pos.x - this.canvas.width / 2,
            y: this.player.pos.y - this.canvas.height / 2
        };
    }

    private handleMouseAction() {
        const cam = this.getCameraOffset();
        const worldX = this.mousePos.x + cam.x;
        const worldY = this.mousePos.y + cam.y;
        
        const blockX = Math.floor(worldX / TILE_SIZE);
        const blockY = Math.floor(worldY / TILE_SIZE);

        // Check reach
        const dx = worldX - this.player.pos.x;
        const dy = worldY - (this.player.pos.y - this.player.height/2);
        if (Math.sqrt(dx*dx + dy*dy) > REACH_DISTANCE) return;

        if (this.mouseButton === 0) { // Left click: Mine
            const targetBlock = this.world.getBlock(blockX, blockY);
            if (targetBlock !== BlockType.AIR && targetBlock !== BlockType.BEDROCK) {
                this.world.setBlock(blockX, blockY, BlockType.AIR);
                const drop = getDropForItem(targetBlock);
                if (drop) {
                    this.inventory.addItem(drop, 1);
                }
            }
        } else if (this.mouseButton === 2) { // Right click: Place
            const targetBlock = this.world.getBlock(blockX, blockY);
            if (targetBlock === BlockType.AIR) {
                const activeItem = this.inventory.getSlot(this.selectedHotbarSlot);
                if (activeItem) {
                    const itemDef = Items[activeItem.itemId];
                    if (itemDef && itemDef.blockType !== undefined) {
                        // Check if placing inside player
                        const blockRect = { x: blockX * TILE_SIZE, y: blockY * TILE_SIZE, w: TILE_SIZE, h: TILE_SIZE };
                        if (!checkAABB(this.player.getRect(), blockRect)) {
                            this.world.setBlock(blockX, blockY, itemDef.blockType);
                            this.inventory.removeItem(this.selectedHotbarSlot, 1);
                        }
                    }
                }
            }
        }
    }

    private loop = (time: number) => {
        const dt = Math.min((time - this.lastTime) / 1000, 0.1); // Cap dt to prevent huge jumps
        this.lastTime = time;

        this.update(dt);
        this.render();

        this.animationFrameId = requestAnimationFrame(this.loop);
    }

    private update(dt: number) {
        // Time of day
        this.timeOfDay = (this.timeOfDay + dt * 50) % 24000;

        const input = {
            left: this.keys.has('KeyA') || this.keys.has('ArrowLeft'),
            right: this.keys.has('KeyD') || this.keys.has('ArrowRight'),
            jump: this.keys.has('Space') || this.keys.has('KeyW') || this.keys.has('ArrowUp')
        };

        this.player.update(dt, input, this.world);

        // Continuous mining/placing if holding mouse
        if (this.isMouseDown) {
            // Add a small delay or cooldown for continuous action in a real game
            // For simplicity, we just call it every frame, which is very fast
            // this.handleMouseAction(); 
        }
    }

    private render() {
        const { ctx, canvas } = this;
        const cam = this.getCameraOffset();

        // Clear & Sky
        // Calculate sky color based on time of day (0 = midnight, 12000 = noon)
        let skyColor = '#87CEEB'; // Day
        if (this.timeOfDay < 6000 || this.timeOfDay > 18000) {
            skyColor = '#0B1D3A'; // Night
        } else if (this.timeOfDay < 8000 || this.timeOfDay > 16000) {
            skyColor = '#FF7F50'; // Sunrise/Sunset
        }
        
        ctx.fillStyle = skyColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Determine visible area
        const startCol = Math.floor(cam.x / TILE_SIZE);
        const endCol = startCol + Math.ceil(canvas.width / TILE_SIZE) + 1;
        const startRow = Math.floor(cam.y / TILE_SIZE);
        const endRow = startRow + Math.ceil(canvas.height / TILE_SIZE) + 1;

        // Draw Blocks
        for (let y = startRow; y <= endRow; y++) {
            for (let x = startCol; x <= endCol; x++) {
                const blockType = this.world.getBlock(x, y);
                if (blockType !== BlockType.AIR) {
                    const blockDef = Blocks[blockType];
                    ctx.fillStyle = blockDef.color;
                    ctx.fillRect(
                        Math.floor(x * TILE_SIZE - cam.x),
                        Math.floor(y * TILE_SIZE - cam.y),
                        TILE_SIZE,
                        TILE_SIZE
                    );
                    
                    // Simple block border
                    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(
                        Math.floor(x * TILE_SIZE - cam.x),
                        Math.floor(y * TILE_SIZE - cam.y),
                        TILE_SIZE,
                        TILE_SIZE
                    );
                }
            }
        }

        // Draw Player
        const pRect = this.player.getRect();
        ctx.fillStyle = '#E57373'; // Player color
        ctx.fillRect(
            Math.floor(pRect.x - cam.x),
            Math.floor(pRect.y - cam.y),
            pRect.w,
            pRect.h
        );
        
        // Draw eyes to show facing direction
        ctx.fillStyle = 'white';
        const eyeX = this.player.facingRight ? pRect.x + pRect.w - 8 : pRect.x + 4;
        ctx.fillRect(Math.floor(eyeX - cam.x), Math.floor(pRect.y + 4 - cam.y), 4, 4);

        // Draw block highlight
        const worldX = this.mousePos.x + cam.x;
        const worldY = this.mousePos.y + cam.y;
        const blockX = Math.floor(worldX / TILE_SIZE);
        const blockY = Math.floor(worldY / TILE_SIZE);
        
        const dx = worldX - this.player.pos.x;
        const dy = worldY - (this.player.pos.y - this.player.height/2);
        if (Math.sqrt(dx*dx + dy*dy) <= REACH_DISTANCE) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.strokeRect(
                Math.floor(blockX * TILE_SIZE - cam.x),
                Math.floor(blockY * TILE_SIZE - cam.y),
                TILE_SIZE,
                TILE_SIZE
            );
        }

        // Night overlay
        if (this.timeOfDay < 6000 || this.timeOfDay > 18000) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }
}
