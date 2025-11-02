import React, { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  Sky,
  Environment,
  ContactShadows,
} from "@react-three/drei";
import { Island } from "./Island";
import { TreasureChest } from "./Chest";
import * as THREE from "three";

/**
 * 카메라 초기 위치 설정 컴포넌트 - 섬 전체가 보이도록
 */
function CameraSetup({ islandRef, controlsRef }) {
  const { camera } = useThree();
  const initialized = useRef(false);

  useEffect(() => {
    if (!islandRef?.current || initialized.current) return;

    // 섬 모델이 로드될 때까지 대기
    const checkModel = () => {
      if (!islandRef.current) {
        setTimeout(checkModel, 100);
        return;
      }

      const box = new THREE.Box3();

      // primitive의 실제 객체를 찾기
      const sceneObj = islandRef.current.object || islandRef.current;
      box.setFromObject(sceneObj);

      if (!box.isEmpty()) {
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxSize = Math.max(size.x, size.z);
        const height = size.y;

        // 섬 전체가 보이도록 카메라 위치 계산
        const distance = Math.max(maxSize * 1.5, height * 2);
        const cameraHeight = center.y + height * 0.5;
        const cameraDistance = distance * 1.2;

        // 섬의 중심에서 약간 뒤쪽 위에서 바라보는 각도
        const angle = Math.PI / 4; // 45도
        const startPosition = new THREE.Vector3(
          center.x + Math.sin(angle) * cameraDistance,
          cameraHeight,
          center.z + Math.cos(angle) * cameraDistance
        );

        camera.position.copy(startPosition);
        camera.lookAt(center.x, center.y, center.z);

        if (controlsRef?.current) {
          controlsRef.current.target.set(center.x, center.y, center.z);
          controlsRef.current.update();
        }

        initialized.current = true;
      } else {
        // 아직 로드되지 않았다면 다시 시도
        setTimeout(checkModel, 200);
      }
    };

    const timer = setTimeout(checkModel, 500);
    return () => clearTimeout(timer);
  }, [camera, islandRef, controlsRef]);

  return null;
}

/**
 * 카메라 이동 애니메이션 컴포넌트
 */
function CameraMover({ targetPosition, controlsRef, isActive }) {
  const { camera } = useThree();
  const animationRef = useRef(null);

  useEffect(() => {
    if (!isActive || !targetPosition || !controlsRef?.current) return;

    const target = new THREE.Vector3(...targetPosition);
    const startPos = camera.position.clone();
    const startTarget = controlsRef.current.target.clone();

    const offset = new THREE.Vector3(0, 1.5, 1.5);
    const endPos = target.clone().add(offset);

    let progress = 0;
    const duration = 1000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      progress = Math.min(elapsed / duration, 1);

      const easeProgress =
        progress < 0.5
          ? 2 * progress * progress
          : -1 + (4 - 2 * progress) * progress;

      camera.position.lerpVectors(startPos, endPos, easeProgress);
      controlsRef.current.target.lerpVectors(startTarget, target, easeProgress);
      controlsRef.current.update();

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetPosition, isActive, camera, controlsRef]);

  return null;
}

/**
 * 물 효과 컴포넌트
 */
