import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  OrbitControls, PerspectiveCamera, MeshDistortMaterial, 
  Float, MeshWobbleMaterial, ContactShadows, Environment,
  Text, Grid, Html
} from '@react-three/drei';
import * as THREE from 'three';

// HUD Label for 3D Workspace
const HUDLabel = ({ text, position, color, value }) => (
  <Html position={position} center distanceFactor={10} transition="all 0.5s">
    <div className="flex flex-col items-center pointer-events-none select-none">
      <div className="px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg shadow-2xl">
        <span className="text-[9px] font-black uppercase tracking-[0.2em] whitespace-nowrap" style={{ color }}>{text}</span>
      </div>
      {value !== undefined && (
        <div className="mt-2 text-xl font-black text-white font-mono drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
          {value.toFixed(1)}%
        </div>
      )}
    </div>
  </Html>
);

const getColorForHealth = (health) => {
  const baseHex = "#1e1e2e";
  const base = new THREE.Color(baseHex);
  const warning = new THREE.Color("#f59e0b"); // Orange
  const critical = new THREE.Color("#ef4444"); // Red
  
  if (health >= 0.8) return baseHex;
  
  if (health > 0.45) {
    const t = (0.8 - health) / 0.35;
    return "#" + base.clone().lerp(warning, t).getHexString();
  } else {
    const t = (0.45 - health) / 0.45;
    return "#" + warning.clone().lerp(critical, t).getHexString();
  }
};

// Internal 3D Scene Component
const MachineScene = ({ healthIndex, failureType, rpm = 0, torque = 0 }) => {
  const group = useRef();
  const spindle = useRef();
  const table = useRef();
  
  const isHealthy = healthIndex >= 80;
  const healthNormal = healthIndex / 100;
  const mainColor = getColorForHealth(healthNormal);
  const baseDistort = isHealthy ? 0 : healthIndex < 45 ? 0.35 : 0.15;

  const spindleError = failureType === 'TWF' || failureType === 'OSF';
  const structuralError = failureType === 'HDF' || failureType === 'PWF';

  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.05;
    }
    // Spin based on simulated RPM (normalized)
    if (spindle.current) {
      const speed = (rpm / 15000) * 0.5;
      spindle.current.rotation.y += speed;
    }
    // Move table based on torque / activity
    if (table.current) {
      table.current.position.x = Math.sin(state.clock.elapsedTime * 0.5) * (torque / 100) * 0.5;
    }
  });

  return (
    <group ref={group} scale={0.8} position={[0, -0.5, 0]}>
      {/* Precision HUD Overlays */}
      <HUDLabel text="SPINDLE_STATUS" position={[0, 2.4, 0]} color={spindleError ? "#ef4444" : "#475569"} />
      <HUDLabel text="HEALTH_INDEX" position={[2, 1, 0]} color="#3b82f6" value={healthIndex} />
      
      {/* Main CNC Chassis */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[3, 1.2, 2.2]} />
        <MeshDistortMaterial 
          color={mainColor} 
          speed={isHealthy ? 0.2 : 2} 
          distort={baseDistort} 
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {/* X/Y Table */}
      <mesh ref={table} castShadow receiveShadow position={[0, 0.7, 0]}>
        <boxGeometry args={[2.5, 0.2, 1.8]} />
        <meshStandardMaterial color="#334155" metalness={1} roughness={0.2} />
      </mesh>

      {/* Vertical Column */}
      <mesh castShadow receiveShadow position={[-1.2, 1.2, 0]}>
        <boxGeometry args={[0.4, 2.2, 0.4]} />
        <MeshDistortMaterial 
          color={mainColor} 
          speed={isHealthy ? 0.1 : 3} 
          distort={structuralError ? baseDistort * 1.5 : baseDistort} 
          metalness={1}
        />
      </mesh>

      {/* Spindle Head Group */}
      <group position={[0, 1.8, 0]}>
        <mesh ref={spindle} castShadow receiveShadow>
          <cylinderGeometry args={[0.25, 0.25, 0.8, 32]} />
          <MeshWobbleMaterial 
            color={spindleError ? "#ef4444" : mainColor} 
            factor={spindleError ? 0.5 : 0} 
            speed={2} 
            metalness={1}
          />
        </mesh>
        {/* The Drill Tool */}
        <mesh position={[0, -0.6, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.4, 12]} />
          <meshStandardMaterial color={failureType === 'TWF' ? "#ef4444" : "#cbd5e1"} metalness={1} />
        </mesh>
      </group>

      {/* Holographic "Bounding Box" around the Twin */}
      <Grid position={[0, -0.1, 0]} args={[10, 10]} sectionThickness={1.5} fadeDistance={30} cellColor="#3b82f6" sectionColor="#60a5fa" />
    </group>
  );
};

