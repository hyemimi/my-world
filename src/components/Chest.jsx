import { useGLTF } from "@react-three/drei";

export function TreasureChest({ position, onClick, isNearby, treasure }) {
  const { scene } = useGLTF("/models/chest/chest.gltf");
  const clonedScene = scene.clone();

  return (
    <group position={position}>
      <primitive object={clonedScene} onClick={onClick} scale={0.5} />
      {isNearby && (
        <Html center distanceFactor={10}>
          <div>{treasure?.icon} 클릭하여 열기</div>
        </Html>
      )}
    </group>
  );
}
