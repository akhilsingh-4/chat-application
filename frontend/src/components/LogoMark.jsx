import { useEffect, useRef } from "react";
import * as THREE from "three";

const LogoMark = ({ size = 36 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0, 4.6);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(size, size, false);

    const group = new THREE.Group();
    scene.add(group);

    const coreGeo = new THREE.IcosahedronGeometry(0.62, 1);
    const coreMat = new THREE.MeshStandardMaterial({
      color: "#E9E6FB",
      metalness: 0.45,
      roughness: 0.25,
      flatShading: true,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    const coreWireGeo = new THREE.IcosahedronGeometry(0.63, 1);
    const coreWireMat = new THREE.MeshBasicMaterial({
      color: "#ffffff",
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    });
    core.add(new THREE.Mesh(coreWireGeo, coreWireMat));

    const ringGeo = new THREE.TorusGeometry(1.35, 0.012, 8, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: "#6C63FF",
      transparent: true,
      opacity: 0.22,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2.3;
    group.add(ring);

    const dotGeo = new THREE.SphereGeometry(0.17, 16, 16);
    const dotMatA = new THREE.MeshStandardMaterial({
      color: "#6C63FF",
      emissive: "#6C63FF",
      emissiveIntensity: 0.55,
      roughness: 0.3,
    });
    const pivotA = new THREE.Group();
    pivotA.rotation.x = Math.PI / 2.3;
    const dotA = new THREE.Mesh(dotGeo, dotMatA);
    dotA.position.x = 1.35;
    pivotA.add(dotA);
    group.add(pivotA);

    const dotMatB = new THREE.MeshStandardMaterial({
      color: "#34D399",
      emissive: "#34D399",
      emissiveIntensity: 0.5,
      roughness: 0.3,
    });
    const pivotB = new THREE.Group();
    pivotB.rotation.x = -Math.PI / 3.4;
    pivotB.rotation.y = Math.PI / 5;
    const dotB = new THREE.Mesh(dotGeo.clone(), dotMatB);
    dotB.position.x = 1.0;
    pivotB.add(dotB);
    group.add(pivotB);

    const key = new THREE.DirectionalLight("#ffffff", 2.2);
    key.position.set(2, 3, 4);
    scene.add(key);

    const rim = new THREE.DirectionalLight("#8b7cff", 1.2);
    rim.position.set(-3, -2, -2);
    scene.add(rim);

    scene.add(new THREE.AmbientLight("#1b1830", 0.7));

    let frameId;

    if (reduceMotion) {
      group.rotation.set(0.3, 0.5, 0);
      pivotA.rotation.z = 0.6;
      pivotB.rotation.z = -0.4;
      renderer.render(scene, camera);
    } else {
      const animate = () => {
        core.rotation.y += 0.006;
        pivotA.rotation.z += 0.018;
        pivotB.rotation.z -= 0.026;
        renderer.render(scene, camera);
        frameId = requestAnimationFrame(animate);
      };
      animate();
    }

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      coreGeo.dispose();
      coreMat.dispose();
      coreWireGeo.dispose();
      coreWireMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      dotGeo.dispose();
      dotMatA.dispose();
      dotMatB.dispose();
      renderer.dispose();
    };
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ width: size, height: size, display: "block" }}
      aria-hidden="true"
    />
  );
};

export default LogoMark;
