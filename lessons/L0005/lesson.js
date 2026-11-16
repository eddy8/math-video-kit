// 第 5 课 · 认识位置：上下、前后、左右（小超市 · 快问快答）。所有动画都由时间 t 计算，事件时刻来自 E（timeline.json）。
export default function (api) {
  const { THREE, props, V, U, E, ui, COLORS } = api;
  const { seg, ease, pop, dropY, lerp, keyed } = U;

  const phys = (color, o = {}) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.45, clearcoat: 0.35, clearcoatRoughness: 0.4, ...o });
  const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; return o; };
  const hopAt = (t, a, d = 0.35, h = 0.22) => Math.sin(Math.PI * seg(t, a, a + d)) * h;
  const bumpAt = (t, a, w = 0.14) => Math.exp(-Math.pow((t - a - 0.12) / w, 2));

  // ---------- 两层小货架（侧板 + 隔板现拼） ----------
  const SZ = -0.45;                          // 货架中心 z
  const shelf = new THREE.Group();
  [-0.64, 0.64].forEach((x) => { const p = props.cuboid(0xf1f3f5, 0.07, 1.06, 0.5); p.position.x = x; shelf.add(p); });
  [0, 0.5, 1.0].forEach((y) => { const b = props.cuboid(0xffa94d, 1.34, 0.05, 0.52); b.position.y = y; shelf.add(b); });
  const backPanel = props.cuboid(0xfff4e6, 1.24, 1.0, 0.03); backPanel.position.set(0, 0.03, -0.24); shelf.add(backPanel);
  const SS = 1.3;                            // 货架和商品整体放大
  api.add(shelf, V(0, 0, SZ));
  const TOP = 0.55 * SS, LOW = 0.05 * SS, IZ = SZ + 0.12 * SS;   // 上层、下层台面高度，商品 z
  const PX = 0.3 * SS;

  // 第 1 问：上层苹果、下层橘子
  const apple1 = api.add(props.apple(), V(0, TOP, IZ));
  const orange1 = api.add(props.orange(), V(0, LOW, IZ));

  // 练一练：上层 皮球、积木；下层 苹果、橘子
  const ball2 = api.add(props.ball(COLORS.blue, 0.15), V(-PX, TOP, IZ));
  const block2 = api.add(props.block(COLORS.purple, 0.27), V(PX, TOP, IZ));
  const apple2 = api.add(props.apple(), V(-PX, LOW, IZ));
  const orange2 = api.add(props.orange(), V(PX, LOW, IZ));
  const practice = [ball2, block2, apple2, orange2];

  // ---------- 第 2 问：收银台 + 排队（小鸡在前，豆豆在后，面朝左边的收银台） ----------
  const QZ = 0.45, CX = -0.82, CHX = -0.12, DDQ = [0.6, QZ], HOME = [0.8, 1.0];
  const counter = new THREE.Group();
  counter.add(props.cuboid(0xff6b6b, 0.46, 0.44, 0.72));
  const slab = props.cuboid(0xffffff, 0.52, 0.05, 0.78); slab.position.y = 0.44; counter.add(slab);
  const reg = props.cuboid(0x495057, 0.2, 0.15, 0.2); reg.position.set(0, 0.49, -0.12); counter.add(reg);
  const screen = props.cuboid(0x74c0fc, 0.16, 0.12, 0.02); screen.position.set(0.02, 0.64, -0.12); screen.rotation.z = 0.25; counter.add(screen);
  api.add(counter, V(CX, 0, QZ));

  function makeChick() {
    const g = new THREE.Group();
    const yel = phys(0xffd43b), org = phys(0xff922b), blk = phys(0x2a1a14, { roughness: 0.15, clearcoat: 1 });
    const body = mesh(new THREE.SphereGeometry(0.2, 28, 20), yel, 0.02, 0.2, 0); body.scale.set(1.1, 0.95, 1); g.add(body);
    g.add(mesh(new THREE.SphereGeometry(0.14, 24, 18), yel, -0.12, 0.43, 0));
    const beak = mesh(new THREE.ConeGeometry(0.045, 0.1, 16), org, -0.29, 0.42, 0); beak.rotation.z = Math.PI / 2; g.add(beak);
    [-1, 1].forEach((s) => {
      const eye = mesh(new THREE.SphereGeometry(0.026, 12, 10), blk, -0.21, 0.47, s * 0.085); g.add(eye);
      const hi = mesh(new THREE.SphereGeometry(0.009, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }), -0.235, 0.485, s * 0.1); g.add(hi);
      const wing = mesh(new THREE.SphereGeometry(0.09, 16, 12), phys(0xfcc419), 0.05, 0.22, s * 0.19); wing.scale.set(1.3, 0.8, 0.4); g.add(wing);
      const leg = mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.06, 8), org, 0, 0.02, s * 0.07); g.add(leg);
    });
    const tuft = mesh(new THREE.SphereGeometry(0.04, 12, 10), yel, -0.1, 0.58, 0); tuft.scale.set(0.6, 1.3, 0.6); g.add(tuft);
    const tail = mesh(new THREE.ConeGeometry(0.06, 0.12, 12), yel, 0.24, 0.3, 0); tail.rotation.z = -1.0; g.add(tail);
    return g;
  }
  const chick = api.add(makeChick(), V(CHX, 0, QZ));

  // ---------- 第 3 问：展示台，从左到右 草莓、饼干、糖果 ----------
  const TZ = -0.3, TH = 0.22, RS = 1.5;    // RS：商品放大倍数
  const table = api.add(props.cuboid(0xffffff, 2.0, TH, 0.5), V(0, 0, TZ));
  const berry = api.add(props.strawberry(), V(-0.66, TH, TZ));
  const cookie = api.add(props.cookie(), V(0, TH, TZ));
  const candy = api.add(props.candy(COLORS.pink), V(0.66, TH, TZ));
  const row = [berry, cookie, candy];

  // ---------- 文字层 ----------
  ui.big([
    { at: E.quick, until: E.q1, text: "快问快答", sub: "3 个问题，一起抢答！" },
    { at: E.q1, until: E.r1_end, text: "第 1 问", sub: "上面还是下面？" },
    { at: E.q2 + 0.1, until: E.r2_end, text: "第 2 问", sub: "前面还是后面？" },
    { at: E.q3, until: E.lefthand, text: "第 3 问", sub: "饼干的左边是什么？" },
    { at: E.lefthand, until: E.rule, text: "← 左边", sub: "举起左手，左手这边就是左边" },
  ]);
  ui.pills([
    { text: "← 上面", color: "#e03131", at: E.a1, until: E.q2 + 0.2, anchor: () => V(0.58, TOP + 0.3, IZ + 0.1) },
    { text: "← 下面", color: "#1c7ed6", at: E.down, until: E.q2 + 0.2, anchor: () => V(0.58, LOW + 0.24, IZ + 0.1) },
    { text: "收银台", color: "#e03131", at: E.q2 + 0.35, until: E.q3, anchor: () => counter.position.clone().add(V(0, 0.82, 0)) },
    { text: "前", color: "#2f9e44", at: E.front, until: E.q3, anchor: () => chick.position.clone().add(V(0, 0.72, 0)) },
    { text: "后", color: "#ff8a3d", at: E.back, until: E.q3, anchor: () => V(DDQ[0], 1.0, DDQ[1]) },
    { text: "左边", color: "#2f9e44", at: E.leftside, until: E.quiz, anchor: () => berry.position.clone().add(V(0, 0.5, 0)) },
    { text: "右边", color: "#868e96", at: E.leftside + 0.15, until: E.quiz, anchor: () => candy.position.clone().add(V(0, 0.42, 0)) },
    { text: "← 左边", color: "#2f9e44", at: E.answer + 0.1, until: E.end, anchor: () => V(0, LOW + 0.3, IZ + 0.15) },
  ]);
  ui.bubbles([
    { text: "？", at: E.where, until: E.intro + 0.6 },
    { text: "糖果？", at: E.wrong, until: E.r3 + 0.9 },
    { text: "！", at: E.answer, until: E.outro },
  ]);
  ui.focus({
    at: E.rule + 0.1, until: E.quiz + 0.25,
    parts: [
      { text: "谁", label: "要找的", color: "#e03131", labelAt: E.who1 },
      { text: "在" },
      { text: "谁", label: "和谁比", color: "#1c7ed6", labelAt: E.who2 },
      { text: "的" },
      { text: "哪一边", label: "上下·前后·左右", color: "#2f9e44", labelAt: E.side },
    ],
  });
  ui.reg.focus[ui.reg.focus.length - 1].box.style.fontSize = "130px";   // 7 个字，缩小字号放进一行
  ui.quiz({ at: E.quiz, countFrom: E.quiz_end + 0.1, answerAt: E.ans, until: E.outro + 0.4, q: "<b>橘子</b>的左边是什么？", a: "苹果" });

  const shelfK = (t) => pop(t, 0.35, E.q2 + 0.45) + pop(t, E.quiz - 0.15, E.end + 0.35);
  const setK = (o, k) => { o.scale.setScalar(Math.max(0.001, k)); o.visible = k > 0.002; };

  function update(t) {
    // 货架：片头弹出，第 2 问前收起；练一练时再弹出
    setK(shelf, SS * shelfK(t));

    // 第 1 问：苹果、橘子落到货架上；被点到名时跳一下
    const a1 = 0.75, o1 = 0.95;
    const kA = pop(t, a1, E.q2 + 0.3), kO = pop(t, o1, E.q2 + 0.3);
    setK(apple1, SS * kA * (1 + 0.25 * bumpAt(t, E.apple)));
    apple1.position.y = TOP + dropY(t, a1, 0.9, 0.5) + hopAt(t, E.apple) + hopAt(t, E.a1, 0.4, 0.15);
    apple1.rotation.y = Math.sin(t * 1.1) * 0.3;
    setK(orange1, SS * kO * (1 + 0.25 * bumpAt(t, E.orange)));
    orange1.position.y = LOW + dropY(t, o1, 0.25, 0.45) + hopAt(t, E.orange, 0.35, 0.08) + hopAt(t, E.down, 0.35, 0.08);

    // 收银台和小鸡
    setK(counter, pop(t, E.q2 + 0.05, E.q3 + 0.1));
    const kc = pop(t, E.q2 + 0.35, E.q3 + 0.15);
    setK(chick, kc);
    chick.position.y = dropY(t, E.q2 + 0.35, 0.9, 0.5) + hopAt(t, E.chick, 0.35, 0.18) + hopAt(t, E.front, 0.35, 0.15) + Math.abs(Math.sin(t * 3)) * 0.015;
    chick.rotation.z = Math.sin(t * 2.2) * 0.04;

    // 展示台：草莓、饼干（竖着摆）、糖果
    const kT = pop(t, E.q3 - 0.15, E.quiz - 0.05);
    setK(table, kT);
    row.forEach((o, i) => {
      const a = E.q3 + i * 0.12;
      let k = pop(t, a, E.quiz - 0.1 + i * 0.03);
      if (o === cookie) k *= 1 + 0.25 * bumpAt(t, E.cookie);
      if (o === berry) k *= 1 + 0.35 * bumpAt(t, E.berry, 0.25);
      setK(o, RS * k);
      let y = TH + dropY(t, a, 0.8, 0.45);
      if (o === cookie) { y += 0.15 * RS + hopAt(t, E.cookie); o.rotation.x = Math.PI / 2 - 0.25; }
      if (o === berry) y += hopAt(t, E.berry, 0.4, 0.25);
      if (o === candy) { o.rotation.z = Math.sin((t - E.wrong) * 18) * 0.35 * (1 - seg(t, E.wrong, E.wrong + 0.8)) * (t > E.wrong ? 1 : 0); o.rotation.y = 0.4; }
      o.position.y = y;
    });
    const berryMesh = berry.children[0];
    berryMesh.material.emissive.setHex(0xff4d6d);
    berryMesh.material.emissiveIntensity = t >= E.berry && t < E.quiz ? 0.35 : 0;

    // 练一练：货架上的 4 件商品依次落下；点到橘子时它跳一下；揭晓答案时苹果跳两下
    practice.forEach((o, i) => {
      const a = E.quiz + 0.05 + i * 0.12;
      let k = pop(t, a, E.end + 0.3);
      if (o === orange2) k *= 1 + 0.25 * bumpAt(t, E.shelf2 + 0.1, 0.2);
      if (o === apple2) k *= 1 + 0.3 * bumpAt(t, E.answer + 0.05, 0.3);
      setK(o, SS * k);
      const base = i < 2 ? TOP : LOW;
      let y = base + dropY(t, a, i < 2 ? 0.9 : 0.25, 0.45);
      if (o === orange2) y += hopAt(t, E.shelf2 + 0.1, 0.35, 0.08);
      if (o === apple2) y += hopAt(t, E.answer + 0.05, 0.35, 0.08) + hopAt(t, E.answer + 0.45, 0.35, 0.08);
      o.position.y = y;
    });
    block2.rotation.y = 0.5;
    orange2.children[0].material.emissive.setHex(0xff922b);
    orange2.children[0].material.emissiveIntensity = t >= E.shelf2 && t < E.answer ? 0.3 : 0;
    apple2.children[0].material.emissive.setHex(0xff5a5a);
    apple2.children[0].material.emissiveIntensity = t >= E.answer && t < E.end ? 0.3 : 0;
  }

  const FACE_LEFT = -Math.PI / 2;
  const walkIn = E.queue + 0.15, walkBack = E.r2_end + 0.05;
  return {
    update,
    camera: [[0, "low"], [E.intro, "front"]],
    doudou: {
      base: V(HOME[0], 0, HOME[1]),
      yaw: (t) => keyed(t, [[0, -0.55], [walkIn + 0.8, -0.55], [walkIn + 1.1, FACE_LEFT], [walkBack, FACE_LEFT], [walkBack + 0.8, -0.55], [E.end, -0.55], [E.end + 0.6, -0.2]]),
      actions: [
        { type: "hop", at: 0.15, dur: 0.6 },
        { type: "surprise", at: E.hook + 0.4, dur: 0.8 },
        { type: "think", at: E.where - 0.1, dur: 1.4 },
        { type: "hop", at: E.quick, dur: 0.5 },
        { type: "think", at: E.q1 + 0.3, dur: 2.3 },
        { type: "cheer", at: E.a1, dur: 0.8 },
        { type: "nod", at: E.down, dur: 0.6 },
        { type: "walk", at: walkIn, dur: 0.9, from: HOME, to: DDQ, steps: 4 },
        { type: "nod", at: E.behind, dur: 0.6 },
        { type: "point", at: E.ahead - 0.15, dur: 1.3, side: "R" },
        { type: "hop", at: E.back, dur: 0.5 },
        { type: "walk", at: walkBack, dur: 0.8, from: DDQ, to: HOME, steps: 3 },
        { type: "think", at: E.cookie + 0.3, dur: 1.4 },
        { type: "point", at: E.a3, dur: 1.0, side: "L" },
        { type: "shy", at: E.r3 + 0.1, dur: 1.3 },
        { type: "nod", at: E.berry, dur: 0.6 },
        { type: "nod", at: E.side, dur: 0.6 },
        { type: "think", at: E.quiz + 0.6, dur: 4.4 },
        { type: "cheer", at: E.answer, dur: 0.9 },
        { type: "cheer", at: E.learned, dur: 1.2 },
      ],
    },
  };
}
