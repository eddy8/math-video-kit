// 舞台：渲染器、灯光、主题场景、镜头。
import * as THREE from "three";
import { THEMES, buildParticles } from "./themes.js";
import { V, keyed, lerp } from "./util.js";

export const W = 1080, H = 1920;

/** 镜头预设：位置 + 注视点。所有课都在半径约 2 的桌面区域内摆物体 */
export const CAMERA_PRESETS = {
  front: [V(0, 5.3, 6.3), V(0, 0.15, -0.15)],  // 默认：俯视约 40°，看全桌面和豆豆
  close: [V(0, 4.0, 4.6), V(0, 0.2, -0.1)],    // 近景
  low: [V(0, 2.6, 6.6), V(0, 0.6, -0.2)],      // 低机位，更有电影感
  left: [V(-3.2, 4.6, 5.2), V(0, 0.15, -0.2)],
  right: [V(3.2, 4.6, 5.2), V(0, 0.15, -0.2)],
  top: [V(0, 7.0, 3.4), V(0, 0, -0.1)],        // 高俯视，适合排列、分组、图形
  end: [V(0, 2.9, 5.0), V(0, 0.55, 0.7)],      // 片尾：推近到豆豆（自动使用）
};
/** 镜头风格（按课号轮换）：整体的轻微运动方式 */
export const CAMERA_STYLES = {
  sway: (t) => V(Math.sin(t * 0.35) * 0.3, 0, 0),
  drift: (t) => V(Math.sin(t * 0.2) * 0.5, Math.sin(t * 0.3) * 0.08, Math.cos(t * 0.2) * 0.2),
  breathe: (t) => V(0, Math.sin(t * 0.5) * 0.12, Math.sin(t * 0.5) * 0.25),
  orbit: (t) => V(Math.sin(t * 0.12) * 1.0, 0, -Math.abs(Math.sin(t * 0.12)) * 0.4),
};

export function createStage(themeName) {
  const theme = THEMES[themeName] || THEMES.picnic;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(W, H);
  renderer.setClearColor(0, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.id = "gl";
  document.body.appendChild(renderer.domElement);

  // 背景（CSS）
  const [c1, c2, c3] = theme.bg;
  document.body.style.background = `linear-gradient(${c1} 0%, ${c2} 48%, ${c3} 100%)`;
  document.documentElement.style.setProperty("--dots", theme.dots);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, W / H, 0.05, 80);
  const hemi = new THREE.HemisphereLight(theme.hemi[0], theme.hemi[1], theme.hemi[2]);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(theme.sun[0], theme.sun[1]);
  sun.position.set(2.2, 6, 3.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 1, far: 16 });
  sun.shadow.bias = -0.0004;
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0xffe2f2, 0.7);
  rim.position.set(-3, 2.5, -3);
  scene.add(rim);

  theme.build(scene);
  const particles = buildParticles(scene, theme.particles);
  const swayers = [], fish = [], balloons = [];
  scene.traverse((o) => {
    if (o.name === "sway") swayers.push(o);
    if (o.name === "fish") fish.push(o);
    if (o.name === "balloon") balloons.push(o);
  });

  /**
   * 镜头：keys = [[t, "preset"] | [t, [pos, target]] ...]，style = CAMERA_STYLES 的键
   */
  function setCamera(t, keys = [[0, "front"]], style = "sway") {
    const resolved = keys.map(([tk, v]) => [tk, typeof v === "string" ? CAMERA_PRESETS[v] : v]);
    const pos = keyed(t, resolved.map(([tk, v]) => [tk, v[0]]));
    const tgt = keyed(t, resolved.map(([tk, v]) => [tk, v[1]]));
    pos.add((CAMERA_STYLES[style] || CAMERA_STYLES.sway)(t));
    camera.position.copy(pos);
    camera.lookAt(tgt);
    camera.updateMatrixWorld();
  }

  function update(t) {
    particles(t);
    for (const s of swayers) s.rotation.z = Math.sin(t * 1.2 + s.userData.sway) * 0.12;
    for (const f of fish) { const h = f.userData.home; f.position.set(h.x + Math.sin(t * 0.5) * 0.4, h.y + Math.sin(t * 1.3) * 0.08, h.z); f.rotation.y = Math.cos(t * 0.5) > 0 ? 0 : Math.PI; }
    for (const b of balloons) { const h = b.userData.home; b.position.set(h.x + Math.sin(t * 0.9 + b.userData.ph) * 0.05, h.y + Math.sin(t * 1.1 + b.userData.ph) * 0.06, h.z); }
  }

  return { renderer, scene, camera, sun, theme, setCamera, update };
}
