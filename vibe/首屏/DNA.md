# 任务目标：构建首屏 3D 粒子交互 DNA 视觉 (Hero Section)

你是一个世界级的前端动效工程师与 WebGL 专家。请使用 AFT 技术栈（Astro + React + Framer Motion + Tailwind CSS），结合 React Three Fiber (R3F) 和 Three.js，为我生成一个可以直接运行的首屏组件。

## 1. 视觉基调与 Vibe (Visual Target)
- **核心概念**：数字生命、极简理智、微观实验室、点云数据流。
- **背景**：极深的蓝黑色 (`#070A0F`)，带有一层极低透明度 (3%) 的极地青色 (`#22D3EE`) 极简网格线背景。
- **主体**：一个水平放置（沿 X 轴延伸）的 3D DNA 双螺旋结构。**【绝对禁止】** 使用线段 (Lines) 或圆柱体模型。必须完全由高密度的“发光粒子（Point Cloud）”组成，呈现出类似“数字液态金属”或“荧光星尘”的质感。
- **色彩空间**：粒子颜色在电光青 (`#22D3EE`) 和薄荷绿 (`#34D399`) 之间随机映射。开启加色混合 (AdditiveBlending) 制造荧光感。
- **排版**：底部正中央，使用等宽字体 (JetBrains Mono) 呈现文本 “Code is the new pipette.”，需要有打字机逐字输出效果，并在末尾带有闪烁的终端光标。

## 2. 交互逻辑 (Interaction Mechanics)
- **静谧自转**：DNA 结构在没有操作时，沿着 X 轴进行极其缓慢的自转，并在 Y 轴上有微弱的呼吸级上下浮动。
- **磁场排斥力 (核心交互)**：当用户的鼠标在屏幕上移动时，鼠标坐标会映射到 3D 空间。DNA 粒子会表现出“畏惧”或“磁性互斥”：距离鼠标一定半径内的粒子会被迅速推开、打散；当鼠标离开后，粒子会像带有弹簧一样，平滑、柔和地恢复到原来的基因序列位置。

## 3. 数学逻辑与伪代码 (Technical Blueprint)

请在独立的 React 组件 `<DNA />` 中实现 3D 逻辑，并在 `<Hero />` 容器中进行组装。请严格遵循以下伪代码逻辑来编写你的 R3F 代码：

### A. 粒子生成逻辑 (useMemo)
我们需要预计算初始粒子的位置。DNA 包含两条主链和中间的阶梯（碱基对）。

```text
算法定义 (伪代码):
常量定义: 
  总点数 = 链节点数 + (阶梯数 * 每个阶梯的点数)
  螺旋半径 = R, 螺旋圈数 = Turns, DNA长度 = Length

创建三个 Float32Array: positions, basePositions(用于存储原始坐标以便恢复), colors

1. 生成两条螺旋链:
循环 i 从 0 到 链节点数:
  计算 t = i / 链节点数
  计算角度 theta = t * 2 * PI * Turns
  链 A 相位 = theta, 链 B 相位 = theta + PI
  x 坐标 = 映射 t 到 (-Length/2, Length/2)
  y 坐标 = R * cos(对应相位)
  z 坐标 = R * sin(对应相位)
  
  关键：对 (x, y, z) 加上微小的随机偏移量 (scatter)，打破完美的几何感，呈现“点云聚集”的粗糙质感。
  将坐标存入 positions 和 basePositions，随机分配颜色存入 colors。

2. 生成中间的阶梯 (碱基对):
循环 j 从 0 到 阶梯数:
  跳过两端的阶梯 (让两端呈现渐渐散开的视觉)
  计算当前阶梯在链 A 和链 B 上的绝对坐标 (Ax, Ay, Az) 和 (Bx, By, Bz)
  
  循环 k 从 0 到 每个阶梯的点数:
    使用线性插值 (Lerp) 计算链 A 和链 B 之间的坐标点。
    加上极微小的随机偏移。
    存入 positions, basePositions 和 colors。


渲染与物理循环逻辑
算法定义 (伪代码):
获取鼠标在 Three.js 世界空间的映射坐标 MouseVec(x, y, 0)
更新整个点云容器的 rotation.x (缓慢增加) 和 position.y (基于时间的 Sine 波形)

获取当前粒子的 positions 数组

循环 i 遍历所有粒子:
  读取该粒子的 BasePosition (bx, by, bz)
  读取该粒子的 CurrentPosition (cx, cy, cz)
  
  计算 CurrentPosition 与 MouseVec 的距离 Dist
  设定影响半径 MaxRadius
  
  如果 Dist < MaxRadius:
    // 受到排斥力
    计算排斥强度 Force = (MaxRadius - Dist) / MaxRadius
    计算远离鼠标的方向向量 Dir
    计算目标破碎坐标 Target = BasePosition + (Dir * Force * 放大系数) + 随机混沌抖动
    CurrentPosition = Lerp(CurrentPosition, Target, 0.15) // 快速散开
  否则:
    // 不受力，回归原位
    CurrentPosition = Lerp(CurrentPosition, BasePosition, 0.05) // 缓慢、柔和地愈合

  将 CurrentPosition 写回 positions 数组

标记 positions 属性为 needsUpdate = true


输出要求 (Output Constraints)
直接输出包含 Tailwind 样式的 .jsx 或 .tsx 组件代码。

文本打字机效果请使用 framer-motion 的 variants 实现 staggerChildren，确保流畅度。

Three.js 材质必须使用 <points> 和 <pointsMaterial>，设置 transparent={true}, depthWrite={false}, blending={THREE.AdditiveBlending}，粒子大小 size 建议在 0.02 到 0.04 之间。

根容器需要设置 select-none 和防溢出，确保纯净的交互体验。