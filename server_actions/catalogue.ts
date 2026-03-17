"use server";
import {
	revalidateAfterCatalogueChange,
	revalidateAllCatalogues,
	revalidateData,
} from "@/helpers/server";
import { drizzleClient } from "@/utils/drizzle";
import { redis } from "@/utils/redis";
import {
	Catalogue,
	defaultCatalogueData,
	generateUniqueSlug,
	schema,
	Status,
} from "@quicktalog/common";
import { eq, inArray } from "drizzle-orm";

const catalogues = schema.catalogues;

export async function deleteItem(name: string): Promise<boolean> {
	try {
		await drizzleClient.delete(catalogues).where(eq(catalogues.name, name));
		await redis.del(name);
		await revalidateAfterCatalogueChange(name);
		return true;
	} catch (err) {
		console.error("Unexpected error while deleting service catalogue:", err);
		return false;
	}
}

export async function deleteMultipleItems(ids: string[]): Promise<boolean> {
	try {
		await drizzleClient.delete(catalogues).where(inArray(catalogues.id, ids));
		await revalidateAllCatalogues();
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

export async function createCatalogue(
	catalogueData: Catalogue,
	branding: boolean = false,
) {
	try {
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
				header: { ...rest.header, type: type },
				footer: { ...rest.footer, type: type },
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
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { createdAt, updatedAt, ...rest } = data;
		const catalogueData = { ...rest, status: "active" };

		await drizzleClient
			.update(catalogues)
			.set({
				// Update all fields that might have changed + status
				...rest,
				status: "active" as Status, // Ensure status type compatibility
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
		await revalidateData();
		return true;
	} catch (err) {
		console.error("Unexpected error while updating status in v2:", err);
		return false;
	}
}
