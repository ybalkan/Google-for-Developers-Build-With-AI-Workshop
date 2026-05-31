// Simple seeded PRNG (Mulberry32)
export function mulberry32(a: number) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

// Very basic 1D noise for terrain height
export class Simple1DNoise {
    private seed: number;
    private random: () => number;
    private memory: Map<number, number> = new Map();

    constructor(seed: number = Math.random() * 10000) {
        this.seed = seed;
        this.random = mulberry32(seed);
    }

    private getVal(x: number): number {
        if (!this.memory.has(x)) {
            this.memory.set(x, this.random());
        }
        return this.memory.get(x)!;
    }

    // Cosine interpolation
    private interpolate(a: number, b: number, x: number): number {
        const ft = x * Math.PI;
        const f = (1 - Math.cos(ft)) * 0.5;
        return a * (1 - f) + b * f;
    }

    public get(x: number, scale: number = 1): number {
        const scaledX = x / scale;
        const intX = Math.floor(scaledX);
        const fracX = scaledX - intX;

        const v1 = this.getVal(intX);
        const v2 = this.getVal(intX + 1);

        return this.interpolate(v1, v2, fracX);
    }
}

export function checkAABB(rect1: {x: number, y: number, w: number, h: number}, rect2: {x: number, y: number, w: number, h: number}) {
    return (
        rect1.x < rect2.x + rect2.w &&
        rect1.x + rect1.w > rect2.x &&
        rect1.y < rect2.y + rect2.h &&
        rect1.y + rect1.h > rect2.y
    );
}
