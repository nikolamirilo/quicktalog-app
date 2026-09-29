"use client";

import "./globals.css";
import { Button } from "@/components/ui/button";
import { interTight, plusJakartaSans } from "@/lib/fonts";
import * as Sentry from "@sentry/nextjs";
import { RotateCw } from "lucide-react";
import { useEffect } from "react";

/**
 * Last-resort fallback when the root layout itself fails. It replaces the root
 * layout, so it renders its own <html>/<body> (with the `product` class that
 * carries the design tokens) and uses no app providers: no navbar, no auth.
 */
export default function GlobalError({
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
		<html
			className={`${plusJakartaSans.variable} ${interTight.variable} antialiased`}
			lang="en"
		>
			<body className="product">
				<main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden px-5 py-16">
					<div
						aria-hidden="true"
						className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[620px] w-[720px] max-w-[140vw] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(var(--product-primary-rgb)/0.22),rgb(var(--product-primary-rgb)/0.06)_60%,transparent)]"
					/>
					<div className="w-full max-w-[460px] rounded-product-card border border-product-border bg-product-card px-6 py-9 text-center shadow-product-hover sm:px-10">
						<img
							alt="Quicktalog"
							className="mx-auto h-10 w-auto"
							height={40}
							src="/images/brand/logo.svg"
							width={110}
						/>
						<h1 className="mt-6 text-[clamp(26px,3.2vw,32px)] font-extrabold tracking-[-0.03em]">
							Something went wrong
						</h1>
						<p className="mt-3 text-product-foreground-accent">
							An unexpected error stopped the page from loading. Try again, or
							come back in a moment.
						</p>
						<div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
							<Button onClick={reset} type="button">
								<RotateCw aria-hidden="true" />
								Try again
							</Button>
							<Button asChild variant="outline">
								{/* A full reload: the app shell itself failed. */}
								<a href="/">Return home</a>
							</Button>
						</div>
					</div>
				</main>
			</body>
		</html>
	);
}
