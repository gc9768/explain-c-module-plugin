# 嵌入式知识点扫描清单

Step 3 / 4 讲解时，用下面这些"镜头"逐条扫源码。**命中才展开，没命中不塞。**
命中 = 代码里确实出现了对应的模式 / 符号 / API。

每个镜头给：①扫描什么符号 → ②讲什么（讲动机，不是背定义）。

---

## 1. 寄存器与内存映射 I/O (MMIO)

- **扫描**：`volatile`、`(volatile uint32_t *)`、`__IO` / `__iomem`、裸地址强转
  `0x40000000UL`、宏定义寄存器基地址、结构体映射外设后 `->` 取成员。
- **讲**：为什么必须 `volatile`（不让编译器把对硬件的读写优化掉）、读-改-写模式、
  基地址 + 偏移定位寄存器、结构体覆盖寄存器组的原理。

## 2. 中断与并发

- **扫描**：`*IRQHandler` / `_irq` / `ISR`、`NVIC_`、`__enable_irq` / `__disable_irq`、
  `taskENTER_CRITICAL` / `portENTER_CRITICAL`、`xQueueSendFromISR`、
  `BaseType_t xHigherPriorityTaskWoken`。
- **讲**：ISR 必须短、**不能阻塞 / 不能 printf**、临界区为什么存在、`FromISR` 后缀 API、
  `xHigherPriorityTaskWoken` 与 `portYIELD_FROM_ISR`（中断里唤醒任务后要不要切走）。

## 3. 位操作

- **扫描**：`(1U << n)`、`&=` / `|=` / `^=`、`~`、`& (mask)`、"先清位再置位"组合。
- **讲**：掩码、置位 / 清位 / 翻转 / 读取某一位、用移位拼接多字段寄存器、为什么用 `1U`
  （无符号，避免 `1 << 31` 的有符号溢出未定义行为）。

## 4. 时钟与时序

- **扫描**：`clock` / `clk` / `PLL` / `divider` / `prescaler`、`delay` / `mdelay` /
  `vTaskDelay` / `osDelay`、忙等循环 `while (timeout--)`、`HAL_GetTick()` / `xTaskGetTickCount()`。
- **讲**：时钟树、分频、**外设必须先开时钟才能用**、忙等待（烧 CPU）vs 硬件定时器 vs
  RTOS 延时（让出 CPU、省电）的取舍。

## 5. 外设驱动

- **扫描**：`GPIO` / `gpio_`、`UART` / `usart_`、`SPI` / `spi_`、`I2C` / `i2c_`、
  `DMA` / `dma_`、`Timer` / `PWM` / `pwm_`、`ADC` / `adc_`。
- **讲**：典型配置流程（开时钟 → 配引脚复用 → 配外设参数 → 使能 → 中断/DMA），
  **结合本模块实际的初始化顺序**讲，必要时画 ASCII 顺序图。

## 6. 内存与链接

- **扫描**：`__attribute__((section(...)))` / `__section` / `AT()`、`__attribute__((aligned))`、
  `static`、`const`、`AT_NONCACHEABLE` / `__nocache` / `NONCACHEABLE`、`malloc` / `pvPortMalloc`、
  `__STACK_SIZE` / `__HeapLimit`。
- **讲**：`.bss` / `.data` / `.text` / `.rodata` 各放什么、栈 vs 堆、`static` 的文件级私有作用域、
  **DMA buffer 为什么要对齐 + 放非 cache 区**（cache 一致性问题）。

## 7. RTOS

- **扫描**：`xTaskCreate` / `osThreadNew`、`SemaphoreHandle_t` / `xSemaphore`、`Mutex` /
  `xSemaphoreCreateMutex`、`Queue` / `xQueue`、`vTaskDelay` / `osDelay`、
  `configMAX_PRIORITIES`、`TaskHandle_t`。
- **讲**：任务/线程、信号量 / 互斥量 / 队列各自的用途与区别、优先级与优先级反转、
  阻塞 vs 轮询、任务栈大小为什么重要（栈溢出是最常见的隐性崩溃）、临界区与上下文切换的代价。

## 8. 构建系统 (CMake)

- **扫描**（看最近的 `CMakeLists.txt`）：`add_library` / `add_executable`、
  `target_include_directories`、`target_link_libraries`、`target_compile_options`、
  `-ffunction-sections -fdata-sections`、`--gc-sections`、`INTERFACE` / `ALIAS` 库。
- **讲**：这个模块属于哪个 target、include 路径从哪来、链接了哪些库、
  `-ffunction-sections` + `--gc-sections` 为什么用（裁掉没被调用的代码、省 Flash）、
  这个模块如何被编进最终固件。

## 9. C 语言细节与生僻语法（对初学者）

对初级读者，**代码里真实出现的、会让人愣住的语法**都值得点一句。命中才讲，别堆。

- **扫描（常见）**：函数指针 `void (*func)(...)`、回调 `register_xxx_callback`、结构体位域 `:1`、
  `union`、`typedef`、`#define` 宏家族、`static inline`、`extern`、头文件保护 `#ifndef _X_H_`。
- **扫描（偏僻 / 易懵）**：复合字面量 `(type){...}`、指派初始化 `.field =`、`_Generic`、
  `__attribute__((section/aligned/packed/weak))`、`container_of` / `offsetof`、
  `do { ... } while (0)` 宏包裹、宏的 `#` 字符串化 / `##` 拼接、X-macro、`restrict`、
  `enum` vs `#define` 常量。
- **讲**：函数指针 / 回调机制、位域 vs 位掩码的取舍、宏的坑（缺括号 / 多次求值 / `do{}while(0)` 为啥那么包）、
  `static` 文件级 vs 函数内的区别、头文件保护防重复包含、`__attribute__` 各属性在此场景的动机
  （`section` 钉到链接段、`aligned` 给 DMA buffer 对齐）、`container_of` 怎么从成员反查宿主结构体。

> 这些可放进第 3 节的 `### C 语法聚焦`（挑 2-4 处最值得记住的，带代码锚点），
> 也可只在第 4 节逐段讲解里用一句白话行内注释带过 —— 看重要程度，别喧宾夺主。

---

## 放进第 3 节的优先级（按"对初学者理解本模块的阻塞程度"排，实际按命中相关度裁剪）

`MMIO` > `中断/并发` > `RTOS` > `位操作` > `外设驱动` > `内存/链接` > `时钟时序` > `CMake` > `C 细节`

> 这只是排序提示，不是数量限制。命中几条写几条；一条没命中，第 3 节可以只写最相关的 1-2 条，
> 但**不要为了凑数把没出现的知识点写进去**。
>
> 例外：**任何初级读者会愣住的 C 语法**（函数指针、`__attribute__`、`container_of`、指派初始化、
> `do{}while(0)` 宏等），不管它在上表排第几，都至少在第 4 节给一句白话注释 ——
> 这是"看不懂代码"最直接的拦路虎。
