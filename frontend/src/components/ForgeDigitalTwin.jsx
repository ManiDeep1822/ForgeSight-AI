import React, { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import Cyber3DModel from './Cyber3DModel';
import { AudioService } from '../services/AudioService';

// Fluid Camera Logic: Removes snappy resets and adds subtle parallax
const FluidController = ({ orbitRef, selectedComponent }) => {
  const { camera, mouse } = useThree();
  const lastSelected = useRef(selectedComponent);

  useFrame((state, delta) => {
    // Subtle Cursor Parallax Effect (High-End Drift)
    if (selectedComponent === 'all') {
      camera.position.x += (mouse.x * 0.5 - (camera.position.x - 7)) * 0.02;
      camera.position.y += (mouse.y * 0.5 - (camera.position.y - 4)) * 0.02;
    }

    // Call Audio on high-velocity rotation
    if (orbitRef.current && orbitRef.current.active) {
       // Servo hum intensity based on orbit activity
       AudioService.playServoHum(0.005);
    }
  });

  return null;
};

const CyberDigitalTwin = ({ failureType, healthIndex, selectedComponent, onSelectComponent, isFaultInjected }) => {
  const orbitRef = useRef();

  return (
    <>
      <div className="absolute top-8 left-10 z-30 pointer-events-none">
        <div className="flex flex-col gap-2">
           {/* <span className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-400">NODE_VISUALIZATION_LAYER</span> */}
           <div className="flex items-center gap-3">
           </div>
        </div>
      </div>

      <div className="w-full h-full relative z-10 cursor-grab active:cursor-grabbing">
         <Canvas shadows dpr={[1, 2]}>
            <PerspectiveCamera makeDefault position={[5, 5, 10]} fov={40} />
            <ambientLight intensity={1.5} />
            <spotLight position={[15, 20, 15]} angle={0.3} penumbra={1} intensity={3} castShadow />
            <pointLight position={[-15, -10, -15]} intensity={1.5} color="#3b82f6" />
            
            <Suspense fallback={null}>
               <Cyber3DModel 
                  failureType={failureType} 
                  healthIndex={healthIndex} 
                  selectedComponent={selectedComponent}
                  onSelect={(comp) => {
                     AudioService.playClick();
                     onSelectComponent(comp);
                  }}
                  isFaultInjected={isFaultInjected}
               />
               <Environment preset="city" />
               <ContactShadows position={[0, -1.8, 0]} opacity={0.4} scale={15} blur={2} far={4} />
            </Suspense>
            
            <OrbitControls 
               ref={orbitRef}
               enablePan={false}
               minDistance={3}
               maxDistance={18}
               rotateSpeed={0.8}
               zoomSpeed={1.2}
               autoRotate={selectedComponent === 'all' && (!failureType || failureType === 'None')}
               autoRotateSpeed={0.3}
            />
            
            <FluidController orbitRef={orbitRef} selectedComponent={selectedComponent} />
         </Canvas>
      </div>

      {selectedComponent !== 'all' && (
         <div className="absolute top-8 right-10 z-30">
            <button 
               onClick={() => {
                  AudioService.playClick();
                  onSelectComponent('all');
               }}
               className="group flex items-center gap-3 px-6 py-3 bg-black/60 backdrop-blur-2xl border border-white/10 hover:border-cyan-500/50 text-slate-400 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-2xl transition-all hover:scale-105 active:scale-95"
            >
               <span>RESET_CAMERA</span>
               <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 group-hover:shadow-[0_0_8px_#06b6d4]" />
            </button>
         </div>
      )}
    </>
  );
};

export default CyberDigitalTwin;
