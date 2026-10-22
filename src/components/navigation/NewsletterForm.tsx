"use client";
import { productNewsletterSignup } from "@/actions/newsletter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/ui/cn";
import { Check } from "lucide-react";
import type React from "react";
import { useEffect, useId, useRef, useState } from "react";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INVALID_EMAIL = "Please enter a valid email address.";

/** How long the "Subscribed" confirmation shows before the form resets. */
const SUCCESS_RESET_MS = 3000;

export const NewsletterForm = () => {
	const inputId = useId();
	const noteId = useId();
	const [newsletterEmail, setNewsletterEmail] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState("");
	const [submitStatus, setSubmitStatus] = useState<"idle" | "success">("idle");
	const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(
		() => () => {
			if (resetTimer.current) clearTimeout(resetTimer.current);
		},
		[],
	);

	const handleNewsletterSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!EMAIL_PATTERN.test(newsletterEmail.trim())) {
			setSubmitError(INVALID_EMAIL);
			return;
		}

		setIsSubmitting(true);
		setSubmitError("");
		setSubmitStatus("idle");

		try {
			const result = await productNewsletterSignup(newsletterEmail);

			if (result.status === "success") {
				setNewsletterEmail("");
				setSubmitStatus("success");
				if (resetTimer.current) clearTimeout(resetTimer.current);
				resetTimer.current = setTimeout(
					() => setSubmitStatus("idle"),
					SUCCESS_RESET_MS,
				);
			} else {
				setSubmitError("Failed to subscribe. Please try again.");
			}
		} catch (error: any) {
			const message =
				error?.message || "Failed to subscribe. Please try again.";
			setSubmitError(message);
		} finally {
			setIsSubmitting(false);
		}
	};

	const busy = isSubmitting || submitStatus !== "idle";

	return (
		<form noValidate onSubmit={handleNewsletterSubmit}>
			<label className="sr-only" htmlFor={inputId}>
				Email address
			</label>
			<input
				aria-describedby={noteId}
				aria-invalid={submitError ? true : undefined}
				autoComplete="email"
				className={cn(
					"mb-2.5 h-12 w-full rounded-full border border-product-border-strong bg-product-card px-[18px] text-[15.5px] text-product-foreground transition-[border-color,box-shadow] duration-200 placeholder:text-product-muted focus:border-product-primary focus:shadow-[0_0_0_4px_rgb(var(--product-primary-rgb)/0.25)] focus:outline-none disabled:opacity-60",
					submitError &&
						"border-product-error focus:border-product-error focus:shadow-[0_0_0_4px_rgb(var(--product-error-rgb)/0.12)]",
				)}
				disabled={busy}
				id={inputId}
				onChange={(e) => {
					setNewsletterEmail(e.target.value);
					if (submitError) setSubmitError("");
				}}
				placeholder="Enter your email"
				required
				type="email"
				value={newsletterEmail}
			/>
			<Button
				className={cn(
					"h-[46px] w-full",
					submitStatus === "success" &&
						"bg-product-success text-white hover:bg-product-success disabled:opacity-100",
				)}
				disabled={busy}
				type="submit"
			>
				{isSubmitting ? (
					"Subscribing..."
				) : submitStatus === "success" ? (
					<>
						<Check aria-hidden="true" />
						Subscribed
					</>
				) : (
					"Subscribe"
				)}
			</Button>

			<p
				aria-live="polite"
				className={cn(
					"mt-2 min-h-[1em] text-[12.5px]",
					submitError ? "text-product-error" : "text-product-foreground-accent",
				)}
				id={noteId}
			>
				{submitError ||
					(submitStatus === "success" ? "Thanks! You're subscribed." : "")}
			</p>
		</form>
	);
};
