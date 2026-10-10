"use client";
import { writeItemDescription } from "@/actions/ai";
import { LimitsModal } from "@/components/modals/LimitsModal";
import {
	builderFieldClass,
	builderTextareaClass,
} from "@/components/catalogue/modals/content/BuilderDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { useAiAssist } from "@/hooks/useAiAssist";
import { Item } from "@quicktalog/common";
import { cn } from "@/lib/ui/cn";
import { Loader2, Sparkles } from "lucide-react";

interface ItemDetailsProps {
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
			<div className="space-y-1.5">
				<Label htmlFor="item-name">
					Name{" "}
					<span aria-hidden="true" className="text-product-error">
						*
					</span>
				</Label>
				<Input
					className={builderFieldClass}
					id="item-name"
					onChange={(e) => onChange({ ...value, name: e.target.value })}
					placeholder="e.g. Pancakes"
					required
					value={value.name}
				/>
			</div>

			<div className="space-y-1.5">
				<div className="flex items-center justify-between">
					<Label htmlFor="item-description">Description</Label>
					<button
						className="-mr-2 inline-flex min-h-7 items-center gap-1.5 rounded-full px-2 text-xs font-semibold text-product-primary-ink transition-colors hover:bg-product-primary-soft active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
						disabled={!canGenerate || loading}
						onClick={handleGenerate}
						title={canGenerate ? undefined : "Add an item name first to use AI"}
						type="button"
					>
						{loading ? (
							<Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
						) : (
							<Sparkles aria-hidden="true" className="size-3.5" />
						)}
						{enhance ? "Enhance with AI" : "Generate with AI"}
					</button>
				</div>
				<Textarea
					className={cn(builderTextareaClass, "min-h-[84px] resize-none")}
					id="item-description"
					onChange={(e) => onChange({ ...value, description: e.target.value })}
					placeholder="e.g. Pancakes with Nutella, cherries, and ice cream"
					value={value.description}
				/>
				{error && (
					<p className="text-xs text-product-error" role="alert">
						{error}
					</p>
				)}
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
