"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Extend Window interface for HubSpot
declare global {
	interface Window {
		HubSpotConversations?: {
			widget: {
				open: () => void;
				close: () => void;
				remove: () => void;
				load: () => void;
			};
			on: (event: string, callback: (payload: any) => void) => void;
			off: (event: string, callback: (payload: any) => void) => void;
		};
		hsConversationsOnReady?: Array<() => void>;
		hsConversationsSettings?: {
			loadImmediately?: boolean;
			enableWidgetCookieBanner?: boolean;
			disableAttachment?: boolean;
		};
	}
}

interface HubspotChatReturn {
	hasLoaded: boolean;
	activeConversation: string | null;
	openHandler: () => void;
	closeHandler: () => void;
}

export const useHubspotChat = (portalId: string): HubspotChatReturn => {
	const [hasLoaded, setHasLoaded] = useState(false);
	const [activeConversation, setActiveConversation] = useState<string | null>(null);
	const eventRef = useRef<((payload: any) => void) | null>(null);
	const scriptLoadedRef = useRef(false);

	useEffect(() => {
		if (!portalId) return;

		// Check if script already exists (loaded from layout or elsewhere)
		const existingScript = document.getElementById("hs-script-loader");
		
		if (existingScript) {
			console.log("HubSpot script already exists in DOM");
			
			// If HubSpot is already ready, set loaded immediately
			if (window.HubSpotConversations) {
				console.log("HubSpot already initialized");
				setHasLoaded(true);
				return;
			}

			// Otherwise, wait for it to initialize
			if (!window.hsConversationsOnReady) {
				window.hsConversationsOnReady = [];
			}

			window.hsConversationsOnReady.push(() => {
				console.log("HubSpot chat ready (existing script)");
				setHasLoaded(true);
			});

			// Also poll for HubSpot availability as a fallback
			const pollInterval = setInterval(() => {
				if (window.HubSpotConversations) {
					console.log("HubSpot detected via polling");
					setHasLoaded(true);
					clearInterval(pollInterval);
				}
			}, 500);

			// Clear polling after 10 seconds
			const timeout = setTimeout(() => {
				clearInterval(pollInterval);
				if (!window.HubSpotConversations) {
					console.warn("HubSpot failed to load after 10 seconds");
				}
			}, 10000);

			return () => {
				clearInterval(pollInterval);
				clearTimeout(timeout);
				if (window.hsConversationsOnReady) {
					window.hsConversationsOnReady = [];
				}
			};
		}

		// If no existing script, create one (fallback)
		if (scriptLoadedRef.current) {
			return;
		}

		scriptLoadedRef.current = true;
		console.log("Creating new HubSpot script");

		// Initialize the ready callback array
		if (!window.hsConversationsOnReady) {
			window.hsConversationsOnReady = [];
		}

		// Add ready callback
		window.hsConversationsOnReady.push(() => {
			console.log("HubSpot chat ready (new script)");
			setHasLoaded(true);
		});

		// Create and load script
		const script = document.createElement("script");
		script.src = `https://js-eu1.hs-scripts.com/${portalId}.js`;
		script.async = true;
		script.defer = true;
		script.id = "hs-script-loader";

		script.onload = () => {
			console.log("HubSpot script loaded");
		};

		script.onerror = () => {
			console.error("Failed to load HubSpot script");
			scriptLoadedRef.current = false;
		};

		document.body.appendChild(script);

		return () => {
			// Don't remove the script on unmount, just clear the ready callbacks
			if (window.hsConversationsOnReady) {
				window.hsConversationsOnReady = [];
			}
		};
	}, [portalId]);

	// Listen to conversation events
	useEffect(() => {
		if (!hasLoaded || !window.HubSpotConversations) return;

		const handleConversationStarted = (payload: any) => {
			console.log("Conversation started:", payload);
			setActiveConversation(payload?.conversation?.conversationId || null);
		};

		eventRef.current = handleConversationStarted;

		try {
			window.HubSpotConversations.on("conversationStarted", handleConversationStarted);
		} catch (e) {
			console.error("Error setting up HubSpot event listener:", e);
		}

		return () => {
			if (eventRef.current && window.HubSpotConversations) {
				try {
					window.HubSpotConversations.off("conversationStarted", eventRef.current);
				} catch (e) {
					console.error("Error removing HubSpot event listener:", e);
				}
			}
		};
	}, [hasLoaded]);

	const openHandler = useCallback(() => {
		console.log("Attempting to open chat...");
		if (window.HubSpotConversations?.widget) {
			try {
				window.HubSpotConversations.widget.open();
				console.log("Chat opened successfully");
			} catch (e) {
				console.error("Error opening chat:", e);
			}
		} else {
			console.warn("HubSpot widget not available yet");
		}
	}, []);

	const closeHandler = useCallback(() => {
		console.log("Attempting to close chat...");
		if (window.HubSpotConversations?.widget) {
			try {
				window.HubSpotConversations.widget.close();
				console.log("Chat closed successfully");
			} catch (e) {
				console.error("Error closing chat:", e);
			}
		} else {
			console.warn("HubSpot widget not available yet");
		}
	}, []);

	return {
		hasLoaded,
		activeConversation,
		openHandler,
		closeHandler,
	};
};
