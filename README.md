# math-video-kit

小学数学竖屏科普短视频模板（1080×1920，60 秒左右）。课程按人教版小学数学 1–6 年级教材的单元顺序排列，每天做两课。

- 原创小角色“豆豆”：头顶长着豆芽的小仓鼠，童声配音，口型跟着声音动。
- 6 个场景主题、6 种讲法、4 种镜头风格、4 种配乐，按课号自动轮换。
- 用 three.js 做三维动画，在无头 Chrome 里逐帧录制；配音用 edge-tts，配乐和音效都是程序合成的原创音频。

## 目录
| 路径 | 内容 |
|---|---|
| `PLAYBOOK.md` | 每日制作手册（定时任务照此执行） |
| `docs/ELEMENTS.md` | 画面元件清单：角色动作、主题、道具、文字组件、音效 |
| `docs/DESIGN_BRIEF.md` | 课程设计说明 |
| `data/curriculum.json` | 267 课的课程表（册、单元、课本页码） |
| `engine/` | 播放器：舞台与主题、豆豆、道具库、文字层 |
| `player.html` | 页面入口：`player.html?lesson=lessons/L0003` |
| `tools/` | `plan.py` 当日计划 · `textbook.py` 渲染教材 · `new_lesson.py` 新建一课 · `voice.py` 配音和时间轴 · `render.py` 抽帧检查和渲染 · `mix.py` 混音 · `make.py` 一条命令出片 |
| `lessons/Lnnnn/` | 每课的 `script.json`（配音脚本）、`lesson.js`（分镜动画）、`design.md`、`notes.md` |

## 快速开始
```bash
npm install && pip install --break-system-packages edge-tts playwright scipy pillow
python3 tools/voice.py lessons/L0003
python3 tools/render.py lessons/L0003 --check
python3 tools/make.py lessons/L0003 "小学数学第3课_数一数.mp4"
```
完整样例见 `lessons/L0003`（数一数 · 太空闯关）。
