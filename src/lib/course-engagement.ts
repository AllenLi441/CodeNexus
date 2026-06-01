import type { CourseNode } from '@/lib/course-maps'
import type { Level } from '@/lib/levels'

export type LevelMission = {
  kicker: string
  brief: string
  constraint: string
  payoff: string
}

export type LanguageRouteSnapshot = {
  role: string
  starterProject: string
  advancedProject: string
  runtimeNote: string
}

export type FailureDiagnosis = {
  area: string
  reason: string
  nextStep: string
  directMode: boolean
}

export type TeachingBlueprint = {
  concept: string
  realUse: string
  mentalModel: string
  walkthrough: { title: string; body: string }[]
  learnFirst: string[]
  practiceSteps: string[]
  pitfalls: string[]
  vocabulary: { term: string; meaning: string }[]
  reviewQuestions: string[]
  checkpoint: string
  stretchGoal: string
}

const LANGUAGE_CONTEXT: Record<string, { arena: string; artifact: string; tone: string }> = {
  Python: {
    arena: '自动化脚本、数据任务和 AI 原型',
    artifact: '一个能立刻运行的小工具',
    tone: '别急着谈大模型，先让代码听话。',
  },
  C: {
    arena: '嵌入式、系统工具和性能敏感模块',
    artifact: '一段可编译、边界清楚的底层代码',
    tone: '这里没有魔法，只有内存和你写错的分号。',
  },
  'C++': {
    arena: '游戏引擎、高性能服务和复杂工程',
    artifact: '一个可复用、别乱拷贝资源的小模块',
    tone: '性能很迷人，前提是你先别把对象生命周期写炸。',
  },
  Java: {
    arena: '后端服务、Android 和企业级系统',
    artifact: '一个类型清楚、结构稳的业务单元',
    tone: '少一点仪式感，多一点清楚的边界。',
  },
  'C#': {
    arena: '.NET 服务、Unity 和桌面工具',
    artifact: '一个可读、可扩展的应用组件',
    tone: '别把属性和字段搅成一锅，用户不背这个锅。',
  },
  JavaScript: {
    arena: 'Web 产品、Node 服务和交互界面',
    artifact: '一段能驱动真实交互的前端/脚本逻辑',
    tone: '页面不会因为你会写花哨动画就自动变可靠。',
  },
  'Visual Basic': {
    arena: 'Office 自动化、桌面工具和业务系统维护',
    artifact: '一个能减少重复劳动的业务小组件',
    tone: '老系统也要有人救，别一边嫌弃一边不会改。',
  },
}

const LEVEL_SCENES = [
  '你收到一张很小但真实的工单',
  '把这关当成一次上线前的最小验证',
  '小助手标记了一个微型故障现场',
  '产品经理只给了一个目标，剩下靠你把逻辑写清楚',
  '这不是炫技题，是让代码交付一个明确结果',
  '你正在搭一块后面会反复用到的基础零件',
]

function contextFor(languageName: string) {
  return LANGUAGE_CONTEXT[languageName] ?? {
    arena: `${languageName} 项目`,
    artifact: '一个语义清楚的小模块',
    tone: '先把目标写对，再考虑写得漂亮。',
  }
}

function levelIntent(level: Level) {
  const text = `${level.title} ${level.objective}`.toLowerCase()
  if (level.id === 20) return '把类、函数、集合、异常处理和装饰器融合成一个可运行的小项目'
  if (/hello|输出|print|console|printf/.test(text)) return '让程序对外发出第一条可验证信号'
  if (/变量|类型|string|int|double|dim|const|let|var/.test(text)) return '把数据命名、分类，并保持后续逻辑读得懂'
  if (/if|else|条件|判断|分支/.test(text)) return '让程序在不同情况里做不同选择'
  if (/循环|for|while|array|list|数组|列表|foreach|vector/.test(text)) return '让重复工作交给结构化流程处理'
  if (/函数|方法|function|method|add/.test(text)) return '把一段逻辑拆成可以复用和测试的单元'
  if (/class|对象|属性|property|user|counter/.test(text)) return '把状态和行为收进一个清楚的模型'
  if (/指针|内存|raii|unique_ptr/.test(text)) return '直接面对资源和生命周期，别让隐患藏在底层'
  if (/async|await|异步|fetch/.test(text)) return '处理等待中的任务，同时保持流程可读'
  return `完成目标：${level.objective}`
}

