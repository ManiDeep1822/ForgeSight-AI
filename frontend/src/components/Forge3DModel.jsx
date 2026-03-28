import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

const Forge3DModel = ({ failureType, healthIndex, selectedComponent, onSelect, isFaultInjected }) => {
  const spindleRef = useRef();
  const coolantRef = useRef();
  const bedRef = useRef();
  const groupRef = useRef();

  const [hovered, setHovered] = useState(null);

  // Map backend labels to professional industrial diagnostics
  const isTWF = (failureType || '').includes('TWF');
  const isHDF = (failureType || '').includes('HDF');
  const isOSF = (failureType || '').includes('OSF');

  const materials = useMemo(() => {
    const createMat = (opts) => new THREE.MeshStandardMaterial({
        roughness: 0.2,
        metalness: 0.9,
        ...opts
    });

    return {
      metalBase: createMat({ color: 0x0f172a }), // Deep Slate
      metalAccent: createMat({ color: 0x1e293b }),
      metalShinny: createMat({ color: 0x334155, roughness: 0.1 }),
      
      statusHealthy: createMat({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 0.5 }),
      statusWarning: createMat({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.8 }),
      statusCritical: createMat({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 1.5 }),
      
      toolSteel: createMat({ color: 0x94a3b8, roughness: 0.05, metalness: 1.0 }),
      glass: new THREE.MeshPhysicalMaterial({ 
        color: 0x0ea5e9, 
        transparent: true, 
        opacity: 0.2, 
        transmission: 0.9, 
        thickness: 0.5 
      }),
      
      ghost: new THREE.MeshBasicMaterial({ color: 0x1e293b, wireframe: true, transparent: true, opacity: 0.03 })
    };
  }, []);

  const getMat = (compName, defaultMat, failureMode = null) => {
    // If focusing on a specific part, ghost the others
    if (selectedComponent !== 'all' && selectedComponent !== compName) return materials.ghost;
    
    // Check specific failure modes (World-Class Alerting)
    if (failureMode === 'TWF' && (isTWF || (isFaultInjected && compName === 'spindle'))) return materials.statusCritical;
    if (failureMode === 'HDF' && (isHDF || (isFaultInjected && compName === 'coolant'))) return materials.statusWarning;
    if (failureMode === 'OSF' && (isOSF || (isFaultInjected && compName === 'bed'))) return materials.statusCritical;

    // Hover effect
    if (hovered === compName && selectedComponent === 'all') {
       const clone = defaultMat.clone();
       clone.emissive = new THREE.Color(0x38bdf8);
       clone.emissiveIntensity = 0.4;
       return clone;
    }

    return defaultMat;
  };

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    // SPINDLE VELOCITY ANIMATION
    if (spindleRef.current) {
        if (isTWF || isFaultInjected) {
            // Unstable vibration
            spindleRef.current.position.y = 1.6 + Math.sin(time * 40) * 0.05;
            spindleRef.current.rotation.y += delta * 6;
        } else {
            // High-precision rotation
            spindleRef.current.position.y = 1.6;
            spindleRef.current.rotation.y += delta * 15;
        }
    }

    // HYDRAULIC THERMAL EXPANSION
    if (coolantRef.current) {
        if (isHDF || isFaultInjected) {
            coolantRef.current.scale.setScalar(1 + Math.sin(time * 10) * 0.1);
        } else {
            coolantRef.current.scale.setScalar(1);
        }
    }

    // BED AXIAL DEVIATION
    if (bedRef.current) {
        if (isOSF || isFaultInjected) {
            bedRef.current.position.x = 0.8 + Math.sin(time * 30) * 0.1;
        } else {
            bedRef.current.position.x = 0.8;
        }
    }
  });

  const handlePointerOver = (e, name) => { e.stopPropagation(); setHovered(name); document.body.style.cursor = 'pointer'; };
  const handlePointerOut = () => { setHovered(null); document.body.style.cursor = 'auto'; };
  const handleClick = (e, name) => { e.stopPropagation(); onSelect(selectedComponent === name ? 'all' : name); };

  return (
    <group ref={groupRef} position={[0, -1.5, 0]} scale={[1.3, 1.3, 1.3]}>
      
      {/* 1. MAIN STRUCTURE: CHASSIS */}
      <mesh material={getMat('base', materials.metalBase)} position={[0, 0, 0]} castShadow receiveShadow>
         <boxGeometry args={[4.2, 0.4, 3.2]} />
      </mesh>
      <mesh material={getMat('base', materials.metalBase)} position={[-1.5, 2.2, 0]} castShadow receiveShadow>
         <boxGeometry args={[1.2, 4.4, 2.2]} />
      </mesh>
      <mesh material={getMat('base', materials.metalAccent)} position={[0, 4.2, 0]} castShadow receiveShadow>
         <boxGeometry args={[4.2, 0.6, 2.2]} />
      </mesh>

      {/* 2. SPINDLE ASSEMBLY (TWF DETECTION) */}
      <group position={[0.8, 1.6, 0]} onPointerOver={(e) => handlePointerOver(e, 'spindle')} onPointerOut={handlePointerOut} onClick={(e) => handleClick(e, 'spindle')}>
         <mesh material={getMat('spindle', materials.metalShinny, 'TWF')}>
            <boxGeometry args={[1.8, 2.2, 1.8]} />
         </mesh>
         <group ref={spindleRef} position={[0, -1.6, 0]}>
            <mesh material={materials.metalAccent}>
               <cylinderGeometry args={[0.5, 0.4, 0.8, 24]} />
            </mesh>
            <mesh position={[0, -1.0, 0]} material={getMat('spindle', (isTWF || isFaultInjected) ? materials.statusCritical : materials.toolSteel)}>
               <cylinderGeometry args={[0.1, 0.02, 1.4, 8]} />
            </mesh>
         </group>
         <Html position={[0, 3, 0]} center className={`transition-all duration-700 select-none ${isTWF ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
            <div className="bg-rose-950/80 border-2 border-rose-500 px-6 py-3 rounded-2xl shadow-4xl backdrop-blur-xl">
                <span className="text-[10px] font-black text-rose-400 uppercase tracking-[0.4em]">PART_CRITICAL: SPINDLE_TOOL_TWF</span>
            </div>
         </Html>
      </group>

      {/* 3. COOLANT LUBRICATION SYSTEM (HDF DETECTION) */}
      <group position={[1.8, 2.8, 1.2]} ref={coolantRef} onPointerOver={(e) => handlePointerOver(e, 'coolant')} onPointerOut={handlePointerOut} onClick={(e) => handleClick(e, 'coolant')}>
         <mesh material={getMat('coolant', materials.glass, 'HDF')}>
            <cylinderGeometry args={[0.3, 0.3, 2.2, 16]} />
         </mesh>
         <mesh position={[0, -1.2, -0.6]} material={materials.metalAccent}>
            <boxGeometry args={[0.2, 1.2, 1.2]} />
         </mesh>
         <Html position={[0, 1.5, 0]} center className={`transition-all duration-700 select-none ${isHDF ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
            <div className="bg-amber-950/80 border-2 border-amber-500 px-6 py-3 rounded-2xl shadow-4xl backdrop-blur-xl">
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-[0.4em]">ANOMALY_LOG: THERMAL_EXPANSION_HDF</span>
            </div>
         </Html>
      </group>

      {/* 4. MOTION BED (OSF DETECTION) */}
      <group position={[0.8, 0.4, 0]} ref={bedRef} onPointerOver={(e) => handlePointerOver(e, 'bed')} onPointerOut={handlePointerOut} onClick={(e) => handleClick(e, 'bed')}>
         <mesh material={getMat('bed', materials.metalShinny, 'OSF')}>
            <boxGeometry args={[3.2, 0.3, 2.2]} />
         </mesh>
         <mesh position={[0, 0.4, 0]} material={materials.metalAccent}>
            <boxGeometry args={[1.2, 0.6, 1.2]} />
         </mesh>
         <Html position={[2, 0, 0]} center className={`transition-all duration-700 select-none ${isOSF ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
            <div className="bg-rose-950/80 border-2 border-rose-500 px-6 py-3 rounded-2xl shadow-4xl backdrop-blur-xl">
                <span className="text-[10px] font-black text-rose-400 uppercase tracking-[0.4em]">SIGNAL_LOCK: OSF_STRUCTURAL_DEVIATION</span>
            </div>
         </Html>
      </group>

      <ContactShadows position={[0, -0.4, 0]} opacity={0.5} scale={15} blur={1.5} far={5} />
    </group>
  );
};

export default Forge3DModel;
