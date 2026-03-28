import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const ParticleStream = () => {
  const particles = useMemo(() => Array.from({ length: 40 }).map(() => ({
    left: `${Math.random() * 100}%`,
    scaleY: 0.5 + Math.random(),
    duration: 2 + Math.random() * 3,
    delay: Math.random() * 5
  })), []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.15]">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute w-[2px] h-[100px] bg-gradient-to-b from-blue-500/0 via-blue-500/40 to-blue-500/0"
          initial={{ 
            top: -200, 
            left: p.left,
            opacity: 0,
            scaleY: p.scaleY
          }}
          animate={{ 
            top: '120%',
            opacity: [0, 1, 1, 0]
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "linear"
          }}
        />
      ))}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.03)_0%,transparent_70%)]" />
    </div>
  );
};

export default ParticleStream;
