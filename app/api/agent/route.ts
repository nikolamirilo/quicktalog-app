import { CatalogueSession, createCatalogueAgent } from "@/agent";
import { loadedSkillsFromMessages } from "@/agent/skills";
import { authorize, meter } from "@/lib/ai/access";
import type { Catalogue } from "@quicktalog/common";
import * as Sentry from "@sentry/nextjs";
import { createAgentUIStreamResponse } from "ai";

export const maxDuration = 60;

const ERROR_STATUS: Record<string, number> = {
	unauthorized: 401,
	not_found: 404,
	limit: 429,
	ai_error: 500,
};

interface AgentRequestBody {
	messages: unknown[];
	catalogueName: string;
	/** The live builder draft, so unsaved edits are part of the context. */
	catalogue: Catalogue;
}

export async function POST(request: Request) {
	let body: AgentRequestBody;
	try {
		body = await request.json();
	} catch {
		return Response.json({ error: "Malformed request." }, { status: 400 });
	}

	const { messages, catalogueName, catalogue } = body;
	if (!catalogueName || !catalogue) {
		return Response.json(
			{ error: "Catalogue is still loading. Try again." },
			{ status: 400 },
		);
	}

	const auth = await authorize(catalogueName);
	if (auth.ok === false) {
		return Response.json(
			{ error: auth.error, code: auth.code },
			{ status: ERROR_STATUS[auth.code] ?? 500 },
		);
	}

	const session = new CatalogueSession(
		catalogue,
		auth.limits,
		auth.sectionAccess,
		// A skill loaded on an earlier turn is still in the message history, so
		// the model can see it without being made to fetch it again.
		loadedSkillsFromMessages(messages),
	);

	return createAgentUIStreamResponse({
		agent: createCatalogueAgent(session),
		uiMessages: messages,
		abortSignal: request.signal,
		onError: (error) => {
			Sentry.captureException(error, { tags: { op: "catalogueAgent" } });
			console.error("Catalogue agent failed:", error);
			return "Something went wrong while making those changes. Try again.";
		},
		onFinish: async () => {
			// Charge the quota only when the turn actually changed something, so a
			// question - or a turn where every edit was rejected - stays free.
			if (session.applied.length === 0) return;
			try {
				await meter(auth.userId, catalogueName);
			} catch (error) {
				Sentry.captureException(error, { tags: { op: "catalogueAgentMeter" } });
			}
		},
	});
}
