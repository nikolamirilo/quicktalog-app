"use client";

import { useCallback, useState } from "react";
import ConsentModal from "@/components/modals/ConsentModal";

const STORAGE_KEY = "consent";

function hasConsented(): boolean {
	try {
		return localStorage.getItem(STORAGE_KEY) === "true";
	} catch {
		// Private mode, or storage blocked: ask again rather than assume consent.
		return false;
	}
}

function remember() {
	try {
		localStorage.setItem(STORAGE_KEY, "true");
	} catch {
		// Not being able to remember is not a reason to block the sign-up.
	}
}

/**
 * Gates sign-up behind the terms modal. `request()` runs `onGranted`
 * immediately if consent was already given, otherwise opens the modal and
 * runs it on accept. `localStorage` is only touched inside a handler, never
 * during render, so the server and first client render agree.
 */
export default function useSignupConsent(onGranted: () => void) {
	const [isOpen, setIsOpen] = useState(false);

	const request = useCallback(() => {
		if (hasConsented()) {
			onGranted();
			return;
		}
		setIsOpen(true);
	}, [onGranted]);

	const modal = (
		<ConsentModal
			isOpen={isOpen}
			onCancel={() => setIsOpen(false)}
			onConfirm={() => {
				remember();
				setIsOpen(false);
				onGranted();
			}}
		/>
	);

	return { modal, request };
}
