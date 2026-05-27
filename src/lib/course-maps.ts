import { LEVELS } from '@/lib/levels'

export type CourseDifficulty = '基础' | '进阶' | '专业' | '硬核'
export type CourseNodeKind = 'lesson' | 'project' | 'capstone'

export type CourseNode = {
  id: string
  title: string
  objective: string
  difficulty: CourseDifficulty
  lessonCount: number
  tags: string[]
  kind: CourseNodeKind
  levelId?: number
  unlockAfterLevel?: number
}

export type CourseMap = {
  id: string
  title: string
  shortTitle: string
  subtitle: string
  description: string
  accent: 'cyan' | 'emerald' | 'violet' | 'amber' | 'rose'
  nodes: CourseNode[]
}

function levelDifficulty(levelId: number): CourseDifficulty {
  if (levelId <= 6) return '基础'
  if (levelId <= 14) return '进阶'
  return '专业'
}

function projectCheckpointNode(languageName: string, levelId: number): CourseNode {
  const stage = levelId / 5
  const titles = ['微型控制台工具', '数据整理器', '稳定运行模块', '基础毕业作品']
  const title = titles[stage - 1] ?? '阶段作品'
  return {
    id: `foundation-project-${levelId}`,
    title,
    objective: `用 Lv.1-${levelId} 的能力做一个能运行、能展示、能复盘的 ${languageName} 小作品。`,
    difficulty: stage <= 1 ? '进阶' : stage <= 3 ? '专业' : '硬核',
    lessonCount: 1,
    tags: ['阶段作品', `${languageName} 基础`, `Lv.${levelId}`],
    kind: 'project',
    unlockAfterLevel: levelId,
  }
}

const foundationNodes: CourseNode[] = LEVELS.flatMap((level) => {
  const lessonNode: CourseNode = {
    id: `foundation-${level.id}`,
    title: level.title,
    objective: level.objective,
    difficulty: levelDifficulty(level.id),
    lessonCount: 1,
    tags: [level.badge, 'Python 基础'],
    kind: 'lesson',
    levelId: level.id,
  }
  return level.id % 5 === 0
    ? [lessonNode, projectCheckpointNode('Python', level.id)]
    : [lessonNode]
})

function node(
  id: string,
  title: string,
  objective: string,
  difficulty: CourseDifficulty,
  lessonCount: number,
  tags: string[],
  kind: CourseNodeKind = 'lesson'
): CourseNode {
  return { id, title, objective, difficulty, lessonCount, tags, kind }
}

