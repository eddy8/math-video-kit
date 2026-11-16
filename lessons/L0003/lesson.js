// 第 3 课 · 数一数（太空闯关）。所有动画都由时间 t 计算，事件时刻来自 E（timeline.json）。
export default function (api) {
  const { props, V, U, E, ui } = api;
  const { seg, ease, easeOut, pop, dropY, win, lerp, arc } = U;

  // ---------- 第一关：5 颗星星 ----------
  const starPos = [V(-1.0, 0, -0.45), V(-0.5, 0, -0.75), V(0, 0, -0.5), V(0.5, 0, -0.78), V(1.0, 0, -0.45)];
  const starColors = [0xffd43b, 0xffa94d, 0xffd43b, 0xffe066, 0xffc078];
  const stars = starPos.map((p, i) => api.add(props.star(starColors[i], 0.2), p));
  const cnt = [E.c1, E.c2, E.c3, E.c4, E.c5];

  // ---------- 第二关：4 个小火箭（先乱放，再排队） ----------
  const messy = [V(-0.8, 0, 0.1, ), V(0.55, 0, -0.65), V(-0.15, 0, -0.35), V(0.9, 0, 0.15)];
  const messyRot = [0.5, -0.4, 0.2, -0.6];
  const rowPos = [-0.75, -0.25, 0.25, 0.75].map((x) => V(x, 0, -0.45));
  const rColors = [0xff6b6b, 0x4dabf7, 0x69db7c, 0xffa94d];
  const rockets = rColors.map((c) => api.add(props.rocket(c)));
  const rc = [E.r1, E.r2, E.r3, E.r4];

  // ---------- 第三关：6 个小星球 ----------
  const pColors = [0x74c0fc, 0xff8cc6, 0x69db7c, 0xffd43b, 0xb197fc, 0xff922b];
  const pPos = [V(-0.65, 0, -0.6), V(0, 0, -0.65), V(0.65, 0, -0.6), V(-0.65, 0, 0.0), V(0, 0, 0.05), V(0.65, 0, 0.0)];
  const planets = pColors.map((c, i) => api.add(props.planet(c, 0.17, i === 1 || i === 5), pPos[i]));
  const pCount = pColors.map((_, i) => E.answer + 0.35 + i * 0.18);

  // ---------- 文字层 ----------
  ui.big([
    { at: E.lv1, until: E.c1 - 0.05, text: "第一关", sub: "一个一个地数" },
    { at: E.total1, until: E.lv2, text: "5", sub: "一共有 5 颗星星" },
    { at: E.lv2, until: E.oops, text: "第二关", sub: "按顺序数，不漏也不重" },
    { at: E.total2, until: E.lv3, text: "4", sub: "一共有 4 个小火箭" },
  ]);
  ui.pills([
    ...stars.map((s, i) => ({ text: String(i + 1), color: "#7c5cff", at: cnt[i], until: E.lv2, anchor: () => s.position.clone().add(V(0, 0.55 * s.scale.y, 0)) })),
    ...rockets.map((r, i) => ({ text: String(i + 1), color: "#7c5cff", at: rc[i], until: E.lv3, anchor: () => r.position.clone().add(V(0, 0.68, 0)) })),
    ...planets.map((p, i) => ({ text: String(i + 1), color: "#2f9e44", at: pCount[i], until: E.end, anchor: () => p.position.clone().add(V(0, 0.48, 0)) })),
    { text: "从左往右 →", color: "#ff8a3d", at: E.ltr, until: E.cnt2_end, anchor: () => V(0, 0.95, -0.45) },
  ]);
  ui.bubbles([
    { text: "？", at: E.hook + 1.6, until: E.intro },
    { text: "7？", at: E.wrong, until: E.fix + 0.6 },
    { text: "！", at: E.answer, until: E.outro },
  ]);
  ui.quiz({ at: E.lv3, countFrom: E.lv3_end + 0.1, answerAt: E.answer, until: E.outro + 0.4, q: "这里有几个<b>小星球</b>？", a: "6 个" });

  function update(t) {
    // 星星：依次落下浮起；被数到时放大、发光；第二关开始时收起
    stars.forEach((s, i) => {
      const a = E.stars + i * 0.14;
      const k = pop(t, a, E.lv2 + 0.3 + i * 0.04);
      const bump = Math.exp(-Math.pow((t - cnt[i] - 0.12) / 0.12, 2));
      const lit = t >= cnt[i] && t < E.lv2 ? 1 : 0;
      s.scale.setScalar(Math.max(0.001, k * (1 + 0.35 * bump)));
      s.position.y = 0.12 + Math.sin(t * 2 + i) * 0.04 + dropY(t, a, 0.8, 0.5);
      s.rotation.y = Math.sin(t * 1.3 + i) * 0.25 + bump * 1.2;
      s.children[0].material.emissiveIntensity = 0.12 + 0.55 * lit;
      s.visible = k > 0.002;
    });
    // 火箭：乱放落下 → 排队 → 数到哪个，哪个跳起来往前一步（数过的放一边）
    rockets.forEach((r, i) => {
      const a = E.lv2 + 0.4 + i * 0.12;
      const k = pop(t, a, E.lv3 + 0.2 + i * 0.05);
      const lineK = ease(seg(t, E.line + i * 0.1, E.line + 0.7 + i * 0.1));
      const p = messy[i].clone().lerp(rowPos[i], lineK);
      const doneK = ease(seg(t, rc[i], rc[i] + 0.35));
      p.z += 0.55 * doneK;
      p.y = dropY(t, a, 1.0, 0.5) + Math.sin(Math.PI * doneK) * 0.3;
      r.position.copy(p);
      r.rotation.set(0, 0, messyRot[i] * (1 - lineK));
      r.scale.setScalar(Math.max(0.001, k));
      r.visible = k > 0.002;
    });
    // 小星球：一个个弹出；揭晓答案时依次跳一下
    planets.forEach((p, i) => {
      const a = E.planets - 0.3 + i * 0.12;
      const k = pop(t, a, 1e9);
      const hop = Math.sin(Math.PI * seg(t, pCount[i], pCount[i] + 0.3)) * 0.18;
      p.scale.setScalar(Math.max(0.001, k * (1 - ease(seg(t, E.end - 0.1, E.end + 0.35)))));
      p.position.y = dropY(t, a, 0.9, 0.5) + hop + Math.sin(t * 1.7 + i) * 0.02;
      p.rotation.y = t * 0.4 + i;
      p.visible = k > 0.002;
    });
  }

  return {
    update,
    camera: [[0, "low"], [E.intro, "front"], [E.lv3, "front"], [E.lv3 + 1.2, "top"], [E.outro, "front"]],
    doudou: {
      base: V(0.95, 0, 1.0),
      yaw: (t) => lerp(-0.55, -0.2, ease(seg(t, E.end, E.end + 0.6))),
      actions: [
        { type: "hop", at: 0.15, dur: 0.6 },
        { type: "surprise", at: E.stars, dur: 0.7 },
        { type: "point", at: E.c1 - 0.2, dur: 3.0, side: "L" },
        { type: "nod", at: E.total1, dur: 0.6 },
        { type: "think", at: E.oops, dur: 2.0 },
        { type: "shake", at: E.wrong, dur: 0.6 },
        { type: "nod", at: E.line, dur: 0.6 },
        { type: "point", at: E.r1 - 0.2, dur: 2.4, side: "L" },
        { type: "think", at: E.lv3 + 0.3, dur: 3.5 },
        { type: "cheer", at: E.answer, dur: 0.9 },
        { type: "cheer", at: E.learned, dur: 1.2 },
      ],
    },
  };
}
