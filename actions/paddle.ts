import { PaddleCustomerResponse } from "@/types/api";

export async function cancelSubscription(subscription_id: string) {
	try {
		const response = await fetch(
			`https://api.paddle.com/subscriptions/${subscription_id}/cancel`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
				},
				body: JSON.stringify({
					effective_from: "immediately",
				}),
			},
		);

		const data: PaddleCustomerResponse = await response.json();

		if (!response.ok || data.error) {
			return {
				error: "Failed to create customer",
				details: data.error?.detail || "Unknown error",
			};
		}

		return {
			success: true,
			customer: data.data,
		};
	} catch (error) {
		return {
			error: "Server error",
			details: error instanceof Error ? error.message : "Unknown error",
		};
	}
}
