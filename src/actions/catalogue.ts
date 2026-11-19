"use server";
import * as Sentry from "@sentry/nextjs";
import {
	revalidateCatalogue,
	revalidateDashboard,
} from "@/lib/cache/revalidate";
import { sanitizeCustomThemeColors } from "@/lib/themes/custom-theme";
import { headingFromName, isHeadingEmpty } from "@/lib/catalogue/heading";
import { getVerifiedIdentity } from "@/lib/auth/identity";
import {
	type DraftPayload,
	type DraftVersion,
	listDraftVersions,
	loadOwnedCatalogue,
	loadOwnedDraftRow,
	readDraftVersion,
	readOwnedDraft,
	recordDraftVersion,
	saveOwnedDraft,
	writeOwnedDraft,
} from "@/lib/catalogue/draft-store";
import { applyPlanToCatalogue } from "@/lib/entitlements/catalogue";
import {
	canActivate,
	contentWithinPlan,
	getPlanForUpdate,
	withinCatalogueQuota,
} from "@/lib/entitlements/plan";
import { withinRateLimit } from "@/lib/rate-limit";
import { isUniqueViolation, pickEditable, withUser } from "@/utils/db";
import {
	type Catalogue,
	generateUniqueSlug,
	schema,
	type Status,
} from "@quicktalog/common";
import { and, eq, inArray, sql } from "drizzle-orm";

const catalogues = schema.catalogues;

type ActionResult<T> = { success: boolean; data?: T; error?: string };

/** The statuses a client may set; anything else is rejected. */
const CLIENT_STATUSES: Status[] = ["active", "inactive", "draft"];

/** Re-validates theme colors before persisting; `serializeThemeCss` guards render-time CSS, this guards stored data. */
function sanitizeAppearance(catalogueData: Catalogue): Catalogue {
	if (catalogueData.appearance?.theme?.type !== "custom") return catalogueData;
	return {
		...catalogueData,
		appearance: {
			...catalogueData.appearance,
			theme: {
				...catalogueData.appearance.theme,
				colors: sanitizeCustomThemeColors(
					catalogueData.appearance.theme.colors,
				),
			},
		},
	};
}

/** A new catalogue opens with its name as the heading rather than "+ Add Heading". */
function withStartingHeading(catalogueData: Catalogue): Catalogue {
	if (!isHeadingEmpty(catalogueData.heading)) return catalogueData;
	const heading = headingFromName(catalogueData.name);
	return heading ? { ...catalogueData, heading } : catalogueData;
}

export async function deleteItem(name: string): Promise<boolean> {
	try {
		const me = await getVerifiedIdentity();
		if (!me) return false;

		const deleted = await withUser(me, (tx) =>
			tx
				.delete(catalogues)
				.where(and(eq(catalogues.name, name), eq(catalogues.userId, me.userId)))
				.returning({ id: catalogues.id, name: catalogues.name }),
		);
		if (deleted.length === 0) return false;

		// The draft and its versions go with the row (FK cascade). Revalidation runs
		// after the transaction: it may not hold a pooled database connection.
		revalidateCatalogue(deleted[0].name);
		revalidateDashboard();
		return true;
	} catch (err) {
		Sentry.captureException(err, { tags: { op: "deleteItem" } });
		console.error("Unexpected error while deleting service catalogue:", err);
		return false;
	}
}

export async function deleteMultipleItems(ids: string[]): Promise<boolean> {
	try {
		const me = await getVerifiedIdentity();
		if (!me) return false;
		if (!Array.isArray(ids) || ids.length === 0) return false;

		// All or nothing: if any id is not the caller's, the transaction is rolled
		// back rather than deleting the subset they do own.
		const deleted = await withUser(me, async (tx) => {
			const rows = await tx
				.delete(catalogues)
				.where(
					and(inArray(catalogues.id, ids), eq(catalogues.userId, me.userId)),
				)
				.returning({ id: catalogues.id, name: catalogues.name });
			if (rows.length !== ids.length) {
				throw new Error("not_owner");
			}
			return rows;
		});

		for (const row of deleted) revalidateCatalogue(row.name);
		revalidateCatalogue();
		revalidateDashboard();
		return true;
	} catch (err) {
		if (err instanceof Error && err.message === "not_owner") return false;
		Sentry.captureException(err, { tags: { op: "deleteMultipleItems" } });
		console.error("Unexpected error while deleting catalogues:", err);
		return false;
	}
}

