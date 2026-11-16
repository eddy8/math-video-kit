// 场景主题：背景、地台、远景装饰、飘浮粒子、灯光。每课一个主题，按课号轮换。
import * as THREE from "three";
import { rng, lerp } from "./util.js";

function canvasTex(size, draw, repeat = 1) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  draw(c.getContext("2d"), size);
  const tx = new THREE.CanvasTexture(c);
  tx.colorSpace = THREE.SRGBColorSpace;
  tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
  tx.repeat.set(repeat, repeat);
  tx.anisotropy = 8;
  return tx;
}
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o });
function mesh(geo, m, cast = true) { const o = new THREE.Mesh(geo, m); o.castShadow = cast; o.receiveShadow = true; return o; }

/** 圆形地台：顶面贴图 + 侧边 */
function platform(topTex, sideColor, r = 2.3, h = 0.12) {
  const g = new THREE.Group();
  const m = mesh(new THREE.CylinderGeometry(r, r * 1.02, h, 96), [std(sideColor), new THREE.MeshStandardMaterial({ map: topTex, roughness: 0.85 }), std(sideColor)], false);
  m.position.y = -h / 2;
  m.receiveShadow = true;
  g.add(m);
  return g;
}
function tree(x, z, s = 1, leaf = 0x6cc36a) {
  const g = new THREE.Group();
  const trunk = mesh(new THREE.CylinderGeometry(0.08, 0.11, 0.6, 12), std(0x9a6a43));
  trunk.position.y = 0.3;
  g.add(trunk);
  [[0, 0.85, 0.45], [0.18, 0.7, 0.32], [-0.2, 0.72, 0.3], [0, 1.15, 0.32]].forEach(([dx, dy, r]) => {
    const b = mesh(new THREE.SphereGeometry(r, 20, 16), std(leaf, { roughness: 0.9 }));
    b.position.set(dx, dy, 0);
    g.add(b);
  });
  g.position.set(x, 0, z); g.scale.setScalar(s);
  return g;
}
function cloud(x, y, z, s = 1) {
  const g = new THREE.Group();
  [[0, 0, 0.35], [0.35, -0.05, 0.27], [-0.35, -0.05, 0.27], [0.15, 0.18, 0.25]].forEach(([dx, dy, r]) => {
    const b = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, emissive: 0x333333 }));
    b.position.set(dx, dy, 0);
    g.add(b);
  });
  g.position.set(x, y, z); g.scale.setScalar(s);
  return g;
}