function lessonText(level: Level) {
  return `${level.title} ${level.objective} ${level.badge}`.toLowerCase()
}

function firstCodeLine(level: Level) {
  const code = level.sections.find((section) => section.codeBlock)?.codeBlock?.code ?? level.starterCode
  return code.split('\n').map((line) => line.trim()).find((line) => line && !line.startsWith('#') && !line.startsWith('//')) ?? level.objective
}

function teachingWalkthrough(languageName: string, level: Level, concept: string) {
  const text = lessonText(level)
  const coreLine = firstCodeLine(level)

  if (level.id === 20) {
    return [
      {
        title: '先定游戏世界的骨架',
        body: '最终关不是拼语法清单，而是把角色、物品、动作和输出日志组织成一个能运行的小系统。先把对象关系想清楚，代码才不会散。',
      },
      {
        title: '用函数和方法拆动作',
        body: `像 \`${coreLine}\` 这样的导入只是工具入口。真正要交付的是：角色能拾取物品、使用物品、处理错误，并输出完整过程。`,
      },
      {
        title: '异常处理负责兜底',
        body: '项目题最怕只在正常路径能跑。不存在的物品、错误输入、空背包这些情况都要有可解释的反馈，而不是直接崩掉。',
      },
    ]
  }

  if (/hello|输出|print|console|printf|write(line)?/.test(text)) {
    return [
      {
        title: '入口先说人话',
        body: `${languageName} 程序先执行入口附近的语句。你这一关不是“会背输出函数”，而是能让程序向终端交付一条可验证的信息。`,
      },
      {
        title: '引号里是内容，引号外是指令',
        body: `像 \`${coreLine}\` 这种结构，函数名负责动作，括号负责传参，引号里的文本才是最终被输出的内容。`,
      },
      {
        title: '测试只认结果',
        body: '肉眼看到类似文本不够，大小写、标点、空格都可能让自动检查失败。训练目标是写出稳定可复现的结果。',
      },
    ]
  }

  if (/变量|类型|string|int|double|dim|const|let|var|f-string/.test(text)) {
    return [
      {
        title: '先给数据起名字',
        body: '变量把一段数据从“散落的值”变成“可被复用的含义”。名字越具体，后面越少靠猜。',
      },
      {
        title: '类型决定能做什么',
        body: `${languageName} 里的值不是都一样。数字能计算，字符串适合展示，布尔值负责判断。别把它们混着用。`,
      },
      {
        title: '输出是一次组装',
        body: '把变量放进文本时，先确认每个变量的值，再确认格式化方式。最后输出的是用户能读懂的句子，不是代码作者的脑补。',
      },
    ]
  }

  if (/if|else|条件|判断|分支|switch/.test(text)) {
    return [
      {
        title: '条件是岔路口',
        body: '程序不会“理解情况”，它只会判断表达式真假。你要把业务规则写成明确条件。',
      },
      {
        title: '每条路只管一种情况',
        body: '先写清楚 if 负责什么，再写 else 或兜底负责什么。不要让两个分支输出同一类结果。',
      },
      {
        title: '边界值最容易露馅',
        body: '大于、小于、等于这几个符号决定了临界点归谁。测试经常盯的就是这些地方。',
      },
    ]
  }

  if (/循环|for|while|array|list|数组|列表|foreach|vector|map/.test(text)) {
    return [
      {
        title: '循环是可控重复',
        body: '循环不是让代码转圈，而是把同一个动作稳定作用到一组数据上。每轮只处理一个清楚的小任务。',
      },
      {
        title: '先集合，再规则',
        body: '先确认数据从哪里来、每一项是什么，再决定每轮要打印、累计、筛选还是转换。',
      },
      {
        title: '退出条件要看得见',
        body: 'while 或无限序列最怕没有退出条件。写循环时先问自己：它什么时候停？停不下来就是事故。',
      },
    ]
  }

  if (/函数|方法|function|method|add|return/.test(text)) {
    return [
      {
        title: '函数是一台小机器',
        body: '参数是输入，函数体是处理规则，return 或输出是交付。边界清楚，复用才有意义。',
      },
      {
        title: '命名暴露设计水平',
        body: '函数名应该说明动作，参数名说明数据。读者不该靠猜测理解这段逻辑。',
      },
      {
        title: '定义和调用是两件事',
        body: '只写函数定义不会自动执行。必须在合适位置调用它，测试才会看到结果。',
      },
    ]
  }

  if (/class|对象|属性|property|user|counter|constructor|构造/.test(text)) {
    return [
      {
        title: '对象是有记忆的模型',
        body: '属性保存状态，方法改变或读取状态。把相关数据和动作放在一起，项目才不会越写越散。',
      },
      {
        title: '构造阶段先把状态立住',
        body: '对象创建时必须把关键字段初始化清楚。后面每个方法都默认这些状态可靠存在。',
      },
      {
        title: '行为要围绕状态',
        body: '别为了写 class 而写 class。方法应该让对象完成真实动作，比如更新计数、生成描述或执行业务规则。',
      },
    ]
  }

  if (/指针|内存|raii|unique_ptr|引用|reference/.test(text)) {
    return [
      {
        title: '地址不是值本身',
        body: '值存在内存里，地址只是位置。通过指针或引用操作时，先确认你拿到的是谁、它还活着没有。',
      },
      {
        title: '所有权决定谁收尾',
        body: '资源要有负责人。没有明确所有权，泄漏、重复释放和悬空引用会把问题藏到最难排查的地方。',
      },
      {
        title: '先写保守代码',
        body: '底层能力不是炫技场。先让生命周期清楚、边界可见，再考虑优化。',
      },
    ]
  }

  if (/async|await|异步|fetch|promise/.test(text)) {
    return [
      {
        title: '等待是流程的一部分',
        body: '异步代码不是乱序魔法。它只是把“现在拿不到结果”的任务标出来，等结果回来再继续。',
      },
      {
        title: 'await 后才是真值',
        body: '没有 await 时，你手里可能只是未来结果的承诺。要明确每一步拿到的到底是 Promise 还是数据。',
      },
      {
        title: '失败路径要提前想',
        body: '网络、文件、接口都会失败。异步流程没有错误处理，就等于把用户体验交给运气。',
      },
    ]
  }

  return [
    {
      title: `先抓住「${concept}」`,
      body: `这关的语法只是工具，真正训练的是把目标拆成输入、处理、输出，并用 ${languageName} 写成能验证的代码。`,
    },
    {
      title: '读目标，不读感觉',
      body: `目标是：${level.objective}。你写的每一行都应该服务这个目标，暂时无关的东西先别放进来。`,
    },
    {
      title: '最小版本先赢',
      body: `先写出能跑的最小形态，例如从 \`${coreLine}\` 这种核心结构开始，再一点点补清楚。`,
    },
  ]
}

