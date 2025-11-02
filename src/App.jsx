import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { Island } from "./components/Island";
import { CameraAutoSetup } from "./components/CameraAutoSetup";
import { useRef } from "react";
import "./App.css";

function App() {
  const islandRef = useRef();
  const controlsRef = useRef();

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Canvas
        camera={{ position: [0, 30, 50], fov: 75 }}
        style={{ background: "#87CEEB" }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />

        {/* 섬 모델 */}
        <Island ref={islandRef} />

        {/* 카메라 자동 설정 - 섬 크기 감지 후 적절한 위치로 배치 */}
        <CameraAutoSetup islandRef={islandRef} controlsRef={controlsRef} />

        <OrbitControls
          ref={controlsRef}
          target={[0, 0, 0]}
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
        />
        <Environment preset="sunset" />
      </Canvas>
    </div>
  );
}

export default App;
