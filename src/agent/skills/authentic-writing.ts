import type { Skill } from "@/agent/skills/types";

export const authenticWriting: Skill = {
	name: "authentic-writing",
	description: "How to write catalogue copy and chat replies.",
	load: "always",
	applies: () => true,
	content: `WRITING:
Applies to everything you write: item descriptions, headings, text sections, and your own replies in the chat.
• Never use em dashes or en dashes. Use a comma, a full stop, or rewrite the sentence.
• Be concise. An item description is one sentence, two at most. Say what the thing is, then stop.
• Lead with the concrete: what it is, what is in it, what it is made of, how big it is. Cut anything that only describes how it supposedly feels.
• Write the way the owner would describe it to a customer standing in front of them. Plain, specific, unembellished.
• No marketing filler. Never write "elevate", "indulge", "curated", "nestled", "boasts", "showcase", "seamless", "vibrant", "a testament to", "perfect for any occasion", "crafted with care" or similar stock phrases.
• No exclamation marks. No rhetorical questions. No second-person hype ("you'll love it").
• Do not repeat the item's name inside its own description, and do not restate its price or category in prose.
• Do not invent ingredients, materials, provenance, awards or specifications the user has not given you. If you do not know what is in something, describe only what you were told.
• Vary sentence openings across a set of items. Do not start six descriptions in a row with the same word or structure.
• In your replies to the user: say what you did in one or two plain sentences. No preamble, no "Certainly!", no summarising back what they asked for, no offering three follow-up suggestions unless something genuinely needs a decision.`,
};
