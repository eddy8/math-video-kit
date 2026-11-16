# 第 7 课 · 第几 —— Fable 设计稿

主题 picnic（森林野餐），讲法 compare（两种方法比一比），镜头 breathe，音乐 ukulele。

## 1. 年龄与目标
- 适合：5–7 岁（学前大班至一年级上）。
- 目标：知道说“第几”要先讲清从哪边数，并分清“几个”（一群）和“第几”（其中一个）。

## 2. 配音脚本（13 句，151 字）
```json
[
{"id":"hook","speaker":"narrator","say":"森林野餐垫上，好吃的排成了一行[háng]。","caption":"好吃的排成一行","gap":0.45,"marks":{"row":"排成"}},
{"id":"ask","speaker":"narrator","say":"数[shǔ]一数[shǔ]，一共有五个，草莓排第几？","caption":"一共有 <b>5</b> 个<br>草莓排<b>第几</b>？","gap":0.45,"marks":{"total":"五个","ask":"草莓"}},
{"id":"fromleft","speaker":"doudou","say":"从左边数[shǔ]，一二三四，第四！","caption":"从<b>左</b>边数<br>草莓排<b>第 4</b>","gap":0.45,"marks":{"lflag":"左边","l1":"一","l2":"二","l3":"三","l4":["四",0],"l_res":"第四"}},
{"id":"other","speaker":"narrator","say":"换个办法，从右边数[shǔ]呢？试试看！","caption":"换个办法<br>从<b>右</b>边数呢？","gap":0.45,"marks":{"rflag":"右边"}},
{"id":"fromright","speaker":"doudou","say":"一、二，第二！这样数[shǔ]得更快！","caption":"从右边数<br>草莓排<b>第 2</b>，更快！","gap":0.45,"marks":{"r1":"一","r2":["二",0],"r_res":"第二","fast":"更快"}},
{"id":"both","speaker":"doudou","say":"左边第四，右边第二，都是草莓！","caption":"左边<b>第 4</b>，右边<b>第 2</b><br>都是草莓","gap":0.45,"marks":{"tagl":"第四","tagr":"第二","both":"都是"}},
{"id":"compare","speaker":"narrator","say":"两种[zhǒng]数[shǔ]法都对，右边近，数[shǔ]得快。","caption":"两种数法<b>都对</b><br>右边近，数得快","gap":0.45,"marks":{"right2":"都对","near":"右边近"}},
{"id":"rule","speaker":"narrator","say":"所以要先说清，从哪边数[shǔ]起。","caption":"先说清<br><b>从哪边数起</b>","gap":0.45,"marks":{"rule":"从哪边"}},
{"id":"group","speaker":"narrator","say":"从左数[shǔ]四个，是圈起一群。","caption":"从左数 <b>4 个</b><br>圈起一群","gap":0.45,"marks":{"group":"四个"}},
{"id":"one","speaker":"narrator","say":"第四呢，只[zhǐ]指草莓这一个。","caption":"<b>第 4</b><br>只指草莓这 1 个","gap":0.45,"marks":{"one":"第四"}},
{"id":"quiz","speaker":"narrator","say":"练一练：从右边数[shǔ]，第四是谁？","caption":"练一练：从<b>右</b>边数<br><b>第 4</b> 是谁？","gap":3.2,"marks":{"quiz":"练一练"}},
{"id":"answer","speaker":"doudou","say":"糖果一，草莓二，橘子三，饼干是第四！","caption":"从右边数<br><b>第 4 是饼干</b>","gap":0.45,"marks":{"p1":"糖果","p2":"草莓","p3":"橘子","reveal":"饼干"}},
{"id":"wrap","speaker":"doudou","say":"先说从哪边数[shǔ]，再一个一个数[shǔ]！","caption":"<b>先说从哪边数</b><br>再一个一个数","gap":0.45,"marks":{"wrap":"再"}}
]
```

## 3. 分镜
从观众的左到右排一行：`apple` 苹果、`cookie` 饼干、`orange` 橘子、`strawberry` 草莓、`candy` 糖果，各 1 个；另用 `flag("左")`、`flag("右")`。同屏不超过 8 个物体。

