"use client";

import { useCallback, useRef, useState } from "react";

export type ShowFeatureInfo = (type: string, opener: HTMLElement) => void;

/**
 * State for the plan-feature explainer dialog. `open` is a plain boolean and
 * the last feature is kept while the dialog animates closed, so its text
 * never blanks out; `openerRef` lets the dialog return focus to the "i" button.
 */
export function useFeatureInfo() {
	const [feature, setFeature] = useState<string | null>(null);
	const [open, setOpen] = useState(false);
	const openerRef = useRef<HTMLElement | null>(null);

	const showInfo = useCallback<ShowFeatureInfo>((type, opener) => {
		openerRef.current = opener;
		setFeature(type);
		setOpen(true);
	}, []);

	return { feature, open, onOpenChange: setOpen, showInfo, openerRef };
}

export type FeatureInfoState = ReturnType<typeof useFeatureInfo>;
