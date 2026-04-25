export interface MoleculeRenderConfig {
	globalScale: number;
	floatAmplitude: number;
	floatSpeed: number;
	swayAmplitude: number;
	swaySpeed: number;
	edgeSteps: number;
	edgeJitter: number;
	doubleBondOffset: number;
	edgeTubeRadius: number;
	edgeTubeLayers: number;
	nodeDuplicates: number;
	nodeJitter: number;
	particleSize: number;
	particleOpacity: number;
	edgeColor: string;
	nodeColor: string;
	labelFontSize: number;
	labelOpacity: number;
	labelOutlineWidth: number;
	labelOutlineOpacity: number;
	labelNColor: string;
	labelOColor: string;
}

/**
 * 所有分子的统一视觉参数中心。
 * 后续导入更多分子时，只要复用同一渲染组件并修改这里即可全局生效。
 */
export const moleculeRenderConfig: MoleculeRenderConfig = {
	globalScale: 0.3,
	floatAmplitude: 0.06,
	floatSpeed: 0.35,
	swayAmplitude: 0.08,
	swaySpeed: 0.14,
	edgeSteps: 64,
	edgeJitter: 0.005,
	doubleBondOffset: 0.05,
	edgeTubeRadius: 0.018,
	edgeTubeLayers: 2,
	nodeDuplicates: 2,
	nodeJitter: 0.008,
	particleSize: 0.013,
	particleOpacity: 1.0,
	edgeColor: '#8edfff',
	nodeColor: '#ffffff',
	labelFontSize: 0.1,
	labelOpacity: 0.86,
	labelOutlineWidth: 0.006,
	labelOutlineOpacity: 0.45,
	labelNColor: '#c8efff',
	labelOColor: '#f5fbff',
};
