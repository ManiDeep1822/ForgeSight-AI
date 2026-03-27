/**
 * SimulationService.js
 * Generates trend-based realistic sensor data for CNC machines.
 * Models: Thermal Drift, Vibration Harmonics, and Tool Wear Progression.
 */

export const generateTrendData = (machineId, prevData) => {
  const lastPoint = prevData[prevData.length - 1] || { 
    temperature: 298.15, 
    torque: 45.0, 
    wear: 0.0, 
    vibration: 0.01,
    spindle_speed: 12000 
  };

  // Base physics parameters
  const targetTemp = 310 + (Math.random() * 5); // Ideal operating temp
  const tempStep = (targetTemp - lastPoint.temperature) * 0.05;
  const tempNoise = (Math.random() - 0.5) * 0.5;

  // Simulate Tool Wear (Progressive)
  const wearStep = 0.0001 + (Math.random() * 0.0005);
  
  // Torque varies with cut complexity (Simulated)
  const targetTorque = 40 + Math.sin(Date.now() / 2000) * 10;
  const torqueNoise = (Math.random() - 0.5) * 2;

  // Anomaly Injection (0.1% chance)
  const isAnomaly = Math.random() < 0.001;
  const anomalyMult = isAnomaly ? 5 : 1;

  const newDataPoint = {
    time: Date.now(),
    temperature: lastPoint.temperature + tempStep + tempNoise * anomalyMult,
    torque: targetTorque + torqueNoise * anomalyMult,
    wear: lastPoint.wear + wearStep,
    vibration: Math.abs(Math.sin(Date.now() / 500) * 0.05 + (Math.random() * 0.02)) * anomalyMult,
    spindle_speed: 12000 + (Math.random() - 0.5) * 100
  };

  return [...prevData.slice(1), newDataPoint];
};

export const generateWindow = (length = 60) => {
    // Generate a window of 60 x 43 features for the models
    // Features are usually: [temp, torque, wear, speed, etc... + rolling means]
    return Array.from({ length }, () => {
        const base = Array.from({ length: 43 }, () => Math.random() * 0.1);
        // Let's make some features more realistic based on the index if known
        // For simplicity, we keep them mostly random but normalized
        return base;
    });
};
