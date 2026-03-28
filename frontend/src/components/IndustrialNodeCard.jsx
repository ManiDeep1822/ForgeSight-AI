import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, ChevronRight, Activity, Zap } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

const IndustrialNodeCard = ({ machine, onSelect }) => {
  const { id, name, healthIndex, status, anomalyScore, chartData } = machine;
  
  const isHealthy = healthIndex >= 80;
  const isWarning = healthIndex >= 50 && healthIndex < 80;
  const statusColor = isHealthy ? 'text-emerald-400' : isWarning ? 'text-amber-400' : 'text-rose-500';
  const borderColor = isHealthy ? 'border-emerald-500/20' : isWarning ? 'border-amber-500/20' : 'border-rose-500/30';
  const shadowColor = isHealthy ? 'shadow-emerald-500/5' : isWarning ? 'shadow-amber-500/5' : 'shadow-rose-500/10';

  return (
    <motion.button
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(id)}
      className={`relative group flex flex-col p-6 bg-slate-900/40 backdrop-blur-3xl border ${borderColor} rounded-[2.5rem] text-left transition-all hover:bg-slate-900/60 shadow-2xl ${shadowColor} overflow-hidden`}
    >
      {/* Background Accent */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/5 to-transparent pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity`} />
      
      {/* Header */}
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="flex flex-col">
          <h3 className="text-2xl font-black text-white tracking-widest leading-none mb-2">{id}</h3>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">UNIT_KERNEL_v1.0</span>
        </div>
        <div className={`px-4 py-1.5 bg-black/40 border ${borderColor} rounded-xl text-[9px] font-black uppercase tracking-widest ${statusColor}`}>
          {status}
        </div>
      </div>

      {/* Health Metric & Sparkline */}
      <div className="flex items-end justify-between mb-6 relative z-10 gap-4">
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">HEALTH_RELIABILITY</span>
          <div className="flex items-baseline gap-2">
            <span className={`text-5xl font-black font-mono tracking-tighter ${statusColor}`}>{healthIndex.toFixed(0)}</span>
            <span className="text-sm font-black text-slate-700">%</span>
          </div>
        </div>
        
        {/* Compact Sparkline (Mini Trend) */}
        <div className="w-32 h-14 opacity-40 group-hover:opacity-100 transition-opacity">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData.slice(-10)}>
              <defs>
                <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isHealthy ? '#10b981' : '#f43f5e'} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={isHealthy ? '#10b981' : '#f43f5e'} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area 
                type="monotone" 
                dataKey="temperature" 
                stroke={isHealthy ? '#10b981' : '#f43f5e'} 
                strokeWidth={2} 
                fill={`url(#grad-${id})`} 
                isAnimationActive={false} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Footer Details */}
      <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-5 mb-4 relative z-10">
        <div className="flex flex-col pointer-events-none">
          <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest mb-1">ANOMALY_INDEX</span>
          <span className="text-xs font-black text-slate-300 font-mono">{(anomalyScore * 10).toFixed(3)}</span>
        </div>
        <div className="flex flex-col text-right pointer-events-none">
          <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest mb-1">DATA_STREAM</span>
          <div className="flex items-center justify-end gap-1.5">
            <Activity className="w-2.5 h-2.5 text-cyan-500 animate-pulse" />
            <span className="text-[9px] font-black text-cyan-500 uppercase tracking-widest">ACTIVE</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.2em] text-cyan-400 group-hover:text-white transition-colors relative z-10">
        <span>ACCESS_NODE_COMMAND</span>
        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </div>
    </motion.button>
  );
};

export default IndustrialNodeCard;
