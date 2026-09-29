"use server";
import { contactSchema } from "@/constants/schemas";
import { sendContactMessage } from "@/lib/email/transactional";
import { clientIp } from "@/lib/http/client-ip";
import { withinRateLimit } from "@/lib/rate-limit";

/**
 * Public contact form. Validated with the shared contact schema (the same one
 * the form uses for field errors; this parse is the authoritative one) and
 * rate-limited per IP; a Redis outage blocks the send rather than opening the
 * form to abuse.
 */
export async function sendContactEmail(contactData: unknown): Promise<boolean> {
	const parsed = contactSchema.safeParse(contactData);
	if (!parsed.success) return false;

	if (
		!(await withinRateLimit("contact", await clientIp(), { failOpen: false }))
	) {
		return false;
	}

	const { name, email, subject, message } = parsed.data;
	return sendContactMessage({ name, email, subject, message });
}
