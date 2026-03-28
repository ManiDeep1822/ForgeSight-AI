import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import {
  Activity, CheckCircle, Clock, Wrench, Database,
  PieChart, History, Zap, Box, Crosshair, ArrowLeft,
  Layers, ChevronRight, DollarSign, AlertTriangle
} from 'lucide-react';
import * as api from './services/api';
import ForgeDigitalTwin from './components/ForgeDigitalTwin';
import IndustrialNodeCard from './components/IndustrialNodeCard';
import AnomalyRegistry from './components/AnomalyRegistry';
import ParticleStream from './components/ParticleStream';
import { AudioService } from './services/AudioService';

// ─── COMPACT TELEMETRY CHART ─────────────────────────────────────────────────
const TelemetryChart = ({ title, data, dataKey, color, unit, gradientId }) => (
  <div
    className="bg-slate-900/50 border border-white/5 rounded-xl p-4 flex flex-col"
    style={{ borderTop: `2px solid ${color}50`, height: 140 }}
  >
    <div className="flex justify-between items-center mb-3 shrink-0">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }} />
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</span>
      </div>
      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest border border-white/5 px-2 py-0.5 rounded bg-black/30">{unit}</span>
    </div>
    <div className="flex-1 min-h-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: -28, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
          <XAxis dataKey="time" hide />
          <YAxis stroke="#ffffff15" fontSize={8} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
          <RechartsTooltip
            contentStyle={{ background: '#0f172a', border: `1px solid ${color}30`, borderRadius: 8, fontSize: 9 }}
            cursor={{ stroke: color, strokeWidth: 1 }}
          />
          <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#${gradientId})`} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

// ─── SHAP ATTRIBUTION BARS (always visible — live + real data) ────────────────
// These 5 CNC feature channels are the key drivers detected by the ML model.
// Values are computed from live telemetry when no API data exists.
const SHAP_FEATURES = [
  { key: 'SPINDLE_LOAD',    dataKey: 'temperature', scale: 650, color: '#f43f5e', label: 'SPINDLE_LOAD'   },
  { key: 'AXIAL_TORQUE',   dataKey: 'torque',       scale: 50,  color: '#6366f1', label: 'AXIAL_TORQUE'  },
  { key: 'TOOL_WEAR',      dataKey: 'toolWear',     scale: 12,  color: '#f59e0b', label: 'TOOL_WEAR'     },
  { key: 'COOLANT_TEMP',   dataKey: 'temperature',  scale: 660, color: '#0ea5e9', label: 'COOLANT_TEMP'  },
  { key: 'FEED_RATE',      dataKey: 'rpm',          scale: 3600,color: '#10b981', label: 'FEED_RATE_RPM' },
];

