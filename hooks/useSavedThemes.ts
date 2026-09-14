"use client";
import { deleteSavedTheme, listSavedThemes, saveTheme } from "@/actions/themes";
import type { CustomThemeColors, SavedTheme } from "@quicktalog/common";
import { useCallback, useEffect, useState } from "react";

export function useSavedThemes() {
	const [themes, setThemes] = useState<SavedTheme[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const refresh = useCallback(async () => {
		setIsLoading(true);
		const res = await listSavedThemes();
		if (res.success) setThemes(res.data ?? []);
		setIsLoading(false);
	}, []);

	useEffect(() => {
		refresh();
	}, [refresh]);

	const save = useCallback(
		async (name: string, colors: CustomThemeColors) => {
			const res = await saveTheme(name, colors);
			if (res.success) await refresh();
			return res;
		},
		[refresh],
	);

	const remove = useCallback(
		async (id: string) => {
			const res = await deleteSavedTheme(id);
			if (res.success) await refresh();
			return res;
		},
		[refresh],
	);

	return { themes, isLoading, save, remove, refresh };
}