function reviewQuestions(languageName: string, level: Level, concept: string) {
  return [
    `这关的「${concept}」解决了 ${level.objective} 里的哪一部分？`,
    `如果只保留最小代码，哪一行是 ${languageName} 程序真正交付结果的关键？`,
    '测试失败时，你会先检查入口、数据、处理、输出里的哪一段？为什么？',
  ]
}

function syntaxVocabulary(languageName: string, level: Level) {
  const text = lessonText(level)

  if (level.id === 20) {
    return {
      concept: '综合项目结构',
      mentalModel: '把程序想成一个小系统：类保存角色状态，列表和字典保存数据，函数和方法负责动作，异常处理负责兜底。',
      learnFirst: ['角色对象有哪些状态', '每个动作由哪个函数或方法负责', '错误情况如何被 try/except 接住'],
      pitfalls: ['把所有逻辑堆在全局作用域', '只写正常路径不处理错误', '类、函数和数据结构之间职责混乱'],
      vocabulary: [
        { term: '对象', meaning: '一组状态和行为的组合。' },
        { term: '方法', meaning: '定义在类里、负责操作对象状态的函数。' },
        { term: '异常处理', meaning: '让程序遇到错误时给出可控反馈。' },
      ],
    }
  }

  if (/hello|输出|print|console|printf|write(line)?/.test(text)) {
    return {
      concept: '输出与程序入口',
      mentalModel: '程序先找到入口，再把你指定的文本送到终端。入口像门，输出像第一句可验证的回应。',
      learnFirst: ['入口结构在哪里', '输出函数叫什么', '字符串是否需要引号'],
      pitfalls: ['目标文本大小写不一致', '少写引号或分号', '把输出语句放在入口外面'],
      vocabulary: [
        { term: '入口', meaning: '程序开始执行的位置。' },
        { term: '字符串', meaning: '被引号包住的文本数据。' },
        { term: '终端输出', meaning: '程序运行后显示给用户看的结果。' },
      ],
    }
  }

  if (/变量|类型|string|int|double|dim|const|let|var|f-string/.test(text)) {
    return {
      concept: '变量、类型与命名',
      mentalModel: '变量是带名字的格子，类型规定这个格子能放什么。名字清楚，后面的逻辑才不会读成一团。',
      learnFirst: ['变量名表达什么含义', '值属于哪种类型', '输出时如何把变量拼进文本'],
      pitfalls: ['把数字写成字符串', '变量名和测试目标不一致', '格式化符号和类型对不上'],
      vocabulary: [
        { term: '变量', meaning: '保存数据的命名位置。' },
        { term: '类型', meaning: '数据的种类，比如整数、文本、布尔值。' },
        { term: '格式化', meaning: '把变量整理成可读文本。' },
      ],
    }
  }

  if (/if|else|条件|判断|分支|switch/.test(text)) {
    return {
      concept: '条件分支',
      mentalModel: '分支就是岔路口。程序先判断条件真假，再选择一条路径执行。',
      learnFirst: ['条件表达式怎么写', '每个分支负责哪种情况', '代码块边界在哪里'],
      pitfalls: ['把赋值当比较', '忘记 else 覆盖兜底情况', '缩进或花括号导致代码不在分支内'],
      vocabulary: [
        { term: '条件', meaning: '能判断真假的表达式。' },
        { term: '分支', meaning: '不同条件下执行的不同代码路径。' },
        { term: '兜底', meaning: '所有前置条件都不满足时的处理。' },
      ],
    }
  }

  if (/循环|for|while|array|list|数组|列表|foreach|vector|map/.test(text)) {
    return {
      concept: '循环、集合与批量处理',
      mentalModel: '集合是一排数据，循环是一只稳定的手，从头到尾按同一规则处理每一项。',
      learnFirst: ['集合里放了哪些元素', '循环变量代表当前哪一项', '每轮循环要做什么动作'],
      pitfalls: ['边界少一项或多一项', '累计变量没有初始化', '把转换和副作用混在一起看不清'],
      vocabulary: [
        { term: '集合', meaning: '一组可被遍历的数据。' },
        { term: '迭代', meaning: '按顺序处理集合里的每一项。' },
        { term: '累计', meaning: '把每轮结果合并成一个最终值。' },
      ],
    }
  }

  if (/函数|方法|function|method|add|return/.test(text)) {
    return {
      concept: '函数与可复用逻辑',
      mentalModel: '函数像一个小机器：输入参数，执行规则，返回结果。机器边界越清楚，项目越不容易乱。',
      learnFirst: ['函数名说明什么动作', '参数从哪里来', '返回值给谁用'],
      pitfalls: ['只定义不调用', '忘记 return', '参数顺序和调用值对不上'],
      vocabulary: [
        { term: '参数', meaning: '传进函数的数据。' },
        { term: '返回值', meaning: '函数交回给调用者的结果。' },
        { term: '调用', meaning: '让函数实际执行一次。' },
      ],
    }
  }

  if (/class|对象|属性|property|user|counter|constructor|构造/.test(text)) {
    return {
      concept: '对象、状态与行为',
      mentalModel: '对象把状态和动作绑在一起。状态回答“它是什么样”，方法回答“它能做什么”。',
      learnFirst: ['类名代表哪种事物', '字段/属性保存什么状态', '方法如何改变或读取状态'],
      pitfalls: ['类只写了数据没有行为', '构造方法没有初始化关键字段', '公开和私有边界混乱'],
      vocabulary: [
        { term: '类', meaning: '创建对象的模型。' },
        { term: '属性', meaning: '对象保存的状态。' },
        { term: '构造方法', meaning: '对象创建时初始化状态的代码。' },
      ],
    }
  }

  if (/指针|内存|raii|unique_ptr|引用|reference/.test(text)) {
    return {
      concept: '内存、地址与资源所有权',
      mentalModel: '值放在内存里，地址告诉你它在哪里。资源要有明确负责人，否则 bug 会躲得很深。',
      learnFirst: ['谁拥有这块数据', '谁只是借用它', '什么时候释放或结束生命周期'],
      pitfalls: ['野指针或空指针', '重复释放资源', '把引用生命周期想得太乐观'],
      vocabulary: [
        { term: '地址', meaning: '数据在内存里的位置。' },
        { term: '解引用', meaning: '通过地址读取或修改值。' },
        { term: '所有权', meaning: '谁负责资源的创建和释放。' },
      ],
    }
  }

  if (/async|await|异步|fetch|promise/.test(text)) {
    return {
      concept: '异步流程',
      mentalModel: '异步不是同时乱跑，而是遇到等待任务先挂起，结果回来后继续下一步。',
      learnFirst: ['哪个操作需要等待', 'await 后得到什么值', '错误失败时怎么处理'],
      pitfalls: ['忘记 await 导致拿到 Promise', '没有处理失败路径', '把异步结果当同步值用'],
      vocabulary: [
        { term: '异步', meaning: '不会立刻完成、需要等待结果的流程。' },
        { term: 'await', meaning: '暂停当前 async 函数，等待结果回来。' },
        { term: 'Promise', meaning: '代表未来结果的对象。' },
      ],
    }
  }

  return {
    concept: `${languageName} 核心语法`,
    mentalModel: '先把目标拆成输入、处理、输出三段，再用本关语法把三段连起来。',
    learnFirst: ['这关要证明什么', '最小代码需要哪些语法', '测试会检查哪些结果'],
    pitfalls: ['代码写多但没命中目标', '只看示例不理解结构', '运行失败后不读错误信息'],
    vocabulary: [
      { term: '输入', meaning: '程序拿到的数据或初始值。' },
      { term: '处理', meaning: '程序对数据执行的逻辑。' },
      { term: '输出', meaning: '程序交付给用户或测试的结果。' },
    ],
  }
}

