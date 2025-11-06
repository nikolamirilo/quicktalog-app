"use client";
// import { Badge } from "../../ui/badge";
// import { Separator } from "../../ui/separator";
import { FiBarChart, FiCalendar, FiTrendingUp, FiUsers } from "react-icons/fi";
import LineChart from "../../charts/LineChart";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../ui/card";
// import { FiGlobe, FiMonitor, FiChrome } from 'react-icons/fi';

import type { AnalyticsProps } from "@/types/components";

const Analytics = ({ data, rawEvents }: AnalyticsProps) => {
	// Total page views
	const totalPageViews = rawEvents.length;
	// Unique Visitors
	const uniqueVisitors = new Set(
		rawEvents.map((e) => e.properties?.distinct_id || e.distinct_id),
	).size;
	// Most popular day
	const mostPopularDay = data.reduce(
		(max, d) => (Number(d.count) > Number(max.count) ? d : max),
		{
			date: "",
			count: 0,
		},
	);
	const avgPageViews =
		data.length > 0 ? (totalPageViews / data.length).toFixed(2) : "0";
	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString("en-US", {
			weekday: "short",
			month: "short",
			day: "numeric",
		});
	};

	return (
		<div className="space-y-8">
			{/* Key Metrics Grid */}
			<div className="grid w-full mx-auto grid-cols-1 md:w-full md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
				<Card className="bg-product-background border-product-border shadow-product-shadow hover:shadow-product-hover-shadow transition-all duration-300 hover:scale-product-hover-scale">
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-product-foreground-accent text-sm font-medium">
									Total Views
								</p>
								<p className="text-3xl font-bold text-product-foreground mt-1">
									{totalPageViews.toLocaleString()}
								</p>
							</div>
							<div className="w-12 h-12 bg-product-primary/10 rounded-full flex items-center justify-center">
								<FiTrendingUp className="w-6 h-6 text-product-icon" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="bg-product-background border-product-border shadow-product-shadow hover:shadow-product-hover-shadow transition-all duration-300 hover:scale-product-hover-scale">
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-product-foreground-accent text-sm font-medium">
									Unique Visitors
								</p>
								<p className="text-3xl font-bold text-product-foreground mt-1">
									{uniqueVisitors.toLocaleString()}
								</p>
							</div>
							<div className="w-12 h-12 bg-product-secondary/10 rounded-full flex items-center justify-center">
								<FiUsers className="w-6 h-6 text-product-icon" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="bg-product-background border-product-border shadow-product-shadow hover:shadow-product-hover-shadow transition-all duration-300 hover:scale-product-hover-scale">
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-product-foreground-accent text-sm font-medium">
									Most Popular Day
								</p>
								<p className="text-lg font-bold text-product-foreground mt-1">
									{mostPopularDay && mostPopularDay.date
										? formatDate(mostPopularDay.date)
										: "-"}
								</p>
								{mostPopularDay && mostPopularDay.count > 0 && (
									<p className="text-xs text-product-foreground-accent mt-1">
										{mostPopularDay.count} views
									</p>
								)}
							</div>
							<div className="w-12 h-12 bg-product-primary-accent/10 rounded-full flex items-center justify-center">
								<FiCalendar className="w-6 h-6 text-product-icon" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="bg-product-background border-product-border shadow-product-shadow hover:shadow-product-hover-shadow transition-all duration-300 hover:scale-product-hover-scale">
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-product-foreground-accent text-sm font-medium">
									Avg. Views/Day
								</p>
								<p className="text-3xl font-bold text-product-foreground mt-1">
									{avgPageViews}
								</p>
							</div>
							<div className="w-12 h-12 bg-product-icon/10 rounded-full flex items-center justify-center">
								<FiBarChart className="w-6 h-6 text-product-icon" />
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Chart Section */}
			<Card className="bg-product-background border-product-border shadow-product-shadow">
				<CardHeader className="pb-6">
					<div className="flex items-center justify-between">
						<div>
							<CardTitle className="text-2xl font-bold text-product-foreground flex items-center gap-3">
								<div className="w-10 h-10 bg-product-primary/10 rounded-xl flex items-center justify-center">
									<FiBarChart className="w-5 h-5 text-product-primary" />
								</div>
								Traffic Overview
							</CardTitle>
							<CardDescription className="text-product-foreground-accent text-base mt-2">
								Track analytics of your digital catalogue
							</CardDescription>
						</div>
						<div className="text-right">
							<p className="text-sm text-product-foreground-accent font-medium">
								Daily page views over time
							</p>
						</div>
					</div>
				</CardHeader>
				<CardContent className="p-6">
					<div className="h-fit">
						<LineChart data={data} />
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

export default Analytics;
