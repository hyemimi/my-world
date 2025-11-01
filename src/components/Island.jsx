import { useGLTF } from "@react-three/drei";

export function Island() {
  const { scene } = useGLTF("/models/island/island.gltf");

  return (
    <primitive
      object={scene}
      scale={1}
      position={[0, 0, 0]}
      castShadow
      receiveShadow
    />
  );
}
