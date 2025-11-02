import { forwardRef } from "react";
import { useGLTF } from "@react-three/drei";

export const Island = forwardRef(function Island(props, ref) {
  const { scene } = useGLTF("/models/island/island.gltf");

  return (
    <primitive
      ref={ref}
      object={scene}
      scale={1}
      position={[0, 0, 0]}
      castShadow
      receiveShadow
      {...props}
    />
  );
});
