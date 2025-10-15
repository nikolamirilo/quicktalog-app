//@ts-nocheck
"use client";
import clsx from "clsx";
import { motion, Variants } from "framer-motion";

import { IBenefit } from "@/types/components";
import SectionTitle from "../SectionTitle";
import BenefitBullet from "./BenefitBullet";

interface Props {
	benefit: IBenefit;
	imageAtRight?: boolean;
}

const containerVariants: Variants = {
	offscreen: {
		opacity: 0,
		y: 100,
	},
	onscreen: {
		opacity: 1,
		y: 0,
		transition: {
			type: "spring",
			bounce: 0.2,
			duration: 0.9,
			delayChildren: 0.2,
			staggerChildren: 0.1,
		},
	},
};

export const childVariants = {
	offscreen: {
		opacity: 0,
		x: -50,
	},
	onscreen: {
		opacity: 1,
		x: 0,
		transition: {
			type: "spring",
			bounce: 0.2,
			duration: 1,
		},
	},
};

const BenefitSection: React.FC<Props> = ({ benefit, imageAtRight }: Props) => {
	const { title, description, imageSrc, bullets } = benefit;

	return (
		<section className="benefit-section">
			<motion.div
				className="flex flex-wrap flex-col items-center justify-center gap-2 lg:flex-row lg:gap-20 lg:flex-nowrap mt-24 mb-24"
				initial="offscreen"
				variants={containerVariants}
				viewport={{ once: true }}
				whileInView="onscreen"
			>
				<div
					className={clsx("flex flex-wrap items-center w-full max-w-lg", {
						"justify-start": imageAtRight,
						"lg:order-1 justify-end": !imageAtRight,
					})}
				>
					<div className="w-full  text-center lg:text-left ">
						<motion.div
							className="flex flex-col w-full"
							variants={childVariants}
						>
							<SectionTitle>
								<h3 className="lg:max-w-2xl">{title}</h3>
							</SectionTitle>

							<p className="mt-1.5 mx-auto lg:ml-0 leading-normal text-product-foreground-accent">
								{description}
							</p>
						</motion.div>

						<div className="mx-auto lg:ml-0 w-full">
							{bullets.map((item, index) => (
								<BenefitBullet
									description={item.description}
									icon={item.icon}
									key={`benefit-item-${index}`}
									title={item.title}
								/>
							))}
						</div>
					</div>
				</div>

				<div className={clsx("mt-5 lg:mt-0", { "lg:order-2": imageAtRight })}>
					<div
						className={clsx("w-fit flex", {
							"justify-start": imageAtRight,
							"justify-end": !imageAtRight,
						})}
					>
						<img
							alt="title"
							className="lg:ml-0"
							height="762"
							src={imageSrc}
							width="384"
						/>
					</div>
				</div>
			</motion.div>
		</section>
	);
};

export default BenefitSection;
