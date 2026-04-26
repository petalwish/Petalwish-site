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

const GRID_X = [-4.6, -2.9, -1.1, 0.8, 2.5, 4.2];
const GRID_Y = [2.08, 1.0, -0.08, -1.16, -2.24];

export default function ThirtyMoleculesCloud() {
	const entries = useMemo(() => Object.entries(importedMolecules), []);
	const placements = useMemo<Placement[]>(
		() =>
			entries.map(([key], i) => {
				const col = i % GRID_X.length;
				const row = Math.floor(i / GRID_X.length);
				const bx = GRID_X[col] ?? 0;
				const by = GRID_Y[row] ?? 0;
				const ox = Math.sin((i + 1) * 1.17) * 0.28;
				const oy = Math.cos((i + 1) * 0.83) * 0.2;
				const z = -0.88 + ((i % 6) - 2.5) * 0.23;
				return {
					key,
					position: [bx + ox, by + oy, z],
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
