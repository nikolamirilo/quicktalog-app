"use server";
import { clientIp } from "@/lib/http/client-ip";
import { sendContactMessage } from "@/lib/email/transactional";
import { withinRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const contactSchema = z.object({
	name: z.string().trim().min(1).max(100),
	email: z.string().trim().toLowerCase().email().max(254),
	subject: z.string().trim().min(1).max(150),
	message: z.string().trim().min(1).max(5000),
});

/**
 * Public contact form. Validated and rate-limited per IP; a Redis outage blocks
 * the send rather than opening the form to abuse.
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
