// 文字层（HTML 叠加在画布上）：课号标签、大数字、字幕、胶囊标签、豆豆气泡、重点讲解、练一练、片尾卡。
// 所有元素由时间 t 决定状态。
import { clamp, seg, ease, easeBack, easeOut, win, pop } from "./util.js";

/** 数字/算式转 HTML：小数点画成红色圆点；a/b 画成上下分数；× ÷ 等原样 */
export function numHTML(s, unit = "") {
  const parts = String(s).split(/(\d+\/\d+)/g).map((seg) => {
    const fm = seg.match(/^(\d+)\/(\d+)$/);
    if (fm) return `<span class="frac"><span>${fm[1]}</span><span>${fm[2]}</span></span>`;
    return seg.replace(/(\d)\.(\d)/g, '$1<span class="dot"></span>$2').replace(/(\d)\.(\d)/g, '$1<span class="dot"></span>$2');
  });
  return parts.join("") + (unit ? `<span class="unit">${unit}</span>` : "");
}

export function createUI(meta) {
  const root = document.getElementById("ui");
  const el = (cls, html = "", parent = root) => { const d = document.createElement("div"); d.className = cls; d.innerHTML = html; parent.appendChild(d); return d; };
  const tag = el("tag", `小学数学 · 第 ${meta.lesson} 课${meta.round > 1 ? " · 第二轮" : ""}`);
  const titleBadge = el("titlebadge", meta.title);
  const dim = document.getElementById("dim");

  const reg = { big: [], pills: [], bubbles: [], focus: [], quiz: [], end: null, captions: [] };

  const api = {
    /** 顶部大数字：{at, until, text, unit, sub} */
    big(items) { for (const it of items) { const d = el("big", `<div class="num">${numHTML(it.text, it.unit)}</div>${it.sub ? `<div class="bigsub">${it.sub}</div>` : ""}`); reg.big.push({ ...it, d }); } },
    /** 物体旁胶囊标签：{text, color, at, until, anchor: () => Vector3} */
    pills(items) { for (const it of items) { const d = el("pill", it.text); d.style.background = it.color || "#ff8a3d"; d.style.setProperty("--c", it.color || "#ff8a3d"); reg.pills.push({ ...it, d }); } },
    /** 豆豆头顶气泡：{text, at, until} */
    bubbles(items) { for (const it of items) { const d = el("bubble", it.text); reg.bubbles.push({ ...it, d }); } },
    /** 重点讲解：压暗背景，算式放大居中，逐个标注。{at, until, parts:[{text, label, color, labelAt}]} */
    focus(spec) {
      const box = el("focus");
      const parts = spec.parts.map((p) => { const s = document.createElement("span"); s.className = "fpart"; s.innerHTML = numHTML(p.text); box.appendChild(s); return s; });
      const labels = spec.parts.map((p) => p.label ? el("flab", p.label) : null);
      reg.focus.push({ at: spec.at, until: spec.until, partsDef: spec.parts, box, parts, labels });
    },
    /** 练一练：{at, countFrom, answerAt, until, q, a}，countFrom（默认 at）到 answerAt 之间显示倒计时 */
    quiz(spec) {
      const d = el("quiz", `<div class="qhead">练一练</div><div class="qbody">${spec.q}</div><div class="qans"><span class="ok">✓</span>${spec.a}</div><div class="ring"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" class="trk"/><circle cx="50" cy="50" r="42" class="arc"/></svg><span class="cnt"></span></div>`);
      reg.quiz.push({ ...spec, d });
    },
    /** 片尾卡：{at, summary, chips:[]} */
    end(spec) {
      const d = el("endcard", `<div class="et">第 ${meta.lesson} 课 · ${meta.title}</div><div class="es">${spec.summary}</div>${spec.chips ? `<div class="chips">${spec.chips.map((c) => `<span class="chip">${numHTML(c)}</span>`).join("")}</div>` : ""}<div class="eb">对应人教版${meta.book}</div>`);
      reg.end = { ...spec, d };
    },
    captions(lines) {
      for (const L of lines) {
        const d = el(`cap ${L.speaker === "doudou" ? "dd" : ""}`, (L.speaker === "doudou" ? '<span class="who">豆豆</span>' : "") + L.caption);
        reg.captions.push({ ...L, d });
      }
    },
  };

  function update(t, project, headPos) {
    const endAt = reg.end ? reg.end.at : 1e9;
    tag.style.opacity = 1 - ease(seg(t, endAt, endAt + 0.3));
    const tb = pop(t, 0.2, 2.6, 0.4);
    titleBadge.style.opacity = clamp(tb * 2);
    titleBadge.style.transform = `translateX(-50%) scale(${Math.max(0.001, tb)})`;
    titleBadge.style.left = "50%";

    let focusK = 0;
    for (const f of reg.focus) {
      const k = ease(seg(t, f.at, f.at + 0.4)) * (1 - ease(seg(t, f.until - 0.3, f.until)));
      focusK = Math.max(focusK, k);
      f.box.style.opacity = k;
      f.box.style.transform = `translate(-50%,-50%) scale(${0.55 + 0.45 * easeBack(seg(t, f.at, f.at + 0.45))})`;
      f.labels.forEach((lab, i) => {
        if (!lab) return;
        const def = f.partsDef[i];
        const kk = pop(t, def.labelAt, 1e9) * k;
        lab.style.opacity = clamp(kk * 2);
        lab.style.background = def.color || "#ff8a3d";
        lab.style.setProperty("--c", def.color || "#ff8a3d");
        const r = f.parts[i].getBoundingClientRect();
        lab.style.left = `${r.left + r.width / 2}px`;
        lab.style.top = `${r.bottom + 40}px`;
        lab.style.transform = `translate(-50%,0) scale(${Math.max(0.001, kk)})`;
        f.parts[i].style.color = t >= def.labelAt && k > 0.5 ? (def.color || "") : "";
      });
    }
    dim.style.opacity = focusK;

    for (const b of reg.big) {
      const k = pop(t, b.at, b.until);
      b.d.style.opacity = clamp(k * 1.6) * (1 - focusK);
      b.d.firstChild.style.transform = `scale(${Math.max(0.001, k)})`;
    }
    for (const c of reg.captions) {
      const k = win(t, c.capStart, c.capEnd, 0.15);
      c.d.style.opacity = k;
      c.d.style.transform = `translate(-50%,-50%) translateY(${(1 - ease(seg(t, c.capStart, c.capStart + 0.2))) * 16}px)`;
    }
    for (const p of reg.pills) {
      const k = pop(t, p.at, p.until);
      p.d.style.opacity = clamp(k * 2) * (1 - focusK);
      if (k > 0) { const [x, y] = project(p.anchor(t)); p.d.style.left = `${x}px`; p.d.style.top = `${y}px`; p.d.style.transform = `translate(-50%,-100%) scale(${Math.max(0.001, k)})`; }
    }
    for (const b of reg.bubbles) {
      const k = pop(t, b.at, b.until);
      b.d.style.opacity = clamp(k * 2) * (1 - focusK);
      if (k > 0 && headPos) { const [x, y] = project(headPos); b.d.style.left = `${Math.min(x, 960)}px`; b.d.style.top = `${y - 6}px`; b.d.style.transform = `translate(-70%,-100%) scale(${Math.max(0.001, k)})`; }
    }
    for (const q of reg.quiz) {
      const k = win(t, q.at, q.until, 0.25);
      q.d.style.opacity = k * (1 - focusK);
      q.d.style.transform = `translateX(-50%) translateY(${(1 - easeOut(seg(t, q.at, q.at + 0.35))) * -30}px)`;
      const ans = t >= q.answerAt;
      const ak = easeBack(seg(t, q.answerAt, q.answerAt + 0.4));
      q.d.querySelector(".qans").style.opacity = clamp(ak * 2);
      q.d.querySelector(".qans").style.transform = `scale(${Math.max(0.001, ak)})`;
      const ring = q.d.querySelector(".ring");
      const from = q.countFrom ?? q.at;
      const rem = q.answerAt - t, total = q.answerAt - from;
      ring.style.opacity = !ans && t >= from ? 1 : 0;
      ring.querySelector(".arc").style.strokeDashoffset = String(264 * (1 - clamp(rem / total)));
      ring.querySelector(".cnt").textContent = ans ? "" : String(Math.max(1, Math.ceil(rem)));
    }
    if (reg.end) {
      const k = easeBack(seg(t, reg.end.at + 0.1, reg.end.at + 0.55));
      reg.end.d.style.opacity = clamp(k * 2);
      reg.end.d.style.transform = `translateX(-50%) scale(${Math.max(0.001, k)})`;
    }
  }

  return { ...api, update, reg };
}
