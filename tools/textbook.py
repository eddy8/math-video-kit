"""教材：下载人教版小学数学 PDF，渲染指定课本页码，供阅读后整理“教材要点”。

  python3 tools/textbook.py 一年级上册 12 33          # 低清总览：12–33 页每 8 页拼一张 -> textbooks/一年级上册_p12-33_*.jpg
  python3 tools/textbook.py 一年级上册 14 15 --hi     # 高清单页：-> textbooks/一年级上册_p14.jpg ...

页码是课本印刷页码；PDF 页码 = 课本页码 + 6（已在 4 册上核对）。
PDF 是扫描图片、没有文字层。仓库里是 Git LFS 指针，必须从 media.githubusercontent.com 下载。
"""
import subprocess, sys, urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "textbooks"
OFFSET = 6


def pdf_path(book):
    OUT.mkdir(exist_ok=True)
    name = f"人教版数学{book}.pdf"
    p = OUT / name
    if not p.exists() or p.stat().st_size < 1_000_000:
        url = "https://media.githubusercontent.com/media/LYUGUISONG/textbooks/main/" + urllib.parse.quote(f"数学/{name}")
        subprocess.run(["curl", "-sS", "--fail", "--max-time", "300", "-o", str(p), url], check=True)
    return p


def main():
    book, a, b = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
    hi = "--hi" in sys.argv
    pdf = pdf_path(book)
    if hi:
        for pg in range(a, b + 1):
            stem = OUT / f"{book}_p{pg}"
            subprocess.run(["pdftoppm", "-f", str(pg + OFFSET), "-l", str(pg + OFFSET), "-r", "80", "-jpeg", "-singlefile", str(pdf), str(stem)], check=True)
            print(stem.with_suffix(".jpg"))
        return
    from PIL import Image
    tmp = OUT / "tmp"; tmp.mkdir(exist_ok=True)
    for f in tmp.glob("*"): f.unlink()
    subprocess.run(["pdftoppm", "-f", str(a + OFFSET), "-l", str(b + OFFSET), "-r", "40", "-jpeg", str(pdf), str(tmp / "p")], check=True)
    files = sorted(tmp.glob("p-*.jpg"))
    for k in range(0, len(files), 8):
        ims = [Image.open(f) for f in files[k:k + 8]]
        w, h = ims[0].size
        sheet = Image.new("RGB", (4 * w, 2 * h), "white")
        for i, im in enumerate(ims):
            sheet.paste(im, ((i % 4) * w, (i // 4) * h))
        out = OUT / f"{book}_p{a + k}-{min(b, a + k + 7)}.jpg"
        sheet.save(out, quality=80)
        print(out, "（从左到右、从上到下依次为课本第", a + k, "页起）")


if __name__ == "__main__":
    main()
