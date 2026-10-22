import type { PricingPlan } from "@quicktalog/common";

import { isFreeTier } from "@/constants/pricing";
import { formatPrice } from "@/lib/format/price";

/**
 * A plan's Paddle price. Until Paddle answers it shows a dash; if Paddle never
 * does, the free plan still shows $0 and paid plans say the price is shown at
 * checkout instead of "loading" forever.
 */
export function PriceAmount({
	tier,
	price,
	unavailable,
}: {
	tier: PricingPlan;
	price: string | undefined;
	unavailable: boolean;
}) {
	if (price) return <>{formatPrice(price)}</>;
	if (unavailable && isFreeTier(tier)) return <>$0</>;
	return (
		<>
			<span aria-hidden="true">–</span>
			<span className="sr-only">
				{unavailable ? "Price shown at checkout" : "Price loading"}
			</span>
		</>
	);
}
