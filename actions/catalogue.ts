"use server";
import * as Sentry from "@sentry/nextjs";
import { revalidateCatalogue, revalidateDashboard } from "@/helpers/server";
import { sanitizeCustomThemeColors } from "@/helpers/theme";
import { getVerifiedIdentity } from "@/lib/auth/identity";
import {
	deleteDrafts,
	loadOwnedCatalogue,
	readOwnedDraft,
	writeOwnedDraft,
} from "@/lib/catalogue/draft-cache";
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

/** The statuses a client may set; anything else is rejected. */
const CLIENT_STATUSES: Status[] = ["active", "inactive", "draft"];

/**
 * Re-validates `appearance.theme.colors` before it's persisted, so a crafted
 * payload can't push arbitrary strings into Postgres/Redis. The render-time
 * allowlist in `serializeThemeCss` already guards against unsafe CSS, but
 * without this the bad value would silently survive as stored data.
 */
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

export async function deleteItem(name: string): Promise<boolean> {
	try {
		const me = await getVerifiedIdentity();
		if (!me) return false;

		const deleted = await withUser(me, (tx) =>
			tx
				.delete(catalogues)
				.where(
					and(eq(catalogues.name, name), eq(catalogues.createdBy, me.userId)),
				)
				.returning({ id: catalogues.id, name: catalogues.name }),
		);
		if (deleted.length === 0) return false;

		// Redis and revalidation run after the transaction: neither may hold a
		// pooled database connection.
		await deleteDrafts(deleted.map((row) => row.id)).catch((err) =>
			Sentry.captureException(err, {
				level: "warning",
				tags: { op: "deleteItem", step: "redis" },
			}),
		);
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
					and(inArray(catalogues.id, ids), eq(catalogues.createdBy, me.userId)),
				)
				.returning({ id: catalogues.id, name: catalogues.name });
			if (rows.length !== ids.length) {
				throw new Error("not_owner");
			}
			return rows;
		});

		await deleteDrafts(deleted.map((row) => row.id)).catch((err) =>
			Sentry.captureException(err, {
				level: "warning",
				tags: { op: "deleteMultipleItems", step: "redis" },
			}),
		);
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
): Promise<boolean> {
	try {
		const me = await getVerifiedIdentity();
		if (!me) return false;
		if (!CLIENT_STATUSES.includes(status)) return false;

		const result = await withUser(me, async (tx) => {
			// Re-activating is a plan decision, not just a status flip.
			if (status === "active") {
				const tier = await getPlanForUpdate(tx, me);
				const allowed = await canActivate(tx, tier);
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
					.where(
						and(eq(catalogues.id, id), eq(catalogues.createdBy, me.userId)),
					)
					.returning({ id: catalogues.id, name: catalogues.name });
				return reactivated
					? { ok: true as const, row: reactivated }
					: { ok: false as const, reason: "Not found" };
			}

			const [updated] = await tx
				.update(catalogues)
				.set({ status })
				.where(and(eq(catalogues.id, id), eq(catalogues.createdBy, me.userId)))
				.returning({ id: catalogues.id, name: catalogues.name });
			return updated
				? { ok: true as const, row: updated }
				: { ok: false as const, reason: "Not found" };
		});

		if (!result.ok) return false;

		revalidateCatalogue(result.row.name);
		revalidateDashboard();
		return true;
	} catch (err) {
		Sentry.captureException(err, { tags: { op: "updateItemStatus" } });
		console.error("Unexpected error while updating status:", err);
		return false;
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
				.where(and(eq(catalogues.id, id), eq(catalogues.createdBy, me.userId)))
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
							createdBy: me.userId,
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

type ActionResult<T> = { success: boolean; data?: T; error?: string };

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
				sanitizeAppearance(catalogueData),
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
					createdBy: me.userId,
				})
				.returning();

			if (!data) return { success: false, error: "Failed to insert catalogue" };
			return { success: true, data: data as Catalogue };
		});

		if (!result.success || !("data" in result) || !result.data) return result;

		await writeOwnedDraft(result.data as Catalogue).catch((err) =>
			Sentry.captureException(err, {
				level: "warning",
				tags: { op: "createCatalogue", step: "redis" },
			}),
		);
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

