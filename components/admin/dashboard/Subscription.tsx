import { Environments, initializePaddle, Paddle } from "@paddle/paddle-js";
import {
	BarChart3,
	Calendar,
	CheckCircle,
	Clock,
	CreditCard,
	DollarSign,
	Eye,
	Mail,
	Shield,
	Sparkles,
	Star,
	X,
	Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FiCalendar } from "react-icons/fi";
import { MdOutlineSettings } from "react-icons/md";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/helpers/client";
import { usePaddlePrices } from "@/hooks/usePaddelPrices";

import type { SubscriptionProps } from "@/types/components";

export default function Subscription({
	pricingPlan,
	subscriptionStartDate,
	subscriptionUpdatedDate,
}: SubscriptionProps) {
	const [paddle, setPaddle] = useState<Paddle | undefined>(undefined);
	const { prices, loading } = usePaddlePrices(paddle, "US");
	const router = useRouter();

	useEffect(() => {
		if (
			process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN &&
			process.env.NEXT_PUBLIC_PADDLE_ENV
		) {
			initializePaddle({
				token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
				environment: process.env.NEXT_PUBLIC_PADDLE_ENV as Environments,
			}).then((paddle) => {
				if (paddle) {
					setPaddle(paddle);
				}
			});
		}
	}, []);

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
		console.log(name);
		if (
			name?.includes("pro") ||
			name?.includes("premium") ||
			name?.includes("growth") ||
			name?.includes("custom")
		)
			return "bg-product-primary";
		if (name?.includes("enterprise")) return "bg-product-secondary";
		if (name?.includes("starter")) return "bg-product-primary-accent";
		return "bg-product-primary";
	};

	const getFeatureIcon = (key: string) => {
		const iconMap: { [key: string]: any } = {
			support: Mail,
			catalogues: BarChart3,
			newsletter: Mail,
			ocr_ai_import: Sparkles,
			traffic_limit: Eye,
			custom_features: Star,
			analytics: BarChart3,
			ai_prompts: Sparkles,
		};
		return iconMap[key] || CheckCircle;
	};

	const formatFeatureKey = (key: string) => {
		return key
			.split("_")
			.map((word) => {
				const upperWord = word.toUpperCase();
				if (upperWord === "AI" || upperWord === "OCR") {
					return upperWord;
				}
				return word.charAt(0).toUpperCase() + word.slice(1);
			})
			.join(" ");
	};

	const formatFeatureValue = (key: string, value: any) => {
		if (value === null || value === 0) return "Not included";
		if (typeof value === "boolean") return value ? "Included" : "Not included";
		if (typeof value === "number") {
			if (key === "traffic_limit")
				return `${value.toLocaleString()} visits/month`;
			if (key === "catalogues")
				return `${value} catalogue${value !== 1 ? "s" : ""}`;
			if (key === "ocr_ai_import")
				return `${value} OCR AI import${value !== 1 ? "s" : ""}`;
			if (key === "ai_prompts")
				return `${value} AI generation${value !== 1 ? "s" : ""}`;
			return value.toString();
		}
		return String(value);
	};

	const isFeatureIncluded = (value: any) => {
		if (value === null || value === false || value === 0) return false;
		if (typeof value === "boolean") return value;
		if (typeof value === "number") return value > 0;
		if (typeof value === "string")
			return value.toLowerCase() !== "not included";
		return true;
	};

	// Get current price from Paddle
	const currentPrice = pricingPlan.priceId
		? prices[pricingPlan.priceId[pricingPlan.billing_period]]
		: "0";
	console.log(currentPrice);

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
						<Button className="bg-product-primary text-product-foreground hover:bg-product-primary-accent">
							View Available Plans
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="max-w-5xl space-y-6">
			<h2 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold mb-4 sm:mb-6 text-product-foreground flex items-center gap-2 sm:gap-3 font-heading">
				<FiCalendar className="text-product-icon font-lora w-6 h-6 sm:w-8 sm:h-8" />{" "}
				Subscription Overview
			</h2>

			{/* Upgrade plan - moved to top and made to pop */}
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
					className="w-fit min-w-56 bg-product-primary hover:bg-product-primary-accent shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
					onClick={() => router.push("/pricing")}
					variant="default"
				>
					<Star className="w-4 h-4" />
					Upgrade plan
				</Button>
			</div>

			{/* Main Plan Card with merged manage subscription */}
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

					{/* Manage subscription merged into the main card */}
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
								onClick={() =>
									router.push(
										"https://customer-portal.paddle.com/cpl_01k11h2axbrhg4fzmw2zey50x0",
									)
								}
								variant="default"
							>
								<MdOutlineSettings className="w-4 h-4" />
								Manage subscription
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Features Card */}
			<Card className="bg-product-background shadow-product-shadow">
				<CardHeader className="pb-4">
					<CardTitle className="text-xl font-bold flex items-center gap-2   text-product-foreground">
						<Star className="w-5 h-5 text-product-icon" />
						Plan Features
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid md:grid-cols-2 gap-4">
						{Object.entries(pricingPlan.features)
							.sort(([_, aValue], [__, bValue]) => {
								// Sort so included features come first
								const aIncluded = isFeatureIncluded(aValue) ? 0 : 1;
								const bIncluded = isFeatureIncluded(bValue) ? 0 : 1;
								return aIncluded - bIncluded;
							})
							.map(([key, value]) => {
								const IconComponent = getFeatureIcon(key);
								const included = isFeatureIncluded(value);
								return (
									<div
										className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
											included
												? "bg-product-background border border-product-primary"
												: "bg-product-background border border-product-border"
										}`}
										key={key}
									>
										{included ? (
											<CheckCircle className="w-5 h-5 text-product-primary flex-shrink-0" />
										) : (
											<X className="w-5 h-5 text-product-foreground-accent flex-shrink-0" />
										)}
										<IconComponent className="w-4 h-4 text-product-icon flex-shrink-0" />
										<div className="flex-1">
											<p className="font-medium text-product-foreground">
												{formatFeatureKey(key)}
											</p>
											<p
												className={`text-sm ${
													included
														? "text-product-primary-foreground"
														: "text-product-foreground-accent"
												}`}
											>
												{formatFeatureValue(key, value)}
											</p>
										</div>
									</div>
								);
							})}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
