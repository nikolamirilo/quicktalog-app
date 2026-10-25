import { SmartLink } from "@/components/general/SmartLink";
import type { CTAButton } from "@quicktalog/common";
import { FiCheck, FiExternalLink } from "react-icons/fi";

/** The "Stay updated" column: signup form, and the footer action as a link under it. */
const Newsletter = ({
	handleNewsletterSubmit,
	newsletterEmail,
	setNewsletterEmail,
	isSubmitting,
	submitSuccess,
	submitError,
	cta,
}: {
	handleNewsletterSubmit: (e: React.FormEvent) => void;
	newsletterEmail: string;
	setNewsletterEmail: (e: string) => void;
	isSubmitting: boolean;
	submitSuccess: boolean;
	submitError: string;
	cta?: CTAButton;
}) => (
	<div className="cat-foot-wide cat-foot-news">
		<h2>Stay updated</h2>
		<p>News and specials, straight to your inbox.</p>
		<form
			aria-label="Newsletter subscription"
			onSubmit={handleNewsletterSubmit}
		>
			<label className="sr-only" htmlFor="newsletter-email">
				Email address
			</label>
			<input
				aria-describedby="newsletter-note"
				aria-invalid={submitError ? "true" : "false"}
				autoComplete="email"
				disabled={isSubmitting || submitSuccess}
				id="newsletter-email"
				onChange={(e) => setNewsletterEmail(e.target.value)}
				placeholder="Enter your email"
				required
				type="email"
				value={newsletterEmail}
			/>
			<button
				data-done={submitSuccess ? "" : undefined}
				disabled={isSubmitting || submitSuccess}
				type="submit"
			>
				{submitSuccess ? (
					<>
						<FiCheck aria-hidden="true" />
						Subscribed
					</>
				) : isSubmitting ? (
					"Subscribing..."
				) : (
					"Subscribe"
				)}
			</button>
			<p aria-live="polite" className="cat-foot-note" id="newsletter-note">
				{submitError || (submitSuccess ? "Thanks! You're subscribed." : "")}
			</p>
		</form>
		{cta?.isEnabled && cta.url && (
			<SmartLink className="cat-foot-link-cta" href={cta.url}>
				<FiExternalLink aria-hidden="true" />
				{cta.label || "Learn more"}
			</SmartLink>
		)}
	</div>
);

export default Newsletter;
