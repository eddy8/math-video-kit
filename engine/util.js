// 通用时间与数学工具。所有动画都是 t 的纯函数（不能累积状态）。
import * as THREE from "three";

export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, k) => a + (b - a) * k;
/** t 在 [a, b] 间的进度 0..1 */
export const seg = (t, a, b) => (b <= a ? (t >= b ? 1 : 0) : clamp((t - a) / (b - a)));
export const ease = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
export const easeOut = (x) => { x = clamp(x); return 1 - (1 - x) ** 3; };
export const easeIn = (x) => { x = clamp(x); return x * x * x; };
export const easeBack = (x) => { x = clamp(x); const c = 1.9; return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2; };
/** 弹跳落地：0→1，末尾有一次小回弹 */
export const easeBounce = (x) => {
  x = clamp(x);
  const n = 7.5625, d = 2.75;
  if (x < 1 / d) return n * x * x;
  if (x < 2 / d) return n * (x -= 1.5 / d) * x + 0.75;
  if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + 0.9375;
  return n * (x -= 2.625 / d) * x + 0.984375;
};
/** [a, b] 内可见，两端淡入淡出 f 秒 */
export const win = (t, a, b, f = 0.25) => ease(seg(t, a, a + f)) * (1 - ease(seg(t, b - f, b)));
/** a 时刻弹出（带回弹），b 时刻收起 */
export const pop = (t, a, b = 1e9, f = 0.35) => easeBack(seg(t, a, a + f)) * (1 - ease(seg(t, b - 0.2, b)));
/** 落下：从 h 高处在 [a, a+d] 内落到 0，带弹跳 */
export const dropY = (t, a, h = 1.2, d = 0.55) => (1 - easeBounce(seg(t, a, a + d))) * h;

export function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

/** 关键帧插值：keys = [[t, value], ...]，value 为数或 Vector3；段间 smoothstep */
export function keyed(t, keys) {
  if (t <= keys[0][0]) return clone(keys[0][1]);
  for (let i = 0; i < keys.length - 1; i++) {
    const [ta, a] = keys[i], [tb, b] = keys[i + 1];
    if (t <= tb) {
      const k = ease(seg(t, ta, tb));
      return typeof a === "number" ? lerp(a, b, k) : a.clone().lerp(b, k);
    }
  }
  return clone(keys[keys.length - 1][1]);
}
const clone = (v) => (typeof v === "number" ? v : v.clone());

/** 二次贝塞尔弧线：从 a 到 b，中间抬高 h */
export function arc(a, b, k, h = 0.4) {
  const p = a.clone().lerp(b, k);
  p.y += Math.sin(Math.PI * clamp(k)) * h;
  return p;
}
