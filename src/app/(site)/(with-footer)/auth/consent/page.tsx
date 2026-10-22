import { TriangleAlert } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { AuthCard, AuthHeader } from "@/components/auth/common/AuthCard";
import { AuthLayout } from "@/components/auth/common/AuthLayout";
import { ConsentForm } from "@/components/auth/ConsentForm";
import { TextLink } from "@/components/general/TextLink";
import { needsConsentGate } from "@/lib/auth/consent";
import { getVerifiedIdentity } from "@/lib/auth/identity";
import { AUTH_PROVIDER } from "@/lib/auth/provider";
import { safeNext } from "@/lib/auth/redirects";

/**
 * Where `/admin` sends a signed-in user who has not accepted the current legal
 * documents. It sits outside `/admin` so the gate in that layout cannot
 * redirect to itself.
 */

// Reads the session cookie.
export const dynamic = "force-dynamic";

// The default 10s is not enough: a server action POSTs back to this segment, and
// a cold `postgres` pool alone allows a 10s connect before any query runs.
export const maxDuration = 60;

/**
 * Shown when the check itself failed. It offers a way back instead of
 * redirecting: the gate decides again on that request, so a disagreement costs
 * the user a click rather than bouncing them in a loop.
 */
function CheckUnavailable({ next }: { next: string }) {
	return (
		<AuthCard>
			<AuthHeader
				badge={<TriangleAlert />}
				subtitle="We could not load the documents to accept. Nothing has been recorded, and nothing is lost."
				title="Something went wrong"
			/>
			<p className="mt-6 text-center text-[14.5px] text-product-foreground-accent">
				<TextLink href={next}>Try again</TextLink>
			</p>
		</AuthCard>
	);
}

export default async function ConsentPage({
	searchParams,
}: {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	if (AUTH_PROVIDER !== "supabase") notFound();

	// Not a protected path in middleware, so the page checks for itself.
	const me = await getVerifiedIdentity();
	if (!me) redirect("/auth?next=/auth/consent");

	// The same read the gate makes, as the same role, so the two cannot disagree
	// about what is on the row.
	const gate = await needsConsentGate(me);
	// Already accepted, or nothing to accept: the gate would not have sent them.
	if (gate.status === "satisfied") redirect("/admin/dashboard");

	const raw = (await searchParams).next;
	const next = safeNext(typeof raw === "string" ? raw : null);

	return (
		<AuthLayout>
			{gate.status === "needed" ? (
				<ConsentForm
					next={next}
					updated={gate.previous !== null}
					version={gate.version}
				/>
			) : (
				<CheckUnavailable next={next} />
			)}
		</AuthLayout>
	);
}
