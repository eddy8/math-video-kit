"""每天的计划：算出今天做哪两课，以及每课的场景主题、讲法、镜头风格、配乐（按课号轮换）。

  python3 tools/plan.py                 # 按今天的新加坡日期
  python3 tools/plan.py 2026-11-20      # 指定日期
  python3 tools/plan.py --lesson 57     # 只看某一课

规则（唯一出处，改规则只改这里）：
- 第 3 课是样片（2026-11-16 交付）。2026-11-17 做第 4、5 课，此后每天 2 课；超过 267 课进入下一轮（课号继续累加）。
- 主题、讲法、镜头、配乐按课号轮换，相邻两课一定不同主题。
- 设计时如果某个知识点明显更适合另一个主题或讲法（例如人民币→小超市），可以换，但当天两课的主题不能相同。
"""
import datetime as dt
import json, sys
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parent.parent
START = dt.date(2026, 11, 17)
PER_DAY = 2
FIRST = 4

THEMES = ["picnic", "kitchen", "space", "ocean", "market", "playground"]
THEME_LABEL = {"picnic": "森林野餐", "kitchen": "温馨厨房", "space": "太空探险", "ocean": "海底世界", "market": "小超市", "playground": "游乐园"}
MUSIC = {"picnic": "ukulele", "kitchen": "marimba", "space": "dreamy", "ocean": "marimba", "market": "bouncy", "playground": "bouncy"}
FORMATS = {
    "story": "生活小故事：豆豆在场景里遇到一个和知识点有关的小问题，旁白带着一起解决。",
    "mistake": "豆豆犯错：豆豆用错方法得出错误答案，旁白引导小朋友发现错在哪，再用正确方法。",
    "compare": "两种方法比一比：同一个问题用两种方法做，比一比哪种更快、更清楚。",
    "challenge": "闯关小游戏：分 2–3 关由易到难，最后一关就是练一练。",
    "magic": "魔术揭秘：豆豆变一个“数学小魔术”（东西变多变少、图形变形等），再揭秘背后的道理。",
    "quickfire": "快问快答：旁白连续抛出 3 个小问题，豆豆和小朋友一起抢答，最后总结规律。",
}
FORMAT_ORDER = ["story", "mistake", "compare", "challenge", "magic", "quickfire"]
CAMERA_STYLES = ["sway", "drift", "breathe", "orbit"]
COLLECTION = "人教版{book}数学｜豆豆动画课"   # 小红书合集：一册一个


def curriculum():
    return json.loads((ROOT / "data/curriculum.json").read_text())["lessons"]


def lesson_plan(n):
    cur = curriculum()
    T = len(cur)
    item = cur[(n - 1) % T]
    theme = THEMES[(n + 5) % 6]
    fmt = FORMAT_ORDER[(n + n // 6) % 6]
    first_of_book = (n - 1) % T == 0 or cur[(n - 2) % T]["book"] != item["book"]
    return {
        "lesson": n, "round": (n - 1) // T + 1, "title": item["title"], "book": item["book"], "unit": item["unit"],
        "collection": COLLECTION.format(book=item["book"]), "newCollection": first_of_book,
        "pages": item["pages"], "theme": theme, "themeLabel": THEME_LABEL[theme], "music": MUSIC[theme],
        "format": fmt, "formatDesc": FORMATS[fmt], "cameraStyle": CAMERA_STYLES[(n + 3) % 4],
        "dir": f"lessons/L{n:04d}",
    }


def day_lessons(day):
    k = (day - START).days
    if k < 0:
        sys.exit(f"{day} 早于开始日期 {START}")
    return [FIRST + PER_DAY * k + i for i in range(PER_DAY)]


if __name__ == "__main__":
    if "--lesson" in sys.argv:
        print(json.dumps(lesson_plan(int(sys.argv[sys.argv.index("--lesson") + 1])), ensure_ascii=False, indent=1))
        sys.exit()
    day = dt.date.fromisoformat(sys.argv[1]) if len(sys.argv) > 1 else dt.datetime.now(ZoneInfo("Asia/Singapore")).date()
    print(json.dumps({"date": day.isoformat(), "lessons": [lesson_plan(n) for n in day_lessons(day)]}, ensure_ascii=False, indent=1))
