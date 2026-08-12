"use client";

import { useEffect, useRef } from "react";

/**
 * 3D 大气水波纹（v0.10.0，用户要求：3D + 大气，替代简约波纹）
 * - Three.js 波浪平面：多层 sin 叠加起伏 + 低角度透视相机（大气感）
 * - 鼠标划过/停留产生冲击波（顶点位移脉冲，衰减扩散）
 * - 单色材质 + 方向光（光影层次）；跟随黑白主题
 * - 动态 import three（仅 Hero 加载）
 */
export function WaveOcean() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let dispose: (() => void) | null = null;
    let cancelled = false;

    (async () => {
      const THREE = await import("three");
      if (cancelled || !mount) return;

      const w = mount.clientWidth || window.innerWidth;
      const h = mount.clientHeight || window.innerHeight;

      // ---------- 场景/相机（低角度，大气透视） ----------
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
      camera.position.set(0, 2.6, 7.5);
      camera.lookAt(0, 0, 0);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      mount.appendChild(renderer.domElement);

      // ---------- 波浪平面（高细分 + 平滑） ----------
      const SEG = 160;
      const SIZE = 16;
      const geometry = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
      geometry.rotateX(-Math.PI / 2);

      // 水材质：微透（不太透明）+ 光滑水面（低 roughness）+ 环境反射（波光粼粼）
      const material = new THREE.MeshPhysicalMaterial({
        color: 0x8aa0b0, // 淡冷蓝灰（水的色调）
        metalness: 0.08,
        roughness: 0.06,
        transparent: true,
        opacity: 0.72,
        clearcoat: 0.9,
        clearcoatRoughness: 0.12,
        reflectivity: 0.6,
        envMapIntensity: 0.9,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.y = -0.6;
      scene.add(mesh);

      // 环境反射贴图（PMREM + RoomEnvironment——水面高光/波光）
      (async () => {
        const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");
        const pmrem = new THREE.PMREMGenerator(renderer);
        const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
        material.envMap = env;
        material.needsUpdate = true;
        pmrem.dispose();
      })();

      // 环境光 + 主方向光（光影层次）
      scene.add(new THREE.AmbientLight(0xffffff, 0.5));
      const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
      dirLight.position.set(4, 6, 5);
      scene.add(dirLight);
      const rimLight = new THREE.DirectionalLight(0xffffff, 0.5);
      rimLight.position.set(-4, 2, -4);
      scene.add(rimLight);

      // ---------- 颜色跟随主题（水的色调：浅色主题深水 / 深色主题亮水） ----------
      const applyTheme = () => {
        const style = getComputedStyle(document.documentElement);
        const ink = style.getPropertyValue("--color-ink").trim();
        const inkL = ink.match(/oklch\(([\d.]+)\s/)?.[1];
        const dark = inkL ? parseFloat(inkL) > 0.5 : false;
        // 淡冷蓝灰（低饱和水色）：明度随主题
        material.color.setHSL(0.55, 0.16, dark ? 0.72 : 0.5);
        renderer.setClearColor(0xffffff, 0);
      };
      applyTheme();

      // ---------- 波浪动画（多层 sin 叠加 + 鼠标冲击波） ----------
      const pos = geometry.attributes.position;
      const baseY = new Float32Array(pos.count);
      for (let i = 0; i < pos.count; i++) baseY[i] = pos.getY(i);

      // 鼠标冲击波：每个冲击 {x, z, time}
      type Impulse = { x: number; z: number; t: number; strength: number };
      const impulses: Impulse[] = [];
      let mouseNdc = { x: 0, z: 0, active: false };

      const onPointerMove = (e: PointerEvent) => {
        const rect = mount.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;
        // NDC → 平面坐标（世界范围 ±SIZE/2）
        mouseNdc = {
          x: (x / rect.width - 0.5) * SIZE,
          z: (0.5 - y / rect.height) * SIZE,
          active: true,
        };
        if (!reduced) {
          impulses.push({ x: mouseNdc.x, z: mouseNdc.z, t: 0, strength: 0.55 });
          if (impulses.length > 8) impulses.shift();
        }
      };
      window.addEventListener("pointermove", onPointerMove);

      const timer = new THREE.Timer();
      const animate = () => {
        timer.update();
        const dt = timer.getDelta();
        const time = timer.getElapsed();

        // 顶点：多层波浪 + 冲击波（v0.16.0：波速减半，慢速惯性感）
        const yArr = pos.array as Float32Array;
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i);
          const z = pos.getZ(i);
          // 大气波浪：大振幅多层叠加（速度系数 0.7/0.55/0.4/1.05——慢速惯性）
          let y =
            Math.sin(x * 0.9 + time * 0.7) * 0.28 +
            Math.sin(z * 0.7 + time * 0.55) * 0.24 +
            Math.sin((x + z) * 0.45 + time * 0.4) * 0.18 +
            Math.sin(x * 1.8 + z * 1.2 + time * 1.05) * 0.08;

          // 鼠标冲击波（指数衰减扩散，传播更慢更绵长）
          for (const imp of impulses) {
            const dx = x - imp.x;
            const dz = z - imp.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            const wave = Math.sin(dist * 2.2 - imp.t * 3.2) * Math.exp(-dist * 0.3);
            y += wave * imp.strength * Math.exp(-imp.t * 1.1);
          }

          yArr[i * 3 + 1] = baseY[i] + y;
        }
        pos.needsUpdate = true;
        geometry.computeVertexNormals();

        // 冲击波生命周期（更绵长：4.5s）
        for (const imp of impulses) imp.t += dt;
        while (impulses.length > 0 && impulses[0].t > 4.5) impulses.shift();

        renderer.render(scene, camera);
        raf = requestAnimationFrame(animate);
      };
      let raf = 0;
      if (!reduced) raf = requestAnimationFrame(animate);
      else renderer.render(scene, camera);

      const onResize = () => {
        const rw = mount.clientWidth || window.innerWidth;
        const rh = mount.clientHeight || window.innerHeight;
        camera.aspect = rw / rh;
        camera.updateProjectionMatrix();
        renderer.setSize(rw, rh);
      };
      window.addEventListener("resize", onResize);

      dispose = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("resize", onResize);
        geometry.dispose();
        material.dispose();
        renderer.dispose();
        mount.removeChild(renderer.domElement);
      };
    })();

    return () => {
      cancelled = true;
      dispose?.();
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0" aria-hidden="true" />;
}
