// 道具库：常用的可爱三维物体。每个函数返回 THREE.Group，底部贴地（y=0），尺寸约 0.3–0.5。
// 需要新物体时，优先在课程文件里用这些零件拼；通用的再补进这里。
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const phys = (color, o = {}) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.45, clearcoat: 0.35, clearcoatRoughness: 0.4, ...o });
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
function m(geo, mat, y = 0) { const o = new THREE.Mesh(geo, mat); o.position.y = y; o.castShadow = true; o.receiveShadow = true; return o; }
function grp(...xs) { const g = new THREE.Group(); xs.forEach((x) => g.add(x)); return g; }
function textTex(text, { bg = "#ffffff", fg = "#5a3418", size = 256, font = 150, round = 40 } = {}) {
  const c = document.createElement("canvas"); c.width = c.height = size;
  const g = c.getContext("2d");
  g.fillStyle = bg; g.beginPath(); g.roundRect(0, 0, size, size, round); g.fill();
  g.fillStyle = fg; g.textAlign = "center"; g.textBaseline = "middle";
  g.font = `900 ${font}px 'Noto Sans CJK SC'`; g.fillText(text, size / 2, size / 2 + font * 0.05);
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 8; return tx;
}

export const COLORS = { red: 0xff6b6b, orange: 0xffa94d, yellow: 0xffd43b, green: 0x69db7c, blue: 0x4dabf7, purple: 0xb197fc, pink: 0xff8cc6, brown: 0x8b5a2b };

