import OpenAI from "openai";

const openai = new OpenAI({
	baseURL: "https://api.deepseek.com",
	apiKey: process.env.DEEPSEEK_API_KEY,
});

export async function chatCompletion(prompt: string) {
	const completion = await openai.chat.completions.create({
		messages: [{ role: "system", content: prompt }],
		model: "deepseek-chat",
	});
	return completion.choices[0].message.content;
}
