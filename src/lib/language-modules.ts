import { COURSE_MAPS, type CourseMap, type CourseNode } from '@/lib/course-maps'
import { LEVELS, type Level, type LessonSection, type TestCase } from '@/lib/levels'

export type LanguageId = 'python' | 'c' | 'cpp' | 'java' | 'csharp' | 'javascript' | 'visual-basic'
export type RuntimeKind = 'python-pyodide' | 'server-exec' | 'static-check'
export type EditorLanguage = 'python' | 'plain'

export type LearningLanguage = {
  id: LanguageId
  name: string
  shortName: string
  route: string
  runtime: RuntimeKind
  editorLanguage: EditorLanguage
  progressOffset: number
  accent: CourseMap['accent']
  tagline: string
  description: string
  domainLabel: string
  levels: Level[]
  courseMaps: CourseMap[]
}

function includesAll(parts: string[]): TestCase['check'] {
  return (_output, code) => parts.every((part) => code.toLowerCase().includes(part.toLowerCase()))
}

function matches(pattern: RegExp): TestCase['check'] {
  return (_output, code) => pattern.test(code)
}

function staticLevel({
  id,
  title,
  badge,
  icon,
  objective,
  starterCode,
  sections,
  tests,
  hints,
}: {
  id: number
  title: string
  badge: string
  icon: string
  objective: string
  starterCode: string
  sections: LessonSection[]
  tests: TestCase[]
  hints?: string[]
}): Level {
  const enrichedSections = sections.length >= 3
    ? sections
    : [
        ...sections,
        {
          heading: '拆题方式',
          body: `先把目标压成一句话：${objective}。\n\n再把代码拆成三段：入口在哪里、数据在哪里、结果怎么交出去。每次只写能证明目标的一小段，跑通后再补结构。`,
          tip: '不要一边写一边猜。先确认本关要证明什么，再写最小可运行版本。',
          auto: 'breakdown' as const,
        },
        {
          heading: '通关检查',
          body: tests.map((item, index) => `${index + 1}. ${item.description}`).join('\n'),
          warning: '如果测试没过，先看第一个失败提示。别同时改三处，不然你连自己修好了什么都不知道。',
          auto: 'checklist' as const,
        },
      ]

  return {
    id,
    title,
    badge,
    icon,
    objective,
    starterCode,
    proactiveHints: hints ?? [
      '先别背语法，先让最小代码表达目标。',
      '如果你写了十行还没碰到目标，说明你正在绕远路。',
    ],
    tests,
    sections: enrichedSections,
  }
}

function section(heading: string, body: string, code: string, tip?: string): LessonSection {
  return {
    heading,
    body,
    codeBlock: { code, caption: '参考结构', fillable: true },
    tip,
  }
}

function note(heading: string, body: string, tip?: string, warning?: string): LessonSection {
  return { heading, body, tip, warning }
}

function richSections({
  heading,
  body,
  code,
  caption,
  model,
  practice,
  pitfall,
}: {
  heading: string
  body: string
  code: string
  caption?: string
  model: string
  practice: string
  pitfall: string
}): LessonSection[] {
  return [
    {
      heading,
      body,
      codeBlock: { code, caption: caption ?? '参考结构', fillable: true },
    },
    note('脑内模型', model, practice),
    note('坑点档案', pitfall, undefined, '本关先追求写对最小结构。能解释每一行为什么存在，再继续加花活。'),
  ]
}

function test(id: string, description: string, check: TestCase['check'], failHint: string, points = 50): TestCase {
  return { id, description, check, failHint, points }
}

function courseNode(
  id: string,
  title: string,
  objective: string,
  difficulty: CourseNode['difficulty'],
  lessonCount: number,
  tags: string[],
  kind: CourseNode['kind'] = 'lesson'
): CourseNode {
  return { id, title, objective, difficulty, lessonCount, tags, kind }
}

function foundationProjectNode(name: string, levelId: number): CourseNode {
  const stage = levelId / 5
  const titles = ['微型控制台工具', '数据整理器', '稳定运行模块', '基础毕业作品']
  const title = titles[stage - 1] ?? '阶段作品'
  return {
    id: `foundation-project-${levelId}`,
    title,
    objective: `用 Lv.1-${levelId} 的能力做一个能运行、能展示、能复盘的 ${name} 小作品。`,
    difficulty: stage <= 1 ? '进阶' : stage <= 3 ? '专业' : '硬核',
    lessonCount: 1,
    tags: ['阶段作品', `${name} 基础`, `Lv.${levelId}`],
    kind: 'project',
    unlockAfterLevel: levelId,
  }
}

function foundationMap(name: string, levels: Level[], accent: CourseMap['accent']): CourseMap {
  return {
    id: 'foundation',
    title: `${name} 基础分支`,
    shortTitle: '基础',
    subtitle: `${levels.length} 个语言核心节点 + ${Math.floor(levels.length / 5)} 个阶段作品`,
    description: `从第一段输出到函数、容器和小型结构，把 ${name} 当成一门能真正上手的语言来学；每 5 关做一次小作品。`,
    accent,
    nodes: levels.flatMap((level) => {
      const lessonNode: CourseNode = {
        id: `foundation-${level.id}`,
        title: level.title,
        objective: level.objective,
        difficulty: level.id <= 2 ? '基础' : level.id <= 5 ? '进阶' : '专业',
        lessonCount: 1,
        tags: [level.badge, `${name} 基础`],
        kind: 'lesson',
        levelId: level.id,
      }
      return level.id % 5 === 0
        ? [lessonNode, foundationProjectNode(name, level.id)]
        : [lessonNode]
    }),
  }
}

function deepenLevels(
  levels: Level[],
  useCases: Record<number, string>,
  pitfalls: Record<number, string>
): Level[] {
  return levels.map((level) => {
    const coreSections = level.sections.filter((item) => item.heading !== '拆题方式' && item.heading !== '通关检查')
    return {
      ...level,
      sections: [
        ...coreSections,
        note('真实工程里怎么用', useCases[level.id] ?? '这关不是孤立语法，而是后续项目结构、调试和协作的最小零件。'),
        note('本关最容易翻车的地方', pitfalls[level.id] ?? '别只追求测试通过。先确认入口、类型、输出和错误边界都说得清楚。'),
      ],
    }
  })
}

function branchMap(
  id: string,
  title: string,
  shortTitle: string,
  subtitle: string,
  description: string,
  accent: CourseMap['accent'],
  nodes: CourseNode[]
): CourseMap {
  return { id, title, shortTitle, subtitle, description, accent, nodes }
}

