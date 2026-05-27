// ─── Types ────────────────────────────────────────────────────────────────────

export type CodeBlock = {
  code: string
  caption?: string
  fillable?: boolean
}

export type LessonSection = {
  heading: string
  body: string
  codeBlock?: CodeBlock
  tip?: string
  warning?: string
}

export type TestCase = {
  id: string
  description: string
  check: (output: string, code: string) => boolean
  failHint: string
  points: number
}

export type Level = {
  id: number
  title: string
  badge: string
  icon: string
  starterCode: string
  objective: string
  requiresGraphics?: boolean
  proactiveHints: string[]
  tests: TestCase[]
  sections: LessonSection[]
}

// ─── Level Definitions ────────────────────────────────────────────────────────
// Lv 1–10  : 初级篇 — Python 基础
// Lv 11–20 : 进阶篇 — Python 进阶

export const LEVELS: Level[] = [

  // ════════════════════════════════════════
  //  初级篇 · BEGINNER  (Lv 1–10)
  // ════════════════════════════════════════

  // ── Level 1 ──────────────────────────────────────────────────────────────────
  {
    id: 1,
    title: '你好，Python！',
    badge: '初燃',
    icon: '🌱',
    objective: '用 print() 打印出 "Hello, Python!"',
    starterCode: `# 欢迎来到 CodeNexus！修改并运行代码 ▶
# 第一关目标：打印 "Hello, Python!"

print("你好，世界！")
`,
    proactiveHints: [
      '试试把引号里的内容改成 "Hello, Python!" 然后点击运行？',
      '`print()` 就是程序的"嘴巴"，括号里写什么就说什么。',
      '注意：字符串（文字）要用引号包起来，英文双引号 `"` 或单引号 `\'` 都可以。',
    ],
    tests: [
      {
        id: 'l1-t1',
        description: '代码包含 print()',
        check: (_o, code) => code.includes('print('),
        failHint: '需要用 `print()` 函数打印内容哦！',
        points: 30,
      },
      {
        id: 'l1-t2',
        description: '打印出 "Hello, Python!"',
        check: (output) => output.includes('Hello, Python!'),
        failHint: '确认打印的内容是 Hello, Python!（注意大小写和感叹号）',
        points: 70,
      },
    ],
    sections: [
      {
        heading: '什么是 Python？',
        body: '把 Python 想象成一位极其听话的精灵助手。你用命令告诉它做什么，它就精确地执行。\n\nPython 是目前全球最流行的编程语言之一，Google、Instagram、NASA 都在用它。',
      },
      {
        heading: 'print()：程序的嘴巴',
        body: '`print()` 是你最常用的工具。括号里写什么，程序就"说"什么（打印到屏幕上）。\n\n文字内容需要用引号包裹，这样 Python 才知道它是文字而不是命令。',
        codeBlock: {
          code: 'print("你好，世界！")\nprint("Python 太好玩了")\nprint(42)',
          caption: '字符串用引号，数字不用',
          fillable: true,
        },
      },
      {
        heading: '注释：写给自己的笔记',
        body: '以 `#` 开头的内容是注释，Python 会完全忽略它。注释是写给人看的。',
        codeBlock: {
          code: '# 这是一行注释，Python 不会执行它\nprint("这行才会被执行")  # 行尾注释也可以',
          fillable: false,
        },
        tip: '目标：把编辑器里的代码改成 print("Hello, Python!") 然后运行！',
      },
    ],
  },

  // ── Level 2 ──────────────────────────────────────────────────────────────────
  {
    id: 2,
    title: '变量与数据类型',
    badge: '变量节点',
    icon: '📦',
    objective: '创建变量存储你的名字和年龄，并用 f-string 格式化打印',
    starterCode: `# Level 2: 变量 — 给数据贴标签的盒子
# 目标：创建 name 和 age 变量，用 f-string 打印自我介绍

name = "你的名字"
age = 18

print(f"我叫 {name}，今年 {age} 岁")
`,
    proactiveHints: [
      '变量就像贴了标签的盒子。`name = "小明"` 就是把 "小明" 放进叫 name 的盒子。',
      'f-string 格式：`f"文字 {变量名} 文字"`，花括号里写变量名，运行时自动替换成值。',
      '数字不需要引号：`age = 18`；文字需要引号：`name = "小明"`',
    ],
    tests: [
      {
        id: 'l2-t1',
        description: '代码包含变量赋值（=）',
        check: (_o, code) => /\w+\s*=\s*.+/.test(code) && !code.includes('=='),
        failHint: '试试用 `name = "你的名字"` 创建一个变量',
        points: 50,
      },
      {
        id: 'l2-t2',
        description: '使用了 f-string 格式化',
        check: (_o, code) => code.includes('f"') || code.includes("f'"),
        failHint: '用 `f"我叫 {name}"` 这种 f-string 格式打印',
        points: 50,
      },
      {
        id: 'l2-t3',
        description: '打印了包含名字和年龄的句子',
        check: (output) => output.trim().split('\n').some((l) => l.length > 3),
        failHint: '运行后应该打印出一句完整的自我介绍',
        points: 100,
      },
    ],
    sections: [
      {
        heading: '变量：给数据贴标签',
        body: '如果数据是东西，变量就是贴了标签的盒子。你把东西放进盒子，之后随时可以通过标签找到它。',
        codeBlock: {
          code: 'city = "北京"          # 字符串 (str)\npopulation = 21890000  # 整数 (int)\ntemperature = 36.5     # 浮点数 (float)\nis_capital = True      # 布尔值 (bool)',
          caption: '四种基础数据类型',
          fillable: true,
        },
      },
      {
        heading: 'f-string：优雅的字符串格式化',
        body: '`f"文字 {变量}"` 是最现代、最好用的字符串拼接方式。字符串前加 `f`，花括号里放变量，Python 自动替换。',
        codeBlock: {
          code: 'name = "小明"\nage = 20\nscore = 98.5\n\nprint(f"我叫 {name}，今年 {age} 岁，考了 {score} 分")\nprint(f"明年我就 {age + 1} 岁了")  # 花括号里可以做运算！',
          fillable: true,
        },
        warning: '别忘了字符串前面的 f！没有 f 的话 {name} 就只是普通文字，不会被替换。',
      },
    ],
  },

  // ── Level 3 ──────────────────────────────────────────────────────────────────
  {
    id: 3,
    title: '条件判断',
    badge: '成型',
    icon: '⚖️',
    objective: '根据温度变量，用 if/elif/else 打印对应天气描述',
    starterCode: `# Level 3: 条件判断 — 让程序做决定
# 目标：temperature > 35 打印"酷热"，> 20 打印"舒适"，否则打印"凉快"

temperature = 28

if temperature > 35:
    print("酷热！注意防暑")
elif temperature > 20:
    print("舒适，适合出行")
else:
    print("凉快，记得加件衣服")
`,
    proactiveHints: [
      'if 后面的条件判断后，别忘了加冒号 `:`！这是 Python 的规矩。',
      'Python 用缩进（4个空格或Tab）表示代码块，if 里面的代码必须缩进。',
      '`elif` = "else if"，处理第二个条件；`else` 处理所有其他情况。',
    ],
    tests: [
      {
        id: 'l3-t1',
        description: '代码包含 if 语句',
        check: (_o, code) => /\bif\b/.test(code),
        failHint: '需要用 `if 条件:` 做判断',
        points: 50,
      },
      {
        id: 'l3-t2',
        description: '代码包含 elif 或 else',
        check: (_o, code) => /\belif\b|\belse\b/.test(code),
        failHint: '加上 `elif` 或 `else` 处理其他情况',
        points: 50,
      },
      {
        id: 'l3-t3',
        description: '当 temperature = 28 时，输出"舒适"',
        check: (output) => output.includes('舒适'),
        failHint: '当 temperature = 28（大于 20 不大于 35），应该打印包含"舒适"的文字',
        points: 100,
      },
    ],
    sections: [
      {
        heading: '程序需要做决定',
        body: '现实世界充满了条件判断：**如果**天气好就出去玩，**否则**就在家。Python 用 `if/elif/else` 实现这种逻辑。',
      },
      {
        heading: 'if / elif / else 语法',
        body: '条件判断的完整结构：`if` 处理第一种情况，`elif` 处理更多情况，`else` 处理"其他所有情况"。',
        codeBlock: {
          code: 'score = 85\n\nif score >= 90:\n    print("优秀！")\nelif score >= 70:\n    print("良好")\nelif score >= 60:\n    print("及格")\nelse:\n    print("继续努力")',
          caption: 'if / elif / else 三段结构',
          fillable: true,
        },
        warning: '缩进必须一致！4个空格是标准。混用空格和Tab会报错。',
      },
      {
        heading: '比较运算符',
        body: '`==` 等于（两个等号！）\n`!=` 不等于\n`>` 大于  `<` 小于\n`>=` 大于等于  `<=` 小于等于\n\n逻辑运算：`and`（且）、`or`（或）、`not`（非）',
        codeBlock: {
          code: 'x = 15\nif x > 10 and x < 20:\n    print("x 在 10 到 20 之间")',
          fillable: true,
        },
        tip: '修改 temperature 为不同值（比如 40、15），看看输出怎么变！',
      },
    ],
  },

  // ── Level 4 ──────────────────────────────────────────────────────────────────
  {
    id: 4,
    title: '循环与迭代',
    badge: '锋芒',
    icon: '🌀',
    objective: '用 for 循环打印 1 到 5 的数字，每行一个',
    starterCode: `# Level 4: 循环 — 让代码重复工作
# 目标：打印 1 到 5，每行一个数字

for i in range(1, 6):
    print(i)
`,
    proactiveHints: [
      '`range(1, 6)` 生成 1, 2, 3, 4, 5（不包含 6）。',
      '循环体（要重复的代码）必须缩进，否则它不属于循环！',
      '`range(n)` 从 0 开始；`range(start, stop, step)` 还可以设置步长。',
    ],
    tests: [
      {
        id: 'l4-t1',
        description: '代码包含 for 或 while 循环',
        check: (_o, code) => /\bfor\b|\bwhile\b/.test(code),
        failHint: '用 `for i in range(...):` 写一个循环',
        points: 50,
      },
      {
        id: 'l4-t2',
        description: '输出包含 1、2、3、4、5',
        check: (output) => {
          const lines = output.trim().split('\n').map((l) => l.trim())
          return ['1', '2', '3', '4', '5'].every((n) => lines.includes(n))
        },
        failHint: '确保打印了 1 到 5 共 5 个数字，每行一个',
        points: 200,
      },
    ],
    sections: [
      {
        heading: '循环：流水线思维',
        body: '如果要打印 100 个"你好"，难道写 100 行 `print`？循环就是流水线：**重复同样的动作，直到完成**。',
      },
      {
        heading: 'for 循环 + range()',
        body: '`for` 循环遍历一个序列，`range()` 生成数字序列。这是最常用的组合。',
        codeBlock: {
          code: '# range(1, 6) → 1, 2, 3, 4, 5\nfor i in range(1, 6):\n    print(i)\n\n# range(0, 10, 2) → 0, 2, 4, 6, 8（步长=2）\nfor i in range(0, 10, 2):\n    print(i)',
          fillable: true,
        },
      },
      {
        heading: '遍历列表',
        body: '`for` 不只能遍历数字，还能遍历列表里的每一项。',
        codeBlock: {
          code: 'fruits = ["苹果", "香蕉", "橙子"]\nfor fruit in fruits:\n    print(f"我喜欢吃 {fruit}")',
          fillable: true,
        },
        tip: '改变 range() 的参数打印 1 到 5，然后运行！',
      },
    ],
  },

  // ── Level 5 ──────────────────────────────────────────────────────────────────
  {
    id: 5,
    title: '函数',
    badge: '传承',
    icon: '🔮',
    objective: '定义一个 greet(name) 函数，调用它打印问候语',
    starterCode: `# Level 5: 函数 — 封装你的魔法
# 目标：定义 greet() 函数并调用它

def greet(name):
    return "你好，" + name + "！"

result = greet("世界")
print(result)
`,
    proactiveHints: [
      '`def 函数名(参数):` 定义函数，然后用 `函数名(值)` 调用它。',
      '`return` 让函数"返回"一个值。没有 return 的函数返回 None。',
      '函数体必须缩进，在 def 的"怀抱"里。',
    ],
    tests: [
      {
        id: 'l5-t1',
        description: '代码包含函数定义 (def)',
        check: (_o, code) => /\bdef\s+\w+\s*\(/.test(code),
        failHint: '用 `def 函数名(参数):` 定义一个函数',
        points: 100,
      },
      {
        id: 'l5-t2',
        description: '函数被调用并打印了结果',
        check: (output, code) =>
          output.trim().length > 0 && (code.includes('greet(') || output.includes('你好')),
        failHint: '定义完函数后，调用它并用 print() 打印结果',
        points: 200,
      },
    ],
    sections: [
      {
        heading: '函数：封装可复用的魔法',
        body: '函数就是代码的食谱——写一次，随时调用。不用函数：重复写相同代码；有函数：写一次，调用多次。',
      },
      {
        heading: '定义与调用',
        body: '`def` 是 "define" 的缩写。函数名后跟括号（可以有参数），然后冒号，函数体缩进。',
        codeBlock: {
          code: 'def add(a, b):\n    result = a + b\n    return result\n\nsum1 = add(3, 5)    # sum1 = 8\nsum2 = add(10, 20)  # sum2 = 30\nprint(sum1, sum2)',
          fillable: true,
        },
      },
      {
        heading: '为什么函数重要？',
        body: '- **复用**：写一次，到处用\n- **可读性**：`calculate_tax(price)` 比 20 行计算更清晰\n- **调试**：只需修改一处，所有调用都生效',
        tip: '挑战：修改 greet() 让它返回更有创意的问候语，用不同名字调用它！',
      },
    ],
  },

  // ── Level 6 ──────────────────────────────────────────────────────────────────
  {
    id: 6,
    title: '列表',
    badge: '容器',
    icon: '📋',
    objective: '创建一个购物清单，添加 3 个商品，遍历打印每一项',
    starterCode: `# Level 6: 列表 — Python 的购物袋
# 目标：创建购物清单，添加商品，遍历打印

shopping = ["苹果", "牛奶"]

shopping.append("面包")  # 添加新商品

print(f"购物清单共 {len(shopping)} 项：")
for item in shopping:
    print(f"  - {item}")
`,
    proactiveHints: [
      '列表用方括号 `[]` 创建，元素之间用逗号分隔：`fruits = ["苹果", "香蕉"]`',
      '`.append(元素)` 在末尾添加元素；`len(列表)` 获取长度；`列表[0]` 取第一个元素（索引从 0 开始）。',
      '用 `for item in 列表:` 遍历每一项，这是最常用的列表遍历方式。',
    ],
    tests: [
      {
        id: 'l6-t1',
        description: '代码包含列表（[]）',
        check: (_o, code) => /\[.*\]/.test(code),
        failHint: '用 `[元素1, 元素2]` 创建列表',
        points: 60,
      },
      {
        id: 'l6-t2',
        description: '使用了 append 或至少 3 个元素',
        check: (_o, code) => code.includes('.append(') || (code.match(/,/g) ?? []).length >= 2,
        failHint: '用 `.append()` 添加元素，或直接创建含 3 项的列表',
        points: 60,
      },
      {
        id: 'l6-t3',
        description: '遍历并打印了所有商品',
        check: (output) => output.trim().split('\n').filter((l) => l.trim()).length >= 3,
        failHint: '用 for 循环遍历列表，打印出至少 3 行商品',
        points: 80,
      },
    ],
    sections: [
      {
        heading: '列表：有序的数据容器',
        body: '列表是 Python 中最常用的数据结构。它像一个有编号的抽屉：有序、可以放不同类型的数据、可以随时添加和删除。',
        codeBlock: {
          code: 'fruits = ["苹果", "香蕉", "橙子"]\nnumbers = [1, 2, 3, 4, 5]\nmixed = ["小明", 18, True, 3.14]  # 混合类型也行！\n\nprint(fruits[0])    # "苹果"（索引从 0 开始）\nprint(fruits[-1])   # "橙子"（负索引从后往前）\nprint(len(fruits))  # 3',
          caption: '列表基础操作',
          fillable: true,
        },
      },
      {
        heading: '常用列表方法',
        body: '`.append(x)` 末尾添加\n`.insert(i, x)` 在位置 i 插入\n`.remove(x)` 删除第一个 x\n`.pop()` 删除并返回最后一项\n`.sort()` 排序（就地）\n`len(list)` 获取长度',
        codeBlock: {
          code: 'scores = [85, 92, 78, 96, 67]\nscores.append(88)   # 末尾加 88\nscores.sort()       # 从小到大排序\nprint(scores)\nprint(f"最高分: {max(scores)}, 最低分: {min(scores)}")',
          fillable: true,
        },
        tip: '切片：`list[1:3]` 取索引 1 和 2 的元素（不含 3）。试试 `fruits[0:2]`！',
      },
    ],
  },

  // ── Level 7 ──────────────────────────────────────────────────────────────────
  {
    id: 7,
    title: '字典',
    badge: '索引',
    icon: '📒',
    objective: '创建一个个人资料字典，包含姓名、年龄、城市，并打印每个字段',
    starterCode: `# Level 7: 字典 — Python 的通讯录
# 目标：创建 profile 字典，访问并打印每个字段

profile = {
    "name": "小明",
    "age": 20,
    "city": "北京"
}

print(f"姓名：{profile['name']}")
print(f"年龄：{profile['age']}")
print(f"城市：{profile['city']}")

# 添加新字段
profile["hobby"] = "编程"
print(f"爱好：{profile['hobby']}")
`,
    proactiveHints: [
      '字典用花括号 `{}` 创建，格式是 `{键: 值}` 对，键和值之间用冒号，多个键值对用逗号分隔。',
      '访问字典值：`dict["键名"]`；添加新键：`dict["新键"] = 值`',
      '用 `for key, value in dict.items():` 遍历所有键值对。',
    ],
    tests: [
      {
        id: 'l7-t1',
        description: '代码包含字典（{}）',
        check: (_o, code) => /\{[^}]+:[^}]+\}/.test(code),
        failHint: '用 `{"key": value}` 创建字典',
        points: 60,
      },
      {
        id: 'l7-t2',
        description: '访问了字典键值并打印',
        check: (output, code) =>
          output.trim().split('\n').filter((l) => l.trim()).length >= 3 &&
          (code.includes('["') || code.includes("['")),
        failHint: '用 `dict["键名"]` 访问字典中的值，至少打印 3 个字段',
        points: 140,
      },
    ],
    sections: [
      {
        heading: '字典：键值对存储',
        body: '列表用数字索引，字典用**自定义键**。就像真正的字典：你用单词（键）来查定义（值）。',
        codeBlock: {
          code: 'student = {\n    "name": "小红",\n    "grade": "高三",\n    "scores": [92, 85, 97]  # 值也可以是列表！\n}\n\nprint(student["name"])   # 小红\nprint(student["scores"]) # [92, 85, 97]',
          caption: '字典基础',
          fillable: true,
        },
      },
      {
        heading: '遍历字典',
        body: '字典有三种遍历方式：只遍历键、只遍历值、同时遍历键值对。',
        codeBlock: {
          code: 'config = {"host": "localhost", "port": 8080, "debug": True}\n\n# 遍历键值对（最常用）\nfor key, value in config.items():\n    print(f"{key}: {value}")\n\n# 检查键是否存在\nif "port" in config:\n    print("端口已配置")',
          fillable: true,
        },
        tip: '`.get("键", 默认值)` 更安全：键不存在时返回默认值而不是报错。',
      },
    ],
  },

  // ── Level 8 ──────────────────────────────────────────────────────────────────
  {
    id: 8,
    title: '字符串操作',
    badge: '文字',
    icon: '✍️',
    objective: '处理一个句子：统计单词数、转大写、替换单词并打印结果',
    starterCode: `# Level 8: 字符串操作 — 文字的魔法
# 目标：用字符串方法处理下面这句话

sentence = "hello world python is amazing"

# 转大写
upper = sentence.upper()
print(upper)

# 统计单词数
words = sentence.split()
print(f"共 {len(words)} 个单词")

# 替换单词
new_sentence = sentence.replace("amazing", "awesome")
print(new_sentence)
`,
    proactiveHints: [
      '`.upper()` 转大写；`.lower()` 转小写；`.strip()` 去掉首尾空格。',
      '`.split()` 按空格分割成列表；`.split(",")` 按逗号分割。',
      '`.replace("旧", "新")` 替换字符串中的内容；`.startswith("前缀")` 检查开头。',
    ],
    tests: [
      {
        id: 'l8-t1',
        description: '使用了至少两种字符串方法',
        check: (_o, code) => {
          const methods = ['.upper()', '.lower()', '.split(', '.replace(', '.strip()', '.startswith(', '.endswith(', '.count(', '.find(']
          return methods.filter(m => code.includes(m)).length >= 2
        },
        failHint: '用两种或以上的字符串方法（upper、split、replace 等）',
        points: 80,
      },
      {
        id: 'l8-t2',
        description: '打印了转大写的结果',
        check: (output) => output.includes('HELLO') || output.includes('PYTHON') || output.includes('WORLD'),
        failHint: '用 `.upper()` 转大写后打印',
        points: 60,
      },
      {
        id: 'l8-t3',
        description: '打印了单词数量',
        check: (output) => /\d+\s*个/.test(output) || output.includes('5'),
        failHint: '用 `.split()` 分割后用 `len()` 统计单词数量并打印',
        points: 60,
      },
    ],
    sections: [
      {
        heading: '字符串：Python 最常用的数据类型',
        body: '字符串有几十个内置方法，掌握常用的十几个就够用了。字符串是**不可变的**——方法不会修改原字符串，而是返回新的。',
        codeBlock: {
          code: 'text = "  Hello, World!  "\n\nprint(text.strip())      # "Hello, World!" 去除空格\nprint(text.lower())      # "  hello, world!  "\nprint(text.upper())      # "  HELLO, WORLD!  "\nprint(text.count("l"))   # 3（统计出现次数）\nprint(text.find("World")) # 8（查找位置）',
          caption: '常用字符串方法',
          fillable: true,
        },
      },
      {
        heading: 'split 与 join',
        body: '`.split()` 把字符串拆成列表；`.join()` 把列表合并成字符串。两者是互逆操作。',
        codeBlock: {
          code: 'csv_line = "小明,20,北京,程序员"\nparts = csv_line.split(",")  # 按逗号分割\nprint(parts)  # ["小明", "20", "北京", "程序员"]\n\n# join：把列表合并成字符串\nwords = ["Python", "is", "fun"]\nsentence = " ".join(words)\nprint(sentence)  # "Python is fun"',
          fillable: true,
        },
        tip: '`.strip()` 去除两端空白；`.lstrip()` 只去左边；`.rstrip()` 只去右边。处理用户输入时很有用。',
      },
    ],
  },

  // ── Level 9 ──────────────────────────────────────────────────────────────────
  {
    id: 9,
    title: '列表推导式',
    badge: '炼化',
    icon: '⚗️',
    objective: '用列表推导式一行代码生成 1-10 的平方数列表，并打印出来',
    starterCode: `# Level 9: 列表推导式 — Pythonic 魔法
# 目标：用一行代码生成 [1, 4, 9, 16, 25, 36, 49, 64, 81, 100]

# 传统写法（4行）：
squares_old = []
for n in range(1, 11):
    squares_old.append(n ** 2)
print("传统:", squares_old)

# 你的任务：用列表推导式一行实现
squares = [n ** 2 for n in range(1, 11)]
print("推导式:", squares)
`,
    proactiveHints: [
      '列表推导式的语法：`[表达式 for 变量 in 序列]`。想想"对每个 n，计算 n**2"？',
      '`n ** 2` 是 n 的平方，`range(1, 11)` 生成 1 到 10。',
      '还可以加条件过滤：`[n for n in range(20) if n % 2 == 0]` 只取偶数。',
    ],
    tests: [
      {
        id: 'l9-t1',
        description: '使用了列表推导式语法',
        check: (_o, code) => /\[.+for.+in.+\]/.test(code),
        failHint: '用 `[表达式 for 变量 in 序列]` 格式写列表推导式',
        points: 100,
      },
      {
        id: 'l9-t2',
        description: '输出包含平方数列表',
        check: (output) => {
          const nums = [1, 4, 9, 16, 25, 36, 49, 64, 81, 100]
          return nums.every((n) => output.includes(String(n)))
        },
        failHint: '确保输出包含 1, 4, 9, 16, 25, 36, 49, 64, 81, 100',
        points: 150,
      },
    ],
    sections: [
      {
        heading: '列表推导式：Python 的魔法浓缩咒',
        body: '一行代码完成传统五行的工作，更快、更清晰。这是真正的 "Pythonic" 风格。',
      },
      {
        heading: '基础语法',
        body: '格式：`[表达式 for 变量 in 序列]`\n\n理解为：**把序列里的每个元素，用表达式处理一遍，装进新列表。**',
        codeBlock: {
          code: 'squares = [n ** 2 for n in range(1, 11)]\n\n# 字符串列表变换\nwords = ["hello", "world"]\nupper = [w.upper() for w in words]\nprint(upper)  # [\'HELLO\', \'WORLD\']',
          fillable: true,
        },
      },
      {
        heading: '带条件过滤',
        body: '在末尾加 `if 条件`，可以只保留满足条件的元素。',
        codeBlock: {
          code: 'evens = [n for n in range(1, 21) if n % 2 == 0]\nprint(evens)  # [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]\n\nlong_words = [w for w in ["ai","python","go","rust"] if len(w) > 2]\nprint(long_words)',
          fillable: true,
        },
        tip: '嵌套也可以：`[f"{x},{y}" for x in range(3) for y in range(3)]` 生成坐标对！',
      },
    ],
  },

  // ── Level 10 ─────────────────────────────────────────────────────────────────
  {
    id: 10,
    title: '综合练习：小算盘',
    badge: '初成',
    icon: '🔢',
    objective: '定义 calculate(a, op, b) 函数，支持 +、-、*、/ 四则运算，打印计算结果',
    starterCode: `# Level 10: 综合练习 — 把前 9 关学的全用上！
# 目标：实现一个支持 + - * / 的 calculate 函数

def calculate(a, op, b):
    if op == "+":
        return a + b
    elif op == "-":
        return a - b
    elif op == "*":
        return a * b
    elif op == "/":
        if b == 0:
            return "错误：除数不能为零"
        return a / b
    else:
        return f"未知运算符: {op}"

# 测试
operations = [(10, "+", 5), (10, "-", 3), (4, "*", 7), (15, "/", 4)]
for a, op, b in operations:
    result = calculate(a, op, b)
    print(f"{a} {op} {b} = {result}")
`,
    proactiveHints: [
      '这关综合了：变量、if/elif、函数(def/return)、列表、for 循环、f-string。都是前面学过的！',
      '`for a, op, b in operations:` 叫做"解包"，可以一次性把元组里的 3 个值分配给 3 个变量。',
      '除法要检查除数是否为零，否则会报 ZeroDivisionError。',
    ],
    tests: [
      {
        id: 'l10-t1',
        description: '定义了 calculate 函数',
        check: (_o, code) => /def\s+calculate\s*\(/.test(code),
        failHint: '定义 `def calculate(a, op, b):` 函数',
        points: 60,
      },
      {
        id: 'l10-t2',
        description: '支持四则运算',
        check: (_o, code) => code.includes('+') && code.includes('-') && code.includes('*') && code.includes('/'),
        failHint: '函数里用 if/elif 处理 +、-、*、/ 四种运算',
        points: 80,
      },
      {
        id: 'l10-t3',
        description: '打印了正确的计算结果',
        check: (output) => output.includes('15') && output.includes('7') && output.includes('28'),
        failHint: '10+5=15, 10-3=7, 4*7=28，确认这些结果都在输出中',
        points: 160,
      },
    ],
    sections: [
      {
        heading: '你完成了初级篇！',
        body: '恭喜！你已经掌握了 Python 的所有核心基础：\n\n✅ print & 注释\n✅ 变量 & 数据类型\n✅ 条件判断\n✅ 循环\n✅ 函数\n✅ 列表 & 字典\n✅ 字符串操作\n✅ 列表推导式\n\n这一关是综合练习，把所有知识融合在一起。',
      },
      {
        heading: '元组拆包：优雅的解包方式',
        body: '`for a, op, b in operations:` 叫做解包（unpacking）。每次循环把元组的三个元素分别赋给 a、op、b。',
        codeBlock: {
          code: '# 元组（tuple）和列表类似，但用圆括号，且不可修改\npair = (3, 7)\na, b = pair  # 解包：a=3, b=7\nprint(a, b)\n\n# 实用场景\ncoordinates = [(1,2), (3,4), (5,6)]\nfor x, y in coordinates:\n    print(f"坐标: ({x}, {y})")',
          fillable: true,
        },
        tip: '完成这关后，进入进阶篇！你将学习 lambda、OOP、matplotlib 绘图、递归等更强大的技能。',
      },
    ],
  },

  // ════════════════════════════════════════
  //  进阶篇 · ADVANCED  (Lv 11–20)
  // ════════════════════════════════════════

  // ── Level 11 ─────────────────────────────────────────────────────────────────
  {
    id: 11,
    title: 'Lambda 与函数式编程',
    badge: '工匠',
    icon: '🔧',
    objective: '用 lambda 和 filter 筛选出 1-20 中所有奇数，再用 map 把每个数平方',
    starterCode: `# Level 11: Lambda — 匿名函数的力量
# 目标：用 filter + lambda 取奇数，再用 map + lambda 求平方

numbers = list(range(1, 21))

# 步骤 1：筛选奇数
odds = list(filter(lambda n: n % 2 != 0, numbers))
print("奇数:", odds)

# 步骤 2：对奇数求平方
squared = list(map(lambda n: n ** 2, odds))
print("平方:", squared)
`,
    proactiveHints: [
      '`lambda n: n % 2 != 0` 定义了一个匿名函数：对每个 n，判断它是否为奇数。',
      '`filter(函数, 序列)` 保留函数返回 True 的元素；`map(函数, 序列)` 对每个元素应用函数。',
      '需要用 `list()` 包裹 filter/map 的结果才能打印。',
    ],
    tests: [
      {
        id: 'l11-t1',
        description: '代码使用了 lambda',
        check: (_o, code) => code.includes('lambda'),
        failHint: '用 `lambda 参数: 表达式` 定义匿名函数',
        points: 80,
      },
      {
        id: 'l11-t2',
        description: '使用了 filter 或 map',
        check: (_o, code) => code.includes('filter') || code.includes('map'),
        failHint: '用 `filter()` 筛选，用 `map()` 变换',
        points: 70,
      },
      {
        id: 'l11-t3',
        description: '输出包含奇数平方结果',
        check: (output) => output.includes('1') && output.includes('9') && output.includes('25') && output.includes('361'),
        failHint: '1-20 奇数的平方应包含 1, 9, 25, ... 361',
        points: 150,
      },
    ],
    sections: [
      {
        heading: 'Lambda：无名的函数',
        body: '有时你只需要一个临时函数，用完就扔。`lambda` 创建**匿名函数**——没有名字、一行完成、用完即弃。',
        codeBlock: {
          code: 'double = lambda x: x * 2\nprint(double(5))   # 10\n\n# 直接调用！\nprint((lambda x: x ** 2)(4))  # 16',
          fillable: true,
        },
      },
      {
        heading: 'filter() 与 map()',
        body: '`filter(f, seq)` 保留 f 返回 True 的元素；`map(f, seq)` 对每个元素应用 f。',
        codeBlock: {
          code: 'nums = [1,2,3,4,5,6,7,8,9,10]\nevens = list(filter(lambda n: n%2==0, nums))\ntripled = list(map(lambda n: n*3, nums))\nprint(evens)\nprint(tripled)',
          fillable: true,
        },
        tip: '现代 Python 更推荐列表推导式，但理解 map/filter 对看别人代码很重要。',
      },
    ],
  },

  // ── Level 12 ─────────────────────────────────────────────────────────────────
  {
    id: 12,
    title: '类与面向对象',
    badge: '造物',
    icon: '⚙️',
    objective: '创建 Character 类，实例化英雄和怪物，让英雄攻击怪物并打印战斗日志',
    starterCode: `# Level 12: 类 — 用上帝视角创造世界
# 目标：创建 Character 类，让角色互相攻击

class Character:
    def __init__(self, name, hp, attack_power):
        self.name = name
        self.hp = hp
        self.attack_power = attack_power

    def attack(self, target):
        damage = self.attack_power
        target.hp -= damage
        print(f"⚔️  {self.name} 攻击了 {target.name}，造成 {damage} 点伤害！")
        print(f"   {target.name} 剩余 HP: {target.hp}")

    def is_alive(self):
        return self.hp > 0

hero = Character("勇者·艾伦", 100, 25)
goblin = Character("哥布林", 60, 10)

print("=== 战斗开始！===")
hero.attack(goblin)
goblin.attack(hero)
hero.attack(goblin)

if not goblin.is_alive():
    print("🏆 哥布林被击败！勇者胜利！")
`,
    proactiveHints: [
      '`class Character:` 定义蓝图。`__init__` 是构造函数——创建对象时自动运行。`self` 代表"这个对象本身"。',
      '用 `Character("名字", 血量, 攻击力)` 实例化对象。每个实例有自己的数据。',
      '`self.hp -= damage` 修改的是这个特定对象的 hp，不影响其他角色。',
    ],
    tests: [
      {
        id: 'l12-t1',
        description: '定义了 class',
        check: (_o, code) => /class\s+\w+/.test(code),
        failHint: '用 `class 类名:` 定义一个类',
        points: 80,
      },
      {
        id: 'l12-t2',
        description: '有 __init__ 方法',
        check: (_o, code) => code.includes('__init__'),
        failHint: '类里需要 `def __init__(self, ...):` 来初始化属性',
        points: 70,
      },
      {
        id: 'l12-t3',
        description: '创建了实例并触发了攻击输出',
        check: (output) => output.includes('攻击了') || output.includes('HP'),
        failHint: '创建两个角色实例，调用 attack() 方法打印战斗信息',
        points: 200,
      },
    ],
    sections: [
      {
        heading: '面向对象：用上帝视角编程',
        body: '没有类：1000 个角色需要 1000 组变量 → 灾难\n**有类**：定义蓝图，造 1000 个实例，每个有自己的数据，共享方法。',
        codeBlock: {
          code: 'class Dog:\n    def __init__(self, name, breed):\n        self.name = name\n        self.breed = breed\n\n    def bark(self):\n        print(f"{self.name} 说：汪汪！")\n\ndog1 = Dog("旺财", "柴犬")\ndog1.bark()',
          fillable: true,
        },
      },
      {
        heading: '继承：蓝图的蓝图',
        body: '子类可以继承父类的所有方法，并在此基础上添加或修改。',
        codeBlock: {
          code: 'class Mage(Character):  # 继承 Character\n    def __init__(self, name, hp, attack_power, mana):\n        super().__init__(name, hp, attack_power)  # 调用父类 __init__\n        self.mana = mana\n\n    def cast_spell(self, target):\n        if self.mana >= 20:\n            target.hp -= self.attack_power * 2\n            self.mana -= 20\n            print(f"✨ {self.name} 施放魔法！")',
          fillable: true,
        },
        tip: '挑战：给 Character 加一个 `heal(amount)` 方法，让角色可以回血！',
      },
    ],
  },

  // ── Level 13 ─────────────────────────────────────────────────────────────────
  {
    id: 13,
    title: '用代码作画',
    badge: '图绘',
    icon: '🎨',
    requiresGraphics: true,
    objective: '用 matplotlib 画一颗心形图案，在结果面板中看到你的第一幅代码画作',
    starterCode: `# Level 13: 用代码作画 ✨
# 目标：用 matplotlib 画出一颗心，运行后在右侧看到图像！
import numpy as np
import matplotlib.pyplot as plt
import base64, io

t = np.linspace(0, 2 * np.pi, 300)
x = 16 * np.sin(t) ** 3
y = 13 * np.cos(t) - 5 * np.cos(2*t) - 2 * np.cos(3*t) - np.cos(4*t)

fig, ax = plt.subplots(figsize=(6, 6), facecolor='#0a0a12')
ax.set_facecolor('#0a0a12')
ax.plot(x, y, color='#ff6b9d', linewidth=2.5)
ax.fill(x, y, color='#ff6b9d', alpha=0.25)
ax.set_aspect('equal')
ax.axis('off')
ax.set_title('我的第一幅代码画作 ❤️', color='white', fontsize=14, pad=20)

buf = io.BytesIO()
plt.savefig(buf, format='png', bbox_inches='tight', facecolor='#0a0a12', dpi=120)
plt.close()
buf.seek(0)
img_b64 = base64.b64encode(buf.read()).decode()
print(f"__ZF_IMAGE__{img_b64}")
`,
    proactiveHints: [
      'matplotlib 是 Python 最强大的绘图库。`plt.plot(x, y)` 画线，`plt.fill(x, y)` 填色。',
      '先运行看效果，再尝试修改颜色！把 `color=\'#ff6b9d\'` 改成 `\'#7c3aed\'`（紫色）试试。',
      '心形曲线用了参数方程，t 从 0 到 2π 描绘出完整心形。',
    ],
    tests: [
      {
        id: 'l13-t1',
        description: '代码引入了 matplotlib',
        check: (_o, code) => code.includes('matplotlib'),
        failHint: '需要 `import matplotlib.pyplot as plt`',
        points: 80,
      },
      {
        id: 'l13-t2',
        description: '包含绘图命令',
        check: (_o, code) => /plt\.(plot|fill|scatter|bar|pie)\(/.test(code),
        failHint: '用 `plt.plot(x, y)` 画线或 `plt.fill(x, y)` 填充',
        points: 100,
      },
      {
        id: 'l13-t3',
        description: '输出了图像',
        check: (output, code) =>
          output.includes('__ZF_IMAGE__') || code.includes('__ZF_IMAGE__'),
        failHint: '确保末尾有 buf→base64→print("__ZF_IMAGE__...") 的输出代码',
        points: 170,
      },
    ],
    sections: [
      {
        heading: '代码也能作画',
        body: 'matplotlib 是 Python 的"画笔"——NASA、气象局、生物学家都用它可视化数据。今天你用数学方程画一颗心。',
        codeBlock: {
          code: 'import numpy as np\nimport matplotlib.pyplot as plt\n\nt = np.linspace(0, 2 * np.pi, 300)\nx = 16 * np.sin(t) ** 3\ny = 13 * np.cos(t) - 5 * np.cos(2*t) - 2 * np.cos(3*t) - np.cos(4*t)\n\nplt.figure(figsize=(5, 5))\nplt.plot(x, y, color=\'red\', linewidth=2)\nplt.axis(\'equal\')',
          fillable: false,
        },
      },
      {
        heading: '输出图像到 CodeNexus',
        body: '浏览器里没有弹出窗口，我们把图像转成 base64 文本用特殊前缀输出，CodeNexus 自动渲染成图片。',
        codeBlock: {
          code: 'import base64, io\n\nbuf = io.BytesIO()\nplt.savefig(buf, format=\'png\', bbox_inches=\'tight\', dpi=120)\nplt.close()\nbuf.seek(0)\nimg_b64 = base64.b64encode(buf.read()).decode()\nprint(f"__ZF_IMAGE__{img_b64}")',
          caption: '图像输出固定写法——复制即用',
          fillable: true,
        },
        tip: '成功后，试试改变颜色、线宽，或加文字：`ax.text(0, -3, "❤️", ha="center", fontsize=30)`',
      },
    ],
  },

  // ── Level 14 ─────────────────────────────────────────────────────────────────
  {
    id: 14,
    title: '错误处理',
    badge: '防护',
    icon: '🛡️',
    objective: '用 try/except 处理除零错误和类型转换错误，不让程序崩溃',
    starterCode: `# Level 14: 错误处理 — 让程序优雅地失败
# 目标：用 try/except 处理可能的错误

def safe_divide(a, b):
    try:
        result = a / b
        return f"{a} / {b} = {result}"
    except ZeroDivisionError:
        return "错误：除数不能为零！"

def safe_convert(text):
    try:
        number = int(text)
        return f"转换成功：{number}"
    except ValueError:
        return f"错误：'{text}' 不是一个整数"

# 测试
print(safe_divide(10, 2))
print(safe_divide(10, 0))  # 会触发 ZeroDivisionError
print(safe_convert("42"))
print(safe_convert("hello"))  # 会触发 ValueError
`,
    proactiveHints: [
      '`try:` 里放可能出错的代码；`except 错误类型:` 里处理错误。程序不会崩溃，而是优雅地执行 except 块。',
      '常见错误类型：`ZeroDivisionError`（除以零）、`ValueError`（值类型错误）、`TypeError`（类型错误）、`KeyError`（字典键不存在）。',
      '`finally:` 块无论是否出错都会执行，常用于清理资源（如关闭文件）。',
    ],
    tests: [
      {
        id: 'l14-t1',
        description: '使用了 try/except 结构',
        check: (_o, code) => code.includes('try:') && code.includes('except'),
        failHint: '用 `try: ... except 错误类型: ...` 结构捕获错误',
        points: 100,
      },
      {
        id: 'l14-t2',
        description: '至少处理了两种不同错误',
        check: (_o, code) => {
          const exceptions = ['ZeroDivisionError', 'ValueError', 'TypeError', 'KeyError', 'IndexError', 'Exception']
          return exceptions.filter(e => code.includes(e)).length >= 2
        },
        failHint: '处理至少两种不同的错误类型（如 ZeroDivisionError 和 ValueError）',
        points: 100,
      },
      {
        id: 'l14-t3',
        description: '打印了错误处理的结果',
        check: (output) => output.includes('错误') || output.includes('Error') || output.includes('转换'),
        failHint: '在 except 块里打印错误信息，然后调用函数看输出',
        points: 100,
      },
    ],
    sections: [
      {
        heading: '程序为什么会崩溃？',
        body: '当 Python 遇到不能处理的情况（除以零、转换失败、文件不存在），就会抛出**异常（Exception）**，程序崩溃停止。\n\n`try/except` 让你**捕获**这些异常，优雅地处理，而不是让程序直接崩溃。',
        codeBlock: {
          code: '# 没有 try/except 的情况：\nprint(1 / 0)  # ZeroDivisionError: division by zero\n              # 程序崩溃！\n\n# 有 try/except：\ntry:\n    print(1 / 0)\nexcept ZeroDivisionError:\n    print("除数不能为零")  # 优雅处理',
          fillable: true,
        },
      },
      {
        heading: '完整的错误处理结构',
        body: '`try` → 尝试执行\n`except` → 捕获特定错误\n`else` → 没有错误时执行\n`finally` → 无论如何都执行',
        codeBlock: {
          code: 'try:\n    result = int("123")\nexcept ValueError as e:\n    print(f"转换失败: {e}")\nelse:\n    print(f"转换成功: {result}")\nfinally:\n    print("处理完毕")  # 总会执行',
          fillable: true,
        },
        tip: '捕获多个错误：`except (ValueError, TypeError) as e:` 可以同时处理多种错误类型。',
        warning: '不要用裸 `except:` 捕获所有错误！这会掩盖真正的 bug。至少用 `except Exception as e:`。',
      },
    ],
  },

  // ── Level 15 ─────────────────────────────────────────────────────────────────
  {
    id: 15,
    title: '模块与标准库',
    badge: '工具箱',
    icon: '🧰',
    objective: '用 math、random、datetime 三个标准库模块完成任务',
    starterCode: `# Level 15: 模块 — Python 的超级工具箱
# 目标：用三个标准库模块完成下面的任务

import math
import random
import datetime

# 1. 数学：计算圆的面积（半径 = 5）
radius = 5
area = math.pi * radius ** 2
print(f"圆的面积：{area:.2f}")  # :.2f 保留两位小数

# 2. 随机：生成 1-100 的随机整数
lucky = random.randint(1, 100)
print(f"你的幸运数字：{lucky}")

# 3. 日期：获取今天的日期
today = datetime.date.today()
print(f"今天是：{today}")
print(f"今年是 {today.year} 年")
`,
    proactiveHints: [
      '`import 模块名` 导入整个模块，用 `模块名.函数名()` 调用。',
      '`from math import pi, sqrt` 只导入需要的东西，直接用 `pi` 和 `sqrt()` 即可。',
      'Python 标准库自带几百个模块，不需要安装。`math`、`random`、`os`、`json`、`datetime` 是最常用的。',
    ],
    tests: [
      {
        id: 'l15-t1',
        description: '导入了至少两个标准库模块',
        check: (_o, code) => {
          const modules = ['math', 'random', 'datetime', 'os', 'sys', 'json', 'time', 'collections', 'itertools', 're']
          return modules.filter(m => new RegExp(`\\bimport\\s+${m}\\b|\\bfrom\\s+${m}\\b`).test(code)).length >= 2
        },
        failHint: '用 `import math` 等导入至少两个标准库模块',
        points: 80,
      },
      {
        id: 'l15-t2',
        description: '调用了模块的函数或属性',
        check: (_o, code) => /\w+\.\w+\(/.test(code) || /math\.\w+/.test(code),
        failHint: '用 `模块名.函数()` 格式调用模块里的功能',
        points: 70,
      },
      {
        id: 'l15-t3',
        description: '打印了三个不同类型的结果',
        check: (output) => output.trim().split('\n').filter((l) => l.trim()).length >= 3,
        failHint: '打印三个不同任务的结果（面积、随机数、日期）',
        points: 150,
      },
    ],
    sections: [
      {
        heading: '模块：别重复造轮子',
        body: 'Python 有一句名言："batteries included"（自带电池）——标准库自带了几乎你需要的一切。\n\n模块就是别人写好的工具包，`import` 一下就能用。',
        codeBlock: {
          code: 'import math\n\nprint(math.pi)          # 3.14159...\nprint(math.sqrt(16))    # 4.0\nprint(math.floor(3.7))  # 3（向下取整）\nprint(math.ceil(3.2))   # 4（向上取整）',
          fillable: true,
        },
      },
      {
        heading: '常用标准库速查',
        body: '`math` — 数学函数\n`random` — 随机数生成\n`datetime` — 日期时间\n`os` — 操作系统接口\n`json` — JSON 解析\n`re` — 正则表达式\n`collections` — 高级数据结构\n`itertools` — 迭代工具',
        codeBlock: {
          code: 'import random\n\n# 随机整数\nprint(random.randint(1, 6))      # 模拟骰子\n\n# 随机选择列表元素\ncolors = ["红", "绿", "蓝", "黄"]\nprint(random.choice(colors))\n\n# 打乱列表顺序\nrandom.shuffle(colors)\nprint(colors)',
          fillable: true,
        },
        tip: '想用 pip 安装的第三方库（如 requests、pandas），先用 `pip install 库名` 安装。',
      },
    ],
  },

  // ── Level 16 ─────────────────────────────────────────────────────────────────
  {
    id: 16,
    title: '递归',
    badge: '镜像',
    icon: '🔄',
    objective: '用递归实现阶乘函数 factorial(n)，并计算 factorial(10)',
    starterCode: `# Level 16: 递归 — 函数调用自己
# 目标：用递归实现阶乘 factorial(n) = n * (n-1) * ... * 1

def factorial(n):
    # 基础情况（递归必须有出口！）
    if n <= 1:
        return 1
    # 递归情况：n! = n * (n-1)!
    return n * factorial(n - 1)

# 测试
for i in range(1, 11):
    print(f"{i}! = {factorial(i)}")
`,
    proactiveHints: [
      '递归函数必须有**基础情况**（递归的出口），否则会无限调用自己，导致栈溢出。',
      '`factorial(5)` = `5 * factorial(4)` = `5 * 4 * factorial(3)` = ... = `5 * 4 * 3 * 2 * 1` = 120',
      '递归的核心思想：把大问题分解成同类型的小问题，直到小问题简单到可以直接解答。',
    ],
    tests: [
      {
        id: 'l16-t1',
        description: '定义了递归函数（函数内调用自身）',
        check: (_o, code) => {
          const match = code.match(/def\s+(\w+)\s*\(/)
          if (!match) return false
          const funcName = match[1]
          return code.split(funcName).length > 3
        },
        failHint: '在函数体内调用函数自身，这就是递归',
        points: 120,
      },
      {
        id: 'l16-t2',
        description: '有基础情况（if n <= 1 或类似）',
        check: (_o, code) => /if.*(<=?\s*[01]|==\s*0|==\s*1)/.test(code),
        failHint: '必须有基础情况（if n <= 1: return 1），否则递归永远不会停止',
        points: 80,
      },
      {
        id: 'l16-t3',
        description: '10! 的计算结果正确（3628800）',
        check: (output) => output.includes('3628800'),
        failHint: '10! = 3628800，确认输出中包含这个数字',
        points: 200,
      },
    ],
    sections: [
      {
        heading: '递归：函数调用自己',
        body: '递归是一种强大的编程思想：**把大问题分解成同类型的小问题，直到足够小可以直接解答**。\n\n就像俄罗斯套娃——打开一个，里面是一个更小的，直到最小的那个打不开为止。',
        codeBlock: {
          code: 'def countdown(n):\n    if n <= 0:         # 基础情况（出口）\n        print("发射！🚀")\n        return\n    print(n)          # 递归情况\n    countdown(n - 1)  # 调用自身，参数变小\n\ncountdown(5)',
          fillable: true,
        },
      },
      {
        heading: '经典：斐波那契数列',
        body: '斐波那契：F(n) = F(n-1) + F(n-2)，F(0)=0，F(1)=1',
        codeBlock: {
          code: 'def fib(n):\n    if n <= 1:\n        return n\n    return fib(n-1) + fib(n-2)\n\nprint([fib(i) for i in range(10)])\n# [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]',
          fillable: true,
        },
        warning: '递归有性能问题！`fib(40)` 会计算数百亿次。用动态规划或迭代代替大规模递归。',
        tip: '挑战：用递归实现 `fib(n)`，然后比较它与循环版本的速度差异！',
      },
    ],
  },

  // ── Level 17 ─────────────────────────────────────────────────────────────────
  {
    id: 17,
    title: '数据处理与排序',
    badge: '算法',
    icon: '📊',
    objective: '处理学生成绩列表：排序、找最高分、计算平均分、筛选不及格',
    starterCode: `# Level 17: 数据处理 — 算法的实际应用
# 目标：对学生成绩进行多种统计处理

students = [
    {"name": "小明", "score": 85},
    {"name": "小红", "score": 92},
    {"name": "小刚", "score": 57},
    {"name": "小美", "score": 78},
    {"name": "小强", "score": 41},
    {"name": "小芳", "score": 96},
]

# 1. 按成绩降序排列
sorted_students = sorted(students, key=lambda s: s["score"], reverse=True)
print("排名：")
for i, s in enumerate(sorted_students, 1):
    print(f"  {i}. {s['name']}: {s['score']} 分")

# 2. 平均分
avg = sum(s["score"] for s in students) / len(students)
print(f"\n平均分：{avg:.1f}")

# 3. 不及格名单（< 60）
failed = [s["name"] for s in students if s["score"] < 60]
print(f"不及格：{', '.join(failed)}")
`,
    proactiveHints: [
      '`sorted(列表, key=lambda x: x["score"])` 按字典中的某个键排序；加 `reverse=True` 降序。',
      '`enumerate(列表, 1)` 遍历时同时获取索引（从 1 开始）；`sum(x for x in 列表)` 是生成器求和。',
      '`", ".join(列表)` 把列表拼成用逗号分隔的字符串。',
    ],
    tests: [
      {
        id: 'l17-t1',
        description: '使用了 sorted 或 sort',
        check: (_o, code) => code.includes('sorted(') || code.includes('.sort('),
        failHint: '用 `sorted(列表, key=...)` 对学生排序',
        points: 80,
      },
      {
        id: 'l17-t2',
        description: '计算了平均分',
        check: (output) => output.includes('平均') || output.includes('avg') || /\d+\.\d/.test(output),
        failHint: '用 sum / len 计算平均分并打印',
        points: 80,
      },
      {
        id: 'l17-t3',
        description: '筛选了不及格学生',
        check: (output) => output.includes('小刚') && output.includes('小强'),
        failHint: '不及格的是小刚(57)和小强(41)，确保他们都在输出中',
        points: 140,
      },
    ],
    sections: [
      {
        heading: '排序：sorted() 与 .sort()',
        body: '`sorted(seq, key=fn, reverse=False)` 返回**新列表**，不修改原列表。\n`.sort(key=fn)` **就地排序**，修改原列表，返回 None。',
        codeBlock: {
          code: 'words = ["banana", "apple", "cherry", "date"]\n\n# 按长度排序\nby_len = sorted(words, key=len)\nprint(by_len)  # ["date", "apple", "banana", "cherry"]\n\n# 按字母倒序\nby_abc_rev = sorted(words, reverse=True)\nprint(by_abc_rev)',
          fillable: true,
        },
      },
      {
        heading: 'enumerate 与 zip',
        body: '`enumerate(seq, start)` 同时获取索引和值；`zip(seq1, seq2)` 把两个序列合并成对。',
        codeBlock: {
          code: 'names = ["Alice", "Bob", "Charlie"]\nscores = [92, 85, 78]\n\n# zip：把名字和分数配对\nfor name, score in zip(names, scores):\n    print(f"{name}: {score}")\n\n# enumerate：带编号\nfor i, name in enumerate(names, 1):\n    print(f"{i}. {name}")',
          fillable: true,
        },
        tip: 'max(students, key=lambda s: s["score"])["name"] 直接找最高分学生！',
      },
    ],
  },

  // ── Level 18 ─────────────────────────────────────────────────────────────────
  {
    id: 18,
    title: '正则表达式',
    badge: '模式',
    icon: '🔍',
    objective: '用正则表达式从文本中提取所有电话号码和邮箱地址',
    starterCode: `# Level 18: 正则表达式 — 文字的 X 光机
# 目标：从文本中提取电话号码和邮箱

import re

text = """
联系我们：
  客服电话：138-0013-8000
  技术支持：010-8888-9999
  邮箱：support@codenexus.dev
  备用邮箱：hello.world@example.com
  另一个号码：186-1234-5678
"""

# 提取电话号码（格式：xxx-xxxx-xxxx 或 010-xxxx-xxxx）
phones = re.findall(r'\\d{3}-\\d{4}-\\d{4}', text)
print(f"找到 {len(phones)} 个电话号码：")
for p in phones:
    print(f"  {p}")

# 提取邮箱地址
emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', text)
print(f"\\n找到 {len(emails)} 个邮箱：")
for e in emails:
    print(f"  {e}")
`,
    proactiveHints: [
      '`re.findall(pattern, text)` 返回所有匹配的字符串列表。',
      '`\\d` 匹配数字，`\\d{3}` 匹配恰好 3 个数字。`+` 匹配一个或多个，`*` 匹配零个或多个。',
      '邮箱正则：`[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}` — 用户名 @ 域名 . 后缀',
    ],
    tests: [
      {
        id: 'l18-t1',
        description: '使用了 re 模块',
        check: (_o, code) => code.includes('import re') && code.includes('re.'),
        failHint: '`import re` 然后用 `re.findall()` 等方法',
        points: 60,
      },
      {
        id: 'l18-t2',
        description: '找到了 3 个电话号码',
        check: (output) => output.includes('138-0013-8000') && output.includes('010-8888-9999'),
        failHint: '正则模式应该能匹配 xxx-xxxx-xxxx 格式的电话号码',
        points: 120,
      },
      {
        id: 'l18-t3',
        description: '找到了邮箱地址',
        check: (output) => output.includes('@codenexus.dev') || output.includes('@example.com'),
        failHint: '邮箱正则应该匹配 xxx@xxx.xxx 格式',
        points: 120,
      },
    ],
    sections: [
      {
        heading: '正则表达式：文字的 X 光机',
        body: '正则表达式（RegEx）是一种强大的模式匹配语言，用来在文字中搜索、提取、替换特定格式的内容。\n\n验证邮箱、提取电话、清洗数据——这是每个程序员必备的技能。',
        codeBlock: {
          code: 'import re\n\ntext = "我的电话是 138-1234-5678，邮箱是 abc@test.com"\n\n# 搜索：返回第一个匹配\nmatch = re.search(r\'\\d{3}-\\d{4}-\\d{4}\', text)\nif match:\n    print(f"找到电话：{match.group()}")\n\n# 查找所有：返回列表\nall_nums = re.findall(r\'\\d+\', text)\nprint(f"所有数字：{all_nums}")',
          fillable: true,
        },
      },
      {
        heading: '正则语法速查',
        body: '`.` 任意字符\n`\\d` 数字 [0-9]\n`\\w` 字母/数字/下划线\n`\\s` 空白字符\n`+` 一个或多个\n`*` 零个或多个\n`?` 零个或一个\n`{n}` 恰好 n 个\n`^` 开头 `$` 结尾',
        codeBlock: {
          code: '# 替换：re.sub\ntext = "2024-01-15"\nformatted = re.sub(r\'(\\d{4})-(\\d{2})-(\\d{2})\', r\'\\3/\\2/\\1\', text)\nprint(formatted)  # 15/01/2024\n\n# 分割：re.split\nwords = re.split(r\'[,;\\s]+\', "hello,world; python  is  fun")\nprint(words)',
          fillable: true,
        },
        warning: '在 Python 字符串中写正则，用 `r\'pattern\'`（原始字符串）避免反斜杠冲突。',
      },
    ],
  },

  // ── Level 19 ─────────────────────────────────────────────────────────────────
  {
    id: 19,
    title: '生成器与装饰器',
    badge: '秘术',
    icon: '🌊',
    objective: '实现一个斐波那契数生成器，再用装饰器为函数添加计时功能',
    starterCode: `# Level 19: 生成器 & 装饰器 — Python 的进阶黑魔法
import time

# ── 生成器：用 yield 创建惰性序列 ──
def fibonacci():
    a, b = 0, 1
    while True:
        yield a          # 暂停在这里，返回 a，下次继续
        a, b = b, a + b

# 取前 10 个斐波那契数
fib = fibonacci()
fib_list = [next(fib) for _ in range(10)]
print(f"斐波那契: {fib_list}")

# ── 装饰器：给函数"穿上外套" ──
def timer(func):
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        elapsed = (time.time() - start) * 1000
        print(f"⏱ {func.__name__} 耗时 {elapsed:.3f}ms")
        return result
    return wrapper

@timer
def slow_sum(n):
    return sum(range(n))

result = slow_sum(1_000_000)
print(f"1 到 100万 的和：{result}")
`,
    proactiveHints: [
      '`yield` 让函数变成生成器：调用时返回一个值并**暂停**，下次 `next()` 时从暂停处继续执行。',
      '装饰器就是一个接受函数、返回函数的函数。`@timer` 等价于 `slow_sum = timer(slow_sum)`。',
      '生成器的优势：不把所有值存在内存里，适合处理无限序列或超大数据集。',
    ],
    tests: [
      {
        id: 'l19-t1',
        description: '使用了 yield（生成器）',
        check: (_o, code) => code.includes('yield'),
        failHint: '在函数里用 `yield 值` 创建生成器',
        points: 120,
      },
      {
        id: 'l19-t2',
        description: '使用了装饰器（@）',
        check: (_o, code) => /@\w+/.test(code),
        failHint: '用 `@装饰器名` 语法给函数添加装饰器',
        points: 120,
      },
      {
        id: 'l19-t3',
        description: '打印了斐波那契数列',
        check: (output) => output.includes('0') && output.includes('1') && output.includes('34'),
        failHint: '前 10 个斐波那契数包含 0, 1, 1, 2, 3, 5, 8, 13, 21, 34',
        points: 260,
      },
    ],
    sections: [
      {
        heading: '生成器：懒加载的序列',
        body: '普通函数一次返回所有结果（存在内存）；生成器**一次返回一个**，按需计算，极其节省内存。\n\n用 `yield` 替代 `return`，函数就变成了生成器。',
        codeBlock: {
          code: 'def count_up(start, end):\n    current = start\n    while current <= end:\n        yield current    # 暂停，返回 current\n        current += 1\n\nfor n in count_up(1, 5):\n    print(n)  # 1 2 3 4 5\n\n# 生成器表达式（类似列表推导式）\ngen = (x**2 for x in range(10))  # 括号！不存在内存\nprint(next(gen))  # 0\nprint(next(gen))  # 1',
          fillable: true,
        },
      },
      {
        heading: '装饰器：给函数穿衣服',
        body: '装饰器在不修改原函数代码的情况下，**给它添加新功能**（日志、计时、缓存、权限检查）。\n\n`@decorator` 是语法糖，等价于 `func = decorator(func)`。',
        codeBlock: {
          code: 'def log(func):\n    def wrapper(*args, **kwargs):\n        print(f"调用 {func.__name__}")\n        result = func(*args, **kwargs)\n        print(f"{func.__name__} 完成")\n        return result\n    return wrapper\n\n@log\ndef greet(name):\n    print(f"你好，{name}！")\n\ngreet("Python")  # 自动打印日志',
          fillable: true,
        },
        tip: '`functools.wraps(func)` 装饰 wrapper 函数，保留原函数的名称和文档。这是装饰器的最佳实践。',
      },
    ],
  },

  // ── Level 20 ─────────────────────────────────────────────────────────────────
  {
    id: 20,
    title: '终焉大典：综合实战',
    badge: '核心节点',
    icon: '🏆',
    objective: '综合运用所有技能：用类 + 列表 + 函数实现一个文字冒险游戏引擎',
    starterCode: `# Level 20: 终端协议 — 核心节点校验
# 综合运用：类、装饰器、列表推导、异常处理、生成器

from functools import wraps

# ── 日志装饰器 ──
def log_action(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        result = func(*args, **kwargs)
        print(f"  [{func.__name__}] ✓")
        return result
    return wrapper

# ── 角色类 ──
class Hero:
    def __init__(self, name, hp=100, attack=20):
        self.name = name
        self.hp = hp
        self.attack = attack
        self.inventory = []

    @log_action
    def pick_up(self, item):
        self.inventory.append(item)

    @log_action
    def use_item(self, item_name):
        item = next((i for i in self.inventory if i["name"] == item_name), None)
        if item:
            self.hp = min(100, self.hp + item.get("heal", 0))
            self.inventory.remove(item)
            return f"使用了 {item_name}，HP 回复至 {self.hp}"
        raise ValueError(f"没有物品：{item_name}")

    def status(self):
        inv = [i["name"] for i in self.inventory]
        return f"{self.name} | HP:{self.hp} | 物品:{inv}"

# ── 游戏引擎 ──
hero = Hero("Nexus")

# 拾取物品
items = [
    {"name": "血药", "heal": 30},
    {"name": "魔药", "heal": 50},
    {"name": "圣水", "heal": 80},
]
for item in items:
    hero.pick_up(item)

# 战斗模拟
hero.hp -= 65  # 受到伤害
print(f"受伤后：{hero.status()}")

# 安全使用物品
try:
    msg = hero.use_item("血药")
    print(msg)
    msg = hero.use_item("幻影药")  # 不存在的物品
except ValueError as e:
    print(f"错误：{e}")

# 战斗结果
print(f"\\n最终状态：{hero.status()}")

# 统计：物品总治疗量
total_heal = sum(i.get("heal", 0) for i in items)
print(f"背包总治疗量：{total_heal}")
print(f"\\n恭喜通关！你完成了 CodeNexus 核心节点！")
`,
    proactiveHints: [
      '这关没有新知识——全是前 19 关内容的融合：类(@log_action 装饰器、类方法)、生成器表达式 (next + generator)、异常处理 (try/except)。',
      '`@wraps(func)` 保留被装饰函数的名称；`next((x for x in 列表 if 条件), 默认值)` 是查找列表元素的惯用法。',
      '通过这关，你已经具备了用 Python 构建真实项目的能力。下一步：Flask Web 开发、数据分析、机器学习！',
    ],
    tests: [
      {
        id: 'l20-t1',
        description: '使用了类（class）',
        check: (_o, code) => /class\s+\w+/.test(code),
        failHint: '定义一个类来封装游戏角色的数据和行为',
        points: 80,
      },
      {
        id: 'l20-t2',
        description: '使用了装饰器（@）',
        check: (_o, code) => /@\w+/.test(code),
        failHint: '用装饰器给方法添加功能（如日志）',
        points: 80,
      },
      {
        id: 'l20-t3',
        description: '使用了异常处理（try/except）',
        check: (_o, code) => code.includes('try:') && code.includes('except'),
        failHint: '用 try/except 处理可能出现的错误',
        points: 80,
      },
      {
        id: 'l20-t4',
        description: '打印了最终通关信息',
        check: (output) => output.includes('恭喜') || output.includes('核心节点') || output.includes('通关'),
        failHint: '运行完整代码，打印出最终状态和通关信息',
        points: 360,
      },
    ],
    sections: [
      {
        heading: '你来到了 CodeNexus 的最终关卡',
        body: '这一关综合了你学过的全部技能。没有新知识——只有融合。\n\n**初级篇回顾**：print、变量、条件、循环、函数、列表、字典、字符串、推导式、综合\n**进阶篇回顾**：lambda、OOP、matplotlib、错误处理、模块、递归、排序算法、正则、生成器/装饰器',
      },
      {
        heading: '下一步去哪里？',
        body: '完成 CodeNexus 只是开始。根据你的方向选择下一步：\n\n🌐 **Web 开发**：Flask / Django → 全栈开发\n📊 **数据分析**：Pandas + NumPy → 数据科学\n🤖 **AI / ML**：PyTorch / TensorFlow → 机器学习\n🎮 **游戏开发**：Pygame → 2D 游戏\n🔧 **自动化**：Selenium / requests → 爬虫 & 自动化',
        codeBlock: {
          code: '# 你的 Python 之旅从这里开始\n# 构建你自己的路线\n\nprint("Hello, World!")\nprint("这是你的起点，也是无限可能的开始。")',
          fillable: false,
        },
        tip: '恭喜！你已经完成 CodeNexus 核心路径。把你的项目分享给朋友，让更多人感受编程的魅力！',
      },
    ],
  },
]

export const LEVEL_MAP = new Map(LEVELS.map((l) => [l.id, l]))
export const MAX_LEVEL = LEVELS.length
