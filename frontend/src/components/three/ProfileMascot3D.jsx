// src/components/three/ProfileMascot3D.jsx
// 3D-талисман личного кабинета: модель зависит от статуса аккаунта.
// не активен – «муха» Жужа (Fly.glb), верифицирован – лис Фуфырик (Fox.glb),
// администратор – «слон» Бонифаций (Elephant.glb).
// Герои медленно поворачиваются на подиуме; тяжёлые модели грузятся лениво,
// только когда открыт профиль (без preload, чтобы не тормозить весь сайт).

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";

const MASCOT_MODELS = {
  Лис: { url: "/models/Fox.glb", scale: 0.014, baseY: -0.29, rotation: 0.0, spin: 0.35 },
  Муха: { url: "/models/Fly.glb", scale: 2.6, baseY: -0.3, rotation: 0.0, spin: 0.3 },
  Слон: { url: "/models/Elephant.glb", scale: 1.7, baseY: -0.3, rotation: 0.0, spin: 0.25 },
};

function MascotModel({ animal }) {
  const config = MASCOT_MODELS[animal] || MASCOT_MODELS["Лис"];
  const group = useRef(null);

  const { scene, animations } = useGLTF(config.url);
  const { actions, names } = useAnimations(animations, group);

  useFrame(({ clock }, delta) => {
    if (names.length > 0 && !actions[names[0]].isRunning()) {
      actions[names[0]].play();
    }
    if (group.current) {
      group.current.rotation.y += delta * config.spin;
      group.current.position.y =
        config.baseY + Math.sin(clock.getElapsedTime() * 1.1) * 0.02;
    }
  });

  return (
    <group
      ref={group}
      rotation={[0, config.rotation, 0]}
      scale={config.scale}
    >
      <primitive object={scene} />
    </group>
  );
}

export default function ProfileMascot3D({ animal = "Лис" }) {
  return (
    <div className="mascot-3d-canvas">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 1.35, 3.4], fov: 36 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[3, 5, 4]} intensity={1.2} color="#fff2e0" />
        <directionalLight position={[-4, 2, -3]} intensity={0.4} color="#bde0ff" />

        <mesh position={[0, -0.35, 0]}>
          <cylinderGeometry args={[1.1, 1.2, 0.12, 32]} />
          <meshStandardMaterial color="#fef1ed" roughness={0.9} />
        </mesh>

        <Suspense fallback={null}>
          <MascotModel animal={animal} />
        </Suspense>
      </Canvas>
    </div>
  );
}
