// components/admin/dashboard/Dashboard.tsx
"use client";
import { lazy, Suspense, useState } from "react";
import JoinOurCommunity from "@/components/common/JoinOurCommunity";
import Loader from "@/components/navigation/Loader";
import { useDashboardData } from "@/hooks/useDashboardData";
import { DashboardProps } from "@/types/components";
import Overview from "./Overview";

const Subscription = lazy(() => import("./Subscription"));
const MonthlyUsage = lazy(() => import("./MonthlyUsage"));
const Settings = lazy(() => import("./Settings"));
const Support = lazy(() => import("./Support"));
const MobileTabBar = lazy(() => import("@/components/navigation/MobileTabBar"));
const SidebarContent = lazy(
	() => import("@/components/navigation/SidebarContent"),
);

// Updated interface without required catalogues and overallAnalytics
interface ImprovedDashboardProps {
	user: DashboardProps["user"];
	usage: DashboardProps["usage"];
	pricingPlan: DashboardProps["pricingPlan"];
}

export default function Dashboard({
	user,
	usage,
	pricingPlan,
}: ImprovedDashboardProps) {
	const [activeTab, setActiveTab] = useState("overview");

	// Fetch data only when needed based on active tab
	const { analytics, catalogues, loadingStates, refreshAll } =
		useDashboardData(activeTab);

	function getSidebarButtonClass(isActive: boolean) {
		return isActive
			? "font-bold !bg-product-hover-background !text-navbar-button-active !border !border-product-primary shadow-sm hover:scale-[1.03] hover:transform"
			: "font-medium";
	}

	return (
		<>
			<script
				async
				defer
				id="hs-script-loader"
				src="//js-eu1.hs-scripts.com/146895463.js"
				type="text/javascript"
			></script>

			<div className="w-full min-h-screen px-4 sm:px-4 relative md:px-6 lg:px-8 pt-32 pb-12 bg-gradient-to-br from-product-background to-hero-product-background animate-fade-in">
				<div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 md:gap-6 lg:gap-8">
					{/* Sidebar tabs (hidden on mobile) */}
					<Suspense
						fallback={
							<div className="w-64 h-96 bg-gray-100 animate-pulse rounded-lg" />
						}
					>
						<SidebarContent
							activeTab={activeTab}
							getSidebarButtonClass={getSidebarButtonClass}
							setActiveTab={setActiveTab}
						/>
					</Suspense>

					{/* Main Content Section */}
					<section className="flex-1 min-w-0 bg-product-background/95 border border-product-border shadow-md rounded-3xl p-3 sm:p-4 md:p-6 lg:p-8 xl:p-10 relative z-10 text-xs sm:text-sm md:text-base lg:text-lg">
						{/* Mobile tab bar */}
						<Suspense fallback={null}>
							<MobileTabBar activeTab={activeTab} setActiveTab={setActiveTab} />
						</Suspense>

						{activeTab === "overview" ? (
							<>
								{loadingStates.analytics || loadingStates.analytics ? (
									<div className="text-center py-8">
										<Loader type="dashboard" />
									</div>
								) : (
									<section className="animate-fade-in">
										<JoinOurCommunity />
										<Overview
											catalogues={catalogues || []}
											overallAnalytics={{
												...analytics,
												totalServiceCatalogues: catalogues?.length || 0,
											}}
											planId={pricingPlan.id}
											refreshAll={refreshAll}
											usage={usage}
											user={user}
										/>
									</section>
								)}
							</>
						) : null}

						<Suspense
							fallback={
								<div className="text-center py-4">
									<Loader type="dashboard" />
								</div>
							}
						>
							{activeTab === "subscription" ? (
								<section className="animate-fade-in">
									<Subscription pricingPlan={pricingPlan} />
								</section>
							) : null}

							{activeTab === "usage" ? (
								<section className="animate-fade-in">
									<MonthlyUsage data={usage} pricingPlan={pricingPlan} />
								</section>
							) : null}

							{activeTab === "settings" ? (
								<section className="animate-fade-in">
									<Settings />
								</section>
							) : null}

							{activeTab === "support" ? (
								<section className="animate-fade-in">
									<Support />
								</section>
							) : null}
						</Suspense>
					</section>
				</div>
			</div>
		</>
	);
}
