import {
	BarChart3,
	Check,
	Clock,
	PieChart,
	TrendingUp,
	Zap,
} from "lucide-react";

import { BenefitFeature } from "@/components/home/Benefits/BenefitFeature";
import {
	type BenefitData,
	BenefitSection,
} from "@/components/home/Benefits/BenefitSection";

const ideaToLive: BenefitData = {
	title: "Go from Idea to Live in Minutes",
	description:
		"You don't have time for complicated software. Our platform is designed for speed. Create a beautiful, professional catalog in less time than it takes to make a cup of coffee.",
	bullets: [
		{
			icon: Check,
			title: "No Learning Curve",
			description:
				"Our intuitive editor is so simple, you'll feel like a pro in minutes.",
		},
		{
			icon: Clock,
			title: "Instant Updates",
			description:
				"Change prices, add new services, or run a promotion in seconds. Your catalog is always up-to-date.",
		},
		{
			icon: Zap,
			title: "AI-Powered Creation",
			description:
				"Let our AI build your entire catalog for you. Just describe your business and watch the magic happen.",
		},
	],
	image: {
		src: "/images/marketing/benefit-idea-live.svg",
		width: 384,
		height: 318,
	},
	animation: "idea-live",
	restFrame: 215,
};

const growth: BenefitData = {
	title: "Grow Your Business, Not Your Workload",
	description:
		"Our platform is designed to help you grow your business, without adding to your to-do list. Track your performance, understand your customers, and make smarter decisions.",
	bullets: [
		{
			icon: BarChart3,
			title: "Real-Time Analytics",
			description:
				"See what's popular, what's not, and what your customers are looking for.",
		},
		{
			icon: PieChart,
			title: "Customer Insights",
			description:
				"Understand your customers better and make data-driven decisions to grow your business.",
		},
		{
			icon: TrendingUp,
			title: "Scale with Confidence",
			description:
				"Our secure and reliable platform grows with you, so you can focus on what you do best.",
		},
	],
	image: {
		src: "/images/marketing/benefit-growth.svg",
		width: 384,
		height: 260,
	},
	animation: "growth",
	restFrame: 200,
};

export function Benefits() {
	return (
		<div id="features">
			<h2 className="sr-only">Features</h2>
			<BenefitSection benefit={ideaToLive} />
			<BenefitFeature />
			<BenefitSection benefit={growth} />
		</div>
	);
}
