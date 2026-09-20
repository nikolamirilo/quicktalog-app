import type { AgentToolName } from "@/agent/tools";

/**
 * How a tool call is drawn in the chat while it runs.
 *
 * `hidden` is for the tools that have their own display elsewhere: the plan
 * tools are one checklist for the whole request, rendered by the panel, so a
 * bubble line per call would be a spinner followed by a tickless green row.
 */
export type ToolDisplay = { label: string } | { hidden: true };

/**
 * Client-safe on purpose. This file imports nothing from the tool files
 * themselves - doing so would pull `node:dns`, Firecrawl and the theme server
 * action into the browser bundle - and `AgentToolName` is a type-only import,
 * erased at compile time.
 *
 * Typed as a full `Record`, so adding a tool without deciding how it looks is
 * a compile error rather than a silent "Working…".
 */
export const TOOL_DISPLAY: Record<AgentToolName, ToolDisplay> = {
	createPlan: { hidden: true },
	completeTask: { hidden: true },
	skipTask: { hidden: true },
	loadSkill: { label: "Reading the rules" },
	fetchUrl: { label: "Reading the page" },
	readSection: { label: "Reading a section" },
	addSection: { label: "Adding a section" },
	updateSection: { label: "Updating a section" },
	deleteSection: { label: "Deleting a section" },
	moveSection: { label: "Moving a section" },
	addItems: { label: "Adding items" },
	updateItem: { label: "Updating an item" },
	deleteItem: { label: "Deleting an item" },
	moveItem: { label: "Moving an item" },
	updateAppearance: { label: "Updating the appearance" },
	setCustomTheme: { label: "Building a custom theme" },
	updateCatalogue: { label: "Updating catalogue settings" },
	updateHeader: { label: "Updating the header" },
	updateFooter: { label: "Updating the footer" },
	updateLegal: { label: "Updating the legal details" },
};

const displayFor = (name: string): ToolDisplay | undefined =>
	TOOL_DISPLAY[name as AgentToolName];

/** True for a tool whose progress the panel draws itself. */
export const isHiddenTool = (name: string): boolean => {
	const display = displayFor(name);
	return display !== undefined && "hidden" in display;
};

/** What to show while the call is in flight. */
export const runningLabel = (name: string): string => {
	const display = displayFor(name);
	return display && "label" in display ? display.label : "Working";
};
