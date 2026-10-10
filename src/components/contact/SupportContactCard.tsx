"use client";

import { Mail } from "lucide-react";

import { ContactForm } from "@/components/contact/ContactForm";
import { ContactSent } from "@/components/contact/ContactSent";
import { AppCardTitle } from "@/components/dashboard/common/AppHeadings";
import { IconTile } from "@/components/general/IconTile";
import { useAuth } from "@/context/AuthContext";
import { useContactSubmit } from "@/hooks/useContactSubmit";

/**
 * Dashboard "Email Support" card: the contact form in its compact support
 * variant, prefilled with the signed-in user's name and email. Sends through
 * the same `sendContactEmail` action as the public contact page.
 */
export function SupportContactCard() {
	const { user } = useAuth();
	const { sent, submit, reset } = useContactSubmit();

	return (
		<section
			aria-labelledby="support-form-h"
			className="min-w-0 rounded-product-card border border-product-border bg-product-card p-5 shadow-product md:p-6"
		>
			<div className="mb-4 flex items-start gap-3">
				<IconTile size="sm">
					<Mail />
				</IconTile>
				<div>
					<AppCardTitle id="support-form-h">Email Support</AppCardTitle>
					<p className="text-sm text-product-foreground-accent">
						Send us a detailed message and we'll respond within 1 business day.
					</p>
				</div>
			</div>

			{sent ? (
				<ContactSent compact onReset={reset} sent={sent} />
			) : (
				<ContactForm
					defaultValues={{
						name: user?.name ?? "",
						email: user?.email ?? "",
					}}
					onSubmit={submit}
					variant="support"
				/>
			)}
		</section>
	);
}
