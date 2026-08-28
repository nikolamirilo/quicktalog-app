import OpenAI from "openai";

const openai = new OpenAI({
	baseURL: "https://api.deepseek.com",
	apiKey: process.env.DEEPSEEK_API_KEY,
});

const MODEL = "deepseek-chat";

interface GenerateOptions {
	temperature?: number;
}

/**
 * Plain-text completion. Returns the trimmed assistant message.
 * Use for single-string outputs (e.g. an item description).
 */
export async function generateText(
	system: string,
	user: string,
	options: GenerateOptions = {},
): Promise<string> {
	const completion = await openai.chat.completions.create({
		model: MODEL,
		messages: [
			{ role: "system", content: system },
			{ role: "user", content: user },
		],
		temperature: options.temperature ?? 0.7,
	});
	return completion.choices[0]?.message?.content?.trim() ?? "";
}

/**
 * JSON completion. Forces DeepSeek's JSON mode and parses the result.
 * The prompt must mention JSON for the model to comply, so callers should
 * describe the exact JSON shape they expect.
 */
export async function generateJSON<T = unknown>(
	system: string,
	user: string,
	options: GenerateOptions = {},
): Promise<T> {
	const completion = await openai.chat.completions.create({
		model: MODEL,
		messages: [
			{ role: "system", content: system },
			{ role: "user", content: user },
		],
		temperature: options.temperature ?? 0.4,
		response_format: { type: "json_object" },
	});
	const raw = completion.choices[0]?.message?.content ?? "{}";
	return JSON.parse(raw) as T;
}

/**
 * Raised when the model came back but its reply is unusable, so callers can
 * tell the user something more useful than "generation failed".
 */
export class DeepseekResponseError extends Error {
	constructor(readonly reason: "truncated" | "invalid_json") {
		super(`DeepSeek returned a ${reason} response`);
		this.name = "DeepseekResponseError";
	}
}

export interface DeepseekMessage {
	role: "system" | "user" | "assistant";
	content: string;
}

/**
 * Multi-turn JSON completion. Same JSON mode as `generateJSON`, but the caller
 * supplies the whole message list so prior turns stay in context.
 */
export async function generateChatJSON<T = unknown>(
	messages: DeepseekMessage[],
	options: GenerateOptions = {},
): Promise<T> {
	const completion = await openai.chat.completions.create({
		model: MODEL,
		messages,
		temperature: options.temperature ?? 0.3,
		response_format: { type: "json_object" },
	});

	const choice = completion.choices[0];
	// A long batch of edits can run past the output limit, which leaves the JSON
	// half-written. Report that instead of failing on the parse.
	if (choice?.finish_reason === "length") {
		throw new DeepseekResponseError("truncated");
	}

	try {
		return JSON.parse(choice?.message?.content ?? "{}") as T;
	} catch {
		throw new DeepseekResponseError("invalid_json");
	}
}
