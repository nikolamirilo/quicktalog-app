import { Card } from "@/components/ui/card";
import { OverallAnalytics as OverallAnalyticsType } from "@/types";
import { FiInfo } from "react-icons/fi";

const OverallAnalytics = ({
	setIsInfoModalOpen,
	setCurrentMetric,
	overallAnalytics,
}: {
	setIsInfoModalOpen: (value: boolean) => void;
	setCurrentMetric: (value: string) => void;
	overallAnalytics: OverallAnalyticsType;
}) => {
	return (
		<div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
			<Card className="p-3 sm:p-4 md:p-6 flex flex-col items-center justify-between bg-product-background border border-product-border shadow-product-shadow hover:shadow-product-hover-shadow transition-all duration-200 animate-fade-in relative">
				<button
					onClick={() => {
						setIsInfoModalOpen(true);
						setCurrentMetric("Total Views");
					}}
					className="absolute top-2 right-2 hover:rounded-full transition-colors duration-200 z-10 hover:text-product-primary"
				>
					<FiInfo size={20} />
				</button>
				<div className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-product-foreground mb-2 text-center">
					Total Views
				</div>
				<div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-product-primary">
					{overallAnalytics.totalPageViews}
				</div>
			</Card>
			<Card className="p-3 sm:p-4 md:p-6 flex flex-col items-center justify-between bg-product-background border border-product-border shadow-product-shadow hover:shadow-product-hover-shadow transition-all duration-200 animate-fade-in relative">
				<button
					onClick={() => {
						setIsInfoModalOpen(true);
						setCurrentMetric("Unique Visitors");
					}}
					className="absolute top-2 right-2 hover:rounded-full transition-colors duration-200 z-10 hover:text-product-primary"
				>
					<FiInfo size={20} />
				</button>
				<div className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-product-foreground mb-2 text-center">
					Unique Visitors
				</div>
				<div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-product-primary">
					{overallAnalytics.totalUniqueVisitors}
				</div>
			</Card>
			<Card className="p-3 sm:p-4 md:p-6 flex flex-col items-center justify-between bg-product-background border border-product-border shadow-product-shadow hover:shadow-product-hover-shadow transition-all duration-200 animate-fade-in relative">
				<button
					onClick={() => {
						setIsInfoModalOpen(true);
						setCurrentMetric("Total Items");
					}}
					className="absolute top-2 right-2 hover:rounded-full transition-colors duration-200 z-10 hover:text-product-primary"
				>
					<FiInfo size={20} />
				</button>
				<div className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-product-foreground mb-2 text-center">
					Total Items
				</div>
				<div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-product-primary">
					{overallAnalytics.totalServiceCatalogues}
				</div>
			</Card>
			<Card className="p-3 sm:p-4 md:p-6 flex flex-col items-center justify-between bg-product-background border border-product-border shadow-product-shadow hover:shadow-product-hover-shadow transition-all duration-200 animate-fade-in relative">
				<button
					onClick={() => {
						setIsInfoModalOpen(true);
						setCurrentMetric("Newsletter");
					}}
					className="absolute top-2 right-2 hover:rounded-full transition-colors duration-200 z-10 hover:text-product-primary"
				>
					<FiInfo size={20} />
				</button>
				<div className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-product-foreground mb-2 text-center">
					Newsletter
				</div>
				<div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-product-primary">
					{overallAnalytics.totalNewsletterSubscriptions}
				</div>
			</Card>
		</div>
	);
};

export default OverallAnalytics;
