"use client";
import { type ChangeEvent, useCallback, useEffect, useState } from "react";

import { checkCatalogueName } from "@/actions/catalogue";
import {
	catalogueNameFormatError,
	NAME_CHECK_DELAY_MS,
	NAME_TAKEN_ERROR,
} from "@/hooks/useCatalogueName";

type Options = {
	/** Controlled value; leave out to let the hook hold the name itself. */
	value?: string;
	onValueChange?: (value: string) => void;
	/** Ask the server only while this is true (e.g. while the dialog is open). */
	enabled?: boolean;
};

/**
 * The server's answer for one exact trimmed name. `unknown` means the check
 * itself failed (rate limit, network): no hint is shown and the server
 * decides on submit.
 */
type Checked = { name: string; taken: boolean; unknown?: boolean };

export type CatalogueNameField = {
	value: string;
	onChange: (event: ChangeEvent<HTMLInputElement>) => void;
	/** Format error, or the "already in use" error for the current name. */
	error: string | undefined;
	/** True until the server has answered for the name as it is now. */
	checking: boolean;
	/** The user has typed in the field since the last reset. */
	touched: boolean;
	/** True only when the server confirmed the current name is free. */
	available: boolean;
	/** Ask the server again, e.g. after a create failed on a taken name. */
	revalidate: () => void;
	reset: () => void;
};

/**
 * State of a new-catalogue name field: format rule, debounced availability
 * check, and whether the answer on screen belongs to the current name. The
 * server decides again on submit; this is only the live hint.
 */
export function useCatalogueNameField({
	value: controlledValue,
	onValueChange,
	enabled = true,
}: Options = {}): CatalogueNameField {
	const [ownValue, setOwnValue] = useState("");
	const value = controlledValue ?? ownValue;
	const [touched, setTouched] = useState(false);
	const [checked, setChecked] = useState<Checked | null>(null);
	const [attempt, setAttempt] = useState(0);

	const trimmed = value.trim();
	const formatError = catalogueNameFormatError(value);
	const canCheck = enabled && trimmed.length > 0 && !formatError;

	useEffect(() => {
		if (!canCheck) return;
		let cancelled = false;
		const timer = setTimeout(async () => {
			try {
				const result = await checkCatalogueName(trimmed);
				if (cancelled) return;
				setChecked(
					"error" in result
						? { name: trimmed, taken: false, unknown: true }
						: { name: trimmed, taken: !result.available },
				);
			} catch (error) {
				console.error("Failed to check catalogue name:", error);
				if (!cancelled)
					setChecked({ name: trimmed, taken: false, unknown: true });
			}
		}, NAME_CHECK_DELAY_MS);
		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
		// `attempt` re-runs the check for the same name on `revalidate`.
	}, [canCheck, trimmed, attempt]);

	// Derived, not stored: an answer for an older name never shows as current.
	const answered = checked?.name === trimmed ? checked : null;
	const checking = canCheck && answered === null;
	const error =
		formatError ?? (canCheck && answered?.taken ? NAME_TAKEN_ERROR : undefined);

	const onChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => {
			const next = event.target.value;
			if (onValueChange) onValueChange(next);
			else setOwnValue(next);
			setTouched(true);
		},
		[onValueChange],
	);

	const revalidate = useCallback(() => {
		setChecked(null);
		setAttempt((n) => n + 1);
	}, []);

	const reset = useCallback(() => {
		setOwnValue("");
		setTouched(false);
		setChecked(null);
	}, []);

	return {
		value,
		onChange,
		error,
		checking,
		touched,
		available: Boolean(
			canCheck && answered && !answered.taken && !answered.unknown,
		),
		revalidate,
		reset,
	};
}
