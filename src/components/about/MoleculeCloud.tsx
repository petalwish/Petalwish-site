import { Text } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { Group } from 'three';
import type { MoleculeData } from './caffeineData';
import { moleculeRenderConfig } from './moleculeRenderConfig';

interface MoleculeCloudProps {
	data: MoleculeData;
}

function MoleculeMesh({ data }: MoleculeCloudProps) {
	const rootRef = useRef<Group>(null);
	const cfg = moleculeRenderConfig;

	const nodes = useMemo(
		() =>
			data.nodes.map((node) => ({
				...node,
				position: node.pos.map((v) => v * cfg.globalScale) as [number, number, number],
			})),
		[data.nodes, cfg.globalScale],
	);

	const particleData = useMemo(() => {
		const positions: number[] = [];
		const colors: number[] = [];

		const writeParticle = (
			x: number,
			y: number,
			z: number,
			color: THREE.Color,
			jitter: number,
		) => {
			positions.push(
				x + (Math.random() - 0.5) * jitter,
				y + (Math.random() - 0.5) * jitter,
				z + (Math.random() - 0.5) * jitter,
			);
			colors.push(color.r, color.g, color.b);
		};

		const edgeColor = new THREE.Color(cfg.edgeColor);
		const nodeColor = new THREE.Color(cfg.nodeColor);

		for (const edge of data.edges) {
			const from = nodes[edge.source]?.position;
			const to = nodes[edge.target]?.position;
			if (!from || !to) continue;

			const dx = to[0] - from[0];
			const dy = to[1] - from[1];
			const len = Math.hypot(dx, dy);
			const nx = len > 1e-5 ? -dy / len : 0;
			const ny = len > 1e-5 ? dx / len : 0;
			const laneOffsets = edge.order === 2 ? [-cfg.doubleBondOffset, cfg.doubleBondOffset] : [0];

			for (const laneOffset of laneOffsets) {
				for (let s = 0; s <= cfg.edgeSteps; s++) {
					const t = s / cfg.edgeSteps;
					const cx = THREE.MathUtils.lerp(from[0], to[0], t) + nx * laneOffset;
					const cy = THREE.MathUtils.lerp(from[1], to[1], t) + ny * laneOffset;
					const cz = THREE.MathUtils.lerp(from[2], to[2], t);
					for (let layer = 0; layer < cfg.edgeTubeLayers; layer++) {
						const a = Math.random() * Math.PI * 2;
						const r = cfg.edgeTubeRadius * (0.58 + Math.random() * 0.42);
						const ox = Math.cos(a) * r * nx;
						const oy = Math.cos(a) * r * ny;
						const oz = Math.sin(a) * r;
						writeParticle(cx + ox, cy + oy, cz + oz, edgeColor, cfg.edgeJitter);
					}
				}
			}
		}

		for (const node of nodes) {
			const isHeteroAtom = node.type === 'N' || node.type === 'O';
			if (isHeteroAtom) continue;
			for (let n = 0; n < cfg.nodeDuplicates; n++) {
				writeParticle(node.position[0], node.position[1], node.position[2], nodeColor, cfg.nodeJitter);
			}
		}

		return { positions: new Float32Array(positions), colors: new Float32Array(colors) };
	}, [data.edges, nodes, cfg]);

	const geom = useMemo(() => {
		const g = new THREE.BufferGeometry();
		g.setAttribute('position', new THREE.BufferAttribute(particleData.positions, 3));
		g.setAttribute('color', new THREE.BufferAttribute(particleData.colors, 3));
		return g;
	}, [particleData]);

	useFrame((state) => {
		const t = state.clock.getElapsedTime();
		if (!rootRef.current) return;
		rootRef.current.rotation.y = Math.sin(t * cfg.swaySpeed) * cfg.swayAmplitude;
		rootRef.current.position.y = Math.sin(t * cfg.floatSpeed) * cfg.floatAmplitude;
	});

	return (
		<group ref={rootRef}>
			<points geometry={geom} frustumCulled={false}>
				<pointsMaterial
					size={cfg.particleSize}
					vertexColors
					transparent
					opacity={cfg.particleOpacity}
					depthWrite={false}
					blending={THREE.AdditiveBlending}
					sizeAttenuation
					toneMapped={false}
				/>
			</points>

			{nodes.map((node) => {
				const isHeteroAtom = node.type === 'N' || node.type === 'O';
				if (!isHeteroAtom) return null;
				return (
					<Text
						key={`label-${node.id}`}
						position={node.position}
						fontSize={cfg.labelFontSize}
						anchorX="center"
						anchorY="middle"
						color={node.type === 'O' ? cfg.labelOColor : cfg.labelNColor}
						fillOpacity={cfg.labelOpacity}
						outlineWidth={cfg.labelOutlineWidth}
						outlineColor={cfg.edgeColor}
						outlineOpacity={cfg.labelOutlineOpacity}
						toneMapped={false}
					>
						{node.type}
					</Text>
				);
			})}
		</group>
	);
}

export default function MoleculeCloud({ data }: MoleculeCloudProps) {
	return (
		<Canvas
			camera={{ position: [0, 0, 8.2], fov: 42 }}
			dpr={[1, 2]}
			gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
			onCreated={({ gl }) => {
				gl.setClearColor(0x000000, 0);
			}}
		>
			<MoleculeMesh data={data} />
		</Canvas>
	);
}
