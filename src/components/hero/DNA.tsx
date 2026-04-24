import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

/** 偏蓝的电青 → 亮天青插值（相对原版 #22d3ee / #34d399 整体更蓝、略提饱和） */
const CYAN = new THREE.Color('#16aef0');
const MINT = new THREE.Color('#4dd8fc');
/** 顶点色整体提亮（加色混合下仍受 1 钳制） */
const COLOR_GAIN = 1.48;

/** 3D 圆柱螺旋：沿 +X；1.5 圈 ≈ 三段波形；目标约 70% 视宽（与相机联动） */
const TURNS = 1.5;
const LENGTH = 13;
const R_HELIX = 1.06;

/** 主链沿曲线采样数 */
const STRAND_POINTS = 3800;
/** 每条主链每个采样点的壳层粒子数（空心管壳） */
const STRAND_SAMPLES_PER_NODE = 2;
const BACKBONE_TUBE_R = 0.14;
const BACKBONE_TUBE_R_MOBILE = 0.086;
/** 壳层半径占 tubeR 的比例区间 [min,1]，越大则越「中空」、轴心越暗 */
const HOLLOW_R_MIN = 0.56;
const HOLLOW_R_MIN_MOBILE = 0.5;
/** 离散阶梯：均匀覆盖 t∈[0,1]，含两端碱基对 */
const RUNG_SLOTS = 20;
/** 单根碱基对沿 A–B 中心线的采样点数 */
const POINTS_PER_RUNG = 260;
/** 横档空心球壳外半径（加宽）；与侧链同法向球壳采样 */
const RUNG_TUBE_R = 0.046;
const RUNG_TUBE_R_MOBILE = 0.027;
/** 每个采样点上的壳层粒子数（与侧链 STRAND_SAMPLES_PER_NODE 一致） */
const RUNG_SHELL_SAMPLES = 2;
const RUNG_T_LO = -0.001;
const RUNG_T_HI = 1.001;

const SCATTER_STRAND = 0.058;
/** 横档与侧链壳层共用同一 scatter 比例系数（见 writeRungShell） */
const SCATTER_RUNG = 0.058;

/** 移动端：仍保持离散阶梯结构，降低量级 */
const M_STRAND = 1700;
const STRAND_SAMPLES_PER_NODE_MOBILE = 2;
const M_RUNG_SLOTS = 12;
const M_PPR = 96;

function lerp(a: number, b: number, t: number) {
	return THREE.MathUtils.lerp(a, b, t);
}

function writeParticle(
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
	const sx = (Math.random() - 0.5) * scatter;
	const sy = (Math.random() - 0.5) * scatter;
	const sz = (Math.random() - 0.5) * scatter;
	const px = x + sx;
	const py = y + sy;
	const pz = z + sz;
	const i3 = idx * 3;
	positions[i3] = px;
	positions[i3 + 1] = py;
	positions[i3 + 2] = pz;
	base[i3] = px;
	base[i3 + 1] = py;
	base[i3 + 2] = pz;
	const c = new THREE.Color().lerpColors(CYAN, MINT, Math.random()).multiplyScalar(COLOR_GAIN);
	// 微调向蓝轴，避免偏绿
	c.b = Math.min(1, c.b * 1.04);
	c.g = Math.min(1, c.g * 0.98);
	colors[i3] = Math.min(1, c.r);
	colors[i3 + 1] = Math.min(1, c.g);
	colors[i3 + 2] = Math.min(1, c.b);
	chaos[i3] = Math.random() * 2 - 1;
	chaos[i3 + 1] = Math.random() * 2 - 1;
	chaos[i3 + 2] = Math.random() * 2 - 1;
}

function helixXYZ(t: number, phase: number) {
	const theta = t * Math.PI * 2 * TURNS + phase;
	const x = (t - 0.5) * LENGTH;
	const y = R_HELIX * Math.cos(theta);
	const z = R_HELIX * Math.sin(theta);
	return { x, y, z };
}

/** 空心管壳：粒子分布在半径 [hollowMin·tubeR, tubeR] 的球壳带上，保持 tubeR 不变、减弱轴心过亮 */
function writeBackboneShell(
	positions: Float32Array,
	base: Float32Array,
	colors: Float32Array,
	chaos: Float32Array,
	idxStart: number,
	cx: number,
	cy: number,
	cz: number,
	layers: number,
	tubeR: number,
	hollowMin: number,
): number {
	let w = 0;
	for (let layer = 0; layer < layers; layer++) {
		const u = Math.random();
		const v = Math.random();
		const sphT = Math.PI * 2 * u;
		const sphP = Math.acos(2 * v - 1);
		const rad = tubeR * (hollowMin + Math.random() * (1 - hollowMin));
		const ox = rad * Math.sin(sphP) * Math.cos(sphT);
		const oy = rad * Math.sin(sphP) * Math.sin(sphT);
		const oz = rad * Math.cos(sphP);
		writeParticle(
			positions,
			base,
			colors,
			chaos,
			idxStart + w,
			cx + ox,
			cy + oy,
			cz + oz,
			SCATTER_STRAND * 0.34,
		);
		w++;
	}
	return w;
}

