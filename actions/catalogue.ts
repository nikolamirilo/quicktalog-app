"use server";
import * as Sentry from "@sentry/nextjs";
import { revalidateCatalogue, revalidateDashboard } from "@/helpers/server";
import { getVerifiedIdentity } from "@/lib/auth/identity";
import { applyPlanToCatalogue } from "@/lib/entitlements/catalogue";
import { getUserTier, withinCatalogueQuota } from "@/lib/entitlements/plan";
import { withinRateLimit } from "@/lib/rate-limit";
import { sanitizeCustomThemeColors } from "@/helpers/theme";
import { pickEditable } from "@/utils/db/columns";
import { isUniqueViolation } from "@/utils/db/errors";
import { drizzleClient } from "@/utils/drizzle";
import { getRedis, syncCache } from "@/utils/redis";
import {
	Catalogue,
	generateUniqueSlug,
	schema,
	Status,
} from "@quicktalog/common";
import { and, eq, inArray } from "drizzle-orm";

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

/** The builder draft in Redis never carries the owner id or a client status. */
function draftPayload<T extends object>(data: T) {
	const {
		createdBy: _owner,
		status: _status,
		...rest
	} = data as T & { createdBy?: unknown; status?: unknown };
	return JSON.stringify(rest);
}

export async function deleteItem(name: string): Promise<boolean> {
	try {
		const me = await getVerifiedIdentity();
		if (!me) return false;

		const deleted = await drizzleClient
			.delete(catalogues)
			.where(
				and(eq(catalogues.name, name), eq(catalogues.createdBy, me.userId)),
			)
			.returning({ name: catalogues.name });
		if (deleted.length === 0) return false;

		await syncCache(() => getRedis().del(name));
		revalidateCatalogue(name);
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

		const deleted = await drizzleClient
			.delete(catalogues)
			.where(
				and(inArray(catalogues.id, ids), eq(catalogues.createdBy, me.userId)),
			)
			.returning({ name: catalogues.name });
		if (deleted.length !== ids.length) {
			Sentry.captureMessage(
				"deleteMultipleItems removed fewer rows than asked",
				{
					level: "warning",
					extra: { asked: ids.length, deleted: deleted.length },
				},
			);
		}
		if (deleted.length === 0) return false;

		const names = deleted.map((row) => row.name);
		await syncCache(() => getRedis().del(...names));
		for (const name of names) revalidateCatalogue(name);
		revalidateCatalogue();
		revalidateDashboard();
		return true;
	} catch (err) {
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

		const [updated] = await drizzleClient
			.update(catalogues)
			.set({ status })
			.where(and(eq(catalogues.id, id), eq(catalogues.createdBy, me.userId)))
			.returning({ name: catalogues.name });
		if (!updated) return false;

		const { name } = updated;
		await syncCache(async () => {
			const r = getRedis();
			const cached = await r.get(name);
			if (cached) {
				const data = typeof cached === "string" ? JSON.parse(cached) : cached;
				data.status = status;
				await r.set(name, JSON.stringify(data));
			}
		});
		revalidateCatalogue(name);
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

		const source = await drizzleClient.query.catalogues.findFirst({
			where: and(eq(catalogues.id, id), eq(catalogues.createdBy, me.userId)),
		});
		if (!source) return null;

		const tier = await getUserTier(me.userId);
		if (!(await withinCatalogueQuota(me.userId, tier))) return null;

		const {
			id: _oldId,
			createdAt: _createdAt,
			updatedAt: _updatedAt,
			...rest
		} = source;
		// The requested name is only a starting point: the slug and the unique
		// index decide what is actually stored.
		const base =
			(typeof name === "string" && generateUniqueSlug(name)) ||
			`${generateUniqueSlug(source.name)}-copy`;

		// The unique index decides, not a prior lookup: two parallel duplicates
		// of the same catalogue would otherwise pick the same free name.
		for (let attempt = 1; attempt <= 10; attempt++) {
			const candidate = attempt === 1 ? base : `${base}-${attempt}`;
			try {
				const [created] = await drizzleClient
					.insert(catalogues)
					.values({
						...rest,
						...applyPlanToCatalogue(rest as Partial<Catalogue>, tier),
						name: candidate,
						status: "draft",
						createdBy: me.userId,
					})
					.returning();
				if (!created) return null;
				revalidateCatalogue(candidate);
				revalidateDashboard();
				return created;
			} catch (err) {
				if (!isUniqueViolation(err)) throw err;
			}
		}
		return null;
	} catch (err) {
		Sentry.captureException(err, { tags: { op: "duplicateItem" } });
		console.error("Unexpected error while duplicating service catalogue:", err);
		return null;
	}
}

