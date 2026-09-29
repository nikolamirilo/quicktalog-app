"use client";

import { useState } from "react";

import { sendContactEmail } from "@/actions/email";
import type { ContactValues } from "@/constants/schemas";

export type SentMessage = { firstName: string; subject: string; email: string };

/**
 * Sends a contact / support message through `sendContactEmail` (validated and
 * rate-limited on the server) and remembers what was sent for the thank-you
 * panel. `submit` resolves to false on failure and never throws.
 */
export function useContactSubmit() {
	const [sent, setSent] = useState<SentMessage | null>(null);

	const submit = async (values: ContactValues) => {
		try {
			const ok = await sendContactEmail({
				name: values.name,
				email: values.email,
				subject: `Contact Form: ${values.subject}`,
				message: values.message,
			});
			if (ok !== true) return false;
			setSent({
				firstName: values.name.trim().split(/\s+/)[0],
				subject: values.subject,
				email: values.email.trim(),
			});
			return true;
		} catch (err) {
			console.error("Contact message failed to send:", err);
			return false;
		}
	};

	return { sent, submit, reset: () => setSent(null) };
}
