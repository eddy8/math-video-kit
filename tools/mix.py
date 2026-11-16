"""混音：人声 + 原创配乐（4 种风格）+ 音效，合成最终成片。

用法：python3 tools/mix.py lessons/L0003 "输出文件名.mp4"
script.json 里：
  "music": "bouncy" | "marimba" | "ukulele" | "dreamy"
  "sfx": [{"at": "事件名" 或 秒数, "type": "pop|ding|whoosh|knock|clink|sparkle|boing|tick|tada|count3", "offset": 0}]
片头标题弹出、片尾卡的音效会自动加上。
"""
import json, subprocess, sys, wave
from pathlib import Path

import numpy as np
from scipy.signal import butter, sosfilt

SR = 48000
rng = np.random.default_rng(2)


def hz(m): return 440 * 2 ** ((m - 69) / 12)
def env(n, a, d):
    e = np.ones(n); na = max(1, int(a * SR))
    e[:na] = np.linspace(0, 1, na); e[na:] = np.exp(-np.arange(n - na) / (d * SR)); return e
def band(x, lo, hi): return sosfilt(butter(2, [lo, hi], btype="band", fs=SR, output="sos"), x)
def fit(x, n):
    """补零或截断到固定长度 n"""
    return np.pad(x, (0, max(0, n - len(x))))[:n]


def delayed(x, d, n):
    """把 x 延后 d 秒，并固定为 n 个采样"""
    return fit(np.pad(x, (int(d * SR), 0)), n)


def tone(f, dur, harm=((1, 1),), a=0.004, d=0.2):
    n = int(dur * SR); t = np.arange(n) / SR
    return sum(amp * np.sin(2 * np.pi * f * k * t) for k, amp in harm) * env(n, a, d)


class Track:
    def __init__(self, dur): self.x = np.zeros(int(dur * SR) + SR)
    def add(self, t, sig, vol=1.0):
        i = int(t * SR)
        if i < 0 or i >= len(self.x): return
        n = min(len(sig), len(self.x) - i); self.x[i:i + n] += vol * sig[:n]


STYLES = {
    # 名称: (BPM, 和弦进行[根音 MIDI 三和弦], 旋律音阶)
    "bouncy": (112, [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]], [76, 79, 81, 79, 76, 74, 72, 74, 76, 72, 69, 72, 74, 71, 67, 71]),
    "marimba": (100, [[65, 69, 72], [62, 65, 69], [58, 62, 65], [60, 64, 67]], [77, 81, 84, 81, 77, 76, 74, 76, 77, 74, 72, 74, 76, 79, 76, 72]),
    "ukulele": (120, [[67, 71, 74], [64, 67, 71], [60, 64, 67], [62, 66, 69]], [79, 83, 86, 83, 81, 79, 76, 79, 83, 81, 79, 76, 78, 81, 78, 74]),
    "dreamy": (88, [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 65]], [84, 79, 76, 79, 81, 76, 72, 76, 79, 76, 74, 71, 74, 79, 83, 79]),
}


def music(style, dur):
    bpm, prog, mel = STYLES[style]
    beat = 60 / bpm; bar = 4 * beat
    tr = Track(dur)
    for k in range(int(dur / bar) + 1):
        ch, st = prog[k % 4], k * bar
        if style == "dreamy":
            n = int((bar + 0.8) * SR); t = np.arange(n) / SR
            e = np.minimum(1, t / 0.6) * np.exp(-np.maximum(0, t - bar) / 0.4)
            tr.add(st, sum(np.sin(2 * np.pi * hz(m) * t * (1 + d)) for m in ch for d in (-0.003, 0.003)) * e, 0.028)
            for j in range(8):
                tr.add(st + j * beat / 2, tone(hz(ch[j % len(ch)] + 24), 0.6, ((1, 1), (2.01, 0.2)), d=0.25), 0.03)
        else:
            for j in (0, 2):
                tr.add(st + j * beat, tone(hz(ch[0] - 12), beat * 1.8, d=0.35), 0.15)
            for j in range(8):
                m = ch[[0, 1, 2, 1][j % 4]] + 12
                if style == "marimba":
                    s = tone(hz(m), 0.35, ((1, 1), (4.0, 0.25)), a=0.002, d=0.08)
                elif style == "ukulele":
                    s = sum(delayed(tone(hz(mm + 12), 0.5, ((1, 1), (2, 0.5), (3, 0.25)), d=0.15), 0.012 * q, int(0.5 * SR)) for q, mm in enumerate(ch))
                    s = s / len(ch) * 1.6
                else:
                    s = tone(hz(m), 0.4, ((1, 1), (2, 0.4), (3, 0.15)), d=0.12)
                tr.add(st + j * beat / 2, s, 0.05)
            for j in range(4):
                n = int(0.2 * SR); t = np.arange(n) / SR
                kick = np.sin(2 * np.pi * (50 + 70 * np.exp(-t / 0.03)) * t) * env(n, 0.002, 0.07)
                tr.add(st + j * beat, kick, 0.16 if j % 2 == 0 else 0.09)
            for j in range(8):
                n = int(0.07 * SR)
                tr.add(st + j * beat / 2, band(rng.standard_normal(n), 5000, 11000) * env(n, 0.004, 0.02), 0.03 if j % 2 else 0.018)
            if style == "ukulele":
                for j in (1, 3):
                    n = int(0.12 * SR)
                    tr.add(st + j * beat, band(rng.standard_normal(n), 900, 3000) * env(n, 0.002, 0.03), 0.06)
        for j in range(4):
            m = mel[(k % 4) * 4 + j]
            tr.add(st + j * beat, tone(hz(m), 0.9, ((1, 1), (3.01, 0.3)), a=0.002, d=0.3), 0.04)
    return tr.x


