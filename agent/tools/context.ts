import { createImageCache } from "@/agent/images";
import type { CatalogueSession } from "@/agent/session";
import type { ToolContext } from "@/agent/tools/types";
import type { PageResult } from "@/agent/web";

/** One per request: the tools close over it, so a singleton would leak catalogues. */
export function buildContext(session: CatalogueSession): ToolContext {
	return {
		session,
		images: createImageCache(),
		pages: new Map<string, PageResult>(),
		fail: (error) => ({ ok: false, error }),
	};
}
