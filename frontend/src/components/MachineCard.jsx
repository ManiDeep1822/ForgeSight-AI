import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import { Cpu, Activity, Zap, Clock, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as api from '../services/api';
import * as sim from '../services/SimulationService';

export const MachineCard = memo(({ machineId, isSelected, onSelect, command }) => {
    const [data, setData] = useState({
        healthIndex: 98.2,
        status: 'Healthy',
        failureProb: 0.0,
        anomalyScore: 0.005,
        failureType: 'None',
        suggestion: 'System Nominal',
        cost: 0,
        rul: 200,
        injectFault: false,
        metrics: {
            temperature: 300,
            torque: 40,
            wear: 0,
            rpm: 12000
        }
    });

    const [metricHistory, setMetricHistory] = useState(() => {
        const now = Date.now();
        return Array.from({ length: 50 }, (_, i) => ({
            time: now - (50 - i) * 2000,
            health: 98.2,
            failure: 0,
            temperature: 300 + Math.random(),
            torque: 40 + Math.random(),
            wear: 0,
            rpm: 12000 + Math.random() * 10
        }));
    });

    const lastCommandTime = useRef(0);
    const isUpdating = useRef(false);

    const updateSimulation = useCallback(async (manual = false, overrideData = null) => {
        if (isUpdating.current && !manual) return; // Prevent interval overlap
        isUpdating.current = true;

        try {
            const currentData = overrideData || data;
            const window = currentData.injectFault 
                ? sim.generateAnomalousWindow(60, 1.0) 
                : sim.generateWindow(60);
            
            const lastFeatures = window[window.length - 1];
            const currentMetrics = {
                temperature: 300 + lastFeatures[0] * 50,
                torque: lastFeatures[1] * 100,
                wear: lastFeatures[2] * 200,
                rpm: 10000 + lastFeatures[3] * 5000
            };

            // Run all diagnostic models in parallel for performance
            const [anomaly, failure, classification, rul] = await Promise.all([
                api.detectAnomaly(window, machineId),
                api.predictFailure(window, machineId),
                api.classifyFailure(window, machineId),
                api.estimateRUL(window, machineId)
            ]);

            const ft = failure.data?.will_fail ? classification.data?.failure_type : 'None';
            
            // Secondary parallel batch for high-level business logic
            const [health, cost] = await Promise.all([
                api.scoreHealth(
                    anomaly.data?.score || 0, 
                    failure.data?.probability || 0, 
                    rul.data?.rul_value || 200, 
                    classification.data?.confidence || 0
                ),
                api.estimateCost(
                    ft,
                    currentData.healthIndex,
                    rul.data?.rul_value || 200,
                    machineId
                )
            ]);

            // Re-calculate maintenance with actual health
            const finalMaint = await api.suggestMaintenance(health.data.health_index, rul.data?.rul_value || 200, ft);

            const newPoint = {
                time: Date.now(),
                health: health.data.health_index,
                failure: failure.data.probability,
                ...currentMetrics
            };
            
            const nextHistory = [...metricHistory.slice(-49), newPoint];
            const updated = {
                ...currentData,
                ...health.data,
                healthIndex: health.data.health_index,
                status: health.data.status,
                suggestion: finalMaint.data.suggestion,
                cost: cost.data?.estimated_cost || 0,
                anomalyScore: anomaly.data?.score,
                failureProb: failure.data?.probability,
                failureType: ft,
                rul: rul.data?.rul_value,
                lastWindow: window,
                metrics: currentMetrics,
                injectFault: currentData.injectFault
            };

            // UPDATE STATES SEQUENTIALLY (NOT NESTED)
            setData(updated);
            setMetricHistory(nextHistory);

            if (manual || isSelected) {
                onSelect(machineId, { ...updated, history: nextHistory });
            }
        } catch (e) {
            console.error("Simulation error for", machineId, e);
        } finally {
            isUpdating.current = false;
        }
    }, [machineId, data, isSelected, onSelect, metricHistory]);

    // Command Bus (Manual Override)
    useEffect(() => {
        if (!command || command.timestamp <= lastCommandTime.current) return;
        lastCommandTime.current = command.timestamp;

        if (command.type === 'SYNC') {
            const nextInjectState = !data.injectFault;
            const nextData = { ...data, injectFault: nextInjectState };
            setData(nextData);
            updateSimulation(true, nextData);
        } else if (command.type === 'RESET') {
            const resetData = {
                ...data,
                healthIndex: 98.2,
                status: 'Healthy',
                failureProb: 0.0,
                anomalyScore: 0.005,
                failureType: 'None',
                injectFault: false,
                suggestion: 'System Initialized',
                cost: 0
            };
            setData(resetData);
            // Push health update to App immediately
            onSelect(machineId, { ...resetData, history: metricHistory });
            updateSimulation(true, resetData);
        }
    }, [command, updateSimulation, data, isSelected, machineId, onSelect, metricHistory]);

    useEffect(() => {
        const interval = setInterval(() => updateSimulation(false), 2000);
        return () => clearInterval(interval);
    }, [updateSimulation]);

    const getStatusColor = (hi) => {
        if (hi >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5';
        if (hi >= 50) return 'text-amber-400 border-amber-500/30 bg-amber-500/5';
        return 'text-rose-500 border-rose-500/30 bg-rose-500/5';
    };

    return (
        <motion.button
            layout
            onClick={() => onSelect(machineId, { ...data, history: metricHistory })}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.01, backgroundColor: 'rgba(255, 255, 255, 0.02)' }}
            className={`tactical-border relative flex flex-col p-5 rounded-xl text-left transition-all duration-300 ${
                isSelected ? 'border-blue-500/50 bg-blue-500/5 animate-glow-blue' : 'bg-background-panel'
            }`}
        >
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-500/20' : 'bg-white/5'}`}>
                        <Cpu className={`w-4 h-4 ${isSelected ? 'text-blue-400' : 'text-slate-400'}`} />
                    </div>
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-tighter text-white">{machineId}</h3>
                        <p className="text-[10px] font-mono text-slate-500 uppercase">SYS_ACTIVE_1102</p>
                    </div>
                </div>
                {data.healthIndex < 50 && (
                    <div className="animate-pulse"><ShieldAlert className="w-4 h-4 text-rose-500" /></div>
                )}
            </div>

            <div className="flex-1 space-y-3">
                <div className="flex justify-between items-end">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Health Ind.</span>
                    <span className={`text-2xl font-black font-mono leading-none ${data.healthIndex < 50 ? 'text-rose-500' : 'text-emerald-400'}`}>
                        {data.healthIndex.toFixed(1)}%
                    </span>
                </div>
                
                <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${data.healthIndex}%` }}
                        className={`h-full ${data.healthIndex >= 80 ? 'bg-emerald-500' : data.healthIndex >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                    />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                    <div>
                        <p className="text-[9px] text-slate-500 font-bold uppercase mb-1">Anomaly %</p>
                        <p className="text-xs font-black font-mono text-slate-300">{(data.anomalyScore * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                        <p className="text-[9px] text-slate-500 font-bold uppercase mb-1">Fail Prob.</p>
                        <p className="text-xs font-black font-mono text-slate-300">{(data.failureProb * 100).toFixed(1)}%</p>
                    </div>
                </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                <div className={`px-2 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-widest ${getStatusColor(data.healthIndex)}`}>
                    {data.status}
                </div>
                <div className="flex items-center gap-2">
                    {data.injectFault && <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
                    <span className="text-[9px] font-mono text-slate-600 uppercase">RUL: {data.rul.toFixed(0)}</span>
                </div>
            </div>
        </motion.button>
    );
});
