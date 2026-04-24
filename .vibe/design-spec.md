# 个人网站设计总结与视觉规范提示词

## 第一部分：SOP 设计内容总结

这份 SOP 围绕 **“AI 与生命科学的交叉前沿”** 展开，将个人网站从单纯的简历转化为一个**“人格的数字化延伸”**。

1.  **核心意象 (Core Image)**: “在计算机中运行的 DNA 双螺旋”，象征数字逻辑与生物生命的交织。
2.  **叙事逻辑 (Scrollytelling)**: 采用 **Infinite Canvas (无限画布)**。以 3D DNA 脊梁贯穿全程，通过滚动驱动视角从微观（碱基对）切换到宏观（职业履历），并最终落地到思考模型（博客）。
3.  **身份宣言 (Manifesto)**: “Code is the new pipette.（代码是这个时代的移液枪）”，明确了从药学生向生物问题工程师的身份转化。
4.  **交互节奏 (Rhythm)**: 强调“静谧如海”的入水感，动效极长且丝滑，利用 3D 点云、毛玻璃容器和极地冷光营造高精尖实验室的沉浸感。

---

## 第二部分：Vibe Coding 视觉设计规范

您可以直接将以下内容复制到项目的 `.cursorrules` 或全局 Prompt 中。

# 视觉设计规范 (Design Specification)

## 1. 风格基调

- **核心关键词**: 静谧如海 (Serum Science)、绝对理智、数字实验室、点云质感、深邃暗黑模式。
- **视觉参照**: VS Code (Tokyo Night Storm 风格)、Apple (高保真毛玻璃)、Stripe (流体梯度)、科学期刊互动版。
- **情感反馈**: 极其克制、深邃、精准、具有呼吸感。

## 2. 色彩系统 (Tailwind / CSS Variables)

- **背景 (Surface)**: `#0B0E14` (Deep Blue-Black) —— 模拟极深海或液氮冷却的服务器空间。
- **主色 (Primary)**: `#22D3EE` (Cyan-400) —— 电光青，用于 DNA 脊梁、交互高亮。
- **强调色 (Accent)**: `#34D399` (Mint-400) —— 薄荷绿，用于代码注释、成功状态。
- **文字 (Text)**: 
  - 主文字: `#E2E8F0` (Slate-200) - 冰冷灰。
  - 辅助文字: `#94A3B8` (Slate-400)。
- **边框 (Border)**: `rgba(34, 211, 238, 0.1)` —— 极淡的青色半透明线条。

## 3. 形状与排版

- **圆角 (Radius)**: 
  - 容器统一使用 `rounded-xl` (12px) 或 `rounded-2xl` (16px)。
  - 按钮使用 `rounded-full` 或 `rounded-md` (工业感)。
- **字体**:
  - **标题/代码/元数据**: `JetBrains Mono` —— 强调工程师身份。
  - **正文/阅读**: `Inter` —— 极简现代，设置 `letter-spacing: 0.02em`。
- **间距**: 遵循宽松的系统，确保极高的留白感。

## 4. 特色组件 UI & 动效

- **3D DNA Backbone**: 
  - 必须使用 `react-three-fiber`。
  - 材质为点云 (Point Cloud)，具备 `additive-blending` 发光效果。
- **Glassmorphism (毛玻璃)**:
  - 容器: `bg-deep/60` 配合 `backdrop-blur-xl`。
  - 边框: 顶部及左侧带有一像素的 `border-glow/20` 渐变。
- **按钮 (Interaction)**: 
  - 悬停时产生微弱的 `shadow-[0_0_15px_rgba(34,211,238,0.3)]` 霓虹光晕。
- **动画曲线 (Vibe)**: 
  - 全局使用 `transition: all 1.2s cubic-bezier(0.23, 1, 0.32, 1)`。
  - 滚动需平滑 (Lenis)，严禁任何瞬间跳变。

## 5. Vibe Coding 行为准则

- **代码质量**: 优先使用 Astro 的组件化方案，3D 逻辑需解耦在单独的 React 组件中。
- **响应式**: 移动端优先考虑 DNA 螺旋的简化（减少点数）以保证帧率。
- **Markdown 渲染**: 必须支持代码高亮 (Shiki) 和 LaTeX 公式，公式颜色需继承 `Primary Glow`。

---

**专家建议：**
在开始 Vibe Coding 时，建议先让 AI 生成 **`ThemeContext`** 或 **`Tailwind Config`**。
*“嘿，AI，基于这份视觉规范文档，先帮我重写 Tailwind 配置文件，并为我的 Astro 项目创建一个全局的 Layout 骨架，确保背景网格和深蓝黑色彩准确。”*