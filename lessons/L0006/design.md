# 第 6 课 · 比大小（>、<、=）—— Fable 设计稿

主题 playground（游乐园），讲法 mistake（豆豆犯错），镜头 drift，音乐 bouncy。

## 1. 年龄与目标
- 适合：5–7 岁（学前大班至一年级上）。
- 目标：会用“一个对一个”比出多、少、同样多，并用 >、<、= 写出来、读出来。

## 2. 配音脚本（14 句，156 字）
```json
[
{"id":"hook","speaker":"narrator","say":"游乐园里，皮球和积木哪个多？","caption":"皮球和积木，<b>哪个多</b>？","gap":0.45,"marks":{"balls":"皮球","blocks":"积木"}},
{"id":"guess","speaker":"doudou","say":"你看，皮球排得长[cháng]，皮球多！","caption":"皮球排得长，<b>皮球多</b>！","gap":0.45,"marks":{"stretch":"长","claim":"多"}},
{"id":"doubt","speaker":"narrator","say":"真的吗？小朋友，他错在哪儿？","caption":"真的吗？<br>他<b>错在哪儿</b>？","gap":0.6,"marks":{"doubt":"真的吗","find":"错在哪儿"}},
{"id":"pair","speaker":"narrator","say":"不能看长[cháng]短，要一个对一个。","caption":"不能看长短<br>要<b>一个对一个</b>","gap":0.45,"marks":{"cross":"不能","pair":"一个对一个"}},
{"id":"left","speaker":"narrator","say":"积木还[hái]剩一个，积木比皮球多。","caption":"积木还剩 1 个<br><b>积木比皮球多</b>","gap":0.45,"marks":{"left":"剩","more":"多"}},
{"id":"oops","speaker":"doudou","say":"哎呀，我只[zhǐ]看了长[cháng]短，看错啦！","caption":"哎呀，我只看了长短<br><b>看错啦</b>！","gap":0.45,"marks":{"oops":"哎呀","shy":"看错"}},
{"id":"count","speaker":"doudou","say":"数[shǔ]一数[shǔ]，四个积木，三个皮球！","caption":"<b>4</b> 个积木，<b>3</b> 个皮球","gap":0.45,"marks":{"cnt_block":"四个","cnt_ball":"三个"}},
{"id":"gt","speaker":"narrator","say":"四比三多，写作四大于三。","caption":"4 比 3 多<br><b>4 &gt; 3</b>　4 大于 3","gap":0.45,"marks":{"gt":"大于"}},
{"id":"lt","speaker":"narrator","say":"三比四少，写作三小于四。","caption":"3 比 4 少<br><b>3 &lt; 4</b>　3 小于 4","gap":0.45,"marks":{"swap":"少","lt":"小于"}},
{"id":"tip","speaker":"doudou","say":"开口朝大数[shù]，尖尖朝小数[shù]！","caption":"<b>开口朝大数</b><br><b>尖尖朝小数</b>","gap":0.45,"marks":{"open":"开口","tip":"尖尖"}},
{"id":"eq","speaker":"narrator","say":"再来一个球，同样多，四等于四。","caption":"同样多<br><b>4 = 4</b>　4 等于 4","gap":0.45,"marks":{"add":"再来","same":"同样多","eq":"等于"}},
{"id":"quiz","speaker":"narrator","say":"练一练：五和二中间填什么？","caption":"练一练：<b>5 ○ 2</b>","gap":3.2,"marks":{"quiz":"练一练"}},
{"id":"answer","speaker":"doudou","say":"五比二多，五大于二，开口朝着五！","caption":"<b>5 &gt; 2</b><br>开口朝着 5","gap":0.45,"marks":{"reveal":"大于","mouth":"开口"}},
{"id":"wrap","speaker":"doudou","say":"一个对一个，谁多谁少看得清！","caption":"<b>一个对一个</b><br>谁多谁少看得清","gap":0.45,"marks":{"wrap":"看得清"}}
]
```
caption 里的 `&gt;` `&lt;` 是为了不和 `<b>` 标签冲突；如果字幕层不解析 HTML 实体，换成全角“＞”“＜”。

## 3. 分镜
道具只有 `ball`×4（红色皮球，第 4 个后入场）、`block`×4（蓝色积木）、`card`、`flag`，同屏不超过 12 个物体。豆豆站默认的右前方。

