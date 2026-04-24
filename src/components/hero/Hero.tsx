import { Canvas } from '@react-three/fiber';
import { motion } from 'framer-motion';
import { Fragment, Suspense, useEffect, useState } from 'react';
import { DNA } from './DNA';
import { ScrollSequenceDecoder } from './ScrollSequenceDecoder';

const LINE = 'Code is the new pipette.';

/** 与下方 container.transition 保持一致，用于驱动光标位置 */
const TYPE_DELAY_MS = 400;
const TYPE_STAGGER_MS = 42;
/** 最后一个字符打出后，内联光标再停片刻，再切换为不占流式宽度的尾部光标（居中仍按纯文字） */
const CARET_HOLD_AFTER_LAST_MS = 420;

const container = {
	hidden: {},
	show: {
		transition: {
			staggerChildren: 0.042,
			delayChildren: 0.4,
		},
	},
};

const item = {
	hidden: { opacity: 0, y: 3 },
	show: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.24, ease: [0.23, 1, 0.32, 1] as const },
	},
};

function Caret() {
	return (
		<motion.span
			className="ml-px inline-block align-baseline font-mono text-[clamp(1.68rem,6.15vw,2.78rem)] text-cyan-400/90"
			style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
			initial={{ opacity: 1 }}
			animate={{ opacity: [1, 0.12, 1] }}
			transition={{
				duration: 0.9,
				repeat: Infinity,
				ease: 'easeInOut',
			}}
			aria-hidden
		>
			|
		</motion.span>
	);
}

export default function Hero() {
	const [reduced, setReduced] = useState(false);
	/** 光标紧跟在第 `caretAfter` 个字符之后；-1 表示在首字符之前 */
	const [caretAfter, setCaretAfter] = useState(-1);
	/** 打字结束：尾部光标改为绝对定位，不参与居中宽度计算 */
	const [lineSettled, setLineSettled] = useState(false);

	useEffect(() => {
		const mq = window.matchMedia('(max-width: 768px)');
		const apply = () => setReduced(mq.matches);
		apply();
		mq.addEventListener('change', apply);
		return () => mq.removeEventListener('change', apply);
	}, []);

	useEffect(() => {
		const n = LINE.length;
		const ids: ReturnType<typeof setTimeout>[] = [];
		for (let i = 0; i < n; i++) {
			const t = TYPE_DELAY_MS + i * TYPE_STAGGER_MS;
			ids.push(
				setTimeout(() => {
					setCaretAfter(i);
				}, t),
			);
		}
		const lastCharMs = TYPE_DELAY_MS + (n - 1) * TYPE_STAGGER_MS;
		ids.push(
			setTimeout(() => {
				setLineSettled(true);
			}, lastCharMs + CARET_HOLD_AFTER_LAST_MS),
		);
		return () => ids.forEach(clearTimeout);
	}, []);

	return (
		<div className="relative h-[100dvh] min-h-[100dvh] w-full overflow-hidden select-none">
			{/* 文案与 DNA 共用位移，整体上移 */}
			<div
				className="absolute inset-0 origin-center"
				style={{ transform: 'translateY(calc(-1 * min(7vh, 5.5rem)))' }}
			>
				<div className="absolute inset-0 z-0">
					<Canvas
						className="h-full w-full"
						camera={
							reduced
								? { position: [0.32, 0.52, 12.6], fov: 41.5 }
								: { position: [0.32, 0.48, 10.35], fov: 44.5 }
						}
						dpr={[1, 2]}
						gl={{
							alpha: true,
							antialias: true,
							powerPreference: 'high-performance',
						}}
						onCreated={({ gl }) => {
							gl.setClearColor(0x000000, 0);
						}}
					>
						<Suspense fallback={null}>
							<DNA reduced={reduced} />
						</Suspense>
					</Canvas>
				</div>

				<div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center pt-[clamp(4rem,14vh,7.5rem)]">
					<div className="flex w-full max-w-[min(94vw,48rem)] justify-center px-3">
						{/* 不可见占位：首帧即占满「整句 + 尾部光标」宽度，flex 居中一次到位，避免打完字后再重算居中 */}
						<span
							className="relative inline-block font-mono text-[clamp(1.68rem,6.15vw,2.78rem)] tracking-[0.05em]"
							style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
						>
							<span className="invisible block select-none whitespace-pre text-slate-200" aria-hidden>
								{LINE}|
							</span>
							<span className="absolute left-0 top-0 block h-full w-full whitespace-pre text-left text-slate-200">
								{caretAfter === -1 && !lineSettled ? <Caret key="caret--1" /> : null}
								<motion.span
									className="inline"
									variants={container}
									initial="hidden"
									animate="show"
									aria-label={LINE}
								>
									{LINE.split('').map((char, i) => (
										<Fragment key={`${i}-${char}`}>
											<motion.span variants={item} className="inline-block">
												{char === ' ' ? '\u00a0' : char}
											</motion.span>
											{caretAfter === i && !lineSettled ? <Caret key={`caret-${i}`} /> : null}
										</Fragment>
									))}
								</motion.span>
								{lineSettled ? (
									<span
										className="pointer-events-none absolute bottom-0 right-0 flex items-end"
										aria-hidden
									>
										<Caret key="caret-trail" />
									</span>
								) : null}
							</span>
						</span>
					</div>
				</div>

				{/* 与主标语对称的留白：距「画布底」≈ 主标语距顶，靠近 DNA 中部带 */}
				<ScrollSequenceDecoder />
			</div>
		</div>
	);
}
