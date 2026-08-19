export interface AiActionResult<T> {
	success: boolean;
	data?: T;
	error?: string;
	code?: "unauthorized" | "not_found" | "limit" | "ai_error";
}

export interface GeneratedItem {
	name: string;
	description: string;
	price: number;
	isFree: boolean;
}
