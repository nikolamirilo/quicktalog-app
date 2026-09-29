"use client";
import { Footer } from "@/components/navigation/Footer";
import { Navbar } from "@/components/navigation/Navbar";
import { StatusScreen } from "@/components/status/StatusScreen";
import { Button } from "@/components/ui/button";
import * as Sentry from "@sentry/nextjs";
import { House, RotateCw, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

const quickLinks = [
	{ text: "Dashboard", url: "/admin/dashboard" },
	{ text: "Help Center", url: "/help" },
	{ text: "Pricing", url: "/pricing" },
	{ text: "Try demo", url: "/demo" },
	{ text: "Contact support", url: "/contact" },
];

/**
 * The root error boundary sits outside the (site) layout, so it renders its
 * own navbar and footer.
 */
export default function ErrorPage({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		Sentry.captureException(error);
	}, [error]);

	return (
		<>
			<Navbar />
			<main id="main">
				<StatusScreen
					actions={
						<>
							<Button onClick={reset} type="button">
								<RotateCw aria-hidden="true" />
								Try again
							</Button>
							<Button asChild variant="outline">
								<Link href="/">
									<House aria-hidden="true" />
									Return home
								</Link>
							</Button>
						</>
					}
					description="Oh no! An unexpected error occurred. Our team is working to fix it. Let's get you back to creating amazing digital catalogs."
					digits={["5", "0"]}
					eyebrow="Error 500"
					icon={<TriangleAlert />}
					quickLinks={quickLinks}
					quickLinksLabel="Need help or looking for something else?"
					title="Something went wrong"
				/>
			</main>
			<Footer />
		</>
	);
}