export function getLevelMission(languageName: string, level: Level): LevelMission {
  const context = contextFor(languageName)
  const scene = LEVEL_SCENES[(level.id - 1) % LEVEL_SCENES.length]
  const intent = levelIntent(level)

  return {
    kicker: `${languageName} Mission · Lv.${level.id}`,
    brief: `${scene}：在 ${context.arena} 里，${intent}。`,
    constraint: `限制：只用本关核心语法完成，先别堆无关框架。${context.tone}`,
    payoff: `交付：${context.artifact}，并让测试能明确判断它做对了。`,
  }
}

export function getLevelTeachingBlueprint(languageName: string, level: Level): TeachingBlueprint {
  const context = contextFor(languageName)
  const syntax = syntaxVocabulary(languageName, level)
  const coreLine = firstCodeLine(level)

  return {
    concept: syntax.concept,
    realUse: `在 ${context.arena} 里，这类能力用来${levelIntent(level)}。学它不是为了背语法，而是为了把一个小目标稳定交付出来。`,
    mentalModel: syntax.mentalModel,
    walkthrough: teachingWalkthrough(languageName, level, syntax.concept),
    learnFirst: syntax.learnFirst,
    practiceSteps: [
      `先用一句话复述目标：${level.objective}`,
      `在脑子里画出最小结构：入口/数据/处理/输出，别急着抄长代码。`,
      `先写最小可运行版本，核心形态可以参考：${coreLine}`,
      '运行一次，只看第一个报错或第一个失败测试。一次只修一处。',
    ],
    pitfalls: syntax.pitfalls,
    vocabulary: syntax.vocabulary,
    reviewQuestions: reviewQuestions(languageName, level, syntax.concept),
    checkpoint: `你通关时应该能解释：为什么这段 ${languageName} 代码满足目标、每个测试为什么会通过、下一关会复用哪块能力。`,
    stretchGoal: `加一点自己的变化，但别改坏目标：换一组变量名、换一个输入值，或者多打印一条解释性输出。`,
  }
}