function Water({ islandRef }) {
  const waterRef = useRef();
  const [waterHeight, setWaterHeight] = useState(-2); // 기본값 설정

  useEffect(() => {
    if (!islandRef?.current) return;

    const checkModel = () => {
      if (!islandRef.current) {
        setTimeout(checkModel, 100);
        return;
      }

      const box = new THREE.Box3();
      const sceneObj = islandRef.current.object || islandRef.current;
      box.setFromObject(sceneObj);

      if (!box.isEmpty()) {
        // 섬의 바닥 아래에 물 배치
        setWaterHeight(box.min.y - 0.5);
      } else {
        setTimeout(checkModel, 200);
      }
    };

    const timer = setTimeout(checkModel, 500);
    return () => clearTimeout(timer);
  }, [islandRef]);

  return (
    <mesh
      ref={waterRef}
      position={[0, waterHeight, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
    >
      <planeGeometry args={[200, 200]} />
      <meshStandardMaterial
        color="#4a9eff"
        transparent
        opacity={0.6}
        roughness={0.1}
        metalness={0.8}
      />
    </mesh>
  );
}

/**
 * 메인 3D 씬 컴포넌트
 */
export function Scene({ treasures, onTreasureClick, nearbyTreasure }) {
  const islandRef = useRef();
  const controlsRef = useRef();
  const [cameraTarget, setCameraTarget] = useState(null);

  return (
    <Canvas
      camera={{
        position: [0, 5, 15], // 카메라를 더 멀리 배치
        fov: 75,
        near: 0.1,
        far: 2000,
      }}
      shadows
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.2,
      }}
    >
      {/* 디버그용 - 씬이 렌더링되는지 확인 */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="red" />
      </mesh>

      {/* 조명 설정 */}
      <Lighting />

      {/* 환경 설정 */}
      <Environment preset="sunset" />
      <Sky
        distance={450000}
        sunPosition={[100, 20, 100]}
        inclination={0.6}
        azimuth={0.25}
        turbidity={2}
        rayleigh={1}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
      />

      {/* 안개 효과 - 하늘이 보이도록 제거 */}
      {/* <fog attach="fog" args={["#87CEEB", 15, 50]} /> */}
      {/* 배경을 투명하게 하여 하늘이 보이도록 */}
      <color attach="background" args={["#87CEEB"]} />

      {/* 카메라 초기 위치 설정 */}
      <CameraSetup islandRef={islandRef} controlsRef={controlsRef} />

      {/* 카메라 이동 애니메이션 */}
      <CameraMover
        targetPosition={cameraTarget}
        controlsRef={controlsRef}
        isActive={!!cameraTarget}
      />

      {/* 3D 모델들 */}
      <Suspense fallback={<LoadingPlaceholder />}>
        {/* 물 */}
        <Water islandRef={islandRef} />

        <Island ref={islandRef} />

        {treasures.map((treasure) => (
          <TreasureChest
            key={treasure.id}
            position={treasure.position}
            treasure={treasure}
            onClick={() => {
              // 카메라를 해당 보물상자로 이동
              setCameraTarget(treasure.position);
              onTreasureClick(treasure);
            }}
            isNearby={nearbyTreasure?.id === treasure.id}
          />
        ))}

        {/* 바닥 그림자 */}
        <ContactShadows
          position={[0, -0.49, 0]}
          opacity={0.5}
          scale={20}
          blur={2}
          far={4}
        />
      </Suspense>

      {/* 카메라 컨트롤 */}
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableZoom={true}
        enableRotate={true}
        minDistance={3}
        maxDistance={15}
        maxPolarAngle={Math.PI / 2.2}
        target={[0, 0, 0]}
        dampingFactor={0.05}
        rotateSpeed={0.5}
      />
    </Canvas>
  );
}

// 조명 컴포넌트
function Lighting() {
  return (
    <>
      {/* 주변광 - 밝기 증가 */}
      <ambientLight intensity={1.0} />

      {/* 태양광 (메인 조명) */}
      <directionalLight
        position={[10, 15, 5]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-bias={-0.0001}
      />

      {/* 보조 조명 (부드러운 그림자용) */}
      <directionalLight position={[-5, 10, -5]} intensity={0.3} />

      {/* 하늘에서 반사되는 빛 */}
      <hemisphereLight
        skyColor={"#87CEEB"}
        groundColor={"#90EE90"}
        intensity={0.5}
      />
    </>
  );
}

// 로딩 플레이스홀더
function LoadingPlaceholder() {
  return (
    <mesh>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="#cccccc" wireframe />
    </mesh>
  );
}
