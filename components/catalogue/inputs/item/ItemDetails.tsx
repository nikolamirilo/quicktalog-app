"use client";
import LimitsModal from "@/components/modals/LimitsModal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { useAiAssist } from "@/hooks/useAiAssist";
import { writeItemDescription } from "@/server_actions/ai";
import { Item } from "@quicktalog/common";
import { Loader2, Sparkles } from "lucide-react";

export interface ItemDetailsProps {
	value: Item;
	onChange: (value: Item) => void;
	categoryName?: string;
}

const ItemDetails = ({ value, onChange, categoryName }: ItemDetailsProps) => {
	const { catalogue } = useCatalogueContext() || {};
	const {
		run,
		loading,
		error,
		showLimits,
		setShowLimits,
		currentPlan,
		requiredPlan,
	} = useAiAssist();

	const canGenerate = Boolean(catalogue?.name && value.name.trim());
	const enhance = Boolean(value.description.trim());

	const handleGenerate = async () => {
		if (!catalogue?.name) return;
		const description = await run(() =>
			writeItemDescription(catalogue.name, {
				itemName: value.name,
				categoryName,
				businessType: catalogue.businessType,
				language: catalogue.language,
				existing: value.description,
			}),
		);
		if (description) onChange({ ...value, description });
	};

	return (
		<>
			{/* Item Name */}
			<div className="space-y-2">
				<Label htmlFor="item-name">
					Item Name <span className="text-red-500">*</span>
				</Label>
				<Input
					id="item-name"
					onChange={(e) => onChange({ ...value, name: e.target.value })}
					placeholder="e.g. Pancakes"
					value={value.name}
				/>
			</div>

			{/* Item Description */}
			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<Label htmlFor="item-description">Item Description</Label>
					<button
						className="inline-flex items-center gap-1.5 text-xs font-medium text-product-primary hover:text-product-primary/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
						disabled={!canGenerate || loading}
						onClick={handleGenerate}
						title={canGenerate ? undefined : "Add an item name first to use AI"}
						type="button"
					>
						{loading ? (
							<Loader2 className="w-3.5 h-3.5 animate-spin" />
						) : (
							<Sparkles className="w-3.5 h-3.5" />
						)}
						{enhance ? "Enhance with AI" : "Generate with AI"}
					</button>
				</div>
				<Textarea
					className="resize-none min-h-[100px]"
					id="item-description"
					onChange={(e) => onChange({ ...value, description: e.target.value })}
					placeholder="e.g. Pancakes with Nutella, cherries, and ice cream"
					value={value.description}
				/>
				{error && <p className="text-xs text-red-500">{error}</p>}
			</div>

			<LimitsModal
				currentPlan={currentPlan}
				isOpen={showLimits}
				onClose={() => setShowLimits(false)}
				requiredPlan={requiredPlan}
				type="ai"
			/>
		</>
	);
};

export default ItemDetails;
