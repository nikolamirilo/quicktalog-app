import {
	type LottieAnimation,
	LottiePlayer,
} from "@/components/general/LottiePlayer";
import { Rise } from "@/components/general/Rise";
import {
	BenefitBullet,
	type BenefitBulletData,
} from "@/components/home/Benefits/BenefitBullet";

export type BenefitData = {
	title: string;
	description: string;
	bullets: BenefitBulletData[];
	image: { src: string; width: number; height: number };
	animation: LottieAnimation;
	restFrame: number;
};

/** Text with three bullets beside an illustration; the image sits left from `lg`. */
export function BenefitSection({ benefit }: { benefit: BenefitData }) {
	const { title, description, bullets, image, animation, restFrame } = benefit;

	return (
		<section className="flex flex-col items-center gap-7 py-10 lg:flex-row lg:justify-center lg:gap-20 lg:py-[72px]">
			<Rise className="w-full max-w-[520px] text-center lg:order-1 lg:text-left">
				<h3 className="text-[clamp(30px,3.6vw,46px)] font-extrabold tracking-[-0.03em]">
					{title}
				</h3>
				<p className="mt-3.5 text-[17px] text-product-foreground-accent">
					{description}
				</p>
				<ul className="mt-3">
					{bullets.map((bullet) => (
						<BenefitBullet key={bullet.title} {...bullet} />
					))}
				</ul>
			</Rise>
			<LottiePlayer
				animation={animation}
				className="aspect-[480/340] w-full max-w-[460px]"
				fallback={
					<img
						alt=""
						className="h-full w-full object-contain"
						height={image.height}
						loading="lazy"
						src={image.src}
						width={image.width}
					/>
				}
				restFrame={restFrame}
			/>
		</section>
	);
}
