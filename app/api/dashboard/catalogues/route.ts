import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
	try {
		const supabase = await createClient();
		const { id } = await currentUser();

		if (!id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { data, error } = await supabase
			.from("catalogues")
			.select("*")
			.eq("created_by", id);

		if (error) {
			throw error;
		}

		return NextResponse.json(data || []);
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to fetch catalogues", details: error },
			{ status: 500 },
		);
	}
}
