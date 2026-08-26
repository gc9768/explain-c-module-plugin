# Examples

这些示例用于快速判断 skill 是否适合你的工程。将目标文件或目录替换为自己的路径即可。

## Embedded C / RTOS

```text
用 explain-c-module 分析 src/tasks/camera_task.c，重点说明任务、队列、定时器和错误恢复。
```

## Driver / ISR / DMA

```text
讲解 drivers/uart/，梳理中断入口、DMA 缓冲区、回调链和并发风险，并生成 HTML 文档。
```

## Low-power

```text
分析 power/ 目录的睡眠、唤醒、suspend/resume 和时钟/电源域关系，给出状态图和数据流图。
```

## Expected output

```text
doc/explain/md/<module>.md
doc/explain/html/<module>.html
```

HTML 版本会在 Markdown 内容基础上增加 Mermaid 图表、折叠面板、证据框和代码高亮。
