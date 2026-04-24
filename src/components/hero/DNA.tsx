import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

const CYAN = new THREE.Color('#22d3ee');
const MINT = new THREE.Color('#34d399');

const LENGTH = 4.35;
const R = 0.4;
const TURNS = 2.15;
const CHAIN_NODES = 190;
const RUNG_COUNT = 130;
const PTS_PER_RUNG = 7;

function lerp(a: number, b: number, t: number) {
	return a + (b - a) * t;
}

function pushChainPoint(
	positions: Float32Array,
	base: Float32Array,
	colors: Float32Array,
	chaos: Float32Array,
	idx: number,
	x: number,
	y: number,
	z: number,
	scatter: number,
) {
	const jx = (Math.random() - 0.5) * scatter;
	const jy = (Math.random() - 0.5) * scatter;
	const jz = (Math.random() - 0.5) * scatter;
	positions[idx * 3] = x + jx;
	positions[idx * 3 + 1] = y + jy;
	positions[idx * 3 + 2] = z + jz;
	base[idx * 3] = positions[idx * 3];
	base[idx * 3 + 1] = positions[idx * 3 + 1];
	base[idx * 3 + 2] = positions[idx * 3 + 2];
	const c = new THREE.Color().lerpColors(CYAN, MINT, Math.random());
	colors[idx * 3] = c.r;
	colors[idx * 3 + 1] = c.g;
	colors[idx * 3 + 2] = c.b;
	chaos[idx * 3] = Math.random() * 2 - 1;
	chaos[idx * 3 + 1] = Math.random() * 2 - 1;
	chaos[idx * 3 + 2] = Math.random() * 2 - 1;
}

function helixPoint(t: number, phase: number) {
	const theta = t * Math.PI * 2 * TURNS + phase;
	const x = (t - 0.5) * LENGTH;
	const y = R * Math.cos(theta);
	const z = R * Math.sin(theta);
	return { x, y, z };
}

function buildParticleSystem(reduced: boolean) {
	const chainN = reduced ? 110 : CHAIN_NODES;
	const rungN = reduced ? 72 : RUNG_COUNT;
	const perRung = reduced ? 5 : PTS_PER_RUNG;
	const skip = Math.ceil(rungN * 0.07);

	let count = chainN * 2;
	for (let j = 0; j < rungN; j++) {
		if (j < skip || j >= rungN - skip) continue;
		count += perRung;
	}

	const positions = new Float32Array(count * 3);
	const basePositions = new Float32Array(count * 3);
	const colors = new Float32Array(count * 3);
	const chaos = new Float32Array(count * 3);

	const scatterChain = 0.045;
	const scatterRung = 0.018;

	let idx = 0;
	for (let i = 0; i < chainN; i++) {
		const t = chainN > 1 ? i / (chainN - 1) : 0;
		const a = helixPoint(t, 0);
		pushChainPoint(positions, basePositions, colors, chaos, idx++, a.x, a.y, a.z, scatterChain);
		const b = helixPoint(t, Math.PI);
		pushChainPoint(positions, basePositions, colors, chaos, idx++, b.x, b.y, b.z, scatterChain);
	}

	for (let j = 0; j < rungN; j++) {
		if (j < skip || j >= rungN - skip) continue;
		const t = rungN > 1 ? j / (rungN - 1) : 0;
		const A = helixPoint(t, 0);
		const B = helixPoint(t, Math.PI);
		for (let k = 0; k < perRung; k++) {
			const u = perRung > 1 ? k / (perRung - 1) : 0;
			const x = lerp(A.x, B.x, u);
			const y = lerp(A.y, B.y, u);
			const z = lerp(A.z, B.z, u);
			pushChainPoint(positions, basePositions, colors, chaos, idx++, x, y, z, scatterRung);
		}
	}

	return { count, positions, basePositions, colors, chaos };
}

const ndc = new THREE.Vector2();
const rayOrigin = new THREE.Vector3();
const rayDir = new THREE.Vector3();
const mouseWorld = new THREE.Vector3();
const mouseLocal = new THREE.Vector3();
const dirVec = new THREE.Vector3();
const pushDir = new THREE.Vector3();
const chaosScratch = new THREE.Vector3();
const tmpTarget = new THREE.Vector3();

