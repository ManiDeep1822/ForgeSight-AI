import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, ShieldAlert, Lock, Unlock, Globe, Terminal, 
  Cpu, Server, Database, Activity, Zap, RefreshCw, Eye
} from 'lucide-react';

const CyberSecurityView = ({ machines, alerts }) => {
  const [idsLogs, setIdsLogs] = useState([
    { id: 1, time: '13:04:12', event: 'ENCRYPTION_TUNNEL_ESTABLISHED', source: 'GW-04', level: 'info' },
    { id: 2, time: '13:05:44', event: 'SPOOFING_MISMATCH_BLOCKED', source: 'CNC-02', level: 'warning' },
    { id: 3, time: '13:06:01', event: 'FIRMWARE_SHA256_VERIFIED', source: 'CNC-08', level: 'success' },
    { id: 4, time: '13:08:22', event: 'PACKET_INTEGRITY_CHECK_PASS', source: 'UNIT_CLUSTER', level: 'info' },
    { id: 5, time: '13:09:12', event: 'RE_KEYING_PROTOCOL_INIT', source: 'FLEET_SYS', level: 'warning' }
  ]);

  const [scanning, setScanning] = useState(false);

  // Simulated live security feed
  useEffect(() => {
    const interval = setInterval(() => {
      const events = [
        'TLS_HANDSHAKE_COMPLETE', 'SECURE_CHANNEL_READY', 'AUTH_TOKEN_ROTATED', 
        'IP_RESTRICTION_TRIGGERED', 'DATA_INTEGRITY_MISMATCH', 'HEARTBEAT_TIMEOUT'
      ];
      const levels = ['info', 'info', 'success', 'warning', 'warning', 'critical'];
      const idx = Math.floor(Math.random() * events.length);
      
      setIdsLogs(prev => [
        { 
          id: Date.now(), 
          time: new Date().toLocaleTimeString(), 
          event: events[idx], 
          source: `CNC-${Math.floor(Math.random() * 12) + 1}`, 
          level: levels[idx] 
        },
        ...prev.slice(0, 14)
      ]);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const securityStats = useMemo(() => {
    return {
      firewallHealth: 99.4,
      encryptionLoad: '32%',
      activeThreats: alerts.filter(a => a.status === 'critical').length,
      resilienceFactor: 0.982
    };
  }, [alerts]);

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      {/* Security KPIs Overlay */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
        {[
          { label: 'Firewall_Efficiency', val: `${securityStats.firewallHealth}%`, icon: ShieldCheck, color: 'text-emerald-400' },
          { label: 'Active_Sec_Tunnels', val: '12 / 12', icon: Lock, color: 'text-blue-400' },
          { label: 'Threat_Vector_Load', val: securityStats.activeThreats, icon: ShieldAlert, color: 'text-rose-500' },
          { label: 'Network_Fidelity', val: 'HIGH', icon: Activity, color: 'text-cyan-400' }
        ].map((kpi, i) => (
          <div key={i} className="tactical-border bg-slate-900/40 backdrop-blur-3xl p-10 rounded-[2.5rem] shadow-3xl hover:border-blue-500/30 transition-all group">
            <div className="flex justify-between items-center mb-6">
              <kpi.icon className={`w-10 h-10 ${kpi.color} opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500`} />
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            </div>
            <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.4em] mb-2">{kpi.label}</p>
            <p className={`text-5xl font-black tracking-tighter ${kpi.color}`}>{kpi.val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Resilience Matrix Visualizer */}
        <div className="lg:col-span-7 space-y-12">
          <div className="tactical-border bg-black/40 rounded-[4rem] p-12 shadow-3xl backdrop-blur-3xl relative overflow-hidden group min-h-[500px]">
             <div className="absolute inset-0 bg-blue-600/[0.03] pointer-events-none group-hover:bg-blue-600/[0.06] transition-all duration-700" />
             <div className="hud-scanline opacity-[0.05]" />
             
             <div className="flex justify-between items-center mb-16 relative z-10">
                <div>
                   <h3 className="text-[12px] font-black text-slate-600 uppercase tracking-[0.5em] mb-4 flex items-center gap-4">
                      <Globe className="w-6 h-6 text-cyan-500 shadow-glow-blue" /> Unit_Resilience_Matrix
                   </h3>
                   <p className="text-3xl font-black text-white tracking-tighter uppercase">Fleet_Secure_Bridge</p>
                </div>
                <button 
                  onClick={() => { setScanning(true); setTimeout(() => setScanning(false), 2000); }}
                  className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] shadow-glow-blue flex items-center gap-4 group active:scale-95 transition-all"
                >
                   {scanning ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Eye className="w-5 h-5 group-hover:scale-120" />}
                   {scanning ? 'SCANNING_NODE_INTEGRITY...' : 'FORCE_RESILIENCE_SCAN'}
                </button>
             </div>

             <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8 relative z-10 p-4">
                {Array.from({ length: 12 }).map((_, i) => {
                  const id = `CNC-${String(i+1).padStart(2, '0')}`;
                  const isScanning = scanning;
                  return (
                    <div key={i} className={`relative flex flex-col items-center justify-center p-6 rounded-[2rem] border-2 transition-all duration-700 ${isScanning ? 'border-cyan-500/50 bg-cyan-500/10 scale-95' : 'border-white/5 bg-slate-900/20'}`}>
                       <div className={`p-4 rounded-full mb-4 ${isScanning ? 'animate-pulse' : ''}`}>
                          <Lock className={`w-8 h-8 ${isScanning ? 'text-cyan-400' : 'text-slate-700'} transition-colors duration-700`} />
                       </div>
                       <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isScanning ? 'text-cyan-200 shadow-glow-blue' : 'text-slate-600'}`}>Node_{i+1}</span>
                       <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${i % 7 === 0 ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'} shadow-glow`} />
                    </div>
                  );
                })}
             </div>

             <div className="mt-16 pt-10 border-t border-white/5 flex items-center justify-between relative z-10 px-8">
                <div className="flex flex-col"><span className="text-[10px] text-slate-700 font-black tracking-widest uppercase mb-1">Bridge_Protocol</span><span className="text-[12px] text-slate-300 font-black uppercase font-mono tracking-widest">WPA3_GCM_RESERVED</span></div>
                <div className="flex flex-col items-end"><span className="text-[10px] text-slate-700 font-black tracking-widest uppercase mb-1">Packet_Fidelity</span><span className="text-[12px] text-emerald-400 font-black uppercase font-mono tracking-widest">99.98% ERR_OK</span></div>
             </div>
          </div>
        </div>

        {/* IDS Intrusion Detection System Feed */}
        <div className="lg:col-span-5 space-y-12">
           <div className="tactical-border bg-slate-950/80 rounded-[4rem] p-12 shadow-3xl border-2 border-white/10 relative overflow-hidden flex flex-col h-full max-h-[800px]">
              <div className="flex items-center gap-6 mb-12 flex-shrink-0">
                 <Terminal className="w-8 h-8 text-blue-600 shadow-glow-blue" />
                 <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none italic">IDS_Intrusion_Engine</h2>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-6 pr-4 scrollbar-tactical">
                 {idsLogs.map((log) => (
                    <div key={log.id} className="tactical-border bg-black/40 p-6 rounded-3xl border border-white/5 group hover:border-blue-500/30 transition-all flex items-start gap-6 animate-in slide-in-from-left-4 duration-500">
                       <div className={`text-[9px] font-black font-mono tracking-widest p-2 rounded-lg ${log.level === 'critical' ? 'bg-rose-600/20 text-rose-500' : log.level === 'warning' ? 'bg-amber-600/20 text-amber-500' : 'bg-blue-600/20 text-blue-400'}`}>
                          {log.time}
                       </div>
                       <div className="flex-1">
                          <p className="text-[11px] font-black text-white uppercase tracking-widest mb-1">{log.event}</p>
                          <div className="flex items-center gap-3">
                             <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest leading-none">Source:</span>
                             <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest font-mono leading-none">{log.source}</span>
                          </div>
                       </div>
                       <ShieldCheck className={`w-5 h-5 opacity-20 ${log.level === 'success' ? 'text-emerald-500 opacity-60' : ''}`} />
                    </div>
                 ))}
              </div>

              <div className="mt-12 bg-blue-600/10 p-8 rounded-[2rem] border border-blue-500/20 flex-shrink-0">
                 <div className="flex items-center gap-4 mb-4"><Zap className="w-5 h-5 text-blue-500" /><span className="text-[11px] font-black text-blue-400 tracking-[0.3em] uppercase underline decoration-blue-500/20 underline-offset-4 leading-none">Security_Directive</span></div>
                 <p className="text-[13px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">ALL_CHANNEL_NOMINAL. NO_UNEXPECTED_HEARTBEAT_LOSS. FIREWALL_ACTIVE_ISOLATION_AVAILABLE.</p>
              </div>
           </div>
        </div>
      </div>
      
      <style rx-inject>{`
        .shadow-glow { box-shadow: 0 0 15px currentColor; }
        .shadow-glow-blue { box-shadow: 0 0 25px rgba(37, 99, 235, 0.4); }
        .shadow-glow-green { box-shadow: 0 0 25px rgba(16, 185, 129, 0.4); }
        .shadow-glow-red { box-shadow: 0 0 25px rgba(220, 38, 38, 0.4); }
        .hud-scanline {
          position: absolute; top: 0; left: 0; width: 100%; height: 2px;
          background: linear-gradient(to right, transparent, rgba(37, 99, 235, 1), transparent);
          animation: scanline 8s linear infinite; pointer-events: none;
        }
        @keyframes scanline { 0% { top: -100px; } 100% { top: 1000px; } }
      `}</style>
    </div>
  );
};

export default CyberSecurityView;