export async function updateItemStatus(
	id: string,
	status: Status,
): Promise<ActionResult<void>> {
	try {
		const me = await getVerifiedIdentity();
		if (!me) return { success: false, error: "Unauthorized" };
		if (!CLIENT_STATUSES.includes(status)) {
			return { success: false, error: "Invalid status" };
		}

		const result = await withUser(me, async (tx) => {
			// Re-activating is a plan decision, not just a status flip.
			if (status === "active") {
				const tier = await getPlanForUpdate(tx, me);
				const [stored] = await tx
					.select({ content: catalogues.content })
					.from(catalogues)
					.where(and(eq(catalogues.id, id), eq(catalogues.userId, me.userId)))
					.limit(1);
				if (!stored) return { ok: false as const, reason: "Not found" };
				const allowed = await canActivate(tx, tier, stored.content);
				if (!allowed.ok) {
					return {
						ok: false as const,
						reason: allowed.reason ?? "Not allowed",
					};
				}

				const [reactivated] = await tx
					.update(catalogues)
					.set({
						status,
						...applyPlanToCatalogue({} as Partial<Catalogue>, tier),
					})
					.where(and(eq(catalogues.id, id), eq(catalogues.userId, me.userId)))
					.returning({ id: catalogues.id, name: catalogues.name });
				return reactivated
					? { ok: true as const, row: reactivated }
					: { ok: false as const, reason: "Not found" };
			}

			const [updated] = await tx
				.update(catalogues)
				.set({ status })
				.where(and(eq(catalogues.id, id), eq(catalogues.userId, me.userId)))
				.returning({ id: catalogues.id, name: catalogues.name });
			return updated
				? { ok: true as const, row: updated }
				: { ok: false as const, reason: "Not found" };
		});

		if (!result.ok) return { success: false, error: result.reason };

		revalidateCatalogue(result.row.name);
		revalidateDashboard();
		return { success: true };
	} catch (err) {
		Sentry.captureException(err, { tags: { op: "updateItemStatus" } });
		console.error("Unexpected error while updating status:", err);
		return { success: false, error: "Failed to update status" };
	}
}

export async function duplicateItem(id: string, name?: string) {
	try {
		const me = await getVerifiedIdentity();
		if (!me) return null;

		const created = await withUser(me, async (tx) => {
			const [source] = await tx
				.select()
				.from(catalogues)
				.where(and(eq(catalogues.id, id), eq(catalogues.userId, me.userId)))
				.limit(1);
			if (!source) return null;

			const tier = await getPlanForUpdate(tx, me);
			if (!(await withinCatalogueQuota(tx, me, tier))) return null;

			// The requested name is only a starting point: the slug and the unique
			// index decide what is actually stored.
			const base =
				(typeof name === "string" && generateUniqueSlug(name)) ||
				`${generateUniqueSlug(source.name)}-copy`;
			const values = applyPlanToCatalogue(
				pickEditable(source as Record<string, unknown>) as Partial<Catalogue>,
				tier,
			);

			// A duplicate is new usage, so it is judged against the plan from
			// scratch (`previous` is null): every section, item and gated block
			// type in the copy has to fit. Without this, duplicating is a way to
			// keep multiplying blocks and items a downgraded plan no longer
			// includes. Returning null matches how the quota check above fails.
			if (!contentWithinPlan(values, null, tier).ok) return null;

			// A savepoint per attempt: a unique violation would otherwise abort the
			// whole transaction, quota lock included.
			for (let attempt = 1; attempt <= 20; attempt++) {
				const candidate = attempt === 1 ? base : `${base}-${attempt}`;
				await tx.execute(sql`savepoint duplicate_attempt`);
				try {
					const [row] = await tx
						.insert(catalogues)
						.values({
							...values,
							// `tags` is NOT NULL without a default, so it is always sent.
							tags: values.tags ?? [],
							name: candidate,
							status: "draft",
							userId: me.userId,
						})
						.returning();
					await tx.execute(sql`release savepoint duplicate_attempt`);
					return row ?? null;
				} catch (err) {
					await tx.execute(sql`rollback to savepoint duplicate_attempt`);
					if (!isUniqueViolation(err)) throw err;
				}
			}
			return null;
		});

		if (!created) return null;
		revalidateCatalogue(created.name);
		revalidateDashboard();
		return created;
	} catch (err) {
		Sentry.captureException(err, { tags: { op: "duplicateItem" } });
		console.error("Unexpected error while duplicating service catalogue:", err);
		return null;
	}
}

