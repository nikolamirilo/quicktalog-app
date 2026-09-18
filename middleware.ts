import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(
	async (auth, req) => {
		if (isProtectedRoute(req)) await auth.protect();
	},
	{
		// Send signed-out visitors to the app's own sign-in page, not Clerk's Account Portal.
		signInUrl: "/auth",
		signUpUrl: "/auth?mode=signup",
	},
);

export const config = {
	matcher: [
		// Pages and server actions. Skips Next internals, static files, the Sentry
		// tunnel, the PostHog proxy and server-to-server webhooks (no user session).
		"/((?!_next|monitoring|ingest|api/paddle|api/clerk|api/revalidate|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		"/(trpc)(.*)",
	],
};
