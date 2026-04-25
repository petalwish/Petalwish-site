import { useEffect, useRef, useState } from 'react';

const TARGET_COMMAND = '>> EXECUTE_LAB_CLUSTERS.SH';
/** 左侧提示符长度，`>>` 始终固定显示、不参与滚动译码 */
const PREFIX_LOCK_LEN = 2;
const GLITCH_CHARS = 'ATCG01';
/** 小于 1：在更短滚动距离内完成整行译码（相对视口高度） */
const SCROLL_DECODE_VIEWPORT_FRAC = 0.48;

function pickGlitchChar() {
	return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)] ?? '0';
}

/**
 * 首屏底部：`>>` 恒为锁定态；其余随滚动线性译码，未锁定段随机 ATCG01。
 */
export function ScrollSequenceDecoder() {
	const [scrollY, setScrollY] = useState(0);
	const [vh, setVh] = useState(() =>
		typeof window !== 'undefined' ? window.innerHeight : 800,
	);
	const [glitchTick, setGlitchTick] = useState(0);
	const scrollRaf = useRef<number | null>(null);

	useEffect(() => {
		const flush = () => {
			scrollRaf.current = null;
			setScrollY(window.scrollY);
			setVh(window.innerHeight);
		};
		const onScrollResize = () => {
			if (scrollRaf.current != null) return;
			scrollRaf.current = requestAnimationFrame(flush);
		};
		flush();
		window.addEventListener('scroll', onScrollResize, { passive: true });
		window.addEventListener('resize', onScrollResize);
		return () => {
			window.removeEventListener('scroll', onScrollResize);
			window.removeEventListener('resize', onScrollResize);
			if (scrollRaf.current != null) cancelAnimationFrame(scrollRaf.current);
		};
	}, []);

	const progress = Math.min(1, scrollY / Math.max(1, vh * SCROLL_DECODE_VIEWPORT_FRAC));
	const tailLen = TARGET_COMMAND.length - PREFIX_LOCK_LEN;
	const charsToLock = PREFIX_LOCK_LEN + Math.floor(progress * tailLen);

	const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
	useEffect(() => {
		const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
		const apply = () => setPrefersReducedMotion(mq.matches);
		apply();
		mq.addEventListener('change', apply);
		return () => mq.removeEventListener('change', apply);
	}, []);

	useEffect(() => {
		if (prefersReducedMotion) return;
		if (charsToLock >= TARGET_COMMAND.length) return;

		const id = window.setInterval(() => {
			setGlitchTick((t) => t + 1);
		}, 52);
		return () => clearInterval(id);
	}, [charsToLock, prefersReducedMotion]);

	return (
		<div
			className="pointer-events-none absolute inset-x-0 bottom-[clamp(4rem,14vh,7.5rem)] z-[25] flex flex-col items-center justify-center gap-y-1.5 px-3 pb-[max(0.25rem,env(safe-area-inset-bottom))]"
			data-glitch-tick={glitchTick}
		>
			<p
				className="max-w-[min(100%,50rem)] overflow-x-auto whitespace-nowrap text-center font-mono text-[clamp(0.9rem,3.05vw,1.18rem)] leading-snug tracking-[0.028em] text-slate-400/88"
				style={{ fontFamily: "'JetBrains Mono', var(--font-tech, ui-monospace), monospace" }}
				aria-hidden
			>
				(base) PetalWish@
				<span
					className="font-medium text-[color:var(--accent-mint)]"
					style={{
						textShadow:
							'0 0 12px color-mix(in srgb, var(--accent-mint) 38%, transparent), 0 0 22px color-mix(in srgb, var(--accent-mint) 16%, transparent)',
					}}
				>
					花辞树
				</span>
				&apos;s MacBook-Air %
			</p>
			<p
				role="status"
				aria-label={TARGET_COMMAND}
				className="max-w-[min(100%,50rem)] overflow-x-auto whitespace-nowrap text-center font-mono text-[clamp(1rem,3.35vw,1.35rem)] leading-snug tracking-[0.032em]"
				style={{ fontFamily: "'JetBrains Mono', var(--font-tech, ui-monospace), monospace" }}
			>
				{TARGET_COMMAND.split('').map((char, i) => {
					const lockedHere = i < charsToLock;
					if (lockedHere) {
						return (
							<span
								key={i}
								className="inline-block text-[#22D3EE]"
								style={{
									textShadow: '0 0 10px rgba(34, 211, 238, 0.42), 0 0 22px rgba(34, 211, 238, 0.2)',
								}}
							>
								{char === ' ' ? '\u00a0' : char}
							</span>
						);
					}
					if (char === ' ') {
						return (
							<span key={i} className="inline-block text-[#94A3B8]/50">
								{'\u00a0'}
							</span>
						);
					}
					if (prefersReducedMotion) {
						return (
							<span key={i} className="inline-block text-[#94A3B8]/50">
								{GLITCH_CHARS[i % GLITCH_CHARS.length]}
							</span>
						);
					}
					return (
						<span key={i} className="inline-block text-[#94A3B8]/50">
							{pickGlitchChar()}
						</span>
					);
				})}
			</p>
		</div>
	);
}