export function getCourseNodeHook(languageName: string, node: CourseNode) {
  const text = `${node.title} ${node.objective} ${node.tags.join(' ')}`.toLowerCase()

  if (/game|pygame|sprite|collision|游戏/.test(text)) {
    return `${languageName} 在这里变成可玩的东西：输入、状态、反馈和失败条件都会立刻暴露你的逻辑是否靠谱。`
  }
  if (/vision|opencv|image|ocr|图像|视觉|cv/.test(text)) {
    return '这个方向适合做“看得见结果”的项目：图片进去，结构化信息出来，错了也很直观。'
  }
  if (/ai|ml|llm|rag|model|机器学习|智能/.test(text)) {
    return '这条线会把代码接到模型、数据和产品逻辑上，重点不是炫 AI，而是让输出可控。'
  }
  if (/web|api|http|backend|后端/.test(text)) {
    return '把它想成一个真实服务的切片：请求进来，数据处理，结果返回，坏输入也不能把系统打穿。'
  }
  if (/data|sql|pandas|report|数据|报表/.test(text)) {
    return '这里的乐趣来自“脏数据变清楚”：最后能产出图表、报表或一个可以做决定的指标。'
  }
  if (/test|devops|ci|docker|deploy|测试|部署/.test(text)) {
    return '这条线不花哨，但很有职业味：让代码不靠祈祷运行，让发布不靠手抖。'
  }
  if (/security|network|socket|crypto|安全|网络/.test(text)) {
    return '这里更像侦查任务：读信号、找异常、收证据，再用代码把流程固定下来。'
  }
  if (/finance|business|业务|金融|量化/.test(text)) {
    return '把代码塞进真实业务流程：少算错、少复制粘贴、少让 Excel 表格半夜咬人。'
  }
  if (node.levelId) {
    return `这是 ${languageName} 的基础零件。它看起来小，但后面每条专业路线都会默认你已经会了。`
  }

  return `这不是摆设节点：学完后应该能做出一个小交付，而不是只会复述概念。`
}

