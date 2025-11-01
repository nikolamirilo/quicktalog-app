"use client";
import Link from "next/link";
import { FiFileText } from "react-icons/fi";
import { IoSettingsOutline } from "react-icons/io5";
import { LuSquareMenu } from "react-icons/lu";
import { MdOutlineReportGmailerrorred } from "react-icons/md";
import { TbBrandGoogleAnalytics } from "react-icons/tb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ItemDropdownMenu from "./ItemDropdownMenu";

const DashboardItem = ({
	catalogue,
	duplicatingId,
	handleUpdateItemStatus,
	setIsLinkCopied,
	isLinkCopied,
	isModalOpen,
	handleDuplicateCatalogue,
	handleDeleteItem,
	usage,
	matchedTier,
	statusColors,
	sourceConfig,
}) => {
	return (
		<Card
			className="p-2 md:p-5 flex flex-col gap-2 sm:gap-3 lg:gap-4 relative bg-product-background border border-product-border shadow-product-shadow hover:shadow-product-hover-shadow hover:scale-[1.02] transition-all duration-200 animate-fade-in"
			key={catalogue.id}
		>
			<ItemDropdownMenu
				catalogue={catalogue}
				disabled={!["active", "inactive", "draft"].includes(catalogue.status)}
				duplicatingId={duplicatingId}
				handleDeleteItem={handleDeleteItem}
				handleDuplicateCatalogue={handleDuplicateCatalogue}
				handleUpdateItemStatus={handleUpdateItemStatus}
				isLinkCopied={isLinkCopied}
				isModalOpen={isModalOpen}
				matchedTier={matchedTier}
				planId={matchedTier?.id || 0}
				setIsLinkCopied={setIsLinkCopied}
				usage={usage}
			/>

			<div className="font-heading font-bold text-sm sm:text-base md:text-lg lg:text-xl text-product-foreground break-words">
				{catalogue.name}
			</div>

			<div className="flex flex-row gap-2 items-center">
				<Badge
					className={`${statusColors[catalogue.status] || "bg-gray-100 text-gray-700"} w-fit rounded text-xs`}
				>
					{catalogue.status.toUpperCase()}
				</Badge>

				{(() => {
					const source = sourceConfig[catalogue.source] || {
						label: catalogue.source,
						className: "bg-gray-100 text-gray-700",
						Icon: FiFileText,
					};
					const { label, className, Icon } = source;
					return (
						<span
							className={`${className} flex items-center gap-1 w-fit rounded px-2 py-0.5 text-xs font-medium`}
						>
							<Icon className="w-3.5 h-3.5" />
							{label}
						</span>
					);
				})()}
			</div>

			<div className="text-product-foreground-accent text-xs 2xl:text-sm break-words">
				Updated:{" "}
				{new Date(catalogue.updated_at).toLocaleString("en-US", {
					year: "numeric",
					month: "numeric",
					day: "numeric",
					hour: "2-digit",
					minute: "2-digit",
				})}
			</div>
			<div className="text-product-foreground-accent text-xs 2xl:text-sm break-words">
				Created:{" "}
				{new Date(catalogue.created_at).toLocaleString("en-US", {
					year: "numeric",
					month: "numeric",
					day: "numeric",
					hour: "2-digit",
					minute: "2-digit",
				})}
			</div>
			{["active", "inactive", "draft"].includes(catalogue.status) && (
				<div className="flex flex-col gap-2 sm:gap-3 mt-auto pt-2 sm:pt-3 md:pt-4">
					<Button className="w-full">
						<Link
							className="flex flex-row items-center justify-center gap-1"
							href={`/catalogues/${catalogue.name}`}
						>
							<LuSquareMenu className="sm:w-3 sm:h-3 md:w-4 md:h-4" size={12} />
							<span className="ml-1">View Catalogue</span>
						</Link>
					</Button>
					<Button className="w-ful" variant="outline">
						<Link
							className="flex flex-row items-center justify-center gap-1"
							href={`/admin/items/${catalogue.name}/analytics`}
						>
							<TbBrandGoogleAnalytics
								className="sm:w-3 sm:h-3 md:w-4 md:h-4"
								size={12}
							/>
							<span className="ml-1">Analytics</span>
						</Link>
					</Button>
				</div>
			)}
			{["error", "in preparation"].includes(catalogue.status) && (
				<div
					className={`mt-3 flex items-start gap-2 rounded-lg border p-3 text-sm leading-relaxed
      ${
				catalogue.status === "error"
					? "border-red-200 bg-red-50 text-red-700"
					: "border-blue-200 bg-blue-50 text-blue-700"
			}`}
				>
					<div className="flex-shrink-0 mt-0.5">
						{catalogue.status === "error" ? (
							<MdOutlineReportGmailerrorred
								className="text-red-500"
								size={25}
							/>
						) : (
							<IoSettingsOutline
								className="animate-[spin_2s_linear_infinite] text-blue-500"
								size={22}
							/>
						)}
					</div>

					<div>
						{catalogue.status === "error" ? (
							<>Error occured. Please delete the catalogue and retry.</>
						) : (
							<>
								{catalogue.source === "ai_prompt"
									? "AI generation of catalogue in progress"
									: "OCR import of catalogue in progress"}
							</>
						)}
					</div>
				</div>
			)}
		</Card>
	);
};

export default DashboardItem;
