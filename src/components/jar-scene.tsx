"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Color, Group, Object3D, type InstancedMesh } from "three";
import { createBallRenderData } from "@/lib/puzzle";

type JarSceneProps = {
  seed: string;
  palette: readonly string[];
};

type BeanCloudProps = JarSceneProps & {
  reducedMotion: boolean;
};

function BeanCloud({ seed, palette, reducedMotion }: BeanCloudProps) {
  const groupRef = useRef<Group>(null);
  const meshRef = useRef<InstancedMesh>(null);
  const balls = useMemo(() => createBallRenderData(seed, palette), [seed, palette]);
  const dummy = useMemo(() => new Object3D(), []);
  const color = useMemo(() => new Color(), []);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) {
      return;
    }

    for (let index = 0; index < balls.length; index += 1) {
      const ball = balls[index];
      if (!ball) {
        continue;
      }
      dummy.position.set(ball.x, ball.y, ball.z);
      dummy.rotation.set(ball.y * 0.8, ball.x * 0.4, ball.z * 0.5);
      dummy.scale.setScalar(ball.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
      mesh.setColorAt(index, color.set(ball.color));
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  }, [balls, color, dummy]);

  useFrame((_, delta) => {
    if (!reducedMotion && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, balls.length]} castShadow receiveShadow>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial roughness={0.42} metalness={0.05} />
      </instancedMesh>
    </group>
  );
}

function JarGlass() {
  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[1.82, 1.58, 4.1, 96, 1, true]} />
        <meshPhysicalMaterial color="#ffffff" roughness={0.02} transmission={0.75} thickness={0.38} transparent opacity={0.28} />
      </mesh>
      <mesh position={[0, -2.08, 0]}>
        <cylinderGeometry args={[1.62, 1.62, 0.08, 96]} />
        <meshStandardMaterial color="#111111" roughness={0.36} metalness={0.12} />
      </mesh>
      <mesh position={[0, 2.12, 0]}>
        <cylinderGeometry args={[1.22, 1.38, 0.34, 96]} />
        <meshStandardMaterial color="#111111" roughness={0.28} metalness={0.18} />
      </mesh>
      <mesh position={[0, 2.36, 0]}>
        <cylinderGeometry args={[1.32, 1.22, 0.12, 96]} />
        <meshStandardMaterial color="#f8f5ec" roughness={0.2} metalness={0.25} />
      </mesh>
    </group>
  );
}

export function JarScene({ seed, palette }: JarSceneProps) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(query.matches);
    const update = () => setReducedMotion(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return (
    <div className="jar-scene" role="img" aria-label="Interactive 3D jar filled with colored jellybean marbles.">
      <Canvas camera={{ position: [0, 1.1, 6.2], fov: 42 }} shadows dpr={[1, 2]}>
        <color attach="background" args={["#f8f5ec"]} />
        <ambientLight intensity={0.9} />
        <directionalLight position={[3, 5, 4]} intensity={1.35} castShadow />
        <pointLight position={[-3, 2, -2]} intensity={0.7} color="#f1c40f" />
        <BeanCloud seed={seed} palette={palette} reducedMotion={reducedMotion} />
        <JarGlass />
        <OrbitControls enablePan={false} minDistance={4.2} maxDistance={8} minPolarAngle={0.72} maxPolarAngle={2.28} autoRotate={!reducedMotion} autoRotateSpeed={0.45} />
      </Canvas>
      <p className="canvas-fallback">Drag, scroll, or use trackpad gestures to rotate and inspect the generated jar.</p>
    </div>
  );
}
