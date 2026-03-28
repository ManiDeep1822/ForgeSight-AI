import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Zap, Activity, BarChart } from 'lucide-react';

const ConfidenceRing = ({ value, label, accentColor }) => {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-20 h-20 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="40" cy="40" r={radius} stroke="rgba(255,255,255,0.05)" strokeWidth="4" fill="transparent" />
          <motion.circle 
            cx="40" cy="40" r={radius} 
            stroke={accentColor} 
            strokeWidth="4" 
            fill="transparent" 
            strokeDasharray={circumference} 
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        <span className="absolute text-[14px] font-black text-white font-mono">{Math.round(value)}%</span>
      </div>
      <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] text-center w-24">{label}</span>
    </div>
  );
};

const MLCycleIntelligence = ({ metrics }) => {
  const features = [
    { name: 'Hold_Pressure', impact: 0.82, color: 'bg-blue-500' },
    { name: 'Cooling_Time', impact: 0.64, color: 'bg-cyan-500' },
    { name: 'Melt_Temp', impact: 0.45, color: 'bg-orange-500' },
    { name: 'Screw_Speed', impact: 0.28, color: 'bg-indigo-500' },
  ];

  return (
    <div className="bg-slate-900/40 backdrop-blur-2xl rounded-[3rem] p-10 flex flex-col gap-10 border border-white/5 relative overflow-hidden group shadow-2xl">
      <div className="absolute inset-0 bg-blue-500/[0.02] pointer-events-none group-hover:bg-blue-500/[0.04] transition-all duration-1000" />
      
      <div className="flex justify-between items-end relative z-10">
        <div>
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mb-2 flex items-center gap-3">
             <Brain className="w-4 h-4 text-blue-500 shadow-glow-blue" /> Inference_Engine
          </h3>
          <p className="text-3xl font-black text-white tracking-widest uppercase italic">Quality_Predictor</p>
        </div>
        <div className="px-5 py-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] animate-pulse">
           Model_Confidence: HIGH
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
         {/* Predictors */}
         <div className="space-y-8 bg-black/20 p-8 rounded-3xl border border-white/5">
            <div className="flex justify-between items-center mb-4">
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Defect_Risk_Surface</span>
            </div>
            
            <div className="space-y-6">
               <div className="space-y-3 group/item cursor-pointer">
                  <div className="flex justify-between text-[10px] font-black text-slate-300 uppercase tracking-widest">
                     <span className="flex items-center gap-2"><Zap className="w-3 h-3 text-orange-500" /> Short_Shot_Risk</span>
                     <span className="text-white font-mono">0.02%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5 group-hover/item:border-orange-500/30 transition-all">
                     <motion.div initial={{ width: 0 }} animate={{ width: '2%' }} className="h-full bg-orange-500 shadow-glow-red" />
                  </div>
               </div>

               <div className="space-y-3 group/item cursor-pointer">
                  <div className="flex justify-between text-[10px] font-black text-slate-300 uppercase tracking-widest">
                     <span className="flex items-center gap-2"><Activity className="w-3 h-3 text-cyan-500" /> Flash_Overflow_Risk</span>
                     <span className="text-white font-mono">0.14%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5 group-hover/item:border-cyan-500/30 transition-all">
                     <motion.div initial={{ width: 0 }} animate={{ width: '14%' }} className="h-full bg-cyan-500 shadow-glow-blue" />
                  </div>
               </div>
            </div>
         </div>

         {/* SHAP Feature Importance */}
         <div className="space-y-8 bg-black/20 p-8 rounded-3xl border border-white/5">
            <div className="flex items-center gap-3 mb-4">
               <BarChart className="w-4 h-4 text-indigo-500" />
               <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Feature_Influence_Weights</h4>
            </div>
            <div className="space-y-4">
               {features.map((f, i) => (
                  <div key={f.name} className="space-y-2">
                     <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">
                        <span>{f.name}</span>
                        <span>{Math.round(f.impact * 100)}%</span>
                     </div>
                     <div className="w-full h-1 bg-white/[0.05] rounded-full overflow-hidden">
                        <motion.div 
                          className={`h-full ${f.color} opacity-80 shadow-glow`} 
                          initial={{ width: 0 }} 
                          animate={{ width: `${f.impact * 100}%` }} 
                          transition={{ delay: i * 0.1, duration: 1 }}
                        />
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </div>

      <div className="flex justify-around items-center pt-6 border-t border-white/5 relative z-10">
         <ConfidenceRing value={99.4} label="Predictive Accuracy" accentColor="#10b981" />
         <ConfidenceRing value={88.2} label="Process Stability" accentColor="#3b82f6" />
         <ConfidenceRing value={94.7} label="Hardware Fidelity" accentColor="#a855f7" />
      </div>
    </div>
  );
};

export default MLCycleIntelligence;