/** 碱基对横档：与侧链相同的空心球壳采样，scatter 与侧链壳层一致以匹配亮度 */
function writeRungShell(
	positions: Float32Array,
	base: Float32Array,
	colors: Float32Array,
	chaos: Float32Array,
	idxStart: number,
	cx: number,
	cy: number,
	cz: number,
	layers: number,
	tubeR: number,
	hollowMin: number,
): number {
	let w = 0;
	for (let layer = 0; layer < layers; layer++) {
		const u = Math.random();
		const v = Math.random();
		const sphT = Math.PI * 2 * u;
		const sphP = Math.acos(2 * v - 1);
		const rad = tubeR * (hollowMin + Math.random() * (1 - hollowMin));
		const ox = rad * Math.sin(sphP) * Math.cos(sphT);
		const oy = rad * Math.sin(sphP) * Math.sin(sphT);
		const oz = rad * Math.cos(sphP);
		writeParticle(
			positions,
			base,
			colors,
			chaos,
			idxStart + w,
			cx + ox,
			cy + oy,
			cz + oz,
			SCATTER_RUNG * 0.34,
		);
		w++;
	}
	return w;
}

function countRungs(rungSlots: number) {
	let n = 0;
	for (let j = 0; j < rungSlots; j++) {
		const t = rungSlots > 1 ? j / (rungSlots - 1) : 0.5;
		if (t < RUNG_T_LO || t > RUNG_T_HI) continue;
		n++;
	}
	return n;
}

function buildParticleSystem(reduced: boolean) {
	const strandN = reduced ? M_STRAND : STRAND_POINTS;
	const rungSlots = reduced ? M_RUNG_SLOTS : RUNG_SLOTS;
	const ppr = reduced ? M_PPR : POINTS_PER_RUNG;
	const strandLayers = reduced ? STRAND_SAMPLES_PER_NODE_MOBILE : STRAND_SAMPLES_PER_NODE;
	const tubeR = reduced ? BACKBONE_TUBE_R_MOBILE : BACKBONE_TUBE_R;
	const hollowMin = reduced ? HOLLOW_R_MIN_MOBILE : HOLLOW_R_MIN;

	const rungCount = countRungs(rungSlots);
	const strandParticles = strandN * 2 * strandLayers;
	const rungTubeR = reduced ? RUNG_TUBE_R_MOBILE : RUNG_TUBE_R;
	const rungShellLayers = reduced ? STRAND_SAMPLES_PER_NODE_MOBILE : RUNG_SHELL_SAMPLES;
	const rungHollowMin = reduced ? HOLLOW_R_MIN_MOBILE : HOLLOW_R_MIN;
	const count = strandParticles + rungCount * ppr * rungShellLayers;

	const positions = new Float32Array(count * 3);
	const basePositions = new Float32Array(count * 3);
	const colors = new Float32Array(count * 3);
	const chaos = new Float32Array(count * 3);

	let idx = 0;

	for (let i = 0; i < strandN; i++) {
		const t = strandN > 1 ? i / (strandN - 1) : 0.5;
		const a = helixXYZ(t, 0);
		idx += writeBackboneShell(positions, basePositions, colors, chaos, idx, a.x, a.y, a.z, strandLayers, tubeR, hollowMin);
		const b = helixXYZ(t, Math.PI);
		idx += writeBackboneShell(positions, basePositions, colors, chaos, idx, b.x, b.y, b.z, strandLayers, tubeR, hollowMin);
	}

	for (let j = 0; j < rungSlots; j++) {
		const t = rungSlots > 1 ? j / (rungSlots - 1) : 0.5;
		if (t < RUNG_T_LO || t > RUNG_T_HI) continue;

		const theta = t * Math.PI * 2 * TURNS;
		const x = (t - 0.5) * LENGTH;
		const yA = R_HELIX * Math.cos(theta);
		const zA = R_HELIX * Math.sin(theta);
		const yB = R_HELIX * Math.cos(theta + Math.PI);
		const zB = R_HELIX * Math.sin(theta + Math.PI);

		for (let k = 0; k < ppr; k++) {
			const u = ppr > 1 ? k / (ppr - 1) : 0;
			const y = lerp(yA, yB, u);
			const z = lerp(zA, zB, u);
			idx += writeRungShell(
				positions,
				basePositions,
				colors,
				chaos,
				idx,
				x,
				y,
				z,
				rungShellLayers,
				rungTubeR,
				rungHollowMin,
			);
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

		g.rotation.x += delta * 0.017;
		g.position.y = Math.sin(state.clock.elapsedTime * 0.38) * 0.12;

		ndc.set(pointerNDC.current.x, pointerNDC.current.y);
		rayOrigin.setFromMatrixPosition(camera.matrixWorld);
		rayDir.set(ndc.x, ndc.y, 0.5).unproject(camera).sub(rayOrigin).normalize();

		if (hasPointer.current) {
			if (Math.abs(rayDir.z) > 1e-5) {
				const tHit = -rayOrigin.z / rayDir.z;
				mouseWorld.copy(rayOrigin).addScaledVector(rayDir, tHit);
			} else {
				mouseWorld.set(rayOrigin.x + rayDir.x * 8, rayOrigin.y + rayDir.y * 8, 0);
			}
		} else {
			mouseWorld.set(1e6, 1e6, 1e6);
		}

		mouseLocal.copy(mouseWorld);
		g.worldToLocal(mouseLocal);

		const maxRadius = reduced ? 0.62 : 1.32;
		const pushAmp = reduced ? 0.52 : 0.86;
		const chaosAmp = reduced ? 0.048 : 0.072;

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

				cx = lerp(cx, tmpTarget.x, 0.078);
				cy = lerp(cy, tmpTarget.y, 0.078);
				cz = lerp(cz, tmpTarget.z, 0.078);
			} else {
				cx = lerp(cx, bx, 0.06);
				cy = lerp(cy, by, 0.06);
				cz = lerp(cz, bz, 0.06);
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
					size={reduced ? 0.03 : 0.025}
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
