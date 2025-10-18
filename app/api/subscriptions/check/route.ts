import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
	try {
		const supabase = await createClient();

		const { data: users, error: errorUsers } = await supabase
			.from("users")
			.select("id, plan_id")
			.neq("plan_id", "pri_01k27ajepm199twd1x77rpwdrq");

		if (errorUsers) throw errorUsers;

		const startDate = new Date();
		startDate.setDate(1);
		startDate.setHours(0, 0, 0, 0);

		const endDate = new Date();
		endDate.setHours(23, 59, 59, 999);
		const startTimestamptz = startDate.toISOString();
		const endTimestamptz = endDate.toISOString();

		const { data, error: errorAnalytics } = await supabase.rpc(
			"get_pageview_totals",
			{
				start_date: startTimestamptz,
				end_date: endTimestamptz,
			},
		);
		console.log(errorAnalytics);
		return NextResponse.json({ results: data }, { status: 200 });
	} catch (error) {
		return NextResponse.json(
			{
				error: "Error occurred while processing data.",
				details: error.message,
			},
			{ status: 500 },
		);
	}
}
