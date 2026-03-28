import React, { useState, useEffect, memo } from 'react';
import { Cpu, Zap, Activity } from 'lucide-react';

export const PerformanceOverlay = memo(() => {
    const [fps, setFps] = useState(60);
    const [latency, setLatency] = useState(42);

    useEffect(() => {
        let lastTime = performance.now();
        let frames = 0;
        
        const update = () => {
            const now = performance.now();
            frames++;
            if (now >= lastTime + 1000) {
                setFps(Math.round((frames * 1000) / (now - lastTime)));
                setLatency(Math.round(20 + Math.random() * 30)); // Simulated API latency
                frames = 0;
                lastTime = now;
            }
            requestAnimationFrame(update);
        };
        
        const raf = requestAnimationFrame(update);
        return () => cancelAnimationFrame(raf);
    }, []);

    return (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-4 px-4 py-2 bg-background-panel/60 backdrop-blur-xl border border-white/5 rounded-xl pointer-events-none">
            <div className="flex items-center gap-2">
                <Activity className="w-3 h-3 text-blue-500" />
                <span className="text-[9px] font-mono text-slate-500 uppercase">Latency:</span>
                <span className="text-[10px] font-mono font-black text-white">{latency}ms</span>
            </div>
            <div className="w-px h-3 bg-white/10" />
            <div className="flex items-center gap-2">
                <Zap className="w-3 h-3 text-amber-500" />
                <span className="text-[9px] font-mono text-slate-500 uppercase">Engine:</span>
                <span className={`text-[10px] font-mono font-black ${fps > 55 ? 'text-emerald-400' : 'text-rose-400'}`}>{fps}FPS</span>
            </div>
        </div>
    );
});
