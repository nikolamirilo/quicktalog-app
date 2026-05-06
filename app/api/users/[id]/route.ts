import * as Sentry from "@sentry/nextjs";
import { fetchUserData } from "@/lib/users/fetchUserData";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;

		const { userId: callerId } = await auth();
		let ownerProfile = null;
		if (callerId && callerId === id) {
			const profile = await currentUser();
			if (profile && profile.id === id) {
				ownerProfile = {
					id: profile.id,
					emailAddresses: profile.emailAddresses?.map((e) => ({
						emailAddress: e.emailAddress,
					})),
					firstName: profile.firstName,
					lastName: profile.lastName,
					imageUrl: profile.imageUrl,
					publicMetadata: profile.publicMetadata as Record<string, any>,
				};
			}
		}

		const result = await fetchUserData({ userId: id, ownerProfile });

		if (!result.ok) {
			if (result.code === "not_found") {
				return NextResponse.json({ error: "User not found" }, { status: 404 });
			}
			if (result.code === "no_plan") {
				return NextResponse.json(
					{ error: "Pricing plan not found" },
					{ status: 500 },
				);
			}
			return NextResponse.json(
				{ error: "Failed to fetch usage data", details: result.details },
				{ status: 500 },
			);
		}

		return NextResponse.json(result.data, { status: 200 });
	} catch (error) {
		Sentry.captureException(error);
		console.error(
			"Unexpected error in API route:",
			error instanceof Error ? error.message : error,
		);
		return NextResponse.json(
			{ error: "An unexpected error occurred" },
			{ status: 500 },
		);
	}
}
