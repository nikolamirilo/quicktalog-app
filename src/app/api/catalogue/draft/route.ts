import type { Catalogue } from "@quicktalog/common";
import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { updateCatalogue } from "@/actions/catalogue";
import { getVerifiedIdentity } from "@/lib/auth/identity";
import { sameOrigin } from "@/lib/http/origin";

export const maxDuration = 60;

type DraftRequestBody = {
	catalogue?: unknown;
	baseUpdatedAt?: unknown;
};

/**
 * The builder's exit flush. Autosave is the main save path; this exists for the moment
 * the tab is hidden or closed, where a server action is not reliable and `sendBeacon` /
 * `keepalive` is. It runs the same save as the action, so the plan limits, the owner
 * check and the conflict check are all the same ones.
 */
export async function POST(request: Request) {
	if (!sameOrigin(request)) {
		return NextResponse.json({ error: "Bad origin." }, { status: 403 });
	}

	const me = await getVerifiedIdentity();
	if (!me) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	let body: DraftRequestBody;
	try {
		body = (await request.json()) as DraftRequestBody;
	} catch {
		return NextResponse.json({ error: "Invalid body" }, { status: 400 });
	}

	const catalogue = body.catalogue as Catalogue | undefined;
	if (!catalogue || typeof catalogue.name !== "string") {
		return NextResponse.json({ error: "Invalid body" }, { status: 400 });
	}
	const baseUpdatedAt =
		typeof body.baseUpdatedAt === "string" ? body.baseUpdatedAt : null;

	try {
		const result = await updateCatalogue(catalogue, baseUpdatedAt);
		return NextResponse.json(
			{
				success: result.success,
				error: result.error,
				conflict: result.conflict ?? false,
				draftUpdatedAt: result.draftUpdatedAt ?? null,
				unpublished: result.unpublished ?? false,
			},
			{ status: result.success ? 200 : result.conflict ? 409 : 400 },
		);
	} catch (error) {
		Sentry.captureException(error, { tags: { route: "catalogue/draft" } });
		console.error("Draft flush failed:", error);
		return NextResponse.json({ error: "Failed to save" }, { status: 500 });
	}
}
