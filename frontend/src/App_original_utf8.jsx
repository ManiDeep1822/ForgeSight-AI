import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell
} from 'recharts';
import { 
  Activity, AlertTriangle, CheckCircle, Clock, DollarSign, Settings, Wrench, BarChart2, Server, Cpu, Database, 
  LayoutPanelLeft, List, PieChart, Bell, History, Zap, ShieldAlert, Download, Box
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import * as api from './services/api';

const generateDummyChartData = (len = 30) => {
  return Array.from({ length: len }, (_, i) => ({
    time: i,
    temperature: 300 + Math.random() * 5,
    torque: 40 + Math.random() * 5,
    rpm: 1500 + Math.random() * 100,
    toolWear: Math.random() * 10
  }));
};

const MACHINE_IDS = Array.from({ length: 12 }, (_, i) => `CNC-${String(i + 1).padStart(2, '0')}`);

// Advanced Digital Twin with multiple components
const AdvancedDigitalTwin = ({ failureType, healthIndex }) => {
  const isHealthy = healthIndex >= 80;
  const isWarning = healthIndex >= 50 && healthIndex < 80;
  const isCritical = healthIndex < 50;

  const getCompColor = (compType) => {
    if (failureType === 'None') return isHealthy ? '#64748b' : isWarning ? '#f59e0b' : '#ef4444';
    if (compType === 'spindle' && failureType === 'Tool Wear Failure') return '#ef4444';
    if (compType === 'coolant' && failureType === 'Heat Dissipation Failure') return '#ef4444';
    if (compType === 'power' && failureType === 'Power Failure') return '#ef4444';
    if (compType === 'overload' && failureType === 'Overstrain Failure') return '#ef4444';
    return '#64748b';
  };

  return (
    <div className="relative w-full h-56 bg-slate-900/40 rounded-2xl overflow-hidden flex flex-col items-center justify-center p-6 border border-white/5 shadow-inner">
      <svg viewBox="0 0 240 140" className="w-full h-full drop-shadow-[0_0_15px_rgba(59,130,246,0.1)]">
        {/* Machine Base */}
        <rect x="40" y="110" width="160" height="20" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="1" />
        
        {/* Machine Column / Frame */}
        <rect x="50" y="20" width="30" height="90" fill="#1e293b" stroke="#334155" strokeWidth="1" />
        
        {/* Spindle Assembly (The Motor) */}
        <g className={failureType === 'Tool Wear Failure' ? 'animate-pulse' : ''}>
           <rect x="75" y="35" width="45" height="55" rx="3" fill={getCompColor('spindle')} stroke="#000" strokeOpacity="0.1" />
           <circle cx="97.5" cy="45" r="4" fill="#000" fillOpacity="0.2" />
        </g>
        
        {/* Coolant Hose/Subsystem */}
        <g className={failureType === 'Heat Dissipation Failure' ? 'animate-bounce' : ''}>
           <path d="M120 45 Q150 45 150 80" stroke={getCompColor('coolant')} strokeWidth="4" fill="none" strokeLinecap="round" />
           <path d="M145 75 L150 85 L155 75 Z" fill={getCompColor('coolant')} />
        </g>
        
        {/* The Cutting Tool (The actual drill/bit) */}
        <rect x="92" y="90" width="11" height="15" fill={isHealthy ? "#94a3b8" : "#fca5a5"} stroke="#334155" />
        
        {/* Worktable / Bed */}
        <rect x="80" y="105" width="100" height="8" rx="2" fill={getCompColor('overload')} />
        
        {/* Laser/Sensors indicator */}
        <circle cx="200" cy="30" r="3" fill={isHealthy ? "#10b981" : "#ef4444"} className="animate-pulse" />
        <line x1="200" y1="33" x2="100" y2="100" stroke="#ef4444" strokeWidth="0.5" strokeDasharray="2,2" opacity={isCritical ? 0.3 : 0} />
      </svg>
      <div className="flex gap-4 mt-2">
         <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{backgroundColor: getCompColor('spindle')}}/><span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Spindle</span></div>
         <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{backgroundColor: getCompColor('coolant')}}/><span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Coolant</span></div>
         <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{backgroundColor: getCompColor('overload')}}/><span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Bed</span></div>
      </div>
    </div>
  );
};

