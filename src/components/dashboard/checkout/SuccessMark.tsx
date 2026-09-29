import styles from "./SuccessMark.module.css";

/** 84px animated check mark for the checkout success page. Plays once on load. */
export function SuccessMark() {
	return (
		<div aria-hidden="true" className="mb-[22px] h-[84px] w-[84px]">
			<svg className="h-full w-full overflow-visible" viewBox="0 0 120 120">
				<circle className={styles.disc} cx="60" cy="60" r="50" />
				<circle
					className={styles.ring}
					cx="60"
					cy="60"
					pathLength={100}
					r="50"
				/>
				<path
					className={styles.tick}
					d="M39 61.5l14.5 14L82 46"
					pathLength={100}
				/>
			</svg>
		</div>
	);
}
