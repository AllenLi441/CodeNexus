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
        },
        {
          heading: '通关检查',
          body: tests.map((item, index) => `${index + 1}. ${item.description}`).join('\n'),
          warning: '如果测试没过，先看第一个失败提示。别同时改三处，不然你连自己修好了什么都不知道。',
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

function genericBranches(name: string, prefix: string, accent: CourseMap['accent']): CourseMap[] {
  return [
    branchMap(`${prefix}-core`, `${name} 工程基础分支`, '工程', '从语法到工程组织', `项目结构、调试、依赖、错误处理和可维护代码。`, accent, [
      courseNode(`${prefix}-project-layout`, '项目结构', '理解源文件、入口、构建配置和目录边界。', '进阶', 3, ['Project']),
      courseNode(`${prefix}-debugging`, '调试与错误定位', '使用断点、日志、错误栈定位问题。', '进阶', 4, ['Debug']),
      courseNode(`${prefix}-testing`, '测试基础', '写最小单元测试并组织可重复验证。', '专业', 4, ['Testing']),
      courseNode(`${prefix}-capstone-cli`, '命令行工具项目', '做一个能解析输入、输出结果、处理错误的小工具。', '专业', 5, ['项目'], 'capstone'),
    ]),
    branchMap(`${prefix}-apps`, `${name} 应用开发分支`, '应用', '把语言用到真实产品', `桌面、Web、服务端、工具和业务系统方向。`, accent === 'cyan' ? 'emerald' : 'cyan', [
      courseNode(`${prefix}-io`, '文件与数据 I/O', '读取、写入、解析文本/JSON/CSV 数据。', '进阶', 4, ['I/O']),
      courseNode(`${prefix}-api`, 'HTTP / API', '理解请求、响应、JSON 和错误处理。', '专业', 5, ['HTTP', 'API']),
      courseNode(`${prefix}-ui`, '界面入口', '按语言生态选择桌面、Web 或组件化 UI。', '专业', 5, ['UI']),
      courseNode(`${prefix}-capstone-app`, '完整应用项目', '完成一个带输入、状态、存储和交互的应用。', '硬核', 7, ['项目'], 'capstone'),
    ]),
    branchMap(`${prefix}-advanced`, `${name} 进阶能力分支`, '进阶', '性能、并发和生态', `学习这门语言真正拉开差距的部分。`, 'amber', [
      courseNode(`${prefix}-types`, '类型系统进阶', '理解泛型、接口/协议、类型约束和抽象边界。', '专业', 5, ['Types']),
      courseNode(`${prefix}-concurrency`, '并发模型', '理解线程、异步、任务、锁或事件循环。', '硬核', 6, ['Concurrency']),
      courseNode(`${prefix}-performance`, '性能与内存', '识别热点、分配、拷贝、生命周期和性能测试。', '硬核', 5, ['Performance']),
      courseNode(`${prefix}-capstone-system`, '生产级模块', '做一个可测试、可配置、可发布的语言模块。', '硬核', 7, ['项目'], 'capstone'),
    ]),
  ]
}

const cLevels = createCLevels()
const cppLevels = createCppLevels()
const javaLevels = createJavaLevels()
const csharpLevels = createCSharpLevels()
const javascriptLevels = createJavaScriptLevels()
const visualBasicLevels = createVisualBasicLevels()

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