def sfx(kind):
    n = lambda d: int(d * SR)
    t = lambda d: np.arange(n(d)) / SR
    if kind == "pop":
        tt = t(0.16); f = 500 + 900 * (1 - np.exp(-tt / 0.03))
        return 0.22 * np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(tt), 0.002, 0.05)
    if kind == "ding":
        return 0.12 * (tone(hz(84), 0.9, ((1, 1), (2.76, 0.25)), d=0.28))
    if kind == "sparkle":
        return sum(delayed(tone(hz(m), 0.6, ((1, 1),), d=0.15), 0.06 * i, n(0.9)) for i, m in enumerate([88, 91, 96])) * 0.07
    if kind == "whoosh":
        x = band(rng.standard_normal(n(0.45)), 600, 4000); return 0.1 * x * np.sin(np.pi * np.linspace(0, 1, len(x))) ** 2
    if kind == "knock":
        tt = t(0.12); return 0.25 * np.sin(2 * np.pi * (180 + 200 * np.exp(-tt / 0.01)) * tt) * env(len(tt), 0.001, 0.03)
    if kind == "clink":
        tt = t(0.8); return 0.15 * sum(a * np.sin(2 * np.pi * f * tt) * np.exp(-tt / d) for f, a, d in ((2350, 1, 0.25), (3720, 0.6, 0.15), (5130, 0.4, 0.1)))
    if kind == "boing":
        tt = t(0.4); f = 220 + 160 * np.sin(2 * np.pi * 7 * tt) * np.exp(-tt / 0.2)
        return 0.15 * np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(tt), 0.003, 0.15)
    if kind == "tick":
        x = band(rng.standard_normal(n(0.04)), 2500, 6000); return 0.2 * x * env(len(x), 0.001, 0.008)
    if kind == "tada":
        return sum(delayed(tone(hz(m), 1.0, ((1, 1), (2, 0.3)), d=0.35), 0.1 * i, n(1.4)) for i, m in enumerate([72, 76, 79, 84])) * 0.12
    if kind == "wrong":
        return 0.12 * (fit(tone(hz(55), 0.35, ((1, 1), (1.5, 0.5)), d=0.15), n(0.6)) + delayed(tone(hz(52), 0.4, ((1, 1), (1.5, 0.5)), d=0.2), 0.18, n(0.6)))
    raise ValueError(f"未知音效：{kind}")


def main(lesson_dir, out_name):
    d = Path(lesson_dir)
    script = json.loads((d / "script.json").read_text())
    tl = json.loads((d / "timeline.json").read_text())
    dur, E = tl["duration"], tl["events"]
    with wave.open(str(d / "voice.wav")) as w:
        voice = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768
    N = int(dur * SR)
    voice = np.pad(voice, (0, max(0, N - len(voice))))[:N]
    mus = music(script.get("music", "bouncy"), dur)[:N]
    duck = np.ones(N)
    for L in tl["lines"]:
        duck[int((L["start"] - 0.15) * SR):int((L["end"] + 0.2) * SR)] = 0.4
    k = int(0.12 * SR); duck = np.convolve(duck, np.ones(k) / k, mode="same")
    mus *= duck
    fo = int(1.2 * SR); mus[-fo:] *= np.linspace(1, 0, fo)
    fx = Track(dur)
    cues = [{"at": 0.2, "type": "pop"}, {"at": "end", "type": "tada", "offset": 0.1}] + script.get("sfx", [])
    for c in cues:
        at = c["at"] if isinstance(c["at"], (int, float)) else E[c["at"]]
        if c["type"] == "count3":   # 练一练倒计时：每秒一声
            for i in range(3): fx.add(at + c.get("offset", 0) + i, sfx("tick"))
            continue
        fx.add(at + c.get("offset", 0), sfx(c["type"]))
    mix = voice * 1.0 + mus * 0.9 + fx.x[:N]
    mix = np.tanh(mix * 1.2) / 1.2
    mix *= 0.9 / max(1e-6, np.abs(mix).max())
    pcm = (np.stack([mix, mix], 1) * 32767).astype(np.int16)
    with wave.open(str(d / "audio.wav"), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    out = d / out_name
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(d / "video.mp4"), "-i", str(d / "audio.wav"), "-map", "0:v", "-map", "1:a",
                    "-c:v", "copy", "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-ar", "48000", "-c:a", "aac", "-b:a", "192k", "-shortest",
                    "-movflags", "+faststart", str(out)], check=True)
    info = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration:stream=width,height", "-of", "json", str(out)], capture_output=True, text=True).stdout
    print("成片：", out, info.replace("\n", " "))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else "final.mp4")