export async function createCatalogue(
	catalogueData: Catalogue,
): Promise<ActionResult<Catalogue>> {
	try {
		const me = await getVerifiedIdentity();
		if (!me) return { success: false, error: "Unauthorized" };

		const slug = generateUniqueSlug(catalogueData.name);
		if (!slug) return { success: false, error: "Invalid catalogue name" };

		const result: ActionResult<Catalogue> = await withUser(me, async (tx) => {
			const tier = await getPlanForUpdate(tx, me);
			if (!(await withinCatalogueQuota(tx, me, tier))) {
				return {
					success: false,
					error: "You have reached the catalogue limit of your plan",
				};
			}

			const shaped = applyPlanToCatalogue(
				sanitizeAppearance(withStartingHeading(catalogueData)),
				tier,
			);
			const withinPlan = contentWithinPlan(shaped, null, tier);
			if (!withinPlan.ok) {
				return {
					success: false,
					error: withinPlan.reason ?? "Plan limit reached",
				};
			}

			const [data] = await tx
				.insert(catalogues)
				.values({
					...(pickEditable(
						shaped as Record<string, unknown>,
					) as Partial<Catalogue>),
					// `tags` is NOT NULL without a default, so it is always sent.
					tags: shaped.tags ?? [],
					name: slug,
					status: "draft",
					userId: me.userId,
				})
				.returning();

			if (!data) return { success: false, error: "Failed to insert catalogue" };

			// The draft starts as a copy of the row, so the builder has something to
			// autosave against and the dashboard can count its items from one place.
			await writeOwnedDraft(tx, me, {
				catalogueId: data.id,
				draft: data as DraftPayload,
			});
			return { success: true, data: data as Catalogue };
		});

		if (!result.success || !("data" in result) || !result.data) return result;

		revalidateCatalogue(slug);
		revalidateDashboard();
		return result;
	} catch (err) {
		if (isUniqueViolation(err)) {
			return {
				success: false,
				error: "A catalogue with this name already exists",
			};
		}
		Sentry.captureException(err, { tags: { op: "createCatalogue" } });
		console.error("Unexpected error while creating catalogue:", err);
		return { success: false, error: "An unexpected error occurred" };
	}
}

/** What a draft save tells the builder, on top of the usual result. */
export type SaveDraftResponse = ActionResult<Catalogue> & {
	/** The stored draft's timestamp, to send back with the next save. */
	draftUpdatedAt?: string | null;
	/** The draft now differs from what visitors see. */
	unpublished?: boolean;
	/** Another tab or device saved in between; the builder offers a reload. */
	conflict?: boolean;
};

/**
 * Saves the builder's draft. This is the only write the builder makes: it never touches
 * the published catalogue, which is what Publish is for.
 *
 * `baseUpdatedAt` is the draft timestamp the caller last saw. A different stored
 * timestamp means somebody else saved since, so the write is refused instead of
 * silently throwing their work away.
 */