**方向规则**：凡是数数的镜头只用 `front` 或 `top`（不旋转），不用 `left`、`right` 侧机位，保证画面左右就是观众的左右。“左”旗插在观众左手边那端，“右”旗插在观众右手边那端。豆豆站在右前方，面向观众，`point` 的方向按屏幕方向指定。

| 句 | 画面 |
|---|---|
| hook | 机位 `front`。`row`：5 样食物从左到右依次落下弹跳，排成一行。豆豆 `hop`。 |
| ask | `total`：5 个一起亮一下，顶部大数字“5”，解释行“一共有 5 个”。`ask`：草莓放大发光、跳一下，头上胶囊标签“第几？”，豆豆 `think`，气泡“？”。 |
| fromleft | `lflag`：“左”旗在最左端弹出，豆豆 `point` 指向屏幕左侧。`l1`–`l4`：苹果、饼干、橘子、草莓依次点亮，弹出编号 1、2、3、4。`l_res`：草莓跳一下，顶部大字“第 4”，解释行“从左边数”。 |
| other | 编号淡出。`rflag`：“右”旗在最右端弹出，一个箭头从右往左扫过整行，豆豆 `look` 转向右端。 |
| fromright | `r1`、`r2`：糖果、草莓依次点亮，编号 1、2（用另一种颜色）。`r_res`：顶部大字“第 2”，解释行“从右边数”。`fast`：豆豆 `cheer`，气泡“更快！”。 |
| both | 机位 `top`。`tagl`：草莓左上方出现胶囊标签“左数第 4”，带一个从左旗指来的箭头。`tagr`：右上方出现“右数第 2”，带从右旗指来的箭头。`both`：草莓原地转一圈发光。 |
| compare | `right2`：两个标签同时打绿勾。`near`：草莓到右旗之间的一小段地面亮起，对比它到左旗的那一长段，显出右边更近。 |
| rule | `rule`：重点讲解，背景压淡，居中大字“从哪边数起？”，两侧先后弹出箭头标注“左”“右”。豆豆 `nod`。 |
| group | 退出讲解，机位 `top`，清掉标签，只留左旗。`group`：左边 4 个（苹果、饼干、橘子、草莓）一起亮起，被一个圈围住，胶囊标签“4 个”。 |
| one | `one`：圈消失，只有草莓亮着并放大，胶囊标签“第 4”，其余 3 个变暗。顶部并排显示“4 个”和“第 4”，下面一行解释“一群 / 一个”。 |
| quiz | `quiz`：全部恢复原样，机位 `front`，顶部题卡“从右边数，第 4 是谁？”，右旗闪烁，左旗隐去。豆豆 `think`，3 秒倒计时。 |
| answer | `p1`、`p2`、`p3`：糖果、草莓、橘子依次点亮，编号 1、2、3。`reveal`：饼干点亮，编号 4，放大跳一下，题卡打绿勾，显示“饼干”，豆豆 `cheer`。 |
| wrap | `wrap`：豆豆 `hop` 后 `wave`，气泡“我会了！”，之后接自动片尾。 |

练习题有区分度：从左边数会得到草莓（错），从右边数才是饼干。

## 4. 练一练
- 题目：从右边数，第 4 个是谁？
- 答案：饼干（从右数依次是糖果 1、草莓 2、橘子 3、饼干 4）。

## 5. 片尾总结
先说从哪边数，再一个一个数

## 6. 音效
```json
[{"at":"row","type":"pop"},{"at":"total","type":"ding"},{"at":"l1","type":"knock"},{"at":"l2","type":"knock"},{"at":"l3","type":"knock"},{"at":"l4","type":"knock"},{"at":"l_res","type":"ding"},{"at":"rflag","type":"whoosh"},{"at":"r1","type":"knock"},{"at":"r2","type":"knock"},{"at":"fast","type":"sparkle"},{"at":"both","type":"pop"},{"at":"group","type":"whoosh"},{"at":"one","type":"ding"},{"at":"quiz","type":"count3"},{"at":"reveal","type":"tada"},{"at":"wrap","type":"sparkle"}]
```

## 7. 验算
队列 [苹果, 饼干, 橘子, 草莓, 糖果] 共 5 个；草莓从左数第 4、从右数第 2（4 + 2 = 5 + 1）；从右数第 4 是饼干（从左数第 2）。