export const COURSE_MAPS: CourseMap[] = [
  {
    id: 'foundation',
    title: 'Python 基础根系',
    shortTitle: '根系',
    subtitle: '20 个基础节点 + 4 个阶段作品',
    description: '语法、容器、函数、错误处理、文件、模块、面向对象与综合实战；每 5 关做一次小作品。',
    accent: 'cyan',
    nodes: foundationNodes,
  },
  {
    id: 'automation',
    title: '自动化与爬虫分支',
    shortTitle: '自动化',
    subtitle: '把重复工作交给 Python',
    description: '文件批处理、网页数据采集、浏览器自动化、表格/PDF/邮件流水线。',
    accent: 'emerald',
    nodes: [
      node('automation-files', '文件批处理', '批量重命名、目录扫描、日志清洗与任务脚本。', '进阶', 3, ['pathlib', 'os', '日志']),
      node('automation-office', 'Office 自动化', '处理 Excel、CSV、PDF 与报表导出。', '进阶', 4, ['openpyxl', 'pandas', 'PDF']),
      node('automation-web-scraping', '网页采集', '用 requests、BeautifulSoup 抽取公开网页数据。', '进阶', 4, ['requests', 'BeautifulSoup', 'HTML']),
      node('automation-browser', '浏览器自动化', '用 Playwright/Selenium 处理需要交互的页面。', '专业', 4, ['Playwright', 'Selenium']),
      node('automation-scheduler', '定时任务与告警', '把脚本做成可重复运行的任务，并输出异常告警。', '专业', 3, ['cron', '邮件', 'webhook']),
      node('automation-capstone', '个人自动化中枢', '做一个每日信息抓取、清洗、汇总、通知的完整项目。', '专业', 5, ['项目', '流水线'], 'capstone'),
    ],
  },
  {
    id: 'web-api',
    title: 'Web / API 后端分支',
    shortTitle: '后端',
    subtitle: '从接口到可部署服务',
    description: 'HTTP、FastAPI、Django、数据库、鉴权、异步任务与部署。',
    accent: 'cyan',
    nodes: [
      node('web-http', 'HTTP 与接口基础', '理解请求、响应、状态码、JSON 与 API 契约。', '进阶', 3, ['HTTP', 'JSON']),
      node('web-fastapi', 'FastAPI 服务', '构建类型安全的 REST API，并生成交互式文档。', '进阶', 5, ['FastAPI', 'Pydantic']),
      node('web-django', 'Django 全栈', '用 Django 做后台、模型、管理台与模板页面。', '专业', 6, ['Django', 'ORM']),
      node('web-auth-db', '鉴权与数据库', '接入登录、权限、PostgreSQL 与迁移。', '专业', 5, ['Auth', 'Postgres']),
      node('web-async', '异步与后台任务', '处理耗时任务、队列、缓存和并发请求。', '专业', 4, ['asyncio', 'Redis', 'Queue']),
      node('web-deploy', '部署与观测', '把服务部署到云端，配置日志、环境变量和健康检查。', '专业', 4, ['Docker', 'Cloud']),
      node('web-capstone', '产品级 API 项目', '完成一个带鉴权、数据库、测试、部署的真实 API。', '硬核', 7, ['项目', '生产化'], 'capstone'),
    ],
  },
  {
    id: 'data-analysis',
    title: '数据分析与可视化分支',
    shortTitle: '数据',
    subtitle: '从脏数据到决策图表',
    description: 'NumPy、pandas、清洗、统计、可视化、Dashboard 与报告自动化。',
    accent: 'violet',
    nodes: [
      node('data-numpy', 'NumPy 数值基础', '掌握数组、广播、向量化与基础统计。', '进阶', 4, ['NumPy', '数组']),
      node('data-pandas', 'pandas 数据表', '读取、筛选、分组、连接和透视数据。', '进阶', 6, ['pandas', 'CSV']),
      node('data-cleaning', '数据清洗', '处理缺失值、异常值、重复记录和日期字段。', '专业', 4, ['清洗', '质量']),
      node('data-visual', '图表表达', '用 matplotlib、seaborn、plotly 做可读图表。', '专业', 5, ['matplotlib', 'plotly']),
      node('data-dashboard', '交互式 Dashboard', '用 Streamlit 做可搜索、可过滤的数据应用。', '专业', 4, ['Streamlit', 'Dashboard']),
      node('data-report', '自动化报告', '把数据分析结果导出成 HTML、PDF 或图文报告。', '专业', 3, ['报告', '模板']),
      node('data-capstone', '业务数据诊断台', '完成从原始数据到可交付 Dashboard 的端到端项目。', '硬核', 6, ['项目', '分析'], 'capstone'),
    ],
  },
  {
    id: 'ai-ml',
    title: 'AI / 机器学习分支',
    shortTitle: 'AI',
    subtitle: '从模型训练到智能应用',
    description: '特征工程、scikit-learn、深度学习、NLP、CV、LLM API 与 RAG。',
    accent: 'rose',
    nodes: [
      node('ml-foundations', '机器学习基础', '理解训练集、特征、标签、过拟合和评估指标。', '专业', 5, ['ML', '评估']),
      node('ml-sklearn', 'scikit-learn 实战', '训练分类、回归、聚类模型并做交叉验证。', '专业', 6, ['scikit-learn']),
      node('ml-feature', '特征工程', '编码类别、缩放数值、处理时间序列和文本特征。', '专业', 4, ['特征', 'Pipeline']),
      node('ml-nlp', 'NLP 文本智能', '做关键词、分类、摘要和语义搜索基础任务。', '硬核', 5, ['NLP', '文本']),
      node('ml-cv', 'Computer Vision 入门', '用 OpenCV/Pillow 处理图像、检测边缘和目标。', '硬核', 5, ['OpenCV', 'Pillow', 'Computer Vision']),
      node('ml-pytorch', 'PyTorch 深度学习', '构建神经网络训练循环、保存模型与推理。', '硬核', 7, ['PyTorch']),
      node('ml-llm', 'LLM 应用工程', '接入大模型 API，构建工具调用、记忆和安全边界。', '硬核', 5, ['LLM', 'API']),
      node('ml-rag', 'RAG 知识库', '做文档切块、向量检索、重排和答案引用。', '硬核', 6, ['RAG', '向量']),
      node('ml-capstone', '智能助手项目', '完成一个可检索资料、可调用工具、可上线的 AI 应用。', '硬核', 8, ['项目', 'AI 产品'], 'capstone'),
    ],
  },
  {
    id: 'data-engineering',
    title: '数据工程与云分支',
    shortTitle: '工程',
    subtitle: '把数据管道跑稳',
    description: 'SQL、ETL、API 摄取、队列、调度、数据仓库、云函数与监控。',
    accent: 'amber',
    nodes: [
      node('de-sql', 'SQL 与关系模型', '写查询、聚合、索引意识和基础建模。', '进阶', 4, ['SQL', 'Postgres']),
      node('de-ingestion', 'API 数据摄取', '从多个 API 拉取、分页、限流和重试。', '专业', 4, ['API', 'ETL']),
      node('de-pipeline', 'ETL 管道', '清洗、转换、落库，并保证幂等运行。', '专业', 5, ['ETL', '幂等']),
      node('de-scheduler', '调度与队列', '用 cron、Celery、Airflow 思维拆任务。', '专业', 4, ['调度', '队列']),
      node('de-warehouse', '数据仓库基础', '做事实表、维表、增量同步和数据质量检查。', '硬核', 5, ['仓库', '质量']),
      node('de-cloud', '云端运行', '部署数据任务，处理环境变量、密钥和日志。', '硬核', 4, ['Cloud', 'Secrets']),
      node('de-capstone', '稳定数据流水线', '完成一个可监控、可重跑、可追踪的数据管道。', '硬核', 6, ['项目', 'Pipeline'], 'capstone'),
    ],
  },
  {
    id: 'testing-devops',
    title: '测试、工具链与 DevOps 分支',
    shortTitle: 'DevOps',
    subtitle: '让代码可维护、可发布',
    description: 'pytest、类型标注、CLI、包管理、CI/CD、Docker、日志与质量门禁。',
    accent: 'emerald',
    nodes: [
      node('td-pytest', 'pytest 测试', '写单元测试、参数化测试、fixture 和覆盖率。', '进阶', 5, ['pytest', '测试']),
      node('td-typing', '类型与静态检查', '用 type hints、mypy/pyright 思维提升可维护性。', '进阶', 3, ['typing']),
      node('td-cli', 'CLI 工具', '用 argparse/typer 做专业命令行工具。', '专业', 3, ['CLI', 'Typer']),
      node('td-packaging', '包管理与发布', '理解 pyproject、虚拟环境、版本号和发布流程。', '专业', 4, ['Packaging']),
      node('td-ci', 'CI/CD', '用 GitHub Actions 跑测试、lint 和构建。', '专业', 4, ['CI', 'GitHub Actions']),
      node('td-docker', 'Docker 化', '为 Python 服务和脚本制作可复现运行环境。', '硬核', 4, ['Docker']),
      node('td-observability', '日志与监控', '添加结构化日志、错误追踪和运行指标。', '硬核', 3, ['Logging', 'Metrics']),
      node('td-capstone', '工程质量中枢', '把一个脚本升级成带测试、CI、发布的正式工具。', '硬核', 5, ['项目', '质量'], 'capstone'),
    ],
  },
  {
    id: 'scientific',
    title: '科学计算与仿真分支',
    shortTitle: '科学',
    subtitle: '用 Python 做计算实验',
    description: '科学计算、优化、仿真、地理空间、图像处理与研究型 notebook。',
    accent: 'violet',
    nodes: [
      node('sci-scipy', 'SciPy 科学计算', '做积分、优化、插值和信号处理基础任务。', '专业', 5, ['SciPy', '优化']),
      node('sci-simulation', '仿真建模', '用随机过程和数值方法模拟现实系统。', '专业', 4, ['Simulation']),
      node('sci-geo', '地理空间分析', '处理坐标、地图数据和空间统计。', '硬核', 4, ['GeoPandas', 'GIS']),
      node('sci-image', '图像与矩阵', '做图像滤波、变换、特征提取和批处理。', '硬核', 4, ['Image', '矩阵']),
      node('sci-notebook', '研究型 Notebook', '把实验、图表、结论组织成可复现实验记录。', '专业', 3, ['Jupyter']),
      node('sci-capstone', '计算实验报告', '完成一个带数据、图表、仿真和结论的研究项目。', '硬核', 6, ['项目', '研究'], 'capstone'),
    ],
  },
  {
    id: 'apps-iot',
    title: '应用、游戏与 IoT 分支',
    shortTitle: '应用',
    subtitle: '把代码做成能被使用的东西',
    description: '桌面 GUI、小游戏、机器人、硬件控制、IoT 数据采集与可视化。',
    accent: 'cyan',
    nodes: [
      node('app-gui', '桌面 GUI', '用 Tkinter/PySide 做输入、列表、按钮和文件操作。', '进阶', 4, ['GUI', 'Tkinter']),
      node('app-game', 'Pygame 快速入口', '用 pygame 处理主循环、输入、碰撞、音效和游戏状态。', '专业', 5, ['pygame', '游戏']),
      node('app-bot', '聊天/工作流机器人', '做命令解析、状态管理和外部 API 接入。', '专业', 4, ['Bot', 'API']),
      node('app-iot', 'IoT 数据采集', '读取传感器、串口/MQTT 数据并做异常判断。', '硬核', 4, ['IoT', 'MQTT']),
      node('app-robotics', '机器人控制入门', '把输入、决策、动作拆成可调试模块。', '硬核', 4, ['Robotics']),
      node('app-capstone', '可运行应用项目', '完成一个有界面、状态、存储和分享能力的小产品。', '硬核', 6, ['项目', '产品'], 'capstone'),
    ],
  },
  {
    id: 'pygame',
    title: 'Pygame 游戏开发分支',
    shortTitle: 'Pygame',
    subtitle: '从游戏循环到可发布作品',
    description: '事件循环、Sprite、碰撞、关卡、音效、UI、打包与完整小游戏项目。',
    accent: 'emerald',
    nodes: [
      node('pg-loop', '游戏循环', '理解 update/draw 循环、帧率、事件队列和状态切换。', '进阶', 3, ['pygame', 'loop']),
      node('pg-input', '键盘与鼠标输入', '处理按键、鼠标、连续移动和输入缓冲。', '进阶', 3, ['input', 'event']),
      node('pg-sprite', 'Sprite 与动画', '管理角色、帧动画、图片资源和渲染层级。', '专业', 5, ['Sprite', 'Animation']),
      node('pg-collision', '碰撞与物理手感', '实现矩形碰撞、速度、重力、跳跃和反弹。', '专业', 5, ['Collision', 'Physics']),
      node('pg-level', '关卡与地图', '构建 tile map、摄像机跟随、敌人生成和存档点。', '专业', 5, ['Tilemap', 'Camera']),
      node('pg-audio-ui', '音效与游戏 UI', '添加音效、音乐、暂停菜单、得分和生命值。', '专业', 4, ['Audio', 'UI']),
      node('pg-polish', '手感与性能优化', '优化帧率、资源加载、粒子反馈和打击感。', '硬核', 4, ['Performance', 'Polish']),
      node('pg-package', '游戏打包发布', '用 PyInstaller 打包资源，处理路径和版本发布。', '硬核', 3, ['Packaging']),
      node('pg-capstone', '完整 2D 小游戏', '做一个有菜单、关卡、胜负、音效和可分享构建的 2D 游戏。', '硬核', 8, ['项目', 'Game'], 'capstone'),
    ],
  },
  {
    id: 'computer-vision',
    title: 'Computer Vision 视觉分支',
    shortTitle: 'CV',
    subtitle: '从像素到视频智能',
    description: 'OpenCV、Pillow、滤波、轮廓、特征、视频流、目标检测与 OCR。',
    accent: 'rose',
    nodes: [
      node('cv-image-basic', '图像基础', '理解像素、通道、坐标、色彩空间和图像读写。', '专业', 4, ['OpenCV', 'Pillow']),
      node('cv-transform', '图像变换', '实现裁剪、缩放、旋转、透视变换和批处理。', '专业', 4, ['Transform']),
      node('cv-filter', '滤波与边缘', '用模糊、锐化、Canny、Sobel 处理图像结构。', '专业', 5, ['Filter', 'Edge']),
      node('cv-contour', '阈值与轮廓', '分割目标区域，提取轮廓、面积、边界框和形状特征。', '硬核', 5, ['Contour', 'Threshold']),
      node('cv-feature', '特征匹配', '用关键点、描述子和匹配器做图像对齐与查找。', '硬核', 4, ['Feature', 'Match']),
      node('cv-video', '视频流处理', '读取摄像头/视频，做实时帧处理和轨迹分析。', '硬核', 5, ['Video', 'Realtime']),
      node('cv-detect', '目标检测入口', '接入预训练模型，理解检测框、置信度和后处理。', '硬核', 6, ['Detection', 'Model']),
      node('cv-ocr', 'OCR 与文档视觉', '识别票据/截图文字，做版面清洗和结构化输出。', '硬核', 5, ['OCR', 'Document']),
      node('cv-capstone', '视觉检测项目', '完成一个从图片/视频输入到检测、统计、报告输出的 CV 项目。', '硬核', 8, ['项目', 'Computer Vision'], 'capstone'),
    ],
  },
  {
    id: 'security-network',
    title: '安全、网络与运维分支',
    shortTitle: '安全',
    subtitle: '写可靠的网络与安全自动化',
    description: 'socket、协议、日志分析、加密基础、合规扫描、事件响应与运维工具。',
    accent: 'rose',
    nodes: [
      node('sec-network', '网络协议基础', '理解 TCP/UDP、HTTP、DNS 和 socket 编程。', '专业', 4, ['Network', 'Socket']),
      node('sec-log', '日志分析', '解析 Web、系统和安全日志，定位异常模式。', '专业', 4, ['Log', 'Regex']),
      node('sec-crypto', '加密与密钥基础', '正确使用哈希、签名、加密库和密钥管理。', '专业', 3, ['Crypto']),
      node('sec-scanner', '合规扫描脚本', '编写只读检查工具，发现配置风险并输出报告。', '硬核', 5, ['Scanner', 'Report']),
      node('sec-incident', '事件响应自动化', '把告警、上下文、证据和处置动作串起来。', '硬核', 5, ['IR', 'Automation']),
      node('sec-capstone', '安全运维控制台', '完成一个面向日志、风险、告警的安全自动化项目。', '硬核', 7, ['项目', '安全'], 'capstone'),
    ],
  },
  {
    id: 'finance-business',
    title: '金融量化与业务系统分支',
    shortTitle: '业务',
    subtitle: '把 Python 用在钱、表、流程里',
    description: '业务报表、财务模型、量化回测、风险指标、运营工具与内部系统。',
    accent: 'amber',
    nodes: [
      node('biz-reporting', '业务报表自动化', '把 CSV、Excel、数据库数据合成每日经营报表。', '进阶', 4, ['Excel', 'Report']),
      node('biz-finance-model', '财务模型', '计算现金流、利润、同比环比和敏感性分析。', '专业', 4, ['Finance']),
      node('biz-backtest', '量化回测入门', '读取行情、构建策略、计算收益和回撤。', '硬核', 6, ['Backtest', 'pandas']),
      node('biz-risk', '风险指标', '计算波动率、VaR、最大回撤和暴露分析。', '硬核', 4, ['Risk']),
      node('biz-internal-tool', '内部运营工具', '做一个审批、查询、导出、权限齐全的小系统。', '专业', 5, ['Ops', 'Tool']),
      node('biz-capstone', '业务指挥台', '完成从数据接入到报表、预警、决策面板的一体化项目。', '硬核', 7, ['项目', '业务'], 'capstone'),
    ],
  },
]

export const FOUNDATION_MAP_ID = 'foundation'

export function getMapLessonCount(map: CourseMap) {
  return map.nodes.reduce((sum, item) => sum + item.lessonCount, 0)
}

export function getAllCourseSearchItems(courseMaps: CourseMap[] = COURSE_MAPS) {
  return courseMaps.flatMap((map, mapIndex) =>
    map.nodes.map((node) => ({
      map,
      mapIndex,
      node,
      haystack: [
        map.title,
        map.shortTitle,
        map.subtitle,
        node.title,
        node.objective,
        node.difficulty,
        ...node.tags,
      ].join(' ').toLowerCase(),
    }))
  )
}
