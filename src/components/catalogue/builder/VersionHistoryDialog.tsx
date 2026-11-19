"use client";
import { History } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { getDraftVersions, restoreDraftVersion } from "@/actions/catalogue";
import {
	builderDialogFrame,
	BuilderDialogBody,
	BuilderDialogClose,
	BuilderDialogFooter,
	BuilderDialogHeader,
} from "@/components/catalogue/modals/content/BuilderDialog";
import { AppDialogContent } from "@/components/modals/AppDialog";
import {
	AlertDialog,
	AlertDialogDescription,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useBuilderStatus } from "@/context/BuilderStatusContext";
import { useCatalogueContext } from "@/context/CatalogueContext";
import type { Catalogue } from "@quicktalog/common";

type Version = { id: string; createdAt: string; itemCount: number };

const formatWhen = (value: string) => {
	const time = new Date(value).getTime();
	if (Number.isNaN(time)) return "Unknown time";
	return new Date(time).toLocaleString("en-US", {
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
};

/**
 * The autosaves kept for this catalogue, newest first, and a way back to one. Autosave
 * replaced the Save button, so this is the only undo point left for an edit the owner
 * regrets; restoring writes a draft like any other, so the published catalogue is
 * untouched until they publish again.
 */
export function VersionHistoryDialog({
	isOpen,
	onClose,
	catalogueName,
}: {
	isOpen: boolean;
	onClose: () => void;
	catalogueName: string;
}) {
	const context = useCatalogueContext();
	const status = useBuilderStatus();
	const [versions, setVersions] = useState<Version[] | null>(null);
	const [restoringId, setRestoringId] = useState<string | null>(null);

	useEffect(() => {
		if (!isOpen) return;
		let cancelled = false;
		setVersions(null);
		void getDraftVersions(catalogueName).then((result) => {
			if (!cancelled) setVersions(result.versions);
		});
		return () => {
			cancelled = true;
		};
	}, [isOpen, catalogueName]);

	const restore = async (version: Version) => {
		setRestoringId(version.id);
		try {
			const result = await restoreDraftVersion(catalogueName, version.id);
			if (!result.success || !result.data) {
				toast.error(result.error ?? "Could not restore that version");
				return;
			}
			// Seeded, not edited: the server already stored it, so it counts as saved.
			context?.seedCatalogue(result.data as Catalogue);
			status?.adoptSaved(result.draftUpdatedAt ?? null);
			toast.success("Version restored. Publish to make it live.");
			onClose();
		} finally {
			setRestoringId(null);
		}
	};

	return (
		<AlertDialog onOpenChange={(open) => !open && onClose()} open={isOpen}>
			<AppDialogContent className={builderDialogFrame} size="sm">
				<BuilderDialogHeader>
					<div className="flex min-w-0 flex-col gap-1">
						<AlertDialogTitle className="text-lg">
							Version history
						</AlertDialogTitle>
						<AlertDialogDescription className="text-[13px]">
							The last autosaves of this catalogue. Restoring one replaces your
							current draft; it does not change the live catalogue.
						</AlertDialogDescription>
					</div>
					<BuilderDialogClose onClick={onClose} />
				</BuilderDialogHeader>

				<BuilderDialogBody>
					{versions === null && (
						<p className="text-sm text-product-muted">Loading…</p>
					)}
					{versions?.length === 0 && (
						<p className="flex flex-col items-center gap-2 py-6 text-center text-sm text-product-muted">
							<History aria-hidden="true" className="size-6" />
							No autosaves yet. They start once you edit this catalogue.
						</p>
					)}
					{versions && versions.length > 0 && (
						<ul className="flex flex-col gap-2">
							{versions.map((version, index) => (
								<li
									className="flex items-center justify-between gap-3 rounded-[12px] border border-product-border bg-product-card px-3 py-2.5"
									key={version.id}
								>
									<span className="min-w-0">
										<span className="block truncate text-sm font-semibold">
											{formatWhen(version.createdAt)}
											{index === 0 && (
												<span className="ml-2 text-xs font-medium text-product-muted">
													most recent
												</span>
											)}
										</span>
										<span className="block text-xs text-product-muted">
											{version.itemCount}{" "}
											{version.itemCount === 1 ? "item" : "items"}
										</span>
									</span>
									<Button
										disabled={restoringId !== null}
										onClick={() => void restore(version)}
										size="sm"
										variant="outline"
									>
										{restoringId === version.id ? "Restoring…" : "Restore"}
									</Button>
								</li>
							))}
						</ul>
					)}
				</BuilderDialogBody>

				<BuilderDialogFooter>
					<Button onClick={onClose} variant="outline">
						Close
					</Button>
				</BuilderDialogFooter>
			</AppDialogContent>
		</AlertDialog>
	);
}
