"use server";
import { defaultCatalogueData } from "@/constants";
import { revalidateData } from "@/helpers/server";
import { Catalogue } from "@/types/catalogue";
import { redis } from "@/utils/redis";
import { createClient } from "@/utils/supabase/server";
import { generateUniqueSlug, Status } from "@quicktalog/common";

export async function deleteItem(id: string): Promise<boolean> {
	try {
		const supabase = await createClient();

		const { error } = await supabase.from("catalogues").delete().eq("id", id);

		if (error) {
			console.error("Failed to delete service catalogue:", error.message);
			return false;
		}
		await revalidateData();
		return true;
	} catch (err) {
		console.error("Unexpected error while deleting service catalogue:", err);
		return false;
	}
}

export async function deleteMultipleItems(ids: string[]): Promise<boolean> {
	try {
		const supabase = await createClient();

		const { error } = await supabase.from("catalogues").delete().in("id", ids);

		if (error) {
			console.error("Failed to delete catalogues:", error.message);
			return false;
		}

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
		const supabase = await createClient();

		const { error } = await supabase
			.from("catalogues")
			.update({ status })
			.eq("id", id);

		if (error) {
			console.error("Failed to update status:", error.message);
			return false;
		}
		await revalidateData();
		return true;
	} catch (err) {
		console.error("Unexpected error while updating status:", err);
		return false;
	}
}

export async function duplicateItem(id: string, name: string) {
	try {
		const supabase = await createClient();
		const { data, error } = await supabase
			.from("catalogues")
			.select("*")
			.eq("id", id)
			.single();
		if (error || !data) return null;
		const { id: _oldId, ...rest } = data;
		let suffix = "-copy";
		let tryName = generateUniqueSlug(name);
		let count = 1;
		while (true) {
			const { data: exists } = await supabase
				.from("catalogues")
				.select("id")
				.eq("name", tryName);
			if (!exists || exists.length === 0) break;
			tryName = `${name}${suffix}${count == 1 ? "" : count}`;
			count++;
		}
		const { data: newData, error: insertError } = await supabase
			.from("catalogues")
			.insert({ ...rest, name: tryName })
			.select()
			.single();
		if (insertError) return null;
		await revalidateData();
		return newData;
	} catch (err) {
		console.error("Unexpected error while duplicating service catalogue:", err);
		return null;
	}
}

export async function createCatalogue(catalogueData: Catalogue) {
	try {
		const supabase = await createClient();

		// Generate unique slug for the name
		const slug = generateUniqueSlug(catalogueData.name);

		// Check if name already exists
		const { data: existingCatalogue } = await supabase
			.from("catalogues")
			.select("id")
			.eq("name", slug)
			.single();

		if (existingCatalogue) {
			return {
				success: false,
				error: "A catalogue with this name already exists",
			};
		}

		const { data, error } = await supabase
			.from("catalogues")
			.insert({ ...catalogueData, name: slug })
			.select()
			.single();
		const res = await redis.set(slug, JSON.stringify(data));
		console.log(res);

		if (error) {
			console.error("Failed to create catalogue:", error.message);
			return {
				success: false,
				error: error.message,
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

		if (res != "OK") {
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
			const supabase = await createClient();
			const { data, error } = await supabase
				.from("catalogues")
				.select("*")
				.eq("name", name)
				.single();

			if (error || !data) {
				console.error("Failed to fetch catalogue:", error.message);
				return {
					success: false,
					error: error.message,
					data: defaultCatalogueData,
				};
			}
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
		const supabase = await createClient();
		const catalogueData = { ...data, status: "active" };
		const { error } = await supabase
			.from("catalogues")
			.update(catalogueData)
			.eq("name", catalogueData.name);
		const redisRes = await redis.set(
			catalogueData.name,
			JSON.stringify(catalogueData),
		);
		if (error || redisRes != "OK") {
			console.error("Failed to publish catalogue:", error?.message);
			return false;
		}
		await revalidateData();
		return true;
	} catch (err) {
		console.error("Unexpected error while updating status in v2:", err);
		return false;
	}
}
