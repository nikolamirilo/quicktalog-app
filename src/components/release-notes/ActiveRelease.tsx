"use client";

import { createContext, type ReactNode, useContext } from "react";

import { useScrollSpy } from "@/hooks/useScrollSpy";

const ActiveReleaseContext = createContext<string | undefined>(undefined);

/**
 * Watches the scroll once for the whole release-notes page, so the wide-screen
 * nav and the narrow-screen chips share one listener and always agree.
 */
export function ActiveReleaseProvider({
	slugs,
	children,
}: {
	slugs: string[];
	children: ReactNode;
}) {
	const active = useScrollSpy(slugs);
	return (
		<ActiveReleaseContext.Provider value={active}>
			{children}
		</ActiveReleaseContext.Provider>
	);
}

/** Slug of the release being read. Must be used under `ActiveReleaseProvider`. */
export function useActiveRelease() {
	return useContext(ActiveReleaseContext);
}
