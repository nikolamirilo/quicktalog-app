import type { CatalogueSession } from "@/agent/core/session";
import { createImageCache } from "@/agent/plugins/images";
import type { PageResult } from "@/agent/plugins/web";
import type { ToolContext } from "@/agent/tools/types";

/** One per request: the tools close over it, so a singleton would leak catalogues. */
export function buildContext(session: CatalogueSession): ToolContext {
	return {
		session,
		images: createImageCache(),
		pages: new Map<string, PageResult>(),
		fail: (error) => ({ ok: false, error }),
	};
}