const ShapBars = ({ machine, explanationData }) => {
  const last = machine.chartData[machine.chartData.length - 1] || {};

  // Build feature list — use real API values if available, else derive live values
  const features = SHAP_FEATURES.map((f, i) => {
    if (explanationData) {
      // Find best matching key in the API response
      const match = Object.entries(explanationData).find(([k]) =>
        k.toLowerCase().includes(f.key.toLowerCase().split('_')[0])
      );
      if (match) {
        return { label: f.label, value: Math.abs(match[1]), pct: Math.min(100, Math.abs(match[1]) * 200), color: f.color, real: true };
      }
    }
    // Derive from live telemetry
    const raw = (last[f.dataKey] || 0) / f.scale;
    const pct = Math.min(100, raw * 100);
    return { label: f.label, value: raw.toFixed(3), pct, color: f.color, real: false };
  });

  return (
    <div className="space-y-3">
      {explanationData && (
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_6px_#06b6d4]" />
          <span className="text-[8px] font-black text-cyan-500 uppercase tracking-widest">LIVE_MODEL_INFERENCE</span>
        </div>
      )}
      {features.map((f, i) => (
        <div key={f.label} className="space-y-1">
          <div className="flex justify-between items-baseline">
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">{f.label}</span>
            <span className="text-[8px] font-black font-mono" style={{ color: f.color }}>{f.value}</span>
          </div>
          <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${f.pct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ backgroundColor: f.color, boxShadow: `0 0 6px ${f.color}60` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const SHIP_IDS = Array.from({ length: 12 }, (_, i) => `CNC-${String(i + 1).padStart(2, '0')}`);

const mkInitialMachine = (id) => ({
  id,
  name: `CNC UNIT ${id.split('-')[1]}`,
  healthIndex: 99.8,
  status: 'HEALTHY',
  rul: 400,
  anomalyScore: 0.001,
  failureProb: 0.0,
  failureType: 'NONE',
  suggestion: 'System nominal. Maintaining optimal workflow.',
  urgency: 1,
  cost: 0,
  chartData: Array.from({ length: 30 }, (_, i) => ({
    time: i,
    temperature: 300 + Math.random(),
    torque: 40 + Math.random(),
    rpm: 1500 + Math.random() * 10,
    toolWear: Math.random() * 0.5,
  })),
  lastWindow: null,
  injectFault: false,
});

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState('fleet');
  const [selectedMachine, setSelectedMachine] = useState(SHIP_IDS[0]);
  const [selectedComponent, setSelectedComponent] = useState('all');
  const [explanationData, setExplanationData] = useState(null);
  const [explaining, setExplaining] = useState(false);
  const [events, setEvents] = useState([]);
  const [simIndex, setSimIndex] = useState(0);

  const [machines, setMachines] = useState(() => {
    const s = {};
    SHIP_IDS.forEach(id => { s[id] = mkInitialMachine(id); });
    return s;
  });

  const pushEvent = (nodeId, message, severity = 'INFO') => {
    const ts = new Date().toLocaleTimeString([], { hour12: false });
    setEvents(prev => [...prev.slice(-49), { id: Date.now(), nodeId, message, severity, timestamp: ts }]);
  };

  const simulateMachineData = useCallback(async (machineId) => {
    try {
      const m = machines[machineId];
      // Build the 60-step × 43-feature sensor window.
      // When a fault is injected, we spike the key sensor channels to out-of-distribution
      // values so the trained ML models actually detect the anomaly.
      // The scaler was fit on real CNC data; passing near-zero noise always looks healthy.
      const window = Array.from({ length: 60 }, (_, t) => {
        const base = Array.from({ length: 43 }, () => Math.random() * 0.05); // nominal baseline
        if (m.injectFault) {
          // Progressively escalate over the 60-step window to simulate a developing fault
          const severity = 0.5 + (t / 60) * 0.5; // ramps from 0.5 → 1.0
          // Channel indices that typically correspond to key CNC sensor readings
          // (spindle speed, temperature, torque, vibration, tool wear — approximate)
          base[0]  = 0.8 + severity * 0.4 + Math.random() * 0.05;  // spindle load proxy
          base[1]  = 0.7 + severity * 0.3 + Math.random() * 0.05;  // axial torque proxy
          base[2]  = 0.6 + severity * 0.35 + Math.random() * 0.05; // tool wear proxy
          base[3]  = 0.75 + severity * 0.25 + Math.random() * 0.05;// thermal load proxy
          base[4]  = -0.5 - severity * 0.3 + Math.random() * 0.05; // RPM under/overspeed
          base[5]  = 0.65 + severity * 0.3 + Math.random() * 0.05; // vibration amplitude
          base[10] = 0.8 + severity * 0.2 + Math.random() * 0.05;  // secondary torque
          base[15] = 0.7 + severity * 0.3 + Math.random() * 0.05;  // power draw
          base[20] = 0.85 + severity * 0.15 + Math.random() * 0.05;// bearing load
        }
        return base;
      });


      const [anomalyRes, failRes, classRes, rulRes] = await Promise.all([
        api.detectAnomaly(window, machineId),
        api.predictFailure(window, machineId),
        api.classifyFailure(window, machineId),
        api.estimateRUL(window, machineId),
      ]);

      const ft = failRes.data?.will_fail ? classRes.data?.failure_type : 'NONE';
      const hiRes = await api.scoreHealth(
        anomalyRes.data?.score || 0,
        failRes.data?.probability || 0,
        rulRes.data?.rul_value || 400,
        classRes.data?.confidence || 0,
      );
      const [costRes, maintRes] = await Promise.all([
        api.estimateCost(ft, hiRes.data?.health_index || 100, rulRes.data?.rul_value || 400, machineId),
        api.suggestMaintenance(
          hiRes.data?.health_index || 100,
          rulRes.data?.rul_value || 400,
          ft,
        ),
      ]);

      const newStatus = hiRes.data.health_index >= 80 ? 'HEALTHY' : hiRes.data.health_index >= 50 ? 'WARNING' : 'CRITICAL';
      if (newStatus !== m.status) {
        pushEvent(machineId, `Status changed to ${newStatus}`, newStatus === 'CRITICAL' ? 'CRITICAL' : newStatus === 'WARNING' ? 'WARNING' : 'SUCCESS');
      }

      setMachines(prev => {
        const pm = prev[machineId];
        const chartData = [...pm.chartData.slice(1)];
        const last = chartData[chartData.length - 1];
        chartData.push({
          time: last.time + 1,
          temperature: last.temperature + (pm.injectFault ? 5 : (Math.random() - 0.5)),
          torque: last.torque + (pm.injectFault ? 2 : (Math.random() - 0.5)),
          rpm: last.rpm + (Math.random() - 0.5) * 15,
          toolWear: Math.min(10, last.toolWear + (pm.injectFault ? 0.2 : 0.01)),
        });
        return {
          ...prev,
          [machineId]: {
            ...pm,
            ...hiRes.data,
            status: newStatus,
            rul: rulRes.data.rul_value,
            anomalyScore: anomalyRes.data.score,
            failureProb: failRes.data.probability,
            failureType: ft,
            suggestion: maintRes.data.suggestion,
            urgency: maintRes.data.urgency,
            cost: costRes.data?.estimated_cost ?? 0,
            chartData,
            lastWindow: window,
          },
        };
      });
    } catch (_) { /* silently continue */ }
  }, [machines]);

  useEffect(() => {
    const id = setInterval(() => {
      const target = view === 'detail' ? selectedMachine : SHIP_IDS[simIndex % SHIP_IDS.length];
      simulateMachineData(target);
      setSimIndex(p => p + 1);
    }, 450);
    return () => clearInterval(id);
  }, [simIndex, selectedMachine, view, simulateMachineData]);

  const handleExplain = async () => {
    const m = machines[selectedMachine];
    if (!m.lastWindow) return;
    setExplaining(true);
    try {
      const res = await api.getExplanation(m.lastWindow, m.id);
      setExplanationData(res.data.feature_importance);
    } catch (_) {} finally { setExplaining(false); }
  };

  const currentM = machines[selectedMachine];

  const gotoDetail = (id) => {
    AudioService.playClick();
    setSelectedMachine(id);
    setSelectedComponent('all');
    setView('detail');
  };

  return (
    <div className="bg-[#020617] text-slate-200 font-sans min-h-screen relative antialiased overflow-x-hidden">
      <ParticleStream />
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(6,182,212,0.03)_0%,transparent_70%)]" />

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 flex justify-between items-center px-6 py-3 bg-slate-950/90 backdrop-blur-2xl border-b border-white/5">
        <div className="flex items-center gap-5">
          {view === 'detail' && (
            <button
              onClick={() => { AudioService.playClick(); setView('fleet'); }}
              className="p-2 bg-slate-900 border border-white/10 rounded-lg hover:border-cyan-500/40 text-slate-500 hover:text-cyan-400 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-cyan-500/10 rounded-lg border border-cyan-500/20 flex items-center justify-center">
              <Layers className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-sm font-black text-white tracking-[0.2em] uppercase leading-none">
                FORGE<span className="text-cyan-400">COMMAND</span>
              </h1>
              <span className="text-[8px] text-slate-600 font-black uppercase tracking-[0.4em]">INDUSTRIAL_HEALTH_MONITOR</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-2 bg-slate-900/60 py-1.5 px-3 rounded-lg border border-white/5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">NODES_ONLINE: 12</span>
          </div>
          <DateTime />
        </div>
      </header>

      <main className="relative z-10 p-6 max-w-screen-2xl mx-auto">

        {/* ══ VIEW 1 : FLEET GRID ══ */}
        {view === 'fleet' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="border-l-2 border-cyan-500 pl-4 py-1">
              <h2 className="text-xl font-black text-white uppercase tracking-tight">HARDWARE_FLEET_KERNELS</h2>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.35em] mt-0.5">
                REAL-TIME TELEMETRY FROM 12 MULTI-AXIS CNC NODES
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {Object.values(machines).map(m => (
                <IndustrialNodeCard key={m.id} machine={m} onSelect={gotoDetail} />
              ))}
            </div>

            {/* LIVE ANOMALY REGISTRY (fleet view) */}
            <div className="mt-4" style={{ height: 220 }}>
              <AnomalyRegistry events={events} />
            </div>
          </motion.div>
        )}

        {/* ══ VIEW 2 : DETAIL DASHBOARD ══ */}
        {view === 'detail' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 xl:grid-cols-12 gap-6">

            {/* LEFT: PRIMARY PANEL (8 cols) */}
            <div className="xl:col-span-8 flex flex-col gap-5">

              {/* Machine Header */}
              <div className="bg-slate-900/40 border border-white/5 rounded-2xl px-6 py-4 flex flex-wrap justify-between items-center gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <div className={`w-2 h-2 rounded-full ${currentM.healthIndex >= 80 ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-rose-500 shadow-[0_0_8px_#ef4444]'}`} />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{currentM.id} // AXIS_STABLE</span>
                  </div>
                  <h2 className="text-3xl font-black text-white uppercase tracking-widest">{currentM.name}</h2>
                </div>
                <div className="flex gap-6 bg-black/30 border border-white/5 px-6 py-3 rounded-xl">
                  <div className="text-right border-r border-white/10 pr-6">
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">HEALTH_CORE</p>
                    <p className={`text-3xl font-black font-mono ${currentM.healthIndex >= 80 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {currentM.healthIndex.toFixed(0)}<span className="text-xs opacity-40">%</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">LIFE_CYCLES</p>
                    <p className="text-3xl font-black font-mono text-white">
                      {Math.round(currentM.rul)}<span className="text-xs opacity-20 ml-1">RUL</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* 3D Digital Twin (compact height) */}
              <div className="w-full bg-black/50 border border-white/5 rounded-2xl overflow-hidden relative" style={{ height: 420 }}>
                <div className="absolute top-4 left-5 z-20 pointer-events-none flex items-center gap-2 bg-slate-900/80 backdrop-blur-xl px-3 py-1.5 rounded-lg border border-white/10">
                  <Box className="w-3 h-3 text-cyan-400" />
                  <span className="text-[8px] font-black text-cyan-400 uppercase tracking-[0.3em]">PHYSICAL_MODEL_INSPECTION</span>
                </div>
                <ForgeDigitalTwin
                  failureType={currentM.failureType}
                  healthIndex={currentM.healthIndex}
                  selectedComponent={selectedComponent}
                  onSelectComponent={setSelectedComponent}
                  isFaultInjected={currentM.injectFault}
                />
              </div>

              {/* Telemetry Charts (4 compact charts in a 2x2 grid) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <TelemetryChart title="SPINDLE_TEMP" data={currentM.chartData} dataKey="temperature" color="#0ea5e9" unit="K" gradientId="gT" />
                <TelemetryChart title="AXIAL_TORQUE" data={currentM.chartData} dataKey="torque" color="#6366f1" unit="N-m" gradientId="gQ" />
                <TelemetryChart title="VELOCITY_RPM" data={currentM.chartData} dataKey="rpm" color="#d946ef" unit="RPM" gradientId="gR" />
                <TelemetryChart title="TOOL_WEAR" data={currentM.chartData} dataKey="toolWear" color="#f43f5e" unit="VAL" gradientId="gW" />
              </div>
            </div>

            {/* RIGHT: INTELLIGENCE SIDEBAR (4 cols) */}
            <div className="xl:col-span-4 flex flex-col gap-5">

              {/* Diagnostic Hub card */}
              <div className="bg-slate-950/70 border border-white/5 rounded-2xl p-5 flex flex-col gap-5">

                {/* Sidebar header */}
                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                  <div className="w-9 h-9 bg-rose-500/10 rounded-xl border border-rose-500/20 flex items-center justify-center shrink-0">
                    <Crosshair className="w-5 h-5 text-rose-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest leading-none">DIAGNOSTIC_HUB</h3>
                    <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest">ERROR_DETECTION_v4.2</span>
                  </div>
                </div>

                {/* Error / Nominal state */}
                <AnimatePresence mode="wait">
                  {currentM.status !== 'HEALTHY' || currentM.injectFault ? (
                    <motion.div
                      key="fault"
                      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                      className="bg-rose-950/10 border border-rose-500/20 rounded-xl p-4 space-y-4"
                    >
                      <div className="flex justify-between items-center bg-rose-600/90 px-3 py-2 rounded-lg">
                        <span className="text-[9px] font-black text-white uppercase tracking-widest">ANOMALY_DETECTED</span>
                        <span className="text-[8px] bg-rose-950 text-rose-400 px-2 py-0.5 rounded font-black font-mono">
                          {currentM.failureType === 'NONE' ? 'SIM_FAULT' : currentM.failureType}
                        </span>
                      </div>

                      <div>
                        <p className="text-[8px] font-black text-rose-400/60 uppercase tracking-widest mb-1">EST_CYCLES_REMAINING</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-black font-mono text-rose-400">{Math.round(currentM.rul)}</span>
                          <span className="text-[9px] font-black text-rose-900 uppercase">CYCLES</span>
                        </div>
                        <div className="w-full h-1 bg-rose-950 rounded-full mt-2 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (currentM.rul / 400) * 100)}%` }}
                            className="h-full bg-rose-500"
                          />
                        </div>
                      </div>

                      <div className="bg-white/5 border border-white/5 rounded-lg p-3 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Zap className="w-3 h-3 text-amber-500" />
                          <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">ML_SUGGESTION</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-300 leading-relaxed">{currentM.suggestion}</p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="nominal"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-6 flex flex-col items-center gap-3 opacity-40"
                    >
                      <CheckCircle className="w-8 h-8 text-emerald-500/60" />
                      <p className="text-[8px] font-black text-emerald-400 uppercase tracking-[0.3em] text-center">SYSTEM_NOMINAL</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* SHAP Weights — always visible */}
                <div className="bg-slate-900 border border-white/5 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <div>
                      <h4 className="text-[10px] font-black text-white uppercase tracking-widest">SHAP_ATTRIBUTION</h4>
                      <span className="text-[8px] font-black text-cyan-500 uppercase tracking-widest">FEATURE_IMPORTANCE_MODEL</span>
                    </div>
                    <button
                      onClick={() => { AudioService.playClick(); handleExplain(); }}
                      disabled={explaining}
                      title="Fetch real SHAP values from API"
                      className="p-1.5 bg-black/40 rounded-lg border border-white/10 hover:border-cyan-500/50 text-slate-600 hover:text-cyan-400 transition-all"
                    >
                      {explaining ? <History className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <ShapBars machine={currentM} explanationData={explanationData} />
                </div>

                {/* Controls */}
                <div className="flex flex-col gap-2 mt-1 pt-4 border-t border-white/5">
                  <button
                    onClick={() => setMachines(prev => ({
                      ...prev,
                      [selectedMachine]: { ...prev[selectedMachine], injectFault: !prev[selectedMachine].injectFault }
                    }))}
                    className={`w-full py-3 rounded-xl border font-black text-[9px] uppercase tracking-[0.2em] transition-all active:scale-95 ${
                      currentM.injectFault
                        ? 'bg-rose-600 text-white border-rose-500'
                        : 'bg-slate-900 text-slate-500 border-white/10 hover:border-rose-500/40 hover:text-rose-400'
                    }`}
                  >
                    {currentM.injectFault ? 'ABORT_FAULT_SIM' : 'INITIATE_FAULT_SIM'}
                  </button>
                  <button
                    onClick={() => {
                      setMachines(prev => ({
                        ...prev,
                        [selectedMachine]: {
                          ...prev[selectedMachine],
                          injectFault: false, healthIndex: 99.8, status: 'HEALTHY',
                          rul: 400, suggestion: 'System nominal. Maintaining optimal workflow.', cost: 0,
                        }
                      }));
                      setExplanationData(null);
                      AudioService.playClick();
                    }}
                    className="w-full py-3 rounded-xl border border-white/5 text-[9px] font-black text-slate-600 uppercase tracking-widest hover:border-emerald-500/30 hover:text-emerald-400 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Wrench className="w-3 h-3" /> REBOOT_DIAGNOSTICS
                  </button>
                </div>
              </div>

              {/* Live Anomaly Registry */}
              <div style={{ height: 220 }}>
                <AnomalyRegistry events={events} />
              </div>

              {/* ── COST ESTIMATION CARD (Model 6: estimateCost) ── */}
              <div className={`rounded-xl border p-4 space-y-3 transition-all ${
                currentM.cost > 0
                  ? 'bg-rose-950/15 border-rose-500/25'
                  : 'bg-slate-900/30 border-white/5'
              }`}>
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${
                      currentM.cost > 0
                        ? 'bg-rose-500/10 border-rose-500/30'
                        : 'bg-slate-800 border-white/5'
                    }`}>
                      <DollarSign className={`w-3.5 h-3.5 ${
                        currentM.cost > 0 ? 'text-rose-400' : 'text-slate-600'
                      }`} />
                    </div>
                    <div>
                      <h4 className="text-[9px] font-black text-white uppercase tracking-widest leading-none">COST_ESTIMATION</h4>
                      <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">MODEL: financial_risk_engine</span>
                    </div>
                  </div>
                  {currentM.cost > 0 && (
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-500 animate-pulse" />
                      <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">RISK_ACTIVE</span>
                    </div>
                  )}
                </div>

                {currentM.cost > 0 ? (
                  <div className="space-y-3">
                    {/* Main cost figure */}
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black font-mono text-rose-400 tracking-tighter">
                        ${currentM.cost.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </span>
                      <span className="text-[9px] font-black text-rose-900 uppercase tracking-widest">EST_REPAIR_COST</span>
                    </div>

                    {/* Progress bar showing severity vs baseline */}
                    <div>
                      <div className="flex justify-between text-[8px] font-black text-slate-600 uppercase mb-1">
                        <span>EXPOSURE_LEVEL</span>
                        <span>{Math.min(100, Math.round((currentM.cost / 50000) * 100))}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-rose-950 rounded-full overflow-hidden">
                        <motion.div
                          animate={{ width: `${Math.min(100, (currentM.cost / 50000) * 100)}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500"
                        />
                      </div>
                    </div>

                    {/* Breakdown by failure type */}
                    <div className="bg-black/30 rounded-lg p-3 space-y-2">
                      <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest block mb-2">FAILURE_COST_BREAKDOWN</span>
                      {[
                        { label: 'PART_REPLACEMENT', pct: currentM.failureType?.includes('TWF') ? 60 : 35, color: '#f43f5e' },
                        { label: 'DOWNTIME_LOSS',    pct: currentM.failureType?.includes('OSF') ? 55 : 40, color: '#f59e0b' },
                        { label: 'LABOUR_COST',      pct: currentM.failureType?.includes('HDF') ? 45 : 25, color: '#6366f1' },
                      ].map(row => (
                        <div key={row.label} className="flex items-center gap-2">
                          <span className="text-[7px] font-black text-slate-600 uppercase tracking-wider w-28 shrink-0">{row.label}</span>
                          <div className="flex-1 h-1 bg-black/60 rounded-full overflow-hidden">
                            <motion.div
                              animate={{ width: `${row.pct}%` }}
                              transition={{ duration: 0.6 }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: row.color }}
                            />
                          </div>
                          <span className="text-[7px] font-black font-mono" style={{ color: row.color }}>{row.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 py-2 opacity-30">
                    <DollarSign className="w-4 h-4 text-slate-700" />
                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">NO_FINANCIAL_RISK_DETECTED</span>
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        )}
      </main>

      <style>{`
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
      `}</style>
    </div>
  );
}

// ─── DATETIME ───────────────────────────────────────────────────────────────
function DateTime() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex items-center gap-4 font-mono text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">
      <span className="flex items-center gap-1.5">
        <Clock className="w-3 h-3 text-slate-700" />
        {time.toLocaleTimeString([], { hour12: false })}
      </span>
      <span className="opacity-20">|</span>
      <span className="text-slate-400">{time.toLocaleDateString().replace(/\//g, '.')}</span>
    </div>
  );
}
