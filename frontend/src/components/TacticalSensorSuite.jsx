import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import { Activity, Clock, DollarSign, Database, PieChart, Zap, Settings, Box, Wrench } from 'lucide-react';

export const AdvancedDigitalTwin = ({ failureType, healthIndex }) => {
  const isHealthy = healthIndex >= 80;
  const isWarning = healthIndex >= 50 && healthIndex < 80;
  const isCritical = healthIndex < 50;

  const getCompColor = (compType) => {
    if (failureType === 'None' || failureType === 'Normal') return isHealthy ? '#64748b' : isWarning ? '#f59e0b' : '#ef4444';
    if (compType === 'spindle' && (failureType === 'Tool Wear Failure' || failureType === 'TWF')) return '#ef4444';
    if (compType === 'coolant' && (failureType === 'Heat Dissipation Failure' || failureType === 'HDF')) return '#ef4444';
    if (compType === 'power' && (failureType === 'Power Failure' || failureType === 'PWF')) return '#ef4444';
    if (compType === 'overload' && (failureType === 'Overstrain Failure' || failureType === 'OSF')) return '#ef4444';
    return '#64748b';
  };

  return (
    <div className="tactical-border relative w-full h-64 rounded-3xl overflow-hidden flex flex-col items-center justify-center p-8 bg-slate-950/40 shadow-2xl">
      <div className="absolute top-4 left-4 flex flex-col gap-1">
         <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${isHealthy ? 'bg-emerald-500 shadow-glow-green' : 'bg-rose-500 animate-ping'}`} />
            <span className="text-[8px] font-black text-white tracking-[0.3em] uppercase opacity-60">System_Twin_v9</span>
         </div>
      </div>
      
      <svg viewBox="0 0 240 140" className="w-full h-full drop-shadow-[0_0_20px_rgba(59,130,246,0.2)]">
        <rect x="40" y="110" width="160" height="20" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
        <rect x="50" y="20" width="30" height="90" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
        <g className={(failureType === 'Tool Wear Failure' || failureType === 'TWF') ? 'animate-pulse' : ''}>
           <rect x="75" y="35" width="45" height="55" rx="3" fill={getCompColor('spindle')} stroke="#000" strokeOpacity="0.2" />
           <circle cx="97.5" cy="45" r="4" fill="#000" fillOpacity="0.3" />
        </g>
        <g className={(failureType === 'Heat Dissipation Failure' || failureType === 'HDF') ? 'animate-bounce' : ''}>
           <path d="M120 45 Q150 45 150 80" stroke={getCompColor('coolant')} strokeWidth="4" fill="none" strokeLinecap="round" />
           <path d="M145 75 L150 85 L155 75 Z" fill={getCompColor('coolant')} />
        </g>
        <rect x="92" y="90" width="11" height="15" fill={isHealthy ? "#94a3b8" : "#fca5a5"} stroke="#334155" />
        <rect x="80" y="105" width="100" height="8" rx="2" fill={getCompColor('overload')} />
        <circle cx="200" cy="30" r="3" fill={isHealthy ? "#10b981" : "#ef4444"} className="animate-pulse" />
        <line x1="200" y1="33" x2="100" y2="100" stroke="#ef4444" strokeWidth="0.8" strokeDasharray="2,2" opacity={isCritical ? 0.4 : 0} />
      </svg>
      
      <div className="flex gap-6 mt-6">
         <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full shadow-glow-red" style={{backgroundColor: getCompColor('spindle')}}/><span className="text-[9px] text-slate-500 uppercase font-black tracking-[0.2em]">Spindle</span></div>
         <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full shadow-glow-yellow" style={{backgroundColor: getCompColor('coolant')}}/><span className="text-[9px] text-slate-500 uppercase font-black tracking-[0.2em]">Coolant</span></div>
         <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full shadow-glow-blue" style={{backgroundColor: getCompColor('overload')}}/><span className="text-[9px] text-slate-500 uppercase font-black tracking-[0.2em]">Bed</span></div>
      </div>
    </div>
  );
};

export const MetricChart = ({ title, data, dataKey, color, unit, gradientId }) => (
  <div className="tactical-border bg-slate-900/40 backdrop-blur-3xl rounded-[2rem] p-8 shadow-3xl group hover:border-blue-500/40 transition-all duration-500 overflow-hidden">
    <div className="flex justify-between items-center mb-8 relative z-10">
      <div className="flex items-center gap-3">
         <div className="w-1 h-4 rounded-full bg-blue-500 shadow-glow-blue" />
         <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">{title}</h3>
      </div>
      <div className="flex flex-col items-end">
          <span className="text-[10px] font-black text-white tracking-widest leading-none">{unit}</span>
          <span className="text-[8px] font-mono text-slate-700 mt-1 uppercase">Sensor_A102</span>
      </div>
    </div>
    <div className="h-44 min-h-[176px] w-full relative z-10">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.6}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="2 2" stroke="#ffffff08" vertical={true}/>
          <XAxis dataKey="time" hide/>
          <YAxis stroke="#ffffff15" fontSize={9} tickLine={false} axisLine={false} domain={['auto', 'auto']} tick={{fill: '#475569', fontWeight: '900'}} />
          <RechartsTooltip 
            contentStyle={{backgroundColor: '#050508', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '12px', fontSize: '11px', fontWeight: '900', color: '#fff'}}
            itemStyle={{color: '#fff'}}
            cursor={{stroke: 'rgba(59,130,246,0.2)', strokeWidth: 1}}
          />
          <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={3} fill={`url(#${gradientId})`} isAnimationActive={true} animationDuration={800} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
    <div className="absolute bottom-3 right-3 opacity-20 pointer-events-none">
        <Activity className="w-8 h-8 text-blue-500" />
    </div>
  </div>
);

export const ExplanationChart = ({ explanationData }) => {
  if (!explanationData) return (
    <div className="flex flex-col items-center justify-center h-44 border border-dashed border-white/10 rounded-[2rem] bg-slate-950/20">
       <Database className="w-10 h-10 text-slate-800 mb-3 opacity-10 animate-pulse" />
       <p className="text-[11px] text-slate-700 font-black uppercase tracking-[0.3em] text-center px-10">XAI Reasoner Idle. Execute root cause analysis to populate model attribution.</p>
    </div>
  );
  
  const sorted = Object.entries(explanationData)
    .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
    .slice(0, 6)
    .map(([name, val]) => ({ 
      name: name.replace('_rolling_mean_10', '').replace(/_/g, ' ').toUpperCase().split(' ')[0], 
      val: Math.abs(val) 
    }));

  return (
    <div className="h-44 min-h-[176px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sorted} layout="vertical" margin={{ left: 10, right: 30, top: 0, bottom: 0 }}>
          <XAxis type="number" hide />
          <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 9, fill: '#64748b', fontWeight: '900', letterSpacing: '0.1em' }} axisLine={false} tickLine={false} />
          <RechartsTooltip cursor={{ fill: 'rgba(59,130,246,0.05)' }} contentStyle={{ backgroundColor: '#050508', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', fontSize: '10px' }} />
          <Bar dataKey="val" radius={[0, 8, 8, 0]}>
            {sorted.map((entry, index) => (
              <Cell key={index} fill={index === 0 ? '#ef4444' : index < 3 ? '#f59e0b' : '#3b82f6'} fillOpacity={0.9} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const TacticalSensorSuite = ({ machineData, onExplain, explaining, explanationData }) => {
  if (!machineData) return (
    <div className="flex flex-col items-center justify-center h-[60vh] opacity-20">
       <RotateCcw className="w-12 h-12 animate-spin mb-4" />
       <p className="text-[11px] font-black uppercase tracking-[0.5em]">Establishing_Tactical_Link...</p>
    </div>
  );

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        <div className="lg:col-span-12 xl:col-span-5 space-y-16">
          <div className="tactical-border bg-black/40 rounded-[4rem] p-12 shadow-3xl backdrop-blur-3xl relative overflow-hidden group">
            <h3 className="text-[12px] font-black text-slate-600 uppercase tracking-[0.5em] mb-10 flex items-center gap-4 relative z-10"><PieChart className="w-6 h-6 text-emerald-500 shadow-glow-green" /> Digital_Twin_Perspective</h3>
            <AdvancedDigitalTwin healthIndex={machineData.healthIndex} failureType={machineData.failureType} />
            <div className="mt-16 grid grid-cols-1 gap-8 relative z-10">
              <div className="tactical-border bg-slate-900/30 p-10 rounded-[2.5rem] flex items-center justify-between group shadow-3xl border border-white/5">
                <div><p className="text-[12px] text-slate-700 font-black uppercase tracking-[0.4em] mb-2 leading-none">Remaining_Useful_Cycles</p><p className="text-6xl font-black tracking-tighter text-white leading-none shadow-glow-blue">{Math.round(machineData.rul || 0)} <span className="text-[14px] font-black text-slate-600 uppercase tracking-[0.2em]">Cycles</span></p></div>
                <Clock className="w-16 h-16 text-blue-600 opacity-20 group-hover:opacity-50 transition-opacity" />
              </div>
              <div className="tactical-border bg-slate-900/30 p-10 rounded-[2.5rem] flex items-center justify-between group shadow-3xl border border-white/5">
                <div><p className="text-[12px] text-slate-700 font-black uppercase tracking-[0.4em] mb-2 leading-none">Financial_Risk_Vector</p><p className="text-6xl font-black tracking-tighter text-rose-600 leading-none shadow-glow-red">${machineData.cost?.toFixed(2) || '0.00'}</p></div>
                <DollarSign className="w-16 h-16 text-rose-700 opacity-20 group-hover:opacity-50 transition-opacity" />
              </div>
            </div>
          </div>

          <div className={`tactical-border p-12 rounded-[4rem] border-2 relative overflow-hidden transition-all duration-1000 shadow-3xl ${machineData.urgency <= 2 ? 'bg-emerald-600/10 border-emerald-500/40 text-emerald-400' : 'bg-rose-600/20 border-rose-500/50 text-rose-500 shadow-glow-red'}`}>
            <p className="text-[12px] font-black uppercase tracking-[0.5em] opacity-40 mb-8 border-b border-current pb-4 inline-block">ML_Operations_Directive</p>
            <p className="text-3xl font-black tracking-tighter leading-tight uppercase font-mono italic shadow-inner">{machineData.suggestion}</p>
            <div className="mt-12 flex items-center gap-5">
              <div className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl ${machineData.urgency <= 2 ? 'bg-emerald-500/30' : 'bg-rose-500/40 animate-pulse h-[30px] flex items-center'}`}>Priority_Level: {machineData.urgency <= 1 ? 'NOMINAL' : machineData.urgency <= 2 ? 'ELEVATED' : 'CRITICAL'}</div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-12 xl:col-span-7 space-y-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <MetricChart title="Thermal_Signature" data={machineData.chartData} dataKey="temperature" color="#fb923c" unit="KELVIN_K" gradientId="gradT" />
            <MetricChart title="Dynamic_Torque" data={machineData.chartData} dataKey="torque" color="#3b82f6" unit="NM_TORQUE" gradientId="gradQ" />
            <MetricChart title="Rotational_Velocity" data={machineData.chartData} dataKey="rpm" color="#a855f7" unit="MAG_RPM" gradientId="gradR" />
            <MetricChart title="Tool_Wear_Index" data={machineData.chartData} dataKey="toolWear" color="#10b981" unit="MIN_DEGRAD" gradientId="gradW" />
          </div>

          <div className="tactical-border bg-black/50 rounded-[4rem] p-12 shadow-3xl relative overflow-hidden backdrop-blur-3xl border-2 border-white/10">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-12 mb-16 relative z-10">
              <div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-6">
                  <Database className="w-10 h-10 text-blue-600 shadow-glow-blue animate-pulse" /> Inference_Reasoner_v9
                </h2>
                <p className="text-[13px] font-black text-slate-500 mt-3 uppercase tracking-[0.4em] font-mono opacity-60">Engine: LSTM_Transform_v4.2</p>
              </div>
              <button 
                onClick={onExplain} 
                className="px-12 py-5 bg-blue-700 hover:bg-blue-600 text-white rounded-[2rem] text-[13px] font-black uppercase tracking-[0.3em] shadow-glow-blue transition-all active:scale-95 group border-2 border-blue-400/30"
              >
                {explaining ? 'REASONING...' : 'DECODE_ROOT_CAUSE'}
              </button>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-16 relative z-10">
              <div className="xl:col-span-1 space-y-10">
                <div className="tactical-border bg-slate-900/40 p-10 rounded-[2.5rem] shadow-2xl border border-white/5">
                  <p className="text-[11px] text-slate-600 font-black uppercase tracking-[0.4em] mb-4 flex items-center gap-3"><Settings className="w-4 h-4 opacity-40" /> Anomaly_Magnitude</p>
                  <p className={`text-5xl font-black font-mono transition-colors tracking-tighter ${machineData.anomalyScore > 0.3 ? 'text-rose-600 shadow-glow-red' : 'text-blue-600 shadow-glow-blue'}`}>{(machineData.anomalyScore * 100).toFixed(2)}%</p>
                </div>
                <div className="tactical-border bg-slate-900/40 p-10 rounded-[2.5rem] shadow-2xl border border-white/5">
                  <p className="text-[11px] text-slate-600 font-black uppercase tracking-[0.4em] mb-4 flex items-center gap-3"><Zap className="w-4 h-4 opacity-40" /> Fail_Confidence</p>
                  <p className={`text-5xl font-black font-mono transition-colors tracking-tighter ${machineData.failureProb > 0.5 ? 'text-rose-600 shadow-glow-red' : 'text-emerald-500 shadow-glow-green'}`}>{(machineData.failureProb * 100).toFixed(2)}%</p>
                </div>
              </div>
              <div className="xl:col-span-2 tactical-border bg-slate-950/60 rounded-[3rem] p-12 shadow-3xl border border-white/10">
                <p className="text-[12px] font-black text-slate-600 uppercase tracking-[0.5em] mb-10 flex items-center gap-4 underline decoration-blue-500/20 underline-offset-8">
                   Neural_Feature_Attribution [SHAP]
                </p>
                <ExplanationChart explanationData={explanationData} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TacticalSensorSuite;
