---
name: explain-c-module
description: "面向初级嵌入式工程师的代码讲解：读取一个新实现的 C 模块（文件或目录），生成中文学习文档，讲清'为什么这样写'，提炼涉及的嵌入式/RTOS/CMake 知识点。输出到 doc/explain/md/（源）与 doc/explain/html/（图文阅读版）。/explain-c-module <文件或目录> 触发。"
version: "1.0.0"
user-invocable: true
argument-hint: "[文件或目录路径，缺省=当前目录]"
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
---

# /explain-c-module — 嵌入式代码讲解（面向初级工程师）

把一个新实现的 C 模块讲透成一份学习文档：不止"做了什么"，更要讲清**为什么这样写**，
并把涉及的嵌入式 / RTOS / CMake 知识点提炼出来——帮 AI 时代的初学者补上"手把手开发"才能
积累的底层知识。

> 本 skill 纯指令型，无任何外部脚本/依赖。所有"怎么做"都在这里和 `references/` 里。

## 风格铁律（贯穿所有输出，每一条都重要）

- **读者画像**：懂一些 C 基础语法，但对**高级语法、软件架构、嵌入式底层**等深层知识不熟。
  所有关键处补"为什么"，而不是默认他懂。
  - 软件架构 = 模块如何分层组织（谁调谁、边界在哪、回调/事件机制怎么串起来）；
    具体到本工程即 LVGL 页面栈、UI manager 状态机、stream 框架的源→过滤→目的管线。
  - 高级语法 = checklist 第 9 镜头扫描的函数指针、`__attribute__`、`container_of`、
    指派初始化、`do{}while(0)` 宏家族等"会让人愣住"的 C 构造。
  - 嵌入式底层 = 前 8 个镜头（MMIO/中断/RTOS/位操作/外设/内存链接/时钟/CMake）。
- **术语白话化**：每个术语第一次出现给一句白话 + 类比。
  - 寄存器 = 一排开关；内存映射 I/O = 把开关钉在内存地址上读写。
  - 中断 = 电话铃，响了你得停下手头活去接；ISR = 接电话的那段代码。
  - DMA = 快递员，替 CPU 搬数据；栈 = 叠盘子，后进先出。
  - 优先级反转 = 快车道被一辆慢车堵住，后面全堵死。
- **代码讲解**：代码块配**中文行内注释**讲解，禁止只贴代码不复述。重点讲"为什么这样写"
  而非逐行翻译"这行做了 X"。
- **⚠️ 危险标注**：易踩坑的行写成 `⚠️ <文件:行号>：改这里会影响 X / 为什么容易错`。
- **不臆造**：代码里**没用到**的知识点不要硬塞；不确定的硬件细节（具体寄存器位含义、时钟
  频率数值）标"请查芯片参考手册 RM"，绝不要瞎编一个数。
- **语言**：中文输出；代码、标识符、API 名、MCU 型号保持原文。

## 执行流程（严格按顺序）

### Step 0 — 帮助 / 缺省参数

- 若参数是 `--help` / `-h`：打印下面「用法」节并停，不做任何文件操作。
- 若没给参数：默认对当前目录 `.` 执行。

### Step 1 — 解析目标

- 参数是 **文件**（`.c` / `.h`）：讲解该文件；顺带读它 `#include` 的同目录头文件。
- 参数是 **目录**：`Glob` 其下 `**/*.c` 与 `**/*.h`；再找最近的 `CMakeLists.txt`
  （或 `SConscript` / `Kconfig`）了解它怎么被构建。
- **找不到任何 `.c` / `.h`**：友好报错 "在 `<path>` 没找到 C 源文件"，停。不生成空文档。

### Step 2 — 上下文探测（只为"针对性讲解"，不命中就跳过该维度）

用 `Grep` / 读头文件快速判断。命中结果记在心里，Step 5 讲解时用上（尤其 CMake 构建维度）：

- **RTOS**：`FreeRTOS.h` / `task.h` · `rtthread.h` · `#include <zephyr/...>` · `nuttx/...`
- **MCU 厂商**：`hpm_` · `stm32`/`stm32fXxx.h` · `gd32` · `ch32` · `nrf`/`nordic` · `esp_` 等
- **构建信息**（看最近 `CMakeLists.txt`）：`add_library` / `add_executable` 的 target 名、
  `target_include_directories`、`target_link_libraries`、编译选项（`-O`、`-g`、
  `-ffunction-sections`、`--gc-sections`）

