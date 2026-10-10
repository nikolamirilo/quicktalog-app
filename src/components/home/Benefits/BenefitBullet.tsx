import type { LucideIcon } from "lucide-react";

import { IconTile } from "@/components/general/IconTile";

export type BenefitBulletData = {
	icon: LucideIcon;
	title: string;
	description: string;
};

export function BenefitBullet({
	icon: Icon,
	title,
	description,
}: BenefitBulletData) {
	return (
		<li className="mt-[26px] flex flex-col items-center gap-3 lg:flex-row lg:items-start lg:gap-[18px]">
			<IconTile className="text-product-foreground lg:mt-0.5" size="md">
				<Icon />
			</IconTile>
			<div>
				<h4 className="text-lg font-bold tracking-[-0.015em]">{title}</h4>
				<p className="mt-1 text-[15.5px] text-product-foreground-accent">
					{description}
				</p>
			</div>
		</li>
	);
}