// Sub-component for charts to keep App.jsx readable
const MetricChart = ({ title, data, dataKey, color, unit, gradientId }) => (
  <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-lg group hover:border-white/20 transition-all duration-300">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title} ({unit})</h3>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity"><Zap className="w-3 h-3 text-slate-500" /></div>
    </div>
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false}/>
          <XAxis dataKey="time" hide/>
          <YAxis stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} domain={['auto', 'auto']} tickFormatter={(v) => Math.round(v)}/>
          <RechartsTooltip contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', fontSize: '12px'}}/>
          <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} fill={`url(#${gradientId})`} isAnimationActive={false}/>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const ExplanationChart = ({ explanationData }) => {
  if (!explanationData) return <div className="text-slate-500 text-xs italic p-4 text-center border border-dashed border-white/10 rounded-xl">Diagnostic ready. Initiate analysis for full feature attribution.</div>;
  
  const sorted = Object.entries(explanationData)
    .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
    .slice(0, 6)
    .map(([name, val]) => ({ 
      name: name.replace('_rolling_mean_10', '').replace(/_/g, ' ').toUpperCase().split(' ')[0], 
      val: Math.abs(val) 
    }));

  return (
    <div className="h-44 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sorted} layout="vertical" margin={{ left: 10, right: 30, top: 0, bottom: 0 }}>
          <XAxis type="number" hide />
          <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 9, fill: '#64748b', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
          <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#0f172a', border: 'none', fontSize: '10px' }} />
          <Bar dataKey="val" radius={[0, 4, 4, 0]}>
            {sorted.map((entry, index) => (
              <Cell key={index} fill={index === 0 ? '#ef4444' : index < 3 ? '#f59e0b' : '#3b82f6'} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

function App() {
  const [view, setView] = useState('fleet');
  const [selectedMachine, setSelectedMachine] = useState(MACHINE_IDS[0]);
  const [alerts, setAlerts] = useState([]);
  const [maintLog, setMaintLog] = useState([]);
  const [timeRange, setTimeRange] = useState('1h');
  const [explaining, setExplaining] = useState(false);
  const [explanationData, setExplanationData] = useState(null);

  const [machines, setMachines] = useState(() => {
    const initialState = {};
    MACHINE_IDS.forEach((id) => {
      initialState[id] = {
        id,
        name: `Milling Machine ${id.split('-')[1]}`,
        healthIndex: 98.2,
        status: 'Healthy',
        rul: 200,
        anomalyScore: 0.005,
        failureProb: 0.0,
        failureType: 'None',
        cost: 0,
        suggestion: 'OPTIMAL ÔÇö Performance within normal bounds.',
        urgency: 1,
        chartData: generateDummyChartData(30),
        lastWindow: null,
        injectFault: false
      };
    });
    return initialState;
  });

  const [simIndex, setSimIndex] = useState(0);

  const simulateMachineData = useCallback(async (machineId) => {
    try {
      const m = machines[machineId];
      // Generate window (43 dims x 60 steps)
      const dummyWindow = Array.from({ length: 60 }, () => Array.from({ length: 43 }, () => Math.random() * 0.1));
      
      const anomalyRes = await api.detectAnomaly(dummyWindow, machineId);
      const failRes = await api.predictFailure(dummyWindow, machineId);
      const classRes = await api.classifyFailure(dummyWindow, machineId);
      const rulRes = await api.estimateRUL(dummyWindow, machineId);
      
      const ft = failRes.data?.will_fail ? classRes.data?.failure_type : 'None';
      const healthRes = await api.scoreHealth(anomalyRes.data?.score || 0, failRes.data?.probability || 0, rulRes.data?.rul_value || 200, classRes.data?.confidence || 0);
      const costRes = await api.estimateCost(ft, healthRes.data?.health_index || 100, rulRes.data?.rul_value || 200, machineId);
      const maintRes = await api.suggestMaintenance(healthRes.data?.health_index || 100, rulRes.data?.rul_value || 200, ft);

      setMachines(prev => {
        const curM = prev[machineId];
        const newChartData = [...curM.chartData.slice(1)];
        const lastStep = newChartData[newChartData.length-1];

        // Fault Injection Logic
        let tempMult = curM.injectFault ? 1.05 : 1 + (Math.random() - 0.5) * 0.01;
        let rpmMult = curM.injectFault ? 0.95 : 1 + (Math.random() - 0.5) * 0.005;
        let torqueMult = curM.injectFault ? 1.1 : 1 + (Math.random() - 0.5) * 0.01;

        newChartData.push({
          time: lastStep.time + 1,
          temperature: lastStep.temperature * tempMult,
          torque: lastStep.torque * torqueMult,
          rpm: lastStep.rpm * rpmMult,
          toolWear: lastStep.toolWear + (curM.injectFault ? 0.8 : 0.05)
        });

        if (healthRes.data.health_index < 60 && curM.healthIndex >= 60) {
           setAlerts(cur => [{ id: Date.now(), msg: `Alert: ${machineId} health at critical levels.`, status: 'critical' }, ...cur.slice(0, 7)]);
        }

        return { ...prev, [machineId]: {
          ...curM,
          ...healthRes.data,
          rul: rulRes.data.rul_value,
          anomalyScore: anomalyRes.data.score,
          failureProb: failRes.data.probability,
          failureType: ft,
          cost: costRes.data.estimated_cost,
          suggestion: maintRes.data.suggestion,
          urgency: maintRes.data.urgency,
          chartData: newChartData,
          lastWindow: dummyWindow
        }};
      });
    } catch (e) {}
  }, [machines]);

  useEffect(() => {
    const interval = setInterval(() => {
      const idToUpdate = simIndex === 0 ? selectedMachine : MACHINE_IDS[simIndex - 1];
      simulateMachineData(idToUpdate);
      setSimIndex(prev => (prev + 1) % (MACHINE_IDS.length + 1));
    }, 1200);
    return () => clearInterval(interval);
  }, [simIndex, selectedMachine, simulateMachineData]);

  const handleExplain = async () => {
    const m = machines[selectedMachine];
    if (!m.lastWindow) return;
    setExplaining(true);
    try {
      const res = await api.getExplanation(m.lastWindow, m.id);
      setExplanationData(res.data.feature_importance);
    } catch (e) {} finally { setExplaining(false); }
  };

  const handleService = (id) => {
    setMachines(prev => ({
      ...prev,
      [id]: { 
        ...prev[id], 
        healthIndex: 99.5, 
        status: 'Healthy', 
        failureProb: 0, 
        failureType: 'None', 
        rul: 200, 
        suggestion: 'SYSTEM RESET ÔÇö All components calibrated.', 
        urgency: 1, 
        injectFault: false,
        chartData: generateDummyChartData(30)
      }
    }));
    setMaintLog(prev => [{ id: Date.now(), machine: id, action: 'Component Re-calibration', date: new Date().toLocaleTimeString() }, ...prev]);
  };

  const toggleFault = (id) => {
     setMachines(prev => ({ ...prev, [id]: { ...prev[id], injectFault: !prev[id].injectFault }}));
  };

  const handleExportReport = () => {
    const doc = new jsPDF();
    const m = machines[selectedMachine];
    doc.setFontSize(22);
    doc.text(`FORGE FORGE HEALTH REPORT`, 20, 20);
    doc.setFontSize(14);
    doc.text(`Machine identifier: ${m.id}`, 20, 40);
    doc.text(`Status: ${m.status}`, 20, 50);
    doc.text(`Health Index: ${m.healthIndex.toFixed(1)}/100`, 20, 60);
    doc.text(`Predicted failure: ${m.failureType}`, 20, 70);
    doc.text(`Service suggestion: ${m.suggestion}`, 20, 80);
    doc.save(`FORGE_Report_${m.id}.pdf`);
  };

  const globalStats = useMemo(() => {
    const vals = Object.values(machines);
    const avgHealth = vals.reduce((acc, m) => acc + m.healthIndex, 0) / vals.length;
    return { avgHealth, totalRisk: vals.reduce((acc, m) => acc + m.cost, 0), criticalCount: vals.filter(m => m.healthIndex < 50).length };
  }, [machines]);

  const currentData = machines[selectedMachine];
  const getStatusColorText = (hi) => hi >= 80 ? 'text-emerald-400' : hi >= 50 ? 'text-yellow-400' : 'text-rose-500';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans selection:bg-brand-primary/30 h-screen overflow-hidden">
      
      {/* Dynamic Header */}
      <header className="flex justify-between items-center px-8 py-3 bg-slate-900/60 backdrop-blur-2xl border-b border-white/5 z-20 flex-shrink-0 shadow-2xl">
        <div className="flex items-center space-x-4">
           <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)]"><Activity className="w-6 h-6 text-white" /></div>
           <div>
              <h1 className="text-xl font-black text-white tracking-tighter leading-none">FORGE ENTERPRISE</h1>
              <div className="flex items-center gap-2 mt-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">{MACHINE_IDS.length} Monitored Units</span>
              </div>
           </div>
        </div>

        {/* Global Alert Marquee */}
        <div className="hidden lg:flex flex-1 max-w-2xl mx-12 overflow-hidden items-center px-6 py-2 bg-slate-950/40 rounded-full border border-white/5 group">
           <ShieldAlert className="w-4 h-4 text-rose-500 mr-4 shrink-0" />
           <div className="text-[11px] font-medium text-slate-400 whitespace-nowrap animate-marquee group-hover:pause italic tracking-wide">
              {alerts.length > 0 ? alerts.map(a => `ÔÇó [ALERT] ${a.msg}`).join('   ') : "COMM_LINE_STABLE // NO ACTIVE BREACHES DETECTED // FLEET STATUS: OPTIMAL"}
           </div>
        </div>

        <div className="flex items-center space-x-4">
           <div className="flex bg-slate-800/40 p-1 rounded-xl border border-white/5">
              <button onClick={() => setView('fleet')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${view === 'fleet' ? 'bg-blue-600 text-white shadow-xl translate-y-[-1px]' : 'text-slate-500 hover:text-white'}`}>Manager</button>
              <button onClick={() => setView('detail')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${view === 'detail' ? 'bg-blue-600 text-white shadow-xl translate-y-[-1px]' : 'text-slate-500 hover:text-white'}`}>Diagnostics</button>
           </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        
        {/* Machine Navigation Sidebar */}
        <aside className="w-80 bg-slate-950/20 border-r border-white/5 flex flex-col overflow-y-auto">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
             <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-500">Fleet Index</h2>
             <span className="text-[10px] font-mono text-slate-700 px-2 py-0.5 border border-white/5 rounded-full">{new Date().toLocaleTimeString()}</span>
          </div>
          
          <ul className="flex-1 p-4 space-y-3">
             {Object.values(machines).map(m => (
                <li key={m.id}>
                   <button onClick={() => { setSelectedMachine(m.id); setView('detail'); }} className={`w-full group p-4 rounded-2xl transition-all border ${selectedMachine === m.id && view === 'detail' ? 'bg-blue-600/10 border-blue-500/40 shadow-xl' : 'bg-white/5 border-transparent hover:bg-white/10'}`}>
                      <div className="flex justify-between items-start mb-2">
                         <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${selectedMachine === m.id ? 'bg-blue-500/20' : 'bg-slate-800/40'}`}><Cpu className={`w-4 h-4 ${m.healthIndex < 50 ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`} /></div>
                            <div className="text-left font-black text-sm tracking-tight text-white">{m.id}</div>
                         </div>
                         <div className={`w-2 h-2 rounded-full shadow-[0_0_8px] mt-2 ${m.healthIndex >= 80 ? 'bg-emerald-500 shadow-emerald-500/50' : m.healthIndex >= 50 ? 'bg-yellow-500 shadow-yellow-500/50' : 'bg-rose-500 shadow-rose-500/50'}`} />
                      </div>
                      <div className="flex items-center justify-between border-t border-white/5 pt-2">
                         <span className="text-[10px] font-bold text-slate-500 uppercase">Health Ind.</span>
                         <span className={`text-[11px] font-black ${getStatusColorText(m.healthIndex)}`}>{m.healthIndex.toFixed(0)}/100</span>
                      </div>
                   </button>
                </li>
             ))}
          </ul>

          <div className="p-6 bg-slate-950/40 border-t border-white/5">
             <h3 className="text-[10px] font-black uppercase text-slate-600 tracking-widest mb-4 flex gap-2"><History className="w-3 h-3" /> Event Log</h3>
             <div className="space-y-4">
                {maintLog.slice(0, 3).map(l => (
                   <div key={l.id} className="text-[10px] leading-relaxed border-l-2 border-emerald-500/30 pl-3">
                      <p className="text-slate-300 font-bold">{l.machine} RESET</p>
                      <p className="text-slate-500">{l.date}</p>
                   </div>
                ))}
             </div>
          </div>
        </aside>

        {/* Action Pane Content */}
        <main className="flex-1 overflow-y-auto p-8 relative">
          <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-blue-900/10 to-transparent pointer-events-none" />

          {view === 'fleet' ? (
            <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
               {/* Fleet Summary KPIs */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative overflow-hidden group">
                     <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:scale-125 transition-transform duration-700"><PieChart className="w-48 h-48" /></div>
                     <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Fleet Integration</p>
                     <div className="text-5xl font-black text-white tracking-tighter">{globalStats.avgHealth.toFixed(1)}%</div>
                     <p className="text-[11px] text-slate-500 font-bold mt-2 flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-500" /> STABLE OPERATIONAL BAND</p>
                  </div>
                  <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 group">
                     <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Financial Risk</p>
                     <div className="text-5xl font-black text-white tracking-tighter">${globalStats.totalRisk.toLocaleString()}</div>
                     <p className="text-[11px] text-rose-500 font-bold mt-2 flex items-center gap-2"><AlertTriangle className="w-3 h-3" /> RETRIBUTIVE DAMAGE ESTIMATION</p>
                  </div>
                  <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 group">
                     <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Service Queue</p>
                     <div className="text-5xl font-black text-white tracking-tighter">{globalStats.criticalCount}</div>
                     <p className="text-[11px] text-slate-500 font-bold mt-2 uppercase">Critical Interventions Pending</p>
                  </div>
               </div>

               {/* Machine Stat Grid */}
               <div className="bg-slate-900/40 border border-white/10 rounded-[2.5rem] p-10 shadow-2xl backdrop-blur-md">
                  <h2 className="text-xl font-black text-white mb-8 tracking-tighter flex items-center gap-3"><LayoutPanelLeft className="w-6 h-6 text-blue-500" /> PROVISIONED INDUSTRIAL UNITS</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                     {Object.values(machines).map(m => (
                        <button key={m.id} onClick={() => { setSelectedMachine(m.id); setView('detail'); }} className="group bg-slate-950/40 border border-white/5 p-6 rounded-3xl hover:border-blue-500/30 transition-all hover:translate-y-[-4px] text-left">
                           <div className="flex justify-between mb-4">
                              <span className="text-[10px] bg-white/5 border border-white/10 text-slate-400 font-bold px-3 py-1 rounded-full">{m.id}</span>
                              <div className={`w-3 h-3 rounded-full ${m.healthIndex >= 80 ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]' : 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]'}`} />
                           </div>
                           <p className={`text-xl font-black tracking-tight mb-1 ${getStatusColorText(m.healthIndex)}`}>{m.healthIndex.toFixed(0)}%</p>
                           <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">{m.status}</p>
                           <div className="mt-6 h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                              <div className={`h-full ${m.healthIndex >= 80 ? 'bg-emerald-500' : 'bg-rose-500/80'}`} style={{width: `${m.healthIndex}%`}} />
                           </div>
                        </button>
                     ))}
                  </div>
               </div>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto space-y-8 animate-in slide-in-from-bottom-6 duration-700">
               
               {/* Unified Diagnostic Header */}
               <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 pb-6 border-b border-white/5">
                  <div>
                     <div className="flex items-center gap-4 text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2"><Box className="w-3 h-3 text-blue-500" /> Machine System Instance</div>
                     <h2 className="text-5xl font-black text-white tracking-tighter uppercase">{currentData.name}</h2>
                     <div className="flex items-center gap-4 mt-6">
                        <div className={`px-4 py-2 border rounded-full text-xs font-black tracking-widest uppercase ${currentData.healthIndex >= 80 ? 'bg-emerald-600/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-600/20 border-rose-500/30 text-rose-500'}`}>{currentData.status}</div>
                        <div className="flex flex-col"><span className="text-[10px] text-slate-600 font-black uppercase">Service Window</span><span className="text-xs text-slate-400 font-mono">2026_Q1_PRODUCTION</span></div>
                     </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                     <button onClick={handleExportReport} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl border border-white/5 text-[11px] font-black uppercase flex items-center gap-2 transition-all active:scale-95"><Download className="w-4 h-4" /> Export Health.pdf</button>
                     <button onClick={() => toggleFault(currentData.id)} className={`px-6 py-3 rounded-2xl border text-[11px] font-black uppercase flex items-center gap-2 transition-all active:scale-95 ${currentData.injectFault ? 'bg-rose-600 text-white border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.4)]' : 'bg-slate-800 text-orange-400 border-orange-500/20'}`}><Zap className="w-4 h-4" /> {currentData.injectFault ? 'STOPPING INJECTED FAULT...' : 'INJECT SIMULATED FAULT'}</button>
                     <button onClick={() => handleService(currentData.id)} className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-[11px] uppercase flex items-center gap-2 shadow-2xl transition-all active:scale-95"><Wrench className="w-4 h-4" /> SYSTEM MAINTENANCE RESET</button>
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* Digital Twin & High Level Stats */}
                  <div className="lg:col-span-4 space-y-8">
                      <div className="bg-slate-900/40 border border-white/10 rounded-[2rem] p-8 shadow-2xl backdrop-blur-xl">
                         <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2"><PieChart className="w-4 h-4 text-emerald-400" /> Digital Twin Overlay</h3>
                         <AdvancedDigitalTwin healthIndex={currentData.healthIndex} failureType={currentData.failureType} />
                         <div className="mt-8 grid grid-cols-1 gap-4">
                            <div className="bg-slate-950/40 p-5 rounded-2xl border border-white/5 flex items-center justify-between">
                               <div><p className="text-[10px] text-slate-600 font-black uppercase">Estimated RUL</p><p className="text-2xl font-black tracking-tight text-white">{Math.round(currentData.rul)} <span className="text-[10px] font-bold text-slate-500">steps left</span></p></div>
                               <Clock className="w-10 h-10 text-slate-800 opacity-20" />
                            </div>
                            <div className="bg-slate-950/40 p-5 rounded-2xl border border-white/5 flex items-center justify-between">
                               <div><p className="text-[10px] text-slate-600 font-black uppercase">Projectative Risk</p><p className="text-2xl font-black tracking-tight text-rose-500">${currentData.cost.toFixed(2)}</p></div>
                               <DollarSign className="w-10 h-10 text-rose-900 opacity-20" />
                            </div>
                         </div>
                      </div>
                  </div>

                  {/* Multi-Dimensional Charts Panel */}
                  <div className="lg:col-span-8 space-y-8">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <MetricChart title="Process Temperature" data={currentData.chartData} dataKey="temperature" color="#fb923c" unit="K" gradientId="gradT" />
                        <MetricChart title="Calculated Torque" data={currentData.chartData} dataKey="torque" color="#3b82f6" unit="Nm" gradientId="gradQ" />
                        <MetricChart title="Rotational Velocity" data={currentData.chartData} dataKey="rpm" color="#8b5cf6" unit="RPM" gradientId="gradR" />
                        <MetricChart title="Integrated Tool Wear" data={currentData.chartData} dataKey="toolWear" color="#10b981" unit="min" gradientId="gradW" />
                     </div>

                     {/* Diagnostics Analysis Section */}
                     <div className="bg-slate-900/40 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none grayscale"><Box className="w-48 h-48 text-white" /></div>
                         <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 mb-10">
                            <div><h2 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3"><Database className="w-6 h-6 text-blue-500" /> ML Diagnostics Logic</h2><p className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-widest italic">Core Inference System</p></div>
                            <button onClick={handleExplain} disabled={explaining} className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl transition-all disabled:opacity-50">
                               {explaining ? 'SYNCHRONIZING REASONER...' : 'DEDUCE ROOT CAUSE'}
                            </button>
                         </div>

                         <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                            <div className="xl:col-span-1 space-y-6">
                               <div className={`p-6 rounded-[2rem] border relative overflow-hidden transition-all ${currentData.urgency <= 2 ? 'bg-emerald-600/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-600/10 border-rose-500/30 text-rose-500'}`}>
                                  <div className="absolute -right-4 -bottom-4 opacity-10"><Wrench className="w-24 h-24" /></div>
                                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-3 underline">Technician Suggestion</p>
                                  <p className="text-lg font-black tracking-tight leading-tight uppercase">{currentData.suggestion}</p>
                               </div>
                               <div className="grid grid-cols-2 gap-4">
                                  <div className="bg-slate-950/40 p-4 rounded-2xl border border-white/5"><p className="text-[9px] text-slate-500 font-bold mb-1 uppercase tracking-wider">AI Anomaly</p><p className={`text-xl font-black font-mono transition-colors ${currentData.anomalyScore > 0.3 ? 'text-rose-500' : 'text-blue-500'}`}>{(currentData.anomalyScore * 100).toFixed(1)}%</p></div>
                                  <div className="bg-slate-950/40 p-4 rounded-2xl border border-white/5"><p className="text-[9px] text-slate-500 font-bold mb-1 uppercase tracking-wider">Fail Confidence</p><p className={`text-xl font-black font-mono transition-colors ${currentData.failureProb > 0.5 ? 'text-rose-500' : 'text-emerald-500'}`}>{(currentData.failureProb * 100).toFixed(1)}%</p></div>
                               </div>
                            </div>
                            <div className="xl:col-span-2 bg-slate-950/30 rounded-3xl p-6 border border-white/5">
                               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2"><PieChart className="w-3 h-3 text-blue-500" /> Neural Feature Attribution (SHAP Model)</p>
                               <ExplanationChart explanationData={explanationData} />
                            </div>
                         </div>
                     </div>
                  </div>

               </div>
            </div>
          )}
        </main>
      </div>

      <style>{`
        @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        .animate-marquee { display: inline-block; animation: marquee 35s linear infinite; }
        .pause { animation-play-state: paused; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
      `}</style>
    </div>
  );
}

export default App;