export async function updateCatalogue(
	catalogueData: Catalogue,
	baseUpdatedAt: string | null = null,
): Promise<SaveDraftResponse> {
	try {
		const me = await getVerifiedIdentity();
		if (!me) return { success: false, error: "Unauthorized" };

		const result = await withUser(me, async (tx) => {
			const row = await loadOwnedCatalogue(tx, me, catalogueData.name);
			if (!row) return { error: "Unauthorized" as const };

			// Judging growth against the stored draft (not the published row) is what
			// lets an over-limit catalogue be trimmed one save at a time after a
			// downgrade.
			const stored = await loadOwnedDraftRow(tx, row.id);
			const saved = stored?.draft
				? ({
						...row,
						...(typeof stored.draft === "string"
							? JSON.parse(stored.draft)
							: stored.draft),
					} as Catalogue)
				: null;

			const tier = await getPlanForUpdate(tx, me);
			const shaped = applyPlanToCatalogue(
				sanitizeAppearance(catalogueData),
				tier,
			);
			const withinPlan = contentWithinPlan(shaped, saved ?? row, tier);
			if (!withinPlan.ok) {
				return { error: withinPlan.reason ?? "Plan limit reached" };
			}

			const outcome = await saveOwnedDraft(tx, me, {
				catalogueId: row.id,
				draft: shaped as DraftPayload,
				baseUpdatedAt,
			});
			if (!outcome.ok) {
				return {
					conflict: true as const,
					draftUpdatedAt: outcome.draftUpdatedAt,
				};
			}

			await recordDraftVersion(tx, me, row.id, shaped as DraftPayload);
			return { row, draft: shaped, meta: outcome };
		});

		if ("error" in result) return { success: false, error: result.error };
		if ("conflict" in result) {
			return {
				success: false,
				conflict: true,
				draftUpdatedAt: result.draftUpdatedAt,
				error: "This catalogue was changed somewhere else.",
			};
		}

		// Revalidation runs outside the transaction: it may not hold a pooled connection.
		revalidateCatalogue(result.row.name);
		return {
			success: true,
			data: { ...result.draft, id: result.row.id },
			draftUpdatedAt: result.meta.draftUpdatedAt,
			unpublished: result.meta.unpublished,
		};
	} catch (err) {
		Sentry.captureException(err, { tags: { op: "updateCatalogue" } });
		console.error("Unexpected error while updating catalogue:", err);
		return { success: false, error: "An unexpected error occurred" };
	}
}

/** The builder's loader: the catalogue plus what autosave needs to save against it. */
export async function getBuilderCatalogue(name: string): Promise<{
	success: boolean;
	data: Catalogue | null;
	draftUpdatedAt: string | null;
	unpublished: boolean;
	error?: string;
}> {
	const empty = {
		success: false,
		data: null,
		draftUpdatedAt: null,
		unpublished: false,
	};
	try {
		const me = await getVerifiedIdentity();
		if (!me) return { ...empty, error: "Unauthorized" };

		const found = await readOwnedDraft(me, name);
		if (!found) return { ...empty, error: "Catalogue not found" };

		return {
			success: true,
			data: found.catalogue,
			draftUpdatedAt: found.draftUpdatedAt,
			unpublished: found.unpublished,
		};
	} catch (err) {
		Sentry.captureException(err, {
			level: "warning",
			tags: { op: "getBuilderCatalogue" },
		});
		console.error("Unexpected error while fetching catalogue:", err);
		return { ...empty, error: "An unexpected error occurred" };
	}
}

/** The autosaves kept for one of the caller's catalogues, newest first. */
export async function getDraftVersions(
	name: string,
): Promise<{ versions: DraftVersion[] }> {
	try {
		const me = await getVerifiedIdentity();
		if (!me) return { versions: [] };

		return await withUser(me, async (tx) => {
			const row = await loadOwnedCatalogue(tx, me, name);
			if (!row) return { versions: [] };
			return { versions: await listDraftVersions(tx, row.id) };
		});
	} catch (err) {
		Sentry.captureException(err, {
			level: "warning",
			tags: { op: "getDraftVersions" },
		});
		return { versions: [] };
	}
}

/**
 * Puts one kept autosave back as the current draft. It is a draft write like any other,
 * so the published catalogue is untouched until the owner publishes again.
 */
export async function restoreDraftVersion(
	name: string,
	versionId: string,
): Promise<SaveDraftResponse> {
	try {
		const me = await getVerifiedIdentity();
		if (!me) return { success: false, error: "Unauthorized" };
		if (!/^\d{1,19}$/.test(versionId)) {
			return { success: false, error: "Unknown version" };
		}

		const result = await withUser(me, async (tx) => {
			const row = await loadOwnedCatalogue(tx, me, name);
			if (!row) return { error: "Unauthorized" as const };

			const version = await readDraftVersion(tx, row.id, versionId);
			if (!version) return { error: "Unknown version" as const };

			const tier = await getPlanForUpdate(tx, me);
			const shaped = applyPlanToCatalogue(
				sanitizeAppearance({ ...row, ...version } as Catalogue),
				tier,
			);
			// A restore may not be used to get back over a limit the plan lost since.
			const withinPlan = contentWithinPlan(shaped, row, tier);
			if (!withinPlan.ok) {
				return { error: withinPlan.reason ?? "Plan limit reached" };
			}

			const meta = await writeOwnedDraft(tx, me, {
				catalogueId: row.id,
				draft: shaped as DraftPayload,
			});
			return { row, draft: shaped, meta };
		});

		if ("error" in result) return { success: false, error: result.error };

		revalidateCatalogue(result.row.name);
		return {
			success: true,
			data: { ...result.draft, id: result.row.id },
			draftUpdatedAt: result.meta.draftUpdatedAt,
			unpublished: result.meta.unpublished,
		};
	} catch (err) {
		Sentry.captureException(err, { tags: { op: "restoreDraftVersion" } });
		console.error("Unexpected error while restoring a draft version:", err);
		return { success: false, error: "An unexpected error occurred" };
	}
}

