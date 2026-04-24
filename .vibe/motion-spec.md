# 动效交互规范 (Motion Specification)

## 1. 物理引擎参数 (Spring Config)

- **标准弹簧**: `stiffness: 100, damping: 20` (稳重、流畅)
- **快速响应**: `stiffness: 260, damping: 20` (清爽、干脆)

## 2. 常用转场 (Transitions)

- **入场动画**: 元素从 `y: 20, opacity: 0` 渐变为 `y: 0, opacity: 1`。
- **页面切换**: 使用 Astro 的 `ViewTransitions`，配合 Framer Motion 的 `AnimatePresence`。
- **悬停反馈**: 比例放大 `scale: 1.02`，并在极短时间内完成。

## 3. 滚动触发 (Scroll Reveal)

- 所有列表项在进入视口时，应有 `0.1s` 的交错延迟 (Stagger children)。
