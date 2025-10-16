import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
	try {
	} catch (error) {
		return NextResponse.json(
			{ error: "Error occurred while processing data.", details: error },
			{ status: 500 },
		);
	}
}
