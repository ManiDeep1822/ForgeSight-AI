import React, { useMemo, memo } from 'react';
import { Activity, ShieldAlert, DollarSign, Database, Box } from 'lucide-react';
import { motion } from 'framer-motion';

export const DashboardHeader = memo(({ machines = [] }) => {
    const stats = useMemo(() => {
        if (!machines.length) return { avgHealth: 100, criticalCount: 0, totalRisk: 0 };
        const vals = Object.values(machines);
        const avgHealth = vals.reduce((acc, m) => acc + (m.healthIndex || 98), 0) / vals.length;
        const criticalCount = vals.filter(m => (m.healthIndex || 98) < 50).length;
        const totalRisk = vals.reduce((acc, m) => acc + (m.cost || 0), 0);
        return { avgHealth, criticalCount, totalRisk };
    }, [machines]);

    const items = [
        { label: 'FLEET INTEGRATION', value: `${stats.avgHealth.toFixed(1)}%`, sub: 'STABLE OPERATIONAL BAND', icon: Activity, color: 'text-blue-500' },
        { label: 'FINANCIAL RISK', value: `$${stats.totalRisk.toLocaleString()}`, sub: 'DAMAGE ESTIMATION', icon: DollarSign, color: 'text-amber-500' },
        { label: 'CRITICAL QUEUE', value: stats.criticalCount, sub: 'PENDING INTERVENTIONS', icon: ShieldAlert, color: 'text-rose-500' },
        { label: 'AI INFERENCE', value: '43-DIM', sub: 'MODEL_LSTMA_64', icon: Database, color: 'text-indigo-400' }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 mt-4">
            {items.map((item, idx) => (
                <motion.div 
                    key={item.label}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="tactical-border bg-background-panel rounded-2xl p-6 relative overflow-hidden group hover:border-blue-500/30 transition-all duration-500"
                >
                    <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:scale-125 transition-transform duration-700">
                        <item.icon className="w-48 h-48" />
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                        <item.icon className={`w-4 h-4 ${item.color}`} />
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{item.label}</span>
                    </div>
                    <div className="text-4xl font-black text-white tracking-tighter leading-none">{item.value}</div>
                    <p className="text-[10px] text-slate-600 font-bold mt-2 uppercase tracking-tighter italic">{item.sub}</p>
                    
                    {/* Visual pulse indicator for critical machines */}
                    {item.label === 'CRITICAL QUEUE' && stats.criticalCount > 0 && (
                        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse" />
                    )}
                </motion.div>
            ))}
        </div>
    );
});
