"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere, Points, PointMaterial } from "@react-three/drei";
import { useState, useRef, Suspense, useEffect } from "react";
import * as THREE from "three";
import { inSphere } from "maath/random";

// Simple globe representation (wireframe sphere)
function Globe() {
  const meshRef = useRef<THREE.Mesh>(null);
  const timer = useRef(new THREE.Timer());
  
  useFrame(() => {
    timer.current.update();
    const delta = timer.current.getDelta();
    
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.1;
      meshRef.current.rotation.x += delta * 0.05;
    }
  });

  return (
    <Sphere ref={meshRef} args={[2, 32, 32]}>
      <meshBasicMaterial color="#10B981" wireframe transparent opacity={0.12} />
    </Sphere>
  );
}

// Floating particles around the globe
function Particles() {
  const ref = useRef<THREE.Points>(null);
  const timer = useRef(new THREE.Timer());
  const [sphere] = useState(() => inSphere(new Float32Array(400 * 3), { radius: 3 }) as Float32Array);

  useFrame(() => {
    timer.current.update();
    const delta = timer.current.getDelta();

    if (ref.current) {
      ref.current.rotation.x -= delta / 15;
      ref.current.rotation.y -= delta / 20;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#F59E0B"
          size={0.015}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </Points>
    </group>
  );
}

export default function HeroCanvas() {
  return (
    <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
      <Suspense fallback={null}>
        <ambientLight intensity={0.5} />
        <Globe />
        <Particles />
      </Suspense>
    </Canvas>
  );
}
