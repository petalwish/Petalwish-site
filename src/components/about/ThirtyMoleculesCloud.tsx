import { Canvas } from '@react-three/fiber';
import { useMemo } from 'react';
import { MoleculeParticleMesh } from './MoleculeCloud';
import { importedMolecules } from './molecules/generatedMolecules';

interface Placement {
	key: string;
	position: [number, number, number];
	scaleMultiplier: number;
	opacityMultiplier: number;
	animationPhase: number;
	animationSpeedMultiplier: number;
}

const GRID_COLS = 6;
const GRID_ROWS = 5;
const X_SPREAD = 5.7;
const Y_SPREAD = 3.2;
const X_OFFSET = -0.40;

const GRID_X = Array.from({ length: GRID_COLS }, (_, i) =>
	-X_SPREAD + (i * (X_SPREAD * 2)) / (GRID_COLS - 1),
);
const GRID_Y = Array.from({ length: GRID_ROWS }, (_, i) =>
	Y_SPREAD - (i * (Y_SPREAD * 2)) / (GRID_ROWS - 1),
);

export default function ThirtyMoleculesCloud() {
	const entries = useMemo(() => Object.entries(importedMolecules), []);
	const placements = useMemo<Placement[]>(
		() =>
			entries.map(([key], i) => {
				const col = i % GRID_X.length;
				const row = Math.floor(i / GRID_X.length);
				const bx = GRID_X[col] ?? 0;
				const by = GRID_Y[row] ?? 0;
				const ox = Math.sin((i + 1) * 1.17) * 0.36;
				const oy = Math.cos((i + 1) * 0.83) * 0.28;
				const z = -0.88 + ((i % 6) - 2.5) * 0.23;
				return {
					key,
					position: [bx + ox + X_OFFSET, by + oy, z],
					scaleMultiplier: 0.63 + ((i * 7) % 8) * 0.055,
					opacityMultiplier: 0.6 + ((i * 5) % 6) * 0.06,
					animationPhase: i * 0.45,
					animationSpeedMultiplier: 0.88 + (i % 5) * 0.05,
				};
			}),
		[entries],
	);

	return (
		<Canvas
			camera={{ position: [0, 0, 9.1], fov: 44 }}
			dpr={[1, 2]}
			gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
			onCreated={({ gl }) => {
				gl.setClearColor(0x000000, 0);
			}}
		>
			{placements.map((item) => {
				const data = importedMolecules[item.key];
				if (!data) return null;
				return (
					<MoleculeParticleMesh
						key={item.key}
						data={data}
						showLabels={false}
						position={item.position}
						scaleMultiplier={item.scaleMultiplier}
						opacityMultiplier={item.opacityMultiplier}
						animationPhase={item.animationPhase}
						animationSpeedMultiplier={item.animationSpeedMultiplier}
					/>
				);
			})}
		</Canvas>
	);
}