export const CNCModel = ({ healthIndex = 100, failureType = 'None', rpm = 0, torque = 0 }) => {
  const isHealthy = healthIndex >= 80;

  return (
    <div className="w-full h-full relative group bg-gradient-to-b from-transparent to-blue-500/5">
      {/* Tactical HUD Overlay for 3D Camera */}
      <div className="absolute inset-0 pointer-events-none z-10 p-10 flex flex-col justify-between border-2 border-white/5 rounded-[3rem]">
          <div className="hud-scanline opacity-10" />
          
          <div className="flex justify-between items-start">
             <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                   <div className={`w-2.5 h-2.5 rounded-full ${isHealthy ? 'bg-cyan-500 shadow-glow-blue animate-pulse' : 'bg-rose-500 shadow-glow-red animate-ping'}`} />
                   <span className="text-[11px] font-black text-white tracking-[0.3em] uppercase">{isHealthy ? 'PHYSICAL_LINK: STABLE' : 'LINK_INTEGRITY_COMPROMISED'}</span>
                </div>
                <div className="px-3 py-1 bg-black/40 border border-white/10 rounded-lg inline-block">
                   <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest leading-none">V-TWIN ENGINE v9.4 // CLK_SYNC</span>
                </div>
             </div>
             
             <div className="text-right">
                <p className="text-[12px] font-black text-slate-500 uppercase tracking-[0.4em] mb-1 leading-none">Viewport_Rotation</p>
                <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest leading-none">Perspective_Active</p>
             </div>
          </div>

          <div className="flex justify-between items-end">
             <div className="flex gap-8">
                <div className="flex flex-col"><span className="text-[9px] text-slate-700 font-bold uppercase tracking-widest mb-1">X_AXIS</span><span className="text-[10px] text-slate-300 font-black font-mono">102.434</span></div>
                <div className="flex flex-col"><span className="text-[9px] text-slate-700 font-bold uppercase tracking-widest mb-1">Y_AXIS</span><span className="text-[10px] text-slate-300 font-black font-mono">-42.002</span></div>
             </div>
             <div className="text-right">
                <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden mb-2"><div className="h-full bg-cyan-500 w-2/3 shadow-glow-blue" /></div>
                <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.3em]">Holographic_Buffer: BUFFERING_OK</p>
             </div>
          </div>
      </div>

      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[5, 4, 6]} fov={35} />
        <OrbitControls 
          enablePan={false} 
          minDistance={4} 
          maxDistance={12} 
          autoRotate={isHealthy}
          autoRotateSpeed={0.3}
        />
        
        <ambientLight intensity={1.5} />
        <spotLight position={[10, 15, 10]} angle={0.25} penumbra={1} intensity={2} castShadow />
        <pointLight position={[-10, 0, -10]} intensity={1} color="#3b82f6" />
        <pointLight position={[5, -5, 5]} intensity={0.5} color="#ef4444" />

        <MachineScene 
          healthIndex={healthIndex} 
          failureType={failureType} 
          rpm={rpm} 
          torque={torque}
        />

        <ContactShadows position={[0, -0.6, 0]} opacity={0.6} scale={15} blur={3} far={2} color="#000" />
        <Environment preset="night" />
      </Canvas>
    </div>
  );
};
