import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, Shield } from 'lucide-react';

const AnomalyRegistry = ({ events }) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'CRITICAL': return <AlertCircle className="w-4 h-4 text-rose-500" />;
      case 'WARNING': return <Shield className="w-4 h-4 text-amber-500" />;
      case 'SUCCESS': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      default: return <Info className="w-4 h-4 text-cyan-500" />;
    }
  };

  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-rose-500/10 border-rose-500/20 text-rose-200';
      case 'WARNING': return 'bg-amber-500/10 border-amber-500/20 text-amber-200';
      case 'SUCCESS': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200';
      default: return 'bg-slate-800/40 border-white/5 text-slate-300';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/40 rounded-[2rem] border border-white/5 overflow-hidden">
      <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
        <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">System_Event_Registry</h3>
        <span className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-[9px] font-black text-cyan-400 uppercase tracking-widest">Live_Feed</span>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-none"
        style={{ scrollBehavior: 'smooth' }}
      >
        <AnimatePresence initial={false}>
          {events.map((event, i) => (
            <motion.div
              key={event.id || i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`p-4 rounded-xl border flex items-start gap-4 ${getSeverityStyle(event.severity)} shadow-sm transition-all hover:border-white/20 hover:bg-white/5`}
            >
              <div className="mt-1 shrink-0">{getSeverityIcon(event.severity)}</div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-black uppercase tracking-widest">{event.nodeId || 'GLOBAL'}</span>
                  <span className="text-[9px] font-mono opacity-40">{event.timestamp}</span>
                </div>
                <p className="text-[11px] font-bold leading-relaxed tracking-tight">{event.message}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {events.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center py-20 opacity-20">
            <Info className="w-10 h-10 mb-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">No Log Entries Found</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnomalyRegistry;