/** The signed-in owner's catalogue for the editor: DB row with any unsaved draft on top. */
export async function getCatalogueByName(name: string) {
	try {
		const me = await getVerifiedIdentity();
		if (!me) {
			return { success: false, error: "Unauthorized", data: null };
		}

		const found = await readOwnedDraft(me, name);
		if (!found) {
			return { success: false, error: "Catalogue not found", data: null };
		}
		return { success: true, data: found.catalogue, error: null };
	} catch (err) {
		Sentry.captureException(err, {
			level: "warning",
			tags: { op: "getCatalogueByName" },
		});
		console.error("Unexpected error while fetching catalogue:", err);
		return {
			success: false,
			error: "An unexpected error occurred",
			data: null,
		};
	}
}

/** Whether a name is free. Answers boolean-only, via a definer function, so it can't enumerate other users' names. */
export async function checkCatalogueName(
	name: string,
): Promise<{ available: boolean } | { error: string }> {
	const me = await getVerifiedIdentity();
	if (!me) return { error: "Unauthorized" };
	if (typeof name !== "string" || name.length > 200) {
		return { error: "Invalid name" };
	}
	if (!(await withinRateLimit("catalogueName", me.userId))) {
		return { error: "Too many requests" };
	}

	const slug = generateUniqueSlug(name);
	if (!slug) return { available: false };

	const available = await withUser(me, async (tx) => {
		const rows = await tx.execute<{ available: boolean }>(
			sql`select private.catalogue_name_available(${slug}) as available`,
		);
		return [...rows][0]?.available === true;
	});
	return { available };
}

export async function publishCatalogue(
	data: Catalogue,
): Promise<ActionResult<void>> {
	try {
		const me = await getVerifiedIdentity();
		if (!me) return { success: false, error: "Unauthorized" };

		const published = await withUser(me, async (tx) => {
			const current = await loadOwnedCatalogue(tx, me, data.name);
			if (!current) return { error: "Not found" };

			const tier = await getPlanForUpdate(tx, me);
			const shaped = applyPlanToCatalogue(sanitizeAppearance(data), tier);
			const allowed = await canActivate(tx, tier, shaped.content);
			if (!allowed.ok) return { error: allowed.reason ?? "Not allowed" };

			const withinPlan = contentWithinPlan(shaped, current, tier);
			if (!withinPlan.ok)
				return { error: withinPlan.reason ?? "Plan limit reached" };

			const [row] = await tx
				.update(catalogues)
				.set({
					...(pickEditable(
						shaped as Record<string, unknown>,
					) as Partial<Catalogue>),
					status: "active" as Status,
					updatedAt: new Date().toISOString(),
				})
				.where(
					and(eq(catalogues.id, current.id), eq(catalogues.userId, me.userId)),
				)
				.returning();
			if (!row) return { error: "Not found" };

			// The draft becomes a copy of what is now live, stamped published, so the
			// builder and the dashboard stop saying "Unpublished changes".
			await writeOwnedDraft(tx, me, {
				catalogueId: current.id,
				draft: row as DraftPayload,
				publish: true,
			});
			return { row };
		});

		if ("error" in published) return { success: false, error: published.error };

		const row = published.row as Catalogue;
		revalidateCatalogue(row.name);
		revalidateDashboard();
		return { success: true };
	} catch (err) {
		Sentry.captureException(err, { tags: { op: "publishCatalogue" } });
		console.error("Unexpected error while publishing catalogue:", err);
		return { success: false, error: "Failed to publish catalogue" };
	}
}
