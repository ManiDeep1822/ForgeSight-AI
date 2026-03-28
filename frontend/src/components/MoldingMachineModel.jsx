import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  OrbitControls, PerspectiveCamera, ContactShadows, Environment, Html, Grid
} from '@react-three/drei';

const HUDLabel = ({ text, position, color, value, unit }) => (
  <Html position={position} center distanceFactor={10}>
    <div className="flex flex-col items-center pointer-events-none select-none">
      <div className="px-4 py-1 bg-black/80 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap" style={{ color }}>{text}</span>
      </div>
      {value !== undefined && (
        <div className="mt-2 text-2xl font-black text-white font-mono drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
          {value.toFixed(1)}<span className="text-[10px] ml-1 opacity-50">{unit}</span>
        </div>
      )}
    </div>
  </Html>
);

const MachineScene = ({ pressure = 0, clampForce = 0, cycleProgress = 0 }) => {
  const group = useRef();
  const screw = useRef();
  const movingPlaten = useRef();
  
  // Injection Cycle Phases: 0-0.3: Injection, 0.3-0.6: Pack/Hold, 0.6-1.0: Cooling/Open
  const injectionStroke = cycleProgress < 0.3 ? (cycleProgress / 0.3) * 0.5 : 0.5;
  const clampOpen = cycleProgress > 0.8 ? (cycleProgress - 0.8) / 0.2 : 0;

  useFrame(() => {
    if (screw.current) {
      if (cycleProgress > 0.6) {
        screw.current.rotation.x += 0.2; // Feeding rotation
      }
    }
  });

  return (
    <group ref={group} scale={0.7} position={[0, -0.5, 0]}>
      <HUDLabel text="INJECTION_PRESSURE" position={[2, 2.5, 0]} color="#3b82f6" value={pressure} unit="bar" />
      <HUDLabel text="CLAMPING_FORCE" position={[-2, 2.5, 0]} color="#10b981" value={clampForce} unit="kN" />
      
      {/* Base */}
      <mesh receiveShadow position={[0, -0.1, 0]}>
        <boxGeometry args={[8, 0.2, 3]} />
        <meshStandardMaterial color="#1e1e2e" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Clamp Unit */}
      <group position={[-2, 0.4, 0]}>
         <mesh position={[-1.2, 0.8, 0]} castShadow>
            <boxGeometry args={[0.4, 2, 2.5]} />
            <meshStandardMaterial color="#334155" metalness={0.9} />
         </mesh>
         <mesh ref={movingPlaten} position={[(-0.5 - clampOpen), 0.8, 0]} castShadow>
            <boxGeometry args={[0.3, 1.8, 2.2]} />
            <meshStandardMaterial color="#475569" metalness={0.9} />
         </mesh>
         {[[-0.8, 0.8], [-0.8, -0.8], [0.8, 0.8], [0.8, -0.8]].map(([y, z], i) => (
            <mesh key={i} position={[0, y + 0.8, z]} rotation={[0, 0, Math.PI / 2]}>
               <cylinderGeometry args={[0.08, 0.08, 3.5, 12]} />
               <meshStandardMaterial color="#94a3b8" metalness={1} />
            </mesh>
         ))}
      </group>

      {/* Injection Unit */}
      <group position={[2.5, 0.4, 0]}>
         {/* Barrel */}
         <mesh rotation={[0, 0, Math.PI / 2]} position={[-0.5, 1.2, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.4, 3, 32]} />
            <meshStandardMaterial color="#1e293b" metalness={1} roughness={0.1} />
            {/* Heat Bands Simulation */}
            <mesh position={[0, 0.5, 0]}>
              <cylinderGeometry args={[0.32, 0.32, 0.3, 32]} />
              <meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={0.5} />
            </mesh>
         </mesh>
         {/* Screw/Piston */}
         <mesh ref={screw} position={[1.5 - injectionStroke, 1.2, 0]} rotation={[0, 0, Math.PI/2]}>
            <cylinderGeometry args={[0.15, 0.15, 2, 12]} />
            <meshStandardMaterial color="#60a5fa" metalness={1} roughness={0.3} />
         </mesh>
         {/* Motor Unit */}
         <mesh position={[2.5, 1.2, 0]} castShadow>
            <boxGeometry args={[1, 1.2, 1.2]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} />
         </mesh>
      </group>

      <mesh position={[0.8, 1.6, 0]} rotation={[0, 0, Math.PI/2]}>
        <cylinderGeometry args={[0.1, 0.2, 0.4, 12]} />
        <meshStandardMaterial color="#94a3b8" metalness={1} />
      </mesh>

      <Grid position={[0, -0.2, 0]} args={[15, 15]} sectionThickness={1.5} fadeDistance={40} cellColor="#3b82f6" sectionColor="#1e3a8a" />
    </group>
  );
};

export const MoldingMachineModel = ({ pressure = 0, clampForce = 0, cycleProgress = 0 }) => {
  return (
    <div className="w-full h-full relative p-[1px] rounded-[3rem] bg-gradient-to-b from-blue-500/20 to-transparent shadow-2xl overflow-hidden">
      <div className="w-full h-full relative bg-slate-950/80 backdrop-blur-3xl rounded-[3rem] overflow-hidden group">
        <div className="absolute inset-0 pointer-events-none z-10 p-10 flex flex-col justify-between">
           <div className="flex justify-between items-start">
              <div className="space-y-2">
                 <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-glow-blue animate-pulse" />
                    <span className="text-[11px] font-black text-white tracking-[0.4em] uppercase">V-MOLD_ENGINE_CORE</span>
                 </div>
                 <div className="px-4 py-1 bg-blue-500/10 border border-blue-500/30 rounded-lg inline-block">
                    <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest leading-none">Perspective_Digital_Twin // ACTIVE</span>
                 </div>
              </div>
              <div className="text-right">
                 <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-2">Cycle_Phase_Sync</p>
                 <div className="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500 transition-all duration-300 shadow-glow-blue" style={{ width: `${cycleProgress * 100}%` }} />
                 </div>
              </div>
           </div>
        </div>

        <Canvas shadows dpr={[1, 2]}>
          <PerspectiveCamera makeDefault position={[6, 5, 8]} fov={35} />
          <OrbitControls enablePan={false} minDistance={5} maxDistance={15} autoRotate autoRotateSpeed={0.3} />
          
          <ambientLight intensity={1.5} />
          <spotLight position={[10, 15, 10]} angle={0.3} penumbra={1} intensity={2} castShadow />
          <pointLight position={[-10, 5, -10]} intensity={1} color="#3b82f6" />
          
          <MachineScene pressure={pressure} clampForce={clampForce} cycleProgress={cycleProgress} />

          <ContactShadows position={[0, -0.2, 0]} opacity={0.6} scale={20} blur={2.5} far={4} color="#000" />
          <Environment preset="city" />
        </Canvas>
      </div>
    </div>
  );
};
