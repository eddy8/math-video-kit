"""新建一课的目录和初始文件（元信息来自 plan.py 的轮换结果）。

  python3 tools/new_lesson.py 4

生成 lessons/L0004/script.json（只填好元信息，lines/end/sfx 待写）和 lesson.js（空骨架）。
写法参考完整样例 lessons/L0003。
"""
import json, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from plan import lesson_plan, ROOT

n = int(sys.argv[1])
p = lesson_plan(n)
d = ROOT / p["dir"]
d.mkdir(parents=True, exist_ok=True)
book = f'{p["book"]} · {p["unit"].split(" ", 1)[-1]}'
script = {
    # 片头和片尾用短课题：课程表里冒号后面的细分内容不放进标题（模板也会自动缩小长标题）
    "lesson": n, "round": p["round"], "title": p["title"].split("：")[0], "book": book,
    "theme": p["theme"], "format": p["format"], "cameraStyle": p["cameraStyle"], "music": p["music"],
    "lines": [], "end": {"summary": ""}, "sfx": [],
}
if not (d / "script.json").exists():
    (d / "script.json").write_text(json.dumps(script, ensure_ascii=False, indent=1))
if not (d / "lesson.js").exists():
    (d / "lesson.js").write_text(f"""// 第 {n} 课 · {p["title"]}（{p["themeLabel"]} · {p["format"]}）
// 写法参考 lessons/L0003/lesson.js；可用的道具、动作、文字组件见 docs/ELEMENTS.md。
export default function (api) {{
  const {{ props, V, U, E, ui }} = api;
  const {{ seg, ease, easeOut, pop, dropY, win, lerp, arc }} = U;

  // 1. 摆道具：const a = api.add(props.apple(), V(0, 0, -0.4));
  // 2. 文字层：ui.big([...])、ui.pills([...])、ui.bubbles([...])、ui.focus({{...}})、ui.quiz({{...}})

  function update(t) {{
    // 3. 每帧根据 t 和事件时刻 E.xxx 设置道具的位置、缩放、可见性（纯函数，不累积状态）
  }}

  return {{
    update,
    camera: [[0, "front"]],
    doudou: {{ base: V(0.95, 0, 1.0), yaw: -0.5, actions: [] }},
  }};
}}
""")
print(json.dumps(p, ensure_ascii=False, indent=1))
print("已创建：", d)
