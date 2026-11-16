// 原创小角色“豆豆”：一只圆滚滚的小仓鼠，头顶长着一棵小豆芽。
// 用法：const d = createDoudou(); scene.add(d.group); 每帧 d.update(t, { mouth, actions, base })
import * as THREE from "three";
import { clamp, lerp, seg, ease, easeOut, easeBack, V } from "./util.js";

const FUR = 0xf4a85e, FUR_DARK = 0xe08e45, CREAM = 0xfff2dc, PINK = 0xff9fae, EYE = 0x2a1a14, SPROUT = 0x6cc95a;

function mat(color, opts = {}) {
  return new THREE.MeshPhysicalMaterial({ color, roughness: 0.62, sheen: 0.6, sheenRoughness: 0.5, sheenColor: 0xfff0d8, ...opts });
}
function sph(r, m, sx = 1, sy = 1, sz = 1, w = 32, h = 24) {
  const o = new THREE.Mesh(new THREE.SphereGeometry(r, w, h), m);
  o.scale.set(sx, sy, sz);
  o.castShadow = true;
  return o;
}

export function createDoudou() {
  const root = new THREE.Group();     // 位置、朝向
  const hopG = new THREE.Group();     // 跳跃、身体起伏
  const body = new THREE.Group();     // 挤压拉伸、歪头
  root.add(hopG); hopG.add(body);

  const fur = mat(FUR), cream = mat(CREAM), pink = mat(PINK, { sheen: 0.2 });
  const shell = sph(0.34, fur, 1.0, 0.92, 0.9); shell.position.y = 0.33; body.add(shell);
  const belly = sph(0.25, cream, 1.0, 0.95, 0.62); belly.position.set(0, 0.27, 0.15); body.add(belly);
  // 脸颊（仓鼠的鼓鼓腮帮）
  for (const s of [-1, 1]) {
    const cheek = sph(0.11, cream, 1, 0.9, 0.9); cheek.position.set(s * 0.16, 0.33, 0.2); body.add(cheek);
    const blush = new THREE.Mesh(new THREE.CircleGeometry(0.045, 24), new THREE.MeshBasicMaterial({ color: 0xff8ea0, transparent: true, opacity: 0.75 }));
    blush.position.set(s * 0.19, 0.34, 0.285); blush.rotation.y = s * 0.45; body.add(blush);
  }
  // 耳朵
  for (const s of [-1, 1]) {
    const ear = new THREE.Group();
    const outer = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.035, 28), mat(FUR_DARK));
    outer.rotation.x = Math.PI / 2; outer.castShadow = true;
    const inner = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.02, 28), pink);
    inner.rotation.x = Math.PI / 2; inner.position.z = 0.014;
    ear.add(outer, inner);
    ear.position.set(s * 0.19, 0.6, 0.02); ear.rotation.z = -s * 0.35;
    body.add(ear);
  }
  // 眼睛（可眨眼）
  const eyes = [];
  for (const s of [-1, 1]) {
    const e = new THREE.Group();
    const ball = sph(0.052, new THREE.MeshPhysicalMaterial({ color: EYE, roughness: 0.15, clearcoat: 1 }), 1, 1.12, 0.7);
    const hi = sph(0.017, new THREE.MeshBasicMaterial({ color: 0xffffff }), 1, 1, 0.6, 12, 8); hi.position.set(0.018, 0.022, 0.03);
    const hi2 = sph(0.008, new THREE.MeshBasicMaterial({ color: 0xffffff }), 1, 1, 0.6, 8, 6); hi2.position.set(-0.016, -0.018, 0.032);
    e.add(ball, hi, hi2);
    e.position.set(s * 0.105, 0.43, 0.27);
    body.add(e); eyes.push(e);
  }
  // 鼻子、嘴巴
  const nose = sph(0.022, pink, 1.2, 0.9, 0.8, 16, 12); nose.position.set(0, 0.375, 0.305); body.add(nose);
  const mouth = new THREE.Group();
  const mouthIn = sph(0.04, new THREE.MeshBasicMaterial({ color: 0x8a2d3b }), 1, 1, 0.35, 20, 14);
  const tongue = sph(0.024, new THREE.MeshBasicMaterial({ color: 0xff7b8f }), 1, 0.7, 0.4, 14, 10); tongue.position.set(0, -0.012, 0.006);
  mouth.add(mouthIn, tongue);
  mouth.position.set(0, 0.335, 0.298);
  body.add(mouth);
  // 豆芽
  const sprout = new THREE.Group();
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.13, 10), mat(SPROUT, { sheen: 0 }));
  stem.position.y = 0.065; stem.castShadow = true; sprout.add(stem);
  for (const s of [-1, 1]) {
    const leaf = sph(0.06, mat(0x84dc6a, { sheen: 0 }), 1.0, 0.32, 0.55, 20, 12);
    leaf.position.set(s * 0.055, 0.135, 0); leaf.rotation.z = s * 0.45;
    sprout.add(leaf);
  }
  sprout.position.set(0, 0.62, 0.02);
  body.add(sprout);
  // 手臂（以肩为轴）
  const arms = [];
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(s * 0.23, 0.27, 0.12);
    const arm = sph(0.055, fur, 0.85, 1.25, 0.85, 16, 12); arm.position.set(0, -0.05, 0.02);
    const paw = sph(0.042, pink, 1, 0.9, 0.9, 16, 12); paw.position.set(0, -0.11, 0.03);
    pivot.add(arm, paw);
    body.add(pivot); arms.push(pivot);
  }
  // 脚、尾巴
  for (const s of [-1, 1]) {
    const foot = sph(0.07, pink, 1, 0.45, 1.25, 16, 10); foot.position.set(s * 0.12, 0.025, 0.14); hopG.add(foot);
  }
  const tail = sph(0.04, fur, 1, 1, 1, 12, 8); tail.position.set(0, 0.16, -0.31); body.add(tail);

  // 气泡锚点（头顶上方），给文字层投影用
  const head = new THREE.Object3D(); head.position.set(0, 0.86, 0); body.add(head);

  /**
   * actions: [{type, at, dur, ...}]
   *  hop | wave{side} | point{side, dir:[x,y,z]} | cheer | think | surprise | shy | nod | shake | walk{from:[x,z], to:[x,z]} | look{yaw}
   */
  function update(t, { base = V(0, 0, 0), yaw = 0, scale = 1, mouth: m = 0, actions = [], talking = 0 } = {}) {
    let pos = base.clone(), y = 0, sq = 1, tilt = 0, roll = 0, yw = yaw, eyeOpen = 1, eyeBig = 1;
    let aL = 0.15, aR = -0.15, aLx = 0, aRx = 0; // 手臂：z 旋转（抬起）、x 旋转（前伸）
    // 呼吸和说话时的轻微起伏
    const breath = Math.sin(t * 2.4) * 0.012;
    y += breath + talking * Math.abs(Math.sin(t * 9)) * 0.012;
    tilt += talking * Math.sin(t * 4.3) * 0.05;
    // 眨眼（确定性：每 2.7–3.9 秒一次）
    const period = 3.3, ph = (t + 0.7) % period;
    if (ph < 0.14) eyeOpen = Math.abs(ph - 0.07) / 0.07;

    for (const a of actions) {
      if (t < a.at) continue;
      const k = seg(t, a.at, a.at + (a.dur ?? 0.6));
      if (k >= 1) {                       // 动作结束后保留的状态
        if (a.type === "walk") pos.set(a.to[0], 0, a.to[1]);
        if (a.type === "look" && a.keep) yw = a.yaw;
        continue;
      }
      const s = Math.sin(Math.PI * k);
      switch (a.type) {
        case "hop": { const n = a.n ?? 1, kk = (k * n) % 1; y += Math.sin(Math.PI * kk) * (a.h ?? 0.18); sq = 1 + (kk < 0.15 || kk > 0.85 ? -0.08 : 0.05); break; }
        case "cheer": { y += Math.abs(Math.sin(Math.PI * k * 2)) * 0.2; aL = lerp(aL, 2.6, Math.min(1, s * 3)); aR = lerp(aR, -2.6, Math.min(1, s * 3)); eyeBig = 1.1; break; }
        case "wave": { const w = Math.min(1, s * 4); if ((a.side ?? "R") === "R") aR = lerp(aR, -2.3 + Math.sin(t * 14) * 0.35, w); else aL = lerp(aL, 2.3 + Math.sin(t * 14) * 0.35, w); tilt += 0.08 * w; break; }
        case "point": { const w = ease(seg(t, a.at, a.at + 0.25)) * (1 - ease(seg(t, a.at + (a.dur ?? 1) - 0.25, a.at + (a.dur ?? 1)))); if ((a.side ?? "R") === "R") { aR = lerp(aR, -1.5, w); aRx = lerp(0, -0.6, w); } else { aL = lerp(aL, 1.5, w); aLx = lerp(0, -0.6, w); } break; }
        case "think": { const w = ease(seg(t, a.at, a.at + 0.3)) * (1 - ease(seg(t, a.at + (a.dur ?? 1.2) - 0.3, a.at + (a.dur ?? 1.2)))); roll += 0.22 * w; aR = lerp(aR, -1.9, w); aRx = lerp(0, -1.1, w); eyeOpen = Math.min(eyeOpen, 1 - 0.35 * w); break; }
        case "surprise": { y += s * 0.12; eyeBig = 1 + 0.35 * s; sq = 1 + 0.08 * s; aL = lerp(aL, 1.2, s); aR = lerp(aR, -1.2, s); break; }
        case "shy": { const w = ease(seg(t, a.at, a.at + 0.3)) * (1 - ease(seg(t, a.at + (a.dur ?? 1.2) - 0.3, a.at + (a.dur ?? 1.2)))); aL = lerp(aL, 1.0, w); aR = lerp(aR, -1.0, w); aLx = aRx = -1.3 * w; roll -= 0.12 * w; eyeOpen = Math.min(eyeOpen, 1 - 0.5 * w); break; }
        case "nod": { tilt += Math.sin(k * Math.PI * 4) * 0.12; break; }
        case "shake": { yw += Math.sin(k * Math.PI * 4) * 0.3; break; }
        case "walk": { const kk = ease(k); pos.set(lerp(a.from[0], a.to[0], kk), 0, lerp(a.from[1], a.to[1], kk)); y += Math.abs(Math.sin(k * Math.PI * (a.steps ?? 4))) * 0.07; yw = Math.atan2(a.to[0] - a.from[0], a.to[1] - a.from[1]) * (1 - Math.pow(Math.abs(2 * k - 1), 6)) + yw * Math.pow(Math.abs(2 * k - 1), 6); break; }
        case "look": { yw = lerp(yw, a.yaw, ease(k)); break; }
      }
    }
    root.position.copy(pos);
    root.rotation.y = yw;
    root.scale.setScalar(scale);
    hopG.position.y = y;
    body.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
    body.rotation.set(tilt * 0.6, 0, roll);
    // aL / aR 为“抬起角”：左臂向外抬是绕 z 负转，右臂是正转
    arms[0].rotation.set(aLx, 0, -aL);
    arms[1].rotation.set(aRx, 0, -aR);
    for (const e of eyes) e.scale.set(eyeBig, Math.max(0.08, eyeOpen) * eyeBig, eyeBig);
    const mo = clamp(m);
    mouth.scale.set(0.8 + 0.35 * mo, 0.25 + 1.1 * mo, 1);
    sprout.rotation.z = Math.sin(t * 3.1) * 0.08 + roll * 0.5 - (y > 0.05 ? 0.12 : 0);
  }

  return { group: root, head, update };
}
