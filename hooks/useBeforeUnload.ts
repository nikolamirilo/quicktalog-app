"use client";
import { useEffect, useRef } from "react";

export const NavigationGuard = ({ isDirty }) => {
	const isClientRef = useRef(false);
	const currentUrlRef = useRef("");
	const isNavigatingRef = useRef(false);

	useEffect(() => {
		// Set client flag and initial URL
		isClientRef.current = true;
		currentUrlRef.current = window.location.href;

		if (!isDirty) return;

		const handleBeforeUnload = (e) => {
			if (isDirty) {
				e.preventDefault();
				e.returnValue = "";
				return "";
			}
		};

		const handleClick = (e) => {
			if (!isDirty) return;

			const link = e.target.closest("a");
			if (link && link.href) {
				const isInternalLink = link.hostname === window.location.hostname;
				const isSamePage = link.href === window.location.href;

				if (isInternalLink && !isSamePage) {
					if (
						!window.confirm(
							"You have unsaved changes. Are you sure you want to leave?",
						)
					) {
						e.preventDefault();
						e.stopPropagation();
					}
				}
			}
		};

		const handlePopState = () => {
			if (isDirty && !isNavigatingRef.current) {
				if (
					!window.confirm(
						"You have unsaved changes. Are you sure you want to leave?",
					)
				) {
					window.history.pushState(null, "", window.location.href);
					return;
				}
			}
			isNavigatingRef.current = false;
		};

		// Track URL changes manually
		const originalPushState = window.history.pushState;
		const originalReplaceState = window.history.replaceState;

		const updateUrl = () => {
			currentUrlRef.current = window.location.href;
		};

		window.history.pushState = function (...args) {
			originalPushState.apply(this, args);
			updateUrl();
		};

		window.history.replaceState = function (...args) {
			originalReplaceState.apply(this, args);
			updateUrl();
		};

		// Initialize history state
		window.history.pushState(null, "", window.location.href);

		// Add event listeners
		window.addEventListener("beforeunload", handleBeforeUnload);
		document.addEventListener("click", handleClick, true);
		window.addEventListener("popstate", handlePopState);

		return () => {
			// Restore original methods
			window.history.pushState = originalPushState;
			window.history.replaceState = originalReplaceState;

			// Remove event listeners
			window.removeEventListener("beforeunload", handleBeforeUnload);
			document.removeEventListener("click", handleClick, true);
			window.removeEventListener("popstate", handlePopState);
		};
	}, [isDirty]);

	// Don't render anything on server or client
	return null;
};
