// 第 4 课 · 比多少（海底世界 · 魔术揭秘）。所有动画都由时间 t 计算，事件时刻来自 E（timeline.json）。
export default function (api) {
  const { props, V, U, E, ui, THREE } = api;
  const { seg, ease, easeOut, pop, dropY, win, lerp, arc } = U;

  const phys = (color, o = {}) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.45, clearcoat: 0.4, clearcoatRoughness: 0.35, ...o });
  const mesh = (geo, mat) => { const o = new THREE.Mesh(geo, mat); o.castShadow = true; o.receiveShadow = true; return o; };

  // ---------- 现拼道具：贝壳、珍珠、小鱼 ----------
  function makeShell(color, r = 0.17) {
    const g = new THREE.Group();
    const light = new THREE.Color(color).lerp(new THREE.Color(0xffffff), 0.35).getHex();
    const deep = new THREE.Color(color).multiplyScalar(0.72).getHex();
    const bowl = mesh(new THREE.SphereGeometry(r, 28, 14, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), phys(color, { side: THREE.DoubleSide }));
    bowl.scale.y = 0.55; bowl.position.y = r * 0.55; g.add(bowl);
    const inner = mesh(new THREE.CircleGeometry(r * 0.93, 28), phys(deep, { roughness: 0.5 }));
    inner.rotation.x = -Math.PI / 2; inner.position.y = r * 0.4; g.add(inner);
    // 竖起来的扇形上壳，正面朝镜头
    const back = new THREE.Group(); back.position.set(0, r * 0.5, -r * 0.8); back.rotation.x = -0.4;
    const fan = mesh(new THREE.SphereGeometry(r, 28, 18), phys(light)); fan.scale.set(1.02, 0.95, 0.2); fan.position.y = r * 0.8; back.add(fan);
    for (let j = -2; j <= 2; j++) {
      const rib = mesh(new THREE.CapsuleGeometry(0.011, r * 1.15, 4, 8), phys(color)); rib.castShadow = false;
      rib.position.set(Math.sin(j * 0.36) * r * 0.62, r * 0.8 + (Math.cos(j * 0.36) - 1) * r * 0.5, r * 0.19); rib.rotation.z = -j * 0.36; rib.scale.y = 1 - Math.abs(j) * 0.1;
      back.add(rib);
    }
    g.add(back);
    g.userData.seat = r * 0.4;
    return g;
  }
  function makePearl(r = 0.095) {
    const g = new THREE.Group();
    const p = mesh(new THREE.SphereGeometry(r, 28, 20), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.1, sheen: 1, sheenColor: 0xffc9e3, emissive: 0xfff0f6, emissiveIntensity: 0.18 }));
    p.position.y = r; g.add(p);
    return g;
  }
  function makeFish(color) {
    const g = new THREE.Group();
    const body = mesh(new THREE.SphereGeometry(0.14, 24, 16), phys(color)); body.scale.set(1.3, 0.9, 0.62); g.add(body);
    const tail = mesh(new THREE.ConeGeometry(0.1, 0.16, 3), phys(color)); tail.rotation.z = -Math.PI / 2; tail.position.x = -0.24; g.add(tail);
    const fin = mesh(new THREE.ConeGeometry(0.05, 0.1, 3), phys(color)); fin.position.set(-0.02, 0.15, 0); g.add(fin);
    for (const s of [-1, 1]) {
      const white = mesh(new THREE.SphereGeometry(0.034, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffffff })); white.position.set(0.1, 0.035, s * 0.072); g.add(white);
      const eye = mesh(new THREE.SphereGeometry(0.019, 10, 8), new THREE.MeshBasicMaterial({ color: 0x2a1a14 })); eye.position.set(0.115, 0.035, s * 0.092); g.add(eye);
    }
    const wrap = new THREE.Group(); g.position.y = 0.17; wrap.add(g); wrap.userData.body = g;
    return wrap;
  }

  // ---------- 魔术一：5 个贝壳、5 颗珍珠 ----------
  const N = 5, ZS = -0.72, ZP = -0.08;
  const tightX = (i) => (i - 2) * 0.34 - 0.1;      // 开始：两排一样长
  const wideX = (i) => (i - 2) * 0.5 - 0.08;        // “变！”之后贝壳拉开
  const shellColors = [0xff9ec4, 0xffb98a, 0xc9a7ff, 0x8fd3ff, 0xffd166];
  const shells = shellColors.map((c) => api.add(makeShell(c)));
  const pearls = Array.from({ length: N + 1 }, () => api.add(makePearl()));
  const flyAt = (i) => E.pair + 0.1 + i * 0.75;          // 第 i 颗珍珠出发时刻
  const FLY = 0.55;
  const extraPos = V(0.05, 0, 0.12);                     // 多出来的第 6 颗珍珠
  const HIDE1 = E.quiz - 0.15;                           // 练一练前收起

  // 魔术闪光
  const sparkMat = new THREE.MeshStandardMaterial({ color: 0xffe066, emissive: 0xffd43b, emissiveIntensity: 0.9, roughness: 0.3 });
  const sparks = Array.from({ length: 14 }, () => { const s = api.add(mesh(new THREE.OctahedronGeometry(0.045), sparkMat)); s.castShadow = false; return s; });

  // ---------- 练一练：4 条小鱼、3 个海星 ----------
  const fishColors = [0xffa23a, 0x4dabf7, 0xff7fa8, 0x63d6a0];
  const fishes = fishColors.map((c) => api.add(makeFish(c)));
  const seaStars = [0xff7b6b, 0xff9a5c, 0xff7b6b].map((c) => { const s = api.add(props.star(c, 0.17)); s.rotation.x = -0.75; return s; });
  const ZF = 0.0, ZT = -0.95;
  const fishTight = (i) => (i - 1.5) * 0.4 - 0.1, starWide = (i) => (i - 1) * 0.72 - 0.1;     // 读题时：海星排得松，小鱼挤在一起
  const colX = (i) => -0.95 + i * 0.5;                                           // 揭晓时：一个对一个排齐
  const links = [0, 1, 2].map(() => { const l = api.add(mesh(new THREE.BoxGeometry(0.07, 0.02, 1), new THREE.MeshStandardMaterial({ color: 0x1c7ed6, emissive: 0x1c7ed6, emissiveIntensity: 0.4 }))); l.castShadow = false; return l; });
  const linkAt = (i) => E.answer + 0.85 + i * 0.3;

  // ---------- 文字层 ----------
  ui.big([
    { at: E.equal, until: E.again - 0.1, text: "同样多", sub: "一个对一个，都没有多余" },
    { at: E.moreAt, until: E.less + 0.9, text: "多", sub: "珍珠比贝壳多 1 个" },
    { at: E.lessAt, until: E.quiz - 0.25, text: "少", sub: "贝壳比珍珠少 1 个" },
  ]);
  ui.pills([
    { text: "一个对一个", color: "#1c7ed6", at: E.pair, until: E.equal - 0.1, anchor: () => V(0, 0.75, ZS) },
    { text: "没有贝壳住", color: "#ff6b6b", at: E.lonely, until: HIDE1, anchor: () => pearls[N].position.clone().add(V(0, 0.3, 0)) },
    { text: "多 1 条", color: "#2f9e44", at: E.answer + 2.0, until: E.end, anchor: () => fishes[3].position.clone().add(V(0, 0.55, 0)) },
  ]);
  ui.bubbles([
    { text: "变！", at: E.magic - 0.1, until: E.ask },
    { text: "变多了？", at: E.more0, until: E.reveal + 0.5 },
    { text: "再变！", at: E.magic2 - 0.1, until: E.more },
  ]);
  ui.quiz({ at: E.quiz, countFrom: E.quiz_end, answerAt: E.quiz_end + 3.0, until: E.outro + 0.4, q: "<b>小鱼</b>和<b>海星</b>，谁多？", a: "小鱼多（多 1 条）" });

  function burst(t, at, center, list, spread) {
    list.forEach((s, j) => {
      const k = seg(t, at, at + 0.8);
      const a = (j / list.length) * Math.PI * 2 + j;
      const r = easeOut(k) * spread * (0.6 + 0.4 * ((j * 7) % 5) / 4);
      if (k > 0 && k < 1) {
        s.visible = true;
        s.position.set(center.x + Math.cos(a) * r * 1.6, center.y + 0.25 + Math.abs(Math.sin(a * 1.7)) * r + easeOut(k) * 0.25, center.z + Math.sin(a) * r * 0.5);
        s.scale.setScalar(Math.max(0.001, Math.sin(Math.PI * k) * 1.2));
        s.rotation.set(t * 5 + j, t * 4, 0);
      }
    });
  }

  function update(t) {
    const hide1 = 1 - ease(seg(t, HIDE1, HIDE1 + 0.35));
    const spread = ease(seg(t, E.magic, E.magic + 0.75));
    const joy = Math.sin(Math.PI * seg(t, E.equal, E.equal + 0.45)) * 0.14;     // “同样多”时一起跳一下

    shells.forEach((s, i) => {
      const a = 0.25 + i * 0.09;
      const k = pop(t, a, 1e9) * hide1;
      const wob = Math.sin(Math.PI * seg(t, E.magic, E.magic + 0.75)) * 0.1;   // 变魔术时抖一抖
      s.position.set(lerp(tightX(i), wideX(i), spread), dropY(t, a, 0.9, 0.5) + wob + joy, ZS);
      s.rotation.y = Math.sin(t * 1.1 + i) * 0.06;
      s.scale.setScalar(Math.max(0.001, k));
      s.visible = k > 0.002;
    });
    pearls.forEach((p, i) => {
      if (i < N) {
        const a = 0.45 + i * 0.09;
        const k = pop(t, a, 1e9) * hide1;
        const from = V(tightX(i), 0, ZP);
        const sp = shells[i].position;
        const to = V(sp.x, shells[i].userData.seat, ZS + 0.02);
        const fk = ease(seg(t, flyAt(i), flyAt(i) + FLY));
        const pos = arc(from, to, fk, 0.55);
        const land = Math.exp(-Math.pow((t - flyAt(i) - FLY - 0.08) / 0.1, 2));
        pos.y += dropY(t, a, 0.9, 0.5) + (fk >= 1 ? joy : 0);
        if (fk < 0.001) pos.y += Math.abs(Math.sin(t * 2.2 + i * 0.9)) * 0.015;
        p.position.copy(pos);
        p.scale.setScalar(Math.max(0.001, k * (1 + 0.25 * land)));
        p.visible = k > 0.002;
      } else {
        const k = pop(t, E.extra, 1e9, 0.45) * hide1;
        const sad = t >= E.lonely ? Math.sin((t - E.lonely) * 6) * 0.06 * (1 - seg(t, E.lonely, E.lonely + 1.5)) : 0;   // 左右张望
        const hopK = Math.sin(Math.PI * seg(t, E.moreAt, E.moreAt + 0.4)) * 0.2;
        p.position.set(extraPos.x + sad, dropY(t, E.extra, 0.7, 0.5) + hopK, extraPos.z);
        p.scale.setScalar(Math.max(0.001, k * 1.15));
        p.visible = k > 0.002;
      }
    });

    sparks.forEach((s) => { s.visible = false; });
    burst(t, E.magic, V(0, 0.1, ZS), sparks, 0.75);
    burst(t, E.magic2 + 0.15, V(extraPos.x, 0.05, extraPos.z), sparks.slice(0, 8), 0.4);

    // 练一练：读题时两排不对齐；揭晓时一个对一个排齐、连线，多出的小鱼跳起来
    const hide2 = 1 - ease(seg(t, E.end - 0.1, E.end + 0.35));
    const al = ease(seg(t, E.answer, E.answer + 0.7));
    fishes.forEach((f, i) => {
      const a = E.fish - 0.25 + i * 0.1;
      const k = pop(t, a, 1e9) * hide2;
      const lone = i === 3 ? Math.abs(Math.sin(Math.PI * 2 * seg(t, E.answer + 1.9, E.answer + 2.9))) * 0.22 : 0;
      f.position.set(lerp(fishTight(i), colX(i), al), dropY(t, a, 0.8, 0.5) + Math.sin(t * 2.3 + i * 1.3) * 0.03 + lone, ZF);
      f.userData.body.rotation.y = -0.35 + Math.sin(t * 1.6 + i) * 0.18;
      f.userData.body.rotation.z = Math.sin(t * 2.3 + i * 1.3 + 1) * 0.08;
      f.scale.setScalar(Math.max(0.001, k));
      f.visible = k > 0.002;
    });
    seaStars.forEach((s, i) => {
      const a = E.stars - 0.25 + i * 0.1;
      const k = pop(t, a, 1e9) * hide2;
      s.position.set(lerp(starWide(i), colX(i), al), dropY(t, a, 0.8, 0.5) + 0.03, ZT);
      s.rotation.z = Math.sin(t * 1.5 + i * 2) * 0.12;
      s.scale.setScalar(Math.max(0.001, k));
      s.visible = k > 0.002;
    });
    links.forEach((l, i) => {
      const k = easeOut(seg(t, linkAt(i), linkAt(i) + 0.3)) * hide2;
      const z0 = ZT + 0.14, z1 = ZF - 0.12;
      l.scale.set(1, 1, Math.max(0.001, (z1 - z0) * k));
      l.position.set(colX(i), 0.02, z0 + ((z1 - z0) * k) / 2);
      l.visible = k > 0.002;
    });
  }

  return {
    update,
    camera: [[0, "front"]],
    doudou: {
      base: (t) => V(0.82 + 0.2 * Math.sin(t * 0.12), 0, lerp(1.0, 1.4, ease(seg(t, E.quiz - 0.3, E.quiz + 0.4)))),
      yaw: (t) => lerp(-0.55, -0.2, ease(seg(t, E.end, E.end + 0.6))),
      actions: [
        { type: "hop", at: 0.15, dur: 0.6 },
        { type: "wave", at: 1.0, dur: 1.6, side: "L" },
        { type: "cheer", at: E.magic - 0.15, dur: 0.9 },
        { type: "think", at: E.more0, dur: 1.5 },
        { type: "point", at: E.pair, dur: 3.6, side: "L" },
        { type: "nod", at: E.none, dur: 0.7 },
        { type: "surprise", at: E.equal, dur: 0.8 },
        { type: "cheer", at: E.magic2 - 0.1, dur: 0.9 },
        { type: "point", at: E.lonely, dur: 2.0, side: "L" },
        { type: "nod", at: E.moreAt, dur: 0.6 },
        { type: "nod", at: E.lessAt, dur: 0.6 },
        { type: "hop", at: E.quiz - 0.3, dur: 0.7 },
        { type: "think", at: E.quiz + 0.6, dur: 4.8 },
        { type: "cheer", at: E.win, dur: 0.9 },
        { type: "cheer", at: E.learned, dur: 1.2 },
      ],
    },
  };
}