export const THEMES = {
  picnic: {
    label: "森林野餐", accent: "#2f9e44",
    bg: ["#cfeeff", "#e9f8ff", "#fff3d9"], dots: "rgba(255,255,255,.55)",
    hemi: [0xfff6e8, 0x9bd17f, 1.25], sun: [0xfff1d8, 2.3],
    build(scene) {
      const top = canvasTex(512, (g, s) => {
        g.fillStyle = "#86cf6b"; g.fillRect(0, 0, s, s);
        const r = rng(3);
        for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${r() > .5 ? "60,140,60" : "170,225,120"},.5)`; g.fillRect(r() * s, r() * s, 2, 6); }
        // 野餐垫
        g.save(); g.translate(s / 2, s / 2); g.rotate(0.12);
        const n = 8, w = s * 0.6 / n;
        for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { g.fillStyle = (i + j) % 2 ? "#ffffff" : "#ff7d7d"; g.fillRect(-s * 0.3 + i * w, -s * 0.3 + j * w, w, w); }
        g.restore();
      });
      const p = platform(top, 0x6fb357); scene.add(p);
      [[-2.0, -1.6, 1.1], [2.1, -1.5, 1.0], [-2.6, -0.3, 0.8], [2.7, -0.4, 0.75]].forEach(([x, z, s]) => scene.add(tree(x, z, s)));
      [[-1.5, 2.4, -2.6, 0.9], [1.7, 2.8, -2.8, 0.8]].forEach(([x, y, z, s]) => scene.add(cloud(x, y, z, s)));
      const r = rng(5);
      for (let i = 0; i < 14; i++) {
        const a = r() * Math.PI * 2, d = lerp(1.7, 2.2, r());
        const f = mesh(new THREE.SphereGeometry(0.035, 10, 8), std([0xffd84d, 0xff9ad0, 0xffffff][i % 3]));
        f.position.set(Math.cos(a) * d, 0.03, Math.sin(a) * d * 0.8 - 0.2); scene.add(f);
      }
    },
    particles: { kind: "petal", colors: [0xffb3c8, 0xffe08a, 0xffffff] },
  },
  kitchen: {
    label: "温馨厨房", accent: "#f76707",
    bg: ["#ffe4c4", "#fff1de", "#ffe0e6"], dots: "rgba(255,170,120,.35)",
    hemi: [0xfff4e6, 0xd8a77a, 1.2], sun: [0xfff0dd, 2.3],
    build(scene) {
      const top = canvasTex(512, (g, s) => {
        g.fillStyle = "#e7b886"; g.fillRect(0, 0, s, s);
        const r = rng(8);
        for (let i = 0; i < 16; i++) { g.fillStyle = `rgba(150,95,50,${0.12 + r() * 0.1})`; g.fillRect(0, i * s / 16, s, 3); }
        for (let i = 0; i < 200; i++) { g.strokeStyle = "rgba(150,95,50,.15)"; g.beginPath(); const y = r() * s; g.moveTo(r() * s, y); g.lineTo(r() * s, y + (r() - .5) * 6); g.stroke(); }
      });
      scene.add(platform(top, 0xb98552));
      // 后墙瓷砖 + 搁板 + 罐子
      const tiles = canvasTex(512, (g, s) => {
        g.fillStyle = "#fffaf0"; g.fillRect(0, 0, s, s);
        g.strokeStyle = "#f0d9c4"; g.lineWidth = 6;
        for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * s / 8, 0); g.lineTo(i * s / 8, s); g.stroke(); g.beginPath(); g.moveTo(0, i * s / 8); g.lineTo(s, i * s / 8); g.stroke(); }
      }, 2);
      const wall = mesh(new THREE.PlaneGeometry(7, 3.4), new THREE.MeshStandardMaterial({ map: tiles, roughness: 0.6 }), false);
      wall.position.set(0, 1.5, -2.6); scene.add(wall);
      const shelf = mesh(new THREE.BoxGeometry(3.2, 0.08, 0.35), std(0xc98d5a)); shelf.position.set(0, 1.55, -2.4); scene.add(shelf);
      [0xff8a65, 0x7ec8e3, 0xffd166, 0x9ad08a, 0xf4a3c0].forEach((c, i) => {
        const jar = mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.32 + (i % 2) * 0.1, 20), std(c, { roughness: 0.4 }));
        jar.position.set(-1.2 + i * 0.6, 1.75 + (i % 2) * 0.05, -2.4); scene.add(jar);
        const lid = mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.05, 20), std(0xffffff)); lid.position.set(-1.2 + i * 0.6, 1.93 + (i % 2) * 0.1, -2.4); scene.add(lid);
      });
    },
    particles: { kind: "sparkle", colors: [0xffffff, 0xffe6a8] },
  },
  space: {
    label: "太空探险", accent: "#7c5cff",
    bg: ["#0f1638", "#1d2a5e", "#3b2f6b"], dots: "rgba(255,255,255,.55)",
    hemi: [0xb9c8ff, 0x3a2f5a, 1.1], sun: [0xffffff, 2.5],
    build(scene) {
      const top = canvasTex(512, (g, s) => {
        g.fillStyle = "#c9c6d6"; g.fillRect(0, 0, s, s);
        const r = rng(11);
        for (let i = 0; i < 40; i++) { const x = r() * s, y = r() * s, rr = 6 + r() * 26; g.fillStyle = "rgba(150,145,170,.6)"; g.beginPath(); g.arc(x, y, rr, 0, 7); g.fill(); g.fillStyle = "rgba(230,228,240,.6)"; g.beginPath(); g.arc(x - rr * .2, y - rr * .2, rr * .7, 0, 7); g.fill(); }
      });
      scene.add(platform(top, 0x8f8ba6));
      const planet = mesh(new THREE.SphereGeometry(0.6, 40, 30), std(0xff9e6b, { roughness: 0.7 }));
      planet.position.set(-2.1, 2.3, -3); scene.add(planet);
      const ring = mesh(new THREE.TorusGeometry(0.9, 0.05, 10, 60), std(0xffe08a)); ring.rotation.x = 1.2; ring.position.copy(planet.position); scene.add(ring);
      const moon = mesh(new THREE.SphereGeometry(0.28, 30, 20), std(0x9fd8ff)); moon.position.set(2.2, 2.6, -2.8); scene.add(moon);
      // 小火箭
      const rocket = new THREE.Group();
      const b = mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.5, 20), std(0xffffff)); b.position.y = 0.25; rocket.add(b);
      const nose = mesh(new THREE.ConeGeometry(0.12, 0.22, 20), std(0xff5d5d)); nose.position.y = 0.61; rocket.add(nose);
      const win = mesh(new THREE.SphereGeometry(0.05, 12, 10), std(0x5ac8ff)); win.position.set(0, 0.32, 0.12); rocket.add(win);
      rocket.position.set(2.0, 0, -1.3); rocket.rotation.z = -0.15; scene.add(rocket);
    },
    particles: { kind: "star", colors: [0xffffff, 0xfff3a0, 0xa8d8ff] },
  },
  ocean: {
    label: "海底世界", accent: "#1c7ed6",
    bg: ["#5fc3e8", "#8fd8f0", "#d9f3f7"], dots: "rgba(255,255,255,.45)",
    hemi: [0xd8f6ff, 0x5fa7b5, 1.25], sun: [0xe8fbff, 2.2],
    build(scene) {
      const top = canvasTex(512, (g, s) => {
        g.fillStyle = "#f4dfb0"; g.fillRect(0, 0, s, s);
        const r = rng(13);
        for (let i = 0; i < 1500; i++) { g.fillStyle = `rgba(${r() > .5 ? "210,180,120" : "255,245,215"},.6)`; g.fillRect(r() * s, r() * s, 2, 2); }
        for (let i = 0; i < 10; i++) { g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 3; g.beginPath(); const y = r() * s; g.moveTo(0, y); g.bezierCurveTo(s * .3, y - 20, s * .6, y + 20, s, y); g.stroke(); }
      });
      scene.add(platform(top, 0xd8bf8b));
      const r = rng(17);
      for (let i = 0; i < 7; i++) {
        const sw = new THREE.Group(), x = (i % 2 ? 1 : -1) * lerp(1.8, 2.6, r()), z = lerp(-2.2, -0.6, r());
        for (let j = 0; j < 5; j++) { const seg = mesh(new THREE.CapsuleGeometry(0.05, 0.22, 4, 8), std(0x3fb37a)); seg.position.set(Math.sin(j) * 0.04, 0.14 + j * 0.24, 0); sw.add(seg); }
        sw.position.set(x, 0, z); sw.userData.sway = r() * 6; sw.name = "sway"; scene.add(sw);
      }
      [[-2.0, -1.9, 0xff7f7f], [2.2, -1.7, 0xffb26b], [-2.5, -0.8, 0xc58bff]].forEach(([x, z, c]) => {
        for (let j = 0; j < 4; j++) { const b = mesh(new THREE.SphereGeometry(0.16 - j * 0.02, 16, 12), std(c)); b.position.set(x + (j - 1.5) * 0.12, 0.12 + (j % 2) * 0.15, z); scene.add(b); }
      });
      // 小鱼
      [[-1.6, 2.0, -2.4, 0xffb23f], [1.8, 2.4, -2.6, 0x6ad1ff]].forEach(([x, y, z, c]) => {
        const f = new THREE.Group();
        const body = mesh(new THREE.SphereGeometry(0.18, 20, 14), std(c)); body.scale.set(1.3, 0.85, 0.6); f.add(body);
        const tail = mesh(new THREE.ConeGeometry(0.12, 0.18, 3), std(c)); tail.rotation.z = Math.PI / 2; tail.position.x = -0.28; f.add(tail);
        const eye = mesh(new THREE.SphereGeometry(0.03, 8, 6), std(0x222222)); eye.position.set(0.14, 0.04, 0.09); f.add(eye);
        f.position.set(x, y, z); f.name = "fish"; f.userData.home = f.position.clone(); scene.add(f);
      });
    },
    particles: { kind: "bubble", colors: [0xffffff] },
  },
  market: {
    label: "小超市", accent: "#e03131",
    bg: ["#fff0d1", "#fff7e8", "#e3f4ff"], dots: "rgba(120,190,255,.35)",
    hemi: [0xffffff, 0xd0c4b0, 1.25], sun: [0xffffff, 2.2],
    build(scene) {
      const top = canvasTex(512, (g, s) => {
        const n = 8, w = s / n;
        for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { g.fillStyle = (i + j) % 2 ? "#f3f6fa" : "#dfe8f2"; g.fillRect(i * w, j * w, w, w); }
      });
      scene.add(platform(top, 0x9fb3c8));
      const r = rng(19);
      [-1.6, 0, 1.6].forEach((x) => {
        const shelf = new THREE.Group();
        const frame = mesh(new THREE.BoxGeometry(1.4, 1.5, 0.4), std(0xf2f2f2)); frame.position.y = 0.75; shelf.add(frame);
        for (let k = 0; k < 3; k++) {
          const board = mesh(new THREE.BoxGeometry(1.36, 0.04, 0.44), std(0xffa94d)); board.position.set(0, 0.25 + k * 0.48, 0.02); shelf.add(board);
          for (let m = 0; m < 5; m++) {
            const c = [0xff6b6b, 0x4dabf7, 0xffd43b, 0x69db7c, 0xda77f2][Math.floor(r() * 5)];
            const box = mesh(new THREE.BoxGeometry(0.2, 0.26 + r() * 0.1, 0.2), std(c, { roughness: 0.5 }));
            box.position.set(-0.52 + m * 0.26, 0.42 + k * 0.48, 0.05); shelf.add(box);
          }
        }
        shelf.position.set(x, 0, -2.5); scene.add(shelf);
      });
    },
    particles: { kind: "sparkle", colors: [0xffffff, 0xffe066] },
  },
  playground: {
    label: "游乐园", accent: "#d6336c",
    bg: ["#ffd9ec", "#fff1f7", "#dff6ff"], dots: "rgba(255,150,200,.35)",
    hemi: [0xfff3fb, 0xa8d98f, 1.25], sun: [0xfff6ee, 2.3],
    build(scene) {
      const top = canvasTex(512, (g, s) => {
        g.fillStyle = "#9fdc7c"; g.fillRect(0, 0, s, s);
        g.fillStyle = "#f6dfa6"; g.beginPath(); g.arc(s / 2, s / 2, s * 0.32, 0, 7); g.fill();
        const r = rng(23);
        for (let i = 0; i < 600; i++) { g.fillStyle = "rgba(70,150,60,.35)"; g.fillRect(r() * s, r() * s, 2, 5); }
      });
      scene.add(platform(top, 0x78b85c));
      // 滑梯
      const slide = new THREE.Group();
      const ladder = mesh(new THREE.BoxGeometry(0.5, 1.2, 0.08), std(0x4dabf7)); ladder.position.set(0, 0.6, 0); slide.add(ladder);
      const deck = mesh(new THREE.BoxGeometry(0.6, 0.06, 0.5), std(0xffd43b)); deck.position.set(0, 1.2, 0.25); slide.add(deck);
      const ramp = mesh(new THREE.BoxGeometry(0.5, 0.05, 1.4), std(0xff6b6b)); ramp.position.set(0, 0.62, 1.05); ramp.rotation.x = 0.75; slide.add(ramp);
      slide.position.set(-2.2, 0, -2.0); slide.rotation.y = 0.5; scene.add(slide);
      // 气球
      [[1.9, -2.0, 0xff6b9a], [2.25, -1.8, 0x74c0fc], [2.05, -1.5, 0xffd43b]].forEach(([x, z, c], i) => {
        const b = mesh(new THREE.SphereGeometry(0.2, 20, 16), std(c, { roughness: 0.3 })); b.scale.y = 1.15;
        b.position.set(x, 1.9 + i * 0.15, z); b.name = "balloon"; b.userData.home = b.position.clone(); b.userData.ph = i; scene.add(b);
        const str = mesh(new THREE.CylinderGeometry(0.004, 0.004, 1.7, 4), std(0x888888), false); str.position.set(x, 1.0 + i * 0.07, z); scene.add(str);
      });
      [[-2.6, -0.6], [2.7, -0.5]].forEach(([x, z]) => scene.add(tree(x, z, 0.75, 0x7dd36f)));
    },
    particles: { kind: "confetti", colors: [0xff6b9a, 0x74c0fc, 0xffd43b, 0x69db7c] },
  },
};
export const THEME_ORDER = ["picnic", "kitchen", "space", "ocean", "market", "playground"];

/** 漂浮粒子（确定性） */
export function buildParticles(scene, spec) {
  const out = [];
  const r = rng(29);
  for (let i = 0; i < 26; i++) {
    let geo;
    if (spec.kind === "bubble") geo = new THREE.SphereGeometry(0.035 + r() * 0.03, 12, 10);
    else if (spec.kind === "star" || spec.kind === "sparkle") geo = new THREE.OctahedronGeometry(0.03 + r() * 0.025);
    else geo = new THREE.PlaneGeometry(0.06, 0.09);
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      color: spec.colors[i % spec.colors.length], side: THREE.DoubleSide, transparent: true,
      opacity: spec.kind === "bubble" ? 0.55 : 0.9, emissive: spec.kind === "star" ? 0x555555 : 0x000000, roughness: 0.4,
    }));
    scene.add(m);
    out.push({ m, x: lerp(-2.6, 2.6, r()), z: lerp(-2.4, 0.6, r()), y0: lerp(0.3, 3.2, r()), sp: lerp(0.15, 0.4, r()), ph: r() * 10 });
  }
  return (t) => {
    for (const p of out) {
      const k = spec.kind;
      if (k === "bubble") { const y = ((p.y0 + t * p.sp * 1.5) % 3.4); p.m.position.set(p.x + Math.sin(t + p.ph) * 0.08, y, p.z); }
      else if (k === "star" || k === "sparkle") { p.m.position.set(p.x, p.y0 + 0.4, p.z); const s = 0.5 + 0.5 * Math.sin(t * 2.5 + p.ph); p.m.scale.setScalar(0.4 + s); p.m.rotation.y = t + p.ph; }
      else { const y = 3.4 - ((p.y0 + t * p.sp) % 3.4); p.m.position.set(p.x + Math.sin(t * 0.8 + p.ph) * 0.25, y, p.z); p.m.rotation.set(t * 1.3 + p.ph, t * 0.9, p.ph); }
    }
  };
}
