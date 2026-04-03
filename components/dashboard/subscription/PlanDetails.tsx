import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/helpers/client";
import type { PricingPlan } from "@quicktalog/common";
import {
	Calendar,
	CheckCircle,
	Clock,
	CreditCard,
	DollarSign,
	Shield,
	Star,
	Zap,
} from "lucide-react";
import { MdOutlineSettings } from "react-icons/md";

export interface PlanDetailsProps {
	pricingPlan: PricingPlan;
	subscriptionStartDate?: string;
	subscriptionUpdatedDate?: string;
	currentPrice: string | undefined;
	loading: boolean;
	onManageSubscription: () => void;
	onUpgrade: () => void;
}

const formatDate = (dateString: string) => {
	return new Date(dateString).toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
};

const getPlanIcon = (planName: string) => {
	const name = planName?.toLowerCase();
	if (
		name?.includes("pro") ||
		name?.includes("premium") ||
		name?.includes("growth") ||
		name?.includes("custom")
	)
		return <Star className="w-5 h-5" />;
	if (name?.includes("enterprise")) return <Shield className="w-5 h-5" />;
	return <Zap className="w-5 h-5" />;
};

const getPlanColor = (planName: string) => {
	const name = planName?.toLowerCase();
	return "bg-product-primary";
};

export default function PlanDetails({
	pricingPlan,
	subscriptionStartDate,
	subscriptionUpdatedDate,
	currentPrice,
	loading,
	onManageSubscription,
	onUpgrade,
}: PlanDetailsProps) {
	const defaultDate = new Date().toISOString();

	if (!pricingPlan) {
		return (
			<div className="max-w-4xl mx-auto p-6">
				<Card
					className="border-product-border border-2 border-dashed"
					style={{ boxShadow: "var(--product-shadow)" }}
				>
					<CardContent className="flex flex-col items-center justify-center py-12">
						<CreditCard className="w-16 h-16 text-product-foreground-accent mb-4" />
						<h3 className="text-xl font-semibold text-product-foreground mb-2">
							No Subscription Plan Found
						</h3>
						<p className="text-product-foreground-accent text-center mb-6">
							You haven't selected a Subscription plan yet. Choose a plan to get
							started.
						</p>
						<Button className="bg-product-primary text-product-foreground ">
							View Available Plans
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<>
			{/* Upgrade plan */}
			<div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-product-primary/10 to-product-primary/5 border-2 border-product-primary rounded-2xl p-6 shadow-lg">
				<div className="text-center sm:text-left">
					<h2 className="text-xl font-bold text-product-foreground flex items-center gap-2">
						<Star className="w-5 h-5 text-product-primary" />
						Upgrade your plan
					</h2>
					<p className="text-product-foreground-accent text-sm mt-1">
						Get more features, higher limits, and premium support.
					</p>
				</div>
				<Button
					className="w-fit min-w-56 bg-product-primary  shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
					onClick={onUpgrade}
					variant="default"
				>
					<Star className="w-4 h-4" />
					Upgrade plan
				</Button>
			</div>

			{/* Main Plan Card */}
			<Card
				className="overflow-hidden border-product-border"
				style={{ boxShadow: "var(--product-shadow)" }}
			>
				<div
					className={`${getPlanColor(pricingPlan.name)} p-6 text-product-foreground`}
				>
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-3">
							{getPlanIcon(pricingPlan.name)}
							<div>
								<CardTitle className="text-2xl font-bold text-product-foreground">
									{pricingPlan.name}
								</CardTitle>
								<p className="text-product-foreground-accent mt-1">
									{pricingPlan.description}
								</p>
							</div>
						</div>
						<Badge className="bg-product-background" variant="default">
							Active
						</Badge>
					</div>
				</div>

				<CardContent className="p-6 bg-product-background">
					<div className="grid md:grid-cols-2 gap-6">
						{/* Pricing Info */}
						<div className="space-y-4">
							<div className="flex items-center space-x-3">
								<DollarSign className="w-5 h-5 text-product-icon" />
								<div>
									<p className="text-sm text-product-foreground-accent">
										Price
									</p>
									<p className="text-2xl font-bold text-product-foreground">
										{!loading ? formatPrice(currentPrice) : 0}
									</p>
								</div>
							</div>

							<div className="flex items-center space-x-3">
								<Calendar className="w-5 h-5 text-product-icon" />
								<div>
									<p className="text-sm text-product-foreground-accent">
										Subscription Cycle
									</p>
									<p className="font-semibold text-product-foreground capitalize">
										{pricingPlan.billing_period}ly
									</p>
								</div>
							</div>
						</div>

						{/* Dates */}
						<div className="space-y-4">
							<div className="flex items-center space-x-3">
								<Clock className="w-5 h-5 text-product-icon" />
								<div>
									<p className="text-sm text-product-foreground-accent">
										Started
									</p>
									<p className="font-semibold text-product-foreground">
										{formatDate(subscriptionStartDate || defaultDate)}
									</p>
								</div>
							</div>

							<div className="flex items-center space-x-3">
								<CheckCircle className="w-5 h-5 text-product-icon" />
								<div>
									<p className="text-sm text-product-foreground-accent">
										Last Updated
									</p>
									<p className="font-semibold text-product-foreground">
										{formatDate(subscriptionUpdatedDate || defaultDate)}
									</p>
								</div>
							</div>
						</div>
					</div>

					{/* Manage subscription */}
					<div className="mt-6 pt-6 border-t border-product-border">
						<div className="flex flex-col sm:flex-row items-center justify-between gap-4">
							<div className="text-center sm:text-left">
								<h3 className="text-lg font-semibold text-product-foreground">
									Manage your subscription
								</h3>
								<p className="text-product-foreground-accent text-sm mt-1">
									Update billing details, check transactions or cancel
									subscription.
								</p>
							</div>
							<Button
								className="w-fit min-w-56"
								disabled={pricingPlan.id === 0}
								onClick={onManageSubscription}
								variant="default"
							>
								<MdOutlineSettings className="w-4 h-4" />
								Manage subscription
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		</>
	);
}
