# Logic Spec: Scrollytelling & Transitions

## 阶段划分
1. **Section 1: Hero**
   - **DNA 状态：** 垂直居中，点云静谧。
   - **文字：** 标题打字机效果逐个浮现。
   - **相机：** 正对着螺旋中段。

2. **Section 2: Exhibition (Exhibits)**
   - **DNA 状态：** 随着滚动，螺旋放大并向左/右偏移。
   - **相机：** 产生“微观切入”感，穿行于碱基对之间。
   - **触发：** 侧边弹出带有 `backdrop-blur` 的信息面板（药学背景、GenomicAI、X-Lab）。

3. **Section 3: Blog (Digital Garden)**
   - **DNA 状态：** 逐渐“解旋”变为两条垂直的数据光柱。
   - **材质：** 从圆点变为数字 `0` 或 `1`（碎片化演变）。
   - **容器：** 全屏宽度的毛玻璃容器升起，DNA 动效变为模糊背景。

4. **Section 4: Outro**
   - **DNA 状态：** 相机极速拉远（Zoom Out），展示全景螺旋。
   - **交互：** 二维码组件带有点脉冲效果。

## 滚动技术细节
- 使用 `GSAP ScrollTrigger` 监听滚动，确保 3D 属性与 CSS 属性的插值完全平滑同步。
- 强制开启平滑滚动（Smooth Scrolling），首选 `lenis`。