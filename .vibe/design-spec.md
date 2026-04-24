# 视觉设计规范 (Design Specification)

## 1. 风格基调

- **核心关键词**: [例如：极简、硬核、实验室感、呼吸感、暗黑模式]
- **视觉参照**: [例如：Linear 官网、Apple 官网、Stripe 官网]

## 2. 色彩系统 (Tailwind 颜色)

- **主色 (Primary)**: `indigo-600` (用于按钮、链接、高亮)
- **背景 (Surface)**: `slate-950` (深色模式) / `white` (浅色模式)
- **文字 (Text)**: 主文字 `slate-200`，辅助文字 `slate-400`
- **强调色 (Accent)**: `fuchsia-500` (用于点缀动效)

## 3. 形状与排版

- **圆角 (Radius)**: 统一使用 `rounded-2xl` 或 `rounded-3xl`（偏向圆润）。
- **字体**:
  - 标题: [例如：Atkinson Hyperlegible, Inter]
  - 正文: 系统默认无衬线字体族。
- **间距**: 遵循 Tailwind 默认步进。

## 4. 特色组件 UI

- **卡片**: 带有微弱的 `border-white/10` 边框，背景使用 `bg-white/5` 的毛玻璃效果 (backdrop-blur)。
- **按钮**: 悬停时带有 `shadow-indigo-500/20` 的发光效果
