import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, Legend
} from 'recharts';
import { Activity, Zap, Thermometer, RotateCcw } from 'lucide-react';

const InertialGraphSuite = ({ data }) => {
  if (!data || data.length === 0) return (
    <div className="tactical-border bg-black/40 backdrop-blur-3xl rounded-[3rem] p-24 shadow-3xl border-2 border-white/5 flex flex-col items-center justify-center space-y-8 min-h-[400px]">
       <div className="relative">
          <Activity className="w-16 h-16 text-blue-800 opacity-20 animate-pulse" />
          <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-ping" />
       </div>
       <div className="text-center">
          <p className="text-[12px] font-black text-slate-600 uppercase tracking-[0.6em] mb-4">Tactical_Sync_Active</p>
          <p className="text-2xl font-black text-white italic tracking-tighter uppercase opacity-40">Awaiting_Sensor_Pulse...</p>
       </div>
       <div className="w-64 h-1 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 w-1/3 animate-[marquee_2s_linear_infinite]" />
       </div>
    </div>
  );

  return (
    <div className="tactical-border bg-black/40 backdrop-blur-3xl rounded-[3rem] p-12 shadow-3xl border-2 border-white/5 relative overflow-hidden group">
      <div className="absolute inset-0 bg-blue-600/[0.02] pointer-events-none group-hover:bg-blue-600/[0.04] transition-all duration-700" />
      
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-8 mb-12 relative z-10 font-sans">
         <div>
            <h3 className="text-[12px] font-black text-slate-600 uppercase tracking-[0.5em] mb-3 flex items-center gap-4">
               <Activity className="w-5 h-5 text-blue-500 shadow-glow-blue" /> Unit_Internal_Pulse
            </h3>
            <p className="text-3xl font-black text-white tracking-tighter uppercase italic">Unified_Sensor_Track</p>
         </div>
         <div className="flex gap-10">
            <div className="flex items-center gap-3">
               <div className="w-3 h-3 rounded-full bg-orange-500 shadow-glow-red" />
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Thermal_K</span>
            </div>
            <div className="flex items-center gap-3">
               <div className="w-3 h-3 rounded-full bg-blue-500 shadow-glow-blue" />
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Torque_Nm</span>
            </div>
            <div className="flex items-center gap-3">
               <div className="w-3 h-3 rounded-full bg-purple-500 shadow-glow-purple" />
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Rotational_Rpm</span>
            </div>
         </div>
      </div>

      <div className="h-80 w-full relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorTorque" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorRpm" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff03" vertical={false} />
            <XAxis dataKey="time" hide />
            <YAxis 
              yAxisId="left" 
              stroke="#ffffff10" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              tick={{fill: '#475569', fontWeight: '900'}}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              stroke="#ffffff10" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              tick={{fill: '#475569', fontWeight: '900'}}
            />
            <RechartsTooltip 
              contentStyle={{backgroundColor: '#050508', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '16px', fontSize: '12px', fontWeight: '900', color: '#fff', padding: '15px'}}
              itemStyle={{color: '#fff', marginBottom: '5px'}}
              cursor={{stroke: 'rgba(59,130,246,0.2)', strokeWidth: 1.5}}
            />
            <Area 
              yAxisId="left"
              type="monotone" 
              dataKey="temperature" 
              stroke="#f97316" 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#colorTemp)" 
              isAnimationActive={false}
            />
            <Area 
              yAxisId="left"
              type="monotone" 
              dataKey="torque" 
              stroke="#3b82f6" 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#colorTorque)" 
              isAnimationActive={false}
            />
            <Area 
              yAxisId="right"
              type="monotone" 
              dataKey="rpm" 
              stroke="#a855f7" 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#colorRpm)" 
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
         <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between group-hover:border-orange-500/20 transition-all">
            <div className="flex items-center gap-4">
               <Thermometer className="w-5 h-5 text-orange-500" />
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Avg_Thermal</span>
            </div>
            <span className="text-xl font-black text-white font-mono">{Math.round(data[data.length-1]?.temperature || 0)}K</span>
         </div>
         <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between group-hover:border-blue-500/20 transition-all">
            <div className="flex items-center gap-4">
               <Zap className="w-5 h-5 text-blue-500" />
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Peak_Torque</span>
            </div>
            <span className="text-xl font-black text-white font-mono">{Math.round(data[data.length-1]?.torque || 0)}Nm</span>
         </div>
         <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between group-hover:border-purple-500/20 transition-all">
            <div className="flex items-center gap-4">
               <RotateCcw className="w-5 h-5 text-purple-500" />
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Rot_Velocity</span>
            </div>
            <span className="text-xl font-black text-white font-mono">{Math.round(data[data.length-1]?.rpm || 0)}</span>
         </div>
      </div>
    </div>
  );
};

export default InertialGraphSuite;
