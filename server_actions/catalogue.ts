"use server";
import { revalidateCatalogue, revalidateDashboard } from "@/helpers/server";
import { drizzleClient } from "@/utils/drizzle";
import { redis } from "@/utils/redis";
import {
	Catalogue,
	defaultCatalogueData,
	generateUniqueSlug,
	schema,
	Status,
} from "@quicktalog/common";
import { currentUser } from "@clerk/nextjs/server";
import { eq, inArray } from "drizzle-orm";

const catalogues = schema.catalogues;

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
		await redis.del(name);
		revalidateCatalogue(name);
		revalidateDashboard();
		return true;
	} catch (err) {
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
			const cached = await redis.get(name);
			if (cached) {
				const data = typeof cached === "string" ? JSON.parse(cached) : cached;
				data.status = status;
				await redis.set(name, JSON.stringify(data));
			}
			revalidateCatalogue(name);
		}

		revalidateDashboard();
		return true;
	} catch (err) {
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

		const res = await redis.set(slug, JSON.stringify(data));
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

		const res = await redis.set(
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
		console.error("Unexpected error while updating catalogue:", err);
		return {
			success: false,
			error: "An unexpected error occurred",
		};
	}
}

export async function getCatalogueByName(name: string) {
	try {
		let catalogue = await redis.get(name);
		if (catalogue === null) {
			const data = await drizzleClient.query.catalogues.findFirst({
				where: eq(catalogues.name, name),
			});

			if (!data) {
				console.error("Failed to fetch catalogue: Not found");
				return {
					success: false,
					error: "Catalogue not found",
					data: defaultCatalogueData,
				};
			}
			await redis.set(name, JSON.stringify(data));
			catalogue = data;
		}
		return {
			success: true,
			data: catalogue,
			error: null,
		};
	} catch (err) {
		console.error("Unexpected error while fetching catalogue:", err);
		return {
			success: false,
			error: "An unexpected error occurred",
			data: null,
		};
	}
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

		const redisRes = await redis.set(
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
		console.error("Unexpected error while updating status in v2:", err);
		return false;
	}
}
