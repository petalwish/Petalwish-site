import { Canvas } from '@react-three/fiber';
import { motion } from 'framer-motion';
import { Fragment, Suspense, useEffect, useState } from 'react';
import { DNA } from './DNA';

const LINE = 'Code is the new pipette.';

/** 与下方 container.transition 保持一致，用于驱动光标位置 */
const TYPE_DELAY_MS = 400;
const TYPE_STAGGER_MS = 42;

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
		transition: { duration: 0.24, ease: [0.23, 1, 0.32, 1] },
	},
};

function Caret() {
	return (
		<motion.span
			className="ml-px inline-block align-baseline font-mono text-[clamp(1.2rem,4.2vw,1.95rem)] text-cyan-400/90"
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

				<div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center pt-[clamp(5.25rem,20vh,9.5rem)]">
					<div className="mx-auto max-w-[min(94vw,48rem)] px-3 text-center">
						<span className="inline font-mono text-[clamp(1.2rem,4.2vw,1.95rem)] tracking-[0.05em] text-slate-200">
							{caretAfter === -1 ? <Caret key="caret--1" /> : null}
							<motion.span
								className="inline"
								style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
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
										{caretAfter === i ? <Caret key={`caret-${i}`} /> : null}
									</Fragment>
								))}
							</motion.span>
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