function createCLevels(): Level[] {
  return [
    staticLevel({
      id: 1,
      title: 'Hello, C',
      badge: '入口',
      icon: 'C',
      objective: '写出 main()，用 printf 输出 Hello, C!',
      starterCode: '',
      sections: [
        section('C 程序骨架', 'C 从 `main()` 函数进入。要输出文本，先引入 `stdio.h`，再调用 `printf()`。', '#include <stdio.h>\n\nint main(void) {\n    printf("Hello, C!\\n");\n    return 0;\n}', '先把骨架写完整，别上来就丢一句 printf。'),
      ],
      tests: [
        test('c1-include', '包含 stdio.h', includesAll(['#include <stdio.h>']), 'C 的 printf 来自 stdio.h。'),
        test('c1-main', '定义 main 函数', matches(/\bint\s+main\s*\(/), '入口函数需要是 `int main(...)`。'),
        test('c1-output', '输出 Hello, C!', includesAll(['printf', 'Hello, C!']), '用 `printf("Hello, C!\\n");` 精确输出目标文本。'),
      ],
    }),
    staticLevel({
      id: 2,
      title: '变量与格式化输出',
      badge: '类型',
      icon: 'C',
      objective: '定义 int age 和 double score，并用 printf 格式化输出。',
      starterCode: '',
      sections: [
        section('类型先行', 'C 是强类型语言。变量声明时就要说清楚类型，输出时格式符也要对得上。', '#include <stdio.h>\n\nint main(void) {\n    int age = 18;\n    double score = 96.5;\n    printf("age=%d score=%.1f\\n", age, score);\n    return 0;\n}'),
      ],
      tests: [
        test('c2-int', '声明 int age', matches(/\bint\s+age\s*=/), '需要 `int age = ...;`。'),
        test('c2-double', '声明 double score', matches(/\bdouble\s+score\s*=/), '需要 `double score = ...;`。'),
        test('c2-format', '使用 %d 和 %f 格式符', matches(/printf\s*\([\s\S]*%d[\s\S]*%(\.1)?f/), 'printf 的格式符要和变量类型对齐。'),
      ],
    }),
    staticLevel({
      id: 3,
      title: '条件判断',
      badge: '分支',
      icon: 'C',
      objective: '根据 temperature 判断 hot / cool。',
      starterCode: '',
      sections: [
        section('if / else', 'C 的条件判断用花括号包住代码块。条件必须放在括号里。', 'int temperature = 31;\n\nif (temperature >= 30) {\n    printf("hot\\n");\n} else {\n    printf("cool\\n");\n}'),
      ],
      tests: [
        test('c3-if', '使用 if 判断', matches(/\bif\s*\(/), '需要 `if (...)`。'),
        test('c3-else', '包含 else 分支', matches(/\belse\b/), '只写 if 不够，目标要覆盖 cool。'),
        test('c3-output', '输出 hot 和 cool', includesAll(['hot', 'cool']), '两个分支的输出文本都要出现。'),
      ],
    }),
    staticLevel({
      id: 4,
      title: '循环与数组',
      badge: '容器',
      icon: 'C',
      objective: '创建 int 数组，用 for 循环累计 sum。',
      starterCode: '',
      sections: [
        section('数组不是列表', 'C 数组大小固定，没有自动扩容。循环访问时别越界。', 'int numbers[] = {1, 2, 3, 4, 5};\nint sum = 0;\n\nfor (int i = 0; i < 5; i++) {\n    sum += numbers[i];\n}\nprintf("%d\\n", sum);'),
      ],
      tests: [
        test('c4-array', '声明 int 数组', matches(/\bint\s+\w+\s*\[\s*\]\s*=/), '需要一个 `int numbers[] = {...};`。'),
        test('c4-for', '使用 for 循环', matches(/\bfor\s*\(/), '用 for 遍历数组。'),
        test('c4-sum', '累计 sum', matches(/sum\s*\+=/), '需要把元素累加到 sum。'),
      ],
    }),
    staticLevel({
      id: 5,
      title: '函数拆分',
      badge: '函数',
      icon: 'C',
      objective: '定义 add(int a, int b) 并在 main 中调用。',
      starterCode: '',
      sections: [
        section('函数签名', 'C 函数需要返回类型、函数名和参数类型。调用前要保证编译器看得到定义或声明。', 'int add(int a, int b) {\n    return a + b;\n}\n\nint main(void) {\n    printf("%d\\n", add(2, 3));\n    return 0;\n}'),
      ],
      tests: [
        test('c5-add', '定义 add 函数', matches(/\bint\s+add\s*\(\s*int\s+\w+\s*,\s*int\s+\w+\s*\)/), '函数签名需要两个 int 参数。'),
        test('c5-return', '返回 a + b', matches(/\breturn\b[^;]*\+/), 'add 里要返回相加结果。'),
        test('c5-call', '调用 add', matches(/printf\s*\([\s\S]*add\s*\(/), '在 main 里调用 add 并输出。'),
      ],
    }),
    staticLevel({
      id: 6,
      title: '指针第一刀',
      badge: '内存',
      icon: 'C',
      objective: '使用 & 取地址，用 int* 指针读取变量。',
      starterCode: '',
      sections: [
        section('地址与解引用', '指针保存地址。`&value` 取地址，`*ptr` 读取地址里的值。别急着炫，先确认每个符号的含义。', 'int value = 42;\nint *ptr = &value;\nprintf("%d\\n", *ptr);'),
      ],
      tests: [
        test('c6-pointer', '声明 int 指针', matches(/\bint\s*\*\s*\w+/), '需要 `int *ptr`。'),
        test('c6-address', '使用 & 取地址', matches(/=\s*&\s*\w+/), '指针要保存变量地址。'),
        test('c6-deref', '使用 *ptr 解引用', matches(/printf\s*\([\s\S]*\*\s*\w+/), '输出时读取指针指向的值。'),
      ],
    }),
  ]
}

function createCppLevels(): Level[] {
  return [
    staticLevel({
      id: 1,
      title: 'Hello, C++',
      badge: '入口',
      icon: 'C++',
      objective: '用 iostream 和 std::cout 输出 Hello, C++!',
      starterCode: '',
      sections: [section('iostream 输出', 'C++ 可以用 `std::cout` 输出，`<<` 是流插入运算符。', '#include <iostream>\n\nint main() {\n    std::cout << "Hello, C++!" << std::endl;\n    return 0;\n}')],
      tests: [
        test('cpp1-iostream', '包含 iostream', includesAll(['#include <iostream>']), 'cout 来自 iostream。'),
        test('cpp1-cout', '使用 std::cout', includesAll(['std::cout', 'Hello, C++!']), '用 `std::cout << "Hello, C++!"`。'),
      ],
    }),
    staticLevel({
      id: 2,
      title: 'string 与 auto',
      badge: '类型',
      icon: 'C++',
      objective: '使用 std::string 保存名字，并用 auto 保存分数。',
      starterCode: '',
      sections: [section('现代 C++ 起手', '`std::string` 管理文本，`auto` 让编译器推断明显类型。', '#include <string>\n\nstd::string name = "Nexus";\nauto score = 95;\nstd::cout << name << ":" << score << std::endl;')],
      tests: [
        test('cpp2-string', '使用 std::string', matches(/std::string\s+\w+/), '需要 `std::string name`。'),
        test('cpp2-auto', '使用 auto', matches(/\bauto\s+\w+\s*=/), '用 auto 保存一个明显的数值。'),
        test('cpp2-cout', '输出变量', matches(/std::cout[\s\S]*<</), '把变量输出出来。'),
      ],
    }),
    staticLevel({
      id: 3,
      title: 'vector 与 range-for',
      badge: '容器',
      icon: 'C++',
      objective: '创建 vector<int>，用 range-for 累加总和。',
      starterCode: '',
      sections: [section('vector 是常用动态数组', '`std::vector` 会自动管理大小，比 C 数组更适合日常代码。', '#include <vector>\n\nstd::vector<int> nums = {1, 2, 3, 4};\nint sum = 0;\nfor (int n : nums) {\n    sum += n;\n}')],
      tests: [
        test('cpp3-vector', '使用 vector<int>', matches(/std::vector\s*<\s*int\s*>/), '需要 `std::vector<int>`。'),
        test('cpp3-range', '使用 range-for', matches(/for\s*\([^:]+:\s*\w+\s*\)/), '用 `for (int n : nums)`。'),
        test('cpp3-sum', '累计 sum', matches(/sum\s*\+=/), '把元素累加到 sum。'),
      ],
    }),
    staticLevel({
      id: 4,
      title: '函数与引用',
      badge: '函数',
      icon: 'C++',
      objective: '定义函数 total(const vector<int>& nums)。',
      starterCode: '',
      sections: [section('const 引用传参', '大对象传 `const &`，避免拷贝，也表达函数不会改它。', 'int total(const std::vector<int>& nums) {\n    int sum = 0;\n    for (int n : nums) sum += n;\n    return sum;\n}')],
      tests: [
        test('cpp4-ref', '使用 const 引用参数', matches(/const\s+std::vector\s*<\s*int\s*>\s*&/), '参数应为 `const std::vector<int>& nums`。'),
        test('cpp4-return', '返回 sum', matches(/\breturn\s+sum\s*;/), '函数要返回总和。'),
      ],
    }),
    staticLevel({
      id: 5,
      title: 'class 基础',
      badge: '对象',
      icon: 'C++',
      objective: '定义 Counter 类，包含 inc() 和 value()。',
      starterCode: '',
      sections: [section('类封装状态', '类把数据和操作放在一起。成员变量一般放 private，公开行为放 public。', 'class Counter {\nprivate:\n    int count = 0;\npublic:\n    void inc() { count++; }\n    int value() const { return count; }\n};')],
      tests: [
        test('cpp5-class', '定义 class Counter', matches(/class\s+Counter/), '需要 `class Counter`。'),
        test('cpp5-public', '包含 public 区域', matches(/\bpublic\s*:/), '对外方法放 public。'),
        test('cpp5-methods', '包含 inc 和 value', includesAll(['inc()', 'value()']), '需要 inc() 和 value() 方法。'),
      ],
    }),
    staticLevel({
      id: 6,
      title: 'RAII 思维',
      badge: '资源',
      icon: 'C++',
      objective: '使用 std::unique_ptr 管理动态对象。',
      starterCode: '',
      sections: [section('别手写 delete 上瘾', '现代 C++ 用智能指针表达资源所有权，少写裸 new/delete。', '#include <memory>\n\nauto ptr = std::make_unique<int>(42);\nstd::cout << *ptr << std::endl;')],
      tests: [
        test('cpp6-memory', '包含 memory', includesAll(['#include <memory>']), '智能指针在 memory 里。'),
        test('cpp6-unique', '使用 make_unique', matches(/std::make_unique\s*</), '用 `std::make_unique` 创建对象。'),
      ],
    }),
  ]
}

function createJavaLevels(): Level[] {
  return [
    staticLevel({
      id: 1,
      title: 'Hello, Java',
      badge: '入口',
      icon: 'J',
      objective: '写出 Main 类和 main 方法，输出 Hello, Java!',
      starterCode: '',
      sections: [section('Java 程序骨架', 'Java 入口是 `public static void main(String[] args)`。类名和文件名通常要对齐。', 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, Java!");\n    }\n}')],
      tests: [
        test('java1-class', '定义 Main 类', matches(/public\s+class\s+Main/), '需要 `public class Main`。'),
        test('java1-main', '定义 main 方法', matches(/public\s+static\s+void\s+main\s*\(\s*String\[\]\s+args\s*\)/), 'main 方法签名别写歪。'),
        test('java1-print', '输出 Hello, Java!', includesAll(['System.out.println', 'Hello, Java!']), '用 System.out.println 输出目标文本。'),
      ],
    }),
    staticLevel({
      id: 2,
      title: '类型与变量',
      badge: '类型',
      icon: 'J',
      objective: '声明 int age、double score、String name。',
      starterCode: '',
      sections: [section('变量声明', 'Java 类型写在变量名前。`String` 是类，首字母大写。', 'int age = 18;\ndouble score = 96.5;\nString name = "Nexus";')],
      tests: [
        test('java2-int', '声明 int age', matches(/\bint\s+age\s*=/), '需要 int age。'),
        test('java2-double', '声明 double score', matches(/\bdouble\s+score\s*=/), '需要 double score。'),
        test('java2-string', '声明 String name', matches(/\bString\s+name\s*=/), '需要 String name。'),
      ],
    }),
    staticLevel({
      id: 3,
      title: 'if / else',
      badge: '分支',
      icon: 'J',
      objective: '根据 score 输出 pass 或 retry。',
      starterCode: '',
      sections: [section('条件分支', 'Java 条件判断和 C 系语言类似，条件括号 + 花括号。', 'if (score >= 60) {\n    System.out.println("pass");\n} else {\n    System.out.println("retry");\n}')],
      tests: [
        test('java3-if', '使用 if', matches(/\bif\s*\(/), '需要 if 判断。'),
        test('java3-else', '包含 else', matches(/\belse\b/), '需要 else 分支。'),
        test('java3-output', '输出 pass 和 retry', includesAll(['pass', 'retry']), '两个输出都要出现。'),
      ],
    }),
    staticLevel({
      id: 4,
      title: 'ArrayList',
      badge: '容器',
      icon: 'J',
      objective: '创建 ArrayList<String> 并 add 三个名字。',
      starterCode: '',
      sections: [section('动态列表', '`ArrayList` 是 Java 常用动态数组，需要从 `java.util` 导入。', 'import java.util.ArrayList;\n\nArrayList<String> names = new ArrayList<>();\nnames.add("Ada");\nnames.add("Grace");\nnames.add("Linus");')],
      tests: [
        test('java4-import', '导入 ArrayList', includesAll(['import java.util.ArrayList']), '需要导入 ArrayList。'),
        test('java4-list', '创建 ArrayList<String>', matches(/ArrayList\s*<\s*String\s*>\s+\w+\s*=\s*new\s+ArrayList\s*<\s*>\s*\(/), '创建方式要完整。'),
        test('java4-add', '调用 add 至少三次', (_o, code) => (code.match(/\.add\s*\(/g) ?? []).length >= 3, '至少 add 三个元素。'),
      ],
    }),
    staticLevel({
      id: 5,
      title: '方法拆分',
      badge: '方法',
      icon: 'J',
      objective: '定义 static int add(int a, int b)。',
      starterCode: '',
      sections: [section('方法就是可复用动作', 'Java 方法需要写在类里。静态 main 调用静态方法最直接。', 'static int add(int a, int b) {\n    return a + b;\n}')],
      tests: [
        test('java5-method', '定义 static int add', matches(/static\s+int\s+add\s*\(\s*int\s+\w+\s*,\s*int\s+\w+\s*\)/), '需要 static int add(int a, int b)。'),
        test('java5-return', '返回相加结果', matches(/\breturn\b[^;]*\+/), '返回 a + b。'),
      ],
    }),
    staticLevel({
      id: 6,
      title: '对象建模',
      badge: '对象',
      icon: 'J',
      objective: '定义 User 类，包含 name 字段和构造方法。',
      starterCode: '',
      sections: [section('类是模型', '字段保存状态，构造方法初始化状态。', 'class User {\n    String name;\n\n    User(String name) {\n        this.name = name;\n    }\n}')],
      tests: [
        test('java6-class', '定义 User 类', matches(/class\s+User/), '需要 class User。'),
        test('java6-field', '包含 String name 字段', matches(/String\s+name\s*;/), '需要 name 字段。'),
        test('java6-constructor', '包含 User 构造方法', matches(/User\s*\(\s*String\s+name\s*\)/), '构造方法名和类名一致。'),
      ],
    }),
  ]
}

function createCSharpLevels(): Level[] {
  return [
    staticLevel({
      id: 1,
      title: 'Hello, C#',
      badge: '入口',
      icon: 'C#',
      objective: '写出 Main 方法，使用 Console.WriteLine 输出 Hello, C#!',
      starterCode: '',
      sections: [section('C# 控制台入口', 'C# 用 `Console.WriteLine` 输出。经典入口是 `static void Main()`。', 'using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, C#!");\n    }\n}')],
      tests: [
        test('cs1-system', '引用 System', includesAll(['using System']), 'Console 在 System 命名空间。'),
        test('cs1-main', '定义 Main', matches(/static\s+void\s+Main\s*\(/), '需要 static void Main。'),
        test('cs1-output', '输出 Hello, C#!', includesAll(['Console.WriteLine', 'Hello, C#!']), '输出文本要精确。'),
      ],
    }),
    staticLevel({
      id: 2,
      title: 'var 与强类型',
      badge: '类型',
      icon: 'C#',
      objective: '声明 string name、int age，并用 var 保存 active。',
      starterCode: '',
      sections: [section('清晰类型', 'C# 可以显式写类型，也可以用 `var` 让编译器推断。', 'string name = "Nexus";\nint age = 18;\nvar active = true;')],
      tests: [
        test('cs2-string', '声明 string name', matches(/string\s+name\s*=/), '需要 string name。'),
        test('cs2-int', '声明 int age', matches(/int\s+age\s*=/), '需要 int age。'),
        test('cs2-var', '使用 var', matches(/\bvar\s+active\s*=/), '用 var 保存 active。'),
      ],
    }),
    staticLevel({
      id: 3,
      title: '条件与模式',
      badge: '分支',
      icon: 'C#',
      objective: '根据 score 输出 Pass 或 Retry。',
      starterCode: '',
      sections: [section('if / else', 'C# 条件分支语法和 Java/C 类似，重点是表达清楚业务条件。', 'if (score >= 60) {\n    Console.WriteLine("Pass");\n} else {\n    Console.WriteLine("Retry");\n}')],
      tests: [
        test('cs3-if', '使用 if', matches(/\bif\s*\(/), '需要 if。'),
        test('cs3-else', '包含 else', matches(/\belse\b/), '需要 else。'),
        test('cs3-output', '输出 Pass 和 Retry', includesAll(['Pass', 'Retry']), '两个分支输出都要写。'),
      ],
    }),
    staticLevel({
      id: 4,
      title: 'List<T>',
      badge: '集合',
      icon: 'C#',
      objective: '创建 List<int>，用 foreach 累加 sum。',
      starterCode: '',
      sections: [section('泛型集合', '`List<T>` 是 C# 常用动态集合。遍历时 `foreach` 很干净。', 'using System.Collections.Generic;\n\nvar nums = new List<int> { 1, 2, 3 };\nint sum = 0;\nforeach (var n in nums) {\n    sum += n;\n}')],
      tests: [
        test('cs4-list', '使用 List<int>', matches(/List\s*<\s*int\s*>/), '需要 List<int>。'),
        test('cs4-foreach', '使用 foreach', matches(/\bforeach\s*\(/), '用 foreach 遍历。'),
        test('cs4-sum', '累计 sum', matches(/sum\s*\+=/), '把元素加进 sum。'),
      ],
    }),
    staticLevel({
      id: 5,
      title: '方法与表达式体',
      badge: '方法',
      icon: 'C#',
      objective: '定义 static int Add(int a, int b)。',
      starterCode: '',
      sections: [section('方法命名', 'C# 方法通常用 PascalCase。表达式体适合短函数。', 'static int Add(int a, int b) {\n    return a + b;\n}\n\nstatic int Mul(int a, int b) => a * b;')],
      tests: [
        test('cs5-method', '定义 Add 方法', matches(/static\s+int\s+Add\s*\(\s*int\s+\w+\s*,\s*int\s+\w+\s*\)/), '需要 static int Add(int a, int b)。'),
        test('cs5-return', '返回相加结果', matches(/\breturn\b[^;]*\+/), '返回 a + b。'),
      ],
    }),
    staticLevel({
      id: 6,
      title: '属性与类',
      badge: '对象',
      icon: 'C#',
      objective: '定义 User 类，包含 Name 自动属性。',
      starterCode: '',
      sections: [section('属性封装', 'C# 属性比裸字段更常用。`get; set;` 是自动属性。', 'class User {\n    public string Name { get; set; }\n\n    public User(string name) {\n        Name = name;\n    }\n}')],
      tests: [
        test('cs6-class', '定义 User 类', matches(/class\s+User/), '需要 class User。'),
        test('cs6-property', '包含 Name 属性', matches(/public\s+string\s+Name\s*{\s*get;\s*set;\s*}/), '需要自动属性 Name。'),
        test('cs6-constructor', '包含构造方法', matches(/public\s+User\s*\(\s*string\s+name\s*\)/), '构造方法用于初始化。'),
      ],
    }),
  ]
}

function createJavaScriptLevels(): Level[] {
  return [
    staticLevel({
      id: 1,
      title: 'Hello, JavaScript',
      badge: '入口',
      icon: 'JS',
      objective: '用 console.log 输出 Hello, JavaScript!',
      starterCode: '',
      sections: [section('控制台输出', 'JavaScript 最常见的第一步是 `console.log()`。浏览器和 Node 都能看到它。', 'console.log("Hello, JavaScript!");')],
      tests: [
        test('js1-log', '使用 console.log', matches(/console\.log\s*\(/), '需要 console.log。'),
        test('js1-output', '输出 Hello, JavaScript!', includesAll(['Hello, JavaScript!']), '文本要精确。'),
      ],
    }),
    staticLevel({
      id: 2,
      title: 'let / const',
      badge: '变量',
      icon: 'JS',
      objective: '用 const 保存 name，用 let 保存 score。',
      starterCode: '',
      sections: [section('变量策略', '`const` 表示绑定不再改，`let` 表示后续会变。别把 var 当祖传宝贝。', 'const name = "Nexus";\nlet score = 90;\nscore += 5;')],
      tests: [
        test('js2-const', '使用 const name', matches(/const\s+name\s*=/), '需要 const name。'),
        test('js2-let', '使用 let score', matches(/let\s+score\s*=/), '需要 let score。'),
      ],
    }),
    staticLevel({
      id: 3,
      title: '条件判断',
      badge: '分支',
      icon: 'JS',
      objective: '根据 score 输出 pass 或 retry。',
      starterCode: '',
      sections: [section('if / else', 'JS 条件判断语法简单，麻烦的是别让隐式类型转换坑你。', 'if (score >= 60) {\n  console.log("pass");\n} else {\n  console.log("retry");\n}')],
      tests: [
        test('js3-if', '使用 if', matches(/\bif\s*\(/), '需要 if。'),
        test('js3-else', '包含 else', matches(/\belse\b/), '需要 else。'),
        test('js3-output', '输出 pass 和 retry', includesAll(['pass', 'retry']), '两个结果都要出现。'),
      ],
    }),
    staticLevel({
      id: 4,
      title: '数组与 map',
      badge: '数组',
      icon: 'JS',
      objective: '创建数组 nums，用 map 得到 doubled。',
      starterCode: '',
      sections: [section('数组方法', '`map` 生成新数组，不要用它硬塞副作用。', 'const nums = [1, 2, 3];\nconst doubled = nums.map((n) => n * 2);\nconsole.log(doubled);')],
      tests: [
        test('js4-array', '创建数组', matches(/const\s+\w+\s*=\s*\[/), '需要数组。'),
        test('js4-map', '使用 map', matches(/\.map\s*\(/), '用 map 转换。'),
        test('js4-arrow', '使用箭头函数', matches(/=>/), '练一下箭头函数。'),
      ],
    }),
    staticLevel({
      id: 5,
      title: '函数与返回值',
      badge: '函数',
      icon: 'JS',
      objective: '定义 add(a, b)，返回 a + b。',
      starterCode: '',
      sections: [section('函数是模块边界', '小函数先保证输入输出清晰。', 'function add(a, b) {\n  return a + b;\n}\n\nconsole.log(add(2, 3));')],
      tests: [
        test('js5-function', '定义 add 函数', matches(/function\s+add\s*\(\s*\w+\s*,\s*\w+\s*\)/), '需要 function add(a, b)。'),
        test('js5-return', '返回相加结果', matches(/\breturn\b[^;]*\+/), '返回 a + b。'),
      ],
    }),
    staticLevel({
      id: 6,
      title: '异步入口',
      badge: '异步',
      icon: 'JS',
      objective: '定义 async function loadData()，使用 await fetch()。',
      starterCode: '',
      sections: [section('async / await', '现代 JS 处理网络请求离不开 async/await。先会读流程，再谈封装。', 'async function loadData() {\n  const response = await fetch("/api/items");\n  const data = await response.json();\n  return data;\n}')],
      tests: [
        test('js6-async', '定义 async function', matches(/async\s+function\s+loadData\s*\(/), '需要 async function loadData。'),
        test('js6-await', '使用 await', matches(/\bawait\b/), '需要 await。'),
        test('js6-fetch', '调用 fetch', matches(/\bfetch\s*\(/), '需要 fetch。'),
      ],
    }),
  ]
}

function createVisualBasicLevels(): Level[] {
  return [
    staticLevel({
      id: 1,
      title: 'Hello, Visual Basic',
      badge: '入口',
      icon: 'VB',
      objective: '写出 Module Program 和 Sub Main，输出 Hello, Visual Basic!',
      starterCode: '',
      sections: [section('VB 控制台入口', 'Visual Basic 用 `Module` 包住入口，`Console.WriteLine` 输出。', 'Module Program\n    Sub Main()\n        Console.WriteLine("Hello, Visual Basic!")\n    End Sub\nEnd Module')],
      tests: [
        test('vb1-module', '定义 Module', matches(/Module\s+Program/i), '需要 Module Program。'),
        test('vb1-main', '定义 Sub Main', matches(/Sub\s+Main\s*\(\s*\)/i), '需要 Sub Main()。'),
        test('vb1-output', '输出 Hello, Visual Basic!', includesAll(['Console.WriteLine', 'Hello, Visual Basic!']), '输出目标文本。'),
      ],
    }),
    staticLevel({
      id: 2,
      title: 'Dim 与类型',
      badge: '类型',
      icon: 'VB',
      objective: '使用 Dim 声明 name As String 和 age As Integer。',
      starterCode: '',
      sections: [section('变量声明', 'VB 用 `Dim name As String` 声明变量，读起来接近英文。', 'Dim name As String = "Nexus"\nDim age As Integer = 18')],
      tests: [
        test('vb2-string', '声明 String', matches(/Dim\s+name\s+As\s+String/i), '需要 Dim name As String。'),
        test('vb2-int', '声明 Integer', matches(/Dim\s+age\s+As\s+Integer/i), '需要 Dim age As Integer。'),
      ],
    }),
    staticLevel({
      id: 3,
      title: 'If / Else',
      badge: '分支',
      icon: 'VB',
      objective: '根据 score 输出 Pass 或 Retry。',
      starterCode: '',
      sections: [section('块结构', 'VB 的块结构用 `End If` 收尾，不靠花括号。', 'If score >= 60 Then\n    Console.WriteLine("Pass")\nElse\n    Console.WriteLine("Retry")\nEnd If')],
      tests: [
        test('vb3-if', '使用 If Then', matches(/If[\s\S]+Then/i), '需要 If ... Then。'),
        test('vb3-else', '包含 Else', matches(/\bElse\b/i), '需要 Else。'),
        test('vb3-end', '使用 End If', matches(/End\s+If/i), '别忘了 End If。'),
      ],
    }),
    staticLevel({
      id: 4,
      title: '数组与 For Each',
      badge: '集合',
      icon: 'VB',
      objective: '创建数组 nums，用 For Each 累加 sum。',
      starterCode: '',
      sections: [section('For Each', '遍历集合时 `For Each item In collection` 比索引更清楚。', 'Dim nums() As Integer = {1, 2, 3}\nDim sum As Integer = 0\nFor Each n In nums\n    sum += n\nNext')],
      tests: [
        test('vb4-array', '声明 Integer 数组', matches(/Dim\s+\w+\(\)\s+As\s+Integer/i), '需要 Integer 数组。'),
        test('vb4-foreach', '使用 For Each', matches(/For\s+Each\s+\w+\s+In/i), '用 For Each 遍历。'),
        test('vb4-sum', '累计 sum', matches(/sum\s*\+=/i), '把元素加进 sum。'),
      ],
    }),
    staticLevel({
      id: 5,
      title: 'Function',
      badge: '函数',
      icon: 'VB',
      objective: '定义 Function Add(a As Integer, b As Integer) As Integer。',
      starterCode: '',
      sections: [section('函数返回值', 'VB 函数用 `Function` 开始，`End Function` 结束，返回类型写在末尾。', 'Function Add(a As Integer, b As Integer) As Integer\n    Return a + b\nEnd Function')],
      tests: [
        test('vb5-function', '定义 Add 函数', matches(/Function\s+Add\s*\(\s*\w+\s+As\s+Integer\s*,\s*\w+\s+As\s+Integer\s*\)\s+As\s+Integer/i), '函数签名要完整。'),
        test('vb5-return', '返回相加结果', matches(/Return[\s\S]*\+/i), '返回 a + b。'),
        test('vb5-end', '使用 End Function', matches(/End\s+Function/i), '别忘 End Function。'),
      ],
    }),
    staticLevel({
      id: 6,
      title: 'Class 基础',
      badge: '对象',
      icon: 'VB',
      objective: '定义 User 类，包含 Name 属性。',
      starterCode: '',
      sections: [section('类与属性', 'VB 的属性语法很直接，适合做桌面和业务系统模型。', 'Public Class User\n    Public Property Name As String\n\n    Public Sub New(name As String)\n        Me.Name = name\n    End Sub\nEnd Class')],
      tests: [
        test('vb6-class', '定义 User 类', matches(/Class\s+User/i), '需要 Class User。'),
        test('vb6-property', '包含 Name 属性', matches(/Property\s+Name\s+As\s+String/i), '需要 Name 属性。'),
        test('vb6-constructor', '包含 Sub New', matches(/Sub\s+New\s*\(/i), '构造方法是 Sub New。'),
      ],
    }),
  ]
}

function createCAdvancedLevels(): Level[] {
  return [
    staticLevel({
      id: 7,
      title: '字符串与字符数组',
      badge: '文本内存',
      icon: 'C',
      objective: '声明 char name[]，用 strlen 计算长度并打印。',
      starterCode: '',
      sections: richSections({
        heading: 'C 字符串不是对象',
        body: 'C 字符串本质是以 `\\0` 结尾的字符数组。你处理的是内存里的连续字节，不是带方法的高级文本对象。',
        code: '#include <stdio.h>\n#include <string.h>\n\nint main(void) {\n    char name[] = "Nexus";\n    printf("%zu\\n", strlen(name));\n    return 0;\n}',
        model: '`name` 是一段字符内存，`strlen` 会一路数到结尾标记。理解这个，后面读文件、处理协议、解析命令行才不会乱。',
        practice: '先固定一个短字符串，打印长度；再试着换成你的代号。',
        pitfall: '数组容量和字符串长度不是一回事。`char name[5] = "Nexus"` 会少放结尾 `\\0`，这是 C 新手常见事故。',
      }),
      tests: [
        test('c7-char-array', '声明 char 数组', matches(/char\s+\w+\s*\[\s*\]/), '需要 `char name[] = ...`。'),
        test('c7-string-h', '包含 string.h', includesAll(['#include <string.h>']), 'strlen 来自 string.h。'),
        test('c7-strlen', '使用 strlen', matches(/strlen\s*\(/), '需要调用 strlen。'),
      ],
    }),
    staticLevel({
      id: 8,
      title: '结构体建模',
      badge: '数据模型',
      icon: 'C',
      objective: '定义 struct Sensor，保存 id 和 value，并打印字段。',
      starterCode: '',
      sections: richSections({
        heading: 'struct 把相关数据绑在一起',
        body: '`struct` 是 C 里做数据模型的核心。传感器、日志行、配置项、网络包，都可以先被建成结构体。',
        code: '#include <stdio.h>\n\nstruct Sensor {\n    int id;\n    double value;\n};\n\nint main(void) {\n    struct Sensor sensor = { 7, 23.5 };\n    printf("%d %.1f\\n", sensor.id, sensor.value);\n    return 0;\n}',
        model: '结构体不是行为中心，它更像一张固定字段的小表。字段清楚，函数才知道自己要处理什么。',
        practice: '先写 `id` 和 `value` 两个字段，再初始化一个变量并输出。',
        pitfall: 'C 里使用结构体类型通常要写 `struct Sensor`，除非你额外 `typedef`。别把 C++ 的写法直接搬过来。',
      }),
      tests: [
        test('c8-struct', '定义 struct Sensor', matches(/struct\s+Sensor/), '需要 struct Sensor。'),
        test('c8-fields', '包含 id 和 value 字段', includesAll(['id', 'value']), '结构体里要有 id 和 value。'),
        test('c8-dot', '用点号访问字段', matches(/\w+\.(id|value)/), '用 `sensor.id` 或 `sensor.value` 访问字段。'),
      ],
    }),
    staticLevel({
      id: 9,
      title: '文件读取入口',
      badge: 'I/O',
      icon: 'C',
      objective: '使用 fopen / fgets / fclose 读取一行文本。',
      starterCode: '',
      sections: richSections({
        heading: '文件 I/O 是系统程序的日常',
        body: 'C 读文件要自己打开、检查、读取、关闭。这个流程看着啰嗦，但它逼你面对资源生命周期。',
        code: '#include <stdio.h>\n\nint main(void) {\n    char line[128];\n    FILE *file = fopen("data.txt", "r");\n    if (file == NULL) {\n        return 1;\n    }\n    fgets(line, sizeof(line), file);\n    printf("%s", line);\n    fclose(file);\n    return 0;\n}',
        model: '`FILE *` 是文件句柄。拿到资源以后，任何提前退出路径都要想清楚怎么收尾。',
        practice: '先写完整打开和关闭，再加读取逻辑。顺序比炫技重要。',
        pitfall: '不检查 `fopen` 返回值就直接 `fgets`，文件不存在时程序会直接翻车。',
      }),
      tests: [
        test('c9-fopen', '使用 fopen', matches(/fopen\s*\(/), '需要 fopen。'),
        test('c9-fgets', '使用 fgets', matches(/fgets\s*\(/), '需要 fgets。'),
        test('c9-fclose', '关闭文件', matches(/fclose\s*\(/), '打开文件后要 fclose。'),
      ],
    }),
    staticLevel({
      id: 10,
      title: '动态内存',
      badge: '堆内存',
      icon: 'C',
      objective: '使用 malloc 创建 int 数组，写入数据后 free。',
      starterCode: '',
      sections: richSections({
        heading: '堆内存必须借了就还',
        body: '`malloc` 给你一段运行时申请的内存，`free` 负责归还。C 不会替你擦屁股，这也是它强大的代价。',
        code: '#include <stdlib.h>\n\nint *nums = malloc(sizeof(int) * 3);\nif (nums != NULL) {\n    nums[0] = 10;\n    nums[1] = 20;\n    nums[2] = 30;\n    free(nums);\n}',
        model: '栈上数组适合固定小数据；堆内存适合运行时才知道大小的数据。',
        practice: '申请 3 个 int，写入至少一个值，最后 free。',
        pitfall: '忘记 `free` 是泄漏；free 后继续使用是悬空指针。两个都不是小问题。',
      }),
      tests: [
        test('c10-malloc', '使用 malloc', matches(/malloc\s*\(/), '需要 malloc。'),
        test('c10-sizeof', '使用 sizeof', matches(/sizeof\s*\(/), '用 sizeof 计算空间。'),
        test('c10-free', '使用 free', matches(/free\s*\(/), '申请后要 free。'),
      ],
    }),
    staticLevel({
      id: 11,
      title: '错误码与早返回',
      badge: '可靠性',
      icon: 'C',
      objective: '写 validate(int value)，非法时返回 -1，合法时返回 0。',
      starterCode: '',
      sections: richSections({
        heading: 'C 常用错误码表达失败',
        body: '没有异常机制时，函数返回值就承担了成功/失败信号。系统 API、驱动、嵌入式代码大量使用这种模式。',
        code: 'int validate(int value) {\n    if (value < 0) {\n        return -1;\n    }\n    return 0;\n}',
        model: '先处理坏情况，尽早返回；正常路径保持干净。这是 C 代码可读性的关键技巧。',
        practice: '写一个 `validate`，负数返回 -1，其他返回 0。',
        pitfall: '错误码没约定清楚，调用者就只能猜。函数名、返回值、注释至少要有一个说清楚语义。',
      }),
      tests: [
        test('c11-validate', '定义 validate 函数', matches(/int\s+validate\s*\(\s*int\s+\w+\s*\)/), '需要 int validate(int value)。'),
        test('c11-negative', '非法返回 -1', matches(/return\s+-1\s*;/), '非法时返回 -1。'),
        test('c11-ok', '合法返回 0', matches(/return\s+0\s*;/), '合法时返回 0。'),
      ],
    }),
    staticLevel({
      id: 12,
      title: '迷你命令行工具',
      badge: '整合',
      icon: 'C',
      objective: '读取 argc / argv，判断是否传入 name 参数并输出问候。',
      starterCode: '',
      sections: richSections({
        heading: '命令行参数让程序能被脚本调用',
        body: 'C 程序不只是在 IDE 里跑。`argc` 和 `argv` 让它接收外部输入，变成真正的命令行工具。',
        code: '#include <stdio.h>\n\nint main(int argc, char *argv[]) {\n    if (argc < 2) {\n        printf("usage: hello <name>\\n");\n        return 1;\n    }\n    printf("Hello, %s!\\n", argv[1]);\n    return 0;\n}',
        model: '`argc` 是参数个数，`argv` 是参数列表。先检查数量，再读取内容。',
        practice: '写出 main 的参数形式，检查 `argc < 2`，再输出 `argv[1]`。',
        pitfall: '直接读 `argv[1]` 但用户没传参数，会访问不存在的位置。真实工具第一步永远是输入校验。',
      }),
      tests: [
        test('c12-argc', 'main 接收 argc', matches(/main\s*\(\s*int\s+argc/), 'main 需要 argc。'),
        test('c12-argv', 'main 接收 argv', matches(/char\s*\*\s*argv\s*\[\s*\]/), 'main 需要 argv。'),
        test('c12-check', '检查参数数量', matches(/argc\s*<\s*2/), '先检查 argc。'),
      ],
    }),
  ]
}

function createCppAdvancedLevels(): Level[] {
  return [
    staticLevel({
      id: 7,
      title: 'algorithm 算法库',
      badge: '算法',
      icon: 'C++',
      objective: '使用 std::sort 排序 vector，并用 std::find 查找目标值。',
      starterCode: '',
      sections: richSections({
        heading: 'STL 算法让循环少一点',
        body: '现代 C++ 不是什么都手写 for。排序、查找、统计这些常见动作，优先考虑 `<algorithm>`。',
        code: '#include <algorithm>\n#include <vector>\n\nstd::vector<int> nums = {4, 1, 3};\nstd::sort(nums.begin(), nums.end());\nauto it = std::find(nums.begin(), nums.end(), 3);',
        model: '容器负责存数据，算法负责操作数据，迭代器把两者接起来。',
        practice: '先排序，再查找一个数字。不要自己写冒泡排序折磨电脑。',
        pitfall: '`sort` 需要 begin/end 范围。范围写错，算法不会替你猜边界。',
      }),
      tests: [
        test('cpp7-algorithm', '包含 algorithm', includesAll(['#include <algorithm>']), '需要 algorithm。'),
        test('cpp7-sort', '使用 std::sort', matches(/std::sort\s*\(/), '需要 std::sort。'),
        test('cpp7-find', '使用 std::find', matches(/std::find\s*\(/), '需要 std::find。'),
      ],
    }),
    staticLevel({
      id: 8,
      title: 'map 频次统计',
      badge: '映射',
      icon: 'C++',
      objective: '使用 std::map<std::string, int> 统计单词出现次数。',
      starterCode: '',
      sections: richSections({
        heading: 'map 适合做索引和统计',
        body: '日志分类、物品库存、词频统计，都可以抽象成 key 到 value 的映射。',
        code: '#include <map>\n#include <string>\n\nstd::map<std::string, int> counts;\ncounts["error"]++;\ncounts["warn"]++;\ncounts["error"]++;',
        model: '`counts[word]++` 会在 key 不存在时创建默认值 0，再加一。',
        practice: '创建 map，至少对一个 key 累加两次。',
        pitfall: '`operator[]` 会创建元素。只想检查是否存在时，优先想想 `find`。',
      }),
      tests: [
        test('cpp8-map', '使用 map<string, int>', matches(/std::map\s*<\s*std::string\s*,\s*int\s*>/), '需要 std::map<std::string, int>。'),
        test('cpp8-increment', '递增计数', matches(/\[[^\]]+\]\s*\+\+/), '用 counts[key]++ 计数。'),
      ],
    }),
    staticLevel({
      id: 9,
      title: '异常与边界',
      badge: '错误',
      icon: 'C++',
      objective: '使用 try / catch 捕获 std::runtime_error。',
      starterCode: '',
      sections: richSections({
        heading: '异常适合表达无法继续的错误',
        body: 'C++ 里异常不是到处乱扔的烟花。它适合跨层传递“这里无法继续”的错误。',
        code: '#include <stdexcept>\n\ntry {\n    throw std::runtime_error("bad input");\n} catch (const std::runtime_error& err) {\n    std::cout << err.what() << std::endl;\n}',
        model: '`throw` 抛出错误，`catch` 接住错误。引用捕获能避免不必要拷贝。',
        practice: '抛出 runtime_error，用 const 引用 catch，并输出 what()。',
        pitfall: '不要用异常替代普通 if。输入校验能就地处理，就别让错误飞半个项目。',
      }),
      tests: [
        test('cpp9-try', '使用 try', matches(/\btry\s*{/), '需要 try 块。'),
        test('cpp9-catch', '使用 catch', matches(/\bcatch\s*\(/), '需要 catch。'),
        test('cpp9-runtime', '使用 runtime_error', includesAll(['runtime_error']), '使用 std::runtime_error。'),
      ],
    }),
    staticLevel({
      id: 10,
      title: '模板函数',
      badge: '泛型',
      icon: 'C++',
      objective: '定义 template<typename T> T maxValue(T a, T b)。',
      starterCode: '',
      sections: richSections({
        heading: '模板把类型留到编译期决定',
        body: 'C++ 模板让同一套逻辑适配多种类型。容器、算法、智能指针背后都是这个思路。',
        code: 'template <typename T>\nT maxValue(T a, T b) {\n    return a > b ? a : b;\n}',
        model: '`T` 是类型参数。编译器会根据调用时传入的类型生成对应代码。',
        practice: '写一个比较两个值并返回较大值的模板函数。',
        pitfall: '模板不是万能胶。操作符 `>` 对传入类型必须有意义，否则编译期会给你上一课。',
      }),
      tests: [
        test('cpp10-template', '使用 template', matches(/template\s*<\s*typename\s+\w+\s*>/), '需要 template<typename T>。'),
        test('cpp10-function', '定义 maxValue', matches(/\w+\s+maxValue\s*\(/), '需要 maxValue 函数。'),
        test('cpp10-return', '返回比较结果', matches(/return[\s\S]*\?/), '可以使用三元表达式返回较大值。'),
      ],
    }),
    staticLevel({
      id: 11,
      title: '文件流',
      badge: 'I/O',
      icon: 'C++',
      objective: '使用 std::ifstream 读取文件，并检查 is_open()。',
      starterCode: '',
      sections: richSections({
        heading: 'fstream 是 C++ 的文件入口',
        body: 'C++ 文件流把资源生命周期包装得更干净，但你仍然要检查文件是否打开成功。',
        code: '#include <fstream>\n#include <string>\n\nstd::ifstream file("data.txt");\nif (file.is_open()) {\n    std::string line;\n    std::getline(file, line);\n}',
        model: '流对象负责打开和关闭，RAII 会在对象生命周期结束时释放资源。',
        practice: '创建 ifstream，检查 is_open，再 getline。',
        pitfall: '别默认文件一定存在。真实路径、工作目录、权限都会让读取失败。',
      }),
      tests: [
        test('cpp11-fstream', '包含 fstream', includesAll(['#include <fstream>']), '需要 fstream。'),
        test('cpp11-ifstream', '使用 ifstream', matches(/std::ifstream\s+\w+/), '需要 std::ifstream。'),
        test('cpp11-open', '检查 is_open', matches(/\.is_open\s*\(/), '需要检查 is_open。'),
      ],
    }),
    staticLevel({
      id: 12,
      title: '库存小模块',
      badge: '整合',
      icon: 'C++',
      objective: '定义 Item 结构体和 vector<Item>，用函数计算库存总价值。',
      starterCode: '',
      sections: richSections({
        heading: '把容器、结构体、函数连起来',
        body: 'C++ 真正的日常不是写单个语法点，而是把数据模型、容器和算法组合成小模块。',
        code: 'struct Item {\n    std::string name;\n    double price;\n    int count;\n};\n\ndouble totalValue(const std::vector<Item>& items) {\n    double total = 0;\n    for (const auto& item : items) total += item.price * item.count;\n    return total;\n}',
        model: 'Item 表达数据，vector 保存集合，函数表达业务规则。',
        practice: '先定义结构体，再写 const 引用参数的 totalValue。',
        pitfall: '对象集合传参别随手拷贝。`const std::vector<Item>&` 是这里的合理边界。',
      }),
      tests: [
        test('cpp12-item', '定义 Item 结构体', matches(/struct\s+Item/), '需要 struct Item。'),
        test('cpp12-vector', '使用 vector<Item>', matches(/std::vector\s*<\s*Item\s*>/), '需要 vector<Item>。'),
        test('cpp12-total', '定义 totalValue', matches(/totalValue\s*\(/), '需要 totalValue 函数。'),
      ],
    }),
  ]
}

function createJavaAdvancedLevels(): Level[] {
  return [
    staticLevel({
      id: 7,
      title: 'Scanner 输入',
      badge: '输入',
      icon: 'J',
      objective: '使用 Scanner 读取 name，并输出欢迎语。',
      starterCode: '',
      sections: richSections({
        heading: 'Java 控制台输入',
        body: '`Scanner` 是 Java 入门阶段最直接的输入工具。它让程序不再只会打印固定文本，而能响应用户输入。',
        code: 'import java.util.Scanner;\n\nScanner scanner = new Scanner(System.in);\nString name = scanner.nextLine();\nSystem.out.println("Hello, " + name);',
        model: '`System.in` 是输入流，Scanner 负责把原始输入解析成字符串、数字等数据。',
        practice: '导入 Scanner，创建对象，读取一行，再输出。',
        pitfall: '`nextInt()` 后接 `nextLine()` 常会读到残留换行。先用 nextLine 练稳，再处理复杂输入。',
      }),
      tests: [
        test('java7-scanner-import', '导入 Scanner', includesAll(['import java.util.Scanner']), '需要导入 Scanner。'),
        test('java7-scanner', '创建 Scanner', matches(/new\s+Scanner\s*\(\s*System\.in\s*\)/), '需要 new Scanner(System.in)。'),
        test('java7-nextline', '读取 nextLine', matches(/\.nextLine\s*\(/), '用 nextLine 读取名字。'),
      ],
    }),
    staticLevel({
      id: 8,
      title: '封装与 getter',
      badge: '封装',
      icon: 'J',
      objective: '定义 private name 字段，并提供 getName()。',
      starterCode: '',
      sections: richSections({
        heading: 'Java 不喜欢把字段裸奔给外面',
        body: '封装不是摆架子，而是让对象状态有明确边界。字段 private，对外暴露必要方法。',
        code: 'class User {\n    private String name;\n\n    User(String name) {\n        this.name = name;\n    }\n\n    String getName() {\n        return name;\n    }\n}',
        model: '字段保存状态，方法定义外界能怎么读或改状态。',
        practice: '把 name 改成 private，再写 getName 返回它。',
        pitfall: '所有字段 public 看着省事，项目一大就会变成全员都能乱改状态。',
      }),
      tests: [
        test('java8-private', 'private String name', matches(/private\s+String\s+name\s*;/), '字段要 private。'),
        test('java8-getter', '定义 getName', matches(/String\s+getName\s*\(\s*\)/), '需要 getName。'),
        test('java8-return', '返回 name', matches(/return\s+name\s*;/), 'getName 返回 name。'),
      ],
    }),
    staticLevel({
      id: 9,
      title: '接口思维',
      badge: '抽象',
      icon: 'J',
      objective: '定义 Notifier 接口，并让 EmailNotifier implements 它。',
      starterCode: '',
      sections: richSections({
        heading: '接口定义能力，不定义细节',
        body: 'Java 大型工程里，接口负责约定“能做什么”。具体类负责“怎么做”。这就是后端服务解耦的基本功。',
        code: 'interface Notifier {\n    void send(String message);\n}\n\nclass EmailNotifier implements Notifier {\n    public void send(String message) {\n        System.out.println(message);\n    }\n}',
        model: '调用者依赖接口，运行时可以换成 Email、SMS、Webhook 等不同实现。',
        practice: '先写 interface，再写一个 implements 的类。',
        pitfall: '接口不是为了显得高级。只有当你真的需要多个实现或隔离依赖时，它才有价值。',
      }),
      tests: [
        test('java9-interface', '定义 Notifier 接口', matches(/interface\s+Notifier/), '需要 interface Notifier。'),
        test('java9-method', '接口包含 send', matches(/void\s+send\s*\(\s*String\s+\w+\s*\)/), '接口里声明 send。'),
        test('java9-implements', '类 implements Notifier', matches(/implements\s+Notifier/), '实现类要 implements Notifier。'),
      ],
    }),
    staticLevel({
      id: 10,
      title: '异常处理',
      badge: '错误',
      icon: 'J',
      objective: '使用 try / catch 捕获 NumberFormatException。',
      starterCode: '',
      sections: richSections({
        heading: '输入永远可能不按剧本走',
        body: 'Java 后端和 Android 都会遇到外部输入。把字符串转数字时，要准备好处理异常。',
        code: 'try {\n    int age = Integer.parseInt(input);\n    System.out.println(age);\n} catch (NumberFormatException error) {\n    System.out.println("invalid number");\n}',
        model: 'try 放可能失败的代码，catch 放失败后的处理策略。',
        practice: '用 Integer.parseInt 包在 try 里，catch NumberFormatException。',
        pitfall: 'catch 之后什么都不做，是把 bug 藏起来。至少输出、记录或返回明确状态。',
      }),
      tests: [
        test('java10-try', '使用 try', matches(/\btry\s*{/), '需要 try。'),
        test('java10-catch', 'catch NumberFormatException', matches(/catch\s*\(\s*NumberFormatException/), '需要捕获 NumberFormatException。'),
        test('java10-parse', '使用 parseInt', matches(/Integer\.parseInt\s*\(/), '需要 Integer.parseInt。'),
      ],
    }),
    staticLevel({
      id: 11,
      title: 'Stream 过滤',
      badge: '数据流',
      icon: 'J',
      objective: '使用 stream().filter().toList() 筛选及格分数。',
      starterCode: '',
      sections: richSections({
        heading: 'Stream 是集合处理流水线',
        body: 'Java Stream 适合把筛选、转换、汇总写成清晰的数据管道。后端处理列表结果时非常常见。',
        code: 'List<Integer> scores = List.of(55, 80, 92);\nList<Integer> passed = scores.stream()\n    .filter(score -> score >= 60)\n    .toList();',
        model: '数据从集合进入 stream，经过 filter，最后收集成结果。',
        practice: '创建分数列表，用 lambda 过滤 >= 60。',
        pitfall: 'Stream 不等于性能魔法。它先解决表达清晰，再考虑并行和性能。',
      }),
      tests: [
        test('java11-stream', '使用 stream', matches(/\.stream\s*\(\s*\)/), '需要 stream。'),
        test('java11-filter', '使用 filter', matches(/\.filter\s*\(/), '需要 filter。'),
        test('java11-lambda', '使用 lambda', matches(/->/), '用 lambda 写条件。'),
      ],
    }),
    staticLevel({
      id: 12,
      title: '订单服务小模块',
      badge: '整合',
      icon: 'J',
      objective: '定义 Order 类和 OrderService，提供 total(Order order) 方法。',
      starterCode: '',
      sections: richSections({
        heading: 'Java 的强项是可维护业务模型',
        body: '企业系统不是靠一堆散落变量活着。类表达数据，Service 表达业务规则。',
        code: 'class Order {\n    double price;\n    int count;\n\n    Order(double price, int count) {\n        this.price = price;\n        this.count = count;\n    }\n}\n\nclass OrderService {\n    double total(Order order) {\n        return order.price * order.count;\n    }\n}',
        model: 'Order 是状态，OrderService 是行为边界。后面接 Spring 时也是这个思路。',
        practice: '先建 Order，再建 OrderService，最后写 total。',
        pitfall: '别把所有代码塞进 main。main 是入口，不是业务垃圾桶。',
      }),
      tests: [
        test('java12-order', '定义 Order 类', matches(/class\s+Order/), '需要 Order 类。'),
        test('java12-service', '定义 OrderService', matches(/class\s+OrderService/), '需要 OrderService。'),
        test('java12-total', '提供 total 方法', matches(/total\s*\(\s*Order\s+\w+\s*\)/), '需要 total(Order order)。'),
      ],
    }),
  ]
}

function createCSharpAdvancedLevels(): Level[] {
  return [
    staticLevel({
      id: 7,
      title: '字符串插值',
      badge: '文本',
      icon: 'C#',
      objective: '使用 $"..." 输出 name 和 score。',
      starterCode: '',
      sections: richSections({
        heading: 'C# 字符串插值很适合写清楚输出',
        body: '`$"..."` 让变量直接进入字符串。日志、UI 文案、调试输出都会用到它。',
        code: 'string name = "Mika";\nint score = 95;\nConsole.WriteLine($"{name}: {score}");',
        model: '字符串是模板，花括号里放表达式，运行时生成最终文本。',
        practice: '创建 name 和 score，用插值输出。',
        pitfall: '忘记 `$`，花括号就会原样输出。这个错非常隐蔽。',
      }),
      tests: [
        test('cs7-interpolation', '使用字符串插值', matches(/\$"/), '需要 $"..."。'),
        test('cs7-name', '包含 name', matches(/string\s+name\s*=/), '需要 name。'),
        test('cs7-score', '包含 score', matches(/score/), '需要 score。'),
      ],
    }),
    staticLevel({
      id: 8,
      title: '枚举与 switch',
      badge: '状态',
      icon: 'C#',
      objective: '定义 enum Status，并用 switch 判断状态。',
      starterCode: '',
      sections: richSections({
        heading: 'enum 让状态不再靠魔法字符串',
        body: '订单状态、角色权限、游戏阶段都适合用 enum。它让可选值有边界。',
        code: 'enum Status { Draft, Published, Archived }\n\nStatus status = Status.Published;\nswitch (status) {\n    case Status.Published:\n        Console.WriteLine("live");\n        break;\n}',
        model: 'enum 定义状态集合，switch 根据状态分派逻辑。',
        practice: '写 enum，再用 switch 处理一个状态。',
        pitfall: '用字符串表示状态容易拼错。enum 的价值就是把拼写错误变成编译期问题。',
      }),
      tests: [
        test('cs8-enum', '定义 enum Status', matches(/enum\s+Status/), '需要 enum Status。'),
        test('cs8-switch', '使用 switch', matches(/\bswitch\s*\(/), '需要 switch。'),
        test('cs8-case', '包含 case', matches(/\bcase\s+Status\./), 'case 使用枚举值。'),
      ],
    }),
    staticLevel({
      id: 9,
      title: 'LINQ 筛选',
      badge: '查询',
      icon: 'C#',
      objective: '使用 Where 和 ToList 筛选大于 60 的分数。',
      starterCode: '',
      sections: richSections({
        heading: 'LINQ 是 C# 处理集合的招牌能力',
        body: 'C# 在业务系统里经常处理列表、查询和过滤。LINQ 能把集合处理写得像查询。',
        code: 'var scores = new List<int> { 55, 70, 96 };\nvar passed = scores.Where(score => score >= 60).ToList();',
        model: '集合进入 Where，lambda 表达条件，ToList 生成结果。',
        practice: '创建 List<int>，用 Where 过滤。',
        pitfall: 'LINQ 默认延迟执行。需要立刻拿结果时用 ToList，不然你可能以为代码已经跑了。',
      }),
      tests: [
        test('cs9-where', '使用 Where', matches(/\.Where\s*\(/), '需要 Where。'),
        test('cs9-lambda', '使用 lambda', matches(/=>/), 'Where 里用 lambda。'),
        test('cs9-tolist', '使用 ToList', matches(/\.ToList\s*\(/), '需要 ToList。'),
      ],
    }),
    staticLevel({
      id: 10,
      title: '异常与防线',
      badge: '错误',
      icon: 'C#',
      objective: '使用 try / catch 捕获 FormatException。',
      starterCode: '',
      sections: richSections({
        heading: '用户输入不能盲信',
        body: '桌面、Web、Unity 输入框都可能传来坏数据。解析数字时要准备失败路径。',
        code: 'try {\n    int age = int.Parse(input);\n    Console.WriteLine(age);\n} catch (FormatException) {\n    Console.WriteLine("invalid");\n}',
        model: 'try 尝试危险操作，catch 给用户或日志一个明确反馈。',
        practice: '用 int.Parse 放进 try，再 catch FormatException。',
        pitfall: '真实项目更常用 TryParse。异常适合少见失败，不适合高频校验。',
      }),
      tests: [
        test('cs10-try', '使用 try', matches(/\btry\s*{/), '需要 try。'),
        test('cs10-catch', '捕获 FormatException', matches(/catch\s*\(\s*FormatException/), '需要 catch FormatException。'),
        test('cs10-parse', '使用 int.Parse', matches(/int\.Parse\s*\(/), '需要 int.Parse。'),
      ],
    }),
    staticLevel({
      id: 11,
      title: 'async Task',
      badge: '异步',
      icon: 'C#',
      objective: '定义 async Task<string> LoadNameAsync()，并使用 await。',
      starterCode: '',
      sections: richSections({
        heading: '.NET 异步是服务和 UI 的生命线',
        body: 'C# 处理网络、数据库、文件时大量使用 async/await。UI 不冻结、服务不阻塞，都靠这个思路。',
        code: 'async Task<string> LoadNameAsync() {\n    await Task.Delay(100);\n    return "Nexus";\n}',
        model: 'Task 表示未来会完成的工作，await 等结果但不阻塞线程。',
        practice: '定义 async Task<string>，内部 await 一个 Task。',
        pitfall: 'async void 除了事件处理尽量别用。它不好等待，也不好捕获错误。',
      }),
      tests: [
        test('cs11-async', '使用 async', matches(/async\s+Task\s*<\s*string\s*>/), '需要 async Task<string>。'),
        test('cs11-await', '使用 await', matches(/\bawait\b/), '需要 await。'),
        test('cs11-task', '使用 Task', matches(/\bTask\b/), '需要 Task。'),
      ],
    }),
    staticLevel({
      id: 12,
      title: '任务清单小模型',
      badge: '整合',
      icon: 'C#',
      objective: '定义 TodoItem 类，包含 Title 和 Done 属性，并写 MarkDone 方法。',
      starterCode: '',
      sections: richSections({
        heading: 'C# 擅长把业务对象写得清楚',
        body: 'Todo、User、Order、Inventory 都是 C#/.NET 项目里常见的业务对象。属性和方法要各司其职。',
        code: 'class TodoItem {\n    public string Title { get; set; }\n    public bool Done { get; private set; }\n\n    public void MarkDone() {\n        Done = true;\n    }\n}',
        model: 'Title 是可编辑数据，Done 的修改入口被 MarkDone 控制。',
        practice: '写两个属性，再写 MarkDone。',
        pitfall: '所有属性都 public set 会让状态随便被改。重要状态要控制入口。',
      }),
      tests: [
        test('cs12-class', '定义 TodoItem', matches(/class\s+TodoItem/), '需要 TodoItem 类。'),
        test('cs12-title', '包含 Title 属性', matches(/string\s+Title\s*{/), '需要 Title 属性。'),
        test('cs12-markdone', '包含 MarkDone 方法', matches(/MarkDone\s*\(/), '需要 MarkDone。'),
      ],
    }),
  ]
}

function createJavaScriptAdvancedLevels(): Level[] {
  return [
    staticLevel({
      id: 7,
      title: '对象与解构',
      badge: '对象',
      icon: 'JS',
      objective: '创建 user 对象，并用解构取出 name 和 role。',
      starterCode: '',
      sections: richSections({
        heading: 'JS 对象是前端数据的基本形状',
        body: '接口返回 JSON、组件 props、配置对象，本质都绕不开对象。解构让你把需要的字段拿得更干净。',
        code: 'const user = { name: "Mika", role: "assistant" };\nconst { name, role } = user;\nconsole.log(`${name}: ${role}`);',
        model: '对象用键保存字段，解构像从对象里按名字取货。',
        practice: '创建 user，再用 `{ name, role } = user`。',
        pitfall: '字段名拼错会得到 undefined。JS 很少当场骂你，但后面会用 bug 追债。',
      }),
      tests: [
        test('js7-object', '创建 user 对象', matches(/const\s+user\s*=\s*{/), '需要 user 对象。'),
        test('js7-destructure', '使用对象解构', matches(/const\s*{\s*name\s*,\s*role\s*}/), '需要解构 name 和 role。'),
        test('js7-template', '使用模板字符串', matches(/`[\s\S]*\$\{/), '用模板字符串输出。'),
      ],
    }),
    staticLevel({
      id: 8,
      title: 'DOM 查询与事件',
      badge: '浏览器',
      icon: 'JS',
      objective: '使用 querySelector 获取按钮，并绑定 click 事件。',
      starterCode: '',
      sections: richSections({
        heading: '浏览器里的 JS 是和页面互动的',
        body: 'Web 前端不是只会 console.log。DOM 查询和事件监听是让页面动起来的入口。',
        code: 'const button = document.querySelector("#run");\nbutton.addEventListener("click", () => {\n  console.log("clicked");\n});',
        model: '先找到元素，再给它挂事件。用户点击时，回调函数才执行。',
        practice: 'querySelector 一个按钮，绑定 click。',
        pitfall: '元素可能不存在。真实项目里要先判断 button 是否为 null。',
      }),
      tests: [
        test('js8-query', '使用 querySelector', matches(/document\.querySelector\s*\(/), '需要 querySelector。'),
        test('js8-event', '使用 addEventListener', matches(/\.addEventListener\s*\(/), '需要 addEventListener。'),
        test('js8-click', '监听 click', includesAll(['click']), '监听 click 事件。'),
      ],
    }),
    staticLevel({
      id: 9,
      title: '模块导出',
      badge: '模块',
      icon: 'JS',
      objective: '使用 export function formatName(name) 导出函数。',
      starterCode: '',
      sections: richSections({
        heading: '模块让代码不再挤在一个文件',
        body: '现代前端、Node、构建工具都靠模块组织代码。导出函数，别把所有东西挂全局。',
        code: 'export function formatName(name) {\n  return name.trim().toUpperCase();\n}',
        model: '一个文件负责一组能力，通过 export 暴露给别的文件使用。',
        practice: '写 export function，内部处理字符串。',
        pitfall: '默认导出和命名导出别混着猜。团队项目里要统一风格。',
      }),
      tests: [
        test('js9-export', '使用 export function', matches(/export\s+function\s+formatName\s*\(/), '需要 export function formatName。'),
        test('js9-return', '返回处理结果', matches(/\breturn\b/), '函数要 return。'),
        test('js9-trim', '使用 trim', matches(/\.trim\s*\(/), '用 trim 处理输入。'),
      ],
    }),
    staticLevel({
      id: 10,
      title: 'Promise 错误处理',
      badge: '异步',
      icon: 'JS',
      objective: '使用 try / catch 包住 await fetch，并处理失败。',
      starterCode: '',
      sections: richSections({
        heading: '异步失败是 Web 的常态',
        body: '网络断开、接口报错、JSON 格式不对都很常见。JS 异步代码必须有失败路径。',
        code: 'async function loadUser() {\n  try {\n    const response = await fetch("/api/user");\n    return await response.json();\n  } catch (error) {\n    console.error("load failed", error);\n    return null;\n  }\n}',
        model: 'await 等异步结果，try/catch 捕获异步流程里的异常。',
        practice: 'fetch 放进 try，catch 里返回 null 或记录错误。',
        pitfall: '只写 await 不写错误处理，线上用户会替你发现所有坏天气。',
      }),
      tests: [
        test('js10-try', '使用 try', matches(/\btry\s*{/), '需要 try。'),
        test('js10-catch', '使用 catch', matches(/\bcatch\s*\(/), '需要 catch。'),
        test('js10-await-fetch', 'await fetch', matches(/await\s+fetch\s*\(/), '需要 await fetch。'),
      ],
    }),
    staticLevel({
      id: 11,
      title: 'localStorage 状态',
      badge: '状态',
      icon: 'JS',
      objective: '使用 localStorage.setItem 和 getItem 保存主题。',
      starterCode: '',
      sections: richSections({
        heading: '前端状态需要能留下来',
        body: '主题、草稿、简单偏好可以放 localStorage。它不是数据库，但很适合轻量本地状态。',
        code: 'localStorage.setItem("theme", "dark");\nconst theme = localStorage.getItem("theme");\nconsole.log(theme);',
        model: 'setItem 写入字符串，getItem 读出字符串。复杂对象要 JSON.stringify。',
        practice: '保存 theme，再读取输出。',
        pitfall: 'localStorage 只适合非敏感数据。密钥、密码、token 别随便塞进去。',
      }),
      tests: [
        test('js11-set', '使用 setItem', matches(/localStorage\.setItem\s*\(/), '需要 setItem。'),
        test('js11-get', '使用 getItem', matches(/localStorage\.getItem\s*\(/), '需要 getItem。'),
      ],
    }),
    staticLevel({
      id: 12,
      title: '迷你交互应用',
      badge: '整合',
      icon: 'JS',
      objective: '创建 tasks 数组，写 addTask(text) 并渲染任务数量。',
      starterCode: '',
      sections: richSections({
        heading: '把数据、函数、界面连起来',
        body: 'JS 的优势是立刻把数据变化反馈到页面。这个节点把数组、函数和 DOM 输出合成一个小应用。',
        code: 'const tasks = [];\n\nfunction addTask(text) {\n  tasks.push({ text, done: false });\n  document.querySelector("#count").textContent = String(tasks.length);\n}\n\naddTask("write code");',
        model: '数组保存状态，函数改变状态，DOM 展示状态。',
        practice: '写 tasks、addTask，再更新 #count。',
        pitfall: '直接改 DOM 可以入门，但复杂应用要学状态管理。先理解数据流，再碰框架。',
      }),
      tests: [
        test('js12-tasks', '创建 tasks 数组', matches(/const\s+tasks\s*=\s*\[/), '需要 tasks 数组。'),
        test('js12-add', '定义 addTask', matches(/function\s+addTask\s*\(/), '需要 addTask。'),
        test('js12-dom', '更新 textContent', matches(/\.textContent\s*=/), '需要更新 textContent。'),
      ],
    }),
  ]
}

function createVisualBasicAdvancedLevels(): Level[] {
  return [
    staticLevel({
      id: 7,
      title: 'Select Case',
      badge: '分支',
      icon: 'VB',
      objective: '使用 Select Case 根据 status 输出状态文字。',
      starterCode: '',
      sections: richSections({
        heading: 'VB 处理业务状态很顺口',
        body: '`Select Case` 适合处理订单状态、审批状态、表格分类，比一串 If 更清楚。',
        code: 'Dim status As String = "Paid"\nSelect Case status\n    Case "Paid"\n        Console.WriteLine("已付款")\n    Case Else\n        Console.WriteLine("待处理")\nEnd Select',
        model: '一个变量进入 Select Case，不同 Case 对应不同业务动作。',
        practice: '写 status，再写 Paid 和 Else 两条路径。',
        pitfall: '别忘 `End Select`。VB 块结构靠结束语句保持清晰。',
      }),
      tests: [
        test('vb7-select', '使用 Select Case', matches(/Select\s+Case/i), '需要 Select Case。'),
        test('vb7-case', '包含 Case', matches(/\bCase\b/i), '需要 Case。'),
        test('vb7-end', '包含 End Select', matches(/End\s+Select/i), '需要 End Select。'),
      ],
    }),
    staticLevel({
      id: 8,
      title: 'List(Of T)',
      badge: '集合',
      icon: 'VB',
      objective: '创建 List(Of String)，Add 三个客户名。',
      starterCode: '',
      sections: richSections({
        heading: '.NET 集合也能用 VB 写得很清楚',
        body: '业务系统里客户、订单、报表行经常需要动态集合。`List(Of T)` 是 VB 的泛型列表。',
        code: 'Dim customers As New List(Of String)()\ncustomers.Add("Ada")\ncustomers.Add("Grace")\ncustomers.Add("Linus")',
        model: 'List 管理可变长度集合，Add 把新数据放进去。',
        practice: '创建 List(Of String)，连续 Add 三次。',
        pitfall: '数组适合固定大小，List 适合动态增长。别拿数组硬扛业务数据。',
      }),
      tests: [
        test('vb8-list', '使用 List(Of String)', matches(/List\s*\(\s*Of\s+String\s*\)/i), '需要 List(Of String)。'),
        test('vb8-adds', 'Add 至少三次', (_o, code) => (code.match(/\.Add\s*\(/gi) ?? []).length >= 3, '至少 Add 三个客户。'),
      ],
    }),
    staticLevel({
      id: 9,
      title: '窗体事件入口',
      badge: '事件',
      icon: 'VB',
      objective: '写 Button1_Click 事件过程，并修改 Label1.Text。',
      starterCode: '',
      sections: richSections({
        heading: 'VB 桌面应用靠事件驱动',
        body: 'WinForms/VB 的经典场景是按钮、输入框、标签。用户点击按钮，事件过程执行。',
        code: 'Private Sub Button1_Click(sender As Object, e As EventArgs) Handles Button1.Click\n    Label1.Text = "已提交"\nEnd Sub',
        model: '事件过程绑定控件事件，里面修改界面状态。',
        practice: '写 Button1_Click，并给 Label1.Text 赋值。',
        pitfall: '事件名能改，但 Handles 必须指向真实控件事件，否则点按钮不会发生任何事。',
      }),
      tests: [
        test('vb9-click', '定义 Button1_Click', matches(/Sub\s+Button1_Click/i), '需要 Button1_Click。'),
        test('vb9-handles', '使用 Handles Button1.Click', matches(/Handles\s+Button1\.Click/i), '需要 Handles Button1.Click。'),
        test('vb9-label', '修改 Label1.Text', matches(/Label1\.Text\s*=/i), '需要修改 Label1.Text。'),
      ],
    }),
    staticLevel({
      id: 10,
      title: '文件读取',
      badge: 'I/O',
      icon: 'VB',
      objective: '使用 File.ReadAllLines 读取 lines，并 For Each 输出。',
      starterCode: '',
      sections: richSections({
        heading: '业务报表经常从文件开始',
        body: 'VB 很多真实场景是读 CSV、日志、导出文件。先掌握读行，再谈解析。',
        code: 'Dim lines = File.ReadAllLines("data.txt")\nFor Each line In lines\n    Console.WriteLine(line)\nNext',
        model: 'ReadAllLines 得到数组，For Each 逐行处理。',
        practice: '读取 lines，再循环输出。',
        pitfall: '真实项目要处理文件不存在和编码问题。入门先把主流程写清楚。',
      }),
      tests: [
        test('vb10-read', '使用 ReadAllLines', matches(/File\.ReadAllLines\s*\(/i), '需要 File.ReadAllLines。'),
        test('vb10-foreach', '使用 For Each', matches(/For\s+Each/i), '需要 For Each。'),
        test('vb10-next', '使用 Next', matches(/\bNext\b/i), '循环要有 Next。'),
      ],
    }),
    staticLevel({
      id: 11,
      title: 'LINQ 查询',
      badge: '查询',
      icon: 'VB',
      objective: '使用 Where 筛选大于 100 的金额。',
      starterCode: '',
      sections: richSections({
        heading: 'VB 也能写清楚数据查询',
        body: 'LINQ 不只是 C# 的东西。VB 处理报表和业务集合时同样能用 Where 做筛选。',
        code: 'Dim amounts = New List(Of Decimal) From {80D, 120D, 300D}\nDim large = amounts.Where(Function(amount) amount > 100D).ToList()',
        model: '集合进入 Where，Function 写筛选条件，ToList 得到结果。',
        practice: '创建金额列表，筛选大于 100。',
        pitfall: 'Decimal 金额要注意后缀和精度。钱别随便用 Double 糊弄。',
      }),
      tests: [
        test('vb11-where', '使用 Where', matches(/\.Where\s*\(/i), '需要 Where。'),
        test('vb11-function', '使用 Function lambda', matches(/Function\s*\(/i), 'Where 里用 Function。'),
        test('vb11-tolist', '使用 ToList', matches(/\.ToList\s*\(/i), '需要 ToList。'),
      ],
    }),
    staticLevel({
      id: 12,
      title: '客户报表小工具',
      badge: '整合',
      icon: 'VB',
      objective: '定义 Customer 类，包含 Name 和 Balance，并写 IsVip 函数。',
      starterCode: '',
      sections: richSections({
        heading: 'VB 的优势在业务数据工具',
        body: '客户、余额、状态、报表，是 VB/.NET 很典型的应用场景。类负责数据，函数负责规则。',
        code: 'Public Class Customer\n    Public Property Name As String\n    Public Property Balance As Decimal\nEnd Class\n\nFunction IsVip(customer As Customer) As Boolean\n    Return customer.Balance > 1000D\nEnd Function',
        model: 'Customer 是报表行模型，IsVip 是业务规则。',
        practice: '写类和两个属性，再写 IsVip。',
        pitfall: '业务规则别散落在按钮事件里。抽成函数，测试和维护都会轻松很多。',
      }),
      tests: [
        test('vb12-class', '定义 Customer 类', matches(/Class\s+Customer/i), '需要 Customer 类。'),
        test('vb12-balance', '包含 Balance 属性', matches(/Property\s+Balance\s+As\s+Decimal/i), '需要 Balance As Decimal。'),
        test('vb12-isvip', '定义 IsVip 函数', matches(/Function\s+IsVip\s*\(/i), '需要 IsVip 函数。'),
      ],
    }),
  ]
}

function createCExpertLevels(): Level[] {
  return [
    staticLevel({
      id: 13,
      title: '头文件与模块边界',
      badge: '模块',
      icon: 'C',
      objective: '写 calc.h 的 include guard，并声明 int add(int a, int b)。',
      starterCode: '',
      sections: richSections({
        heading: 'C 项目靠头文件建立边界',
        body: '函数声明放在头文件里，函数实现放在 .c 文件里。这个习惯能让程序从单文件练习长成真正项目。',
        code: '#ifndef CALC_H\n#define CALC_H\n\nint add(int a, int b);\n\n#endif',
        model: '头文件告诉别的文件“这里有什么可用能力”，include guard 防止重复包含把编译器绕晕。',
        practice: '写出 `#ifndef / #define / #endif`，中间声明 `add`。',
        pitfall: '头文件里乱放实现会导致重复定义。先把声明和实现分清。',
      }),
      tests: [
        test('c13-guard-ifndef', '使用 include guard', includesAll(['#ifndef', '#define', '#endif']), '需要完整 include guard。'),
        test('c13-add-decl', '声明 add 函数', matches(/int\s+add\s*\(\s*int\s+\w+\s*,\s*int\s+\w+\s*\)\s*;/), '声明 `int add(int a, int b);`。'),
      ],
    }),
    staticLevel({
      id: 14,
      title: '位运算权限标志',
      badge: '位标志',
      icon: 'C',
      objective: '用 enum 或宏定义 READ/WRITE 标志，并用 | 和 & 检查权限。',
      starterCode: '',
      sections: richSections({
        heading: '一串 bit 可以表达多个开关',
        body: '文件权限、硬件寄存器、网络协议字段经常用位标志保存状态。C 里这不是炫技，是日常。',
        code: 'enum Permission {\n    READ = 1 << 0,\n    WRITE = 1 << 1\n};\n\nint flags = READ | WRITE;\nif (flags & READ) {\n    /* allowed */\n}',
        model: '`1 << n` 代表第 n 位。`|` 合并开关，`&` 检查某个开关是否存在。',
        practice: '定义 READ 和 WRITE，组合成 flags，再检查 READ。',
        pitfall: '别用 `+` 代替 `|`。在位标志里，语义清楚比碰巧能算对重要。',
      }),
      tests: [
        test('c14-shift', '使用位移定义标志', matches(/1\s*<<\s*\d/), '用 `1 << 0` 这种形式定义标志。'),
        test('c14-or', '使用 | 合并标志', matches(/\w+\s*\|\s*\w+/), '需要用 `|` 组合权限。'),
        test('c14-and', '使用 & 检查标志', matches(/\w+\s*&\s*\w+/), '需要用 `&` 检查权限。'),
      ],
    }),
    staticLevel({
      id: 15,
      title: '函数指针回调',
      badge: '回调',
      icon: 'C',
      objective: '声明 int (*op)(int, int)，并通过函数指针调用 add。',
      starterCode: '',
      sections: richSections({
        heading: '回调是 C 的插件入口',
        body: '排序比较器、事件处理、驱动回调都可能用函数指针。看着怪，但它让 C 也能传递“行为”。',
        code: 'int add(int a, int b) {\n    return a + b;\n}\n\nint (*op)(int, int) = add;\nint result = op(2, 3);',
        model: '`op` 保存的是函数地址。调用 `op(2, 3)` 本质上是在调用它指向的函数。',
        practice: '先写 add，再声明函数指针 op，最后通过 op 调用。',
        pitfall: '函数指针声明很容易把括号写丢。`int *op(int,int)` 和 `int (*op)(int,int)` 完全不是一回事。',
      }),
      tests: [
        test('c15-fn-pointer', '声明函数指针', matches(/int\s*\(\s*\*\s*\w+\s*\)\s*\(\s*int\s*,\s*int\s*\)/), '需要 `int (*op)(int, int)`。'),
        test('c15-call-pointer', '通过函数指针调用', matches(/\w+\s*\(\s*\d+\s*,\s*\d+\s*\)/), '需要调用函数指针。'),
      ],
    }),
    staticLevel({
      id: 16,
      title: '枚举状态机',
      badge: '状态',
      icon: 'C',
      objective: '定义 enum State，并用 switch 处理 IDLE/RUNNING/ERROR。',
      starterCode: '',
      sections: richSections({
        heading: '状态机让流程不再散成一堆 if',
        body: '设备流程、协议解析、游戏循环都可以用状态机表达。每个状态只处理自己该处理的事。',
        code: 'enum State { IDLE, RUNNING, ERROR };\n\nenum State state = RUNNING;\nswitch (state) {\n    case IDLE:\n        break;\n    case RUNNING:\n        break;\n    case ERROR:\n        break;\n}',
        model: '枚举列出允许状态，switch 把每个状态的处理路径摆出来。',
        practice: '定义三个状态，并写完整 switch/case。',
        pitfall: '状态名如果靠字符串散落各处，拼写错误会变成隐形 bug。',
      }),
      tests: [
        test('c16-enum', '定义 enum State', matches(/enum\s+State/), '需要 enum State。'),
        test('c16-switch', '使用 switch', matches(/switch\s*\(/), '需要 switch。'),
        test('c16-cases', '处理三个状态', includesAll(['IDLE', 'RUNNING', 'ERROR']), '状态要包含 IDLE/RUNNING/ERROR。'),
      ],
    }),
    staticLevel({
      id: 17,
      title: '二进制文件 I/O',
      badge: '二进制',
      icon: 'C',
      objective: '用 fwrite 写入一个 int，再用 fread 读取回来。',
      starterCode: '',
      sections: richSections({
        heading: '二进制 I/O 面向真实数据块',
        body: '图片、音频、协议包、结构化存档都不是一行文本。C 的二进制读写会让你直接面对字节。',
        code: 'int value = 42;\nFILE *file = fopen("data.bin", "wb");\nfwrite(&value, sizeof(value), 1, file);\nfclose(file);\n\nfile = fopen("data.bin", "rb");\nfread(&value, sizeof(value), 1, file);\nfclose(file);',
        model: '`fwrite` 写的是内存地址里的字节，`sizeof` 决定写多少。',
        practice: '写一个 int，关闭文件，再以 rb 模式读回来。',
        pitfall: '不同平台结构体布局可能不同。入门先写基本类型，别急着把复杂结构体直接 dump 到文件。',
      }),
      tests: [
        test('c17-fwrite', '使用 fwrite', matches(/fwrite\s*\(/), '需要 fwrite。'),
        test('c17-fread', '使用 fread', matches(/fread\s*\(/), '需要 fread。'),
        test('c17-binary-mode', '使用二进制模式', matches(/"(wb|rb)"/), '打开文件要用 wb/rb。'),
      ],
    }),
    staticLevel({
      id: 18,
      title: '条件编译与调试开关',
      badge: '预处理',
      icon: 'C',
      objective: '定义 DEBUG，并用 #ifdef DEBUG 控制调试输出。',
      starterCode: '',
      sections: richSections({
        heading: '预处理器能在编译前改代码形态',
        body: '调试日志、平台差异、实验功能经常用条件编译。它很有用，也很容易被滥用。',
        code: '#define DEBUG\n\n#ifdef DEBUG\nprintf("debug: value=%d\\n", value);\n#endif',
        model: '`#ifdef` 判断宏是否存在。宏存在时，这段代码才进入编译。',
        practice: '定义 DEBUG，用 #ifdef 包住一条 printf。',
        pitfall: '条件编译太多会让代码变成迷宫。只把它用于平台和调试边界。',
      }),
      tests: [
        test('c18-define', '定义 DEBUG', includesAll(['#define DEBUG']), '需要 `#define DEBUG`。'),
        test('c18-ifdef', '使用 #ifdef DEBUG', includesAll(['#ifdef DEBUG', '#endif']), '需要 #ifdef DEBUG 和 #endif。'),
      ],
    }),
    staticLevel({
      id: 19,
      title: '安全解析输入',
      badge: '解析',
      icon: 'C',
      objective: '用 fgets 读取输入，再用 sscanf 解析整数。',
      starterCode: '',
      sections: richSections({
        heading: '先读一整行，再解析',
        body: '直接 scanf 容易留下输入缓冲区问题。更稳的方式是 fgets 读字符串，再 sscanf 解析。',
        code: 'char line[64];\nint count = 0;\n\nif (fgets(line, sizeof(line), stdin) != NULL) {\n    if (sscanf(line, "%d", &count) == 1) {\n        printf("%d\\n", count);\n    }\n}',
        model: '`fgets` 控制最大长度，`sscanf` 负责把文本转换成目标类型。',
        practice: '定义缓冲区，用 fgets 读 stdin，再检查 sscanf 的返回值。',
        pitfall: '解析函数返回值不检查，等于默认用户永远输入正确。真实用户不会这么配合。',
      }),
      tests: [
        test('c19-fgets', '使用 fgets', matches(/fgets\s*\(/), '需要 fgets。'),
        test('c19-sscanf', '使用 sscanf', matches(/sscanf\s*\(/), '需要 sscanf。'),
        test('c19-return-check', '检查解析返回值', matches(/sscanf\s*\([^)]*\)\s*==\s*1/), '要检查 sscanf 返回值是否为 1。'),
      ],
    }),
    staticLevel({
      id: 20,
      title: '日志解析器综合战',
      badge: '毕业',
      icon: 'C',
      objective: '定义 LogEntry 结构体，写 parseLine() 解析 level 和 message，并返回错误码。',
      starterCode: '',
      sections: richSections({
        heading: '把 C 基础合成一个可用模块',
        body: '最后一关不是再背语法，而是把字符串、结构体、错误码、输入解析组合成一个小模块。',
        code: 'struct LogEntry {\n    char level[16];\n    char message[128];\n};\n\nint parseLine(const char *line, struct LogEntry *entry) {\n    if (line == NULL || entry == NULL) {\n        return -1;\n    }\n    return sscanf(line, "%15s %127[^\\n]", entry->level, entry->message) == 2 ? 0 : -1;\n}',
        model: '输入是文本，输出是结构体，返回值表达成功或失败。这就是很多系统模块的雏形。',
        practice: '先定义结构体，再写 parseLine，最后处理 NULL 和解析失败。',
        pitfall: '别把所有东西塞进 main。毕业关要交付的是可复用函数。',
      }),
      tests: [
        test('c20-struct-log', '定义 LogEntry', matches(/struct\s+LogEntry/), '需要 struct LogEntry。'),
        test('c20-parse-line', '定义 parseLine', matches(/int\s+parseLine\s*\(/), '需要 parseLine 函数。'),
        test('c20-error-code', '返回错误码', matches(/return\s+-1\s*;/), '失败路径要返回 -1。'),
      ],
    }),
  ]
}

function createCppExpertLevels(): Level[] {
  return [
    staticLevel({
      id: 13,
      title: 'enum class 状态',
      badge: '状态',
      icon: 'C++',
      objective: '定义 enum class Status，并用 switch 处理 Loading/Ready/Error。',
      starterCode: '',
      sections: richSections({
        heading: 'enum class 比裸 enum 更安全',
        body: '现代 C++ 用 `enum class` 减少命名污染和隐式转换，让状态表达更稳。',
        code: 'enum class Status { Loading, Ready, Error };\n\nStatus status = Status::Ready;\nswitch (status) {\n    case Status::Loading:\n        break;\n    case Status::Ready:\n        break;\n    case Status::Error:\n        break;\n}',
        model: '状态值必须通过 `Status::Ready` 访问，读起来更明确。',
        practice: '写 enum class，再用 switch 覆盖三个状态。',
        pitfall: '别把状态写成 magic number。`2` 这种值没人知道它代表什么。',
      }),
      tests: [
        test('cpp13-enum-class', '定义 enum class', matches(/enum\s+class\s+Status/), '需要 enum class Status。'),
        test('cpp13-scope', '使用作用域枚举值', includesAll(['Status::Loading', 'Status::Ready', 'Status::Error']), '枚举值要带 Status::。'),
        test('cpp13-switch', '使用 switch', matches(/switch\s*\(/), '需要 switch。'),
      ],
    }),
    staticLevel({
      id: 14,
      title: 'lambda 与过滤',
      badge: '函数对象',
      icon: 'C++',
      objective: '使用 lambda 判断数字是否大于 10，并配合 std::copy_if 过滤。',
      starterCode: '',
      sections: richSections({
        heading: 'lambda 让小逻辑贴近使用现场',
        body: '排序规则、过滤条件、回调处理，经常用 lambda 表达。它让 C++ 算法库更像工程工具。',
        code: '#include <algorithm>\n#include <vector>\n\nstd::vector<int> source = {3, 12, 20};\nstd::vector<int> result;\nstd::copy_if(source.begin(), source.end(), std::back_inserter(result), [](int n) {\n    return n > 10;\n});',
        model: '`[](...) { ... }` 是匿名函数，能被算法当作规则使用。',
        practice: '写一个返回 `n > 10` 的 lambda，并传给 copy_if。',
        pitfall: 'lambda 捕获列表不是装饰。需要外部变量时才捕获，别无脑 `[&]`。',
      }),
      tests: [
        test('cpp14-lambda', '使用 lambda', matches(/\[\s*\]\s*\(\s*int\s+\w+\s*\)/), '需要 `[](int n)`。'),
        test('cpp14-copy-if', '使用 std::copy_if', matches(/std::copy_if\s*\(/), '需要 std::copy_if。'),
        test('cpp14-back-inserter', '使用 back_inserter', matches(/back_inserter\s*\(/), '需要 back_inserter。'),
      ],
    }),
    staticLevel({
      id: 15,
      title: 'unique_ptr 所有权',
      badge: '所有权',
      icon: 'C++',
      objective: '使用 std::unique_ptr 和 std::make_unique 创建对象。',
      starterCode: '',
      sections: richSections({
        heading: '所有权要写进类型里',
        body: '现代 C++ 不鼓励到处裸 new/delete。`unique_ptr` 表示这个对象只有一个拥有者。',
        code: '#include <memory>\n\nstruct Player {\n    int hp = 100;\n};\n\nauto player = std::make_unique<Player>();\nplayer->hp = 80;',
        model: 'unique_ptr 离开作用域会自动释放资源。RAII 不是口号，是少出事故的工程习惯。',
        practice: '用 make_unique 创建一个 Player，并通过 `->` 修改字段。',
        pitfall: '不要把 `unique_ptr` 随便复制。它的意义就是独占所有权。',
      }),
      tests: [
        test('cpp15-memory', '包含 memory', includesAll(['#include <memory>']), '需要 memory 头文件。'),
        test('cpp15-unique', '使用 unique_ptr 或 make_unique', matches(/std::(unique_ptr|make_unique)/), '需要智能指针。'),
        test('cpp15-arrow', '使用 -> 访问对象', matches(/->/), '通过指针访问成员要用 ->。'),
      ],
    }),
    staticLevel({
      id: 16,
      title: 'optional 返回值',
      badge: '空值',
      icon: 'C++',
      objective: '写 std::optional<int> findScore(...)，找不到时返回 std::nullopt。',
      starterCode: '',
      sections: richSections({
        heading: 'optional 让“可能没有”变成类型',
        body: '找用户、查配置、解析输入都可能失败。`std::optional` 比返回魔法数字清楚得多。',
        code: '#include <optional>\n\nstd::optional<int> findScore(bool exists) {\n    if (!exists) {\n        return std::nullopt;\n    }\n    return 90;\n}',
        model: '返回值要么有 int，要么明确没有。调用者必须面对这个分支。',
        practice: '定义 optional 返回类型，失败时返回 nullopt。',
        pitfall: '不要用 0 或 -1 假装“没有”。那些值可能也是合法业务数据。',
      }),
      tests: [
        test('cpp16-optional', '使用 std::optional', matches(/std::optional\s*<\s*int\s*>/), '需要 std::optional<int>。'),
        test('cpp16-nullopt', '返回 nullopt', includesAll(['std::nullopt']), '找不到时返回 std::nullopt。'),
      ],
    }),
    staticLevel({
      id: 17,
      title: 'filesystem 扫描',
      badge: '文件系统',
      icon: 'C++',
      objective: '使用 std::filesystem::directory_iterator 遍历目录。',
      starterCode: '',
      sections: richSections({
        heading: 'C++ 可以直接处理本地文件结构',
        body: '文件索引器、资源加载器、构建工具都需要遍历目录。`std::filesystem` 是现代 C++ 的标准入口。',
        code: '#include <filesystem>\n\nfor (const auto& entry : std::filesystem::directory_iterator(\".\")) {\n    auto path = entry.path();\n}',
        model: '目录迭代器给出 entry，entry 再暴露 path、类型和元信息。',
        practice: '包含 filesystem，并写 directory_iterator 循环。',
        pitfall: '真实项目要处理权限、符号链接和不存在的路径。入门先跑通最小遍历。',
      }),
      tests: [
        test('cpp17-filesystem', '包含 filesystem', includesAll(['#include <filesystem>']), '需要 filesystem。'),
        test('cpp17-dir-iter', '使用 directory_iterator', includesAll(['std::filesystem::directory_iterator']), '需要 directory_iterator。'),
      ],
    }),
    staticLevel({
      id: 18,
      title: 'thread 与 mutex',
      badge: '并发',
      icon: 'C++',
      objective: '创建 std::thread，并用 std::mutex 和 lock_guard 保护共享计数。',
      starterCode: '',
      sections: richSections({
        heading: '并发不是让代码同时乱跑',
        body: '多线程能提升吞吐，也能制造竞态。共享数据必须有清楚的保护策略。',
        code: '#include <thread>\n#include <mutex>\n\nstd::mutex guard;\nint count = 0;\n\nstd::thread worker([&]() {\n    std::lock_guard<std::mutex> lock(guard);\n    count++;\n});\nworker.join();',
        model: 'thread 负责并行执行，mutex 负责互斥访问，lock_guard 负责自动解锁。',
        practice: '创建线程，在线程里用 lock_guard 包住 count++，最后 join。',
        pitfall: '忘记 join 或 detach 会让程序在退出时出问题。线程生命周期必须收口。',
      }),
      tests: [
        test('cpp18-thread', '使用 std::thread', matches(/std::thread/), '需要 std::thread。'),
        test('cpp18-mutex', '使用 std::mutex', matches(/std::mutex/), '需要 std::mutex。'),
        test('cpp18-lock-guard', '使用 lock_guard', matches(/std::lock_guard/), '需要 lock_guard。'),
      ],
    }),
    staticLevel({
      id: 19,
      title: 'assert 自测',
      badge: '测试',
      icon: 'C++',
      objective: '写 add()，并用 assert 验证 add(2, 3) == 5。',
      starterCode: '',
      sections: richSections({
        heading: '先用最小断言保护逻辑',
        body: '正式项目会用测试框架，但最小自测可以先从 `assert` 开始。你要习惯让代码证明自己。',
        code: '#include <cassert>\n\nint add(int a, int b) {\n    return a + b;\n}\n\nassert(add(2, 3) == 5);',
        model: 'assert 表达“这里必须为真”。条件失败时，程序会直接暴露问题。',
        practice: '写 add，再加一个 assert。',
        pitfall: 'assert 不等于生产错误处理。它更适合开发期验证假设。',
      }),
      tests: [
        test('cpp19-cassert', '包含 cassert', includesAll(['#include <cassert>']), '需要 cassert。'),
        test('cpp19-assert', '使用 assert', matches(/assert\s*\(/), '需要 assert。'),
        test('cpp19-add-check', '验证 add 结果', includesAll(['add(2, 3)', '== 5']), '要验证 add(2, 3) == 5。'),
      ],
    }),
    staticLevel({
      id: 20,
      title: '任务调度器综合战',
      badge: '毕业',
      icon: 'C++',
      objective: '定义 Task 结构和 Scheduler 类，用 vector 保存任务并提供 addTask。',
      starterCode: '',
      sections: richSections({
        heading: '用现代 C++ 组织小型系统',
        body: '毕业关把结构体、类、vector、方法、所有权和状态组织到一个可以继续扩展的模块里。',
        code: '#include <string>\n#include <vector>\n\nstruct Task {\n    std::string title;\n    bool done = false;\n};\n\nclass Scheduler {\npublic:\n    void addTask(const std::string& title) {\n        tasks.push_back(Task{title, false});\n    }\nprivate:\n    std::vector<Task> tasks;\n};',
        model: 'Task 是数据，Scheduler 是行为边界，vector 是内部存储。三者各司其职。',
        practice: '定义 Task，再写 Scheduler，至少包含 addTask 和私有 tasks。',
        pitfall: '别把数据全 public。毕业关要体现封装，不是把变量摊在外面。',
      }),
      tests: [
        test('cpp20-task', '定义 Task', matches(/struct\s+Task/), '需要 Task 结构体。'),
        test('cpp20-class', '定义 Scheduler 类', matches(/class\s+Scheduler/), '需要 Scheduler 类。'),
        test('cpp20-vector', '使用 vector 保存任务', matches(/std::vector\s*<\s*Task\s*>/), '需要 vector<Task>。'),
        test('cpp20-add-task', '提供 addTask', matches(/addTask\s*\(/), '需要 addTask 方法。'),
      ],
    }),
  ]
}

function createJavaExpertLevels(): Level[] {
  return [
    staticLevel({
      id: 13,
      title: 'enum 业务状态',
      badge: '状态',
      icon: 'Java',
      objective: '定义 enum OrderStatus，并用 switch 处理 CREATED/PAID/CANCELLED。',
      starterCode: '',
      sections: richSections({
        heading: '业务状态要有名字',
        body: 'Java 后端最常见的不是数学题，而是订单、用户、任务的状态流转。enum 能让状态边界清楚。',
        code: 'enum OrderStatus { CREATED, PAID, CANCELLED }\n\nOrderStatus status = OrderStatus.PAID;\nswitch (status) {\n    case CREATED -> System.out.println(\"created\");\n    case PAID -> System.out.println(\"paid\");\n    case CANCELLED -> System.out.println(\"cancelled\");\n}',
        model: 'enum 列出合法状态，switch 把每个状态的行为显式写出来。',
        practice: '定义三个订单状态，并写 switch。',
        pitfall: '用字符串保存状态时，拼写错误很容易混进数据库和接口里。',
      }),
      tests: [
        test('java13-enum', '定义 enum OrderStatus', matches(/enum\s+OrderStatus/), '需要 enum OrderStatus。'),
        test('java13-statuses', '包含三个状态', includesAll(['CREATED', 'PAID', 'CANCELLED']), '需要三个状态。'),
        test('java13-switch', '使用 switch', matches(/switch\s*\(/), '需要 switch。'),
      ],
    }),
    staticLevel({
      id: 14,
      title: 'Map 业务索引',
      badge: '映射',
      icon: 'Java',
      objective: '使用 Map<String, Integer> 保存库存，并更新 apple 的数量。',
      starterCode: '',
      sections: richSections({
        heading: 'Map 是 Java 后端的索引思维',
        body: '缓存、库存、统计、配置都可以抽象成 key/value。Map 是后端业务里非常常见的数据结构。',
        code: 'import java.util.HashMap;\nimport java.util.Map;\n\nMap<String, Integer> stock = new HashMap<>();\nstock.put(\"apple\", 3);\nstock.put(\"apple\", stock.get(\"apple\") + 1);',
        model: 'key 定位业务对象，value 保存状态。读写前要考虑 key 是否存在。',
        practice: '创建 HashMap，put 一个库存，再读取并更新。',
        pitfall: '直接 `get` 不存在的 key 会得到 null。真实业务要考虑默认值。',
      }),
      tests: [
        test('java14-map', '使用 Map<String, Integer>', matches(/Map\s*<\s*String\s*,\s*Integer\s*>/), '需要 Map<String, Integer>。'),
        test('java14-hashmap', '创建 HashMap', matches(/new\s+HashMap\s*<>\s*\(/), '需要 new HashMap<>()。'),
        test('java14-put', '使用 put', matches(/\.put\s*\(/), '需要 put。'),
      ],
    }),
    staticLevel({
      id: 15,
      title: '泛型 Repository',
      badge: '泛型',
      icon: 'Java',
      objective: '定义 interface Repository<T>，包含 save(T item) 方法。',
      starterCode: '',
      sections: richSections({
        heading: '泛型让接口复用但不丢类型',
        body: 'Repository、Service、Response 这类抽象经常需要泛型。它不是高级装饰，是大型 Java 工程的日常。',
        code: 'interface Repository<T> {\n    void save(T item);\n}',
        model: '`T` 是类型占位符，调用方决定具体类型，接口保持统一。',
        practice: '定义 Repository<T>，写 save(T item)。',
        pitfall: '泛型擦除会影响运行时类型判断。入门先掌握编译期类型安全。',
      }),
      tests: [
        test('java15-interface', '定义泛型接口', matches(/interface\s+Repository\s*<\s*T\s*>/), '需要 interface Repository<T>。'),
        test('java15-save', '声明 save 方法', matches(/void\s+save\s*\(\s*T\s+\w+\s*\)/), '需要 save(T item)。'),
      ],
    }),
    staticLevel({
      id: 16,
      title: 'LocalDate 时间处理',
      badge: '时间',
      icon: 'Java',
      objective: '使用 LocalDate.now()，并调用 plusDays(7) 计算截止日期。',
      starterCode: '',
      sections: richSections({
        heading: '时间别用字符串硬拼',
        body: '订单截止、会员过期、任务提醒都需要可靠日期。Java 的 java.time 是现代时间处理入口。',
        code: 'import java.time.LocalDate;\n\nLocalDate today = LocalDate.now();\nLocalDate deadline = today.plusDays(7);',
        model: 'LocalDate 表达日期，不带时区和时分秒。它适合日历类业务。',
        practice: '获取今天，再加 7 天得到 deadline。',
        pitfall: '日期字符串看起来简单，比较和加减时很快出事故。',
      }),
      tests: [
        test('java16-localdate', '使用 LocalDate', includesAll(['LocalDate']), '需要 LocalDate。'),
        test('java16-now', '调用 now', matches(/LocalDate\.now\s*\(/), '需要 LocalDate.now()。'),
        test('java16-plus-days', '调用 plusDays', matches(/\.plusDays\s*\(\s*7\s*\)/), '需要 plusDays(7)。'),
      ],
    }),
    staticLevel({
      id: 17,
      title: 'record 数据传输',
      badge: 'DTO',
      icon: 'Java',
      objective: '定义 record UserDto(String name, int age)。',
      starterCode: '',
      sections: richSections({
        heading: 'record 适合不可变数据载体',
        body: '接口响应、配置项、查询结果经常只是“带名字的数据”。record 能减少样板代码。',
        code: 'record UserDto(String name, int age) { }',
        model: 'record 自动提供构造、访问器、equals/hashCode/toString，适合 DTO。',
        practice: '定义一个包含 name 和 age 的 UserDto。',
        pitfall: 'record 不是万能实体。需要复杂行为和可变状态时，普通 class 更合适。',
      }),
      tests: [
        test('java17-record', '定义 record', matches(/record\s+UserDto\s*\(/), '需要 record UserDto。'),
        test('java17-fields', '包含 name 和 age', includesAll(['String name', 'int age']), '需要 name 和 age 字段。'),
      ],
    }),
    staticLevel({
      id: 18,
      title: 'CompletableFuture 异步',
      badge: '异步',
      icon: 'Java',
      objective: '使用 CompletableFuture.supplyAsync 返回字符串结果。',
      starterCode: '',
      sections: richSections({
        heading: 'Java 异步常用于后台任务和接口聚合',
        body: '发请求、查缓存、跑耗时任务时，CompletableFuture 能把等待变成可组合流程。',
        code: 'import java.util.concurrent.CompletableFuture;\n\nCompletableFuture<String> job = CompletableFuture.supplyAsync(() -> \"done\");',
        model: 'Future 表示未来会有结果。supplyAsync 把计算放到异步任务里。',
        practice: '声明 CompletableFuture<String>，调用 supplyAsync。',
        pitfall: '异步不是逃避错误处理。异常和超时路径也要设计。',
      }),
      tests: [
        test('java18-future', '使用 CompletableFuture', includesAll(['CompletableFuture']), '需要 CompletableFuture。'),
        test('java18-supply', '调用 supplyAsync', matches(/supplyAsync\s*\(/), '需要 supplyAsync。'),
        test('java18-lambda', '使用 lambda', matches(/->/), '需要 lambda。'),
      ],
    }),
    staticLevel({
      id: 19,
      title: 'JUnit 单元测试',
      badge: '测试',
      icon: 'Java',
      objective: '写 @Test 方法，并用 assertEquals(5, add(2, 3)) 验证结果。',
      starterCode: '',
      sections: richSections({
        heading: 'Java 工程靠测试守住业务规则',
        body: '后端项目不是跑一次就完。JUnit 让关键逻辑能被持续验证。',
        code: 'import org.junit.jupiter.api.Test;\nimport static org.junit.jupiter.api.Assertions.assertEquals;\n\n@Test\nvoid addsNumbers() {\n    assertEquals(5, add(2, 3));\n}',
        model: '@Test 标记测试入口，assertEquals 表达预期和实际结果。',
        practice: '写一个测试方法，用 assertEquals 检查 add。',
        pitfall: '只测正常路径不够。真实服务还要测空值、异常、边界。',
      }),
      tests: [
        test('java19-test', '使用 @Test', includesAll(['@Test']), '需要 @Test。'),
        test('java19-assert', '使用 assertEquals', matches(/assertEquals\s*\(/), '需要 assertEquals。'),
        test('java19-add', '验证 add', includesAll(['add(2, 3)', '5']), '需要验证 add(2, 3)。'),
      ],
    }),
    staticLevel({
      id: 20,
      title: '订单服务综合战',
      badge: '毕业',
      icon: 'Java',
      objective: '定义 OrderService，包含 createOrder(UserDto user) 和 Repository<Order> 依赖。',
      starterCode: '',
      sections: richSections({
        heading: '把 Java 语法收束成服务边界',
        body: '毕业关要把类、接口、DTO、状态、Repository 组合成一个后端服务雏形。',
        code: 'class OrderService {\n    private final Repository<Order> repository;\n\n    OrderService(Repository<Order> repository) {\n        this.repository = repository;\n    }\n\n    void createOrder(UserDto user) {\n        repository.save(new Order(user.name()));\n    }\n}',
        model: 'Service 负责业务动作，Repository 负责保存边界，DTO 负责输入数据。',
        practice: '定义 OrderService，注入 Repository<Order>，在 createOrder 里保存订单。',
        pitfall: '别让 Controller 直接塞满业务规则。Java 项目能不能长大，就看边界分得清不清。',
      }),
      tests: [
        test('java20-service', '定义 OrderService', matches(/class\s+OrderService/), '需要 OrderService。'),
        test('java20-repository', '使用 Repository<Order>', matches(/Repository\s*<\s*Order\s*>/), '需要 Repository<Order>。'),
        test('java20-create', '定义 createOrder', matches(/createOrder\s*\(/), '需要 createOrder 方法。'),
      ],
    }),
  ]
}

function createCSharpExpertLevels(): Level[] {
  return [
    staticLevel({
      id: 13,
      title: 'record 数据契约',
      badge: 'DTO',
      icon: 'C#',
      objective: '定义 record UserDto(string Name, int Age)。',
      starterCode: '',
      sections: richSections({
        heading: 'record 适合接口数据形状',
        body: 'C# 里的 API 请求、响应、配置和消息体，经常可以用 record 表达不可变数据。',
        code: 'public record UserDto(string Name, int Age);',
        model: 'record 自动给你值语义和构造参数，适合轻量数据契约。',
        practice: '定义 UserDto，包含 Name 和 Age。',
        pitfall: 'record 适合数据，不代表所有业务对象都应该是 record。',
      }),
      tests: [
        test('cs13-record', '定义 record UserDto', matches(/record\s+UserDto\s*\(/), '需要 record UserDto。'),
        test('cs13-fields', '包含 Name 和 Age', includesAll(['string Name', 'int Age']), '需要 Name 和 Age。'),
      ],
    }),
    staticLevel({
      id: 14,
      title: 'Dictionary 索引',
      badge: '映射',
      icon: 'C#',
      objective: '使用 Dictionary<string, int> 保存库存，并更新 apple。',
      starterCode: '',
      sections: richSections({
        heading: 'Dictionary 是业务查表工具',
        body: '库存、配置、用户缓存、统计结果都可以先抽象成字典。',
        code: 'var stock = new Dictionary<string, int>();\nstock[\"apple\"] = 3;\nstock[\"apple\"] += 1;',
        model: 'key 负责定位，value 负责保存业务状态。索引器让读写很直接。',
        practice: '创建 Dictionary，给 apple 赋值，再递增。',
        pitfall: '读取不存在的 key 会抛异常。真实代码要考虑 ContainsKey 或 TryGetValue。',
      }),
      tests: [
        test('cs14-dictionary', '使用 Dictionary<string, int>', matches(/Dictionary\s*<\s*string\s*,\s*int\s*>/), '需要 Dictionary<string, int>。'),
        test('cs14-indexer', '使用索引器', matches(/\[[^\]]+\]\s*=/), '需要用字典索引器赋值。'),
      ],
    }),
    staticLevel({
      id: 15,
      title: '可空值防线',
      badge: 'Null',
      icon: 'C#',
      objective: '声明 string? input，并用 is null 检查后再使用。',
      starterCode: '',
      sections: richSections({
        heading: 'null 要变成显式分支',
        body: 'C# 的可空引用能帮你把“可能没有”写进类型里。这样比线上 NullReferenceException 体面得多。',
        code: 'string? input = null;\n\nif (input is null) {\n    Console.WriteLine(\"missing\");\n} else {\n    Console.WriteLine(input.Length);\n}',
        model: '`string?` 表示可能为 null，`is null` 把缺失路径单独处理。',
        practice: '声明 string?，写 if/else，非空时访问 Length。',
        pitfall: '不要用 `!` 到处压警告。那是在告诉编译器闭嘴，不是在修 bug。',
      }),
      tests: [
        test('cs15-nullable', '使用 string?', matches(/string\?\s+\w+/), '需要 string?。'),
        test('cs15-is-null', '使用 is null', matches(/is\s+null/), '需要 is null 检查。'),
      ],
    }),
    staticLevel({
      id: 16,
      title: '委托与事件',
      badge: '事件',
      icon: 'C#',
      objective: '定义 event Action<string> OnMessage，并用 ?.Invoke 触发。',
      starterCode: '',
      sections: richSections({
        heading: '事件让对象发出信号',
        body: '桌面 UI、游戏脚本、消息系统都离不开事件。C# 的 event 能把“发生了什么”广播出去。',
        code: 'public event Action<string>? OnMessage;\n\nvoid Send(string text) {\n    OnMessage?.Invoke(text);\n}',
        model: '事件保存订阅者列表，Invoke 会通知所有订阅者。',
        practice: '声明 event Action<string>，再用 ?.Invoke 触发。',
        pitfall: '事件触发前要考虑没人订阅，所以 `?.Invoke` 很常见。',
      }),
      tests: [
        test('cs16-event', '声明 event Action<string>', matches(/event\s+Action\s*<\s*string\s*>/), '需要 event Action<string>。'),
        test('cs16-invoke', '使用 ?.Invoke', includesAll(['?.Invoke']), '需要 ?.Invoke。'),
      ],
    }),
    staticLevel({
      id: 17,
      title: 'HttpClient 请求',
      badge: '网络',
      icon: 'C#',
      objective: '使用 HttpClient 和 await GetStringAsync 获取文本。',
      starterCode: '',
      sections: richSections({
        heading: '现代 C# 经常要调用外部服务',
        body: 'API、Webhook、内部服务和云函数都需要 HTTP 请求。HttpClient 是基础入口。',
        code: 'using var client = new HttpClient();\nstring json = await client.GetStringAsync(\"https://example.com/api\");',
        model: 'HttpClient 发请求，await 等待结果，返回值再进入业务处理。',
        practice: '创建 HttpClient，并 await GetStringAsync。',
        pitfall: '真实项目不要到处 new HttpClient。这里先理解请求动作，后面再讲生命周期。',
      }),
      tests: [
        test('cs17-client', '使用 HttpClient', matches(/HttpClient/), '需要 HttpClient。'),
        test('cs17-await', '使用 await', matches(/\bawait\b/), '需要 await。'),
        test('cs17-get', '调用 GetStringAsync', matches(/GetStringAsync\s*\(/), '需要 GetStringAsync。'),
      ],
    }),
    staticLevel({
      id: 18,
      title: '依赖注入接口',
      badge: 'DI',
      icon: 'C#',
      objective: '定义 IClock 接口，并通过构造函数注入到 ReminderService。',
      starterCode: '',
      sections: richSections({
        heading: '依赖注入让服务可替换、可测试',
        body: '.NET 后端大量依赖 DI。你不应该在业务类里硬 new 所有依赖。',
        code: 'public interface IClock {\n    DateTime Now { get; }\n}\n\npublic class ReminderService {\n    private readonly IClock clock;\n\n    public ReminderService(IClock clock) {\n        this.clock = clock;\n    }\n}',
        model: '接口描述能力，构造函数接收依赖，服务只依赖抽象。',
        practice: '写 IClock，再把它注入 ReminderService。',
        pitfall: '没有接口边界，测试时就很难替换时间、网络、数据库这些外部依赖。',
      }),
      tests: [
        test('cs18-interface', '定义 IClock', matches(/interface\s+IClock/), '需要 IClock 接口。'),
        test('cs18-service', '定义 ReminderService', matches(/class\s+ReminderService/), '需要 ReminderService。'),
        test('cs18-constructor', '构造函数注入 IClock', matches(/ReminderService\s*\(\s*IClock\s+\w+\s*\)/), '构造函数要接收 IClock。'),
      ],
    }),
    staticLevel({
      id: 19,
      title: 'xUnit 单元测试',
      badge: '测试',
      icon: 'C#',
      objective: '写 [Fact] 测试，并用 Assert.Equal(5, Add(2, 3))。',
      starterCode: '',
      sections: richSections({
        heading: 'C# 工程靠测试稳住迭代',
        body: '无论是 .NET API 还是 Unity 工具，关键逻辑都需要可重复验证。',
        code: '[Fact]\npublic void AddsNumbers() {\n    Assert.Equal(5, Add(2, 3));\n}',
        model: '[Fact] 是测试入口，Assert.Equal 表达期望结果。',
        practice: '写一个测试方法，验证 Add(2, 3)。',
        pitfall: '别只测通路。异常、null、边界值才是线上常见事故。',
      }),
      tests: [
        test('cs19-fact', '使用 [Fact]', includesAll(['[Fact]']), '需要 [Fact]。'),
        test('cs19-assert', '使用 Assert.Equal', matches(/Assert\.Equal\s*\(/), '需要 Assert.Equal。'),
      ],
    }),
    staticLevel({
      id: 20,
      title: 'Minimal API 综合战',
      badge: '毕业',
      icon: 'C#',
      objective: '使用 WebApplication 创建 /tasks 路由，并返回任务列表。',
      starterCode: '',
      sections: richSections({
        heading: '把 C# 基础做成一个 API',
        body: '毕业关把 record、List、LINQ、async、DI 和错误边界收束成一个可发布的 .NET API 雏形。',
        code: 'var builder = WebApplication.CreateBuilder(args);\nvar app = builder.Build();\n\nvar tasks = new List<string> { \"learn\" };\napp.MapGet(\"/tasks\", () => tasks);\n\napp.Run();',
        model: 'builder 配置应用，app 定义路由，MapGet 把 URL 和处理逻辑连起来。',
        practice: '创建 WebApplication，定义 tasks，映射 /tasks。',
        pitfall: 'API 不是把数据直接扔出去就完。真实项目还要验证、鉴权、错误响应和日志。',
      }),
      tests: [
        test('cs20-webapp', '使用 WebApplication', includesAll(['WebApplication']), '需要 WebApplication。'),
        test('cs20-mapget', '定义 MapGet', matches(/MapGet\s*\(/), '需要 MapGet。'),
        test('cs20-tasks', '包含 /tasks 路由', includesAll(['/tasks']), '需要 /tasks。'),
      ],
    }),
  ]
}

function createJavaScriptExpertLevels(): Level[] {
  return [
    staticLevel({
      id: 13,
      title: 'filter 与 reduce',
      badge: '数据流',
      icon: 'JS',
      objective: '用 filter 筛选完成任务，再用 reduce 统计数量。',
      starterCode: '',
      sections: richSections({
        heading: '数组方法是前端数据加工流水线',
        body: '列表渲染、搜索筛选、购物车统计都离不开 filter/map/reduce。',
        code: 'const tasks = [{ done: true }, { done: false }, { done: true }];\nconst completed = tasks.filter((task) => task.done);\nconst total = completed.reduce((count) => count + 1, 0);',
        model: 'filter 负责留下符合条件的项，reduce 负责把列表折叠成一个结果。',
        practice: '先 filter，再 reduce。',
        pitfall: 'reduce 很强，但别把简单逻辑写成谜语。可读性比炫技重要。',
      }),
      tests: [
        test('js13-filter', '使用 filter', matches(/\.filter\s*\(/), '需要 filter。'),
        test('js13-reduce', '使用 reduce', matches(/\.reduce\s*\(/), '需要 reduce。'),
        test('js13-arrow', '使用箭头函数', matches(/=>/), '需要箭头函数。'),
      ],
    }),
    staticLevel({
      id: 14,
      title: '事件委托',
      badge: '事件',
      icon: 'JS',
      objective: '给 list 绑定 click 事件，并用 event.target 判断按钮。',
      starterCode: '',
      sections: richSections({
        heading: '事件委托适合动态列表',
        body: '任务列表、评论区、商品列表里的按钮可能后来才创建。把事件绑在父容器上更稳。',
        code: 'const list = document.querySelector(\"#list\");\nlist.addEventListener(\"click\", (event) => {\n    if (event.target.matches(\"button\")) {\n        console.log(\"clicked\");\n    }\n});',
        model: '事件从子元素冒泡到父元素，父元素通过 target 判断真正被点的是谁。',
        practice: '绑定 list 的 click，用 target.matches 判断 button。',
        pitfall: '不要给每一项都绑一遍事件。动态渲染时很容易重复绑定。',
      }),
      tests: [
        test('js14-listener', '绑定 click 事件', includesAll(['addEventListener', 'click']), '需要 click 监听。'),
        test('js14-target', '使用 event.target', includesAll(['event.target']), '需要 event.target。'),
        test('js14-matches', '使用 matches', matches(/\.matches\s*\(/), '需要 matches。'),
      ],
    }),
    staticLevel({
      id: 15,
      title: 'AbortController 取消请求',
      badge: '取消',
      icon: 'JS',
      objective: '创建 AbortController，并把 signal 传给 fetch。',
      starterCode: '',
      sections: richSections({
        heading: '真实产品要能取消过期请求',
        body: '搜索框连打、页面切换、组件卸载时，旧请求不该继续影响新界面。',
        code: 'const controller = new AbortController();\nconst response = await fetch(\"/api/search\", {\n    signal: controller.signal,\n});\ncontroller.abort();',
        model: 'controller 产生 signal，fetch 接收 signal，abort 负责取消。',
        practice: '创建 AbortController，把 signal 放进 fetch 配置。',
        pitfall: '不处理取消请求，旧响应可能覆盖新状态，让 UI 看起来随机坏掉。',
      }),
      tests: [
        test('js15-controller', '使用 AbortController', matches(/new\s+AbortController\s*\(/), '需要 AbortController。'),
        test('js15-signal', '传入 signal', includesAll(['signal', 'controller.signal']), 'fetch 配置要传 signal。'),
        test('js15-abort', '调用 abort', matches(/\.abort\s*\(/), '需要 abort。'),
      ],
    }),
    staticLevel({
      id: 16,
      title: '错误恢复 UI 状态',
      badge: '状态机',
      icon: 'JS',
      objective: '用 state.status 表达 loading/success/error，并在 catch 中写入 error。',
      starterCode: '',
      sections: richSections({
        heading: '异步界面必须有状态机',
        body: '加载中、成功、失败、重试是 Web 产品的基本状态。没有状态机，UI 就会变成猜谜。',
        code: 'const state = { status: \"idle\", error: null };\n\ntry {\n    state.status = \"loading\";\n    await fetchData();\n    state.status = \"success\";\n} catch (error) {\n    state.status = \"error\";\n    state.error = error;\n}',
        model: 'status 是 UI 当前阶段，error 保存失败原因。渲染只看状态，不靠感觉。',
        practice: '写 state.status，并在 try/catch 里更新。',
        pitfall: '只写 console.error 不算错误恢复。用户看不到控制台。',
      }),
      tests: [
        test('js16-status', '使用 state.status', includesAll(['state.status']), '需要 state.status。'),
        test('js16-try-catch', '使用 try/catch', includesAll(['try', 'catch']), '需要 try/catch。'),
        test('js16-error', '设置 error 状态', includesAll(['"error"']), '失败时要设置 error。'),
      ],
    }),
    staticLevel({
      id: 17,
      title: 'JSDoc 类型提示',
      badge: '类型',
      icon: 'JS',
      objective: '用 @typedef 定义 User，并给函数参数添加 @param {User}。',
      starterCode: '',
      sections: richSections({
        heading: 'JS 也可以写出类型意图',
        body: '不是所有项目都马上上 TypeScript。JSDoc 能让编辑器理解对象形状，减少低级错误。',
        code: '/** @typedef {{ name: string, age: number }} User */\n\n/** @param {User} user */\nfunction printUser(user) {\n    console.log(user.name);\n}',
        model: '@typedef 描述结构，@param 把结构绑定到函数参数。',
        practice: '定义 User 类型，并标注 printUser 的参数。',
        pitfall: 'JSDoc 不是装饰文案。字段名写错，提示也会跟着错。',
      }),
      tests: [
        test('js17-typedef', '使用 @typedef', includesAll(['@typedef']), '需要 @typedef。'),
        test('js17-param', '使用 @param {User}', includesAll(['@param {User}']), '需要 @param {User}。'),
      ],
    }),
    staticLevel({
      id: 18,
      title: 'Node assert 测试',
      badge: '测试',
      icon: 'JS',
      objective: '导入 node:assert，并验证 add(2, 3) 等于 5。',
      starterCode: '',
      sections: richSections({
        heading: 'JS 工具脚本也要能自测',
        body: 'Node 项目可以先用内置 assert 做最小测试，再升级到 Vitest/Jest。',
        code: 'import assert from \"node:assert\";\n\nfunction add(a, b) {\n    return a + b;\n}\n\nassert.equal(add(2, 3), 5);',
        model: 'assert 表达预期。代码改坏时，它会第一时间叫停。',
        practice: '导入 assert，写 add，然后 assert.equal。',
        pitfall: '测试不是最后补的装饰。核心函数一开始就该有最小保护。',
      }),
      tests: [
        test('js18-assert-import', '导入 node:assert', includesAll(['node:assert']), '需要 node:assert。'),
        test('js18-assert-equal', '使用 assert.equal', matches(/assert\.equal\s*\(/), '需要 assert.equal。'),
      ],
    }),
    staticLevel({
      id: 19,
      title: 'hash 路由',
      badge: '路由',
      icon: 'JS',
      objective: '监听 hashchange，并根据 location.hash 渲染页面。',
      starterCode: '',
      sections: richSections({
        heading: '单页应用从路由开始',
        body: '不刷新页面切换视图，是前端应用的基础能力。hash 路由是理解 SPA 的轻量入口。',
        code: 'function render() {\n    const route = location.hash || \"#home\";\n    document.querySelector(\"#app\").textContent = route;\n}\n\nwindow.addEventListener(\"hashchange\", render);\nrender();',
        model: 'URL hash 是当前视图状态，hashchange 是状态变化事件。',
        practice: '写 render，读取 location.hash，监听 hashchange。',
        pitfall: '路由不是按钮切换。URL 要能表达当前页面，否则分享和刷新都会出问题。',
      }),
      tests: [
        test('js19-hash', '读取 location.hash', includesAll(['location.hash']), '需要 location.hash。'),
        test('js19-listener', '监听 hashchange', includesAll(['hashchange', 'addEventListener']), '需要监听 hashchange。'),
        test('js19-render', '定义 render', matches(/function\s+render\s*\(/), '需要 render 函数。'),
      ],
    }),
    staticLevel({
      id: 20,
      title: '任务面板综合战',
      badge: '毕业',
      icon: 'JS',
      objective: '创建 tasks 状态，支持 addTask、render 和 localStorage 保存。',
      starterCode: '',
      sections: richSections({
        heading: '把 JS 基础做成一个可交互应用',
        body: '毕业关把对象、数组、事件、渲染、状态、持久化组合成一个用户真的能操作的小工具。',
        code: 'let tasks = JSON.parse(localStorage.getItem(\"tasks\") || \"[]\");\n\nfunction addTask(text) {\n    tasks.push({ text, done: false });\n    localStorage.setItem(\"tasks\", JSON.stringify(tasks));\n    render();\n}\n\nfunction render() {\n    document.querySelector(\"#count\").textContent = String(tasks.length);\n}',
        model: 'tasks 是状态，addTask 修改状态并保存，render 把状态同步到页面。',
        practice: '写 tasks、addTask、render，并保存到 localStorage。',
        pitfall: '只改数组不 render，用户看不到变化；只 render 不保存，刷新就没了。',
      }),
      tests: [
        test('js20-tasks', '创建 tasks 状态', includesAll(['tasks']), '需要 tasks。'),
        test('js20-add', '定义 addTask', matches(/function\s+addTask\s*\(/), '需要 addTask。'),
        test('js20-render', '定义 render', matches(/function\s+render\s*\(/), '需要 render。'),
        test('js20-storage', '使用 localStorage', includesAll(['localStorage']), '需要 localStorage。'),
      ],
    }),
  ]
}

function createVisualBasicExpertLevels(): Level[] {
  return [
    staticLevel({
      id: 13,
      title: 'Dictionary 业务索引',
      badge: '映射',
      icon: 'VB',
      objective: '使用 Dictionary(Of String, Integer) 保存库存并更新 Apple。',
      starterCode: '',
      sections: richSections({
        heading: 'VB 也能清楚表达 key/value 业务数据',
        body: 'Excel 自动化、内部工具、报表系统经常需要按客户名、商品名或编号查数据。',
        code: 'Dim stock As New Dictionary(Of String, Integer)\nstock(\"Apple\") = 3\nstock(\"Apple\") += 1',
        model: 'Dictionary 用 key 定位业务对象，用 value 保存对应状态。',
        practice: '创建 Dictionary，写入 Apple，再递增。',
        pitfall: '读取不存在的 key 会出问题。真实工具要先检查 ContainsKey。',
      }),
      tests: [
        test('vb13-dictionary', '使用 Dictionary(Of String, Integer)', includesAll(['Dictionary(Of String, Integer)']), '需要 Dictionary(Of String, Integer)。'),
        test('vb13-indexer', '使用索引器', matches(/\([^)]+\)\s*=/), '需要用 stock("Apple") 赋值。'),
      ],
    }),
    staticLevel({
      id: 14,
      title: 'LINQ 汇总',
      badge: '查询',
      icon: 'VB',
      objective: '使用 Where 筛选金额大于 100 的订单，并用 Sum 汇总。',
      starterCode: '',
      sections: richSections({
        heading: 'LINQ 让业务列表像查询一样可读',
        body: '报表工具最常见的动作就是筛选、排序、汇总。LINQ 能把这些逻辑写得更接近业务语言。',
        code: 'Dim totals = orders.Where(Function(order) order.Amount > 100).Sum(Function(order) order.Amount)',
        model: 'Where 留下符合条件的订单，Sum 把金额折叠成一个总数。',
        practice: '写 Where，再接 Sum。',
        pitfall: '链式调用别写太长。复杂查询要拆成有名字的中间变量。',
      }),
      tests: [
        test('vb14-where', '使用 Where', matches(/\.Where\s*\(/), '需要 Where。'),
        test('vb14-sum', '使用 Sum', matches(/\.Sum\s*\(/), '需要 Sum。'),
        test('vb14-function', '使用 Function lambda', includesAll(['Function']), '需要 Function lambda。'),
      ],
    }),
    staticLevel({
      id: 15,
      title: 'Try/Catch/Finally',
      badge: '错误',
      icon: 'VB',
      objective: '用 Try/Catch/Finally 包住文件读取，并在 Catch 中处理异常。',
      starterCode: '',
      sections: richSections({
        heading: '业务工具必须能体面失败',
        body: '文件不存在、权限不足、Excel 被占用，这些都是内部工具天天会遇到的问题。',
        code: 'Try\n    Dim text = File.ReadAllText(\"data.txt\")\nCatch ex As IOException\n    Console.WriteLine(ex.Message)\nFinally\n    Console.WriteLine(\"done\")\nEnd Try',
        model: 'Try 放可能失败的动作，Catch 处理异常，Finally 做收尾。',
        practice: '写完整 Try/Catch/Finally/End Try。',
        pitfall: '吞掉异常不提示用户，会让业务人员以为数据处理成功了。',
      }),
      tests: [
        test('vb15-try', '使用 Try', includesAll(['Try', 'End Try']), '需要 Try/End Try。'),
        test('vb15-catch', '使用 Catch', includesAll(['Catch']), '需要 Catch。'),
        test('vb15-finally', '使用 Finally', includesAll(['Finally']), '需要 Finally。'),
      ],
    }),
    staticLevel({
      id: 16,
      title: 'Async/Await',
      badge: '异步',
      icon: 'VB',
      objective: '定义 Async Function LoadAsync() As Task(Of String)，并 Await 获取结果。',
      starterCode: '',
      sections: richSections({
        heading: '桌面工具不能因为等待而卡死',
        body: '请求接口、读取大文件、生成报表都可能耗时。Async/Await 能让 UI 保持响应。',
        code: 'Async Function LoadAsync() As Task(Of String)\n    Dim result = Await client.GetStringAsync(url)\n    Return result\nEnd Function',
        model: 'Async 标记异步函数，Await 等待结果但不把当前线程彻底卡住。',
        practice: '写 Async Function，返回 Task(Of String)，内部 Await。',
        pitfall: '异步函数的异常也要处理。不要以为 Await 会让错误消失。',
      }),
      tests: [
        test('vb16-async', '使用 Async Function', includesAll(['Async Function']), '需要 Async Function。'),
        test('vb16-task', '返回 Task(Of String)', includesAll(['Task(Of String)']), '需要 Task(Of String)。'),
        test('vb16-await', '使用 Await', includesAll(['Await']), '需要 Await。'),
      ],
    }),
    staticLevel({
      id: 17,
      title: 'JSON 序列化',
      badge: '数据交换',
      icon: 'VB',
      objective: '使用 JsonSerializer.Serialize(customer) 生成 JSON。',
      starterCode: '',
      sections: richSections({
        heading: '旧系统也要和现代接口交换数据',
        body: 'VB 工具经常需要把报表、客户、订单数据导成 JSON 给接口或其他系统。',
        code: 'Dim json = JsonSerializer.Serialize(customer)\nConsole.WriteLine(json)',
        model: '序列化把对象变成文本格式，方便保存和传输。',
        practice: '调用 JsonSerializer.Serialize，并输出结果。',
        pitfall: '序列化结果不是自动安全。敏感字段、日期格式、空值都要考虑。',
      }),
      tests: [
        test('vb17-json', '使用 JsonSerializer', includesAll(['JsonSerializer']), '需要 JsonSerializer。'),
        test('vb17-serialize', '调用 Serialize', matches(/\.Serialize\s*\(/), '需要 Serialize。'),
      ],
    }),
    staticLevel({
      id: 18,
      title: 'Repository 查询边界',
      badge: '数据层',
      icon: 'VB',
      objective: '定义 CustomerRepository 类，并写 FindByName(name As String) 方法。',
      starterCode: '',
      sections: richSections({
        heading: '把数据访问从按钮事件里拆出来',
        body: '很多 VB 老项目坏在按钮事件里塞满查询、计算、保存。Repository 能把数据边界先分离出来。',
        code: 'Public Class CustomerRepository\n    Public Function FindByName(name As String) As Customer\n        Return customers.First(Function(customer) customer.Name = name)\n    End Function\nEnd Class',
        model: 'Repository 专门负责查数据，界面层只关心调用结果。',
        practice: '定义类，写 FindByName，返回 Customer。',
        pitfall: '按钮事件直接查数据库会让测试和维护都很难。',
      }),
      tests: [
        test('vb18-class', '定义 CustomerRepository', matches(/Class\s+CustomerRepository/), '需要 CustomerRepository。'),
        test('vb18-find', '定义 FindByName', matches(/Function\s+FindByName\s*\(/), '需要 FindByName。'),
        test('vb18-customer', '返回 Customer', includesAll(['As Customer']), '需要返回 Customer。'),
      ],
    }),
    staticLevel({
      id: 19,
      title: 'MSTest 单元测试',
      badge: '测试',
      icon: 'VB',
      objective: '写 <TestMethod>，并用 Assert.AreEqual(5, Add(2, 3))。',
      starterCode: '',
      sections: richSections({
        heading: '遗留代码也需要测试保护',
        body: '你改旧报表或内部工具时，测试能防止“修了 A 坏了 B”。',
        code: '<TestMethod>\nPublic Sub AddsNumbers()\n    Assert.AreEqual(5, Add(2, 3))\nEnd Sub',
        model: '<TestMethod> 标记测试入口，Assert.AreEqual 写出预期结果。',
        practice: '写一个测试方法，验证 Add。',
        pitfall: '没有测试的重构就是靠运气。旧系统尤其不能靠运气。',
      }),
      tests: [
        test('vb19-testmethod', '使用 TestMethod', includesAll(['<TestMethod>']), '需要 <TestMethod>。'),
        test('vb19-assert', '使用 Assert.AreEqual', matches(/Assert\.AreEqual\s*\(/), '需要 Assert.AreEqual。'),
      ],
    }),
    staticLevel({
      id: 20,
      title: '报表自动化综合战',
      badge: '毕业',
      icon: 'VB',
      objective: '定义 ReportService，读取 customers，筛选 Active 客户并生成 summary。',
      starterCode: '',
      sections: richSections({
        heading: '把 VB 做成真正的业务自动化工具',
        body: '毕业关把集合、类、LINQ、错误处理、报表输出合成一个业务人员能理解的小模块。',
        code: 'Public Class ReportService\n    Public Function BuildSummary(customers As List(Of Customer)) As String\n        Dim active = customers.Where(Function(customer) customer.Active).ToList()\n        Return $\"Active customers: {active.Count}\"\n    End Function\nEnd Class',
        model: 'Service 接收业务数据，筛选有效客户，输出可展示的摘要。',
        practice: '定义 ReportService，写 BuildSummary，使用 Where 和 Count。',
        pitfall: '自动化工具不是跑完就算。摘要、错误提示、可复核输出都要清楚。',
      }),
      tests: [
        test('vb20-service', '定义 ReportService', matches(/Class\s+ReportService/), '需要 ReportService。'),
        test('vb20-summary', '定义 BuildSummary', matches(/Function\s+BuildSummary\s*\(/), '需要 BuildSummary。'),
        test('vb20-where', '使用 Where', matches(/\.Where\s*\(/), '需要 Where。'),
        test('vb20-count', '使用 Count', includesAll(['Count']), '需要 Count。'),
      ],
    }),
  ]
}

function genericBranches(name: string, prefix: string, accent: CourseMap['accent']): CourseMap[] {
  if (prefix === 'c') {
    return [
      branchMap('c-systems', 'C 系统编程分支', '系统', '理解操作系统旁边的代码', '进程、文件描述符、内存布局、错误码和命令行工具。', 'amber', [
        courseNode('c-cli-parser', '命令行参数解析', '用 argc/argv 做参数校验、帮助信息和错误码。', '进阶', 4, ['argc', 'argv']),
        courseNode('c-file-stream', '文件与缓冲区', '读取配置、日志和二进制块，处理缓冲区边界。', '专业', 5, ['FILE', 'buffer']),
        courseNode('c-process-exit', '退出状态与错误码', '用返回值表达程序成功、失败和调用方可读状态。', '专业', 3, ['exit code']),
        courseNode('c-capstone-tool', '系统小工具', '做一个读取文件、统计内容、输出错误码的 C 命令行工具。', '硬核', 7, ['项目', '系统'], 'capstone'),
      ]),
      branchMap('c-embedded', 'C 嵌入式与硬件分支', '硬件', '把代码写进设备里', '寄存器思维、位运算、状态机、串口数据和资源限制。', 'rose', [
        courseNode('c-bit-flags', '位标志与掩码', '用位运算保存开关状态、权限和硬件标志。', '进阶', 4, ['bit', 'mask']),
        courseNode('c-state-machine', '状态机', '把设备流程拆成 Idle、Run、Error 等明确状态。', '专业', 5, ['FSM']),
        courseNode('c-serial-parser', '串口数据解析', '解析定长/分隔符数据包，处理校验和坏包。', '硬核', 6, ['serial', 'packet']),
        courseNode('c-capstone-device', '传感器数据处理器', '做一个解析传感器数据、过滤异常、输出状态的嵌入式风格项目。', '硬核', 7, ['项目', '嵌入式'], 'capstone'),
      ]),
      branchMap('c-memory', 'C 内存与性能分支', '内存', '把“快”和“稳”拆明白', '指针、堆内存、缓存局部性、泄漏检测和性能剖析。', 'violet', [
        courseNode('c-pointer-drills', '指针训练场', '练习地址、解引用、数组指针和函数参数修改。', '专业', 5, ['pointer']),
        courseNode('c-heap-lifecycle', '堆内存生命周期', '设计 malloc/free 成对出现的资源路径。', '专业', 5, ['malloc', 'free']),
        courseNode('c-valgrind-mindset', '泄漏与越界排查', '用测试思维定位泄漏、越界和 use-after-free。', '硬核', 5, ['debug', 'memory']),
        courseNode('c-capstone-memory', '安全缓冲区模块', '做一个边界明确、错误码清楚、可复用的字符串/缓冲区模块。', '硬核', 8, ['项目', '内存'], 'capstone'),
      ]),
    ]
  }

  if (prefix === 'cpp') {
    return [
      branchMap('cpp-game-engine', 'C++ 游戏与引擎分支', '引擎', '从对象到实时循环', '游戏循环、实体组件、资源管理、碰撞、性能和工具链。', 'violet', [
        courseNode('cpp-game-loop', '实时主循环', '拆解 update/render、delta time 和输入处理。', '进阶', 4, ['game loop']),
        courseNode('cpp-ecs-lite', '实体组件模型', '用结构体和容器组织游戏对象状态。', '专业', 5, ['ECS']),
        courseNode('cpp-resource-cache', '资源缓存', '用 RAII 管理纹理、声音、配置等资源生命周期。', '硬核', 5, ['RAII', 'cache']),
        courseNode('cpp-capstone-arcade', '小型街机原型', '做一个有实体、碰撞、得分和资源管理的 C++ 小游戏模块。', '硬核', 8, ['项目', 'Game'], 'capstone'),
      ]),
      branchMap('cpp-native-apps', 'C++ 原生应用分支', '原生', '写能跑在桌面的工具', '文件索引、配置、日志、插件边界和跨平台构建。', 'cyan', [
        courseNode('cpp-file-indexer', '文件索引器', '扫描目录、读取元数据、建立查询索引。', '专业', 5, ['filesystem']),
        courseNode('cpp-config-log', '配置与日志', '读取配置并输出结构化运行日志。', '进阶', 4, ['config', 'log']),
        courseNode('cpp-cmake-layout', 'CMake 项目组织', '理解源文件、头文件、库和可执行目标。', '专业', 5, ['CMake']),
        courseNode('cpp-capstone-native', '本地性能工具', '完成一个可配置、可测试、可构建的桌面/CLI 工具。', '硬核', 7, ['项目', 'Native'], 'capstone'),
      ]),
      branchMap('cpp-performance', 'C++ 性能与模板分支', '性能', '写高性能但不失控的代码', '模板、移动语义、算法选择、内存分配和性能测量。', 'amber', [
        courseNode('cpp-move-semantics', '移动语义', '理解拷贝、移动、所有权转移和临时对象。', '硬核', 6, ['move']),
        courseNode('cpp-template-tools', '模板工具函数', '用模板写类型安全的通用算法。', '专业', 5, ['template']),
        courseNode('cpp-benchmark', '性能基准', '用数据判断热点，别靠感觉优化。', '硬核', 5, ['benchmark']),
        courseNode('cpp-capstone-fast-module', '高性能库存模块', '完成一个泛型、可测试、性能可解释的 C++ 模块。', '硬核', 8, ['项目', 'Performance'], 'capstone'),
      ]),
    ]
  }

  if (prefix === 'java') {
    return [
      branchMap('java-backend', 'Java 后端服务分支', '后端', '从对象到接口服务', 'HTTP、DTO、Service、Repository、异常、测试和 Spring 思维。', 'rose', [
        courseNode('java-http-controller', 'Controller 入口', '理解请求参数、响应对象和状态码。', '进阶', 4, ['HTTP', 'Controller']),
        courseNode('java-service-layer', 'Service 业务层', '把业务规则从入口拆到服务类里。', '专业', 5, ['Service']),
        courseNode('java-repository', 'Repository 数据边界', '把数据访问和业务逻辑分开。', '专业', 5, ['Repository']),
        courseNode('java-capstone-api', '订单 API 模块', '完成一个含 DTO、Service、异常和测试的 Java API 小模块。', '硬核', 8, ['项目', 'API'], 'capstone'),
      ]),
      branchMap('java-android', 'Java Android 分支', 'Android', '把 Java 用到移动端', 'Activity 生命周期、列表、点击事件、网络请求和本地状态。', 'emerald', [
        courseNode('java-activity-life', 'Activity 生命周期', '理解 onCreate、onStart、onResume 的职责。', '进阶', 4, ['Android']),
        courseNode('java-click-list', '列表与点击', '处理 RecyclerView 风格的数据展示和点击动作。', '专业', 5, ['UI', 'List']),
        courseNode('java-mobile-state', '移动端状态', '保存表单、偏好和页面状态。', '专业', 4, ['State']),
        courseNode('java-capstone-mobile', '习惯追踪 App 模块', '设计一个含列表、状态和本地存储的 Android 风格项目。', '硬核', 7, ['项目', 'Mobile'], 'capstone'),
      ]),
      branchMap('java-quality', 'Java 工程质量分支', '质量', '让大型代码不散架', '接口、泛型、测试、日志、异常边界和构建工具。', 'amber', [
        courseNode('java-generics', '泛型与集合', '写类型安全的集合工具和返回值。', '专业', 5, ['Generics']),
        courseNode('java-junit', 'JUnit 测试', '为方法、Service 和异常路径写测试。', '专业', 5, ['JUnit']),
        courseNode('java-logging', '日志与异常策略', '让线上问题能被定位，而不是靠猜。', '专业', 4, ['Logging']),
        courseNode('java-capstone-quality', '可测试服务模块', '把一个业务类升级成带测试、日志、异常策略的模块。', '硬核', 7, ['项目', 'Quality'], 'capstone'),
      ]),
    ]
  }

  if (prefix === 'csharp') {
    return [
      branchMap('csharp-dotnet-api', 'C# .NET API 分支', '.NET', '构建可发布的后端服务', 'Minimal API、DTO、依赖注入、EF Core、鉴权和日志。', 'cyan', [
        courseNode('cs-minimal-api', 'Minimal API', '定义路由、请求参数和 JSON 响应。', '进阶', 4, ['ASP.NET']),
        courseNode('cs-di-service', '依赖注入与服务层', '用接口和服务拆业务边界。', '专业', 5, ['DI', 'Service']),
        courseNode('cs-ef-core', 'EF Core 数据模型', '理解实体、DbContext、迁移和查询。', '专业', 6, ['EF Core']),
        courseNode('cs-capstone-api', '任务管理 API', '完成一个含模型、服务、数据和错误处理的 .NET API。', '硬核', 8, ['项目', '.NET'], 'capstone'),
      ]),
      branchMap('csharp-unity', 'C# Unity 游戏分支', 'Unity', '把脚本挂进游戏世界', 'MonoBehaviour、输入、物理、UI、协程和游戏状态。', 'violet', [
        courseNode('cs-monobehaviour', 'MonoBehaviour 生命周期', '理解 Start、Update、OnEnable 的执行时机。', '进阶', 4, ['Unity']),
        courseNode('cs-unity-input', '输入与移动', '处理键盘、手柄、移动速度和帧率。', '专业', 5, ['Input']),
        courseNode('cs-coroutine', '协程与时间', '用 Coroutine 管理延迟、冷却和动画流程。', '专业', 5, ['Coroutine']),
        courseNode('cs-capstone-unity', 'Unity 任务原型', '做一个含角色移动、UI、计分和状态管理的游戏原型。', '硬核', 8, ['项目', 'Game'], 'capstone'),
      ]),
      branchMap('csharp-desktop', 'C# 桌面与工具分支', '桌面', '写给人真正使用的小工具', 'WinUI/WPF 思维、文件、设置、表格、异步和发布。', 'emerald', [
        courseNode('cs-wpf-binding', '数据绑定', '理解属性变化、列表显示和 UI 状态同步。', '专业', 5, ['WPF', 'Binding']),
        courseNode('cs-file-json', '文件与 JSON', '读取配置、保存用户数据和导出结果。', '进阶', 4, ['JSON', 'File']),
        courseNode('cs-desktop-async', '桌面异步', '避免 UI 卡死，处理后台任务和取消。', '专业', 5, ['async']),
        courseNode('cs-capstone-tool', '桌面效率工具', '完成一个有设置、文件、异步和结果导出的桌面工具。', '硬核', 7, ['项目', 'Desktop'], 'capstone'),
      ]),
    ]
  }

  if (prefix === 'js') {
    return [
      branchMap('js-frontend', 'JavaScript 前端交互分支', '前端', '让页面真正响应用户', 'DOM、事件、表单、状态、动画、可访问性和组件思维。', 'emerald', [
        courseNode('js-dom-form', '表单与校验', '读取输入、显示错误、阻止无效提交。', '进阶', 4, ['DOM', 'Form']),
        courseNode('js-state-render', '状态驱动渲染', '让数据变化统一驱动界面变化。', '专业', 5, ['State']),
        courseNode('js-accessible-ui', '可访问交互', '键盘焦点、按钮语义、ARIA 和可读状态。', '专业', 4, ['A11y']),
        courseNode('js-capstone-widget', '互动组件项目', '完成一个可搜索、可筛选、可保存状态的小组件。', '硬核', 7, ['项目', 'Frontend'], 'capstone'),
      ]),
      branchMap('js-node', 'JavaScript Node.js 分支', 'Node', '把 JS 用在服务端和工具链', '文件系统、CLI、HTTP 服务、包管理和脚本自动化。', 'cyan', [
        courseNode('js-node-fs', '文件系统脚本', '读取目录、处理文本、生成输出文件。', '进阶', 4, ['Node', 'fs']),
        courseNode('js-cli-tool', 'CLI 工具', '解析参数、输出帮助、处理错误码。', '专业', 5, ['CLI']),
        courseNode('js-http-server', 'HTTP 服务', '用 Node 理解请求、响应和 JSON API。', '专业', 5, ['HTTP']),
        courseNode('js-capstone-node', '开发者自动化工具', '做一个能扫描文件、生成报告、可配置的 Node 工具。', '硬核', 7, ['项目', 'Node'], 'capstone'),
      ]),
      branchMap('js-async-product', 'JavaScript 异步产品分支', '异步', '真实 Web 产品的难点', 'Promise、fetch、缓存、乐观更新、错误恢复和测试。', 'amber', [
        courseNode('js-fetch-cache', '请求与缓存', '设计加载、缓存、刷新和失败状态。', '专业', 5, ['fetch', 'cache']),
        courseNode('js-optimistic-ui', '乐观 UI', '先更新界面，再处理接口成功或回滚。', '硬核', 5, ['optimistic']),
        courseNode('js-test-async', '异步测试', '测试 Promise、事件和定时器。', '专业', 5, ['Testing']),
        courseNode('js-capstone-dashboard', '前端数据面板', '完成一个含请求、缓存、筛选、错误恢复的数据面板。', '硬核', 8, ['项目', 'Dashboard'], 'capstone'),
      ]),
    ]
  }

  if (prefix === 'vb') {
    return [
      branchMap('vb-office', 'Visual Basic Office 自动化分支', 'Office', '把 Excel 和报表流程自动化', 'Excel 对象模型、批量处理、报表导出、按钮宏和错误处理。', 'cyan', [
        courseNode('vb-excel-ranges', 'Excel Range 操作', '读取单元格、区域和表格数据。', '进阶', 4, ['Excel', 'Range']),
        courseNode('vb-report-export', '报表导出', '汇总数据并生成可读报表。', '专业', 5, ['Report']),
        courseNode('vb-macro-buttons', '按钮与宏流程', '把业务动作挂到用户能点击的入口。', '专业', 4, ['Macro']),
        courseNode('vb-capstone-office', 'Excel 自动报表工具', '完成一个读取、汇总、校验、导出的一键报表项目。', '硬核', 7, ['项目', 'Office'], 'capstone'),
      ]),
      branchMap('vb-winforms', 'Visual Basic WinForms 分支', '窗体', '快速做内部业务工具', '窗体事件、数据绑定、输入校验、文件保存和用户反馈。', 'emerald', [
        courseNode('vb-form-events', '窗体事件流', '理解 Load、Click、TextChanged 的触发时机。', '进阶', 4, ['WinForms']),
        courseNode('vb-grid-binding', '表格与绑定', '把业务列表展示到表格，并处理选择行。', '专业', 5, ['DataGrid']),
        courseNode('vb-form-validation', '输入校验', '校验必填、数字、金额和错误提示。', '专业', 4, ['Validation']),
        courseNode('vb-capstone-crm', '客户管理小工具', '完成一个客户录入、查询、编辑、导出的 WinForms 风格项目。', '硬核', 8, ['项目', 'CRM'], 'capstone'),
      ]),
      branchMap('vb-modernize', 'Visual Basic 维护与现代化分支', '维护', '把旧系统慢慢救回来', '代码阅读、模块拆分、测试补洞、迁移到 .NET 和风险控制。', 'amber', [
        courseNode('vb-read-legacy', '阅读遗留代码', '从事件、全局变量和表单依赖里理出业务流程。', '专业', 5, ['Legacy']),
        courseNode('vb-refactor-module', '模块拆分', '把按钮事件里的业务逻辑拆成函数和类。', '专业', 5, ['Refactor']),
        courseNode('vb-add-tests', '补测试与样例', '用输入输出样例保护旧逻辑不被改坏。', '硬核', 5, ['Testing']),
        courseNode('vb-capstone-modernize', '旧报表模块现代化', '把一个旧式报表流程改成可读、可测、可迁移的模块。', '硬核', 8, ['项目', 'Modernize'], 'capstone'),
      ]),
    ]
  }

  return [
    branchMap(`${prefix}-core`, `${name} 工程基础分支`, '工程', '从语法到工程组织', `项目结构、调试、依赖、错误处理和可维护代码。`, accent, [
      courseNode(`${prefix}-project-layout`, '项目结构', '理解源文件、入口、构建配置和目录边界。', '进阶', 3, ['Project']),
      courseNode(`${prefix}-debugging`, '调试与错误定位', '使用断点、日志、错误栈定位问题。', '进阶', 4, ['Debug']),
      courseNode(`${prefix}-testing`, '测试基础', '写最小单元测试并组织可重复验证。', '专业', 4, ['Testing']),
      courseNode(`${prefix}-capstone-cli`, '命令行工具项目', '做一个能解析输入、输出结果、处理错误的小工具。', '专业', 5, ['项目'], 'capstone'),
    ]),
  ]
}

const cLevels = [
  ...deepenLevels(createCLevels(), {
    1: 'C 的第一关训练的是操作系统如何进入你的程序。以后写驱动、命令行工具、嵌入式固件，都从入口和退出状态开始。',
    2: '格式化输出是日志、调试和串口输出的基础。类型和格式符对齐，才能读懂底层程序的状态。',
    3: '条件分支在 C 里经常承担硬件状态、错误码和输入校验。它不是考试语法，是系统防线。',
    4: '数组和循环是处理传感器数据、网络缓冲区、日志批次的基本动作。边界意识从这里开始。',
    5: '函数让 C 程序从一坨 main 变成可测试模块。系统代码能不能维护，很多时候就看函数边界。',
    6: '指针是 C 的灵魂，也是事故现场。理解地址和解引用，才可能读懂内存、I/O 和系统 API。',
  }, {
    1: '漏掉 `#include <stdio.h>`、忘写 `return 0;`、printf 不加换行，都会让第一段 C 看起来很别扭。',
    2: '`%d`、`%f`、变量类型不匹配时，输出可能像坏掉的仪表盘。C 不会温柔提醒你。',
    3: '条件表达式里把 `=` 当 `==` 用，是 C 新手经典翻车。赋值和比较必须分清。',
    4: '数组越界不会自动拦你。`i < 5` 这种边界要自己守。',
    5: '函数签名、声明顺序、返回类型都要一致。C 编译器对这些很认真。',
    6: '`&` 是取地址，`*` 是解引用。两个符号混了，代码就不是代码，是抽奖。',
  }),
  ...createCAdvancedLevels(),
  ...createCExpertLevels(),
]
const cppLevels = [
  ...deepenLevels(createCppLevels(), {
    1: 'C++ 的第一步不是“更复杂的 C”，而是用流、对象和标准库建立现代入口。',
    2: '`std::string` 和 `auto` 让你少碰裸字符数组和啰嗦类型，日常工程里非常常见。',
    3: '`vector` 是 C++ 处理连续数据的主力。游戏对象、订单列表、采样数据都离不开它。',
    4: 'const 引用是 C++ 函数边界的基本礼貌：不拷贝、不乱改、意图清楚。',
    5: 'class 是把状态和行为放在一起。C++ 项目复杂起来后，封装能力直接决定代码寿命。',
    6: 'RAII 是现代 C++ 的核心习惯。资源交给对象生命周期，不要靠记忆力管理 delete。',
  }, {
    1: '别把 `std::`、分号、头文件当小事。C++ 第一关就是练工程细节。',
    2: '`auto` 不是偷懒神器。类型明显时用它，类型会影响阅读时就别乱省。',
    3: 'range-for 适合读元素；要改元素时要考虑引用 `auto&`。',
    4: '大对象按值传参会产生拷贝。C++ 的性能坑很多从这里开始。',
    5: '成员变量全 public 会让类失去意义。封装不是装饰，是边界。',
    6: '智能指针不是越多越好。先搞清楚谁拥有资源，再选择 unique/shared。',
  }),
  ...createCppAdvancedLevels(),
  ...createCppExpertLevels(),
]
const javaLevels = [
  ...deepenLevels(createJavaLevels(), {
    1: 'Java 入口看起来长，是因为它从第一天就把类、静态方法和运行参数摆在你面前。',
    2: '类型声明训练的是后端数据契约。年龄、价格、名字、状态都应该有明确类型。',
    3: 'if/else 是业务规则的第一层，比如成绩、权限、订单状态、接口结果。',
    4: 'ArrayList 是 Java 业务列表的入口。用户列表、订单列表、消息列表都从这里开始。',
    5: '方法拆分让 main 不再臃肿。Java 工程依赖清晰的方法边界组织服务。',
    6: '类建模是 Java 的核心。字段和构造方法会一路延伸到实体、DTO、Service。',
  }, {
    1: 'main 签名写错，程序连入口都找不到。`String[] args` 别随手改形状。',
    2: '`String` 首字母大写，因为它是类。Java 的大小写不是摆设。',
    3: '条件分支别只写 happy path。真实业务永远有 retry、invalid、fallback。',
    4: 'ArrayList 要导包，泛型也要写清。裸 List 会让类型安全缩水。',
    5: '方法必须写在类里。Java 不是脚本，不能把函数随便丢文件顶层。',
    6: '`this.name = name` 是把参数写入字段，少了 this 很容易读混。',
  }),
  ...createJavaAdvancedLevels(),
  ...createJavaExpertLevels(),
]
const csharpLevels = [
  ...deepenLevels(createCSharpLevels(), {
    1: 'C# 第一关把 .NET 控制台入口跑通，后面 Web API、Unity、桌面工具都要靠这个运行模型。',
    2: '显式类型和 var 是 C# 的日常平衡：既要简洁，也要让代码读得出业务含义。',
    3: '条件判断会出现在表单校验、游戏状态、接口分流和后台规则里。',
    4: 'List<T> 和 foreach 是 C# 处理集合的常规动作，业务系统天天用。',
    5: '方法命名和返回值是 C# 可维护性的基础。短方法可以用表达式体，但别牺牲清晰度。',
    6: '属性是 C# 对象模型的招牌。它比裸字段更适合 UI 绑定、序列化和业务对象。',
  }, {
    1: '`Console.WriteLine` 大小写要准。C# 对标识符大小写敏感。',
    2: '`var` 不是动态类型。它只是让编译器推断，类型仍然固定。',
    3: '条件里不要混太多业务。复杂规则后面应该抽成方法。',
    4: 'List<T> 需要泛型类型。集合里到底放什么，要说清楚。',
    5: 'C# 方法通常 PascalCase。命名风格混乱会让项目很快显得不专业。',
    6: '自动属性简单，但重要状态别都开放 public set。',
  }),
  ...createCSharpAdvancedLevels(),
  ...createCSharpExpertLevels(),
]
const javascriptLevels = [
  ...deepenLevels(createJavaScriptLevels(), {
    1: 'JS 的第一句输出既能跑在浏览器，也能跑在 Node。它是 Web 世界的入口信号。',
    2: 'let/const 训练的是状态意识。哪些会变、哪些不该变，要从变量声明开始表达。',
    3: '条件判断在 JS 里还牵涉 truthy/falsy。前端 bug 很多来自“看起来像 false”的值。',
    4: '数组方法是现代 JS 的核心。map/filter/reduce 会一路用到前端渲染和数据转换。',
    5: '函数是 JS 的基本组织单位，也是事件回调、模块导出和异步流程的基础。',
    6: 'async/await 是现代 Web 的日常。接口、数据库、文件、用户操作都离不开异步。',
  }, {
    1: 'console.log 能调试，但不要把它当产品输出。真实应用要更新 UI 或返回数据。',
    2: '别再用 var 起手。作用域和提升会给新手制造很多无意义的坑。',
    3: '`==` 会类型转换，入门阶段优先用 `===` 建立稳定判断。',
    4: 'map 应该返回新数组，不适合拿来做纯副作用循环。',
    5: '函数如果没有 return，就会返回 undefined。这个坑在 JS 里很常见。',
    6: 'await 只能在 async 函数或模块顶层合理使用。别把异步当同步硬写。',
  }),
  ...createJavaScriptAdvancedLevels(),
  ...createJavaScriptExpertLevels(),
]
const visualBasicLevels = [
  ...deepenLevels(createVisualBasicLevels(), {
    1: 'VB 的入口适合理解 .NET 控制台结构。很多业务小工具就是从 Module 和 Sub Main 开始。',
    2: 'Dim/As 的写法很接近英文，适合把业务数据类型写清楚。',
    3: 'If/Else 是审批、状态、报表分类的基本逻辑。VB 的块结构读起来很直白。',
    4: 'For Each 非常适合处理客户列表、订单列表、表格行这类业务集合。',
    5: 'Function 把业务规则抽出来，避免按钮事件里塞满计算细节。',
    6: 'Class 和 Property 是 VB 业务系统建模的基础，尤其适合桌面工具和内部系统。',
  }, {
    1: 'VB 块结构一定要写结束语句。`End Sub`、`End Module` 不是可选装饰。',
    2: '类型写错会影响后面计算。金额、数量、文本不要混着声明。',
    3: '`Then` 和 `End If` 都要有。VB 的清晰来自完整块结构。',
    4: 'For Each 末尾是 `Next`。别把 C 系花括号习惯带进来。',
    5: 'Function 有返回值，Sub 没有返回值。两者职责别混。',
    6: '构造方法是 `Sub New`。这和 C#/Java 的命名方式不一样。',
  }),
  ...createVisualBasicAdvancedLevels(),
  ...createVisualBasicExpertLevels(),
]

export const LANGUAGE_MODULES: LearningLanguage[] = [
  {
    id: 'python',
    name: 'Python',
    shortName: 'Python',
    route: 'python',
    runtime: 'python-pyodide',
    editorLanguage: 'python',
    progressOffset: 0,
    accent: 'cyan',
    tagline: 'AI、自动化、数据、Web 和视觉应用的高效入口。',
    description: '保留完整 Pyodide 实时运行环境，20 个基础节点加专业领域分支。',
    domainLabel: 'Python Branch Atlas',
    levels: LEVELS,
    courseMaps: COURSE_MAPS,
  },
  {
    id: 'c',
    name: 'C',
    shortName: 'C',
    route: 'c',
    runtime: 'server-exec',
    editorLanguage: 'plain',
    progressOffset: 1000,
    accent: 'amber',
    tagline: '系统、内存、嵌入式和性能工程的地基。',
    description: '从 main、类型、数组、函数到指针，先把底层思维打稳。',
    domainLabel: 'C Systems Atlas',
    levels: cLevels,
    courseMaps: [foundationMap('C', cLevels, 'amber'), ...genericBranches('C', 'c', 'amber')],
  },
  {
    id: 'cpp',
    name: 'C++',
    shortName: 'C++',
    route: 'cpp',
    runtime: 'server-exec',
    editorLanguage: 'plain',
    progressOffset: 2000,
    accent: 'violet',
    tagline: '高性能应用、游戏引擎、交易系统和复杂工程。',
    description: '从 cout、vector、引用、class 到 RAII，建立现代 C++ 习惯。',
    domainLabel: 'C++ Engineering Atlas',
    levels: cppLevels,
    courseMaps: [foundationMap('C++', cppLevels, 'violet'), ...genericBranches('C++', 'cpp', 'violet')],
  },
  {
    id: 'java',
    name: 'Java',
    shortName: 'Java',
    route: 'java',
    runtime: 'server-exec',
    editorLanguage: 'plain',
    progressOffset: 3000,
    accent: 'rose',
    tagline: '后端服务、Android、企业系统和大型工程协作。',
    description: '从 Main、类型、ArrayList、方法到类建模，接入 Java 生态。',
    domainLabel: 'Java Platform Atlas',
    levels: javaLevels,
    courseMaps: [foundationMap('Java', javaLevels, 'rose'), ...genericBranches('Java', 'java', 'rose')],
  },
  {
    id: 'csharp',
    name: 'C#',
    shortName: 'C#',
    route: 'csharp',
    runtime: 'server-exec',
    editorLanguage: 'plain',
    progressOffset: 4000,
    accent: 'cyan',
    tagline: '.NET、Unity、桌面工具、后端服务和企业应用。',
    description: '从 Console、类型、List、方法到属性和类，打通 C# 入门。',
    domainLabel: 'C# .NET Atlas',
    levels: csharpLevels,
    courseMaps: [foundationMap('C#', csharpLevels, 'cyan'), ...genericBranches('C#', 'csharp', 'cyan')],
  },
  {
    id: 'javascript',
    name: 'JavaScript',
    shortName: 'JS',
    route: 'javascript',
    runtime: 'server-exec',
    editorLanguage: 'plain',
    progressOffset: 5000,
    accent: 'emerald',
    tagline: 'Web 前端、Node.js、全栈应用和自动化脚本。',
    description: '从 console.log、let/const、数组方法、函数到 async/await。',
    domainLabel: 'JavaScript Web Atlas',
    levels: javascriptLevels,
    courseMaps: [foundationMap('JavaScript', javascriptLevels, 'emerald'), ...genericBranches('JavaScript', 'js', 'emerald')],
  },
  {
    id: 'visual-basic',
    name: 'Visual Basic',
    shortName: 'VB',
    route: 'visual-basic',
    runtime: 'server-exec',
    editorLanguage: 'plain',
    progressOffset: 6000,
    accent: 'cyan',
    tagline: '桌面工具、Office 自动化、业务系统和 .NET 维护。',
    description: '从 Module、Dim、If、For Each、Function 到 Class。',
    domainLabel: 'Visual Basic Business Atlas',
    levels: visualBasicLevels,
    courseMaps: [foundationMap('Visual Basic', visualBasicLevels, 'cyan'), ...genericBranches('Visual Basic', 'vb', 'cyan')],
  },
]

export function getLanguageModule(routeOrId: string | undefined | null) {
  const normalized = (routeOrId ?? 'python').toLowerCase()
  return LANGUAGE_MODULES.find((module) => module.id === normalized || module.route === normalized) ?? LANGUAGE_MODULES[0]
}

export function toStorageLevelId(module: LearningLanguage, localLevelId: number) {
  return module.progressOffset + localLevelId
}

export function isModuleLevelCompleted(module: LearningLanguage, localLevelId: number, progress: { level_id: number; is_completed: boolean }[]) {
  const storageId = toStorageLevelId(module, localLevelId)
  return progress.some((item) => item.level_id === storageId && item.is_completed)
}

export function completedModuleLevelIds(module: LearningLanguage, progress: { level_id: number; is_completed: boolean }[]) {
  return module.levels
    .filter((level) => isModuleLevelCompleted(module, level.id, progress))
    .map((level) => level.id)
}

export function nextModuleLevelId(module: LearningLanguage, progress: { level_id: number; is_completed: boolean }[]) {
  return module.levels.find((level) => !isModuleLevelCompleted(module, level.id, progress))?.id ?? module.levels[module.levels.length - 1].id
}
