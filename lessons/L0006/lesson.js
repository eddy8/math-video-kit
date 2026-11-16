// 第 6 课 · 比大小：>、<、=（游乐园 · 豆豆犯错）。所有动画都由时间 t 计算，事件时刻来自 E（timeline.json）。
export default function (api) {
  const { props, V, U, E, ui, COLORS } = api;
  const { seg, ease, pop, dropY, lerp, arc, easeBack } = U;

  const hopAt = (t, a, d = 0.35, h = 0.2) => Math.sin(Math.PI * seg(t, a, a + d)) * h;
  const bumpAt = (t, a, w = 0.14) => Math.exp(-Math.pow((t - a - 0.12) / w, 2));
  const setK = (o, k) => { o.scale.setScalar(Math.max(0.001, k)); o.visible = k > 0.002; };
  const glow = (o, hex, k) => { const m = o.children[0].material; m.emissive.setHex(hex); m.emissiveIntensity = k; };

  // ---------- 皮球（后排，开始时间距很大）和积木（前排，紧挨着） ----------
  const BZ = -1.15, KZ = -0.4;                           // 皮球排、积木排的 z
  const OX = -0.12;                                      // 整体往左挪一点，给右前方的豆豆和气泡留位置
  const blockX = [-0.54, -0.18, 0.18, 0.54].map((x) => x + OX);
  const ballWide = [-1.0, 0, 1.0].map((x) => x + OX);
  const balls = [0, 1, 2, 3].map(() => api.add(props.ball(COLORS.red, 0.15)));
  const blocks = blockX.map((x) => api.add(props.block(COLORS.blue, 0.28), V(x, 0, KZ)));
  // 一个对一个的连线（细长方体现拼）
  const LINK_LEN = (KZ - 0.14) - (BZ + 0.15) - 0.06, LINK_Z = (BZ + 0.15 + KZ - 0.14) / 2;
  const links = blockX.map((x) => api.add(props.cuboid(0xffd43b, 0.05, 0.04, LINK_LEN), V(x, 0.01, LINK_Z)));

  // 数完后落下的数字卡
  const card4 = api.add(props.card("4", { fg: "#1c7ed6" }), V(-1.0 + OX, 0, KZ));
  const card3 = api.add(props.card("3", { fg: "#e03131" }), V(-1.0 + OX, 0, BZ));

  // 练一练：5 ○ 2
  const QZ = -0.45;
  const q5 = api.add(props.card("5"), V(-0.62, 0, QZ));
  const qQ = api.add(props.card("?", { fg: "#ff8a3d" }), V(0, 0, QZ));
  const qGT = api.add(props.card(">", { fg: "#2f9e44" }), V(0, 0, QZ));
  const q2 = api.add(props.card("2"), V(0.62, 0, QZ));

  // 皮球移到积木正后方的时刻（逐个）
  const moveAt = [0, 1, 2].map((i) => E.match - 0.25 + i * 0.32);
  const linkAt = [...moveAt.map((a) => a + 0.45), E.add + 0.6];
  // 数数：积木 1–4、皮球 1–3 依次点亮
  const cntK = [0, 1, 2, 3].map((i) => E.count + 0.1 + i * 0.2);
  const cntB = [0, 1, 2].map((i) => E.cnt_ball - 0.4 + i * 0.2);

  // ---------- 文字层 ----------
  ui.big([
    { at: E.eqsym, until: E.quiz, text: "4 = 4", sub: "4 等于 4　“=”叫等号" },
  ]);
  ui.pills([
    { text: "←　长　→", color: "#e03131", at: E.stretch, until: E.cross + 0.45, anchor: (t) => V(OX + 0.06 * Math.sin((t - E.cross) * 40) * (t > E.cross ? 1 : 0), 0.62, BZ) },
    { text: "多 1 个", color: "#1c7ed6", at: E.spare, until: E.count, anchor: () => blocks[3].position.clone().add(V(0, 0.5, 0)) },
    ...blocks.map((b, i) => ({ text: String(i + 1), color: "#1c7ed6", at: cntK[i], until: cntB[0] + 0.05, anchor: () => b.position.clone().add(V(0, 0.48, 0)) })),
    ...[0, 1, 2].map((i) => ({ text: String(i + 1), color: "#e03131", at: cntB[i], until: E.gt + 0.2, anchor: () => balls[i].position.clone().add(V(0, 0.48, 0)) })),
    { text: "同样多", color: "#2f9e44", at: E.same, until: E.eqsym, anchor: () => V(OX, 0.35, BZ - 0.3) },
    { text: "← 开口朝着 5", color: "#2f9e44", at: E.mouth, until: E.end, anchor: () => qGT.position.clone().add(V(0.12, 0.62, 0)) },
  ]);
  ui.bubbles([
    { text: "？", at: E.blocks, until: E.guess + 0.2 },
    { text: "皮球多！", at: E.claim, until: E.doubt + 0.2 },
    { text: "？", at: E.doubt + 0.3, until: E.pair + 0.3 },
    { text: "看错啦", at: E.shy, until: E.count + 0.2 },
    { text: "？", at: E.quiz + 0.6, until: E.answer },
    { text: "我会了！", at: E.wrap + 0.6, until: E.end },
  ]);

  // 重点讲解：4 > 3 →（4 和 3 互换）→ 3 < 4 → 开口朝大数、尖尖朝小数
  ui.focus({
    at: E.gt, until: E.eq + 0.25,
    parts: [
      { text: "4", label: "开口朝大数", color: "#e03131", labelAt: E.open },
      { text: "&gt;", label: "大于号", color: "#ff8a3d", labelAt: E.gtsym },
      { text: "3", label: "尖尖朝小数", color: "#1c7ed6", labelAt: E.sharp },
    ],
  });
  const F = ui.reg.focus[ui.reg.focus.length - 1];
  F.parts.forEach((p) => { p.style.margin = "0 50px"; });

  // 练一练：答案在豆豆说到“大于”时才揭晓（倒计时到豆豆开口为止）
  ui.quiz({ at: E.quiz, countFrom: E.answer - 3, answerAt: E.answer, until: E.wrap + 0.4, q: "<b>5 ○ 2</b><br>中间填什么？", a: "" });
  const Q = ui.reg.quiz[ui.reg.quiz.length - 1];
  const qans = Q.d.querySelector(".qans");

  function update(t) {
    // 皮球：3 个依次落下（间距大）→ 逐个沿弧线移到积木正后方 → 第 4 个后入场；练一练前收起
    balls.forEach((b, i) => {
      const a = i < 3 ? E.balls - 0.35 + i * 0.15 : E.add + 0.05;
      const k = pop(t, a, E.quiz + 0.25 + i * 0.03) * (1 + 0.3 * bumpAt(t, i < 3 ? cntB[i] : 1e9));
      setK(b, k);
      let p;
      if (i < 3) {
        const mk = ease(seg(t, moveAt[i], moveAt[i] + 0.45));
        p = arc(V(ballWide[i], 0, BZ), V(blockX[i], 0, BZ), mk, 0.35);
      } else p = V(blockX[3], 0, BZ);
      p.y += dropY(t, a, 1.0, 0.55);
      b.position.copy(p);
      const lit = (t >= E.stretch && t < E.cross + 0.3) || (i < 3 && t >= cntB[i] && t < E.gt + 0.3) || (t >= E.same && t < E.quiz);
      glow(b, 0xff5a5a, lit ? 0.45 : 0.05);
    });

    // 积木：一个接一个弹出；剩下的那块放大发光、跳一下；“多”时一起跳；数到时发光
    blocks.forEach((b, i) => {
      const a = E.blocks - 0.2 + i * 0.1;
      let k = pop(t, a, E.quiz + 0.2 + i * 0.03);
      if (i === 3) k *= 1 + 0.35 * Math.min(1, seg(t, E.spare, E.spare + 0.25)) * (1 - seg(t, E.count - 0.3, E.count));
      k *= 1 + 0.25 * bumpAt(t, cntK[i]);
      setK(b, k);
      b.position.y = (i === 3 ? hopAt(t, E.spare + 0.05, 0.4, 0.25) : 0) + hopAt(t, E.more - 0.05 + i * 0.06, 0.35, 0.15);
      const lit = (i === 3 && t >= E.spare && t < E.count) || (t >= cntK[i] && t < E.gt + 0.3) || (t >= E.same && t < E.quiz);
      glow(b, 0x4dabf7, lit ? 0.5 : 0.04);
    });

    // 连线：每对到位时弹出；“同样多”时 4 条一起闪
    links.forEach((l, i) => {
      const k = pop(t, linkAt[i], E.quiz + 0.2);
      l.scale.set(Math.max(0.001, k), Math.max(0.001, k), Math.max(0.001, k));
      l.visible = k > 0.002;
      glow(l, 0xffd43b, t >= E.same && t < E.quiz ? 0.4 + 0.3 * Math.sin(t * 10) : 0.1);
    });

    // 数字卡：数完积木落下“4”，数完皮球落下“3”；进入重点讲解后收起
    setK(card4, pop(t, E.cnt_block, E.gt + 0.4));
    card4.position.y = dropY(t, E.cnt_block, 0.8, 0.5);
    setK(card3, pop(t, E.cnt_ball, E.gt + 0.4));
    card3.position.y = dropY(t, E.cnt_ball, 0.8, 0.5);

    // 练一练：5、?、2 三张卡；豆豆开口时“?”翻成“>”；说“开口”时 5 跳一下
    [q5, qQ, q2].forEach((c, i) => {
      const a = E.quiz + 0.25 + i * 0.12;
      setK(c, pop(t, a, E.end + 0.3));
      c.position.y = dropY(t, a, 0.9, 0.5);
    });
    const fk = seg(t, E.reveal - 0.1, E.reveal + 0.3);
    qQ.rotation.y = (Math.PI / 2) * ease(Math.min(1, fk * 2));
    if (fk >= 0.5) qQ.visible = false;
    setK(qGT, fk > 0.5 ? pop(t, E.quiz, E.end + 0.3) * (1 + 0.25 * bumpAt(t, E.reveal + 0.2, 0.2)) : 0);
    qGT.rotation.y = -(Math.PI / 2) * (1 - ease(Math.max(0, fk * 2 - 1)));
    q5.position.y += hopAt(t, E.mouth + 0.1, 0.4, 0.2);

    // 重点讲解里的算式：“>”最后弹出；4 和 3 沿弧线互换；“>”翻成“<”；讲开口、尖尖时去掉中间的标注
    const [P0, P1, P2] = F.parts;
    const d = P2.offsetLeft - P0.offsetLeft;
    const sk = ease(seg(t, E.swap, E.swap + 0.7));
    const lift = Math.sin(Math.PI * sk) * 160;
    P0.style.transform = `translate(${d * sk}px, ${-lift}px)`;
    P2.style.transform = `translate(${-d * sk}px, ${lift}px)`;
    const gk = easeBack(seg(t, E.gtsym - 0.05, E.gtsym + 0.35));
    const flk = seg(t, E.ltsym - 0.2, E.ltsym + 0.2);
    P1.innerHTML = flk < 0.5 ? "&gt;" : "&lt;";
    P1.style.transform = `scale(${Math.max(0.001, gk) * Math.max(0.05, Math.abs(Math.cos(Math.PI * flk)))}, ${Math.max(0.001, gk)})`;
    const lab1 = F.labels[1];
    lab1.textContent = t < E.ltsym ? "大于号" : "小于号";
    lab1.style.display = t >= E.tip - 0.1 || (sk > 0 && sk < 1) ? "none" : "";

    // 题卡答案：说到“大于”时弹出“5 > 2”
    const ak = easeBack(seg(t, E.reveal, E.reveal + 0.4));
    qans.innerHTML = t >= E.reveal ? `<span style="display:inline-block;transform:scale(${Math.max(0.001, ak)})"><span class="ok">✓</span>5 &gt; 2</span>` : "";
  }

  const HOME = V(0.75, 0, 1.2);
  // 练一练用的近景：比预设 close 稍远、往右偏一点，豆豆整个留在画面里，气泡不压数字卡
  // 高俯视：比预设 top 往右挪一点，镜头漂移时豆豆不出画
  const TOP = [V(0.2, 7.0, 3.5), V(0.2, 0, -0.1)];
  const QUIZ_CAM = [V(0.3, 4.5, 5.3), V(0.3, 0.2, -0.2)];
  return {
    update,
    camera: [
      [0, "front"], [E.find - 0.1, "front"], [E.find + 0.6, TOP],
      [E.oops, TOP], [E.oops + 0.8, "front"],
      [E.eq, "front"], [E.eq + 0.7, TOP],
      [E.quiz, TOP], [E.quiz + 0.8, QUIZ_CAM],
      [E.wrap, QUIZ_CAM], [E.wrap + 0.8, "front"],
    ],
    doudou: {
      base: HOME,
      yaw: (t) => lerp(-0.5, -0.2, ease(seg(t, E.end, E.end + 0.6))),
      actions: [
        { type: "hop", at: 0.15, dur: 0.6 },
        { type: "think", at: E.blocks, dur: 1.3 },
        { type: "point", at: E.stretch - 0.15, dur: 1.0, side: "L" },
        { type: "cheer", at: E.claim, dur: 0.8 },
        { type: "surprise", at: E.doubt, dur: 0.8 },
        { type: "surprise", at: E.oops, dur: 0.7 },
        { type: "shy", at: E.shy - 0.1, dur: 1.2 },
        { type: "nod", at: E.cnt_ball, dur: 0.6 },
        { type: "point", at: E.open, dur: 1.8, side: "L" },
        { type: "nod", at: E.same, dur: 0.6 },
        { type: "think", at: E.quiz + 0.5, dur: E.answer - E.quiz - 0.5 },
        { type: "cheer", at: E.mouth, dur: 0.9 },
        { type: "hop", at: E.wrap, dur: 0.5 },
        { type: "wave", at: E.wrap + 0.6, dur: 1.4, side: "R" },
      ],
    },
  };
}
