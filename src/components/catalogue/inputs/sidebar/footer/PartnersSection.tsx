import { Catalogue, Partner } from "@quicktalog/common";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useId, useState } from "react";
import { PanelSection } from "@/components/catalogue/inputs/sidebar/panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { extractDomain } from "@/lib/http/domain";

const MAX_PARTNERS = 3;

interface PartnersSectionProps {
	catalogue: Catalogue;
	updateCatalogue: (partial: Partial<Catalogue>) => void;
	handleChange: (field: string, value: any) => void;
}

/** Name, link and description fields for one partner, with its own buttons. */
const PartnerForm = ({
	value,
	onChange,
	onSubmit,
	onCancel,
	submitLabel,
}: {
	value: Partner;
	onChange: (value: Partner) => void;
	onSubmit: () => void;
	onCancel: () => void;
	submitLabel: string;
}) => {
	const id = useId();
	return (
		<form
			className="space-y-3 rounded-2xl border border-product-border bg-product-background p-3"
			onSubmit={(e) => {
				e.preventDefault();
				onSubmit();
			}}
		>
			<div className="space-y-2">
				<Label htmlFor={`${id}-name`}>Partner name</Label>
				<Input
					id={`${id}-name`}
					onChange={(e) => onChange({ ...value, name: e.target.value })}
					placeholder="e.g. Local Roasters"
					value={value.name}
				/>
			</div>
			<div className="space-y-2">
				<Label htmlFor={`${id}-url`}>Link</Label>
				<Input
					id={`${id}-url`}
					inputMode="url"
					onChange={(e) => onChange({ ...value, url: e.target.value })}
					placeholder="e.g. https://partner.com"
					value={value.url || ""}
				/>
			</div>
			<div className="space-y-2">
				<Label htmlFor={`${id}-description`}>Description</Label>
				<Input
					id={`${id}-description`}
					onChange={(e) => onChange({ ...value, description: e.target.value })}
					placeholder="e.g. Our coffee supplier"
					value={value.description}
				/>
			</div>
			<div className="flex gap-2 pt-1">
				<Button
					className="flex-1"
					disabled={!value.name.trim()}
					size="sm"
					type="submit"
				>
					{submitLabel}
				</Button>
				<Button onClick={onCancel} size="sm" type="button" variant="ghost">
					Cancel
				</Button>
			</div>
		</form>
	);
};

const PartnersSection = ({
	catalogue,
	updateCatalogue,
	handleChange,
}: PartnersSectionProps) => {
	const [newPartner, setNewPartner] = useState<Partner>({
		name: "",
		url: "",
		description: "",
	});
	const [isAddingPartner, setIsAddingPartner] = useState(false);
	const [editingPartnerIndex, setEditingPartnerIndex] = useState<number | null>(
		null,
	);
	const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
	const partners = catalogue.partners || [];

	const addPartner = () => {
		if (!newPartner.name.trim()) return;
		if (partners.length >= MAX_PARTNERS) return;
		updateCatalogue({ partners: [...partners, newPartner] });
		setNewPartner({ name: "", url: "", description: "" });
		setIsAddingPartner(false);
	};

	const startEditingPartner = (index: number) => {
		setEditingPartnerIndex(index);
		setEditingPartner(partners[index]);
	};

	const savePartner = () => {
		if (!editingPartner || !editingPartner.name.trim()) return;
		if (editingPartnerIndex === null) return;
		const updatedPartners = [...partners];
		updatedPartners[editingPartnerIndex] = editingPartner;
		updateCatalogue({ partners: updatedPartners });
		setEditingPartnerIndex(null);
		setEditingPartner(null);
	};

	const removePartner = (index: number) => {
		const updatedPartners = [...partners];
		updatedPartners.splice(index, 1);
		updateCatalogue({ partners: updatedPartners });
	};

	const showPartners = catalogue.footer?.showPartners || false;

	return (
		<PanelSection
			action={
				<Switch
					aria-label="Show partners"
					checked={showPartners}
					onCheckedChange={(checked) =>
						handleChange("footer.showPartners", checked)
					}
				/>
			}
			info="Show trusted partners in the footer."
			title="Partners"
		>
			{showPartners && (
				<div className="space-y-3">
					{partners.length > 0 && (
						<ul className="space-y-2">
							{partners.map((partner, index) =>
								editingPartnerIndex === index && editingPartner ? (
									<li key={index}>
										<PartnerForm
											onCancel={() => setEditingPartnerIndex(null)}
											onChange={setEditingPartner}
											onSubmit={savePartner}
											submitLabel="Save"
											value={editingPartner}
										/>
									</li>
								) : (
									<li
										className="flex items-center gap-3 rounded-2xl border border-product-border bg-product-card py-1.5 pl-3 pr-1"
										key={index}
									>
										<span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-product-background-hero text-sm font-bold text-product-foreground-accent">
											{partner.url ? (
												<img
													alt=""
													className="h-6 w-6 object-cover"
													src={`https://img.logo.dev/${extractDomain(partner.url)}?token=${process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN}`}
												/>
											) : (
												partner.name.charAt(0)
											)}
										</span>
										<span className="w-0 min-w-0 flex-1">
											<span className="block truncate text-sm font-semibold text-product-foreground">
												{partner.name}
											</span>
											{(partner.description || partner.url) && (
												<span className="block truncate text-[12.5px] text-product-muted">
													{partner.description || partner.url}
												</span>
											)}
										</span>
										<Button
											aria-label={`Edit ${partner.name}`}
											className="h-11 w-11 shrink-0"
											onClick={() => startEditingPartner(index)}
											size="icon"
											type="button"
											variant="ghost"
										>
											<Pencil aria-hidden="true" className="h-4 w-4" />
										</Button>
										<Button
											aria-label={`Remove ${partner.name}`}
											className="h-11 w-11 shrink-0 text-product-error hover:bg-product-error-soft hover:text-product-error-ink"
											onClick={() => removePartner(index)}
											size="icon"
											type="button"
											variant="ghost"
										>
											<Trash2 aria-hidden="true" className="h-4 w-4" />
										</Button>
									</li>
								),
							)}
						</ul>
					)}

					{partners.length < MAX_PARTNERS ? (
						isAddingPartner ? (
							<PartnerForm
								onCancel={() => setIsAddingPartner(false)}
								onChange={setNewPartner}
								onSubmit={addPartner}
								submitLabel="Add partner"
								value={newPartner}
							/>
						) : (
							<Button
								className="w-full"
								onClick={() => setIsAddingPartner(true)}
								type="button"
								variant="outline"
							>
								<Plus aria-hidden="true" className="h-4 w-4" /> Add partner
							</Button>
						)
					) : (
						<p className="text-[13px] text-product-muted">
							Maximum of {MAX_PARTNERS} partners reached.
						</p>
					)}
				</div>
			)}
		</PanelSection>
	);
};

export default PartnersSection;
