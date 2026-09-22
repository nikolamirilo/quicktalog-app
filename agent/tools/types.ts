import type { ImageCache } from "@/agent/images";
import type { CatalogueSession } from "@/agent/session";
import type { PageResult } from "@/agent/web";
import type { AgentToolResult } from "@/types/ai";

/**
 * Everything a tool needs that is per request rather than per process. Built
 * once in `buildContext` and shared, so e.g. a picture registered by `fetchUrl`
 * can be resolved by `addItems` without either knowing about the other.
 */
export interface ToolContext {
	session: CatalogueSession;
	/** Stock photo searches and page pictures, shared for the whole turn. */
	images: ImageCache;
	/** Pages already read this turn, so the same URL costs one credit. */
	pages: Map<string, PageResult>;
	/** Errors are returned, not thrown, so the model can correct itself. */
	fail: (error: string) => AgentToolResult;
}

/** What every group file exports: context in, a named set of tools out. */
export type ToolGroup = (context: ToolContext) => Record<string, unknown>;
