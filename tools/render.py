"""录制：用无头 Chrome 逐帧渲染 player.html，编码成视频；也可以只抽几帧检查。

  python3 tools/render.py lessons/L0003 --check            # 自动挑关键时刻，拼成 check.jpg
  python3 tools/render.py lessons/L0003 --check 1.2 5 9.8  # 指定时刻
  python3 tools/render.py lessons/L0003                    # 全片渲染 -> video.mp4（无声）
"""
import functools, http.server, json, os, subprocess, sys, threading
from multiprocessing import Process
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
FPS = 30
CHROME_ARGS = ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--font-render-hinting=none"]


def serve():
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Quiet, directory=str(ROOT)))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv.server_address[1]


def open_page(p, port, lesson):
    exe = "/usr/bin/google-chrome" if Path("/usr/bin/google-chrome").exists() else None
    b = p.chromium.launch(executable_path=exe, args=CHROME_ARGS)
    pg = b.new_page(viewport={"width": 1080, "height": 1920}, device_scale_factor=1)
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: m.type == "error" and errs.append(m.text))
    pg.goto(f"http://127.0.0.1:{port}/player.html?lesson={lesson}")
    try:
        pg.wait_for_function("window.ready === true", timeout=90000)
    except Exception:
        sys.exit("页面没有就绪，错误：\n" + "\n".join(errs))
    pg.evaluate("document.fonts.ready")
    return b, pg, errs


def worker(lesson, a, z, out, port):
    tmp = out.with_suffix(".tmp.mp4")
    with sync_playwright() as p:
        b, pg, errs = open_page(p, port, lesson)
        ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "image2pipe", "-c:v", "mjpeg", "-framerate", str(FPS), "-i", "-",
                               "-c:v", "libx264", "-crf", "18", "-preset", "veryfast", "-pix_fmt", "yuv420p", "-r", str(FPS), str(tmp)],
                              stdin=subprocess.PIPE)
        for f in range(a, z):
            pg.evaluate(f"renderAt({f / FPS})")
            ff.stdin.write(pg.screenshot(type="jpeg", quality=92))
            if (f - a) % 150 == 0:
                print(f"{out.name}: 帧 {f}/{z}", flush=True)
        ff.stdin.close()
        if ff.wait() != 0:
            sys.exit("ffmpeg 失败")
        if errs:
            print("页面错误：", errs[:5])
        b.close()
    os.replace(tmp, out)


def check(lesson, times):
    from PIL import Image
    d = ROOT / lesson
    port = serve()
    with sync_playwright() as p:
        b, pg, errs = open_page(p, port, lesson)
        ims = []
        for t in times:
            pg.evaluate(f"renderAt({t})")
            path = d / f"check_{t:.2f}.jpg"
            pg.screenshot(path=str(path), type="jpeg", quality=85)
            ims.append(Image.open(path).resize((360, 640)))
        b.close()
    cols = min(5, len(ims))
    rows = (len(ims) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * 360, rows * 640), "white")
    for i, im in enumerate(ims):
        sheet.paste(im, ((i % cols) * 360, (i // cols) * 640))
    sheet.save(d / "check.jpg", quality=85)
    for t in times:
        (d / f"check_{t:.2f}.jpg").unlink(missing_ok=True)
    print("检查图：", d / "check.jpg", "时刻：", [round(t, 2) for t in times])
    if errs:
        print("页面错误：", errs[:5])


def main():
    lesson = sys.argv[1].rstrip("/")
    d = ROOT / lesson
    tl = json.loads((d / "timeline.json").read_text())
    if "--check" in sys.argv:
        rest = [float(x) for x in sys.argv[sys.argv.index("--check") + 1:]]
        if not rest:
            ev = sorted(set(round(v + 0.5, 2) for v in tl["events"].values()))
            step = max(1, len(ev) // 9)
            rest = ev[::step][:9] + [round(tl["duration"] - 0.6, 2)]
        check(lesson, rest)
        return
    n = int(tl["duration"] * FPS)
    workers = int(os.environ.get("WORKERS", "1"))   # 2 核机器上单进程最快（实测 0.54 秒/帧；两进程互相抢 CPU 反而更慢）
    port = serve()
    bounds = [n * i // workers for i in range(workers + 1)]
    parts = [d / f"part{i}.mp4" for i in range(workers)]
    ps = [Process(target=worker, args=(lesson, bounds[i], bounds[i + 1], parts[i], port)) for i in range(workers)]
    for p in ps:
        p.start()
    for p in ps:
        p.join()
        if p.exitcode != 0:
            sys.exit("渲染进程失败")
    (d / "parts.txt").write_text("".join(f"file '{p.name}'\n" for p in parts))
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(d / "parts.txt"), "-c", "copy", str(d / "video.mp4")], check=True)
    for p in parts:
        p.unlink()
    print("无声视频：", d / "video.mp4")


if __name__ == "__main__":
    main()
