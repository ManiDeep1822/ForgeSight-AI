import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, PerspectiveCamera, OrbitControls, Stage } from '@react-three/drei';
import * as THREE from 'three';

const MachinePart = ({ position, color, args, distort = 0, speed = 1 }) => {
  const mesh = useRef();
  useFrame((state) => {
    if (distort > 0) {
      mesh.current.distort = THREE.MathUtils.lerp(mesh.current.distort, distort, 0.1);
    }
  });

  return (
    <mesh position={position} ref={mesh}>
      <boxGeometry args={args} />
      <MeshDistortMaterial 
        color={color} 
        speed={speed} 
        distort={distort} 
        radius={1} 
        emissive={color} 
        emissiveIntensity={distort > 0 ? 0.5 : 0} 
      />
    </mesh>
  );
};

export const CNCModel = ({ healthIndex, failureType }) => {
  const isHealthy = healthIndex >= 80;
  const isCritical = healthIndex < 50;
  
  // Map failures to parts
  const spindleError = failureType === 'Tool Wear Failure' || failureType === 'Overstrain Failure';
  const coolingError = failureType === 'Heat Dissipation Failure';
  const powerError = failureType === 'Power Failure';

  return (
    <div className="w-full h-full min-h-[300px] relative rounded-2xl overflow-hidden bg-slate-950/20 border border-white/5">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[5, 5, 5]} fov={35} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} castShadow />
        <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
        
        <Stage adjustCamera intensity={0.5} environment="city" preset="rembrandt" shadows={false}>
          <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            {/* Machine Base */}
            <MachinePart position={[0, -0.5, 0]} color="#1e293b" args={[3, 0.5, 2]} />
            
            {/* Main Column */}
            <MachinePart position={[-1, 1, 0]} color="#334155" args={[0.8, 3, 1.2]} />
            
            {/* Spindle Head */}
            <MachinePart 
              position={[0, 1.5, 0]} 
              color={spindleError ? "#ef4444" : "#64748b"} 
              args={[1, 1, 1]} 
              distort={spindleError ? 0.4 : 0} 
            />
            
            {/* Worktable */}
            <MachinePart position={[0.5, 0, 0]} color="#94a3b8" args={[2, 0.2, 1.5]} />
            
            {/* Cooling Lines */}
            <MachinePart 
              position={[1, 1, -0.8]} 
              color={coolingError ? "#f59e0b" : "#3b82f6"} 
              args={[0.1, 2, 0.1]} 
              distort={coolingError ? 0.3 : 0} 
            />
          </Float>
        </Stage>
        
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
      
      <div className="absolute bottom-4 left-4">
        <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-slate-950/80 border ${isHealthy ? 'text-emerald-400 border-emerald-500/20' : 'text-rose-400 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.3)] animate-pulse'}`}>
          Live Hardware Sync: {isHealthy ? 'Nominal' : 'Anomaly Detected'}
        </div>
      </div>
    </div>
  );
};
