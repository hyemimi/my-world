import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * 섬 모델의 크기를 자동으로 감지하고
 * 카메라를 배치
 */
export function CameraAutoSetup({ islandRef, controlsRef }) {
  const { camera } = useThree();
  const initialized = useRef(false);

  useEffect(() => {
    if (!islandRef?.current || initialized.current) return;

    const checkModel = () => {
      if (!islandRef.current) {
        setTimeout(checkModel, 100);
        return;
      }

      try {
        const box = new THREE.Box3();

        let sceneObj = null;
        if (islandRef.current.object) {
          sceneObj = islandRef.current.object;
        } else if (islandRef.current.isObject3D) {
          sceneObj = islandRef.current;
        } else {
          setTimeout(checkModel, 200);
          return;
        }

        // 바운딩 박스 계산 - setFromObject를 직접 사용
        box.setFromObject(sceneObj);

        if (!box.isEmpty()) {
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxSize = Math.max(size.x, size.y, size.z);

          console.log("🌴 섬 정보:");
          console.log("  - 중심:", center);
          console.log("  - 크기:", size);
          console.log("  - 최대 크기:", maxSize);

          // 카메라 거리 계산 (섬 전체가 보이도록)
          // FOV 75도 기준으로 필요한 거리
          const fovRad = (camera.fov * Math.PI) / 180;
          const distance = maxSize / 2 / Math.tan(fovRad / 2);
          const safeDistance = distance * 1.5; // 여유 공간 추가

          // 위에서 내려다보는 각도 계산
          // 높이는 섬 높이의 1.5배 + 안전 거리
          const cameraHeight = center.y + size.y * 0.5 + safeDistance * 0.4;

          // 수평 거리는 약간 앞쪽
          const horizontalDistance = safeDistance * 0.7;

          // 중앙에서 위쪽 대각선 위치
          const cameraPosition = new THREE.Vector3(
            center.x,
            cameraHeight,
            center.z + horizontalDistance
          );

          camera.position.copy(cameraPosition);
          camera.lookAt(center.x, center.y, center.z);

          // OrbitControls의 target 설정
          if (controlsRef?.current) {
            controlsRef.current.target.set(center.x, center.y, center.z);
            controlsRef.current.update();
          }

          console.log("📷 카메라 설정:");
          console.log("  - 위치:", camera.position);
          console.log("  - 타겟:", center);
          console.log("  - 거리:", safeDistance.toFixed(2));

          initialized.current = true;
        } else {
          // 아직 로드되지 않았다면 재시도
          setTimeout(checkModel, 200);
        }
      } catch (error) {
        console.error("카메라 설정 오류:", error);
        // 에러 발생 시 기본 위치로
        camera.position.set(0, 30, 50);
        camera.lookAt(0, 0, 0);
        if (controlsRef?.current) {
          controlsRef.current.target.set(0, 0, 0);
          controlsRef.current.update();
        }
      }
    };

    const timer = setTimeout(checkModel, 500);
    return () => clearTimeout(timer);
  }, [camera, islandRef, controlsRef]);

  return null;
}
