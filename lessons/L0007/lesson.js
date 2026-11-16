// 第 7 课 · 第几（森林野餐 · 两种方法比一比）。所有动画都由时间 t 计算，事件时刻来自 E（timeline.json）。
// 方向规则：数数的镜头只用 front / top（不旋转），屏幕左边就是观众的左边；队列从观众的左到右：苹果、饼干、橘子、草莓、糖果。
export default function (api) {
  const { THREE, props, V, U, E, ui, COLORS } = api;
  const { seg, ease, pop, dropY, keyed, easeBack } = U;

  const hopAt = (t, a, d = 0.35, h = 0.2) => Math.sin(Math.PI * seg(t, a, a + d)) * h;
  const bumpAt = (t, a, w = 0.14) => Math.exp(-Math.pow((t - a - 0.12) / w, 2));
  const setK = (o, k) => { o.scale.setScalar(Math.max(0.001, k)); o.visible = k > 0.002; };
  const inR = (t, a, b) => t >= a && t < b;

  // ---------- 一行好吃的 ----------
  const RZ = -0.35, OX = -0.08, RS = 1.12, GAP = 0.37;   // 整行连同两面旗都要留在 front / top 画面里
  const xs = [-2, -1, 0, 1, 2].map((i) => OX + i * GAP);
  const names = ["苹果", "饼干", "橘子", "草莓", "糖果"];
  const foods = [props.apple(), props.cookie(), props.orange(), props.strawberry(), props.candy(COLORS.pink)].map((o, i) => api.add(o, V(xs[i], 0, RZ)));
  const [apple, cookie, orange, berry, candy] = foods;
  const BERRY = 3, COOKIE = 1;
  // 每件食物的所有材质（用于发光、变暗）
  const mats = foods.map((f) => { const ms = []; f.traverse((o) => { if (o.isMesh) { o.material.transparent = true; ms.push(o.material); } }); return ms; });
  const glowCol = [0xff5a5a, 0xd9a066, 0xffa23a, 0xff4d6d, 0xff8cc6];

  // 左旗、右旗：插在队伍两端（旗面在旗杆右侧）
  const flagL = api.add(props.flag("左", "#2f9e44"), V(xs[0] - 0.4, 0, RZ - 0.12));
  const flagR = api.add(props.flag("右", "#f76707"), V(xs[4] + 0.24, 0, RZ - 0.12));

  // “右边近”：草莓到两旗之间的两段地面
  const SZ = RZ + 0.36;
  const lx0 = flagL.position.x, rx1 = flagR.position.x, sx = xs[BERRY];
  const stripL = api.add(props.cuboid(0xadb5bd, sx - lx0, 0.02, 0.09), V((lx0 + sx) / 2, 0.005, SZ));
  const stripR = api.add(props.cuboid(0xffd43b, rx1 - sx, 0.02, 0.09), V((sx + rx1) / 2, 0.005, SZ));

  // 圈出“4 个”：压扁的圆环
  const ringG = new THREE.Group();
  const ringM = new THREE.Mesh(new THREE.TorusGeometry(1, 0.03, 10, 80), new THREE.MeshStandardMaterial({ color: 0xffd43b, emissive: 0xffc400, emissiveIntensity: 0.6 }));
  ringM.rotation.x = Math.PI / 2; ringG.add(ringM);
  const ringCX = (xs[0] + xs[3]) / 2;
  api.add(ringG, V(ringCX, 0.04, RZ));

  // ---------- 时刻 ----------
  const dropAt = foods.map((_, i) => E.row - 0.45 + i * 0.13);
  const lAt = [E.l1, E.l2, E.l3, E.l4];
  const rAt = [E.r1, E.r2];                 // 糖果、草莓
  const pAt = [E.p1, E.p2, E.p3, E.reveal]; // 练一练：糖果、草莓、橘子、饼干
  const fromRight = [4, 3, 2, 1];           // 从右数第 1、2、3、4 个的下标

  // ---------- 文字层 ----------
  const GREEN = "#2f9e44", ORANGE = "#f76707";
  const above = (o, h = 0.62) => () => o.position.clone().add(V(0, h, 0));
  ui.big([
    { at: E.total, until: E.fromleft + 0.2, text: "5", sub: "一共有 5 个" },
    { at: E.l_res, until: E.other + 0.3, text: "第 4", sub: "从左边数" },
    { at: E.r_res, until: E.both + 0.3, text: "第 2", sub: "从右边数" },
    { at: E.only, until: E.quiz, text: "4 个 ｜ 第 4", sub: "4 个是一群　第 4 只指 1 个" },
  ]);
  ui.reg.big[ui.reg.big.length - 1].d.firstChild.style.fontSize = "140px";   // “4 个 ｜ 第 4”较长，缩小字号放进一行
  ui.pills([
    { text: "第几？", color: "#e8590c", at: E.berry, until: E.l1, anchor: above(berry, 0.7) },
    ...lAt.map((a, i) => ({ text: String(i + 1), color: GREEN, at: a, until: E.other + 0.2, anchor: above(foods[i]) })),
    { text: "←", color: ORANGE, at: E.rflag + 0.1, until: E.rflag + 1.5, anchor: (t) => V(xs[4] + 0.15 - (xs[4] - xs[0] + 0.3) * ease(seg(t, E.rflag + 0.1, E.rflag + 1.4)), 0.72, RZ) },
    ...rAt.map((a, i) => ({ text: String(i + 1), color: ORANGE, at: a, until: E.both + 0.2, anchor: above(foods[fromRight[i]]) })),
    { text: "左数第 4", color: GREEN, at: E.tagl, until: E.rule + 0.3, anchor: () => V(sx - 0.25, 0.3, RZ - 0.75) },
    { text: "右数第 2", color: ORANGE, at: E.tagr, until: E.rule + 0.3, anchor: () => V(sx + 0.3, 0.3, RZ - 0.4) },
    { text: "远", color: "#868e96", at: E.near, until: E.rule + 0.3, anchor: () => V((lx0 + sx) / 2, 0.12, SZ + 0.05) },
    { text: "近", color: "#e8590c", at: E.near + 0.25, until: E.rule + 0.3, anchor: () => V((sx + rx1) / 2, 0.12, SZ + 0.05) },
    { text: "4 个", color: "#e8590c", at: E.circle + 0.2, until: E.only + 0.1, anchor: () => V(ringCX, 0.75, RZ - 0.1) },
    { text: "第 4", color: GREEN, at: E.only + 0.1, until: E.quiz, anchor: above(berry, 0.7) },
    ...pAt.map((a, i) => ({ text: String(i + 1), color: ORANGE, at: a, until: E.end, anchor: above(foods[fromRight[i]]) })),
  ]);
  const tagLPill = ui.reg.pills.find((p) => p.text === "左数第 4");
  const tagRPill = ui.reg.pills.find((p) => p.text === "右数第 2");
  ui.bubbles([
    { text: "？", at: E.berry, until: E.fromleft },
    { text: "更快！", at: E.fast, until: E.both + 0.3 },
    { text: "？", at: E.quiz + 0.6, until: E.answer },
    { text: "我会了！", at: E.again - 0.3, until: E.end },
  ]);
  ui.focus({
    at: E.rule, until: E.group + 0.25,
    parts: [
      { text: "←", label: "左", color: GREEN, labelAt: E.which },
      { text: "从哪边数起？" },
      { text: "→", label: "右", color: ORANGE, labelAt: E.which + 0.4 },
    ],
  });
  ui.reg.focus[ui.reg.focus.length - 1].box.style.fontSize = "120px";   // 8 个字符，缩小字号放进一行
  ui.quiz({ at: E.quiz, countFrom: E.answer - 3, answerAt: E.answer, until: E.wrap + 0.4, q: "从<b>右</b>边数，<b>第 4</b> 是谁？", a: "" });
  const qans = ui.reg.quiz[ui.reg.quiz.length - 1].d.querySelector(".qans");

  function update(t) {
    foods.forEach((f, i) => {
      // 出场、收起
      let k = pop(t, dropAt[i], E.end + 0.3 + i * 0.03);
      k *= 1 + 0.18 * bumpAt(t, E.total + i * 0.08);
      if (i === BERRY) {
        k *= 1 + 0.3 * bumpAt(t, E.berry, 0.25) + 0.25 * bumpAt(t, E.l_res, 0.2) + 0.25 * bumpAt(t, E.r_res, 0.2);
        k *= 1 + 0.3 * ease(seg(t, E.only, E.only + 0.3)) * (1 - ease(seg(t, E.quiz - 0.3, E.quiz)));
      }
      if (i < 4) k *= 1 + 0.25 * bumpAt(t, lAt[i]);
      rAt.forEach((a, j) => { if (i === fromRight[j]) k *= 1 + 0.25 * bumpAt(t, a); });
      pAt.forEach((a, j) => { if (i === fromRight[j]) k *= 1 + (j === 3 ? 0.4 : 0.25) * bumpAt(t, a, j === 3 ? 0.25 : 0.14); });
      setK(f, RS * k);

      let y = dropY(t, dropAt[i], 0.9, 0.5);
      if (i === BERRY) y += hopAt(t, E.berry, 0.4, 0.22) + hopAt(t, E.l_res, 0.35, 0.18) + hopAt(t, E.r_res, 0.35, 0.18);
      if (i === COOKIE) { y += 0.15 * RS; f.rotation.x = Math.PI / 2 - 0.25; y += hopAt(t, E.reveal + 0.05, 0.4, 0.25); }
      f.position.y = y;
      if (i === BERRY) f.rotation.y = Math.PI * 2 * ease(seg(t, E.spin, E.spin + 0.7));
      if (i === 4) f.rotation.y = 0.4;

      // 发光：被数到、被点到时
      const lit =
        (i === BERRY && inR(t, E.berry, E.l1)) ||
        (i < 4 && inR(t, lAt[i], E.other)) ||
        (fromRight.indexOf(i) >= 0 && fromRight.indexOf(i) < 2 && inR(t, rAt[fromRight.indexOf(i)], E.both)) ||
        (i === BERRY && inR(t, E.tagl, E.rule)) ||
        (i < 4 && inR(t, E.circle, E.only)) ||
        (i === BERRY && inR(t, E.only, E.quiz)) ||
        (fromRight.indexOf(i) >= 0 && inR(t, pAt[fromRight.indexOf(i)], E.end));
      const totalGlow = Math.exp(-Math.pow((t - E.total - 0.3) / 0.35, 2));
      const body = f.children[0].material;
      body.emissive.setHex(glowCol[i]);
      body.emissiveIntensity = Math.max(lit ? 0.35 : 0, 0.3 * totalGlow);
      // “第 4”时，其余 3 个变暗
      const dim = i < 3 ? ease(seg(t, E.only, E.only + 0.3)) * (1 - ease(seg(t, E.quiz - 0.3, E.quiz))) : 0;
      mats[i].forEach((m) => { m.opacity = 1 - 0.65 * dim; });
    });

    // 左旗：说“左边”时弹出；讲“第 4”后保留到练一练前；练一练时隐去
    setK(flagL, pop(t, E.lflag, E.quiz + 0.2));
    // 右旗：说“右边”时弹出；圈“4 个”时收起；练一练时重新弹出并闪烁
    const kR = pop(t, E.rflag, E.group + 0.2) + pop(t, E.quiz + 0.15, E.end + 0.3);
    setK(flagR, kR * (1 + (t > E.quiz + 0.5 && t < E.answer ? 0.12 * Math.max(0, Math.sin((t - E.quiz) * 9)) : 0)));

    // 两段地面：近的一段亮黄、远的一段灰
    setK(stripL, pop(t, E.near, E.rule + 0.3));
    setK(stripR, pop(t, E.near + 0.25, E.rule + 0.3));
    stripR.children[0].material.emissive.setHex(0xffc400);
    stripR.children[0].material.emissiveIntensity = 0.3 + 0.2 * Math.sin(t * 8);

    // 圈：圈起 4 个
    const rk = pop(t, E.circle, E.only + 0.15);
    ringG.scale.set(Math.max(0.001, rk) * (xs[3] - xs[0] + 0.62) / 2, 1, Math.max(0.001, rk) * 0.34);
    ringG.visible = rk > 0.002;

    // 两个标签：说“都对”时打勾
    tagLPill.d.textContent = t >= E.right2 ? "左数第 4 ✓" : "左数第 4";
    tagRPill.d.textContent = t >= E.right2 ? "右数第 2 ✓" : "右数第 2";

    // 题卡答案：数到饼干时弹出
    const ak = easeBack(seg(t, E.reveal, E.reveal + 0.4));
    qans.innerHTML = t >= E.reveal ? `<span style="display:inline-block;transform:scale(${Math.max(0.001, ak)})"><span class="ok">✓</span>饼干</span>` : "";
  }

  const D = -0.5;
  return {
    update,
    // 数数镜头只用 front / top
    camera: [
      [0, "front"], [E.both - 0.1, "front"], [E.both + 0.6, "top"],
      [E.quiz, "top"], [E.quiz + 0.8, "front"],
    ],
    doudou: {
      // 高俯视时豆豆往后挪一点，免得脚下贴着底部字幕；随镜头切换一起平滑移动
      base: (t) => V(0.6, 0, keyed(t, [[E.both - 0.1, 1.3], [E.both + 0.6, 1.05], [E.quiz, 1.05], [E.quiz + 0.8, 1.3]])),
      // 说“右边”时转头看右端，数完再转回来
      yaw: (t) => keyed(t, [[0, D], [E.rflag - 0.2, D], [E.rflag + 0.3, 0.55], [E.r_res, 0.55], [E.r_res + 0.4, D], [E.end, D], [E.end + 0.6, -0.2]]),
      actions: [
        { type: "hop", at: 0.15, dur: 0.6 },
        { type: "hop", at: E.row + 0.2, dur: 0.5 },
        { type: "think", at: E.berry - 0.1, dur: E.fromleft - E.berry },
        { type: "point", at: E.lflag - 0.1, dur: E.l_res - E.lflag + 0.4, side: "L" },
        { type: "nod", at: E.l_res, dur: 0.6 },
        { type: "cheer", at: E.fast, dur: 0.9 },
        { type: "hop", at: E.spin, dur: 0.5 },
        { type: "nod", at: E.right2, dur: 0.6 },
        { type: "nod", at: E.which, dur: 0.6 },
        { type: "think", at: E.quiz + 0.5, dur: E.answer - E.quiz - 0.5 },
        { type: "cheer", at: E.reveal, dur: 0.9 },
        { type: "hop", at: E.wrap, dur: 0.5 },
        { type: "wave", at: E.wrap + 0.6, dur: 1.4, side: "R" },
      ],
    },
  };
}
