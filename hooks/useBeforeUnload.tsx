"use client";
import { useEffect, useRef, useState } from "react";
import InformModal from "@/components/modals/InformModal";
import { useRouter } from "next/navigation";

export const NavigationGuard = ({
	isDirty,
	setIsDirty,
}: {
	isDirty: boolean;
	setIsDirty: (dirty: boolean) => void;
}) => {
	const isClientRef = useRef(false);
	const currentUrlRef = useRef("");
	const isNavigatingRef = useRef(false);
	const pendingNavigationRef = useRef<(() => void) | null>(null);
	const router = useRouter();
	const [isModalOpen, setIsModalOpen] = useState(false);

	useEffect(() => {
		// Set client flag and initial URL
		isClientRef.current = true;
		currentUrlRef.current = window.location.href;

		if (!isDirty) return;

		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if (isDirty) {
				e.preventDefault();
				e.returnValue = "";
				return "";
			}
		};

		const handleClick = (e: MouseEvent) => {
			if (!isDirty) return;

			const link = (e.target as HTMLElement).closest("a");
			if (link && link.href) {
				const isInternalLink = link.hostname === window.location.hostname;
				const isSamePage = link.href === window.location.href;

				if (isInternalLink && !isSamePage) {
					// Prevent navigation immediately
					e.preventDefault();
					e.stopPropagation();

					// Store the navigation action
					pendingNavigationRef.current = () => {
						isNavigatingRef.current = true;
						window.location.href = link.href;
					};

					// Show modal
					setIsModalOpen(true);
				}
			}
		};

		const handlePopState = () => {
			if (isDirty && !isNavigatingRef.current) {
				// Prevent back/forward navigation by pushing current state again
				window.history.pushState(null, "", window.location.href);

				// Store the navigation action (go back)
				pendingNavigationRef.current = () => {
					isNavigatingRef.current = true;
					window.history.back();
				};

				// Show modal
				setIsModalOpen(true);
				return;
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

	const handleConfirm = () => {
		setIsModalOpen(false);
		setIsDirty(false);
		router.push("/admin/dashboard");
	};

	const handleCancel = () => {
		setIsModalOpen(false);
		pendingNavigationRef.current = null;
	};

	return (
		<InformModal
			isOpen={isModalOpen}
			message="You have unsaved changes. Are you sure you want to leave?"
			onCancel={handleCancel}
			onConfirm={handleConfirm}
			title="Unsaved Changes"
			confirmText="Leave"
			cancelText="Stay"
		/>
	);
};
