import * as Sentry from "@sentry/nextjs";
import { NextRequest } from "next/server";
import { getPaddleInstance } from "@/utils/paddle/get-paddle-instance";
import { ProcessWebhook } from "@/utils/paddle/process-webhook";

const webhookProcessor = new ProcessWebhook();

export async function POST(request: NextRequest) {
	const signature = request.headers.get("paddle-signature") || "";
	const rawRequestBody = await request.text();
	const privateKey = process.env.PADDLE_NOTIFICATION_WEBHOOK_SECRET || "";

	try {
		if (!signature || !rawRequestBody) {
			return Response.json(
				{ error: "Missing signature from header" },
				{ status: 400 },
			);
		}

		const paddle = getPaddleInstance();
		let eventData: Awaited<ReturnType<typeof paddle.webhooks.unmarshal>>;
		try {
			eventData = await paddle.webhooks.unmarshal(
				rawRequestBody,
				privateKey,
				signature,
			);
		} catch {
			// Signature verification failed — typically an internet probe hitting the
			// public URL, not a server fault, so don't alert Sentry. But log a
			// breadcrumb: a misconfigured/rotated PADDLE_NOTIFICATION_WEBHOOK_SECRET
			// would make *every* real webhook fail here and silently stop billing
			// sync, and this console.warn is the only signal we'd have.
			console.warn("Paddle webhook signature verification failed");
			return Response.json({ error: "Invalid signature" }, { status: 403 });
		}
		const eventName = eventData?.eventType ?? "Unknown event";

		if (eventData) {
			await webhookProcessor.processEvent(eventData);
		}
		return Response.json({ status: 200, eventName });
	} catch (e) {
		Sentry.captureException(e, {
			level: "fatal",
			tags: { route: "paddle-webhook" },
		});
		console.error("Paddle webhook processing failed:", e);
		return Response.json({ error: "Internal server error" }, { status: 500 });
	}
}
