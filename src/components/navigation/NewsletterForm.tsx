"use client";
import { productNewsletterSignup } from "@/actions/newsletter";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import { FiCheck } from "react-icons/fi";

const NewsletterForm: React.FC = () => {
	const [newsletterEmail, setNewsletterEmail] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState("");
	const [submitStatus, setSubmitStatus] = useState<"idle" | "success">("idle");

	const handleNewsletterSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		setIsSubmitting(true);
		setSubmitError("");
		setSubmitStatus("idle");

		try {
			const result = await productNewsletterSignup(newsletterEmail);

			if (result.status === "success") {
				setNewsletterEmail("");
				setSubmitStatus("success");
				setTimeout(() => setSubmitStatus("idle"), 3000);
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

	return (
		<form className="space-y-3" onSubmit={handleNewsletterSubmit}>
			<div className="relative">
				<input
					className="w-full px-4 py-3 bg-product-background border border-product-border rounded-lg text-product-foreground placeholder-product-foreground-accent focus:outline-none focus:ring-2 focus:ring-product-primary/50 focus:border-product-primary transition-colors duration-200"
					disabled={isSubmitting || submitStatus !== "idle"}
					id="newsletter-email"
					onChange={(e) => setNewsletterEmail(e.target.value)}
					placeholder="Enter your email"
					required
					type="email"
					value={newsletterEmail}
				/>
			</div>
			<Button
				className={`w-full transition-colors duration-200 font-semibold ${
					submitStatus === "success"
						? "bg-green-500 text-white hover:bg-green-600"
						: "bg-product-primary text-product-foreground "
				}`}
				disabled={isSubmitting || submitStatus !== "idle"}
				type="submit"
			>
				{isSubmitting ? (
					"Subscribing..."
				) : submitStatus === "success" ? (
					<div className="flex items-center justify-center gap-2">
						<FiCheck className="w-4 h-4" />
						Subscribed
					</div>
				) : (
					"Subscribe"
				)}
			</Button>

			{submitError && (
				<p aria-live="polite" className="text-red-500 text-xs" role="alert">
					{submitError}
				</p>
			)}
		</form>
	);
};

export default NewsletterForm;