| 句 | 画面 |
|---|---|
| hook | 机位 `front`。`balls`：3 个皮球依次落下弹跳，在后排排成一排，间距很大，几乎占满地台。`blocks`：4 个积木弹出，在前排紧紧挨成一小排，明显比皮球那排短。豆豆 `think`，气泡“？”。 |
| guess | `stretch`：皮球那排整体发光，豆豆 `point` 指向皮球排，一条胶囊标签“长”沿着它拉开。`claim`：豆豆 `cheer`，气泡“皮球多！”。 |
| doubt | `doubt`：气泡变成“？”，豆豆 `surprise`。`find`：切 `top` 高俯视，两排的长短差一目了然，画面停一拍留给孩子想。 |
| pair | `cross`：“长”标签抖一下后消失。`pair`：皮球沿弧线逐个移到积木正后方，一球对一块，共对上 3 对，每对之间弹出一条短连线（细长 `cuboid` 现拼）。 |
| left | `left`：最右边没有皮球配对的那块积木放大发光、跳一下，胶囊标签“多 1 个”。`more`：4 个积木一起跳一下。 |
| oops | `oops`：豆豆 `surprise`。`shy`：豆豆 `shy` 捂脸，气泡“看错啦”。机位回 `front`。 |
| count | `cnt_block`：积木依次点亮，弹出编号 1–4，积木排旁边落下 `card("4")`。`cnt_ball`：皮球依次点亮，编号 1–3，落下 `card("3")`。豆豆 `nod`。 |
| gt | 顶部大算式“4 > 3”，下面一行“4 大于 3”。`gt`：进入重点讲解，背景压淡，算式居中放大，“>”最后弹出，箭头标注“大于号”。 |
| lt | `swap`：算式里的 4 和 3 沿弧线互换位置。`lt`：符号翻成“<”，解释行变成“3 小于 4”，箭头标注“小于号”。 |
| tip | 仍在重点讲解。`open`：符号的开口一侧发光，箭头指向 4，标注“开口朝大数”。`tip`：尖角一侧发光，箭头指向 3，标注“尖尖朝小数”。豆豆 `point`。 |
| eq | 退出重点讲解，机位 `top`。`add`：第 4 个皮球落下弹跳，补到空着的那块积木后面。`same`：4 对连线齐亮，胶囊标签“同样多”。`eq`：顶部算式变为“4 = 4”，解释行“4 等于 4”，“=”标注“等号”。 |
| quiz | `quiz`：皮球和积木收走，顶部弹出题卡“5 ○ 2”，地台上只留 `card("5")`、`card("?")`、`card("2")`。机位 `close`，豆豆 `think`，3 秒倒计时。 |
| answer | `reveal`：“?”卡翻成“>”，题卡显示“5 > 2”加绿勾。`mouth`：符号开口发光指向 5，豆豆 `cheer`。 |
| wrap | `wrap`：机位 `front`，豆豆 `hop` 后 `wave`，气泡“我会了！”，之后接自动片尾。 |

## 4. 练一练
- 题目：5 ○ 2，中间填什么符号？
- 答案：5 > 2，读作“5 大于 2”。

## 5. 片尾总结
一个对一个，开口朝大数

## 6. 音效
```json
[{"at":"balls","type":"pop"},{"at":"blocks","type":"pop"},{"at":"stretch","type":"whoosh"},{"at":"claim","type":"boing"},{"at":"doubt","type":"wrong"},{"at":"pair","type":"whoosh"},{"at":"left","type":"ding"},{"at":"oops","type":"boing"},{"at":"cnt_block","type":"knock"},{"at":"cnt_ball","type":"knock"},{"at":"gt","type":"pop"},{"at":"lt","type":"whoosh"},{"at":"open","type":"sparkle"},{"at":"add","type":"boing"},{"at":"eq","type":"ding"},{"at":"quiz","type":"count3"},{"at":"reveal","type":"tada"},{"at":"wrap","type":"sparkle"}]
```

## 7. 验算
4 > 3、3 < 4、4 = 4、5 > 2 均为真；一一对应后积木剩 4 − 3 = 1 个；再来 1 个球后 3 + 1 = 4，同样多。所有数都在 5 以内。