export function DNA({ reduced = false }: { reduced?: boolean }) {
	const groupRef = useRef<THREE.Group>(null);
	const pointsRef = useRef<THREE.Points>(null);
	const { gl, camera } = useThree();
	const pointerNDC = useRef({ x: 0, y: 0 });
	const hasPointer = useRef(false);

	const { count, positions, basePositions, colors, chaos } = useMemo(
		() => buildParticleSystem(reduced),
		[reduced],
	);

	useEffect(() => {
		const el = gl.domElement;
		const onMove = (e: PointerEvent) => {
			const rect = el.getBoundingClientRect();
			pointerNDC.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
			pointerNDC.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
			hasPointer.current = true;
		};
		const onLeave = () => {
			hasPointer.current = false;
		};
		el.addEventListener('pointermove', onMove);
		el.addEventListener('pointerleave', onLeave);
		return () => {
			el.removeEventListener('pointermove', onMove);
			el.removeEventListener('pointerleave', onLeave);
		};
	}, [gl]);

	useFrame((state, delta) => {
		const g = groupRef.current;
		const pts = pointsRef.current;
		if (!g || !pts?.geometry.attributes.position) return;

		g.rotation.x += delta * 0.011;
		g.position.y = Math.sin(state.clock.elapsedTime * 0.38) * 0.07;

		ndc.set(pointerNDC.current.x, pointerNDC.current.y);
		rayOrigin.setFromMatrixPosition(camera.matrixWorld);
		rayDir.set(ndc.x, ndc.y, 0.5).unproject(camera).sub(rayOrigin).normalize();

		if (hasPointer.current) {
			// 与 z=0 世界平面求交，得到鼠标在 DNA 附近的参考点
			if (Math.abs(rayDir.z) > 1e-5) {
				const t = -rayOrigin.z / rayDir.z;
				mouseWorld.copy(rayOrigin).addScaledVector(rayDir, t);
			} else {
				mouseWorld.set(rayOrigin.x + rayDir.x * 3, rayOrigin.y + rayDir.y * 3, 0);
			}
		} else {
			mouseWorld.set(1e6, 1e6, 1e6);
		}

		mouseLocal.copy(mouseWorld);
		g.worldToLocal(mouseLocal);

		const maxRadius = reduced ? 0.52 : 0.62;
		const pushAmp = reduced ? 0.85 : 1.05;
		const chaosAmp = reduced ? 0.12 : 0.16;

		const posAttr = pts.geometry.attributes.position;
		const arr = posAttr.array as Float32Array;

		for (let i = 0; i < count; i++) {
			const ix = i * 3;
			const bx = basePositions[ix];
			const by = basePositions[ix + 1];
			const bz = basePositions[ix + 2];
			let cx = arr[ix];
			let cy = arr[ix + 1];
			let cz = arr[ix + 2];

			dirVec.set(cx, cy, cz).sub(mouseLocal);
			const dist = dirVec.length();

			if (dist < maxRadius && hasPointer.current) {
				const force = (maxRadius - dist) / maxRadius;
				pushDir.copy(dirVec);
				if (dist > 1e-5) pushDir.multiplyScalar(1 / dist);
				else pushDir.set(1, 0, 0);

				chaosScratch.set(chaos[ix], chaos[ix + 1], chaos[ix + 2]);
				if (chaosScratch.lengthSq() > 1e-8) chaosScratch.normalize();

				tmpTarget
					.set(bx, by, bz)
					.addScaledVector(pushDir, force * pushAmp)
					.addScaledVector(chaosScratch, force * chaosAmp);

				cx = lerp(cx, tmpTarget.x, 0.18);
				cy = lerp(cy, tmpTarget.y, 0.18);
				cz = lerp(cz, tmpTarget.z, 0.18);
			} else {
				cx = lerp(cx, bx, 0.056);
				cy = lerp(cy, by, 0.056);
				cz = lerp(cz, bz, 0.056);
			}

			arr[ix] = cx;
			arr[ix + 1] = cy;
			arr[ix + 2] = cz;
		}

		posAttr.needsUpdate = true;
	});

	const geom = useMemo(() => {
		const g = new THREE.BufferGeometry();
		g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
		g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
		return g;
	}, [positions, colors]);

	return (
		<group ref={groupRef}>
			<points ref={pointsRef} geometry={geom} frustumCulled={false}>
				<pointsMaterial
					attach="material"
					size={reduced ? 0.024 : 0.032}
					vertexColors
					transparent
					opacity={1}
					depthWrite={false}
					blending={THREE.AdditiveBlending}
					sizeAttenuation
				/>
			</points>
		</group>
	);
}
