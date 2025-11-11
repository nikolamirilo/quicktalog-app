"use client";
import { useUser } from "@clerk/nextjs";
import {
	type Environments,
	initializePaddle,
	type Paddle,
} from "@paddle/paddle-js";
import type { User } from "@quicktalog/common";
import { tiers } from "@quicktalog/common";
import { motion, type Variants } from "framer-motion";
import { useEffect, useState } from "react";
import { getUserData } from "@/actions/users";
import { usePaddlePrices } from "@/hooks/usePaddelPrices";
import MiniCTA from "../MiniCTA";
import PricingColumn from "./PricingColumn";

const containerVariants: Variants = {
	offscreen: { opacity: 0, y: 100 },
	onscreen: {
		opacity: 1,
		y: 0,
		transition: {
			type: "spring" as const,
			bounce: 0.2,
			duration: 0.9,
			delayChildren: 0.2,
			staggerChildren: 0.1,
		},
	},
};

const childVariants = {
	offscreen: { opacity: 0, y: 50 },
	onscreen: {
		opacity: 1,
		y: 0,
		transition: { type: "spring" as const, bounce: 0.2, duration: 0.8 },
	},
};

type BillingCycle = "monthly" | "yearly";

const Pricing: React.FC = () => {
	const [paddle, setPaddle] = useState<Paddle | undefined>(undefined);
	const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
	const [user, setUser] = useState<User>(null);
	const { user: clerkUser } = useUser();

	const { prices } = usePaddlePrices(paddle, "US");

	useEffect(() => {
		if (
			process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN &&
			process.env.NEXT_PUBLIC_PADDLE_ENV
		) {
			initializePaddle({
				token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
				environment: process.env.NEXT_PUBLIC_PADDLE_ENV as Environments,
			}).then((paddle) => {
				if (paddle) setPaddle(paddle);
			});
		}
	}, []);

	useEffect(() => {
		if (!clerkUser?.id) return;
		async function fetchUserData() {
			const res = await fetch(`/api/users/${clerkUser.id}`, {
				credentials: "include",
			});
			const data = await res.json();
			if (data) {
				setUser(data);
			}
		}
		fetchUserData();
	}, [clerkUser?.id]);

	const filteredTiers = tiers.filter(
		(item) => item?.type === "standard" && item?.id > 0,
	);

	return (
		<div className="space-y-6 mx-4">
			{/* Segmented toggle */}
			<div className="flex items-center justify-center">
				<div className="relative inline-flex w-[260px] bg-product-background border border-product-border rounded-full p-1 shadow-sm">
					{/* Sliding thumb */}
					<span
						aria-hidden="true"
						className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-product-primary transition-transform duration-300 ease-out ${
							billingCycle === "yearly" ? "translate-x-full" : "translate-x-0"
						}`}
					/>
					<button
						className={`relative z-10 flex-1 px-4 py-1.5 text-sm rounded-full transition-colors ${
							billingCycle === "monthly"
								? "text-product-foreground font-bold"
								: "text-product-foreground/60 font-medium"
						}`}
						onClick={() => setBillingCycle("monthly")}
						type="button"
					>
						Monthly
					</button>
					<button
						className={`relative z-10 flex-1 px-4 py-1.5 text-sm  rounded-full transition-colors ${
							billingCycle === "yearly"
								? "text-product-foreground font-bold"
								: "text-product-foreground/60 font-medium"
						}`}
						onClick={() => setBillingCycle("yearly")}
						type="button"
					>
						Yearly
					</button>
				</div>
			</div>
			<div className="mb-8">
				<PricingColumn
					billingCycle={billingCycle}
					highlight={false}
					key={`pricing-plan-${tiers[0].priceId.month}`}
					mode="row"
					paddle={paddle}
					price={
						prices[
							billingCycle === "monthly"
								? tiers[0].priceId.month
								: tiers[0].priceId.year
						]
					}
					priceId={
						billingCycle === "monthly"
							? tiers[0].priceId.month
							: tiers[0].priceId.year
					}
					tier={tiers[0]}
					user={user}
				/>
			</div>
			{/* Pricing grid */}
			<motion.div
				className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
				initial="offscreen"
				variants={containerVariants}
				viewport={{ once: true }}
				whileInView="onscreen"
			>
				{filteredTiers.map((tier) => (
					<motion.div
						key={`pricing-plan-${tier.priceId.month}`}
						variants={childVariants}
					>
						<PricingColumn
							billingCycle={billingCycle}
							highlight={tier.id == 2 ? true : false}
							paddle={paddle}
							price={
								prices[
									billingCycle === "monthly"
										? tier.priceId.month
										: tier.priceId.year
								]
							}
							priceId={
								billingCycle === "monthly"
									? tier.priceId.month
									: tier.priceId.year
							}
							tier={tier}
							user={user}
						/>
					</motion.div>
				))}
			</motion.div>

			<div className="pt-4">
				<MiniCTA />
			</div>
		</div>
	);
};

export default Pricing;
