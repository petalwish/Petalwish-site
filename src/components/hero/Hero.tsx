import { Canvas } from '@react-three/fiber';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { DNA } from './DNA';

const LINE = 'Code is the new pipette.';

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

export default function Hero() {
	const [reduced, setReduced] = useState(false);

	useEffect(() => {
		const mq = window.matchMedia('(max-width: 768px)');
		const apply = () => setReduced(mq.matches);
		apply();
		mq.addEventListener('change', apply);
		return () => mq.removeEventListener('change', apply);
	}, []);

	const caretDelay = useMemo(
		() => 0.4 + (typeof LINE === 'string' ? LINE.length : 0) * 0.042 + 0.12,
		[],
	);

	return (
		<div className="relative h-[100dvh] min-h-[100dvh] w-full overflow-hidden select-none">
			<div className="absolute inset-0 z-0">
				<Canvas
					camera={
						reduced
							? { position: [0.32, 0.48, 12.6], fov: 41.5 }
							: { position: [0.32, 0.42, 10.35], fov: 44.5 }
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

			<div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-end pb-[max(2rem,env(safe-area-inset-bottom))]">
				<div className="mx-auto max-w-[min(92vw,42rem)] text-center">
					<motion.span
						className="inline font-mono text-[clamp(0.78rem,2vw,0.98rem)] tracking-[0.06em] text-slate-200"
						style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
						variants={container}
						initial="hidden"
						animate="show"
						aria-label={LINE}
					>
						{LINE.split('').map((char, i) => (
							<motion.span key={`${i}-${char}`} variants={item} className="inline-block">
								{char === ' ' ? '\u00a0' : char}
							</motion.span>
						))}
					</motion.span>
					<motion.span
						className="ml-px inline-block align-baseline font-mono text-cyan-400/90"
						style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
						initial={{ opacity: 0 }}
						animate={{ opacity: [1, 0.12, 1] }}
						transition={{
							delay: caretDelay,
							duration: 0.9,
							repeat: Infinity,
							ease: 'easeInOut',
						}}
						aria-hidden
					>
						|
					</motion.span>
				</div>
			</div>

			<div className="pointer-events-none absolute right-[max(1.35rem,env(safe-area-inset-right))] bottom-[max(1.35rem,env(safe-area-inset-bottom))] z-10 text-cyan-400/40">
				<Sparkles className="size-5" strokeWidth={1.2} aria-hidden />
			</div>
		</div>
	);
}
