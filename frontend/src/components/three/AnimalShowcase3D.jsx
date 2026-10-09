// src/components/three/AnimalShowcase3D.jsx
// Баннер 3D-животных: анимированные глифры Fox, Horse, Parrot и Flamingo стоят в поле с кустами, камера мягко дрейфует.

import { Suspense, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";

function ShowcaseAnimal({ url, position, rotation = 0, scale = 1, offsetY = 0 }) {
  const group = useRef(null);
  const { scene, animations } = useGLTF(url);
  const { actions, names } = useAnimations(animations, group);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (names.length > 0 && !actions[names[0]].isRunning()) {
      actions[names[0]].play();
    }
    if (group.current) {
      group.current.position.y = offsetY + Math.sin(t * 0.9 + position[0]) * 0.05;
    }
  });

  return (
    <group ref={group} position={position} rotation={[0, rotation, 0]} scale={scale}>
      <primitive object={scene} />
    </group>
  );
}

function DriftingCamera() {
  useFrame(({ camera, clock }) => {
    const t = clock.getElapsedTime();
    camera.position.x = Math.sin(t * 0.25) * 0.8;
    camera.position.y = 2.5 + Math.sin(t * 0.4) * 0.12;
    camera.lookAt(0, 0.55, 0);
  });
  return null;
}

const MODELS = [
  {
    name: "Попугайчик",
    url: "/models/Parrot.glb",
    position: [-4.5, 0, -1],
    rotation: -0.3,
    scale: 0.03,
    offsetY: 0.9
  },
  {
    name: "Лисичка",
    url: "/models/Fox.glb",
    position: [0.75, 0, 3.1],
    rotation: 0.2,
    scale: 0.015,
    offsetY: 0
  },
  {
    name: "Лошадка",
    url: "/models/Horse.glb",
    position: [-0.85, 0, -3.15],
    rotation: -0.55,
    scale: 0.01,
    offsetY: 0
  },
  {
    name: "Фламинго",
    url: "/models/Flamingo.glb",
    position: [3.6, 0, -0.1],
    rotation: 0.45,
    scale: 0.02,
    offsetY: 2.0
  }
];

function ShowcaseContent() {
  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight
        position={[4, 6, 4]}
        intensity={1.4}
        color="#ffffff"
        castShadow
      />
      <directionalLight position={[-5, 3, -3]} intensity={0.4} color="#9cc6ec" />

      <DriftingCamera />

      <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[42.8, 48]} />
        <meshStandardMaterial color="#3AA568" roughness={0.95} />
      </mesh>

      {[
        [-9.4, -8.9],
        [1, -17],
        [1.5, -1.5],
        [-4, -1.5],
        [7, -2]
      ].map(([x, z], i) => (
        <group key={i} position={[x, 0.02, z]}>
          <mesh position={[0, 0.16, 0]}>
            <sphereGeometry args={[0.3, 12, 10]} />
            <meshStandardMaterial color="#136B39" roughness={1} flatShading />
          </mesh>
          <mesh position={[0.18, 0.1, 0.1]}>
            <sphereGeometry args={[0.2, 10, 8]} />
            <meshStandardMaterial color="#136B39" roughness={1} flatShading />
          </mesh>
        </group>
      ))}

      {MODELS.map((model) => (
        <ShowcaseAnimal key={model.url} {...model} />
      ))}
    </>
  );
}

export default function AnimalShowcase3D() {
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    <div className="showcase-3d-scene">
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ position: [0, 1.5, 8.2], fov: 38 }}
        gl={{ antialias: true, alpha: true }}
        onError={() => setFailed(true)}
      >
        <Suspense fallback={null}>
          <ShowcaseContent />
        </Suspense>
      </Canvas>
    </div>
  );
}
