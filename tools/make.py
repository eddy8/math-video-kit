"""一条命令出片：配音（如未生成）→ 全片渲染 → 混音 → 成片检查。

  python3 tools/make.py lessons/L0004 "小学数学第4课_比多少.mp4"
  python3 tools/make.py lessons/L0004 "..." --revoice     # 改过 script.json 后重新配音

产物：<课目录>/<文件名>，以及 <课目录>/final_check.jpg（从成片抽的 5 帧）。
"""
import json, re, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def sh(*cmd):
    print("$", " ".join(map(str, cmd)), flush=True)
    subprocess.run(list(map(str, cmd)), check=True, cwd=ROOT)


def main():
    d, name = sys.argv[1].rstrip("/"), sys.argv[2]
    if "--revoice" in sys.argv or not (ROOT / d / "timeline.json").exists():
        sh("python3", "tools/voice.py", d)
    sh("python3", "tools/render.py", d)
    sh("python3", "tools/mix.py", d, name)
    out = ROOT / d / name
    tl = json.loads((ROOT / d / "timeline.json").read_text())
    probe = json.loads(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration:stream=codec_name,width,height", "-of", "json", str(out)], capture_output=True, text=True).stdout)
    dur = float(probe["format"]["duration"])
    loud = subprocess.run(["ffmpeg", "-i", str(out), "-af", "loudnorm=print_format=summary", "-f", "null", "-"], capture_output=True, text=True).stderr
    li = re.search(r"Input Integrated:\s+(-?[\d.]+)", loud); tp = re.search(r"Input True Peak:\s+(-?[\d.+]+)", loud)
    from PIL import Image
    times = [1.0] + [tl["events"][k] + 0.6 for k in list(tl["events"])[2:: max(1, len(tl["events"]) // 4)]][:3] + [dur - 0.5]
    ims = []
    for i, t in enumerate(times):
        p = ROOT / d / f"_f{i}.jpg"
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", f"{t:.2f}", "-i", str(out), "-frames:v", "1", "-q:v", "3", str(p)], check=True)
        ims.append(Image.open(p).resize((360, 640)))
    sheet = Image.new("RGB", (360 * len(ims), 640), "white")
    for i, im in enumerate(ims):
        sheet.paste(im, (i * 360, 0))
    sheet.save(ROOT / d / "final_check.jpg", quality=85)
    for i in range(len(times)):
        (ROOT / d / f"_f{i}.jpg").unlink()
    w, h = probe["streams"][0].get("width"), probe["streams"][0].get("height")
    ok = dur <= 60.5 and (w, h) == (1080, 1920)
    print(f"\n成片：{out}\n时长 {dur:.2f}s，{w}x{h}，响度 {li.group(1) if li else '?'} LUFS，峰值 {tp.group(1) if tp else '?'} dBTP\n抽帧：{ROOT / d / 'final_check.jpg'}\n{'通过' if ok else '未通过：时长或分辨率不符合要求'}")
    if not ok:
        sys.exit(1)


if __name__ == "__main__":
    main()
