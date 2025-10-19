import posthog from "posthog-js";

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
	api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
	defaults: "2025-05-24",
	autocapture: false,
	capture_pageleave: false,
	capture_pageview: true,
	rageclick: false,
	capture_dead_clicks: false,
	capture_performance: false,
	capture_exceptions: false,
	capture_heatmaps: false,
	disable_session_recording: true,
});
