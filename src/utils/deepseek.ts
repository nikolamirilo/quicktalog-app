import OpenAI from "openai";

const openai = new OpenAI({
	baseURL: "https://api.deepseek.com",
	apiKey: process.env.DEEPSEEK_API_KEY,
});

// `deepseek-chat` was retired on 2026-07-24 and now errors rather than routing.
const MODEL = "deepseek-flash";

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
