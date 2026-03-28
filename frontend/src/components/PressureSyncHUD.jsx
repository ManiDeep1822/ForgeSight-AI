import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { Activity, Clock, Zap, Target } from 'lucide-react';

const PressureSyncHUD = ({ data }) => {
  // Generate a mock 'Master Profile' envelope
  const enrichedData = React.useMemo(() => data.map((d, i) => ({
    ...d,
    masterPressure: 800 * Math.sin((i / 60) * Math.PI) + 100 + (Math.random() * 5),
    toleranceUpper: 850 * Math.sin((i / 60) * Math.PI) + 120,
    toleranceLower: 750 * Math.sin((i / 60) * Math.PI) + 80,
  })), [data]);

  if (!data || data.length === 0) return null;

  return (
    <div className="bg-slate-900/40 backdrop-blur-3xl rounded-[3rem] p-10 flex flex-col gap-10 border border-white/5 relative overflow-hidden group shadow-2xl">
      <div className="absolute inset-0 bg-blue-500/[0.02] pointer-events-none group-hover:bg-blue-500/[0.04] transition-all duration-700" />
      
      <div className="flex justify-between items-end relative z-10">
         <div className="space-y-2">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.6em] flex items-center gap-3">
               <Activity className="w-4 h-4 text-blue-500 shadow-glow-blue" /> Process_Profile_Sync
            </h3>
            <p className="text-2xl font-black text-white tracking-widest uppercase italic">P-T_Injection_Envelope</p>
         </div>
         <div className="flex gap-8">
            <div className="flex items-center gap-2">
               <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-glow-blue" />
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Active_Pressure</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Master_Profile</span>
            </div>
         </div>
      </div>

      <div className="h-48 w-full relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={enrichedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPress" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff03" vertical={false} />
            <XAxis dataKey="time" hide />
            <YAxis stroke="#ffffff10" fontSize={9} tickLine={false} axisLine={false} tick={{fill: '#475569', fontWeight: '900'}} />
            <Tooltip 
              contentStyle={{backgroundColor: 'rgba(5, 5, 8, 0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '12px', fontSize: '10px', fontWeight: '900', color: '#fff'}}
              itemStyle={{color: '#fff', marginBottom: '4px'}}
            />
            
            <Area type="monotone" dataKey="toleranceUpper" stroke="none" fill="rgba(59,130,246,0.03)" isAnimationActive={false} />
            <Area type="monotone" dataKey="toleranceLower" stroke="none" fill="rgba(59,130,246,0.03)" isAnimationActive={false} />
            
            <Area 
              type="monotone" 
              dataKey="masterPressure" 
              stroke="rgba(255,255,255,0.15)" 
              strokeWidth={1.5} 
              strokeDasharray="4 4"
              fill="none"
              isAnimationActive={false}
            />
            
            <Area 
              type="monotone" 
              dataKey="pressure" 
              stroke="#3b82f6" 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#colorPress)" 
              isAnimationActive={false}
            />
            
            <ReferenceLine x={40} stroke="#f59e0b" strokeDasharray="3 3" label={{ position: 'top', value: 'VP SWITCHOVER', fill: '#f59e0b', fontSize: 9, fontWeight: 900 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 relative z-10 pt-6 border-t border-white/5">
         <div className="flex flex-col gap-1">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-between">Max_Pressure <Clock className="w-3 h-3 text-blue-500" /></span>
            <span className="text-lg font-black text-white font-mono">1,242<span className="text-[9px] ml-1 opacity-40">bar</span></span>
         </div>
         <div className="flex flex-col gap-1">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-between">Hold_Int <Target className="w-3 h-3 text-emerald-500" /></span>
            <span className="text-lg font-black text-white font-mono">98.4<span className="text-[9px] ml-1 opacity-40">%</span></span>
         </div>
         <div className="flex flex-col gap-1">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-between">Cushion <Zap className="w-3 h-3 text-orange-500" /></span>
            <span className="text-lg font-black text-white font-mono">4.2<span className="text-[9px] ml-1 opacity-40">mm</span></span>
         </div>
         <div className="flex flex-col gap-1 bg-blue-500/10 px-4 py-2 rounded-xl border border-blue-500/20">
            <span className="text-[8px] font-black text-blue-400 uppercase tracking-[0.2em] animate-pulse">Cycle_Stability</span>
            <span className="text-[12px] font-black text-white mt-1">NOMINAL</span>
         </div>
      </div>
    </div>
  );
};

export default PressureSyncHUD;