export async function updateCatalogue(
	catalogueData: Catalogue,
): Promise<ActionResult<Catalogue>> {
	try {
		const me = await getVerifiedIdentity();
		if (!me) return { success: false, error: "Unauthorized" };

		const prepared = await withUser(me, async (tx) => {
			const row = await loadOwnedCatalogue(tx, me, catalogueData.name);
			if (!row) return null;

			const tier = await getPlanForUpdate(tx, me);
			const shaped = applyPlanToCatalogue(
				sanitizeAppearance(catalogueData),
				tier,
			);
			const withinPlan = contentWithinPlan(shaped, row, tier);
			if (!withinPlan.ok) {
				return { error: withinPlan.reason ?? "Plan limit reached" };
			}

			return { row, draft: shaped };
		});

		if (!prepared) return { success: false, error: "Unauthorized" };
		if ("error" in prepared) {
			return { success: false, error: prepared.error };
		}

		// The draft is a cache of unsaved edits; the database row stays the source
		// of the id, name, owner and status.
		try {
			await writeOwnedDraft({ ...prepared.draft, id: prepared.row.id });
		} catch (err) {
			Sentry.captureException(err, {
				tags: { op: "updateCatalogue", step: "redis" },
			});
			return { success: false, error: "Failed to save the draft" };
		}

		revalidateCatalogue(prepared.row.name);
		return { success: true, data: { ...prepared.draft, id: prepared.row.id } };
	} catch (err) {
		Sentry.captureException(err, { tags: { op: "updateCatalogue" } });
		console.error("Unexpected error while updating catalogue:", err);
		return { success: false, error: "An unexpected error occurred" };
	}
}

/**
 * The signed-in owner's catalogue for the editor: the database row with any
 * unsaved draft on top. Ownership is proven by RLS plus the owner predicate;
 * the draft can never change the id, name, owner or status.
 */
export async function getCatalogueByName(name: string) {
	try {
		const me = await getVerifiedIdentity();
		if (!me) {
			return { success: false, error: "Unauthorized", data: null };
		}

		const data = await readOwnedDraft(me, name);
		if (!data) {
			return { success: false, error: "Catalogue not found", data: null };
		}
		return { success: true, data, error: null };
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

/**
 * Whether a catalogue name is still free, for the create and duplicate forms.
 * Answers with a boolean only, so it cannot be used to list other users' names:
 * the check runs in the database through a definer function that returns
 * nothing but true or false.
 */
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

export async function publishCatalogue(data: Catalogue): Promise<boolean> {
	try {
		const me = await getVerifiedIdentity();
		if (!me) return false;

		const published = await withUser(me, async (tx) => {
			const current = await loadOwnedCatalogue(tx, me, data.name);
			if (!current) return null;

			const tier = await getPlanForUpdate(tx, me);
			const allowed = await canActivate(tx, tier);
			if (!allowed.ok) return null;

			const shaped = applyPlanToCatalogue(sanitizeAppearance(data), tier);
			const withinPlan = contentWithinPlan(shaped, current, tier);
			if (!withinPlan.ok) return null;

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
					and(
						eq(catalogues.id, current.id),
						eq(catalogues.createdBy, me.userId),
					),
				)
				.returning();
			return row ?? null;
		});

		if (!published) return false;

		await writeOwnedDraft(published as Catalogue).catch((err) =>
			Sentry.captureException(err, {
				level: "warning",
				tags: { op: "publishCatalogue", step: "redis" },
			}),
		);
		revalidateCatalogue(published.name);
		revalidateDashboard();
		return true;
	} catch (err) {
		Sentry.captureException(err, { tags: { op: "publishCatalogue" } });
		console.error("Unexpected error while publishing catalogue:", err);
		return false;
	}
}
