# Typography & Reading Spec: Thought Models

## 字体系统
- **Technical/Headers:** `JetBrains Mono` (强调工程师身份)。
- **Body/Reading:** `Inter` (针对屏幕优化，字间距 `0.02em`)。
- **数学公式：** 使用 $\LaTeX$ 渲染，公式颜色统一为 `#22D3EE`。

## Markdown 文章样式
- **文章容器：** - `max-width: 800px`
  - `line-height: 1.8`
  - `padding: 4rem 2rem`
- **代码块：** 使用 Shiki 渲染，配色方案选用 `Tokyo Night Storm`，背景透明度设为 `0.5`。
- **引用块 (Blockquotes):** 边缘使用 `#34D399` 薄荷绿实线，背景注入极淡的绿光。

## 交互细节
- **链接悬停：** 文字下方出现从左至右延伸的电光青下划线。
- **图片：** 所有 Markdown 插入的图片自动添加 `border-radius: 12px` 和 `shadow-[0_0_20px_rgba(34,211,238,0.2)]`。