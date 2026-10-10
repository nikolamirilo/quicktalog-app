import { notFound } from "next/navigation";
import { AuthLayout } from "@/components/auth/common/AuthLayout";
import { ConfirmContinue } from "@/components/auth/ConfirmContinue";
import { AUTH_PROVIDER } from "@/lib/auth/provider";

/**
 * The interstitial an auth email link lands on. It renders nothing that depends
 * on the token: the token sits in `__Host-qt-confirm` and is only read by the
 * action behind the button.
 */

// Nothing here may be prerendered or shared between visitors.
export const dynamic = "force-dynamic";

export default function ConfirmContinuePage() {
	if (AUTH_PROVIDER !== "supabase") notFound();

	return (
		<AuthLayout>
			<ConfirmContinue />
		</AuthLayout>
	);
}