export function getCourseProjectPreview(languageName: string, node: CourseNode) {
  const text = `${node.title} ${node.objective} ${node.tags.join(' ')}`.toLowerCase()

  if (node.levelId) return `最终用途：把这个基础点接进 ${languageName} 的项目骨架，后面写工具、服务或界面时不会反复卡入口。`
  if (/game|pygame|sprite|collision|游戏/.test(text)) return '项目预览：一个带输入、碰撞、计分和失败条件的 2D 小游戏。'
  if (/vision|opencv|image|ocr|图像|视觉|cv/.test(text)) return '项目预览：图片/视频检测流水线，能输出识别结果和统计报告。'
  if (/ai|ml|llm|rag|model|机器学习|智能/.test(text)) return '项目预览：一个能读资料、给答案、保留引用的智能助手。'
  if (/web|api|http|backend|后端/.test(text)) return '项目预览：带鉴权、数据库和错误处理的 API 服务。'
  if (/data|sql|pandas|report|数据|报表/.test(text)) return '项目预览：从原始数据到可筛选报表和关键指标的分析台。'
  if (/test|devops|ci|docker|deploy|测试|部署/.test(text)) return '项目预览：一套能自动测试、构建、发布的小型工程流水线。'
  if (/security|network|socket|crypto|安全|网络/.test(text)) return '项目预览：日志扫描、异常定位和风险报告自动化工具。'
  if (/finance|business|业务|金融|量化/.test(text)) return '项目预览：业务数据看板或量化回测报告，不再手搓表格。'

  return '项目预览：一个能被别人打开、输入、运行、得到结果的小型交付。'
}

