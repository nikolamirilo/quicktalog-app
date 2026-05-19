"use client";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { FiAlertTriangle, FiHome } from "react-icons/fi";

export default function CatalogueError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	const translatorResetCount = useRef(0);

	useEffect(() => {
		const message = error?.message ?? "";
		const stack = error?.stack ?? "";
		const isTranslatorReconciliation =
			error?.name === "NotFoundError" &&
			(message.includes("removeChild") || message.includes("insertBefore")) &&
			/react-dom/.test(stack);

		if (isTranslatorReconciliation && translatorResetCount.current < 1) {
			translatorResetCount.current += 1;
			reset();
			return;
		}

		if (isTranslatorReconciliation) {
			return;
		}

		Sentry.captureException(error);
	}, [error, reset]);

	return (
		<div className="min-h-screen flex items-center justify-center p-4 bg-product-background">
			<div className="max-w-md w-full text-center space-y-6">
				<div className="w-12 h-12 mx-auto rounded-full bg-product-primary/10 flex items-center justify-center">
					<FiAlertTriangle className="w-6 h-6 text-product-primary" />
				</div>
				<h1 className="text-2xl font-bold text-product-foreground">
					This catalogue couldn't load
				</h1>
				<p className="text-product-foreground-accent">
					Please try again — if the problem continues, head back home.
				</p>
				<div className="flex flex-col sm:flex-row gap-3 justify-center">
					<Button onClick={reset} variant="cta">
						Try Again
					</Button>
					<Button asChild variant="outline">
						<Link className="flex items-center gap-2" href="/">
							<FiHome className="w-4 h-4" />
							Home
						</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
