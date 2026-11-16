"""多音字检查与标音替换。

配音稿里，data/polyphones.json 列出的字每一处都必须标音：数[shǔ]、重[chóng]……
标了音的字，送去配音时换成只有这个读音的同音字（数[shǔ] → 鼠），屏幕字幕不受影响。

  python3 tools/pron.py lessons/L0004     # 只检查，列出所有未标音的多音字和读音提示
"""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TABLE = json.loads((ROOT / "data/polyphones.json").read_text())["chars"]
ANNOT = re.compile(r"(.)\[([a-zü]+[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]?[a-zü]*)\]")


def to_tts(say):
    """返回 (送去配音的文字, 原字→替换字 的映射)。未知标音直接报错。"""
    subs = {}

    def rep(m):
        ch, py = m.group(1), m.group(2)
        table = TABLE.get(ch)
        if not table or py not in table:
            raise ValueError(f"“{ch}[{py}]”：polyphones.json 里没有这个字或读音，可选 {list((table or {}).keys())}")
        subs[ch] = table[py]
        return table[py]

    return ANNOT.sub(rep, say), subs


def unannotated(say):
    """找出没有标音的多音字，返回 [(位置, 字, 上下文, 提示)]"""
    out = []
    for i, ch in enumerate(say):
        if ch in TABLE and not (i + 1 < len(say) and say[i + 1] == "["):
            ctx = say[max(0, i - 6): i + 7]
            out.append((i, ch, ctx, TABLE[ch]["hint"]))
    return out


def check_script(script):
    problems = []
    for k, L in enumerate(script["lines"]):
        for _, ch, ctx, hint in unannotated(L["say"]):
            problems.append(f"第 {k} 句（{L.get('id', '')}）“…{ctx}…”里的“{ch}”没有标音。{hint}")
        try:
            to_tts(L["say"])
        except ValueError as e:
            problems.append(f"第 {k} 句：{e}")
    return problems


if __name__ == "__main__":
    s = json.loads((ROOT / sys.argv[1] / "script.json").read_text())
    ps = check_script(s)
    print("\n".join(ps) if ps else "多音字检查通过")
    sys.exit(1 if ps else 0)