export function getLanguageRouteSnapshot(languageName: string): LanguageRouteSnapshot {
  switch (languageName) {
    case 'Python':
      return {
        role: '自动化 / 数据 / AI 原型路线',
        starterProject: '自动整理文件、清洗 CSV、生成图表的小助手',
        advancedProject: 'RAG 知识库、CV 检测器、数据分析 Dashboard',
        runtimeNote: '当前支持浏览器内真实运行。',
      }
    case 'C':
      return {
        role: '系统 / 内存 / 嵌入式路线',
        starterProject: '命令行计算器、日志解析器、数组处理工具',
        advancedProject: '简化版 shell 工具、传感器数据解析模块',
        runtimeNote: '当前走本地 clang/gcc 真实编译运行；没有工具链时会提示安装。',
      }
    case 'C++':
      return {
        role: '高性能 / 游戏引擎 / 复杂工程路线',
        starterProject: 'vector 数据处理器、资源管理小模块',
        advancedProject: '小游戏核心循环、实时模拟器、性能敏感组件',
        runtimeNote: '当前走本地 clang++/g++ 真实编译运行；没有工具链时会提示安装。',
      }
    case 'Java':
      return {
        role: '后端 / Android / 企业系统路线',
        starterProject: '用户模型、集合处理、简单服务逻辑',
        advancedProject: 'REST API、权限系统、订单/库存业务模块',
        runtimeNote: '当前走本地 javac/java 真实编译运行；类名需要保持 Main。',
      }
    case 'C#':
      return {
        role: '.NET / Unity / 桌面工具路线',
        starterProject: '控制台工具、属性模型、List 数据处理',
        advancedProject: 'Unity 小游戏、.NET API、桌面业务工具',
        runtimeNote: '当前走本地 .NET SDK 真实运行；未安装 dotnet 时会提示缺少运行时。',
      }
    case 'JavaScript':
      return {
        role: 'Web / Node / 全栈产品路线',
        starterProject: '交互按钮、数组转换、异步数据请求',
        advancedProject: 'API Dashboard、Todo 产品、Node 自动化脚本',
        runtimeNote: '当前走本地 Node.js 真实运行，输出和报错来自 Node。',
      }
    case 'Visual Basic':
      return {
        role: 'Office 自动化 / 桌面业务系统路线',
        starterProject: '表格处理、业务表单、批量操作脚本',
        advancedProject: 'Excel 自动化、老系统维护工具、内部流程助手',
        runtimeNote: '当前走本地 .NET / VB 工具链真实运行；未安装 dotnet 时会提示缺少运行时。',
      }
    default:
      return {
        role: `${languageName} 工程路线`,
        starterProject: '一个能输入、处理、输出的小工具',
        advancedProject: '一个可测试、可维护、可交付的小型应用',
        runtimeNote: '当前使用结构化检查器。',
      }
  }
}

