"use server";
import { generateUniqueSlug } from "@quicktalog/common";
import { revalidateData } from "@/helpers/server";
import { Status } from "@/types/enums";
import { createClient } from "@/utils/supabase/server";

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
		// Fetch the original record
		const { data, error } = await supabase
			.from("catalogues")
			.select("*")
			.eq("id", id)
			.single();
		if (error || !data) return null;
		// Remove id and update name
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
