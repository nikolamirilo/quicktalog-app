"use client";
import InputModal from "@/components/modals/InputModal";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { handleDownloadHTML } from "@/helpers/client";
import { useCatalogueName } from "@/hooks/useCatalogueName";
import { Catalogue, PricingPlan, Usage } from "@quicktalog/common";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { BsQrCodeScan } from "react-icons/bs";
import { FaRegCircleCheck } from "react-icons/fa6";
import { FiCopy, FiEdit, FiMoreVertical, FiTrash2 } from "react-icons/fi";
import { ImEmbed2 } from "react-icons/im";
import { LuShare2 } from "react-icons/lu";
import { VscActivateBreakpoints } from "react-icons/vsc";

type ItemDropdownMenuProps = {
	catalogue: Catalogue;
	duplicatingId: string;
	handleUpdateItemStatus: any;
	setIsLinkCopied: any;
	isLinkCopied: any;
	isModalOpen: boolean;
	handleDuplicateCatalogue: any;
	handleDeleteItem: any;
	usage: Usage;
	matchedTier: PricingPlan;
	planId: number;
	disabled: boolean;
};

type MenuItem = {
	key: string;
	icon: React.ReactNode;
	label: string;
	disabled: boolean;
	onClick: (e: React.MouseEvent) => void;
	className?: string;
};

const ITEM_BASE_CLASS =
	"text-product-foreground hover:bg-product-background-hover cursor-pointer";

const ItemDropdownMenu = ({
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
	disabled,
}: ItemDropdownMenuProps) => {
	const router = useRouter();

	const [formData, setFormData] = useState({ name: "" });
	const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
	const [errors, setErrors] = useState<{ [key: string]: string }>({});
	const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

	const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
	const isRecentlyCreated = catalogue.createdAt > tenMinutesAgo.toISOString();
	const isDuplicating = duplicatingId === catalogue.id;
	const atTrafficLimit =
		usage.traffic.pageview_count >= matchedTier.features.traffic_limit;
	const atCatalogueLimit = usage.catalogues >= matchedTier.features.catalogues;
	const isActive = catalogue.status === "active";

	const { handleNameChange, refetchNames } = useCatalogueName({
		initialName: formData.name,
		type: "create",
		setFormData,
		setErrors,
		setTouched,
	});

	const menuItems: MenuItem[] = [
		{
			key: "edit",
			icon: <FiEdit size={18} />,
			label: "Edit",
			disabled,
			onClick: () => router.push(`/admin/${catalogue.name}/builder`),
			className: ITEM_BASE_CLASS,
		},
		{
			key: "status",
			icon: <VscActivateBreakpoints size={18} />,
			label: isDuplicating
				? "Loading..."
				: isActive
					? "Deactivate"
					: "Activate",
			disabled: isDuplicating || disabled || (atTrafficLimit && !isActive),
			onClick: () =>
				handleUpdateItemStatus(
					catalogue.id,
					isActive ? "inactive" : "active",
					catalogue.name,
				),
			className: ITEM_BASE_CLASS,
		},
		{
			key: "share",
			icon: isLinkCopied ? (
				<FaRegCircleCheck color="green" size={18} />
			) : (
				<LuShare2 size={18} />
			),
			label: isLinkCopied ? "Link Copied" : "Share",
			disabled,
			onClick: (e) => {
				e.preventDefault();
				setIsLinkCopied(true);
				navigator.clipboard.writeText(
					`${process.env.NEXT_PUBLIC_BASE_URL}/catalogues/${catalogue.name}`,
				);
				setTimeout(() => setIsLinkCopied(false), 3000);
			},
			className: ITEM_BASE_CLASS,
		},
		{
			key: "qr",
			icon: <BsQrCodeScan size={18} />,
			label: "QR Code",
			disabled,
			onClick: () => router.push(`/admin/${catalogue.name}/qr-editor`),
			className: ITEM_BASE_CLASS,
		},
		{
			key: "embed",
			icon: <ImEmbed2 size={18} />,
			label: "Embed",
			disabled,
			onClick: () =>
				handleDownloadHTML(
					catalogue.name,
					`${process.env.NEXT_PUBLIC_BASE_URL}/catalogues/${catalogue.name}`,
				),
			className: ITEM_BASE_CLASS,
		},
		{
			key: "duplicate",
			icon: <FiCopy size={18} />,
			label: isDuplicating ? "Loading..." : "Duplicate",
			disabled: atCatalogueLimit || disabled || isDuplicating,
			onClick: () => {
				setFormData({ name: "" });
				setErrors({});
				setTouched({});
				refetchNames();
				setIsDuplicateModalOpen(true);
			},
			className: ITEM_BASE_CLASS,
		},
		{
			key: "delete",
			icon: <FiTrash2 size={18} />,
			label: "Delete",
			disabled:
				isModalOpen ||
				(catalogue.status === "in preparation" && isRecentlyCreated),
			onClick: () => handleDeleteItem(catalogue.name),
			className: "text-red-400 hover:bg-red-50 cursor-pointer",
		},
	];

	if (isDuplicateModalOpen) {
		return (
			<InputModal
				description="Please provide a name for the catalogue"
				errors={errors}
				isOpen={isDuplicateModalOpen}
				name={formData.name}
				onCancel={() => setIsDuplicateModalOpen(false)}
				onChange={handleNameChange}
				onConfirm={() => handleDuplicateCatalogue(catalogue.id, formData.name)}
				title="Duplicate Catalogue"
				touched={touched}
			/>
		);
	}

	return (
		<div className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 z-10">
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 p-0 text-product-foreground hover:text-product-primary hover:bg-product-background/50 transition-colors duration-200"
						size="sm"
						variant="ghost"
					>
						<FiMoreVertical
							className="sm:w-4 sm:h-4 md:w-[18px] md:h-[18px]"
							size={14}
						/>
					</Button>
				</DropdownMenuTrigger>

				<DropdownMenuContent
					align="end"
					className="bg-product-background border border-product-border rounded-xl shadow-lg"
				>
					{menuItems.map(
						({ key, icon, label, disabled: dis, onClick, className }) => (
							<DropdownMenuItem
								className={className}
								disabled={dis}
								key={key}
								onClick={onClick}
							>
								<span className="flex items-center gap-2">
									{icon}
									{label}
								</span>
							</DropdownMenuItem>
						),
					)}
				</DropdownMenuContent>
			</DropdownMenu>

			{/* Hidden QR for download/embed */}
			<div
				className="p-2 sm:p-3 bg-white rounded-xl shadow-sm border border-product-border hidden"
				id="qr-code"
			>
				<QRCodeSVG
					bgColor="white"
					className="w-24 h-24 sm:w-30 sm:h-30 md:w-36 md:h-36"
					fgColor="black"
					size={100}
					value={`${process.env.NEXT_PUBLIC_BASE_URL}/catalogues/${catalogue.name}`}
				/>
			</div>
		</div>
	);
};

export default ItemDropdownMenu;