### Step 3 — 确定模块名与输出路径

- **模块名**：目录→目录名；单文件→文件 stem。下划线化、去空格与特殊字符。
- **输出两份**（MD 为源、HTML 为阅读版，同模块名配对）：
  - `doc/explain/md/<模块名>.md`
  - `doc/explain/html/<模块名>.html`
- `md/`、`html/` 不存在则创建（`mkdir -p doc/explain/md doc/explain/html`）。
- **同名文件已存在**：MD 与 HTML 都默认在文件名后加日期后缀（如 `_20260729`）另存，
  **不静默覆盖**；除非用户明确说要覆盖。
- **MD 为源，HTML 内容须与 MD 一致**（章节、代码片段、⚠️ 标注对齐）；先写 MD，再据此写 HTML。

### Step 4 — 读参考

`Read` 这三个文件，按它们的指引生成文档：

- `${CLAUDE_SKILL_DIR}/references/doc-template.md`（MD 输出的 8 节结构）
- `${CLAUDE_SKILL_DIR}/references/html-template.md`（HTML 阅读版骨架：高亮、⚠️ 框、目录）
- `${CLAUDE_SKILL_DIR}/references/knowledge-checklist.md`（9 个知识点"镜头"）

### Step 5 — 读代码并生成文档（MD + HTML 两份）

读全部源文件。先按 `doc-template.md` 的 8 节结构写 `doc/explain/md/<模块名>.md`，
再按 `html-template.md` 把同一份内容渲染成 `doc/explain/html/<模块名>.html`。

- **第 3 节（知识点）只展开 checklist 里本模块真实命中的维度**——每条写
  "是什么 / 为什么用 / 这段代码怎么用"。没命中的不塞；命中较多可分组小标题。
  若有值得初学者记住的生僻 C 语法，节末加 `### C 语法聚焦` 集中讲 2-4 处（见 checklist 第 9 镜头）。
- **第 4 节（逐段讲解）**：挑最关键的 N 个函数/段落。每段：代码块 + 中文讲解，
  **重点讲"为什么这样写"**。遇到初级读者会愣住的语法（函数指针、`container_of`、
  `__attribute__`、指派初始化、`do{}while(0)` 宏等），顺手给一句白话行内注释。
- 能用表格、ASCII 时序图/框图就说人话（外设初始化顺序、中断处理流程、数据流向）。
  ASCII 图 MD/HTML 都能用；HTML 里若必要可用 Mermaid 画更漂亮的版本。
- HTML 里代码用 highlight.js 做 C 高亮；⚠️ 标注用模板里的提示框样式；顶部放可折叠目录。

### Step 6 — 回复用户（简短，别贴整篇文档）

聊天里只给摘要：
- 模块一句话功能
- 命中了哪些知识点（bullet）
- 延伸学习清单
- 文档路径：`doc/explain/md/<模块名>.md`（源）+ `doc/explain/html/<模块名>.html`（阅读版）

末尾主动问一句："要不要对 `<某个知识点>` 深入讲一讲？"

## 用法

```
/explain-c-module              # 讲解当前目录的模块
/explain-c-module src/drivers/uart.c    # 讲解单个文件
/explain-c-module src/drivers/          # 讲解整个目录（含其 CMakeLists.txt 上下文）
/explain-c-module --help       # 打印用法
```

## 边界与降级

- **空目录 / 无 C 文件**：报错并停，不生成空文档。
- **超大模块**（>10 个源文件，或单文件 >800 行）：第 4 节只讲最关键的 5-8 个函数，其余在
  末尾列表（函数名 + 一句话职责）；文档顶部注明"已精简讲解，其余函数见源码"。
- **不确定的硬件细节**：标"⚠️ 具体寄存器位 / 时钟配置请查 `<芯片>` 参考手册 (RM)"，
  不要编数值。
- **纯头文件 / 纯声明模块**：仍可讲（结构体布局、宏、API 设计意图），但说明"本文件无实现，
  实现在 .c"。
