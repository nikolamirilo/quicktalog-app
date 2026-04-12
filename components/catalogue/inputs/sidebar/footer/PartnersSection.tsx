import PartnerBadge from "@/components/general/PartnerBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Catalogue, Partner } from "@quicktalog/common";
import { Info, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

const MAX_PARTNERS = 3;

interface PartnersSectionProps {
	catalogue: Catalogue;
	updateCatalogue: (partial: Partial<Catalogue>) => void;
	handleChange: (field: string, value: any) => void;
}

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

	const addPartner = () => {
		if (!newPartner.name.trim()) return;
		if ((catalogue.partners || []).length >= MAX_PARTNERS) return;
		const updatedPartners = [...(catalogue.partners || []), newPartner];
		updateCatalogue({
			partners: updatedPartners,
		});
		setNewPartner({ name: "", url: "", description: "" });
		setIsAddingPartner(false);
	};

	const startEditingPartner = (index: number) => {
		setEditingPartnerIndex(index);
		setEditingPartner(catalogue.partners![index]);
	};

	const savePartner = () => {
		if (!editingPartner || !editingPartner.name.trim()) return;
		const updatedPartners = [...(catalogue.partners || [])];
		updatedPartners[editingPartnerIndex!] = editingPartner;
		updateCatalogue({
			partners: updatedPartners,
		});
		setEditingPartnerIndex(null);
		setEditingPartner(null);
	};

	const removePartner = (index: number) => {
		const updatedPartners = [...(catalogue.partners || [])];
		updatedPartners.splice(index, 1);
		updateCatalogue({
			partners: updatedPartners,
		});
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<h3 className="text-lg font-bold">Partners</h3>
					<Popover>
						<PopoverTrigger className="inline-flex mt-1" type="button">
							<Info className="h-4 w-4 text-muted-foreground" />
						</PopoverTrigger>
						<PopoverContent
							className="z-[2000] w-[200px] p-3 text-sm"
							side="top"
						>
							<p>Show trusted partners in the footer.</p>
						</PopoverContent>
					</Popover>
				</div>
				<Switch
					checked={catalogue.footer?.showPartners || false}
					onCheckedChange={(checked) =>
						handleChange("footer.showPartners", checked)
					}
				/>
			</div>

			{catalogue.footer?.showPartners && (
				<div className="space-y-4">
					{catalogue.partners?.map((partner, index) => (
						<div className="flex gap-2 items-center" key={index}>
							{editingPartnerIndex === index ? (
								<div className="flex-1 space-y-3">
									<Input
										onChange={(e) =>
											setEditingPartner((prev) =>
												prev ? { ...prev, name: e.target.value } : null,
											)
										}
										placeholder="Partner Name"
										value={editingPartner?.name || ""}
									/>
									<Input
										onChange={(e) =>
											setEditingPartner((prev) =>
												prev ? { ...prev, url: e.target.value } : null,
											)
										}
										placeholder="Partner URL"
										value={editingPartner?.url || ""}
									/>
									<Input
										onChange={(e) =>
											setEditingPartner((prev) =>
												prev ? { ...prev, description: e.target.value } : null,
											)
										}
										placeholder="Partner Description"
										value={editingPartner?.description || ""}
									/>
									<div className="flex gap-2">
										<Button
											className="flex-1 bg-product-primary text-product-foreground"
											disabled={!editingPartner?.name.trim()}
											onClick={savePartner}
										>
											Save
										</Button>
										<Button
											onClick={() => setEditingPartnerIndex(null)}
											variant="ghost"
										>
											Cancel
										</Button>
									</div>
								</div>
							) : (
								<>
									<div className="flex-1 min-w-0">
										<PartnerBadge partner={partner} />
									</div>
									<div className="flex flex-col gap-1 flex-shrink-0">
										<Button
											onClick={() => startEditingPartner(index)}
											size="icon"
											variant="ghost"
										>
											<Pencil className="h-4 w-4" />
										</Button>
										<Button
											onClick={() => removePartner(index)}
											size="icon"
											variant="ghost"
										>
											<Trash2 className="h-4 w-4 text-destructive" />
										</Button>
									</div>
								</>
							)}
						</div>
					))}

					{(!catalogue.partners || catalogue.partners.length < MAX_PARTNERS) &&
						(isAddingPartner ? (
							<div className="space-y-3">
								<Input
									onChange={(e) =>
										setNewPartner((prev) => ({
											...prev,
											name: e.target.value,
										}))
									}
									placeholder="Partner Name"
									value={newPartner.name}
								/>
								<Input
									onChange={(e) =>
										setNewPartner((prev) => ({
											...prev,
											url: e.target.value,
										}))
									}
									placeholder="Partner URL"
									value={newPartner.url}
								/>
								<Input
									onChange={(e) =>
										setNewPartner((prev) => ({
											...prev,
											description: e.target.value,
										}))
									}
									placeholder="Partner Description"
									value={newPartner.description}
								/>
								<div className="flex gap-2">
									<Button
										className="flex-1 bg-product-primary text-product-foreground"
										disabled={!newPartner.name.trim()}
										onClick={addPartner}
									>
										Confirm
									</Button>
									<Button
										onClick={() => setIsAddingPartner(false)}
										variant="ghost"
									>
										Cancel
									</Button>
								</div>
							</div>
						) : (
							<Button
								className="w-full bg-product-primary text-product-foreground"
								onClick={() => setIsAddingPartner(true)}
							>
								<Plus className="h-4 w-4 mr-2" /> Add Partner
							</Button>
						))}
					{catalogue.partners?.length === MAX_PARTNERS && (
						<p className="text-sm text-muted-foreground text-center pt-2">
							Maximum of {MAX_PARTNERS} partners reached.
						</p>
					)}
				</div>
			)}
		</div>
	);
};

export default PartnersSection;
