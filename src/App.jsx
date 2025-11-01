import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { Island } from "./components/Island";
import "./App.css";

function App() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Canvas
        camera={{ position: [0, 5, 10], fov: 50 }}
        style={{ background: "#87CEEB" }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />
        <Island />
        <OrbitControls enableZoom={true} enablePan={true} enableRotate={true} />
        <Environment preset="sunset" />
      </Canvas>
    </div>
  );
}

export default App;