export async function createCatalogue(catalogueData: Catalogue) {
	try {
		const me = await getVerifiedIdentity();
		if (!me) return { success: false, error: "Unauthorized" };

		const slug = generateUniqueSlug(catalogueData.name);
		if (!slug) return { success: false, error: "Invalid catalogue name" };

		const tier = await getUserTier(me.userId);
		if (!(await withinCatalogueQuota(me.userId, tier))) {
			return {
				success: false,
				error: "You have reached the catalogue limit of your plan",
			};
		}

		// Timestamps are the database's to set.
		const {
			createdAt: _c,
			updatedAt: _u,
			...rest
		} = applyPlanToCatalogue(sanitizeAppearance(catalogueData), tier);

		const [data] = await drizzleClient
			.insert(catalogues)
			.values({
				...rest,
				name: slug,
				status: "draft",
				createdBy: me.userId,
			})
			.returning();

		if (!data) {
			return { success: false, error: "Failed to insert catalogue" };
		}

		await syncCache(() => getRedis().set(slug, draftPayload(data)));
		revalidateCatalogue(slug);
		revalidateDashboard();
		return { success: true, data };
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

export async function updateCatalogue(catalogueData: Catalogue) {
	try {
		const me = await getVerifiedIdentity();
		if (!me) return { success: false, error: "Unauthorized" };

		const row = await drizzleClient.query.catalogues.findFirst({
			where: and(
				eq(catalogues.name, catalogueData.name),
				eq(catalogues.createdBy, me.userId),
			),
			columns: { id: true, name: true },
		});
		if (!row) return { success: false, error: "Unauthorized" };

		const tier = await getUserTier(me.userId);
		const draft = applyPlanToCatalogue(sanitizeAppearance(catalogueData), tier);

		const stored = await syncCache(() =>
			getRedis().set(row.name, draftPayload({ ...draft, id: row.id })),
		);
		if (!stored) {
			return { success: false, error: "Failed to save the draft" };
		}

		revalidateCatalogue(row.name);
		return { success: true, data: draft };
	} catch (err) {
		Sentry.captureException(err, { tags: { op: "updateCatalogue" } });
		console.error("Unexpected error while updating catalogue:", err);
		return { success: false, error: "An unexpected error occurred" };
	}
}

/**
 * The signed-in owner's catalogue for the editor: the database row, with any
 * unsaved builder draft from Redis on top. Ownership is always proven against
 * the database; the draft can never change the id, name, owner or status.
 */
export async function getCatalogueByName(name: string) {
	try {
		const me = await getVerifiedIdentity();
		if (!me) {
			return { success: false, error: "Unauthorized", data: null };
		}

		const row = await drizzleClient.query.catalogues.findFirst({
			where: and(
				eq(catalogues.name, name),
				eq(catalogues.createdBy, me.userId),
			),
		});
		if (!row) {
			return { success: false, error: "Catalogue not found", data: null };
		}

		let draft: unknown = null;
		try {
			draft = await getRedis().get(name);
		} catch (err) {
			Sentry.captureException(err, {
				level: "warning",
				tags: { op: "getCatalogueByName", step: "redis" },
			});
		}
		const parsed = typeof draft === "string" ? JSON.parse(draft) : draft;

		const data =
			parsed && typeof parsed === "object"
				? {
						...(parsed as Catalogue),
						id: row.id,
						name: row.name,
						createdBy: row.createdBy,
						status: row.status,
					}
				: row;

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
 * Answers with a boolean only, so it cannot be used to list other users' names.
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

	const existing = await drizzleClient.query.catalogues.findFirst({
		where: eq(catalogues.name, slug),
		columns: { id: true },
	});
	return { available: !existing };
}

export async function publishCatalogue(data: Catalogue): Promise<boolean> {
	try {
		const me = await getVerifiedIdentity();
		if (!me) return false;

		const tier = await getUserTier(me.userId);
		const editable = pickEditable(
			applyPlanToCatalogue(sanitizeAppearance(data), tier),
		);

		const [updated] = await drizzleClient
			.update(catalogues)
			.set({
				...editable,
				status: "active" as Status,
				updatedAt: new Date().toISOString(),
			})
			.where(
				and(
					eq(catalogues.name, data.name),
					eq(catalogues.createdBy, me.userId),
				),
			)
			.returning();
		if (!updated) return false;

		await syncCache(() => getRedis().set(updated.name, draftPayload(updated)));
		revalidateCatalogue(updated.name);
		revalidateDashboard();
		return true;
	} catch (err) {
		Sentry.captureException(err, { tags: { op: "publishCatalogue" } });
		console.error("Unexpected error while publishing catalogue:", err);
		return false;
	}
}