export function getRuntimeModeCopy(languageName: string, runtime: 'python-pyodide' | 'server-exec' | 'static-check') {
  if (runtime === 'python-pyodide') {
    return {
      title: '真实运行模式',
      body: `${languageName} 代码会在浏览器内执行，输出和错误来自真实解释器。`,
    }
  }

  if (runtime === 'server-exec') {
    return {
      title: '真实编译运行',
      body: `${languageName} 代码会发送到本地执行器编译/运行，输出和报错来自真实工具链。没有安装对应编译器时，会明确提示缺少什么。`,
    }
  }

  return {
    title: '结构化练习检查器',
    body: `${languageName} 当前先验证入口、类型、块结构和核心意图。它不是完整编译器，但足够帮你练语法骨架；真正工程运行会在后续沙箱/编译器接入。`,
  }
}

export function getFailureDiagnosis({
  languageName,
  code,
  failedHints,
  failCount,
}: {
  languageName: string
  code: string
  failedHints: string[]
  failCount: number
}): FailureDiagnosis {
  const joinedHints = failedHints.join(' ')
  const source = `${code}\n${joinedHints}`.toLowerCase()

  if (!code.trim()) {
    return {
      area: '空编辑器',
      reason: '没有代码，测试当然没东西可验。这个锅连编译器都懒得背。',
      nextStep: '回到教学引导，看清入口结构，再自己写第一版代码。',
      directMode: failCount >= 2,
    }
  }

  if (/print|console|printf|write(line)?|输出|hello/.test(source)) {
    return {
      area: '输出格式',
      reason: '代码可能能跑，但输出文本、大小写或调用方式没有对齐测试。',
      nextStep: `先确认 ${languageName} 的输出函数写对，再逐字核对目标文本。`,
      directMode: failCount >= 3,
    }
  }

  if (/main|入口|module|class main|program/.test(source)) {
    return {
      area: '程序入口',
      reason: '入口结构不完整，后面的逻辑写得再努力也接不上运行流程。',
      nextStep: '先补齐入口骨架，再把业务代码放进去。',
      directMode: failCount >= 3,
    }
  }

  if (/type|string|int|double|var|let|const|dim|类型|变量/.test(source)) {
    return {
      area: '类型与变量',
      reason: '变量声明或类型选择没有命中本关目标。',
      nextStep: '逐个对照变量名、类型和值，别让“差不多”混进来。',
      directMode: failCount >= 3,
    }
  }

  if (/if|else|条件|分支/.test(source)) {
    return {
      area: '条件分支',
      reason: '分支结构没有覆盖目标情况，或者块结构没有收好。',
      nextStep: '先写出 if 和 else 两条路径，再分别放入对应输出。',
      directMode: failCount >= 3,
    }
  }

  if (/for|while|foreach|map|循环|数组|列表|array|list|vector/.test(source)) {
    return {
      area: '循环与集合',
      reason: '集合创建、遍历方式或累计逻辑有一个环节没接上。',
      nextStep: '先写集合，再写循环，最后写累加/转换，不要三件事一起糊。',
      directMode: failCount >= 3,
    }
  }

  return {
    area: '核心意图',
    reason: '代码看起来有动作，但没有命中本关最小目标。',
    nextStep: '只保留能证明目标的最小代码，删掉暂时无关的花活。',
    directMode: failCount >= 3,
  }
}
