"use server";
import * as Sentry from "@sentry/nextjs";
import { revalidateCatalogue, revalidateDashboard } from "@/helpers/server";
import { getVerifiedIdentity } from "@/lib/auth/identity";
import { withinRateLimit } from "@/lib/rate-limit";
import { sanitizeCustomThemeColors } from "@/helpers/theme";
import { drizzleClient } from "@/utils/drizzle";
import { getRedis, syncCache } from "@/utils/redis";
import {
	Catalogue,
	generateUniqueSlug,
	schema,
	Status,
} from "@quicktalog/common";
import { currentUser } from "@clerk/nextjs/server";
import { and, eq, inArray } from "drizzle-orm";

const catalogues = schema.catalogues;

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
		const user = await currentUser();
		if (!user?.id) return false;

		const existing = await drizzleClient.query.catalogues.findFirst({
			where: eq(catalogues.name, name),
			columns: { createdBy: true },
		});
		if (!existing || existing.createdBy !== user.id) return false;

		await drizzleClient.delete(catalogues).where(eq(catalogues.name, name));
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
		const user = await currentUser();
		if (!user?.id) return false;

		const existing = await drizzleClient.query.catalogues.findMany({
			where: inArray(catalogues.id, ids),
			columns: { createdBy: true },
		});
		if (
			existing.length !== ids.length ||
			existing.some((c) => c.createdBy !== user.id)
		)
			return false;

		await drizzleClient.delete(catalogues).where(inArray(catalogues.id, ids));
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
	name?: string,
): Promise<boolean> {
	try {
		const user = await currentUser();
		if (!user?.id) return false;

		const existing = await drizzleClient.query.catalogues.findFirst({
			where: eq(catalogues.id, id),
			columns: { createdBy: true },
		});
		if (!existing || existing.createdBy !== user.id) return false;

		await drizzleClient
			.update(catalogues)
			.set({ status })
			.where(eq(catalogues.id, id));

		if (name) {
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
		}

		revalidateDashboard();
		return true;
	} catch (err) {
		Sentry.captureException(err, { tags: { op: "updateItemStatus" } });
		console.error("Unexpected error while updating status:", err);
		return false;
	}
}

export async function duplicateItem(id: string, name: string) {
	try {
		const user = await currentUser();
		if (!user?.id) return null;

		const data = await drizzleClient.query.catalogues.findFirst({
			where: eq(catalogues.id, id),
		});

		if (!data) return null;
		if (data.createdBy !== user.id) return null;
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { id: _oldId, ...rest } = data;

		let suffix = "-copy";
		let tryName = generateUniqueSlug(name);
		let count = 1;

		while (true) {
			const exists = await drizzleClient.query.catalogues.findFirst({
				where: eq(catalogues.name, tryName),
				columns: { id: true },
			});

			if (!exists) break;
			tryName = `${name}${suffix}${count === 1 ? "" : count}`;
			count++;
		}

		const [newData] = await drizzleClient
			.insert(catalogues)
			.values({ ...rest, name: tryName })
			.returning();

		if (!newData) return null;
		revalidateCatalogue(tryName);
		revalidateDashboard();
		return newData;
	} catch (err) {
		Sentry.captureException(err, { tags: { op: "duplicateItem" } });
		console.error("Unexpected error while duplicating service catalogue:", err);
		return null;
	}
}

export async function createCatalogue(
	catalogueData: Catalogue,
	branding: boolean = false,
) {
	try {
		const user = await currentUser();
		if (!user?.id) return { success: false, error: "Unauthorized" };

		const slug = generateUniqueSlug(catalogueData.name);

		const existingCatalogue = await drizzleClient.query.catalogues.findFirst({
			where: eq(catalogues.name, slug),
			columns: { id: true },
		});

		if (existingCatalogue) {
			return {
				success: false,
				error: "A catalogue with this name already exists",
			};
		}

		catalogueData = sanitizeAppearance(catalogueData);

		const type = branding === true ? "custom" : "default";
		const { createdAt, updatedAt, ...rest } = catalogueData;

		const [data] = await drizzleClient
			.insert(catalogues)
			.values({
				...rest,
				name: slug,
				createdBy: user.id,
				header: { ...rest.header, type: type },
				footer: { ...rest.footer, type: type },
			})
			.returning();

		const res = await getRedis().set(slug, JSON.stringify(data));
		console.log(res);

		if (!data) {
			return {
				success: false,
				error: "Failed to insert catalogue",
			};
		}

		revalidateCatalogue(slug);
		revalidateDashboard();
		return {
			success: true,
			data,
		};
	} catch (err) {
		Sentry.captureException(err, { tags: { op: "createCatalogue" } });
		console.error("Unexpected error while creating catalogue:", err);
		return {
			success: false,
			error: "An unexpected error occurred",
		};
	}
}

export async function updateCatalogue(catalogueData: Catalogue) {
	try {
		const user = await currentUser();
		if (!user?.id) return { success: false, error: "Unauthorized" };

		const existing = await drizzleClient.query.catalogues.findFirst({
			where: eq(catalogues.name, catalogueData.name),
			columns: { createdBy: true },
		});
		if (!existing || existing.createdBy !== user.id) {
			return { success: false, error: "Unauthorized" };
		}

		catalogueData = sanitizeAppearance(catalogueData);

		const res = await getRedis().set(
			catalogueData.name,
			JSON.stringify(catalogueData),
		);

		if (res !== "OK") {
			console.error("Failed to update catalogue:", res);
			return {
				success: false,
				error: res,
			};
		}

		revalidateCatalogue(catalogueData.name);
		return {
			success: true,
			data: catalogueData,
		};
	} catch (err) {
		Sentry.captureException(err, { tags: { op: "updateCatalogue" } });
		console.error("Unexpected error while updating catalogue:", err);
		return {
			success: false,
			error: "An unexpected error occurred",
		};
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
		const user = await currentUser();
		if (!user?.id) return false;

		const existing = await drizzleClient.query.catalogues.findFirst({
			where: eq(catalogues.name, data.name),
			columns: { createdBy: true },
		});
		if (!existing || existing.createdBy !== user.id) return false;

		data = sanitizeAppearance(data);

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { createdAt, updatedAt, ...rest } = data;
		const catalogueData = { ...rest, status: "active" };

		await drizzleClient
			.update(catalogues)
			.set({
				...rest,
				status: "active" as Status,
				updatedAt: new Date().toISOString(),
			})
			.where(eq(catalogues.name, catalogueData.name));

		const redisRes = await getRedis().set(
			catalogueData.name,
			JSON.stringify(catalogueData),
		);
		if (redisRes !== "OK") {
			console.error("Failed to update redis during publish");
			return false;
		}
		revalidateCatalogue(catalogueData.name);
		revalidateDashboard();
		return true;
	} catch (err) {
		Sentry.captureException(err, { tags: { op: "publishCatalogue" } });
		console.error("Unexpected error while updating status in v2:", err);
		return false;
	}
}
