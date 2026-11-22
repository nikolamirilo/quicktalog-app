"use client";
import { createContext, type ReactNode, useContext } from "react";
import type { AutosaveStatus } from "@/hooks/useAutosave";

/**
 * The builder's autosave, shared by everything that has to know about it: the status in
 * the rail and the phone bar, the Publish button's "Unpublished changes", the version
 * history and the actions that have to save before they run (Preview, Publish).
 *
 * It is one level above `Catalogue` so the hook runs once per builder, not once per
 * consumer: two copies would each hold their own base timestamp and fight over it.
 */
const BuilderStatusContext = createContext<AutosaveStatus | null>(null);

export function BuilderStatusProvider({
	value,
	children,
}: {
	value: AutosaveStatus;
	children: ReactNode;
}) {
	return (
		<BuilderStatusContext.Provider value={value}>
			{children}
		</BuilderStatusContext.Provider>
	);
}

/** The builder's autosave, or null outside the builder (view and demo render there too). */
export function useBuilderStatus() {
	return useContext(BuilderStatusContext);
}