export const props = {
  apple(color = 0xff5a5a) {
    const body = m(new THREE.SphereGeometry(0.16, 32, 24), phys(color), 0.15); body.scale.set(1, 0.92, 1);
    const stem = m(new THREE.CylinderGeometry(0.012, 0.016, 0.08, 8), std(0x7a4b2a), 0.32); stem.rotation.z = 0.2;
    const leaf = m(new THREE.SphereGeometry(0.05, 16, 10), std(0x5cc25a), 0.33); leaf.scale.set(1.2, 0.3, 0.6); leaf.position.x = 0.05; leaf.rotation.z = -0.4;
    return grp(body, stem, leaf);
  },
  orange() {
    const body = m(new THREE.SphereGeometry(0.16, 32, 24), phys(0xffa23a, { roughness: 0.7 }), 0.155);
    const top = m(new THREE.SphereGeometry(0.025, 10, 8), std(0x5cc25a), 0.31);
    return grp(body, top);
  },
  strawberry() {
    const body = m(new THREE.ConeGeometry(0.12, 0.22, 24), phys(0xff4d6d), 0.12); body.rotation.x = Math.PI;
    const cap = m(new THREE.ConeGeometry(0.1, 0.06, 6), std(0x4cbf5a), 0.25);
    return grp(body, cap);
  },
  candy(color = COLORS.pink) {
    const c = m(new THREE.SphereGeometry(0.09, 24, 16), phys(color), 0.09); c.scale.set(1.3, 1, 1);
    const w1 = m(new THREE.ConeGeometry(0.06, 0.1, 12), phys(color), 0.09); w1.rotation.z = Math.PI / 2; w1.position.x = 0.16;
    const w2 = w1.clone(); w2.rotation.z = -Math.PI / 2; w2.position.x = -0.16;
    return grp(c, w1, w2);
  },
  cookie() {
    const c = m(new THREE.CylinderGeometry(0.15, 0.15, 0.05, 32), std(0xd9a066), 0.025);
    const g = grp(c);
    [[0.05, 0.03], [-0.06, 0.05], [0.0, -0.07], [-0.04, -0.02]].forEach(([x, z]) => { const d = m(new THREE.SphereGeometry(0.018, 8, 6), std(0x5a3418), 0.055); d.position.x = x; d.position.z = z; g.add(d); });
    return g;
  },
  bean(color = 0x8bc34a) {  // 豆豆的豆子，数数用
    const b = m(new THREE.SphereGeometry(0.07, 20, 14), phys(color), 0.055); b.scale.set(1.25, 0.8, 0.9);
    return grp(b);
  },
  block(color = COLORS.blue, size = 0.3) {  // 圆角积木
    return grp(m(new RoundedBoxGeometry(size, size, size, 4, size * 0.12), phys(color), size / 2));
  },
  cuboid(color = COLORS.orange, w = 0.5, h = 0.3, d = 0.3) {
    return grp(m(new RoundedBoxGeometry(w, h, d, 4, 0.03), phys(color), h / 2));
  },
  cylinder(color = COLORS.green, r = 0.16, h = 0.4) { return grp(m(new THREE.CylinderGeometry(r, r, h, 40), phys(color), h / 2)); },
  ball(color = COLORS.red, r = 0.17) { return grp(m(new THREE.SphereGeometry(r, 40, 30), phys(color), r)); },
  cone(color = COLORS.purple, r = 0.18, h = 0.4) { return grp(m(new THREE.ConeGeometry(r, h, 40), phys(color), h / 2)); },
  /** 小棒（数位、计数用），bundle=true 时是一捆 10 根 */
  stick(color = 0xffc94d) { const s = m(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 10), phys(color), 0.02); s.rotation.z = Math.PI / 2; return grp(s); },
  bundle(color = 0xffc94d) {
    const g = new THREE.Group();
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2, r = i < 3 ? 0.012 : 0.04; const s = m(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 10), phys(color), 0.06 + Math.sin(a) * r); s.rotation.z = Math.PI / 2; s.position.z = Math.cos(a) * r; g.add(s); }
    const band = m(new THREE.TorusGeometry(0.065, 0.012, 8, 24), std(0xff4d6d), 0.06); band.rotation.y = Math.PI / 2; g.add(band);
    return g;
  },
  counter(color = COLORS.red) { return grp(m(new THREE.CylinderGeometry(0.1, 0.1, 0.04, 32), phys(color), 0.02)); },
  /** 数字卡片：竖立的圆角牌子 */
  card(text, { bg = "#ffffff", fg = "#5a3418", w = 0.42, h = 0.42 } = {}) {
    const tex = textTex(text, { bg, fg, font: text.length > 2 ? 90 : 150 });
    const face = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 });
    const box = m(new RoundedBoxGeometry(w, h, 0.05, 3, 0.03), [std(0xffffff), std(0xffffff), std(0xffffff), std(0xffffff), face, std(0xffffff)], h / 2);
    return grp(box);
  },
  /** 通用硬币/纸币：只写面额，不仿真币面 */
  coin(value, unit = "元", { color = "#e8ecf2", rim = 0xc7ced8, r = 0.3 } = {}) {
    const c = document.createElement("canvas"); c.width = c.height = 256;
    const g = c.getContext("2d");
    const grd = g.createRadialGradient(100, 90, 10, 128, 128, 128); grd.addColorStop(0, "#fff"); grd.addColorStop(0.4, color); grd.addColorStop(1, "#9aa3ae");
    g.fillStyle = grd; g.beginPath(); g.arc(128, 128, 128, 0, 7); g.fill();
    g.fillStyle = "rgba(80,55,20,.85)"; g.textAlign = "center"; g.textBaseline = "middle";
    g.font = "900 110px 'Noto Sans CJK SC'"; g.fillText(value, 128, 112); g.font = "900 40px 'Noto Sans CJK SC'"; g.fillText(unit, 128, 188);
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace;
    const face = new THREE.MeshStandardMaterial({ map: tx, metalness: 0.3, roughness: 0.35 });
    const coin = m(new THREE.CylinderGeometry(r, r, 0.05, 64), [std(rim, { metalness: 0.8, roughness: 0.3 }), face, face], 0.025);
    coin.rotation.y = Math.PI / 2;
    return grp(coin);
  },
  note(value, unit = "元", color = "#b2f2bb") {
    const tex = (() => { const c = document.createElement("canvas"); c.width = 512; c.height = 256; const g = c.getContext("2d"); g.fillStyle = color; g.fillRect(0, 0, 512, 256); g.strokeStyle = "rgba(0,0,0,.2)"; g.lineWidth = 10; g.strokeRect(14, 14, 484, 228); g.fillStyle = "rgba(40,60,40,.85)"; g.font = "900 120px 'Noto Sans CJK SC'"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(value + unit, 256, 130); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
    const n = m(new THREE.BoxGeometry(0.7, 0.01, 0.35), [std(0xffffff), std(0xffffff), new THREE.MeshStandardMaterial({ map: tex }), std(0xeeeeee), std(0xffffff), std(0xffffff)], 0.005);
    return grp(n);
  },
  /** 钟：返回的 group.userData.set(h, m) 设置指针 */
  clock() {
    const c = document.createElement("canvas"); c.width = c.height = 512; const g = c.getContext("2d");
    g.fillStyle = "#fffdf6"; g.beginPath(); g.arc(256, 256, 250, 0, 7); g.fill();
    g.fillStyle = "#5a3418"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = "900 64px 'Noto Sans CJK SC'";
    for (let i = 1; i <= 12; i++) { const a = (i / 12) * Math.PI * 2; g.fillText(String(i), 256 + Math.sin(a) * 190, 256 - Math.cos(a) * 190); }
    for (let i = 0; i < 60; i++) { const a = (i / 60) * Math.PI * 2, r1 = i % 5 ? 232 : 222; g.strokeStyle = "#5a3418"; g.lineWidth = i % 5 ? 3 : 7; g.beginPath(); g.moveTo(256 + Math.sin(a) * r1, 256 - Math.cos(a) * r1); g.lineTo(256 + Math.sin(a) * 246, 256 - Math.cos(a) * 246); g.stroke(); }
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace;
    const group = new THREE.Group();
    const rim = m(new THREE.TorusGeometry(0.5, 0.06, 16, 64), phys(0xff8a5c)); rim.position.y = 0.56; group.add(rim);
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.5, 64), new THREE.MeshStandardMaterial({ map: tx, roughness: 0.6 })); face.position.set(0, 0.56, 0.005); group.add(face);
    const back = m(new THREE.CylinderGeometry(0.5, 0.5, 0.06, 48), phys(0xff8a5c), 0.56); back.rotation.x = Math.PI / 2; back.position.z = -0.03; group.add(back);
    const hand = (len, w, color, z) => { const p = new THREE.Group(); const b = m(new RoundedBoxGeometry(w, len, 0.02, 2, 0.008), phys(color)); b.position.y = len / 2 - 0.03; p.add(b); p.position.set(0, 0.56, z); group.add(p); return p; };
    const hH = hand(0.26, 0.05, 0x5a3418, 0.02), mH = hand(0.38, 0.03, 0xff5a5a, 0.035);
    const pin = m(new THREE.SphereGeometry(0.03, 12, 8), phys(0xffd43b)); pin.position.set(0, 0.56, 0.05); group.add(pin);
    const legs = [-1, 1].map((s) => { const l = m(new THREE.CylinderGeometry(0.03, 0.03, 0.12, 10), phys(0xff8a5c), 0.04); l.position.x = s * 0.28; return l; });
    legs.forEach((l) => group.add(l));
    group.userData.set = (h, mi) => { mH.rotation.z = -(mi / 60) * Math.PI * 2; hH.rotation.z = -(((h % 12) + mi / 60) / 12) * Math.PI * 2; };
    group.userData.set(12, 0);
    return group;
  },
  /** 尺子：length 厘米，scale 为每厘米的世界长度 */
  ruler(length = 10, scale = 0.12) {
    const L = length * scale + 0.12;
    const c = document.createElement("canvas"); c.width = 1024; c.height = 128; const g = c.getContext("2d");
    g.fillStyle = "#ffe08a"; g.fillRect(0, 0, 1024, 128); g.fillStyle = "#5a3418"; g.font = "700 34px 'Noto Sans CJK SC'"; g.textAlign = "center";
    const px = 1024 / L, x0 = 0.06 * px;
    for (let i = 0; i <= length * 10; i++) { const x = x0 + (i / 10) * scale * px; const h = i % 10 === 0 ? 50 : i % 5 === 0 ? 36 : 22; g.fillRect(x - 1.5, 0, 3, h); if (i % 10 === 0) g.fillText(String(i / 10), x, 92); }
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 8;
    const top = new THREE.MeshStandardMaterial({ map: tx, roughness: 0.5 });
    const r = m(new THREE.BoxGeometry(L, 0.03, 0.2), [std(0xf2c94c), std(0xf2c94c), top, std(0xf2c94c), std(0xf2c94c), std(0xf2c94c)], 0.015);
    return grp(r);
  },
  /** 平面图形片：kind = rect | square | triangle | circle */
  tile(kind = "square", color = COLORS.blue, s = 0.4) {
    let shape = new THREE.Shape();
    if (kind === "circle") shape.absarc(0, 0, s / 2, 0, Math.PI * 2);
    else if (kind === "triangle") { shape.moveTo(-s / 2, -s * 0.43); shape.lineTo(s / 2, -s * 0.43); shape.lineTo(0, s * 0.43); shape.closePath(); }
    else { const w = kind === "rect" ? s * 1.5 : s; shape.moveTo(-w / 2, -s / 2); shape.lineTo(w / 2, -s / 2); shape.lineTo(w / 2, s / 2); shape.lineTo(-w / 2, s / 2); shape.closePath(); }
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2 });
    const o = m(geo, phys(color)); o.rotation.x = -Math.PI / 2; o.position.y = 0.0;
    return grp(o);
  },
  /** 可平均分的圆饼/披萨：n 份，返回 group.userData.slices（每块可单独移动） */
  pie(n = 4, color = 0xffc46b, topColor = 0xff7a59, r = 0.45) {
    const g = new THREE.Group(); g.userData.slices = [];
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2;
      const shape = new THREE.Shape(); shape.moveTo(0, 0); shape.absarc(0, 0, r, a0, a1); shape.closePath();
      const s = m(new THREE.ExtrudeGeometry(shape, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.008, bevelSegments: 2 }), phys(color));
      s.rotation.x = -Math.PI / 2;
      const top = m(new THREE.ShapeGeometry(shape), std(topColor)); top.rotation.x = -Math.PI / 2; top.position.y = 0.092; top.scale.setScalar(0.9);
      const slice = grp(s, top); slice.userData.mid = (a0 + a1) / 2;
      g.add(slice); g.userData.slices.push(slice);
    }
    return g;
  },
  /** 五角星（立体、圆润） */
  star(color = 0xffd43b, r = 0.2) {
    const s = new THREE.Shape();
    for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r; const x = Math.cos(a) * rr, y = Math.sin(a) * rr; i ? s.lineTo(x, y) : s.moveTo(x, y); }
    s.closePath();
    const o = m(new THREE.ExtrudeGeometry(s, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 4 }), phys(color, { emissive: color, emissiveIntensity: 0.15 }), r + 0.02);
    o.position.z = -0.03;
    return grp(o);
  },
  rocket(color = 0xff6b6b) {
    const g = new THREE.Group();
    const body = m(new THREE.CapsuleGeometry(0.1, 0.22, 8, 20), phys(0xffffff), 0.26); g.add(body);
    const nose = m(new THREE.ConeGeometry(0.1, 0.16, 24), phys(color), 0.48); g.add(nose);
    const win = m(new THREE.SphereGeometry(0.045, 16, 12), phys(0x4dabf7, { emissive: 0x1c7ed6, emissiveIntensity: 0.3 }), 0.3); win.position.z = 0.09; g.add(win);
    for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; const fin = m(new THREE.BoxGeometry(0.02, 0.12, 0.09), phys(color), 0.08); fin.position.x = Math.sin(a) * 0.1; fin.position.z = Math.cos(a) * 0.1; fin.rotation.y = a; g.add(fin); }
    return g;
  },
  planet(color = 0x74c0fc, r = 0.17, ring = false) {
    const g = new THREE.Group();
    const p = m(new THREE.SphereGeometry(r, 36, 28), phys(color), r + 0.01); g.add(p);
    const spot = m(new THREE.SphereGeometry(r * 0.3, 16, 12), phys(new THREE.Color(color).multiplyScalar(0.8).getHex()), r + 0.01); spot.position.set(r * 0.5, r * 0.45, r * 0.6); spot.scale.set(1, 1, 0.4); g.add(spot);
    if (ring) { const t = m(new THREE.TorusGeometry(r * 1.5, r * 0.08, 8, 48), phys(0xffe066), r + 0.01); t.rotation.x = 1.25; g.add(t); }
    return g;
  },
  plate(r = 0.6, color = 0xffffff) { return grp(m(new THREE.CylinderGeometry(r, r * 0.85, 0.05, 48), phys(color), 0.025)); },
  basket(r = 0.45) {
    const g = new THREE.Group();
    const b = m(new THREE.CylinderGeometry(r, r * 0.8, 0.3, 32, 1, true), phys(0xc9894b, { side: THREE.DoubleSide }), 0.15); g.add(b);
    const floor = m(new THREE.CircleGeometry(r * 0.8, 32), std(0xb5773d), 0.01); floor.rotation.x = -Math.PI / 2; g.add(floor);
    const handle = m(new THREE.TorusGeometry(r * 0.9, 0.025, 8, 40, Math.PI), phys(0xb5773d), 0.3); g.add(handle);
    return g;
  },
  /** 小旗/指示牌：竖立的文字牌，用来标“第 1”“东”等 */
  flag(text, color = "#ff6b6b") {
    const pole = m(new THREE.CylinderGeometry(0.012, 0.012, 0.6, 8), std(0x999999), 0.3);
    const tex = textTex(text, { bg: color, fg: "#ffffff", font: 120, round: 20 });
    const f = m(new THREE.PlaneGeometry(0.3, 0.22), new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide }), 0.48); f.position.x = 0.16;
    return grp(pole, f);
  },
};

/** 把一组物体排成行/网格的位置 */
export function gridPositions(n, { cols = n, gap = 0.4, z0 = 0, x0 = null, rowGap = gap } = {}) {
  const rows = Math.ceil(n / cols), out = [];
  const startX = x0 ?? -((Math.min(n, cols) - 1) * gap) / 2;
  for (let i = 0; i < n; i++) out.push(new THREE.Vector3(startX + (i % cols) * gap, 0, z0 + Math.floor(i / cols) * rowGap - ((rows - 1) * rowGap) / 2));
  return out;
}
