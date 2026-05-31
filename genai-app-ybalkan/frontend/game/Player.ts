import { Vector2, Rect } from '../types';
import { TILE_SIZE, GRAVITY, JUMP_FORCE, MOVE_SPEED, MAX_FALL_SPEED } from '../constants';
import { World } from './World';
import { Blocks } from './Registry';
import { checkAABB } from '../utils/math';

export class Player {
    public pos: Vector2;
    public vel: Vector2;
    public width: number = TILE_SIZE * 0.8;
    public height: number = TILE_SIZE * 1.8;
    public isGrounded: boolean = false;
    public facingRight: boolean = true;

    constructor(x: number, y: number) {
        this.pos = { x, y };
        this.vel = { x: 0, y: 0 };
    }

    getRect(): Rect {
        return {
            x: this.pos.x - this.width / 2,
            y: this.pos.y - this.height,
            w: this.width,
            h: this.height
        };
    }

    update(dt: number, input: { left: boolean, right: boolean, jump: boolean }, world: World) {
        // Horizontal movement
        if (input.left) {
            this.vel.x = -MOVE_SPEED;
            this.facingRight = false;
        } else if (input.right) {
            this.vel.x = MOVE_SPEED;
            this.facingRight = true;
        } else {
            this.vel.x = 0;
        }

        // Jumping
        if (input.jump && this.isGrounded) {
            this.vel.y = -JUMP_FORCE;
            this.isGrounded = false;
        }

        // Gravity
        this.vel.y += GRAVITY * dt;
        if (this.vel.y > MAX_FALL_SPEED) this.vel.y = MAX_FALL_SPEED;

        // Apply X movement and resolve collisions
        this.pos.x += this.vel.x * dt;
        this.resolveCollisions(world, true);

        // Apply Y movement and resolve collisions
        this.pos.y += this.vel.y * dt;
        this.isGrounded = false;
        this.resolveCollisions(world, false);
    }

    private resolveCollisions(world: World, horizontal: boolean) {
        const rect = this.getRect();
        
        // Determine which blocks to check based on player bounds
        const minX = Math.floor(rect.x / TILE_SIZE);
        const maxX = Math.floor((rect.x + rect.w) / TILE_SIZE);
        const minY = Math.floor(rect.y / TILE_SIZE);
        const maxY = Math.floor((rect.y + rect.h) / TILE_SIZE);

        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                const blockType = world.getBlock(x, y);
                if (Blocks[blockType].solid) {
                    const blockRect = { x: x * TILE_SIZE, y: y * TILE_SIZE, w: TILE_SIZE, h: TILE_SIZE };
                    
                    if (checkAABB(rect, blockRect)) {
                        if (horizontal) {
                            if (this.vel.x > 0) { // Moving right
                                this.pos.x = blockRect.x - this.width / 2;
                            } else if (this.vel.x < 0) { // Moving left
                                this.pos.x = blockRect.x + blockRect.w + this.width / 2;
                            }
                            this.vel.x = 0;
                        } else {
                            if (this.vel.y > 0) { // Falling
                                this.pos.y = blockRect.y;
                                this.isGrounded = true;
                            } else if (this.vel.y < 0) { // Jumping up into block
                                this.pos.y = blockRect.y + blockRect.h + this.height;
                            }
                            this.vel.y = 0;
                        }
                        // Update rect for next checks
                        Object.assign(rect, this.getRect());
                    }
                }
            }
        }
    }
}
