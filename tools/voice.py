"""配音 + 时间轴：读取 <课目录>/script.json，生成每句配音、整条人声轨 voice.wav 和 timeline.json。

用法：python3 tools/voice.py lessons/L0003

script.json 中每句：
  {"id": "hook", "speaker": "narrator" | "doudou", "say": "念出来的文字（数字写汉字）",
   "caption": "屏幕字幕 HTML（用阿拉伯数字，<b>重点</b>，<br> 换行）",
   "gap": 句后停顿秒数（默认 0.45）,
   "marks": {"事件名": "关键词" | ["关键词", 第几次出现(从0起)]}}
多音字：data/polyphones.json 里的字在 say 中每一处都要标音，如 数[shǔ]、重[chóng]，否则直接报错（见 tools/pron.py）。
marks 的关键词按原字写，不用带标音。
自动事件：每句 id 为该句开始时刻，id_end 为结束时刻；end 为全片结束卡时刻。
"""
import asyncio, json, os, subprocess, sys, wave
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from pron import check_script, to_tts   # 多音字检查与标音替换

import certifi
certifi.where = lambda: "/root/.ccr/ca-bundle.crt"   # edge-tts 固定用 certifi；改用代理 CA
import edge_tts
import numpy as np

VOICES = {
    "narrator": dict(voice="zh-CN-XiaoxiaoNeural", rate="-6%", pitch="+6Hz"),   # 温柔亲切的女声
    "doudou": dict(voice="zh-CN-YunxiaNeural", rate="+0%", pitch="+12Hz"),      # 豆豆：可爱童声
}
SR = 48000
FPS = 30
LEAD = 0.09          # 去掉开头静音后，WordBoundary 时间约提前这么多
END_PAD = 0.45       # 最后一句后到片尾卡的停顿
END_HOLD = 2.8       # 片尾卡停留时长


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(f"命令失败：{' '.join(cmd)}\n{r.stderr[-800:]}")
    return r.stdout


async def synth(text, spk, out_mp3):
    v = VOICES[spk]
    c = edge_tts.Communicate(text, v["voice"], rate=v["rate"], pitch=v["pitch"],
                             proxy=os.environ.get("HTTPS_PROXY"), boundary="WordBoundary")
    words = []
    with open(out_mp3, "wb") as f:
        async for ch in c.stream():
            if ch["type"] == "audio":
                f.write(ch["data"])
            elif ch["type"] == "WordBoundary":
                words.append((ch["offset"] / 1e7, ch["text"]))
    return words


def trim_to_wav(mp3, wav):
    af = ("silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.02,areverse,"
          "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,areverse")
    run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(mp3), "-af", af, "-ar", str(SR), "-ac", "1", str(wav)])
    with wave.open(str(wav)) as w:
        data = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    return data


def find_mark(words, key, nth=0):
    """在逐词时间点里找关键词（可跨词），返回相对本句开头的秒数"""
    text, starts = "", []
    for off, w in words:
        starts.append((len(text), off))
        text += w
    idx, pos = -1, -1
    for _ in range(nth + 1):
        pos = text.find(key, pos + 1)
        if pos < 0:
            return None
        idx = pos
    t = 0.0
    for ci, off in starts:
        if ci <= idx:
            t = off
    return max(0.0, t - LEAD)


async def main(lesson_dir):
    d = Path(lesson_dir)
    script = json.loads((d / "script.json").read_text())
    problems = check_script(script)
    if problems:
        sys.exit("多音字没有标音，请在 say 里写成 字[拼音]，或改写避开：\n" + "\n".join(problems))
    vdir = d / "voice"
    vdir.mkdir(exist_ok=True)
    lines, events, clips = [], {}, []
    t = 0.6                                      # 片头留 0.6 秒给标题弹出
    for i, L in enumerate(script["lines"]):
        spk = L.get("speaker", "narrator")
        mp3, wav = vdir / f"{i:02d}.mp3", vdir / f"{i:02d}.wav"
        tts_text, subs = to_tts(L["say"])
        words = await synth(tts_text, spk, mp3)
        audio = trim_to_wav(mp3, wav)
        dur = len(audio) / SR
        start, end = t, t + dur
        lid = L.get("id", f"l{i}")
        events[lid] = round(start, 3)
        events[f"{lid}_end"] = round(end, 3)
        for name, spec in (L.get("marks") or {}).items():
            key, nth = (spec, 0) if isinstance(spec, str) else (spec[0], spec[1])
            key = "".join(subs.get(c, c) for c in key)   # 关键词里的多音字同样换成配音用的同音字
            off = find_mark(words, key, nth)
            if off is None:
                sys.exit(f"第 {i} 句没找到关键词“{key}”，逐词结果：{[w for _, w in words]}")
            events[name] = round(start + min(off, dur), 3)
        lines.append({"id": lid, "speaker": spk, "start": round(start, 3), "end": round(end, 3), "caption": L["caption"]})
        clips.append((start, audio, spk))
        t = end + L.get("gap", 0.45)
    end_at = lines[-1]["end"] + END_PAD
    events["end"] = round(end_at, 3)
    duration = round(end_at + END_HOLD, 2)
    # 字幕显示区间：从本句开始到下一句开始（最后一句到片尾卡）
    for i, L in enumerate(lines):
        L["capStart"] = round(L["start"] - 0.08, 3)
        L["capEnd"] = round((lines[i + 1]["start"] - 0.05) if i + 1 < len(lines) else end_at, 3)
    # 整条人声轨 + 豆豆口型
    n = int(duration * SR)
    voice = np.zeros(n, dtype=np.float32)
    mouth = np.zeros(int(duration * FPS) + 1)
    for start, audio, spk in clips:
        i0 = int(start * SR)
        voice[i0:i0 + len(audio)] += audio[: max(0, n - i0)]
        if spk == "doudou":
            hop = SR // FPS
            for f in range(len(audio) // hop):
                rms = float(np.sqrt(np.mean(audio[f * hop:(f + 1) * hop] ** 2)))
                fi = int(start * FPS) + f
                if fi < len(mouth):
                    mouth[fi] = rms
    if mouth.max() > 0:
        mouth = np.clip(mouth / (np.percentile(mouth[mouth > 0], 90) + 1e-6), 0, 1)
        mouth = np.convolve(mouth, [0.25, 0.5, 0.25], mode="same")
    pcm = (np.clip(voice, -1, 1) * 32767).astype(np.int16)
    with wave.open(str(d / "voice.wav"), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    tl = {"duration": duration, "lines": lines, "events": events,
          "mouth": {"fps": FPS, "data": [round(float(x), 3) for x in mouth]}}
    (d / "timeline.json").write_text(json.dumps(tl, ensure_ascii=False, indent=1))
    print(f"时长 {duration}s（上限 60s）；事件：{events}")
    if duration > 60:
        sys.exit("超过 60 秒：请删减配音或停顿后重跑")


if __name__ == "__main__":
    asyncio.run(main(sys.argv[1]))
