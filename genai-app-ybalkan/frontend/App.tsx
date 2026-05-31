import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/Engine';
import { GameUI } from './components/GameUI';

export default function App() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [engine, setEngine] = useState<GameEngine | null>(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        
        // Handle resize
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        // Initialize engine
        const gameEngine = new GameEngine(canvas);
        setEngine(gameEngine);
        gameEngine.start();

        return () => {
            window.removeEventListener('resize', resize);
            gameEngine.stop();
        };
    }, []);

    return (
        <div className="w-screen h-screen overflow-hidden bg-black relative">
            <canvas 
                ref={canvasRef} 
                className="block w-full h-full"
                onContextMenu={(e) => e.preventDefault()}
            />
            {engine && <GameUI engine={engine} />}
        </div>
    );
}
