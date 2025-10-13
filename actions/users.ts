"use server";
import { currentUser } from "@clerk/nextjs/server";

export async function subsribeToNewsletter(email: string) {
	try {
		const res = await fetch("/api/newsletter/subscribe", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ email }),
		});
		const data = await res.json();
		if (data.error) {
			console.error("Error subscribing to newsletter:", data.error);
			return false;
		} else {
			return true;
		}
	} catch (error: any) {
		console.error("Error subscribing to newsletter:", error);
		return false;
	}
}
export async function subscribeToPlan(email: string) {
	try {
		const res = await fetch("/api/subscribe", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ email }),
		});
		const data = await res.json();
		if (data.error) {
			console.error("Error subscribing to pricing plan:", data.error);
			return false;
		} else {
			return true;
		}
	} catch (error: any) {
		console.error("Error subscribing to newsletter:", error);
		return false;
	}
}

export async function getUserData(userId?: string) {
	try {
		const id = userId ?? (await currentUser())?.id;
		if (!id) throw new Error("User not authenticated");

		const res = await fetch(
			`${process.env.NEXT_PUBLIC_BASE_URL}/api/users/${id}`,
		);
		if (!res.ok) {
			throw new Error(
				`Failed to fetch user data: ${res.status} ${res.statusText}`,
			);
		}

		return await res.json();
	} catch (error) {
		console.error("Error in getUserData:", error);
		return null;
	}
}
