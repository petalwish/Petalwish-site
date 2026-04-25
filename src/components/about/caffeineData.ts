export type AtomType = 'C' | 'N' | 'O';

export interface MoleculeNode {
	id: number;
	type: AtomType;
	pos: [number, number, number];
}

export interface MoleculeData {
	nodes: MoleculeNode[];
	edges: MoleculeEdge[];
}

export interface MoleculeEdge {
	source: number;
	target: number;
	order: 1 | 2;
}

// 咖啡因分子：简化 3D 坐标 + 连接拓扑
export const caffeineData: MoleculeData = {
	// 经过严格几何计算的 2D 投影坐标 (完美正六边形 + 对称五元环)
	nodes: [
	  // === 六元环 (嘧啶环核心) ===
	  { id: 0, type: 'N', pos: [-2.6,  0.75, 0] }, // N1 (左上)
	  { id: 1, type: 'C', pos: [-2.6, -0.75, 0] }, // C2 (左下)
	  { id: 2, type: 'N', pos: [-1.3, -1.50, 0] }, // N3 (正下)
	  { id: 3, type: 'C', pos: [ 0.0, -0.75, 0] }, // C4 (右下共享)
	  { id: 4, type: 'C', pos: [ 0.0,  0.75, 0] }, // C5 (右上共享)
	  { id: 5, type: 'C', pos: [-1.3,  1.50, 0] }, // C6 (正上)
  
	  // === 五元环 (咪唑环附加) ===
	  { id: 6, type: 'N', pos: [ 1.4,  1.20, 0] }, // N7 (右上向外)
	  { id: 7, type: 'C', pos: [ 2.3,  0.00, 0] }, // C8 (最右端)
	  { id: 8, type: 'N', pos: [ 1.4, -1.20, 0] }, // N9 (右下向外)
  
	  // === 取代基：双键氧 (=O) ===
	  { id: 9,  type: 'O', pos: [-3.8, -1.45, 0] }, // C2=O (向左下延伸)
	  { id: 10, type: 'O', pos: [-1.3,  2.70, 0] }, // C6=O (垂直向上延伸)
  
	  // === 取代基：甲基 (-CH3) ===
	  { id: 11, type: 'C', pos: [-3.8,  1.45, 0] }, // N1-CH3 (向左上延伸)
	  { id: 12, type: 'C', pos: [-1.3, -2.70, 0] }, // N3-CH3 (垂直向下延伸)
	  { id: 13, type: 'C', pos: [ 2.5,  2.10, 0] }  // N7-CH3 (向右上延伸)
	],
	
	// 拓扑结构保持完全正确
	edges: [
		// === 六元环 ===
		{ source: 0, target: 1, order: 1 },
		{ source: 1, target: 2, order: 1 },
		{ source: 2, target: 3, order: 1 },
		{ source: 3, target: 4, order: 2 },
		{ source: 4, target: 5, order: 1 },
		{ source: 5, target: 0, order: 1 },
		// === 五元环 ===
		{ source: 4, target: 6, order: 1 },
		{ source: 6, target: 7, order: 1 },
		{ source: 7, target: 8, order: 2 },
		{ source: 8, target: 3, order: 1 },
		// === 双键氧 ===
		{ source: 1, target: 9, order: 2 },
		{ source: 5, target: 10, order: 2 },
		// === 甲基 ===
		{ source: 0, target: 11, order: 1 },
		{ source: 2, target: 12, order: 1 },
		{ source: 6, target: 13, order: 1 },
	],
};