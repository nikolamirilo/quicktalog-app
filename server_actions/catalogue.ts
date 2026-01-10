"use server";
import { defaultCatalogueData } from "@/constants";
import { drizzleClient } from "@/drizzle/db";
import { catalogues } from "@/drizzle/migrations/schema";
import { revalidateData } from "@/helpers/server";
import { Catalogue } from "@/types/catalogue";
import { redis } from "@/utils/redis";
import { generateUniqueSlug, Status } from "@quicktalog/common";
import { eq, inArray } from "drizzle-orm";

export async function deleteItem(id: string): Promise<boolean> {
	try {
		await drizzleClient.delete(catalogues).where(eq(catalogues.id, id));
		await revalidateData();
		return true;
	} catch (err) {
		console.error("Unexpected error while deleting service catalogue:", err);
		return false;
	}
}

export async function deleteMultipleItems(ids: string[]): Promise<boolean> {
	try {
		await drizzleClient.delete(catalogues).where(inArray(catalogues.id, ids));
		await revalidateData();
		return true;
	} catch (err) {
		console.error("Unexpected error while deleting catalogues:", err);
		return false;
	}
}

export async function updateItemStatus(
	id: string,
	status: Status,
): Promise<boolean> {
	try {
		await drizzleClient
			.update(catalogues)
			.set({ status })
			.where(eq(catalogues.id, id));

		await revalidateData();
		return true;
	} catch (err) {
		console.error("Unexpected error while updating status:", err);
		return false;
	}
}

export async function duplicateItem(id: string, name: string) {
	try {
		const data = await drizzleClient.query.catalogues.findFirst({
			where: eq(catalogues.id, id),
		});

		if (!data) return null;
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
		await revalidateData();
		return newData;
	} catch (err) {
		console.error("Unexpected error while duplicating service catalogue:", err);
		return null;
	}
}

export async function createCatalogue(catalogueData: Catalogue) {
	try {
		// Generate unique slug for the name
		const slug = generateUniqueSlug(catalogueData.name);

		// Check if name already exists
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

		// Sanitize data: remove Date objects for createdAt/updatedAt to let DB defaults work, or strict string
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { createdAt, updatedAt, ...rest } = catalogueData;

		const [data] = await drizzleClient
			.insert(catalogues)
			.values({
				...rest,
				name: slug,
				// Ensure timestamps are strings if we really want to pass them, otherwise omit to use defaultNow()
				// If the user provided them, we strictly want strings because mode: 'string'
				...(createdAt ? { createdAt: new Date(createdAt).toISOString() } : {}),
				...(updatedAt ? { updatedAt: new Date(updatedAt).toISOString() } : {}),
			})
			.returning();

		const res = await redis.set(slug, JSON.stringify(data));
		console.log(res);

		if (!data) {
			// This path presumably won't happen if insert throws, but good to have
			return {
				success: false,
				error: "Failed to insert catalogue",
			};
		}

		await revalidateData();
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

		await revalidateData();
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
			// Drizzle result should match Catalogue type or be compatible
			// Assuming 'data' structure matches what redis expects
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
		const catalogueData = { ...data, status: "active" };

		await drizzleClient
			.update(catalogues)
			.set({
				// Update all fields that might have changed + status
				...catalogueData,
				status: "active" as Status, // Ensure status type compatibility
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
		await revalidateData();
		return true;
	} catch (err) {
		console.error("Unexpected error while updating status in v2:", err);
		return false;
	}
}
