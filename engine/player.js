// 播放器：player.html?lesson=lessons/L0003 加载该课的 script.json、timeline.json、lesson.js，
// 暴露 window.renderAt(t)，供录制脚本逐帧调用。
import * as THREE from "three";
import * as U from "./util.js";
import { createStage, W, H } from "./stage.js";
import { createUI, numHTML } from "./ui.js";
import { props, gridPositions, COLORS } from "./props.js";
import { createDoudou } from "./mascot.js";

const params = new URLSearchParams(location.search);
const dir = params.get("lesson");
const script = await (await fetch(`./${dir}/script.json`)).json();
const TL = await (await fetch(`./${dir}/timeline.json`)).json();
const lessonMod = await import(`../${dir}/lesson.js`);

const meta = { lesson: script.lesson, title: script.title, book: script.book, round: script.round || 1 };
const stage = createStage(script.theme);
document.documentElement.style.setProperty("--accent", script.accent || stage.theme.accent || "#ff8a3d");
const ui = createUI(meta);
ui.captions(TL.lines);
const doudou = createDoudou();
stage.scene.add(doudou.group);
const E = new Proxy(TL.events, { get: (o, k) => { if (!(k in o)) throw new Error(`timeline 里没有事件 “${String(k)}”`); return o[k]; } });

// 片尾彩纸（3D）
const confetti = [];
{
  const r = U.rng(41), cols = [0xff6b9a, 0x74c0fc, 0xffd43b, 0x69db7c, 0xff8a3d, 0xb197fc];
  for (let i = 0; i < 90; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.1), new THREE.MeshStandardMaterial({ color: cols[i % 6], side: THREE.DoubleSide }));
    m.visible = false; stage.scene.add(m);
    confetti.push({ m, x: U.lerp(-1.8, 1.8, r()), z: U.lerp(-1.4, 1.2, r()), y0: U.lerp(2.4, 4.6, r()), v: U.lerp(0.9, 1.5, r()), s: r() * 6, w: U.lerp(2, 6, r()) });
  }
}

const api = {
  THREE, U, V: U.V, E, TL, script, stage, scene: stage.scene, ui, props, gridPositions, COLORS, doudou, numHTML,
  add(o, pos) { stage.scene.add(o); if (pos) o.position.copy(pos); return o; },
};
const lesson = lessonMod.default(api);   // 返回 { update(t), camera, cameraStyle, doudou: { base, yaw, actions } }
if (script.end) ui.end({ at: E.end, ...script.end });

const tmpV = new THREE.Vector3();
function project(v) { const p = v.clone().project(stage.camera); return [(p.x + 1) / 2 * W, (1 - p.y) / 2 * H]; }
function mouthAt(t) {
  const f = Math.floor(t * TL.mouth.fps);
  return TL.mouth.data[f] ?? 0;
}
function speakingDoudou(t) { return TL.lines.some((l) => l.speaker === "doudou" && t >= l.start && t <= l.end) ? 1 : 0; }

const camKeys = lesson.camera || [[0, "front"]];
const camAll = [...camKeys, [E.end + 0.2, camKeys[camKeys.length - 1][1]], [E.end + 1.1, "end"]];
ui.bubbles([{ text: "明天见！", at: E.end + 1.5, until: 1e9 }]);

window.renderAt = (t) => {
  stage.setCamera(t, camAll, script.cameraStyle || "sway");
  stage.update(t);
  lesson.update?.(t);
  const dd = lesson.doudou || {};
  const baseAt = (tt) => (typeof dd.base === "function" ? dd.base(tt) : (dd.base || U.V(0.95, 0, 1.0)));
  const b0 = baseAt(E.end);
  // 片尾：豆豆走到画面中间，跳两下，挥手说再见（课程里的物体需在 E.end 前后自行收起）
  const endActs = [
    { type: "walk", at: E.end, dur: 0.7, from: [b0.x, b0.z], to: [0, 1.15], steps: 3 },
    { type: "look", at: E.end + 0.5, dur: 0.4, yaw: 0, keep: true },
    { type: "hop", at: E.end + 0.8, dur: 0.8, n: 2 },
    { type: "wave", at: E.end + 1.4, dur: 1.4, side: "R" },
  ];
  doudou.update(t, {
    base: baseAt(t),
    yaw: typeof dd.yaw === "function" ? dd.yaw(t) : (dd.yaw ?? -0.5),
    scale: dd.scale ?? 1,
    mouth: mouthAt(t),
    talking: speakingDoudou(t),
    actions: [...(dd.actions || []), ...endActs],
  });
  doudou.group.visible = dd.visible ? dd.visible(t) : true;
  for (const c of confetti) {
    const tt = t - E.end - 0.15;
    c.m.visible = tt > 0;
    if (tt > 0) { c.m.position.set(c.x + 0.15 * Math.sin(tt * 2 + c.s), Math.max(0.01, c.y0 - c.v * tt), c.z); c.m.rotation.set(tt * c.w + c.s, tt * c.w * 0.7, c.s); }
  }
  doudou.group.updateMatrixWorld(true);
  doudou.head.getWorldPosition(tmpV);
  ui.update(t, project, tmpV.clone());
  stage.renderer.render(stage.scene, stage.camera);
  return true;
};
window.DURATION = TL.duration;
window.ready = true;
if (params.has("t")) window.renderAt(parseFloat(params.get("t")));
